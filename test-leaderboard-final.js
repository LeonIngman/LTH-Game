#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testLeaderboardQuery() {
  try {
    console.log("Testing leaderboard query with the latest fixes...");

    // This is the actual query from getLeaderboard() function
    const query = `
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
              WHEN gs.game_state::json->>'cumulativeProfit' ~ '^-?\\d+$' 
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
        -- Prioritize GameSession data when it's more recent than Performance data
        -- This ensures that reset levels show fresh data instead of stale performance data
        SELECT DISTINCT ON (user_id, level_id)
          user_id,
          level_id,
          cumulative_profit,
          timestamp_id,
          created_at,
          source
        FROM (
          SELECT 
            user_id,
            level_id,
            cumulative_profit,
            timestamp_id,
            created_at,
            source
          FROM latest_performance_per_level
          UNION ALL
          SELECT DISTINCT
            gsd.user_id,
            gsd.level_id,
            gsd.cumulative_profit,
            NULL::integer as timestamp_id,
            gsd.created_at,
            gsd.source
          FROM game_session_data gsd
        ) all_data
        ORDER BY user_id, level_id, created_at DESC
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
      WHERE ul.username = 'leoningman-student2'
      ORDER BY ul.level_id ASC, ul.cumulative_profit DESC, ul."lastActive" DESC;
    `;

    const result = await pool.query(query);

    console.log("\\nResults for leoningman-student2:");
    console.log("================================");

    if (result.rows.length > 0) {
      result.rows.forEach((row) => {
        console.log(`Level ${row.level}: ${row.profit} kr (Day ${row.day})`);
        console.log(`  Source: ${row.source}`);
        console.log(`  Username: ${row.username}`);
        console.log(`  Progress: ${row.progress}`);
        console.log("---");
      });
    } else {
      console.log("No data found for leoningman-student2");
    }

    // Also test getLeaderboardByLevel for level 0
    console.log("\\nTesting getLeaderboardByLevel for level 0...");
    const levelQuery = `
      WITH latest_performance AS (
        SELECT DISTINCT ON (p."userId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."timestampId" as timestamp_id,
          p."createdAt" as created_at,
          'performance'::text as source
        FROM "Performance" p
        WHERE p."levelId" = 0
        ORDER BY p."userId", p."createdAt" DESC
      ),
      game_session_data AS (
        SELECT DISTINCT
          gs.user_id,
          gs.level_id,
          COALESCE(
            CASE 
              WHEN gs.game_state::json->>'cumulativeProfit' ~ '^-?\\d+$' 
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
        WHERE gs.level_id = 0
          AND gs.game_state IS NOT NULL 
          AND gs.game_state::json->>'cumulativeProfit' IS NOT NULL
      ),
      combined_data AS (
        -- Prioritize most recent data (GameSession over Performance if GameSession is newer)
        SELECT DISTINCT ON (user_id)
          user_id,
          level_id,
          cumulative_profit,
          timestamp_id,
          created_at,
          source,
          day_number
        FROM (
          SELECT 
            user_id,
            level_id,
            cumulative_profit,
            timestamp_id,
            created_at,
            source,
            NULL::integer as day_number
          FROM latest_performance
          UNION ALL
          SELECT 
            user_id,
            level_id,
            cumulative_profit,
            NULL::integer as timestamp_id,
            created_at,
            source,
            day_number
          FROM game_session_data
        ) all_data
        ORDER BY user_id, created_at DESC
      )
      SELECT 
        u.id,
        u.username,
        u.progress,
        COALESCE(cd.cumulative_profit, 0) AS profit,
        COALESCE(cd.level_id, 0) AS level,
        u."lastActive",
        COALESCE(ts."timestampNumber", cd.day_number, 0) AS day,
        NULL AS "levelCompletedDate",
        cd.source
      FROM "User" u
          LEFT JOIN combined_data cd ON cd.user_id = u.id
          LEFT JOIN "TimeStamp" ts ON ts.id = cd.timestamp_id
          WHERE u.role = 'student' AND u.username = 'leoningman-student2' AND (cd.level_id = 0 OR cd.level_id IS NULL)
      ORDER BY cd.cumulative_profit DESC, u."lastActive" DESC;
    `;

    const levelResult = await pool.query(levelQuery);

    console.log("\\nLevel 0 specific results:");
    console.log("========================");

    if (levelResult.rows.length > 0) {
      levelResult.rows.forEach((row) => {
        console.log(`Level ${row.level}: ${row.profit} kr (Day ${row.day})`);
        console.log(`  Source: ${row.source}`);
        console.log(`  Username: ${row.username}`);
        console.log("---");
      });
    } else {
      console.log("No level 0 data found for leoningman-student2");
    }
  } catch (error) {
    console.error("Error testing leaderboard query:", error);
  } finally {
    await pool.end();
  }
}

testLeaderboardQuery();
