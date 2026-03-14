async function testRenderProduction() {
  const baseURL = "https://rotihai-backend.onrender.com";
  
  console.log("\n=== TESTING RENDER PRODUCTION APIs ===\n");

  try {
    const endpoints = [
      "/api/admin/subscriptions/today",
      "/api/admin/subscriptions/missed-deliveries",
      "/api/admin/subscriptions/overdue-preparations",
      "/api/admin/chef-performance",
    ];

    console.log(`🚀 Testing endpoints on: ${baseURL}\n`);

    for (const endpoint of endpoints) {
      console.log(`🔍 Testing ${endpoint}`);
      try {
        const res = await fetch(`${baseURL}${endpoint}`, {
          headers: { Authorization: "Bearer test-token" }
        });

        if (res.status === 404) {
          console.log(`   ❌ 404 Not Found`);
        } else if (res.status === 401) {
          console.log(`   ✅ 401 Unauthorized - Endpoint EXISTS ✓`);
        } else if (res.status === 200) {
          console.log(`   ✅ 200 OK - Endpoint working ✓`);
        } else {
          console.log(`   ⚠️  Status: ${res.status}`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

testRenderProduction();
