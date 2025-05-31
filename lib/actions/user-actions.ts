"use server"

import { revalidatePath } from "next/cache"
import bcryptjs from "bcryptjs"

import { sql } from "../db"
import { isV0Preview, shouldUseDemoMode } from "../v0-detection"

// Mock student data for demo mode
const mockStudentsData = [
  {
    id: "student-1",
    username: "TopStudent",
    visible_password: "pass123",
    progress: 3,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "student-2",
    username: "LogisticsWiz",
    visible_password: "pass123",
    progress: 3,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "student-3",
    username: "SupplyChainMaster",
    visible_password: "pass123",
    progress: 2,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "student-4",
    username: "InventoryPro",
    visible_password: "pass123",
    lastActive: new Date().toLocaleDateString(),
    progress: 2,
  },
  {
    id: "student-5",
    username: "ShippingExpert",
    visible_password: "pass123",
    progress: 1,
    lastActive: new Date().toLocaleDateString(),
  },
]

// Add the updateUsername function
export async function updateUsername(userId: string, newUsername: string) {
  try {
    // Validate inputs
    if (!userId || !newUsername) {
      return { success: false, error: "User ID and new username are required" }
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      return { success: false, error: "Username must be between 3 and 20 characters" }
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      console.log(`[DEMO] Updating username for user ${userId} to ${newUsername}`)
      return { success: true }
    }

    try {
      // Check if username is already taken
      const existingUsers = await sql`SELECT id FROM "User" WHERE username = ${newUsername} AND id != ${userId}`

      if (existingUsers.length > 0) {
        return { success: false, error: "Username is already taken" }
      }

      // Store the original username for reference (if it starts with "Group-")
      const userResult = await sql`SELECT username FROM "User" WHERE id = ${userId}`

      if (userResult.length === 0) {
        return { success: false, error: "User not found" }
      }

      const originalUsername = userResult[0].username

      // Update the username
      await sql`
        UPDATE "User" 
        SET 
          username = ${newUsername},
          "originalGroupName" = CASE 
            WHEN ${originalUsername} LIKE 'Group-%' THEN ${originalUsername}
            ELSE "originalGroupName"
          END,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `

      revalidatePath("/dashboard/student")
      revalidatePath("/dashboard/teacher")

      return { success: true }
    } catch (dbError) {
      console.error("Database error updating username:", dbError)
      return { success: false, error: "Database error. Please try again later." }
    }
  } catch (error: any) {
    console.error("Error updating username:", error)
    return { success: false, error: error.message || "Failed to update username" }
  }
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    // Check if formData is actually a FormData object
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const role = (formData.get("role") as string) || "student"

    if (!username || !password) {
      return { error: "All fields are required" }
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      return { success: true, userId: `demo-${Math.random().toString(36).substring(2, 10)}` }
    }

    try {
      // Check if username is taken
      const existingUsernames = await sql`SELECT * FROM "User" WHERE username = ${username}`

      if (existingUsernames.length > 0) {
        return { error: "Username is already taken" }
      }

      // Hash the password
      const hashedPassword = await bcryptjs.hash(password, 10)

      // Generate a unique ID
      const id = `user_${Math.random().toString(36).substring(2, 10)}`

      // Create user
      const result = await sql`
        INSERT INTO "User" (id, username, password, visible_password, role, progress, "lastActive", "createdAt", "updatedAt")
        VALUES (${id}, ${username}, ${hashedPassword}, ${password}, ${role}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `

      revalidatePath("/dashboard/teacher")
      return { success: true, userId: result[0].id }
    } catch (dbError) {
      console.error("Database error creating user:", dbError)
      return { error: "Database error. Please try again later." }
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" }
  }
}

export async function createBatchUsers(prevState: any, formData: FormData) {
  try {
    // Check if formData is actually a FormData object
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const batchDataStr = formData.get("batchData") as string
    const role = (formData.get("role") as string) || "student"

    if (!batchDataStr) {
      return { error: "Batch data is required" }
    }

    const batchData = JSON.parse(batchDataStr)
    const { prefix, count, useCustomPasswords, password, customPasswords } = batchData

    if (!prefix || !count || count < 1) {
      return { error: "Invalid batch data" }
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      const mockIds = Array(count)
        .fill(0)
        .map(() => `demo-${Math.random().toString(36).substring(2, 10)}`)
      return { success: true, userIds: mockIds }
    }

    try {
      const userIds = []

      // Check for existing usernames first
      const usernamesToCreate = []
      for (let i = 1; i <= count; i++) {
        usernamesToCreate.push(`Group-${i}`)
      }

      const existingUsernamesResult = await sql`
        SELECT username FROM "User" 
        WHERE username = ANY(${usernamesToCreate})
      `

      const existingUsernames = existingUsernamesResult.map((row) => row.username)
      if (existingUsernames.length > 0) {
        return {
          error: `Some group IDs already exist: ${existingUsernames.join(", ")}`,
        }
      }

      // Create users one by one
      for (let i = 1; i <= count; i++) {
        const username = `Group-${i}`
        const currentPassword = useCustomPasswords ? customPasswords[i - 1] : password

        // Hash the password
        const hashedPassword = await bcryptjs.hash(currentPassword, 10)

        // Generate a unique ID
        const id = `user_${Math.random().toString(36).substring(2, 10)}`

        // Create user
        const result = await sql`
          INSERT INTO "User" (id, username, password, visible_password, role, progress, "lastActive", "createdAt", "updatedAt")
          VALUES (${id}, ${username}, ${hashedPassword}, ${currentPassword}, ${role}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `

        userIds.push(result[0].id)
      }

      revalidatePath("/dashboard/teacher")
      return { success: true, userIds }
    } catch (dbError) {
      console.error("Database error creating batch users:", dbError)
      return { error: "Database error. Please try again later." }
    }
  } catch (error) {
    console.error("Error creating batch users:", error)
    return { error: "Failed to create batch users" }
  }
}

export async function updateUserProgress(prevState: any, formData: FormData) {
  try {
    // Check if formData is actually a FormData object
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const userId = formData.get("userId") as string
    const progress = Number.parseInt(formData.get("progress") as string)

    if (!userId || isNaN(progress)) {
      return { error: "Invalid input" }
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      return { success: true }
    }

    try {
      await sql`
        UPDATE "User" 
        SET progress = ${progress}, "lastActive" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `

      revalidatePath("/dashboard/teacher")
      revalidatePath("/dashboard/student")
      return { success: true }
    } catch (dbError) {
      console.error("Database error updating progress:", dbError)
      return { error: "Database error. Please try again later." }
    }
  } catch (error) {
    console.error("Error updating progress:", error)
    return { error: "Failed to update progress" }
  }
}

export async function deleteUser(prevState: any, formData: FormData) {
  try {
    // Check if formData is actually a FormData object
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const userId = formData.get("userId") as string

    if (!userId) {
      return { error: "User ID is required" }
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      return { success: true }
    }

    try {
      await sql`DELETE FROM "User" WHERE id = ${userId}`

      revalidatePath("/dashboard/teacher")
      return { success: true }
    } catch (dbError) {
      console.error("Database error deleting user:", dbError)
      return { error: "Database error. Please try again later." }
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user" }
  }
}

export async function getAllStudents() {
  // If in demo mode or v0 preview, return mock data
  if (shouldUseDemoMode() || isV0Preview()) {
    console.log("Using mock students data")
    return mockStudentsData
  }

  try {
    const students = await sql`
      SELECT id, username, visible_password, progress, "lastActive" 
      FROM "User" 
      WHERE role = 'student' 
      ORDER BY username ASC
    `

    return students.map((user) => ({
      ...user,
      lastActive: new Date(user.lastActive).toLocaleDateString(),
    }))
  } catch (error) {
    console.error("Error getting students:", error)
    // Return mock data as fallback when database query fails
    console.log("Falling back to mock students data due to database error")
    return mockStudentsData
  }
}
