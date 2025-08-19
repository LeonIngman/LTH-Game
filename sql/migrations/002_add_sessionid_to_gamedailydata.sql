-- Migration: Add sessionId to GameDailyData table
-- Date: 2025-08-16
-- Description: Add nullable sessionId foreign key to GameSession, keeping existing performanceId FK

-- Add sessionId column to GameDailyData if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "GameDailyData" ADD COLUMN "sessionId" INTEGER;
        COMMENT ON COLUMN "GameDailyData"."sessionId" IS 'Optional reference to GameSession for new lean schema';
    END IF;
END $$;

-- Add foreign key constraint for sessionId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'GameDailyData_sessionId_fkey'
        AND table_name = 'GameDailyData'
    ) THEN
        ALTER TABLE "GameDailyData" 
        ADD CONSTRAINT "GameDailyData_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "GameSession"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on sessionId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamedailydata_session_id'
    ) THEN
        CREATE INDEX "idx_gamedailydata_session_id" ON "GameDailyData"("sessionId");
    END IF;
END $$;
