/**
 * Push Notification Utilities
 * Handles push notification sending to offline users
 * Non-breaking addition to existing notification system
 */

import { db } from "@shared/db";
import { pushSubscriptions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// ─── Lazy initialization state ────────────────────────────────────────────────
// These are populated the first time ensureInitialized() succeeds.
// Keeping them module-level means we only call setVapidDetails() once per
// server process (good for performance) while still reading from process.env
// at first-use time (not at import time), so a server that starts before
// secrets are injected will pick them up on the first real request.

let webpush: any = null;
let vapidConfigured = false;
let vapidPublicKey = "";
let _initAttempted = false;

/**
 * Initialize web-push exactly once.
 * Safe to call on every request — no-ops after first successful init.
 * Re-tries once per process if the previous attempt found missing keys.
 */
async function ensureInitialized(): Promise<void> {
  // Already successfully configured — nothing to do.
  if (vapidConfigured) return;

  // Load the web-push module if we haven't yet.
  if (!webpush) {
    try {
      const imported = await import("web-push");
      webpush = imported.default || imported;
      console.log("[PUSH] webpush module loaded successfully");
    } catch (err) {
      console.warn("[PUSH] web-push module failed to load — push notifications disabled.", err);
      return;
    }
  }

  // Read keys from process.env at call time (not at import time).
  const publicKey  = process.env.VAPID_PUBLIC_KEY  || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const email      = process.env.VAPID_EMAIL        || "admin@rotihai.com";

  console.log("[PUSH] Startup diagnostics:");
  console.log("  env file loaded         :", true);
  console.log("  VAPID_PUBLIC_KEY present :", !!publicKey,  `(length=${publicKey.length})`);
  console.log("  VAPID_PRIVATE_KEY present:", !!privateKey, `(length=${privateKey.length})`);
  console.log("  VAPID_EMAIL             :", email);

  if (!publicKey || !privateKey) {
    // Keys not yet available — log clearly and leave vapidConfigured = false.
    // Next request will re-attempt (server does not need to restart).
    console.warn("[PUSH] VAPID keys missing from process.env. Push notifications disabled until keys are set and server restarts (or until next request re-tries).");
    return;
  }

  try {
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    vapidPublicKey  = publicKey;
    vapidConfigured = true;
    console.log("[PUSH] web-push initialized successfully :", true);
  } catch (err: any) {
    console.error("[PUSH] webpush.setVapidDetails() threw — check key format:", err.message);
    console.log("[PUSH] web-push initialized successfully :", false);
    // Leave vapidConfigured = false so the route returns a clear error.
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get VAPID public key for client subscription.
 * Triggers lazy initialization on first call.
 */
export async function getVapidPublicKeyAsync(): Promise<string> {
  await ensureInitialized();
  return vapidPublicKey;
}

/**
 * Synchronous accessor — returns whatever was cached by the last
 * ensureInitialized() call.  Prefer getVapidPublicKeyAsync() in route handlers.
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

/**
 * Check if push is configured.
 * Triggers lazy initialization on first call.
 */
export async function isPushConfiguredAsync(): Promise<boolean> {
  await ensureInitialized();
  return vapidConfigured && !!webpush;
}

/** Synchronous version — reflects last initialized state. */
export function isPushConfigured(): boolean {
  return vapidConfigured && !!webpush;
}

// ─── Notification senders ─────────────────────────────────────────────────────

/**
 * Send push notification to a specific user.
 * Falls back gracefully if push not configured.
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
  await ensureInitialized();

  try {
    if (!vapidConfigured || !webpush) {
      console.log("[PUSH] Push notifications not configured, skipping send");
      return { success: false, reason: "VAPID keys not configured" };
    }

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
      console.log(`[PUSH] No active subscriptions for ${userType} ${userId}`);
      return { success: true, sentCount: 0, reason: "No subscriptions" };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as any;
        const payloadJson = JSON.stringify({
          title:     notification.title,
          body:      notification.body,
          icon:      notification.icon  || "/icon-192.png",
          badge:     notification.badge || "/icon-96x96.png",
          tag:       notification.tag   || "notification",
          data:      notification.data  || {},
          timestamp: new Date().toISOString(),
        });

        await Promise.race([
          webpush.sendNotification(subscription, payloadJson),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("sendNotification timed out after 10s")), 10_000)
          ),
        ]);
        sentCount++;
        console.log(`[PUSH] ✅ Sent to ${userType} ${userId}`);
      } catch (error: any) {
        failedCount++;
        if (error.statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
          console.log(`[PUSH] Removed expired subscription for ${userType} ${userId}`);
        } else {
          console.error(`[PUSH] Failed to send to ${userType} ${userId}:`, error.message);
        }
      }
    }

    return { success: sentCount > 0, sentCount, failedCount, totalSubscriptions: subscriptions.length };
  } catch (error: any) {
    console.error("[PUSH] Error in sendPushToUser:", error);
    return { success: false, sentCount: 0, reason: error.message };
  }
}

/**
 * Send push notification to all admins.
 */
export async function sendPushToAllAdmins(notification: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}) {
  await ensureInitialized();

  try {
    if (!vapidConfigured || !webpush) {
      return { success: false, sentCount: 0, reason: "VAPID keys not configured" };
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
          title:     notification.title,
          body:      notification.body,
          icon:      notification.icon  || "/icon-192.png",
          badge:     notification.badge || "/icon-96x96.png",
          tag:       notification.tag   || "notification",
          data:      notification.data  || {},
          timestamp: new Date().toISOString(),
        });

        await Promise.race([
          webpush.sendNotification(subscription, payloadJson),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("sendNotification timed out after 10s")), 10_000)
          ),
        ]);
        sentCount++;
      } catch (error: any) {
        if (error.statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.warn(`[PUSH] sendPushToAllAdmins send failed:`, error.message);
        }
      }
    }

    return { success: sentCount > 0, sentCount, totalSubscriptions: subscriptions.length };
  } catch (error: any) {
    console.error("[PUSH] Error in sendPushToAllAdmins:", error);
    return { success: false, sentCount: 0, reason: error.message };
  }
}
