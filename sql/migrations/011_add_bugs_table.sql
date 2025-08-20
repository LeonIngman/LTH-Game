-- Migration 011: Add bugs table for bug reporting feature
-- Create bugs table for tracking bug reports
CREATE TABLE
    IF NOT EXISTS "Bug" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'Other',
        "status" TEXT NOT NULL DEFAULT 'Open',
        "currentPage" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
    );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "idx_bug_status" ON "Bug" ("status");

CREATE INDEX IF NOT EXISTS "idx_bug_user" ON "Bug" ("userId");

CREATE INDEX IF NOT EXISTS "idx_bug_created" ON "Bug" ("createdAt");

-- Add comment to track migration
COMMENT ON TABLE "Bug" IS 'Migration 011: Bug reporting system';