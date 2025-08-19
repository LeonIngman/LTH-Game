import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Next 15 dynamic APIs: await cookies()
    const cookieStore = await cookies();
    const sessionId =
      cookieStore.get("auth_session")?.value ??
      cookieStore.get("session")?.value ??
      null;

    console.log("SessionId from cookie:", sessionId);

    if (!sessionId) {
      return NextResponse.json({ user: null });
    }

    // Use quoted camelCase identifiers
    const rows = await sql/* sql */`
      SELECT
        s."userId"   AS "userId",
        u."id"       AS "id",
        u."username" AS "username",
        u."role"     AS "role",
        u."progress" AS "progress"
      FROM "Session" AS s
      JOIN "User"    AS u ON s."userId" = u."id"
      WHERE s."id" = ${sessionId}
        AND s."expiresAt" > NOW()
      LIMIT 1
    `;

    const row = rows?.[0];
    if (!row) {
      // Optional: clear stale cookie
      // cookieStore.set("auth_session", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
        progress: row.progress,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
