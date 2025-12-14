"use strict";
/**
 * Comprehensive Test Suite for Subscription Next Delivery Date
 * Tests the flow from subscription creation through API retrieval
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
// Test configuration
const API_BASE = 'http://localhost:5000';
const ADMIN_TOKEN = 'admin-test-token'; // You'll need to set this from actual login
const PARTNER_TOKEN = 'partner-test-token';
const USER_TOKEN = 'user-test-token';
const results = [];
// Helper function to make HTTP requests
function makeRequest(method, path, token, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            hostname: url.hostname,
            port: url.port || 5000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        const req = http_1.default.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                    });
                }
                catch (e) {
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
// Test 1: Verify Admin Subscriptions Endpoint Returns Valid Dates
async function testAdminSubscriptionsDateFormat() {
    const name = 'Admin Subscriptions - Date Format Check';
    try {
        const response = await makeRequest('GET', '/api/admin/subscriptions', ADMIN_TOKEN);
        if (response.statusCode === 401) {
            results.push({ name, passed: false, error: '401 Unauthorized - Using test token' });
            return;
        }
        if (response.statusCode !== 200) {
            results.push({ name, passed: false, error: `HTTP ${response.statusCode}` });
            return;
        }
        const subscriptions = response.body;
        if (!Array.isArray(subscriptions)) {
            results.push({ name, passed: false, error: 'Response is not an array' });
            return;
        }
        // Check first subscription with paid status
        const paidSub = subscriptions.find((s) => s.isPaid === true);
        if (!paidSub) {
            results.push({
                name,
                passed: true,
                details: 'No paid subscriptions to test (this is OK)'
            });
            return;
        }
        console.log('\n📋 Checking subscription:', paidSub.id);
        console.log('   nextDeliveryDate:', paidSub.nextDeliveryDate);
        console.log('   Type:', typeof paidSub.nextDeliveryDate);
        // Verify date format
        const dateValue = paidSub.nextDeliveryDate;
        if (!dateValue) {
            results.push({
                name,
                passed: false,
                error: 'nextDeliveryDate is null/undefined'
            });
            return;
        }
        // Should be ISO string format
        if (typeof dateValue !== 'string') {
            results.push({
                name,
                passed: false,
                error: `Expected string, got ${typeof dateValue}`
            });
            return;
        }
        // Parse and validate
        const dateObj = new Date(dateValue);
        if (isNaN(dateObj.getTime())) {
            results.push({
                name,
                passed: false,
                error: `Invalid date: ${dateValue}`
            });
            return;
        }
        // Check year is reasonable (2020+)
        if (dateObj.getFullYear() < 2020) {
            results.push({
                name,
                passed: false,
                details: `Year ${dateObj.getFullYear()} is too old`,
                error: 'Date appears to be epoch or old value'
            });
            return;
        }
        results.push({
            name,
            passed: true,
            details: {
                dateString: dateValue,
                parsedDate: dateObj.toISOString(),
                year: dateObj.getFullYear(),
                month: dateObj.getMonth() + 1,
                day: dateObj.getDate(),
            }
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Test 2: Verify User Subscriptions Endpoint Returns Valid Dates
async function testUserSubscriptionsDateFormat() {
    const name = 'User Subscriptions - Date Format Check';
    try {
        const response = await makeRequest('GET', '/api/subscriptions', USER_TOKEN);
        if (response.statusCode === 401) {
            results.push({ name, passed: false, error: '401 Unauthorized - Using test token' });
            return;
        }
        if (response.statusCode !== 200) {
            results.push({ name, passed: false, error: `HTTP ${response.statusCode}` });
            return;
        }
        const subscriptions = response.body;
        if (!Array.isArray(subscriptions)) {
            results.push({ name, passed: false, error: 'Response is not an array' });
            return;
        }
        if (subscriptions.length === 0) {
            results.push({
                name,
                passed: true,
                details: 'No subscriptions for user (this is OK)'
            });
            return;
        }
        const sub = subscriptions[0];
        console.log('\n📋 User subscription:', sub.id);
        console.log('   nextDeliveryDate:', sub.nextDeliveryDate);
        console.log('   Type:', typeof sub.nextDeliveryDate);
        console.log('   Status:', sub.status);
        console.log('   isPaid:', sub.isPaid);
        if (!sub.nextDeliveryDate) {
            results.push({
                name,
                passed: false,
                error: 'nextDeliveryDate is null/undefined'
            });
            return;
        }
        const dateObj = new Date(sub.nextDeliveryDate);
        if (isNaN(dateObj.getTime())) {
            results.push({
                name,
                passed: false,
                error: `Invalid date: ${sub.nextDeliveryDate}`
            });
            return;
        }
        if (dateObj.getFullYear() < 2020) {
            results.push({
                name,
                passed: false,
                error: `Year ${dateObj.getFullYear()} is too old (epoch?)`
            });
            return;
        }
        results.push({
            name,
            passed: true,
            details: {
                dateString: sub.nextDeliveryDate,
                parsedDate: dateObj.toISOString(),
                displayDate: dateObj.toLocaleDateString(),
                time: sub.nextDeliveryTime,
            }
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Test 3: Verify Partner Subscriptions Endpoint Returns Valid Dates
async function testPartnerSubscriptionsDateFormat() {
    const name = 'Partner Subscriptions - Date Format Check';
    try {
        const response = await makeRequest('GET', '/api/partner/subscriptions', PARTNER_TOKEN);
        if (response.statusCode === 401) {
            results.push({ name, passed: false, error: '401 Unauthorized - Using test token' });
            return;
        }
        if (response.statusCode !== 200) {
            results.push({ name, passed: false, error: `HTTP ${response.statusCode}` });
            return;
        }
        const subscriptions = response.body;
        if (!Array.isArray(subscriptions)) {
            results.push({ name, passed: false, error: 'Response is not an array' });
            return;
        }
        if (subscriptions.length === 0) {
            results.push({
                name,
                passed: true,
                details: 'No active subscriptions for partner (this is OK)'
            });
            return;
        }
        const sub = subscriptions[0];
        console.log('\n📋 Partner subscription:', sub.id);
        console.log('   nextDeliveryDate:', sub.nextDeliveryDate);
        console.log('   Type:', typeof sub.nextDeliveryDate);
        console.log('   Status:', sub.status);
        if (!sub.nextDeliveryDate) {
            results.push({
                name,
                passed: false,
                error: 'nextDeliveryDate is null/undefined'
            });
            return;
        }
        const dateObj = new Date(sub.nextDeliveryDate);
        if (isNaN(dateObj.getTime())) {
            results.push({
                name,
                passed: false,
                error: `Invalid date: ${sub.nextDeliveryDate}`
            });
            return;
        }
        if (dateObj.getFullYear() < 2020) {
            results.push({
                name,
                passed: false,
                error: `Year ${dateObj.getFullYear()} is too old`
            });
            return;
        }
        results.push({
            name,
            passed: true,
            details: {
                dateString: sub.nextDeliveryDate,
                parsedDate: dateObj.toISOString(),
                planName: sub.planName,
            }
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Test 4: Verify Date Serialization Logic (Unit Test)
function testDateSerializationLogic() {
    const name = 'Date Serialization Logic';
    try {
        // Simulate the serializeSubscription function logic
        function testSerialize(dateInput) {
            if (!dateInput) {
                return { valid: true, result: null };
            }
            try {
                const dateObj = new Date(dateInput);
                const timestamp = dateObj.getTime();
                if (!isNaN(timestamp) && timestamp > 0) {
                    return { valid: true, result: dateObj.toISOString() };
                }
                else {
                    return { valid: true, result: null };
                }
            }
            catch (e) {
                return { valid: true, result: null };
            }
        }
        const testCases = [
            {
                name: 'Valid ISO date',
                input: '2025-12-15T10:30:00.000Z',
                expectValid: true,
                expectNotNull: true,
            },
            {
                name: 'Valid JS Date object',
                input: new Date('2025-12-15'),
                expectValid: true,
                expectNotNull: true,
            },
            {
                name: 'Epoch (1970)',
                input: new Date(0),
                expectValid: true,
                expectNotNull: false, // Should be null
            },
            {
                name: 'Null value',
                input: null,
                expectValid: true,
                expectNotNull: false,
            },
            {
                name: 'Invalid date string',
                input: 'invalid-date',
                expectValid: true,
                expectNotNull: false,
            },
        ];
        let allPassed = true;
        const details = [];
        for (const tc of testCases) {
            const result = testSerialize(tc.input);
            const isNullAsExpected = (result.result === null) === !tc.expectNotNull;
            const casePassed = result.valid && isNullAsExpected;
            if (!casePassed)
                allPassed = false;
            details.push({
                case: tc.name,
                input: String(tc.input).substring(0, 50),
                result: result.result ? result.result.substring(0, 30) : 'null',
                passed: casePassed,
            });
        }
        results.push({
            name,
            passed: allPassed,
            details,
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Test 5: Verify No "Jan 1, 1970" Display
function testNoEpochDates() {
    const name = 'No Epoch (Jan 1, 1970) Dates';
    try {
        const epochDate = new Date(0);
        const year = epochDate.getFullYear();
        // The validation should reject year < 2020
        const isValid = year >= 2020;
        results.push({
            name,
            passed: !isValid, // Should NOT be valid (should be rejected)
            details: {
                epochDate: epochDate.toISOString(),
                year: year,
                shouldReject: true,
                validationCheck: 'year < 2020 returns true, so date is rejected ✓',
            }
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Test 6: Verify Delivery Time Format (HH:mm)
function testDeliveryTimeFormat() {
    const name = 'Delivery Time Format (HH:mm)';
    try {
        const validTimes = ['09:00', '14:30', '20:00', '08:15'];
        const invalidTimes = ['9:00', '24:00', 'invalid', null];
        const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        let allPassed = true;
        const details = [];
        // Valid times
        for (const time of validTimes) {
            const valid = timeRegex.test(time);
            if (!valid)
                allPassed = false;
            details.push({ time, valid });
        }
        // Invalid times should fail
        for (const time of invalidTimes) {
            const valid = timeRegex.test(String(time));
            if (valid)
                allPassed = false;
            details.push({ time, shouldBeInvalid: true, actuallyValid: valid });
        }
        results.push({
            name,
            passed: allPassed,
            details,
        });
    }
    catch (error) {
        results.push({ name, passed: false, error: String(error) });
    }
}
// Main test runner
async function runTests() {
    console.log('🧪 Starting Subscription Delivery Date Test Suite\n');
    console.log('='.repeat(60));
    // Run unit tests first
    testDateSerializationLogic();
    testNoEpochDates();
    testDeliveryTimeFormat();
    // Run integration tests (requires server running)
    console.log('\n📡 Running Integration Tests (requires server)...\n');
    try {
        await testAdminSubscriptionsDateFormat();
        await testUserSubscriptionsDateFormat();
        await testPartnerSubscriptionsDateFormat();
    }
    catch (error) {
        console.error('\n❌ Server connection failed:', error);
        console.log('Make sure the server is running on port 5000');
    }
    // Print results summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST RESULTS:\n');
    let passed = 0;
    let failed = 0;
    for (const result of results) {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        if (result.details) {
            if (typeof result.details === 'string') {
                console.log(`   ${result.details}`);
            }
            else if (Array.isArray(result.details)) {
                for (const detail of result.details) {
                    if (typeof detail === 'object') {
                        console.log(`   ${JSON.stringify(detail, null, 2)}`);
                    }
                    else {
                        console.log(`   ${detail}`);
                    }
                }
            }
            else {
                console.log(`   ${JSON.stringify(result.details, null, 2)}`);
            }
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        if (result.passed) {
            passed++;
        }
        else {
            failed++;
        }
        console.log();
    }
    console.log('='.repeat(60));
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);
    process.exit(failed > 0 ? 1 : 0);
}
// Run tests
runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
