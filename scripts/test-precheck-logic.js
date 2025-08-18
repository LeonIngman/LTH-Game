/**
 * Test script to verify pre-check insufficient funds logic
 * This simulates the checkSufficientFunds function behavior
 */

function simulateCheckSufficientFunds(gameState, action, levelConfig) {
  // Simulate the calculateTotalCost function logic
  function calculateTotalCost() {
    // Material purchase costs
    let purchaseCost = 0;
    if (action.supplierOrders) {
      for (const order of action.supplierOrders) {
        purchaseCost += (order.pattyPurchase || 0) * 3.5; // Example price
        purchaseCost += (order.cheesePurchase || 0) * 2.8;
        purchaseCost += (order.bunPurchase || 0) * 1.2;
        purchaseCost += (order.potatoPurchase || 0) * 1.5;
      }
    }

    // Production costs
    const productionCost = action.production * 2.0; // Example production cost per unit

    // Transportation costs (simplified)
    const transportationCost = purchaseCost > 0 ? 50 : 0;

    // Holding costs (simplified)
    const holdingCost =
      Object.values(gameState.inventory || {}).reduce(
        (sum, qty) => sum + qty,
        0
      ) * 0.1;

    return purchaseCost + productionCost + transportationCost + holdingCost;
  }

  const totalCost = calculateTotalCost();
  const availableCash = gameState.cash;

  if (totalCost > availableCash) {
    const shortfall = (totalCost - availableCash).toFixed(2);
    return {
      sufficient: false,
      message: `Insufficient funds. Total cost ${totalCost.toFixed(
        2
      )} kr, available ${availableCash.toFixed(
        2
      )} kr. You need ${shortfall} kr more.`,
    };
  }

  return { sufficient: true };
}

// Test scenarios
const testScenarios = [
  {
    name: "Scenario 1: Insufficient Funds - Low Cash, Expensive Orders",
    gameState: {
      cash: 100,
      inventory: { patty: 0, cheese: 0, bun: 0, potato: 0 },
    },
    action: {
      supplierOrders: [
        {
          supplierId: 1,
          pattyPurchase: 100,
          cheesePurchase: 80,
          bunPurchase: 120,
          potatoPurchase: 150,
        },
      ],
      production: 50,
      customerOrders: [],
    },
    expectedSufficient: false,
  },
  {
    name: "Scenario 2: Sufficient Funds - High Cash, Moderate Orders",
    gameState: {
      cash: 2000,
      inventory: { patty: 10, cheese: 8, bun: 15, potato: 12 },
    },
    action: {
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
    },
    expectedSufficient: true,
  },
  {
    name: "Scenario 3: Edge Case - Exact Amount",
    gameState: {
      cash: 500,
      inventory: { patty: 5, cheese: 5, bun: 5, potato: 5 },
    },
    action: {
      supplierOrders: [
        {
          supplierId: 1,
          pattyPurchase: 50,
          cheesePurchase: 40,
          bunPurchase: 60,
          potatoPurchase: 70,
        },
      ],
      production: 15,
      customerOrders: [],
    },
    expectedSufficient: false, // This should be close to the limit
  },
  {
    name: "Scenario 4: No Orders - Only Sales",
    gameState: {
      cash: 50,
      inventory: { patty: 20, cheese: 20, bun: 20, potato: 20 },
    },
    action: {
      supplierOrders: [],
      production: 0,
      customerOrders: [{ customerId: 1, quantity: 10 }],
    },
    expectedSufficient: true, // Should be sufficient for sales only
  },
];

console.log("🧪 Testing Pre-Check Insufficient Funds Logic\n");

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log("   Input:");
  console.log(`   - Cash: ${scenario.gameState.cash} kr`);
  console.log(`   - Orders: ${JSON.stringify(scenario.action.supplierOrders)}`);
  console.log(`   - Production: ${scenario.action.production}`);

  const result = simulateCheckSufficientFunds(
    scenario.gameState,
    scenario.action,
    {}
  );

  console.log("\n   Result:");
  console.log(`   - Sufficient: ${result.sufficient}`);
  if (result.message) {
    console.log(`   - Message: ${result.message}`);
  }

  const testPassed = result.sufficient === scenario.expectedSufficient;
  console.log(`   - Test: ${testPassed ? "✅ PASS" : "❌ FAIL"}`);

  if (!testPassed) {
    console.log(
      `   - Expected: ${scenario.expectedSufficient}, Got: ${result.sufficient}`
    );
  }
});

console.log("\n🎯 Test completed!");
console.log("\n💡 To test in the actual app:");
console.log("1. Start Level 0 with default cash");
console.log("2. Add expensive supplier orders (total > available cash)");
console.log("3. Watch for red warning box and disabled Next Day button");
console.log("4. Reduce orders or increase cash to see auto re-enabling");
