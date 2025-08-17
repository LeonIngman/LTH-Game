/**
 * Test script to verify insufficient funds API response handling
 */

async function testInsufficientFunds() {
  const baseUrl = "http://localhost:3000";

  // Test insufficient funds scenario
  const testPayload = {
    userId: 1,
    levelId: 0,
    gameState: {
      day: 1,
      cash: 100, // Low cash amount
      inventory: { flour: 0, eggs: 0, milk: 0, meals: 0 },
      gameOver: false,
      history: [],
    },
    action: {
      supplierOrders: [
        { supplierId: 1, ingredientId: 1, quantity: 1000 }, // Expensive order
      ],
      production: 0,
      customerOrders: [],
    },
  };

  try {
    console.log("🧪 Testing insufficient funds API response...");
    console.log("Payload:", JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${baseUrl}/api/game/process-day`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`\n📊 Response status: ${response.status}`);
    console.log(`📊 Response status text: ${response.statusText}`);

    const responseData = await response.json();
    console.log("📊 Response data:", JSON.stringify(responseData, null, 2));

    // Verify the expected response structure
    if (response.status === 400 && responseData.code === "INSUFFICIENT_FUNDS") {
      console.log(
        "\n✅ SUCCESS: Insufficient funds response is properly formatted!"
      );
      console.log(`✅ Code: ${responseData.code}`);
      console.log(`✅ Message: ${responseData.message}`);
      console.log(`✅ Details: ${JSON.stringify(responseData.details)}`);

      // Check that no stack trace is included
      if (!responseData.stack && !responseData.trace) {
        console.log("✅ No stack trace in response - good!");
      } else {
        console.log("❌ WARNING: Stack trace found in response");
      }
    } else {
      console.log(
        "\n❌ UNEXPECTED: Response does not match expected insufficient funds format"
      );
      console.log(`Expected: status 400, code 'INSUFFICIENT_FUNDS'`);
      console.log(
        `Received: status ${response.status}, code '${responseData.code}'`
      );
    }
  } catch (error) {
    console.error(
      "\n❌ ERROR: Failed to test insufficient funds handling:",
      error.message
    );

    if (error.cause?.code === "ECONNREFUSED") {
      console.log(
        "💡 Make sure the development server is running on localhost:3000"
      );
    }
  }
}

// Run the test
testInsufficientFunds();
