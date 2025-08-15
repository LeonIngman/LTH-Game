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
    console.log('🔍 [LEADERBOARD DEBUG] Starting getLeaderboard query...')

    // Get all user-level combinations from both Performance records AND GameSession records
    const rows = await sql`
      WITH latest_performance_per_level AS (
        SELECT DISTINCT ON (p."userId", p."levelId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."timestampId" as timestamp_id,
          p."createdAt" as created_at,
          'performance'::text as source
        FROM "Performance" p
        ORDER BY p."userId", p."levelId", p."createdAt" DESC
      ),
      game_session_data AS (
        SELECT DISTINCT
          gs.user_id,
          gs.level_id,
          COALESCE(
            -- Handle both integer (öre) and decimal (krona) formats from GameSession
            CASE 
              WHEN gs.game_state::json->>'cumulativeProfit' ~ '^-?\d+$' 
              THEN CAST(gs.game_state::json->>'cumulativeProfit' AS INTEGER)
              ELSE CAST(ROUND(CAST(gs.game_state::json->>'cumulativeProfit' AS NUMERIC) * 100) AS INTEGER)
            END,
            0
          ) as cumulative_profit,
          COALESCE(
            CAST(gs.game_state::json->>'day' AS INTEGER),
            1
          ) as day_number,
          gs.updated_at as created_at,
          'game_session'::text as source
        FROM "GameSession" gs
        WHERE gs.game_state IS NOT NULL 
          AND gs.game_state::json->>'cumulativeProfit' IS NOT NULL
      ),
      combined_data AS (
        -- Get Performance records first (they take priority)
        SELECT 
          user_id,
          level_id,
          cumulative_profit,
          timestamp_id,
          created_at,
          source
        FROM latest_performance_per_level
        UNION ALL
        -- Add GameSession records only where no Performance record exists
        SELECT DISTINCT
          gsd.user_id,
          gsd.level_id,
          gsd.cumulative_profit,
          NULL::integer as timestamp_id,
          gsd.created_at,
          gsd.source
        FROM game_session_data gsd
        WHERE NOT EXISTS (
          SELECT 1 FROM latest_performance_per_level lp 
          WHERE lp.user_id = gsd.user_id AND lp.level_id = gsd.level_id
        )
      ),
      user_levels AS (
        SELECT DISTINCT
          u.id,
          u.username,
          u.progress,
          u."lastActive",
          cd.level_id,
          cd.cumulative_profit,
          cd.timestamp_id,
          cd.source,
          CASE 
            WHEN cd.source = 'game_session' THEN gsd.day_number
            ELSE NULL 
          END as game_session_day
        FROM "User" u
        INNER JOIN combined_data cd ON cd.user_id = u.id
        LEFT JOIN game_session_data gsd ON gsd.user_id = cd.user_id AND gsd.level_id = cd.level_id
        WHERE u.role = 'student'
      )
      SELECT 
        ul.id,
        ul.username,
        ul.progress,
        COALESCE(ul.cumulative_profit, 0) AS profit,
        COALESCE(ul.level_id, 0) AS level,
        ul."lastActive",
        COALESCE(ts."timestampNumber", ul.game_session_day, ul.progress, 0) AS day,
        NULL AS "levelCompletedDate",
        ul.source
      FROM user_levels ul
          LEFT JOIN "TimeStamp" ts ON ts.id = ul.timestamp_id
      ORDER BY ul.level_id ASC, ul.cumulative_profit DESC, ul."lastActive" DESC;
    `

    console.log('📊 [LEADERBOARD DEBUG] Raw database results:', rows.length, 'rows')
    rows.forEach((row, index) => {
      console.log(`📋 [LEADERBOARD DEBUG] Row ${index + 1}: User=${row.username}, Level=${row.level}, Profit=${row.profit}, Day=${row.day}, Source=${row.source}`)
    })

    const result = rows.map((r) => ({
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

    console.log('✅ [LEADERBOARD DEBUG] Processed results:', result.length, 'entries')
    result.forEach((entry, index) => {
      console.log(`📋 [LEADERBOARD DEBUG] Entry ${index + 1}: ID=${entry.id}, User=${entry.username}, Level=${entry.level}, Profit=${entry.profit}, Day=${entry.day}`)
    })

    return result
  } catch (error) {
    console.error("❌ [LEADERBOARD DEBUG] Error getting leaderboard:", error)
    console.log("🔄 [LEADERBOARD DEBUG] Falling back to mock leaderboard data due to database error")
    // Expand mock data to have multiple level entries per user
    return mockLeaderboardData.flatMap((d) => [
      { ...d, id: `${d.id}-${d.level}`, userId: d.id, day: d.progress },
    ])
  }
} export async function getLeaderboardByLevel(levelId: number) {
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