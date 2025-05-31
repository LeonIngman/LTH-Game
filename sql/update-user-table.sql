-- First, let's create a backup of the User table
CREATE TABLE IF NOT EXISTS "UserBackup" AS SELECT * FROM "User";

-- Now, modify the User table to make username the primary identifier
-- First, ensure username is unique
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS username_unique UNIQUE (username);

-- Add an index on username for faster lookups
CREATE INDEX IF NOT EXISTS username_idx ON "User" (username);

-- Drop the email column (make sure all code is updated first)
ALTER TABLE "User" DROP COLUMN IF EXISTS email;

-- Add a visible_password column to store the plain text password for teachers to distribute
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS visible_password VARCHAR(255);

-- Update existing records to set visible_password
UPDATE "User" SET visible_password = 'defaultpassword' WHERE visible_password IS NULL;
