-- Migration 007: Legacy Column Cleanup  
-- Purpose: Remove obsolete columns and fix incorrect data from previous migrations
-- Strategy: Clean removal of unused columns and correction of incorrectly populated data
-- Focus: User.visible_password, Supplier.productId (incorrectly populated), Performance.timestampId

-- ============================================================================
-- LEGACY CLEANUP: REMOVE OBSOLETE COLUMNS AND FIX DATA
-- ============================================================================

DO $$
DECLARE
    visible_password_count INTEGER;
    supplier_productid_count INTEGER;
    performance_timestampid_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting legacy column cleanup migration...';
    
    -- ========================================================================
    -- STEP 1: REMOVE User.visible_password COLUMN
    -- ========================================================================
    
    -- Check if visible_password column has any meaningful data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'visible_password'
    ) THEN
        -- Count non-null visible_password entries
        EXECUTE 'SELECT COUNT(*) FROM "User" WHERE "visible_password" IS NOT NULL'
        INTO visible_password_count;
        
        RAISE NOTICE 'Found % User records with visible_password data', visible_password_count;
        
        -- Drop the visible_password column (security improvement)
        ALTER TABLE "User" DROP COLUMN "visible_password";
        RAISE NOTICE 'SECURITY: Dropped visible_password column from User table';
    ELSE
        RAISE NOTICE 'visible_password column does not exist in User table';
    END IF;
    
    -- ========================================================================
    -- STEP 2: FIX SUPPLIER.PRODUCTID INCORRECT DATA 
    -- ========================================================================
    
    -- The productId column in Supplier was incorrectly populated in migration 004
    -- Almost all suppliers point to product 100, which doesn't match SupplierProduct reality
    -- We should NULL these out since SupplierProduct is the canonical source
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Supplier' 
        AND column_name = 'productId'
    ) THEN
        -- Count current productId assignments
        EXECUTE 'SELECT COUNT(*) FROM "Supplier" WHERE "productId" IS NOT NULL'
        INTO supplier_productid_count;
        
        RAISE NOTICE 'Found % Supplier records with productId assignments', supplier_productid_count;
        
        -- NULL out the incorrectly populated productId values
        -- SupplierProduct table is the authoritative source for supplier-product relationships
        UPDATE "Supplier" SET "productId" = NULL WHERE "productId" IS NOT NULL;
        
        RAISE NOTICE 'Reset % Supplier.productId values to NULL (SupplierProduct is canonical)', 
                     supplier_productid_count;
    ELSE
        RAISE NOTICE 'productId column does not exist in Supplier table';
    END IF;
    
    -- ========================================================================
    -- STEP 3: REMOVE PERFORMANCE.TIMESTAMPID COLUMN (FULLY DEPRECATE)
    -- ========================================================================
    
    -- Migration 006 already NULLed these values and removed FK constraint
    -- Now we can safely drop the column entirely
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Performance' 
        AND column_name = 'timestampId'
    ) THEN
        -- Verify all values are NULL (should be from migration 006)
        EXECUTE 'SELECT COUNT(*) FROM "Performance" WHERE "timestampId" IS NOT NULL'
        INTO performance_timestampid_count;
        
        IF performance_timestampid_count = 0 THEN
            ALTER TABLE "Performance" DROP COLUMN "timestampId";
            RAISE NOTICE 'Dropped timestampId column from Performance table';
        ELSE
            RAISE WARNING 'Cannot drop timestampId: % records still have non-NULL values', 
                         performance_timestampid_count;
        END IF;
    ELSE
        RAISE NOTICE 'timestampId column does not exist in Performance table';
    END IF;
    
    -- ========================================================================
    -- STEP 4: OPTIONAL CLEANUP - REMOVE UNUSED INDEXES
    -- ========================================================================
    
    -- Remove index on Supplier.productId since we're nulling those values
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_supplier_product_id'
    ) THEN
        DROP INDEX IF EXISTS "idx_supplier_product_id";
        RAISE NOTICE 'Dropped idx_supplier_product_id index (column values nullified)';
    END IF;
    
    RAISE NOTICE 'Legacy column cleanup migration completed successfully';
    
END $$;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Verify User table no longer has visible_password
SELECT 
    COUNT(*) as visible_password_columns,
    'visible_password columns remaining in User table' as description
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'visible_password';

-- Verify Supplier.productId values are NULL
SELECT 
    COUNT(*) as suppliers_with_product_id,
    'Supplier records with non-NULL productId' as description
FROM "Supplier" 
WHERE "productId" IS NOT NULL;

-- Verify Performance.timestampId column is gone
SELECT 
    COUNT(*) as timestamp_id_columns,
    'timestampId columns remaining in Performance table' as description
FROM information_schema.columns 
WHERE table_name = 'Performance' 
AND column_name = 'timestampId';

-- Show current User table structure (should be cleaner)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Show Supplier-Product relationships (SupplierProduct is canonical)
SELECT 
    s.id as supplier_id,
    s.name as supplier_name,
    s."productId" as direct_product_id,
    COUNT(sp.product_id) as products_via_supplier_product
FROM "Supplier" s
LEFT JOIN "SupplierProduct" sp ON s.id = sp.supplier_id
GROUP BY s.id, s.name, s."productId"
ORDER BY s.id;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
LEGACY CLEANUP COMPLETED:

1. ✅ SECURITY: Removed User.visible_password column
   - Eliminates plaintext password storage security risk
   - Proper password handling should use hashed passwords only

2. ✅ DATA INTEGRITY: Fixed Supplier.productId incorrect assignments  
   - Migration 004 incorrectly assigned productId=100 to almost all suppliers
   - SupplierProduct table is the authoritative source for supplier-product relationships
   - Reset all Supplier.productId to NULL to avoid confusion

3. ✅ SCHEMA CLEANUP: Removed Performance.timestampId column
   - Migration 006 already removed FK constraint and NULLed values
   - Safe to drop column entirely for cleaner schema

4. ✅ INDEX CLEANUP: Removed unused idx_supplier_product_id index
   - No longer needed since Supplier.productId values are NULL
   - Reduces maintenance overhead

BENEFITS:
- Improved security (no plaintext passwords)
- Cleaner schema with fewer obsolete columns  
- Consistent data model (SupplierProduct as canonical supplier-product source)
- Reduced confusion from incorrectly populated columns
- Better performance (fewer unused indexes)

SUPPLIER-PRODUCT RELATIONSHIP CLARIFICATION:
- ✅ CORRECT: Use SupplierProduct table for all supplier-product relationships
- ❌ INCORRECT: Using Supplier.productId (now NULL, was incorrectly populated)
- Many-to-many relationships properly handled through junction table
*/
