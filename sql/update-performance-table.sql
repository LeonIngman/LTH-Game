-- Modify the Performance table to store more detailed game history
ALTER TABLE "Performance" 
ADD COLUMN IF NOT EXISTS "gameHistory" JSONB DEFAULT NULL;
