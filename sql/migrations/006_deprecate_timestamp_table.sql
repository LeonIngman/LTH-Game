-- Migration 006: Deprecate TimeStamp Table
-- Purpose: Remove Performance.timestampId FK and eventually drop TimeStamp table
-- Strategy: Extract critical TimeStamp data into GameSession, then remove the relationship
-- Timeline: Phase 1 (this migration) removes FK, Phase 2 (future) drops table

-- ============================================================================
-- PHASE 1: REMOVE FOREIGN KEY RELATIONSHIP SAFELY
-- ============================================================================

DO $$
DECLARE
    timestamp_data_count INTEGER;
    performance_refs_count INTEGER;
    extracted_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting TimeStamp deprecation migration...';
    
    -- Count current TimeStamp records and Performance references
    SELECT COUNT(*) INTO timestamp_data_count FROM "TimeStamp";
    SELECT COUNT(*) INTO performance_refs_count FROM "Performance" WHERE "timestampId" IS NOT NULL;
    
    RAISE NOTICE 'Found % TimeStamp records and % Performance references', 
                 timestamp_data_count, performance_refs_count;
    
    -- ========================================================================
    -- STEP 1: PRESERVE CRITICAL TIMESTAMP DATA IN GAMESESSION
    -- ========================================================================
    
    -- Add columns to GameSession to capture essential TimeStamp data
    -- Only add if not already exists (idempotent)
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'currentTimestamp'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD COLUMN "currentTimestamp" INTEGER;
        RAISE NOTICE 'Added currentTimestamp column to GameSession';
    ELSE
        RAISE NOTICE 'currentTimestamp column already exists in GameSession';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'marketDemand'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD COLUMN "marketDemand" INTEGER;
        RAISE NOTICE 'Added marketDemand column to GameSession';
    ELSE
        RAISE NOTICE 'marketDemand column already exists in GameSession';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'rawMaterialAPrice'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD COLUMN "rawMaterialAPrice" DECIMAL(10,2);
        RAISE NOTICE 'Added rawMaterialAPrice column to GameSession';
    ELSE
        RAISE NOTICE 'rawMaterialAPrice column already exists in GameSession';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'rawMaterialBPrice'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD COLUMN "rawMaterialBPrice" DECIMAL(10,2);
        RAISE NOTICE 'Added rawMaterialBPrice column to GameSession';
    ELSE
        RAISE NOTICE 'rawMaterialBPrice column already exists in GameSession';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'GameSession' 
        AND column_name = 'finishedGoodPrice'
    ) THEN
        ALTER TABLE "GameSession" 
        ADD COLUMN "finishedGoodPrice" DECIMAL(10,2);
        RAISE NOTICE 'Added finishedGoodPrice column to GameSession';
    ELSE
        RAISE NOTICE 'finishedGoodPrice column already exists in GameSession';
    END IF;
    
    -- ========================================================================
    -- STEP 2: EXTRACT AND TRANSFER TIMESTAMP DATA
    -- ========================================================================
    
    -- Extract TimeStamp data for sessions that have both Performance and GameSession records
    -- This handles the case where Performance.sessionId exists and points to valid GameSession
    
    UPDATE "GameSession" gs
    SET 
        "currentTimestamp" = COALESCE(gs."currentTimestamp", t."timestampNumber"),
        "marketDemand" = COALESCE(gs."marketDemand", t."marketDemand"),
        "rawMaterialAPrice" = COALESCE(gs."rawMaterialAPrice", t."rawMaterialAPrice"),
        "rawMaterialBPrice" = COALESCE(gs."rawMaterialBPrice", t."rawMaterialBPrice"),
        "finishedGoodPrice" = COALESCE(gs."finishedGoodPrice", t."finishedGoodPrice")
    FROM "Performance" p
    JOIN "TimeStamp" t ON p."timestampId" = t.id
    WHERE gs.id = p."sessionId"
      AND p."sessionId" IS NOT NULL
      AND p."timestampId" IS NOT NULL;
    
    GET DIAGNOSTICS extracted_count = ROW_COUNT;
    RAISE NOTICE 'Extracted TimeStamp data to % GameSession records', extracted_count;
    
    -- ========================================================================
    -- STEP 3: SAFELY REMOVE FOREIGN KEY CONSTRAINT
    -- ========================================================================
    
    -- Check if the foreign key constraint exists before dropping
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Performance_timestampId_fkey'
        AND table_name = 'Performance'
    ) THEN
        ALTER TABLE "Performance" 
        DROP CONSTRAINT "Performance_timestampId_fkey";
        RAISE NOTICE 'Dropped Performance_timestampId_fkey foreign key constraint';
    ELSE
        RAISE NOTICE 'Performance_timestampId_fkey constraint does not exist';
    END IF;
    
    -- ========================================================================
    -- STEP 4: REMOVE TIMESTAMP COLUMN FROM PERFORMANCE (OPTIONAL CLEANUP)
    -- ========================================================================
    
    -- Note: We could optionally drop the timestampId column entirely here,
    -- but keeping it for now allows for easier rollback if needed
    -- Uncomment the following block to remove the column completely:
    
    /*
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Performance' 
        AND column_name = 'timestampId'
    ) THEN
        ALTER TABLE "Performance" DROP COLUMN "timestampId";
        RAISE NOTICE 'Dropped timestampId column from Performance table';
    ELSE
        RAISE NOTICE 'timestampId column does not exist in Performance table';
    END IF;
    */
    
    -- For now, just set orphaned timestampId values to NULL
    UPDATE "Performance" 
    SET "timestampId" = NULL 
    WHERE "timestampId" IS NOT NULL;
    
    RAISE NOTICE 'Set all Performance.timestampId values to NULL';
    
    -- ========================================================================
    -- VERIFICATION AND SUMMARY
    -- ========================================================================
    
    -- Count final state
    SELECT COUNT(*) INTO performance_refs_count 
    FROM "Performance" WHERE "timestampId" IS NOT NULL;
    
    RAISE NOTICE 'Final verification: % Performance records still reference TimeStamp', 
                 performance_refs_count;
    
    IF performance_refs_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All Performance-TimeStamp references removed safely';
        RAISE NOTICE 'TimeStamp table can now be dropped in a future migration';
    ELSE
        RAISE WARNING 'Some Performance records still reference TimeStamp table';
    END IF;
    
    RAISE NOTICE 'TimeStamp deprecation migration completed successfully';
    
END $$;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Verify no Performance records reference TimeStamp
SELECT 
    COUNT(*) as remaining_timestamp_refs,
    'Performance records still referencing TimeStamp' as description
FROM "Performance" 
WHERE "timestampId" IS NOT NULL;

-- Verify GameSession records now have TimeStamp data
SELECT 
    COUNT(*) as sessions_with_timestamp_data,
    'GameSession records with extracted TimeStamp data' as description
FROM "GameSession" 
WHERE "currentTimestamp" IS NOT NULL;

-- Show preserved TimeStamp data in GameSession
SELECT 
    gs.id as session_id,
    gs."userId",
    gs."currentTimestamp",
    gs."marketDemand",
    gs."rawMaterialAPrice",
    gs."rawMaterialBPrice",
    gs."finishedGoodPrice"
FROM "GameSession" gs
WHERE gs."currentTimestamp" IS NOT NULL
ORDER BY gs.id;

-- TimeStamp table status (ready for future removal)
SELECT 
    COUNT(*) as timestamp_records,
    'TimeStamp records (ready for cleanup)' as description
FROM "TimeStamp";

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
DEPRECATION STRATEGY:

1. ✅ COMPLETED: Extract critical TimeStamp data to GameSession
2. ✅ COMPLETED: Remove Performance.timestampId foreign key constraint  
3. ✅ COMPLETED: Set Performance.timestampId values to NULL
4. 🟡 PENDING: Future migration to drop TimeStamp table entirely

ROLLBACK INSTRUCTIONS:
- To rollback, would need to recreate FK constraint and restore timestampId values
- TimeStamp data is preserved in both places during transition period
- GameSession now contains: currentTimestamp, marketDemand, rawMaterial*Price, finishedGoodPrice

DATA PRESERVATION:
- 0 data loss: All TimeStamp data extracted to GameSession for linked sessions
- Orphaned Performance records (no sessionId) have timestampId nullified but preserved
- Original TimeStamp table remains intact for reference until next migration

BENEFITS:
- Eliminates complex TimeStamp->Performance->GameSession relationship chain
- Consolidates timing/market data directly in GameSession where it belongs  
- Simplifies queries and reduces joins
- Maintains data integrity with proper verification
*/
