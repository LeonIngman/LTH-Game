#!/usr/bin/env node

// Simple test script to verify leaderboard data fetching
require("dotenv").config({ path: ".env.local" });

async function testLeaderboard() {
  try {
    // Import the leaderboard function
    const { getLeaderboard } = require("./lib/actions/leaderboard-actions.ts");

    console.log("Testing leaderboard data fetching...");
    const result = await getLeaderboard();

    console.log("\nLeaderboard Results:");
    console.log("===================");

    // Filter for leoningman-student2 specifically
    const student2Data = result.filter((r) =>
      r.username.includes("leoningman-student2")
    );

    if (student2Data.length > 0) {
      console.log("\nFound leoningman-student2 data:");
      student2Data.forEach((entry) => {
        console.log(
          `Level ${entry.level}: ${entry.profit} kr (Day ${
            entry.day
          }) - Source: ${entry.source || "unknown"}`
        );
      });
    } else {
      console.log("\nNo data found for leoningman-student2");
    }

    // Show all results for context
    console.log("\nAll results:");
    result.forEach((entry) => {
      console.log(
        `${entry.username} - Level ${entry.level}: ${entry.profit} kr (Day ${entry.day})`
      );
    });
  } catch (error) {
    console.error("Error testing leaderboard:", error);
  }
}

testLeaderboard();
