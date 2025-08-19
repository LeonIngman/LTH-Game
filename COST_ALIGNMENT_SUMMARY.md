# Cost Calculation Alignment Summary

## Task Completed ✅

Updated the Total Cost card logic to match backend-calculated costs by adding supplier transport/delivery costs to the calculation.

## Backend Cost Categories (from `validateAffordability` in engine.ts)

1. **purchaseCost** - Pure material purchase costs (without transport)
2. **supplierTransportCost** - Transport costs for supplier deliveries
3. **productionCost** - Production costs
4. **holdingCost** - Inventory holding costs
5. **overstockCost** - Overstock penalties
6. **restaurantDeliveryCost** - Transportation cost for restaurant deliveries
7. **otherSurcharges** - Currently 0

**Total Cost = purchaseCost + supplierTransportCost + productionCost + holdingCost + overstockCost + restaurantDeliveryCost + otherSurcharges**

## Frontend Changes Made

### 1. Updated cost-summary.tsx calculation logic:

**Before:**

```tsx
const totalCost =
  purchaseCost +
  transportationCost +
  productionCost +
  holdingCost +
  overstockCost;
```

**After:**

```tsx
// Calculate supplier transport cost (difference between total purchase cost and base material costs)
const totalPurchaseCostWithTransport = calculateTotalPurchaseCost();
const supplierTransportCost = totalPurchaseCostWithTransport - purchaseCost;

// Calculate restaurant transportation cost separately
const restaurantTransportationCost = calculateTransportationCost();

// Calculate total cost as sum of all components (matching backend calculation)
const totalCost =
  purchaseCost +
  supplierTransportCost +
  productionCost +
  holdingCost +
  overstockCost +
  restaurantTransportationCost;
```

### 2. Updated UI to show both transport cost types:

**Before:** 5 columns (Purchase, Transportation, Production, Holding, Overstock)

**After:** 6 columns (Purchase, Supplier Transport, Production, Holding, Overstock, Restaurant Transport)

This matches the backend's 7 categories (6 shown + otherSurcharges which is always 0).

## Cost Calculation Functions Used

- `calculateMaterialPurchaseCost()` → **purchaseCost** (pure material costs)
- `calculateTotalPurchaseCost()` → **total purchase with transport**
- `supplierTransportCost` = `totalPurchaseCostWithTransport - purchaseCost`
- `calculateProductionCost()` → **productionCost**
- `calculateHoldingCost()` → **holdingCost**
- `calculateOverstockCost()` → **overstockCost**
- `calculateTransportationCost()` → **restaurantDeliveryCost**
- `otherSurcharges` = 0 (not shown in UI)

## Debug Flag Implementation

Added `DEBUG_COST_RECONCILIATION=true` in `.env` to enable detailed cost breakdown in API responses when insufficient funds errors occur. This allows debugging and verification that frontend calculations match backend.

## Verification

The frontend Total Cost now matches the backend's totalCost calculation exactly, including correct rounding to 2 decimal places and kr formatting. Both calculations use the same cost components and formulas.

## Files Modified

1. `/components/game/ui/cost-summary.tsx` - Updated cost calculation logic and UI
2. `/.env` - Added DEBUG_COST_RECONCILIATION flag
3. `/tests/unit/cost-calculation-alignment.test.tsx` - Added test for verification

The Total Cost card now displays the exact same total cost as the backend's `validateAffordability` function calculates.
