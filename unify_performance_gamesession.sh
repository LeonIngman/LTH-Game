#!/bin/bash

# Performance-GameSession Unification Script
# This script unifies Performance and GameDailyData records under the new GameSession structure
# by finding matching sessions and backfilling sessionId references

echo "=============================================="
echo "Performance-GameSession Unification Analysis"
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

# Show current data state
echo "📊 Performance records:"
psql "$DATABASE_URL" -c "
SELECT id, \"userId\", \"levelId\", \"createdAt\", 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Performance' AND column_name = 'sessionId') 
            THEN \"sessionId\"::text ELSE 'Column not exists' END as sessionId_status
FROM \"Performance\" 
ORDER BY \"createdAt\";
"

echo "📊 GameSession records:"
psql "$DATABASE_URL" -c "
SELECT id, user_id, level_id, created_at, \"isCompleted\"
FROM \"GameSession\" 
ORDER BY created_at;
"

echo "📊 GameDailyData records (first 5):"
psql "$DATABASE_URL" -c "
SELECT id, \"performanceId\", \"sessionId\", day
FROM \"GameDailyData\" 
ORDER BY id
LIMIT 5;
"
echo ""

echo "🔧 Step 1: Ensure Performance.sessionId column exists..."
echo "========================================================="

# Apply migration 005 to add sessionId column to Performance
psql "$DATABASE_URL" -f /Users/leoningman/Dev/lunicore-dev/LTH-Game/sql/migrations/005_add_sessionid_to_performance.sql

echo "✅ Performance table structure updated"
echo ""

echo "🔍 Step 2: Analyze Performance-GameSession matching potential..."
echo "================================================================"

# Create analysis query to see potential matches
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
            WHEN p.\"userId\" = gs.user_id AND p.\"levelId\" = gs.level_id 
                 AND gs.created_at <= p.\"createdAt\" THEN 'MATCH'
            WHEN p.\"userId\" = gs.user_id AND p.\"levelId\" = gs.level_id 
                 AND gs.created_at > p.\"createdAt\" THEN 'FUTURE_SESSION'
            WHEN p.\"userId\" = gs.user_id THEN 'USER_MATCH_LEVEL_DIFF'
            ELSE 'NO_MATCH'
        END as match_status,
        CASE 
            WHEN p.\"userId\" = gs.user_id AND p.\"levelId\" = gs.level_id 
                 AND gs.created_at <= p.\"createdAt\" 
            THEN EXTRACT(EPOCH FROM (p.\"createdAt\" - gs.created_at))
            ELSE NULL
        END as time_diff_seconds
    FROM \"Performance\" p
    CROSS JOIN \"GameSession\" gs
)
SELECT 
    performance_id,
    \"userId\",
    \"levelId\",
    performance_created,
    COUNT(CASE WHEN match_status = 'MATCH' THEN 1 END) as potential_matches,
    MIN(CASE WHEN match_status = 'MATCH' THEN session_id END) as closest_session_id,
    MIN(CASE WHEN match_status = 'MATCH' THEN time_diff_seconds END) as min_time_diff
FROM performance_session_matches
GROUP BY performance_id, \"userId\", \"levelId\", performance_created
ORDER BY performance_id;
"
echo ""

echo "🎯 Step 3: Backfill Performance.sessionId..."
echo "============================================="

# Perform the backfill using a sophisticated matching algorithm
BACKFILL_RESULT=$(psql "$DATABASE_URL" -t -c "
WITH performance_session_matches AS (
    SELECT 
        p.id as performance_id,
        p.\"userId\",
        p.\"levelId\",
        p.\"createdAt\" as performance_created,
        gs.id as session_id,
        gs.created_at as session_created,
        ROW_NUMBER() OVER (
            PARTITION BY p.id 
            ORDER BY gs.created_at DESC
        ) as session_rank
    FROM \"Performance\" p
    JOIN \"GameSession\" gs ON (
        p.\"userId\" = gs.user_id 
        AND p.\"levelId\" = gs.level_id 
        AND gs.created_at <= p.\"createdAt\"
    )
),
best_matches AS (
    SELECT performance_id, session_id
    FROM performance_session_matches 
    WHERE session_rank = 1
)
UPDATE \"Performance\" 
SET \"sessionId\" = bm.session_id
FROM best_matches bm 
WHERE \"Performance\".id = bm.performance_id;

SELECT ROW_COUNT();
" | tail -1 | tr -d ' ')

echo "✅ Performance backfill completed"
echo "📊 Performance records matched: $BACKFILL_RESULT"
echo ""

# Check for orphaned Performance records
echo "🔍 Step 4: Check for orphaned Performance records..."
echo "====================================================="

ORPHANED_PERFORMANCE=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Performance\" WHERE \"sessionId\" IS NULL;
" | tr -d ' ')

echo "📊 Orphaned Performance records: $ORPHANED_PERFORMANCE"

if [ "$ORPHANED_PERFORMANCE" -gt 0 ]; then
    echo "⚠️  Found orphaned Performance records:"
    psql "$DATABASE_URL" -c "
    SELECT 
        id, \"userId\", \"levelId\", \"createdAt\",
        'No matching GameSession found' as reason
    FROM \"Performance\" 
    WHERE \"sessionId\" IS NULL;
    "
fi
echo ""

echo "🎯 Step 5: Backfill GameDailyData.sessionId through Performance..."
echo "=================================================================="

# First check current GameDailyData sessionId state
GAMEDAILYDATA_WITH_SESSION=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"GameDailyData\" WHERE \"sessionId\" IS NOT NULL;
" | tr -d ' ')

echo "📊 GameDailyData records already with sessionId: $GAMEDAILYDATA_WITH_SESSION"

# Backfill GameDailyData.sessionId through Performance relationship
GAMEDAILYDATA_BACKFILL=$(psql "$DATABASE_URL" -t -c "
UPDATE \"GameDailyData\" 
SET \"sessionId\" = p.\"sessionId\"
FROM \"Performance\" p 
WHERE \"GameDailyData\".\"performanceId\" = p.id 
      AND p.\"sessionId\" IS NOT NULL
      AND \"GameDailyData\".\"sessionId\" IS NULL;

SELECT ROW_COUNT();
" | tail -1 | tr -d ' ')

echo "✅ GameDailyData backfill completed"
echo "📊 GameDailyData records linked: $GAMEDAILYDATA_BACKFILL"

# Check for orphaned GameDailyData records
ORPHANED_GAMEDAILYDATA=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) 
FROM \"GameDailyData\" gdd
LEFT JOIN \"Performance\" p ON gdd.\"performanceId\" = p.id
WHERE gdd.\"sessionId\" IS NULL;
" | tr -d ' ')

echo "📊 Orphaned GameDailyData records: $ORPHANED_GAMEDAILYDATA"

if [ "$ORPHANED_GAMEDAILYDATA" -gt 0 ]; then
    echo "⚠️  Found orphaned GameDailyData records:"
    psql "$DATABASE_URL" -c "
    SELECT 
        gdd.id, gdd.\"performanceId\", gdd.day,
        CASE 
            WHEN p.id IS NULL THEN 'Performance record missing'
            WHEN p.\"sessionId\" IS NULL THEN 'Performance has no session'
            ELSE 'Unknown reason'
        END as reason
    FROM \"GameDailyData\" gdd
    LEFT JOIN \"Performance\" p ON gdd.\"performanceId\" = p.id
    WHERE gdd.\"sessionId\" IS NULL
    ORDER BY gdd.id;
    "
fi
echo ""

echo "🔒 Step 6: Evaluate constraint options..."
echo "=========================================="

# Check if we can add NOT NULL constraints
PERFORMANCE_NULL_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"Performance\" WHERE \"sessionId\" IS NULL;
" | tr -d ' ')

GAMEDAILYDATA_NULL_COUNT=$(psql "$DATABASE_URL" -t -c "
SELECT COUNT(*) FROM \"GameDailyData\" WHERE \"sessionId\" IS NULL;
" | tr -d ' ')

echo "📊 Analysis for constraint decisions:"
echo "- Performance records without sessionId: $PERFORMANCE_NULL_COUNT"
echo "- GameDailyData records without sessionId: $GAMEDAILYDATA_NULL_COUNT"

if [ "$PERFORMANCE_NULL_COUNT" -eq 0 ]; then
    echo "✅ All Performance records have sessionId - adding NOT NULL constraint"
    psql "$DATABASE_URL" -c "ALTER TABLE \"Performance\" ALTER COLUMN \"sessionId\" SET NOT NULL;" > /dev/null 2>&1
    PERFORMANCE_NOT_NULL_ADDED=true
else
    echo "⚠️  Cannot add NOT NULL constraint to Performance.sessionId (orphaned records exist)"
    PERFORMANCE_NOT_NULL_ADDED=false
fi

if [ "$GAMEDAILYDATA_NULL_COUNT" -eq 0 ]; then
    echo "✅ All GameDailyData records have sessionId - adding NOT NULL constraint"
    psql "$DATABASE_URL" -c "ALTER TABLE \"GameDailyData\" ALTER COLUMN \"sessionId\" SET NOT NULL;" > /dev/null 2>&1
    GAMEDAILYDATA_NOT_NULL_ADDED=true
else
    echo "⚠️  Cannot add NOT NULL constraint to GameDailyData.sessionId (orphaned records exist)"
    GAMEDAILYDATA_NOT_NULL_ADDED=false
fi
echo ""

echo "🔍 Step 7: Final verification and relationship mapping..."
echo "========================================================"

echo "📊 Final data relationship summary:"
psql "$DATABASE_URL" -c "
SELECT 
    'Performance → GameSession' as relationship,
    COUNT(*) as total_records,
    COUNT(\"sessionId\") as linked_records,
    COUNT(*) - COUNT(\"sessionId\") as orphaned_records
FROM \"Performance\"

UNION ALL

SELECT 
    'GameDailyData → GameSession' as relationship,
    COUNT(*) as total_records,
    COUNT(\"sessionId\") as linked_records,
    COUNT(*) - COUNT(\"sessionId\") as orphaned_records
FROM \"GameDailyData\";
"

echo ""
echo "📋 Cross-reference verification:"
psql "$DATABASE_URL" -c "
SELECT 
    gs.id as session_id,
    gs.user_id,
    gs.level_id,
    gs.created_at as session_created,
    COUNT(DISTINCT p.id) as linked_performance,
    COUNT(DISTINCT gdd.id) as linked_daily_data
FROM \"GameSession\" gs
LEFT JOIN \"Performance\" p ON gs.id = p.\"sessionId\"
LEFT JOIN \"GameDailyData\" gdd ON gs.id = gdd.\"sessionId\"
GROUP BY gs.id, gs.user_id, gs.level_id, gs.created_at
ORDER BY gs.created_at;
"
echo ""

echo "=============================================="
echo "Unification Analysis Complete!"
echo "=============================================="

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
    "performance_matched_sessions": $BACKFILL_RESULT,
    "performance_orphaned": $PERFORMANCE_NULL_COUNT,
    "gamedailydata_linked": $GAMEDAILYDATA_BACKFILL,
    "gamedailydata_orphaned": $GAMEDAILYDATA_NULL_COUNT
  },
  "constraints_applied": {
    "performance_sessionid_not_null": $PERFORMANCE_NOT_NULL_ADDED,
    "gamedailydata_sessionid_not_null": $GAMEDAILYDATA_NOT_NULL_ADDED
  },
  "success_metrics": {
    "performance_success_rate": "$(echo "scale=2; $BACKFILL_RESULT * 100 / $PERFORMANCE_COUNT" | bc -l)%",
    "gamedailydata_success_rate": "$(echo "scale=2; $GAMEDAILYDATA_BACKFILL * 100 / $GAMEDAILYDATA_COUNT" | bc -l | sed 's/^\./0./')%"
  },
  "recommendations": {
    "schema_status": "$([ "$PERFORMANCE_NULL_COUNT" -eq 0 ] && [ "$GAMEDAILYDATA_NULL_COUNT" -eq 0 ] && echo "fully_unified" || echo "partially_unified")",
    "next_steps": [
      "Update application code to use sessionId references",
      "$([ "$PERFORMANCE_NULL_COUNT" -gt 0 ] && echo "Handle orphaned Performance records" || echo "Performance fully linked")",
      "$([ "$GAMEDAILYDATA_NULL_COUNT" -gt 0 ] && echo "Handle orphaned GameDailyData records" || echo "GameDailyData fully linked")",
      "Consider deprecating legacy reference patterns"
    ]
  }
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
echo "📊 Performance records matched: $BACKFILL_RESULT/$PERFORMANCE_COUNT"
echo "📊 GameDailyData records linked: $GAMEDAILYDATA_BACKFILL/$GAMEDAILYDATA_COUNT"
echo "⚠️  Orphaned Performance records: $PERFORMANCE_NULL_COUNT"
echo "⚠️  Orphaned GameDailyData records: $GAMEDAILYDATA_NULL_COUNT"

if [ "$PERFORMANCE_NULL_COUNT" -eq 0 ] && [ "$GAMEDAILYDATA_NULL_COUNT" -eq 0 ]; then
    echo ""
    echo "🎉 FULL UNIFICATION ACHIEVED!"
    echo "All records successfully linked to GameSession structure"
else
    echo ""
    echo "⚠️  PARTIAL UNIFICATION COMPLETED"
    echo "Some orphaned records remain - manual intervention may be required"
fi

echo ""
echo "Unification process complete! 🎉"
