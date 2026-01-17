import 'dotenv/config';
import { storage } from '../server/storage';

async function setupDeliveryAreas() {
  console.log('\n========== SETTING UP DELIVERY AREAS ==========\n');
  
  const areasToAdd = [
    'Kurla West',
    'Kurla East',
    'Worli',
    'Marine Drive',
    'Bandra',
    'Fort',
    'Colaba',
  ];
  
  console.log('Adding missing delivery areas...\n');
  
  for (const area of areasToAdd) {
    const result = await storage.addDeliveryArea(area);
    if (result) {
      console.log(`✅ Added: ${area}`);
    } else {
      console.log(`⚠️  Area already exists or failed: ${area}`);
    }
  }
  
  // Verify
  console.log('\nFinal delivery areas in database:');
  const finalAreas = await storage.getDeliveryAreas();
  finalAreas.forEach((area, idx) => {
    console.log(`  ${idx + 1}. ${area}`);
  });
}

setupDeliveryAreas().catch(err => {
  console.error(err);
  process.exit(1);
});
