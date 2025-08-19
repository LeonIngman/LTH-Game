import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { sql } from "@/lib/db";
import { getSecurityHeaders, logAuthError } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Parse request body
    let username: string | undefined, password: string | undefined;
    try {
      const body = await request.json();
      username = body.username;
      password = body.password;
    } catch (parseError) {
      logAuthError("Login attempt with invalid request format", {
        parseError: parseError instanceof Error ? parseError.message : "Unknown",
      });
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400, headers: getSecurityHeaders() },
      );
    }

    if (!username || !password) {
      logAuthError("Login attempt with missing or invalid credentials", {
        username: username || "undefined",
      });
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400, headers: getSecurityHeaders() },
      );
    }

    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    logAuthError("Login attempt", { username, clientIP });

    // Lookup user
    let user: any = null;
    try {
      const users = await sql/* sql */`
        SELECT * FROM "User" WHERE "username" = ${username}
      `;
      user = users?.[0] ?? null;
    } catch (dbError) {
      logAuthError("Database error during user lookup", {
        username,
        error: dbError instanceof Error ? dbError.message : "Unknown",
      });
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() },
      );
    }

    // Password check (bcrypt if hashed)
    let isPasswordValid = false;
    if (user?.password) {
      isPasswordValid = user.password.startsWith("$2")
        ? await bcryptjs.compare(password, user.password)
        : user.password === password;
    } else {
      await bcryptjs.compare(password, "$2a$12$dummyHashToPreventTiming.Attack.Vector.12345");
    }

    if (!isPasswordValid || !user) {
      logAuthError("Invalid login credentials", { username, userExists: !!user });
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401, headers: getSecurityHeaders() },
      );
    }

    // Update lastActive (non-blocking)
    try {
      await sql/* sql */`
        UPDATE "User" SET "lastActive" = CURRENT_TIMESTAMP WHERE "id" = ${user.id}
      `;
    } catch (e) {
      logAuthError("Error updating last active timestamp", {
        userId: user.id,
        error: e instanceof Error ? e.message : "Unknown",
      });
    }

    // Create session (camelCase columns)
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    try {
      await sql/* sql */`
        INSERT INTO "Session" ("id","userId","expiresAt")
        VALUES (${sessionId}, ${user.id}, ${expiresAt})
      `;
    } catch (sessionError) {
      logAuthError("Error creating session", {
        userId: user.id,
        error: sessionError instanceof Error ? sessionError.message : "Unknown",
      });
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() },
      );
    }

    // Set cookie — Next 15: await cookies()
    try {
      const cookieStore = await cookies();
      cookieStore.set("auth_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
    } catch (cookieError) {
      logAuthError("Error setting cookie", {
        userId: user.id,
        error: cookieError instanceof Error ? cookieError.message : "Unknown",
      });
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable" },
        { status: 500, headers: getSecurityHeaders() },
      );
    }

    // Response payload
    const { password: _omit, ...userData } = user;
    let dashboardUrl = "/dashboard";
    if (userData.role === "teacher") dashboardUrl = "/dashboard/teacher";
    else if (userData.role === "student") dashboardUrl = "/dashboard/student";

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
      { headers: getSecurityHeaders() },
    );
  } catch (error) {
    logAuthError("Login endpoint error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, error: "Authentication service temporarily unavailable" },
      { status: 500, headers: getSecurityHeaders() },
    );
  }
}
