import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';

// Bug report interface
interface BugReport {
  title: string;
  description: string;
  category: string;
  currentPage?: string;
  userAgent?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get user session using the same logic as session route
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("auth_session")?.value ?? cookieStore.get("session")?.value ?? null;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const rows = await sql`
      SELECT
        u."id" AS "id",
        u."username" AS "username", 
        u."email" AS "email"
      FROM "Session" AS s
      JOIN "User" AS u ON s."userId" = u."id"
      WHERE s."id" = ${sessionId}
        AND s."expiresAt" > NOW()
      LIMIT 1
    `;

    const user = rows?.[0];
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, currentPage, userAgent }: BugReport = await req.json();

    // Basic validation
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Prepare email content
    const emailContent = `
Bug Report from LTH Game

User: ${user.email || 'No email'} (ID: ${user.id})
Username: ${user.username}
Page: ${currentPage || 'Unknown'}
Category: ${category}
User Agent: ${userAgent || 'Unknown'}

Title: ${title}

Description:
${description}

Submitted at: ${new Date().toISOString()}
    `.trim();

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.BUG_REPORT_EMAIL || process.env.SMTP_USER,
      subject: `Bug Report: ${title}`,
      text: emailContent,
    });

    // Add to database - using raw SQL since Prisma client might not be regenerated yet
    try {
      await sql`
        INSERT INTO "Bug" ("userId", "email", "title", "description", "category", "currentPage", "userAgent")
        VALUES (${user.id}, ${user.email || ''}, ${title}, ${description}, ${category}, ${currentPage || ''}, ${userAgent || ''})
      `;
    } catch (dbError) {
      // Log database error but don't fail the request since email was sent
      console.error('Database insertion failed:', dbError);
    }

    return NextResponse.json({ success: true, message: 'Bug report submitted successfully' });
  } catch (error) {
    console.error('Bug report error:', error);
    return NextResponse.json({ error: 'Failed to submit bug report' }, { status: 500 });
  }
}
