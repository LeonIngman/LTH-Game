-- Migration: Add sessionId to Order table
-- Date: 2025-08-16
-- Description: Add nullable sessionId foreign key to GameSession, keeping existing foreign keys

-- Add sessionId column to Order if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' 
        AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "sessionId" INTEGER;
        COMMENT ON COLUMN "Order"."sessionId" IS 'Optional reference to GameSession for new lean schema';
    END IF;
END $$;

-- Add foreign key constraint for sessionId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Order_sessionId_fkey'
        AND table_name = 'Order'
    ) THEN
        ALTER TABLE "Order" 
        ADD CONSTRAINT "Order_sessionId_fkey" 
        FOREIGN KEY ("sessionId") REFERENCES "GameSession"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on sessionId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_order_session_id'
    ) THEN
        CREATE INDEX "idx_order_session_id" ON "Order"("sessionId");
    END IF;
END $$;
