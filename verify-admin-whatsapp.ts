// 🧪 TEST: Verify Admin WhatsApp Implementation
import { storage } from "./server/storage";

async function verifyAdminNotificationSetup() {
  console.log("🔍 ADMIN WHATSAPP NOTIFICATION SETUP VERIFICATION\n");
  console.log("=".repeat(80));

  // 1️⃣ Check admin users in database
  console.log("\n1️⃣ CHECKING ADMIN USERS IN DATABASE");
  console.log("-".repeat(80));
  
  try {
    const allAdmins = await storage.getAllAdmins();
    console.log(`Found ${allAdmins.length} admin users\n`);
    
    allAdmins.forEach((admin, idx) => {
      const hasPhone = admin.phone && admin.phone.trim().length > 0;
      const phoneStatus = hasPhone ? `✅ ${admin.phone}` : "❌ Missing";
      const roleStatus = admin.role === "super_admin" ? "👑 Super Admin" : `👤 ${admin.role}`;
      
      console.log(`[${idx + 1}] ${admin.username}`);
      console.log(`    Role: ${roleStatus}`);
      console.log(`    Phone: ${phoneStatus}`);
      console.log(`    Email: ${admin.email}\n`);
    });

    // 2️⃣ Identify primary admin
    console.log("-".repeat(80));
    console.log("\n2️⃣ IDENTIFYING PRIMARY ADMIN (who will receive notifications)");
    console.log("-".repeat(80));

    const hasPhone = (admin: any) =>
      typeof admin.phone === "string" && admin.phone.trim().length > 0;
    const primaryAdmin =
      allAdmins.find((admin) => admin.role === "super_admin" && hasPhone(admin)) ||
      allAdmins.find(hasPhone);

    if (primaryAdmin) {
      console.log(`✅ PRIMARY ADMIN FOUND:\n`);
      console.log(`   Username: ${primaryAdmin.username}`);
      console.log(`   Phone: ${primaryAdmin.phone}`);
      console.log(`   Role: ${primaryAdmin.role}`);
      console.log(`\n   This admin WILL receive order notifications on WhatsApp`);
    } else {
      console.log(`❌ NO PRIMARY ADMIN FOUND\n`);
      console.log(`   Required: At least one admin with phone number`);
      console.log(`   To fix: UPDATE admin_users SET phone = '919167767441' WHERE role = 'super_admin'`);
    }
  } catch (error: any) {
    console.error(`❌ Error loading admins:`, error.message);
  }

  // 3️⃣ Check WhatsApp configuration
  console.log("\n" + "=".repeat(80));
  console.log("\n3️⃣ CHECKING WHATSAPP API CONFIGURATION");
  console.log("-".repeat(80));

  const whatsappUrl = process.env.WHATSAPP_API_URL || "";
  const whatsappToken = process.env.WHATSAPP_API_TOKEN || "";
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

  console.log(`\nWHATSAPP_API_URL: ${whatsappUrl ? `✅ Configured` : `❌ Missing`}`);
  console.log(`WHATSAPP_API_TOKEN: ${whatsappToken ? `✅ Configured (${whatsappToken.length} chars)` : `❌ Missing`}`);
  console.log(`WHATSAPP_PHONE_NUMBER_ID: ${whatsappPhoneId ? `✅ Configured` : `❌ Missing`}`);

  const allConfigured = whatsappUrl && whatsappToken && whatsappPhoneId;
  console.log(`\n${allConfigured ? "✅ All WhatsApp credentials configured" : "❌ Some WhatsApp credentials missing"}`);

  // 4️⃣ Simulate order notification flow
  console.log("\n" + "=".repeat(80));
  console.log("\n4️⃣ SIMULATING ORDER NOTIFICATION FLOW");
  console.log("-".repeat(80));

  console.log(`\nWhen order is placed, here's what happens:\n`);
  console.log(`1. Order created in database`);
  console.log(`2. getPrimaryAdminPhoneNumber() called`);
  if (primaryAdmin) {
    console.log(`   → Returns: ${primaryAdmin.phone}`);
  } else {
    console.log(`   → Returns: null (no admin phone found)`);
  }
  console.log(`3. sendOrderPlacedAdminNotification() called`);
  if (primaryAdmin && allConfigured) {
    console.log(`   → Sends WhatsApp message`);
    console.log(`   → Message: "📦 NEW ORDER RECEIVED"`);
    console.log(`   → To: ${primaryAdmin.phone}`);
    console.log(`   ✅ READY TO SEND`);
  } else if (!primaryAdmin) {
    console.log(`   → Logs warning: Admin phone not configured`);
    console.log(`   → NO MESSAGE SENT`);
  } else if (!allConfigured) {
    console.log(`   → Logs warning: WhatsApp service not configured`);
    console.log(`   → NO MESSAGE SENT`);
  }

  // 5️⃣ Sample message preview
  console.log("\n" + "=".repeat(80));
  console.log("\n5️⃣ SAMPLE WHATSAPP MESSAGE");
  console.log("-".repeat(80));

  const sampleMessage = `
📦 *NEW ORDER RECEIVED* 📦

Order #: e2bbb420-cbd3-46d0-b435-5da50f61e929
Customer: Shifa Sameer
Amount: ₹132

🔗 View in dashboard to approve payment

-RotiHai Admin System
  `.trim();

  console.log(`\n${sampleMessage}`);

  // 6️⃣ Setup checklist
  console.log("\n" + "=".repeat(80));
  console.log("\n6️⃣ SETUP CHECKLIST");
  console.log("-".repeat(80));

  const checks = [
    {
      name: "Admin phone number in database",
      status: primaryAdmin ? "✅" : "❌",
      fix: primaryAdmin ? null : "UPDATE admin_users SET phone = '91XXXXXXXXXX' WHERE role = 'super_admin'",
    },
    {
      name: "WhatsApp API URL configured",
      status: whatsappUrl ? "✅" : "❌",
      fix: whatsappUrl ? null : "Set WHATSAPP_API_URL in .env",
    },
    {
      name: "WhatsApp API token configured",
      status: whatsappToken ? "✅" : "❌",
      fix: whatsappToken ? null : "Set WHATSAPP_API_TOKEN in .env",
    },
    {
      name: "WhatsApp phone number ID configured",
      status: whatsappPhoneId ? "✅" : "❌",
      fix: whatsappPhoneId ? null : "Set WHATSAPP_PHONE_NUMBER_ID in .env",
    },
  ];

  checks.forEach((check) => {
    console.log(`\n${check.status} ${check.name}`);
    if (check.fix) {
      console.log(`   Fix: ${check.fix}`);
    }
  });

  const allReady = checks.every((c) => c.status === "✅");

  // 7️⃣ Final status
  console.log("\n" + "=".repeat(80));
  console.log("\n7️⃣ FINAL STATUS");
  console.log("=".repeat(80));

  if (allReady) {
    console.log(`\n✅ ADMIN WHATSAPP NOTIFICATION SYSTEM IS READY!\n`);
    console.log(`Admin ${primaryAdmin!.username} will receive order notifications on WhatsApp`);
    console.log(`\nNext steps:`);
    console.log(`  1. Start server: npm run dev:all`);
    console.log(`  2. Place test order`);
    console.log(`  3. Check ${primaryAdmin!.phone} for WhatsApp message`);
  } else {
    console.log(`\n❌ ADMIN WHATSAPP NOTIFICATION SYSTEM NOT READY\n`);
    const failedChecks = checks.filter((c) => c.status === "❌");
    console.log(`Missing ${failedChecks.length} configuration(s):\n`);
    failedChecks.forEach((check) => {
      console.log(`• ${check.fix}`);
    });
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

verifyAdminNotificationSetup().catch(console.error).finally(() => process.exit());
