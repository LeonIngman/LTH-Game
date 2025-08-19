-- ============================================================================
-- COMPLETE NEON DATABASE SETUP AND SEEDING SCRIPT
-- ============================================================================
-- This script creates all tables and seeds data for the LTH Game application
-- Paste this entire script into the Neon SQL editor and run it
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS "GameDailyData" CASCADE;
DROP TABLE IF EXISTS "QuizSubmission" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "SupplierProduct" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Supplier" CASCADE;
DROP TABLE IF EXISTS "GameSession" CASCADE;
DROP TABLE IF EXISTS "Performance" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "TimeStamp" CASCADE;
DROP TABLE IF EXISTS "GameLevel" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Create User table
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE,
  "username" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "visible_password" TEXT,
  "role" TEXT NOT NULL,
  "progress" INTEGER DEFAULT 0,
  "lastActive" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GameLevel table
CREATE TABLE "GameLevel" (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "maxScore" INTEGER NOT NULL
);

-- Create TimeStamp table
CREATE TABLE "TimeStamp" (
  "id" SERIAL PRIMARY KEY,
  "levelId" INTEGER NOT NULL,
  "timestampNumber" INTEGER NOT NULL,
  "marketDemand" INTEGER NOT NULL,
  "rawMaterialAPrice" DECIMAL NOT NULL,
  "rawMaterialBPrice" DECIMAL NOT NULL,
  "finishedGoodPrice" DECIMAL NOT NULL,
  FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id")
);

-- Create Session table
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP NOT NULL
);

-- Create Performance table
CREATE TABLE "Performance" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "levelId" INTEGER NOT NULL,
  "timestampId" INTEGER,
  "score" INTEGER NOT NULL,
  "cumulativeProfit" DECIMAL NOT NULL,
  "cashFlow" DECIMAL NOT NULL,
  "rawMaterialAStock" INTEGER NOT NULL,
  "rawMaterialBStock" INTEGER NOT NULL,
  "finishedGoodStock" INTEGER NOT NULL,
  "decisions" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id"),
  FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id"),
  FOREIGN KEY ("timestampId") REFERENCES "TimeStamp"("id")
);

-- Create GameSession table (composite primary key)
CREATE TABLE "GameSession" (
  "userId" TEXT NOT NULL,
  "levelId" INTEGER NOT NULL,
  "gameState" JSONB,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "levelId"),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id") ON DELETE CASCADE
);

-- Create QuizSubmission table
CREATE TABLE "QuizSubmission" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "levelId" INTEGER NOT NULL,
  "answers" JSONB NOT NULL,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("userId", "levelId")
);

-- Create Supplier table
CREATE TABLE "Supplier" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "basePrice" NUMERIC NOT NULL
);

-- Create Product table
CREATE TABLE "Product" (
  "id" SERIAL PRIMARY KEY, 
  "name" TEXT NOT NULL
);

-- Create SupplierProduct table
CREATE TABLE "SupplierProduct" (
  "supplierId" INTEGER REFERENCES "Supplier"("id"),
  "productId" INTEGER REFERENCES "Product"("id"),
  "leadTime" INTEGER NOT NULL,
  "pricePerItem" NUMERIC NOT NULL,
  "orderCapacity" INTEGER NOT NULL,
  "shipmentPrice50" NUMERIC NOT NULL,
  PRIMARY KEY ("supplierId", "productId")
);

-- Create Order table
CREATE TABLE "Order" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "productId" INTEGER REFERENCES "Product"("id"),
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GameDailyData table
CREATE TABLE "GameDailyData" (
  "id" SERIAL PRIMARY KEY,
  "performanceId" INTEGER REFERENCES "Performance"("id") ON DELETE CASCADE,
  "day" INTEGER NOT NULL,
  "cash" NUMERIC NOT NULL,
  "pattyInventory" INTEGER NOT NULL,
  "bunInventory" INTEGER NOT NULL,
  "cheeseInventory" INTEGER NOT NULL,
  "potatoInventory" INTEGER NOT NULL,
  "finishedGoodsInventory" INTEGER NOT NULL,
  "production" INTEGER NOT NULL,
  "sales" INTEGER NOT NULL,
  "revenue" NUMERIC NOT NULL,
  "purchaseCosts" NUMERIC NOT NULL,
  "productionCosts" NUMERIC NOT NULL,
  "holdingCosts" NUMERIC NOT NULL,
  "totalCosts" NUMERIC NOT NULL,
  "profit" NUMERIC NOT NULL,
  "cumulativeProfit" NUMERIC NOT NULL
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX "idx_performance_user" ON "Performance"("userId");
CREATE INDEX "idx_performance_level" ON "Performance"("levelId");
CREATE INDEX "idx_timestamp_level" ON "TimeStamp"("levelId");
CREATE INDEX "idx_session_userId" ON "Session"("userId");
CREATE INDEX "idx_session_expiresAt" ON "Session"("expiresAt");
CREATE INDEX "idx_quiz_submission_user_level" ON "QuizSubmission"("userId", "levelId");
CREATE INDEX "idx_quiz_submission_level" ON "QuizSubmission"("levelId");
CREATE INDEX "username_idx" ON "User"("username");

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed Game Levels
INSERT INTO "GameLevel" ("id", "name", "description", "maxScore") VALUES
(0, 'Tutorial', 'Learn the basics of supply chain management', 1000),
(1, 'Level 1 - Basic Operations', 'Manage a simple supply chain with one product', 2500),
(2, 'Level 2 - Demand Variability', 'Handle fluctuating market demand', 5000),
(3, 'Level 3 - Advanced Management', 'Complex multi-product supply chain', 10000);

-- Seed Products
INSERT INTO "Product" ("id", "name") VALUES
(1, 'Raw Material A - Patty'),
(2, 'Raw Material B - Bun'),
(3, 'Raw Material C - Cheese'),
(4, 'Raw Material D - Potato'),
(100, 'Finished Good - Hamburger');

-- Seed Suppliers
INSERT INTO "Supplier" ("id", "name", "basePrice") VALUES
(1, 'QuickMeat Co', 12.50),
(2, 'PremiumMeat Ltd', 15.00),
(3, 'BreadMasters Inc', 8.00),
(4, 'ArtisanBakery', 10.50),
(5, 'DairyCraft Co', 18.00),
(6, 'CheeseExperts Ltd', 22.00),
(7, 'FarmFresh Potatoes', 6.50),
(8, 'OrganicSpuds Inc', 9.00);

-- Seed SupplierProduct relationships
INSERT INTO "SupplierProduct" ("supplierId", "productId", "leadTime", "pricePerItem", "orderCapacity", "shipmentPrice50") VALUES
-- Raw Material A (Patty) suppliers
(1, 1, 1, 12.50, 200, 25.00),
(2, 1, 2, 15.00, 150, 20.00),
-- Raw Material B (Bun) suppliers  
(3, 2, 1, 8.00, 300, 15.00),
(4, 2, 3, 10.50, 100, 10.00),
-- Raw Material C (Cheese) suppliers
(5, 3, 2, 18.00, 100, 30.00),
(6, 3, 1, 22.00, 80, 35.00),
-- Raw Material D (Potato) suppliers
(7, 4, 1, 6.50, 250, 12.00),
(8, 4, 2, 9.00, 180, 18.00);

-- Seed Demo Users (password is 'demo123' for all)
INSERT INTO "User" ("id", "username", "email", "password", "visible_password", "role", "progress", "lastActive", "createdAt", "updatedAt") VALUES
('demo-teacher-001', 'teacher', 'teacher@lth.se', '$2a$12$LQv3c1yqBwEHxPuNIhPWrOHpgQGDfKHfGAaGGfGfGfGfGfGfGfGfGe', 'demo123', 'teacher', 0, NOW(), NOW(), NOW()),
('demo-student-001', 'student1', 'student1@lth.se', '$2a$12$LQv3c1yqBwEHxPuNIhPWrOHpgQGDfKHfGAaGGfGfGfGfGfGfGfGfGe', 'demo123', 'student', 1, NOW(), NOW(), NOW()),
('demo-student-002', 'student2', 'student2@lth.se', '$2a$12$LQv3c1yqBwEHxPuNIhPWrOHpgQGDfKHfGAaGGfGfGfGfGfGfGfGfGe', 'demo123', 'student', 2, NOW(), NOW(), NOW()),
('demo-student-003', 'student3', 'student3@lth.se', '$2a$12$LQv3c1yqBwEHxPuNIhPWrOHpgQGDfKHfGAaGGfGfGfGfGfGfGfGfGe', 'demo123', 'student', 0, NOW(), NOW(), NOW());

-- Generate TimeStamp data (market conditions) for each level
DO $$
DECLARE
    level_id INTEGER;
    day_num INTEGER;
    market_demand INTEGER;
    price_a DECIMAL;
    price_b DECIMAL;
    finished_price DECIMAL;
    base_price_a DECIMAL;
    base_price_b DECIMAL;
    base_finished_price DECIMAL;
BEGIN
    -- Generate timestamps for each level (0-3)
    FOR level_id IN 0..3 LOOP
        -- Set base prices that increase with level difficulty
        base_price_a := 10 + level_id * 2;
        base_price_b := 15 + level_id * 2.5;
        base_finished_price := 50 + level_id * 10;
        
        -- Generate 30 days of data for each level
        FOR day_num IN 1..30 LOOP
            -- Generate realistic market demand (80-120 units)
            market_demand := 80 + (RANDOM() * 40)::INTEGER;
            
            -- Calculate prices with some fluctuation
            price_a := ROUND((base_price_a + (RANDOM() * 4 - 2))::NUMERIC, 2);
            price_b := ROUND((base_price_b + (RANDOM() * 4 - 2))::NUMERIC, 2);
            finished_price := ROUND((base_finished_price + (RANDOM() * 10 - 5))::NUMERIC, 2);
            
            -- Ensure prices don't go negative
            price_a := GREATEST(price_a, 5.0);
            price_b := GREATEST(price_b, 7.0);
            finished_price := GREATEST(finished_price, 30.0);
            
            -- Insert timestamp record
            INSERT INTO "TimeStamp" ("levelId", "timestampNumber", "marketDemand", "rawMaterialAPrice", "rawMaterialBPrice", "finishedGoodPrice")
            VALUES (level_id, day_num, market_demand, price_a, price_b, finished_price);
        END LOOP;
    END LOOP;
END $$;

-- Seed sample Performance data
INSERT INTO "Performance" ("userId", "levelId", "timestampId", "score", "cumulativeProfit", "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock", "decisions", "createdAt") VALUES
('demo-student-001', 1, NULL, 850, 2500.50, 500.25, 25, 30, 15, '{"orders": [{"supplier": 1, "quantity": 50}], "production": 40}', NOW() - INTERVAL '1 day'),
('demo-student-002', 1, NULL, 920, 3200.75, 650.00, 20, 35, 18, '{"orders": [{"supplier": 2, "quantity": 60}], "production": 45}', NOW() - INTERVAL '1 day'),
('demo-student-002', 2, NULL, 1250, 4800.25, 800.50, 15, 40, 22, '{"orders": [{"supplier": 1, "quantity": 70}], "production": 55}', NOW() - INTERVAL '6 hours');

-- Seed sample GameSession data
INSERT INTO "GameSession" ("userId", "levelId", "gameState", "updatedAt") VALUES
('demo-student-001', 1, '{"day": 5, "cash": 8500.50, "inventory": {"rawMaterialA": 25, "rawMaterialB": 30, "finishedGoods": 15}, "cumulativeProfit": 2500.50}', NOW() - INTERVAL '2 hours'),
('demo-student-002', 2, '{"day": 12, "cash": 12750.25, "inventory": {"rawMaterialA": 15, "rawMaterialB": 40, "finishedGoods": 22}, "cumulativeProfit": 4800.25}', NOW() - INTERVAL '30 minutes');

-- Seed sample QuizSubmission data
INSERT INTO "QuizSubmission" ("userId", "levelId", "answers", "submittedAt") VALUES
('demo-student-001', 1, '{"q1": "A", "q2": "B", "q3": "C", "score": 80}', NOW() - INTERVAL '2 days'),
('demo-student-002', 1, '{"q1": "A", "q2": "A", "q3": "C", "score": 90}', NOW() - INTERVAL '1 day'),
('demo-student-002', 2, '{"q1": "B", "q2": "B", "q3": "A", "score": 75}', NOW() - INTERVAL '12 hours');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Display setup results
SELECT 
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM "User") as users,
    (SELECT COUNT(*) FROM "GameLevel") as levels,
    (SELECT COUNT(*) FROM "TimeStamp") as timestamps,
    (SELECT COUNT(*) FROM "Product") as products,
    (SELECT COUNT(*) FROM "Supplier") as suppliers,
    (SELECT COUNT(*) FROM "Performance") as performance_records,
    (SELECT COUNT(*) FROM "GameSession") as game_sessions;

-- Show demo login credentials
SELECT 
    'Demo Credentials' as info,
    'Username: teacher, Password: demo123' as teacher_login,
    'Username: student1, Password: demo123' as student_login;
