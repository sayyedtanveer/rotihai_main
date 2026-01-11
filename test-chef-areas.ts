import { db } from './shared/db';
import { chefs } from './shared/schema';

async function checkChefs() {
  try {
    console.log('📍 Checking chefs in database...');
    const allChefs = await db.select().from(chefs);
    console.log(`\n✅ Found ${allChefs.length} chefs:\n`);
    allChefs.forEach(chef => {
      console.log(`  • ${chef.name}`);
      console.log(`    Area: ${chef.addressArea || '(empty)'}`);
      console.log(`    Building: ${chef.addressBuilding || '(empty)'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkChefs();
