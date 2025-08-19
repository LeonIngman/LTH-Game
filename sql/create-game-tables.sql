-- Suppliers
CREATE TABLE
  IF NOT EXISTS "Supplier" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_price NUMERIC NOT NULL
  );

-- Products
CREATE TABLE
  IF NOT EXISTS "Product" (id SERIAL PRIMARY KEY, name TEXT NOT NULL);

-- Supplier-Product Mapping
CREATE TABLE
  IF NOT EXISTS "SupplierProduct" (
    supplier_id INTEGER REFERENCES "Supplier" (id),
    product_id INTEGER REFERENCES "Product" (id),
    lead_time INTEGER NOT NULL,
    price_per_item NUMERIC NOT NULL,
    order_capacity INTEGER NOT NULL,
    shipment_price_50 NUMERIC NOT NULL,
    PRIMARY KEY (supplier_id, product_id)
  );

-- Orders (User Input)
CREATE TABLE
  IF NOT EXISTS "Order" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id INTEGER REFERENCES "Product" (id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- Game Sessions (for saving game state)
CREATE TABLE
  IF NOT EXISTS "GameSession" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    level_id INTEGER NOT NULL,
    game_state JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- Extend the Performance table to store more detailed game results
ALTER TABLE "Performance"
ADD COLUMN IF NOT EXISTS "decisions" JSONB;