/**
 * Test script for delivery areas admin API endpoints
 * Run with: npx ts-node test-delivery-areas-api.ts
 */

const API_URL = process.env.API_URL || "http://localhost:5000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ""; // Set your token here

async function testDeliveryAreasAPI() {
  console.log("\n🧪 Testing Delivery Areas Admin API\n");
  console.log(`API URL: ${API_URL}`);

  try {
    // ============================================
    // TEST 1: Get current delivery areas
    // ============================================
    console.log("\n1️⃣  GET /api/admin/delivery-areas");
    console.log("─".repeat(50));

    const getResponse = await fetch(`${API_URL}/api/admin/delivery-areas`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      console.error(`❌ Failed: ${getResponse.status} ${getResponse.statusText}`);
      const errorBody = await getResponse.text();
      console.error("Error:", errorBody);
    } else {
      const data = await getResponse.json();
      console.log("✅ Success!");
      console.log("Response:", JSON.stringify(data, null, 2));

      // ============================================
      // TEST 2: Update delivery areas
      // ============================================
      console.log("\n2️⃣  PUT /api/admin/delivery-areas");
      console.log("─".repeat(50));

      const newAreas = [
        "Kurla West",
        "Kurla East",
        "Fort",
        "Colaba",
        "Bandra",
        "Worli",
        "Marine Drive",
        "Downtown Mumbai",
        "South Mumbai",
      ];

      const putResponse = await fetch(`${API_URL}/api/admin/delivery-areas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ areas: newAreas }),
      });

      if (!putResponse.ok) {
        console.error(`❌ Failed: ${putResponse.status} ${putResponse.statusText}`);
        const errorBody = await putResponse.text();
        console.error("Error:", errorBody);
      } else {
        const data = await putResponse.json();
        console.log("✅ Success!");
        console.log("Response:", JSON.stringify(data, null, 2));

        // ============================================
        // TEST 3: Verify areas were updated
        // ============================================
        console.log("\n3️⃣  GET /api/admin/delivery-areas (verify update)");
        console.log("─".repeat(50));

        const verifyResponse = await fetch(`${API_URL}/api/admin/delivery-areas`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
          },
        });

        if (!verifyResponse.ok) {
          console.error(`❌ Failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
        } else {
          const data = await verifyResponse.json();
          console.log("✅ Success!");
          console.log("Updated areas:", JSON.stringify(data.areas, null, 2));
        }
      }
    }

    console.log("\n✨ All tests completed!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testDeliveryAreasAPI();
