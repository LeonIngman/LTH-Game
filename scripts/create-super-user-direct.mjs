#!/usr/bin/env node
/**
 * Create Super User - Direct Script
 * Creates a teacher super user directly without prompts
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function createSuperUserDirect() {
    console.log('🚀 Creating Teacher Super User for Neon Database');
    console.log('================================================\n');

    // Verify DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL environment variable is not set!');
        process.exit(1);
    }

    console.log('✅ Database URL found');
    console.log('🔗 Connecting to Neon database...\n');

    try {
        // Initialize Neon connection
        const sql = neon(process.env.DATABASE_URL);

        // Predefined super user details
        const username = 'admin';
        const email = 'admin@lth.se';
        const password = 'SuperAdmin123!';

        console.log('🔍 Checking if user already exists...');

        // Check if user already exists
        const existingUser = await sql`
      SELECT id, username, email, role 
      FROM "User" 
      WHERE username = ${username} OR email = ${email}
    `;

        if (existingUser.length > 0) {
            console.log('⚠️  User already exists, removing old user...');

            // Delete performances first (foreign key constraint)
            await sql`DELETE FROM "Performance" WHERE "userId" = ${existingUser[0].id}`;

            // Delete the user
            await sql`DELETE FROM "User" WHERE id = ${existingUser[0].id}`;

            console.log('✅ Existing user removed.');
        }

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);

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

        console.log('\n🎯 Login Credentials:');
        console.log('======================');
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: teacher`);

        // Check total user count
        const userCount = await sql`SELECT COUNT(*) as count FROM "User"`;
        console.log(`\n📈 Total users in database: ${userCount[0].count}`);

        console.log('\n🚀 Super user created! You can now login to your application.');

    } catch (error) {
        console.error('❌ Error creating super user:', error);
    }
}

// Run the script
createSuperUserDirect().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
