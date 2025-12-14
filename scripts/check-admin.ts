#!/usr/bin/env node

/**
 * Quick test to check if admin users exist in database
 * Run: npx ts-node scripts/check-admin.ts
 */

import { db } from "../shared/db";
import { adminUsers } from "../shared/schema";

async function checkAdmins() {
  try {
    console.log("🔍 Checking admin users in database...\n");

    const allAdmins = await db.select().from(adminUsers);

    if (allAdmins.length === 0) {
      console.log("❌ NO ADMIN USERS FOUND!");
      console.log("\n📝 You need to:");
      console.log("1. Run the SQL reset script (reset-db-compact.sql or reset-db-fast.sql)");
      console.log("2. OR run: npx ts-node scripts/create-admin.ts");
      process.exit(1);
    }

    console.log(`✅ Found ${allAdmins.length} admin user(s):\n`);
    allAdmins.forEach((admin) => {
      console.log(`  📌 Username: ${admin.username}`);
      console.log(`     Role: ${admin.role}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     ID: ${admin.id}\n`);
    });

    console.log("🎯 You can now use test-login endpoint:");
    allAdmins.forEach((admin) => {
      console.log(`   POST /api/admin/auth/test-login with {"username": "${admin.username}"}`);
    });

  } catch (error) {
    console.error("❌ Error checking admins:", error);
    process.exit(1);
  }
}

checkAdmins();
