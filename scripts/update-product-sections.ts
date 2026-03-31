import { db, products } from '../shared/db';
import { eq, and } from 'drizzle-orm';

/**
 * Update existing Franky Adda products with section data
 * Adds section, section_order, and sort_order to 24 existing products
 */

async function updateProductSections() {
  console.log('\n🔄 Updating Franky Adda Products with Section Data\n');
  console.log('='.repeat(70));

  try {
    const chefId = 'chef-franky-7nQZySmmqpDcFo_vYHmNs';

    // Product update mappings by section
    const updates = [
      // SECTION 1: Aloo & Noodle Frankies (sectionOrder: 0)
      { name: 'Aloo Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 0 },
      { name: 'Aloo Schezwan Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 1 },
      { name: 'Aloo Cheese Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 2 },
      { name: 'Aloo Schezwan Cheese Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 3 },
      { name: 'Noodle Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 4 },
      { name: 'Noodle Schezwan Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 5 },
      { name: 'Noodle Cheese Frankie', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 6 },
      { name: 'Noodle Cheese Frankie Premium', section: 'Aloo & Noodle Frankies', sectionOrder: 0, sortOrder: 7 },

      // SECTION 2: Mayo Specials (sectionOrder: 10)
      { name: 'Aloo Mayonnaise Frankie', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 0 },
      { name: 'Aloo Mayonnaise Schezwan Frankie', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 1 },
      { name: 'Noodle Mayonnaise', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 2 },
      { name: 'Noodle Mayonnaise Schezwan Frankie', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 3 },
      { name: 'Mayonnaise Cheese', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 4 },
      { name: 'Noodle Mayonnaise Cheese', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 5 },
      { name: 'Noodle Mayonnaise Cheese Schezwan', section: 'Mayo Specials', sectionOrder: 10, sortOrder: 6 },

      // SECTION 3: Aloo & Noodle Mix (sectionOrder: 20)
      { name: 'Aloo Noodle Mix', section: 'Aloo & Noodle Mix', sectionOrder: 20, sortOrder: 0 },
      { name: 'Aloo Noodle Schezwan Mix', section: 'Aloo & Noodle Mix', sectionOrder: 20, sortOrder: 1 },
      { name: 'Aloo Noodle Cheese Mix', section: 'Aloo & Noodle Mix', sectionOrder: 20, sortOrder: 2 },
      { name: 'Aloo Noodle Cheese Schezwan Mix', section: 'Aloo & Noodle Mix', sectionOrder: 20, sortOrder: 3 },

      // SECTION 4: Manchurian Rolls (sectionOrder: 30)
      { name: 'Manchurian Frankie', section: 'Manchurian Rolls', sectionOrder: 30, sortOrder: 0 },
      { name: 'Manchurian Schezwan', section: 'Manchurian Rolls', sectionOrder: 30, sortOrder: 1 },
      { name: 'Manchurian Noodle Cheese', section: 'Manchurian Rolls', sectionOrder: 30, sortOrder: 2 },
      { name: 'Manchurian Cheese Schezwan', section: 'Manchurian Rolls', sectionOrder: 30, sortOrder: 3 },
      { name: 'Manchurian Mayonnaise Cheese Schezwan', section: 'Manchurian Rolls', sectionOrder: 30, sortOrder: 4 },
    ];

    console.log(`📋 Updating ${updates.length} products with section data...\n`);

    let updateCount = 0;

    for (const update of updates) {
      const result = await db
        .update(products)
        .set({
          section: update.section,
          sectionOrder: update.sectionOrder,
          sortOrder: update.sortOrder,
        })
        .where(
          and(
            eq(products.name, update.name),
            eq(products.chefId, chefId)
          )
        );

      console.log(`   ✅ ${update.name.padEnd(40)} → ${update.section}`);
      updateCount++;
    }

    console.log(`\n   Updated: ${updateCount} products\n`);

    // Verify updates
    console.log('📊 Verifying updates...\n');

    const updated = await db.query.products.findMany({
      where: eq(products.chefId, chefId),
    });

    const bySection = new Map<string, number>();
    for (const product of updated) {
      const section = product.section || 'NULL (None)';
      bySection.set(section, (bySection.get(section) || 0) + 1);
    }

    for (const [section, count] of bySection) {
      console.log(`   ✅ ${section.padEnd(25)} : ${count} products`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ ALL PRODUCTS UPDATED!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run verification: npx tsx scripts/verify-menu-sections.ts');
    console.log('   2. Start dev server: npm run dev');
    console.log('   3. Test UI with grouped sections\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Update failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

updateProductSections();
