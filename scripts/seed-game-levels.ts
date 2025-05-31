import { executeSqlTemplate as sql } from "../lib/db"

async function seedGameLevels() {
  try {
    // Example data - replace with your actual game level data
    const levels = [
      { level_number: 1, description: "Easy level", difficulty: "easy" },
      { level_number: 2, description: "Medium level", difficulty: "medium" },
      { level_number: 3, description: "Hard level", difficulty: "hard" },
    ];

    for (const level of levels) {
      await sql`
        INSERT INTO game_levels (level_number, description, difficulty)
        VALUES (${level.level_number}, ${level.description}, ${level.difficulty})
        ON CONFLICT (level_number) DO NOTHING; -- Skip if level already exists
      `;
      console.log(`Seeded level ${level.level_number}`);
    }

    console.log("Game levels seeded successfully!");
  } catch (error) {
    console.error("Failed to seed game levels:", error);
  }
}

seedGameLevels();
