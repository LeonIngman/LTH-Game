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

// Function to get detailed game data for a specific performance record
export async function getDetailedGameData(userId: string, levelId: number) {
  try {
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
