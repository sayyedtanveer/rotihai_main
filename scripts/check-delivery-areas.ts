import 'dotenv/config';
import { storage } from '../server/storage';

async function checkDeliveryAreas() {
  console.log('\n========== CHECKING DELIVERY AREAS ==========\n');
  
  const areas = await storage.getDeliveryAreas();
  console.log(`Available delivery areas (${areas.length}):`);
  areas.forEach(area => {
    console.log(`  - ${area}`);
  });
}

checkDeliveryAreas().catch(err => {
  console.error(err);
  process.exit(1);
});
