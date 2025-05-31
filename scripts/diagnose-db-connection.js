// Run this script with: node scripts/diagnose-db-connection.js
require("dotenv").config({ path: ".env.local" })
const { neon, neonConfig } = require("@neondatabase/serverless")
const https = require("https")
const dns = require("dns")
const { promisify } = require("util")

// Configure neon for better connection handling
neonConfig.fetchConnectionCache = true
neonConfig.wsProxy = true
neonConfig.useSecureWebSocket = true

const dnsLookup = promisify(dns.lookup)
const dnsResolve = promisify(dns.resolve)

async function checkNetworkConnectivity() {
  console.log("\n--- Network Connectivity Check ---")

  try {
    // Check if we can resolve google.com
    console.log("Testing DNS resolution...")
    const address = await dnsLookup("google.com")
    console.log(`✅ DNS resolution working: google.com -> ${address.address}`)

    // Check if we can connect to google.com
    console.log("Testing HTTPS connectivity...")
    await new Promise((resolve, reject) => {
      const req = https.get("https://www.google.com", (res) => {
        console.log(`✅ HTTPS connectivity working: Status code ${res.statusCode}`)
        res.on("data", () => {})
        res.on("end", resolve)
      })

      req.on("error", reject)
      req.end()
    })

    return true
  } catch (error) {
    console.error("❌ Network connectivity issue:", error.message)
    return false
  }
}

async function checkDatabaseUrl() {
  console.log("\n--- Database URL Check ---")

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set")
    return false
  }

  try {
    const url = new URL(process.env.DATABASE_URL)
    console.log("✅ Connection string format is valid")

    // Check protocol
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      console.error(`❌ Invalid protocol: ${url.protocol}. Should be postgres: or postgresql:`)
      return false
    }
    console.log("✅ Protocol is valid:", url.protocol)

    // Check hostname
    if (!url.hostname || !url.hostname.includes("neon.tech")) {
      console.warn(`⚠️ Hostname might not be a Neon hostname: ${url.hostname}`)
    } else {
      console.log("✅ Hostname appears to be a Neon hostname:", url.hostname)
    }

    // Check if hostname can be resolved
    try {
      console.log(`Attempting to resolve hostname: ${url.hostname}...`)
      const addresses = await dnsResolve(url.hostname)
      console.log(`✅ Hostname resolution successful: ${addresses.join(", ")}`)
    } catch (dnsError) {
      console.error(`❌ Cannot resolve hostname: ${url.hostname}. Error:`, dnsError.message)
      return false
    }

    // Check port
    if (url.port && url.port !== "5432" && url.port !== "443") {
      console.warn(`⚠️ Unusual port: ${url.port}. Common ports are 5432 or 443`)
    } else {
      console.log("✅ Port is valid:", url.port || "default (5432)")
    }

    // Check credentials
    if (!url.username) {
      console.error("❌ Username is missing")
      return false
    }
    console.log("✅ Username is present:", url.username)

    if (!url.password) {
      console.error("❌ Password is missing")
      return false
    }
    console.log("✅ Password is present: ****")

    // Check database name
    const dbName = url.pathname.substring(1)
    if (!dbName) {
      console.error("❌ Database name is missing")
      return false
    }
    console.log("✅ Database name is present:", dbName)

    // Check SSL mode
    const sslMode = url.searchParams.get("sslmode")
    if (!sslMode) {
      console.warn("⚠️ SSL mode not specified. Neon requires sslmode=require")
    } else if (sslMode !== "require") {
      console.warn(`⚠️ SSL mode is ${sslMode}, but Neon requires sslmode=require`)
    } else {
      console.log("✅ SSL mode is correctly set to:", sslMode)
    }

    return true
  } catch (parseError) {
    console.error("❌ Invalid connection string format:", parseError.message)
    console.log("Connection string should be in format:")
    console.log("postgres://username:password@hostname:port/database?sslmode=require")
    return false
  }
}

async function testDatabaseConnection() {
  console.log("\n--- Database Connection Test ---")

  try {
    console.log("Attempting to connect to database...")
    const sql = neon(process.env.DATABASE_URL)

    // Set up a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000)
    })

    // Race between the connection and the timeout
    const result = await Promise.race([sql`SELECT NOW()`, timeoutPromise])

    console.log("✅ Connection successful!")
    console.log("Current database time:", result[0].now)
    return true
  } catch (error) {
    console.error("❌ Connection failed:", error.message)
    return false
  }
}

async function diagnose() {
  console.log("=== Neon Database Connection Diagnostic Tool ===")

  // Step 1: Check network connectivity
  const networkOk = await checkNetworkConnectivity()
  if (!networkOk) {
    console.log("\n❌ Network connectivity issues detected. Please check your internet connection.")
    return
  }

  // Step 2: Check database URL
  const urlOk = await checkDatabaseUrl()
  if (!urlOk) {
    console.log("\n❌ Database URL issues detected. Please check your DATABASE_URL environment variable.")
    return
  }

  // Step 3: Test database connection
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.log("\n❌ Database connection failed. Possible causes:")
    console.log("1. Neon database is not accessible from your current network")
    console.log("2. The database credentials are incorrect")
    console.log("3. The database server is down or the project is suspended")
    console.log("4. There's a firewall blocking the connection")

    console.log("\nTroubleshooting steps:")
    console.log("1. Verify your DATABASE_URL is correct in the Neon console")
    console.log("2. Check if your Neon project is active (not suspended)")
    console.log("3. Try connecting from a different network")
    console.log("4. Contact Neon support if the issue persists")
    return
  }

  console.log("\n✅ All checks passed! Your database connection is working correctly.")
}

diagnose().catch(console.error)
