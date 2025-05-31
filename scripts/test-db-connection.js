// Run this script with: node scripts/test-db-connection.js
require("dotenv").config({ path: ".env.local" })
const { neon, neonConfig } = require("@neondatabase/serverless")

// Configure neon for better connection handling
neonConfig.fetchConnectionCache = true
neonConfig.wsProxy = true // Enable WebSocket proxy for better connection stability
neonConfig.useSecureWebSocket = true // Use secure WebSockets

async function testConnection() {
  console.log("Testing database connection...")
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "Set (hidden for security)" : "Not set"}`)

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  // Parse the connection string to check for issues (without showing password)
  try {
    const url = new URL(process.env.DATABASE_URL)
    console.log("Connection string format appears valid")
    console.log("Protocol:", url.protocol)
    console.log("Host:", url.hostname)
    console.log("Port:", url.port || "default")
    console.log("Username:", url.username || "none")
    console.log("Password:", url.password ? "****" : "none")
    console.log("Database:", url.pathname.substring(1) || "none")
    console.log("SSL Mode:", url.searchParams.get("sslmode") || "not specified")
  } catch (parseError) {
    console.error("Invalid connection string format:", parseError.message)
    console.log("Please check your DATABASE_URL format. It should be:")
    console.log("postgres://username:password@hostname:port/database?sslmode=require")
    process.exit(1)
  }

  try {
    console.log("Attempting to connect to database...")
    const sql = neon(process.env.DATABASE_URL)

    // Set up a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000)
    })

    // Race between the connection and the timeout
    const result = await Promise.race([sql`SELECT NOW()`, timeoutPromise])

    console.log("Connection successful!")
    console.log("Current database time:", result[0].now)
    process.exit(0)
  } catch (error) {
    console.error("Connection failed:", error)

    // Provide more detailed error information
    if (error.message.includes("Failed to fetch")) {
      console.log("\nPossible causes:")
      console.log("1. Network connectivity issues")
      console.log("2. Firewall blocking the connection")
      console.log("3. Neon database is not accessible from your current network")
      console.log("4. The database URL is incorrect")

      console.log("\nTroubleshooting steps:")
      console.log("1. Check if you can access the Neon console in your browser")
      console.log("2. Verify your DATABASE_URL is correct and up-to-date")
      console.log("3. Try connecting from a different network")
      console.log("4. Check if your Neon project is active (not suspended)")
    }

    process.exit(1)
  }
}

testConnection()
