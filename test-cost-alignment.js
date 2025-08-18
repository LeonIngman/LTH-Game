/**
 * Script to test cost calculation alignment between frontend and backend
 */

const { validateAffordability } = require("./lib/game/engine");
const {
  calculateTransportationCost,
} = require("./lib/game/inventory-management");
const { level0Config } = require("./lib/game/level0");

const mockGameState = {
  day: 1,
  cash: 10000,
  inventory: {
    patty: 10,
    cheese: 10,
    bun: 10,
    potato: 10,
    finishedGoods: 5,
  },
  inventoryValue: {
    patty: 150,
    cheese: 120,
    bun: 80,
    potato: 60,
    finishedGoods: 200,
  },
  pendingSupplierOrders: [],
  pendingCustomerOrders: [],
  customerDeliveries: {},
  supplierDeliveries: {},
  cumulativeProfit: 0,
  score: 0,
  history: [],
  gameOver: false,
  latenessPenalties: [],
  forecastData: null,
};

const mockAction = {
  supplierOrders: [
    {
      supplierId: 1,
      pattyPurchase: 20,
      cheesePurchase: 15,
      bunPurchase: 25,
      potatoPurchase: 30,
    },
  ],
  production: 10,
  customerOrders: [],
};

console.log("Testing cost calculation alignment...");

// Get backend calculation
const backendResult = validateAffordability(
  mockGameState,
  mockAction,
  level0Config
);

console.log("Backend result:", {
  valid: backendResult.valid,
  totalCost: backendResult.totalCost,
  costBreakdown: backendResult.costBreakdown,
});

if (backendResult.costBreakdown) {
  // Calculate frontend total cost using the new logic
  const frontendTotalCost =
    backendResult.costBreakdown.purchaseCost +
    backendResult.costBreakdown.supplierTransportCost +
    backendResult.costBreakdown.productionCost +
    backendResult.costBreakdown.holdingCost +
    backendResult.costBreakdown.overstockCost +
    backendResult.costBreakdown.restaurantDeliveryCost +
    backendResult.costBreakdown.otherSurcharges;

  console.log("Frontend calculation:");
  console.log(
    `Purchase Cost: ${backendResult.costBreakdown.purchaseCost.toFixed(2)} kr`
  );
  console.log(
    `Supplier Transport: ${backendResult.costBreakdown.supplierTransportCost.toFixed(
      2
    )} kr`
  );
  console.log(
    `Production Cost: ${backendResult.costBreakdown.productionCost.toFixed(
      2
    )} kr`
  );
  console.log(
    `Holding Cost: ${backendResult.costBreakdown.holdingCost.toFixed(2)} kr`
  );
  console.log(
    `Overstock Cost: ${backendResult.costBreakdown.overstockCost.toFixed(2)} kr`
  );
  console.log(
    `Restaurant Transport: ${backendResult.costBreakdown.restaurantDeliveryCost.toFixed(
      2
    )} kr`
  );
  console.log(
    `Other Surcharges: ${backendResult.costBreakdown.otherSurcharges.toFixed(
      2
    )} kr`
  );
  console.log(`Frontend Total: ${frontendTotalCost.toFixed(2)} kr`);
  console.log(`Backend Total: ${backendResult.totalCost.toFixed(2)} kr`);
  console.log(
    `Match: ${
      frontendTotalCost.toFixed(2) === backendResult.totalCost.toFixed(2)
    }`
  );
}
