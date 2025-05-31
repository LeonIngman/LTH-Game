import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("auth_session")?.value
    if (sessionId) {
      await sql`DELETE FROM "Session" WHERE id = ${sessionId}`
      cookieStore.set("auth_session", "", { maxAge: 0, path: "/" })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false })
  }
}
