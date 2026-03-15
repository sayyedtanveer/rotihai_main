const BASE_URL = 'http://localhost:5000/api';

// Test creating a subscription with the 8PM slot
async function testSubscriptionWithSlot() {
  try {
    console.log('🧪 Starting subscription slot test...\n');

    // Step 1: Get all chefs
    console.log('Step 1: Getting all chefs...');
    const chefsRes = await fetch(`${BASE_URL}/chefs`);
    const chefsData = await chefsRes.json();
    const chefs = Array.isArray(chefsData) ? chefsData : chefsData.data || [];

    if (chefs.length === 0) {
      console.error('❌ No chefs found');
      process.exit(1);
    }

    // Use the first chef or a specific one
    const testChef = chefs[0];
    const chefId = testChef.id;
    console.log(`✅ Using chef: ${testChef.name} (${chefId})\n`);

    // Step 2: Get available slots for the chef
    console.log(`Step 2: Getting available slots for the chef...`);
    const slotsRes = await fetch(
      `${BASE_URL}/delivery-slots?chefId=${chefId}`
    );
    const slotsData = await slotsRes.json();
    const slots = Array.isArray(slotsData) ? slotsData : slotsData.data || [];

    if (slots.length === 0) {
      console.error('❌ No slots found for the chef');
      process.exit(1);
    }

    // Find the 8PM slot
    const epmSlot = slots.find((s) => s.startTime === '20:00');
    if (!epmSlot) {
      console.error('❌ 8PM slot not found');
      console.log(`Available slots: ${slots.map((s) => s.startTime).join(', ')}`);
      process.exit(1);
    }

    console.log(`✅ Found 8PM slot: ${epmSlot.id}\n`);

    // Step 3: Get subscription plans for this chef
    console.log(`Step 3: Getting subscription plans...`);
    const plansRes = await fetch(
      `${BASE_URL}/subscription-plans?chefId=${chefId}`
    );
    const plansData = await plansRes.json();
    const plans = Array.isArray(plansData) ? plansData : plansData.data || [];

    if (plans.length === 0) {
      console.error('❌ No plans found for the chef');
      process.exit(1);
    }

    const plan = plans[0];
    console.log(`✅ Found plan: ${plan.id} (${plan.name})\n`);

    // Step 4: Register a new user
    console.log('Step 4: Registering a new user...');
    const userPhone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
    const registerRes = await fetch(`${BASE_URL}/user/auto-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test User',
        phone: userPhone,
      }),
    });

    const userData = await registerRes.json();
    if (!userData.user) {
      console.error('❌ Failed to register user:', userData);
      process.exit(1);
    }

    console.log(`✅ User registered: ${userData.user.id}\n`);

    // Step 5: Create a subscription with the 8PM slot
    console.log(
      `Step 5: Creating subscription with 8PM slot (${epmSlot.id})...`
    );
    const now = new Date();
    console.log(`   Current time: ${now.toISOString()}`);

    const subscriptionRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userData.accessToken}`,
      },
      body: JSON.stringify({
        userId: userData.user.id,
        chefId: chefId,
        planId: plan.id,
        deliverySlotId: epmSlot.id,
        deliveryAddress: 'Test Address',
        deliveryLat: 19.0760,
        deliveryLng: 72.8777,
        startDate: now.toISOString().split('T')[0],
      }),
    });

    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionData.id) {
      console.error('❌ Failed to create subscription:', subscriptionData);
      process.exit(1);
    }

    const subscription = subscriptionData;
    const nextDelivery = new Date(subscription.nextDeliveryDate);

    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`   Next Delivery: ${nextDelivery.toISOString()}`);
    console.log(`   Delivery Time: ${subscription.nextDeliveryTime}\n`);

    // Step 6: Verify the next delivery date is NOT today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setDate(todayEnd.getDate() + 1);
    todayEnd.setHours(0, 0, 0, 0);

    const isToday =
      nextDelivery >= todayStart && nextDelivery < todayEnd;

    console.log('Step 6: Verifying next delivery date...');
    console.log(`   Today: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);
    console.log(`   Next Delivery: ${nextDelivery.toISOString()}`);
    console.log(`   Is today? ${isToday}`);

    if (isToday) {
      console.error(
        '❌ FAILED: Next delivery is today, but should be next day for subscriptions!'
      );
      process.exit(1);
    }

    console.log(
      '\n✅ SUCCESS: Next delivery is correctly set to a future date (not today)!'
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSubscriptionWithSlot();
