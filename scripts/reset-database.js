const { Pool } = require("pg");
const readline = require("readline");

// Prefer DATABASE_URL if set, otherwise use individual DB_* vars
const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      host: "localhost",
      port: 5432,
      database: "supply_chain_game",
    };

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function resetDatabase() {
  console.log("⚠️ WARNING: This will reset all data in your database!");
  console.log(
    "All user progress, performances, and game data will be deleted."
  );

  const confirm = await askQuestion(
    'Are you sure you want to continue? (type "RESET" to confirm): '
  );

  if (confirm !== "RESET") {
    console.log("Database reset cancelled.");
    rl.close();
    return;
  }

  console.log("🔄 Resetting database...");

  // Connect to database
  const pool = new Pool(config);

  try {
    // Disable foreign key checks temporarily to avoid constraint errors
    await pool.query("BEGIN");

    // Delete data from tables in the correct order to respect foreign key constraints
    console.log("Deleting Performance data...");
    await pool.query('DELETE FROM "Performance"');

    console.log("Deleting TimeStamp data...");
    await pool.query('DELETE FROM "TimeStamp"');

    console.log("Deleting User data...");
    await pool.query('DELETE FROM "User"');

    console.log("Deleting GameLevel data...");
    await pool.query('DELETE FROM "GameLevel"');

    // Check for and delete data from quiz tables if they exist
    try {
      console.log("Checking for quiz tables...");
      const quizTablesExist = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'QuizQuestion'
        )
      `);

      if (quizTablesExist.rows[0].exists) {
        console.log("Deleting quiz data...");
        await pool.query('DELETE FROM "QuizResponse"');
        await pool.query('DELETE FROM "QuizQuestion"');
      }
    } catch (err) {
      console.log("No quiz tables found, skipping.");
    }

    // Commit the transaction
    await pool.query("COMMIT");

    console.log("✅ Database reset successfully!");
    console.log(
      "\nYou can now run the following scripts to re-seed your database:"
    );
    console.log("1. node scripts/setup-local-database.js");
    console.log("2. node scripts/seed-timestamps.js");
    console.log("3. node scripts/create-test-user.js");
  } catch (err) {
    // Rollback in case of error
    await pool.query("ROLLBACK");
    console.error("❌ Error resetting database:", err);
  } finally {
    await pool.end();
    rl.close();
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the script
resetDatabase();
