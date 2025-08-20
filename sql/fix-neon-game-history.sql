-- ============================================================================
-- NEON DATABASE MIGRATION: ADD GAME HISTORY COLUMNS
-- ============================================================================
-- This script adds the missing columns needed for the Game History feature
-- Copy and paste this entire script into the Neon SQL editor and run it
-- ============================================================================

-- Add missing columns for game history feature
ALTER TABLE "GameSession" 
ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN DEFAULT false;

ALTER TABLE "Performance"
ADD COLUMN IF NOT EXISTS "hasDetailedData" BOOLEAN DEFAULT false;

-- Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS "idx_gamesession_completed" ON "GameSession" ("isCompleted");
CREATE INDEX IF NOT EXISTS "idx_performance_detailed" ON "Performance" ("hasDetailedData");

-- Update existing records to have hasDetailedData = true if they have associated GameDailyData
UPDATE "Performance"
SET "hasDetailedData" = true
WHERE id IN (
    SELECT DISTINCT "performanceId"
    FROM "GameDailyData"
    WHERE "performanceId" IS NOT NULL
);

-- Update existing GameSession records to be marked as completed if they have corresponding Performance records
UPDATE "GameSession"
SET "isCompleted" = true
WHERE EXISTS (
    SELECT 1
    FROM "Performance" p
    WHERE p."userId" = "GameSession"."userId"
    AND p."levelId" = "GameSession"."levelId"
);

-- Insert test data if no users exist
INSERT INTO "User" ("id", "username", "email", "password", "visible_password", "role", "progress") 
SELECT * FROM (VALUES
    ('user_5cpshj5a', 'testuser', 'testuser@example.com', '$2b$10$hashedpassword', 'password123', 'student', 0),
    ('teacher_1', 'teacher1', 'teacher@example.com', '$2b$10$hashedpassword', 'password123', 'teacher', 0),
    ('student_1', 'student1', 'student1@example.com', '$2b$10$hashedpassword', 'password123', 'student', 0),
    ('student_2', 'student2', 'student2@example.com', '$2b$10$hashedpassword', 'password123', 'student', 1)
) AS new_users(id, username, email, password, visible_password, role, progress)
WHERE NOT EXISTS (SELECT 1 FROM "User" LIMIT 1);

-- Insert game levels if none exist
INSERT INTO "GameLevel" ("id", "name", "description", "maxScore") 
SELECT * FROM (VALUES
    (0, 'Level 0 - Tutorial', 'Learn the basics of the supply chain game', 1000),
    (1, 'Level 1 - Simple Operations', 'Manage a basic supply chain', 2000),
    (2, 'Level 2 - Complex Demand', 'Handle variable demand patterns', 3000)
) AS new_levels(id, name, description, maxScore)
WHERE NOT EXISTS (SELECT 1 FROM "GameLevel" LIMIT 1);

-- Insert sample performance data for testing
INSERT INTO "Performance" ("userId", "levelId", "score", "cumulativeProfit", "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock", "decisions", "hasDetailedData", "createdAt") 
SELECT * FROM (VALUES
    -- User testuser Level 0 attempts (showing improvement over time)
    ('user_5cpshj5a', 0, 650, 1250.50, 200.00, 10, 15, 5, '{"day1": {"production": 50, "purchases": {"patty": 25, "bun": 25}}}', true, '2025-08-18 10:00:00'::timestamp),
    ('user_5cpshj5a', 0, 720, 1450.75, 180.00, 8, 12, 3, '{"day1": {"production": 60, "purchases": {"patty": 30, "bun": 30}}}', true, '2025-08-19 11:30:00'::timestamp),
    ('user_5cpshj5a', 0, 850, 1650.25, 220.00, 12, 18, 7, '{"day1": {"production": 70, "purchases": {"patty": 35, "bun": 35}}}', true, '2025-08-20 09:15:00'::timestamp),
    
    -- Student1 Level 0 and 1 attempts  
    ('student_1', 0, 580, 1100.25, 150.00, 6, 10, 2, '{"day1": {"production": 40, "purchases": {"patty": 20, "bun": 20}}}', true, '2025-08-17 14:20:00'::timestamp),
    ('student_1', 0, 640, 1300.50, 170.00, 9, 14, 4, '{"day1": {"production": 55, "purchases": {"patty": 28, "bun": 28}}}', true, '2025-08-18 16:45:00'::timestamp),
    ('student_1', 1, 920, 1850.75, 280.00, 15, 22, 8, '{"day1": {"production": 80, "purchases": {"patty": 40, "bun": 40}}}', true, '2025-08-19 13:10:00'::timestamp),
    
    -- Student2 multiple attempts showing improvement
    ('student_2', 0, 520, 950.00, 120.00, 5, 8, 1, '{"day1": {"production": 35, "purchases": {"patty": 18, "bun": 18}}}', true, '2025-08-16 10:30:00'::timestamp),
    ('student_2', 0, 620, 1200.25, 160.00, 7, 11, 3, '{"day1": {"production": 45, "purchases": {"patty": 23, "bun": 23}}}', true, '2025-08-17 12:15:00'::timestamp),
    ('student_2', 0, 740, 1450.50, 190.00, 10, 15, 5, '{"day1": {"production": 65, "purchases": {"patty": 33, "bun": 33}}}', true, '2025-08-18 14:00:00'::timestamp),
    ('student_2', 1, 1150, 2200.75, 320.00, 18, 25, 10, '{"day1": {"production": 90, "purchases": {"patty": 45, "bun": 45}}}', true, '2025-08-19 15:30:00'::timestamp)
) AS new_performance("userId", "levelId", "score", "cumulativeProfit", "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock", "decisions", "hasDetailedData", "createdAt")
WHERE NOT EXISTS (SELECT 1 FROM "Performance" WHERE "userId" = 'user_5cpshj5a' LIMIT 1);

-- Insert sample GameSession data
INSERT INTO "GameSession" ("userId", "levelId", "gameState", "isCompleted", "updatedAt") 
SELECT * FROM (VALUES
    ('user_5cpshj5a', 0, '{"currentDay": 10, "cash": 1650.25, "inventory": {"patty": 12, "bun": 18, "finished": 7}}', true, '2025-08-20 09:15:00'::timestamp),
    ('student_1', 0, '{"currentDay": 8, "cash": 1300.50, "inventory": {"patty": 9, "bun": 14, "finished": 4}}', true, '2025-08-18 16:45:00'::timestamp),
    ('student_1', 1, '{"currentDay": 12, "cash": 1850.75, "inventory": {"patty": 15, "bun": 22, "finished": 8}}', true, '2025-08-19 13:10:00'::timestamp),
    ('student_2', 0, '{"currentDay": 9, "cash": 1450.50, "inventory": {"patty": 10, "bun": 15, "finished": 5}}', true, '2025-08-18 14:00:00'::timestamp),
    ('student_2', 1, '{"currentDay": 15, "cash": 2200.75, "inventory": {"patty": 18, "bun": 25, "finished": 10}}', true, '2025-08-19 15:30:00'::timestamp)
) AS new_sessions("userId", "levelId", "gameState", "isCompleted", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "GameSession" WHERE "userId" = 'user_5cpshj5a' LIMIT 1)
ON CONFLICT ("userId", "levelId") DO UPDATE SET
"gameState" = EXCLUDED."gameState",
"isCompleted" = EXCLUDED."isCompleted", 
"updatedAt" = EXCLUDED."updatedAt";

-- ============================================================================
-- VERIFICATION - Check that everything worked
-- ============================================================================

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'GameSession' AND column_name = 'isCompleted'
UNION ALL
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Performance' AND column_name = 'hasDetailedData';

-- Show sample data
SELECT 
    'Data Summary' as info,
    (SELECT COUNT(*) FROM "User") as users,
    (SELECT COUNT(*) FROM "GameLevel") as levels, 
    (SELECT COUNT(*) FROM "Performance") as performance_records,
    (SELECT COUNT(*) FROM "GameSession") as game_sessions;

-- Test the game history query that was failing
SELECT 
    p.*,
    gl.name as "levelName",
    gs."isCompleted",
    gs."updatedAt" as "sessionUpdatedAt"
FROM "Performance" p
LEFT JOIN "GameLevel" gl ON p."levelId" = gl.id
LEFT JOIN "GameSession" gs ON gs."userId" = p."userId" AND gs."levelId" = p."levelId"
WHERE p."userId" = 'user_5cpshj5a'
ORDER BY p."levelId" ASC, p."createdAt" DESC
LIMIT 5;
