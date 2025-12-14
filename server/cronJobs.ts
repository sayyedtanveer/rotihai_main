import { db } from "../shared/db";
import { subscriptions, orders, chefs, adminUsers } from "../shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { sendScheduledOrder2HourReminder } from "./whatsappService";

let isRunning = false;

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

      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const deliveryDays = plan.deliveryDays as string[];
      
      if (!deliveryDays.includes(dayOfWeek)) {
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
      let nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 1);

      for (let i = 0; i < 7; i++) {
        const dayOfWeek = nextDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (deliveryDays.includes(dayOfWeek)) {
          break;
        }
        nextDate.setDate(nextDate.getDate() + 1);
      }

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
        const admins = await db.query.adminUsers.findMany({
          where: (a) => a.id,
        });

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

export async function runScheduledTasks(): Promise<void> {
  if (isRunning) return;
  
  isRunning = true;
  try {
    await autoResumeSubscriptions();
    await generateDailyDeliveryLogs();
    await updateNextDeliveryDates();
    await sendScheduledOrder2HourNotifications();
  } finally {
    isRunning = false;
  }
}

export function startCronJobs(): void {
  console.log("🕐 Starting scheduled jobs...");
  
  runScheduledTasks();
  
  setInterval(() => {
    runScheduledTasks();
  }, 5 * 60 * 1000);

  console.log("✅ Scheduled jobs started (runs every 5 minutes)");
}
