# Transport Cost Calculation Parity Fix Plan

## 🎯 **Objective**
Eliminate transport cost duplication and ensure consistent calculation patterns between frontend and backend systems.

## 🚨 **Current Problems Identified**

### **1. Double Transport Cost Calculation**
- **Backend Engine**: Adds transport costs twice
  - Once in `calculateUnitCost()` (per-unit shipment cost)
  - Again in `calculateTransportationCost()` (full shipment cost)
- **Result**: `totalActionCost = totalPurchaseCost + transportationCost` = DOUBLE COUNTING

### **2. Frontend vs Backend Inconsistency**
- **Frontend**: Uses `calculateMaterialTotalCost()` pattern
- **Backend**: Uses `calculateUnitCost()` pattern
- **Problem**: Different calculation methods produce different results

### **3. UI Display Confusion**
- Shows transport as separate line item when already included in totals
- Misleading cost breakdowns for users

## 🔧 **Solution Strategy**

### **Phase 1: Standardize Cost Calculation Patterns**

#### **A. Define Clear Cost Categories**
```typescript
interface CostBreakdown {
  baseCost: number        // Pure material cost (price × quantity)
  transportCost: number   // Shipment/delivery fees
  totalCost: number      // baseCost + transportCost
}
```

#### **B. Create Unified Cost Calculator**
- **New file**: `lib/game/cost-calculator.ts`
- **Purpose**: Single source of truth for all cost calculations
- **Functions**:
  - `calculateBaseMaterialCost()`
  - `calculateTransportCost()`
  - `calculateTotalMaterialCost()`

### **Phase 2: Fix Backend Engine**

#### **A. Modify `calculateUnitCost()`**
- **Current**: Returns `basePrice + shipmentCostPerUnit`
- **New**: Return ONLY base price per unit
- **Rename**: `calculateBaseUnitPrice()`

#### **B. Fix Engine Cost Calculation**
```typescript
// BEFORE (double counting):
const unitCost = calculateUnitCost(quantity, material, supplier) // includes transport
const totalPurchaseCost = quantity * unitCost
const totalActionCost = totalPurchaseCost + calculateTransportationCost() // transport again!

// AFTER (single counting):
const baseUnitCost = calculateBaseUnitPrice(quantity, material, supplier) // base only
const basePurchaseCost = quantity * baseUnitCost
const transportCost = calculateTransportationCost(action, levelConfig)
const totalPurchaseCost = basePurchaseCost + transportCost
```

#### **C. Update Cost Categorization**
- `purchases`: Base material costs only
- `supplierTransport`: Transport costs for supplier deliveries
- `restaurantTransport`: Transport costs for customer deliveries
- Remove duplicate transport categories

### **Phase 3: Align Frontend Calculations**

#### **A. Update Hooks**
- Modify `use-game-calculations.ts` to use new unified calculator
- Ensure frontend matches backend patterns exactly

#### **B. Fix UI Components**
- Update `daily-order-summary.tsx` to show accurate cost breakdown
- Ensure transport costs are not double-displayed

#### **C. Sync Preview Calculations**
- Use same cost calculator for preview and engine
- Guarantee preview matches final processed result

### **Phase 4: Validation & Testing**

#### **A. Create Test Scenarios**
```typescript
// Test case: Order 50 patties from Supplier A
// Expected: Base cost = 50 × 2.0 = 100 kr
//          Transport = 25 kr (from shipmentPrices)
//          Total = 125 kr (not 150 kr from double counting)
```

#### **B. Add Comprehensive Logging**
- Log cost breakdowns at each calculation step
- Compare frontend preview vs backend result
- Verify no transport duplication

## 📋 **Implementation Checklist**

### **Files to Modify:**
- [ ] `lib/game/inventory-management.ts` - Fix calculateUnitCost
- [ ] `lib/game/engine.ts` - Fix cost calculation logic  
- [ ] `hooks/use-game-calculations.ts` - Align with backend
- [ ] `components/game/ui/daily-order-summary.tsx` - Fix UI display
- [ ] `components/game/game-interface.tsx` - Update preview calculations

### **New Files to Create:**
- [ ] `lib/game/cost-calculator.ts` - Unified cost calculation
- [ ] `tests/cost-calculation.test.ts` - Comprehensive tests

### **Testing Requirements:**
- [ ] Unit tests for cost calculator
- [ ] Integration tests for engine vs frontend parity
- [ ] Manual testing with various order combinations
- [ ] Validate UI displays correct cost breakdowns

## 🎯 **Success Criteria**

1. **No Transport Cost Duplication**: Transport costs calculated exactly once
2. **Frontend-Backend Parity**: Preview calculations match engine results
3. **Clear Cost Categories**: Separate display of base vs transport costs
4. **Accurate UI**: Cost breakdowns reflect actual charges
5. **Maintainable Code**: Single source of truth for all cost calculations

## 🚀 **Next Steps**

1. Create unified cost calculator module
2. Fix backend engine calculation logic
3. Update frontend to use same patterns
4. Add comprehensive testing
5. Validate with real game scenarios

---

**Branch**: `fix/transport-cost-calculation-parity`  
**Status**: Planning Phase  
**Target**: Complete cost calculation consistency
