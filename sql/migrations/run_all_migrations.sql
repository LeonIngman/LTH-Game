-- Master Migration Script: Lean Schema Implementation
-- Date: 2025-08-16
-- Description: Apply all lean-schema migrations in correct order

\echo 'Starting lean-schema migration...'

-- Migration 1: Update GameSession table
\echo 'Running migration 1: Update GameSession table...'
\i sql/migrations/001_update_gamesession.sql

-- Migration 2: Add sessionId to GameDailyData
\echo 'Running migration 2: Add sessionId to GameDailyData...'
\i sql/migrations/002_add_sessionid_to_gamedailydata.sql

-- Migration 3: Add sessionId to Order
\echo 'Running migration 3: Add sessionId to Order...'
\i sql/migrations/003_add_sessionid_to_order.sql

-- Migration 4: Add productId to Supplier
\echo 'Running migration 4: Add productId to Supplier...'
\i sql/migrations/004_add_productid_to_supplier.sql

\echo 'Lean-schema migration completed successfully!'

-- Display final schema information
\echo 'Updated table structures:'
\d "GameSession"
\d "GameDailyData"
\d "Order"
\d "Supplier"
