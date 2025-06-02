import { NextResponse } from "next/server"
import { processDay, isGameOver, calculateGameResult, validateAffordability } from "@/lib/game/engine"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"
import { sql } from "@/lib/db"

// Helper to ensure a value is a number (not undefined, null, or NaN)
const safeNumber = (val: any) => (typeof val === "number" && !isNaN(val) ? val : 0)

// Helper to normalize all numeric fields in game state (for API response)
function normalizeGameState(state: any) {
  return {
    ...state,
    cash: safeNumber(state.cash),
    inventory: {
      patty: safeNumber(state.inventory?.patty),
      cheese: safeNumber(state.inventory?.cheese),
      bun: safeNumber(state.inventory?.bun),
      potato: safeNumber(state.inventory?.potato),
      finishedGoods: safeNumber(state.inventory?.finishedGoods),
    },
    // Add more fields if needed
  }
}

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
          (order: any) =>
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

      // If game is over, save the final result
      if (gameOver) {
        const gameResult = calculateGameResult(newState, levelConfig, userId)

        await sql`
          INSERT INTO "Performance" (
            "userId", "levelId", "score", "cumulativeProfit", 
            "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock",
            "decisions"
          )
          VALUES (
            ${userId},
            ${levelId},
            ${safeNumber(gameResult.score)},
            ${safeNumber(gameResult.cumulativeProfit)},
            ${safeNumber(gameResult.finalCash)},
            ${safeNumber(gameResult.finalInventory?.patty)},
            ${safeNumber(gameResult.finalInventory?.cheese)},
            ${safeNumber(gameResult.finalInventory?.finishedGoods)},
            ${JSON.stringify(gameResult.history)}
          )
        `
      }


      console.log("overstockPenalties", newState.overstockPenalties, "currentDay", newState.day)

      return NextResponse.json({
        success: true,
        gameState: normalizeGameState(newState),
        gameOver,
      })
    } catch (processingError) {
      console.error("Error during day processing:", processingError)
      const err = processingError as Error
      return NextResponse.json(
        {
          error: err.message || "Failed to process game day",
          stack: (err as any).stack,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error processing game day:", error)
    const err = error as Error
    return NextResponse.json(
      {
        error: "Failed to process game day",
        details: err.message,
        stack: (err as any).stack,
      },
      { status: 500 },
    )
  }
}
