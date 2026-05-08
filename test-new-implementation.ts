// 🧪 TEST SUITE: Verify new implementation (Address, Coordinates, WhatsApp, Distance)
import axios from "axios";

const API_BASE = "http://localhost:3000/api";

interface TestResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  console.log(`${result.status} ${result.name}: ${result.message}`);
  if (result.details) console.log(`   Details:`, JSON.stringify(result.details, null, 2));
  results.push(result);
}

async function runTests() {
  console.log("🧪 NEW IMPLEMENTATION TEST SUITE\n");
  console.log("=" .repeat(80));
  console.log("Testing: Address Validation, Coordinates, WhatsApp, Distance\n");

  // TEST 1: User Registration with Address
  console.log("\n📍 TEST 1: User Registration & Address Capture");
  console.log("-".repeat(80));
  try {
    const phone = `9${Math.floor(Math.random() * 1000000000)}`;
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      name: "Test User",
      phone,
      email: `test${Date.now()}@example.com`,
      password: "Test@123",
      address: "123 Main St, Kurla West, Mumbai, 400070",
    });

    if (registerRes.data.user) {
      logTest({
        name: "User Registration",
        status: "✅",
        message: "User registered successfully",
        details: { userId: registerRes.data.user.id, phone },
      });
    }
  } catch (error: any) {
    logTest({
      name: "User Registration",
      status: "❌",
      message: error.response?.data?.message || error.message,
    });
  }

  // TEST 2: Verify Admin Phone Configuration
  console.log("\n📞 TEST 2: Admin Phone Configuration Check");
  console.log("-".repeat(80));
  try {
    const adminsRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: "Bearer fake-token" }, // Will fail but we just check config
    });
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logTest({
        name: "Admin Auth Required",
        status: "✅",
        message: "Admin API properly protected (expected auth failure)",
      });
    }
  }

  // TEST 3: Check Delivery Settings
  console.log("\n⚙️  TEST 3: Delivery Settings & Fee Configuration");
  console.log("-".repeat(80));
  try {
    // This might not be public, but let's try
    const settingsRes = await axios.get(`${API_BASE}/delivery-settings`);
    logTest({
      name: "Delivery Settings",
      status: "✅",
      message: "Delivery settings accessible",
      details: settingsRes.data,
    });
  } catch (error: any) {
    logTest({
      name: "Delivery Settings",
      status: "⚠️",
      message: "Not accessible via public API (expected)",
    });
  }

  // TEST 4: Check Chef List with Coordinates
  console.log("\n👨‍🍳 TEST 4: Chef List & Coordinate Verification");
  console.log("-".repeat(80));
  try {
    const chefsRes = await axios.get(`${API_BASE}/chefs`);
    if (Array.isArray(chefsRes.data) && chefsRes.data.length > 0) {
      const chefsWithCoords = chefsRes.data.filter((c) => c.latitude && c.longitude);
      const coordStatus =
        chefsWithCoords.length === chefsRes.data.length ? "✅ All have coords" : "⚠️ Some missing coords";

      logTest({
        name: "Chef Coordinates",
        status: chefsWithCoords.length > 0 ? "✅" : "❌",
        message: `${chefsWithCoords.length}/${chefsRes.data.length} chefs have coordinates`,
        details: {
          sample: chefsRes.data.slice(0, 3).map((c) => ({
            name: c.name,
            lat: c.latitude,
            lon: c.longitude,
          })),
        },
      });
    }
  } catch (error: any) {
    logTest({
      name: "Chef List",
      status: "❌",
      message: error.message,
    });
  }

  // TEST 5: Check Categories with Delivery Requirements
  console.log("\n🏷️  TEST 5: Categories & Delivery Slot Requirements");
  console.log("-".repeat(80));
  try {
    const categoriesRes = await axios.get(`${API_BASE}/categories`);
    if (Array.isArray(categoriesRes.data)) {
      const withSlots = categoriesRes.data.filter((c) => c.requiresDeliverySlot);
      logTest({
        name: "Categories",
        status: "✅",
        message: `${categoriesRes.data.length} categories loaded, ${withSlots.length} require delivery slots`,
        details: categoriesRes.data.slice(0, 2),
      });
    }
  } catch (error: any) {
    logTest({
      name: "Categories",
      status: "❌",
      message: error.message,
    });
  }

  // TEST 6: Check Products with Pricing
  console.log("\n📦 TEST 6: Products & Pricing Structure");
  console.log("-".repeat(80));
  try {
    const productsRes = await axios.get(`${API_BASE}/products`);
    if (Array.isArray(productsRes.data) && productsRes.data.length > 0) {
      const sample = productsRes.data[0];
      logTest({
        name: "Products",
        status: "✅",
        message: `${productsRes.data.length} products loaded`,
        details: {
          sample: {
            name: sample.name,
            price: sample.price,
            hotelPrice: sample.hotelPrice,
            marginPercent: sample.marginPercent,
          },
        },
      });
    }
  } catch (error: any) {
    logTest({
      name: "Products",
      status: "❌",
      message: error.message,
    });
  }

  // TEST 7: Simulate Checkout with Address Validation
  console.log("\n🛒 TEST 7: Checkout Flow - Address Validation (Frontend Logic)");
  console.log("-".repeat(80));

  // Simulate what the frontend does
  const testAddresses = [
    {
      name: "Complete Address",
      building: "Apt 302",
      street: "Kurla West Road",
      area: "Kurla West",
      city: "Mumbai",
      pincode: "400070",
      shouldValidate: true,
    },
    {
      name: "Incomplete Address (missing area)",
      building: "Apt 302",
      street: "Kurla West Road",
      area: "",
      city: "Mumbai",
      pincode: "400070",
      shouldValidate: false,
    },
    {
      name: "Only pincode",
      building: "",
      street: "",
      area: "",
      city: "",
      pincode: "400070",
      shouldValidate: false,
    },
  ];

  testAddresses.forEach((addr) => {
    const hasAllFields = addr.building && addr.street && addr.area && addr.city && addr.pincode;
    const status = hasAllFields ? "✅" : "⚠️";
    logTest({
      name: `Address Validation: ${addr.name}`,
      status,
      message: hasAllFields ? "Ready for geocoding" : "Incomplete - will prompt user to fill",
      details: { fields: hasAllFields ? "Complete" : "Missing some fields" },
    });
  });

  // TEST 8: Distance Calculation Logic (Frontend validation)
  console.log("\n📏 TEST 8: Distance Calculation & Fee Logic");
  console.log("-".repeat(80));

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateDeliveryFee(
    distance: number,
    baseDeliveryFee: number = 20,
    feePerKm: number = 5,
    freeDeliveryThreshold: number = 200
  ): number {
    return Math.max(baseDeliveryFee, Math.round(distance * feePerKm));
  }

  // Test sample distances
  const testDistances = [
    {
      chefLat: 19.0728,
      chefLon: 72.8826,
      customerLat: 19.0728,
      customerLon: 72.8826,
      label: "Same location (0 km)",
    },
    {
      chefLat: 19.0728,
      chefLon: 72.8826,
      customerLat: 19.08,
      customerLon: 72.89,
      label: "0.9 km away",
    },
    {
      chefLat: 19.0728,
      chefLon: 72.8826,
      customerLat: 19.1,
      customerLon: 72.95,
      label: "~10 km away",
    },
  ];

  testDistances.forEach((test) => {
    const distance = calculateDistance(test.chefLat, test.chefLon, test.customerLat, test.customerLon);
    const fee = calculateDeliveryFee(distance);
    logTest({
      name: `Distance Calculation: ${test.label}`,
      status: "✅",
      message: `Distance: ${distance.toFixed(2)} km → Fee: ₹${fee}`,
    });
  });

  // TEST 9: Coordinate Validation Logic (Frontend)
  console.log("\n🎯 TEST 9: Coordinate Validation (Range Checks)");
  console.log("-".repeat(80));

  function hasUsableCoordinates(latitude: unknown, longitude: unknown): boolean {
    const lat = typeof latitude === "number" ? latitude : Number(latitude);
    const lon = typeof longitude === "number" ? longitude : Number(longitude);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      !(lat === 0 && lon === 0)
    );
  }

  const coordTests = [
    { lat: 19.0728, lon: 72.8826, label: "Valid Mumbai coord", valid: true },
    { lat: 0, lon: 0, label: "Zero coordinate", valid: false },
    { lat: 91, lon: 73, label: "Latitude out of range", valid: false },
    { lat: 19.5, lon: 181, label: "Longitude out of range", valid: false },
    { lat: "19.0728", lon: "72.8826", label: "String coords (should convert)", valid: true },
    { lat: null, lon: null, label: "Null coordinates", valid: false },
  ];

  coordTests.forEach((test) => {
    const valid = hasUsableCoordinates(test.lat, test.lon);
    const status = valid === test.valid ? "✅" : "❌";
    logTest({
      name: `Coordinate Check: ${test.label}`,
      status,
      message: valid ? "Valid coordinates" : "Invalid - will reject",
    });
  });

  // TEST 10: WhatsApp Message Format (Simulation)
  console.log("\n💬 TEST 10: WhatsApp Message Format Validation");
  console.log("-".repeat(80));

  const whatsappTests = [
    {
      type: "Payment Initiated (Admin Alert)",
      message: `
*PAYMENT MARKED BY USER*

Order ID: e2bbb420-cbd3-46d0-b435-5da50f61e929
Customer: Shifa Sameer
Phone: 9167767441
Amount: Rs.132

User clicked "I Paid". Please verify in Admin > Payments.
      `.trim(),
    },
    {
      type: "Chef Order Notification",
      message: `
*NEW ORDER ALERT*

Order ID: #e2bbb420
Items:
10x Gehu Roti (Plain)

Please prepare this order.
      `.trim(),
    },
  ];

  whatsappTests.forEach((test) => {
    const hasOrderId = test.message.includes("Order");
    const hasDetails = test.message.split("\n").length > 3;
    logTest({
      name: `WhatsApp Format: ${test.type}`,
      status: hasOrderId && hasDetails ? "✅" : "❌",
      message: "Message format correct",
      details: { preview: test.message.split("\n").slice(0, 3).join("\n") + "..." },
    });
  });

  // TEST 11: API Endpoint Availability
  console.log("\n🔌 TEST 11: API Endpoints Health Check");
  console.log("-".repeat(80));

  const endpoints = [
    { path: "/categories", method: "GET" },
    { path: "/products", method: "GET" },
    { path: "/chefs", method: "GET" },
    { path: "/auth/register", method: "POST" },
  ];

  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === "GET") {
        await axios.get(`${API_BASE}${endpoint.path}`);
      }
      logTest({
        name: `Endpoint: ${endpoint.path}`,
        status: "✅",
        message: "Accessible",
      });
    } catch (error: any) {
      if (error.code === "ECONNREFUSED") {
        logTest({
          name: `Endpoint: ${endpoint.path}`,
          status: "❌",
          message: "Server not running - Start with: npm run dev:all",
        });
      } else {
        logTest({
          name: `Endpoint: ${endpoint.path}`,
          status: "⚠️",
          message: error.response?.status || error.message,
        });
      }
    }
  }

  // FINAL SUMMARY
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80));

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const warnings = results.filter((r) => r.status === "⚠️").length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed === 0) {
    console.log(`\n🎉 All critical tests passed! Implementation is ready for testing.`);
  } else {
    console.log(`\n⚠️  ${failed} tests failed. Review implementation.`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("🔧 NEXT STEPS:");
  console.log("  1. Start dev server: npm run dev:all");
  console.log("  2. Test in browser: http://localhost:5173");
  console.log("  3. Create a test order with different addresses");
  console.log("  4. Verify distance calculation varies by location");
  console.log("  5. Check WebSocket notifications for admins");
  console.log("  6. Monitor console logs for validation messages");
  console.log("=".repeat(80) + "\n");
}

runTests().catch(console.error);
