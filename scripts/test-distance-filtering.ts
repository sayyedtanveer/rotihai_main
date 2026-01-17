#!/usr/bin/env node

/**
 * Test the distance-based chef filtering endpoint
 * Tests /api/chefs/by-location with different user locations
 */

import http from 'http';

const API_BASE = 'http://localhost:5000';

function makeRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(`HTTP ${res.statusCode}`);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDistanceFiltering() {
  console.log('🗺️ Testing Distance-Based Chef Filtering\n');
  console.log('=' .repeat(60) + '\n');

  // Test case 1: User at Kurla West (should find Roti Master at max 5km)
  const tests = [
    {
      name: 'User at Kurla West (19.0728, 72.8826)',
      latitude: 19.0728,
      longitude: 72.8826,
      description: 'Should find Roti Master (same location)'
    },
    {
      name: 'User at Worli (19.0244, 72.8479)',
      latitude: 19.0244,
      longitude: 72.8479,
      description: 'Should find Home Style Kitchen nearby'
    },
    {
      name: 'User at Bandra (19.0596, 72.8295)',
      latitude: 19.0596,
      longitude: 72.8295,
      description: 'Should find Premium Restaurant'
    },
    {
      name: 'User at Marine Drive (19.0436, 72.8245)',
      latitude: 19.0436,
      longitude: 72.8245,
      description: 'Should find Sweet Creations'
    },
    {
      name: 'User far away (20.0, 73.0)',
      latitude: 20.0,
      longitude: 73.0,
      description: 'Should find NO chefs (too far away)'
    }
  ];

  for (const test of tests) {
    console.log(`📍 Test: ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`   Coordinates: (${test.latitude}, ${test.longitude})`);
    
    try {
      const url = `${API_BASE}/api/chefs/by-location?latitude=${test.latitude}&longitude=${test.longitude}&maxDistance=15`;
      console.log(`   URL: ${url}`);
      
      const chefs = await makeRequest(url);
      console.log(`   ✅ Found ${chefs.length} chef(s):\n`);

      if (Array.isArray(chefs)) {
        for (const chef of chefs) {
          const distance = (chef as any).distanceFromUser || 'N/A';
          const maxDistance = (chef as any).maxDeliveryDistanceKm || 5;
          console.log(`      • ${chef.name}`);
          console.log(`        - Distance: ${distance} km`);
          console.log(`        - Max delivery: ${maxDistance} km`);
          console.log(`        - Rating: ${chef.rating} (${chef.reviewCount} reviews)`);
          console.log(`        - Category: ${chef.categoryId}\n`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('-'.repeat(60) + '\n');
  }

  console.log('✅ Distance filtering tests completed!');
  process.exit(0);
}

testDistanceFiltering().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
