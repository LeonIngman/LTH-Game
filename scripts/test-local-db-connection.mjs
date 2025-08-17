// scripts/test-local-db-connection.mjs
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" }); // Load .env.local

async function testLocalConnection() {
  console.log("Attempting to connect to local PostgreSQL database...");

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error(
      "❌ DATABASE_URL is not set. Please set it in your .env.local file or environment."
    );
    process.exit(1);
  }

  console.log(
    `Connecting with DATABASE_URL: ${dbUrl.replace(
      /:([^:@]*?)@/,
      ":********@"
    )}`
  ); // Mask password

  const pool = new Pool({
    connectionString: dbUrl,
    // Optional: Add connection timeout if needed
    // connectionTimeoutMillis: 5000, // 5 seconds
  });

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to the database!");

    console.log("Attempting to execute a simple query (SELECT NOW())...");
    const result = await client.query("SELECT NOW()");
    console.log(
      "✅ Query successful! Current database time:",
      result.rows[0].now
    );

    client.release(); // Release the client back to the pool
    console.log("✅ Client released.");
  } catch (error) {
    console.error("❌ Database connection or query failed:");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        "\nHint: Connection refused. Is your PostgreSQL server running on localhost:5432?"
      );
    } else if (
      error.code === "28P01" ||
      error.message.includes("password authentication failed")
    ) {
      console.error(
        "\nHint: Password authentication failed for user 'gustav'. Check your password and pg_hba.conf settings."
      );
    } else if (error.code === "3D000") {
      console.error(
        `\nHint: Database 'supply_chain_game' does not exist. Did you create it?`
      );
    } else {
      console.error(
        "\nHint: Check your DATABASE_URL, PostgreSQL server status, and network configuration."
      );
    }
    process.exit(1);
  } finally {
    await pool.end(); // Close all connections in the pool
    console.log("🏁 Database pool closed.");
  }
}

testLocalConnection();
