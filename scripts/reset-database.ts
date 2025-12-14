#!/usr/bin/env node
/**
 * Complete Database Reset Script
 * This script will:
 * 1. Drop all tables and reset the database completely
 * 2. Run migrations to recreate schema
 * 3. Seed initial data
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function resetDatabase() {
  try {
    console.log('\n🔄 Starting complete database reset...\n');

    // Step 1: Drop all tables
    console.log('📋 Step 1: Dropping all existing tables...');
    try {
      await execAsync('npx drizzle-kit drop');
      console.log('✅ All tables dropped successfully\n');
    } catch (error) {
      console.warn('⚠️  Warning during drop (may be normal if no tables exist):\n', error);
      console.log('Continuing with reset...\n');
    }

    // Step 2: Run migrations
    console.log('🔧 Step 2: Running migrations to recreate schema...');
    try {
      await execAsync('npx drizzle-kit migrate');
      console.log('✅ Migrations completed successfully\n');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }

    // Step 3: Seed initial data
    console.log('🌱 Step 3: Seeding initial data...');
    try {
      await execAsync('npx tsx scripts/seed.ts');
      console.log('✅ Data seeded successfully\n');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }

    console.log('✨ Database reset complete!\n');
    console.log('📊 Summary:');
    console.log('   ✅ All tables dropped');
    console.log('   ✅ Schema recreated with migrations');
    console.log('   ✅ Initial data seeded\n');
    console.log('🚀 Database is ready for testing!\n');

  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
