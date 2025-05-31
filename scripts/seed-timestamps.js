const { Pool } = require("pg")

// Configuration - update these values for your local PostgreSQL setup
const config = {
  user: "postgres",
  password: "postgres", // Change this to your local PostgreSQL password
  host: "localhost",
  port: 5432,
  database: "supply_chain_game", // Your database name
}

async function seedTimestamps() {
  console.log("🕒 Seeding timestamps for game levels...")

  // Connect to database
  const pool = new Pool(config)

  try {
    // Check if timestamps already exist
    const existingTimestamps = await pool.query('SELECT COUNT(*) as count FROM "TimeStamp"')

    if (Number.parseInt(existingTimestamps.rows[0].count) > 0) {
      console.log(`Found ${existingTimestamps.rows[0].count} existing timestamps, skipping seed.`)
      return
    }

    console.log("No timestamps found. Seeding the TimeStamp table...")

    // Generate timestamps for each level
    for (let levelId = 0; levelId <= 3; levelId++) {
      console.log(`Generating timestamps for Level ${levelId}...`)

      // Generate 30 days of timestamps for each level
      for (let day = 1; day <= 30; day++) {
        // Generate random market data with some patterns
        const marketDemand = Math.floor(80 + Math.random() * 40) // Between 80-120

        // Prices fluctuate but follow trends
        const basePriceA = 10 + levelId * 2 // Higher levels have higher base prices
        const basePriceB = 15 + levelId * 2.5
        const baseFinishedPrice = 50 + levelId * 10

        // Add some price fluctuation
        const fluctuationA = Math.sin(day / 5) * 2 + (Math.random() * 2 - 1)
        const fluctuationB = Math.cos(day / 4) * 2.5 + (Math.random() * 2 - 1)
        const fluctuationFinished = Math.sin(day / 3) * 5 + (Math.random() * 4 - 2)

        const rawMaterialAPrice = Number.parseFloat((basePriceA + fluctuationA).toFixed(2))
        const rawMaterialBPrice = Number.parseFloat((basePriceB + fluctuationB).toFixed(2))
        const finishedGoodPrice = Number.parseFloat((baseFinishedPrice + fluctuationFinished).toFixed(2))

        // Insert the timestamp
        await pool.query(
          `INSERT INTO "TimeStamp" (levelId, "timestampNumber", "marketDemand", 
                                   "rawMaterialAPrice", "rawMaterialBPrice", "finishedGoodPrice")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [levelId, day, marketDemand, rawMaterialAPrice, rawMaterialBPrice, finishedGoodPrice],
        )
      }

      console.log(`✅ Generated 30 timestamps for Level ${levelId}`)
    }

    console.log("✅ All timestamps seeded successfully!")
  } catch (err) {
    console.error("❌ Error seeding timestamps:", err)
  } finally {
    await pool.end()
  }
}

// Run the script
seedTimestamps()
