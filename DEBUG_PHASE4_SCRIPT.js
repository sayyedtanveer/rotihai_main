// Phase 4 - Subscription Module Debug Script
// Insert this in your browser console to test all endpoints

// 1. Check Admin Token
function checkToken() {
  const token = localStorage.getItem("adminToken");
  console.log("✅ Admin Token:", token ? `${token.slice(0, 20)}...` : "NOT FOUND");
  return token;
}

// 2. Test Missed Deliveries Endpoint
async function testMissedDeliveries() {
  try {
    const token = checkToken();
    if (!token) {
      console.error("❌ No admin token found");
      return;
    }

    console.log("🔄 Testing /api/admin/subscriptions/missed-deliveries...");
    const response = await fetch("/api/admin/subscriptions/missed-deliveries", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Missed Deliveries Response:", data);
    console.log("   - Total:", data.total);
    console.log("   - Data items:", data.data?.length || 0);
    
    if (data.data?.length === 0) {
      console.warn("⚠️  No missed deliveries found (this is normal if none exist)");
    }
    
    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    return null;
  }
}

// 3. Test Today Overview Endpoint
async function testTodayOverview() {
  try {
    const token = checkToken();
    if (!token) return;

    console.log("\n🔄 Testing /api/admin/subscriptions/today...");
    const response = await fetch("/api/admin/subscriptions/today", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Today Overview Response:", data);
    console.log("   - Summary:", data.summary);
    console.log("   - Deliveries count:", data.data?.length || 0);
    
    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    return null;
  }
}

// 4. Test Chef Performance Endpoint
async function testChefPerformance() {
  try {
    const token = checkToken();
    if (!token) return;

    console.log("\n🔄 Testing /api/admin/chef-performance...");
    const response = await fetch("/api/admin/chef-performance", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📊 Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Chef Performance Response:", data);
    console.log("   - Leaderboard count:", data.leaderboard?.length || 0);
    
    if (data.leaderboard?.length > 0) {
      console.log("   - Top Chef:", data.leaderboard[0].chefName);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    return null;
  }
}

// 5. Test Skip Delivery Endpoint
async function testSkipDelivery(subscriptionId) {
  try {
    const token = localStorage.getItem("userToken");
    if (!token) {
      console.error("❌ No user token found");
      return;
    }

    console.log("\n🔄 Testing POST /api/subscriptions/:id/skip-delivery...");
    const response = await fetch(`/api/subscriptions/${subscriptionId}/skip-delivery`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        deliveryDate: new Date().toISOString()
      })
    });

    console.log("📊 Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Skip Delivery Response:", data);
    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    return null;
  }
}

// 6. Test Database Schema
async function testDatabaseSchema() {
  try {
    const token = checkToken();
    if (!token) return;

    console.log("\n🔄 Testing Database Schema...");
    
    // Try to fetch subscriptions to verify database is working
    const response = await fetch("/api/admin/subscriptions", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("❌ Database Query Failed! Status:", response.status);
      return false;
    }

    const data = await response.json();
    console.log("✅ Database Connection OK");
    console.log("   - Subscriptions count:", data?.length || 0);
    
    return true;
  } catch (error) {
    console.error("❌ Database Error:", error);
    return false;
  }
}

// 7. Check Component State
function checkComponentState() {
  console.log("\n🔍 Checking Component State...");
  
  // Check React Query cache
  console.log("📊 React Query Cache:", window.__REACT_QUERY_DEVTOOLS_CONTEXT__);
  
  // Check local storage
  console.log("💾 Local Storage:");
  console.log("   - Admin Token:", localStorage.getItem("adminToken") ? "✅ Present" : "❌ Missing");
  console.log("   - Admin User:", localStorage.getItem("adminUser") ? "✅ Present" : "❌ Missing");
  console.log("   - User Token:", localStorage.getItem("userToken") ? "✅ Present" : "❌ Missing");
}

// 8. Run All Tests
async function runAllTests() {
  console.log("=".repeat(50));
  console.log("PHASE 4 SUBSCRIPTION MODULE VERIFICATION");
  console.log("=".repeat(50));
  
  checkComponentState();
  const dbOk = await testDatabaseSchema();
  
  if (dbOk) {
    await testMissedDeliveries();
    await testTodayOverview();
    await testChefPerformance();
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("TESTS COMPLETE");
  console.log("=".repeat(50));
}

// Export functions for manual use
window.debugSubscription = {
  testMissedDeliveries,
  testTodayOverview,
  testChefPerformance,
  testSkipDelivery,
  testDatabaseSchema,
  checkComponentState,
  runAllTests
};

console.log("✅ Debug script loaded!");
console.log("Run: window.debugSubscription.runAllTests()");
console.log("Or test individually:");
console.log("  - window.debugSubscription.testMissedDeliveries()");
console.log("  - window.debugSubscription.testTodayOverview()");
console.log("  - window.debugSubscription.testChefPerformance()");
