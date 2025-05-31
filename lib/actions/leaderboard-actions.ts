"use server"

import { sql } from "../db"

// Mock leaderboard data for demo mode or when database connection fails
const mockLeaderboardData = [
  {
    id: "student-1",
    username: "TopStudent",
    progress: 3,
    profit: 85000,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-18",
  },
  {
    id: "student-2",
    username: "LogisticsWiz",
    progress: 3,
    profit: 72500,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-17",
  },
  {
    id: "student-3",
    username: "SupplyChainMaster",
    progress: 2,
    profit: 63000,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-15",
  },
  {
    id: "student-4",
    username: "InventoryPro",
    progress: 2,
    profit: 58200,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-14",
  },
  {
    id: "student-5",
    username: "ShippingExpert",
    progress: 1,
    profit: 42000,
    level: 0,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-12",
  },
  {
    id: "student-demo-456",
    username: "DemoStudent",
    progress: 1,
    profit: 38500,
    level: 0,
    lastActive: new Date().toLocaleDateString(),
    levelCompletedDate: "2023-05-10",
  },
]

export async function getLeaderboard() {
  try {
    const users = await sql`
      SELECT 
        id, 
        username, 
        progress, 
        0 as profit,
        progress as level,
        "lastActive",
        NULL as "levelCompletedDate"
      FROM "User"
      WHERE role = 'student'
      ORDER BY progress DESC, "lastActive" DESC
    `

    return users.map((user) => ({
      ...user,
      profit: user.profit || 0,
      level: user.level || 0,
      lastActive: new Date(user.lastActive).toLocaleDateString(),
      levelCompletedDate: user.levelCompletedDate || null,
    }))
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    // Return mock data as fallback when database query fails
    console.log("Falling back to mock leaderboard data due to database error")
    return mockLeaderboardData
  }
}

export async function getLeaderboardByLevel(levelId: number) {
  try {
    const users = await sql`
      SELECT 
        u.id, 
        u.username, 
        u.progress, 
        COALESCE(p.profit, 0) as profit,
        p.level_id as level,
        u."lastActive",
        TO_CHAR(p.completed_at, 'YYYY-MM-DD') as "levelCompletedDate"
      FROM "User" u
      JOIN (
        SELECT 
          user_id, 
          level_id, 
          MAX(cumulative_profit) as profit,
          MAX(created_at) as completed_at
        FROM "Performance"
        WHERE level_id = ${levelId}
        GROUP BY user_id, level_id
      ) p ON u.id = p.user_id
      WHERE u.role = 'student' 
      ORDER BY p.profit DESC, u."lastActive" DESC
    `

    return users.map((user) => ({
      ...user,
      profit: user.profit || 0,
      level: user.level || 0,
      lastActive: new Date(user.lastActive).toLocaleDateString(),
      levelCompletedDate: user.levelCompletedDate || null,
    }))
  } catch (error) {
    console.error(`Error getting leaderboard for level ${levelId}:`, error)
    // Return filtered mock data as fallback when database query fails
    console.log(`Falling back to mock leaderboard data for level ${levelId} due to database error`)
    return mockLeaderboardData.filter((user) => user.level === levelId)
  }
}
