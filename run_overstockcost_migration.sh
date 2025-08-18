#!/bin/bash

# Simple script to run the overstockCost migration
echo "🔄 Running overstockCost migration..."

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
    echo "✅ Loaded .env.local"
elif [ -f .env ]; then
    source .env
    echo "✅ Loaded .env"
else
    echo "❌ No environment file found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

echo "📊 Running migration to add overstockCost column..."
psql "$DATABASE_URL" -f sql/migrations/009_add_overstockcost_to_gamedailydata.sql

echo "✅ Migration completed!"

# Verify the migration
echo "🔍 Verifying GameDailyData table structure..."
psql "$DATABASE_URL" -c "\d \"GameDailyData\""
