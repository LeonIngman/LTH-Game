-- Migration: Add lean-schema support to GameSession table
-- Date: 2025-08-16
-- Description: Modify GameSession to have proper foreign keys and add isCompleted column

-- Add isCompleted column to GameSession if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'isCompleted'
    ) THEN
        ALTER TABLE "GameSession" ADD COLUMN "isCompleted" BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN "GameSession"."isCompleted" IS 'Indicates if the game session has been completed';
    END IF;
END $$;

-- Add proper foreign key constraint for userId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'GameSession_userId_fkey'
        AND table_name = 'GameSession'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD CONSTRAINT "GameSession_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add proper foreign key constraint for levelId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'GameSession_levelId_fkey'
        AND table_name = 'GameSession'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD CONSTRAINT "GameSession_levelId_fkey" 
        FOREIGN KEY ("levelId") REFERENCES "GameLevel"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on userId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamesession_userId'
    ) THEN
        CREATE INDEX "idx_gamesession_userId" ON "GameSession"("userId");
    END IF;
END $$;

-- Create index on levelId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamesession_levelId'
    ) THEN
        CREATE INDEX "idx_gamesession_levelId" ON "GameSession"("levelId");
    END IF;
END $$;

-- Create index on isCompleted if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamesession_is_completed'
    ) THEN
        CREATE INDEX "idx_gamesession_is_completed" ON "GameSession"("isCompleted");
    END IF;
END $$;
