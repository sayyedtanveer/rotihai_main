/**
 * Push Notification Utilities
 * Handles push notification sending to offline users
 * Non-breaking addition to existing notification system
 */

import { db } from "@shared/db";
import { pushSubscriptions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Dynamically import web-push (optional dependency)
let webpush: any = null;
try {
  webpush = require("web-push");
} catch (error) {
  console.warn("⚠️ web-push module not installed. Push notifications disabled.");
}

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "admin@rotihai.com";

if (webpush && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log("✅ Web Push configured with VAPID keys");
} else if (!webpush) {
  console.warn("⚠️ web-push package not installed. Install with: npm install web-push");
} else {
  console.warn("⚠️ VAPID keys not configured in environment variables.");
}

/**
 * Send push notification to specific user
 * Falls back gracefully if push not configured
 */
export async function sendPushToUser(
  userId: string,
  userType: "admin" | "chef" | "delivery" | "customer",
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, any>;
  }
) {
  try {
    if (!webpush || !vapidPublicKey || !vapidPrivateKey) {
      console.log("⚠️ Push notifications not configured, skipping send");
      return { success: false, reason: "VAPID keys not configured" };
    }

    // Get all active subscriptions for this user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.userType, userType),
          eq(pushSubscriptions.isActive, true)
        )
      );

    if (subscriptions.length === 0) {
      console.log(`ℹ️ No push subscriptions found for ${userType} ${userId}`);
      return { success: true, sentCount: 0, reason: "No subscriptions" };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send to each subscription endpoint
    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as any;
        const payloadJson = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || "/icon-192.png",
          badge: notification.badge || "/icon-96x96.png",
          tag: notification.tag || "notification",
          data: notification.data || {},
          timestamp: new Date().toISOString(),
        });

        await webpush.sendNotification(subscription, payloadJson);
        sentCount++;
        console.log(`✅ Push sent to ${userType} ${userId}`);
      } catch (error: any) {
        failedCount++;
        
        // If subscription is invalid (410 Gone), mark it inactive
        if (error.statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
          console.log(`🗑️ Removed invalid subscription for ${userType} ${userId}`);
        } else {
          console.error(
            `⚠️ Failed to send push to ${userType} ${userId}:`,
            error.message
          );
        }
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      totalSubscriptions: subscriptions.length,
    };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return { success: false, reason: error.message };
  }
}

/**
 * Send push to all admins
 */
export async function sendPushToAllAdmins(notification: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}) {
  try {
    if (!webpush || !vapidPublicKey || !vapidPrivateKey) {
      return { success: false, reason: "VAPID keys not configured" };
    }

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userType, "admin"),
          eq(pushSubscriptions.isActive, true)
        )
      );

    if (subscriptions.length === 0) {
      return { success: true, sentCount: 0, reason: "No admin subscriptions" };
    }

    let sentCount = 0;

    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as any;
        const payloadJson = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || "/icon-192.png",
          badge: notification.badge || "/icon-96x96.png",
          tag: notification.tag || "notification",
          data: notification.data || {},
          timestamp: new Date().toISOString(),
        });

        await webpush.sendNotification(subscription, payloadJson);
        sentCount++;
      } catch (error: any) {
        if (error.statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return { success: sentCount > 0, sentCount, totalSubscriptions: subscriptions.length };
  } catch (error: any) {
    console.error("Error sending push to admins:", error);
    return { success: false, reason: error.message };
  }
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

/**
 * Check if push is configured
 */
export function isPushConfigured(): boolean {
  return !!(webpush && vapidPublicKey && vapidPrivateKey);
}
