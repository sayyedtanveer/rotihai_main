#!/usr/bin/env tsx
/**
 * Test script to verify 8PM delivery slot creates order with correct deliveryDate
 */

import "dotenv/config";

const BASE_URL = "http://localhost:5000";

async function makeRequest(method: string, path: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function runTest() {
  console.log("🧪 Testing 8PM Delivery Slot Order Creation");
  console.log("=============================================\n");

  try {
    // Step 1: Get delivery slots
    console.log("1️⃣ Getting available delivery slots...");
    const slotsResponse = await makeRequest("GET", "/api/delivery-slots");
    if (slotsResponse.status !== 200) {
      console.error("❌ Failed to fetch delivery slots:", slotsResponse.data);
      return;
    }

    const slots = slotsResponse.data;
    const eightPmSlot = slots.find((s: any) => 
      s.label.toLowerCase().includes("8:00") || 
      s.label.toLowerCase().includes("8pm") ||
      s.startTime === "20:00"
    );

    if (!eightPmSlot) {
      console.log("⚠️  No 8PM slot found. Available slots:");
      slots.forEach((s: any) => console.log(`   - ${s.label} (${s.startTime})`));
      console.log("\n📝 Creating 8PM slot for testing...");
      
      // Create 8PM slot if it doesn't exist
      const createSlotResponse = await makeRequest("POST", "/api/admin/delivery-slots", {
        startTime: "20:00",
        endTime: "21:00",
        label: "Late Evening (8:00 PM - 9:00 PM)",
        capacity: 50,
        cutoffHoursBefore: 2,
      });

      if (createSlotResponse.status === 201) {
        console.log("✅ Created 8PM slot");
      }
    } else {
      console.log(`✅ Found 8PM slot: ${eightPmSlot.label}`);
    }

    // Step 2: Get the chef
    console.log("\n2️⃣ Getting available chef...");
    const chefResponse = await makeRequest("GET", "/api/chefs");
    if (chefResponse.status !== 200) {
      console.error("❌ Failed to fetch chefs:", chefResponse.data);
      return;
    }

    const chef = chefResponse.data[0];
    if (!chef) {
      console.error("❌ No chef found");
      return;
    }
    console.log(`✅ Using chef: ${chef.name}`);

    // Step 3: Get products
    console.log("\n3️⃣ Getting roti products...");
    const productsResponse = await makeRequest("GET", "/api/products");
    if (productsResponse.status !== 200) {
      console.error("❌ Failed to fetch products:", productsResponse.data);
      return;
    }

    const rotiProduct = productsResponse.data.find((p: any) => 
      p.categoryName?.toLowerCase() === 'roti' && p.chefId === chef.id
    );

    if (!rotiProduct) {
      console.error("❌ No roti product found for this chef");
      console.log("Products available:", productsResponse.data.map((p: any) => `${p.name} (${p.categoryName})`));
      return;
    }
    console.log(`✅ Using product: ${rotiProduct.name}`);

    // Step 4: Get 8PM slot ID
    const slotsResponse2 = await makeRequest("GET", "/api/delivery-slots");
    const slot8pm = slotsResponse2.data.find((s: any) => s.startTime === "20:00");
    
    if (!slot8pm) {
      console.error("❌ 8PM slot still not found");
      return;
    }
    console.log(`✅ 8PM slot ID: ${slot8pm.id}`);

    // Step 5: Create order with 8PM slot
    console.log("\n4️⃣ Creating order with 8PM delivery slot...");
    const orderPayload = {
      customerName: "Test Customer",
      phone: "+919876543210",
      email: "test@example.com",
      address: "Test Address",
      items: [
        {
          id: rotiProduct.id,
          name: rotiProduct.name,
          price: rotiProduct.price,
          quantity: 1,
        },
      ],
      subtotal: rotiProduct.price,
      deliveryFee: 0,
      total: rotiProduct.price,
      chefId: chef.id,
      categoryName: "roti",
      deliverySlotId: slot8pm.id,
      deliveryTime: "20:00", // 8:00 PM in 24-hour format
      paymentStatus: "pending",
    };

    console.log("📦 Order payload:", JSON.stringify(orderPayload, null, 2));

    const orderResponse = await makeRequest("POST", "/api/orders", orderPayload);
    if (orderResponse.status !== 200 && orderResponse.status !== 201) {
      console.error("❌ Failed to create order:", orderResponse.data);
      return;
    }

    const order = orderResponse.data.order;
    console.log(`✅ Order created: ${order.id}`);

    // Step 6: Verify deliveryDate
    console.log("\n5️⃣ Verifying delivery details...");
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Delivery Time: ${order.deliveryTime}`);
    console.log(`   Delivery Slot ID: ${order.deliverySlotId}`);
    console.log(`   Delivery Date: ${order.deliveryDate}`);

    // Check if deliveryDate is set correctly
    if (!order.deliveryDate) {
      console.error("❌ deliveryDate is NOT set on order!");
    } else if (order.deliveryDate === "1970-01-01") {
      console.error("❌ deliveryDate is the default date (1970-01-01)!");
    } else {
      console.log(`✅ ✅ ✅ deliveryDate is correctly set to: ${order.deliveryDate}`);
    }

    // Step 7: Fetch order and verify
    console.log("\n6️⃣ Fetching order from database to confirm...");
    const fetchResponse = await makeRequest("GET", `/api/orders/${order.id}`);
    if (fetchResponse.status === 200) {
      const fetchedOrder = fetchResponse.data;
      console.log(`   Fetched delivery date: ${fetchedOrder.deliveryDate}`);
      
      if (fetchedOrder.deliveryDate && fetchedOrder.deliveryDate !== "1970-01-01") {
        console.log("✅ Database has correct deliveryDate!");
      }
    }

    console.log("\n✅ Test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runTest();
