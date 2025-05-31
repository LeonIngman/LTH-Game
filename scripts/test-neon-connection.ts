import { sql } from "../lib/db"

async function testDatabaseConnection() {
  try {
    console.log("Testing Neon database connection...")

    // Test basic query
    const result = await sql`SELECT NOW() as current_time`
    console.log("Connection successful:", result[0].current_time)

    // Test User table query
    const users = await sql`SELECT COUNT(*) as user_count FROM "User"`
    console.log("User count:", users[0].user_count)

    // Test GameLevel table query
    const levels = await sql`SELECT id, name FROM "GameLevel" ORDER BY id`
    console.log("Game levels:", levels)

    console.log("All tests completed successfully")
  } catch (error) {
    console.error("Database connection test failed:", error)
  }
}

testDatabaseConnection()
