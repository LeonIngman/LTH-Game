# Database Scripts

This directory contains scripts to help you set up and manage your database for the Supply Chain Game.

## Prerequisites

1. PostgreSQL installed locally (for local development)
2. Node.js installed

## Available Scripts

### 1. Setup Local Database

Creates the local database and all required tables:

\`\`\`bash
node scripts/setup-local-database.mjs
\`\`\`

This script will:
- Create a new PostgreSQL database called `supply_chain_game`
- Create all necessary tables based on the schema
- Set up the development environment

### 2. Create Super User

Creates a teacher/admin user:

\`\`\`bash
node scripts/create-super-user.mjs
\`\`\`

Creates an admin user with teacher privileges for local development.

### 3. Create Test User

Creates a test user for local development:

\`\`\`bash
node scripts/create-test-user.mjs
\`\`\`

This script will prompt you for user details and create a student account.

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

Verifies that your database connection is working properly.

### 6. Run Demo

Starts a demo session:

\`\`\`bash
node scripts/run-demo.mjs
\`\`\`

## Neon Database Setup

For production deployment to Neon:

1. Copy the contents of `sql/neon-complete-setup.sql`
2. Paste into the Neon SQL editor
3. Run the script to create all tables and seed data

This single script handles:
- Complete table creation with proper camelCase columns
- Game levels (0-2) matching the local database
- 90 TimeStamp records with realistic market data
- Demo users with bcrypt hashed passwords
- All necessary indexes and constraints

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
