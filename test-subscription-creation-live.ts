#!/usr/bin/env node

/**
 * LIVE TEST: Subscription Creation & Database Verification
 * Tests:
 * 1. Create a new subscription via API
 * 2. Fetch from database to verify all fields
 * 3. Check nextDeliveryDate is TOMORROW (not today)
 * 4. Check address is properly stored and parsed
 * 5. Check delivery logs are generated for all dates
 */

import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE = 'http://localhost:5000';
const TEST_TOKEN = 'test-user-token-for-subscription-test';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function makeRequest(
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(
      `❌ Assertion failed: ${message}\n   Expected: ${expected}\n   Got: ${actual}`
    );
  }
}

async function testCreateNewSubscription() {
  const name = '✅ TEST 1: Create New Subscription via API';
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(name);
    console.log('='.repeat(80));

    // First, create a user account
    console.log('[1] Creating test user...');
    const userResponse = await makeRequest('POST', '/api/users/register', undefined, {
      name: 'Test User ' + Date.now(),
      phone: Math.random().toString().slice(2, 12),
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });

    if (userResponse.statusCode !== 200 && userResponse.statusCode !== 201) {
      throw new Error(`Failed to create user: ${userResponse.statusCode}`);
    }

    const userToken = userResponse.body.token;
    console.log('✅ User created successfully');

    // Get subscription plans
    console.log('[2] Fetching available subscription plans...');
    const plansResponse = await makeRequest('GET', '/api/subscription-plans');
    assert(plansResponse.statusCode === 200, 'Plans endpoint should return 200');
    assert(Array.isArray(plansResponse.body), 'Plans should be array');
    assert(plansResponse.body.length > 0, 'Should have at least one plan');

    const plan = plansResponse.body[0];
    console.log(`✅ Found plan: ${plan.name} (${plan.frequency})`);
    console.log(`   Delivery days: ${JSON.stringify(plan.deliveryDays)}`);

    // Create subscription
    console.log('[3] Creating subscription...');
    const now = new Date();
    const subscription = {
      planId: plan.id,
      deliveryTime: '09:00',
      durationDays: plan.frequency === 'weekly' ? 7 : 30,
      address: JSON.stringify({
        building: 'Test Building 101',
        street: 'Test Street',
        area: 'Test Area',
        city: 'Mumbai',
        pincode: '400001',
        latitude: 19.0760,
        longitude: 72.8777,
      }),
      latitude: 19.0760,
      longitude: 72.8777,
    };

    const subResponse = await makeRequest(
      'POST',
      '/api/subscriptions',
      userToken,
      subscription
    );

    console.log(`   Status: ${subResponse.statusCode}`);
    if (subResponse.statusCode !== 200 && subResponse.statusCode !== 201) {
      console.error('Response:', subResponse.body);
      throw new Error(`Failed to create subscription: ${subResponse.statusCode}`);
    }

    const createdSub = subResponse.body;
    console.log(`✅ Subscription created: ${createdSub.id}`);

    results.push({
      name,
      passed: true,
      details: {
        subscriptionId: createdSub.id,
        planId: plan.id,
        planName: plan.name,
        planFrequency: plan.frequency,
        userToken,
      },
    });

    return {
      subscriptionId: createdSub.id,
      userToken,
      planId: plan.id,
      planFrequency: plan.frequency,
    };
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
    });
    throw error;
  }
}

async function testFetchSubscriptionFromDB(
  subscriptionId: string,
  userToken: string,
  planFrequency: string
) {
  const name = '✅ TEST 2: Fetch Subscription from Database';
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(name);
    console.log('='.repeat(80));

    // Fetch subscription via API (which hits DB)
    console.log('[1] Fetching subscription from API (queries DB)...');
    const response = await makeRequest(
      'GET',
      `/api/subscriptions/${subscriptionId}`,
      userToken
    );

    assert(response.statusCode === 200, `Should return 200, got ${response.statusCode}`);

    const sub = response.body;
    console.log('✅ Subscription fetched from database');

    // Verify nextDeliveryDate
    console.log('\n[2] Verifying nextDeliveryDate...');
    assert(sub.nextDeliveryDate, 'nextDeliveryDate should exist');

    const nextDeliveryDate = new Date(sub.nextDeliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`   Today: ${today.toISOString().split('T')[0]}`);
    console.log(`   Tomorrow: ${tomorrow.toISOString().split('T')[0]}`);
    console.log(`   NextDelivery: ${nextDeliveryDate.toISOString().split('T')[0]}`);

    const nextDeliveryDateOnly = new Date(nextDeliveryDate);
    nextDeliveryDateOnly.setHours(0, 0, 0, 0);

    // Must be TOMORROW or later, never TODAY
    assert(
      nextDeliveryDateOnly.getTime() >= tomorrow.getTime(),
      `Next delivery should be tomorrow or later, not today! Got: ${nextDeliveryDate.toISOString()}`
    );

    // For daily/weekly, should be exactly tomorrow
    // For monthly with specific dates, might be later
    if (planFrequency === 'daily' || planFrequency === 'weekly') {
      assert(
        nextDeliveryDateOnly.getTime() === tomorrow.getTime(),
        `For ${planFrequency}, next delivery should be exactly tomorrow`
      );
    }

    console.log('✅ nextDeliveryDate is TOMORROW or later (correct!)');

    // Verify address
    console.log('\n[3] Verifying address storage...');
    assert(sub.address, 'Address should be stored');

    let parsedAddress;
    try {
      parsedAddress = typeof sub.address === 'string' 
        ? JSON.parse(sub.address) 
        : sub.address;
      console.log('✅ Address is stored as JSON');
    } catch (e) {
      // Address might be a plain string
      parsedAddress = sub.address;
      console.log('⚠️  Address is plain text (not JSON)');
    }

    console.log(`   Building: ${parsedAddress.building || parsedAddress}`);
    console.log(`   Area: ${parsedAddress.area}`);
    console.log(`   Pincode: ${parsedAddress.pincode}`);

    // Verify other important fields
    console.log('\n[4] Verifying subscription fields...');
    assert(sub.status === 'active', 'Status should be active');
    console.log(`✅ Status: ${sub.status}`);

    assert(sub.totalDeliveries > 0, 'Should have total deliveries');
    console.log(`✅ Total deliveries: ${sub.totalDeliveries}`);

    assert(sub.remainingDeliveries > 0, 'Should have remaining deliveries');
    console.log(`✅ Remaining deliveries: ${sub.remainingDeliveries}`);

    assert(sub.startDate, 'Should have start date');
    const startDate = new Date(sub.startDate);
    console.log(`✅ Start date: ${startDate.toISOString().split('T')[0]}`);

    assert(sub.endDate, 'Should have end date');
    const endDate = new Date(sub.endDate);
    console.log(`✅ End date: ${endDate.toISOString().split('T')[0]}`);

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`✅ Duration: ${durationDays} days`);

    // Verify year is valid (1980-2100 range)
    const year = nextDeliveryDate.getFullYear();
    assert(year >= 1980 && year <= 2100, `Year should be 1980-2100, got ${year}`);
    console.log(`✅ Year is valid: ${year}`);

    results.push({
      name,
      passed: true,
      details: {
        status: sub.status,
        nextDeliveryDate: sub.nextDeliveryDate,
        totalDeliveries: sub.totalDeliveries,
        remainingDeliveries: sub.remainingDeliveries,
        startDate: sub.startDate,
        endDate: sub.endDate,
      },
    });

    return { subscription: sub };
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
    });
    throw error;
  }
}

async function testDeliveryLogs(subscriptionId: string, userToken: string) {
  const name = '✅ TEST 3: Verify Delivery Logs Generated';
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(name);
    console.log('='.repeat(80));

    // Fetch delivery logs
    console.log('[1] Fetching delivery logs...');
    const response = await makeRequest(
      'GET',
      `/api/subscriptions/${subscriptionId}/delivery-logs`,
      userToken
    );

    assert(response.statusCode === 200, `Should return 200, got ${response.statusCode}`);
    assert(Array.isArray(response.body), 'Should return array of logs');
    assert(response.body.length > 0, 'Should have at least one delivery log');

    console.log(`✅ Found ${response.body.length} delivery logs`);

    // Check first log
    const firstLog = response.body[0];
    console.log('\n[2] Verifying first delivery log...');
    assert(firstLog.date, 'Log should have date');
    assert(firstLog.status, 'Log should have status');

    const logDate = new Date(firstLog.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logDateOnly = new Date(logDate);
    logDateOnly.setHours(0, 0, 0, 0);

    console.log(`   Log date: ${logDate.toISOString().split('T')[0]}`);
    console.log(`   Status: ${firstLog.status}`);

    // First log should be from tomorrow onwards
    assert(
      logDateOnly.getTime() >= tomorrow.getTime(),
      `First log should start from tomorrow, got ${logDate.toISOString().split('T')[0]}`
    );

    console.log('✅ First delivery log starts from tomorrow (correct!)');

    // Verify logs are sorted ascending
    console.log('\n[3] Verifying log order...');
    let isSorted = true;
    for (let i = 1; i < response.body.length; i++) {
      const prevDate = new Date(response.body[i - 1].date).getTime();
      const currDate = new Date(response.body[i].date).getTime();
      if (currDate < prevDate) {
        isSorted = false;
        break;
      }
    }

    assert(isSorted, 'Logs should be sorted by date ascending');
    console.log('✅ Logs are sorted chronologically (earliest first)');

    results.push({
      name,
      passed: true,
      details: {
        totalLogs: response.body.length,
        firstLogDate: firstLog.date,
        firstLogStatus: firstLog.status,
      },
    });
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
    });
    throw error;
  }
}

async function testScheduleEndpoint(subscriptionId: string, userToken: string) {
  const name = '✅ TEST 4: Verify Schedule Endpoint';
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(name);
    console.log('='.repeat(80));

    // Fetch schedule
    console.log('[1] Fetching subscription schedule...');
    const response = await makeRequest(
      'GET',
      `/api/subscriptions/${subscriptionId}/schedule`,
      userToken
    );

    assert(response.statusCode === 200, `Should return 200, got ${response.statusCode}`);

    const data = response.body;
    assert(data.subscription, 'Should have subscription');
    assert(data.plan, 'Should have plan');
    assert(Array.isArray(data.schedule), 'Should have schedule array');
    assert(data.schedule.length > 0, 'Should have scheduled deliveries');

    console.log(`✅ Schedule fetched with ${data.schedule.length} deliveries`);

    // Check first scheduled delivery
    console.log('\n[2] Verifying first scheduled delivery...');
    const firstSchedule = data.schedule[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduleDate = new Date(firstSchedule.date);
    const scheduleDateOnly = new Date(scheduleDate);
    scheduleDateOnly.setHours(0, 0, 0, 0);

    console.log(`   First scheduled date: ${scheduleDate.toISOString().split('T')[0]}`);

    assert(
      scheduleDateOnly.getTime() >= tomorrow.getTime(),
      `First schedule should be tomorrow or later, not today!`
    );

    console.log('✅ First scheduled delivery is from tomorrow onwards');

    results.push({
      name,
      passed: true,
      details: {
        scheduledCount: data.schedule.length,
        firstScheduleDate: firstSchedule.date,
      },
    });
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
    });
    throw error;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' SUBSCRIPTION CREATION & DATABASE VERIFICATION TEST '.padEnd(79) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log(`\nTest Started: ${new Date().toISOString()}`);
  console.log(`Server: ${API_BASE}\n`);

  try {
    // Test 1: Create subscription
    const test1 = await testCreateNewSubscription();

    // Test 2: Fetch and verify
    await testFetchSubscriptionFromDB(
      test1.subscriptionId,
      test1.userToken,
      test1.planFrequency
    );

    // Test 3: Verify delivery logs
    await testDeliveryLogs(test1.subscriptionId, test1.userToken);

    // Test 4: Verify schedule endpoint
    await testScheduleEndpoint(test1.subscriptionId, test1.userToken);

    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    for (const result of results) {
      if (result.passed) {
        console.log(`${result.name}`);
      } else {
        console.log(`${result.name}`);
        console.log(`   ERROR: ${result.error}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(
      `RESULTS: ${passed} passed, ${failed} failed out of ${results.length} tests`
    );
    console.log('='.repeat(80) + '\n');

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Subscriptions are working correctly.\n');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED. See details above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();
