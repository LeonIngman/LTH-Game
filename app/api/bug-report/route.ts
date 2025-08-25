import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';

// Feedback/Bug report interface
interface FeedbackReport {
  title: string;
  description: string;
  category: string;
  recipientEmail?: string; // User's email for responses (will be used as reply-to address)
  currentPage?: string;
  userAgent?: string;
  // Technical debugging fields
  timestamp?: string;
  screenResolution?: string;
  viewport?: string;
  language?: string;
  platform?: string;
  cookiesEnabled?: boolean;
  onlineStatus?: boolean;
  referrer?: string;
  localTime?: string;
  timezone?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get user session using the same logic as session route
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("auth_session")?.value ?? cookieStore.get("session")?.value ?? null;

    console.log('🐛 Feedback submission started', {
      sessionId: sessionId ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });

    if (!sessionId) {
      console.log('🐛 No session found, returning 401');
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'No session found. Please log in first.',
        debugInfo: {
          cookiesFound: (await cookies()).getAll().map(c => c.name),
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    // Get user from database
    console.log('🐛 Looking up user for session:', sessionId);
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
    console.log('🐛 User lookup result:', user ? 'found' : 'not found');

    if (!user) {
      console.log('🐛 No valid user session, returning 401');
      return NextResponse.json({
        error: 'Unauthorized',
        details: 'Session expired or invalid. Please log in again.',
        debugInfo: {
          sessionId,
          queryResult: rows?.length || 0,
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    const feedbackData: FeedbackReport = await req.json();
    const {
      title,
      description,
      category,
      recipientEmail,
      currentPage,
      userAgent,
      timestamp,
      screenResolution,
      viewport,
      language,
      platform,
      cookiesEnabled,
      onlineStatus,
      referrer,
      localTime,
      timezone
    } = feedbackData;

    console.log('🐛 Feedback data received:', {
      title,
      category,
      hasDescription: !!description,
      currentPage,
      timestamp,
      userAgent: userAgent?.substring(0, 50) + '...'
    });

    // Basic validation
    if (!title || !description) {
      console.log('🐛 Validation failed: missing title or description');
      return NextResponse.json({
        error: 'Title and description are required',
        details: 'Both title and description fields must be filled',
        debugInfo: {
          hasTitle: !!title,
          hasDescription: !!description,
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

    // Prepare enhanced email content with debug information
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #4f46e5; font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; }
        .description { background: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 10px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 LTH Game - New Feedback Report</h1>
    </div>
    
    <div class="content">
        <div class="section">
            <div class="section-title">👤 User Information</div>
            <div class="info-grid">
                <span class="label">Contact Email:</span>
                <span class="value">${recipientEmail || user.email || 'Not provided'}</span>
                <span class="label">Username:</span>
                <span class="value">${user.username}</span>
                <span class="label">User ID:</span>
                <span class="value">${user.id}</span>
                <span class="label">Role:</span>
                <span class="value">${user.role || 'Student'}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📝 Feedback Details</div>
            <div class="info-grid">
                <span class="label">Category:</span>
                <span class="value">${category}</span>
                <span class="label">Title:</span>
                <span class="value">${title}</span>
                <span class="label">Page:</span>
                <span class="value">${currentPage || 'Unknown'}</span>
            </div>
            
            <div class="description">
                <strong>Description:</strong><br>
                ${description}
            </div>
        </div>

        <div class="section">
            <div class="section-title">🔧 Technical Information</div>
            <div class="info-grid">
                <span class="label">Submitted:</span>
                <span class="value">${new Date().toLocaleString('sv-SE', { timeZone: timezone || 'Europe/Stockholm' })}</span>
                <span class="label">Browser:</span>
                <span class="value">${userAgent?.split(' ').slice(-2).join(' ') || 'Unknown'}</span>
                <span class="label">Screen Size:</span>
                <span class="value">${screenResolution || 'Unknown'}</span>
                <span class="label">Language:</span>
                <span class="value">${language || 'Unknown'}</span>
                <span class="label">Platform:</span>
                <span class="value">${platform || 'Unknown'}</span>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>This feedback was submitted through the LTH Game platform.</p>
        <p>Reply to this email to respond directly to the user.</p>
    </div>
</body>
</html>`;

    console.log('🐛 Checking SMTP configuration...');

    // Check SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('🐛 SMTP not configured');
      return NextResponse.json({
        error: 'Email service not configured',
        details: 'SMTP settings are missing. Please contact administrator.',
        debugInfo: {
          smtpHost: !!process.env.SMTP_HOST,
          smtpUser: !!process.env.SMTP_USER,
          smtpPass: !!process.env.SMTP_PASS,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    console.log('🐛 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection
    try {
      console.log('🐛 Verifying SMTP connection...');
      await transporter.verify();
      console.log('🐛 SMTP connection verified successfully');
    } catch (smtpError: any) {
      console.error('🐛 SMTP verification failed:', smtpError);
      return NextResponse.json({
        error: 'Email service connection failed',
        details: smtpError.message || 'SMTP verification failed',
        debugInfo: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          errorCode: smtpError.code,
          errorCommand: smtpError.command,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    console.log('🐛 Sending email...');
    let emailResult;
    try {
      emailResult = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.BUG_REPORT_EMAIL || process.env.SMTP_USER,
        replyTo: recipientEmail || user.email,
        subject: `${category}: ${title}`,
        html: emailContent,
      });
      console.log('🐛 Email sent successfully:', emailResult.messageId);
    } catch (emailError: any) {
      console.error('🐛 Email sending failed:', emailError);
      return NextResponse.json({
        error: 'Failed to send email',
        details: emailError.message || 'Email sending failed',
        debugInfo: {
          errorCode: emailError.code,
          errorCommand: emailError.command,
          errorResponse: emailError.response,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    // Add to database - using raw SQL since Prisma client might not be regenerated yet
    console.log('🐛 Saving to database...');
    try {
      await sql`
        INSERT INTO "Bug" ("userId", "email", "title", "description", "category", "currentPage", "userAgent")
        VALUES (${user.id}, ${user.email || ''}, ${title}, ${description}, ${category}, ${currentPage || ''}, ${userAgent || ''})
      `;
      console.log('🐛 Database save successful');
    } catch (dbError: any) {
      // Log database error but don't fail the request since email was sent
      console.error('🐛 Database insertion failed:', dbError);
      // Don't return error since email was sent successfully
    }

    console.log('🐛 Feedback submission completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      debugInfo: {
        messageId: emailResult?.messageId,
        recipient: process.env.BUG_REPORT_EMAIL || process.env.SMTP_USER,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('🐛 Feedback submission error:', error);

    // Enhanced error response with debugging information
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    return NextResponse.json({
      error: 'Failed to submit feedback',
      details: error.message || 'Internal server error',
      debugInfo: errorDetails
    }, { status: 500 });
  }
}
