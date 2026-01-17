import { db, categories, chefs, products, coupons, users, subscriptionPlans, subscriptions } from '../shared/db';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

/**
 * Seed Complete Data to Neon DB: Categories, Chefs, Products, Discounts
 * 
 * Usage:
 * node -r dotenv/config node_modules/tsx/dist/cli.mjs scripts/seed-data-neon.ts
 * 
 * or: npm run seed:data:neon (if added to package.json)
 */

async function seedCompleteData() {
  console.log('🌱 Starting complete data seed to Neon DB...\n');
  
  try {
    // ============================================
    // STEP 1: DELETE OLD DATA (Fresh Start)
    // ============================================
    console.log('📋 Step 1: Clearing existing data...');
    
    // Delete in order of dependencies
    const oldCoupons = await db.select().from(coupons);
    if (oldCoupons.length > 0) {
      for (const coupon of oldCoupons) {
        await db.delete(coupons).where(eq(coupons.id, coupon.id));
      }
      console.log(`   ✓ Deleted ${oldCoupons.length} coupon(s)`);
    }

    const oldProducts = await db.select().from(products);
    if (oldProducts.length > 0) {
      for (const product of oldProducts) {
        await db.delete(products).where(eq(products.id, product.id));
      }
      console.log(`   ✓ Deleted ${oldProducts.length} product(s)`);
    }

    const oldChefs = await db.select().from(chefs);
    if (oldChefs.length > 0) {
      for (const chef of oldChefs) {
        await db.delete(chefs).where(eq(chefs.id, chef.id));
      }
      console.log(`   ✓ Deleted ${oldChefs.length} chef(s)`);
    }

    const oldCategories = await db.select().from(categories);
    if (oldCategories.length > 0) {
      for (const cat of oldCategories) {
        await db.delete(categories).where(eq(categories.id, cat.id));
      }
      console.log(`   ✓ Deleted ${oldCategories.length} categor(ies)`);
    }

    console.log('   ✅ All old data cleared\n');

    // ============================================
    // STEP 2: CREATE CATEGORIES
    // ============================================
    console.log('📋 Step 2: Creating categories...');

    const categoryData = [
      {
        id: 'cat-rotis',
        name: 'Rotis & Breads',
        description: 'Fresh hand-made rotis and breads delivered hot to your door',
        image: 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=800&q=80',
        iconName: 'UtensilsCrossed',
        itemCount: '20+',
      },
      {
        id: 'cat-lunch-dinner',
        name: 'Lunch & Dinner',
        description: 'Complete meals prepared by expert chefs with authentic flavors',
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
        iconName: 'ChefHat',
        itemCount: '30+',
      },
      {
        id: 'cat-hotel-specials',
        name: 'Hotel Specials',
        description: 'Restaurant-quality dishes from premium local hotels and restaurants',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        iconName: 'Hotel',
        itemCount: '35+',
      },
      {
        id: 'cat-desserts',
        name: 'Desserts & Sweets',
        description: 'Delicious desserts and sweet treats to satisfy your cravings',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
        iconName: 'Cake',
        itemCount: '15+',
      },
      {
        id: 'cat-beverages',
        name: 'Beverages',
        description: 'Fresh juices, shakes, teas and cold drinks',
        image: 'https://images.unsplash.com/photo-1589985643862-8a66159b1d4b?w=800&q=80',
        iconName: 'Cup',
        itemCount: '20+',
      },
    ];

    await db.insert(categories).values(categoryData);
    console.log(`   ✅ Created ${categoryData.length} categories\n`);

    // ============================================
    // STEP 3: CREATE CHEFS
    // ============================================
    console.log('📋 Step 3: Creating chefs...');

    const chefData = [
      {
        id: 'chef-roti-1',
        name: 'Roti Master',
        phone: '9876543210',
        description: 'Expert in traditional rotis with 10+ years experience',
        image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80',
        rating: '4.9',
        reviewCount: 342,
        categoryId: 'cat-rotis',
        addressBuilding: 'Sharma House',
        addressStreet: 'Mount Road',
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
      },
      {
        id: 'chef-meal-1',
        name: 'Home Style Kitchen',
        phone: '9876543211',
        description: 'Authentic homestyle cooking with love and care',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80',
        rating: '4.8',
        reviewCount: 456,
        categoryId: 'cat-lunch-dinner',
        addressBuilding: 'Khan Plaza',
        addressStreet: 'L.T. Road',
        addressArea: 'Worli',
        addressCity: 'Mumbai',
        addressPincode: '400022',
        latitude: 19.0244,
        longitude: 72.8479,
        isActive: true,
        defaultDeliveryFee: 40,
        deliveryFeePerKm: 6,
        freeDeliveryThreshold: 250,
        maxDeliveryDistanceKm: 8,
      },
      {
        id: 'chef-hotel-1',
        name: 'Premium Restaurant',
        phone: '9876543212',
        description: 'Fine dining experience with premium quality ingredients',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
        rating: '4.7',
        reviewCount: 523,
        categoryId: 'cat-hotel-specials',
        addressBuilding: 'Plaza Heights',
        addressStreet: 'S.V. Road',
        addressArea: 'Bandra',
        addressCity: 'Mumbai',
        addressPincode: '400050',
        latitude: 19.0596,
        longitude: 72.8295,
        isActive: true,
        defaultDeliveryFee: 50,
        deliveryFeePerKm: 7,
        freeDeliveryThreshold: 300,
        maxDeliveryDistanceKm: 6,
      },
      {
        id: 'chef-desserts-1',
        name: 'Sweet Creations',
        phone: '9876543213',
        description: 'Artisanal desserts and pastries made fresh daily',
        image: 'https://images.unsplash.com/photo-1585080875519-a21dd28bef60?w=400&q=80',
        rating: '4.9',
        reviewCount: 289,
        categoryId: 'cat-desserts',
        addressBuilding: 'Spice Plaza',
        addressStreet: 'Eastern Express Highway',
        addressArea: 'Marine Drive',
        addressCity: 'Mumbai',
        addressPincode: '400016',
        latitude: 19.0436,
        longitude: 72.8245,
        isActive: true,
        defaultDeliveryFee: 25,
        deliveryFeePerKm: 4,
        freeDeliveryThreshold: 150,
        maxDeliveryDistanceKm: 4,
      },
    ];

    await db.insert(chefs).values(chefData);
    console.log(`   ✅ Created ${chefData.length} chefs\n`);

    // ============================================
    // STEP 4: CREATE PRODUCTS
    // ============================================
    console.log('📋 Step 4: Creating products...');

    const productData = [
      // ROTIS & BREADS
      {
        id: 'prod-roti-1',
        name: 'Butter Roti (5 pieces)',
        description: 'Soft, fluffy rotis made with premium butter',
        hotelPrice: 40,
        price: 60,
        image: 'https://images.unsplash.com/photo-1619740455993-557c1a0b69c3?w=400&q=80',
        rating: '4.8',
        reviewCount: 234,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-rotis',
        chefId: 'chef-roti-1',
      },
      {
        id: 'prod-roti-2',
        name: 'Paratha Combo (4 pieces)',
        description: 'Crispy and delicious parathas with pickle and yogurt',
        hotelPrice: 60,
        price: 90,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
        rating: '4.7',
        reviewCount: 189,
        isVeg: true,
        isCustomizable: true,
        categoryId: 'cat-rotis',
        chefId: 'chef-roti-1',
      },
      {
        id: 'prod-roti-3',
        name: 'Naan Trio',
        description: 'Butter naan, garlic naan, and cheese naan',
        hotelPrice: 70,
        price: 110,
        image: 'https://images.unsplash.com/photo-1631452614221-92cfc0d36700?w=400&q=80',
        rating: '4.9',
        reviewCount: 312,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-rotis',
        chefId: 'chef-roti-1',
      },

      // LUNCH & DINNER
      {
        id: 'prod-lunch-1',
        name: 'Aloo Gobi Masala',
        description: 'Spicy potato and cauliflower curry with aromatic spices',
        hotelPrice: 80,
        price: 120,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
        rating: '4.6',
        reviewCount: 156,
        isVeg: true,
        isCustomizable: true,
        categoryId: 'cat-lunch-dinner',
        chefId: 'chef-meal-1',
      },
      {
        id: 'prod-lunch-2',
        name: 'Chicken Tikka Masala',
        description: 'Tender chicken in creamy tomato-based gravy',
        hotelPrice: 120,
        price: 180,
        image: 'https://images.unsplash.com/photo-1565299624946-b28974268df5?w=400&q=80',
        rating: '4.8',
        reviewCount: 423,
        isVeg: false,
        isCustomizable: true,
        categoryId: 'cat-lunch-dinner',
        chefId: 'chef-meal-1',
      },
      {
        id: 'prod-lunch-3',
        name: 'Dal Tadka Special',
        description: 'Protein-rich lentil curry with tempering of spices',
        hotelPrice: 60,
        price: 100,
        image: 'https://images.unsplash.com/photo-1584621674770-dbeafc3d3f3f?w=400&q=80',
        rating: '4.7',
        reviewCount: 267,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-lunch-dinner',
        chefId: 'chef-meal-1',
      },

      // HOTEL SPECIALS
      {
        id: 'prod-hotel-1',
        name: 'Tandoori Chicken',
        description: 'Marinated in yogurt and spices, grilled in tandoor',
        hotelPrice: 150,
        price: 220,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80',
        rating: '4.9',
        reviewCount: 567,
        isVeg: false,
        isCustomizable: false,
        categoryId: 'cat-hotel-specials',
        chefId: 'chef-hotel-1',
      },
      {
        id: 'prod-hotel-2',
        name: 'Butter Chicken Premium',
        description: 'Classic butter chicken with rich tomato and cream sauce',
        hotelPrice: 160,
        price: 240,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80',
        rating: '4.8',
        reviewCount: 634,
        isVeg: false,
        isCustomizable: true,
        categoryId: 'cat-hotel-specials',
        chefId: 'chef-hotel-1',
      },
      {
        id: 'prod-hotel-3',
        name: 'Paneer Tikka Masala',
        description: 'Cottage cheese in spiced gravy with cream',
        hotelPrice: 140,
        price: 210,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
        rating: '4.7',
        reviewCount: 445,
        isVeg: true,
        isCustomizable: true,
        categoryId: 'cat-hotel-specials',
        chefId: 'chef-hotel-1',
      },

      // DESSERTS
      {
        id: 'prod-dessert-1',
        name: 'Gulab Jamun Box',
        description: 'Soft dumplings in sugar syrup (6 pieces)',
        hotelPrice: 40,
        price: 80,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
        rating: '4.9',
        reviewCount: 312,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-desserts',
        chefId: 'chef-desserts-1',
      },
      {
        id: 'prod-dessert-2',
        name: 'Chocolate Brownie',
        description: 'Rich, fudgy chocolate brownie with nuts',
        hotelPrice: 50,
        price: 100,
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
        rating: '4.8',
        reviewCount: 278,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-desserts',
        chefId: 'chef-desserts-1',
      },
      {
        id: 'prod-dessert-3',
        name: 'Rasgulla Pack',
        description: 'Soft spongy cottage cheese balls in syrup (8 pieces)',
        hotelPrice: 45,
        price: 90,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
        rating: '4.7',
        reviewCount: 189,
        isVeg: true,
        isCustomizable: false,
        categoryId: 'cat-desserts',
        chefId: 'chef-desserts-1',
      },
    ];

    await db.insert(products).values(productData);
    console.log(`   ✅ Created ${productData.length} products\n`);

    // ============================================
    // STEP 5: CREATE COUPONS & DISCOUNTS
    // ============================================
    console.log('📋 Step 5: Creating coupons and discounts...');

    const couponData = [
      {
        id: nanoid(),
        code: 'WELCOME20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 100,
        minOrderAmount: 100,
        perUserLimit: 1,
        usageLimit: 1000,
        isActive: true,
        description: '20% OFF on first order',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        code: 'SAVE50',
        discountType: 'fixed',
        discountValue: 50,
        maxDiscount: 50,
        minOrderAmount: 200,
        perUserLimit: 5,
        usageLimit: 500,
        isActive: true,
        description: 'Flat ₹50 OFF on orders above ₹200',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        code: 'ROTILOVE25',
        discountType: 'percentage',
        discountValue: 25,
        maxDiscount: 75,
        minOrderAmount: 150,
        perUserLimit: 3,
        usageLimit: 300,
        isActive: true,
        description: '25% OFF on rotis and breads',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        code: 'WEEKEND30',
        discountType: 'percentage',
        discountValue: 30,
        maxDiscount: 150,
        minOrderAmount: 300,
        perUserLimit: 2,
        usageLimit: 200,
        isActive: true,
        description: '30% OFF on weekends (Fri-Sun)',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        code: 'LOYALTY100',
        discountType: 'fixed',
        discountValue: 100,
        maxDiscount: 100,
        minOrderAmount: 500,
        perUserLimit: 1,
        usageLimit: 50,
        isActive: true,
        description: 'Flat ₹100 OFF on orders above ₹500',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        code: 'NEWBIE15',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscount: 75,
        minOrderAmount: 100,
        perUserLimit: 1,
        usageLimit: 2000,
        isActive: true,
        description: '15% OFF for new users',
        validFrom: new Date(),
        validUntil: new Date('2026-12-31'),
        createdAt: new Date(),
      },
    ];

    await db.insert(coupons).values(couponData as any);
    console.log(`   ✅ Created ${couponData.length} coupons\n`);

    // ============================================
    // STEP 5: CREATE SUBSCRIPTION PLANS
    // ============================================
    console.log('📋 Step 5: Creating subscription plans...');

    const subscriptionPlanData = [
      {
        id: 'plan-daily-rotis',
        name: 'Daily Rotis',
        description: '2 Fresh rotis delivered hot every morning at 8 AM',
        categoryId: 'cat-rotis',
        frequency: 'daily',
        price: 150,
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        items: [
          {
            productId: 'prod-1', // Will be updated after products are seeded
            quantity: 2,
            name: 'Roti (Plain)',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan-weekly-rotis',
        name: 'Weekly Rotis (5 Days)',
        description: '5 fresh roti deliveries per week (Mon-Fri)',
        categoryId: 'cat-rotis',
        frequency: 'weekly',
        price: 600,
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            name: 'Roti (Plain)',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan-lunch-dinner',
        name: 'Lunch & Dinner',
        description: 'Complete lunch and dinner for one person, 6 days a week',
        categoryId: 'cat-lunch-dinner',
        frequency: 'weekly',
        price: 3500,
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        items: [
          {
            productId: 'prod-2',
            quantity: 1,
            name: 'Lunch Box',
          },
          {
            productId: 'prod-3',
            quantity: 1,
            name: 'Dinner Box',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'plan-premium-meals',
        name: 'Premium Meals Monthly',
        description: 'Premium restaurant-quality meals from hotel specials, 30 days',
        categoryId: 'cat-hotel-specials',
        frequency: 'monthly',
        price: 8500,
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        items: [
          {
            productId: 'prod-4',
            quantity: 1,
            name: 'Hotel Special - Lunch',
          },
          {
            productId: 'prod-5',
            quantity: 1,
            name: 'Hotel Special - Dinner',
          },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(subscriptionPlans).values(subscriptionPlanData as any);
    console.log(`   ✅ Created ${subscriptionPlanData.length} subscription plans\n`);

    // ============================================
    // STEP 6: CREATE TEST USER AND SUBSCRIPTION
    // ============================================
    console.log('📋 Step 6: Creating test user and roti subscription...');

    // Create a test user
    const testUserId = nanoid();
    const testUserData = {
      id: testUserId,
      phone: '+919876543210',
      email: 'roti.subscriber@example.com',
      name: 'Roti Subscriber',
      address: '123 Main Street, Kurla West, Mumbai',
      latitude: 19.0596,
      longitude: 72.8295,
      referralCode: nanoid(),
      passwordHash: '$2b$10$abc123', // Dummy hash
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values(testUserData);
    console.log(`   ✓ Created test user: ${testUserData.name}`);

    // Create subscription for the test user (direct to subscriptions table)
    const chefList = await db.select().from(chefs);
    const subscriptionData = {
      id: nanoid(),
      userId: testUserId,
      planId: 'plan-daily-rotis',
      chefId: chefList.length > 0 ? chefList[0].id : null,
      customerName: testUserData.name,
      phone: testUserData.phone,
      email: testUserData.email,
      address: testUserData.address,
      status: 'active',
      startDate: new Date(),
      nextDeliveryDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      nextDeliveryTime: '08:00',
      remainingDeliveries: 30,
      totalDeliveries: 30,
      isPaid: true,
      finalAmount: 4500, // 30 days x 150
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(subscriptions).values(subscriptionData as any);
    console.log(`   ✓ Created daily roti subscription for user`);
    console.log(`   ✅ Test user and subscription created\n`);

    // ============================================
    // STEP 7: VERIFICATION
    // ============================================
    console.log('📋 Step 7: Verifying data...');

    const totalCategories = await db.select().from(categories);
    const totalChefs = await db.select().from(chefs);
    const totalProducts = await db.select().from(products);
    const totalCoupons = await db.select().from(coupons);
    const totalUsers = await db.select().from(users);
    const totalSubscriptionPlans = await db.select().from(subscriptionPlans);
    const totalSubscriptions = await db.select().from(subscriptions);

    console.log(`   ✓ Categories: ${totalCategories.length}`);
    console.log(`   ✓ Chefs: ${totalChefs.length}`);
    console.log(`   ✓ Products: ${totalProducts.length}`);
    console.log(`   ✓ Coupons: ${totalCoupons.length}`);
    console.log(`   ✓ Users: ${totalUsers.length}`);
    console.log(`   ✓ Subscription Plans: ${totalSubscriptionPlans.length}`);
    console.log(`   ✓ Subscriptions: ${totalSubscriptions.length}\n`);

    // ============================================
    // SUCCESS SUMMARY
    // ============================================
    console.log('✅ SUCCESS! All data seeded to Neon DB\n');
    console.log('📊 Data Summary:');
    console.log('   ' + '='.repeat(60));
    console.log(`   Categories: ${totalCategories.length}`);
    totalCategories.forEach(cat => console.log(`      • ${cat.name}`));
    console.log(`\n   Chefs: ${totalChefs.length}`);
    totalChefs.forEach(chef => console.log(`      • ${chef.name}`));
    console.log(`\n   Products: ${totalProducts.length}`);
    console.log(`   Coupons: ${totalCoupons.length}`);
    console.log(`\n   Subscription Plans: ${totalSubscriptionPlans.length}`);
    totalSubscriptionPlans.forEach(plan => console.log(`      • ${plan.name} (₹${plan.price}/${plan.frequency})`));
    console.log(`\n   Test User: ${totalUsers.length}`);
    totalUsers.forEach(user => console.log(`      • ${user.name} (${user.phone})`));
    console.log(`\n   Active Subscriptions: ${totalSubscriptions.length}`);
    totalSubscriptions.forEach(sub => console.log(`      • ${sub.customerName} - ${sub.planId} (₹${sub.finalAmount})`));
    console.log('   ' + '='.repeat(60));

    console.log('\n💾 All data committed to Neon DB\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEED FAILED!\n');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the seed
seedCompleteData();
