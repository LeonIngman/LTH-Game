-- Migration 005: Unify Performance and GameDailyData under GameSession
-- This migration establishes the relationships between Performance, GameDailyData, and GameSession
-- Based on matching (userId, levelId) and closest timestamps

DO $$
BEGIN
    -- Step 1: Add sessionId column to Performance if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Performance' AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "Performance" ADD COLUMN "sessionId" INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE "Performance" 
        ADD CONSTRAINT "Performance_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "GameSession"(id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX "idx_performance_session_id" ON "Performance"("sessionId");
        
        RAISE NOTICE 'Added sessionId column to Performance table';
    ELSE
        RAISE NOTICE 'sessionId column already exists in Performance table';
    END IF;
END $$;
