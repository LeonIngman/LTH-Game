#!/usr/bin/env node

// Direct database test without importing TypeScript modules
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testLeaderboardSQL() {
  try {
    console.log("Testing leaderboard SQL query directly...");

    // This is the exact query from our fixed leaderboard function
    const query = `
      WITH combined_data AS (
        SELECT DISTINCT ON (user_id, level_id)
          user_id,
          level_id,
          current_day as day,
          current_profit as profit,
          'game_session' as source,
          created_at
        FROM "GameSession"
        
        UNION ALL
        
        SELECT DISTINCT ON (user_id, level_id)
          user_id,
          level_id,
          (game_state->>'day')::integer as day,
          (game_state->>'currentCash')::numeric as profit,
          'performance' as source,
          created_at
        FROM "Performance"
        WHERE game_state IS NOT NULL
          AND game_state->>'day' IS NOT NULL
          AND game_state->>'currentCash' IS NOT NULL
      ),
      prioritized_data AS (
        SELECT DISTINCT ON (user_id, level_id)
          user_id,
          level_id,
          day,
          profit,
          source,
          created_at
        FROM combined_data
        ORDER BY user_id, level_id, created_at DESC
      )
      SELECT 
        u.email,
        u.username,
        pd.level_id,
        pd.day,
        pd.profit,
        pd.source,
        pd.created_at
      FROM prioritized_data pd
      JOIN "User" u ON u.id = pd.user_id
      WHERE u.email = 'leoningman.student2@gmail.com'
      ORDER BY pd.level_id;
    `;

    const result = await pool.query(query);

    console.log("\nResults for leoningman-student2:");
    console.log("================================");

    if (result.rows.length > 0) {
      result.rows.forEach((row) => {
        console.log(`Level ${row.level_id}: ${row.profit} kr (Day ${row.day})`);
        console.log(`  Source: ${row.source}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Email: ${row.email}`);
        console.log("---");
      });
    } else {
      console.log("No data found for leoningman-student2");
    }
  } catch (error) {
    console.error("Error testing leaderboard SQL:", error);
  } finally {
    await pool.end();
  }
}

testLeaderboardSQL();
