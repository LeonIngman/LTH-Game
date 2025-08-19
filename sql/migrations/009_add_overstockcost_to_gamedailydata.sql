-- Migration 009: Add overstockCost column to GameDailyData table
-- This migration adds the overstockCost column to unify naming with UI ('Overstock Cost')
-- and replaces any references to overstockPenalty

BEGIN;

-- Check if overstockCost column exists, add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'overstockCost'
    ) THEN
        ALTER TABLE "GameDailyData" ADD COLUMN "overstockCost" NUMERIC(10,2) NOT NULL DEFAULT 0;
        COMMENT ON COLUMN "GameDailyData"."overstockCost" IS 'Overstock costs for inventory management - unified naming with UI';
    END IF;
END $$;

-- Check if overstockCostDetails column exists, add if it doesn't  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'overstockCostDetails'
    ) THEN
        ALTER TABLE "GameDailyData" ADD COLUMN "overstockCostDetails" TEXT DEFAULT '{}';
        COMMENT ON COLUMN "GameDailyData"."overstockCostDetails" IS 'JSON breakdown of overstock costs by material type';
    END IF;
END $$;

-- If overstockPenalty column exists, copy its data to overstockCost and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'overstockPenalty'
    ) THEN
        -- Copy data from overstockPenalty to overstockCost
        UPDATE "GameDailyData" 
        SET "overstockCost" = COALESCE("overstockPenalty", 0)
        WHERE "overstockPenalty" IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE "GameDailyData" DROP COLUMN "overstockPenalty";
    END IF;
END $$;

-- If overstockPenaltyDetails column exists, copy its data to overstockCostDetails and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'GameDailyData' 
        AND column_name = 'overstockPenaltyDetails'
    ) THEN
        -- Copy data from overstockPenaltyDetails to overstockCostDetails
        UPDATE "GameDailyData" 
        SET "overstockCostDetails" = COALESCE("overstockPenaltyDetails", '{}')
        WHERE "overstockPenaltyDetails" IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE "GameDailyData" DROP COLUMN "overstockPenaltyDetails";
    END IF;
END $$;

-- Verify existing rows have default value of 0 for overstockCost
UPDATE "GameDailyData" 
SET "overstockCost" = 0 
WHERE "overstockCost" IS NULL;

-- Update totalCosts to include overstockCost if it's not already included
-- Note: This is a safety measure in case some records have inconsistent totals
UPDATE "GameDailyData" 
SET "totalCosts" = "purchaseCosts" + "productionCosts" + "holdingCosts" + "overstockCost"
WHERE "totalCosts" != ("purchaseCosts" + "productionCosts" + "holdingCosts" + "overstockCost");

COMMIT;

-- Display verification
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_records,
    SUM(CASE WHEN "overstockCost" = 0 THEN 1 ELSE 0 END) as records_with_zero_overstock,
    SUM(CASE WHEN "overstockCost" > 0 THEN 1 ELSE 0 END) as records_with_overstock,
    AVG("overstockCost") as avg_overstock_cost
FROM "GameDailyData";
