"use server"

import { sql, pgPool } from "@/lib/db"
import type { GameState, DailyResult } from "@/types/game";


export async function checkExistingPerformance(userId: string, levelId: number) {
  try {
    // Check if there's an existing performance record for this user and level
    const result = await sql`
      SELECT 
        score,
        "cumulativeProfit" as profit
      FROM "Performance"
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `

    if (result.length > 0) {
      return {
        exists: true,
        score: result[0].score || 0,
        profit: Number.parseFloat(result[0].profit) || 0,
      }
    }

    return { exists: false, score: 0, profit: 0 }
  } catch (error) {
    console.error("Error checking existing performance:", error)
    // In case of error, return false to allow the game to proceed
    return { exists: false, score: 0, profit: 0 }
  }
}

export async function saveGameResults(
  userId: string,
  levelId: number,
  gameState: GameState | null,
  score?: number,
  gameHistory?: any[],
  finalState?: {
    cash: number
    rawMaterialAStock: number
    rawMaterialBStock: number
    finishedGoodStock: number
  },
) {
  try {
    // Handle different parameter formats
    let effectiveScore = score
    let effectiveGameHistory = gameHistory
    let effectiveFinalState = finalState

    // If gameState is provided, extract data from it
    if (gameState) {
      effectiveScore = gameState.score
      effectiveGameHistory = gameState.history
      effectiveFinalState = {
        cash: gameState.cumulativeProfit || 0,
        rawMaterialAStock: gameState.inventory?.patty || 0,
        rawMaterialBStock: gameState.inventory?.bun || 0,
        finishedGoodStock: gameState.inventory?.finishedGoods || 0,
      }
    }

    // Ensure we have valid data
    if (!effectiveScore) effectiveScore = 0
    if (!effectiveGameHistory) effectiveGameHistory = []
    if (!effectiveFinalState) {
      effectiveFinalState = {
        cash: 0,
        rawMaterialAStock: 0,
        rawMaterialBStock: 0,
        finishedGoodStock: 0,
      }
    }

    // First, delete any existing performance records for this user and level
    // This will cascade delete any associated GameDailyData records due to the foreign key constraint
    await sql`
      DELETE FROM "Performance"
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
    `

    // Insert the new performance record and get the ID
    const performanceResult = await sql`
      INSERT INTO "Performance" (
        "userId",
        "levelId",
        score,
        "cumulativeProfit",
        "rawMaterialAStock",
        "rawMaterialBStock",
        "finishedGoodStock",
        decisions,
        "createdAt",
        "cashFlow",
        "hasDetailedData"
      ) VALUES (
        ${userId},
        ${levelId},
        ${effectiveScore},
        ${effectiveFinalState.cash},
        ${effectiveFinalState.rawMaterialAStock},
        ${effectiveFinalState.rawMaterialBStock},
        ${effectiveFinalState.finishedGoodStock},
        ${JSON.stringify(effectiveGameHistory)},
        NOW(),
        ${0},
        ${Array.isArray(effectiveGameHistory) && effectiveGameHistory.length > 0}
      )
      RETURNING id
    `

    const performanceId = performanceResult[0]?.id

    // If we have a valid performance ID and game history, save detailed daily data
    if (performanceId && Array.isArray(effectiveGameHistory) && effectiveGameHistory.length > 0) {
      const values = effectiveGameHistory.map((entry: DailyResult) => [
        performanceId,
        entry.day,
        entry.cash || 0,
        entry.inventory?.patty || 0,
        entry.inventory?.bun || 0,
        entry.inventory?.cheese || 0,
        entry.inventory?.potato || 0,
        entry.inventory?.finishedGoods || 0,
        entry.production || 0,
        entry.sales || 0,
        entry.revenue || 0,
        entry.costs.purchases || 0,
        entry.costs.production || 0,
        entry.costs.holding || 0,
        entry.costs.total || 0,
        entry.profit || 0,
        entry.cumulativeProfit || 0,
        entry.overstockPenalty || 0, // <-- add this
        JSON.stringify(entry.overstockPenaltyDetails || {}) // <-- and this
      ]);
      const rows = values.length;
      if (rows > 0) {
        const valuePlaceholders = values
          .map(
            (_, rowIdx) =>
              `(${Array(19)
                .fill(0)
                .map((__, colIdx) => `$${rowIdx * 19 + colIdx + 1}`)
                .join(", ")})`
          )
          .join(", ");
        const flatValues = values.flat();
        await pgPool.query(
          `
          INSERT INTO "GameDailyData" (
            "performanceId",
            "day",
            "cash",
            "pattyInventory",
            "bunInventory",
            "cheeseInventory",
            "potatoInventory",
            "finishedGoodsInventory",
            "production",
            "sales",
            "revenue",
            "purchaseCosts",
            "productionCosts",
            "holdingCosts",
            "totalCosts",
            "profit",
            "cumulativeProfit",
            "overstockPenalty",           -- new
            "overstockPenaltyDetails"     -- new
          ) VALUES ${valuePlaceholders}
          `,
          flatValues
        );
      }
    }

    // Update user progress if they've completed a level they haven't before
    await sql`
      UPDATE "User"
      SET progress = GREATEST(progress, ${levelId + 1})
      WHERE id = ${userId} AND progress <= ${levelId}
    `

    return { success: true }
  } catch (error) {
    console.error("Error saving game results:", error)
    return { success: false, error: String(error) }
  }
}
