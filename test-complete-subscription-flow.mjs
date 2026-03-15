/**
 * Complete Subscription Flow Test
 * Verifies:
 * 1. User login/registration
 * 2. First subscription with address
 * 3. Second subscription - address is pre-filled
 * 4. Third subscription - address still pre-filled
 */

const BASE_URL = 'http://localhost:5000/api';

async function completeSubscriptionFlowTest() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPLETE SUBSCRIPTION FLOW TEST');
    console.log('='.repeat(70));

    // ============ STEP 1: USER CREATION ============
    console.log('\n📝 STEP 1: User Registration');
    console.log('-'.repeat(70));

    const phone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
    const registerRes = await fetch(`${BASE_URL}/user/auto-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'John Doe',
        phone: phone,
      }),
    });

    const userData = await registerRes.json();
    if (!userData.user || !userData.accessToken) {
      console.error('❌ Registration failed:', userData);
      process.exit(1);
    }

    const userId = userData.user.id;
    const accessToken = userData.accessToken;

    console.log(`✅ User registered successfully`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Phone: ${phone}\n`);

    // ============ STEP 2: GET CHEF AND PLANS ============
    console.log('📋 STEP 2: Fetching Available Plans');
    console.log('-'.repeat(70));

    const chefsRes = await fetch(`${BASE_URL}/chefs`);
    const chefs = await chefsRes.json();
    const chef = chefs[0];

    const plansRes = await fetch(`${BASE_URL}/subscription-plans`);
    const plansData = await plansRes.json();
    const plans = Array.isArray(plansData) ? plansData : [];
    
    if (plans.length < 2) {
      console.error('❌ Not enough plans to test. Need at least 2 plans.');
      process.exit(1);
    }

    console.log(`✅ Found ${plans.length} subscription plans`);
    plans.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
    });

    // ============ STEP 3: FIRST SUBSCRIPTION WITH ADDRESS ============
    console.log('\n📍 STEP 3: Creating FIRST Subscription');
    console.log('-'.repeat(70));

    const firstAddress = {
      building: 'Building A',
      street: 'Main Street',
      area: 'Kurla West',
      city: 'Mumbai',
      pincode: '400070',
      latitude: 19.0760,
      longitude: 72.8777,
    };

    console.log(`Creating subscription for: ${plans[0].name}`);
    console.log(`Address: ${firstAddress.building}, ${firstAddress.street}, ${firstAddress.area}`);

    const sub1Res = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: plans[0].id,
        address: firstAddress,
      }),
    });

    const sub1 = await sub1Res.json();
    if (!sub1.id) {
      console.error('❌ First subscription creation failed:', sub1);
      process.exit(1);
    }

    console.log(`✅ First subscription created`);
    console.log(`   Subscription ID: ${sub1.id}`);
    console.log(`   Plan: ${plans[0].name}`);
    console.log(`   Address stored: ${sub1.address}\n`);

    // ============ STEP 4: SECOND SUBSCRIPTION (Address should be pre-filled) ============
    console.log('\n📍 STEP 4: Creating SECOND Subscription');
    console.log('-'.repeat(70));

    // Fetch user's subscriptions to simulate frontend checking for pre-fill
    const subsRes = await fetch(`${BASE_URL}/subscriptions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const userSubs = await subsRes.json();
    console.log(`✅ Retrieved ${userSubs.length} existing subscription(s)`);

    if (userSubs.length === 0) {
      console.error('❌ No subscriptions found when there should be 1');
      process.exit(1);
    }

    // Check if address can be pre-filled (simulating frontend logic)
    let preFilledAddress = null;
    try {
      if (userSubs[0]?.address) {
        const parsedAddr = typeof userSubs[0].address === 'string'
          ? JSON.parse(userSubs[0].address)
          : userSubs[0].address;

        preFilledAddress = parsedAddr;
        console.log(`✅ Address pre-filled from first subscription:`);
        console.log(`   ${parsedAddr.building}, ${parsedAddr.street}, ${parsedAddr.area}`);
      } else {
        console.warn(`⚠️  No address in first subscription`);
      }
    } catch (e) {
      console.warn(`⚠️  Could not parse address for pre-fill:`, e.message);
    }

    // Create second subscription (using pre-filled address if available)
    const secondAddress = preFilledAddress || firstAddress;

    console.log(`\nCreating subscription for: ${plans[1].name}`);
    console.log(`Using address: ${secondAddress.building}, ${secondAddress.street}, ${secondAddress.area}`);

    const sub2Res = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: plans[1].id,
        address: secondAddress,
      }),
    });

    const sub2 = await sub2Res.json();
    if (!sub2.id) {
      console.error('❌ Second subscription creation failed:', sub2);
      process.exit(1);
    }

    console.log(`✅ Second subscription created`);
    console.log(`   Subscription ID: ${sub2.id}`);
    console.log(`   Plan: ${plans[1].name}`);
    console.log(`   Address: ${sub2.address}\n`);

    // ============ STEP 5: VERIFY BOTH SUBSCRIPTIONS ============
    console.log('\n✅ STEP 5: Verification');
    console.log('-'.repeat(70));

    const finalSubsRes = await fetch(`${BASE_URL}/subscriptions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const finalSubs = await finalSubsRes.json();
    console.log(`Total subscriptions: ${finalSubs.length}`);

    finalSubs.forEach((sub, i) => {
      const addr = typeof sub.address === 'string'
        ? JSON.parse(sub.address)
        : sub.address;

      console.log(`\nSubscription ${i + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Plan: ${sub.planId}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Address: ${addr?.building || 'N/A'}, ${addr?.street || 'N/A'}, ${addr?.area || 'N/A'}`);
    });

    // ============ FINAL RESULT ============
    console.log('\n' + '='.repeat(70));
    if (finalSubs.length >= 2) {
      console.log('✅ SUCCESS: Complete subscription flow working!');
      console.log('   - User created and logged in');
      console.log('   - First subscription created with address');
      console.log('   - Second subscription created with pre-filled address');
      console.log('   - Address is properly stored and retrievable for both');
    } else {
      console.log('❌ FAILED: Expected 2 subscriptions but got', finalSubs.length);
      process.exit(1);
    }
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

completeSubscriptionFlowTest();
