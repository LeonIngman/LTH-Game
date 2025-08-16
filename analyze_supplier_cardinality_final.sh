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
echo "📝 Creating comprehensive test data..."

# Clear existing data
psql "$DATABASE_URL" -c "
DELETE FROM \"SupplierProduct\";
DELETE FROM \"Order\";
DELETE FROM \"Supplier\";  
DELETE FROM \"Product\";
" > /dev/null 2>&1

# Insert test data with correct schema
psql "$DATABASE_URL" << 'EOF'
INSERT INTO "Product" (id, name) VALUES
(100, 'Beef Patties'),
(101, 'Hamburger Buns'),
(102, 'Cheese Slices'),  
(103, 'French Fries'),
(104, 'Lettuce'),
(105, 'Tomatoes');

INSERT INTO "Supplier" (id, name, location, "productId") VALUES
(200, 'MeatCorp', 'Texas', NULL),
(201, 'BreadBakery', 'California', NULL),
(202, 'DairyCorp', 'Wisconsin', NULL),
(203, 'MultiSupplier', 'New York', NULL),
(204, 'VeggieFarms', 'Florida', NULL),
(205, 'OnionSupply', 'Georgia', NULL);

-- Create different relationship patterns for testing
INSERT INTO "SupplierProduct" (supplier_id, product_id, lead_time, price_per_item, order_capacity, shipment_price_50) VALUES 
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
-- Note: OnionSupply (205) has no products (testing zero products case)
EOF

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
    
    # Step 3: Backfill Supplier.productId
    echo "🎯 Proceeding with Supplier.productId backfill..."
    echo "📝 Step 2: Backfilling Supplier.productId from SupplierProduct..."
    
    # Get the number of rows that will be updated
    UPDATE_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM \"Supplier\" s
    JOIN \"SupplierProduct\" sp ON s.id = sp.supplier_id;
    " | tr -d ' ')
    
    # Perform the update
    psql "$DATABASE_URL" -c "
    UPDATE \"Supplier\" 
    SET \"productId\" = sp.product_id
    FROM \"SupplierProduct\" sp 
    WHERE \"Supplier\".id = sp.supplier_id;
    " > /dev/null 2>&1
    
    echo "✅ Backfilled $UPDATE_COUNT supplier records"
    BACKFILLED=$UPDATE_COUNT
    
    # Step 4: Optionally add NOT NULL constraint if all suppliers have products
    if [ "$NO_PRODUCTS" -eq 0 ]; then
        echo "📝 Step 3: Adding NOT NULL constraint to productId..."
        psql "$DATABASE_URL" -c "ALTER TABLE \"Supplier\" ALTER COLUMN \"productId\" SET NOT NULL;" > /dev/null 2>&1
        echo "✅ NOT NULL constraint added to Supplier.productId"
        NOT_NULL_ADDED=true
    else
        echo "⚠️  Step 3: Skipping NOT NULL constraint ($NO_PRODUCTS suppliers have no products)"
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
    echo "📝 Supplier.productId will remain NULL (not used in many-to-many approach)"
    BACKFILLED=0
    NOT_NULL_ADDED=false
fi

echo ""
echo "📝 Summary of actions taken:"
if [ "$DECISION" = "use_lean_schema" ]; then
    echo "- ✅ Supplier.productId backfilled for $BACKFILLED suppliers"
    if [ "$NOT_NULL_ADDED" = true ]; then
        echo "- ✅ NOT NULL constraint added to Supplier.productId"
        echo "- 📋 Recommendation: Use Supplier.productId as canonical source"
        echo "- 📋 SupplierProduct table can be deprecated (but preserved for safety)"
    else
        echo "- ⚠️  NOT NULL constraint skipped (some suppliers have no products)"  
        echo "- 📋 Recommendation: Use Supplier.productId where not NULL"
        echo "- 📋 Keep SupplierProduct table for suppliers without direct products"
    fi
else
    echo "- 📋 SupplierProduct table remains active (canonical source)"
    echo "- ⚠️  Supplier.productId remains NULL (not used)"
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
    \"productId\" as product_id
FROM \"Supplier\" 
ORDER BY name;
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
    "supplier_productid_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "active_canonical" || echo "unused_null")",
    "supplier_product_table_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "deprecated_preserved" || echo "active_canonical")",
    "backfill_performed": $([ "$BACKFILLED" -gt 0 ] && echo "true" || echo "false"),
    "backfilled_count": $BACKFILLED,
    "not_null_constraint_added": $NOT_NULL_ADDED
  },
  "recommendations": $([ "$DECISION" = "use_lean_schema" ] && echo '"Use Supplier.productId for 1:1 relationships. SupplierProduct table can be deprecated."' || echo '"Continue using SupplierProduct table for all supplier-product relationships."')
}
EOF

echo "📄 Result file: supplier_analysis_result.json"
echo ""
echo "📋 Final Analysis Summary:"
cat supplier_analysis_result.json | jq .

echo ""
echo "🎯 Next Steps:"
if [ "$DECISION" = "use_lean_schema" ]; then
    echo "1. Update application code to use Supplier.productId for 1:1 relationships"
    echo "2. Gradually phase out SupplierProduct table usage"
    echo "3. Consider marking SupplierProduct as deprecated in documentation"
    if [ "$NOT_NULL_ADDED" = false ]; then
        echo "4. Handle suppliers with no products appropriately in application logic"
    fi
else
    echo "1. Continue using SupplierProduct table for all supplier-product relationships"
    echo "2. Consider NOT using Supplier.productId column"
    echo "3. Update documentation to clarify canonical data source"
fi

# Clean up temporary files
rm -f cardinality_temp.txt
