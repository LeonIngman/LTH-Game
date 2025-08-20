# Database Scripts

This directory contains scripts to help you set up and manage your database for the LTH Game.

## Prerequisites

1. PostgreSQL installed locally (for local development)
2. Node.js installed
3. Access to Neon database console (for production)

## Master Database Setup

### 🚀 Single Production Setup Script

**`master-database-setup.sql`** - The complete database setup solution

This single comprehensive script handles:

- ✅ All required table creation (GameSession, GameDailyData, User, Performance, etc.)
- ✅ Proper foreign key relationships and constraints
- ✅ Performance indexes for optimal query speed
- ✅ Sample data insertion (products, suppliers, game levels)
- ✅ Compatibility with existing databases (uses IF NOT EXISTS)
- ✅ Production-ready configuration for Neon

**How to use:**

1. Copy the contents of `scripts/master-database-setup.sql`
2. Paste into your Neon database console
3. Execute the script
4. Verify completion with the built-in status checks

## Local Development Scripts

### 1. Setup Local Database

Creates the local database and all required tables:

\`\`\`bash
node scripts/setup-local-database.mjs
\`\`\`

### 2. Create Super User

Creates a teacher/admin user:

\`\`\`bash
node scripts/create-super-user.mjs
\`\`\`

### 3. Create Test User

Creates a test user for local development:

\`\`\`bash
node scripts/create-test-user.mjs
\`\`\`

### 4. Reset Database

Completely resets the local database:

\`\`\`bash
node scripts/reset-database.mjs
\`\`\`

⚠️ **WARNING**: This will delete ALL data in your database. Use with caution!

### 5. Test Database Connection

Tests connectivity to your database:

\`\`\`bash
node scripts/test-db-connection.mjs
\`\`\`

### 6. Run Demo

Starts a demo session:

\`\`\`bash
node scripts/run-demo.mjs
\`\`\`

## Production Database Setup (Neon)

### Quick Start

1. Open your Neon database console
2. Copy and paste the entire `master-database-setup.sql` script
3. Execute it
4. Check the verification output to confirm all tables were created

### What the Master Script Creates:

- **Core Game Tables**: GameSession, GameDailyData, GameLevel
- **User & Auth**: User (with all columns), Session
- **Performance Tracking**: Performance, TimeStamp
- **Business Logic**: Order, Product, Supplier, SupplierProduct
- **Features**: Bug (reporting system), QuizSubmission
- **Sample Data**: 4 products, 4 suppliers, 4 game levels

### Database Schema Summary:

Total Tables: 12+ (depending on existing setup)

- Critical for gameplay: GameSession, GameDailyData, Performance, User
- Business simulation: Product, Supplier, Order, SupplierProduct
- Learning features: QuizSubmission, TimeStamp
- System features: Bug, Session

## Environment Setup

After running the setup script, add the following to your `.env` file:

\`\`\`
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supply_chain_game
\`\`\`

Make sure to update the username and password if yours are different.

## Troubleshooting

If you encounter any issues:

1. Make sure PostgreSQL is running
2. Check that your PostgreSQL username and password are correct in the scripts
3. Ensure you have proper permissions to create databases
