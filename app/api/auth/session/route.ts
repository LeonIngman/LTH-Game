import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    let sessionId = null
    try {
      const cookieStore = await cookies()
      sessionId = cookieStore.get("auth_session")?.value
      console.log("SessionId from cookie:", sessionId)
    } catch (cookieError) {
      console.error("Error getting cookie:", cookieError)
      return NextResponse.json({ user: null })
    }

    if (!sessionId) {
      return NextResponse.json({ user: null })
    }

    // Look up session and user
    const sessions = await sql`
      SELECT s.user_id, u.id, u.username, u.role, u.progress
      FROM "Session" s
      JOIN "User" u ON s.user_id = u.id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW()
      LIMIT 1
    `
    console.log("Session query result:", sessions)

    if (sessions && sessions.length > 0) {
      const user = sessions[0]
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          progress: user.progress,
        },
      })
    }

    return NextResponse.json({ user: null })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}
