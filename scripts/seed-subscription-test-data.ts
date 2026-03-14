/**
 * ============================================================================
 * SUBSCRIPTION MODULE TEST DATA GENERATOR
 * ============================================================================
 * 
 * This script populates the database with test subscription delivery logs
 * for comprehensive testing without waiting 1+ days.
 *
 * Run: npx tsx scripts/seed-subscription-test-data.ts
 * 
 * Creates test scenarios:
 * - Today's deliveries: scheduled, preparing, out_for_delivery, delivered, missed
 * - Yesterday: delivered (2), missed (1)
 * - Tomorrow: scheduled
 * - Past week: various statuses
 * - Skipped deliveries
 * ============================================================================
 */

import { db } from "@shared/db";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

async function seedTestData() {
  console.log("🌱 Starting subscription test data seeding...\n");

  try {
    // Step 1: Get or create test subscriptions
    console.log("📌 Step 1: Fetching subscriptions...");
    const subscriptions = await storage.getSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log("❌ No subscriptions found. Please create at least one subscription first.");
      process.exit(1);
    }

    // Use available subscriptions (may be 1, 2, or 3+)
    const testSubscriptions = subscriptions.slice(0, Math.min(3, subscriptions.length));
    console.log(`✅ Using ${testSubscriptions.length} subscription(s) for testing\n`);

    // Helper function to get subscription by index (cycles through available ones)
    const getSubAtIndex = (idx: number) => testSubscriptions[idx % testSubscriptions.length];

    // Step 2: Create test delivery logs with various statuses and dates
    console.log("📌 Step 2: Creating test delivery logs...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Clear existing test data (optional - comment out if you want to keep existing data)
    console.log("   Clearing existing test data...");
    await db.execute(
      sql`DELETE FROM "subscription_delivery_logs" WHERE "notes" LIKE '%TEST%'`
    );

    const testLogs = [];

    // Scenario 1: Today's deliveries with different statuses
    console.log("   Adding TODAY's deliveries...");
    testLogs.push(
      // Scheduled - hasn't started yet
      {
        subscriptionId: getSubAtIndex(0).id,
        date: today,
        time: "09:00",
        status: "scheduled",
        deliveryPersonId: null,
        notes: "TEST: Scheduled for today (9 AM)",
      },
      // Preparing - being prepared
      {
        subscriptionId: getSubAtIndex(1).id,
        date: today,
        time: "12:00",
        status: "preparing",
        deliveryPersonId: null,
        notes: "TEST: Being prepared (12 PM)",
      },
      // Out for delivery - on the way
      {
        subscriptionId: getSubAtIndex(2).id,
        date: today,
        time: "14:00",
        status: "out_for_delivery",
        deliveryPersonId: "test-delivery-person-1",
        notes: "TEST: Out for delivery (2 PM)",
      },
      // Delivered - successfully completed
      {
        subscriptionId: getSubAtIndex(0).id,
        date: today,
        time: "15:00",
        status: "delivered",
        deliveryPersonId: "test-delivery-person-2",
        notes: "TEST: Delivered successfully (3 PM)",
      },
      // Missed - could not complete
      {
        subscriptionId: getSubAtIndex(1).id,
        date: today,
        time: "16:00",
        status: "missed",
        deliveryPersonId: "test-delivery-person-1",
        notes: "TEST: Delivery missed - address unreachable (4 PM)",
      }
    );

    // Scenario 2: Skipped delivery
    console.log("   Adding SKIPPED delivery...");
    testLogs.push({
      subscriptionId: getSubAtIndex(2).id,
      date: today,
      time: "10:00",
      status: "skipped",
      deliveryPersonId: null,
      notes: "TEST: Customer skipped this delivery",
    });

    // Scenario 3: Yesterday's deliveries (all completed)
    console.log("   Adding YESTERDAY's deliveries...");
    testLogs.push(
      {
        subscriptionId: getSubAtIndex(0).id,
        date: yesterday,
        time: "09:00",
        status: "delivered",
        deliveryPersonId: "test-delivery-person-1",
        notes: "TEST: Yesterday - Delivered successfully",
      },
      {
        subscriptionId: getSubAtIndex(1).id,
        date: yesterday,
        time: "12:00",
        status: "delivered",
        deliveryPersonId: "test-delivery-person-2",
        notes: "TEST: Yesterday - Delivered successfully",
      },
      {
        subscriptionId: getSubAtIndex(2).id,
        date: yesterday,
        time: "14:00",
        status: "missed",
        deliveryPersonId: "test-delivery-person-1",
        notes: "TEST: Yesterday - Missed delivery",
      }
    );

    // Scenario 4: Tomorrow's delivery (future)
    console.log("   Adding TOMORROW's delivery...");
    testLogs.push({
      subscriptionId: getSubAtIndex(0).id,
      date: tomorrow,
      time: "09:00",
      status: "scheduled",
      deliveryPersonId: null,
      notes: "TEST: Tomorrow - Scheduled delivery",
    });

    // Scenario 5: Two days ago (past)
    console.log("   Adding 2 DAYS AGO's deliveries...");
    testLogs.push(
      {
        subscriptionId: getSubAtIndex(1).id,
        date: twoDaysAgo,
        time: "09:00",
        status: "delivered",
        deliveryPersonId: "test-delivery-person-2",
        notes: "TEST: 2 days ago - Delivered",
      },
      {
        subscriptionId: getSubAtIndex(0).id,
        date: twoDaysAgo,
        time: "14:00",
        status: "missed",
        deliveryPersonId: "test-delivery-person-1",
        notes: "TEST: 2 days ago - Missed",
      }
    );

    // Scenario 6: Three days ago (older data)
    console.log("   Adding 3 DAYS AGO's deliveries...");
    testLogs.push({
      subscriptionId: getSubAtIndex(2).id,
      date: threeDaysAgo,
      time: "12:00",
      status: "delivered",
      deliveryPersonId: "test-delivery-person-1",
      notes: "TEST: 3 days ago - Delivered",
    });

    // Insert all test logs
    for (const log of testLogs) {
      await storage.createSubscriptionDeliveryLog({
        subscriptionId: log.subscriptionId,
        date: log.date,
        time: log.time,
        status: log.status as any,
        deliveryPersonId: log.deliveryPersonId,
        notes: log.notes,
      });
    }

    console.log(`✅ Created ${testLogs.length} test delivery logs\n`);

    // Step 3: Display what was created
    console.log("📌 Step 3: Test data summary\n");
    console.log("TODAY'S DELIVERIES:");
    console.log("  ✓ 1 Scheduled (9:00 AM)");
    console.log("  ✓ 1 Preparing (12:00 PM)");
    console.log("  ✓ 1 Out for Delivery (2:00 PM)");
    console.log("  ✓ 1 Delivered (3:00 PM)");
    console.log("  ✓ 1 Missed (4:00 PM)");
    console.log("  ✓ 1 Skipped (10:00 AM)\n");

    console.log("PAST DELIVERIES:");
    console.log("  ✓ Yesterday: 2 Delivered, 1 Missed");
    console.log("  ✓ 2 Days Ago: 1 Delivered, 1 Missed");
    console.log("  ✓ 3 Days Ago: 1 Delivered\n");

    console.log("FUTURE DELIVERIES:");
    console.log("  ✓ Tomorrow: 1 Scheduled\n");

    // Step 4: Verify data was inserted
    console.log("📌 Step 4: Verifying test data...");
    const allLogs = await db.query.subscriptionDeliveryLogs.findMany();
    console.log(`✅ Total logs in database: ${allLogs.length}\n`);

    // Count by status
    const statuses = ["scheduled", "preparing", "out_for_delivery", "delivered", "missed", "skipped"];
    for (const status of statuses) {
      const count = allLogs.filter(log => log.status === status).length;
      if (count > 0) {
        console.log(`  - ${status.toUpperCase()}: ${count}`);
      }
    }

    console.log("\n🎉 ============================================================");
    console.log("   TEST DATA SEEDING COMPLETE!");
    console.log("============================================================🎉");
    console.log("\n✅ You can now test:");
    console.log("   🔹 Admin Subscriptions > Today Overview (shows today's summary)");
    console.log("   🔹 Admin Subscriptions > Missed Deliveries (shows 2 missed today)");
    console.log("   🔹 Admin Subscriptions > Active Subscriptions (shows all active)");
    console.log("   🔹 Admin Subscriptions > Subscription Plans (shows plans)");
    console.log("   🔹 Admin Chef Performance (shows chef stats from test data)");
    console.log("   🔹 User My Subscriptions > Skip This Delivery (test skip feature)");
    console.log("\nAll test data is marked with 'TEST:' in notes for easy identification.\n");
    console.log("To clean up: DELETE FROM subscription_delivery_logs WHERE notes LIKE '%TEST%';\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    console.error("\nMake sure:");
    console.error("  1. Database is running");
    console.error("  2. subscription_delivery_logs table exists (run migrations first)");
    console.error("  3. At least one subscription exists in the database");
    process.exit(1);
  }
}

seedTestData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
