-- Suppliers
CREATE TABLE
  IF NOT EXISTS "Supplier" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "basePrice" NUMERIC NOT NULL
  );

-- Products
CREATE TABLE
  IF NOT EXISTS "Product" (id SERIAL PRIMARY KEY, name TEXT NOT NULL);

-- Supplier-Product Mapping
CREATE TABLE
  IF NOT EXISTS "SupplierProduct" (
    "supplierId" INTEGER REFERENCES "Supplier" (id),
    "productId" INTEGER REFERENCES "Product" (id),
    "leadTime" INTEGER NOT NULL,
    "pricePerItem" NUMERIC NOT NULL,
    "orderCapacity" INTEGER NOT NULL,
    "shipmentPrice50" NUMERIC NOT NULL,
    PRIMARY KEY ("supplierId", "productId")
  );

-- Orders (User Input)
CREATE TABLE
  IF NOT EXISTS "Order" (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" INTEGER REFERENCES "Product" (id),
    quantity INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- Game Sessions (for saving game state)
CREATE TABLE
  IF NOT EXISTS "GameSession" (
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "gameState" JSONB,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "levelId")
  );

-- Extend the Performance table to store more detailed game results
ALTER TABLE "Performance"
ADD COLUMN IF NOT EXISTS "decisions" JSONB;