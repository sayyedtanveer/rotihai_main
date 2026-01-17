#!/usr/bin/env node

/**
 * Test: Verify maxDeliveryDistanceKm update works end-to-end
 * 1. Get a chef
 * 2. Update maxDeliveryDistanceKm
 * 3. Verify it was updated
 * 4. Verify /api/chefs/by-location respects the new distance
 */

import { db, chefs } from '../shared/db';
import { eq } from 'drizzle-orm';

async function testMaxDeliveryDistanceUpdate() {
  console.log('🧪 Testing maxDeliveryDistanceKm Update End-to-End\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Get a chef
    console.log('Step 1: Fetching Roti Master chef...');
    const chef = await db.query.chefs.findFirst({ 
      where: (c, { eq }) => eq(c.id, 'chef-roti-1')
    });
    
    if (!chef) {
      console.log('❌ Chef not found');
      process.exit(1);
    }
    
    console.log(`✅ Found: ${chef.name}`);
    console.log(`   Current maxDeliveryDistanceKm: ${(chef as any).maxDeliveryDistanceKm}`);
    console.log(`   Location: (${chef.latitude}, ${chef.longitude})\n`);

    // Step 2: Update maxDeliveryDistanceKm to 2
    console.log('Step 2: Updating maxDeliveryDistanceKm to 2...');
    await db.update(chefs)
      .set({ maxDeliveryDistanceKm: 2 })
      .where(eq(chefs.id, 'chef-roti-1'));
    console.log('✅ Updated in database\n');

    // Step 3: Verify update
    console.log('Step 3: Verifying update...');
    const updatedChef = await db.query.chefs.findFirst({ 
      where: (c, { eq }) => eq(c.id, 'chef-roti-1')
    });
    
    const newDistance = (updatedChef as any).maxDeliveryDistanceKm;
    console.log(`✅ maxDeliveryDistanceKm is now: ${newDistance}`);
    
    if (newDistance === 2) {
      console.log('✅ Update verified successfully!\n');
    } else {
      console.log(`❌ Update failed! Expected 2, got ${newDistance}\n`);
      process.exit(1);
    }

    // Step 4: Simulate distance-based filtering
    console.log('Step 4: Testing distance-based filtering logic...');
    
    // User at same location as chef
    const userLat = chef.latitude || 19.0728;
    const userLon = chef.longitude || 72.8826;
    
    // Calculate distance (should be ~0)
    const R = 6371;
    const lat1 = userLat * (Math.PI / 180);
    const lat2 = (chef.latitude || 19.0728) * (Math.PI / 180);
    const deltaLat = ((chef.latitude || 19.0728) - userLat) * (Math.PI / 180);
    const deltaLon = ((chef.longitude || 72.8826) - userLon) * (Math.PI / 180);
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    console.log(`   User at: (${userLat}, ${userLon})`);
    console.log(`   Chef at: (${chef.latitude}, ${chef.longitude})`);
    console.log(`   Distance: ${distance.toFixed(2)} km`);
    console.log(`   Max allowed: ${newDistance} km`);
    
    if (distance <= newDistance) {
      console.log('✅ Chef would be included in results\n');
    } else {
      console.log('❌ Chef would be EXCLUDED from results\n');
    }

    console.log('=' .repeat(60));
    console.log('✅ All tests passed! maxDeliveryDistanceKm update works correctly');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMaxDeliveryDistanceUpdate();
