"use server"

import { sql } from "../db"
import type { GameHistoryEntry, GameHistoryOverview, SessionComparison } from "@/types/game"

/**
 * Get complete game history for a user, optionally filtered by level
 */
export async function getGameHistory(userId: string, levelId?: number): Promise<GameHistoryEntry[]> {
  try {
    const query = levelId 
      ? sql`
          SELECT 
            p.*,
            gl.name as "levelName",
            gs."isCompleted",
            gs."updatedAt" as "sessionUpdatedAt"
          FROM "Performance" p
          LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
          LEFT JOIN "GameSession" gs ON gs."userId" = p."userId" AND gs."levelId" = p."levelId"
          WHERE p."userId" = ${userId} AND p."levelId" = ${levelId}
          ORDER BY p."createdAt" DESC
        `
      : sql`
          SELECT 
            p.*,
            gl.name as "levelName",
            gs."isCompleted",
            gs."updatedAt" as "sessionUpdatedAt"
          FROM "Performance" p
          LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
          LEFT JOIN "GameSession" gs ON gs."userId" = p."userId" AND gs."levelId" = p."levelId"
          WHERE p."userId" = ${userId}
          ORDER BY p."levelId" ASC, p."createdAt" DESC
        `

    const result = await query
    return result as unknown as GameHistoryEntry[]
  } catch (error) {
    console.error("Error getting game history:", error)
    return []
  }
}

/**
 * Get game history overview for a user across all levels
 */
export async function getGameHistoryOverview(userId: string): Promise<GameHistoryOverview[]> {
  try {
    const overview = await sql`
      WITH level_stats AS (
        SELECT 
          p."userId",
          p."levelId",
          gl.name as "levelName",
          COUNT(*) as "totalSessions",
          MAX(p.score) as "bestScore",
          MAX(p."cumulativeProfit") as "bestProfit",
          AVG(p.score) as "averageScore",
          AVG(p."cumulativeProfit") as "averageProfit",
          MIN(p."createdAt") as "firstPlayedAt",
          MAX(p."createdAt") as "lastPlayedAt"
        FROM "Performance" p
        LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
        WHERE p."userId" = ${userId}
        GROUP BY p."userId", p."levelId", gl.name
      ),
      recent_scores AS (
        SELECT 
          "levelId",
          score,
          ROW_NUMBER() OVER (PARTITION BY "levelId" ORDER BY "createdAt" DESC) as rn
        FROM "Performance"
        WHERE "userId" = ${userId}
      ),
      trend_calc AS (
        SELECT 
          "levelId",
          CASE 
            WHEN AVG(CASE WHEN rn <= 3 THEN score END) > AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'improving'
            WHEN AVG(CASE WHEN rn <= 3 THEN score END) = AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'stable'
            ELSE 'declining'
          END as trend
        FROM recent_scores
        WHERE rn <= 6
        GROUP BY "levelId"
      )
      SELECT 
        ls.*,
        COALESCE(tc.trend, 'stable') as "progressTrend"
      FROM level_stats ls
      LEFT JOIN trend_calc tc ON ls."levelId" = tc."levelId"
      ORDER BY ls."levelId" ASC
    `

    return overview as GameHistoryOverview[]
  } catch (error) {
    console.error("Error getting game history overview:", error)
    return []
  }
}

/**
 * Get game history overview for all students (teacher view)
 */
export async function getAllStudentsGameHistory(levelId?: number): Promise<Array<GameHistoryOverview & { username: string }>> {
  try {
    const query = levelId
      ? sql`
          WITH level_stats AS (
            SELECT 
              p."userId",
              u.username,
              p."levelId",
              gl.name as "levelName",
              COUNT(*) as "totalSessions",
              MAX(p.score) as "bestScore",
              MAX(p."cumulativeProfit") as "bestProfit",
              AVG(p.score) as "averageScore",
              AVG(p."cumulativeProfit") as "averageProfit",
              MIN(p."createdAt") as "firstPlayedAt",
              MAX(p."createdAt") as "lastPlayedAt"
            FROM "Performance" p
            LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
            LEFT JOIN "User" u ON p."userId" = u.id
            WHERE u.role = 'student' AND p."levelId" = ${levelId}
            GROUP BY p."userId", u.username, p."levelId", gl.name
          ),
          recent_scores AS (
            SELECT 
              "userId",
              "levelId",
              score,
              ROW_NUMBER() OVER (PARTITION BY "userId", "levelId" ORDER BY "createdAt" DESC) as rn
            FROM "Performance"
            WHERE "levelId" = ${levelId}
          ),
          trend_calc AS (
            SELECT 
              "userId",
              "levelId",
              CASE 
                WHEN AVG(CASE WHEN rn <= 3 THEN score END) > AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'improving'
                WHEN AVG(CASE WHEN rn <= 3 THEN score END) = AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'stable'
                ELSE 'declining'
              END as trend
            FROM recent_scores
            WHERE rn <= 6
            GROUP BY "userId", "levelId"
          )
          SELECT 
            ls.*,
            COALESCE(tc.trend, 'stable') as "progressTrend"
          FROM level_stats ls
          LEFT JOIN trend_calc tc ON ls."userId" = tc."userId" AND ls."levelId" = tc."levelId"
          ORDER BY ls.username ASC
        `
      : sql`
          WITH level_stats AS (
            SELECT 
              p."userId",
              u.username,
              p."levelId",
              gl.name as "levelName",
              COUNT(*) as "totalSessions",
              MAX(p.score) as "bestScore",
              MAX(p."cumulativeProfit") as "bestProfit",
              AVG(p.score) as "averageScore",
              AVG(p."cumulativeProfit") as "averageProfit",
              MIN(p."createdAt") as "firstPlayedAt",
              MAX(p."createdAt") as "lastPlayedAt"
            FROM "Performance" p
            LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
            LEFT JOIN "User" u ON p."userId" = u.id
            WHERE u.role = 'student'
            GROUP BY p."userId", u.username, p."levelId", gl.name
          ),
          recent_scores AS (
            SELECT 
              "userId",
              "levelId",
              score,
              ROW_NUMBER() OVER (PARTITION BY "userId", "levelId" ORDER BY "createdAt" DESC) as rn
            FROM "Performance"
          ),
          trend_calc AS (
            SELECT 
              "userId",
              "levelId",
              CASE 
                WHEN AVG(CASE WHEN rn <= 3 THEN score END) > AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'improving'
                WHEN AVG(CASE WHEN rn <= 3 THEN score END) = AVG(CASE WHEN rn > 3 AND rn <= 6 THEN score END) THEN 'stable'
                ELSE 'declining'
              END as trend
            FROM recent_scores
            WHERE rn <= 6
            GROUP BY "userId", "levelId"
          )
          SELECT 
            ls.*,
            COALESCE(tc.trend, 'stable') as "progressTrend"
          FROM level_stats ls
          LEFT JOIN trend_calc tc ON ls."userId" = tc."userId" AND ls."levelId" = tc."levelId"
          ORDER BY ls.username ASC, ls."levelId" ASC
        `

    const result = await query
    return result as unknown as Array<GameHistoryOverview & { username: string }>
  } catch (error) {
    console.error("Error getting all students game history:", error)
    return []
  }
}

/**
 * Get detailed game sessions for a user and level
 */
export async function getGameSessions(userId: string, levelId: number) {
  try {
    const sessions = await sql`
      SELECT 
        CONCAT(gs."userId", '-', gs."levelId") as id,
        gs.*,
        p.score as "finalScore",
        p."cumulativeProfit" as "finalProfit",
        CASE 
          WHEN gs."gameState" IS NOT NULL THEN 
            COALESCE((gs."gameState"->>'currentDay')::int, 1)
          ELSE 1
        END as "daysPlayed"
      FROM "GameSession" gs
      LEFT JOIN "Performance" p ON gs."userId" = p."userId" AND gs."levelId" = p."levelId"
      WHERE gs."userId" = ${userId} AND gs."levelId" = ${levelId}
      ORDER BY gs."updatedAt" DESC
    `

    return sessions
  } catch (error) {
    console.error("Error getting game sessions:", error)
    return []
  }
}

/**
 * Compare two game sessions
 */
export async function compareGameSessions(sessionId1: string, sessionId2: string): Promise<SessionComparison | null> {
  try {
    // For now, we'll use a simplified approach since session IDs are composite
    // In a full implementation, we'd need proper session ID handling
    
    const [userId1, levelId1] = sessionId1.split('-')
    const [userId2, levelId2] = sessionId2.split('-')
    
    const session1Data = await sql`
      SELECT p.*, gl.name as "levelName"
      FROM "Performance" p
      LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
      WHERE p."userId" = ${userId1} AND p."levelId" = ${parseInt(levelId1)}
      ORDER BY p."createdAt" DESC
      LIMIT 1
    `
    
    const session2Data = await sql`
      SELECT p.*, gl.name as "levelName"
      FROM "Performance" p
      LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
      WHERE p."userId" = ${userId2} AND p."levelId" = ${parseInt(levelId2)}
      ORDER BY p."createdAt" DESC
      LIMIT 1
    `

    if (session1Data.length === 0 || session2Data.length === 0) {
      return null
    }

    const session1 = session1Data[0] as GameHistoryEntry
    const session2 = session2Data[0] as GameHistoryEntry

    const comparison: SessionComparison = {
      sessionId1,
      sessionId2,
      session1,
      session2,
      improvements: {
        score: session2.score - session1.score,
        profit: Number(session2.cumulativeProfit) - Number(session1.cumulativeProfit),
        efficiency: 0 // Calculate based on decisions/outcomes
      },
      differences: {
        decisions: [], // Would need detailed analysis of decisions
        outcomes: []   // Would need detailed analysis of outcomes
      }
    }

    return comparison
  } catch (error) {
    console.error("Error comparing game sessions:", error)
    return null
  }
}

/**
 * Get progress timeline for a user showing improvement over time
 */
export async function getProgressTimeline(userId: string, levelId?: number) {
  try {
    const query = levelId
      ? sql`
          SELECT 
            p."createdAt",
            p.score,
            p."cumulativeProfit",
            p."levelId",
            gl.name as "levelName",
            ROW_NUMBER() OVER (PARTITION BY p."levelId" ORDER BY p."createdAt") as attempt_number
          FROM "Performance" p
          LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
          WHERE p."userId" = ${userId} AND p."levelId" = ${levelId}
          ORDER BY p."createdAt" ASC
        `
      : sql`
          SELECT 
            p."createdAt",
            p.score,
            p."cumulativeProfit",
            p."levelId",
            gl.name as "levelName",
            ROW_NUMBER() OVER (PARTITION BY p."levelId" ORDER BY p."createdAt") as attempt_number
          FROM "Performance" p
          LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
          WHERE p."userId" = ${userId}
          ORDER BY p."createdAt" ASC
        `

    return query
  } catch (error) {
    console.error("Error getting progress timeline:", error)
    return []
  }
}

/**
 * Export game history data for analysis
 */
export async function exportGameHistoryData(userId: string, format: 'json' | 'csv' = 'json') {
  try {
    const data = await getGameHistory(userId)
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Level', 'Date', 'Score', 'Profit', 'Cash Flow', 'Decisions']
      const rows = data.map(entry => [
        entry.levelName || `Level ${entry.levelId}`,
        entry.createdAt.toISOString(),
        entry.score,
        entry.cumulativeProfit,
        entry.cashFlow,
        JSON.stringify(entry.decisions)
      ])
      
      return {
        format: 'csv',
        headers,
        data: rows
      }
    }

    return {
      format: 'json',
      data
    }
  } catch (error) {
    console.error("Error exporting game history data:", error)
    return null
  }
}
