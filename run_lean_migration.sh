#!/bin/bash

# Lean Schema Migration Runner
# Date: 2025-08-16
# Description: Execute all lean-schema migrations in correct order

# Load environment variables
source .env.local

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in environment"
    exit 1
fi

echo "==============================================="
echo "Starting Lean Schema Migration"
echo "==============================================="
echo "Database: $DATABASE_URL"
echo "Timestamp: $(date)"
echo ""

# Run pre-migration verification
echo "📊 Pre-migration verification..."
./check_migration_counts.sh > pre_migration_$(date +%Y%m%d_%H%M%S).json

echo ""
echo "🚀 Running migrations..."

# Migration 1: Update GameSession table
echo "📝 Migration 1: Update GameSession table..."
psql "$DATABASE_URL" -f sql/migrations/001_update_gamesession.sql
if [ $? -eq 0 ]; then
    echo "✅ Migration 1 completed successfully"
else
    echo "❌ Migration 1 failed"
    exit 1
fi

# Migration 2: Add sessionId to GameDailyData
echo "📝 Migration 2: Add sessionId to GameDailyData..."
psql "$DATABASE_URL" -f sql/migrations/002_add_sessionid_to_gamedailydata.sql
if [ $? -eq 0 ]; then
    echo "✅ Migration 2 completed successfully"
else
    echo "❌ Migration 2 failed"
    exit 1
fi

# Migration 3: Add sessionId to Order
echo "📝 Migration 3: Add sessionId to Order..."
psql "$DATABASE_URL" -f sql/migrations/003_add_sessionid_to_order.sql
if [ $? -eq 0 ]; then
    echo "✅ Migration 3 completed successfully"
else
    echo "❌ Migration 3 failed"
    exit 1
fi

# Migration 4: Add productId to Supplier
echo "📝 Migration 4: Add productId to Supplier..."
psql "$DATABASE_URL" -f sql/migrations/004_add_productid_to_supplier.sql
if [ $? -eq 0 ]; then
    echo "✅ Migration 4 completed successfully"
else
    echo "❌ Migration 4 failed"
    exit 1
fi

echo ""
echo "🎉 All migrations completed successfully!"

# Run post-migration verification
echo ""
echo "📊 Post-migration verification..."
POST_MIGRATION_FILE="post_migration_$(date +%Y%m%d_%H%M%S).json"
./check_migration_counts.sh > "$POST_MIGRATION_FILE"

echo ""
echo "📋 Updated table structures:"
echo "----------------------------"
psql "$DATABASE_URL" -c "\d \"GameSession\""
echo ""
psql "$DATABASE_URL" -c "\d \"GameDailyData\""
echo ""
psql "$DATABASE_URL" -c "\d \"Order\""
echo ""
psql "$DATABASE_URL" -c "\d \"Supplier\""

echo ""
echo "==============================================="
echo "Lean Schema Migration Completed Successfully!"
echo "==============================================="
echo "Post-migration verification saved to: $POST_MIGRATION_FILE"
echo "Review the verification results above."
