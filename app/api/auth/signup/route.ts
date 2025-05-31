import { type NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"

import { sql } from "@/lib/db"
import { isV0Preview, shouldUseDemoMode } from "@/lib/v0-detection"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      return NextResponse.json({ message: "Account created successfully" }, { status: 201 })
    }

    // Check if username already exists
    const existingUsers = await sql`SELECT * FROM "User" WHERE username = ${username}`

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Generate a unique ID
    const id = `user_${Math.random().toString(36).substring(2, 10)}`

    // Create user
    await sql`
      INSERT INTO "User" (id, username, password, visible_password, role, progress, "lastActive", "createdAt", "updatedAt")
      VALUES (${id}, ${username}, ${hashedPassword}, ${password}, 'student', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error in signup:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
