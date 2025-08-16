#!/bin/bash

# Performance-GameSession Unification Script (Fixed)
# This script unifies Performance and GameDailyData records under the new GameSession structure
# Handles edge cases where GameSessions may be created after Performance records

echo "=============================================="
echo "Performance-GameSession Unification (Fixed)"
echo "=============================================="
echo "Database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo ""

# Source environment variables
source .env.local

echo "📋 Step 0: Current data state analysis..."
echo "=========================================="

# Get current data counts
PERFORMANCE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Performance\";" | tr -d ' ')
GAMEDAILYDATA_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"GameDailyData\";" | tr -d ' ')
GAMESESSION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"GameSession\";" | tr -d ' ')

echo "Current data counts:"
echo "- Performance records: $PERFORMANCE_COUNT"
echo "- GameDailyData records: $GAMEDAILYDATA_COUNT"  
echo "- GameSession records: $GAMESESSION_COUNT"
echo ""

# Show current data state with timestamps
echo "📊 Timeline analysis:"
psql "$DATABASE_URL" -c "
SELECT 
    'Performance' as table_name,
    \"userId\" as user_id, 
    \"levelId\" as level_id,
    \"createdAt\" as timestamp,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Performance' AND column_name = 'sessionId') 
         THEN COALESCE(\"sessionId\"::text, 'NULL') ELSE 'Column missing' END as sessionId_status
FROM \"Performance\"
UNION ALL
SELECT 
    'GameSession' as table_name,
    user_id, 
    level_id,
    created_at as timestamp,
    id::text as session_id
FROM \"GameSession\"
ORDER BY user_id, level_id, timestamp;
"
echo ""

echo "🔧 Step 1: Ensure Performance.sessionId column exists..."
echo "========================================================="

# Check if sessionId column exists, if not apply migration
HAS_SESSIONID=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'Performance' AND column_name = 'sessionId';
" | tr -d ' ')

if [ "$HAS_SESSIONID" -eq 0 ]; then
    echo "Adding sessionId column to Performance table..."
    psql "$DATABASE_URL" -f /Users/leoningman/Dev/lunicore-dev/LTH-Game/sql/migrations/005_add_sessionid_to_performance.sql
else
    echo "✅ sessionId column already exists in Performance table"
fi
echo ""

echo "🔍 Step 2: Enhanced matching analysis..."
echo "========================================"

# Create comprehensive matching analysis
echo "📊 Potential matches (including flexible timestamp matching):"
psql "$DATABASE_URL" -c "
WITH performance_session_matches AS (
    SELECT 
        p.id as performance_id,
        p.\"userId\",
        p.\"levelId\", 
        p.\"createdAt\" as performance_created,
        gs.id as session_id,
        gs.user_id,
        gs.level_id,
        gs.created_at as session_created,
        CASE 
            WHEN p.\"userId\" = gs.user_id AND p.\"levelId\" = gs.level_id THEN 'USER_LEVEL_MATCH'
            WHEN p.\"userId\" = gs.user_id THEN 'USER_MATCH_ONLY'
            ELSE 'NO_MATCH'
        END as match_status,
        ABS(EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at))) as time_diff_abs_seconds
    FROM \"Performance\" p
    CROSS JOIN \"GameSession\" gs
)
SELECT 
    performance_id,
    \"userId\",
    \"levelId\",
    performance_created,
    match_status,
    session_id,
    session_created,
    ROUND(time_diff_abs_seconds) as time_diff_seconds,
    CASE 
        WHEN match_status = 'USER_LEVEL_MATCH' THEN 'BEST_MATCH'
        WHEN match_status = 'USER_MATCH_ONLY' THEN 'FALLBACK_MATCH'
        ELSE 'NO_MATCH'
    END as recommended_action
FROM performance_session_matches
WHERE match_status != 'NO_MATCH'
ORDER BY performance_id, match_status, time_diff_abs_seconds;
"
echo ""

echo "🎯 Step 3: Smart backfill strategy..."
echo "====================================="

echo "🔄 Strategy 1: Exact (user_id, level_id) matches (closest by time)"

# First try: exact user+level matches with closest timestamp
EXACT_MATCHES=$(psql "$DATABASE_URL" -t -c "
WITH performance_session_matches AS (
    SELECT 
        p.id as performance_id,
        gs.id as session_id,
        ABS(EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at))) as time_diff_abs,
        ROW_NUMBER() OVER (
            PARTITION BY p.id 
            ORDER BY ABS(EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at)))
        ) as rank
    FROM \"Performance\" p
    JOIN \"GameSession\" gs ON (
        p.\"userId\" = gs.user_id 
        AND p.\"levelId\" = gs.level_id
    )
),
best_matches AS (
    SELECT performance_id, session_id
    FROM performance_session_matches 
    WHERE rank = 1
)
UPDATE \"Performance\" 
SET \"sessionId\" = bm.session_id
FROM best_matches bm 
WHERE \"Performance\".id = bm.performance_id
  AND \"Performance\".\"sessionId\" IS NULL;

SELECT COUNT(*) FROM best_matches;
" | tail -1 | tr -d ' ')

echo "✅ Exact matches found and applied: $EXACT_MATCHES"

# Check remaining unmatched
UNMATCHED_AFTER_EXACT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Performance\" WHERE \"sessionId\" IS NULL;
" | tr -d ' ')

if [ "$UNMATCHED_AFTER_EXACT" -gt 0 ]; then
    echo ""
    echo "🔄 Strategy 2: User-only matches for remaining orphans"
    
    USER_ONLY_MATCHES=$(psql "$DATABASE_URL" -t -c "
    WITH user_only_matches AS (
        SELECT 
            p.id as performance_id,
            gs.id as session_id,
            ABS(EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at))) as time_diff_abs,
            ROW_NUMBER() OVER (
                PARTITION BY p.id 
                ORDER BY ABS(EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at)))
            ) as rank
        FROM \"Performance\" p
        JOIN \"GameSession\" gs ON p.\"userId\" = gs.user_id
        WHERE p.\"sessionId\" IS NULL
    ),
    fallback_matches AS (
        SELECT performance_id, session_id
        FROM user_only_matches 
        WHERE rank = 1
    )
    UPDATE \"Performance\" 
    SET \"sessionId\" = fm.session_id
    FROM fallback_matches fm 
    WHERE \"Performance\".id = fm.performance_id;
    
    SELECT COUNT(*) FROM fallback_matches;
    " | tail -1 | tr -d ' ')
    
    echo "✅ User-only fallback matches applied: $USER_ONLY_MATCHES"
fi

# Final count of matched Performance records
FINAL_MATCHED=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Performance\" WHERE \"sessionId\" IS NOT NULL;
" | tr -d ' ')

FINAL_ORPHANED=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Performance\" WHERE \"sessionId\" IS NULL;
" | tr -d ' ')

echo ""
echo "📊 Performance backfill results:"
echo "- Total matched: $FINAL_MATCHED"
echo "- Still orphaned: $FINAL_ORPHANED"

if [ "$FINAL_ORPHANED" -gt 0 ]; then
    echo ""
    echo "⚠️  Remaining orphaned Performance records:"
    psql "$DATABASE_URL" -c "
    SELECT 
        id, \"userId\", \"levelId\", \"createdAt\",
        'No suitable GameSession found' as reason
    FROM \"Performance\" 
    WHERE \"sessionId\" IS NULL;
    "
fi
echo ""

echo "🎯 Step 4: Backfill GameDailyData.sessionId through Performance..."
echo "=================================================================="

if [ "$GAMEDAILYDATA_COUNT" -gt 0 ]; then
    # Backfill GameDailyData.sessionId through Performance relationship
    GAMEDAILYDATA_LINKED=$(psql "$DATABASE_URL" -t -c "
    WITH gamedailydata_update AS (
        UPDATE \"GameDailyData\" 
        SET \"sessionId\" = p.\"sessionId\"
        FROM \"Performance\" p 
        WHERE \"GameDailyData\".\"performanceId\" = p.id 
              AND p.\"sessionId\" IS NOT NULL
              AND \"GameDailyData\".\"sessionId\" IS NULL
        RETURNING \"GameDailyData\".id
    )
    SELECT COUNT(*) FROM gamedailydata_update;
    " | tr -d ' ')
    
    echo "✅ GameDailyData records linked: $GAMEDAILYDATA_LINKED"
    
    # Check for orphaned GameDailyData
    GAMEDAILYDATA_ORPHANED=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) 
    FROM \"GameDailyData\" gdd
    LEFT JOIN \"Performance\" p ON gdd.\"performanceId\" = p.id
    WHERE gdd.\"sessionId\" IS NULL;
    " | tr -d ' ')
    
    echo "📊 Orphaned GameDailyData records: $GAMEDAILYDATA_ORPHANED"
else
    echo "📊 No GameDailyData records to process"
    GAMEDAILYDATA_LINKED=0
    GAMEDAILYDATA_ORPHANED=0
fi
echo ""

echo "🔒 Step 5: Evaluate constraint options..."
echo "=========================================="

echo "📊 Analysis for constraint decisions:"
echo "- Performance records without sessionId: $FINAL_ORPHANED"
echo "- GameDailyData records without sessionId: ${GAMEDAILYDATA_ORPHANED:-0}"

# Performance table constraint decision
if [ "$FINAL_ORPHANED" -eq 0 ]; then
    echo "✅ All Performance records have sessionId - adding NOT NULL constraint"
    psql "$DATABASE_URL" -c "ALTER TABLE \"Performance\" ALTER COLUMN \"sessionId\" SET NOT NULL;" > /dev/null 2>&1
    PERFORMANCE_NOT_NULL_ADDED=true
else
    echo "⚠️  Cannot add NOT NULL constraint to Performance.sessionId (orphaned records exist)"
    PERFORMANCE_NOT_NULL_ADDED=false
fi

# GameDailyData constraint decision  
if [ "${GAMEDAILYDATA_ORPHANED:-0}" -eq 0 ] && [ "$GAMEDAILYDATA_COUNT" -gt 0 ]; then
    echo "✅ All GameDailyData records have sessionId - adding NOT NULL constraint"
    psql "$DATABASE_URL" -c "ALTER TABLE \"GameDailyData\" ALTER COLUMN \"sessionId\" SET NOT NULL;" > /dev/null 2>&1
    GAMEDAILYDATA_NOT_NULL_ADDED=true
else
    echo "📋 GameDailyData.sessionId remains nullable"
    GAMEDAILYDATA_NOT_NULL_ADDED=false
fi
echo ""

echo "🔍 Step 6: Final verification and relationship mapping..."
echo "========================================================"

echo "📊 Final unified data structure:"
psql "$DATABASE_URL" -c "
SELECT 
    gs.id as session_id,
    gs.user_id,
    gs.level_id,
    gs.created_at as session_created,
    COUNT(DISTINCT p.id) as linked_performance,
    COUNT(DISTINCT gdd.id) as linked_daily_data,
    STRING_AGG(DISTINCT p.id::text, ',') as performance_ids
FROM \"GameSession\" gs
LEFT JOIN \"Performance\" p ON gs.id = p.\"sessionId\"
LEFT JOIN \"GameDailyData\" gdd ON gs.id = gdd.\"sessionId\"
GROUP BY gs.id, gs.user_id, gs.level_id, gs.created_at
ORDER BY gs.created_at;
"

echo ""
echo "📋 Unmatched records summary:"
psql "$DATABASE_URL" -c "
SELECT 
    'Performance' as table_name,
    COUNT(*) as total_records,
    COUNT(\"sessionId\") as linked_records,
    COUNT(*) - COUNT(\"sessionId\") as orphaned_records,
    CASE 
        WHEN COUNT(*) = 0 THEN '0%'
        ELSE ROUND(COUNT(\"sessionId\") * 100.0 / COUNT(*), 1) || '%'
    END as success_rate
FROM \"Performance\"

UNION ALL

SELECT 
    'GameDailyData' as table_name,
    COUNT(*) as total_records,
    COUNT(\"sessionId\") as linked_records,
    COUNT(*) - COUNT(\"sessionId\") as orphaned_records,
    CASE 
        WHEN COUNT(*) = 0 THEN 'N/A'
        ELSE ROUND(COUNT(\"sessionId\") * 100.0 / COUNT(*), 1) || '%'
    END as success_rate
FROM \"GameDailyData\";
"
echo ""

echo "=============================================="
echo "Unification Analysis Complete!"
echo "=============================================="

# Calculate success rates safely
if [ "$PERFORMANCE_COUNT" -gt 0 ]; then
    PERFORMANCE_SUCCESS_RATE=$(echo "scale=1; $FINAL_MATCHED * 100 / $PERFORMANCE_COUNT" | bc -l)
else
    PERFORMANCE_SUCCESS_RATE="0"
fi

if [ "$GAMEDAILYDATA_COUNT" -gt 0 ]; then
    GAMEDAILYDATA_SUCCESS_RATE=$(echo "scale=1; $GAMEDAILYDATA_LINKED * 100 / $GAMEDAILYDATA_COUNT" | bc -l)
else
    GAMEDAILYDATA_SUCCESS_RATE="N/A"
fi

# Generate comprehensive JSON result
cat > performance_unification_result.json << EOF
{
  "analysis_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database_state": {
    "total_performance_records": $PERFORMANCE_COUNT,
    "total_gamedailydata_records": $GAMEDAILYDATA_COUNT,
    "total_gamesession_records": $GAMESESSION_COUNT
  },
  "backfill_results": {
    "performance_exact_matches": $EXACT_MATCHES,
    "performance_fallback_matches": ${USER_ONLY_MATCHES:-0},
    "performance_total_matched": $FINAL_MATCHED,
    "performance_orphaned": $FINAL_ORPHANED,
    "gamedailydata_linked": $GAMEDAILYDATA_LINKED,
    "gamedailydata_orphaned": ${GAMEDAILYDATA_ORPHANED:-0}
  },
  "constraints_applied": {
    "performance_sessionid_not_null": $PERFORMANCE_NOT_NULL_ADDED,
    "gamedailydata_sessionid_not_null": $GAMEDAILYDATA_NOT_NULL_ADDED
  },
  "success_metrics": {
    "performance_success_rate": "${PERFORMANCE_SUCCESS_RATE}%",
    "gamedailydata_success_rate": "${GAMEDAILYDATA_SUCCESS_RATE}%"
  },
  "unification_status": "$([ "$FINAL_ORPHANED" -eq 0 ] && [ "${GAMEDAILYDATA_ORPHANED:-0}" -eq 0 ] && echo "fully_unified" || echo "partially_unified")",
  "recommendations": [
    "$([ "$FINAL_ORPHANED" -eq 0 ] && echo "All Performance records successfully linked" || echo "Handle $FINAL_ORPHANED orphaned Performance records")",
    "$([ "${GAMEDAILYDATA_ORPHANED:-0}" -eq 0 ] && echo "All GameDailyData records successfully linked" || echo "Handle ${GAMEDAILYDATA_ORPHANED:-0} orphaned GameDailyData records")",
    "Update application code to use sessionId references",
    "Consider deprecating legacy reference patterns"
  ]
}
EOF

echo "📄 Result file: performance_unification_result.json"
echo ""
echo "📋 Final Summary:"
cat performance_unification_result.json | jq .

echo ""
echo "🎯 Migration Summary:"
echo "===================="
echo "✅ Performance.sessionId column: $([ "$PERFORMANCE_NOT_NULL_ADDED" = true ] && echo "Added with NOT NULL constraint" || echo "Added as nullable")"
echo "📊 Performance records matched: $FINAL_MATCHED/$PERFORMANCE_COUNT (${PERFORMANCE_SUCCESS_RATE}%)"
echo "📊 GameDailyData records linked: $GAMEDAILYDATA_LINKED/$GAMEDAILYDATA_COUNT"
echo "⚠️  Orphaned Performance records: $FINAL_ORPHANED"
echo "⚠️  Orphaned GameDailyData records: ${GAMEDAILYDATA_ORPHANED:-0}"

if [ "$FINAL_ORPHANED" -eq 0 ] && [ "${GAMEDAILYDATA_ORPHANED:-0}" -eq 0 ]; then
    echo ""
    echo "🎉 FULL UNIFICATION ACHIEVED!"
    echo "All records successfully linked to GameSession structure"
else
    echo ""
    echo "⚠️  PARTIAL UNIFICATION COMPLETED"
    echo "Some orphaned records remain but system is functional"
fi

echo ""
echo "Unification process complete! 🎉"
