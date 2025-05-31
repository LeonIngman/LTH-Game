// Run this script with: node scripts/run-demo.js
require("dotenv").config({ path: ".env.local" })
const { spawn } = require("child_process")

console.log("Starting application in DEMO MODE...")
console.log("This will use mock data instead of connecting to a database")

// Set environment variables
process.env.DEMO_MODE = "true"

// Spawn the Next.js dev server
const nextDev = spawn("npx", ["next", "dev"], {
  env: { ...process.env, DEMO_MODE: "true" },
  stdio: "inherit",
})

nextDev.on("close", (code) => {
  console.log(`Next.js dev server exited with code ${code}`)
})
