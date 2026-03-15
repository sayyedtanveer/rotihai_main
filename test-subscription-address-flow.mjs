/**
 * Test subscription flow to verify address pre-fill
 * Replicates:
 * 1. User login - new account
 * 2. First subscription creation with address
 * 3. Check if subscription is returned with address
 * 4. Second subscription creation check if address is pre-filled
 */

const BASE_URL = 'http://localhost:5000/api';

async function testSubscriptionAddressPreFill() {
  try {
    console.log('\n🧪 SUBSCRIPTION ADDRESS PRE-FILL TEST\n');
    console.log('='.repeat(60));

    // Step 1: Create new user
    console.log('\n📝 Step 1: Creating new user...');
    const phone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
    const registerRes = await fetch(`${BASE_URL}/user/auto-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test User',
        phone: phone,
      }),
    });

    const userData = await registerRes.json();
    if (!userData.user || !userData.accessToken) {
      console.error('❌ Failed to register user:', userData);
      process.exit(1);
    }

    const userId = userData.user.id;
    const accessToken = userData.accessToken;
    console.log(`✅ User created: ${userId}`);
    console.log(`   Phone: ${phone}`);

    // Step 2: Get chef and plan
    console.log('\n📋 Step 2: Getting chef and plan...');
    const chefsRes = await fetch(`${BASE_URL}/chefs`);
    const chefs = await chefsRes.json();
    const chef = chefs[0];
    console.log(`✅ Chef: ${chef.name} (${chef.id})`);

    const plansRes = await fetch(`${BASE_URL}/subscription-plans?chefId=${chef.id}`);
    const plansData = await plansRes.json();
    const plans = Array.isArray(plansData) ? plansData : [];
    const plan = plans[0];
    console.log(`✅ Plan: ${plan.name} (${plan.id})`);

    // Step 3: Create FIRST subscription with address
    console.log('\n📍 Step 3: Creating FIRST subscription with address...');
    const firstAddress = {
      building: '123',
      street: 'Main Street',
      area: 'Kurla West',
      city: 'Mumbai',
      pincode: '400070',
      latitude: 19.0760,
      longitude: 72.8777,
    };

    const sub1Res = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: plan.id,
        address: firstAddress,
      }),
    });

    const sub1 = await sub1Res.json();
    if (!sub1.id) {
      console.error('❌ Failed to create first subscription:', sub1);
      process.exit(1);
    }

    console.log(`✅ First subscription created: ${sub1.id}`);
    console.log(`   Address stored: ${sub1.address}`);
    console.log(`   Address type: ${typeof sub1.address}`);

    // Step 4: Fetch all subscriptions to check address format
    console.log('\n📊 Step 4: Fetching subscriptions from API...');
    const subsRes = await fetch(`${BASE_URL}/subscriptions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const subs = await subsRes.json();
    const fetchedSub1 = subs.find((s) => s.id === sub1.id);

    if (!fetchedSub1) {
      console.error('❌ First subscription not found in fetch');
      process.exit(1);
    }

    console.log(`✅ First subscription retrieved`);
    console.log(`   Address value: "${fetchedSub1.address}"`);
    console.log(`   Address type: ${typeof fetchedSub1.address}`);

    // Try to parse as JSON to see if it's stored as JSON or plain string
    let parsedAddress = null;
    try {
      if (typeof fetchedSub1.address === 'string') {
        parsedAddress = JSON.parse(fetchedSub1.address);
        console.log(`✅ Address parsed as JSON object:`, parsedAddress);
      } else {
        parsedAddress = fetchedSub1.address;
        console.log(`✅ Address is already an object:`, parsedAddress);
      }
    } catch (e) {
      console.log(`⚠️  Address is plain string (not JSON):`);
      console.log(`    Value: "${fetchedSub1.address}"`);
      parsedAddress = null;
    }

    // Step 5: Check what would be pre-filled for second subscription
    console.log('\n🔄 Step 5: Checking address pre-fill logic for SECOND subscription...');

    // This mimics the frontend logic from SubscriptionDrawer.tsx line 677-682
    if (subs.length > 0 && subs[0]?.address) {
      try {
        const logic_parsedAddress = typeof subs[0].address === 'string' 
          ? JSON.parse(subs[0].address)
          : subs[0].address;
        
        console.log(`✅ Would pre-fill with address object:`, logic_parsedAddress);
      } catch (error) {
        console.error(`❌ FRONTEND LOGIC FAILS - Cannot parse address as JSON`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Address value: "${subs[0].address}"`);
        console.log(`\n   ➜ This is the GAP: Address not being parsed correctly!`);
      }
    } else {
      if (subs.length === 0) {
        console.log(`❌ No subscriptions found`);
      } else {
        console.log(`❌ First subscription has no address field`);
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:\n');

    if (parsedAddress) {
      console.log('✅ ADDRESS IS PROPERLY STORED AND PARSABLE');
      console.log('   → Second subscription ADDRESS WILL BE PRE-FILLED correctly\n');
    } else {
      console.log('❌ ADDRESS IS NOT PROPERLY PARSABLE');
      console.log('   → Second subscription ADDRESS WILL NOT BE PRE-FILLED');
      console.log('   → THE GAP: Address needs to be stored as JSON string\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testSubscriptionAddressPreFill();
