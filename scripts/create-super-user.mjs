#!/usr/bin/env node
/**
 * Create Super User (Teacher) Script for Neon Database
 * 
 * This script creates a teacher super user in your deployed Neon database.
 * It connects directly to the production database using the DATABASE_URL.
 * 
 * Usage:
 *   node scripts/create-super-user.mjs
 * 
 * Environment Variables Required:
 *   DATABASE_URL - Your Neon database connection string
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function createSuperUser() {
    console.log('🚀 Creating Teacher Super User for Neon Database');
    console.log('================================================\n');

    // Verify DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL environment variable is not set!');
        console.error('Please set your Neon database connection string in .env or .env.local');
        console.error('Example: DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require');
        process.exit(1);
    }

    console.log('✅ Database URL found');
    console.log('🔗 Connecting to Neon database...\n');

    try {
        // Initialize Neon connection
        const sql = neon(process.env.DATABASE_URL);

        // Get user input for the super user
        console.log('📝 Please provide the following details for the teacher super user:\n');

        const username = await askQuestion('Username (e.g., admin, teacher1): ') || 'admin';
        const email = await askQuestion('Email address (e.g., teacher@university.edu): ') || 'admin@lth.se';
        const password = await askQuestion('Password (minimum 8 characters): ') || 'SuperUser123!';

        console.log('\n🔍 Checking if user already exists...');

        // Check if user already exists
        const existingUser = await sql`
      SELECT id, username, email, role 
      FROM "User" 
      WHERE username = ${username} OR email = ${email}
    `;

        if (existingUser.length > 0) {
            console.log('⚠️  User with this username or email already exists:');
            console.table(existingUser);

            const overwrite = await askQuestion('\nDo you want to overwrite this user? (y/N): ');

            if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
                console.log('❌ User creation cancelled.');
                rl.close();
                return;
            }

            // Delete existing user and related data
            console.log('🗑️  Removing existing user and related data...');

            // Delete performances first (foreign key constraint)
            await sql`DELETE FROM "Performance" WHERE "userId" = ${existingUser[0].id}`;

            // Delete the user
            await sql`DELETE FROM "User" WHERE id = ${existingUser[0].id}`;

            console.log('✅ Existing user removed.');
        }

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12); // Use 12 rounds for production

        // Generate unique ID
        const userId = crypto.randomUUID();

        // Insert the new super user
        console.log('👩‍🏫 Creating teacher super user...');

        const newUser = await sql`
      INSERT INTO "User" (
        id, 
        username, 
        email, 
        password, 
        visible_password, 
        role, 
        progress, 
        "lastActive", 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        ${userId},
        ${username},
        ${email},
        ${hashedPassword},
        ${password},
        'teacher',
        0,
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id, username, email, role, "createdAt"
    `;

        // Verify the user was created
        console.log('✅ Teacher super user created successfully!\n');

        console.log('📊 User Details:');
        console.log('================');
        console.table(newUser);

        console.log('\n🎯 Access Information:');
        console.log('======================');
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: teacher`);
        console.log(`User ID: ${userId}`);

        console.log('\n🚀 Next Steps:');
        console.log('==============');
        console.log('1. Save the login credentials securely');
        console.log('2. Test login on your deployed application');
        console.log('3. The teacher can now access all student data and manage the system');

        // Check total user count
        const userCount = await sql`SELECT COUNT(*) as count FROM "User"`;
        console.log(`\n📈 Total users in database: ${userCount[0].count}`);

    } catch (error) {
        console.error('❌ Error creating super user:', error);

        if (error.message.includes('duplicate key')) {
            console.error('💡 This usually means a user with this username/email already exists.');
            console.error('   Try using a different username or email address.');
        } else if (error.message.includes('connection')) {
            console.error('💡 Database connection failed. Please check:');
            console.error('   - Your DATABASE_URL is correct');
            console.error('   - Your Neon database is running');
            console.error('   - Network connectivity to Neon');
        }
    } finally {
        rl.close();
    }
}

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Script terminated by user');
    rl.close();
    process.exit(0);
});

// Run the script
createSuperUser().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
