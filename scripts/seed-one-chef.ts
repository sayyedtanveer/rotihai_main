import { db, categories, chefs } from '../shared/db';
import { eq } from 'drizzle-orm';

/**
 * Seed 1 Chef Record with a real chef image
 *
 * Usage:
 *   npx dotenv -e .env -- tsx scripts/seed-one-chef.ts
 */

async function seedOneChef() {
    console.log('🧑‍🍳 Seeding 1 chef record...\n');

    try {
        // Get first existing category (or create one if none exist)
        const existingCategories = await db.select().from(categories);
        let categoryId = existingCategories[0]?.id;

        if (!categoryId) {
            console.log('⚠️  No categories found. Creating a default "Rotis" category first...');
            const catResult = await db.insert(categories).values({
                id: 'cat-rotis-default',
                name: 'Rotis & Breads',
                description: 'Fresh hand-made rotis and breads delivered hot to your door',
                image: 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=800&q=80',
                iconName: 'UtensilsCrossed',
                itemCount: '20+',
            }).returning();
            categoryId = catResult[0].id;
            console.log(`✅ Created category: ${catResult[0].name}\n`);
        } else {
            console.log(`✅ Found existing category id: ${categoryId}\n`);
        }

        // Check if chef already exists to avoid duplicate
        const existingChef = await db.select().from(chefs).where(eq(chefs.id, 'chef-sample-1'));
        if (existingChef.length > 0) {
            console.log('ℹ️  Chef "chef-sample-1" already exists. Skipping insert.');
            console.log('   Name:', existingChef[0].name);
            console.log('   Image:', existingChef[0].image);
            process.exit(0);
        }

        // Insert the chef with a real Cloudinary/Unsplash portrait image
        const chefRecord = {
            id: 'chef-sample-1',
            name: 'Priya\'s Home Kitchen',
            phone: '9876543210',
            description: 'Homestyle rotis and fresh food prepared daily with love. 8+ years of experience in authentic Indian cooking.',
            image: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=800&q=80', // Real food chef image
            rating: '4.8',
            reviewCount: 210,
            categoryId: categoryId,
            addressBuilding: 'Laxmi Apartment',
            addressStreet: 'LJG Colony Road',
            addressArea: 'Kurla West',
            addressCity: 'Mumbai',
            addressPincode: '400070',
            latitude: 19.0728,
            longitude: 72.8826,
            isActive: true,
            defaultDeliveryFee: 30,
            deliveryFeePerKm: 5,
            freeDeliveryThreshold: 200,
            maxDeliveryDistanceKm: 5,
        };

        const result = await db.insert(chefs).values(chefRecord).returning();
        const chef = result[0];

        console.log('✅ Chef seeded successfully!\n');
        console.log('╔══════════════════════════════════════╗');
        console.log('║         Chef Record Created          ║');
        console.log('╠══════════════════════════════════════╣');
        console.log(`║ ID       : ${chef.id}`);
        console.log(`║ Name     : ${chef.name}`);
        console.log(`║ Category : ${chef.categoryId}`);
        console.log(`║ Area     : ${(chef as any).addressArea}, ${(chef as any).addressCity}`);
        console.log(`║ Rating   : ${chef.rating} ⭐`);
        console.log(`║ Active   : ${chef.isActive ? 'Yes ✅' : 'No ❌'}`);
        console.log('╠══════════════════════════════════════╣');
        console.log(`║ Image URL:`);
        console.log(`║ ${chef.image}`);
        console.log('╚══════════════════════════════════════╝\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ SEED FAILED:', error);
        process.exit(1);
    }
}

seedOneChef();
