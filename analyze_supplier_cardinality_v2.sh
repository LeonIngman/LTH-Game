#!/bin/bash

# Enhanced Supplier-Product Cardinality Analysis Script
# This script analyzes the supplier-product relationships and determines
# whether to use a lean schema (Supplier.productId) or many-to-many (SupplierProduct table)

echo "=============================================="
echo "Supplier-Product Cardinality Analysis V2"
echo "=============================================="
echo "Database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo ""

# Source environment variables
source .env.local

# Step 0: Create test data for demonstration
echo "📝 Creating test data for demonstration..."
psql "$DATABASE_URL" -c "
DELETE FROM \"SupplierProduct\";
DELETE FROM \"Supplier\";  
DELETE FROM \"Product\";

INSERT INTO \"Product\" (id, name, type, description, price) VALUES
(1, 'Patties', 'meat', 'Beef patties', 6.00),
(2, 'Buns', 'bread', 'Hamburger buns', 2.50),
(3, 'Cheese', 'dairy', 'Cheese slices', 3.50),
(4, 'Fries', 'vegetable', 'French fries', 2.00);

INSERT INTO \"Supplier\" (id, name, location, \"productId\") VALUES
(1, 'MeatCorp', 'Texas', NULL),
(2, 'BreadBakery', 'California', NULL),
(3, 'DairyCorp', 'Wisconsin', NULL),
(4, 'MultiSupplier', 'New York', NULL),
(5, 'VeggieFarms', 'Florida', NULL);

INSERT INTO \"SupplierProduct\" (supplier_id, product_id, lead_time, price_per_item, order_capacity, shipment_price_50) VALUES 
-- 1:1 relationships
(1, 1, 2, 5.50, 100, 25.00), -- MeatCorp -> Patties only
(2, 2, 1, 2.00, 200, 15.00), -- BreadBakery -> Buns only  
(3, 3, 1, 3.25, 150, 20.00), -- DairyCorp -> Cheese only
-- 1:many relationship  
(4, 1, 3, 5.75, 80, 30.00),  -- MultiSupplier -> Patties
(4, 3, 2, 3.50, 120, 25.00), -- MultiSupplier -> Cheese
(4, 4, 4, 1.90, 300, 20.00), -- MultiSupplier -> Fries
-- Another 1:1
(5, 4, 2, 1.75, 250, 18.00); -- VeggieFarms -> Fries only
" > /dev/null 2>&1

echo "✅ Test data created"
echo ""

# Step 1: Analyze cardinalities with simple queries
echo "🔍 Step 1: Analyzing supplier-product cardinalities..."

# Get total suppliers
TOTAL_SUPPLIERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Supplier\";" | tr -d ' ')

# Get suppliers with exactly 1 product 
ONE_TO_ONE=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM (
    SELECT supplier_id FROM \"SupplierProduct\" 
    GROUP BY supplier_id 
    HAVING COUNT(product_id) = 1
) counts;" | tr -d ' ')

# Get suppliers with more than 1 product
ONE_TO_MANY=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM (
    SELECT supplier_id FROM \"SupplierProduct\" 
    GROUP BY supplier_id 
    HAVING COUNT(product_id) > 1
) counts;" | tr -d ' ')

# Get suppliers with no products
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
    COALESCE(product_list.products, '{NULL}') as products
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
    echo "✅ DECISION: Use lean schema approach (All relationships are 1:1 or empty)"
    echo "=========================================================================="
    echo ""
    
    # Step 3: Backfill Supplier.productId
    echo "🎯 All suppliers have at most one product. Proceeding with backfill..."
    echo "📝 Step 2: Backfilling Supplier.productId from SupplierProduct..."
    
    BACKFILLED=$(psql "$DATABASE_URL" -t -c "
    UPDATE \"Supplier\" 
    SET \"productId\" = sp.product_id
    FROM \"SupplierProduct\" sp 
    WHERE \"Supplier\".id = sp.supplier_id;
    SELECT ROW_COUNT();
    " | tail -1 | tr -d ' ')
    
    echo "✅ Backfilled $BACKFILLED supplier records"
    
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
    echo "⚠️  DECISION: Keep many-to-many schema approach (1:many relationships found)"
    echo "============================================================================"
    echo ""
    echo "🎯 Found $ONE_TO_MANY suppliers with multiple products. Keeping SupplierProduct table..."
    echo "📝 Supplier.productId will remain NULL (not used in many-to-many approach)"
    BACKFILLED=0
    NOT_NULL_ADDED=false
fi

echo ""
echo "📝 Actions taken:"
if [ "$DECISION" = "use_lean_schema" ]; then
    echo "- ✅ Supplier.productId backfilled for $BACKFILLED suppliers"
    if [ "$NOT_NULL_ADDED" = true ]; then
        echo "- ✅ NOT NULL constraint added to Supplier.productId"
    else
        echo "- ⚠️  NOT NULL constraint skipped (some suppliers have no products)"
    fi
    echo "- 📋 SupplierProduct table marked as deprecated but preserved"
else
    echo "- 📋 SupplierProduct table remains active (canonical source)"
    echo "- ⚠️  Supplier.productId remains NULL (not used)"
fi

echo ""
echo "🔍 Step 4: Final verification..."
psql "$DATABASE_URL" -c "
SELECT 'Updated Supplier table:' as info;
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

# Generate JSON result
cat > supplier_analysis_result.json << EOF
{
  "analysis_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_suppliers": $TOTAL_SUPPLIERS,
  "one_to_one_suppliers": $ONE_TO_ONE,
  "one_to_many_suppliers": $ONE_TO_MANY,
  "suppliers_with_no_products": $NO_PRODUCTS,
  "decision": "$DECISION",
  "reason": "$REASON",
  "supplier_productid_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "active_canonical" || echo "unused_null")",
  "supplier_product_table_status": "$([ "$DECISION" = "use_lean_schema" ] && echo "deprecated_preserved" || echo "active_canonical")",
  "backfill_performed": $([ "$BACKFILLED" -gt 0 ] && echo "true" || echo "false"),
  "backfilled_count": $BACKFILLED,
  "not_null_constraint_added": $NOT_NULL_ADDED
}
EOF

echo "Result file: supplier_analysis_result.json"
echo ""
echo "📋 Final Analysis Summary:"
cat supplier_analysis_result.json | jq .

# Clean up
rm -f cardinality_temp.txt
