#!/bin/bash

# Supplier Cardinality Analysis and Backfill Script
# Date: 2025-08-16
# Description: Analyzes supplier-product relationships and decides on schema approach

# Load environment variables
source .env.local

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in environment"
    exit 1
fi

echo "=============================================="
echo "Supplier-Product Cardinality Analysis"
echo "=============================================="
echo "Database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo ""

# First, let's create some test data to demonstrate the analysis
echo "📝 Creating test data for demonstration..."

psql "$DATABASE_URL" << 'EOF'
-- Insert some test products
INSERT INTO "Product" (name) VALUES 
('Hamburger Patties'),
('Hamburger Buns'), 
('Cheese Slices'),
('French Fries')
ON CONFLICT DO NOTHING;

-- Insert some test suppliers
INSERT INTO "Supplier" (name, base_price) VALUES 
('MeatCorp', 5.50),
('BreadBakery', 2.00),
('DairyCorp', 3.25),
('MultiSupplier', 4.00),
('VeggieFarms', 1.75)
ON CONFLICT DO NOTHING;

-- Insert supplier-product relationships using actual schema
-- Some suppliers have 1:1, others have 1:many
INSERT INTO "SupplierProduct" (supplier_id, product_id, lead_time, price_per_item, order_capacity, shipment_price_50) VALUES 
-- 1:1 relationships
(1, 1, 2, 5.50, 100, 25.00), -- MeatCorp -> Patties only
(2, 2, 1, 2.00, 200, 15.00), -- BreadBakery -> Buns only  
(3, 3, 1, 3.25, 150, 20.00), -- DairyCorp -> Cheese only
-- 1:many relationship
(4, 1, 3, 5.75, 80, 30.00),  -- MultiSupplier -> Patties
(4, 3, 2, 3.50, 120, 25.00), -- MultiSupplier -> Cheese
(4, 4, 4, 1.90, 300, 20.00), -- MultiSupplier -> Fries
-- Another 1:1
(5, 4, 2, 1.75, 250, 18.00)  -- VeggieFarms -> Fries only
ON CONFLICT (supplier_id, product_id) DO NOTHING;
EOF

echo "✅ Test data created"
echo ""

# Now run the cardinality analysis
echo "🔍 Step 1: Analyzing supplier-product cardinalities..."

# Get cardinality analysis with proper error handling
psql "$DATABASE_URL" -c "
WITH supplier_product_counts AS (
    SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(sp.product_id) as product_count,
        ARRAY_AGG(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL) as product_names
    FROM \"Supplier\" s
    LEFT JOIN \"SupplierProduct\" sp ON s.id = sp.supplier_id
    LEFT JOIN \"Product\" p ON sp.product_id = p.id
    GROUP BY s.id, s.name
),
cardinality_summary AS (
    SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN product_count = 1 THEN 1 END) as one_to_one_suppliers,
        COUNT(CASE WHEN product_count > 1 THEN 1 END) as one_to_many_suppliers,
        COUNT(CASE WHEN product_count = 0 THEN 1 END) as suppliers_with_no_products
    FROM supplier_product_counts
)
SELECT 
    'SUMMARY:' as label,
    total_suppliers,
    one_to_one_suppliers,
    one_to_many_suppliers,
    suppliers_with_no_products
FROM cardinality_summary;
" > cardinality_temp.txt

# Parse the results more safely
TOTAL_SUPPLIERS=$(grep "SUMMARY:" cardinality_temp.txt | awk '{print $3}')
ONE_TO_ONE=$(grep "SUMMARY:" cardinality_temp.txt | awk '{print $4}')
ONE_TO_MANY=$(grep "SUMMARY:" cardinality_temp.txt | awk '{print $5}')
NO_PRODUCTS=$(grep "SUMMARY:" cardinality_temp.txt | awk '{print $6}')

# Default to 0 if parsing failed
TOTAL_SUPPLIERS=${TOTAL_SUPPLIERS:-0}
ONE_TO_ONE=${ONE_TO_ONE:-0}
ONE_TO_MANY=${ONE_TO_MANY:-0}
NO_PRODUCTS=${NO_PRODUCTS:-0}

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
WITH supplier_product_counts AS (
    SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(sp.product_id) as product_count,
        ARRAY_AGG(p.name ORDER BY p.name) as product_names
    FROM \"Supplier\" s
    LEFT JOIN \"SupplierProduct\" sp ON s.id = sp.supplier_id
    LEFT JOIN \"Product\" p ON sp.product_id = p.id
    GROUP BY s.id, s.name
)
SELECT 
    supplier_name,
    product_count,
    CASE 
        WHEN product_count = 0 THEN 'No products'
        WHEN product_count = 1 THEN '1:1 (Lean schema OK)'
        ELSE '1:Many (Keep SupplierProduct)'
    END as relationship_type,
    COALESCE(product_names::text, 'None') as products
FROM supplier_product_counts
ORDER BY product_count DESC, supplier_name;
"

echo ""

# Decision logic
if [ "$ONE_TO_MANY" -gt 0 ]; then
    echo "🚨 DECISION: Keep SupplierProduct table (Many-to-many relationships found)"
    echo "==========================================================================="
    echo ""
    echo "❌ Cannot use lean schema approach because $ONE_TO_MANY supplier(s) map to multiple products:"
    
    # Show which suppliers have multiple products
    psql "$DATABASE_URL" -c "
    WITH supplier_product_counts AS (
        SELECT 
            s.id as supplier_id,
            s.name as supplier_name,
            COUNT(sp.product_id) as product_count,
            ARRAY_AGG(p.name ORDER BY p.name) as product_names
        FROM \"Supplier\" s
        LEFT JOIN \"SupplierProduct\" sp ON s.id = sp.supplier_id
        LEFT JOIN \"Product\" p ON sp.product_id = p.id
        GROUP BY s.id, s.name
        HAVING COUNT(sp.product_id) > 1
    )
    SELECT 
        '⚠️  ' || supplier_name as \"Supplier with Multiple Products\",
        product_count as \"Product Count\",
        product_names::text as \"Products\"
    FROM supplier_product_counts;
    "
    
    echo ""
    echo "📝 Actions taken:"
    echo "- ✅ Supplier.productId column exists but will remain unused"
    echo "- ✅ SupplierProduct table remains as canonical source"
    echo "- ⚠️  No backfill performed due to cardinality conflicts"
    
    # Update documentation
    cat > supplier_analysis_result.json << EOF
{
  "analysis_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_suppliers": $TOTAL_SUPPLIERS,
  "one_to_one_suppliers": $ONE_TO_ONE,
  "one_to_many_suppliers": $ONE_TO_MANY,
  "suppliers_with_no_products": $NO_PRODUCTS,
  "decision": "keep_supplier_product_table",
  "reason": "Many-to-many relationships detected",
  "supplier_productid_status": "unused_column",
  "supplier_product_table_status": "canonical_source",
  "backfill_performed": false
}
EOF
    
else
    echo "✅ DECISION: Use lean schema approach (All relationships are 1:1 or empty)"
    echo "=========================================================================="
    echo ""
    echo "🎯 All suppliers have at most one product. Proceeding with backfill..."
    
    # Perform backfill
    echo "📝 Step 2: Backfilling Supplier.productId from SupplierProduct..."
    
    BACKFILL_RESULT=$(psql "$DATABASE_URL" -t -c "
    UPDATE \"Supplier\" 
    SET \"productId\" = sp.product_id
    FROM \"SupplierProduct\" sp
    WHERE \"Supplier\".id = sp.supplier_id;
    
    SELECT COUNT(*) FROM \"Supplier\" WHERE \"productId\" IS NOT NULL;
    ")
    
    BACKFILLED_COUNT=$(echo $BACKFILL_RESULT | tr -d ' ')
    
    echo "✅ Backfilled $BACKFILLED_COUNT supplier records"
    
    # Only add NOT NULL constraint if all suppliers have products
    if [ "$NO_PRODUCTS" -eq 0 ]; then
        echo "📝 Step 3: Adding NOT NULL constraint to Supplier.productId..."
        psql "$DATABASE_URL" -c "
        ALTER TABLE \"Supplier\" 
        ALTER COLUMN \"productId\" SET NOT NULL;
        "
        echo "✅ NOT NULL constraint added"
        CONSTRAINT_ADDED=true
    else
        echo "⚠️  Step 3: Skipping NOT NULL constraint ($NO_PRODUCTS suppliers have no products)"
        CONSTRAINT_ADDED=false
    fi
    
    echo ""
    echo "📝 Actions taken:"
    echo "- ✅ Supplier.productId backfilled for $BACKFILLED_COUNT suppliers"
    if [ "$CONSTRAINT_ADDED" = true ]; then
        echo "- ✅ NOT NULL constraint added to Supplier.productId"
    else
        echo "- ⚠️  NOT NULL constraint skipped (some suppliers have no products)"
    fi
    echo "- 📋 SupplierProduct table marked as deprecated but preserved"
    
    # Update documentation
    cat > supplier_analysis_result.json << EOF
{
  "analysis_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_suppliers": $TOTAL_SUPPLIERS,
  "one_to_one_suppliers": $ONE_TO_ONE,
  "one_to_many_suppliers": $ONE_TO_MANY,
  "suppliers_with_no_products": $NO_PRODUCTS,
  "decision": "use_lean_schema",
  "reason": "All relationships are 1:1 or empty",
  "supplier_productid_status": "active_canonical",
  "supplier_product_table_status": "deprecated_preserved",
  "backfill_performed": true,
  "backfilled_count": $BACKFILLED_COUNT,
  "not_null_constraint_added": $CONSTRAINT_ADDED
}
EOF
fi

echo ""
echo "🔍 Step 4: Final verification..."
psql "$DATABASE_URL" -c "
SELECT 
    'Updated Supplier table:' as info;

SELECT 
    s.name as supplier_name,
    COALESCE(p.name, 'NULL') as direct_product,
    s.\"productId\" as product_id
FROM \"Supplier\" s
LEFT JOIN \"Product\" p ON s.\"productId\" = p.id
ORDER BY s.name;
"

echo ""
echo "=============================================="
echo "Analysis Complete!"
echo "=============================================="
echo "Result file: supplier_analysis_result.json"
echo ""

# Show final summary
echo "📋 Final Analysis Summary:"
if [ -f supplier_analysis_result.json ]; then
    if command -v jq &> /dev/null; then
        cat supplier_analysis_result.json | jq '.'
    else
        cat supplier_analysis_result.json
    fi
else
    echo "Error: Analysis result file not found"
fi

# Cleanup
rm -f cardinality_temp.txt
