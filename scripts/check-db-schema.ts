#!/usr/bin/env node

/**
 * Debug: Check if maxDeliveryDistanceKm is in database
 */

import { db } from '../shared/db';
import { chefs } from '../shared/schema';

async function checkDatabase() {
  console.log('\n📊 CHECKING DATABASE SCHEMA AND VALUES\n');
  
  try {
    // Get all chefs
    const allChefs = await db.select().from(chefs);
    
    console.log(`Found ${allChefs.length} chefs:\n`);
    
    for (const chef of allChefs) {
      console.log(`Chef: ${chef.name}`);
      console.log(`  ID: ${chef.id}`);
      console.log(`  Address Area: ${(chef as any).addressArea || 'null'}`);
      console.log(`  Latitude: ${chef.latitude}`);
      console.log(`  Longitude: ${chef.longitude}`);
      console.log(`  Max Delivery Distance: ${(chef as any).maxDeliveryDistanceKm || 'NOT FOUND'}`);
      console.log(`  Raw object keys: ${Object.keys(chef).join(', ')}`);
      console.log('');
    }
    
    console.log('\n✅ Database check complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
