"use server"

import { sql } from "../db"
import { isV0Preview, shouldUseDemoMode } from "@/lib/v0-detection"

// Function to generate mock performance data
export async function generateMockPerformance(userId: string, levelId: number) {
  // If in demo mode or v0 preview, don't actually generate data
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Demo mode active: Skipping mock performance data generation")
    return
  }

  try {
    // Generate some mock data points
    const numDataPoints = 10
    const initialScore = 0
    const initialProfit = 0
    const initialCash = 1000
    const initialRawMaterialA = 20
    const initialRawMaterialB = 20
    const initialFinishedGoods = 10

    for (let i = 0; i < numDataPoints; i++) {
      const timestampNumber = i + 1
      const score = initialScore + i * 100
      const cumulativeProfit = initialProfit + i * 500
      const cashFlow = initialCash + i * 200
      const rawMaterialAStock = initialRawMaterialA + i * 5
      const rawMaterialBStock = initialRawMaterialB + i * 5
      const finishedGoodStock = initialFinishedGoods + i * 2

      // Insert mock data into the database
      await sql`
        INSERT INTO "Performance" (
          "userId", "levelId", "score", "cumulativeProfit", 
          "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock"
        ) VALUES (
          ${userId}, ${levelId}, ${score}, ${cumulativeProfit},
          ${cashFlow}, ${rawMaterialAStock}, ${rawMaterialBStock}, ${finishedGoodStock}
        )
      `
    }

    console.log("Mock performance data generated successfully")
  } catch (error) {
    console.error("Error generating mock performance data:", error)
    throw error
  }
}

// Function to get user performance data for a specific level
export async function getUserPerformance(userId: string, levelId: number) {
  // If in demo mode or v0 preview, return empty array
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Demo mode active: Returning empty performance data")
    return []
  }

  try {
    const performance = await sql`
      SELECT *
      FROM "Performance"
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY id ASC
    `
    return performance
  } catch (error) {
    console.error("Error getting user performance:", error)
    return []
  }
}

// Function to get detailed game data for a specific performance record
export async function getDetailedGameData(userId: string, levelId: number) {
  // If in demo mode or v0 preview, return mock data
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Demo mode active: Returning mock detailed game data")
    return generateMockDetailedData(10)
  }

  try {
    // First, get the performance ID
    const performanceResult = await sql`
      SELECT id 
      FROM "Performance" 
      WHERE "userId" = ${userId} AND "levelId" = ${levelId} 
      AND "hasDetailedData" = true
      LIMIT 1
    `

    if (performanceResult.length === 0) {
      return []
    }

    const performanceId = performanceResult[0].id

    // Then get the detailed game data
    const detailedData = await sql`
      SELECT * 
      FROM "GameDailyData" 
      WHERE "performanceId" = ${performanceId}
      ORDER BY "day" ASC
    `

    return detailedData
  } catch (error) {
    console.error("Error getting detailed game data:", error)
    return []
  }
}

// Function to get performance data for all students at a specific level
export async function getPerformanceData(levelId: number) {
  // If in demo mode or v0 preview, return empty array
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Demo mode active: Returning empty performance data")
    return []
  }

  try {
    const performance = await sql`
      SELECT *
      FROM "Performance"
      WHERE "levelId" = ${levelId}
      ORDER BY "userId", id ASC
    `
    return performance
  } catch (error) {
    console.error("Error getting performance data:", error)
    return []
  }
}

// Function to get all students performance for a specific level
export async function getAllStudentsPerformance(levelId: number) {
  // If in demo mode or v0 preview, return mock data
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Demo mode active: Returning mock students performance data")
    return [
      { userId: "student-1", username: "TopStudent", maxScore: 1000, maxProfit: 5000 },
      { userId: "student-2", username: "LogisticsWiz", maxScore: 900, maxProfit: 4500 },
      { userId: "student-3", username: "SupplyChainMaster", maxScore: 800, maxProfit: 4000 },
    ]
  }

  try {
    const studentsPerformance = await sql`
      SELECT 
        "User".id AS userId,
        "User".username AS username,
        MAX("Performance".score) AS maxScore,
        MAX("Performance".cumulativeProfit) AS maxProfit
      FROM "User"
      LEFT JOIN "Performance" ON "User".id = "Performance"."userId" AND "Performance"."levelId" = ${levelId}
      WHERE "User".role = 'student'
      GROUP BY "User".id, "User".username
      ORDER BY "User".username ASC
    `
    return studentsPerformance
  } catch (error) {
    console.error("Error getting all students performance:", error)
    return []
  }
}

// Function to get game levels
export async function getGameLevels() {
  // If in demo mode or v0 preview, return mock data
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Using mock game levels data")
    return [
      { id: 0, name: "The First Spark", description: "Introduction" },
      { id: 1, name: "Timing is Everything", description: "Intermediate" },
      { id: 2, name: "Forecast the Future", description: "Advanced" },
      { id: 3, name: "Uncertainty Unleashed", description: "Expert" },
    ]
  }

  try {
    // Fetch game levels from the database
    const levels = await sql`
      SELECT id, name, description, "maxScore" 
      FROM "GameLevel" 
      ORDER BY id ASC
    `
    return levels
  } catch (error) {
    console.error("Error getting game levels:", error)
    // Fallback to static data if database query fails
    return [
      { id: 0, name: "The First Spark", description: "Introduction" },
      { id: 1, name: "Timing is Everything", description: "Intermediate" },
      { id: 2, name: "Forecast the Future", description: "Advanced" },
      { id: 3, name: "Uncertainty Unleashed", description: "Expert" },
    ]
  }
}

// Helper function to generate mock detailed game data
function generateMockDetailedData(days: number) {
  const mockData = []
  let cash = 1000
  let cumulativeProfit = 0

  for (let day = 1; day <= days; day++) {
    // Generate random values for this day
    const production = Math.floor(Math.random() * 20) + 10
    const sales = Math.floor(Math.random() * production)
    const revenue = sales * 25
    const purchaseCosts = Math.floor(Math.random() * 200) + 100
    const productionCosts = production * 10
    const holdingCosts = Math.floor(Math.random() * 50) + 20
    const totalCosts = purchaseCosts + productionCosts + holdingCosts
    const profit = revenue - totalCosts

    cumulativeProfit += profit
    cash += profit

    mockData.push({
      day,
      cash,
      pattyInventory: 20 + day * 2,
      bunInventory: 30 + day,
      cheeseInventory: 15 + day * 1.5,
      potatoInventory: 25 + day * 1.2,
      finishedGoodsInventory: 5 + day,
      production,
      sales,
      revenue,
      purchaseCosts,
      productionCosts,
      holdingCosts,
      totalCosts,
      profit,
      cumulativeProfit,
    })
  }

  return mockData
}
