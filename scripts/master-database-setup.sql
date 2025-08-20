-- ============================================
-- LTH GAME MASTER DATABASE SETUP SCRIPT
-- ============================================
-- 
-- This is the single comprehensive database setup script for LTH Game
-- It creates ALL required tables, indexes, constraints, and sample data
-- 
-- INSTRUCTIONS:
-- 1. Execute this script in your Neon database console or via psql
-- 2. This script handles both initial setup and updates to existing databases
-- 3. All operations use IF NOT EXISTS to prevent conflicts
-- 
-- TABLES CREATED:
-- - Core Game Tables: GameSession, GameDailyData, GameLevel
-- - User & Auth: User, Session
-- - Performance: Performance, TimeStamp  
-- - Business Logic: Order, Product, Supplier, SupplierProduct
-- - Features: Bug (reporting), QuizSubmission
-- 
-- DATABASE VERSION: Production v2.0
-- LAST UPDATED: August 2025
-- ============================================

-- ============================================
-- 1. CORE GAME TABLES
-- ============================================

-- GameLevel table (should already exist in production)
CREATE TABLE IF NOT EXISTS "GameLevel" (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "demandPattern" JSONB,
    "supplierData" JSONB,
    "initialConditions" JSONB,
    "scoringRules" JSONB,
    "difficultyLevel" INTEGER DEFAULT 1,
    "maxDays" INTEGER DEFAULT 30,
    "isActive" BOOLEAN DEFAULT true
);

-- GameSession table (CRITICAL for game state persistence)
CREATE TABLE IF NOT EXISTS "GameSession" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "gameState" JSONB NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameSession_user_level_unique" UNIQUE ("userId", "levelId")
);

-- GameDailyData table (CRITICAL for daily performance tracking)
CREATE TABLE IF NOT EXISTS "GameDailyData" (
    id SERIAL PRIMARY KEY,
    "performanceId" INTEGER,
    day INTEGER NOT NULL,
    cash NUMERIC NOT NULL,
    "pattyInventory" INTEGER NOT NULL,
    "bunInventory" INTEGER NOT NULL,
    "cheeseInventory" INTEGER NOT NULL,
    "potatoInventory" INTEGER NOT NULL,
    "finishedGoodsInventory" INTEGER NOT NULL,
    production INTEGER NOT NULL,
    sales INTEGER NOT NULL,
    revenue NUMERIC NOT NULL,
    "purchaseCosts" NUMERIC NOT NULL,
    "productionCosts" NUMERIC NOT NULL,
    "holdingCosts" NUMERIC NOT NULL,
    "totalCosts" NUMERIC NOT NULL,
    profit NUMERIC NOT NULL,
    "cumulativeProfit" NUMERIC NOT NULL,
    "sessionId" TEXT,
    "overStockCost" NUMERIC DEFAULT 0
);

-- ============================================
-- 2. USER & AUTHENTICATION TABLES
-- ============================================

-- User table (should already exist - add missing columns if needed)
-- Core user structure with authentication and profile data
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email') THEN
        ALTER TABLE "User" ADD COLUMN email TEXT;
    END IF;
    
    -- Add username column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'username') THEN
        ALTER TABLE "User" ADD COLUMN username TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') THEN
        ALTER TABLE "User" ADD COLUMN role TEXT DEFAULT 'student';
    END IF;
    
    -- Add progress column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'progress') THEN
        ALTER TABLE "User" ADD COLUMN progress JSONB DEFAULT '{}';
    END IF;
    
    -- Add lastActive column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastActive') THEN
        ALTER TABLE "User" ADD COLUMN "lastActive" TIMESTAMP WITHOUT TIME ZONE;
    END IF;
    
    -- Add visible_password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'visible_password') THEN
        ALTER TABLE "User" ADD COLUMN visible_password TEXT;
    END IF;
END $$;

-- Session table (for NextAuth session management)
CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- ============================================
-- 3. PERFORMANCE & TRACKING TABLES
-- ============================================

-- Performance table (should already exist - add missing columns)
DO $$ 
BEGIN
    -- Add sessionId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Performance' AND column_name = 'sessionId') THEN
        ALTER TABLE "Performance" ADD COLUMN "sessionId" TEXT;
    END IF;
    
    -- Add timestampId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Performance' AND column_name = 'timestampId') THEN
        ALTER TABLE "Performance" ADD COLUMN "timestampId" INTEGER;
    END IF;
END $$;

-- TimeStamp table (for performance tracking timestamps)
CREATE TABLE IF NOT EXISTS "TimeStamp" (
    id SERIAL PRIMARY KEY,
    "levelId" INTEGER NOT NULL,
    "startTime" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP WITHOUT TIME ZONE,
    duration INTEGER
);

-- ============================================
-- 4. BUSINESS LOGIC TABLES
-- ============================================

-- Product table (for inventory management)
CREATE TABLE IF NOT EXISTS "Product" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    "basePrice" NUMERIC NOT NULL,
    description TEXT
);

-- Supplier table (for supply chain simulation)
CREATE TABLE IF NOT EXISTS "Supplier" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "contactInfo" TEXT,
    "reliabilityRating" NUMERIC DEFAULT 1.0
);

-- SupplierProduct junction table (supplier-product relationships)
CREATE TABLE IF NOT EXISTS "SupplierProduct" (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    "leadTime" INTEGER DEFAULT 1,
    "minQuantity" INTEGER DEFAULT 1
);

-- Order table (for tracking purchases and orders)
CREATE TABLE IF NOT EXISTS "Order" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    "unitPrice" NUMERIC NOT NULL,
    "totalPrice" NUMERIC NOT NULL,
    "orderDate" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT
);

-- ============================================
-- 5. FEATURE TABLES
-- ============================================

-- Bug table (for bug reporting system)
CREATE TABLE IF NOT EXISTS "Bug" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    status TEXT NOT NULL DEFAULT 'Open',
    "currentPage" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QuizSubmission table (for quiz functionality)
CREATE TABLE IF NOT EXISTS "QuizSubmission" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    "submittedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizSubmission_userId_levelId_key" UNIQUE ("userId", "levelId")
);

-- ============================================
-- 6. FOREIGN KEY CONSTRAINTS
-- ============================================

-- GameSession constraints
ALTER TABLE "GameSession" 
ADD CONSTRAINT IF NOT EXISTS "GameSession_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

-- GameDailyData constraints
ALTER TABLE "GameDailyData" 
ADD CONSTRAINT IF NOT EXISTS "GameDailyData_performanceId_fkey" 
FOREIGN KEY ("performanceId") REFERENCES "Performance" ("id") ON DELETE SET NULL;

-- Session constraints
ALTER TABLE "Session" 
ADD CONSTRAINT IF NOT EXISTS "Session_user_id_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

-- Performance constraints
ALTER TABLE "Performance" 
ADD CONSTRAINT IF NOT EXISTS "Performance_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

ALTER TABLE "Performance" 
ADD CONSTRAINT IF NOT EXISTS "Performance_timestampId_fkey" 
FOREIGN KEY ("timestampId") REFERENCES "TimeStamp" ("id") ON DELETE SET NULL;

-- TimeStamp constraints
ALTER TABLE "TimeStamp" 
ADD CONSTRAINT IF NOT EXISTS "TimeStamp_levelId_fkey" 
FOREIGN KEY ("levelId") REFERENCES "GameLevel" ("id") ON DELETE CASCADE;

-- SupplierProduct constraints
ALTER TABLE "SupplierProduct" 
ADD CONSTRAINT IF NOT EXISTS "SupplierProduct_supplier_id_fkey" 
FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE CASCADE;

ALTER TABLE "SupplierProduct" 
ADD CONSTRAINT IF NOT EXISTS "SupplierProduct_product_id_fkey" 
FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE CASCADE;

-- Order constraints
ALTER TABLE "Order" 
ADD CONSTRAINT IF NOT EXISTS "Order_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE;

ALTER TABLE "Order" 
ADD CONSTRAINT IF NOT EXISTS "Order_product_id_fkey" 
FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE CASCADE;

-- Bug constraints
ALTER TABLE "Bug" 
ADD CONSTRAINT IF NOT EXISTS "Bug_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

-- QuizSubmission constraints
ALTER TABLE "QuizSubmission" 
ADD CONSTRAINT IF NOT EXISTS "QuizSubmission_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- GameSession indexes
CREATE INDEX IF NOT EXISTS "idx_gamesession_user" ON "GameSession" ("userId");
CREATE INDEX IF NOT EXISTS "idx_gamesession_level" ON "GameSession" ("levelId");
CREATE INDEX IF NOT EXISTS "idx_gamesession_updated" ON "GameSession" ("updatedAt");

-- GameDailyData indexes
CREATE INDEX IF NOT EXISTS "idx_gamedailydata_performance" ON "GameDailyData" ("performanceId");
CREATE INDEX IF NOT EXISTS "idx_gamedailydata_session" ON "GameDailyData" ("sessionId");
CREATE INDEX IF NOT EXISTS "idx_gamedailydata_day" ON "GameDailyData" (day);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_performance_user" ON "Performance" ("userId");
CREATE INDEX IF NOT EXISTS "idx_performance_level" ON "Performance" ("levelId");
CREATE INDEX IF NOT EXISTS "idx_performance_session" ON "Performance" ("sessionId");

-- TimeStamp indexes
CREATE INDEX IF NOT EXISTS "idx_timestamp_level" ON "TimeStamp" ("levelId");

-- Session indexes
CREATE INDEX IF NOT EXISTS "idx_session_user" ON "Session" ("userId");

-- Bug indexes
CREATE INDEX IF NOT EXISTS "idx_bug_status" ON "Bug" (status);
CREATE INDEX IF NOT EXISTS "idx_bug_user" ON "Bug" ("userId");
CREATE INDEX IF NOT EXISTS "idx_bug_created" ON "Bug" ("createdAt");

-- QuizSubmission indexes
CREATE INDEX IF NOT EXISTS "idx_quiz_submission_user" ON "QuizSubmission" ("userId");
CREATE INDEX IF NOT EXISTS "idx_quiz_submission_level" ON "QuizSubmission" ("levelId");
CREATE INDEX IF NOT EXISTS "idx_quiz_submission_user_level" ON "QuizSubmission" ("userId", "levelId");

-- Order indexes
CREATE INDEX IF NOT EXISTS "idx_order_user" ON "Order" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_order_session" ON "Order" ("sessionId");

-- ============================================
-- 8. UNIQUE CONSTRAINTS
-- ============================================

-- User unique constraints (add if missing)
DO $$ 
BEGIN
    -- Add unique constraint on email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE (email);
    END IF;
    
    -- Add unique constraint on username if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_username_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE (username);
    END IF;
END $$;

-- Session unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session" ("sessionToken");

-- ============================================
-- 9. SAMPLE DATA INSERTION
-- ============================================

-- Insert sample products if table is empty
INSERT INTO "Product" (name, category, "basePrice", description)
SELECT * FROM (
    VALUES 
        ('Hamburger Patty', 'Meat', 2.50, 'Fresh beef patty'),
        ('Hamburger Bun', 'Bread', 0.75, 'Sesame seed bun'),
        ('Cheese Slice', 'Dairy', 0.80, 'American cheese'),
        ('Potato', 'Vegetable', 0.30, 'Fresh potato for fries')
) AS v(name, category, "basePrice", description)
WHERE NOT EXISTS (SELECT 1 FROM "Product");

-- Insert sample suppliers if table is empty
INSERT INTO "Supplier" (name, "contactInfo", "reliabilityRating")
SELECT * FROM (
    VALUES 
        ('MeatCorp', 'meat@meatcorp.com', 0.95),
        ('BreadWorks', 'orders@breadworks.com', 0.88),
        ('DairyFresh', 'sales@dairyfresh.com', 0.92),
        ('VeggieMart', 'contact@veggiemart.com', 0.85)
) AS v(name, "contactInfo", "reliabilityRating")
WHERE NOT EXISTS (SELECT 1 FROM "Supplier");

-- Insert sample game levels if table is empty
INSERT INTO "GameLevel" (id, name, description, "difficultyLevel", "maxDays", "isActive")
SELECT * FROM (
    VALUES 
        (1, 'Basic Operations', 'Learn the fundamentals of running a burger shop', 1, 10, true),
        (2, 'Supply Chain Management', 'Master inventory and supplier relationships', 2, 15, true),
        (3, 'Market Competition', 'Navigate competitive market conditions', 3, 20, true),
        (4, 'Advanced Strategy', 'Complex business scenarios and optimization', 4, 30, true)
) AS v(id, name, description, "difficultyLevel", "maxDays", "isActive")
WHERE NOT EXISTS (SELECT 1 FROM "GameLevel");

-- ============================================
-- 10. VERIFICATION & STATUS CHECK
-- ============================================

-- Display setup completion status
SELECT 'LTH Game Master Database Setup Complete!' AS status;

-- Show all created tables with column counts
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name NOT LIKE '%prisma%'
  AND t.table_name NOT LIKE 'playing_with%'
ORDER BY t.table_name;

-- Verify critical game tables exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GameSession' AND table_schema = 'public') 
         THEN '✓ GameSession' ELSE '✗ GameSession MISSING' END AS gamesession_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'GameDailyData' AND table_schema = 'public') 
         THEN '✓ GameDailyData' ELSE '✗ GameDailyData MISSING' END AS gamedailydata_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Bug' AND table_schema = 'public') 
         THEN '✓ Bug' ELSE '✗ Bug MISSING' END AS bug_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Performance' AND table_schema = 'public') 
         THEN '✓ Performance' ELSE '✗ Performance MISSING' END AS performance_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') 
         THEN '✓ User' ELSE '✗ User MISSING' END AS user_status;

-- Show sample data counts
SELECT 'Sample Data Verification:' AS info;
SELECT 
    (SELECT COUNT(*) FROM "Product") as products_count,
    (SELECT COUNT(*) FROM "Supplier") as suppliers_count,
    (SELECT COUNT(*) FROM "GameLevel") as gamelevels_count,
    (SELECT COUNT(*) FROM "User") as users_count;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- 
-- Your LTH Game database is now fully configured with:
-- ✓ All required tables created
-- ✓ Proper foreign key relationships
-- ✓ Performance indexes applied
-- ✓ Sample data inserted
-- ✓ Production-ready configuration
-- 
-- Next steps:
-- 1. Test application connectivity
-- 2. Run any pending Prisma migrations
-- 3. Verify game functionality in all levels
-- 
-- ============================================
