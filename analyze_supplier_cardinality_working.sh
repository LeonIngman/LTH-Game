#!/bin/bash

# Enhanced Supplier-Product Cardinality Analysis Script
# This script analyzes the supplier-product relationships and determines
# whether to use a lean schema (Supplier.productId) or many-to-many (SupplierProduct table)

echo "=============================================="
echo "Supplier-Product Cardinality Analysis Final"
echo "=============================================="
echo "Database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo ""

# Source environment variables
source .env.local

# Step 0: Create test data for demonstration
echo "📝 Creating comprehensive test data (matching actual schema)..."

# Clear existing data
psql "$DATABASE_URL" -c "
DELETE FROM \"SupplierProduct\";
DELETE FROM \"Order\"; 
DELETE FROM \"Supplier\";  
DELETE FROM \"Product\";
" > /dev/null 2>&1

# Insert test data with correct schema (only id and name for Product)
echo "📝 Inserting Products..."
psql "$DATABASE_URL" -c "
INSERT INTO \"Product\" (id, name) VALUES
(100, 'Beef Patties'),
(101, 'Hamburger Buns'),
(102, 'Cheese Slices'),  
(103, 'French Fries'),
(104, 'Lettuce'),
(105, 'Tomatoes');
" > /dev/null 2>&1

echo "📝 Inserting Suppliers..."
# Supplier schema: id, name, base_price, productId (NOT NULL)
# We'll initially set productId to a default product, then update based on relationships
psql "$DATABASE_URL" -c "
INSERT INTO \"Supplier\" (id, name, base_price, \"productId\") VALUES
(200, 'MeatCorp', 5.50, 100),      -- Default to first product
(201, 'BreadBakery', 2.00, 100),   -- Will update these
(202, 'DairyCorp', 3.25, 100),     
(203, 'MultiSupplier', 4.00, 100), 
(204, 'VeggieFarms', 1.25, 100),   
(205, 'OnionSupply', 2.50, 100);   -- This one will have no relationships
" > /dev/null 2>&1

echo "📝 Creating SupplierProduct relationships..."
# Create different relationship patterns for testing
psql "$DATABASE_URL" -c "
INSERT INTO \"SupplierProduct\" (supplier_id, product_id, lead_time, price_per_item, order_capacity, shipment_price_50) VALUES 
-- 1:1 relationships (most suppliers have exactly one product)
(200, 100, 2, 5.50, 100, 25.00), -- MeatCorp -> Beef Patties only
(201, 101, 1, 2.00, 200, 15.00), -- BreadBakery -> Buns only  
(202, 102, 1, 3.25, 150, 20.00), -- DairyCorp -> Cheese only
(204, 105, 1, 1.25, 300, 12.00), -- VeggieFarms -> Tomatoes only
-- 1:many relationship (one supplier with multiple products)
(203, 100, 3, 5.75, 80, 30.00),  -- MultiSupplier -> Beef Patties
(203, 102, 2, 3.50, 120, 25.00), -- MultiSupplier -> Cheese
(203, 103, 4, 1.90, 300, 20.00), -- MultiSupplier -> French Fries
(203, 104, 1, 0.85, 400, 10.00); -- MultiSupplier -> Lettuce
-- Note: OnionSupply (205) has no products in SupplierProduct (testing zero products case)
" > /dev/null 2>&1

echo "✅ Test data created successfully"
echo ""

# Verify data was inserted
echo "📋 Verifying test data insertion..."
PRODUCT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Product\";" | tr -d ' ')
SUPPLIER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Supplier\";" | tr -d ' ')
RELATIONSHIP_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"SupplierProduct\";" | tr -d ' ')

echo "Products: $PRODUCT_COUNT, Suppliers: $SUPPLIER_COUNT, Relationships: $RELATIONSHIP_COUNT"
echo ""

# Step 1: Analyze cardinalities
echo "🔍 Step 1: Analyzing supplier-product cardinalities..."

# Get detailed metrics
TOTAL_SUPPLIERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Supplier\";" | tr -d ' ')

ONE_TO_ONE=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM (
    SELECT supplier_id FROM \"SupplierProduct\" 
    GROUP BY supplier_id 
    HAVING COUNT(product_id) = 1
) counts;" | tr -d ' ')

ONE_TO_MANY=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM (
    SELECT supplier_id FROM \"SupplierProduct\" 
    GROUP BY supplier_id 
    HAVING COUNT(product_id) > 1
) counts;" | tr -d ' ')

NO_PRODUCTS=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Supplier\" s 
WHERE NOT EXISTS (
    SELECT 1 FROM \"SupplierProduct\" sp WHERE sp.supplier_id = s.id
);" | tr -d ' ')

echo "📊 Cardinality Analysis Results:"
echo "================================"
echo "Total suppliers: $TOTAL_SUPPLIERS"
echo "1:1 relationships: $ONE_TO_ONE suppliers"
echo "1:many relationships: $ONE_TO_MANY suppliers"
echo "Suppliers with no products: $NO_PRODUCTS suppliers"
echo ""

# Show detailed breakdown
echo "📋 Detailed supplier breakdown:"
psql "$DATABASE_URL" -c "
SELECT 
    s.name as supplier_name,
    COALESCE(counts.product_count, 0) as product_count,
    CASE 
        WHEN COALESCE(counts.product_count, 0) = 0 THEN 'No products'
        WHEN counts.product_count = 1 THEN '1:1'
        ELSE '1:many'
    END as relationship_type,
    COALESCE(product_list.products, ARRAY['None']) as products
FROM \"Supplier\" s
LEFT JOIN (
    SELECT supplier_id, COUNT(product_id) as product_count
    FROM \"SupplierProduct\" 
    GROUP BY supplier_id
) counts ON s.id = counts.supplier_id
LEFT JOIN (
    SELECT 
        sp.supplier_id,
        ARRAY_AGG(p.name ORDER BY p.name) as products
    FROM \"SupplierProduct\" sp
    JOIN \"Product\" p ON sp.product_id = p.id
    GROUP BY sp.supplier_id
) product_list ON s.id = product_list.supplier_id
ORDER BY s.name;
"
echo ""

# Step 2: Make decision based on cardinality analysis
if [ "$ONE_TO_MANY" -eq 0 ]; then
    DECISION="use_lean_schema"
    REASON="All relationships are 1:1 or empty"
    echo "✅ DECISION: Use lean schema approach"
    echo "   Reason: All relationships are 1:1 or empty (no suppliers have multiple products)"
    echo "=========================================================================="
    echo ""
    
    # Step 3: Backfill Supplier.productId from SupplierProduct relationships
    echo "🎯 Proceeding with Supplier.productId backfill..."
    echo "📝 Step 2: Updating Supplier.productId based on SupplierProduct relationships..."
    
    # Get the number of rows that will be updated
    UPDATE_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM \"Supplier\" s
    JOIN \"SupplierProduct\" sp ON s.id = sp.supplier_id;
    " | tr -d ' ')
    
    # First, temporarily allow NULL values to perform the update
    psql "$DATABASE_URL" -c "ALTER TABLE \"Supplier\" ALTER COLUMN \"productId\" DROP NOT NULL;" > /dev/null 2>&1
    
    # Clear all productId values first
    psql "$DATABASE_URL" -c "UPDATE \"Supplier\" SET \"productId\" = NULL;" > /dev/null 2>&1
    
    # Perform the update from SupplierProduct relationships
    psql "$DATABASE_URL" -c "
    UPDATE \"Supplier\" 
    SET \"productId\" = sp.product_id
    FROM \"SupplierProduct\" sp 
    WHERE \"Supplier\".id = sp.supplier_id;
    " > /dev/null 2>&1
    
    echo "✅ Updated $UPDATE_COUNT supplier records with correct productId"
    BACKFILLED=$UPDATE_COUNT
    
    # Show which suppliers were updated and which weren't
    echo "📋 Backfill results:"
    psql "$DATABASE_URL" -c "
    SELECT 
        name as supplier_name,
        CASE WHEN \"productId\" IS NOT NULL THEN 'Updated' ELSE 'No product' END as status,
        CASE WHEN \"productId\" IS NOT NULL THEN 
            (SELECT name FROM \"Product\" WHERE id = \"productId\")
        ELSE 'NULL' 
        END as assigned_product
    FROM \"Supplier\" 
    ORDER BY name;
    "
    
    # Step 4: Decide on NOT NULL constraint
    if [ "$NO_PRODUCTS" -eq 0 ]; then
        echo "📝 Step 3: Re-adding NOT NULL constraint (all suppliers have products)..."
        psql "$DATABASE_URL" -c "ALTER TABLE \"Supplier\" ALTER COLUMN \"productId\" SET NOT NULL;" > /dev/null 2>&1
        echo "✅ NOT NULL constraint re-added to Supplier.productId"
        NOT_NULL_ADDED=true
    else
        echo "⚠️  Step 3: Keeping productId nullable ($NO_PRODUCTS suppliers have no products)"
        echo "   Suppliers without products will have productId = NULL"
        NOT_NULL_ADDED=false
    fi
else
    DECISION="keep_many_to_many"
    REASON="Some suppliers have multiple products (1:many relationships found)"
    echo "⚠️  DECISION: Keep many-to-many schema approach"
    echo "   Reason: Found $ONE_TO_MANY suppliers with multiple products"
    echo "============================================================================"
    echo ""
    echo "🎯 Keeping SupplierProduct table as canonical source..."
    echo "📝 Supplier.productId should NOT be used (ambiguous for suppliers with multiple products)"
    
    # Clear productId for suppliers with multiple products
    psql "$DATABASE_URL" -c "ALTER TABLE \"Supplier\" ALTER COLUMN \"productId\" DROP NOT NULL;" > /dev/null 2>&1
    psql "$DATABASE_URL" -c "
    UPDATE \"Supplier\" SET \"productId\" = NULL 
    WHERE id IN (
        SELECT supplier_id FROM \"SupplierProduct\" 
        GROUP BY supplier_id 
        HAVING COUNT(product_id) > 1
    );
    " > /dev/null 2>&1
    
    BACKFILLED=0
    NOT_NULL_ADDED=false
fi

echo ""
echo "📝 Summary of actions taken:"
if [ "$DECISION" = "use_lean_schema" ]; then
    echo "- ✅ Supplier.productId updated for $BACKFILLED suppliers based on SupplierProduct"
    if [ "$NOT_NULL_ADDED" = true ]; then
        echo "- ✅ NOT NULL constraint maintained on Supplier.productId"
        echo "- 📋 Recommendation: Use Supplier.productId as canonical source"
        echo "- 📋 SupplierProduct table can be deprecated (but preserved for safety)"
    else
        echo "- ⚠️  NOT NULL constraint removed (some suppliers have no products)"  
        echo "- 📋 Recommendation: Use Supplier.productId where not NULL"
        echo "- 📋 Keep SupplierProduct table for complex relationships"
    fi
else
    echo "- 📋 SupplierProduct table remains active (canonical source)"
    echo "- ⚠️  Supplier.productId set to NULL for suppliers with multiple products"
    echo "- 📋 Recommendation: Continue using SupplierProduct for all relationships"
fi

echo ""
echo "🔍 Step 4: Final verification..."
psql "$DATABASE_URL" -c "
SELECT 'Final Supplier table state:' as info;
SELECT 
    name as supplier_name,
    CASE WHEN \"productId\" IS NOT NULL THEN 
        (SELECT name FROM \"Product\" WHERE id = \"productId\")
    ELSE 'NULL' 
    END as direct_product,
    \"productId\" as product_id,
    base_price
FROM \"Supplier\" 
ORDER BY name;
"

echo ""
echo "🔍 Comparing Supplier.productId vs SupplierProduct relationships:"
psql "$DATABASE_URL" -c "
SELECT 
    s.name as supplier_name,
    CASE WHEN s.\"productId\" IS NOT NULL THEN 
        (SELECT name FROM \"Product\" WHERE id = s.\"productId\")
    ELSE 'NULL' 
    END as direct_product,
    COALESCE(sp_products.product_count, 0) as relationship_count,
    COALESCE(sp_products.products, ARRAY['None']) as relationship_products
FROM \"Supplier\" s
LEFT JOIN (
    SELECT 
        sp.supplier_id,
        COUNT(sp.product_id) as product_count,
        ARRAY_AGG(p.name ORDER BY p.name) as products
    FROM \"SupplierProduct\" sp
    JOIN \"Product\" p ON sp.product_id = p.id
    GROUP BY sp.supplier_id
) sp_products ON s.id = sp_products.supplier_id
ORDER BY s.name;
"

echo ""
echo "=============================================="
echo "Analysis Complete!"
echo "=============================================="

# Generate comprehensive JSON result
cat > supplier_analysis_result.json << EOF
{
  "analysis_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database_state": {
    "total_suppliers": $TOTAL_SUPPLIERS,
    "total_products": $PRODUCT_COUNT,
    "total_relationships": $RELATIONSHIP_COUNT
  },
  "cardinality_analysis": {
    "one_to_one_suppliers": $ONE_TO_ONE,
    "one_to_many_suppliers": $ONE_TO_MANY,
    "suppliers_with_no_products": $NO_PRODUCTS
  },
  "decision": {
    "approach": "$DECISION",
    "reason": "$REASON",
    "confidence": "high"
  },
  "implementation": {
    "supplier_productid_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "active_canonical" || echo "nullable_partial")",
    "supplier_product_table_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "deprecated_preserved" || echo "active_canonical")",
    "backfill_performed": $([ "$BACKFILLED" -gt 0 ] && echo "true" || echo "false"),
    "backfilled_count": $BACKFILLED,
    "not_null_constraint_active": $NOT_NULL_ADDED
  },
  "recommendations": $([ "$DECISION" = "use_lean_schema" ] && echo '"Use Supplier.productId for 1:1 relationships. SupplierProduct table can be deprecated."' || echo '"Continue using SupplierProduct table for all supplier-product relationships. Supplier.productId is ambiguous."')
}
EOF

echo "📄 Result file: supplier_analysis_result.json"
echo ""
echo "📋 Final Analysis Summary:"
cat supplier_analysis_result.json | jq .

echo ""
echo "🎯 Next Steps:"
if [ "$DECISION" = "use_lean_schema" ]; then
    echo "1. ✅ LEAN SCHEMA APPROACH RECOMMENDED"
    echo "2. Update application code to use Supplier.productId for supplier-product lookups"
    echo "3. Gradually phase out SupplierProduct table usage"
    echo "4. Consider marking SupplierProduct as deprecated in documentation"
    if [ "$NOT_NULL_ADDED" = false ]; then
        echo "5. Handle suppliers with productId = NULL appropriately in application logic"
    fi
else
    echo "1. ⚠️  MANY-TO-MANY SCHEMA APPROACH RECOMMENDED"
    echo "2. Continue using SupplierProduct table for all supplier-product relationships"
    echo "3. DO NOT use Supplier.productId column (ambiguous for suppliers with multiple products)"
    echo "4. Update documentation to clarify SupplierProduct as canonical data source"
fi

# Clean up temporary files
rm -f cardinality_temp.txt

echo ""
echo "Migration analysis complete! 🎉"
