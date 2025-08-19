// Script to create a test user in the local PostgreSQL database for development and testing purposes.
// Prompts for username, email, password, and role, then inserts the user into the database.
import { Pool } from "pg";
import bcrypt from "bcryptjs"; // Use bcryptjs instead of crypto for password hashing
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Prefer DATABASE_URL if set, otherwise use individual DB_* vars
const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || "user",
      password: process.env.DB_PASSWORD || "",
      host: "localhost",
      port: 5432,
      database: "supply_chain_game",
    };

console.log(
  "DB password type:",
  typeof process.env.DB_PASSWORD,
  "value:",
  process.env.DB_PASSWORD
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createTestUser() {
  console.log("🧪 Creating a test user for local development...");

  // Get user input
  const username =
    (await askQuestion("Enter username (default: testuser): ")) || "testuser";
  const email =
    (await askQuestion("Enter email (default: test@example.com): ")) ||
    "test@example.com";
  const password =
    (await askQuestion("Enter password (default: password123): ")) ||
    "password123";
  const role =
    (await askQuestion("Enter role (student/teacher, default: student): ")) ||
    "student";

  // Connect to database
  const pool = new Pool(config);

  try {
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM "User" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      console.log("⚠️ User with this username or email already exists!");
      const overwrite = await askQuestion("Do you want to overwrite? (y/n): ");

      if (overwrite.toLowerCase() !== "y") {
        console.log("❌ User creation cancelled.");
        return;
      }

      // Delete existing user
      await pool.query('DELETE FROM "User" WHERE username = $1 OR email = $2', [
        username,
        email,
      ]);
      console.log("Existing user deleted.");
    }

    // Hash the password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await pool.query(
      `INSERT INTO "User" (id, username, email, password, visible_password, role, progress, "lastActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        crypto.randomUUID(), // Generate a UUID for the id
        username,
        email,
        hashedPassword,
        password, // Store visible password for development
        role,
        3, // Initial progress
        new Date(), // lastActive
        new Date(), // createdAt
        new Date(), // updatedAt
      ]
    );

    // Verify user was inserted
    const verifyRes = await pool.query(
      'SELECT id, username, email, role FROM "User" WHERE username = $1',
      [username]
    );
    if (verifyRes.rows.length === 1) {
      console.log("✅ Test user verified in database!");
      console.log("\nUser details from DB:");
      console.table(verifyRes.rows);
    } else {
      console.error("❌ User was not found in the database after insert!");
    }

    console.log("✅ Test user created successfully!");
    console.log("\nUser details:");
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
  } catch (err) {
    console.error("❌ Error creating test user:", err);
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
createTestUser();
