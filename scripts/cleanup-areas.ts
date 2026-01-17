import 'dotenv/config';
import { storage } from '../server/storage';

async function cleanupAreas() {
  console.log('\n========== CLEANING UP DELIVERY AREAS ==========\n');
  
  // Get all areas
  const allAreas = await storage.getAllDeliveryAreas();
  
  // Find duplicates (case-insensitive)
  const seen = new Set<string>();
  for (const area of allAreas) {
    const lower = area.name.toLowerCase();
    if (seen.has(lower) && area.name !== 'Kurla East') {
      console.log(`Found duplicate to delete: ${area.name} (ID: ${area.id})`);
    }
    seen.add(lower);
  }
  
  // Verify final state
  const final = await storage.getDeliveryAreas();
  
  console.log('\nFinal delivery areas in database:');
  final.forEach((area, idx) => {
    console.log(`  ${idx + 1}. ${area}`);
  });
}

cleanupAreas().catch(err => {
  console.error(err);
  process.exit(1);
});
