-- SQL script to create super user directly
-- This creates the database tables and inserts a teacher super user

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    visible_password TEXT,
    role TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    "lastActive" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "GameLevel" (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "Performance" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "timestampId" INTEGER,
    score INTEGER NOT NULL,
    "cumulativeProfit" DECIMAL NOT NULL,
    "cashFlow" DECIMAL NOT NULL,
    "rawMaterialAStock" INTEGER NOT NULL,
    "rawMaterialBStock" INTEGER NOT NULL,
    "finishedGoodStock" INTEGER NOT NULL,
    decisions JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES "User"(id),
    FOREIGN KEY ("levelId") REFERENCES "GameLevel"(id)
);

CREATE TABLE IF NOT EXISTS "TimeStamp" (
    id SERIAL PRIMARY KEY,
    "levelId" INTEGER NOT NULL,
    "timestampNumber" INTEGER NOT NULL,
    "marketDemand" INTEGER NOT NULL,
    "rawMaterialAPrice" DECIMAL NOT NULL,
    "rawMaterialBPrice" DECIMAL NOT NULL,
    "finishedGoodPrice" DECIMAL NOT NULL,
    FOREIGN KEY ("levelId") REFERENCES "GameLevel"(id)
);

-- Delete existing admin user if exists
DELETE FROM "Performance" WHERE "userId" IN (SELECT id FROM "User" WHERE username = 'admin' OR email = 'admin@lth.se');
DELETE FROM "User" WHERE username = 'admin' OR email = 'admin@lth.se';

-- Insert super user (teacher)
-- Password hash for 'SuperAdmin123!' using bcrypt with 12 rounds
INSERT INTO "User" (
    id,
    username,
    email,
    password,
    visible_password,
    role,
    progress,
    "lastActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'admin',
    'admin@lth.se',
    '$2a$12$LQv3c1yqBwEHFw4GqQpJWOBVKjgQZu.V8Z8GqU7ZL1WvxWv5oBQKW', -- SuperAdmin123!
    'SuperAdmin123!',
    'teacher',
    0,
    NOW(),
    NOW(),
    NOW()
);

-- Verify user creation
SELECT id, username, email, role, "createdAt" FROM "User" WHERE username = 'admin';

-- Show user count
SELECT COUNT(*) as total_users FROM "User";
