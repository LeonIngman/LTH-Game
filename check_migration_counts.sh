#!/bin/bash

# Database Row Count Checker for Migration Verification
# Usage: ./check_migration_counts.sh [baseline_file]

BASELINE_FILE=${1:-"migration_baseline_20250816_142151.json"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="migration_check_${TIMESTAMP}.json"

echo "Loading environment variables..."
source .env.local

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in environment"
    exit 1
fi

echo "Checking database row counts..."
echo "Baseline file: $BASELINE_FILE"
echo "Output file: $OUTPUT_FILE"

# Get current row counts
COUNTS=$(psql "$DATABASE_URL" -t -c "
SELECT json_object_agg(table_name, row_count) FROM (
  SELECT 'User' as table_name, COUNT(*) as row_count FROM \"User\"
  UNION ALL SELECT 'Session' as table_name, COUNT(*) as row_count FROM \"Session\"
  UNION ALL SELECT 'GameLevel' as table_name, COUNT(*) as row_count FROM \"GameLevel\"
  UNION ALL SELECT 'GameSession' as table_name, COUNT(*) as row_count FROM \"GameSession\"
  UNION ALL SELECT 'Performance' as table_name, COUNT(*) as row_count FROM \"Performance\"
  UNION ALL SELECT 'GameDailyData' as table_name, COUNT(*) as row_count FROM \"GameDailyData\"
  UNION ALL SELECT 'TimeStamp' as table_name, COUNT(*) as row_count FROM \"TimeStamp\"
  UNION ALL SELECT 'Product' as table_name, COUNT(*) as row_count FROM \"Product\"
  UNION ALL SELECT 'Supplier' as table_name, COUNT(*) as row_count FROM \"Supplier\"
  UNION ALL SELECT 'SupplierProduct' as table_name, COUNT(*) as row_count FROM \"SupplierProduct\"
  UNION ALL SELECT 'Order' as table_name, COUNT(*) as row_count FROM \"Order\"
  UNION ALL SELECT 'QuizSubmission' as table_name, COUNT(*) as row_count FROM \"QuizSubmission\"
) counts;
")

# Clean up the psql output (remove leading/trailing whitespace)
COUNTS=$(echo "$COUNTS" | tr -d ' \t\n\r')

# Create comparison report
cat > "$OUTPUT_FILE" << EOF
{
  "migration_verification": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "supply_chain_game",
    "baseline_file": "$BASELINE_FILE",
    "current_counts": $COUNTS,
    "comparison_status": "pending_analysis"
  }
}
EOF

echo "Current row counts saved to: $OUTPUT_FILE"

# If baseline file exists, show comparison
if [ -f "$BASELINE_FILE" ]; then
    echo ""
    echo "=== MIGRATION COMPARISON ==="
    echo ""
    
    # Extract baseline counts using jq if available
    if command -v jq &> /dev/null; then
        echo "Table-by-table comparison:"
        echo "========================="
        
        # Get baseline and current data
        BASELINE_JSON=$(cat "$BASELINE_FILE")
        CURRENT_JSON=$(cat "$OUTPUT_FILE")
        
        # Compare each table
        for table in User Session GameLevel GameSession Performance GameDailyData TimeStamp Product Supplier SupplierProduct Order QuizSubmission; do
            BASELINE_COUNT=$(echo "$BASELINE_JSON" | jq -r ".migration_baseline.tables.$table")
            CURRENT_COUNT=$(echo "$CURRENT_JSON" | jq -r ".migration_verification.current_counts.$table")
            
            if [ "$BASELINE_COUNT" = "$CURRENT_COUNT" ]; then
                echo "✅ $table: $BASELINE_COUNT → $CURRENT_COUNT (unchanged)"
            else
                DIFF=$((CURRENT_COUNT - BASELINE_COUNT))
                if [ $DIFF -gt 0 ]; then
                    echo "📈 $table: $BASELINE_COUNT → $CURRENT_COUNT (+$DIFF)"
                else
                    echo "📉 $table: $BASELINE_COUNT → $CURRENT_COUNT ($DIFF)"
                fi
            fi
        done
        
        # Calculate totals
        BASELINE_TOTAL=$(echo "$BASELINE_JSON" | jq -r '.migration_baseline.totals.total_rows')
        CURRENT_TOTAL=$(echo "$CURRENT_JSON" | jq -r '.migration_verification.current_counts | add')
        
        echo ""
        echo "Total rows: $BASELINE_TOTAL → $CURRENT_TOTAL"
        
        # Update the output file with comparison status
        if [ "$BASELINE_TOTAL" = "$CURRENT_TOTAL" ]; then
            TEMP_FILE=$(mktemp)
            jq '.migration_verification.comparison_status = "counts_match"' "$OUTPUT_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$OUTPUT_FILE"
            echo "✅ Migration verification: Row counts match baseline"
        else
            TEMP_FILE=$(mktemp)
            jq '.migration_verification.comparison_status = "counts_differ"' "$OUTPUT_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$OUTPUT_FILE"
            echo "⚠️  Migration verification: Row counts differ from baseline"
        fi
    else
        echo "Install 'jq' for detailed comparison analysis"
        echo "Raw current counts: $COUNTS"
    fi
else
    echo "Baseline file not found: $BASELINE_FILE"
    echo "Raw current counts: $COUNTS"
fi
