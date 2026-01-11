#!/usr/bin/env node

/**
 * Setup Script: Migrate Delivery Areas from In-Memory to Database
 * 
 * This script:
 * 1. Creates the delivery_areas table
 * 2. Populates with default areas
 * 3. No data loss - works seamlessly
 * 
 * Usage:
 *   npx tsx scripts/migrate-delivery-areas.ts
 *   or
 *   npm run migrate:delivery-areas (if added to package.json)
 */

import { db, deliveryAreas } from '../shared/db';
import { sql } from 'drizzle-orm';

async function migrateDeliveryAreas() {
  console.log('\n🚀 Starting Delivery Areas Database Migration...\n');
  
  try {
    // Check if table exists
    const tableResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'delivery_areas'
      ) as exists
    `);
    
    const tableExists = (tableResult as any)[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Table delivery_areas already exists\n');
      
      // Check existing data
      const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM delivery_areas`);
      const existingCount = (countResult as any)[0]?.count || 0;
      console.log(`📊 Existing areas in database: ${existingCount}\n`);
    } else {
      console.log('📝 Creating delivery_areas table...');
      
      // Create table
      await db.execute(sql`
        CREATE TABLE delivery_areas (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index
      await db.execute(sql`
        CREATE INDEX idx_delivery_areas_name ON delivery_areas(name)
      `);
      
      console.log('✅ Table created successfully\n');
      
      // Seed default areas
      console.log('🌱 Seeding default delivery areas...');
      const defaultAreas = [
        'Kurla West',
        'Kurla East',
        'Fort',
        'Colaba',
        'Bandra',
        'Worli',
        'Marine Drive',
      ];
      
      await db.insert(deliveryAreas).values(
        defaultAreas.map(name => ({ name, isActive: true }))
      ).onConflictDoNothing();
      
      console.log(`✅ Seeded ${defaultAreas.length} default areas\n`);
    }
    
    // Verify final state
    const areas = await db.select({ name: deliveryAreas.name })
      .from(deliveryAreas)
      .orderBy(sql`name ASC`);
    
    console.log('📋 Current Delivery Areas in Database:');
    console.log('   ' + '='.repeat(50));
    areas.forEach((area, i) => {
      console.log(`   ${i + 1}. ${area.name}`);
    });
    console.log('   ' + '='.repeat(50));
    
    console.log(`\n✅ Migration Complete! Total areas: ${areas.length}\n`);
    console.log('✨ Your delivery areas are now persisted in the database!');
    console.log('   • Changes made in Admin UI will be saved permanently');
    console.log('   • Server restarts will not lose data');
    console.log('   • Full CRUD API available at /api/admin/delivery-areas\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!\n');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run migration
migrateDeliveryAreas();
