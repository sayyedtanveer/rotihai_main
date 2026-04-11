import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyToken as verifyAdminToken } from "./adminAuth";
import { verifyToken as verifyDeliveryToken } from "./deliveryAuth";
import { verifyToken as verifyPartnerToken } from "./partnerAuth";
import type { Order } from "@shared/schema";
import { db, pendingBroadcasts } from "@shared/db";

// ✅ Standardized broadcast payload structure for all pending broadcasts
interface StandardizedBroadcastPayload {
  eventType: string;
  payload: {
    orderId?: string;
    order?: any;
    deliveryPersonName?: string;
    message?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  sourceAction?: string;
}

// ✅ Helper: Normalize any broadcast data to standard format
function normalizeBroadcastPayload(eventType: string, data: any): StandardizedBroadcastPayload {
  // Ensure payload always has a standard structure
  const normalized: StandardizedBroadcastPayload = {
    eventType,
    payload: {},
    timestamp: new Date().toISOString(),
  };

  if (!data) return normalized;

  // Extract orderId from various possible locations
  if (data.orderId) normalized.payload.orderId = data.orderId;
  else if (data.id && eventType.includes('order')) normalized.payload.orderId = data.id;
  else if (data.data?.orderId) normalized.payload.orderId = data.data.orderId;

  // Extract and normalize message fields
  if (data.message) normalized.payload.message = data.message;
  if (data.deliveryPersonName) normalized.payload.deliveryPersonName = data.deliveryPersonName;
  
  // If data has full order, include it
  if (data.order && typeof data.order === 'object') {
    normalized.payload.order = data.order;
  } else if (data.data && typeof data.data === 'object' && data.data.id && data.data.status) {
    // data.data looks like an order
    normalized.payload.order = data.data;
  }

  // Preserve any additional fields in metadata
  const standardFields = ['orderId', 'message', 'deliveryPersonName', 'order'];
  const extraFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!standardFields.includes(key) && key !== 'type') {
      extraFields[key] = value;
    }
  }
  if (Object.keys(extraFields).length > 0) {
    normalized.payload.metadata = extraFields;
  }

  return normalized;
}

async function savePendingBroadcast(recipientId: string, recipientType: "chef" | "delivery", eventType: string, data: any) {
  try {
    // Normalize the payload to standard format
    const normalizedPayload = normalizeBroadcastPayload(eventType, data);
    
    await db.insert(pendingBroadcasts).values({
      recipientId: String(recipientId),
      recipientType,
      eventType: normalizedPayload.eventType,
      payload: normalizedPayload // Save standardized payload
    });
  } catch (err) {
    console.error(`[PendingBroadcast Error] Failed to save for ${recipientType} ${recipientId}:`, err);
  }
}


interface ConnectedClient {
  ws: WebSocket;
  type: "admin" | "chef" | "delivery" | "customer" | "browser";
  id: string;
  chefId?: string;
  orderId?: string;
  userId?: string; // Added for customer identification in subscription updates
}

const clients: Map<string, ConnectedClient> = new Map();

// Track prepared orders awaiting delivery person acceptance
const preparedOrderTimeouts: Map<string, NodeJS.Timeout> = new Map();
const PREPARED_ORDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws"
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type") as "admin" | "chef" | "delivery" | "customer" | "browser";
    const orderId = url.searchParams.get("orderId");
    const userId = url.searchParams.get("userId"); // Added for customer identification

    if (!type) {
      ws.close(1008, "Missing client type");
      return;
    }

    let clientId: string;
    let chefId: string | undefined;
    let customerOrderId: string | undefined;
    let customerUserId: string | undefined; // Added for customer userId

    try {
      if (type === "browser") {
        // Browser connections don't need authentication - they receive broadcast updates
        clientId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } else if (type === "customer") {
        if (!orderId && !userId) { // Allow connection with userId only as well
          ws.close(1008, "Order ID or User ID required for customer connection");
          return;
        }
        clientId = `customer_${orderId || userId}_${Date.now()}`;
        customerOrderId = orderId || undefined;
        customerUserId = userId || undefined; // Assign userId
      } else if (type === "admin") {
        if (!token) {
          ws.close(1008, "Token required");
          return;
        }
        const payload = verifyAdminToken(token);
        if (!payload) {
          ws.close(1008, "Invalid admin token");
          return;
        }
        clientId = payload.adminId;
      } else if (type === "chef") {
        if (!token) {
          ws.close(1008, "Token required");
          return;
        }
        // Use the same verifyToken from partnerAuth to guarantee JWT_SECRET consistency
        const payload = verifyPartnerToken(token);
        if (!payload || !payload.chefId) {
          ws.close(1008, "Invalid chef token");
          return;
        }
        clientId = payload.partnerId;
        chefId = payload.chefId;
        console.log(`[WS-AUTH] Chef authenticated: partnerId=${payload.partnerId}, chefId=${payload.chefId}`);
      } else if (type === "delivery") {
        if (!token) {
          ws.close(1008, "Token required");
          return;
        }
        const payload = verifyDeliveryToken(token);
        if (!payload) {
          ws.close(1008, "Invalid delivery token");
          return;
        }
        clientId = payload.deliveryId;
      } else {
        ws.close(1008, "Invalid client type");
        return;
      }
    } catch (error) {
      console.error("WebSocket auth error:", error);
      ws.close(1008, "Authentication failed");
      return;
    }

    const client: ConnectedClient = { ws, type, id: clientId, chefId, orderId: customerOrderId, userId: customerUserId }; // Include userId
    clients.set(clientId, client);

    console.log(`WebSocket client connected: ${type} ${clientId}${chefId ? ` (chef: ${chefId})` : ""}${customerOrderId ? ` (order: ${customerOrderId})` : ""}${customerUserId ? ` (user: ${customerUserId})` : ""}`); // Log userId

    ws.on("close", () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${type} ${clientId}`);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: "connected", message: "WebSocket connection established" }));
  });

  return wss;
}

export function broadcastNewOrder(order: Order) {
  const message = JSON.stringify({
    type: "new_order",
    data: order
  });

  console.log(`\n📡 BROADCASTING NEW ORDER: ${order.id} to ${clients.size} clients`);
  let adminCount = 0;
  let chefNotified = false;

  clients.forEach((client, clientId) => {
    try {
      if (client.ws.readyState !== WebSocket.OPEN) return;
      if (client.type === "admin") {
        client.ws.send(message);
        adminCount++;
      } else if (client.type === "chef" && String(client.chefId) === String(order.chefId)) {
        client.ws.send(message);
        chefNotified = true;
        console.log(`  ✅ New order sent to chef ${clientId} (chefId: ${client.chefId})`);
      }
    } catch (err) {
      console.error(`  ❌ broadcastNewOrder send error to ${client.type} ${clientId}:`, err);
    }
  });

  console.log(`  Admins: ${adminCount} | Chef notified: ${chefNotified}`);
  if (!chefNotified && order.chefId) {
    console.warn(`  ⚠️ No chef WS connected for chefId=${order.chefId}`);
  }

  // Save pending broadcast for chef
  if (order.chefId) {
    savePendingBroadcast(order.chefId, "chef", "new_order", { data: order });
  }
}

// Broadcast subscription delivery to admins and assigned chef
export function broadcastSubscriptionDelivery(subscription: any) {
  const message = JSON.stringify({
    type: "subscription_delivery",
    data: subscription
  });

  clients.forEach((client) => {
    if (client.type === "admin") {
      client.ws.send(message);
    } else if (client.type === "chef" && subscription.chefId && String(client.chefId) === String(subscription.chefId)) {
      client.ws.send(message);
      console.log(`  ✅ Sent subscription delivery to chef ${client.id} (chefId: ${client.chefId})`);
    }
  });

  // Save pending broadcast for chef
  if (subscription.chefId) {
    savePendingBroadcast(subscription.chefId, "chef", "subscription_delivery", { data: subscription });
  }
}

// Broadcast subscription update (assignment, status changes, etc.)
export function broadcastSubscriptionUpdate(subscription: any) {
  // Safe serialize: ensure all date fields are strings
  const safeSubscription = { ...subscription };

  // Convert any Date objects to ISO strings
  const dateFields = ['startDate', 'endDate', 'nextDeliveryDate', 'lastDeliveryDate', 'chefAssignedAt', 'pauseStartDate', 'pauseResumeDate', 'createdAt', 'updatedAt'];
  for (const field of dateFields) {
    if (safeSubscription[field]) {
      if (safeSubscription[field] instanceof Date) {
        safeSubscription[field] = safeSubscription[field].toISOString();
      } else if (typeof safeSubscription[field] !== 'string') {
        safeSubscription[field] = String(safeSubscription[field]);
      }
    }
  }

  const message = JSON.stringify({
    type: "subscription_update",
    data: safeSubscription
  });

  console.log(`\n📡 ========== BROADCASTING SUBSCRIPTION UPDATE ==========`);
  console.log(`Subscription ID: ${safeSubscription.id}`);
  console.log(`Customer: ${safeSubscription.customerName}`);
  console.log(`Chef ID: ${safeSubscription.chefId || 'None'}`);
  console.log(`Status: ${safeSubscription.status}`);

  let adminNotified = 0;
  let chefNotified = false;
  let customerNotified = false;

  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${clientId}`);
    } else if (client.type === "chef" && safeSubscription.chefId && String(client.chefId) === String(safeSubscription.chefId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      chefNotified = true;
      console.log(`  ✅ Sent to partner ${clientId} (chefId: ${client.chefId})`);
    } else if (client.type === "customer" && client.userId === safeSubscription.userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      customerNotified = true;
      console.log(`  ✅ Sent to customer ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      // Also send to browser connections (unauthenticated customers)
      client.ws.send(message);
      console.log(`  ✅ Sent to browser ${clientId}`);
    }
  });

  console.log(`\n📊 Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Chef notified: ${chefNotified ? 'YES' : 'NO'}`);
  console.log(`  - Customer notified: ${customerNotified ? 'YES' : 'NO'}`);
  console.log(`================================================\n`);

  // Save pending broadcast for chef
  if (safeSubscription.chefId) {
    savePendingBroadcast(safeSubscription.chefId, "chef", "subscription_update", { data: safeSubscription });
  }
}

// Broadcast subscription delivery to available delivery personnel
export async function broadcastSubscriptionDeliveryToAvailableDelivery(deliveryLog: any) {
  console.log(`📣 Broadcasting subscription delivery ${deliveryLog.id} to all active delivery personnel`);

  const { storage } = await import("./storage");

  let deliveryPersonnelNotified = 0;
  const connectedDeliveryPersonIds = new Set<string>();

  // PHASE 1: Broadcast to all CONNECTED delivery personnel
  for (const [deliveryPersonId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery") {
      // Track ALL delivery clients to avoid duplicate pending broadcasts
      connectedDeliveryPersonIds.add(deliveryPersonId);
      
      // Only send real-time notification if WebSocket is OPEN
      if (client.ws.readyState === WebSocket.OPEN) {
        const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
        if (deliveryPerson && deliveryPerson.isActive) {
          const message = {
            type: "new_subscription_delivery",
            deliveryLog: deliveryLog,
            message: `🍽️ New subscription delivery ready for pickup!`
          };

          client.ws.send(JSON.stringify(message));
          console.log(`✅ Sent to delivery person: ${deliveryPersonId} (${deliveryPerson.name})`);
          deliveryPersonnelNotified++;
        }
      }
    }
  }

  // PHASE 2: Create pending broadcasts for OFFLINE delivery personnel (so they get notified when they come online)
  try {
    const activeDeliveryPersonnel = await storage.getAvailableDeliveryPersonnel();

    for (const deliveryPerson of activeDeliveryPersonnel) {
      // Only save pending broadcast if NOT already connected
      if (!connectedDeliveryPersonIds.has(deliveryPerson.id)) {
        console.log(`⏳ Saving pending broadcast for offline delivery person: ${deliveryPerson.id} (${deliveryPerson.name})`);
        savePendingBroadcast(deliveryPerson.id, "delivery", "new_subscription_delivery", {
          deliveryLog: deliveryLog,
          message: `🍽️ New subscription delivery ready for pickup!`
        });
      }
    }
  } catch (error) {
    console.error(`⚠️ Error saving pending broadcasts for offline delivery personnel:`, error);
    // Don't fail the broadcast if pending broadcasts fail
  }

  if (deliveryPersonnelNotified === 0) {
    console.log(`⚠️ WARNING: No available delivery personnel to notify for subscription delivery ${deliveryLog.id}`);
  } else {
    console.log(`✅ Notified ${deliveryPersonnelNotified} delivery personnel about subscription delivery ${deliveryLog.id}`);
  }
}

// Broadcast overdue chef notification to admins
export function broadcastOverdueChefNotification(overdueInfo: any) {
  const message = JSON.stringify({
    type: "overdue_chef_preparation",
    data: {
      subscriptionId: overdueInfo.subscription.id,
      customerName: overdueInfo.subscription.customerName,
      chefId: overdueInfo.chef?.id,
      chefName: overdueInfo.chef?.name,
      expectedPrepTime: overdueInfo.expectedPrepTime,
      deliveryTime: overdueInfo.deliveryTime,
      deliveryLogId: overdueInfo.log.id,
    },
    message: `⚠️ Chef ${overdueInfo.chef?.name || 'Unknown'} hasn't started preparing subscription for ${overdueInfo.subscription.customerName}. Expected by ${overdueInfo.expectedPrepTime}, delivery at ${overdueInfo.deliveryTime}.`,
    timestamp: new Date().toISOString(),
  });

  console.log(`\n⚠️ ========== BROADCASTING OVERDUE CHEF NOTIFICATION ==========`);
  console.log(`Subscription: ${overdueInfo.subscription.id}`);
  console.log(`Customer: ${overdueInfo.subscription.customerName}`);
  console.log(`Chef: ${overdueInfo.chef?.name || 'Unknown'}`);
  console.log(`Expected Prep Time: ${overdueInfo.expectedPrepTime}`);
  console.log(`Delivery Time: ${overdueInfo.deliveryTime}`);

  let adminNotified = 0;

  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${client.id}`);
    }
  });

  console.log(`\n📊 Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================\n`);
}

// Broadcast chef unavailable notification to admins (when chef closes with active subscriptions)
export function broadcastChefUnavailableNotification(data: { chef: any; subscriptionCount: number; subscriptions: any[] }) {
  const message = JSON.stringify({
    type: "chef_unavailable_with_subscriptions",
    data: {
      chefId: data.chef.id,
      chefName: data.chef.name,
      subscriptionCount: data.subscriptionCount,
      subscriptions: data.subscriptions.map(s => ({
        id: s.id,
        customerName: s.customerName,
        phone: s.phone,
        address: s.address,
        nextDeliveryDate: s.nextDeliveryDate,
        nextDeliveryTime: s.nextDeliveryTime,
      })),
    },
    message: `🔴 Chef ${data.chef.name} has marked themselves unavailable but has ${data.subscriptionCount} active subscription(s). Please reassign these subscriptions to another chef.`,
    timestamp: new Date().toISOString(),
  });

  console.log(`\n🔴 ========== BROADCASTING CHEF UNAVAILABLE NOTIFICATION ==========`);
  console.log(`Chef: ${data.chef.name} (${data.chef.id})`);
  console.log(`Active Subscriptions: ${data.subscriptionCount}`);
  console.log(`Subscriptions:`);
  data.subscriptions.forEach(s => {
    console.log(`  - ${s.customerName} (${s.id})`);
  });

  let adminNotified = 0;

  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${client.id}`);
    }
  });

  console.log(`\n📊 Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================\n`);
}


export function broadcastOrderUpdate(order: Order) {
  const message = JSON.stringify({
    type: "order_update",
    data: order
  });

  console.log(`\n📡 ========== BROADCASTING ORDER UPDATE ==========`);
  console.log(`Order ID: ${order.id}`);
  console.log(`Status: ${order.status}`);
  console.log(`Payment Status: ${order.paymentStatus}`);
  console.log(`Chef ID: ${order.chefId}`);
  console.log(`Assigned To: ${order.assignedTo || 'None'}`);
  console.log(`\n📋 Connected clients (${clients.size}):`);
  clients.forEach((client, clientId) => {
    console.log(`  - ${clientId}: type=${client.type}, chefId=${client.chefId || 'N/A'}`);
  });

  // Cancel timeout if order is no longer waiting for delivery assignment
  // Valid statuses for delivery assignment: "accepted_by_chef", "preparing", "prepared"
  const waitingForDelivery = ["accepted_by_chef", "preparing", "prepared"].includes(order.status);
  if (!waitingForDelivery || order.assignedTo) {
    cancelPreparedOrderTimeout(order.id);
  }

  let adminNotified = 0;
  let chefNotified = false;
  let deliveryNotified = false;
  let customerNotified = false;

  clients.forEach((client, clientId) => {
    try {
      if (client.type === "admin") {
        client.ws.send(message);
        adminNotified++;
        console.log(`  ✅ Sent to admin ${clientId}`);
      } else if (client.type === "chef" && String(client.chefId) === String(order.chefId)) {
        client.ws.send(message);
        chefNotified = true;
        console.log(`  ✅ Sent to chef ${clientId} (chefId: ${client.chefId})`);
      } else if (client.type === "delivery" && client.id === order.assignedTo) {
        client.ws.send(message);
        deliveryNotified = true;
        console.log(`  ✅ Sent to delivery ${clientId}`);
      } else if (client.type === "customer") {
        // Send to customer if connected by specific orderId OR by userId (to get all their order updates)
        if (client.orderId === order.id || client.userId === order.userId) {
          client.ws.send(message);
          customerNotified = true;
          console.log(`  ✅ Sent to customer ${clientId} (${client.orderId ? `order: ${client.orderId}` : `user: ${client.userId}`})`);
        }
      } else if (client.type === "chef" && String(client.chefId) !== String(order.chefId)) {
        console.log(`  ❌ Chef ${clientId} skipped - chefId mismatch (client: ${client.chefId}, order: ${order.chefId})`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to send to ${client.type} ${clientId}:`, error);
    }
  });

  console.log(`\n📊 Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Chef notified: ${chefNotified ? 'YES' : 'NO'}`);
  console.log(`  - Delivery notified: ${deliveryNotified ? 'YES' : 'NO'}`);
  console.log(`  - Customer notified: ${customerNotified ? 'YES' : 'NO'}`);

  if (!chefNotified && order.chefId) {
    console.log(`\n  ⚠️ WARNING: No chef WebSocket connected for chefId: ${order.chefId}`);
    console.log(`  📋 Currently connected clients:`, Array.from(clients.entries()).map(([id, c]) => ({
      id,
      type: c.type,
      chefId: c.chefId,
    })));
  }

  // Save pending broadcast for chef and delivery
  if (order.chefId) {
    savePendingBroadcast(order.chefId, "chef", "order_update", { data: order });
  }
  if (order.assignedTo) {
    savePendingBroadcast(order.assignedTo, "delivery", "order_update", { data: order });
  }

  console.log(`================================================\n`);
}

export function notifyDeliveryAssignment(order: Order, deliveryPersonId: string) {
  const client = clients.get(deliveryPersonId);
  if (client && client.type === "delivery") {
    try {
      const notificationType = order.status === "confirmed" ? "order_confirmed" : "order_assigned";
      client.ws.send(JSON.stringify({
        type: notificationType,
        data: order,
        message: order.status === "confirmed"
          ? `Order #${order.id.slice(0, 8)} has been confirmed and is ready for pickup`
          : `New order #${order.id.slice(0, 8)} has been assigned to you`
      }));
    } catch (error) {
      console.error(`  ❌ Failed to notify delivery assignment to ${deliveryPersonId}:`, error);
    }
  }

  const notificationType = order.status === "confirmed" ? "order_confirmed" : "order_assigned";
  savePendingBroadcast(deliveryPersonId, "delivery", notificationType, {
    data: order,
    message: order.status === "confirmed"
      ? `Order #${order.id.slice(0, 8)} has been confirmed and is ready for pickup`
      : `New order #${order.id.slice(0, 8)} has been assigned to you`
  });
}

export async function broadcastPreparedOrderToAvailableDelivery(order: any) {
  const notificationStage = order.status === "accepted_by_chef" ? "CHEF_ACCEPTED" :
    order.status === "prepared" ? "FOOD_READY" : "ORDER_UPDATE";

  console.log(`
📣 ========== BROADCAST TO AVAILABLE DELIVERY ==========`);
  console.log(`Order: ${order.id}`);
  console.log(`Status: ${order.status} (stage: ${notificationStage})`);
  console.log(`Assigned To: ${order.assignedTo || 'NONE - Broadcasting to all'}`);
  console.log(`\n📊 Total connected clients: ${clients.size}`);
  
  // List all connected delivery clients
  let deliveryClientCount = 0;
  const deliveryClientIds: string[] = [];
  clients.forEach((client, clientId) => {
    if (client.type === "delivery") {
      deliveryClientCount++;
      deliveryClientIds.push(clientId);
      console.log(`  - Delivery client: ${clientId} (WebSocket: ${client.ws.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'})`)
    }
  });
  console.log(`\n✓ Connected delivery clients: ${deliveryClientCount}`);
  
  if (deliveryClientCount === 0) {
    console.log(`⚠️ WARNING: No delivery clients connected! Skipping real-time broadcast.`);
  }

  // Import storage to check delivery personnel status
  const { storage } = await import("./storage");

  let deliveryPersonnelNotified = 0;
  const connectedDeliveryPersonIds = new Set<string>();
  const deliveryPersonsMap = new Map<string, any>();
  const failedFetches: string[] = [];

  // PHASE 1: Collect all connected delivery person IDs & batch fetch their details in parallel
  const connectedDeliveryIds: string[] = [];
  for (const [deliveryPersonId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery" && client.ws.readyState === WebSocket.OPEN) {
      connectedDeliveryPersonIds.add(deliveryPersonId);
      connectedDeliveryIds.push(deliveryPersonId);
    }
  }

  console.log(`\n🔍 PHASE 1: Fetching delivery personnel details...`);
  console.log(`Connected delivery IDs: ${connectedDeliveryIds.length > 0 ? connectedDeliveryIds.join(", ") : "NONE"}`);

  // ✅ CRITICAL FIX: Batch fetch all delivery personnel in parallel (not sequential)
  if (connectedDeliveryIds.length > 0) {
    try {
      const results = await Promise.all(
        connectedDeliveryIds.map(id =>
          storage.getDeliveryPersonnelById(id).catch(err => {
            console.error(`⚠️ Failed to fetch delivery person ${id}:`, err);
            failedFetches.push(id);
            return null;
          })
        )
      );

      results.forEach((person, index) => {
        const deliveryId = connectedDeliveryIds[index];
        if (person) {
          console.log(`  ✅ Fetched: ${deliveryId} → ${person.name} (isActive: ${person.isActive}, status: ${person.status})`);
          deliveryPersonsMap.set(deliveryId, person);
        } else {
          console.log(`  ❌ Failed to fetch: ${deliveryId}`);
        }
      });
    } catch (error) {
      console.error(`⚠️ Error fetching delivery personnel details:`, error);
    }
  }

  console.log(`\n📡 PHASE 2: Sending real-time notifications...`);
  
  // PHASE 2: Send real-time notifications using pre-fetched data (no more sequential awaits)
  for (const [deliveryPersonId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery" && client.ws.readyState === WebSocket.OPEN) {
      const deliveryPerson = deliveryPersonsMap.get(deliveryPersonId);
      
      if (!deliveryPerson) {
        console.log(`  ⏭️ ${deliveryPersonId}: No person data fetched`);
        continue;
      }
      
      if (!deliveryPerson.isActive) {
        console.log(`  ⏭️ ${deliveryPersonId} (${deliveryPerson.name}): Not active (isActive=${deliveryPerson.isActive})`);
        continue;
      }
      
      try {
        const message = {
          type: "new_prepared_order",
          order: order,
          notificationStage: notificationStage,
          message: notificationStage === "CHEF_ACCEPTED"
            ? `🔔 New order alert! Chef accepted order #${order.id.slice(0, 8)} - start preparing to head out`
            : `🍽️ Order #${order.id.slice(0, 8)} is ready for pickup!`
        };

        client.ws.send(JSON.stringify(message));
        console.log(`  ✅ Sent to: ${deliveryPersonId} (${deliveryPerson.name})`);
        deliveryPersonnelNotified++;
      } catch (err) {
        console.error(`  ❌ Send failed to ${deliveryPersonId} (${deliveryPerson.name}):`, err);
        // Continue to next delivery person - don't break the loop
      }
    }
  }

  console.log(`\n💾 PHASE 3: Saving pending broadcasts for offline personnel...`);
  // PHASE 3: Create pending broadcasts for OFFLINE delivery personnel (so they get notified when they come online)
  try {
    const activeDeliveryPersonnel = await storage.getAvailableDeliveryPersonnel();
    let pendingSaved = 0;
    
    console.log(`Total active delivery personnel in DB: ${activeDeliveryPersonnel.length}`);

    for (const deliveryPerson of activeDeliveryPersonnel) {
      // Only save pending broadcast if NOT already connected
      if (!connectedDeliveryPersonIds.has(deliveryPerson.id)) {
        console.log(`  ⏳ Saving pending for offline: ${deliveryPerson.id} (${deliveryPerson.name})`);
        savePendingBroadcast(deliveryPerson.id, "delivery", "new_prepared_order", {
          order: order,
          notificationStage: notificationStage,
          message: notificationStage === "CHEF_ACCEPTED"
            ? `🔔 New order alert! Chef accepted order #${order.id.slice(0, 8)} - start preparing to head out`
            : `🍽️ Order #${order.id.slice(0, 8)} is ready for pickup!`
        });
        pendingSaved++;
      }
    }
    console.log(`  ✅ Pending broadcasts saved: ${pendingSaved}`);
  } catch (error) {
    console.error(`⚠️ Error saving pending broadcasts for offline delivery personnel:`, error);
    // Don't fail the broadcast if pending broadcasts fail
  }

  // Clear any existing timeout for this order
  const existingTimeout = preparedOrderTimeouts.get(order.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set timeout to notify admin if no delivery person accepts within 5 minutes
  const timeout = setTimeout(async () => {
    console.log(`⏰ TIMEOUT: Order ${order.id} not accepted by any delivery person within 5 minutes`);
    await notifyAdminForManualAssignment(order.id);
    preparedOrderTimeouts.delete(order.id);
  }, PREPARED_ORDER_TIMEOUT_MS);

  preparedOrderTimeouts.set(order.id, timeout);

  console.log(`\n📊 BROADCAST SUMMARY`);
  console.log(`Real-time notified: ${deliveryPersonnelNotified}`);
  console.log(`Failed fetches: ${failedFetches.length > 0 ? failedFetches.join(", ") : "none"}`);
  
  if (deliveryPersonnelNotified === 0) {
    console.log(`⚠️ WARNING: No available delivery personnel to notify for order ${order.id}`);
    console.log(`⚠️ Notifying admin immediately for manual assignment`);
    // If no delivery personnel are available, notify admin immediately
    clearTimeout(timeout);
    preparedOrderTimeouts.delete(order.id);
    await notifyAdminForManualAssignment(order.id);
  } else {
    console.log(`✅ Successfully notified ${deliveryPersonnelNotified} delivery personnel`);
    console.log(`⏰ Timeout set: Admin will be notified in 5 minutes if no one accepts`);
  }
  
  console.log(`================================================\n`);
}

// Function to notify admin when manual assignment is needed
async function notifyAdminForManualAssignment(orderId: string) {
  // Import storage dynamically to avoid circular dependencies
  const { storage } = await import("./storage");

  // Re-fetch current order status to ensure we don't send stale notifications
  const currentOrder = await storage.getOrderById(orderId);

  if (!currentOrder) {
    console.log(`⚠️ Order ${orderId} not found when trying to send manual assignment notification`);
    return;
  }

  // Only notify if order is still waiting for delivery assignment and not yet assigned
  const waitingForDelivery = ["accepted_by_chef", "preparing", "prepared"].includes(currentOrder.status);
  if (!waitingForDelivery || currentOrder.assignedTo) {
    console.log(`✅ Order ${orderId} no longer needs manual assignment (status: ${currentOrder.status}, assigned: ${!!currentOrder.assignedTo})`);
    return;
  }

  const message = JSON.stringify({
    type: "manual_assignment_required",
    data: currentOrder,
    message: `Order #${currentOrder.id.slice(0, 8)} needs manual assignment - no delivery person accepted within timeout`,
    timestamp: new Date().toISOString()
  });

  let adminNotified = false;
  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified = true;
      console.log(`✅ Sent manual assignment notification to admin`);
    }
  });

  if (!adminNotified) {
    console.log(`⚠️ WARNING: No admin WebSocket connected to receive manual assignment notification for order ${currentOrder.id}`);
  }
}

// Function to cancel timeout when delivery person accepts order
export function cancelPreparedOrderTimeout(orderId: string) {
  const timeout = preparedOrderTimeouts.get(orderId);
  if (timeout) {
    clearTimeout(timeout);
    preparedOrderTimeouts.delete(orderId);
    console.log(`✅ Cancelled prepared order timeout for ${orderId} - delivery person accepted`);
  }
}

// Broadcast chef status updates to all connected clients
export function broadcastChefStatusUpdate(chef: any) {
  const message = JSON.stringify({
    type: "chef_status_update",
    data: chef
  });

  console.log(`\n📡 ========== BROADCASTING CHEF STATUS UPDATE ==========`);
  console.log(`Chef ID: ${chef.id}`);
  console.log(`Chef Name: ${chef.name}`);
  console.log(`Status: ${chef.isActive ? "ACTIVE" : "INACTIVE"}`);

  let adminNotified = 0;
  let customerNotified = 0;
  let browserNotified = 0;
  let partnerNotified = false;

  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${clientId}`);
    } else if (client.type === "customer" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      customerNotified++;
      console.log(`  ✅ Sent to customer ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      browserNotified++;
      console.log(`  ✅ Sent to browser ${clientId}`);
    } else if (client.type === "chef" && String(client.chefId) === String(chef.id) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified = true;
      console.log(`  ✅ Sent to partner ${clientId}`);
    }
  });

  console.log(`\n📊 Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Customers notified: ${customerNotified}`);
  console.log(`  - Browsers notified: ${browserNotified}`);
  console.log(`  - Partner notified: ${partnerNotified ? 'YES' : 'NO'}`);
  console.log(`================================================\n`);
}

// Broadcast product availability updates to all connected clients
export function broadcastProductAvailabilityUpdate(product: any) {
  const message = JSON.stringify({
    type: "product_availability_update",
    data: {
      id: product.id,
      name: product.name,
      isAvailable: product.isAvailable,
      stock: product.stockQuantity
    }
  });

  console.log(`\n📡 ========== BROADCASTING PRODUCT AVAILABILITY UPDATE ==========`);
  console.log(`Product ID: ${product.id}`);
  console.log(`Product Name: ${product.name}`);
  console.log(`Available: ${product.isAvailable ? "YES" : "NO"}`);
  console.log(`Stock: ${product.stockQuantity}`);

  let adminNotified = 0;
  let browserNotified = 0;
  let partnerNotified = 0;

  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      browserNotified++;
      console.log(`  ✅ Sent to browser ${clientId}`);
    } else if (client.type === "chef" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified++;
      console.log(`  ✅ Sent to partner ${clientId}`);
    }
  });

  console.log(`\n📊 Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Browsers notified: ${browserNotified}`);
  console.log(`  - Partners notified: ${partnerNotified}`);
  console.log(`================================================\n`);
}

// Broadcast new subscription created notification to admins
export function broadcastNewSubscriptionToAdmin(subscription: any, planName?: string) {
  const message = JSON.stringify({
    type: "new_subscription_created",
    data: {
      subscriptionId: subscription.id,
      customerName: subscription.customerName,
      phone: subscription.phone,
      email: subscription.email,
      address: subscription.address,
      planId: subscription.planId,
      planName: planName || "Unknown Plan",
      status: subscription.status,
      startDate: subscription.startDate,
      finalAmount: subscription.finalAmount,
      isPaid: subscription.isPaid,
    },
    message: `New subscription from ${subscription.customerName} (${subscription.phone})`,
    timestamp: new Date().toISOString(),
  });

  console.log(`\n📣 ========== BROADCASTING NEW SUBSCRIPTION TO ADMINS ==========`);
  console.log(`Subscription ID: ${subscription.id}`);
  console.log(`Customer: ${subscription.customerName}`);
  console.log(`Phone: ${subscription.phone}`);
  console.log(`Plan: ${planName || subscription.planId}`);

  let adminNotified = 0;

  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  ✅ Sent to admin ${clientId}`);
    }
  });

  console.log(`\n📊 Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================\n`);
}

// Broadcast subscription assignment notification to the assigned partner/chef
export function broadcastSubscriptionAssignmentToPartner(subscription: any, chefName?: string, planName?: string) {
  if (!subscription.chefId) {
    console.log(`⚠️ No chef assigned to subscription ${subscription.id}, skipping partner notification`);
    return;
  }

  const message = JSON.stringify({
    type: "subscription_assigned",
    data: {
      subscriptionId: subscription.id,
      customerName: subscription.customerName,
      phone: subscription.phone,
      address: subscription.address,
      planId: subscription.planId,
      planName: planName || "Unknown Plan",
      status: subscription.status,
      nextDeliveryDate: subscription.nextDeliveryDate,
      nextDeliveryTime: subscription.nextDeliveryTime,
      chefId: subscription.chefId,
    },
    message: `New subscription assigned: ${subscription.customerName} - ${planName || "Subscription"}`,
    timestamp: new Date().toISOString(),
  });

  console.log(`\n📣 ========== BROADCASTING SUBSCRIPTION ASSIGNMENT TO PARTNER ==========`);
  console.log(`Subscription ID: ${subscription.id}`);
  console.log(`Customer: ${subscription.customerName}`);
  console.log(`Assigned Chef: ${chefName || subscription.chefId}`);
  console.log(`Plan: ${planName || subscription.planId}`);

  let partnerNotified = false;

  clients.forEach((client, clientId) => {
    if (client.type === "chef" && String(client.chefId) === String(subscription.chefId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified = true;
      console.log(`  ✅ Sent to partner ${clientId} (chefId: ${client.chefId})`);
    }
  });

  if (!partnerNotified) {
    console.log(`  ⚠️ WARNING: No partner WebSocket connected for chefId: ${subscription.chefId}`);
  }

  console.log(`\n📊 Notification Summary:`);
  console.log(`  - Partner notified: ${partnerNotified ? 'YES' : 'NO'}`);
  console.log(`================================================\n`);
}

// 💳 Broadcast wallet balance update to customer
export function broadcastWalletUpdate(userId: string, newBalance: number) {
  const message = JSON.stringify({
    type: "wallet_updated",
    data: {
      userId,
      newBalance,
      timestamp: new Date().toISOString(),
    },
    message: `Wallet updated: ₹${newBalance}`,
  });

  console.log(`\n💳 [BROADCAST] Wallet update for user: ${userId}, Balance: ₹${newBalance}`);
  console.log(`💳 [BROADCAST] Total connected clients: ${clients.size}`);

  let sentCount = 0;
  let skippedCount = 0;

  // Send to all connected customers with this userId
  clients.forEach((client, clientId) => {
    const typeMatch = client.type === "customer" || client.type === "browser";
    const userIdMatch = client.userId === userId;
    const wsOpen = client.ws.readyState === WebSocket.OPEN;

    console.log(`💳 [BROADCAST] Client ${clientId}: type=${client.type} (match=${typeMatch}), userId=${client.userId} (match=${userIdMatch}), wsOpen=${wsOpen}`);

    if (typeMatch && userIdMatch && wsOpen) {
      client.ws.send(message);
      sentCount++;
      console.log(`✅ [BROADCAST] Sent wallet update to client ${clientId}`);
    } else {
      skippedCount++;
      if (!typeMatch) console.log(`   ⏭️ Skipped: type mismatch (${client.type})`);
      if (!userIdMatch) console.log(`   ⏭️ Skipped: userId mismatch (${client.userId} !== ${userId})`);
      if (!wsOpen) console.log(`   ⏭️ Skipped: WebSocket not open`);
    }
  });

  console.log(`💳 [BROADCAST] Summary: Sent=${sentCount}, Skipped=${skippedCount}\n`);
}

// ✅ Helper: Safely send WebSocket message with error handling
function safeSend(client: ConnectedClient, message: string | object, context: string = ""): boolean {
  if (!client || !client.ws || client.ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  try {
    const msgStr = typeof message === "string" ? message : JSON.stringify(message);
    client.ws.send(msgStr);
    return true;
  } catch (err) {
    console.error(`❌ [safeSend] ${context} - Failed to send to ${client.type} ${client.id}:`, err);
    return false;
  }
}

// ✅ NEW: Broadcast order claimed event to all OTHER delivery boys (including offline via pending broadcasts)
export async function broadcastOrderClaimed(orderId: string, claimedByDeliveryPersonId: string, deliveryPersonName: string) {
  const message = JSON.stringify({
    type: "order_claimed",
    orderId: orderId,
    claimedBy: claimedByDeliveryPersonId,
    deliveryPersonName: deliveryPersonName,
    message: `Order #${orderId.slice(0, 8)} was just claimed by ${deliveryPersonName}`
  });

  const { storage } = await import("./storage");

  console.log(`📢 [ORDER CLAIMED] Broadcasting to all delivery boys except ${claimedByDeliveryPersonId}`);
  let sentCount = 0;
  let failedCount = 0;
  const connectedDeliveryPersonIds = new Set<string>();

  // PHASE 1: Send to all CONNECTED delivery personnel (except the claimer)
  for (const [clientId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery" && clientId !== claimedByDeliveryPersonId) {
      connectedDeliveryPersonIds.add(clientId);
      if (safeSend(client, message, `[ORDER_CLAIMED] to ${clientId}`)) {
        sentCount++;
        console.log(`✅ Sent order_claimed notification to delivery person: ${clientId}`);
      } else {
        failedCount++;
      }
    }
  }

  // PHASE 2: Save pending broadcast for OFFLINE delivery personnel (except the claimer)
  try {
    const activeDeliveryPersonnel = await storage.getAvailableDeliveryPersonnel();

    for (const deliveryPerson of activeDeliveryPersonnel) {
      // Only save pending broadcast if NOT connected and NOT the claimer
      if (!connectedDeliveryPersonIds.has(deliveryPerson.id) && deliveryPerson.id !== claimedByDeliveryPersonId) {
        console.log(`⏳ Saving pending order_claimed broadcast for offline delivery person: ${deliveryPerson.id} (${deliveryPerson.name})`);
        savePendingBroadcast(deliveryPerson.id, "delivery", "order_claimed", {
          orderId: orderId,
          claimedBy: claimedByDeliveryPersonId,
          deliveryPersonName: deliveryPersonName,
          message: `Order #${orderId.slice(0, 8)} was just claimed by ${deliveryPersonName}`
        });
      }
    }
  } catch (error) {
    console.error(`⚠️ Error saving pending order_claimed broadcasts:`, error);
  }

  console.log(`📢 [ORDER CLAIMED] Summary: Sent=${sentCount}, Failed=${failedCount}`);
}

// Broadcast order cancellation to a specific delivery person (real-time if connected, pending otherwise)
export async function broadcastOrderCancelledToDelivery(deliveryPersonId: string, orderId: string, reason?: string) {
  const message = {
    type: "order_cancelled",
    orderId,
    reason: reason || "Order cancelled",
    message: `Order #${orderId.slice(0,8)} has been cancelled`
  };

  console.log(`📡 [ORDER CANCELLED] Notifying delivery person ${deliveryPersonId} about cancellation of ${orderId}`);

  const client = clients.get(deliveryPersonId);
  if (client && client.type === "delivery" && client.ws.readyState === WebSocket.OPEN) {
    if (safeSend(client, message, `[ORDER_CANCELLED] to ${deliveryPersonId}`)) {
      console.log(`✅ Sent cancellation to connected delivery person ${deliveryPersonId}`);
      return;
    }
  }

  // Fallback: save pending broadcast for delivery person
  try {
    console.log(`⏳ Saving pending order_cancelled broadcast for offline delivery person: ${deliveryPersonId}`);
    await savePendingBroadcast(deliveryPersonId, "delivery", "order_cancelled", message);
  } catch (error) {
    console.error(`⚠️ Error saving pending order_cancelled broadcast for ${deliveryPersonId}:`, error);
  }
}

