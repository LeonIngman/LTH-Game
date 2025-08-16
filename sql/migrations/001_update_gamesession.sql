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

-- Add proper foreign key constraint for user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'GameSession_user_id_fkey'
        AND table_name = 'GameSession'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD CONSTRAINT "GameSession_user_id_fkey" 
        FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add proper foreign key constraint for level_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'GameSession_level_id_fkey'
        AND table_name = 'GameSession'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD CONSTRAINT "GameSession_level_id_fkey" 
        FOREIGN KEY (level_id) REFERENCES "GameLevel"(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamesession_user_id'
    ) THEN
        CREATE INDEX "idx_gamesession_user_id" ON "GameSession"(user_id);
    END IF;
END $$;

-- Create index on level_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_gamesession_level_id'
    ) THEN
        CREATE INDEX "idx_gamesession_level_id" ON "GameSession"(level_id);
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
