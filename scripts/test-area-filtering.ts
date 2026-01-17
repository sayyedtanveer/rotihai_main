import 'dotenv/config';
import { storage } from '../server/storage';

async function testAreaFiltering() {
  console.log('\n========== TESTING AREA FILTERING ==========\n');
  
  // 1. Get all chefs
  const allChefs = await storage.getChefs();
  console.log('All chefs in DB:');
  allChefs.forEach(c => {
    const area = (c as any).addressArea || (c as any).address_area || 'No restriction';
    console.log(`  - ${c.name}: ${area}`);
  });
  
  console.log('\n');
  
  // 2. Test filtering for each area
  const testAreas = ['Kurla West', 'Worli', 'Marine Drive', 'Bandra'];
  
  for (const area of testAreas) {
    const filtered = allChefs.filter(chef => {
      const chefArea = (chef as any).addressArea || (chef as any).address_area;
      if (!chefArea) return true; // No restriction = serves everywhere
      return chefArea.toLowerCase().trim() === area.toLowerCase().trim();
    });
    
    console.log(`Chefs for "${area}": ${filtered.length}`);
    filtered.forEach(c => {
      const area = (c as any).addressArea || (c as any).address_area || 'No restriction';
      console.log(`  ✓ ${c.name} (${area})`);
    });
    console.log('');
  }
}

testAreaFiltering().catch(err => {
  console.error(err);
  process.exit(1);
});
