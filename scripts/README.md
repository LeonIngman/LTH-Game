# Database Setup Scripts

This directory contains scripts to help you set up and manage your local database for the Supply Chain Game.

## Prerequisites

1. PostgreSQL installed locally
2. Node.js installed

## Available Scripts

### 1. Setup Local Database

Creates the database and all required tables:

\`\`\`bash
node scripts/setup-local-database.js
\`\`\`

This script will:
- Create a new PostgreSQL database called `supply_chain_game`
- Create all necessary tables based on the schema
- Seed the game levels

### 2. Create Test User

Creates a test user for local development:

\`\`\`bash
node scripts/create-test-user.js
\`\`\`

This script will prompt you for:
- Username (default: testuser)
- Email (default: test@example.com)
- Password (default: password123)
- Role (student/teacher, default: student)

### 3. Seed Timestamps

Populates the TimeStamp table with data for all game levels:

\`\`\`bash
node scripts/seed-timestamps.js
\`\`\`

This script will generate 30 days of timestamps for each level with realistic market demand and price fluctuations.

### 4. Reset Database

Completely resets the database by deleting all data:

\`\`\`bash
node scripts/reset-database.js
\`\`\`

⚠️ **WARNING**: This will delete ALL data in your database. Use with caution!

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
