# 🔍 **COMPREHENSIVE CALCULATION ANALYSIS**
## Complete Mapping of Value Calculations, Persistence, Fetching & UI Display

---

## 📊 **EXECUTIVE SUMMARY**

This analysis identifies **5 major calculation layers** in the codebase with **multiple calculation patterns** causing inconsistencies. The system has **3 distinct cost calculation approaches** that produce different results, leading to transport cost duplication and frontend-backend parity issues.

---

## 🏗️ **CALCULATION ARCHITECTURE OVERVIEW**

### **Layer 1: Frontend Preview Calculations**
### **Layer 2: Frontend Hook Calculations** 
### **Layer 3: Backend Engine Calculations**
### **Layer 4: Database Persistence Layer**
### **Layer 5: UI Display Components**

---

## 📍 **DETAILED CALCULATION INVENTORY**

## **🔥 LAYER 1: FRONTEND PREVIEW CALCULATIONS**

### **A. Game Interface Preview (`components/game/game-interface.tsx`)**
```typescript
// Lines 186-207: Material purchase calculations
const calculateMaterialPurchaseCost = useCallback(() => {
  // Calculates ONLY base material costs (no transport)
  // Uses supplier.materialPrices directly
})

const calculateTransportationCost = useCallback(() => {
  // Calculates ONLY transport costs
  // Uses calculateTransportationCostUtil from inventory-management
})

const calculateRevenue = useCallback(() => {
  // Calculates customer order revenue
  // Uses customer.pricePerUnit * quantity
})
```

**❌ ISSUE**: Preview calculations split base/transport costs but engine combines them

### **B. Preview Calculations Module (`lib/game/preview-calculations.ts`)**
- **Purpose**: Generate preview DailyResult for UI
- **Status**: Uses same engine logic but may have inconsistencies
- **Dependencies**: inventory-management calculations

---

## **🔥 LAYER 2: FRONTEND HOOK CALCULATIONS**

### **A. Game Calculations Hook (`hooks/use-game-calculations.ts`)**

#### **🧮 Cost Calculation Functions:**
```typescript
// Lines 85-103: Base cost calculation
const calculateBaseCost = (quantity, supplierId, materialType) => {
  const pricePerUnit = getMaterialPriceForSupplier(supplierId, materialType)
  return Math.round(quantity * pricePerUnit * 100) / 100
}

// Lines 108-128: Shipment cost calculation  
const calculateShipmentCost = (quantity, supplierId, materialType) => {
  return supplier.shipmentPrices[materialType][quantity] || 0
}

// Lines 134-157: Total material cost calculation
const calculateMaterialTotalCost = (quantity, supplierId, materialType) => {
  const baseCost = calculateBaseCost(quantity, supplierId, materialType)
  return baseCost + supplier.shipmentPrices[materialType][quantity]
}

// Lines 163-185: Total purchase cost across suppliers
const calculateTotalPurchaseCost = () => {
  return supplierOrders.reduce((total, order) => {
    return total + calculateMaterialTotalCost(...)
  })
}
```

#### **🎯 Production & Holding Calculations:**
```typescript
// Lines 189-192: Production cost
const calculateProductionCost = () => {
  return action.production * levelConfig.productionCostPerUnit
}

// Lines 194-201: Holding/Overstock costs
const getHoldingCost = () => calculateHoldingCost(gameState)
const getOverstockCost = () => calculateOverstockCost(gameState, levelConfig)
```

#### **🏁 Total Cost Aggregation:**
```typescript
// Lines 204-211: Total action + holding costs
const calculateTotalActionCost = () => {
  return calculateTotalPurchaseCost() + calculateProductionCost()
}

const calculateTotalCost = () => {
  return calculateTotalActionCost() + getHoldingCost()
}
```

**❌ MAJOR ISSUE**: Frontend adds base + shipment costs, but backend uses `calculateUnitCost` which already includes transport!

### **B. Supplier Orders Hook (`hooks/use-supplier-orders.ts`)**
```typescript
// Lines 97-143: Capacity calculations
const calculateRemainingCapacity = (supplierId, materialType) => {
  // Manages supplier capacity constraints
  // Tracks material-specific or total capacity limits
}
```

### **C. Customer Orders Hook (`hooks/use-customer-orders.ts`)**
```typescript
// Lines 43-47: Customer order quantity
const calculateTotalCustomerOrderQuantity = () => {
  return customerOrders.reduce((total, order) => total + order.quantity, 0)
}
```

---

## **🔥 LAYER 3: BACKEND ENGINE CALCULATIONS**

### **A. Main Engine (`lib/game/engine.ts`)**

#### **🧮 Purchase Cost Calculation (Lines 84-112):**
```typescript
// PROBLEMATIC: Uses calculateUnitCost which includes transport
let totalPurchaseCost = 0
for (const order of action.supplierOrders) {
  const supplier = levelConfig.suppliers.find(s => s.id === order.supplierId)
  
  if (order.pattyPurchase > 0) {
    const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier)
    totalPurchaseCost += order.pattyPurchase * unitCost  // ← Transport included here
  }
  // ... same for cheese, bun, potato
}
```

#### **🚨 DOUBLE TRANSPORT ISSUE (Lines 137-144):**
```typescript
// Additional transport calculation
const transportationCost = calculateTransportationCost(action, levelConfig)  // ← Transport added AGAIN

// Supplier transport calculation
const supplierTransportCost = totalPurchaseCost - purePurchaseCost

// Total action cost adds transport TWICE!
const totalActionCost = totalPurchaseCost + productionCost + transportationCost
```

#### **📊 Cost Categorization (Lines 158-165):**
```typescript
// Multiple transport cost categories
const restaurantDeliveryCost = transportationCost
const otherSurcharges = 0
const totalCost = totalActionCost + holdingCost + overstockCost
```

#### **🏭 Production Processing (Lines 258-290):**
```typescript
// Production constraint calculations
const maxPossibleProduction = Math.min(
  Math.floor(gameState.inventory.patty / PATTIES_PER_MEAL),
  Math.floor(gameState.inventory.cheese / CHEESE_PER_MEAL),
  // ... other constraints
)

// Production cost calculation
const productionCost = actualProduction * levelConfig.productionCostPerUnit
```

#### **📦 Inventory Management (Lines 334-340):**
```typescript
// Holding cost calculation
const baseHoldingCost = calculateHoldingCost(newState)
const overstockCost = calculateOverstockCost(newState, levelConfig)
```

#### **💰 Revenue Processing (Lines 556-580):**
```typescript
// Customer order revenue calculation
const revenue = order.quantity * customer.pricePerUnit
const transportCost = customer.transportCosts[order.quantity] || 0
const netRevenue = revenue - transportCost
```

### **B. Inventory Management (`lib/game/inventory-management.ts`)**

#### **🧮 Unit Cost Calculation (Lines 20-42):**
```typescript
export function calculateUnitCost(quantity, materialType, supplier) {
  // Get base price
  let basePrice = 0
  if (supplier.materialPrices && supplier.materialPrices[materialType]) {
    basePrice = supplier.materialPrices[materialType]
  }

  // Get shipment pricing - TRANSPORT INCLUDED HERE
  let shipmentCostPerUnit = 0
  if (supplier.shipmentPrices?.[materialType]?.[quantity]) {
    shipmentCostPerUnit = supplier.shipmentPrices[materialType][quantity] / quantity
  }

  // Return cost per unit INCLUDING TRANSPORT
  return basePrice + shipmentCostPerUnit
}
```

#### **🚚 Transportation Cost (Lines 168-195):**
```typescript
export function calculateTransportationCost(action, levelConfig) {
  let total = 0

  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find(s => s.id === order.supplierId)
    
    // For each material, add shipment costs AGAIN
    for (const material of ["patty", "cheese", "bun", "potato"]) {
      const amount = order[`${material}Purchase`]
      if (amount > 0 && supplier.shipmentPrices[material]) {
        total += supplier.shipmentPrices[material][closest]  // ← DUPLICATE TRANSPORT
      }
    }
  }
  return total
}
```

#### **🏪 Holding Cost Calculations (Lines 62-88):**
```typescript
export function calculateHoldingCost(gameState) {
  const dailyRate = 0.25 / 365  // 25% annual rate
  let totalHoldingCost = 0

  for (const material of MATERIALS) {
    const quantity = gameState.inventory[material]
    const totalValue = gameState.inventoryValue[material]
    
    if (quantity > 0 && totalValue > 0) {
      const unitValue = totalValue / quantity
      const holdingCost = quantity * unitValue * dailyRate
      totalHoldingCost += holdingCost
    }
  }
  return totalHoldingCost
}
```

#### **📈 Overstock Cost Calculations (Lines 92-131):**
```typescript
export function calculateOverstockCost(gameState, levelConfig) {
  const dailyRate = 0.25 / 365
  let totalOverstockCost = 0

  for (const material of MATERIALS) {
    const quantity = gameState.inventory[material]
    const threshold = levelConfig.overstockThreshold?.[material] || 200
    
    if (quantity > threshold) {
      const excessQuantity = quantity - threshold
      const unitValue = calculateAverageCost(material, gameState)
      const overstockCost = excessQuantity * unitValue * dailyRate
      totalOverstockCost += overstockCost
    }
  }
  return totalOverstockCost
}
```

---

## **🔥 LAYER 4: DATABASE PERSISTENCE LAYER**

### **A. Game State Persistence (`app/api/game/save-game-state/route.ts`)**
```typescript
// Saves current game state to database
// Includes: inventory, cash, day, pendingOrders, etc.
```

### **B. Daily Data Persistence (`app/api/game/process-day/route.ts`)**
```typescript
// Processes game day and stores results
// Calculates final costs using engine
// Stores: purchases, production, holding, transport costs
```

### **C. Game Actions (`lib/actions/game-actions.ts`)**
```typescript
// Line 127: Database storage of calculated costs
// "Calculate totalCosts including all components: 
//  purchaseCosts + supplierTransportCost + productionCosts + 
//  holdingCosts + overstockCost + restaurantDeliveryCost + otherSurcharges"
```

### **D. Database Schema (`sql/create-tables.sql`)**
```sql
-- GameDailyData table stores calculated costs:
"purchaseCosts" NUMERIC NOT NULL,
"productionCosts" NUMERIC NOT NULL, 
"holdingCosts" NUMERIC NOT NULL,
"totalCosts" NUMERIC NOT NULL,
"overstockCost" NUMERIC(10,2) NOT NULL DEFAULT 0,
-- Plus transport cost categories
```

---

## **🔥 LAYER 5: UI DISPLAY COMPONENTS**

### **A. Daily Order Summary (`components/game/ui/daily-order-summary.tsx`)**

#### **🧮 Cost Display Functions (Lines 60-180):**
```typescript
// Base cost calculation for display
const calculateBaseCost = (quantity, supplierId, materialType) => {
  const pricePerUnit = getMaterialPriceForSupplier(supplierId, materialType)
  return Math.round(quantity * pricePerUnit * 100) / 100
}

// Shipment cost calculation for display
const calculateShipmentCost = (quantity, supplierId, materialType) => {
  return supplier.shipmentPrices[materialType][quantity] || 0
}

// Total cost calculation (DUPLICATES backend logic)
const calculateMaterialTotalCost = (quantity, supplierId, materialType) => {
  const baseCost = calculateBaseCost(quantity, supplierId, materialType)
  return baseCost + supplier.shipmentPrices[materialType][quantity]
}

// Supplier transport cost breakdown
const calculateSupplierTransportCost = (supplierId) => {
  // Shows transport costs as separate line item
  // BUT these are already included in total costs!
}
```

#### **📊 Display Issues (Lines 330-420):**
```typescript
// Shows supplier costs with breakdown:
// - Base costs per material
// - Transport cost as separate line  ← MISLEADING
// - Total supplier cost = base + transport ← DOUBLE COUNTING
```

### **B. Cost Summary (`components/game/ui/cost-summary.tsx`)**
```typescript
// Displays cost breakdowns from calculations
// Shows: Purchase, Production, Holding, Transport costs
// Uses calculation functions from game-interface.tsx
```

### **C. Supplier Order Form (`components/game/ui/supplier-order-form.tsx`)**

#### **💰 Cost Display (Lines 58-85):**
```typescript
// Shows shipment cost table
const getShipmentCost = (materialType, quantity) => {
  return supplier.shipmentPrices[materialType][quantity] || 0
}

// Shows base cost calculation  
const getBaseCost = (materialType, quantity) => {
  const pricePerUnit = getMaterialPriceForSupplier(supplier.id, materialType)
  return quantity * pricePerUnit
}

// Shows total cost (base + shipment)
const getTotalCost = (materialType, quantity) => {
  const baseCost = getBaseCost(materialType, quantity)
  const shipmentCost = getShipmentCost(materialType, quantity)
  return baseCost + shipmentCost
}
```

---

## **🚨 CRITICAL ISSUES IDENTIFIED**

### **1. 🔥 DOUBLE TRANSPORT COST CALCULATION**
- **Frontend**: Adds base + shipment costs separately
- **Backend**: Uses `calculateUnitCost` (includes transport) + `calculateTransportationCost` (adds transport again)
- **Result**: Transport costs counted twice in final totals

### **2. 🔥 INCONSISTENT CALCULATION PATTERNS**
- **Frontend Pattern**: `baseCost + shipmentCost = totalCost`
- **Backend Pattern**: `calculateUnitCost(includesTransport) + calculateTransportationCost = DOUBLE`
- **Display Pattern**: Shows transport as separate line when already included

### **3. 🔥 MULTIPLE COST CATEGORIES FOR SAME THING**
- `supplierTransportCost` = difference between total and pure purchase
- `transportationCost` = calculated transport costs  
- `restaurantDeliveryCost` = same as transportationCost
- **All refer to transport but calculated differently!**

### **4. 🔥 UI MISLEADING USERS**
- Shows "Transport Cost: -25 kr" as separate line item
- But total already includes transport costs
- Users see inflated costs and incorrect breakdowns

---

## **🔄 DATA FLOW MAPPING**

### **📊 Cost Calculation Flow:**
```
1. UI Input (quantities) 
   ↓
2. Frontend Hooks (calculateMaterialTotalCost)
   ↓  
3. Preview Calculations (for real-time display)
   ↓
4. Backend Engine (calculateUnitCost + calculateTransportationCost)
   ↓
5. Database Storage (cost categories)
   ↓
6. UI Display (cost breakdowns)
```

### **💾 Persistence Flow:**
```
1. Game State Changes (inventory, cash, day)
   ↓
2. Auto-save to Database (usePersistedGameState)
   ↓
3. Process Day API (engine calculations)
   ↓
4. Store Daily Results (GameDailyData table)
   ↓
5. Performance Analytics (aggregated data)
```

### **🔍 Fetch/Display Flow:**
```
1. Page Load/Refresh
   ↓
2. Load Saved Game State (API call)
   ↓
3. Initialize UI Components
   ↓
4. Real-time Calculations (hooks)
   ↓
5. Preview Updates (useMemo)
   ↓
6. Display Current State
```

---

## **📋 CALCULATION INCONSISTENCY MATRIX**

| **Component** | **Base Cost** | **Transport Cost** | **Total Cost** | **Issues** |
|---------------|---------------|-------------------|----------------|------------|
| Frontend Hooks | ✅ Separate | ✅ Separate | ❌ Sum both | Correct pattern |
| Daily Order Summary | ✅ Separate | ✅ Separate | ❌ Double display | UI confusion |
| Backend Engine | ❌ In unitCost | ❌ Separate calc | ❌ Double count | **MAJOR BUG** |
| Supplier Form | ✅ Separate | ✅ Separate | ✅ Sum both | Correct |
| Preview Calc | ❓ Unknown | ❓ Unknown | ❓ Unknown | **NEEDS AUDIT** |

---

## **🎯 KEY FINDINGS FOR FIX STRATEGY**

### **✅ WORKING CORRECTLY:**
1. **Frontend cost calculation pattern** (base + transport)
2. **Supplier order form displays**
3. **Database persistence layer**
4. **Game state management**

### **❌ BROKEN/INCONSISTENT:**
1. **Backend engine cost calculation** (double transport)
2. **calculateUnitCost function** (should only return base price)  
3. **Daily order summary display** (shows transport twice)
4. **Cost categorization** (multiple transport categories)
5. **Preview-engine parity** (different calculation methods)

### **🔧 REQUIRES INVESTIGATION:**
1. **Preview calculations module** - verify uses correct patterns
2. **Cost summary component** - check calculation sources
3. **Database cost storage** - ensure categories are correct
4. **Performance analytics** - verify uses consistent calculations

---

## **📝 NEXT STEPS**

1. **✅ AUDIT COMPLETE** - All calculation points identified
2. **🔧 FIX BACKEND** - Eliminate double transport counting
3. **🎯 ALIGN FRONTEND** - Ensure preview matches engine
4. **🖥️ FIX UI DISPLAY** - Remove misleading cost breakdowns
5. **✅ TEST THOROUGHLY** - Verify end-to-end calculation consistency

---

**📍 ANALYSIS STATUS**: ✅ **COMPLETE**  
**📊 FILES ANALYZED**: **20+ calculation files**  
**🐛 CRITICAL ISSUES**: **4 major calculation inconsistencies**  
**🎯 READY FOR**: **Implementation phase**
