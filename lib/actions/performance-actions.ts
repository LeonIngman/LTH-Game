"use server"

import { sql } from "../db"

// Function to get user performance data for a specific level
export async function getUserPerformance(userId: string, levelId: number) {
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

// Function to get game levels
export async function getGameLevels() {
  try {
    const levels = await sql`
      SELECT id, name, description, "maxScore" 
      FROM "GameLevel" 
      ORDER BY id ASC
    `
    return levels
  } catch (error) {
    console.error("Error getting game levels:", error)
    return [
      { id: 0, name: "The First Spark", description: "Introduction" },
      { id: 1, name: "Timing is Everything", description: "Intermediate" },
      { id: 2, name: "Forecast the Future", description: "Advanced" },
      { id: 3, name: "Uncertainty Unleashed", description: "Expert" },
    ]
  }
}

// Function to get current game session daily data for a user and level
export async function getCurrentGameSessionData(userId: string, levelId: number) {
  try {
    // First, get the most recent Performance record for this user and level
    const performanceResult = await sql`
      SELECT id, score, "cumulativeProfit"
      FROM "Performance" 
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY id DESC
      LIMIT 1
    `

    if (performanceResult.length === 0) {
      return []
    }

    const performanceId = performanceResult[0].id

    // Try to get the daily data for this performance record
    try {
      const dailyData = await sql`
        SELECT 
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
          "cumulativeProfit"
        FROM "GameDailyData" 
        WHERE "performanceId" = ${performanceId}
        ORDER BY "day" DESC
      `

      return dailyData
    } catch (error) {
      // GameDailyData table may not exist
      return []
    }
  } catch (error) {
    console.error("Error getting current game session data:", error)
    return []
  }
}

// Alternative function to get game data from GameSession table
export async function getGameSessionData(userId: string, levelId: number) {
  try {
    // Get the most recent GameSession for this user and level
    const gameSession = await sql`
      SELECT * FROM "GameSession" 
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `

    if (gameSession.length === 0) {
      return []
    }

    const session = gameSession[0]

    // Check if the session has daily data stored in gameState.history
    if (session.gameState?.history && Array.isArray(session.gameState.history)) {
      // Sort by day in descending order
      return session.gameState.history.sort((a: any, b: any) => (b.day || 0) - (a.day || 0))
    }

    // Check if the session has daily data stored at top level
    if (session.dailyData && Array.isArray(session.dailyData)) {
      // Sort by day in descending order
      return session.dailyData.sort((a: any, b: any) => (b.day || 0) - (a.day || 0))
    }

    // If no daily data array, try to construct from gameState fields
    if (session.gameState?.day && session.gameState.day > 0) {
      const dailyData = [{
        day: session.gameState.day,
        cash: session.gameState.cash || 0,
        revenue: 0, // Would need to calculate from history if available
        totalCosts: 0, // Would need to calculate from history if available
        profit: 0, // Would need to calculate from history if available
        cumulativeProfit: session.gameState.cumulativeProfit || 0,
        production: 0, // Would need to get from current day data
        sales: 0, // Would need to get from current day data
        pattyInventory: session.gameState.inventory?.patty || 0,
        bunInventory: session.gameState.inventory?.bun || 0,
        cheeseInventory: session.gameState.inventory?.cheese || 0,
        potatoInventory: session.gameState.inventory?.potato || 0,
        finishedGoodsInventory: session.gameState.inventory?.finishedGoods || 0
      }]
      return dailyData
    }

    return []
  } catch (error) {
    console.error("Error getting game session data:", error)
    return []
  }
}

// Function to get all students performance for a specific level (for teacher view)
export async function getAllStudentsPerformance(levelId: number) {
  try {
    // Get all users who are students and have GameSession data for this level
    const studentsPerformance = await sql`
      SELECT 
        u.id AS "userId",
        u.username,
        u.email,
        gs."levelId",
        gs."gameState",
        gs."updatedAt",
        gs."isCompleted"
      FROM "User" u
      LEFT JOIN "GameSession" gs ON u.id = gs."userId" AND gs."levelId" = ${levelId}
      WHERE u.role = 'student'
      ORDER BY u.username ASC
    `

    // Process the data to extract performance metrics
    const processedData = studentsPerformance.map((student: any) => {
      let maxScore = 0
      let maxProfit = 0
      let currentDay = 0
      let hasPlayedLevel = false

      if (student.gameState && student.levelId === levelId) {
        hasPlayedLevel = true
        maxScore = student.gameState.score || 0
        maxProfit = student.gameState.cumulativeProfit || 0
        currentDay = student.gameState.day || 0
      }

      return {
        userId: student.userId,
        username: student.username,
        email: student.email,
        maxScore,
        maxProfit,
        currentDay,
        hasPlayedLevel,
        lastPlayed: student.updatedAt,
        isCompleted: student.isCompleted || false
      }
    })

    return processedData
  } catch (error) {
    console.error("Error getting all students performance:", error)
    return []
  }
}
