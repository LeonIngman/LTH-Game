import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import crypto from "crypto"

import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Parse the request body
    let username, password
    try {
      const body = await request.json()
      username = body.username
      password = body.password
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return new NextResponse(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!username || !password) {
      return new NextResponse(JSON.stringify({ error: "Username and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Real user login only (demo mode removed)
    try {
      const users = await sql`SELECT * FROM "User" WHERE username = ${username}`
      if (!users || users.length === 0) {
        return new NextResponse(JSON.stringify({ error: "Invalid username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }
      const user = users[0]

      // Password check
      let isPasswordValid = false
      if (user.password.startsWith("$2")) {
        isPasswordValid = await bcryptjs.compare(password, user.password)
      } else {
        isPasswordValid = user.password === password
      }
      if (!isPasswordValid) {
        return new NextResponse(JSON.stringify({ error: "Invalid username or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Update last active
      try {
        await sql`UPDATE "User" SET "lastActive" = CURRENT_TIMESTAMP WHERE id = ${user.id}`
      } catch (updateError) {
        console.error("Error updating last active timestamp:", updateError)
      }

      // Generate a secure random session ID
      const sessionId = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

      // Store session in DB
      await sql`
        INSERT INTO "Session" (id, user_id, expires_at)
        VALUES (${sessionId}, ${user.id}, ${expiresAt})
      `

      // Set session cookie
      try {
        const cookieStore = await cookies()
        cookieStore.set("auth_session", sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax",
        })
      } catch (cookieError) {
        console.error("Error setting cookie:", cookieError)
      }

      // Prepare user data and redirect
      const { password: _, ...userData } = user
      let dashboardUrl = "/dashboard"
      if (userData.role === "teacher") dashboardUrl = "/dashboard/teacher"
      else if (userData.role === "student") dashboardUrl = "/dashboard/student"

      return new NextResponse(
        JSON.stringify({
          user: {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            progress: userData.progress,
          },
          redirect: dashboardUrl,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    } catch (dbError) {
      console.error("Database error during login:", dbError)
      return new NextResponse(JSON.stringify({ error: "Database error. Please try again later." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Password hashing example (to be run separately, not in the request handler)
// const bcrypt = require("bcryptjs");
// const password = "password123"; // replace with the user's real password
// bcrypt.hash(password, 10).then(hash => console.log(hash));
