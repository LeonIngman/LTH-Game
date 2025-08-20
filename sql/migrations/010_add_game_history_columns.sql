-- Add missing columns for game history feature
-- Migration 010: Add game history columns
-- Add isCompleted column to GameSession table
ALTER TABLE "GameSession"
ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN DEFAULT false;

-- Add hasDetailedData column to Performance table  
ALTER TABLE "Performance"
ADD COLUMN IF NOT EXISTS "hasDetailedData" BOOLEAN DEFAULT false;

-- Update existing records to have hasDetailedData = true if they have associated GameDailyData
UPDATE "Performance"
SET
    "hasDetailedData" = true
WHERE
    id IN (
        SELECT DISTINCT
            "performanceId"
        FROM
            "GameDailyData"
        WHERE
            "performanceId" IS NOT NULL
    );

-- Update existing GameSession records to be marked as completed if they have corresponding Performance records
UPDATE "GameSession"
SET
    "isCompleted" = true
WHERE
    EXISTS (
        SELECT
            1
        FROM
            "Performance" p
        WHERE
            p."userId" = "GameSession"."userId"
            AND p."levelId" = "GameSession"."levelId"
    );

-- Add index for better performance on new columns
CREATE INDEX IF NOT EXISTS "idx_gamesession_completed" ON "GameSession" ("isCompleted");

CREATE INDEX IF NOT EXISTS "idx_performance_detailed" ON "Performance" ("hasDetailedData");

-- Add comment to track migration
COMMENT ON COLUMN "GameSession"."isCompleted" IS 'Migration 010: Tracks if the game session was completed';

COMMENT ON COLUMN "Performance"."hasDetailedData" IS 'Migration 010: Indicates if performance record has detailed game data';