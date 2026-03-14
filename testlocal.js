async function testLocalAPIs() {
  const baseURL = "http://localhost:5000";
  
  console.log("\n=== TESTING LOCAL APIS ===\n");

  try {
    const endpoints = [
      "/api/admin/subscriptions/today",
      "/api/admin/subscriptions/missed-deliveries",
      "/api/admin/subscriptions/overdue-preparations",
      "/api/admin/chef-performance",
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint}`);
      try {
        const res = await fetch(`${baseURL}${endpoint}`, {
          headers: { Authorization: "Bearer test-token" }
        });

        if (res.status === 404) {
          console.log(`  ❌ 404 Not Found`);
        } else if (res.status === 401) {
          console.log(`  ✅ 401 Unauthorized (route exists)`);
        } else if (res.status === 200) {
          const data = await res.json();
          console.log(`  ✅ 200 OK - Data: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          console.log(`  Status: ${res.status}`);
        }
      } catch (err) {
        console.log(`  ❌ ${err.message}`);
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

testLocalAPIs();
