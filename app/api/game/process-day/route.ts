import { NextResponse } from "next/server"
import { processDay, isGameOver, calculateGameResult, validateAffordability } from "@/lib/game/engine"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"
import { sql } from "@/lib/db"
import { shouldUseDemoMode } from "@/lib/v0-detection"

export async function POST(request: Request) {
  try {
    const { userId, levelId, gameState, action } = await request.json()

    if (!userId || levelId === undefined || !gameState || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log("Received action:", JSON.stringify(action))

    // Validate gameState has required properties
    if (!gameState.inventory || typeof gameState.inventory !== "object") {
      return NextResponse.json({ error: "Invalid game state: missing or invalid inventory" }, { status: 400 })
    }

    // Ensure inventory has all required properties
    const requiredInventoryProps = ["patty", "cheese", "bun", "potato", "finishedGoods"]
    for (const prop of requiredInventoryProps) {
      if (typeof gameState.inventory[prop] !== "number") {
        gameState.inventory[prop] = 0 // Set default value instead of failing
        console.warn(`Missing inventory property ${prop}, setting to 0`)
      }
    }

    // Ensure action has delivery option ID
    if (action.deliveryOptionId === undefined) {
      action.deliveryOptionId = gameState.selectedDeliveryOption || 2
    }

    // Get the appropriate level configuration
    let levelConfig
    switch (levelId) {
      case 0:
        levelConfig = level0Config
        break
      case 1:
        levelConfig = level1Config
        break
      case 2:
        levelConfig = level2Config
        break
      case 3:
        levelConfig = level3Config
        break
      default:
        return NextResponse.json({ error: "Invalid level ID" }, { status: 400 })
    }

    // Ensure levelConfig has required properties
    if (!levelConfig.materialBasePrices) {
      levelConfig.materialBasePrices = {
        patty: 10,
        cheese: 5,
        bun: 3,
        potato: 2,
      }
      console.warn("Missing materialBasePrices in levelConfig, using defaults")
    }

    if (!levelConfig.holdingCosts) {
      levelConfig.holdingCosts = {
        patty: 1,
        bun: 0.5,
        cheese: 0.8,
        potato: 0.3,
      }
      console.warn("Missing holdingCosts in levelConfig, using defaults")
    }

    if (levelConfig.productionCostPerUnit === undefined) {
      levelConfig.productionCostPerUnit = 4
      console.warn("Missing productionCostPerUnit in levelConfig, using default: 4")
    }

    // Validate affordability before processing
    const affordabilityCheck = validateAffordability(gameState, action, levelConfig)
    if (!affordabilityCheck.valid) {
      // Check if this is a zero-cash player who's only trying to sell
      const isOnlySales =
        action.supplierOrders.every(
          (order) =>
            order.pattyPurchase === 0 &&
            order.cheesePurchase === 0 &&
            order.bunPurchase === 0 &&
            order.potatoPurchase === 0,
        ) &&
        action.production === 0 &&
        (action.salesAttempt > 0 || (action.customerOrders && action.customerOrders.length > 0))

      if (isOnlySales && gameState.cash === 0) {
        // Allow the player to proceed with just sales
        console.log("Player with zero cash is attempting sales only - allowing action")
      } else {
        return NextResponse.json(
          {
            error: affordabilityCheck.message || "Insufficient funds for the requested actions",
            totalCost: affordabilityCheck.totalCost,
            holdingCost: affordabilityCheck.holdingCost,
            availableCash: gameState.cash,
          },
          { status: 400 },
        )
      }
    }

    // Process the day
    try {
      const newState = processDay(gameState, action, levelConfig)

      // Verify that cash is not negative after processing
      // Allow exactly 0 cash
      if (newState.cash < 0) {
        // Round to handle floating point precision issues
        if (Math.abs(newState.cash) < 0.001) {
          // It's essentially zero due to floating point precision, set it to exactly 0
          newState.cash = 0
        } else {
          return NextResponse.json(
            {
              error: "Processing resulted in negative cash balance. This should not happen.",
              gameState: gameState, // Return original state
            },
            { status: 400 },
          )
        }
      }

      // Check if game is over
      const gameOver = isGameOver(newState, levelConfig)

      // If in demo mode, just return the new state without saving to database
      if (shouldUseDemoMode()) {
        return NextResponse.json({
          success: true,
          gameState: newState,
          gameOver,
        })
      }

      // If game is over, save the final result
      if (gameOver) {
        const gameResult = calculateGameResult(newState, levelConfig, userId)

        // Save game result to database
        await sql`
          INSERT INTO "Performance" (
            "userId", "levelId", "score", "cumulativeProfit", 
            "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock",
            "decisions"
          )
          VALUES (
            ${userId}, ${levelId}, ${gameResult.score}, ${gameResult.cumulativeProfit},
            ${gameResult.finalCash}, ${gameResult.finalInventory.patty}, 
            ${gameResult.finalInventory.cheese}, ${gameResult.finalInventory.finishedGoods},
            ${JSON.stringify(gameResult.history)}
          )
        `
      }

      return NextResponse.json({
        success: true,
        gameState: newState,
        gameOver,
      })
    } catch (processingError) {
      console.error("Error during day processing:", processingError)
      return NextResponse.json(
        {
          error: processingError.message || "Failed to process game day",
          stack: processingError.stack, // Include stack trace for debugging
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error processing game day:", error)
    return NextResponse.json(
      {
        error: "Failed to process game day",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
