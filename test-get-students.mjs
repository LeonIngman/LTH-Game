import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

import { sql } from "./lib/db.js";

async function testGetAllStudents() {
  try {
    console.log("Testing getAllStudents query...");
    const students = await sql`
      SELECT id, username, email, role, progress, "lastActive", "createdAt"
      FROM "User" 
      WHERE role = 'student' 
      ORDER BY "lastActive" DESC
      LIMIT 25
    `;

    const formattedStudents = students.map((user) => ({
      ...user,
      lastActive: new Date(user.lastActive).toLocaleDateString("sv-SE"),
      createdAt: new Date(user.createdAt).toLocaleDateString("sv-SE"),
    }));

    console.log("\nStudents found:");
    console.table(formattedStudents);
    console.log(`\nTotal students: ${formattedStudents.length}`);
  } catch (error) {
    console.error("Error testing getAllStudents:", error);
  } finally {
    process.exit(0);
  }
}

testGetAllStudents();
