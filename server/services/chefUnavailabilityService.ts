import { db } from "../../shared/db";
import {
  chefs,
  chefUnavailability,
  subscriptions,
  subscriptionDeliveryLogs,
  subscriptionPlans,
  adminUsers,
} from "../../shared/schema";
import { eq, and, ne, isNull, isNotNull, or, sql, inArray } from "drizzle-orm";
import { sendWhatsAppMessage } from "../whatsappService";

/**
 * Represents a single pending action item for the admin Unavailability Actions tab.
 * Derived at query time from subscription_delivery_logs joined with subscriptions and chefs.
 * No separate work-queue table — resolution state is carried by chefOverrideId and skipReason.
 */
export interface PendingActionItem {
  deliveryLogId: string;
  subscriptionId: string;
  deliveryDate: Date;
  originalChefId: string;
  originalChefName: string;
  customerName: string;
  planName: string;
  chefOverrideId: string | null;
  skipReason: string | null;
}

/**
 * Chef subset used by getAvailableChefs — only the fields needed for the reassign modal.
 */
export interface AvailableChef {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  subscriptionAvailabilityStatus: string;
}

// Keep backward-compat alias
export type Chef = AvailableChef;

/**
 * ChefUnavailabilityService
 *
 * Handles all business logic for the Chef Unavailability Management feature:
 * - Chef marks themselves unavailable (today or leave period)
 * - Counting affected scheduled deliveries
 * - Admin-facing pending action list and counts
 * - Admin reassignment and platform-skip of individual deliveries
 * - Subscription extension on platform skip
 */
export class ChefUnavailabilityService {
  // ─── 1. markUnavailableToday ────────────────────────────────────────────────

  /**
   * Marks a chef as unavailable today (immediate path).
   * 1. Updates chefs.subscriptionAvailabilityStatus = 'unavailable_today'
   * 2. Inserts chef_unavailability audit row (unavailabilityType='unavailable_today',
   *    leaveStartDate=today, leaveEndDate=today) — no status field
   * 3. Counts affected scheduled delivery logs for today
   * Returns: { unavailabilityId, affectedCount }
   */
  async markUnavailableToday(
    chefId: string
  ): Promise<{ unavailabilityId: string; affectedCount: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // 1. Update chef availability status
    await db
      .update(chefs)
      .set({ subscriptionAvailabilityStatus: "unavailable_today" })
      .where(eq(chefs.id, chefId));

    // 2. Insert audit row (no status field — chef_unavailability is immutable history)
    const [inserted] = await db
      .insert(chefUnavailability)
      .values({
        chefId,
        unavailabilityType: "unavailable_today",
        leaveStartDate: todayStr,
        leaveEndDate: todayStr,
      })
      .returning();

    const unavailabilityId = inserted.id;

    // 3. Count affected deliveries for today
    const affectedCount = await this.countAffectedDeliveries(chefId, today, today);

    return { unavailabilityId, affectedCount };
  }

  // ─── 2. setOnLeave ──────────────────────────────────────────────────────────

  /**
   * Sets a future or same-day leave period.
   * 1. Validates leaveStartDate <= leaveEndDate
   * 2. Updates chefs row with leave dates immediately
   * 3. Inserts chef_unavailability audit row immediately (no status, no pending/active logic)
   * 4. Counts affected deliveries today only (0 if future leave)
   * Returns: { unavailabilityId, affectedCount }
   */
  async setOnLeave(
    chefId: string,
    leaveStartDate: Date,
    leaveEndDate: Date
  ): Promise<{ unavailabilityId: string; affectedCount: number }> {
    // 1. Validate date range
    if (leaveStartDate > leaveEndDate) {
      throw { status: 400, message: "leaveEndDate must be on or after leaveStartDate" };
    }

    const leaveStartStr = leaveStartDate.toISOString().split("T")[0];
    const leaveEndStr = leaveEndDate.toISOString().split("T")[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Update chefs row immediately (dates stored right away — no cron/activation)
    await db
      .update(chefs)
      .set({
        subscriptionAvailabilityStatus: "on_leave",
        leaveStartDate: leaveStartStr,
        leaveEndDate: leaveEndStr,
      })
      .where(eq(chefs.id, chefId));

    // 3. Insert audit row immediately (no status field — audit records are immutable once written)
    const [inserted] = await db
      .insert(chefUnavailability)
      .values({
        chefId,
        unavailabilityType: "on_leave",
        leaveStartDate: leaveStartStr,
        leaveEndDate: leaveEndStr,
      })
      .returning();

    const unavailabilityId = inserted.id;

    // 4. Count affected deliveries today only (0 if leave hasn't started yet)
    let affectedCount = 0;
    if (leaveStartDate <= today) {
      affectedCount = await this.countAffectedDeliveries(chefId, today, today);
    }

    return { unavailabilityId, affectedCount };
  }

  // ─── 3. markAvailable ───────────────────────────────────────────────────────

  /**
   * Marks a chef as available again.
   * Only resets the chefs row — audit records in chef_unavailability are immutable history
   * and are NEVER updated.
   */
  async markAvailable(chefId: string): Promise<void> {
    await db
      .update(chefs)
      .set({
        subscriptionAvailabilityStatus: "available",
        leaveStartDate: null,
        leaveEndDate: null,
      })
      .where(eq(chefs.id, chefId));
    // Note: chef_unavailability audit rows are never updated — they are immutable history.
  }

  // ─── 4. countAffectedDeliveries ─────────────────────────────────────────────

  /**
   * Counts scheduled delivery logs for a chef within a date range (date-level comparison).
   */
  async countAffectedDeliveries(
    chefId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const results = await db
      .select({ id: subscriptionDeliveryLogs.id })
      .from(subscriptionDeliveryLogs)
      .innerJoin(
        subscriptions,
        eq(subscriptionDeliveryLogs.subscriptionId, subscriptions.id)
      )
      .where(
        and(
          eq(subscriptionDeliveryLogs.status, "scheduled"),
          eq(subscriptions.chefId, chefId),
          sql`DATE(${subscriptionDeliveryLogs.date}) >= DATE(${startStr}::date)`,
          sql`DATE(${subscriptionDeliveryLogs.date}) <= DATE(${endStr}::date)`
        )
      );

    return results.length;
  }

  // ─── 5. getPendingActions ───────────────────────────────────────────────────

  /**
   * Returns the derived pending action list for the admin Unavailability Actions tab.
   * Joins subscription_delivery_logs → subscriptions → chefs.
   *
   * Date-range-aware availability filter (per-status):
   *   - unavailable_today chefs: include delivery only if DATE(delivery.date) = today
   *   - on_leave chefs:          include delivery only if DATE(delivery.date) is within
   *                               [chef.leaveStartDate, chef.leaveEndDate]
   *   - available chefs:         excluded entirely
   *
   * Ordered by delivery date ASC.
   */
  async getPendingActions(): Promise<PendingActionItem[]> {
    const rows = await db
      .select({
        deliveryLogId: subscriptionDeliveryLogs.id,
        subscriptionId: subscriptionDeliveryLogs.subscriptionId,
        deliveryDate: subscriptionDeliveryLogs.date,
        originalChefId: chefs.id,
        originalChefName: chefs.name,
        customerName: subscriptions.customerName,
        planName: subscriptionPlans.name,
        chefOverrideId: subscriptionDeliveryLogs.chefOverrideId,
        skipReason: subscriptionDeliveryLogs.skipReason,
      })
      .from(subscriptionDeliveryLogs)
      .innerJoin(
        subscriptions,
        eq(subscriptionDeliveryLogs.subscriptionId, subscriptions.id)
      )
      .innerJoin(chefs, eq(subscriptions.chefId, chefs.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(subscriptionDeliveryLogs.status, "scheduled"),
          isNull(subscriptionDeliveryLogs.chefOverrideId),
          isNull(subscriptionDeliveryLogs.skipReason),
          sql`(
            (${chefs.subscriptionAvailabilityStatus} = 'unavailable_today' AND DATE(${subscriptionDeliveryLogs.date}) = CURRENT_DATE)
            OR
            (${chefs.subscriptionAvailabilityStatus} = 'on_leave'
             AND ${chefs.leaveStartDate} IS NOT NULL
             AND ${chefs.leaveEndDate} IS NOT NULL
             AND ${subscriptionDeliveryLogs.date}::date >= ${chefs.leaveStartDate}::date
             AND ${subscriptionDeliveryLogs.date}::date <= ${chefs.leaveEndDate}::date)
          )`
        )
      )
      .orderBy(subscriptionDeliveryLogs.date);

    return rows.map((row) => ({
      deliveryLogId: row.deliveryLogId,
      subscriptionId: row.subscriptionId,
      deliveryDate: row.deliveryDate,
      originalChefId: row.originalChefId,
      originalChefName: row.originalChefName,
      customerName: row.customerName,
      planName: row.planName ?? "—",
      chefOverrideId: row.chefOverrideId ?? null,
      skipReason: row.skipReason ?? null,
    }));
  }

  // ─── 6. getPendingActionCount ───────────────────────────────────────────────

  /**
   * Returns the count of pending actions (for the badge in the admin UI).
   * Uses the same date-range-aware filter as getPendingActions.
   */
  async getPendingActionCount(): Promise<number> {
    const rows = await db
      .select({ id: subscriptionDeliveryLogs.id })
      .from(subscriptionDeliveryLogs)
      .innerJoin(
        subscriptions,
        eq(subscriptionDeliveryLogs.subscriptionId, subscriptions.id)
      )
      .innerJoin(chefs, eq(subscriptions.chefId, chefs.id))
      .where(
        and(
          eq(subscriptionDeliveryLogs.status, "scheduled"),
          isNull(subscriptionDeliveryLogs.chefOverrideId),
          isNull(subscriptionDeliveryLogs.skipReason),
          sql`(
            (${chefs.subscriptionAvailabilityStatus} = 'unavailable_today' AND DATE(${subscriptionDeliveryLogs.date}) = CURRENT_DATE)
            OR
            (${chefs.subscriptionAvailabilityStatus} = 'on_leave'
             AND ${chefs.leaveStartDate} IS NOT NULL
             AND ${chefs.leaveEndDate} IS NOT NULL
             AND ${subscriptionDeliveryLogs.date}::date >= ${chefs.leaveStartDate}::date
             AND ${subscriptionDeliveryLogs.date}::date <= ${chefs.leaveEndDate}::date)
          )`
        )
      );

    return rows.length;
  }

  // ─── 7. notifyAdmins ────────────────────────────────────────────────────────

  // Optional future integration — not called by any mandatory code path
  /**
   * Sends fire-and-forget WhatsApp notifications to all admin users with a phone number.
   * Failures are logged as warnings and never propagated.
   * This method is NOT called from any mandatory code path — it is preserved for
   * optional future integration only.
   */
  async notifyAdmins(message: string): Promise<void> {
    try {
      const adminsWithPhone = await db
        .select({ phone: adminUsers.phone })
        .from(adminUsers)
        .where(isNotNull(adminUsers.phone));

      if (adminsWithPhone.length === 0) {
        console.warn("[UNAVAILABILITY] No admin users have a phone number configured for WhatsApp notifications");
        return;
      }

      for (const admin of adminsWithPhone) {
        if (admin.phone) {
          // fire-and-forget — do NOT await
          sendWhatsAppMessage(admin.phone, message).catch((err) => {
            console.warn("[UNAVAILABILITY] WhatsApp notification failed", err);
          });
        }
      }
    } catch (err) {
      console.warn("[UNAVAILABILITY] Failed to query admins for notification", err);
    }
  }

  // ─── 8. reassignDelivery ────────────────────────────────────────────────────

  /**
   * Admin: reassign a scheduled delivery to a replacement chef.
   * Sets chefOverrideId on the delivery log — does NOT touch subscriptions.chefId.
   * Throws 404 if not found, 409 if already actioned.
   */
  async reassignDelivery(
    deliveryLogId: string,
    replacementChefId: string
  ): Promise<void> {
    // Fetch delivery log
    const deliveryLog = await db.query.subscriptionDeliveryLogs.findFirst({
      where: eq(subscriptionDeliveryLogs.id, deliveryLogId),
    });

    if (!deliveryLog) {
      throw { status: 404, message: "Delivery log not found" };
    }

    // 409 if already actioned
    if (deliveryLog.chefOverrideId !== null || deliveryLog.skipReason !== null) {
      throw { status: 409, message: "Delivery already actioned" };
    }

    // Update chefOverrideId
    await db
      .update(subscriptionDeliveryLogs)
      .set({
        chefOverrideId: replacementChefId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionDeliveryLogs.id, deliveryLogId));
  }

  // ─── 9. platformSkipDelivery ────────────────────────────────────────────────

  /**
   * Admin: platform-skip a delivery due to chef unavailability.
   * Wrapped in a db.transaction():
   * - Sets delivery log: status='skipped', skipReason='platform_chef_unavailable'
   * - Extends subscription.endDate by 1 calendar day
   * - Appends entry to subscription.deliveryHistory
   * - Does NOT change remainingDeliveries
   * Throws 404 if not found, 409 if already actioned.
   */
  async platformSkipDelivery(
    deliveryLogId: string
  ): Promise<{ newEndDate: Date }> {
    // Fetch delivery log + parent subscription
    const deliveryLog = await db.query.subscriptionDeliveryLogs.findFirst({
      where: eq(subscriptionDeliveryLogs.id, deliveryLogId),
    });

    if (!deliveryLog) {
      throw { status: 404, message: "Delivery log not found" };
    }

    // 409 if already actioned
    if (deliveryLog.chefOverrideId !== null || deliveryLog.skipReason !== null) {
      throw { status: 409, message: "Delivery already actioned" };
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, deliveryLog.subscriptionId),
    });

    if (!subscription) {
      throw { status: 404, message: "Delivery log not found" };
    }

    let newEndDate: Date;

    await db.transaction(async (tx) => {
      const now = new Date();

      // 1. Mark delivery log as skipped
      await tx
        .update(subscriptionDeliveryLogs)
        .set({
          status: "skipped",
          skipReason: "platform_chef_unavailable",
          updatedAt: now,
        })
        .where(eq(subscriptionDeliveryLogs.id, deliveryLogId));

      // 2. Extend subscription endDate by exactly 1 calendar day
      const currentEndDate = subscription.endDate
        ? new Date(subscription.endDate)
        : new Date();
      newEndDate = new Date(currentEndDate.getTime() + 24 * 60 * 60 * 1000);

      // 3. Append to deliveryHistory
      const currentHistory: unknown[] = Array.isArray(subscription.deliveryHistory)
        ? (subscription.deliveryHistory as unknown[])
        : [];
      const updatedHistory = [
        ...currentHistory,
        {
          date: deliveryLog.date,
          status: "skipped",
          reason: "platform_chef_unavailable",
        },
      ];

      await tx
        .update(subscriptions)
        .set({
          endDate: newEndDate,
          deliveryHistory: updatedHistory,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, deliveryLog.subscriptionId));
    });

    // Fire-and-forget customer WhatsApp notification (optional, non-mandatory)
    const customerPhone = subscription.phone;
    if (customerPhone) {
      const deliveryDateStr = deliveryLog.date.toISOString().split("T")[0];
      const newEndDateStr = newEndDate!.toISOString().split("T")[0];
      const message =
        `⚠️ Delivery Update — RotiHai\n` +
        `We're sorry! Your scheduled delivery on ${deliveryDateStr} has been skipped due to chef unavailability.\n` +
        `Your subscription has been extended by 1 day. New end date: ${newEndDateStr}.\n` +
        `Subscription ID: ${subscription.id}\n` +
        `We apologise for the inconvenience. —RotiHai Team`;
      sendWhatsAppMessage(customerPhone, message).catch((err) => {
        console.warn("[UNAVAILABILITY] Customer WhatsApp notification failed", err);
      });
    } else {
      console.warn(
        `[UNAVAILABILITY] Subscription ${subscription.id} has no phone number — cannot send customer skip notification`
      );
    }

    return { newEndDate: newEndDate! };
  }

  // ─── 10. getAvailableChefs ──────────────────────────────────────────────────

  /**
   * Returns available replacement chefs for the reassign modal.
   * Filters: subscriptionAvailabilityStatus = 'available' AND isActive = true.
   * Optionally excludes the current chef (excludeChefId).
   */
  async getAvailableChefs(excludeChefId?: string): Promise<AvailableChef[]> {
    const conditions = [
      eq(chefs.subscriptionAvailabilityStatus, "available"),
      eq(chefs.isActive, true),
    ];

    if (excludeChefId) {
      conditions.push(ne(chefs.id, excludeChefId));
    }

    const rows = await db
      .select({
        id: chefs.id,
        name: chefs.name,
        phone: chefs.phone,
        isActive: chefs.isActive,
        subscriptionAvailabilityStatus: chefs.subscriptionAvailabilityStatus,
      })
      .from(chefs)
      .where(and(...conditions));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? null,
      isActive: row.isActive,
      subscriptionAvailabilityStatus: row.subscriptionAvailabilityStatus,
    }));
  }
}

export const chefUnavailabilityService = new ChefUnavailabilityService();
