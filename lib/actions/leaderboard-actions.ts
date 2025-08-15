"use server"

import { sql } from "../db"

// Mock leaderboard data for demo mode or when database connection fails
const mockLeaderboardData = [
  {
    id: "student-1",
    username: "TopStudent",
    progress: 3,
    profit: 85000,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-18",
  },
  {
    id: "student-2",
    username: "LogisticsWiz",
    progress: 3,
    profit: 72500,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-17",
  },
  {
    id: "student-3",
    username: "SupplyChainMaster",
    progress: 2,
    profit: 63000,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-15",
  },
  {
    id: "student-4",
    username: "InventoryPro",
    progress: 2,
    profit: 58200,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-14",
  },
  {
    id: "student-5",
    username: "ShippingExpert",
    progress: 1,
    profit: 42000,
    level: 0,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-12",
  },
  {
    id: "student-demo-456",
    username: "DemoStudent",
    progress: 1,
    profit: 38500,
    level: 0,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-10",
  },
]

export async function getLeaderboard() {
  try {
    // Get latest performance per student per level + timestamp info
    const rows = await sql`
      WITH latest_performance_per_level AS (
        SELECT DISTINCT ON (p."userId", p."levelId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."timestampId" as timestamp_id,
          p."createdAt" as created_at
        FROM "Performance" p
        ORDER BY p."userId", p."levelId", p."createdAt" DESC
      )
      SELECT 
        u.id,
        u.username,
        u.progress,
        COALESCE(lp.cumulative_profit, 0) AS profit,
        COALESCE(lp.level_id, 0) AS level,
        u."lastActive",
        COALESCE(ts."timestampNumber", 0) AS day,
        NULL AS "levelCompletedDate"
      FROM "User" u
          LEFT JOIN latest_performance_per_level lp ON lp.user_id = u.id
          LEFT JOIN "TimeStamp" ts ON ts.id = lp.timestamp_id
          WHERE u.role = 'student'
      ORDER BY lp.level_id ASC, lp.cumulative_profit DESC, u."lastActive" DESC;
    `

    return rows.map((r) => ({
      id: `${r.id}-${r.level}`, // Unique key per user-level combination
      userId: r.id,
      username: r.username,
      progress: r.progress ?? 0,
      profit: typeof r.profit === "string" ? parseFloat(r.profit) : (r.profit ?? 0),
      level: r.level ?? 0,
      lastActive: new Date(r.lastActive).toLocaleDateString("sv-SE"),
      levelCompletedDate: r.levelCompletedDate || null,
      day: r.day ?? 0,
    }))
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    console.log("Falling back to mock leaderboard data due to database error")
    // Expand mock data to have multiple level entries per user
    return mockLeaderboardData.flatMap((d) => [
      { ...d, id: `${d.id}-${d.level}`, userId: d.id, day: d.progress },
    ])
  }
}

export async function getLeaderboardByLevel(levelId: number) {
  try {
    const rows = await sql`
      WITH level_perf AS (
        SELECT DISTINCT ON (p."userId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."timestampId" as timestamp_id,
          p."createdAt" as created_at
        FROM "Performance" p
        WHERE p."levelId" = ${levelId}
        ORDER BY p."userId", p."createdAt" DESC
      )
      SELECT 
        u.id,
        u.username,
        u.progress,
        COALESCE(lp.cumulative_profit, 0) AS profit,
        COALESCE(lp.level_id, ${levelId}) AS level,
        u."lastActive",
        COALESCE(ts."timestampNumber", 0) AS day,
        NULL AS "levelCompletedDate"
      FROM "User" u
          LEFT JOIN level_perf lp ON lp.user_id = u.id
          LEFT JOIN "TimeStamp" ts ON ts.id = lp.timestamp_id
          WHERE u.role = 'student' AND (lp.level_id = ${levelId} OR lp.level_id IS NULL)
      ORDER BY lp.cumulative_profit DESC, u."lastActive" DESC;
    `

    return rows.map((r) => ({
      id: `${r.id}-${levelId}`,
      userId: r.id,
      username: r.username,
      progress: r.progress ?? 0,
      profit: typeof r.profit === "string" ? parseFloat(r.profit) : (r.profit ?? 0),
      level: r.level ?? levelId,
      lastActive: new Date(r.lastActive).toLocaleDateString("sv-SE"),
      levelCompletedDate: r.levelCompletedDate || null,
      day: r.day ?? 0,
    }))
  } catch (error) {
    console.error(`Error getting leaderboard for level ${levelId}:`, error)
    console.log(`Falling back to mock leaderboard data for level ${levelId} due to database error`)
    return mockLeaderboardData.filter((user) => user.level === levelId).map((d) => ({
      ...d,
      id: `${d.id}-${levelId}`,
      userId: d.id,
      day: d.progress
    }))
  }
}