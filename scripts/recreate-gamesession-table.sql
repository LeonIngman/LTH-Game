-- Recreate GameSession table for LTH Game
-- This fixes the missing GameSession table issue

-- Drop table if it exists (cleanup)
DROP TABLE IF EXISTS "GameSession";

-- Create GameSession table
CREATE TABLE "GameSession" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "gameState" JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameSession_user_level_unique" UNIQUE ("userId", "levelId")
);

-- Add foreign key constraint to User table
ALTER TABLE "GameSession" 
ADD CONSTRAINT "GameSession_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX "idx_gamesession_user" ON "GameSession" ("userId");
CREATE INDEX "idx_gamesession_level" ON "GameSession" ("levelId");
CREATE INDEX "idx_gamesession_updated" ON "GameSession" ("updatedAt");

-- Verify table was created
SELECT 'GameSession table created successfully!' as status;
\d "GameSession"
