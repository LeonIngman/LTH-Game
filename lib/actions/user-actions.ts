"use server"

import { revalidatePath } from "next/cache"
import bcryptjs from "bcryptjs"
import { sql } from "../db"

export async function updateUsername(userId: string, newUsername: string) {
  try {
    if (!userId || !newUsername) {
      return { success: false, error: "User ID and new username are required" }
    }
    if (newUsername.length < 3 || newUsername.length > 20) {
      return { success: false, error: "Username must be between 3 and 20 characters" }
    }

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
  } catch (error: any) {
    console.error("Error updating username:", error)
    return { success: false, error: error.message || "Failed to update username" }
  }
}

export async function createUser(prevState: any, formData: FormData) {
  try {
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

    // Check if username is taken
    const existingUsernames = await sql`SELECT * FROM "User" WHERE username = ${username}`
    if (existingUsernames.length > 0) {
      return { error: "Username is already taken" }
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10)
    // Generate a unique ID
    const id = `user_${Math.random().toString(36).substring(2, 10)}`

    const result = await sql`
      INSERT INTO "User" (id, username, password, role, progress, "lastActive", "createdAt", "updatedAt")
      VALUES (${id}, ${username}, ${hashedPassword}, ${role}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `

    revalidatePath("/dashboard/teacher")
    return { success: true, userId: result[0].id }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" }
  }
}

export async function createBatchUsers(prevState: any, formData: FormData) {
  try {
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
      const hashedPassword = await bcryptjs.hash(currentPassword, 10)
      const id = `user_${Math.random().toString(36).substring(2, 10)}`

      const result = await sql`
        INSERT INTO "User" (id, username, password, role, progress, "lastActive", "createdAt", "updatedAt")
        VALUES (${id}, ${username}, ${hashedPassword}, ${role}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `
      userIds.push(result[0].id)
    }

    revalidatePath("/dashboard/teacher")
    return { success: true, userIds }
  } catch (error) {
    console.error("Error creating batch users:", error)
    return { error: "Failed to create batch users" }
  }
}

export async function updateUserProgress(prevState: any, formData: FormData) {
  try {
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const userId = formData.get("userId") as string
    const progress = Number.parseInt(formData.get("progress") as string)

    if (!userId || isNaN(progress)) {
      return { error: "Invalid input" }
    }

    await sql`
      UPDATE "User" 
      SET progress = ${progress}, "lastActive" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    revalidatePath("/dashboard/teacher")
    revalidatePath("/dashboard/student")
    return { success: true }
  } catch (error) {
    console.error("Error updating progress:", error)
    return { error: "Failed to update progress" }
  }
}

export async function deleteUser(prevState: any, formData: FormData) {
  try {
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const userId = formData.get("userId") as string

    if (!userId) {
      return { error: "User ID is required" }
    }

    await sql`DELETE FROM "User" WHERE id = ${userId}`

    revalidatePath("/dashboard/teacher")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user" }
  }
}

export async function getAllStudents() {
  try {
    const students = await sql`
      SELECT id, username, email, role, progress, "lastActive", "createdAt"
      FROM "User" 
      WHERE role = 'student' 
      ORDER BY "lastActive" DESC
      LIMIT 25
    `
    return students.map((user) => ({
      ...user,
      lastActive: new Date(user.lastActive).toLocaleDateString("sv-SE"),
      createdAt: new Date(user.createdAt).toLocaleDateString("sv-SE"),
    }))
  } catch (error) {
    console.error("Error getting students:", error)
    return []
  }
}

export async function getAllTeachers() {
  try {
    const teachers = await sql`
      SELECT id, username, email, role, progress, "lastActive", "createdAt"
      FROM "User" 
      WHERE role = 'teacher' 
      ORDER BY "lastActive" DESC
      LIMIT 25
    `
    return teachers.map((user) => ({
      ...user,
      lastActive: new Date(user.lastActive).toLocaleDateString("sv-SE"),
      createdAt: new Date(user.createdAt).toLocaleDateString("sv-SE"),
    }))
  } catch (error) {
    console.error("Error getting teachers:", error)
    return []
  }
}

export async function createTeacher(prevState: any, formData: FormData) {
  try {
    if (!formData || typeof formData.get !== "function") {
      console.error("Invalid formData:", formData)
      return { error: "Invalid form submission" }
    }

    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!username || !email) {
      return { error: "Username and email are required" }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address" }
    }

    // Check if username is taken
    const existingUsernames = await sql`SELECT * FROM "User" WHERE username = ${username}`
    if (existingUsernames.length > 0) {
      return { error: "Username is already taken" }
    }

    // Check if email is taken
    const existingEmails = await sql`SELECT * FROM "User" WHERE email = ${email}`
    if (existingEmails.length > 0) {
      return { error: "Email is already taken" }
    }

    // Generate secure password if not provided
    const finalPassword = password || generateSecurePassword()
    
    // Hash the password
    const hashedPassword = await bcryptjs.hash(finalPassword, 10)
    
    // Generate a unique ID
    const id = `user_${Math.random().toString(36).substring(2, 10)}`

    const result = await sql`
      INSERT INTO "User" (id, username, email, password, role, progress, "lastActive", "createdAt", "updatedAt")
      VALUES (${id}, ${username}, ${email}, ${hashedPassword}, 'teacher', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `

    revalidatePath("/dashboard/teacher")
    return { 
      success: true, 
      userId: result[0].id,
      generatedPassword: password ? null : finalPassword // Only return if generated
    }
  } catch (error) {
    console.error("Error creating teacher:", error)
    return { error: "Failed to create teacher" }
  }
}

// Function to generate a secure password
function generateSecurePassword(length = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  // Ensure at least one character from each category
  let password = ""
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
