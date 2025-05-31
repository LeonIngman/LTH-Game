-- Create GameLevel table if it doesn't exist
CREATE TABLE IF NOT EXISTS "GameLevel" (
  "id" INTEGER PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "maxScore" INTEGER NOT NULL
);

-- Create TimeStamp table if it doesn't exist
CREATE TABLE IF NOT EXISTS "TimeStamp" (
  "id" SERIAL PRIMARY KEY,
  "levelId" INTEGER NOT NULL,
  "timestampNumber" INTEGER NOT NULL,
  "marketDemand" INTEGER NOT NULL,
  "rawMaterialAPrice" DECIMAL NOT NULL,
  "rawMaterialBPrice" DECIMAL NOT NULL,
  "finishedGoodPrice" DECIMAL NOT NULL,
  FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id")
);

-- Ensure User table exists
CREATE TABLE IF NOT EXISTS "User" (
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

-- Create Session table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP NOT NULL
);

-- Create Performance table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Performance" (
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

-- Create GameDailyData table if it doesn't exist
CREATE TABLE IF NOT EXISTS "GameDailyData" (
  id SERIAL PRIMARY KEY,
  "performanceId" INTEGER REFERENCES "Performance"(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_performance_user" ON "Performance"("userId");
CREATE INDEX IF NOT EXISTS "idx_performance_level" ON "Performance"("levelId");
CREATE INDEX IF NOT EXISTS "idx_timestamp_level" ON "TimeStamp"("levelId");
