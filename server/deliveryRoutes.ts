import type { Express } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateDeliveryToken, generateRefreshToken, verifyToken, requireDeliveryAuth, type AuthenticatedDeliveryRequest } from "./deliveryAuth";
import { deliveryPersonnelLoginSchema, insertDeliveryPersonnelSchema } from "@shared/schema";
import { broadcastOrderUpdate, notifyDeliveryAssignment, cancelPreparedOrderTimeout } from "./websocket";
import { sendDeliveryCompletedNotification } from "./whatsappService";
import { db, orders } from "@shared/db";
import { eq } from "drizzle-orm";

export function registerDeliveryRoutes(app: Express) {
  // DEBUG: Check delivery person status
  app.get("/api/delivery/debug/status", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      
      if (!deliveryPerson) {
        return res.status(404).json({ message: "Delivery person not found" });
      }

      // Get all orders
      const allOrders = await storage.getAllOrders();
      const claimableOrders = allOrders.filter(order => {
        const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
        return validStatuses.includes(order.status) && !order.assignedTo;
      });

      res.json({
        deliveryPerson: {
          id: deliveryPerson.id,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          isActive: deliveryPerson.isActive,
          status: deliveryPerson.status,
        },
        ordersStatus: {
          totalOrders: allOrders.length,
          claimableOrders: claimableOrders.length,
          claimableOrderStatuses: claimableOrders.map(o => ({
            id: o.id.slice(0, 8),
            status: o.status,
            assignedTo: o.assignedTo || "unassigned",
          })),
        },
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Debug failed" });
    }
  });
  app.post("/api/delivery/login", async (req, res) => {
    try {
      const result = deliveryPersonnelLoginSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid credentials", errors: result.error });
        return;
      }

      const { phone, password } = result.data;
      const deliveryPerson = await storage.getDeliveryPersonnelByPhone(phone);

      if (!deliveryPerson || !deliveryPerson.isActive) {
        res.status(401).json({ message: "Invalid phone or password" });
        return;
      }

      const isValid = await verifyPassword(password, deliveryPerson.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Invalid phone or password" });
        return;
      }

      await storage.updateDeliveryPersonnelLastLogin(deliveryPerson.id);

      const token = generateDeliveryToken(deliveryPerson);
      const { passwordHash, ...deliveryData } = deliveryPerson;

      res.json({
        token,
        deliveryPerson: deliveryData,
      });
    } catch (error) {
      console.error("Delivery login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/delivery/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token provided" });
        return;
      }

      const payload = verifyToken(refreshToken);
      if (!payload) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      const deliveryPerson = await storage.getDeliveryPersonnelById(payload.deliveryId);
      if (!deliveryPerson) {
        res.status(404).json({ message: "Delivery person not found" });
        return;
      }

      const newAccessToken = generateDeliveryToken(deliveryPerson);
      const newRefreshToken = generateRefreshToken(deliveryPerson);

      res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Delivery token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });

  app.get("/api/delivery/profile", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPerson = await storage.getDeliveryPersonnelById(req.delivery!.deliveryId);
      if (!deliveryPerson) {
        res.status(404).json({ message: "Delivery person not found" });
        return;
      }

      const { passwordHash, ...deliveryData } = deliveryPerson;
      res.json(deliveryData);
    } catch (error) {
      console.error("Error fetching delivery profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/delivery/orders", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const orders = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get available orders that can be claimed
  app.get("/api/delivery/available-orders", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      
      // Check if delivery person is active
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      console.log(`📦 Delivery person ${deliveryPersonId}:`, {
        isActive: deliveryPerson?.isActive,
        name: deliveryPerson?.name,
        status: deliveryPerson?.status
      });
      
      if (!deliveryPerson) {
        console.log(`❌ Delivery person ${deliveryPersonId} not found`);
        res.json([]);
        return;
      }

      if (!deliveryPerson.isActive) {
        console.log(`❌ Delivery person ${deliveryPersonId} is not active (isActive: false)`);
        res.json([]);
        return;
      }

      // Get all orders that are waiting for delivery assignment
      const allOrders = await storage.getAllOrders();
      console.log(`📋 Total orders in system: ${allOrders.length}`);
      
      const availableOrders = allOrders.filter(order => {
        const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
        const isValid = validStatuses.includes(order.status) && !order.assignedTo;
        if (isValid) {
          console.log(`  ✅ Order ${order.id}: status=${order.status}, assignedTo=${order.assignedTo || "none"}`);
        }
        return isValid;
      });

      console.log(`✅ Available orders for delivery: ${availableOrders.length}`);
      res.json(availableOrders);
    } catch (error) {
      console.error("Error fetching available orders:", error);
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  // Claim an available order (auto-assignment) - claiming means auto-accepting
  app.post("/api/delivery/orders/:id/claim", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
  try {
    const orderId = req.params.id;
    const deliveryPersonId = req.delivery!.deliveryId;

    console.log(`\n📦 CLAIM REQUEST - Delivery person ${deliveryPersonId} attempting to claim order ${orderId}`);

    const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
    console.log(`  📋 Delivery person found: ${deliveryPerson ? 'YES' : 'NO'}`);
    if (deliveryPerson) {
      console.log(`     - Name: ${deliveryPerson.name}`);
      console.log(`     - isActive: ${deliveryPerson.isActive}`);
      console.log(`     - status: ${deliveryPerson.status}`);
    }
    if (!deliveryPerson || !deliveryPerson.isActive) {
      console.log(`  ❌ BLOCKED: Delivery person not found or inactive`);
      return res.status(403).json({ message: "You are not active to claim orders" });
    }

    const order = await storage.getOrderById(orderId);
    console.log(`  📋 Order found: ${order ? 'YES' : 'NO'}`);
    if (order) {
      console.log(`     - Full order object keys: ${Object.keys(order).join(', ')}`);
      console.log(`     - Status field: '${order.status}' (type: ${typeof order.status})`);
      console.log(`     - Status === 'prepared'? ${order.status === 'prepared'}`);
      console.log(`     - Status === 'preparing'? ${order.status === 'preparing'}`);
      console.log(`     - Status === 'confirmed'? ${order.status === 'confirmed'}`);
      console.log(`     - Status === 'accepted_by_chef'? ${order.status === 'accepted_by_chef'}`);
      console.log(`     - Assigned to: ${order.assignedTo || 'UNASSIGNED'}`);
    }
    if (!order) {
      console.log(`  ❌ BLOCKED: Order not found`);
      return res.status(404).json({ message: "Order not found" });
    }

    // Valid claim statuses — IMPORTANT: DO NOT change status here
    // "confirmed" = admin just confirmed payment, waiting for chef or delivery
    // "accepted_by_chef" = chef accepted
    // "preparing" = chef is preparing
    // "prepared" = chef marked ready for delivery
    const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
    console.log(`  ✅ Status check: "${order.status}" in [${validStatuses.join(', ')}]? ${validStatuses.includes(order.status) ? 'YES' : 'NO'}`);
    if (!validStatuses.includes(order.status)) {
      console.log(`  ❌ BLOCKED: Order status not claimable`);
      return res.status(400).json({ message: "Order is not available for delivery assignment" });
    }

    if (order.assignedTo) {
      console.log(`  ❌ BLOCKED: Order already assigned to ${order.assignedTo}`);
      return res.status(400).json({ message: "Order already claimed by another delivery person" });
    }

    // Assignment only — NO STATUS UPDATE
    const assignedOrder = await storage.assignOrderToDeliveryPerson(orderId, deliveryPersonId);

    if (!assignedOrder) {
      console.log(`  ❌ BLOCKED: Failed to assign order in database`);
      return res.status(500).json({ message: "Failed to claim order" });
    }

    console.log(`  ✅ SUCCESS: Order ${orderId} assigned to delivery person ${deliveryPerson.name}`);

    // Do NOT update order.status → keeps “preparing”
    console.log(`🟢 Order ${orderId} assigned to delivery person. Chef must mark prepared manually.`);

    // Cancel auto-timeout
    cancelPreparedOrderTimeout(orderId);

    broadcastOrderUpdate(assignedOrder);

    return res.json({
      ...assignedOrder,
      assignmentMessage: "Order assigned. Chef will mark it prepared manually."
    });

  } catch (error) {
    console.error("Error claiming order:", error);
    res.status(500).json({ message: "Failed to claim order" });
  }
});


  app.post("/api/delivery/orders/:id/accept", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery!.deliveryId;

      console.log(`📦 Delivery person ${deliveryPersonId} accepting order ${orderId}`);

      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.assignedTo !== deliveryPersonId) {
        res.status(403).json({ message: "Order not assigned to you" });
        return;
      }

      // If already accepted by this delivery person, return success (idempotent)
      if (order.status === "accepted_by_delivery") {
        console.log(`✅ Order ${orderId} already accepted`);
        res.json(order);
        return;
      }

      // Allow acceptance from any status where delivery is assigned but not yet out for delivery
      const validStatuses = ["prepared", "accepted_by_chef", "preparing"];
      if (!validStatuses.includes(order.status)) {
        res.status(400).json({ message: "Order cannot be accepted in current status" });
        return;
      }

      // Ensure delivery person details are set (in case they weren't during assignment)
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (deliveryPerson && (!order.deliveryPersonName || !order.deliveryPersonPhone)) {
        await db.update(orders)
          .set({
            deliveryPersonName: deliveryPerson.name,
            deliveryPersonPhone: deliveryPerson.phone
          })
          .where(eq(orders.id, orderId));
      }

      // Change status to accepted_by_delivery when delivery person accepts
      const updatedOrder = await storage.updateOrderStatus(orderId, "accepted_by_delivery");
      
      if (updatedOrder) {
        // Cancel the timeout since delivery person accepted the order
        cancelPreparedOrderTimeout(orderId);
        console.log(`✅ Order ${orderId} accepted by ${deliveryPerson?.name || 'delivery person'}`);
        broadcastOrderUpdate(updatedOrder);
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "Failed to accept order" });
    }
  });

  app.post("/api/delivery/orders/:id/pickup", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery!.deliveryId;

      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.assignedTo !== deliveryPersonId) {
        res.status(403).json({ message: "Order not assigned to you" });
        return;
      }

      // Allow pickup from any status where delivery has accepted or is preparing
      const validStatuses = ["accepted_by_delivery", "prepared", "accepted_by_chef", "preparing"];
      if (!validStatuses.includes(order.status)) {
        res.status(400).json({ message: "Order must be accepted before pickup" });
        return;
      }

      // Change status to out_for_delivery and record pickup time
      const updatedOrder = await storage.updateOrderPickup(orderId);
      
      if (updatedOrder) {
        broadcastOrderUpdate(updatedOrder);
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error marking pickup:", error);
      res.status(500).json({ message: "Failed to mark pickup" });
    }
  });

  app.post("/api/delivery/orders/:id/deliver", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery!.deliveryId;

      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.assignedTo !== deliveryPersonId) {
        res.status(403).json({ message: "Order not assigned to you" });
        return;
      }

      const updatedOrder = await storage.updateOrderDelivery(orderId);
      
      if (updatedOrder) {
        broadcastOrderUpdate(updatedOrder);
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error marking delivery:", error);
      res.status(500).json({ message: "Failed to mark delivery" });
    }
  });

  app.patch("/api/delivery/status", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const { status, currentLocation } = req.body;

      const updatedPerson = await storage.updateDeliveryPersonnel(deliveryPersonId, {
        status,
        currentLocation,
      });

      if (!updatedPerson) {
        res.status(404).json({ message: "Delivery person not found" });
        return;
      }

      const { passwordHash, ...deliveryData } = updatedPerson;
      res.json(deliveryData);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Get earnings report
  app.get("/api/delivery/earnings", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const orders = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      
      // Calculate delivery fees (assuming delivery fee goes to delivery person)
      const completedOrders = orders.filter(o => o.status === "delivered");
      const totalEarnings = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const todayOrders = completedOrders.filter(o => new Date(o.deliveredAt!) >= startOfToday);
      const weekOrders = completedOrders.filter(o => new Date(o.deliveredAt!) >= startOfThisWeek);
      const monthOrders = completedOrders.filter(o => new Date(o.deliveredAt!) >= startOfThisMonth);
      
      const todayEarnings = todayOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const weekEarnings = weekOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const monthEarnings = monthOrders.reduce((sum, order) => sum + order.deliveryFee, 0);

      res.json({
        totalEarnings,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalDeliveries: completedOrders.length,
        todayDeliveries: todayOrders.length,
        weekDeliveries: weekOrders.length,
        monthDeliveries: monthOrders.length,
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Get delivery statistics
  app.get("/api/delivery/stats", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      const orders = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      
      const pendingOrders = orders.filter(o => o.assignedTo && !["accepted_by_delivery", "out_for_delivery", "delivered", "completed", "cancelled"].includes(o.status));
      const activeOrders = orders.filter(o => ["accepted_by_delivery", "out_for_delivery"].includes(o.status));
      const completedOrders = orders.filter(o => o.status === "delivered");

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayCompletedOrders = completedOrders.filter(o => 
        new Date(o.deliveredAt!) >= startOfToday
      );

      res.json({
        pendingCount: pendingOrders.length,
        activeCount: activeOrders.length,
        completedToday: todayCompletedOrders.length,
        totalCompleted: completedOrders.length,
        rating: deliveryPerson?.rating || "5.0",
        status: deliveryPerson?.status || "offline",
      });
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get subscription deliveries for today assigned to this delivery person
  app.get("/api/delivery/subscription-deliveries", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const today = new Date();
      
      // Get all subscription delivery logs for today
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      
      // Filter logs assigned to this delivery person
      const myDeliveries = todayLogs.filter(log => log.deliveryPersonId === deliveryPersonId);
      
      // Enrich with subscription and customer details
      const enrichedDeliveries = await Promise.all(
        myDeliveries.map(async (log) => {
          const subscription = await storage.getSubscription(log.subscriptionId);
          const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : null;
          
          return {
            ...log,
            subscription: subscription ? {
              id: subscription.id,
              customerName: subscription.customerName,
              phone: subscription.phone,
              address: subscription.address,
              planName: plan?.name || "Unknown Plan",
            } : null,
          };
        })
      );
      
      res.json(enrichedDeliveries);
    } catch (error) {
      console.error("Error fetching subscription deliveries:", error);
      res.status(500).json({ message: "Failed to fetch subscription deliveries" });
    }
  });

  // Get available subscription deliveries that can be claimed
  app.get("/api/delivery/available-subscription-deliveries", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      
      // Check if delivery person is active
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (!deliveryPerson || !deliveryPerson.isActive) {
        res.json([]);
        return;
      }

      const today = new Date();
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      
      // Filter unassigned deliveries that are scheduled or preparing
      const availableDeliveries = todayLogs.filter(log => 
        !log.deliveryPersonId && 
        (log.status === "scheduled" || log.status === "preparing")
      );
      
      // Enrich with subscription details
      const enrichedDeliveries = await Promise.all(
        availableDeliveries.map(async (log) => {
          const subscription = await storage.getSubscription(log.subscriptionId);
          const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : null;
          
          return {
            ...log,
            subscription: subscription ? {
              id: subscription.id,
              customerName: subscription.customerName,
              phone: subscription.phone,
              address: subscription.address,
              planName: plan?.name || "Unknown Plan",
            } : null,
          };
        })
      );
      
      res.json(enrichedDeliveries);
    } catch (error) {
      console.error("Error fetching available subscription deliveries:", error);
      res.status(500).json({ message: "Failed to fetch available subscription deliveries" });
    }
  });

  // Claim a subscription delivery
  app.post("/api/delivery/subscription-deliveries/:id/claim", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const logId = req.params.id;
      
      const log = await storage.getSubscriptionDeliveryLog(logId);
      if (!log) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      
      if (log.deliveryPersonId) {
        res.status(400).json({ message: "This delivery is already claimed" });
        return;
      }
      
      const updated = await storage.updateSubscriptionDeliveryLog(logId, {
        deliveryPersonId: deliveryPersonId,
        status: "preparing",
      });
      
      console.log(`📦 Delivery person ${deliveryPersonId} claimed subscription delivery ${logId}`);
      res.json(updated);
    } catch (error) {
      console.error("Error claiming subscription delivery:", error);
      res.status(500).json({ message: "Failed to claim subscription delivery" });
    }
  });

  // Update subscription delivery status
  app.patch("/api/delivery/subscription-deliveries/:id/status", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const logId = req.params.id;
      const { status, notes } = req.body;
      
      const log = await storage.getSubscriptionDeliveryLog(logId);
      if (!log) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      
      // Verify this delivery is assigned to this person
      if (log.deliveryPersonId !== deliveryPersonId) {
        res.status(403).json({ message: "This delivery is not assigned to you" });
        return;
      }
      
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        "scheduled": ["preparing"],
        "preparing": ["out_for_delivery"],
        "out_for_delivery": ["delivered", "missed"],
      };
      
      if (!validTransitions[log.status]?.includes(status)) {
        res.status(400).json({ message: `Invalid status transition from ${log.status} to ${status}` });
        return;
      }
      
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      
      const updated = await storage.updateSubscriptionDeliveryLog(logId, updateData);
      
      // If delivered, update the subscription
      if (status === "delivered") {
        const subscription = await storage.getSubscription(log.subscriptionId);
        if (subscription) {
          await storage.updateSubscription(log.subscriptionId, {
            lastDeliveryDate: log.date,
            remainingDeliveries: Math.max(0, subscription.remainingDeliveries - 1),
          });
        }
      }
      
      console.log(`🚚 Delivery person ${deliveryPersonId} updated subscription delivery ${logId} to ${status}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription delivery status:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });

  // Get subscription delivery statistics for delivery person
  app.get("/api/delivery/subscription-stats", requireDeliveryAuth(), async (req: AuthenticatedDeliveryRequest, res) => {
    try {
      const deliveryPersonId = req.delivery!.deliveryId;
      const today = new Date();
      
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const myLogs = todayLogs.filter(log => log.deliveryPersonId === deliveryPersonId);
      
      const pending = myLogs.filter(log => ["scheduled", "preparing"].includes(log.status)).length;
      const outForDelivery = myLogs.filter(log => log.status === "out_for_delivery").length;
      const delivered = myLogs.filter(log => log.status === "delivered").length;
      const missed = myLogs.filter(log => log.status === "missed").length;
      
      res.json({
        pending,
        outForDelivery,
        delivered,
        missed,
        total: myLogs.length,
      });
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription statistics" });
    }
  });
}
