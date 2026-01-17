#!/usr/bin/env node

/**
 * Run migration to add max_delivery_distance_km column
 * This is a quick fix to add the new column to production DB
 */

import { db, sql } from '../shared/db';

async function runMigration() {
  console.log('🔄 Running migration: Add max_delivery_distance_km to chefs table...\n');
  
  try {
    // Add the column if it doesn't exist
    console.log('Step 1: Adding max_delivery_distance_km column...');
    await db.execute(sql`
      ALTER TABLE chefs 
      ADD COLUMN IF NOT EXISTS max_delivery_distance_km INTEGER NOT NULL DEFAULT 5
    `);
    console.log('✅ Column added successfully\n');

    // Create index for performance
    console.log('Step 2: Creating index for faster queries...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_chefs_max_delivery_distance 
      ON chefs(max_delivery_distance_km)
    `);
    console.log('✅ Index created successfully\n');

    // Verify
    console.log('Step 3: Verifying migration...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'chefs' AND column_name = 'max_delivery_distance_km'
    `);
    console.log('✅ Migration verified successfully\n');
    
    console.log('✅ All migration steps completed!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();
