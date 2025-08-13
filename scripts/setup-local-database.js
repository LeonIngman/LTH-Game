const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

// For database creation, we need to connect to the default 'postgres' database first
// Extract connection details from DATABASE_URL if available
let config;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  config = {
    user: url.username || "leoningman",
    password: url.password || "",
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 5432,
    database: "postgres", // Connect to default database first
  };
} else {
  config = {
    user: process.env.DB_USER || "leoningman",
    password: process.env.DB_PASSWORD || "",
    host: "localhost",
    port: 5432,
    database: "postgres",
  };
}

// Database name to create
const DB_NAME = "supply_chain_game";

async function setupDatabase() {
  console.log("🚀 Starting local database setup...");

  // Connect to default database to create our application database
  let pool = new Pool(config);

  try {
    // Create database if it doesn't exist
    const dbCheckResult = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (dbCheckResult.rows.length === 0) {
      await pool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database ${DB_NAME} created!`);
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }
    await pool.end();

    // Connect to the new database
    pool = new Pool({ ...config, database: DB_NAME });

    // Read and execute the schema SQL file
    const createTablesSql = fs.readFileSync(
      path.join(__dirname, "..", "sql", "create-tables.sql"),
      "utf8"
    );
    await pool.query(createTablesSql);
    console.log("✅ Main tables created successfully!");

    // Read and execute the schema SQL file
    const createGameTablesSql = fs.readFileSync(
      path.join(__dirname, "..", "sql", "create-game-tables.sql"),
      "utf8"
    );
    await pool.query(createGameTablesSql);
    console.log("✅ Game tables created successfully!");

    // Read and execute the schema SQL file
    const createQuizTablesSql = fs.readFileSync(
      path.join(__dirname, "..", "sql", "create-quiz-tables.sql"),
      "utf8"
    );
    await pool.query(createQuizTablesSql);
    console.log("✅ Quiz tables created successfully!");

    // Ensure Performance table has required columns
    await pool.query(`
      ALTER TABLE "Performance"
      ADD COLUMN IF NOT EXISTS "hasDetailedData" boolean DEFAULT false NOT NULL;
    `);
    await pool.query(`
      ALTER TABLE "Performance"
      ADD COLUMN IF NOT EXISTS "cashFlow" numeric DEFAULT 0 NOT NULL;
    `);
    console.log(
      "✅ Ensured Performance table has hasDetailedData and cashFlow columns."
    );

    // Optionally: seed data here if needed

    // Print connection string for .env
    console.log("\nAdd this to your .env.local file:");
    console.log(
      `DATABASE_URL=postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${DB_NAME}`
    );
  } catch (err) {
    console.error("❌ Error setting up database:", err);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
