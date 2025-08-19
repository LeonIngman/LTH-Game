import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import crypto from "crypto"

import { sql } from "@/lib/db"
import { getSecurityHeaders, logAuthError } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Parse the request body
    let username, password
    try {
      const body = await request.json()
      username = body.username
      password = body.password
    } catch (parseError) {
      logAuthError('Login attempt with invalid request format', { parseError: parseError instanceof Error ? parseError.message : 'Unknown' })
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Input validation
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      logAuthError('Login attempt with missing or invalid credentials', { username: username || 'undefined' })
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Rate limiting logging
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    logAuthError('Login attempt', { username, clientIP })

    // Find user by username
    let user = null
    try {
      const users = await sql`SELECT * FROM "User" WHERE username = ${username}`
      user = users && users.length > 0 ? users[0] : null
    } catch (dbError) {
      logAuthError('Database error during user lookup', { username, error: dbError instanceof Error ? dbError.message : 'Unknown' })
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Consistent timing for both valid and invalid users to prevent enumeration
    let isPasswordValid = false
    if (user && user.password) {
      if (user.password.startsWith("$2")) {
        isPasswordValid = await bcryptjs.compare(password, user.password)
      } else {
        isPasswordValid = user.password === password
      }
    } else {
      // Still run bcrypt to maintain consistent timing
      await bcryptjs.compare(password, '$2a$12$dummyHashToPreventTiming.Attack.Vector.12345')
    }

    if (!isPasswordValid || !user) {
      logAuthError('Invalid login credentials', { username, userExists: !!user })
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401, headers: getSecurityHeaders() }
      )
    }

    // Update last active
    try {
      await sql`UPDATE "User" SET "lastActive" = CURRENT_TIMESTAMP WHERE id = ${user.id}`
    } catch (updateError) {
      logAuthError('Error updating last active timestamp', { userId: user.id, error: updateError instanceof Error ? updateError.message : 'Unknown' })
      // Continue with login process even if update fails
    }

    // Generate a secure random session ID
    const sessionId = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    // Store session in DB
    try {
      await sql`
        INSERT INTO "Session" (id, user_id, expires_at)
        VALUES (${sessionId}, ${user.id}, ${expiresAt})
      `
    } catch (sessionError) {
      logAuthError('Error creating session', { userId: user.id, error: sessionError instanceof Error ? sessionError.message : 'Unknown' })
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

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
      logAuthError('Error setting cookie', { userId: user.id, error: cookieError instanceof Error ? cookieError.message : 'Unknown' })
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Prepare user data and redirect
    const { password: _, ...userData } = user
    let dashboardUrl = "/dashboard"
    if (userData.role === "teacher") dashboardUrl = "/dashboard/teacher"
    else if (userData.role === "student") dashboardUrl = "/dashboard/student"

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          role: userData.role,
          progress: userData.progress,
        },
        redirect: dashboardUrl,
      },
      { headers: getSecurityHeaders() }
    )

  } catch (error) {
    logAuthError('Login endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' })

    // Don't leak error details to client
    return NextResponse.json(
      { success: false, error: "Authentication service temporarily unavailable" },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

// Password hashing example (to be run separately, not in the request handler)
// const bcrypt = require("bcryptjs");
// const password = "password123"; // replace with the user's real password
// bcrypt.hash(password, 10).then(hash => console.log(hash));
