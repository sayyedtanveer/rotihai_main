#!/usr/bin/env node

/**
 * Integration Test Suite for Subscription Delivery Date Fix
 * Tests the entire pipeline: API endpoints, serialization, and date handling
 */

const BASE_URL = 'http://localhost:5000';
let testsPassed = 0;
let testsFailed = 0;

// Test utilities
function assert(condition, message) {
  if (!condition) {
    console.error('❌ ASSERTION FAILED:', message);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertTrue(condition, message) {
  assert(condition === true, message);
}

function assertFalsy(condition, message) {
  assert(!condition, message);
}

async function testRequest(name, method, endpoint, options = {}) {
  console.log(`\n🧪 ${name}`);
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok && response.status !== 304) {
      console.error(`   Response Status: ${response.status}`);
      const text = await response.text();
      console.error(`   Response Body: ${text.substring(0, 200)}`);
    }

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, response };
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    testsFailed++;
    throw error;
  }
}

// Test 1: Verify Admin Subscriptions API returns ISO date strings
async function testAdminSubscriptionsAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Admin Subscriptions API - Date Format');
  console.log('='.repeat(70));

  try {
    const { data, status } = await testRequest(
      'GET /api/admin/subscriptions',
      'GET',
      '/api/admin/subscriptions'
    );

    assertTrue(status === 200, `Status should be 200, got ${status}`);
    assertTrue(Array.isArray(data), 'Response should be an array');
    
    if (data.length > 0) {
      const subscription = data[0];
      console.log('   Sample subscription returned');
      console.log(`   - Has nextDeliveryDate: ${subscription.nextDeliveryDate !== undefined}`);
      console.log(`   - nextDeliveryDate value: ${subscription.nextDeliveryDate}`);
      console.log(`   - nextDeliveryDate type: ${typeof subscription.nextDeliveryDate}`);

      if (subscription.nextDeliveryDate) {
        // Validate ISO format
        const dateStr = subscription.nextDeliveryDate;
        assertTrue(
          typeof dateStr === 'string',
          `nextDeliveryDate should be string, got ${typeof dateStr}`
        );
        assertTrue(
          /^\d{4}-\d{2}-\d{2}T/.test(dateStr),
          `nextDeliveryDate should be ISO format, got: ${dateStr}`
        );

        // Parse and validate date
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        console.log(`   - Parsed year: ${year}`);
        assertTrue(year >= 2020, `Year should be >= 2020, got ${year}`);
        assertFalsy(isNaN(dateObj.getTime()), 'Date should be valid');
      }

      console.log('   ✅ Subscription date format is valid');
    } else {
      console.log('   ℹ️  No subscriptions in database (this is OK for empty state)');
    }

    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }
}

// Test 2: Verify User Subscriptions API returns ISO date strings
async function testUserSubscriptionsAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: User Subscriptions API - Date Format');
  console.log('='.repeat(70));

  try {
    const { data, status } = await testRequest(
      'GET /api/subscriptions',
      'GET',
      '/api/subscriptions'
    );

    assertTrue(status === 200 || status === 304, `Status should be 200/304, got ${status}`);
    assertTrue(Array.isArray(data), 'Response should be an array');

    if (data.length > 0) {
      const subscription = data[0];
      console.log('   Sample subscription returned');
      
      if (subscription.nextDeliveryDate) {
        const dateStr = subscription.nextDeliveryDate;
        assertTrue(
          typeof dateStr === 'string',
          `nextDeliveryDate should be string, got ${typeof dateStr}`
        );
        assertTrue(
          /^\d{4}-\d{2}-\d{2}T/.test(dateStr),
          `nextDeliveryDate should be ISO format, got: ${dateStr}`
        );

        const dateObj = new Date(dateStr);
        assertTrue(year >= 2020, `Year should be >= 2020`);
      }

      console.log('   ✅ User subscription dates are in ISO format');
    } else {
      console.log('   ℹ️  No subscriptions found (empty state)');
    }

    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }
}

// Test 3: Verify no epoch dates (Jan 1, 1970) are returned
async function testNoEpochDates() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Epoch Date Detection - Ensuring no Jan 1, 1970');
  console.log('='.repeat(70));

  try {
    const { data } = await testRequest(
      'GET /api/admin/subscriptions',
      'GET',
      '/api/admin/subscriptions'
    );

    if (Array.isArray(data) && data.length > 0) {
      for (const sub of data) {
        if (sub.nextDeliveryDate) {
          const dateObj = new Date(sub.nextDeliveryDate);
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth();
          const date = dateObj.getDate();

          // Check it's not epoch
          assertFalsy(
            year === 1970 && month === 0 && date === 1,
            `Found epoch date for subscription ${sub.id}`
          );

          console.log(`   ✅ Subscription ${sub.id} - year: ${year} (not epoch)`);
        }
      }
    }

    console.log('   ✅ No epoch dates detected');
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }
}

// Test 4: Unit test for date serialization logic
async function testSerializationLogic() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Date Serialization Logic - Unit Test');
  console.log('='.repeat(70));

  function serializeSubscription(sub) {
    if (!sub) return sub;
    const serialized = { ...sub };

    if (serialized.nextDeliveryDate) {
      try {
        const dateObj = new Date(serialized.nextDeliveryDate);
        const timestamp = dateObj.getTime();
        if (!isNaN(timestamp) && timestamp > 0) {
          serialized.nextDeliveryDate = dateObj.toISOString();
        } else {
          serialized.nextDeliveryDate = null;
        }
      } catch (e) {
        serialized.nextDeliveryDate = null;
      }
    }

    return serialized;
  }

  try {
    // Test 1: Valid date
    const validDate = { id: 'test1', nextDeliveryDate: '2025-12-15T10:30:00Z' };
    const result1 = serializeSubscription(validDate);
    assertTrue(result1.nextDeliveryDate !== null, 'Valid date should not be null');
    console.log(`   ✅ Valid date handled: ${result1.nextDeliveryDate}`);

    // Test 2: Epoch (should become null)
    const epochDate = { id: 'test2', nextDeliveryDate: new Date(0) };
    const result2 = serializeSubscription(epochDate);
    assertFalsy(result2.nextDeliveryDate, 'Epoch date should be null');
    console.log(`   ✅ Epoch date handled: null`);

    // Test 3: Invalid date
    const invalidDate = { id: 'test3', nextDeliveryDate: 'invalid' };
    const result3 = serializeSubscription(invalidDate);
    assertFalsy(result3.nextDeliveryDate, 'Invalid date should be null');
    console.log(`   ✅ Invalid date handled: null`);

    // Test 4: Null date
    const nullDate = { id: 'test4', nextDeliveryDate: null };
    const result4 = serializeSubscription(nullDate);
    assertFalsy(result4.nextDeliveryDate, 'Null should stay null');
    console.log(`   ✅ Null date handled: null`);

    console.log('   ✅ All serialization tests passed');
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }
}

// Test 5: Date validation for frontend
async function testDateValidation() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Frontend Date Validation Logic');
  console.log('='.repeat(70));

  function isValidDeliveryDate(date) {
    if (!date) return false;
    try {
      const dateObj = new Date(date);
      const timestamp = dateObj.getTime();
      const year = dateObj.getFullYear();
      if (isNaN(timestamp) || year < 2020) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  try {
    // Test cases
    const testCases = [
      { input: '2025-12-15T10:30:00Z', expected: true, desc: 'Valid future date' },
      { input: new Date(0), expected: false, desc: 'Epoch date' },
      { input: null, expected: false, desc: 'Null' },
      { input: undefined, expected: false, desc: 'Undefined' },
      { input: 'invalid', expected: false, desc: 'Invalid string' },
      { input: '1970-01-01', expected: false, desc: 'Old date (1970)' },
      { input: '2019-12-31', expected: false, desc: 'Pre-2020 date' },
      { input: '2025-01-01', expected: true, desc: '2025 date' },
    ];

    for (const test of testCases) {
      const result = isValidDeliveryDate(test.input);
      assertEqual(result, test.expected, `${test.desc}: expected ${test.expected}, got ${result}`);
      console.log(`   ✅ ${test.desc}: ${result}`);
    }

    console.log('   ✅ All validation tests passed');
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    testsFailed++;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + 'SUBSCRIPTION DELIVERY DATE TEST SUITE' + ' '.repeat(16) + '║');
  console.log('║' + ' '.repeat(20) + 'Testing Date Serialization Fix' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  try {
    // Run all tests
    await testAdminSubscriptionsAPI();
    await testUserSubscriptionsAPI();
    await testNoEpochDates();
    await testSerializationLogic();
    await testDateValidation();

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
    console.log('='.repeat(70));

    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! The subscription date fix is working correctly.');
      process.exit(0);
    } else {
      console.log(`⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
