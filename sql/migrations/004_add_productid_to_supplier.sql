-- Migration: Add productId to Supplier table
-- Date: 2025-08-16
-- Description: Add nullable productId foreign key to Product, keeping SupplierProduct table

-- Add productId column to Supplier if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Supplier' 
        AND column_name = 'productId'
    ) THEN
        ALTER TABLE "Supplier" ADD COLUMN "productId" INTEGER;
        COMMENT ON COLUMN "Supplier"."productId" IS 'Optional direct reference to Product for new lean schema';
    END IF;
END $$;

-- Add foreign key constraint for productId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Supplier_productId_fkey'
        AND table_name = 'Supplier'
    ) THEN
        ALTER TABLE "Supplier" 
        ADD CONSTRAINT "Supplier_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on productId if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_supplier_product_id'
    ) THEN
        CREATE INDEX "idx_supplier_product_id" ON "Supplier"("productId");
    END IF;
END $$;
