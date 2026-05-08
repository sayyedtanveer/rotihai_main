// 🔍 E2E VERIFICATION: Check coordinate and distance calculation accuracy
import { db } from "../shared/db";
import { orders, chefs, users } from "../shared/schema";
import { desc, sql } from "drizzle-orm";

async function auditCoordinates() {
  console.log("🔍 E2E VERIFICATION: Production Coordinate Audit\n");

  // 1️⃣ Check if all orders have same distance (bug indicator)
  console.log("=" .repeat(80));
  console.log("1️⃣  DISTANCE DIVERSITY CHECK (0.41 km for everyone = BUG)");
  console.log("=" .repeat(80));
  
  const distanceStats = await db.query.orders.findMany({
    where: (order, { gte, lte }) => sql`DATE(${order.createdAt}) >= '2026-05-04'`,
    orderBy: (order) => [desc(order.createdAt)],
    limit: 20,
    columns: {
      id: true,
      customerName: true,
      customerLatitude: true,
      customerLongitude: true,
      distance: true,
      createdAt: true,
    },
  });

  console.log(`\nRecent Orders (last 20):`);
  const uniqueDistances = new Set();
  distanceStats.forEach(order => {
    const dist = order.distance;
    uniqueDistances.add(dist);
    const lat = order.customerLatitude;
    const lon = order.customerLongitude;
    let coordStatus = "🔴 ZERO";
    if (lat === 19.0728 && lon === 72.8826) coordStatus = "🟡 DEFAULT_KURLA";
    if (lat && lon && !(lat === 0 && lon === 0) && !(lat === 19.0728 && lon === 72.8826)) coordStatus = "🟢 UNIQUE";
    
    console.log(`  ${order.id.slice(0, 8)} | ${order.customerName?.slice(0, 15)?.padEnd(15)} | Dist: ${String(dist).padEnd(6)} | ${coordStatus} | (${lat}, ${lon})`);
  });

  console.log(`\n✓ Unique distances found: ${uniqueDistances.size}`);
  console.log(`✓ Distance values: ${Array.from(uniqueDistances).join(", ")}`);
  if (uniqueDistances.size === 1) {
    console.log(`❌ BUG DETECTED: All orders have the same distance! Expected variation.`);
  }

  // 2️⃣ Check coordinate distribution
  console.log("\n" + "=".repeat(80));
  console.log("2️⃣  COORDINATE DISTRIBUTION CHECK");
  console.log("=".repeat(80));

  const coordCheck = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`,
      zeroCoords: sql<number>`COUNT(CASE WHEN "customerLatitude" = 0 AND "customerLongitude" = 0 THEN 1 END)`,
      defaultKurla: sql<number>`COUNT(CASE WHEN "customerLatitude" = 19.0728 AND "customerLongitude" = 72.8826 THEN 1 END)`,
      validCoords: sql<number>`COUNT(CASE WHEN "customerLatitude" NOT IN (0, 19.0728) AND "customerLongitude" NOT IN (0, 72.8826) THEN 1 END)`,
    })
    .from(orders)
    .where(sql`DATE("createdAt") >= '2026-05-04'`);

  const coord = coordCheck[0];
  console.log(`\n📊 Last 3 Days Orders (May 4-7):`);
  console.log(`   Total Orders:        ${coord.totalOrders}`);
  console.log(`   🔴 Zero (0, 0):      ${coord.zeroCoords} (${coord.totalOrders ? ((coord.zeroCoords / coord.totalOrders) * 100).toFixed(1) : 0}%)`);
  console.log(`   🟡 Default Kurla:    ${coord.defaultKurla} (${coord.totalOrders ? ((coord.defaultKurla / coord.totalOrders) * 100).toFixed(1) : 0}%)`);
  console.log(`   🟢 Valid/Unique:     ${coord.validCoords} (${coord.totalOrders ? ((coord.validCoords / coord.totalOrders) * 100).toFixed(1) : 0}%)`);

  if (coord.defaultKurla > coord.totalOrders * 0.5) {
    console.log(`\n⚠️  WARNING: >50% of orders using DEFAULT Kurla coordinates!`);
    console.log(`   This explains why everyone sees 0.41 km (or similar fixed distance)`);
  }

  // 3️⃣ Check chef coordinates
  console.log("\n" + "=".repeat(80));
  console.log("3️⃣  CHEF COORDINATE CHECK");
  console.log("=".repeat(80));

  const chefStats = await db.query.chefs.findMany({
    limit: 10,
    columns: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(`\nChef Coordinates (first 10):`);
  chefStats.forEach(chef => {
    const lat = chef.latitude;
    const lon = chef.longitude;
    let status = "🔴 MISSING";
    if (lat === 19.0728 && lon === 72.8826) status = "🟡 DEFAULT";
    if (lat && lon && !(lat === 19.0728 && lon === 72.8826)) status = "🟢 VALID";
    
    console.log(`  ${chef.id.slice(0, 8)} | ${chef.name?.slice(0, 20)?.padEnd(20)} | ${status} | (${lat}, ${lon})`);
  });

  // 4️⃣ Check user profile coordinates
  console.log("\n" + "=".repeat(80));
  console.log("4️⃣  USER PROFILE COORDINATE CHECK");
  console.log("=".repeat(80));

  const userStats = await db.query.users.findMany({
    limit: 10,
    columns: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(`\nUser Profile Coordinates (first 10):`);
  const usersWithCoords = userStats.filter(u => u.latitude || u.longitude);
  if (usersWithCoords.length === 0) {
    console.log(`  ❌ No users have coordinates stored in profile!`);
  } else {
    usersWithCoords.forEach(user => {
      const lat = user.latitude;
      const lon = user.longitude;
      let status = "?";
      if (lat === 19.0728 && lon === 72.8826) status = "🟡 DEFAULT";
      if (lat && lon && !(lat === 19.0728 && lon === 72.8826)) status = "🟢 VALID";
      
      console.log(`  ${user.id.slice(0, 8)} | ${user.name?.slice(0, 20)?.padEnd(20)} | ${status} | (${lat}, ${lon})`);
    });
  }

  // 5️⃣ Calculate what distance SHOULD be (sample calculation)
  console.log("\n" + "=".repeat(80));
  console.log("5️⃣  DISTANCE CALCULATION VERIFICATION");
  console.log("=".repeat(80));

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get a sample order with chef
  const sampleOrder = await db.query.orders.findFirst({
    where: (order) => sql`"createdAt" >= NOW() - INTERVAL '3 days' AND "chefId" IS NOT NULL`,
    columns: {
      id: true,
      chefId: true,
      chefName: true,
      customerLatitude: true,
      customerLongitude: true,
      distance: true,
    },
  });

  if (sampleOrder && sampleOrder.chefId) {
    const chef = await db.query.chefs.findFirst({
      where: (c) => sql`id = ${sampleOrder.chefId}`,
      columns: {
        latitude: true,
        longitude: true,
        name: true,
      },
    });

    if (chef && sampleOrder.customerLatitude && sampleOrder.customerLongitude) {
      const calculatedDist = calculateDistance(
        chef.latitude as number,
        chef.longitude as number,
        sampleOrder.customerLatitude as number,
        sampleOrder.customerLongitude as number
      );

      console.log(`\n📍 Sample Order Distance Check:`);
      console.log(`   Order ID: ${sampleOrder.id.slice(0, 8)}`);
      console.log(`   Chef: ${chef.name} at (${chef.latitude}, ${chef.longitude})`);
      console.log(`   Customer at: (${sampleOrder.customerLatitude}, ${sampleOrder.customerLongitude})`);
      console.log(`   Stored in DB: ${sampleOrder.distance} km`);
      console.log(`   Calculated: ${calculatedDist.toFixed(2)} km`);
      
      if (Math.abs((sampleOrder.distance as any) - calculatedDist) > 0.1) {
        console.log(`   ❌ MISMATCH: Stored vs Calculated distance differs!`);
      } else {
        console.log(`   ✅ CORRECT: Distance calculation is accurate`);
      }
    }
  }

  // 6️⃣ Check delivery fee calculation
  console.log("\n" + "=".repeat(80));
  console.log("6️⃣  DELIVERY FEE ACCURACY CHECK");
  console.log("=".repeat(80));

  const feeStats = await db
    .select({
      distance: sql<number>`CAST(${orders.distance} AS NUMERIC)`,
      deliveryFee: sql<number>`${orders.deliveryFee}`,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(sql`DATE("createdAt") >= '2026-05-04'`)
    .groupBy(sql`CAST(${orders.distance} AS NUMERIC), ${orders.deliveryFee}`);

  console.log(`\n💰 Distance → Delivery Fee Mapping:`);
  feeStats.forEach(row => {
    console.log(`   ${String(row.distance).padEnd(6)} km → ₹${String(row.deliveryFee).padEnd(3)} (${row.count} orders)`);
  });

  // 7️⃣ ROOT CAUSE ANALYSIS
  console.log("\n" + "=".repeat(80));
  console.log("🔴 ROOT CAUSE ANALYSIS");
  console.log("=".repeat(80));

  if (coord.defaultKurla > coord.totalOrders * 0.5) {
    console.log(`\n❌ PRIMARY ISSUE: Default Kurla coordinates being used for most orders`);
    console.log(`\nLikely causes:`);
    console.log(`  1. User location not being captured during checkout`);
    console.log(`  2. Geocoding failing silently and falling back to defaults`);
    console.log(`  3. User profile coordinates not being populated`);
    console.log(`  4. Database fallback to Kurla coordinates when none available`);
    console.log(`\nFix needed in:`);
    console.log(`  • CheckoutDialog.tsx - Ensure coordinates captured`);
    console.log(`  • autoGeocodeAddress() - Check for geocoding failures`);
    console.log(`  • Backend order creation - Validate coordinates before saving`);
  } else if (coord.zeroCoords > coord.totalOrders * 0.2) {
    console.log(`\n❌ SECONDARY ISSUE: Orders with zero (0,0) coordinates`);
    console.log(`\nFix needed:`);
    console.log(`  • Reject orders at checkout if coordinates missing`);
    console.log(`  • Require address validation before order submission`);
  }

  console.log("\n" + "=".repeat(80));
}

auditCoordinates().catch(console.error).finally(() => process.exit());
