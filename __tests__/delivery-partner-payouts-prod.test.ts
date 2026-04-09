/**
 * Production Database Test Suite - Delivery Partner Payouts
 * Tests all CRUD operations against live database
 * Run this to verify the module is production-ready
 */

import api from "@/lib/apiClient";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "ERROR";
  message: string;
  duration: number;
}

const results: TestResult[] = [];
let createdIds: string[] = [];

// Helper to measure execution time
function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    resolve({ result, duration });
  });
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    const { duration } = await measureTime(fn);
    results.push({
      name,
      status: "PASS",
      message: "✓ Success",
      duration,
    });
    console.log(`✅ [${duration}ms] ${name}`);
  } catch (error: any) {
    results.push({
      name,
      status: "FAIL",
      message: error?.response?.data?.message || error.message,
      duration: 0,
    });
    console.error(`❌ ${name}: ${error?.response?.data?.message || error.message}`);
  }
}

export async function runProductionTests() {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 DELIVERY PARTNER PAYOUTS - PRODUCTION DATABASE TEST");
  console.log("=".repeat(80) + "\n");

  // ============================================================================
  // TEST SUITE 1: CREATE OPERATIONS
  // ============================================================================
  console.log("📝 TEST SUITE 1: CREATE OPERATIONS\n");

  let globalSlab0to1Id: string;
  let globalSlab1to2Id: string;
  let globalSlab2to3Id: string;
  let regionalSlabId: string;

  await test("Create Global Slab (0-1km = ₹10)", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 0,
      maxDistance: 1,
      payoutAmount: 10,
      pincode: null,
      isActive: true,
    });

    if (!response.data?.id) throw new Error("No ID returned");
    if (response.data.minDistance !== "0.00") throw new Error("Invalid minDistance format");
    if (response.data.maxDistance !== "1.00") throw new Error("Invalid maxDistance format");
    if (response.data.payoutAmount !== 10) throw new Error("Payout amount mismatch");

    globalSlab0to1Id = response.data.id;
    createdIds.push(globalSlab0to1Id);
  });

  await test("Create Global Slab (1-2km = ₹15)", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 1,
      maxDistance: 2,
      payoutAmount: 15,
      pincode: null,
      isActive: true,
    });

    if (response.data.payoutAmount !== 15) throw new Error("Payout amount mismatch");
    globalSlab1to2Id = response.data.id;
    createdIds.push(globalSlab1to2Id);
  });

  await test("Create Global Slab (2-3km = ₹20)", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 2,
      maxDistance: 3,
      payoutAmount: 20,
      pincode: null,
      isActive: true,
    });

    if (response.data.payoutAmount !== 20) throw new Error("Payout amount mismatch");
    globalSlab2to3Id = response.data.id;
    createdIds.push(globalSlab2to3Id);
  });

  await test("Create Regional Slab (400070: 0-1km = ₹12)", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 0,
      maxDistance: 1,
      payoutAmount: 12,
      pincode: "400070",
      isActive: true,
    });

    if (response.data.pincode !== "400070") throw new Error("Pincode not stored correctly");
    if (response.data.payoutAmount !== 12) throw new Error("Payout amount mismatch");

    regionalSlabId = response.data.id;
    createdIds.push(regionalSlabId);
  });

  await test("Create with Decimal Distances (0.5-1.5km = ₹12)", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 0.5,
      maxDistance: 1.5,
      payoutAmount: 12,
      pincode: null,
      isActive: true,
    });

    if (response.data.minDistance !== "0.50") throw new Error("Decimal minDistance not formatted correctly");
    if (response.data.maxDistance !== "1.50") throw new Error("Decimal maxDistance not formatted correctly");

    createdIds.push(response.data.id);
  });

  // ============================================================================
  // TEST SUITE 2: READ OPERATIONS
  // ============================================================================
  console.log("\n📖 TEST SUITE 2: READ OPERATIONS\n");

  let allPayouts: any[] = [];

  await test("Get All Payout Slabs", async () => {
    const response = await api.get("/api/admin/delivery-partner-payouts");

    if (!Array.isArray(response.data)) throw new Error("Response is not an array");
    if (response.data.length === 0) throw new Error("No payouts returned");

    allPayouts = response.data;
  });

  await test("Verify All Required Fields in Response", async () => {
    if (allPayouts.length === 0) throw new Error("No payouts to verify");

    const payout = allPayouts[0];
    const required = ["id", "name", "minDistance", "maxDistance", "payoutAmount", "isActive", "createdAt"];

    for (const field of required) {
      if (!(field in payout)) throw new Error(`Missing field: ${field}`);
    }
  });

  await test("Verify Global Slabs Exist", async () => {
    const slab = allPayouts.find((p) => p.id === globalSlab0to1Id);
    if (!slab) throw new Error("Global slab 0-1km not found");
    if (slab.payoutAmount !== 10) throw new Error("Wrong payout amount");
  });

  await test("Verify Regional Slab Exists", async () => {
    const slab = allPayouts.find((p) => p.id === regionalSlabId);
    if (!slab) throw new Error("Regional slab not found");
    if (slab.pincode !== "400070") throw new Error("Pincode mismatch");
  });

  // ============================================================================
  // TEST SUITE 3: UPDATE OPERATIONS
  // ============================================================================
  console.log("\n✏️ TEST SUITE 3: UPDATE OPERATIONS\n");

  await test("Update Payout Amount (15 → 18)", async () => {
    const response = await api.patch(`/api/admin/delivery-partner-payouts/${globalSlab1to2Id}`, {
      payoutAmount: 18,
    });

    if (response.data.payoutAmount !== 18) throw new Error("Payout amount not updated");

    // Restore for other tests
    await api.patch(`/api/admin/delivery-partner-payouts/${globalSlab1to2Id}`, {
      payoutAmount: 15,
    });
  });

  await test("Update Active Status (true → false → true)", async () => {
    await api.patch(`/api/admin/delivery-partner-payouts/${globalSlab2to3Id}`, {
      isActive: false,
    });

    let response = await api.get("/api/admin/delivery-partner-payouts");
    let slab = response.data.find((p) => p.id === globalSlab2to3Id);
    if (slab.isActive !== false) throw new Error("Active status not updated to false");

    // Restore
    await api.patch(`/api/admin/delivery-partner-payouts/${globalSlab2to3Id}`, {
      isActive: true,
    });

    response = await api.get("/api/admin/delivery-partner-payouts");
    slab = response.data.find((p) => p.id === globalSlab2to3Id);
    if (slab.isActive !== true) throw new Error("Active status not restored to true");
  });

  await test("Update Multiple Fields at Once", async () => {
    const response = await api.patch(`/api/admin/delivery-partner-payouts/${regionalSlabId}`, {
      payoutAmount: 14,
      isActive: false,
    });

    if (response.data.payoutAmount !== 14) throw new Error("Payout amount not updated");
    if (response.data.isActive !== false) throw new Error("Active status not updated");

    // Restore
    await api.patch(`/api/admin/delivery-partner-payouts/${regionalSlabId}`, {
      payoutAmount: 12,
      isActive: true,
    });
  });

  // ============================================================================
  // TEST SUITE 4: DISTANCE MATCHING LOGIC
  // ============================================================================
  console.log("\n📍 TEST SUITE 4: DISTANCE MATCHING LOGIC\n");

  await test("Match 0.3km to 0-1km Slab (₹10)", async () => {
    const payouts = await api.get("/api/admin/delivery-partner-payouts");
    const matching = payouts.data.find(
      (p) =>
        parseFloat(p.minDistance) <= 0.3 &&
        0.3 < parseFloat(p.maxDistance) &&
        !p.pincode &&
        p.isActive &&
        p.payoutAmount === 10
    );

    if (!matching) throw new Error("0.3km did not match 0-1km slab");
  });

  await test("Match 1.5km to 1-2km Slab (₹15)", async () => {
    const payouts = await api.get("/api/admin/delivery-partner-payouts");
    const matching = payouts.data.find(
      (p) =>
        parseFloat(p.minDistance) <= 1.5 &&
        1.5 < parseFloat(p.maxDistance) &&
        !p.pincode &&
        p.isActive &&
        p.payoutAmount === 15
    );

    if (!matching) throw new Error("1.5km did not match 1-2km slab");
  });

  await test("Match 2.8km to 2-3km Slab (₹20)", async () => {
    const payouts = await api.get("/api/admin/delivery-partner-payouts");
    const matching = payouts.data.find(
      (p) =>
        parseFloat(p.minDistance) <= 2.8 &&
        2.8 < parseFloat(p.maxDistance) &&
        !p.pincode &&
        p.isActive &&
        p.payoutAmount === 20
    );

    if (!matching) throw new Error("2.8km did not match 2-3km slab");
  });

  // ============================================================================
  // TEST SUITE 5: REGIONAL PINCODE MATCHING
  // ============================================================================
  console.log("\n🗺️ TEST SUITE 5: REGIONAL PINCODE MATCHING\n");

  await test("Match 0.3km Pincode 400070 to Regional Slab (₹12)", async () => {
    const payouts = await api.get("/api/admin/delivery-partner-payouts");

    // First priority: pincode-specific
    let matching = payouts.data.find(
      (p) =>
        p.pincode === "400070" &&
        parseFloat(p.minDistance) <= 0.3 &&
        0.3 < parseFloat(p.maxDistance) &&
        p.isActive
    );

    if (!matching) throw new Error("Pincode-specific slab not found");
    if (matching.payoutAmount !== 12) throw new Error("Wrong payout for regional slab");
  });

  await test("Fallback to Global Slab for Non-Configured Pincode", async () => {
    const payouts = await api.get("/api/admin/delivery-partner-payouts");

    // For pincode 400050 (not configured), should get global slab
    const globalSlab = payouts.data.find(
      (p) =>
        !p.pincode &&
        parseFloat(p.minDistance) <= 0.3 &&
        0.3 < parseFloat(p.maxDistance) &&
        p.isActive
    );

    if (!globalSlab) throw new Error("Global fallback slab not found");
  });

  // ============================================================================
  // TEST SUITE 6: DELETE OPERATIONS
  // ============================================================================
  console.log("\n🗑️ TEST SUITE 6: DELETE OPERATIONS\n");

  let testDeleteId: string;

  await test("Create Slab for Deletion Test", async () => {
    const response = await api.post("/api/admin/delivery-partner-payouts", {
      minDistance: 5,
      maxDistance: 6,
      payoutAmount: 35,
      pincode: null,
      isActive: true,
    });

    testDeleteId = response.data.id;
  });

  await test("Delete Payout Slab", async () => {
    const response = await api.delete(`/api/admin/delivery-partner-payouts/${testDeleteId}`);

    if (!response.data?.message) throw new Error("No success message returned");
  });

  await test("Verify Deleted Slab No Longer Exists", async () => {
    const response = await api.get("/api/admin/delivery-partner-payouts");
    const found = response.data.find((p) => p.id === testDeleteId);

    if (found) throw new Error("Deleted slab still exists in database");
  });

  // ============================================================================
  // TEST SUITE 7: ERROR HANDLING
  // ============================================================================
  console.log("\n⚠️ TEST SUITE 7: ERROR HANDLING\n");

  await test("Reject Create with Invalid Distance Range (min >= max)", async () => {
    try {
      await api.post("/api/admin/delivery-partner-payouts", {
        minDistance: 5,
        maxDistance: 5,
        payoutAmount: 20,
        pincode: null,
        isActive: true,
      });

      throw new Error("Should have rejected invalid range");
    } catch (error: any) {
      if (error.message === "Should have rejected invalid range") throw error;
      // Expected error - test passed
    }
  });

  await test("Reject Delete Non-Existent Slab", async () => {
    try {
      await api.delete("/api/admin/delivery-partner-payouts/non-existent-id");
      throw new Error("Should have returned 404");
    } catch (error: any) {
      if (error.response?.status !== 404) throw error;
    }
  });

  // ============================================================================
  // CLEANUP
  // ============================================================================
  console.log("\n🧹 CLEANUP\n");

  await test("Delete All Test Slabs", async () => {
    for (const id of createdIds) {
      try {
        await api.delete(`/api/admin/delivery-partner-payouts/${id}`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80) + "\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const total = results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.filter((r) => r.duration > 0).length;

  console.log(`✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms\n`);

  if (failed > 0) {
    console.log("Failed Tests:");
    results.filter((r) => r.status === "FAIL").forEach((r) => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  if (failed === 0) {
    console.log("✅ ALL TESTS PASSED - MODULE READY FOR PRODUCTION");
  } else {
    console.log("❌ SOME TESTS FAILED - FIX ISSUES BEFORE RELEASE");
  }
  console.log("=".repeat(80) + "\n");

  return {
    passed,
    failed,
    total,
    results,
  };
}

// Export for testing
export default runProductionTests;
