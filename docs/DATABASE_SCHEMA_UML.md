# Database Schema UML Overview

This document provides a comprehensive overview of the LTH-Game database schema based on the PostgreSQL database structure.

## Tables Overview

The database contains **12 tables** organized around user management, game sessions, performance tracking, and quiz functionality.

## Core Entity Relationships

### User Management

- **User** (Primary entity for authentication and user management)
- **Session** (User authentication sessions)

### Game System

- **GameLevel** (Game level definitions)
- **GameSession** (Current game state for users)
- **Performance** (Historical performance records)
- **GameDailyData** (Detailed daily game statistics)
- **TimeStamp** (Time tracking for game sessions)

### Supply Chain Components

- **Product** (Products in the supply chain)
- **Supplier** (Supplier information)
- **SupplierProduct** (Relationship between suppliers and products)
- **Order** (User orders for products)

### Quiz System

- **QuizSubmission** (Quiz answers and scores)

## Detailed Table Structures

### 1. User Table

**Purpose**: Central user management and authentication

```
User {
  id: text (PK)
  email: text (UNIQUE)
  username: text (UNIQUE, NOT NULL)
  password: text (NOT NULL)
  visible_password: text
  role: text (NOT NULL)
  progress: integer (DEFAULT 0)
  lastActive: timestamp (DEFAULT CURRENT_TIMESTAMP)
  createdAt: timestamp (DEFAULT CURRENT_TIMESTAMP)
  updatedAt: timestamp (DEFAULT CURRENT_TIMESTAMP)
}
```

**Relationships**:

- One-to-Many with Performance (userId)
- One-to-Many with QuizSubmission (userId)
- One-to-Many with Session (user_id)

### 2. GameSession Table

**Purpose**: Stores current game state for active sessions

```
GameSession {
  id: integer (PK, AUTO_INCREMENT)
  user_id: text (NOT NULL)
  level_id: integer (NOT NULL)
  game_state: jsonb (NOT NULL)
  created_at: timestamp (DEFAULT CURRENT_TIMESTAMP)
  updated_at: timestamp (DEFAULT CURRENT_TIMESTAMP)
}
```

**Unique Constraint**: (user_id, level_id)
**Game State JSON Contains**: day, cumulativeProfit, inventory data, etc.

### 3. Performance Table

**Purpose**: Historical performance tracking and analytics

```
Performance {
  id: integer (PK, AUTO_INCREMENT)
  userId: text (NOT NULL, FK -> User.id)
  levelId: integer (NOT NULL, FK -> GameLevel.id)
  timestampId: integer (FK -> TimeStamp.id)
  score: integer (NOT NULL)
  cumulativeProfit: numeric (NOT NULL)
  cashFlow: numeric (NOT NULL)
  rawMaterialAStock: integer (NOT NULL)
  rawMaterialBStock: integer (NOT NULL)
  finishedGoodStock: integer (NOT NULL)
  decisions: jsonb
  createdAt: timestamp (DEFAULT CURRENT_TIMESTAMP)
  hasDetailedData: boolean (DEFAULT false)
}
```

### 4. GameDailyData Table

**Purpose**: Detailed daily performance metrics

```
GameDailyData {
  id: integer (PK, AUTO_INCREMENT)
  performanceId: integer (FK -> Performance.id)
  day: integer (NOT NULL)
  cash: numeric (NOT NULL)
  pattyInventory: integer (NOT NULL)
  bunInventory: integer (NOT NULL)
  cheeseInventory: integer (NOT NULL)
  potatoInventory: integer (NOT NULL)
  finishedGoodsInventory: integer (NOT NULL)
  production: integer (NOT NULL)
  sales: integer (NOT NULL)
  revenue: numeric (NOT NULL)
  purchaseCosts: numeric (NOT NULL)
  productionCosts: numeric (NOT NULL)
  holdingCosts: numeric (NOT NULL)
  totalCosts: numeric (NOT NULL)
  profit: numeric (NOT NULL)
  cumulativeProfit: numeric (NOT NULL)
}
```

### 5. GameLevel Table

**Purpose**: Game level definitions and metadata

```
GameLevel {
  id: integer (PK)
  name: text (NOT NULL)
  description: text (NOT NULL)
  maxScore: integer (NOT NULL)
}
```

### 6. TimeStamp Table

**Purpose**: Time tracking for game sessions and performance

```
TimeStamp {
  id: integer (PK, AUTO_INCREMENT)
  timestampNumber: integer (NOT NULL)
  userId: text (NOT NULL, FK -> User.id)
  levelId: integer (NOT NULL, FK -> GameLevel.id)
  createdAt: timestamp (DEFAULT CURRENT_TIMESTAMP)
}
```

### 7. QuizSubmission Table

**Purpose**: Quiz responses and scoring

```
QuizSubmission {
  id: integer (PK, AUTO_INCREMENT)
  userId: text (NOT NULL, FK -> User.id)
  levelId: integer (NOT NULL)
  answers: jsonb (NOT NULL)
  score: integer (NOT NULL)
  completedAt: timestamp (DEFAULT CURRENT_TIMESTAMP)
}
```

### 8. Product Table

**Purpose**: Supply chain product definitions

```
Product {
  id: integer (PK, AUTO_INCREMENT)
  name: text (NOT NULL)
}
```

### 9. Supplier Table

**Purpose**: Supplier information for supply chain

```
Supplier {
  id: integer (PK, AUTO_INCREMENT)
  name: text (NOT NULL)
  reliability: numeric (NOT NULL)
  leadTime: integer (NOT NULL)
  costPerUnit: numeric (NOT NULL)
}
```

### 10. SupplierProduct Table

**Purpose**: Many-to-Many relationship between suppliers and products

```
SupplierProduct {
  id: integer (PK, AUTO_INCREMENT)
  supplierId: integer (NOT NULL, FK -> Supplier.id)
  productId: integer (NOT NULL, FK -> Product.id)
  costPerUnit: numeric (NOT NULL)
  leadTime: integer (NOT NULL)
  reliability: numeric (NOT NULL)
}
```

### 11. Order Table

**Purpose**: User orders for products in the game

```
Order {
  id: integer (PK, AUTO_INCREMENT)
  user_id: text (NOT NULL)
  product_id: integer (FK -> Product.id)
  quantity: integer (NOT NULL)
  created_at: timestamp (DEFAULT CURRENT_TIMESTAMP)
}
```

### 12. Session Table

**Purpose**: User authentication sessions

```
Session {
  id: text (PK)
  sessionToken: text (NOT NULL, UNIQUE)
  user_id: text (NOT NULL, FK -> User.id)
  expires: timestamp (NOT NULL)
}
```

## Key Relationships Summary

### Primary Foreign Key Relationships:

1. **User → Performance** (1:N) - Users can have multiple performance records
2. **User → QuizSubmission** (1:N) - Users can submit multiple quizzes
3. **User → Session** (1:N) - Users can have multiple sessions
4. **User → TimeStamp** (1:N) - Users can have multiple timestamps
5. **GameLevel → Performance** (1:N) - Each level can have multiple performance records
6. **GameLevel → TimeStamp** (1:N) - Each level can have multiple timestamps
7. **Performance → GameDailyData** (1:N) - Each performance can have multiple daily records
8. **Performance → TimeStamp** (1:N) - Performance records link to timestamps
9. **Product → Order** (1:N) - Products can be in multiple orders
10. **Supplier → SupplierProduct** (1:N) - Suppliers can provide multiple products
11. **Product → SupplierProduct** (1:N) - Products can be provided by multiple suppliers

### Special Relationships:

- **GameSession** has a composite unique constraint on (user_id, level_id)
- **SupplierProduct** creates a many-to-many relationship between Supplier and Product
- **GameDailyData** provides detailed breakdown of Performance data

## Data Flow Architecture

### Game Session Flow:

1. User authenticates → **Session** table
2. User starts game → **GameSession** table (current state)
3. Game progresses → **GameSession** updated with JSON state
4. Game completes → **Performance** table (historical record)
5. Detailed data → **GameDailyData** table (granular metrics)

### Leaderboard Data Sources:

- **Primary**: GameSession (live data, most recent)
- **Secondary**: Performance (historical data, completed sessions)
- **Priority**: GameSession takes precedence when timestamps are newer

### Supply Chain Simulation:

- **Products** define available items
- **Suppliers** provide products with different characteristics
- **Orders** track user purchasing decisions
- **Performance** tracks overall game outcomes

## Database Insights

### Performance Considerations:

- GameSession uses JSONB for flexible state storage
- Composite unique constraints prevent duplicate sessions
- Timestamps enable temporal data analysis
- Foreign key cascading ensures data integrity

### Data Integrity:

- User deletion cascades to Sessions and QuizSubmissions
- Performance records are preserved even if users are deleted
- GameSession provides real-time state while Performance provides historical analysis

This schema supports a comprehensive supply chain management game with user management, real-time game sessions, historical performance tracking, and quiz functionality.
