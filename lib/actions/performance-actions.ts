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
    console.log("🔍 getCurrentGameSessionData called with:", { userId, levelId })

    // First, get the most recent Performance record for this user and level
    const performanceResult = await sql`
      SELECT id, score, "cumulativeProfit"
      FROM "Performance" 
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY id DESC
      LIMIT 1
    `

    console.log("📊 Performance query result:", performanceResult)

    if (performanceResult.length === 0) {
      console.log("❌ No performance records found for user:", userId, "level:", levelId)
      return []
    }

    const performanceId = performanceResult[0].id
    console.log("✅ Found performance record with ID:", performanceId)

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
        ORDER BY "day" ASC
      `

      console.log("📈 Daily data query result:", dailyData)
      console.log("📈 Daily data length:", dailyData.length)
      return dailyData
    } catch (error) {
      console.log("⚠️ GameDailyData table does not exist, returning empty array:", error)
      return []
    }
  } catch (error) {
    console.error("❌ Error getting current game session data:", error)
    return []
  }
}

// Alternative function to get game data from GameSession table
export async function getGameSessionData(userId: string, levelId: number) {
  try {
    console.log("🎮 Getting game session data from GameSession table for user:", userId, "level:", levelId)

    // Get the most recent GameSession for this user and level
    const gameSession = await sql`
      SELECT * FROM "GameSession" 
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `

    console.log("🎲 GameSession result:", gameSession)

    if (gameSession.length === 0) {
      console.log("❌ No game session found for user:", userId, "level:", levelId)
      return []
    }

    const session = gameSession[0]
    console.log("✅ Found game session:", session)

    // Check if the session has daily data stored in gameState.history
    if (session.gameState && session.gameState.history && Array.isArray(session.gameState.history)) {
      console.log("📊 History data found in GameSession.gameState.history:", session.gameState.history)
      return session.gameState.history
    }

    // Check if the session has daily data stored at top level
    if (session.dailyData && Array.isArray(session.dailyData)) {
      console.log("📊 Daily data found in GameSession:", session.dailyData)
      return session.dailyData
    }

    // If no daily data array, try to construct from gameState fields
    if (session.gameState && session.gameState.day && session.gameState.day > 0) {
      console.log("🔧 Constructing daily data from GameSession.gameState fields")
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
      console.log("🏗️ Constructed daily data from gameState:", dailyData)
      return dailyData
    }

    console.log("❌ No usable data found in GameSession")
    return []
  } catch (error) {
    console.error("❌ Error getting game session data:", error)
    return []
  }
}

// Debug function to list all Performance records for a user
export async function debugListAllPerformanceRecords(userId: string) {
  try {
    console.log("🔎 Debug: Getting all Performance records for user:", userId)

    const allPerformance = await sql`
      SELECT id, "userId", "levelId", score, "cumulativeProfit"
      FROM "Performance" 
      WHERE "userId" = ${userId}
      ORDER BY id DESC
    `

    console.log("🗃️ All Performance records:", allPerformance)
    return allPerformance
  } catch (error) {
    console.error("❌ Error getting all performance records:", error)
    return []
  }
}

// Debug function to list all GameDailyData records for a performance ID
export async function debugListAllDailyData(performanceId: number) {
  try {
    console.log("🔎 Debug: Getting all GameDailyData records for performanceId:", performanceId)

    const allDailyData = await sql`
      SELECT *
      FROM "GameDailyData" 
      WHERE "performanceId" = ${performanceId}
      ORDER BY "day" ASC
    `

    console.log("📊 All GameDailyData records:", allDailyData)
    return allDailyData
  } catch (error) {
    console.error("❌ Error getting all daily data records:", error)
    return []
  }
}

// Debug function to explore all game-related tables
export async function debugExploreDatabase(userId: string) {
  try {
    console.log("🔍 DEBUG: Exploring database for user:", userId)

    // Check Performance table
    const performance = await sql`SELECT * FROM "Performance" WHERE "userId" = ${userId} ORDER BY id DESC LIMIT 5`
    console.log("📊 Performance table:", performance)

    // Check GameSession table (using updatedAt instead of createdAt)
    const gameSessions = await sql`SELECT * FROM "GameSession" WHERE "userId" = ${userId} ORDER BY "updatedAt" DESC LIMIT 5`
    console.log("🎮 GameSession table:", gameSessions)

    // Check if there are any GameDailyData records (with error handling)
    let allDailyData = []
    let orphanedDailyData = []
    try {
      allDailyData = await sql`
        SELECT gdd.*, p."userId", p."levelId" 
        FROM "GameDailyData" gdd 
        LEFT JOIN "Performance" p ON gdd."performanceId" = p.id 
        WHERE p."userId" = ${userId} OR gdd."performanceId" IS NULL
        ORDER BY gdd.id DESC LIMIT 10
      `
      console.log("📈 GameDailyData table:", allDailyData)

      // Also check GameDailyData records that might not be linked to Performance
      orphanedDailyData = await sql`
        SELECT * FROM "GameDailyData" 
        WHERE "performanceId" IS NULL OR "performanceId" NOT IN (SELECT id FROM "Performance")
        ORDER BY id DESC LIMIT 10
      `
      console.log("🔗 Orphaned GameDailyData records:", orphanedDailyData)
    } catch (error: any) {
      console.log("⚠️ GameDailyData table does not exist:", error.message)
      allDailyData = []
      orphanedDailyData = []
    }

    // Check User table
    const user = await sql`SELECT id, username, email, role FROM "User" WHERE id = ${userId}`
    console.log("👤 User table:", user)

    // Check GameLevel table
    const gameLevels = await sql`SELECT * FROM "GameLevel" ORDER BY id ASC`
    console.log("🎯 GameLevel table:", gameLevels)

    // Check all GameSession records to see if they contain daily data
    const allGameSessions = await sql`SELECT * FROM "GameSession" WHERE "userId" = ${userId} ORDER BY "updatedAt" DESC`
    console.log("🎲 All GameSession records:", allGameSessions)

    return {
      performance,
      gameSessions,
      allDailyData,
      orphanedDailyData,
      user,
      gameLevels,
      allGameSessions
    }
  } catch (error) {
    console.error("❌ Error exploring database:", error)
    return null
  }
}
