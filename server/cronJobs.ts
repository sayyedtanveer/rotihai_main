import { db } from "../shared/db";
import { subscriptions, orders, chefs, adminUsers, users as usersTable } from "../shared/schema";
import { eq, and, gte, isNull } from "drizzle-orm";
import { storage } from "./storage";
import { sendScheduledOrder2HourReminder, sendMissedDeliveryNotification } from "./whatsappService";
import { sendMissedDeliveryEmail } from "./emailService";
import { gpayVerificationService } from "./services/gpayVerificationService";

let isRunning = false;

// ✅ Google Pay Payment Verification Polling
/**
 * Polls UPI provider to verify pending Google Pay payments
 * Runs every 60 seconds to detect payments from users
 * Success path: Auto-confirms order, creates user account, sends SMS
 */
export async function verifyPendingGPayPayments(): Promise<void> {
  try {
    console.log("[GPAY-POLLING] Starting Google Pay payment verification...");

    // Find pending Google Pay orders from last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const pendingOrders = await db.query.orders.findMany({
      where: (o, { and, eq, gte, isNull, lte, lt }) => and(
        eq(o.paymentStatus, "pending"),
        eq(o.paymentSource, "google-pay"),
        gte(o.createdAt, fifteenMinutesAgo),
        isNull(o.paymentVerifiedBy)
      ),
    });

    console.log(`[GPAY-POLLING] Found ${pendingOrders.length} pending Google Pay order(s)`);

    let verifiedCount = 0;
    let failedCount = 0;

    for (const order of pendingOrders) {
      try {
        // Check if should retry verification
        if (!gpayVerificationService.shouldRetryVerification(order)) {
          console.log(`[GPAY-POLLING] ⏭️ Skipping Order#${order.id} - max verification attempts reached`);
          continue;
        }

        // Verify payment with user matching
        const result = await gpayVerificationService.verifyPaymentForUser(
          order.id,
          order.expectedPayerPhone || order.phone,
          order.total
        );

        if (result.verified) {
          console.log(`✅ [GPAY-POLLING] Payment verified for Order#${order.id}`);
          
          // Update order as paid/confirmed
          await db.update(orders)
            .set({
              paymentStatus: "confirmed",
              paymentVerifiedBy: "gpay-polling",
              gpayTransactionId: result.transactionId,
              phoneMatch: true,
              amountMatch: true,
              referenceMatch: true,
            })
            .where(eq(orders.id, order.id));

          // Auto-create account if user doesn't exist
          try {
            const existingUser = await db.query.users.findFirst({
              where: (u, { eq }) => eq(u.phone, order.phone),
            });

            if (!existingUser) {
              console.log(`[GPAY-POLLING] 👤 Creating account for new user: ${order.phone}`);
              
              // Generate temporary password
              const tempPassword = Math.random().toString(36).slice(-8);
              const hashedPassword = await require("bcrypt").hash(tempPassword, 10);

              const newUser = await db.insert(usersTable).values({
                phone: order.phone,
                name: order.customerName || "User",
                email: order.email || null,
                passwordHash: hashedPassword,
              }).returning();

              console.log(`[GPAY-POLLING] ✅ Account created: ${newUser[0]?.id}`);

              // Send SMS with login details (optional)
              // Send email with order confirmation
            }

            // Broadcast order to chef (WebSocket)
            try {
              const wsModule = await import("./websocket");
              if (wsModule && typeof wsModule === 'object' && 'broadcast' in wsModule) {
                (wsModule as any).broadcast("order-confirmed", { orderId: order.id, order });
              }
              console.log(`[GPAY-POLLING] 📢 Order broadcast to chef: ${order.id}`);
            } catch (wsErr) {
              console.log(`[GPAY-POLLING] Note: WebSocket broadcast not available`);
            }
            
            verifiedCount++;
          } catch (error) {
            console.error(`[GPAY-POLLING] Error post-verification for Order#${order.id}:`, error);
            failedCount++;
          }
        } else {
          console.log(`[GPAY-POLLING] ❌ Verification failed: ${result.reason}`);
          
          // Update verification attempt counter
          await db.update(orders)
            .set({
              verificationAttempts: (order.verificationAttempts || 0) + 1,
            })
            .where(eq(orders.id, order.id));

          failedCount++;
        }
      } catch (error) {
        console.error(`[GPAY-POLLING] Error processing Order#${order.id}:`, error);
        failedCount++;
      }
    }

    if (verifiedCount > 0 || failedCount > 0) {
      console.log(`[GPAY-POLLING] ✅ Verified: ${verifiedCount}, Failed/Pending: ${failedCount}`);
    }
  } catch (error) {
    console.error("[GPAY-POLLING] Error:", error);
  }
}

// ✅ Helper function: Check if a date is a scheduled delivery day based on plan frequency
function isDeliveryDay(date: Date, frequency: string, deliveryDays: string[]): boolean {
  if (!deliveryDays || deliveryDays.length === 0) return false;

  if (frequency === "monthly") {
    // For monthly: deliveryDays contains day numbers like ["1", "15"]
    const dayOfMonth = date.getDate().toString();
    return deliveryDays.includes(dayOfMonth);
  } else if (frequency === "weekly" || frequency === "daily") {
    // For weekly/daily: deliveryDays contains weekday names like ["monday", "tuesday", ...]
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return deliveryDays.includes(dayName);
  }

  return false;
}

// ✅ Helper function: Get next delivery date based on plan frequency
function getNextDeliveryDate(fromDate: Date, frequency: string, deliveryDays: string[]): Date {
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + 1);

  let attempts = 0;
  const maxAttempts = frequency === "monthly" ? 31 : 7;

  while (attempts < maxAttempts) {
    if (isDeliveryDay(nextDate, frequency, deliveryDays)) {
      return nextDate;
    }
    nextDate.setDate(nextDate.getDate() + 1);
    attempts++;
  }

  // Fallback: return next date if no delivery day found
  return nextDate;
}

export async function autoResumeSubscriptions(): Promise<void> {
  try {
    const now = new Date();
    
    const pausedSubscriptions = await db.query.subscriptions.findMany({
      where: (s, { and, eq, lte, isNotNull }) => and(
        eq(s.status, "paused"),
        isNotNull(s.pauseResumeDate),
        lte(s.pauseResumeDate, now)
      ),
    });

    for (const subscription of pausedSubscriptions) {
      await db.update(subscriptions)
        .set({
          status: "active",
          pauseStartDate: null,
          pauseResumeDate: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log(`▶️ Auto-resumed subscription ${subscription.id} (scheduled for ${subscription.pauseResumeDate})`);

      // ✅ Broadcast auto-resume notification to chef and admin
      try {
        const { broadcastSubscriptionUpdate } = await import("./websocket");
        const updated = await storage.getSubscription(subscription.id);
        if (updated) {
          broadcastSubscriptionUpdate(updated);
        }
      } catch (err) {
        console.log(`Note: WebSocket broadcast attempted for auto-resume of subscription ${subscription.id}`);
      }
    }

    if (pausedSubscriptions.length > 0) {
      console.log(`✅ Auto-resumed ${pausedSubscriptions.length} subscription(s)`);
    }
  } catch (error) {
    console.error("Error in autoResumeSubscriptions:", error);
  }
}

export async function generateDailyDeliveryLogs(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allSubscriptions = await db.query.subscriptions.findMany({
      where: (s, { and, eq }) => and(
        eq(s.status, "active"),
        eq(s.isPaid, true)
      ),
    });

    let logsCreated = 0;

    for (const subscription of allSubscriptions) {
      const nextDeliveryDate = new Date(subscription.nextDeliveryDate);
      nextDeliveryDate.setHours(0, 0, 0, 0);
      
      if (nextDeliveryDate.getTime() !== today.getTime()) {
        continue;
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) continue;

      // ✅ Dynamic check based on plan frequency (weekly/daily vs monthly)
      const deliveryDays = plan.deliveryDays as string[];
      if (!isDeliveryDay(today, plan.frequency, deliveryDays)) {
        continue;
      }

      const existingLog = await storage.getDeliveryLogBySubscriptionAndDate(subscription.id, today);
      if (existingLog) {
        continue;
      }

      await storage.createSubscriptionDeliveryLog({
        subscriptionId: subscription.id,
        date: today,
        time: subscription.nextDeliveryTime || "09:00",
        status: "scheduled",
        deliveryPersonId: null,
        notes: null,
      });

      logsCreated++;
    }

    if (logsCreated > 0) {
      console.log(`📋 Generated ${logsCreated} delivery log(s) for today`);
    }
  } catch (error) {
    console.error("Error in generateDailyDeliveryLogs:", error);
  }
}

export async function updateNextDeliveryDates(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptionsToUpdate = await db.query.subscriptions.findMany({
      where: (s, { and, eq, lte }) => and(
        eq(s.status, "active"),
        eq(s.isPaid, true),
        lte(s.nextDeliveryDate, today)
      ),
    });

    for (const subscription of subscriptionsToUpdate) {
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) continue;

      const deliveryDays = plan.deliveryDays as string[];
      // ✅ Dynamic helper: works for weekly/daily (weekday names) and monthly (day numbers)
      const nextDate = getNextDeliveryDate(today, plan.frequency, deliveryDays);

      await db.update(subscriptions)
        .set({
          nextDeliveryDate: nextDate,
          lastDeliveryDate: today,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));
    }

    if (subscriptionsToUpdate.length > 0) {
      console.log(`📅 Updated next delivery date for ${subscriptionsToUpdate.length} subscription(s)`);
    }
  } catch (error) {
    console.error("Error in updateNextDeliveryDates:", error);
  }
}

export async function sendScheduledOrder2HourNotifications(): Promise<void> {
  try {
    const now = new Date();
    
    // Find all scheduled orders (with deliveryTime and deliveryDate) that are 2 hours away
    const allScheduledOrders = await db.query.orders.findMany({
      where: (o, { and, eq, isNotNull }) => and(
        eq(o.status, "approved"),
        isNotNull(o.deliveryTime),
        isNotNull(o.deliveryDate)
      ),
    });

    let notificationsSent = 0;

    for (const order of allScheduledOrders) {
      if (!order.deliveryTime || !order.deliveryDate) continue;

      // Parse delivery time and date
      const [delHours, delMins] = order.deliveryTime.split(":").map(Number);
      const deliveryDateTime = new Date(order.deliveryDate);
      deliveryDateTime.setHours(delHours, delMins, 0, 0);

      // Calculate time difference
      const timeUntilDelivery = deliveryDateTime.getTime() - now.getTime();
      const hoursUntilDelivery = timeUntilDelivery / (1000 * 60 * 60);

      // Check if delivery is in approximately 2 hours (within 1 hour 50 min to 2 hours 10 min window)
      if (hoursUntilDelivery > 1.83 && hoursUntilDelivery <= 2.17) {
        const items = Array.isArray(order.items) 
          ? order.items.map((item: any) => item.name || item.title || "Item").join(", ")
          : "Order items";

        // Send notification to chef
        if (order.chefId) {
          const chef = await db.query.chefs.findFirst({
            where: eq(chefs.id, order.chefId),
          });

          if (chef && chef.phone) {
            const success = await sendScheduledOrder2HourReminder(
              chef.name,
              chef.phone,
              order.id,
              order.deliveryTime,
              order.deliveryDate,
              order.customerName,
              items.split(", ")
            );
            if (success) notificationsSent++;
          }
        }

        // Send notification to all active admins
        const admins = await db.query.adminUsers.findMany();

        for (const admin of admins) {
          if (admin.phone) {
            const success = await sendScheduledOrder2HourReminder(
              admin.username,
              admin.phone,
              order.id,
              order.deliveryTime,
              order.deliveryDate,
              order.customerName,
              items.split(", ")
            );
            if (success) notificationsSent++;
          }
        }
      }
    }

    if (notificationsSent > 0) {
      console.log(`📱 Sent ${notificationsSent} 2-hour reminder notification(s)`);
    }
  } catch (error) {
    console.error("Error in sendScheduledOrder2HourNotifications:", error);
  }
}

/**
 * PHASE 2: Automatic Missed Delivery Detection - Safety Net
 * Runs daily and marks deliveries as MISSED if:
 * - status = SCHEDULED
 * - deliveryDate = today
 * - Current time is after 6 PM (delivery cutoff)
 * 
 * PHASE 4: Extended with notification system
 * - Sends WhatsApp notification to user
 * - Sends email notification to user
 * 
 * This ensures no delivery silently remains "scheduled" indefinitely
 */
export async function markStaleDeliveriesAsMissed(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delivery cutoff time: 6 PM (18:00)
    const DELIVERY_CUTOFF_HOUR = 18;
    const cutoffTime = new Date();
    cutoffTime.setHours(DELIVERY_CUTOFF_HOUR, 0, 0, 0);

    // Only run this after the cutoff time has passed
    if (now < cutoffTime) {
      console.log(`[MISSED-DELIVERY-CHECK] Cutoff time not reached yet (${now.toLocaleTimeString()}, cutoff is ${cutoffTime.toLocaleTimeString()})`);
      return;
    }

    console.log(`[MISSED-DELIVERY-CHECK] Running stale delivery detection at ${now.toLocaleTimeString()}`);

    // Find all scheduled deliveries for today
    const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
    const scheduledLogs = todaysLogs.filter(log => log.status === "scheduled");

    if (scheduledLogs.length === 0) {
      console.log(`[MISSED-DELIVERY-CHECK] No stale deliveries found for today`);
      return;
    }

    console.log(`[MISSED-DELIVERY-CHECK] Found ${scheduledLogs.length} scheduled deliveries past cutoff time`);

    let markedCount = 0;
    let notifiedCount = 0;

    for (const log of scheduledLogs) {
      try {
        // Update delivery log status to MISSED
        await storage.updateSubscriptionDeliveryLog(log.id, {
          status: "missed",
          notes: "Auto-marked as missed (past delivery cutoff time)",
          updatedAt: new Date(),
        });

        // Sync to deliveryHistory
        await storage.syncDeliveryHistory(
          log.subscriptionId,
          "missed",
          log.date,
          "Auto-marked as missed (past delivery cutoff time)"
        );

        markedCount++;
        console.log(`  ✅ Marked delivery log ${log.id} (subscription ${log.subscriptionId}) as MISSED`);

        // Get user info for notification
        try {
          const subscription = await db.query.subscriptions.findFirst({
            where: (s, { eq }) => eq(s.id, log.subscriptionId),
          });

          if (subscription) {
            const user = await db.query.users.findFirst({
              where: (u, { eq }) => eq(u.id, subscription.userId),
            });

            if (user) {
              const deliveryDate = log.date.toLocaleDateString("en-IN");
              const deliveryTime = log.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

              // Send WhatsApp notification
              await sendMissedDeliveryNotification(
                user.id,
                user.phone,
                deliveryDate,
                deliveryTime,
                log.subscriptionId
              );

              // Send email notification if available
              if (user.email) {
                await sendMissedDeliveryEmail(
                  user.email,
                  user.name || "Valued Customer",
                  deliveryDate,
                  deliveryTime,
                  log.subscriptionId
                );
              }

              notifiedCount++;
              console.log(`  📧 Sent notifications for subscription ${log.subscriptionId}`);
            }
          }
        } catch (notifyError) {
          console.warn(`  ⚠️ Failed to send notifications for delivery ${log.id}:`, notifyError);
          // Don't fail the whole operation if notification fails
        }
      } catch (error) {
        console.error(`  ❌ Error marking delivery ${log.id} as missed:`, error);
      }
    }

    if (markedCount > 0) {
      console.log(`✅ [MISSED-DELIVERY-CHECK] Auto-marked ${markedCount} stale deliveries as MISSED, notified ${notifiedCount} users`);
    }
  } catch (error) {
    console.error("Error in markStaleDeliveriesAsMissed:", error);
  }
}

// ✅ Expire pending payment orders using expiresAt timestamp (reliable, clock-independent)
/**
 * Marks orders as expired when expiresAt <= NOW()
 * Uses persistent timestamp column for reliability
 * This prevents stale pending orders and frees up inventory
 */
export async function expirePendingPaymentOrders(): Promise<void> {
  try {
    const now = new Date();

    console.log(`[EXPIRY-CHECK] Checking for pending payment orders with expiresAt <= ${now.toISOString()}...`);

    // Find all pending payment orders that have passed their expiry deadline
    // Using persistent expiresAt column instead of calculated time
    const expiredOrders = await db.query.orders.findMany({
      where: (o, { and, eq, lt, isNull }) => and(
        eq(o.paymentStatus, "pending"),
        lt(o.expiresAt, now), // ✅ Using expiresAt column (not createdAt calculation)
        isNull(o.paymentVerifiedBy) // Not yet confirmed
      ),
    });

    if (expiredOrders.length === 0) {
      console.log(`[EXPIRY-CHECK] No expired pending payment orders found`);
      return;
    }

    console.log(`[EXPIRY-CHECK] Found ${expiredOrders.length} expired pending payment order(s)`);

    let expiredCount = 0;
    for (const order of expiredOrders) {
      try {
        // Mark order as expired using storage interface (accepts any status string)
        await storage.updateOrderStatus(order.id, "expired");

        console.log(`[EXPIRY-CHECK] ⏱️ Order ${order.id} marked as EXPIRED (expiresAt: ${order.expiresAt})`);
        expiredCount++;

        // Optionally: Send notification to user about expired order
        // They can submit a new order if needed
      } catch (error) {
        console.error(`[EXPIRY-CHECK] Error expiring order ${order.id}:`, error);
      }
    }

    if (expiredCount > 0) {
      console.log(`✅ [EXPIRY-CHECK] Marked ${expiredCount} order(s) as expired`);
    }
  } catch (error) {
    console.error("[EXPIRY-CHECK] Error in expirePendingPaymentOrders:", error);
  }
}

export async function runScheduledTasks(): Promise<void> {
  if (isRunning) return;
  
  isRunning = true;
  try {
    // Payment verification (runs every 60 seconds)
    await verifyPendingGPayPayments();
    
    // Order expiry check (runs every task cycle, expires after 25 mins)
    await expirePendingPaymentOrders();
    
    // Subscription tasks (run every 5 minutes)
    await autoResumeSubscriptions();
    await generateDailyDeliveryLogs();
    await updateNextDeliveryDates();
    await markStaleDeliveriesAsMissed();
    await sendScheduledOrder2HourNotifications();
  } finally {
    isRunning = false;
  }
}

export function startCronJobs(): void {
  console.log("🕐 Starting scheduled jobs...");
  
  // Run all tasks initially
  runScheduledTasks();
  
  // Run payment verification frequently (every 60 seconds)
  let paymentPollingInterval = setInterval(async () => {
    try {
      await verifyPendingGPayPayments();
    } catch (error) {
      console.error("[GPAY-POLLING] Interval error:", error);
    }
  }, 60 * 1000); // 60 seconds
  
  // Run subscription tasks every 5 minutes
  let subscriptionInterval = setInterval(() => {
    try {
      // Skip payment polling for this interval, run only subscription tasks
      (async () => {
        if (isRunning) return;
        isRunning = true;
        try {
          await autoResumeSubscriptions();
          await generateDailyDeliveryLogs();
          await updateNextDeliveryDates();
          await markStaleDeliveriesAsMissed();
          await sendScheduledOrder2HourNotifications();
        } finally {
          isRunning = false;
        }
      })();
    } catch (error) {
      console.error("[CRON] Error in subscription tasks:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log("✅ Payment polling started (every 60 seconds)");
  console.log("✅ Subscription tasks started (every 5 minutes)");
  
  // Cleanup on process exit
  process.on('exit', () => {
    clearInterval(paymentPollingInterval);
    clearInterval(subscriptionInterval);
  });
}
