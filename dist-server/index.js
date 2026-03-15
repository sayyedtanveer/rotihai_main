var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLoginSchema: () => adminLoginSchema,
  adminRoleEnum: () => adminRoleEnum,
  adminSettings: () => adminSettings,
  adminUsers: () => adminUsers,
  cartSettings: () => cartSettings,
  categories: () => categories,
  chefs: () => chefs,
  couponUsages: () => couponUsages,
  coupons: () => coupons,
  deliveryAreas: () => deliveryAreas,
  deliveryLogStatusEnum: () => deliveryLogStatusEnum,
  deliveryPersonnel: () => deliveryPersonnel,
  deliveryPersonnelLoginSchema: () => deliveryPersonnelLoginSchema,
  deliveryPersonnelStatusEnum: () => deliveryPersonnelStatusEnum,
  deliverySettings: () => deliverySettings,
  deliveryTimeSlots: () => deliveryTimeSlots,
  discountTypeEnum: () => discountTypeEnum,
  insertAdminSettingsSchema: () => insertAdminSettingsSchema,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertCartSettingSchema: () => insertCartSettingSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertChefSchema: () => insertChefSchema,
  insertCouponSchema: () => insertCouponSchema,
  insertDeliveryAreasSchema: () => insertDeliveryAreasSchema,
  insertDeliveryPersonnelSchema: () => insertDeliveryPersonnelSchema,
  insertDeliverySettingSchema: () => insertDeliverySettingSchema,
  insertDeliveryTimeSlotsSchema: () => insertDeliveryTimeSlotsSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertPartnerUserSchema: () => insertPartnerUserSchema,
  insertPendingBroadcastSchema: () => insertPendingBroadcastSchema,
  insertProductSchema: () => insertProductSchema,
  insertPromotionalBannerSchema: () => insertPromotionalBannerSchema,
  insertPushSubscriptionSchema: () => insertPushSubscriptionSchema,
  insertReferralRewardSchema: () => insertReferralRewardSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertRotiSettingsSchema: () => insertRotiSettingsSchema,
  insertSubscriptionDeliveryLogSchema: () => insertSubscriptionDeliveryLogSchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVisitorSchema: () => insertVisitorSchema,
  insertWalletTransactionSchema: () => insertWalletTransactionSchema,
  newsletterSubscribers: () => newsletterSubscribers,
  orders: () => orders,
  partnerLoginSchema: () => partnerLoginSchema,
  partnerUsers: () => partnerUsers,
  paymentStatusEnum: () => paymentStatusEnum,
  pendingBroadcasts: () => pendingBroadcasts,
  products: () => products,
  promotionalBanners: () => promotionalBanners,
  pushSubscriptions: () => pushSubscriptions,
  referralRewards: () => referralRewards,
  referrals: () => referrals,
  rotiSettings: () => rotiSettings,
  sessions: () => sessions,
  subscriptionDeliveryLogs: () => subscriptionDeliveryLogs,
  subscriptionFrequencyEnum: () => subscriptionFrequencyEnum,
  subscriptionPlans: () => subscriptionPlans,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  subscriptions: () => subscriptions,
  transactionTypeEnum: () => transactionTypeEnum,
  userLoginSchema: () => userLoginSchema,
  users: () => users,
  visitors: () => visitors,
  walletSettings: () => walletSettings,
  walletTransactions: () => walletTransactions
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import * as crypto from "crypto";
var adminRoleEnum, sessions, users, adminUsers, partnerUsers, categories, chefs, products, paymentStatusEnum, deliveryPersonnelStatusEnum, deliveryPersonnel, orders, deliverySettings, cartSettings, discountTypeEnum, coupons, couponUsages, referrals, transactionTypeEnum, walletTransactions, walletSettings, referralRewards, subscriptionStatusEnum, subscriptionFrequencyEnum, deliveryLogStatusEnum, subscriptionPlans, subscriptions, subscriptionDeliveryLogs, insertCategorySchema, insertProductSchema, insertChefSchema, orderItemSchema, insertOrderSchema, insertUserSchema, userLoginSchema, insertAdminUserSchema, adminLoginSchema, insertPartnerUserSchema, partnerLoginSchema, insertSubscriptionPlanSchema, promotionalBanners, insertPromotionalBannerSchema, insertSubscriptionSchema, insertDeliverySettingSchema, insertSubscriptionDeliveryLogSchema, insertCartSettingSchema, insertDeliveryPersonnelSchema, deliveryPersonnelLoginSchema, insertCouponSchema, insertReferralSchema, insertWalletTransactionSchema, insertReferralRewardSchema, deliveryTimeSlots, insertDeliveryTimeSlotsSchema, rotiSettings, insertRotiSettingsSchema, visitors, insertVisitorSchema, deliveryAreas, insertDeliveryAreasSchema, adminSettings, insertAdminSettingsSchema, pushSubscriptions, insertPushSubscriptionSchema, newsletterSubscribers, pendingBroadcasts, insertPendingBroadcastSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    adminRoleEnum = pgEnum("admin_role", ["super_admin", "manager", "viewer"]);
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: varchar("name", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 20 }).notNull(),
      // Multiple phone numbers allowed per email
      email: varchar("email", { length: 255 }),
      address: text("address"),
      passwordHash: text("password_hash").notNull(),
      referralCode: varchar("referral_code", { length: 20 }).unique(),
      walletBalance: integer("wallet_balance").notNull().default(0),
      lastLoginAt: timestamp("last_login_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
      latitude: real("latitude"),
      longitude: real("longitude")
    });
    adminUsers = pgTable("admin_users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: varchar("username", { length: 50 }).notNull().unique(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      phone: text("phone"),
      passwordHash: text("password_hash").notNull(),
      role: adminRoleEnum("role").notNull().default("viewer"),
      lastLoginAt: timestamp("last_login_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    partnerUsers = pgTable("partner_users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      chefId: text("chef_id").notNull().unique(),
      username: varchar("username", { length: 50 }).notNull().unique(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      passwordHash: text("password_hash").notNull(),
      profilePictureUrl: text("profile_picture_url"),
      lastLoginAt: timestamp("last_login_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    categories = pgTable("categories", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description").notNull(),
      image: text("image").notNull(),
      iconName: text("icon_name").notNull(),
      itemCount: text("item_count").notNull(),
      requiresDeliverySlot: boolean("requires_delivery_slot").notNull().default(false),
      displayOrder: integer("display_order").notNull().default(999)
    });
    chefs = pgTable("chefs", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      phone: text("phone"),
      description: text("description").notNull(),
      image: text("image").notNull(),
      rating: text("rating").notNull(),
      reviewCount: integer("review_count").notNull(),
      categoryId: text("category_id").notNull(),
      address: text("address"),
      // Chef's physical address (optional)
      // Structured address components (added for better search/filtering)
      addressBuilding: text("address_building"),
      addressStreet: text("address_street"),
      addressArea: text("address_area"),
      addressCity: text("address_city"),
      addressPincode: text("address_pincode"),
      latitude: real("latitude").notNull().default(19.0728),
      longitude: real("longitude").notNull().default(72.8826),
      isActive: boolean("is_active").notNull().default(true),
      // Delivery fee configuration
      defaultDeliveryFee: integer("default_delivery_fee").notNull().default(20),
      // Fallback fee when no location
      deliveryFeePerKm: integer("delivery_fee_per_km").notNull().default(5),
      // ₹ per km
      freeDeliveryThreshold: integer("free_delivery_threshold").notNull().default(200),
      // Free delivery above this amount
      maxDeliveryDistanceKm: integer("max_delivery_distance_km").notNull().default(5),
      // Max delivery distance in km
      // Service pincodes - which pincodes this chef serves (pincode-based filtering)
      servicePincodes: text("service_pincodes").array(),
      // Array of valid pincodes like ["400070", "400086", "400025"]
      isVerified: boolean("is_verified").notNull().default(false)
      // Verified chef badge (verified by platform)
    });
    products = pgTable("products", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description").notNull(),
      hotelPrice: integer("hotel_price").notNull().default(0),
      // ← NEW: Cost from hotel/supplier (₹)
      price: integer("price").notNull(),
      // ← RotiHai selling price (₹)
      image: text("image").notNull(),
      rating: decimal("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
      reviewCount: integer("review_count").notNull().default(0),
      isVeg: boolean("is_veg").notNull().default(true),
      isCustomizable: boolean("is_customizable").notNull().default(false),
      stockQuantity: integer("stock_quantity").notNull().default(100),
      lowStockThreshold: integer("low_stock_threshold").notNull().default(20),
      isAvailable: boolean("is_available").notNull().default(true),
      categoryId: varchar("category_id").notNull(),
      chefId: text("chef_id"),
      offerPercentage: integer("offer_percentage").notNull().default(0),
      marginPercent: decimal("margin_percent", { precision: 5, scale: 2 }).default("0")
      // ← NEW: Auto-calculated margin %
    });
    paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "confirmed"]);
    deliveryPersonnelStatusEnum = pgEnum("delivery_personnel_status", ["available", "busy", "offline"]);
    deliveryPersonnel = pgTable("delivery_personnel", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      phone: text("phone").notNull().unique(),
      email: text("email"),
      passwordHash: text("password_hash").notNull(),
      status: deliveryPersonnelStatusEnum("status").notNull().default("available"),
      currentLocation: text("current_location"),
      isActive: boolean("is_active").notNull().default(true),
      totalDeliveries: integer("total_deliveries").notNull().default(0),
      rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      lastLoginAt: timestamp("last_login_at")
    });
    orders = pgTable("orders", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id"),
      customerName: text("customer_name").notNull(),
      phone: text("phone").notNull(),
      email: text("email"),
      address: text("address").notNull(),
      // Structured address components (added for better search/filtering)
      addressBuilding: text("address_building"),
      addressStreet: text("address_street"),
      addressArea: text("address_area"),
      addressCity: text("address_city"),
      addressPincode: text("address_pincode"),
      items: jsonb("items").notNull(),
      subtotal: integer("subtotal").notNull(),
      deliveryFee: integer("delivery_fee").notNull(),
      discount: integer("discount").notNull().default(0),
      couponCode: varchar("coupon_code", { length: 50 }),
      walletAmountUsed: integer("wallet_amount_used").notNull().default(0),
      total: integer("total").notNull(),
      status: text("status").notNull().default("pending"),
      paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
      paymentQrShown: boolean("payment_qr_shown").notNull().default(false),
      chefId: text("chef_id"),
      chefName: text("chef_name"),
      categoryId: varchar("category_id"),
      // Category of the order (for Roti validation)
      categoryName: text("category_name"),
      // Category name for display
      deliveryTime: text("delivery_time"),
      // Required for Roti orders (HH:mm format)
      deliveryDate: text("delivery_date"),
      // Date for scheduled orders (YYYY-MM-DD format)
      deliverySlotId: varchar("delivery_slot_id"),
      // Reference to delivery time slot
      approvedBy: text("approved_by"),
      rejectedAt: timestamp("rejected_at"),
      approvedAt: timestamp("approved_at"),
      rejectedBy: text("rejected_by"),
      rejectionReason: text("rejection_reason"),
      assignedTo: text("assigned_to"),
      deliveryPersonName: text("delivery_person_name"),
      deliveryPersonPhone: text("delivery_person_phone"),
      assignedAt: timestamp("assigned_at"),
      pickedUpAt: timestamp("picked_up_at"),
      deliveredAt: timestamp("delivered_at"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    deliverySettings = pgTable("delivery_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      minDistance: decimal("min_distance", { precision: 5, scale: 2 }).notNull(),
      maxDistance: decimal("max_distance", { precision: 5, scale: 2 }).notNull(),
      price: integer("price").notNull(),
      minOrderAmount: integer("min_order_amount").default(0),
      // Minimum order for this range
      // Pincode field - which pincode this delivery setting applies to
      pincode: varchar("pincode", { length: 6 }),
      // Optional: specific pincode (e.g., "400070", "400086")
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    cartSettings = pgTable("cart_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      categoryId: varchar("category_id").notNull().unique(),
      categoryName: text("category_name").notNull(),
      minOrderAmount: integer("min_order_amount").notNull().default(100),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
    coupons = pgTable("coupons", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: varchar("code", { length: 50 }).notNull().unique(),
      description: text("description").notNull(),
      discountType: discountTypeEnum("discount_type").notNull(),
      discountValue: integer("discount_value").notNull(),
      minOrderAmount: integer("min_order_amount").notNull().default(0),
      maxDiscount: integer("max_discount"),
      usageLimit: integer("usage_limit"),
      usedCount: integer("used_count").notNull().default(0),
      perUserLimit: integer("per_user_limit").default(1),
      // How many times each user can use this coupon
      validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
      validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    couponUsages = pgTable("coupon_usages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      couponId: varchar("coupon_id").notNull(),
      userId: varchar("user_id").notNull(),
      orderId: varchar("order_id"),
      // Reference to the order where coupon was used
      usedAt: timestamp("used_at").notNull().defaultNow()
    }, (table) => [
      index("IDX_coupon_usages_coupon_user").on(table.couponId, table.userId)
    ]);
    referrals = pgTable("referrals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      referrerId: varchar("referrer_id").notNull(),
      // User who refers
      referredId: varchar("referred_id").notNull(),
      // User who was referred
      referralCode: varchar("referral_code", { length: 20 }).notNull(),
      status: varchar("status", { length: 20 }).notNull().default("pending"),
      // pending, completed, expired, approved, cancelled
      referrerBonus: integer("referrer_bonus").notNull().default(0),
      // Bonus amount for referrer
      referredBonus: integer("referred_bonus").notNull().default(0),
      // Bonus amount for referred user
      referredOrderCompleted: boolean("referred_order_completed").notNull().default(false),
      adminNote: text("admin_note"),
      // Admin reason for approve/cancel
      fraudFlag: boolean("fraud_flag").notNull().default(false),
      // Soft fraud flag set by admin
      createdAt: timestamp("created_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at")
    }, (table) => [
      index("IDX_referrals_referrer").on(table.referrerId, table.status),
      index("IDX_referrals_referred").on(table.referredId)
    ]);
    transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit", "referral_bonus", "order_discount"]);
    walletTransactions = pgTable("wallet_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      amount: integer("amount").notNull(),
      type: transactionTypeEnum("type").notNull(),
      description: text("description").notNull(),
      referenceId: varchar("reference_id"),
      // Order ID or Referral ID
      referenceType: varchar("reference_type", { length: 50 }),
      // 'order', 'referral', etc
      balanceBefore: integer("balance_before").notNull(),
      balanceAfter: integer("balance_after").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => [
      index("IDX_wallet_user_created").on(table.userId, table.createdAt)
    ]);
    walletSettings = pgTable("wallet_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      maxUsagePerOrder: integer("max_usage_per_order").notNull().default(10),
      minOrderAmount: integer("min_order_amount").notNull().default(0),
      referrerBonus: integer("referrer_bonus").notNull().default(100),
      referredBonus: integer("referred_bonus").notNull().default(50),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    referralRewards = pgTable("referral_rewards", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      referrerBonus: integer("referrer_bonus").notNull().default(50),
      // ₹50 for referrer
      referredBonus: integer("referred_bonus").notNull().default(50),
      // ₹50 for referred user
      minOrderAmount: integer("min_order_amount").notNull().default(0),
      // Min order to qualify
      maxReferralsPerMonth: integer("max_referrals_per_month").default(10),
      maxEarningsPerMonth: integer("max_earnings_per_month").default(500),
      expiryDays: integer("expiry_days").default(30),
      // Days for referred user to complete first order
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    subscriptionStatusEnum = pgEnum("subscription_status", ["pending", "active", "paused", "cancelled", "expired"]);
    subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["daily", "weekly", "monthly"]);
    deliveryLogStatusEnum = pgEnum("delivery_log_status", ["scheduled", "preparing", "out_for_delivery", "delivered", "missed", "skipped"]);
    subscriptionPlans = pgTable("subscription_plans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description").notNull(),
      categoryId: varchar("category_id").notNull(),
      frequency: subscriptionFrequencyEnum("frequency").notNull(),
      price: integer("price").notNull(),
      deliveryDays: jsonb("delivery_days").notNull(),
      // Array of days: ["monday", "tuesday", etc]
      items: jsonb("items").notNull(),
      // Default items included
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    subscriptions = pgTable("subscriptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      planId: varchar("plan_id").notNull(),
      chefId: text("chef_id"),
      // Chef assigned to handle this subscription
      chefAssignedAt: timestamp("chef_assigned_at").default(sql`null`),
      // When chef was assigned - used to track if reassignment needed
      deliverySlotId: varchar("delivery_slot_id"),
      // Reference to delivery time slot
      customerName: text("customer_name").notNull(),
      phone: text("phone").notNull(),
      email: text("email"),
      address: text("address").notNull(),
      status: subscriptionStatusEnum("status").notNull().default("active"),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date"),
      nextDeliveryDate: timestamp("next_delivery_date").notNull(),
      nextDeliveryTime: text("next_delivery_time").default("09:00"),
      // Delivery time (HH:mm format)
      customItems: jsonb("custom_items"),
      // User customized items
      remainingDeliveries: integer("remaining_deliveries").notNull().default(30),
      // Track remaining deliveries
      totalDeliveries: integer("total_deliveries").notNull().default(30),
      // Total deliveries in subscription
      isPaid: boolean("is_paid").notNull().default(false),
      paymentTransactionId: text("payment_transaction_id"),
      // Payment breakdown fields for admin adjustments
      originalPrice: integer("original_price"),
      // Original plan price
      discountAmount: integer("discount_amount").default(0),
      // Admin-applied discount
      walletAmountUsed: integer("wallet_amount_used").default(0),
      // Wallet balance deducted
      couponCode: text("coupon_code"),
      // Coupon code applied
      couponDiscount: integer("coupon_discount").default(0),
      // Discount from coupon
      finalAmount: integer("final_amount"),
      // Final amount after all adjustments
      paymentNotes: text("payment_notes"),
      // Admin notes for payment adjustments
      lastDeliveryDate: timestamp("last_delivery_date"),
      deliveryHistory: jsonb("delivery_history").default([]),
      // Array of delivery records
      pauseStartDate: timestamp("pause_start_date"),
      // Advanced pause: start date
      pauseResumeDate: timestamp("pause_resume_date"),
      // Advanced pause: auto-resume date
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    subscriptionDeliveryLogs = pgTable("subscription_delivery_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      subscriptionId: varchar("subscription_id").notNull(),
      date: timestamp("date").notNull(),
      time: text("time").notNull().default("09:00"),
      // HH:mm format
      status: deliveryLogStatusEnum("status").notNull().default("scheduled"),
      deliveryPersonId: varchar("delivery_person_id"),
      // nullable
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertCategorySchema = createInsertSchema(categories).omit({
      id: true
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true
    }).extend({
      hotelPrice: z.number().min(0).optional(),
      // ← NEW: Cost from hotel/supplier
      marginPercent: z.union([z.number(), z.string()]).transform((v) => typeof v === "string" ? parseFloat(v) : v).optional(),
      // ← NEW: Auto-calculated margin (handle DECIMAL from DB)
      isCustomizable: z.boolean().default(false).optional(),
      offerPercentage: z.number().min(0).max(100).optional(),
      createdAt: z.date().or(z.string()).optional(),
      updatedAt: z.date().or(z.string()).optional()
    });
    insertChefSchema = createInsertSchema(chefs, {
      servicePincodes: z.array(z.string().regex(/^\d{5,6}$/, "Pincode must be 5-6 digits")).optional().nullable()
    }).omit({
      id: true
    });
    orderItemSchema = z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      hotelPrice: z.number().optional(),
      // ← Partner's cost price
      quantity: z.number()
    });
    insertOrderSchema = createInsertSchema(orders, {
      items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        hotelPrice: z.number().optional(),
        // ← Partner's cost price
        quantity: z.number(),
        specialInstructions: z.string().optional()
        // ← Optional cooking instructions
      })),
      status: z.enum([
        "pending",
        // Order placed, waiting for payment confirmation
        "confirmed",
        // Payment confirmed, sent to chef
        "accepted_by_chef",
        // Chef accepted the order
        "preparing",
        // Chef is preparing the food
        "prepared",
        // Food ready, waiting for pickup
        "accepted_by_delivery",
        // Delivery person accepted
        "out_for_delivery",
        // Delivery person picked up, on the way
        "delivered",
        // Order delivered to customer
        "completed",
        // Order completed
        "cancelled"
        // Order cancelled
      ]).default("pending"),
      paymentStatus: z.enum(["pending", "paid", "confirmed"]).default("pending"),
      userId: z.string().optional().nullable(),
      // userId is optional - user created on payment
      categoryId: z.string().optional(),
      categoryName: z.string().optional(),
      deliveryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
      deliverySlotId: z.string().optional()
    }).omit({
      id: true,
      createdAt: true,
      approvedAt: true,
      approvedBy: true,
      rejectedAt: true,
      rejectedBy: true,
      rejectionReason: true,
      pickedUpAt: true,
      deliveredAt: true,
      assignedTo: true,
      deliveryPersonName: true,
      deliveryPersonPhone: true
    });
    insertUserSchema = createInsertSchema(users, {
      name: z.string().min(1, { message: "Name must be at least 1 character long" }),
      phone: z.string().min(10, { message: "Phone number must be at least 10 digits long" }),
      email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
      address: z.string().optional().nullable(),
      passwordHash: z.string().min(6, { message: "Password must be at least 6 characters long" }),
      referralCode: z.string().optional().nullable(),
      walletBalance: z.number().int().default(0)
    }).omit({
      id: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      password: z.string().min(6, { message: "Password must be at least 6 characters long" })
    });
    userLoginSchema = z.object({
      phone: z.string(),
      password: z.string()
    });
    insertAdminUserSchema = createInsertSchema(adminUsers, {
      username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
      email: z.string().email({ message: "Invalid email address" }),
      role: z.enum(["super_admin", "manager", "viewer"]).default("viewer"),
      phone: z.string().optional()
    }).omit({
      id: true,
      lastLoginAt: true,
      createdAt: true,
      passwordHash: true
    }).extend({
      password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });
    adminLoginSchema = z.object({
      username: z.string(),
      password: z.string()
    });
    insertPartnerUserSchema = createInsertSchema(partnerUsers, {
      chefId: z.string().min(1, { message: "Chef ID is required" }),
      username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
      email: z.string().email({ message: "Invalid email address" })
    }).omit({
      id: true,
      lastLoginAt: true,
      createdAt: true,
      passwordHash: true
    }).extend({
      password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });
    partnerLoginSchema = z.object({
      username: z.string(),
      password: z.string()
    });
    insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
    promotionalBanners = pgTable("promotional_banners", {
      id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      title: text("title").notNull(),
      subtitle: text("subtitle").notNull(),
      buttonText: text("button_text").notNull(),
      gradientFrom: varchar("gradient_from", { length: 50 }).notNull().default("orange-600"),
      gradientVia: varchar("gradient_via", { length: 50 }).notNull().default("amber-600"),
      gradientTo: varchar("gradient_to", { length: 50 }).notNull().default("yellow-600"),
      emoji1: varchar("emoji_1", { length: 10 }).notNull().default("\u{1F37D}\uFE0F"),
      emoji2: varchar("emoji_2", { length: 10 }).notNull().default("\u{1F958}"),
      emoji3: varchar("emoji_3", { length: 10 }).notNull().default("\u{1F35B}"),
      actionType: varchar("action_type", { length: 50 }).notNull().default("subscription"),
      // subscription, category, url
      actionValue: text("action_value"),
      // category id or url
      isActive: boolean("is_active").notNull().default(true),
      displayOrder: integer("display_order").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertPromotionalBannerSchema = createInsertSchema(promotionalBanners);
    insertSubscriptionSchema = createInsertSchema(subscriptions, {
      userId: z.string().min(1, { message: "User ID is required" }),
      planId: z.string().min(1, { message: "Plan ID is required" }),
      chefId: z.string().optional(),
      // Chef/Partner assigned to subscription
      customerName: z.string().min(1, { message: "Customer name is required" }),
      phone: z.string().min(10, { message: "Phone number must be at least 10 digits long" }),
      address: z.string().min(1, { message: "Address is required" }),
      status: z.enum(["pending", "active", "paused", "cancelled", "expired"]).default("active"),
      startDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional(),
      endDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional(),
      nextDeliveryDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional(),
      nextDeliveryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm." }).default("09:00"),
      customItems: z.array(z.object({ id: z.string(), name: z.string(), quantity: z.number() })).optional(),
      remainingDeliveries: z.number().int().min(0).default(30),
      totalDeliveries: z.number().int().min(0).default(30),
      isPaid: z.boolean().default(false),
      paymentTransactionId: z.string().optional(),
      lastDeliveryDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional(),
      deliveryHistory: z.array(z.object({ deliveryDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()), status: z.string() })).default([]),
      pauseStartDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional(),
      pauseResumeDate: z.preprocess((arg) => arg ? new Date(arg) : null, z.date().nullable()).optional()
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertDeliverySettingSchema = createInsertSchema(deliverySettings, {
      name: z.string().min(1, { message: "Setting name is required" }),
      minDistance: z.number({ message: "Minimum distance is required" }),
      maxDistance: z.number({ message: "Maximum distance is required" }),
      price: z.number({ message: "Price is required" }),
      pincode: z.string().regex(/^\d{5,6}$/, { message: "Pincode must be 5-6 digits" }).optional().nullable(),
      isActive: z.boolean().default(true)
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSubscriptionDeliveryLogSchema = createInsertSchema(subscriptionDeliveryLogs, {
      subscriptionId: z.string().min(1, { message: "Subscription ID is required" }),
      date: z.preprocess((arg) => new Date(arg), z.date()),
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format. Use HH:mm." }).default("09:00"),
      status: z.enum(["scheduled", "preparing", "out_for_delivery", "delivered", "missed", "skipped"]).default("scheduled"),
      deliveryPersonId: z.string().optional(),
      notes: z.string().optional()
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCartSettingSchema = createInsertSchema(cartSettings, {
      categoryId: z.string().min(1, { message: "Category ID is required" }),
      categoryName: z.string().min(1, { message: "Category name is required" }),
      minOrderAmount: z.number().int().default(100),
      isActive: z.boolean().default(true)
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertDeliveryPersonnelSchema = createInsertSchema(deliveryPersonnel, {
      name: z.string().min(1, { message: "Name is required" }),
      phone: z.string().min(10, { message: "Phone number must be at least 10 digits long" }),
      status: z.enum(["available", "busy", "offline"]).default("available"),
      isActive: z.boolean().default(true),
      totalDeliveries: z.number().int().default(0),
      rating: z.number().min(0).max(5).default(5)
    }).omit({
      id: true,
      createdAt: true,
      lastLoginAt: true,
      passwordHash: true
    }).extend({
      password: z.string().min(8, { message: "Password must be at least 8 characters long" })
    });
    deliveryPersonnelLoginSchema = z.object({
      phone: z.string(),
      password: z.string()
    });
    insertCouponSchema = createInsertSchema(coupons, {
      code: z.string().min(1, { message: "Coupon code is required" }),
      description: z.string().min(1, { message: "Description is required" }),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().int().min(0, { message: "Discount value must be a non-negative integer" }),
      minOrderAmount: z.number().int().default(0),
      maxDiscount: z.number().int().optional(),
      usageLimit: z.number().int().optional(),
      validFrom: z.preprocess((arg) => new Date(arg), z.date()),
      validUntil: z.preprocess((arg) => new Date(arg), z.date()),
      isActive: z.boolean().default(true)
    }).omit({
      id: true,
      usedCount: true,
      createdAt: true
    });
    insertReferralSchema = createInsertSchema(referrals, {
      referrerId: z.string().min(1, { message: "Referrer ID is required" }),
      referredId: z.string().min(1, { message: "Referred ID is required" }),
      referralCode: z.string().min(1, { message: "Referral code is required" }),
      status: z.enum(["pending", "completed", "expired"]).default("pending"),
      referrerBonus: z.number().int().default(0),
      referredBonus: z.number().int().default(0),
      referredOrderCompleted: z.boolean().default(false)
    }).omit({
      id: true,
      createdAt: true,
      completedAt: true
    });
    insertWalletTransactionSchema = createInsertSchema(walletTransactions, {
      userId: z.string().min(1, { message: "User ID is required" }),
      amount: z.number({ message: "Amount is required" }),
      type: z.enum(["credit", "debit", "referral_bonus", "order_discount"]),
      description: z.string().min(1, { message: "Description is required" }),
      referenceId: z.string().optional(),
      referenceType: z.string().optional(),
      balanceBefore: z.number({ message: "Balance before is required" }),
      balanceAfter: z.number({ message: "Balance after is required" })
    }).omit({
      id: true,
      createdAt: true
    });
    insertReferralRewardSchema = createInsertSchema(referralRewards, {
      name: z.string().min(1, { message: "Reward name is required" }),
      referrerBonus: z.number().int().default(50),
      referredBonus: z.number().int().default(50),
      minOrderAmount: z.number().int().default(0),
      maxReferralsPerMonth: z.number().int().default(10),
      maxEarningsPerMonth: z.number().int().default(500),
      expiryDays: z.number().int().default(30),
      isActive: z.boolean().default(true)
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    deliveryTimeSlots = pgTable("delivery_time_slots", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      startTime: varchar("start_time", { length: 5 }).notNull(),
      endTime: varchar("end_time", { length: 5 }).notNull(),
      label: varchar("label", { length: 100 }).notNull(),
      capacity: integer("capacity").notNull().default(50),
      currentOrders: integer("current_orders").notNull().default(0),
      // Optional per-slot cutoff in hours before the slot start when ordering must be placed
      cutoffHoursBefore: integer("cutoff_hours_before"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    });
    insertDeliveryTimeSlotsSchema = createInsertSchema(deliveryTimeSlots, {
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      label: z.string().min(1, "Label is required"),
      capacity: z.number().int().min(1, "Capacity must be at least 1"),
      isActive: z.boolean().default(true),
      cutoffHoursBefore: z.number().int().min(0, "Cutoff hours must be a whole number (0, 1, 2, etc.)").optional()
    }).omit({
      id: true,
      currentOrders: true,
      createdAt: true,
      updatedAt: true
    });
    rotiSettings = pgTable("roti_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      morningBlockStartTime: varchar("morning_block_start_time", { length: 5 }).notNull().default("08:00"),
      morningBlockEndTime: varchar("morning_block_end_time", { length: 5 }).notNull().default("11:00"),
      lastOrderTime: varchar("last_order_time", { length: 5 }).notNull().default("23:00"),
      blockMessage: text("block_message").notNull().default("Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery."),
      prepareWindowHours: integer("prepare_window_hours").notNull().default(2),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    });
    insertRotiSettingsSchema = createInsertSchema(rotiSettings, {
      morningBlockStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
      morningBlockEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
      lastOrderTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
      blockMessage: z.string().min(1, "Block message is required"),
      prepareWindowHours: z.number().int().min(1, "Prepare window must be at least 1 hour").max(24, "Prepare window cannot exceed 24 hours"),
      isActive: z.boolean().default(true)
    }).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    visitors = pgTable("visitors", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id"),
      // null if not logged in
      sessionId: varchar("session_id"),
      // unique session identifier
      page: text("page"),
      // e.g., "/", "/subscriptions", "/orders"
      userAgent: text("user_agent"),
      ipAddress: text("ip_address"),
      referrer: text("referrer"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertVisitorSchema = createInsertSchema(visitors).omit({
      id: true,
      createdAt: true
    });
    deliveryAreas = pgTable("delivery_areas", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      pincodes: text("pincodes").array().default(sql`ARRAY[]::text[]`),
      latitude: real("latitude"),
      longitude: real("longitude"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertDeliveryAreasSchema = createInsertSchema(deliveryAreas).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    adminSettings = pgTable("admin_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      key: varchar("key", { length: 255 }).notNull().unique(),
      value: text("value").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    pushSubscriptions = pgTable(
      "push_subscriptions",
      {
        id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
        userId: varchar("user_id").notNull(),
        // Can be admin_id, chef_id, delivery_id, or user_id
        userType: varchar("user_type", { length: 50 }).notNull(),
        // 'admin' | 'chef' | 'delivery' | 'customer'
        deviceType: varchar("device_type", { length: 50 }).default("web"),
        // Always 'web' for now
        subscription: jsonb("subscription").notNull(),
        // Contains: { endpoint, keys: { p256dh, auth } }
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        lastActivatedAt: timestamp("last_activated_at").notNull().defaultNow()
      },
      (table) => [
        index("idx_push_subscriptions_user").on(table.userId, table.userType),
        index("idx_push_subscriptions_active").on(table.isActive)
      ]
    );
    insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
      id: true,
      createdAt: true,
      lastActivatedAt: true
    });
    newsletterSubscribers = pgTable("newsletter_subscribers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email", { length: 255 }).notNull().unique(),
      isActive: boolean("is_active").notNull().default(true),
      subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
      unsubscribedAt: timestamp("unsubscribed_at")
    });
    pendingBroadcasts = pgTable("pending_broadcasts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      recipientId: varchar("recipient_id").notNull(),
      // chefId or deliveryPersonId
      recipientType: varchar("recipient_type", { length: 20 }).notNull(),
      // "chef" or "delivery"
      eventType: varchar("event_type", { length: 50 }).notNull(),
      // "new_order", "order_update", "new_prepared_order", etc.
      payload: jsonb("payload").notNull(),
      // The broadcast message JSON string or object
      isDelivered: boolean("is_delivered").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => [
      index("IDX_pending_broadcasts_recipient").on(table.recipientId, table.recipientType, table.isDelivered)
    ]);
    insertPendingBroadcastSchema = createInsertSchema(pendingBroadcasts).omit({
      id: true,
      createdAt: true
    });
  }
});

// shared/db.ts
var db_exports = {};
__export(db_exports, {
  adminSettings: () => adminSettings2,
  adminUsers: () => adminUsers2,
  cartSettings: () => cartSettings2,
  categories: () => categories2,
  chefs: () => chefs2,
  couponUsages: () => couponUsages2,
  coupons: () => coupons2,
  db: () => db,
  deliveryAreas: () => deliveryAreas2,
  deliveryPersonnel: () => deliveryPersonnel2,
  deliverySettings: () => deliverySettings2,
  deliveryTimeSlots: () => deliveryTimeSlots2,
  newsletterSubscribers: () => newsletterSubscribers2,
  orders: () => orders2,
  partnerUsers: () => partnerUsers2,
  pendingBroadcasts: () => pendingBroadcasts2,
  products: () => products2,
  promotionalBanners: () => promotionalBanners2,
  referralRewards: () => referralRewards2,
  referrals: () => referrals2,
  rotiSettings: () => rotiSettings2,
  sessions: () => sessions2,
  sql: () => sql2,
  subscriptionDeliveryLogs: () => subscriptionDeliveryLogs2,
  subscriptionPlans: () => subscriptionPlans2,
  subscriptions: () => subscriptions2,
  users: () => users2,
  visitors: () => visitors2,
  walletSettings: () => walletSettings2,
  walletTransactions: () => walletTransactions2
});
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql as sql2 } from "drizzle-orm";
var connectionString, pool, db, users2, sessions2, categories2, products2, orders2, chefs2, adminUsers2, partnerUsers2, subscriptions2, subscriptionPlans2, subscriptionDeliveryLogs2, deliverySettings2, cartSettings2, deliveryPersonnel2, coupons2, couponUsages2, referrals2, walletTransactions2, walletSettings2, referralRewards2, promotionalBanners2, deliveryTimeSlots2, rotiSettings2, visitors2, deliveryAreas2, adminSettings2, newsletterSubscribers2, pendingBroadcasts2;
var init_db = __esm({
  "shared/db.ts"() {
    "use strict";
    init_schema();
    connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString
    });
    db = drizzle(pool, { schema: schema_exports });
    ({
      users: users2,
      sessions: sessions2,
      categories: categories2,
      products: products2,
      orders: orders2,
      chefs: chefs2,
      adminUsers: adminUsers2,
      partnerUsers: partnerUsers2,
      subscriptions: subscriptions2,
      subscriptionPlans: subscriptionPlans2,
      subscriptionDeliveryLogs: subscriptionDeliveryLogs2,
      deliverySettings: deliverySettings2,
      cartSettings: cartSettings2,
      deliveryPersonnel: deliveryPersonnel2,
      coupons: coupons2,
      couponUsages: couponUsages2,
      referrals: referrals2,
      walletTransactions: walletTransactions2,
      walletSettings: walletSettings2,
      referralRewards: referralRewards2,
      promotionalBanners: promotionalBanners2,
      deliveryTimeSlots: deliveryTimeSlots2,
      rotiSettings: rotiSettings2,
      visitors: visitors2,
      deliveryAreas: deliveryAreas2,
      adminSettings: adminSettings2,
      newsletterSubscribers: newsletterSubscribers2,
      pendingBroadcasts: pendingBroadcasts2
    } = schema_exports);
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MemStorage: () => MemStorage,
  storage: () => storage
});
import { randomUUID as randomUUID2 } from "crypto";
import { nanoid } from "nanoid";
import { eq, and, gte, desc, asc, or, isNull, sql as sql3, count, lt } from "drizzle-orm";
function convertDateForDB(value) {
  if (value === null || value === void 0) return null;
  if (typeof value === "string") {
    const date = new Date(value);
    const timestamp2 = date.getTime();
    if (isNaN(timestamp2)) return null;
    return date;
  }
  if (value instanceof Date) {
    const timestamp2 = value.getTime();
    if (isNaN(timestamp2)) return null;
    return value;
  }
  return null;
}
function serializeSubscription(sub) {
  if (!sub) return sub;
  const serialized = { ...sub };
  const convertDateField = (dateValue, fieldName = "unknown") => {
    if (!dateValue) {
      console.log(`[CONVERT-FIELD] ${fieldName}: null/empty input, returning null`);
      return null;
    }
    try {
      console.log(`[CONVERT-FIELD] ${fieldName}: type=${typeof dateValue}, isDate=${dateValue instanceof Date}, value=${dateValue}`);
      if (typeof dateValue === "string") {
        const dateObj2 = new Date(dateValue);
        const timestamp3 = dateObj2.getTime();
        const year2 = dateObj2.getFullYear();
        console.log(`[CONVERT-FIELD] ${fieldName} (string): timestamp=${timestamp3}, isNaN=${isNaN(timestamp3)}, year=${year2}`);
        if (!isNaN(timestamp3) && year2 >= 1980 && year2 <= 2100) {
          console.log(`[CONVERT-FIELD] ${fieldName}: returning ISO string as-is`);
          return dateValue;
        }
        console.log(`[CONVERT-FIELD] ${fieldName}: invalid string date, returning null`);
        return null;
      }
      const dateObj = new Date(dateValue);
      const timestamp2 = dateObj.getTime();
      const year = dateObj.getFullYear();
      console.log(`[CONVERT-FIELD] ${fieldName} (Date obj): timestamp=${timestamp2}, isNaN=${isNaN(timestamp2)}, year=${year}`);
      if (!isNaN(timestamp2)) {
        if (year >= 1980 && year <= 2100) {
          const isoStr = dateObj.toISOString();
          console.log(`[CONVERT-FIELD] ${fieldName}: returning ISO string: ${isoStr}`);
          return isoStr;
        }
        console.log(`[CONVERT-FIELD] ${fieldName}: year out of range (${year}), returning null`);
      }
      console.log(`[CONVERT-FIELD] ${fieldName}: invalid date or NaN, returning null`);
      return null;
    } catch (e) {
      console.log(`[CONVERT-FIELD] ${fieldName}: exception caught, returning null`, e);
      return null;
    }
  };
  serialized.startDate = convertDateField(serialized.startDate, "startDate");
  serialized.endDate = convertDateField(serialized.endDate, "endDate");
  serialized.nextDeliveryDate = convertDateField(serialized.nextDeliveryDate, "nextDeliveryDate");
  serialized.lastDeliveryDate = convertDateField(serialized.lastDeliveryDate, "lastDeliveryDate");
  serialized.chefAssignedAt = convertDateField(serialized.chefAssignedAt, "chefAssignedAt");
  serialized.pauseStartDate = convertDateField(serialized.pauseStartDate, "pauseStartDate");
  serialized.pauseResumeDate = convertDateField(serialized.pauseResumeDate, "pauseResumeDate");
  serialized.createdAt = convertDateField(serialized.createdAt, "createdAt");
  serialized.updatedAt = convertDateField(serialized.updatedAt, "updatedAt");
  if (serialized.nextDeliveryDate === null) {
    console.warn(`[SERIALIZE] ${serialized.id}: nextDeliveryDate is NULL after conversion`);
  } else {
    const dateObj = new Date(serialized.nextDeliveryDate);
    const year = dateObj.getFullYear();
    if (year === 1970) {
      console.error(`[SERIALIZE] ${serialized.id}: nextDeliveryDate is 1970! This should not happen.`);
      console.error(`  Raw value: ${serialized.nextDeliveryDate}`);
      console.error(`  Original input: ${sub.nextDeliveryDate}`);
    }
  }
  return serialized;
}
var MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    MemStorage = class {
      users;
      categories = /* @__PURE__ */ new Map();
      chefsData = /* @__PURE__ */ new Map();
      // Renamed from 'chefs' to 'chefsData' for clarity
      products = /* @__PURE__ */ new Map();
      orders = /* @__PURE__ */ new Map();
      adminUsers = /* @__PURE__ */ new Map();
      subscriptionPlans = /* @__PURE__ */ new Map();
      subscriptions = /* @__PURE__ */ new Map();
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.categories = /* @__PURE__ */ new Map();
        this.chefsData = /* @__PURE__ */ new Map();
        this.products = /* @__PURE__ */ new Map();
        this.orders = /* @__PURE__ */ new Map();
        this.adminUsers = /* @__PURE__ */ new Map();
        this.subscriptionPlans = /* @__PURE__ */ new Map();
        this.subscriptions = /* @__PURE__ */ new Map();
      }
      async getUser(id) {
        return db.query.users.findFirst({ where: (u, { eq: eq7 }) => eq7(u.id, id) });
      }
      async getUserByPhone(phone) {
        return db.query.users.findFirst({ where: (user, { eq: eq7 }) => eq7(user.phone, phone) });
      }
      async createUser(userData) {
        const id = randomUUID2();
        const referralCode = userData.referralCode || `REF${nanoid(8).toUpperCase()}`;
        const user = {
          ...userData,
          referralCode,
          id,
          lastLoginAt: null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await db.insert(users2).values(user);
        console.log(`\u2705 User created with auto-generated referral code: ${referralCode}`);
        return user;
      }
      async updateUserLastLogin(id) {
        await db.update(users2).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(users2.id, id));
      }
      async updateUser(id, userData) {
        await db.update(users2).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users2.id, id));
        return this.getUser(id);
      }
      async getOrdersByUserId(userId) {
        return db.query.orders.findMany({
          where: (order, { eq: eq7 }) => eq7(order.userId, userId),
          orderBy: (order, { desc: desc2 }) => [desc2(order.createdAt)]
        });
      }
      async deleteUser(id) {
        await db.delete(users2).where(eq(users2.id, id));
        return true;
      }
      async getAllCategories() {
        return db.query.categories.findMany({
          orderBy: (c, { asc: asc2 }) => [asc2(c.displayOrder)]
        });
      }
      async getCategoryById(id) {
        return db.query.categories.findFirst({ where: (c, { eq: eq7 }) => eq7(c.id, id) });
      }
      async createCategory(insertCategory) {
        const id = randomUUID2();
        const category = { requiresDeliverySlot: false, displayOrder: 999, ...insertCategory, id };
        await db.insert(categories2).values(category);
        return category;
      }
      async updateCategory(id, updateData) {
        await db.update(categories2).set(updateData).where(eq(categories2.id, id));
        return this.getCategoryById(id);
      }
      async deleteCategory(id) {
        await db.delete(categories2).where(eq(categories2.id, id));
        return true;
      }
      async reorderCategories(items) {
        await db.transaction(async (tx) => {
          for (const item of items) {
            await tx.update(categories2).set({ displayOrder: item.displayOrder }).where(eq(categories2.id, item.id));
          }
        });
      }
      async getAllProducts() {
        return db.query.products.findMany();
      }
      async getProductById(id) {
        return db.query.products.findFirst({ where: (p, { eq: eq7 }) => eq7(p.id, id) });
      }
      async getProductsByCategoryId(categoryId) {
        return db.query.products.findMany({ where: (p, { eq: eq7 }) => eq7(p.categoryId, categoryId) });
      }
      async createProduct(insertProduct) {
        const id = randomUUID2();
        const marginPercent = insertProduct.marginPercent !== void 0 ? typeof insertProduct.marginPercent === "number" ? insertProduct.marginPercent.toString() : insertProduct.marginPercent : "0";
        const product = {
          ...insertProduct,
          id,
          rating: insertProduct.rating || "4.5",
          reviewCount: insertProduct.reviewCount || 0,
          isVeg: insertProduct.isVeg !== void 0 ? insertProduct.isVeg : true,
          isCustomizable: insertProduct.isCustomizable !== void 0 ? insertProduct.isCustomizable : false,
          chefId: insertProduct.chefId || null,
          stockQuantity: insertProduct.stockQuantity !== void 0 ? insertProduct.stockQuantity : 100,
          lowStockThreshold: insertProduct.lowStockThreshold !== void 0 ? insertProduct.lowStockThreshold : 20,
          isAvailable: insertProduct.isAvailable !== void 0 ? insertProduct.isAvailable : true,
          offerPercentage: insertProduct.offerPercentage ?? 0,
          hotelPrice: insertProduct.hotelPrice ?? 0,
          marginPercent
        };
        await db.insert(products2).values(product);
        return product;
      }
      async updateProduct(id, updateData) {
        const sanitizedData = { ...updateData };
        if (sanitizedData.marginPercent !== void 0 && typeof sanitizedData.marginPercent === "number") {
          sanitizedData.marginPercent = sanitizedData.marginPercent.toString();
        }
        await db.update(products2).set(sanitizedData).where(eq(products2.id, id));
        return this.getProductById(id);
      }
      async deleteProduct(id) {
        await db.delete(products2).where(eq(products2.id, id));
        return true;
      }
      async createOrder(insertOrder) {
        const id = randomUUID2();
        const orderData = {
          id,
          customerName: insertOrder.customerName,
          phone: insertOrder.phone,
          email: insertOrder.email || null,
          address: insertOrder.address,
          // Structured address fields
          addressBuilding: insertOrder.addressBuilding || null,
          addressStreet: insertOrder.addressStreet || null,
          addressArea: insertOrder.addressArea || null,
          addressCity: insertOrder.addressCity || null,
          addressPincode: insertOrder.addressPincode || null,
          items: insertOrder.items,
          subtotal: insertOrder.subtotal,
          deliveryFee: insertOrder.deliveryFee,
          discount: insertOrder.discount || 0,
          couponCode: insertOrder.couponCode || null,
          total: insertOrder.total,
          status: insertOrder.paymentStatus || "pending",
          paymentStatus: "pending",
          paymentQrShown: true,
          chefId: insertOrder.chefId || null,
          chefName: insertOrder.chefName || null,
          userId: insertOrder.userId ? insertOrder.userId : null,
          categoryId: insertOrder.categoryId || null,
          categoryName: insertOrder.categoryName || null,
          deliveryTime: insertOrder.deliveryTime || null,
          deliverySlotId: insertOrder.deliverySlotId || null,
          deliveryDate: insertOrder.deliveryDate || null,
          walletAmountUsed: insertOrder.walletAmountUsed || 0,
          createdAt: /* @__PURE__ */ new Date()
        };
        try {
          const [createdOrder] = await db.insert(orders2).values(orderData).returning();
          return createdOrder;
        } catch (error) {
          if (error.code === "23503" && error.message.includes("user_id")) {
            console.warn("Foreign key constraint for userId - creating order without userId reference");
            orderData.userId = null;
            const [createdOrder] = await db.insert(orders2).values(orderData).returning();
            return createdOrder;
          }
          throw error;
        }
      }
      async getOrderById(id) {
        return db.query.orders.findFirst({ where: (o, { eq: eq7 }) => eq7(o.id, id) });
      }
      async getAllOrders() {
        return db.query.orders.findMany();
      }
      async updateOrderStatus(id, status) {
        const [order] = await db.update(orders2).set({ status }).where(eq(orders2.id, id)).returning();
        return order || void 0;
      }
      async updateOrderPaymentStatus(id, paymentStatus) {
        const [order] = await db.update(orders2).set({ paymentStatus }).where(eq(orders2.id, id)).returning();
        return order || void 0;
      }
      async deleteOrder(id) {
        await db.delete(orders2).where(eq(orders2.id, id));
      }
      async getChefs() {
        const result = await db.select().from(chefs2);
        return result.map((chef) => ({
          ...chef,
          latitude: chef.latitude ?? 19.0728,
          longitude: chef.longitude ?? 72.8826
        }));
      }
      async getChefById(id) {
        const chef = await db.query.chefs.findFirst({ where: (c, { eq: eq7 }) => eq7(c.id, id) });
        return chef || null;
      }
      async getChefsByCategory(categoryId) {
        return db.query.chefs.findMany({ where: (c, { eq: eq7 }) => eq7(c.categoryId, categoryId) });
      }
      async createChef(data) {
        const id = nanoid();
        const chefData = {
          id,
          name: data.name,
          description: data.description,
          image: data.image,
          rating: data.rating,
          reviewCount: data.reviewCount,
          categoryId: data.categoryId,
          address: data.address || null,
          // Full address string
          addressBuilding: data.addressBuilding || null,
          addressStreet: data.addressStreet || null,
          addressArea: data.addressArea || null,
          addressCity: data.addressCity || "Mumbai",
          addressPincode: data.addressPincode || null,
          latitude: data.latitude ?? 19.0728,
          longitude: data.longitude ?? 72.8826,
          isActive: data.isActive !== false,
          defaultDeliveryFee: data.defaultDeliveryFee ?? 20,
          deliveryFeePerKm: data.deliveryFeePerKm ?? 5,
          freeDeliveryThreshold: data.freeDeliveryThreshold ?? 200,
          servicePincodes: data.servicePincodes || null,
          maxDeliveryDistanceKm: data.maxDeliveryDistanceKm ?? 5,
          isVerified: data.isVerified === true
        };
        await db.insert(chefs2).values(chefData);
        const created = await this.getChefById(id);
        return created || chefData;
      }
      async updateChef(id, data) {
        const updateData = {};
        if (data.name !== void 0) updateData.name = data.name;
        if (data.description !== void 0) updateData.description = data.description;
        if (data.image !== void 0) updateData.image = data.image;
        if (data.rating !== void 0) updateData.rating = data.rating;
        if (data.reviewCount !== void 0) updateData.reviewCount = data.reviewCount;
        if (data.categoryId !== void 0) updateData.categoryId = data.categoryId;
        if (data.address !== void 0) updateData.address = data.address;
        if (data.addressBuilding !== void 0) updateData.addressBuilding = data.addressBuilding;
        if (data.addressStreet !== void 0) updateData.addressStreet = data.addressStreet;
        if (data.addressArea !== void 0) updateData.addressArea = data.addressArea;
        if (data.addressCity !== void 0) updateData.addressCity = data.addressCity;
        if (data.addressPincode !== void 0) updateData.addressPincode = data.addressPincode;
        if (data.latitude !== void 0) updateData.latitude = data.latitude;
        if (data.longitude !== void 0) updateData.longitude = data.longitude;
        if (data.isActive !== void 0) updateData.isActive = data.isActive;
        if (data.defaultDeliveryFee !== void 0) updateData.defaultDeliveryFee = data.defaultDeliveryFee;
        if (data.deliveryFeePerKm !== void 0) updateData.deliveryFeePerKm = data.deliveryFeePerKm;
        if (data.freeDeliveryThreshold !== void 0) updateData.freeDeliveryThreshold = data.freeDeliveryThreshold;
        if (data.maxDeliveryDistanceKm !== void 0) updateData.maxDeliveryDistanceKm = data.maxDeliveryDistanceKm;
        if (data.servicePincodes !== void 0) updateData.servicePincodes = data.servicePincodes;
        if (data.isVerified !== void 0) updateData.isVerified = data.isVerified;
        console.log("\u{1F525} updateChef() - Received data:", { id, incomingMaxDeliveryDistanceKm: data.maxDeliveryDistanceKm, servicePincodes: data.servicePincodes, updateData });
        await db.update(chefs2).set(updateData).where(eq(chefs2.id, id));
        const chef = await this.getChefById(id);
        return chef || void 0;
      }
      async deleteChef(id) {
        await db.delete(chefs2).where(eq(chefs2.id, id));
        return true;
      }
      async getAdminByUsername(username) {
        return db.query.adminUsers.findFirst({ where: (admin, { eq: eq7 }) => eq7(admin.username, username) });
      }
      async getAdminById(id) {
        return db.query.adminUsers.findFirst({ where: (admin, { eq: eq7 }) => eq7(admin.id, id) });
      }
      async createAdmin(adminData) {
        const id = randomUUID2();
        const admin = {
          id,
          username: adminData.username,
          email: adminData.email,
          phone: null,
          passwordHash: adminData.passwordHash,
          role: adminData.role || "viewer",
          lastLoginAt: null,
          createdAt: /* @__PURE__ */ new Date()
        };
        await db.insert(adminUsers2).values(admin);
        return admin;
      }
      async updateAdminLastLogin(id) {
        await db.update(adminUsers2).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(adminUsers2.id, id));
      }
      async updateAdminRole(id, role) {
        await db.update(adminUsers2).set({ role }).where(eq(adminUsers2.id, id));
        return this.getAdminById(id);
      }
      async updateAdminPassword(id, passwordHash) {
        await db.update(adminUsers2).set({ passwordHash }).where(eq(adminUsers2.id, id));
      }
      async deleteAdmin(id) {
        await db.delete(adminUsers2).where(eq(adminUsers2.id, id));
        return true;
      }
      async getAllAdmins() {
        return db.query.adminUsers.findMany();
      }
      async getAllUsers() {
        return db.query.users.findMany();
      }
      async getPartnerByUsername(username) {
        try {
          const trimmedUsername = username.trim().toLowerCase();
          const result = await db.select().from(partnerUsers2).where(eq(partnerUsers2.username, trimmedUsername)).limit(1);
          return result[0] || null;
        } catch (error) {
          console.error("Error getting partner by username:", error);
          return null;
        }
      }
      async getPartnerById(id) {
        const partner = await db.query.partnerUsers.findFirst({ where: (p, { eq: eq7 }) => eq7(p.id, id) });
        return partner || null;
      }
      async createPartner(data) {
        try {
          const id = randomUUID2();
          const newPartner = {
            id,
            ...data,
            createdAt: /* @__PURE__ */ new Date(),
            lastLoginAt: null
          };
          await db.insert(partnerUsers2).values(newPartner);
          return newPartner;
        } catch (error) {
          console.error("DB error creating partner:", error?.message || error);
          if (error?.code) console.error("DB error code:", error.code);
          if (error?.detail) console.error("DB error detail:", error.detail);
          if (error?.stack) console.error(error.stack);
          throw error;
        }
      }
      async updatePartner(id, data) {
        await db.update(partnerUsers2).set(data).where(eq(partnerUsers2.id, id));
      }
      async updatePartnerLastLogin(id) {
        await db.update(partnerUsers2).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(partnerUsers2.id, id));
      }
      async getOrdersByChefId(chefId) {
        const orderRecords = await db.select().from(orders2).where(
          and(
            eq(orders2.chefId, chefId),
            eq(orders2.paymentStatus, "confirmed")
          )
        ).orderBy(desc(orders2.createdAt));
        return orderRecords.map(this.mapOrder);
      }
      async getPartnerDashboardMetrics(chefId) {
        const chefOrders = await this.getOrdersByChefId(chefId);
        const totalOrders = chefOrders.length;
        const totalRevenue = chefOrders.reduce((sum, order) => sum + order.total, 0);
        const statusCounts = chefOrders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = chefOrders.filter(
          (order) => new Date(order.createdAt) >= today
        ).length;
        return {
          totalOrders,
          totalRevenue,
          pendingOrders: statusCounts.pending || 0,
          completedOrders: statusCounts.completed || 0,
          todayOrders,
          statusBreakdown: statusCounts
        };
      }
      async getDashboardMetrics() {
        const orders3 = await db.query.orders.findMany();
        const users3 = await db.query.users.findMany();
        const totalRevenue = orders3.reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = orders3.filter((o) => o.status === "pending").length;
        const completedOrders = orders3.filter((o) => o.status === "delivered" || o.status === "completed").length;
        return {
          userCount: users3.length,
          orderCount: orders3.length,
          totalRevenue,
          pendingOrders,
          completedOrders
        };
      }
      // Coupons
      async verifyCoupon(code, orderAmount, userId) {
        const coupon = await db.query.coupons.findFirst({
          where: (coupons3, { eq: eq7, and: and3 }) => and3(eq7(coupons3.code, code.toUpperCase()), eq7(coupons3.isActive, true))
        });
        if (!coupon) throw new Error("Invalid coupon code");
        console.log("\u{1F9FE} Coupon validity check:", {
          now: (/* @__PURE__ */ new Date()).toISOString(),
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil
        });
        const now = Date.now();
        const validFrom = new Date(coupon.validFrom).getTime();
        const validUntil = new Date(coupon.validUntil).getTime();
        if (isNaN(validFrom) || isNaN(validUntil)) {
          throw new Error("Invalid coupon date format");
        }
        if (now < validFrom) throw new Error("Coupon not active yet");
        if (now > validUntil) throw new Error("Coupon has expired");
        if (orderAmount < coupon.minOrderAmount) {
          throw new Error(`Minimum order amount of \u20B9${coupon.minOrderAmount} required`);
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new Error("Coupon usage limit reached");
        }
        if (userId && coupon.perUserLimit) {
          const userUsageCount = await db.query.couponUsages.findMany({
            where: (usages, { eq: eq7, and: and3 }) => and3(eq7(usages.couponId, coupon.id), eq7(usages.userId, userId))
          });
          if (userUsageCount.length >= coupon.perUserLimit) {
            throw new Error(`You have already used this coupon ${coupon.perUserLimit} time(s)`);
          }
        }
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
          discountAmount = Math.floor(orderAmount * coupon.discountValue / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        return {
          code: coupon.code,
          discountAmount,
          discountType: coupon.discountType
        };
      }
      async recordCouponUsage(code, userId, orderId) {
        const coupon = await db.query.coupons.findFirst({
          where: (coupons3, { eq: eq7 }) => eq7(coupons3.code, code.toUpperCase())
        });
        if (coupon) {
          await db.insert(couponUsages2).values({
            id: randomUUID2(),
            couponId: coupon.id,
            userId,
            orderId: orderId || null,
            usedAt: /* @__PURE__ */ new Date()
          });
          await db.update(coupons2).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons2.code, code.toUpperCase()));
        }
      }
      async incrementCouponUsage(code) {
        const coupon = await db.query.coupons.findFirst({
          where: (coupons3, { eq: eq7 }) => eq7(coupons3.code, code.toUpperCase())
        });
        if (coupon) {
          await db.update(coupons2).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons2.code, code.toUpperCase()));
        }
      }
      async getCouponUserUsage(couponId, userId) {
        const usages = await db.query.couponUsages.findMany({
          where: (usages2, { eq: eq7, and: and3 }) => and3(eq7(usages2.couponId, couponId), eq7(usages2.userId, userId))
        });
        return usages.length;
      }
      async getCouponByCode(code) {
        const coupon = await db.query.coupons.findFirst({
          where: (coupons3, { eq: eq7 }) => eq7(coupons3.code, code.toUpperCase())
        });
        if (!coupon) return null;
        return {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscount,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          perUserLimit: coupon.perUserLimit,
          isActive: coupon.isActive,
          expiryDate: coupon.validUntil,
          validFrom: coupon.validFrom
        };
      }
      // Subscription Plans
      async getSubscriptionPlans() {
        return db.query.subscriptionPlans.findMany();
      }
      async getSubscriptionPlan(id) {
        return db.query.subscriptionPlans.findFirst({ where: (sp, { eq: eq7 }) => eq7(sp.id, id) });
      }
      async createSubscriptionPlan(data) {
        const id = randomUUID2();
        const plan = {
          ...data,
          id,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await db.insert(subscriptionPlans2).values(plan);
        return plan;
      }
      async updateSubscriptionPlan(id, data) {
        await db.update(subscriptionPlans2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptionPlans2.id, id));
        return this.getSubscriptionPlan(id);
      }
      async deleteSubscriptionPlan(id) {
        await db.delete(subscriptionPlans2).where(eq(subscriptionPlans2.id, id));
      }
      // Subscriptions
      async getSubscriptions() {
        const subs = await db.query.subscriptions.findMany();
        return subs.map(serializeSubscription);
      }
      async getSubscription(id) {
        const sub = await db.query.subscriptions.findFirst({ where: (s, { eq: eq7 }) => eq7(s.id, id) });
        if (sub) {
          console.log(`
[DB-DEBUG] getSubscription(${id}) - Raw DB response:`);
          console.log(`  startDate: type=${typeof sub.startDate}, value=${sub.startDate}, isDate=${sub.startDate instanceof Date}`);
          console.log(`  nextDeliveryDate: type=${typeof sub.nextDeliveryDate}, value=${sub.nextDeliveryDate}, isDate=${sub.nextDeliveryDate instanceof Date}`);
          console.log(`  originalPrice: type=${typeof sub.originalPrice}, value=${sub.originalPrice}`);
          if (sub.startDate instanceof Date) {
            console.log(`  startDate getTime()=${sub.startDate.getTime()}, year=${sub.startDate.getFullYear()}`);
          }
          if (sub.nextDeliveryDate instanceof Date) {
            console.log(`  nextDeliveryDate getTime()=${sub.nextDeliveryDate.getTime()}, year=${sub.nextDeliveryDate.getFullYear()}`);
          }
        }
        return sub ? serializeSubscription(sub) : void 0;
      }
      async createSubscription(data) {
        const id = randomUUID2();
        const now = /* @__PURE__ */ new Date();
        const insertData = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now
        };
        console.log(`[CREATE-SUB-DEBUG] Input nextDeliveryDate:`, {
          value: data.nextDeliveryDate,
          type: typeof data.nextDeliveryDate,
          isDate: data.nextDeliveryDate instanceof Date
        });
        insertData.startDate = convertDateForDB(insertData.startDate);
        insertData.endDate = convertDateForDB(insertData.endDate);
        insertData.nextDeliveryDate = convertDateForDB(insertData.nextDeliveryDate);
        insertData.lastDeliveryDate = convertDateForDB(insertData.lastDeliveryDate);
        insertData.chefAssignedAt = convertDateForDB(insertData.chefAssignedAt);
        insertData.pauseStartDate = convertDateForDB(insertData.pauseStartDate);
        insertData.pauseResumeDate = convertDateForDB(insertData.pauseResumeDate);
        insertData.createdAt = convertDateForDB(insertData.createdAt);
        insertData.updatedAt = convertDateForDB(insertData.updatedAt);
        console.log(`[CREATE-SUB-DEBUG] After conversion nextDeliveryDate:`, {
          value: insertData.nextDeliveryDate,
          type: typeof insertData.nextDeliveryDate,
          isDate: insertData.nextDeliveryDate instanceof Date
        });
        if (!insertData.nextDeliveryDate && insertData.startDate) {
          insertData.nextDeliveryDate = insertData.startDate;
          console.log(`[CREATE-SUB] nextDeliveryDate not provided, using startDate as default`);
        }
        if (!insertData.nextDeliveryDate) {
          insertData.nextDeliveryDate = now;
          console.log(`[CREATE-SUB] nextDeliveryDate still missing, defaulting to now`);
        }
        console.log(`[CREATE-SUB-DEBUG] Final insertData:`, {
          nextDeliveryDate: insertData.nextDeliveryDate,
          startDate: insertData.startDate,
          endDate: insertData.endDate
        });
        await db.insert(subscriptions2).values(insertData);
        const created = await this.getSubscription(id);
        return created;
      }
      /**
       * PHASE 2: Helper function to sync deliveryHistory when delivery status changes
       * Ensures both subscriptionDeliveryLogs and subscriptions.deliveryHistory stay in sync
       * 
       * @param subscriptionId - ID of the subscription
       * @param status - New delivery status ("delivered" | "missed" | "skipped")
       * @param deliveryDate - Date of the delivery (defaults to today)
       * @param notes - Optional notes about the delivery
       */
      async syncDeliveryHistory(subscriptionId, status, deliveryDate, notes) {
        try {
          const subscription = await this.getSubscription(subscriptionId);
          if (!subscription) {
            console.warn(`[SYNC-HISTORY] Subscription ${subscriptionId} not found`);
            return;
          }
          const deliveryHistory = subscription.deliveryHistory || [];
          const today = deliveryDate || /* @__PURE__ */ new Date();
          const newRecord = {
            date: today.toISOString(),
            status,
            notes: notes || void 0
          };
          const existingIndex = deliveryHistory.findIndex(
            (record) => {
              const recordDate = new Date(record.date);
              recordDate.setHours(0, 0, 0, 0);
              const compareDate = new Date(today);
              compareDate.setHours(0, 0, 0, 0);
              return recordDate.getTime() === compareDate.getTime();
            }
          );
          if (existingIndex >= 0) {
            deliveryHistory[existingIndex] = { ...deliveryHistory[existingIndex], ...newRecord };
          } else {
            deliveryHistory.push(newRecord);
          }
          await db.update(subscriptions2).set({
            deliveryHistory,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(subscriptions2.id, subscriptionId));
          console.log(`\u2705 [SYNC-HISTORY] Synced delivery history for ${subscriptionId}: status=${status}`);
        } catch (error) {
          console.error(`\u274C [SYNC-HISTORY] Error syncing delivery history:`, error);
        }
      }
      async updateSubscription(id, data) {
        const updateData = { ...data };
        console.log(`[UPDATE-SUB] Starting update for subscription ${id}`);
        console.log(`[UPDATE-SUB] Input data keys:`, Object.keys(updateData));
        const dateFields = ["startDate", "endDate", "nextDeliveryDate", "chefAssignedAt", "pauseStartDate", "pauseResumeDate", "lastDeliveryDate"];
        for (const fieldName of dateFields) {
          if (fieldName in updateData) {
            const value = updateData[fieldName];
            if (value === void 0 || value === null) {
              continue;
            }
            const converted = convertDateForDB(value);
            if (converted === null) {
              console.log(`[UPDATE-SUB] Conversion failed for ${fieldName}, removing from update`);
              delete updateData[fieldName];
            } else {
              console.log(`[UPDATE-SUB] ${fieldName}: ${typeof value} -> ${converted}`);
              updateData[fieldName] = converted;
            }
          }
        }
        updateData.updatedAt = /* @__PURE__ */ new Date();
        console.log(`[UPDATE-SUB] Final updateData:`, updateData);
        console.log(`[UPDATE-SUB] About to call db.update...`);
        await db.update(subscriptions2).set(updateData).where(eq(subscriptions2.id, id));
        console.log(`[UPDATE-SUB] Update successful, calling getSubscription...`);
        return this.getSubscription(id);
      }
      async deleteSubscription(id) {
        await db.delete(subscriptions2).where(eq(subscriptions2.id, id));
        return true;
      }
      async getSubscriptionsByUserId(userId) {
        const subs = await db.query.subscriptions.findMany({ where: (s, { eq: eq7 }) => eq7(s.userId, userId) });
        return subs.map(serializeSubscription);
      }
      // Get active subscriptions count for a chef
      async getActiveSubscriptionCountByChef(chefId) {
        const result = await db.query.subscriptions.findMany({
          where: (s, { and: and3, eq: eq7 }) => and3(
            eq7(s.chefId, chefId),
            eq7(s.status, "active")
          )
        });
        return result.length;
      }
      // Find the best available chef for a category (load balancing)
      async findBestChefForCategory(categoryId) {
        const activeChefs = await db.query.chefs.findMany({
          where: (c, { and: and3, eq: eq7 }) => and3(
            eq7(c.categoryId, categoryId),
            eq7(c.isActive, true)
          )
        });
        if (activeChefs.length === 0) {
          return null;
        }
        let bestChef = activeChefs[0];
        let minSubscriptions = await this.getActiveSubscriptionCountByChef(activeChefs[0].id);
        for (let i = 1; i < activeChefs.length; i++) {
          const chef = activeChefs[i];
          const subCount = await this.getActiveSubscriptionCountByChef(chef.id);
          if (subCount < minSubscriptions) {
            minSubscriptions = subCount;
            bestChef = chef;
          }
        }
        return bestChef;
      }
      // Assign chef to subscription
      async assignChefToSubscription(subscriptionId, chefId) {
        return this.updateSubscription(subscriptionId, {
          chefId,
          chefAssignedAt: /* @__PURE__ */ new Date()
        });
      }
      // Get active subscriptions by chef
      async getActiveSubscriptionsByChef(chefId) {
        const subs = await db.query.subscriptions.findMany({
          where: (s, { and: and3, eq: eq7 }) => and3(
            eq7(s.chefId, chefId),
            eq7(s.status, "active")
          )
        });
        return subs.map(serializeSubscription);
      }
      // Subscription Delivery Logs
      async getSubscriptionDeliveryLogs(subscriptionId) {
        return db.query.subscriptionDeliveryLogs.findMany({
          where: (log3, { eq: eq7 }) => eq7(log3.subscriptionId, subscriptionId),
          orderBy: (log3, { desc: desc2 }) => [desc2(log3.date)]
        });
      }
      async getSubscriptionDeliveryLogsByDate(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return db.query.subscriptionDeliveryLogs.findMany({
          where: (log3, { and: and3, gte: gte2, lte: lte2 }) => and3(
            gte2(log3.date, startOfDay),
            lte2(log3.date, endOfDay)
          )
        });
      }
      async getSubscriptionDeliveryLog(id) {
        return db.query.subscriptionDeliveryLogs.findFirst({ where: (log3, { eq: eq7 }) => eq7(log3.id, id) });
      }
      async createSubscriptionDeliveryLog(data) {
        const id = randomUUID2();
        const now = /* @__PURE__ */ new Date();
        const logData = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now
        };
        const insertData = { ...logData };
        insertData.date = convertDateForDB(insertData.date);
        insertData.createdAt = convertDateForDB(insertData.createdAt);
        insertData.updatedAt = convertDateForDB(insertData.updatedAt);
        await db.insert(subscriptionDeliveryLogs2).values(insertData);
        return logData;
      }
      async updateSubscriptionDeliveryLog(id, data) {
        const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
        if (updateData.date !== void 0) {
          updateData.date = convertDateForDB(updateData.date);
        }
        updateData.updatedAt = convertDateForDB(updateData.updatedAt);
        await db.update(subscriptionDeliveryLogs2).set(updateData).where(eq(subscriptionDeliveryLogs2.id, id));
        return this.getSubscriptionDeliveryLog(id);
      }
      async deleteSubscriptionDeliveryLog(id) {
        await db.delete(subscriptionDeliveryLogs2).where(eq(subscriptionDeliveryLogs2.id, id));
      }
      async getDeliveryLogBySubscriptionAndDate(subscriptionId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return db.query.subscriptionDeliveryLogs.findFirst({
          where: (log3, { and: and3, eq: eq7, gte: gte2, lte: lte2 }) => and3(
            eq7(log3.subscriptionId, subscriptionId),
            gte2(log3.date, startOfDay),
            lte2(log3.date, endOfDay)
          )
        });
      }
      async getSalesReport(from, to) {
        const allOrders = await db.query.orders.findMany();
        const filteredOrders = allOrders.filter((o) => {
          const createdAt = new Date(o.createdAt);
          return createdAt >= from && createdAt <= to;
        });
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        const productSales = /* @__PURE__ */ new Map();
        for (const order of filteredOrders) {
          for (const item of order.items) {
            const existing = productSales.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
            productSales.set(item.id, {
              name: item.name,
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + item.price * item.quantity
            });
          }
        }
        const topProducts = Array.from(productSales.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        return {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          topProducts,
          revenueChange: 0,
          ordersChange: 0
        };
      }
      async getUserReport(from, to) {
        const allUsers = await db.query.users.findMany();
        const newUsers = allUsers.filter((u) => u.createdAt && new Date(u.createdAt) >= from && new Date(u.createdAt) <= to);
        const topCustomers = [];
        return {
          totalUsers: allUsers.length,
          newUsers: newUsers.length,
          activeUsers: 0,
          userGrowth: 0,
          topCustomers
        };
      }
      async getInventoryReport() {
        const allProducts = await db.query.products.findMany();
        const allCategories = await db.query.categories.findMany();
        const categoryStats = allCategories.map((cat) => {
          const catProducts = allProducts.filter((p) => p.categoryId === cat.id);
          return {
            name: cat.name,
            productCount: catProducts.length,
            revenue: 0
          };
        });
        return {
          totalProducts: allProducts.length,
          lowStock: 0,
          outOfStock: 0,
          categories: categoryStats
        };
      }
      async getSubscriptionReport(from, to) {
        const subs = await db.select().from(subscriptions2);
        const plans = await db.select().from(subscriptionPlans2);
        const planStats = plans.map((plan) => {
          const planSubs = subs.filter((s) => s.planId === plan.id);
          return {
            id: plan.id,
            name: plan.name,
            subscriberCount: planSubs.length,
            revenue: planSubs.length * plan.price
          };
        });
        return {
          totalSubscriptions: subs.length,
          activeSubscriptions: subs.filter((s) => s.status === "active").length,
          pausedSubscriptions: subs.filter((s) => s.status === "paused").length,
          cancelledSubscriptions: subs.filter((s) => s.status === "cancelled").length,
          subscriptionRevenue: planStats.reduce((sum, p) => sum + p.revenue, 0),
          topPlans: planStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        };
      }
      async getDeliverySettings() {
        return db.query.deliverySettings.findMany({ where: (ds, { eq: eq7 }) => eq7(ds.isActive, true) });
      }
      async getDeliverySetting(id) {
        return db.query.deliverySettings.findFirst({ where: (ds, { eq: eq7 }) => eq7(ds.id, id) });
      }
      // NEW: Get delivery settings filtered by pincode
      async getDeliverySettingsByPincode(pincode) {
        return db.query.deliverySettings.findMany({
          where: (ds, { eq: eq7, and: and3, or: or2, isNull: isNull2 }) => and3(
            eq7(ds.isActive, true),
            or2(
              eq7(ds.pincode, pincode),
              // Exact pincode match
              isNull2(ds.pincode)
              // Settings with no pincode (apply to all)
            )
          )
        });
      }
      // NEW: Get best matching delivery setting for pincode and distance
      async getDeliverySettingByPincodeAndDistance(pincode, distance) {
        const settings = await this.getDeliverySettingsByPincode(pincode);
        for (const setting of settings) {
          const minDist = parseFloat(String(setting.minDistance));
          const maxDist = parseFloat(String(setting.maxDistance));
          if (distance >= minDist && distance <= maxDist) {
            return setting;
          }
        }
        if (settings.length > 0) {
          return settings[0];
        }
        return void 0;
      }
      async createDeliverySetting(data) {
        const id = randomUUID2();
        const setting = {
          ...data,
          id,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await db.insert(deliverySettings2).values(setting);
        return setting;
      }
      async updateDeliverySetting(id, data) {
        await db.update(deliverySettings2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(deliverySettings2.id, id));
        return this.getDeliverySetting(id);
      }
      async deleteDeliverySetting(id) {
        await db.delete(deliverySettings2).where(eq(deliverySettings2.id, id));
      }
      async getCartSettings() {
        return db.query.cartSettings.findMany({ where: (cs, { eq: eq7 }) => eq7(cs.isActive, true) });
      }
      async getCartSettingByCategoryId(categoryId) {
        return db.query.cartSettings.findFirst({ where: (cs, { eq: eq7 }) => eq7(cs.categoryId, categoryId) });
      }
      async createCartSetting(data) {
        const id = randomUUID2();
        let categoryName = data.categoryName;
        if (!categoryName) {
          const category = await this.getCategoryById(data.categoryId);
          if (!category) {
            throw new Error("Category not found");
          }
          categoryName = category.name;
        }
        const setting = {
          ...data,
          categoryName,
          id,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await db.insert(cartSettings2).values(setting);
        return setting;
      }
      async updateCartSetting(id, data) {
        let updateData = { ...data };
        if (data.categoryId && !data.categoryName) {
          const category = await this.getCategoryById(data.categoryId);
          if (category) {
            updateData.categoryName = category.name;
          }
        }
        await db.update(cartSettings2).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cartSettings2.id, id));
        return db.query.cartSettings.findFirst({ where: (cs, { eq: eq7 }) => eq7(cs.id, id) });
      }
      async deleteCartSetting(id) {
        await db.delete(cartSettings2).where(eq(cartSettings2.id, id));
      }
      async getDeliveryPersonnelByPhone(phone) {
        return db.query.deliveryPersonnel.findFirst({ where: (dp, { eq: eq7 }) => eq7(dp.phone, phone) });
      }
      async getDeliveryPersonnelById(id) {
        return db.query.deliveryPersonnel.findFirst({ where: (dp, { eq: eq7 }) => eq7(dp.id, id) });
      }
      async getDeliveryPersonnel(id) {
        return this.getDeliveryPersonnelById(id);
      }
      async getAllDeliveryPersonnel() {
        return db.query.deliveryPersonnel.findMany();
      }
      async getAvailableDeliveryPersonnel() {
        return db.query.deliveryPersonnel.findMany({
          where: (dp, { eq: eq7 }) => eq7(dp.isActive, true),
          orderBy: (dp, { asc: asc2 }) => [asc2(dp.status)]
          // Show "available" first
        });
      }
      async createDeliveryPersonnel(data) {
        const id = randomUUID2();
        const deliveryPerson = {
          id,
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          passwordHash: data.passwordHash,
          status: data.status || "available",
          currentLocation: data.currentLocation || null,
          isActive: true,
          totalDeliveries: 0,
          rating: "5.0",
          createdAt: /* @__PURE__ */ new Date(),
          lastLoginAt: null
        };
        await db.insert(deliveryPersonnel2).values(deliveryPerson);
        return deliveryPerson;
      }
      async updateDeliveryPersonnel(id, data) {
        await db.update(deliveryPersonnel2).set(data).where(eq(deliveryPersonnel2.id, id));
        return this.getDeliveryPersonnelById(id);
      }
      async updateDeliveryPersonnelLastLogin(id) {
        await db.update(deliveryPersonnel2).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(deliveryPersonnel2.id, id));
      }
      async deleteDeliveryPersonnel(id) {
        await db.delete(deliveryPersonnel2).where(eq(deliveryPersonnel2.id, id));
        return true;
      }
      async getAllPartners() {
        return await db.select().from(partnerUsers2);
      }
      async deletePartner(id) {
        await db.delete(partnerUsers2).where(eq(partnerUsers2.id, id));
        return true;
      }
      async approveOrder(orderId, approvedBy) {
        const [order] = await db.update(orders2).set({
          status: "approved",
          approvedBy,
          approvedAt: /* @__PURE__ */ new Date()
        }).where(eq(orders2.id, orderId)).returning();
        return order;
      }
      async acceptOrder(orderId, approvedBy) {
        const [order] = await db.update(orders2).set({
          status: "confirmed",
          paymentStatus: "confirmed",
          approvedBy,
          approvedAt: /* @__PURE__ */ new Date()
        }).where(eq(orders2.id, orderId)).returning();
        return order;
      }
      async rejectOrder(orderId, rejectedBy, reason) {
        const [order] = await db.update(orders2).set({
          status: "rejected",
          rejectedBy,
          rejectionReason: reason
        }).where(eq(orders2.id, orderId)).returning();
        return order;
      }
      async assignOrderToDeliveryPerson(orderId, deliveryPersonId) {
        try {
          const deliveryPerson = await this.getDeliveryPersonnelById(deliveryPersonId);
          if (!deliveryPerson) {
            throw new Error("Delivery person not found");
          }
          console.log(`\u{1F4E6} Assigning order ${orderId} to delivery person ${deliveryPerson.name} (${deliveryPerson.phone})`);
          const [updatedOrder] = await db.update(orders2).set({
            assignedTo: deliveryPersonId,
            assignedAt: /* @__PURE__ */ new Date(),
            deliveryPersonName: deliveryPerson.name,
            deliveryPersonPhone: deliveryPerson.phone
          }).where(eq(orders2.id, orderId)).returning();
          if (!updatedOrder) {
            throw new Error("Failed to update order");
          }
          await db.update(deliveryPersonnel2).set({ status: "busy" }).where(eq(deliveryPersonnel2.id, deliveryPersonId));
          console.log(`\u2705 Order ${orderId} assigned successfully. Delivery person: ${deliveryPerson.name} (${deliveryPerson.phone})`);
          console.log(`\u2705 Updated order fields - deliveryPersonName: ${updatedOrder.deliveryPersonName}, deliveryPersonPhone: ${updatedOrder.deliveryPersonPhone}`);
          return this.mapOrder(updatedOrder);
        } catch (error) {
          console.error("Error assigning order to delivery person:", error);
          throw error;
        }
      }
      async updateOrderPickup(orderId) {
        const [order] = await db.update(orders2).set({
          status: "out_for_delivery",
          pickedUpAt: /* @__PURE__ */ new Date()
        }).where(eq(orders2.id, orderId)).returning();
        return order;
      }
      async updateOrderDelivery(orderId) {
        const order = await this.getOrderById(orderId);
        if (!order) return void 0;
        const [updatedOrder] = await db.update(orders2).set({
          status: "delivered",
          deliveredAt: /* @__PURE__ */ new Date()
        }).where(eq(orders2.id, orderId)).returning();
        if (order.assignedTo) {
          await db.update(deliveryPersonnel2).set({
            status: "available",
            totalDeliveries: sql3`${deliveryPersonnel2.totalDeliveries} + 1`
          }).where(eq(deliveryPersonnel2.id, order.assignedTo));
        }
        return updatedOrder;
      }
      async getOrdersByDeliveryPerson(deliveryPersonId) {
        const orderRecords = await db.select().from(orders2).where(
          or(
            eq(orders2.assignedTo, deliveryPersonId),
            and(
              eq(orders2.status, "out_for_delivery"),
              isNull(orders2.assignedTo)
            )
          )
        ).orderBy(desc(orders2.createdAt));
        return orderRecords.map(this.mapOrder);
      }
      async getAdminDashboardMetrics() {
        const partners = await db.select().from(partnerUsers2);
        const delivery = await db.select().from(deliveryPersonnel2);
        return {
          partnerCount: partners.length,
          deliveryPersonnelCount: delivery.length
        };
      }
      async generateReferralCode(userId) {
        const code = `REF${nanoid(8).toUpperCase()}`;
        await db.update(users2).set({ referralCode: code }).where(eq(users2.id, userId));
        return code;
      }
      async createReferral(referrerId, referredId) {
        const referrer = await this.getUser(referrerId);
        if (!referrer?.referralCode) {
          throw new Error("Referrer does not have a referral code");
        }
        const referral = {
          referrerId,
          referredId,
          referralCode: referrer.referralCode,
          status: "pending",
          referrerBonus: 100,
          // ₹100 for referrer
          referredBonus: 50,
          // ₹50 for new user
          referredOrderCompleted: false
        };
        const [created] = await db.insert(referrals2).values(referral).returning();
        return created;
      }
      async applyReferralBonus(referralCode, newUserId) {
        await db.transaction(async (tx) => {
          const settings = await this.getActiveReferralReward();
          if (!settings?.isActive) {
            throw new Error("Referral system is currently disabled");
          }
          const referrer = await tx.query.users.findFirst({
            where: (u, { eq: eq7 }) => eq7(u.referralCode, referralCode)
          });
          if (!referrer) {
            throw new Error("Invalid referral code");
          }
          if (referrer.id === newUserId) {
            throw new Error("You cannot use your own referral code");
          }
          const newUser = await tx.query.users.findFirst({
            where: (u, { eq: eq7 }) => eq7(u.id, newUserId)
          });
          if (!newUser) {
            throw new Error("User not found");
          }
          const existingReferral = await tx.query.referrals.findFirst({
            where: (r, { eq: eq7 }) => eq7(r.referredId, newUserId)
          });
          if (existingReferral) {
            throw new Error("User already used a referral code");
          }
          const referrerBonus = settings?.referrerBonus || 50;
          const referredBonus = settings?.referredBonus || 50;
          const maxReferralsPerMonth = settings?.maxReferralsPerMonth || 10;
          const maxEarningsPerMonth = settings?.maxEarningsPerMonth || 500;
          const startOfMonth = /* @__PURE__ */ new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const monthlyReferrals = await tx.query.referrals.findMany({
            where: (r, { and: and3, eq: eqOp, gte: gteOp }) => and3(
              eqOp(r.referrerId, referrer.id),
              gteOp(r.createdAt, startOfMonth)
            )
          });
          if (monthlyReferrals.length >= maxReferralsPerMonth) {
            throw new Error(`Referrer has reached the monthly limit of ${maxReferralsPerMonth} referrals`);
          }
          const completedThisMonth = monthlyReferrals.filter((r) => r.status === "completed");
          const monthlyEarnings = completedThisMonth.reduce((sum, r) => sum + r.referrerBonus, 0);
          if (monthlyEarnings >= maxEarningsPerMonth) {
            throw new Error(`Referrer has reached the monthly earnings cap of \u20B9${maxEarningsPerMonth}`);
          }
          const referralData = {
            referrerId: referrer.id,
            referredId: newUserId,
            referralCode: referrer.referralCode,
            status: "pending",
            referrerBonus,
            referredBonus,
            referredOrderCompleted: false
          };
          const [referral] = await tx.insert(referrals2).values(referralData).returning();
          await this.createWalletTransaction({
            userId: newUserId,
            amount: referredBonus,
            type: "referral_bonus",
            description: `Welcome bonus for using ${referrer.name}'s referral code (${referralCode})`,
            referenceId: referral.id,
            referenceType: "referral"
          }, tx);
        });
      }
      // Complete referral when referred user places first order
      async completeReferralOnFirstOrder(userId, orderId) {
        await db.transaction(async (tx) => {
          const referral = await tx.query.referrals.findFirst({
            where: (r, { and: and3, eq: eqOp }) => and3(
              eqOp(r.referredId, userId),
              eqOp(r.status, "pending")
            )
          });
          if (!referral) {
            return;
          }
          const settings = await this.getActiveReferralReward();
          const expiryDays = settings?.expiryDays || 30;
          const maxEarningsPerMonth = settings?.maxEarningsPerMonth || 500;
          const referralDate = new Date(referral.createdAt);
          const expiryDate = new Date(referralDate);
          expiryDate.setDate(expiryDate.getDate() + expiryDays);
          if (/* @__PURE__ */ new Date() > expiryDate) {
            await tx.update(referrals2).set({ status: "expired" }).where(eq(referrals2.id, referral.id));
            return;
          }
          const startOfMonth = /* @__PURE__ */ new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const completedThisMonth = await tx.query.referrals.findMany({
            where: (r, { and: and3, eq: eqOp, gte: gteOp }) => and3(
              eqOp(r.referrerId, referral.referrerId),
              eqOp(r.status, "completed"),
              gteOp(r.createdAt, startOfMonth)
            )
          });
          const monthlyEarnings = completedThisMonth.reduce((sum, r) => sum + r.referrerBonus, 0);
          const canCreditBonus = monthlyEarnings + referral.referrerBonus <= maxEarningsPerMonth;
          if (canCreditBonus) {
            await this.createWalletTransaction({
              userId: referral.referrerId,
              amount: referral.referrerBonus,
              type: "referral_bonus",
              description: `Referral bonus - friend completed first order`,
              referenceId: referral.id,
              referenceType: "referral"
            }, tx);
          }
          await tx.update(referrals2).set({
            status: "completed",
            referredOrderCompleted: true,
            completedAt: /* @__PURE__ */ new Date(),
            referrerBonus: canCreditBonus ? referral.referrerBonus : 0
          }).where(eq(referrals2.id, referral.id));
        });
      }
      async getReferralsByUser(userId) {
        return db.query.referrals.findMany({
          where: (r, { eq: eq7 }) => eq7(r.referrerId, userId)
        });
      }
      async getReferralByReferredId(referredId) {
        const referral = await db.query.referrals.findFirst({
          where: (r, { eq: eq7 }) => eq7(r.referredId, referredId)
        });
        return referral || null;
      }
      async getUserWalletBalance(userId) {
        const user = await this.getUser(userId);
        return user?.walletBalance || 0;
      }
      async validateBonusEligibility(userId, orderTotal) {
        const referral = await db.query.referrals.findFirst({
          where: (r, { eq: eq7 }) => eq7(r.referredId, userId)
        });
        if (!referral) {
          return { eligible: false, bonus: 0, minOrderAmount: 0, reason: "No referral found for this user" };
        }
        if (referral.status !== "pending") {
          return { eligible: false, bonus: 0, minOrderAmount: 0, reason: `Referral is ${referral.status}, cannot claim bonus` };
        }
        const settings = await this.getActiveReferralReward();
        if (!settings?.isActive) {
          return { eligible: false, bonus: 0, minOrderAmount: 0, reason: "Referral system is disabled" };
        }
        const minOrderAmount = settings?.minOrderAmount || 0;
        const referredBonus = settings?.referredBonus || 50;
        if (orderTotal < minOrderAmount) {
          return {
            eligible: false,
            bonus: referredBonus,
            minOrderAmount,
            reason: `Minimum order amount \u20B9${minOrderAmount} required to claim bonus. Current order: \u20B9${orderTotal}`
          };
        }
        return { eligible: true, bonus: referredBonus, minOrderAmount };
      }
      async claimReferralBonusAtCheckout(userId, orderTotal, orderId) {
        const validation = await this.validateBonusEligibility(userId, orderTotal);
        if (!validation.eligible) {
          return {
            bonusClaimed: false,
            amount: 0,
            message: validation.reason || "Not eligible for bonus"
          };
        }
        await this.updateWalletBalance(userId, validation.bonus);
        await this.createWalletTransaction({
          userId,
          amount: validation.bonus,
          type: "referral_bonus_claimed",
          description: `Referral bonus claimed at checkout for order ${orderId}`,
          referenceId: orderId,
          referenceType: "order"
        });
        return {
          bonusClaimed: true,
          amount: validation.bonus,
          message: `\u20B9${validation.bonus} bonus claimed successfully!`
        };
      }
      async updateWalletBalance(userId, amount) {
        await db.update(users2).set({ walletBalance: sql3`${users2.walletBalance} + ${amount}` }).where(eq(users2.id, userId));
      }
      /**
       * Calculate delivery fee based on location availability and order amount
       * 
       * Logic:
       * 1. If user has location → Calculate fee based on distance
       * 2. If location not available → Use default delivery fee from chef settings
       * 3. Apply free delivery threshold if order amount qualifies
       * 
       * @param hasLocation - Whether geolocation is available
       * @param distance - Distance in km (null if no location)
       * @param orderAmount - Total order amount before delivery
       * @param chef - Chef object with delivery fee settings
       * @returns Delivery fee and free delivery flag
       */
      async calculateDeliveryFee(hasLocation, distance, orderAmount, chef) {
        const defaultFee = chef.defaultDeliveryFee || 20;
        const feePerKm = chef.deliveryFeePerKm || 5;
        const freeDeliveryThreshold = chef.freeDeliveryThreshold || 200;
        let deliveryFee = defaultFee;
        let isFreeDelivery = false;
        if (hasLocation && distance !== null && distance > 0) {
          deliveryFee = Math.ceil(distance * feePerKm);
        } else {
          deliveryFee = defaultFee;
        }
        if (orderAmount >= freeDeliveryThreshold) {
          isFreeDelivery = true;
          deliveryFee = 0;
        }
        console.log(`\u{1F4B0} [DELIVERY FEE] Calculated for order \u20B9${orderAmount}:`, {
          hasLocation,
          distance: distance ? `${distance.toFixed(1)} km` : "N/A",
          defaultFee,
          feePerKm,
          calculatedFee: isFreeDelivery ? 0 : deliveryFee,
          freeDeliveryThreshold,
          isFreeDelivery
        });
        return {
          deliveryFee,
          isFreeDelivery
        };
      }
      async createWalletTransaction(transaction, txClient) {
        if (transaction.amount <= 0) {
          throw new Error("Transaction amount must be positive");
        }
        console.log(`
\u{1F4B3} [STORAGE] createWalletTransaction called:`);
        console.log(`\u{1F4B3} [STORAGE]   Type: ${transaction.type}`);
        console.log(`\u{1F4B3} [STORAGE]   Amount: \u20B9${transaction.amount}`);
        console.log(`\u{1F4B3} [STORAGE]   Amount type: ${typeof transaction.amount}`);
        console.log(`\u{1F4B3} [STORAGE]   User ID: ${transaction.userId}`);
        const dbClient = txClient || db;
        const user = await dbClient.query.users.findFirst({
          where: eq(users2.id, transaction.userId)
        });
        if (!user) throw new Error("User not found");
        const balanceBefore = user.walletBalance;
        console.log(`\u{1F4B3} [STORAGE]   Read from DB - walletBalance: ${balanceBefore} (type: ${typeof balanceBefore})`);
        const amountChange = transaction.type === "debit" ? -transaction.amount : transaction.amount;
        console.log(`\u{1F4B3} [STORAGE]   AmountChange: ${amountChange}`);
        const balanceAfter = balanceBefore + amountChange;
        console.log(`\u{1F4B3} [STORAGE]   Calculation: ${balanceBefore} + ${amountChange} = ${balanceAfter}`);
        if (balanceAfter < 0) {
          throw new Error("Insufficient wallet balance");
        }
        await dbClient.insert(walletTransactions2).values({
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          referenceId: transaction.referenceId || null,
          referenceType: transaction.referenceType || null,
          balanceBefore,
          balanceAfter
        });
        console.log(`\u{1F4B3} [STORAGE]   Inserted into walletTransactions table`);
        await dbClient.update(users2).set({ walletBalance: balanceAfter }).where(eq(users2.id, transaction.userId));
        console.log(`\u{1F4B3} [STORAGE]   Updated users table - walletBalance set to: ${balanceAfter}`);
        console.log(`\u{1F4B3} [STORAGE] createWalletTransaction completed
`);
      }
      async getWalletTransactions(userId, limit = 50) {
        return db.query.walletTransactions.findMany({
          where: (t, { eq: eq7 }) => eq7(t.userId, userId),
          orderBy: (t, { desc: desc2 }) => [desc2(t.createdAt)],
          limit
        });
      }
      async getReferralStats(userId) {
        const user = await this.getUser(userId);
        const referralCode = user?.referralCode || "";
        const settings = await this.getActiveReferralReward();
        const expiryDays = settings?.expiryDays || 30;
        let allReferrals = await db.query.referrals.findMany({
          where: (r, { eq: eq7 }) => eq7(r.referrerId, userId)
        });
        const now = /* @__PURE__ */ new Date();
        for (const referral of allReferrals) {
          if (referral.status === "pending") {
            const createdDate = new Date(referral.createdAt);
            const expiryDate = new Date(createdDate);
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            if (now > expiryDate) {
              await db.update(referrals2).set({ status: "expired" }).where(eq(referrals2.id, referral.id));
              referral.status = "expired";
              console.log(`\u23F0 Auto-expired referral ${referral.id} for user ${userId}`);
            }
          }
        }
        const totalReferrals = allReferrals.length;
        const pendingReferrals = allReferrals.filter((r) => r.status === "pending").length;
        const completedReferrals = allReferrals.filter((r) => r.status === "completed").length;
        const expiredReferrals = allReferrals.filter((r) => r.status === "expired").length;
        const totalEarnings = allReferrals.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.referrerBonus, 0);
        return {
          totalReferrals,
          pendingReferrals,
          completedReferrals,
          expiredReferrals,
          totalEarnings,
          referralCode
        };
      }
      async getUserReferralCode(userId) {
        const user = await this.getUser(userId);
        return user?.referralCode || null;
      }
      async markReferralComplete(referralId) {
        await db.update(referrals2).set({ status: "completed", completedAt: /* @__PURE__ */ new Date() }).where(eq(referrals2.id, referralId));
      }
      async checkReferralEligibility(userId) {
        const userOrders = await this.getOrdersByUserId(userId);
        const completedOrders = userOrders.filter((o) => o.status === "delivered");
        if (completedOrders.length > 0) {
          return { eligible: false, reason: "User has already completed an order" };
        }
        const referral = await db.query.referrals.findFirst({
          where: (r, { eq: eq7 }) => eq7(r.referredId, userId)
        });
        if (!referral) {
          return { eligible: false, reason: "User was not referred" };
        }
        if (referral.status === "completed") {
          return { eligible: false, reason: "Referral bonus already claimed" };
        }
        return { eligible: true };
      }
      // Promotional Banners
      async getAllPromotionalBanners() {
        return db.query.promotionalBanners.findMany({ orderBy: [desc(promotionalBanners2.displayOrder)] });
      }
      async getActivePromotionalBanners() {
        return db.query.promotionalBanners.findMany({
          where: eq(promotionalBanners2.isActive, true),
          orderBy: [asc(promotionalBanners2.displayOrder)]
          // Ensure they display in order
        });
      }
      async createPromotionalBanner(data) {
        const id = randomUUID2();
        const banner = {
          id,
          title: data.title,
          subtitle: data.subtitle,
          buttonText: data.buttonText,
          gradientFrom: data.gradientFrom ?? "orange-600",
          gradientVia: data.gradientVia ?? "amber-600",
          gradientTo: data.gradientTo ?? "yellow-600",
          emoji1: data.emoji1 ?? "\u{1F37D}\uFE0F",
          emoji2: data.emoji2 ?? "\u{1F958}",
          emoji3: data.emoji3 ?? "\u{1F35B}",
          actionType: data.actionType ?? "subscription",
          actionValue: data.actionValue ?? null,
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        const [createdBanner] = await db.insert(promotionalBanners2).values(banner).returning();
        return createdBanner;
      }
      async updatePromotionalBanner(id, data) {
        const [updated] = await db.update(promotionalBanners2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(promotionalBanners2.id, id)).returning();
        return updated || null;
      }
      async deletePromotionalBanner(id) {
        const result = await db.delete(promotionalBanners2).where(eq(promotionalBanners2.id, id));
        return (result.rowCount ?? 0) > 0;
      }
      // Delivery Time Slots
      async getAllDeliveryTimeSlots() {
        return db.query.deliveryTimeSlots.findMany({
          orderBy: (slot, { asc: asc2 }) => [asc2(slot.startTime)]
        });
      }
      async getActiveDeliveryTimeSlots() {
        return db.query.deliveryTimeSlots.findMany({
          where: (slot, { eq: eq7 }) => eq7(slot.isActive, true),
          orderBy: (slot, { asc: asc2 }) => [asc2(slot.startTime)]
        });
      }
      async getDeliveryTimeSlot(id) {
        return db.query.deliveryTimeSlots.findFirst({ where: (slot, { eq: eq7 }) => eq7(slot.id, id) });
      }
      async getDeliveryTimeSlotById(id) {
        return db.query.deliveryTimeSlots.findFirst({ where: (slot, { eq: eq7 }) => eq7(slot.id, id) });
      }
      async createDeliveryTimeSlot(data) {
        const id = randomUUID2();
        const slot = {
          id,
          ...data,
          cutoffHoursBefore: data.cutoffHoursBefore ?? null,
          currentOrders: 0,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        const [created] = await db.insert(deliveryTimeSlots2).values(slot).returning();
        return created;
      }
      async updateDeliveryTimeSlot(id, data) {
        const [updated] = await db.update(deliveryTimeSlots2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(deliveryTimeSlots2.id, id)).returning();
        return updated || void 0;
      }
      async deleteDeliveryTimeSlot(id) {
        const result = await db.delete(deliveryTimeSlots2).where(eq(deliveryTimeSlots2.id, id));
        return (result.rowCount ?? 0) > 0;
      }
      mapOrder(order) {
        return {
          ...order,
          items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
          createdAt: new Date(order.createdAt),
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : null,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
          pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt) : null,
          approvedAt: order.approvedAt ? new Date(order.approvedAt) : null,
          assignedAt: order.assignedAt ? new Date(order.assignedAt) : null
        };
      }
      // Roti Settings Management
      async getRotiSettings() {
        const settings = await db.query.rotiSettings.findFirst({
          where: (rs, { eq: eq7 }) => eq7(rs.isActive, true),
          orderBy: (rs, { desc: desc2 }) => [desc2(rs.createdAt)]
        });
        return settings || void 0;
      }
      async updateRotiSettings(data) {
        const existing = await this.getRotiSettings();
        if (existing) {
          const [updated] = await db.update(rotiSettings2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(rotiSettings2.id, existing.id)).returning();
          return updated;
        } else {
          const [created] = await db.insert(rotiSettings2).values({ ...data, isActive: true }).returning();
          return created;
        }
      }
      // SMS Settings
      async getSMSSettings() {
        try {
          const settings = process.env.SMS_SETTINGS ? JSON.parse(process.env.SMS_SETTINGS) : null;
          return settings;
        } catch (error) {
          console.error("Error getting SMS settings:", error);
          return { enableSMS: false };
        }
      }
      async updateSMSSettings(settings) {
        try {
          const smsSettings = {
            enableSMS: settings.enableSMS || false,
            smsGateway: settings.smsGateway || "twilio",
            fromNumber: settings.fromNumber || "",
            apiKey: settings.apiKey || "",
            updatedAt: /* @__PURE__ */ new Date()
          };
          console.log(`\u2705 SMS Settings updated: ${smsSettings.enableSMS ? "ENABLED" : "DISABLED"}`);
          return smsSettings;
        } catch (error) {
          console.error("Error updating SMS settings:", error);
          throw error;
        }
      }
      // Referral Rewards Settings
      async getAllReferralRewards() {
        return db.query.referralRewards.findMany({
          orderBy: (rr, { desc: desc2 }) => [desc2(rr.createdAt)]
        });
      }
      async getActiveReferralReward() {
        let settings = await db.query.referralRewards.findFirst({
          where: (rr, { eq: eq7 }) => eq7(rr.isActive, true),
          orderBy: (rr, { desc: desc2 }) => [desc2(rr.createdAt)]
        });
        if (!settings) {
          console.log("\u{1F4DD} No active referral settings found, creating defaults...");
          const defaultReward = {
            name: "Default Referral Program",
            referrerBonus: 50,
            referredBonus: 50,
            minOrderAmount: 0,
            maxReferralsPerMonth: 10,
            maxEarningsPerMonth: 500,
            expiryDays: 30,
            isActive: true
          };
          settings = await this.createReferralReward(defaultReward);
          console.log(`\u2705 Default referral settings created: ${JSON.stringify(defaultReward)}`);
        }
        return settings;
      }
      async createReferralReward(data) {
        const id = randomUUID2();
        const reward = {
          id,
          ...data,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        const [created] = await db.insert(referralRewards2).values(reward).returning();
        return created;
      }
      async updateReferralReward(id, data) {
        const [updated] = await db.update(referralRewards2).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(referralRewards2.id, id)).returning();
        return updated || void 0;
      }
      async deleteReferralReward(id) {
        const result = await db.delete(referralRewards2).where(eq(referralRewards2.id, id));
        return (result.rowCount ?? 0) > 0;
      }
      // Get all coupons (for admin)
      async getAllCoupons() {
        return db.query.coupons.findMany({
          orderBy: (c, { desc: desc2 }) => [desc2(c.createdAt)]
        });
      }
      // Create coupon
      async createCoupon(data) {
        const id = randomUUID2();
        const coupon = {
          id,
          ...data,
          usedCount: 0,
          createdAt: /* @__PURE__ */ new Date()
        };
        const [created] = await db.insert(coupons2).values(coupon).returning();
        return created;
      }
      // Delete coupon
      async deleteCoupon(id) {
        const result = await db.delete(coupons2).where(eq(coupons2.id, id));
        return (result.rowCount ?? 0) > 0;
      }
      // Update coupon
      async updateCoupon(id, data) {
        const [updated] = await db.update(coupons2).set({ ...data }).where(eq(coupons2.id, id)).returning();
        return updated || void 0;
      }
      // ================= NEW REFERRAL MANAGEMENT METHODS =================
      // Get all referrals
      async getAllReferrals() {
        return db.query.referrals.findMany({
          orderBy: (r, { desc: desc2 }) => [desc2(r.createdAt)]
        });
      }
      // Get referral by ID
      async getReferralById(id) {
        return db.query.referrals.findFirst({
          where: (r, { eq: equals }) => equals(r.id, id)
        });
      }
      // Update referral status
      async updateReferralStatus(id, status, referrerBonus, referredBonus) {
        await db.update(referrals2).set({
          status,
          referrerBonus,
          referredBonus,
          referredOrderCompleted: status === "completed",
          completedAt: status === "completed" ? /* @__PURE__ */ new Date() : null
        }).where(eq(referrals2.id, id));
      }
      // ================= ADMIN REFERRAL REVIEW METHODS =================
      // Get all referrals enriched with referrer/referred user data and first order info
      async getAdminReferrals() {
        const allReferrals = await db.query.referrals.findMany({
          orderBy: (r, { desc: desc2 }) => [desc2(r.createdAt)]
        });
        const enriched = await Promise.all(
          allReferrals.map(async (referral) => {
            const [referrer, referred] = await Promise.all([
              this.getUser(referral.referrerId),
              this.getUser(referral.referredId)
            ]);
            let firstOrder = null;
            if (referral.referredId) {
              const referredOrders = await db.query.orders.findMany({
                where: (o, { eq: eqOp }) => eqOp(o.userId, referral.referredId),
                orderBy: (o, { asc: asc2 }) => [asc2(o.createdAt)]
              });
              firstOrder = referredOrders.find(
                (o) => o.status === "delivered" || o.status === "completed"
              ) || referredOrders[0] || null;
            }
            return {
              id: referral.id,
              referrerId: referral.referrerId,
              referredId: referral.referredId,
              referralCode: referral.referralCode,
              status: referral.status,
              referrerBonus: referral.referrerBonus,
              referredBonus: referral.referredBonus,
              referredOrderCompleted: referral.referredOrderCompleted,
              adminNote: referral.adminNote,
              fraudFlag: referral.fraudFlag,
              createdAt: referral.createdAt,
              completedAt: referral.completedAt,
              // Referrer info
              referrerName: referrer?.name || null,
              referrerPhone: referrer?.phone || null,
              // Referred user info
              referredName: referred?.name || null,
              referredPhone: referred?.phone || null,
              referredAddress: referred?.address || firstOrder?.address || null,
              referredLatitude: referred?.latitude || null,
              referredLongitude: referred?.longitude || null,
              // First order info
              firstOrderId: firstOrder?.id || null,
              firstOrderPaymentStatus: firstOrder?.paymentStatus || null
            };
          })
        );
        return enriched;
      }
      // Get aggregate admin referral stats
      async getAdminReferralStats() {
        const allReferrals = await db.query.referrals.findMany();
        const totalReferrals = allReferrals.length;
        const pendingReferrals = allReferrals.filter((r) => r.status === "pending").length;
        const approvedReferrals = allReferrals.filter((r) => r.status === "approved").length;
        const cancelledReferrals = allReferrals.filter((r) => r.status === "cancelled").length;
        const completedReferrals = allReferrals.filter((r) => r.status === "completed").length;
        const totalBonusPaid = allReferrals.filter((r) => r.status === "completed" || r.status === "approved").reduce((sum, r) => sum + r.referrerBonus + r.referredBonus, 0);
        return {
          totalReferrals,
          pendingReferrals,
          approvedReferrals,
          cancelledReferrals,
          completedReferrals,
          totalBonusPaid
        };
      }
      // Admin approve referral — credits referrer bonus to their wallet
      async adminApproveReferral(id, adminNote) {
        const referral = await this.getReferralById(id);
        if (!referral) throw new Error("Referral not found");
        if (referral.status !== "pending") {
          throw new Error(`Cannot approve referral with status: ${referral.status}`);
        }
        await db.transaction(async (tx) => {
          if (referral.referrerBonus > 0) {
            await this.createWalletTransaction({
              userId: referral.referrerId,
              amount: referral.referrerBonus,
              type: "referral_bonus",
              description: `Admin approved referral bonus (Referral ID: ${id})`,
              referenceId: id,
              referenceType: "referral"
            }, tx);
          }
          await tx.update(referrals2).set({
            status: "approved",
            adminNote: adminNote || null,
            completedAt: /* @__PURE__ */ new Date()
          }).where(eq(referrals2.id, id));
        });
      }
      // Admin cancel referral — reverses referrer bonus if already credited, marks as cancelled
      async adminCancelReferral(id, adminNote) {
        const referral = await this.getReferralById(id);
        if (!referral) throw new Error("Referral not found");
        if (referral.status === "cancelled") {
          throw new Error("Referral is already cancelled");
        }
        await db.transaction(async (tx) => {
          if ((referral.status === "approved" || referral.status === "completed") && referral.referrerBonus > 0) {
            try {
              await this.createWalletTransaction({
                userId: referral.referrerId,
                amount: referral.referrerBonus,
                type: "debit",
                description: `Referral bonus reversed by admin (Referral ID: ${id}). Reason: ${adminNote}`,
                referenceId: id,
                referenceType: "referral_reversal"
              }, tx);
            } catch (err) {
              console.warn(
                `\u26A0\uFE0F adminCancelReferral: Could not reverse referrer bonus for referral ${id} \u2014 ${err.message}. Cancelling without reversal.`
              );
            }
          }
          await tx.update(referrals2).set({
            status: "cancelled",
            adminNote
          }).where(eq(referrals2.id, id));
        });
      }
      // Toggle fraud flag on a referral
      async setReferralFraudFlag(id, fraudFlag) {
        await db.update(referrals2).set({ fraudFlag }).where(eq(referrals2.id, id));
      }
      // ================= NEW WALLET TRANSACTION METHODS =================
      // Get all wallet transactions (for admin)
      async getAllWalletTransactions(dateFilter) {
        if (dateFilter) {
          const filterDate = new Date(dateFilter);
          const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
          const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));
          return db.query.walletTransactions.findMany({
            where: (wt, { and: and3, gte: gteOp, lte: lteOp }) => and3(
              gteOp(wt.createdAt, startOfDay),
              lteOp(wt.createdAt, endOfDay)
            ),
            orderBy: (wt, { desc: desc2 }) => [desc2(wt.createdAt)]
          });
        }
        return db.query.walletTransactions.findMany({
          orderBy: (wt, { desc: desc2 }) => [desc2(wt.createdAt)],
          limit: 500
        });
      }
      // ==================== VISITOR TRACKING ====================
      async trackVisitor(data) {
        try {
          const result = await db.insert(visitors2).values(data).returning();
          return result[0];
        } catch (error) {
          console.error("Error tracking visitor:", error);
          return null;
        }
      }
      async getTotalVisitors() {
        try {
          const result = await db.select({ count: count() }).from(visitors2);
          return result[0]?.count || 0;
        } catch (error) {
          console.error("Error getting total visitors:", error);
          return 0;
        }
      }
      async getUniqueVisitors() {
        try {
          const result = await db.selectDistinct({ userId: visitors2.userId, sessionId: visitors2.sessionId }).from(visitors2);
          return result.length;
        } catch (error) {
          console.error("Error getting unique visitors:", error);
          return 0;
        }
      }
      async getTodayVisitors() {
        try {
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const result = await db.select({ count: count() }).from(visitors2).where(and(
            gte(visitors2.createdAt, today),
            lt(visitors2.createdAt, tomorrow)
          ));
          return result[0]?.count || 0;
        } catch (error) {
          console.error("Error getting today's visitors:", error);
          return 0;
        }
      }
      async getVisitorsByPage() {
        try {
          const result = await db.select({
            page: visitors2.page,
            count: count()
          }).from(visitors2).groupBy(visitors2.page).orderBy((t) => desc(t.count));
          return result;
        } catch (error) {
          console.error("Error getting visitors by page:", error);
          return [];
        }
      }
      async getVisitorsLastNDays(days = 7) {
        try {
          const startDate = /* @__PURE__ */ new Date();
          startDate.setDate(startDate.getDate() - days);
          const result = await db.select({
            date: sql3`DATE(${visitors2.createdAt})`,
            count: count()
          }).from(visitors2).where(gte(visitors2.createdAt, startDate)).groupBy(sql3`DATE(${visitors2.createdAt})`).orderBy((t) => t.date);
          return result;
        } catch (error) {
          console.error("Error getting visitors by date:", error);
          return [];
        }
      }
      // ============================================
      // DELIVERY AREAS MANAGEMENT (DB-backed)
      // ============================================
      async getDeliveryAreas() {
        try {
          const result = await db.select({ name: deliveryAreas2.name }).from(deliveryAreas2).where(eq(deliveryAreas2.isActive, true)).orderBy(asc(deliveryAreas2.name));
          return result.map((r) => r.name);
        } catch (error) {
          console.error("[STORAGE] Error fetching delivery areas:", error);
          return [];
        }
      }
      async getAllDeliveryAreas() {
        try {
          return await db.select().from(deliveryAreas2).orderBy(asc(deliveryAreas2.name));
        } catch (error) {
          console.error("[STORAGE] Error fetching all delivery areas:", error);
          return [];
        }
      }
      async addDeliveryArea(name, pincodes) {
        try {
          const trimmedName = name.trim();
          if (!trimmedName) return void 0;
          const result = await db.insert(deliveryAreas2).values({
            name: trimmedName,
            isActive: true,
            pincodes: pincodes && pincodes.length > 0 ? pincodes : []
          }).returning();
          console.log("[STORAGE] Delivery area added:", trimmedName, "with pincodes:", pincodes);
          return result[0];
        } catch (error) {
          console.error("[STORAGE] Error adding delivery area:", error);
          return void 0;
        }
      }
      async updateDeliveryArea(id, name, pincodes, latitude, longitude) {
        try {
          const updateData = {};
          if (name !== void 0) updateData.name = name.trim();
          if (pincodes !== void 0) updateData.pincodes = pincodes;
          if (latitude !== void 0) updateData.latitude = latitude;
          if (longitude !== void 0) updateData.longitude = longitude;
          const result = await db.update(deliveryAreas2).set(updateData).where(eq(deliveryAreas2.id, id)).returning();
          console.log("[STORAGE] Delivery area updated:", id, updateData);
          return result[0];
        } catch (error) {
          console.error("[STORAGE] Error updating delivery area:", error);
          return void 0;
        }
      }
      async updateDeliveryAreas(areaNames) {
        try {
          await db.delete(deliveryAreas2);
          const trimmedAreas = areaNames.map((a) => a.trim()).filter((a) => a.length > 0);
          if (trimmedAreas.length > 0) {
            await db.insert(deliveryAreas2).values(trimmedAreas.map((name) => ({ name, isActive: true })));
          }
          console.log("[STORAGE] Delivery areas updated:", trimmedAreas);
          return true;
        } catch (error) {
          console.error("[STORAGE] Error updating delivery areas:", error);
          return false;
        }
      }
      async deleteDeliveryArea(id) {
        try {
          const result = await db.delete(deliveryAreas2).where(eq(deliveryAreas2.id, id)).returning();
          console.log("[STORAGE] Delivery area deleted:", id);
          return result.length > 0;
        } catch (error) {
          console.error("[STORAGE] Error deleting delivery area:", error);
          return false;
        }
      }
      async toggleDeliveryAreaStatus(id, isActive) {
        try {
          const result = await db.update(deliveryAreas2).set({ isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq(deliveryAreas2.id, id)).returning();
          console.log("[STORAGE] Delivery area status toggled:", id, isActive);
          return result[0];
        } catch (error) {
          console.error("[STORAGE] Error toggling delivery area status:", error);
          return void 0;
        }
      }
      // Admin Settings methods
      async getAdminSetting(key) {
        try {
          const result = await db.select().from(adminSettings2).where(eq(adminSettings2.key, key)).limit(1);
          return result[0]?.value;
        } catch (error) {
          console.error("[STORAGE] Error getting admin setting:", key, error);
          return void 0;
        }
      }
      async setAdminSetting(key, value, description) {
        try {
          const updated = await db.update(adminSettings2).set({ value, description: description || null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(adminSettings2.key, key)).returning();
          if (updated.length === 0) {
            await db.insert(adminSettings2).values({
              id: randomUUID2(),
              key,
              value,
              description: description || null
            });
          }
          console.log("[STORAGE] Admin setting saved:", key, "=", value);
        } catch (error) {
          console.error("[STORAGE] Error setting admin setting:", key, error);
        }
      }
      async getDefaultCoordinates() {
        try {
          const lat = await this.getAdminSetting("default_latitude");
          const lon = await this.getAdminSetting("default_longitude");
          return {
            latitude: parseFloat(lat || "19.0728"),
            longitude: parseFloat(lon || "72.8826")
          };
        } catch (error) {
          console.error("[STORAGE] Error getting default coordinates:", error);
          return { latitude: 19.0728, longitude: 72.8826 };
        }
      }
      async setDefaultCoordinates(latitude, longitude) {
        try {
          await this.setAdminSetting("default_latitude", String(latitude), "Default latitude for new areas and chefs");
          await this.setAdminSetting("default_longitude", String(longitude), "Default longitude for new areas and chefs");
          console.log("[STORAGE] Default coordinates updated:", { latitude, longitude });
        } catch (error) {
          console.error("[STORAGE] Error setting default coordinates:", error);
        }
      }
    };
    storage = new MemStorage();
  }
});

// server/adminAuth.ts
var adminAuth_exports = {};
__export(adminAuth_exports, {
  generateAccessToken: () => generateAccessToken,
  generateRefreshToken: () => generateRefreshToken,
  hashPassword: () => hashPassword,
  requireAdmin: () => requireAdmin,
  requireAdminOrManager: () => requireAdminOrManager,
  requireSuperAdmin: () => requireSuperAdmin,
  verifyPassword: () => verifyPassword,
  verifyToken: () => verifyToken
});
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateAccessToken(admin) {
  const payload = {
    adminId: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function generateRefreshToken(admin) {
  const payload = {
    adminId: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
function requireAdmin(allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        reason: "no_token"
      });
    }
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({
          message: "You do not have permission to perform this action.",
          reason: "forbidden"
        });
      }
      req.admin = payload;
      next();
    } catch (error) {
      console.error("\u274C Admin auth error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please log in again.",
          reason: "token_expired"
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid authentication token. Please log in again.",
          reason: "token_invalid"
        });
      }
      return res.status(401).json({
        message: "Authentication failed. Please log in again.",
        reason: "auth_failed"
      });
    }
  };
}
function requireSuperAdmin() {
  return requireAdmin(["super_admin"]);
}
function requireAdminOrManager() {
  return requireAdmin(["super_admin", "manager"]);
}
var JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN;
var init_adminAuth = __esm({
  "server/adminAuth.ts"() {
    "use strict";
    JWT_SECRET = process.env.JWT_SECRET || "admin-jwt-secret-change-in-production";
    JWT_EXPIRES_IN = "90d";
    REFRESH_TOKEN_EXPIRES_IN = "90d";
  }
});

// server/deliveryAuth.ts
import jwt2 from "jsonwebtoken";
import bcrypt2 from "bcryptjs";
async function hashPassword2(password) {
  const salt = await bcrypt2.genSalt(10);
  return bcrypt2.hash(password, salt);
}
async function verifyPassword2(password, hash) {
  return bcrypt2.compare(password, hash);
}
function generateDeliveryToken(deliveryPerson) {
  const payload = {
    deliveryId: deliveryPerson.id,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone
  };
  return jwt2.sign(payload, JWT_SECRET2, { expiresIn: JWT_EXPIRES_IN2 });
}
function generateRefreshToken2(deliveryPerson) {
  const payload = {
    deliveryId: deliveryPerson.id,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone
  };
  return jwt2.sign(payload, JWT_SECRET2, { expiresIn: REFRESH_TOKEN_EXPIRES_IN2 });
}
function verifyToken2(token) {
  try {
    return jwt2.verify(token, JWT_SECRET2);
  } catch (error) {
    return null;
  }
}
function requireDeliveryAuth() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const token = authHeader.substring(7);
    const payload = verifyToken2(token);
    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    req.delivery = payload;
    next();
  };
}
var JWT_SECRET2, JWT_EXPIRES_IN2, REFRESH_TOKEN_EXPIRES_IN2;
var init_deliveryAuth = __esm({
  "server/deliveryAuth.ts"() {
    "use strict";
    JWT_SECRET2 = process.env.JWT_SECRET || "delivery-jwt-secret-change-in-production";
    JWT_EXPIRES_IN2 = "90d";
    REFRESH_TOKEN_EXPIRES_IN2 = "90d";
  }
});

// server/partnerAuth.ts
var partnerAuth_exports = {};
__export(partnerAuth_exports, {
  generateAccessToken: () => generateAccessToken2,
  generateRefreshToken: () => generateRefreshToken3,
  hashPassword: () => hashPassword3,
  requirePartner: () => requirePartner,
  verifyPassword: () => verifyPassword3,
  verifyToken: () => verifyToken3
});
import jwt3 from "jsonwebtoken";
import bcrypt3 from "bcryptjs";
async function hashPassword3(password) {
  return bcrypt3.hash(password, 10);
}
async function verifyPassword3(password, hash) {
  return bcrypt3.compare(password, hash);
}
function generateAccessToken2(partner) {
  const payload = {
    partnerId: partner.id,
    chefId: partner.chefId,
    username: partner.username
  };
  return jwt3.sign(payload, JWT_SECRET3, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
function generateRefreshToken3(partner) {
  const payload = {
    partnerId: partner.id,
    chefId: partner.chefId,
    username: partner.username
  };
  return jwt3.sign(payload, JWT_SECRET3, { expiresIn: REFRESH_TOKEN_EXPIRY });
}
function verifyToken3(token) {
  try {
    return jwt3.verify(token, JWT_SECRET3);
  } catch {
    return null;
  }
}
function requirePartner() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const token = authHeader.substring(7);
    const payload = verifyToken3(token);
    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    req.partner = payload;
    next();
  };
}
var JWT_SECRET3, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY;
var init_partnerAuth = __esm({
  "server/partnerAuth.ts"() {
    "use strict";
    JWT_SECRET3 = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    ACCESS_TOKEN_EXPIRY = "90d";
    REFRESH_TOKEN_EXPIRY = "90d";
  }
});

// server/websocket.ts
var websocket_exports = {};
__export(websocket_exports, {
  broadcastChefStatusUpdate: () => broadcastChefStatusUpdate,
  broadcastChefUnavailableNotification: () => broadcastChefUnavailableNotification,
  broadcastNewOrder: () => broadcastNewOrder,
  broadcastNewSubscriptionToAdmin: () => broadcastNewSubscriptionToAdmin,
  broadcastOrderUpdate: () => broadcastOrderUpdate,
  broadcastOverdueChefNotification: () => broadcastOverdueChefNotification,
  broadcastPreparedOrderToAvailableDelivery: () => broadcastPreparedOrderToAvailableDelivery,
  broadcastProductAvailabilityUpdate: () => broadcastProductAvailabilityUpdate,
  broadcastSubscriptionAssignmentToPartner: () => broadcastSubscriptionAssignmentToPartner,
  broadcastSubscriptionDelivery: () => broadcastSubscriptionDelivery,
  broadcastSubscriptionDeliveryToAvailableDelivery: () => broadcastSubscriptionDeliveryToAvailableDelivery,
  broadcastSubscriptionUpdate: () => broadcastSubscriptionUpdate,
  broadcastWalletUpdate: () => broadcastWalletUpdate,
  cancelPreparedOrderTimeout: () => cancelPreparedOrderTimeout,
  notifyDeliveryAssignment: () => notifyDeliveryAssignment,
  setupWebSocket: () => setupWebSocket
});
import { WebSocketServer, WebSocket } from "ws";
async function savePendingBroadcast(recipientId, recipientType, type, data) {
  try {
    await db.insert(pendingBroadcasts2).values({
      recipientId: String(recipientId),
      recipientType,
      eventType: type,
      payload: data
    });
  } catch (err) {
    console.error(`[PendingBroadcast Error] Failed to save for ${recipientType} ${recipientId}:`, err);
  }
}
function setupWebSocket(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws"
  });
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");
    const orderId = url.searchParams.get("orderId");
    const userId = url.searchParams.get("userId");
    if (!type) {
      ws.close(1008, "Missing client type");
      return;
    }
    let clientId;
    let chefId;
    let customerOrderId;
    let customerUserId;
    try {
      if (type === "browser") {
        clientId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      } else if (type === "customer") {
        if (!orderId && !userId) {
          ws.close(1008, "Order ID or User ID required for customer connection");
          return;
        }
        clientId = `customer_${orderId || userId}_${Date.now()}`;
        customerOrderId = orderId || void 0;
        customerUserId = userId || void 0;
      } else if (type === "admin") {
        if (!token) {
          ws.close(1008, "Token required");
          return;
        }
        const payload = verifyToken(token);
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
        const payload = verifyToken3(token);
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
        const payload = verifyToken2(token);
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
    const client = { ws, type, id: clientId, chefId, orderId: customerOrderId, userId: customerUserId };
    clients.set(clientId, client);
    console.log(`WebSocket client connected: ${type} ${clientId}${chefId ? ` (chef: ${chefId})` : ""}${customerOrderId ? ` (order: ${customerOrderId})` : ""}${customerUserId ? ` (user: ${customerUserId})` : ""}`);
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
function broadcastNewOrder(order) {
  const message = JSON.stringify({
    type: "new_order",
    data: order
  });
  console.log(`
\u{1F4E1} BROADCASTING NEW ORDER: ${order.id} to ${clients.size} clients`);
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
        console.log(`  \u2705 New order sent to chef ${clientId} (chefId: ${client.chefId})`);
      }
    } catch (err) {
      console.error(`  \u274C broadcastNewOrder send error to ${client.type} ${clientId}:`, err);
    }
  });
  console.log(`  Admins: ${adminCount} | Chef notified: ${chefNotified}`);
  if (!chefNotified && order.chefId) {
    console.warn(`  \u26A0\uFE0F No chef WS connected for chefId=${order.chefId}`);
  }
  if (order.chefId) {
    savePendingBroadcast(order.chefId, "chef", "new_order", { data: order });
  }
}
function broadcastSubscriptionDelivery(subscription) {
  const message = JSON.stringify({
    type: "subscription_delivery",
    data: subscription
  });
  clients.forEach((client) => {
    if (client.type === "admin") {
      client.ws.send(message);
    } else if (client.type === "chef" && subscription.chefId && String(client.chefId) === String(subscription.chefId)) {
      client.ws.send(message);
      console.log(`  \u2705 Sent subscription delivery to chef ${client.id} (chefId: ${client.chefId})`);
    }
  });
  if (subscription.chefId) {
    savePendingBroadcast(subscription.chefId, "chef", "subscription_delivery", { data: subscription });
  }
}
function broadcastSubscriptionUpdate(subscription) {
  const safeSubscription = { ...subscription };
  const dateFields = ["startDate", "endDate", "nextDeliveryDate", "lastDeliveryDate", "chefAssignedAt", "pauseStartDate", "pauseResumeDate", "createdAt", "updatedAt"];
  for (const field of dateFields) {
    if (safeSubscription[field]) {
      if (safeSubscription[field] instanceof Date) {
        safeSubscription[field] = safeSubscription[field].toISOString();
      } else if (typeof safeSubscription[field] !== "string") {
        safeSubscription[field] = String(safeSubscription[field]);
      }
    }
  }
  const message = JSON.stringify({
    type: "subscription_update",
    data: safeSubscription
  });
  console.log(`
\u{1F4E1} ========== BROADCASTING SUBSCRIPTION UPDATE ==========`);
  console.log(`Subscription ID: ${safeSubscription.id}`);
  console.log(`Customer: ${safeSubscription.customerName}`);
  console.log(`Chef ID: ${safeSubscription.chefId || "None"}`);
  console.log(`Status: ${safeSubscription.status}`);
  let adminNotified = 0;
  let chefNotified = false;
  let customerNotified = false;
  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  \u2705 Sent to admin ${clientId}`);
    } else if (client.type === "chef" && safeSubscription.chefId && String(client.chefId) === String(safeSubscription.chefId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      chefNotified = true;
      console.log(`  \u2705 Sent to partner ${clientId} (chefId: ${client.chefId})`);
    } else if (client.type === "customer" && client.userId === safeSubscription.userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      customerNotified = true;
      console.log(`  \u2705 Sent to customer ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      console.log(`  \u2705 Sent to browser ${clientId}`);
    }
  });
  console.log(`
\u{1F4CA} Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Chef notified: ${chefNotified ? "YES" : "NO"}`);
  console.log(`  - Customer notified: ${customerNotified ? "YES" : "NO"}`);
  console.log(`================================================
`);
  if (safeSubscription.chefId) {
    savePendingBroadcast(safeSubscription.chefId, "chef", "subscription_update", { data: safeSubscription });
  }
}
async function broadcastSubscriptionDeliveryToAvailableDelivery(deliveryLog) {
  console.log(`\u{1F4E3} Broadcasting subscription delivery ${deliveryLog.id} to all active delivery personnel`);
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  let deliveryPersonnelNotified = 0;
  for (const [deliveryPersonId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery" && client.ws.readyState === WebSocket.OPEN) {
      const deliveryPerson = await storage2.getDeliveryPersonnelById(deliveryPersonId);
      if (deliveryPerson && deliveryPerson.isActive) {
        const message = {
          type: "new_subscription_delivery",
          deliveryLog,
          message: `\u{1F37D}\uFE0F New subscription delivery ready for pickup!`
        };
        client.ws.send(JSON.stringify(message));
        console.log(`\u2705 Sent to delivery person: ${deliveryPersonId} (${deliveryPerson.name})`);
        deliveryPersonnelNotified++;
      }
    }
  }
  if (deliveryPersonnelNotified === 0) {
    console.log(`\u26A0\uFE0F WARNING: No available delivery personnel to notify for subscription delivery ${deliveryLog.id}`);
  } else {
    console.log(`\u2705 Notified ${deliveryPersonnelNotified} delivery personnel about subscription delivery ${deliveryLog.id}`);
  }
}
function broadcastOverdueChefNotification(overdueInfo) {
  const message = JSON.stringify({
    type: "overdue_chef_preparation",
    data: {
      subscriptionId: overdueInfo.subscription.id,
      customerName: overdueInfo.subscription.customerName,
      chefId: overdueInfo.chef?.id,
      chefName: overdueInfo.chef?.name,
      expectedPrepTime: overdueInfo.expectedPrepTime,
      deliveryTime: overdueInfo.deliveryTime,
      deliveryLogId: overdueInfo.log.id
    },
    message: `\u26A0\uFE0F Chef ${overdueInfo.chef?.name || "Unknown"} hasn't started preparing subscription for ${overdueInfo.subscription.customerName}. Expected by ${overdueInfo.expectedPrepTime}, delivery at ${overdueInfo.deliveryTime}.`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`
\u26A0\uFE0F ========== BROADCASTING OVERDUE CHEF NOTIFICATION ==========`);
  console.log(`Subscription: ${overdueInfo.subscription.id}`);
  console.log(`Customer: ${overdueInfo.subscription.customerName}`);
  console.log(`Chef: ${overdueInfo.chef?.name || "Unknown"}`);
  console.log(`Expected Prep Time: ${overdueInfo.expectedPrepTime}`);
  console.log(`Delivery Time: ${overdueInfo.deliveryTime}`);
  let adminNotified = 0;
  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  \u2705 Sent to admin ${client.id}`);
    }
  });
  console.log(`
\u{1F4CA} Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================
`);
}
function broadcastChefUnavailableNotification(data) {
  const message = JSON.stringify({
    type: "chef_unavailable_with_subscriptions",
    data: {
      chefId: data.chef.id,
      chefName: data.chef.name,
      subscriptionCount: data.subscriptionCount,
      subscriptions: data.subscriptions.map((s) => ({
        id: s.id,
        customerName: s.customerName,
        phone: s.phone,
        address: s.address,
        nextDeliveryDate: s.nextDeliveryDate,
        nextDeliveryTime: s.nextDeliveryTime
      }))
    },
    message: `\u{1F534} Chef ${data.chef.name} has marked themselves unavailable but has ${data.subscriptionCount} active subscription(s). Please reassign these subscriptions to another chef.`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`
\u{1F534} ========== BROADCASTING CHEF UNAVAILABLE NOTIFICATION ==========`);
  console.log(`Chef: ${data.chef.name} (${data.chef.id})`);
  console.log(`Active Subscriptions: ${data.subscriptionCount}`);
  console.log(`Subscriptions:`);
  data.subscriptions.forEach((s) => {
    console.log(`  - ${s.customerName} (${s.id})`);
  });
  let adminNotified = 0;
  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  \u2705 Sent to admin ${client.id}`);
    }
  });
  console.log(`
\u{1F4CA} Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================
`);
}
function broadcastOrderUpdate(order) {
  const message = JSON.stringify({
    type: "order_update",
    data: order
  });
  console.log(`
\u{1F4E1} ========== BROADCASTING ORDER UPDATE ==========`);
  console.log(`Order ID: ${order.id}`);
  console.log(`Status: ${order.status}`);
  console.log(`Payment Status: ${order.paymentStatus}`);
  console.log(`Chef ID: ${order.chefId}`);
  console.log(`Assigned To: ${order.assignedTo || "None"}`);
  console.log(`
\u{1F4CB} Connected clients (${clients.size}):`);
  clients.forEach((client, clientId) => {
    console.log(`  - ${clientId}: type=${client.type}, chefId=${client.chefId || "N/A"}`);
  });
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
        console.log(`  \u2705 Sent to admin ${clientId}`);
      } else if (client.type === "chef" && String(client.chefId) === String(order.chefId)) {
        client.ws.send(message);
        chefNotified = true;
        console.log(`  \u2705 Sent to chef ${clientId} (chefId: ${client.chefId})`);
      } else if (client.type === "delivery" && client.id === order.assignedTo) {
        client.ws.send(message);
        deliveryNotified = true;
        console.log(`  \u2705 Sent to delivery ${clientId}`);
      } else if (client.type === "customer" && client.orderId === order.id) {
        client.ws.send(message);
        customerNotified = true;
        console.log(`  \u2705 Sent to customer ${clientId}`);
      } else if (client.type === "chef" && String(client.chefId) !== String(order.chefId)) {
        console.log(`  \u274C Chef ${clientId} skipped - chefId mismatch (client: ${client.chefId}, order: ${order.chefId})`);
      }
    } catch (error) {
      console.error(`  \u274C Failed to send to ${client.type} ${clientId}:`, error);
    }
  });
  console.log(`
\u{1F4CA} Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Chef notified: ${chefNotified ? "YES" : "NO"}`);
  console.log(`  - Delivery notified: ${deliveryNotified ? "YES" : "NO"}`);
  console.log(`  - Customer notified: ${customerNotified ? "YES" : "NO"}`);
  if (!chefNotified && order.chefId) {
    console.log(`
  \u26A0\uFE0F WARNING: No chef WebSocket connected for chefId: ${order.chefId}`);
    console.log(`  \u{1F4CB} Currently connected clients:`, Array.from(clients.entries()).map(([id, c]) => ({
      id,
      type: c.type,
      chefId: c.chefId
    })));
  }
  if (order.chefId) {
    savePendingBroadcast(order.chefId, "chef", "order_update", { data: order });
  }
  if (order.assignedTo) {
    savePendingBroadcast(order.assignedTo, "delivery", "order_update", { data: order });
  }
  console.log(`================================================
`);
}
function notifyDeliveryAssignment(order, deliveryPersonId) {
  const client = clients.get(deliveryPersonId);
  if (client && client.type === "delivery") {
    try {
      const notificationType2 = order.status === "confirmed" ? "order_confirmed" : "order_assigned";
      client.ws.send(JSON.stringify({
        type: notificationType2,
        data: order,
        message: order.status === "confirmed" ? `Order #${order.id.slice(0, 8)} has been confirmed and is ready for pickup` : `New order #${order.id.slice(0, 8)} has been assigned to you`
      }));
    } catch (error) {
      console.error(`  \u274C Failed to notify delivery assignment to ${deliveryPersonId}:`, error);
    }
  }
  const notificationType = order.status === "confirmed" ? "order_confirmed" : "order_assigned";
  savePendingBroadcast(deliveryPersonId, "delivery", notificationType, {
    data: order,
    message: order.status === "confirmed" ? `Order #${order.id.slice(0, 8)} has been confirmed and is ready for pickup` : `New order #${order.id.slice(0, 8)} has been assigned to you`
  });
}
async function broadcastPreparedOrderToAvailableDelivery(order) {
  const notificationStage = order.status === "accepted_by_chef" ? "CHEF_ACCEPTED" : order.status === "prepared" ? "FOOD_READY" : "ORDER_UPDATE";
  console.log(`\u{1F4E3} Broadcasting order ${order.id} (status: ${order.status}, stage: ${notificationStage}) to all active delivery personnel`);
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  let deliveryPersonnelNotified = 0;
  for (const [deliveryPersonId, client] of Array.from(clients.entries())) {
    if (client.type === "delivery" && client.ws.readyState === WebSocket.OPEN) {
      const deliveryPerson = await storage2.getDeliveryPersonnelById(deliveryPersonId);
      if (deliveryPerson && deliveryPerson.isActive) {
        const message = {
          type: "new_prepared_order",
          order,
          notificationStage,
          message: notificationStage === "CHEF_ACCEPTED" ? `\u{1F514} New order alert! Chef accepted order #${order.id.slice(0, 8)} - start preparing to head out` : `\u{1F37D}\uFE0F Order #${order.id.slice(0, 8)} is ready for pickup!`
        };
        client.ws.send(JSON.stringify(message));
        console.log(`\u2705 [${notificationStage}] Sent to delivery person: ${deliveryPersonId} (${deliveryPerson.name})`);
        deliveryPersonnelNotified++;
      }
    }
    if (client.type === "delivery") {
      savePendingBroadcast(deliveryPersonId, "delivery", "new_prepared_order", {
        order,
        notificationStage,
        message: notificationStage === "CHEF_ACCEPTED" ? `\u{1F514} New order alert! Chef accepted order #${order.id.slice(0, 8)} - start preparing to head out` : `\u{1F37D}\uFE0F Order #${order.id.slice(0, 8)} is ready for pickup!`
      });
    }
  }
  const existingTimeout = preparedOrderTimeouts.get(order.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  const timeout = setTimeout(async () => {
    console.log(`\u23F0 TIMEOUT: Order ${order.id} not accepted by any delivery person within 5 minutes`);
    await notifyAdminForManualAssignment(order.id);
    preparedOrderTimeouts.delete(order.id);
  }, PREPARED_ORDER_TIMEOUT_MS);
  preparedOrderTimeouts.set(order.id, timeout);
  if (deliveryPersonnelNotified === 0) {
    console.log(`\u26A0\uFE0F WARNING: No available delivery personnel to notify for order ${order.id}`);
    console.log(`\u26A0\uFE0F Notifying admin immediately for manual assignment`);
    clearTimeout(timeout);
    preparedOrderTimeouts.delete(order.id);
    await notifyAdminForManualAssignment(order.id);
  } else {
    console.log(`\u2705 Notified ${deliveryPersonnelNotified} delivery personnel about order ${order.id}`);
    console.log(`\u23F0 Timeout set: Admin will be notified in 5 minutes if no one accepts`);
  }
}
async function notifyAdminForManualAssignment(orderId) {
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const currentOrder = await storage2.getOrderById(orderId);
  if (!currentOrder) {
    console.log(`\u26A0\uFE0F Order ${orderId} not found when trying to send manual assignment notification`);
    return;
  }
  const waitingForDelivery = ["accepted_by_chef", "preparing", "prepared"].includes(currentOrder.status);
  if (!waitingForDelivery || currentOrder.assignedTo) {
    console.log(`\u2705 Order ${orderId} no longer needs manual assignment (status: ${currentOrder.status}, assigned: ${!!currentOrder.assignedTo})`);
    return;
  }
  const message = JSON.stringify({
    type: "manual_assignment_required",
    data: currentOrder,
    message: `Order #${currentOrder.id.slice(0, 8)} needs manual assignment - no delivery person accepted within timeout`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  let adminNotified = false;
  clients.forEach((client) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified = true;
      console.log(`\u2705 Sent manual assignment notification to admin`);
    }
  });
  if (!adminNotified) {
    console.log(`\u26A0\uFE0F WARNING: No admin WebSocket connected to receive manual assignment notification for order ${currentOrder.id}`);
  }
}
function cancelPreparedOrderTimeout(orderId) {
  const timeout = preparedOrderTimeouts.get(orderId);
  if (timeout) {
    clearTimeout(timeout);
    preparedOrderTimeouts.delete(orderId);
    console.log(`\u2705 Cancelled prepared order timeout for ${orderId} - delivery person accepted`);
  }
}
function broadcastChefStatusUpdate(chef) {
  const message = JSON.stringify({
    type: "chef_status_update",
    data: chef
  });
  console.log(`
\u{1F4E1} ========== BROADCASTING CHEF STATUS UPDATE ==========`);
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
      console.log(`  \u2705 Sent to admin ${clientId}`);
    } else if (client.type === "customer" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      customerNotified++;
      console.log(`  \u2705 Sent to customer ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      browserNotified++;
      console.log(`  \u2705 Sent to browser ${clientId}`);
    } else if (client.type === "chef" && String(client.chefId) === String(chef.id) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified = true;
      console.log(`  \u2705 Sent to partner ${clientId}`);
    }
  });
  console.log(`
\u{1F4CA} Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Customers notified: ${customerNotified}`);
  console.log(`  - Browsers notified: ${browserNotified}`);
  console.log(`  - Partner notified: ${partnerNotified ? "YES" : "NO"}`);
  console.log(`================================================
`);
}
function broadcastProductAvailabilityUpdate(product) {
  const message = JSON.stringify({
    type: "product_availability_update",
    data: {
      id: product.id,
      name: product.name,
      isAvailable: product.isAvailable,
      stock: product.stockQuantity
    }
  });
  console.log(`
\u{1F4E1} ========== BROADCASTING PRODUCT AVAILABILITY UPDATE ==========`);
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
      console.log(`  \u2705 Sent to admin ${clientId}`);
    } else if (client.type === "browser" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      browserNotified++;
      console.log(`  \u2705 Sent to browser ${clientId}`);
    } else if (client.type === "chef" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified++;
      console.log(`  \u2705 Sent to partner ${clientId}`);
    }
  });
  console.log(`
\u{1F4CA} Broadcast Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`  - Browsers notified: ${browserNotified}`);
  console.log(`  - Partners notified: ${partnerNotified}`);
  console.log(`================================================
`);
}
function broadcastNewSubscriptionToAdmin(subscription, planName) {
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
      isPaid: subscription.isPaid
    },
    message: `New subscription from ${subscription.customerName} (${subscription.phone})`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`
\u{1F4E3} ========== BROADCASTING NEW SUBSCRIPTION TO ADMINS ==========`);
  console.log(`Subscription ID: ${subscription.id}`);
  console.log(`Customer: ${subscription.customerName}`);
  console.log(`Phone: ${subscription.phone}`);
  console.log(`Plan: ${planName || subscription.planId}`);
  let adminNotified = 0;
  clients.forEach((client, clientId) => {
    if (client.type === "admin" && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      adminNotified++;
      console.log(`  \u2705 Sent to admin ${clientId}`);
    }
  });
  console.log(`
\u{1F4CA} Notification Summary:`);
  console.log(`  - Admins notified: ${adminNotified}`);
  console.log(`================================================
`);
}
function broadcastSubscriptionAssignmentToPartner(subscription, chefName, planName) {
  if (!subscription.chefId) {
    console.log(`\u26A0\uFE0F No chef assigned to subscription ${subscription.id}, skipping partner notification`);
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
      chefId: subscription.chefId
    },
    message: `New subscription assigned: ${subscription.customerName} - ${planName || "Subscription"}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`
\u{1F4E3} ========== BROADCASTING SUBSCRIPTION ASSIGNMENT TO PARTNER ==========`);
  console.log(`Subscription ID: ${subscription.id}`);
  console.log(`Customer: ${subscription.customerName}`);
  console.log(`Assigned Chef: ${chefName || subscription.chefId}`);
  console.log(`Plan: ${planName || subscription.planId}`);
  let partnerNotified = false;
  clients.forEach((client, clientId) => {
    if (client.type === "chef" && String(client.chefId) === String(subscription.chefId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      partnerNotified = true;
      console.log(`  \u2705 Sent to partner ${clientId} (chefId: ${client.chefId})`);
    }
  });
  if (!partnerNotified) {
    console.log(`  \u26A0\uFE0F WARNING: No partner WebSocket connected for chefId: ${subscription.chefId}`);
  }
  console.log(`
\u{1F4CA} Notification Summary:`);
  console.log(`  - Partner notified: ${partnerNotified ? "YES" : "NO"}`);
  console.log(`================================================
`);
}
function broadcastWalletUpdate(userId, newBalance) {
  const message = JSON.stringify({
    type: "wallet_updated",
    data: {
      userId,
      newBalance,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    message: `Wallet updated: \u20B9${newBalance}`
  });
  console.log(`
\u{1F4B3} [BROADCAST] Wallet update for user: ${userId}, Balance: \u20B9${newBalance}`);
  console.log(`\u{1F4B3} [BROADCAST] Total connected clients: ${clients.size}`);
  let sentCount = 0;
  let skippedCount = 0;
  clients.forEach((client, clientId) => {
    const typeMatch = client.type === "customer" || client.type === "browser";
    const userIdMatch = client.userId === userId;
    const wsOpen = client.ws.readyState === WebSocket.OPEN;
    console.log(`\u{1F4B3} [BROADCAST] Client ${clientId}: type=${client.type} (match=${typeMatch}), userId=${client.userId} (match=${userIdMatch}), wsOpen=${wsOpen}`);
    if (typeMatch && userIdMatch && wsOpen) {
      client.ws.send(message);
      sentCount++;
      console.log(`\u2705 [BROADCAST] Sent wallet update to client ${clientId}`);
    } else {
      skippedCount++;
      if (!typeMatch) console.log(`   \u23ED\uFE0F Skipped: type mismatch (${client.type})`);
      if (!userIdMatch) console.log(`   \u23ED\uFE0F Skipped: userId mismatch (${client.userId} !== ${userId})`);
      if (!wsOpen) console.log(`   \u23ED\uFE0F Skipped: WebSocket not open`);
    }
  });
  console.log(`\u{1F4B3} [BROADCAST] Summary: Sent=${sentCount}, Skipped=${skippedCount}
`);
}
var clients, preparedOrderTimeouts, PREPARED_ORDER_TIMEOUT_MS;
var init_websocket = __esm({
  "server/websocket.ts"() {
    "use strict";
    init_adminAuth();
    init_deliveryAuth();
    init_partnerAuth();
    init_db();
    clients = /* @__PURE__ */ new Map();
    preparedOrderTimeouts = /* @__PURE__ */ new Map();
    PREPARED_ORDER_TIMEOUT_MS = 5 * 60 * 1e3;
  }
});

// server/userAuth.ts
var userAuth_exports = {};
__export(userAuth_exports, {
  generateAccessToken: () => generateAccessToken3,
  generateRefreshToken: () => generateRefreshToken4,
  hashPassword: () => hashPassword5,
  requireUser: () => requireUser,
  verifyPassword: () => verifyPassword4,
  verifyToken: () => verifyToken5
});
import jwt5 from "jsonwebtoken";
import bcrypt4 from "bcryptjs";
async function hashPassword5(password) {
  const salt = await bcrypt4.genSalt(10);
  return bcrypt4.hash(password, salt);
}
async function verifyPassword4(password, hash) {
  return bcrypt4.compare(password, hash);
}
function generateAccessToken3(user) {
  const payload = {
    userId: user.id,
    phone: user.phone,
    name: user.name
  };
  return jwt5.sign(payload, JWT_SECRET4, { expiresIn: JWT_EXPIRES_IN3 });
}
function generateRefreshToken4(user) {
  const payload = {
    userId: user.id,
    phone: user.phone,
    name: user.name
  };
  return jwt5.sign(payload, JWT_SECRET4, { expiresIn: REFRESH_TOKEN_EXPIRES_IN3 });
}
function verifyToken5(token) {
  try {
    return jwt5.verify(token, JWT_SECRET4);
  } catch (error) {
    return null;
  }
}
function requireUser() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.setHeader("Content-Type", "application/json");
      res.status(401).json({ message: "Authentication required. Please login." });
      return;
    }
    const token = authHeader.substring(7);
    const payload = verifyToken5(token);
    if (!payload) {
      res.setHeader("Content-Type", "application/json");
      res.status(401).json({ message: "Invalid or expired token. Please login again." });
      return;
    }
    req.authenticatedUser = payload;
    next();
  };
}
var JWT_SECRET4, JWT_EXPIRES_IN3, REFRESH_TOKEN_EXPIRES_IN3;
var init_userAuth = __esm({
  "server/userAuth.ts"() {
    "use strict";
    JWT_SECRET4 = process.env.JWT_SECRET || "user-jwt-secret-change-in-production";
    JWT_EXPIRES_IN3 = "7d";
    REFRESH_TOKEN_EXPIRES_IN3 = "30d";
  }
});

// shared/deliveryUtils.ts
var deliveryUtils_exports = {};
__export(deliveryUtils_exports, {
  STORE_LOCATION: () => STORE_LOCATION,
  calculateDelivery: () => calculateDelivery,
  calculateDistance: () => calculateDistance,
  calculateFullDelivery: () => calculateFullDelivery
});
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
}
function calculateDelivery(distance, subtotal, deliverySettings3) {
  let deliveryFee = 0;
  let freeDeliveryEligible = false;
  let amountForFreeDelivery;
  let deliveryRangeName;
  if (!deliverySettings3 || deliverySettings3.length === 0) {
    console.warn("No delivery settings configured by admin");
    return {
      deliveryFee: 0,
      freeDeliveryEligible: false,
      amountForFreeDelivery: void 0,
      deliveryRangeName: "No delivery settings configured"
    };
  }
  const activeSettings = deliverySettings3.filter((s) => s.isActive);
  if (activeSettings.length === 0) {
    console.warn("No active delivery settings found");
    return {
      deliveryFee: 0,
      freeDeliveryEligible: false,
      amountForFreeDelivery: void 0,
      deliveryRangeName: "No active delivery settings"
    };
  }
  console.log(`[Delivery Calc] Distance: ${distance}km, Subtotal: \u20B9${subtotal}`);
  console.log(`[Delivery Calc] Active settings:`, activeSettings.map(
    (s) => `${s.name}: ${s.minDistance}-${s.maxDistance}km = \u20B9${s.price}`
  ));
  const matchingSetting = activeSettings.find((setting) => {
    const minDist = parseFloat(setting.minDistance);
    const maxDist = parseFloat(setting.maxDistance);
    const matches = distance >= minDist && distance <= maxDist;
    console.log(`[Delivery Calc] Checking ${setting.name} (${minDist}-${maxDist}km): ${matches ? "MATCH" : "no match"}`);
    return matches;
  });
  console.log(`[Delivery Calc] Matching setting:`, matchingSetting?.name || "NONE");
  if (matchingSetting) {
    deliveryFee = matchingSetting.price;
    deliveryRangeName = matchingSetting.name;
    const minOrderForRange = matchingSetting.minOrderAmount || 0;
    if (deliveryFee === 0 || minOrderForRange > 0 && subtotal >= minOrderForRange) {
      freeDeliveryEligible = true;
      deliveryFee = 0;
    } else {
      if (minOrderForRange > 0) {
        amountForFreeDelivery = minOrderForRange - subtotal;
      }
      freeDeliveryEligible = false;
    }
    const result = {
      deliveryFee,
      freeDeliveryEligible,
      amountForFreeDelivery,
      deliveryRangeName,
      minOrderAmount: minOrderForRange
      // Return min order for this range
    };
    console.log(`[Delivery Calc] Final result:`, result);
    return result;
  } else {
    deliveryFee = 0;
    deliveryRangeName = "Outside delivery zone";
    const result = {
      deliveryFee,
      freeDeliveryEligible,
      amountForFreeDelivery,
      deliveryRangeName,
      minOrderAmount: 0
    };
    console.log(`[Delivery Calc] Final result:`, result);
    return result;
  }
}
function calculateFullDelivery(userLat, userLon, chefLat, chefLon, subtotal, deliverySettings3) {
  const distance = calculateDistance(userLat, userLon, chefLat, chefLon);
  const delivery = calculateDelivery(distance, subtotal, deliverySettings3);
  return {
    distance,
    ...delivery
  };
}
var STORE_LOCATION;
var init_deliveryUtils = __esm({
  "shared/deliveryUtils.ts"() {
    "use strict";
    STORE_LOCATION = {
      latitude: 28.6139,
      // Example: New Delhi
      longitude: 77.209,
      address: "Main Store, Connaught Place, New Delhi"
    };
  }
});

// server/pushService.ts
var pushService_exports = {};
__export(pushService_exports, {
  getVapidPublicKey: () => getVapidPublicKey,
  isPushConfigured: () => isPushConfigured,
  sendPushToAllAdmins: () => sendPushToAllAdmins,
  sendPushToUser: () => sendPushToUser
});
import { eq as eq5, and as and2 } from "drizzle-orm";
async function sendPushToUser(userId, userType, notification) {
  try {
    if (!webpush || !vapidPublicKey || !vapidPrivateKey) {
      console.log("\u26A0\uFE0F Push notifications not configured, skipping send");
      return { success: false, reason: "VAPID keys not configured" };
    }
    const subscriptions4 = await db.select().from(pushSubscriptions).where(
      and2(
        eq5(pushSubscriptions.userId, userId),
        eq5(pushSubscriptions.userType, userType),
        eq5(pushSubscriptions.isActive, true)
      )
    );
    if (subscriptions4.length === 0) {
      console.log(`\u2139\uFE0F No push subscriptions found for ${userType} ${userId}`);
      return { success: true, sentCount: 0, reason: "No subscriptions" };
    }
    let sentCount = 0;
    let failedCount = 0;
    for (const sub of subscriptions4) {
      try {
        const subscription = sub.subscription;
        const payloadJson = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || "/icon-192.png",
          badge: notification.badge || "/icon-96x96.png",
          tag: notification.tag || "notification",
          data: notification.data || {},
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        await webpush.sendNotification(subscription, payloadJson);
        sentCount++;
        console.log(`\u2705 Push sent to ${userType} ${userId}`);
      } catch (error) {
        failedCount++;
        if (error.statusCode === 410) {
          await db.update(pushSubscriptions).set({ isActive: false }).where(eq5(pushSubscriptions.id, sub.id));
          console.log(`\u{1F5D1}\uFE0F Removed invalid subscription for ${userType} ${userId}`);
        } else {
          console.error(
            `\u26A0\uFE0F Failed to send push to ${userType} ${userId}:`,
            error.message
          );
        }
      }
    }
    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      totalSubscriptions: subscriptions4.length
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, reason: error.message };
  }
}
async function sendPushToAllAdmins(notification) {
  try {
    if (!webpush || !vapidPublicKey || !vapidPrivateKey) {
      return { success: false, reason: "VAPID keys not configured" };
    }
    const subscriptions4 = await db.select().from(pushSubscriptions).where(
      and2(
        eq5(pushSubscriptions.userType, "admin"),
        eq5(pushSubscriptions.isActive, true)
      )
    );
    if (subscriptions4.length === 0) {
      return { success: true, sentCount: 0, reason: "No admin subscriptions" };
    }
    let sentCount = 0;
    for (const sub of subscriptions4) {
      try {
        const subscription = sub.subscription;
        const payloadJson = JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || "/icon-192.png",
          badge: notification.badge || "/icon-96x96.png",
          tag: notification.tag || "notification",
          data: notification.data || {},
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        await webpush.sendNotification(subscription, payloadJson);
        sentCount++;
      } catch (error) {
        if (error.statusCode === 410) {
          await db.update(pushSubscriptions).set({ isActive: false }).where(eq5(pushSubscriptions.id, sub.id));
        }
      }
    }
    return { success: sentCount > 0, sentCount, totalSubscriptions: subscriptions4.length };
  } catch (error) {
    console.error("Error sending push to admins:", error);
    return { success: false, reason: error.message };
  }
}
function getVapidPublicKey() {
  return vapidPublicKey;
}
function isPushConfigured() {
  return !!(webpush && vapidPublicKey && vapidPrivateKey);
}
var webpush, vapidPublicKey, vapidPrivateKey, vapidEmail;
var init_pushService = __esm({
  "server/pushService.ts"() {
    "use strict";
    init_db();
    init_schema();
    webpush = null;
    try {
      webpush = __require("web-push");
    } catch (error) {
      console.warn("\u26A0\uFE0F web-push module not installed. Push notifications disabled.");
    }
    vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
    vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
    vapidEmail = process.env.VAPID_EMAIL || "admin@rotihai.com";
    if (webpush && vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      console.log("\u2705 Web Push configured with VAPID keys");
    } else if (!webpush) {
      console.warn("\u26A0\uFE0F web-push package not installed. Install with: npm install web-push");
    } else {
      console.warn("\u26A0\uFE0F VAPID keys not configured in environment variables.");
    }
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs from "fs";
import path from "path";
import { nanoid as nanoid2 } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  await loadVite();
  const viteLogger = await getViteLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath, {
    maxAge: "1d",
    // Browser can cache for 1 day
    etag: true,
    // Enable ETag for cache validation
    lastModified: true,
    // Enable Last-Modified header
    immutable: false,
    // Files might change, allow revalidation
    setHeaders: (res, path2) => {
      if (path2.match(/\.[a-f0-9]{8}\./i)) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
var createViteServer, createLogger, viteConfig, loadVite, getViteLogger;
var init_vite = __esm({
  "server/vite.ts"() {
    "use strict";
    loadVite = async () => {
      if (!createViteServer) {
        const viteModule = await import("vite");
        createViteServer = viteModule.createServer;
        createLogger = viteModule.createLogger;
      }
      if (!viteConfig) {
        const config = await import("../vite.config");
        viteConfig = config.default;
      }
    };
    getViteLogger = async () => {
      await loadVite();
      return createLogger ? createLogger() : { error: console.error, info: console.log, warn: console.warn };
    };
  }
});

// server/env.ts
import dotenv from "dotenv";
dotenv.config();

// server/index.ts
import express2 from "express";
import cookieParser from "cookie-parser";
import multer from "multer";

// server/routes.ts
init_storage();
init_schema();
import { createServer } from "http";

// server/adminRoutes.ts
init_storage();
init_adminAuth();
init_db();
init_schema();
init_websocket();
init_deliveryAuth();
init_schema();
import jwt4 from "jsonwebtoken";
import { fromZodError } from "zod-validation-error";
import { eq as eq2 } from "drizzle-orm";

// server/emailService.ts
import nodemailer from "nodemailer";
var transporter = null;
if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_USER) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  console.log("\u2705 Email service initialized with Gmail:", process.env.GMAIL_USER);
} else {
  console.warn(
    "\u26A0\uFE0F Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD."
  );
}
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn("\u26A0\uFE0F Email service not configured. Skipping email:", to);
    return false;
  }
  try {
    const info = await transporter.sendMail({
      from: `"RotiHai - \u0918\u0930 \u0915\u0940 \u0930\u094B\u091F\u0940" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`\u2705 Email sent to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error("\u274C Email send failed:", err);
    return false;
  }
}
function createWelcomeEmail(name, phone, password) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; line-height:1.6; color:#333; }
        .container { max-width:600px; margin:0 auto; padding:20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome ${name}! \u{1F44B}</h2>
        <p>Your account has been created successfully.</p>

        <h3>Your Password:</h3>
        <div style="font-size:24px; font-weight:bold;">${password}</div>

        <p>Use this with phone: <b>${phone}</b></p>
      </div>
    </body>
    </html>
  `;
}
function createPasswordResetEmail(name, phone, newPassword) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>Your new temporary password is:</p>

      <div style="
          padding: 15px;
          background: #eee;
          border-radius: 6px;
          width: fit-content;
        ">
        <b style="font-size: 24px;">${newPassword}</b>
      </div>

      <p>
        Use it to login with phone: <b>${phone}</b><br>
        Please change it after logging in.
      </p>
    </body>
    </html>
  `;
}
function createAdminPasswordResetEmail(username, tempPassword) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>\u{1F510} Admin Password Reset</h2>
      <p>Hello ${username},</p>
      <p>Your password has been reset by the Super Admin. Your new temporary password is:</p>

      <div style="
          padding: 15px;
          background: #f0f0f0;
          border-radius: 6px;
          width: fit-content;
          margin: 15px 0;
        ">
        <b style="font-size: 20px; letter-spacing: 2px;">${tempPassword}</b>
      </div>

      <p>
        <strong>Login credentials:</strong><br>
        \u2022 Username: <b>${username}</b><br>
        \u2022 Password: <b>${tempPassword}</b><br>
      </p>

      <p style="color: #d32f2f; font-weight: bold;">
        \u26A0\uFE0F Please change this password immediately after logging in for security.
      </p>

      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This is an automated message from RotiHai Admin System.
      </p>
    </body>
    </html>
  `;
}
function createPasswordChangeConfirmationEmail(name, phone) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>Password Changed Successfully</h2>
      <p>Hello ${name},</p>
      <p>Your password for <b>${phone}</b> has been updated.</p>
    </body>
    </html>
  `;
}
function createMissedDeliveryEmail(name, deliveryDate, deliveryTime, subscriptionId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; line-height:1.6; color:#333; }
        .container { max-width:600px; margin:0 auto; padding:20px; border: 1px solid #ddd; }
        .alert { background-color:#fff3cd; border:1px solid #ffc107; padding:15px; border-radius:5px; margin:20px 0; }
        .details { background-color:#f5f5f5; padding:15px; border-radius:5px; margin:15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Delivery Issue - We Apologize \u26A0\uFE0F</h2>
        <p>Hello <b>${name}</b>,</p>
        
        <div class="alert">
          <p><b>Your scheduled delivery on ${deliveryDate} at ${deliveryTime} could not be completed.</b></p>
        </div>

        <div class="details">
          <h3>Delivery Details:</h3>
          <ul>
            <li><b>Date:</b> ${deliveryDate}</li>
            <li><b>Time:</b> ${deliveryTime}</li>
            <li><b>Subscription ID:</b> ${subscriptionId}</li>
          </ul>
        </div>

        <h3>What can you do?</h3>
        <ul>
          <li>\u{1F4DE} Contact our support team to reschedule</li>
          <li>\u23ED\uFE0F Skip this delivery to adjust your schedule</li>
          <li>\u{1F4AC} Chat with us in the app for immediate assistance</li>
        </ul>

        <p style="color:#666; font-size:12px; margin-top:30px;">
          We regret the inconvenience. Thank you for your patience!<br>
          <b>RotiHai - \u0918\u0930 \u0915\u0940 \u0930\u094B\u091F\u0940</b>
        </p>
      </div>
    </body>
    </html>
  `;
}
async function sendMissedDeliveryEmail(email, name, deliveryDate, deliveryTime, subscriptionId) {
  return sendEmail({
    to: email,
    subject: "Your Delivery Could Not Be Completed \u26A0\uFE0F",
    html: createMissedDeliveryEmail(name, deliveryDate, deliveryTime, subscriptionId)
  });
}

// server/whatsappService.ts
import axios from "axios";
var WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
var WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
var WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
async function sendWhatsAppMessage(phoneNumber, message) {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("\u26A0\uFE0F WhatsApp service not configured. Skipping WhatsApp message to:", phoneNumber);
    return false;
  }
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber.replace(/[^0-9]/g, ""),
      // Remove non-numeric characters
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    };
    const response = await axios.post(
      `${WHATSAPP_API_URL}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`\u2705 WhatsApp message sent to ${phoneNumber}:`, response.data?.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error(`\u274C WhatsApp send failed for ${phoneNumber}:`, error instanceof Error ? error.message : error);
    return false;
  }
}
async function sendOrderPlacedAdminNotification(orderId, userName, amount, adminPhone) {
  if (!adminPhone || typeof adminPhone !== "string" || adminPhone.trim().length === 0) {
    console.warn(`\u26A0\uFE0F Admin phone not configured. Skipping order notification for order ${orderId}`);
    return false;
  }
  const message = `
\u{1F4E6} *NEW ORDER RECEIVED* \u{1F4E6}

Order #: ${orderId}
Customer: ${userName}
Amount: \u20B9${amount}

\u{1F517} View in dashboard to approve payment

-RotiHai Admin System
  `.trim();
  sendWhatsAppMessage(adminPhone, message).catch((error) => {
    console.error(`\u26A0\uFE0F Failed to send admin notification for order ${orderId}:`, error);
  });
  return true;
}
async function sendChefAssignmentNotification(chefId, orderId, items, chefPhone) {
  if (!chefPhone || typeof chefPhone !== "string" || chefPhone.trim().length === 0) {
    console.warn(`\u26A0\uFE0F Chef phone not configured. Skipping assignment notification for chef ${chefId}, order ${orderId}`);
    return false;
  }
  const itemsList = items.join(", ");
  const message = `
\u{1F468}\u200D\u{1F373} *NEW ORDER ASSIGNED* \u{1F468}\u200D\u{1F373}

Order #: ${orderId}
Items: ${itemsList}
Prep Time: ~30 minutes

Please accept and start preparation!

-RotiHai Team
  `.trim();
  sendWhatsAppMessage(chefPhone, message).catch((error) => {
    console.error(`\u26A0\uFE0F Failed to send chef assignment notification for order ${orderId}:`, error);
  });
  return true;
}
async function sendDeliveryAvailableNotification(deliveryPersonIds, orderId, address, deliveryPersonPhones) {
  if (!deliveryPersonIds || deliveryPersonIds.length === 0) {
    console.warn(`\u26A0\uFE0F No delivery personnel available for order ${orderId}`);
    return 0;
  }
  const message = `
\u{1F69A} *ORDER READY FOR DELIVERY* \u{1F69A}

Order #: ${orderId}
Delivery Address: ${address}

\u{1F4CD} Tap to accept this delivery

-RotiHai Team
  `.trim();
  let successCount = 0;
  for (const deliveryPersonId of deliveryPersonIds) {
    const phone = deliveryPersonPhones.get(deliveryPersonId);
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      console.warn(`\u26A0\uFE0F Phone not found for delivery person ${deliveryPersonId}, skipping notification`);
      continue;
    }
    sendWhatsAppMessage(phone, message).then((success) => {
      if (success) successCount++;
    }).catch((error) => {
      console.error(`\u26A0\uFE0F Failed to send delivery notification to ${deliveryPersonId}:`, error);
    });
  }
  return successCount;
}
async function sendDeliveryCompletedNotification(userId, orderId, userPhone) {
  if (!userPhone || typeof userPhone !== "string" || userPhone.trim().length === 0) {
    console.warn(`\u26A0\uFE0F User phone not configured. Skipping delivery notification for user ${userId}, order ${orderId}`);
    return false;
  }
  const message = `
\u2705 *ORDER DELIVERED* \u2705

Order #: ${orderId}
Thank you for ordering with RotiHai!

\u2B50 Please rate your experience

-RotiHai Team
  `.trim();
  sendWhatsAppMessage(userPhone, message).catch((error) => {
    console.error(`\u26A0\uFE0F Failed to send delivery notification for order ${orderId}:`, error);
  });
  return true;
}
async function sendMissedDeliveryNotification(userId, userPhone, deliveryDate, deliveryTime, subscriptionId) {
  if (!userPhone || typeof userPhone !== "string" || userPhone.trim().length === 0) {
    console.warn(`\u26A0\uFE0F User phone not configured. Skipping missed delivery notification for user ${userId}`);
    return false;
  }
  const message = `
\u26A0\uFE0F *DELIVERY COULD NOT BE COMPLETED* \u26A0\uFE0F

We apologize! Your scheduled delivery on ${deliveryDate} at ${deliveryTime} could not be completed.

\u{1F4DE} Please contact our support team to reschedule or get assistance.

Subscription ID: ${subscriptionId}

We regret the inconvenience!
-RotiHai Team
  `.trim();
  sendWhatsAppMessage(userPhone, message).catch((error) => {
    console.error(`\u26A0\uFE0F Failed to send missed delivery notification for subscription ${subscriptionId}:`, error);
  });
  return true;
}

// server/adminRoutes.ts
function registerAdminRoutes(app2) {
  function isDeliveryDay2(date, frequency, deliveryDays) {
    if (!deliveryDays || deliveryDays.length === 0) return false;
    if (frequency === "monthly") {
      const dayOfMonth = date.getDate().toString();
      return deliveryDays.includes(dayOfMonth);
    } else if (frequency === "weekly" || frequency === "daily") {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      return deliveryDays.includes(dayName);
    }
    return false;
  }
  function getNextDeliveryDate(fromDate, frequency, deliveryDays, maxDate) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    let attempts = 0;
    const maxAttempts = frequency === "monthly" ? 31 : 7;
    const limit = maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
    while (attempts < maxAttempts) {
      if (nextDate > limit) {
        return nextDate;
      }
      if (isDeliveryDay2(nextDate, frequency, deliveryDays)) {
        return nextDate;
      }
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }
    return nextDate;
  }
  app2.get("/api/admin/delivery-slots", requireAdmin(), async (req, res) => {
    try {
      const slots = await storage.getAllDeliveryTimeSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching delivery slots:", error);
      res.status(500).json({ message: "Failed to fetch delivery slots" });
    }
  });
  app2.post("/api/admin/delivery-slots", requireAdmin(), async (req, res) => {
    try {
      const validation = insertDeliveryTimeSlotsSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const slot = await storage.createDeliveryTimeSlot(validation.data);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating delivery slot:", error);
      res.status(500).json({ message: "Failed to create delivery slot" });
    }
  });
  app2.patch("/api/admin/delivery-slots/:id", requireAdmin(), async (req, res) => {
    try {
      const validation = insertDeliveryTimeSlotsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const slot = await storage.updateDeliveryTimeSlot(req.params.id, validation.data);
      if (!slot) {
        res.status(404).json({ message: "Delivery slot not found" });
        return;
      }
      res.json(slot);
    } catch (error) {
      console.error("Error updating delivery slot:", error);
      res.status(500).json({ message: "Failed to update delivery slot" });
    }
  });
  app2.delete("/api/admin/delivery-slots/:id", requireAdmin(), async (req, res) => {
    try {
      const deleted = await storage.deleteDeliveryTimeSlot(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Delivery slot not found" });
        return;
      }
      res.json({ message: "Delivery slot deleted" });
    } catch (error) {
      console.error("Error deleting delivery slot:", error);
      res.status(500).json({ message: "Failed to delete delivery slot" });
    }
  });
  app2.post("/api/admin/auth/test-login", (req, res) => {
    try {
      const { username = "admin", role = "super_admin" } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      console.log(`[Test Login] \u{1F513} Bypass login for: ${username}`);
      const mockAdmin = {
        id: `admin-${username}`,
        username,
        email: `${username}@rotihai.com`,
        phone: null,
        role,
        passwordHash: "",
        lastLoginAt: null,
        createdAt: /* @__PURE__ */ new Date()
      };
      const accessToken = generateAccessToken(mockAdmin);
      const refreshToken = generateRefreshToken(mockAdmin);
      console.log(`[Test Login] \u2705 Token generated for: ${username}`);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      res.json({
        accessToken,
        admin: {
          id: mockAdmin.id,
          username: mockAdmin.username,
          email: mockAdmin.email,
          role: mockAdmin.role
        },
        message: "\u2705 Test login successful (development bypass mode)"
      });
    } catch (error) {
      console.error("\u274C Test login error:", error);
      res.status(500).json({
        message: "Test login failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/admin/auth/login", async (req, res) => {
    const loginAttempt = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      username: req.body.username,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      success: false
    };
    try {
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("[Admin Login Failed]", { ...loginAttempt, reason: "Invalid credentials format" });
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const { username, password } = validation.data;
      let admin;
      try {
        admin = await storage.getAdminByUsername(username);
      } catch (dbError) {
        console.error("Database error while fetching admin:", dbError);
        res.status(500).json({ message: "Database error. Please ensure admin user exists." });
        return;
      }
      if (!admin) {
        console.log("[Admin Login Failed]", { ...loginAttempt, reason: "User not found" });
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const isPasswordValid = await verifyPassword(password, admin.passwordHash);
      if (!isPasswordValid) {
        console.log("[Admin Login Failed]", { ...loginAttempt, reason: "Invalid password" });
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      await storage.updateAdminLastLogin(admin.id);
      const accessToken = generateAccessToken(admin);
      const refreshToken = generateRefreshToken(admin);
      const tokenPayload = jwt4.verify(accessToken, process.env.JWT_SECRET || "admin-jwt-secret-change-in-production");
      console.log("[Admin Login Success]", {
        ...loginAttempt,
        success: true,
        adminId: admin.id,
        role: admin.role,
        tokenPayload
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      res.json({
        accessToken,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error("[Admin Login Error]", { ...loginAttempt, error: error instanceof Error ? error.message : "Unknown error" });
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/admin/auth/logout", requireAdmin(), (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  });
  app2.post("/api/admin/auth/reset-password", async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      if (!username || !newPassword) {
        return res.status(400).json({ message: "Username and newPassword are required" });
      }
      console.log(`[Password Reset] Attempting to reset password for: ${username}`);
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        console.log(`[Password Reset] Admin user '${username}' not found`);
        return res.status(404).json({
          message: `Admin user '${username}' not found`
        });
      }
      const newPasswordHash = await hashPassword(newPassword);
      await storage.updateAdminPassword(admin.id, newPasswordHash);
      let emailSent = false;
      if (admin.email) {
        const emailHtml = createAdminPasswordResetEmail(admin.username, newPassword);
        emailSent = await sendEmail({
          to: admin.email,
          subject: "\u{1F510} Admin Password Reset - RotiHai",
          html: emailHtml
        });
        if (emailSent) {
          console.log(`\u2705 Password reset email sent to ${admin.email}`);
        }
      }
      console.log(`[Password Reset] \u2705 Password reset successfully for: ${username}`);
      res.json({
        message: emailSent ? "\u2705 Password reset successfully. Email has been sent to the admin." : "\u2705 Password reset successfully (no email configured)",
        username,
        newPassword,
        emailSent,
        instruction: "Admin can now login with the new password"
      });
    } catch (error) {
      console.error("\u274C Password reset error:", error);
      res.status(500).json({
        message: "Password reset failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/admin/auth/logout", requireAdmin(), (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  });
  app2.post("/api/admin/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token provided" });
        return;
      }
      const payload = verifyToken(refreshToken);
      if (!payload) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }
      const admin = await storage.getAdminById(payload.adminId);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      const newAccessToken = generateAccessToken(admin);
      const newRefreshToken = generateRefreshToken(admin);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Admin token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });
  app2.get("/api/admin/dashboard/metrics", requireAdmin(), async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  app2.get("/api/admin/orders", requireAdmin(), async (req, res) => {
    try {
      const orders3 = await storage.getAllOrders();
      res.json(orders3);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.patch("/api/admin/orders/:id/status", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      broadcastOrderUpdate(order);
      if (status === "confirmed" && order.assignedTo) {
        notifyDeliveryAssignment(order, order.assignedTo);
      }
      if (status === "delivered" && order.userId) {
        try {
          const user = await storage.getUser(order.userId);
          if (user && user.phone) {
            sendDeliveryCompletedNotification(order.userId, id, user.phone).catch((error) => {
              console.warn(`\u26A0\uFE0F Failed to send delivery notification for order ${id}:`, error);
            });
          }
        } catch (notificationError) {
          console.warn(`\u26A0\uFE0F Error sending delivery notification: ${notificationError.message}`);
        }
      }
      if (status === "delivered" && order.userId) {
        try {
          await storage.completeReferralOnFirstOrder(order.userId, id);
          console.log(`\u2705 Referral completion triggered for order ${id}`);
        } catch (referralError) {
          console.warn(`\u26A0\uFE0F Error completing referral: ${referralError.message}`);
        }
      }
      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  app2.patch("/api/admin/orders/:orderId/payment", requireAdmin(), async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentStatus } = req.body;
      if (!paymentStatus || !["pending", "paid", "confirmed"].includes(paymentStatus)) {
        res.status(400).json({ message: "Invalid payment status" });
        return;
      }
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.paymentStatus === paymentStatus) {
        console.log(`\u23ED\uFE0F Admin payment confirmation is idempotent. Order ${orderId} is already ${paymentStatus}. Skipping...`);
        res.json(order);
        return;
      }
      console.log(`
\u{1F4B3} ADMIN CONFIRMING PAYMENT FOR ORDER ${orderId}`);
      console.log(`Current order status: ${order.status}, Payment status: ${order.paymentStatus}`);
      console.log(`Chef ID: ${order.chefId}`);
      const updatedOrder = await storage.updateOrderPaymentStatus(orderId, paymentStatus);
      console.log(`\u2705 Updated order payment status: ${updatedOrder?.paymentStatus}`);
      if (paymentStatus === "confirmed") {
        const confirmedOrder = await storage.updateOrderStatus(orderId, "confirmed");
        if (confirmedOrder) {
          console.log(`
\u{1F3AF} ORDER CONFIRMED - PREPARING BROADCAST`);
          console.log(`Order ID: ${confirmedOrder.id}`);
          console.log(`Status: ${confirmedOrder.status}`);
          console.log(`Payment Status: ${confirmedOrder.paymentStatus}`);
          console.log(`Chef ID: ${confirmedOrder.chefId}`);
          console.log(`Customer: ${confirmedOrder.customerName}`);
          if (confirmedOrder.deliveryTime && confirmedOrder.deliverySlotId && confirmedOrder.chefId) {
            console.log(`\u{1F4CB} Scheduled delivery order detected for ${orderId} - Delivery Time: ${confirmedOrder.deliveryTime}`);
          }
          console.log(`
\u{1F4E1} NOW BROADCASTING TO CHEF AND ADMINS...`);
          broadcastOrderUpdate(confirmedOrder);
        }
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: error.message || "Failed to update payment status" });
    }
  });
  app2.post("/api/admin/orders/:id/approve", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.adminId || "system";
      const order = await storage.approveOrder(id, adminId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      broadcastOrderUpdate(order);
      if (order.status === "confirmed" && order.assignedTo) {
        notifyDeliveryAssignment(order, order.assignedTo);
      }
      res.json(order);
    } catch (error) {
      console.error("Approve order error:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });
  app2.post("/api/admin/orders/:id/reject", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.admin?.adminId || "system";
      if (!reason) {
        res.status(400).json({ message: "Rejection reason is required" });
        return;
      }
      const order = await storage.rejectOrder(id, adminId, reason);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      broadcastOrderUpdate(order);
      res.json(order);
    } catch (error) {
      console.error("Reject order error:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });
  app2.post("/api/admin/orders/:id/assign", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { deliveryPersonId } = req.body;
      console.log(`\u{1F468}\u200D\u{1F4BC} Admin assigning order ${id} to delivery person ${deliveryPersonId}`);
      if (!deliveryPersonId) {
        res.status(400).json({ message: "Delivery person ID is required" });
        return;
      }
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (!deliveryPerson) {
        res.status(404).json({ message: "Delivery person not found" });
        return;
      }
      if (!deliveryPerson.isActive) {
        res.status(400).json({ message: "Delivery person is not active" });
        return;
      }
      let order = await storage.assignOrderToDeliveryPerson(id, deliveryPersonId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      cancelPreparedOrderTimeout(id);
      console.log(`\u2705 Admin assigned order ${id} to ${deliveryPerson.name} (${deliveryPerson.phone})`);
      broadcastOrderUpdate(order);
      notifyDeliveryAssignment(order, deliveryPersonId);
      res.json(order);
    } catch (error) {
      console.error("Assign order error:", error);
      res.status(500).json({ message: "Failed to assign order" });
    }
  });
  app2.get("/api/admin/delivery-personnel", requireAdmin(), async (req, res) => {
    try {
      const personnel = await storage.getAllDeliveryPersonnel();
      const sanitized = personnel.map(({ passwordHash, ...rest }) => rest);
      res.json(sanitized);
    } catch (error) {
      console.error("Get delivery personnel error:", error);
      res.status(500).json({ message: "Failed to fetch delivery personnel" });
    }
  });
  app2.get("/api/admin/delivery-personnel/available", requireAdmin(), async (req, res) => {
    try {
      const personnel = await storage.getAvailableDeliveryPersonnel();
      const sanitized = personnel.map(({ passwordHash, ...rest }) => rest);
      res.json(sanitized);
    } catch (error) {
      console.error("Get available delivery personnel error:", error);
      res.status(500).json({ message: "Failed to fetch available delivery personnel" });
    }
  });
  app2.post("/api/admin/delivery-personnel", requireAdminOrManager(), async (req, res) => {
    try {
      const validation = insertDeliveryPersonnelSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const { password, ...dataWithoutPassword } = validation.data;
      const passwordHash = await hashPassword2(password);
      const deliveryPerson = await storage.createDeliveryPersonnel({
        ...dataWithoutPassword,
        passwordHash
      });
      const { passwordHash: _, ...sanitized } = deliveryPerson;
      res.status(201).json(sanitized);
    } catch (error) {
      console.error("Create delivery personnel error:", error);
      if (error.message?.includes("unique")) {
        res.status(409).json({ message: "Phone number already exists" });
        return;
      }
      res.status(500).json({ message: "Failed to create delivery personnel" });
    }
  });
  app2.patch("/api/admin/delivery-personnel/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const deliveryPerson = await storage.updateDeliveryPersonnel(id, updates);
      if (!deliveryPerson) {
        res.status(404).json({ message: "Delivery person not found" });
        return;
      }
      const { passwordHash, ...sanitized } = deliveryPerson;
      res.json(sanitized);
    } catch (error) {
      console.error("Update delivery personnel error:", error);
      res.status(500).json({ message: "Failed to update delivery personnel" });
    }
  });
  app2.delete("/api/admin/delivery-personnel/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDeliveryPersonnel(id);
      res.json({ message: "Delivery person deleted successfully" });
    } catch (error) {
      console.error("Delete delivery personnel error:", error);
      res.status(500).json({ message: "Failed to delete delivery personnel" });
    }
  });
  app2.get("/api/admin/categories", requireAdmin(), async (req, res) => {
    try {
      const categories3 = await storage.getAllCategories();
      res.json(categories3);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/admin/categories", requireAdminOrManager(), async (req, res) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const category = await storage.createCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  app2.patch("/api/admin/categories/reorder", requireAdminOrManager(), async (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items) || items.some((i) => !i.id || typeof i.displayOrder !== "number")) {
        res.status(400).json({ message: "Body must be an array of { id, displayOrder } objects" });
        return;
      }
      await storage.reorderCategories(items);
      res.json({ success: true });
    } catch (error) {
      console.error("Reorder categories error:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });
  app2.patch("/api/admin/categories/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  app2.delete("/api/admin/categories/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/admin/products", requireAdmin(), async (req, res) => {
    try {
      const products3 = await storage.getAllProducts();
      res.json(products3);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.post("/api/admin/products", requireAdminOrManager(), async (req, res) => {
    try {
      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const product = await storage.createProduct(validation.data);
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  app2.patch("/api/admin/products/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      if (req.body.isAvailable !== void 0 || req.body.stockQuantity !== void 0) {
        broadcastProductAvailabilityUpdate(product);
      }
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  app2.delete("/api/admin/products/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  app2.get("/api/admin/users", requireAdmin(), async (req, res) => {
    try {
      const users3 = await storage.getAllUsers();
      res.json(users3);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/admin/users/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.get("/api/admin/admins", requireSuperAdmin(), async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitized = admins.map((admin) => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Get admins error:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });
  app2.post("/api/admin/admins", requireSuperAdmin(), async (req, res) => {
    try {
      const validation = insertAdminUserSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const existingAdmin = await storage.getAdminByUsername(validation.data.username);
      if (existingAdmin) {
        res.status(409).json({ message: "Username already exists" });
        return;
      }
      const passwordHash = await hashPassword(validation.data.password);
      const admin = await storage.createAdmin({
        ...validation.data,
        passwordHash
      });
      res.status(201).json({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        password: validation.data.password,
        createdAt: admin.createdAt
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });
  app2.get("/api/admin/chefs", requireAdmin(), async (req, res) => {
    try {
      const chefs3 = await storage.getChefs();
      const serializedChefs = chefs3.map((chef) => ({
        ...chef,
        isActive: Boolean(chef.isActive)
      }));
      res.json(serializedChefs);
    } catch (error) {
      console.error("Get chefs error:", error);
      res.status(500).json({ message: "Failed to fetch chefs" });
    }
  });
  app2.post("/api/admin/chefs", requireAdminOrManager(), async (req, res) => {
    try {
      const { name, description, image, categoryId, address, latitude, longitude } = req.body;
      if (!name || !description || !image || !categoryId) {
        res.status(400).json({ message: "Name, description, image, and category are required" });
        return;
      }
      if (address) {
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          res.status(400).json({ message: "Valid coordinates (latitude/longitude) required when address is provided" });
          return;
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          res.status(400).json({ message: "Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180" });
          return;
        }
      }
      const chef = await storage.createChef(req.body);
      res.status(201).json(chef);
    } catch (error) {
      console.error("Create chef error:", error);
      res.status(500).json({ message: "Failed to create chef" });
    }
  });
  app2.patch("/api/admin/chefs/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { address, latitude, longitude } = req.body;
      if (address) {
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          res.status(400).json({ message: "Valid coordinates (latitude/longitude) required when address is provided" });
          return;
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          res.status(400).json({ message: "Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180" });
          return;
        }
      }
      const chef = await storage.updateChef(id, req.body);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      if (req.body.isActive !== void 0) {
        const { broadcastChefStatusUpdate: broadcastChefStatusUpdate3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        broadcastChefStatusUpdate3(chef);
      }
      res.json(chef);
    } catch (error) {
      console.error("Error updating chef:", error);
      res.status(500).json({ message: "Failed to update chef" });
    }
  });
  app2.delete("/api/admin/chefs/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteChef(id);
      if (!deleted) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      res.json({ message: "Chef deleted successfully" });
    } catch (error) {
      console.error("Delete chef error:", error);
      res.status(500).json({ message: "Failed to delete chef" });
    }
  });
  app2.get("/api/admin/partners", requireAdmin(), async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      const sanitized = partners.map((partner) => ({
        id: partner.id,
        username: partner.username,
        email: partner.email,
        chefId: partner.chefId,
        lastLoginAt: partner.lastLoginAt,
        createdAt: partner.createdAt
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Get partners error:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });
  app2.post("/api/admin/partners", requireAdmin(), async (req, res) => {
    try {
      const { chefId, username, email, password } = req.body;
      if (!chefId || !username || !email || !password) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ message: "Password must be at least 8 characters" });
        return;
      }
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername.length < 3) {
        res.status(400).json({ message: "Username must be at least 3 characters" });
        return;
      }
      const existingPartner = await storage.getPartnerByUsername(normalizedUsername);
      if (existingPartner) {
        res.status(400).json({ message: "Username already exists" });
        return;
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(400).json({ message: "Chef not found" });
        return;
      }
      const allPartners = await storage.getAllPartners();
      const partnerForChef = allPartners.find((p) => p.chefId === chefId);
      if (partnerForChef) {
        res.status(400).json({ message: "A partner account for this chef already exists" });
        return;
      }
      const normalizedEmail = (email || "").trim().toLowerCase();
      const emailConflict = allPartners.find((p) => p.email === normalizedEmail);
      if (emailConflict) {
        res.status(400).json({ message: "Email already in use by another partner" });
        return;
      }
      const passwordHash = await hashPassword(password);
      const partner = await storage.createPartner({
        chefId,
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash
      });
      res.json(partner);
    } catch (error) {
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });
  app2.delete("/api/admin/partners/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePartner(id);
      if (!deleted) {
        res.status(404).json({ message: "Partner not found" });
        return;
      }
      res.json({ message: "Partner deleted successfully" });
    } catch (error) {
      console.error("Delete partner error:", error);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });
  app2.patch("/api/admin/admins/:id/reset-password", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const admin = await storage.getAdminById(id);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let tempPassword = "";
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newPasswordHash = await hashPassword(tempPassword);
      await storage.updateAdminPassword(id, newPasswordHash);
      let emailSent = false;
      if (admin.email) {
        const emailHtml = createAdminPasswordResetEmail(admin.username, tempPassword);
        emailSent = await sendEmail({
          to: admin.email,
          subject: "\u{1F510} Admin Password Reset - RotiHai",
          html: emailHtml
        });
        if (emailSent) {
          console.log(`\u2705 Password reset email sent to ${admin.email}`);
        }
      }
      console.log(`[Password Reset] \u2705 Super Admin reset password for: ${admin.username}`);
      res.json({
        message: emailSent ? "\u2705 Password reset successfully. Email has been sent to the admin." : "\u2705 Password reset successfully (no email configured)",
        adminUsername: admin.username,
        tempPassword,
        emailSent
      });
    } catch (error) {
      console.error("\u274C Admin password reset error:", error);
      res.status(500).json({
        message: "Password reset failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/admin/admins/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) {
        res.status(400).json({ message: "Role is required" });
        return;
      }
      const admin = await storage.updateAdminRole(id, role);
      if (!admin) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      res.json({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt
      });
    } catch (error) {
      console.error("Update admin role error:", error);
      res.status(500).json({ message: "Failed to update admin role" });
    }
  });
  app2.delete("/api/admin/admins/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const adminReq = req;
      if (adminReq.admin?.adminId === id) {
        res.status(400).json({ message: "Cannot delete your own admin account" });
        return;
      }
      const deleted = await storage.deleteAdmin(id);
      if (!deleted) {
        res.status(404).json({ message: "Admin not found" });
        return;
      }
      res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({ message: "Failed to delete admin" });
    }
  });
  app2.get("/api/admin/promotional-banners", requireAdmin(), async (req, res) => {
    try {
      const banners = await storage.getAllPromotionalBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching promotional banners:", error);
      res.status(500).json({ message: "Failed to fetch promotional banners" });
    }
  });
  app2.post("/api/admin/promotional-banners", requireAdmin(), async (req, res) => {
    try {
      const banner = await storage.createPromotionalBanner(req.body);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating promotional banner:", error);
      res.status(500).json({ message: "Failed to create promotional banner" });
    }
  });
  app2.patch("/api/admin/promotional-banners/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await storage.updatePromotionalBanner(id, req.body);
      if (!banner) {
        res.status(404).json({ message: "Banner not found" });
        return;
      }
      res.json(banner);
    } catch (error) {
      console.error("Error updating promotional banner:", error);
      res.status(500).json({ message: "Failed to update promotional banner" });
    }
  });
  app2.delete("/api/admin/promotional-banners/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePromotionalBanner(id);
      if (!deleted) {
        res.status(404).json({ message: "Banner not found" });
        return;
      }
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting promotional banner:", error);
      res.status(500).json({ message: "Failed to delete promotional banner" });
    }
  });
  app2.get("/api/admin/subscription-plans", requireAdmin(), async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });
  app2.post("/api/admin/subscription-plans", requireAdminOrManager(), async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Create subscription plan error:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });
  app2.patch("/api/admin/subscription-plans/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.updateSubscriptionPlan(id, req.body);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error("Update subscription plan error:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });
  app2.delete("/api/admin/subscription-plans/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(id);
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Delete subscription plan error:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });
  app2.get("/api/admin/subscriptions", requireAdmin(), async (req, res) => {
    try {
      const subscriptions4 = await storage.getSubscriptions();
      res.json(subscriptions4);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch subscriptions" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/confirm-payment", requireAdmin(), async (req, res) => {
    try {
      const subscriptionId = req.params.id?.trim();
      if (!subscriptionId) {
        res.status(400).json({ message: "Subscription ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.isPaid) {
        res.status(400).json({
          message: "Subscription already confirmed and active",
          subscription
        });
        return;
      }
      if (!subscription.paymentTransactionId) {
        res.status(400).json({
          message: "No payment transaction ID found. User must submit payment first."
        });
        return;
      }
      let chefId = subscription.chefId;
      let chefAssignedAt = subscription.chefAssignedAt;
      let nextDeliveryDate = subscription.nextDeliveryDate;
      if (!chefId) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        if (!plan) {
          res.status(404).json({ message: "Subscription plan not found" });
          return;
        }
        const bestChef = await storage.findBestChefForCategory(plan.categoryId);
        if (bestChef) {
          chefId = bestChef.id;
          chefAssignedAt = /* @__PURE__ */ new Date();
          console.log(`\u{1F468}\u200D\u{1F373} Auto-assigned chef ${bestChef.name} (${bestChef.id}) to subscription ${subscriptionId}`);
        } else {
          console.warn(`\u26A0\uFE0F No available chef found for category ${plan.categoryId}`);
        }
      }
      if (!nextDeliveryDate || isNaN(new Date(nextDeliveryDate).getTime())) {
        if (subscription.startDate) {
          nextDeliveryDate = new Date(subscription.startDate);
          console.log(`\u{1F4C5} Recalculated nextDeliveryDate as startDate: ${nextDeliveryDate.toISOString()}`);
        } else {
          console.warn(`\u26A0\uFE0F Cannot calculate nextDeliveryDate: startDate missing, using today`);
          nextDeliveryDate = /* @__PURE__ */ new Date();
        }
      } else {
        console.log(`\u{1F4C5} Using existing nextDeliveryDate: ${new Date(nextDeliveryDate).toISOString()}`);
      }
      const updated = await storage.updateSubscription(subscriptionId, {
        isPaid: true,
        status: "active",
        chefId,
        chefAssignedAt,
        nextDeliveryDate
      });
      if (!updated) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }
      console.log(`\u2705 Admin confirmed payment for subscription ${subscriptionId} (TxnID: ${subscription.paymentTransactionId}) - Subscription activated`);
      const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3, broadcastSubscriptionAssignmentToPartner: broadcastSubscriptionAssignmentToPartner3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
      if (updated) {
        const plan = await storage.getSubscriptionPlan(updated.planId);
        broadcastSubscriptionUpdate3(updated);
        console.log(`\u{1F4E3} Broadcasted subscription activation to all connected clients`);
        if (chefId) {
          const chef = await storage.getChefById(chefId);
          broadcastSubscriptionAssignmentToPartner3(updated, chef?.name, plan?.name);
          console.log(`\u{1F4E3} Broadcasted assignment notification to partner (Chef: ${chef?.name})`);
        }
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      let nextDeliveryDateObj = updated.nextDeliveryDate;
      if (typeof nextDeliveryDateObj === "string") {
        nextDeliveryDateObj = new Date(nextDeliveryDateObj);
      }
      const nextDelivery = new Date(nextDeliveryDateObj);
      nextDelivery.setHours(0, 0, 0, 0);
      if (nextDelivery.getTime() === today.getTime() && chefId) {
        const existingLog = await storage.getDeliveryLogBySubscriptionAndDate(subscriptionId, today);
        if (!existingLog) {
          await storage.createSubscriptionDeliveryLog({
            subscriptionId,
            date: today,
            time: updated.nextDeliveryTime || "09:00",
            status: "scheduled",
            deliveryPersonId: null,
            notes: "Auto-created on payment confirmation"
          });
          console.log(`\u{1F4CB} Created today's delivery log for subscription ${subscriptionId}`);
        }
      }
      res.json({
        message: "Payment verified and subscription activated",
        subscription: updated
      });
    } catch (error) {
      console.error("Error confirming subscription payment:", error);
      res.status(500).json({
        message: error.message || "Failed to confirm payment"
      });
    }
  });
  app2.post("/api/admin/subscriptions/:id/verify-payment", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Admin verifying subscription payment:", id);
      const subscription = await db.query.subscriptions.findFirst({
        where: eq2(subscriptions.id, id)
      });
      if (!subscription) {
        console.error("Subscription not found for verification:", id);
        return res.status(404).json({ message: "Subscription not found" });
      }
      if (subscription.isPaid) {
        return res.status(400).json({ message: "Payment already verified" });
      }
      if (!subscription.paymentTransactionId) {
        return res.status(400).json({ message: "No payment transaction ID found" });
      }
      let chefId = subscription.chefId;
      let chefAssignedAt = subscription.chefAssignedAt;
      if (!chefId) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        if (plan) {
          const bestChef = await storage.findBestChefForCategory(plan.categoryId);
          if (bestChef) {
            chefId = bestChef.id;
            chefAssignedAt = /* @__PURE__ */ new Date();
            console.log(`\u{1F468}\u200D\u{1F373} Auto-assigned chef ${bestChef.name} (${bestChef.id}) to subscription ${id}`);
          }
        }
      }
      await db.update(subscriptions).set({
        isPaid: true,
        status: "active",
        chefId,
        chefAssignedAt,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(subscriptions.id, id));
      console.log("Subscription payment verified successfully:", id);
      res.json({
        message: "Payment verified and subscription activated"
      });
    } catch (error) {
      console.error("Error verifying subscription payment:", error);
      res.status(500).json({
        message: "Failed to verify payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.put("/api/admin/subscriptions/:id/assign-chef", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { chefId } = req.body;
      if (!chefId) {
        res.status(400).json({ message: "Chef ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      if (!chef.isActive) {
        res.status(400).json({ message: "Chef is not active" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (plan && chef.categoryId !== plan.categoryId) {
        res.status(400).json({
          message: `Chef ${chef.name} belongs to a different category. Expected category: ${plan.categoryId}, Chef category: ${chef.categoryId}`
        });
        return;
      }
      const updated = await storage.assignChefToSubscription(id, chefId);
      console.log(`\u{1F468}\u200D\u{1F373} Admin reassigned chef ${chef.name} (${chefId}) to subscription ${id}`);
      if (updated) {
        const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        broadcastSubscriptionUpdate3(updated);
        broadcastSubscriptionAssignmentToPartner(updated, chef.name, plan?.name);
        const planItems = plan?.items ? Array.isArray(plan.items) ? plan.items : [] : [];
        sendChefAssignmentNotification(chefId, id, planItems, chef.phone).catch((error) => {
          console.warn(`\u26A0\uFE0F Failed to send WhatsApp to chef ${chef.name}:`, error);
        });
      }
      res.json({
        message: `Chef ${chef.name} assigned to subscription successfully`,
        subscription: updated
      });
    } catch (error) {
      console.error("Error assigning chef to subscription:", error);
      res.status(500).json({ message: error.message || "Failed to assign chef" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/adjust-payment", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const {
        walletAmount,
        couponCode,
        discountAmount,
        notes,
        transactionId
      } = req.body;
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      let originalPrice = plan.price;
      let walletUsed = 0;
      let couponDiscount = 0;
      let adminDiscount = discountAmount || 0;
      if (walletAmount && walletAmount > 0) {
        const user = await storage.getUser(subscription.userId);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        if (walletAmount > user.walletBalance) {
          res.status(400).json({ message: `Insufficient wallet balance. Available: ${user.walletBalance}` });
          return;
        }
        walletUsed = walletAmount;
      }
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (!coupon) {
          res.status(404).json({ message: "Coupon not found" });
          return;
        }
        if (!coupon.isActive) {
          res.status(400).json({ message: "Coupon is not active" });
          return;
        }
        if (coupon.expiryDate && new Date(coupon.expiryDate) < /* @__PURE__ */ new Date()) {
          res.status(400).json({ message: "Coupon has expired" });
          return;
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          res.status(400).json({ message: "Coupon usage limit reached" });
          return;
        }
        if (coupon.discountType === "percentage") {
          couponDiscount = Math.round(originalPrice * (coupon.discountValue / 100));
          if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
            couponDiscount = coupon.maxDiscountAmount;
          }
        } else {
          couponDiscount = coupon.discountValue;
        }
      }
      const finalAmount = Math.max(0, originalPrice - walletUsed - couponDiscount - adminDiscount);
      if (walletUsed > 0) {
        await storage.updateUser(subscription.userId, {
          walletBalance: (await storage.getUser(subscription.userId)).walletBalance - walletUsed
        });
        await storage.createWalletTransaction({
          userId: subscription.userId,
          amount: -walletUsed,
          type: "debit",
          description: `Subscription payment for ${plan.name}`,
          referenceId: subscription.id,
          referenceType: "subscription"
        });
      }
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon) {
          await storage.updateCoupon(coupon.id, {
            usedCount: coupon.usedCount + 1
          });
        }
      }
      const updated = await storage.updateSubscription(id, {
        originalPrice,
        discountAmount: adminDiscount,
        walletAmountUsed: walletUsed,
        couponCode: couponCode || null,
        couponDiscount,
        finalAmount,
        paymentNotes: notes || null,
        paymentTransactionId: transactionId || subscription.paymentTransactionId
      });
      console.log(`\u{1F4B0} Admin adjusted payment for subscription ${id}: Original \u20B9${originalPrice}, Wallet \u20B9${walletUsed}, Coupon \u20B9${couponDiscount}, Discount \u20B9${adminDiscount}, Final \u20B9${finalAmount}`);
      res.json({
        message: "Payment adjusted successfully",
        subscription: updated,
        paymentBreakdown: {
          originalPrice,
          walletUsed,
          couponDiscount,
          adminDiscount,
          finalAmount
        }
      });
    } catch (error) {
      console.error("Error adjusting subscription payment:", error);
      res.status(500).json({ message: error.message || "Failed to adjust payment" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/quick-confirm", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionId, notes } = req.body;
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.isPaid) {
        res.status(400).json({ message: "Subscription is already paid" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      let chefId = subscription.chefId;
      let chefAssignedAt = subscription.chefAssignedAt;
      if (!chefId) {
        const bestChef = await storage.findBestChefForCategory(plan.categoryId);
        if (bestChef) {
          chefId = bestChef.id;
          chefAssignedAt = /* @__PURE__ */ new Date();
          console.log(`\u{1F468}\u200D\u{1F373} Auto-assigned chef ${bestChef.name} (${bestChef.id}) to subscription ${id}`);
        }
      }
      const updated = await storage.updateSubscription(id, {
        isPaid: true,
        status: "active",
        chefId,
        chefAssignedAt,
        paymentTransactionId: transactionId || null,
        originalPrice: plan.price,
        finalAmount: plan.price,
        paymentNotes: notes || null
      });
      console.log(`\u2705 Admin quick-confirmed payment for subscription ${id} (TxnID: ${transactionId || "N/A"})`);
      res.json({
        message: "Payment confirmed and subscription activated",
        subscription: updated
      });
    } catch (error) {
      console.error("Error quick confirming payment:", error);
      res.status(500).json({ message: error.message || "Failed to confirm payment" });
    }
  });
  app2.get("/api/admin/subscriptions/:id/payment-details", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      res.json({
        subscriptionId: id,
        planName: plan?.name || "Unknown",
        planPrice: plan?.price || 0,
        isPaid: subscription.isPaid,
        paymentTransactionId: subscription.paymentTransactionId,
        originalPrice: subscription.originalPrice || plan?.price || 0,
        walletAmountUsed: subscription.walletAmountUsed || 0,
        couponCode: subscription.couponCode,
        couponDiscount: subscription.couponDiscount || 0,
        discountAmount: subscription.discountAmount || 0,
        finalAmount: subscription.finalAmount || plan?.price || 0,
        paymentNotes: subscription.paymentNotes
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment details" });
    }
  });
  app2.get("/api/admin/subscriptions/today-deliveries", requireAdmin(), async (req, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const subscriptions4 = allSubscriptions.filter((s) => s.isPaid && s.status !== "cancelled");
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const deliveries = [];
      let preparing = 0;
      let outForDelivery = 0;
      let delivered = 0;
      let scheduled = 0;
      for (const sub of subscriptions4) {
        if (!sub.nextDeliveryDate || isNaN(new Date(sub.nextDeliveryDate).getTime())) {
          continue;
        }
        const nextDelivery = new Date(sub.nextDeliveryDate);
        nextDelivery.setHours(0, 0, 0, 0);
        const nextDeliveryStr = nextDelivery.toISOString().split("T")[0];
        if (nextDeliveryStr === todayStr && sub.status !== "paused" && sub.status !== "cancelled") {
          const plan = await storage.getSubscriptionPlan(sub.planId);
          const deliveryLog = todaysLogs.find((log3) => log3.subscriptionId === sub.id);
          const currentStatus = deliveryLog?.status || "scheduled";
          if (currentStatus === "preparing") preparing++;
          else if (currentStatus === "out_for_delivery") outForDelivery++;
          else if (currentStatus === "delivered") delivered++;
          else scheduled++;
          deliveries.push({
            id: deliveryLog?.id || sub.id,
            subscriptionId: sub.id,
            customerName: sub.customerName,
            phone: sub.phone,
            address: sub.address,
            planName: plan?.name || "Unknown Plan",
            time: sub.nextDeliveryTime || "09:00",
            status: currentStatus
          });
        }
      }
      res.json({
        totalToday: deliveries.length,
        scheduled,
        preparing,
        outForDelivery,
        delivered,
        deliveries
      });
    } catch (error) {
      console.error("Error fetching today's deliveries:", error);
      res.status(500).json({ message: "Failed to fetch today's deliveries" });
    }
  });
  app2.get("/api/admin/subscriptions/missed-deliveries", requireAdmin(), async (req, res) => {
    try {
      const { dateFrom, dateTo, chefId, limit = 50, offset = 0 } = req.query;
      const allSubscriptions = await storage.getSubscriptions();
      const missedDeliveries = [];
      for (const sub of allSubscriptions) {
        const logs = await storage.getSubscriptionDeliveryLogs(sub.id);
        const missedLogs = logs.filter((log3) => log3.status === "missed");
        for (const log3 of missedLogs) {
          if (dateFrom) {
            const logDate = new Date(log3.date);
            const fromDate = new Date(dateFrom);
            if (logDate < fromDate) continue;
          }
          if (dateTo) {
            const logDate = new Date(log3.date);
            const toDate = new Date(dateTo);
            if (logDate > toDate) continue;
          }
          if (chefId && sub.chefId !== chefId) continue;
          missedDeliveries.push({
            logId: log3.id,
            subscriptionId: sub.id,
            userId: sub.userId,
            chefId: sub.chefId,
            customerName: sub.customerName,
            phone: sub.phone,
            address: sub.address,
            deliveryDate: log3.date,
            deliveryTime: log3.time,
            status: log3.status,
            notes: log3.notes,
            createdAt: log3.createdAt
          });
        }
      }
      missedDeliveries.sort((a, b) => {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return dateB - dateA;
      });
      const paginatedResults = missedDeliveries.slice(Number(offset) || 0, (Number(offset) || 0) + Number(limit));
      console.log(`\u{1F4CA} [ADMIN-MISSED] Retrieved ${paginatedResults.length} missed deliveries`);
      res.json({
        total: missedDeliveries.length,
        limit: Number(limit),
        offset: Number(offset) || 0,
        data: paginatedResults
      });
    } catch (error) {
      console.error("Error fetching missed deliveries:", error);
      res.status(500).json({ message: "Failed to fetch missed deliveries" });
    }
  });
  app2.get("/api/admin/subscriptions/skipped-deliveries", requireAdmin(), async (req, res) => {
    try {
      const { dateFrom, dateTo, userId, limit = 50, offset = 0 } = req.query;
      const allSubscriptions = await storage.getSubscriptions();
      const skippedDeliveries = [];
      for (const sub of allSubscriptions) {
        const logs = await storage.getSubscriptionDeliveryLogs(sub.id);
        const skippedLogs = logs.filter((log3) => log3.status === "skipped");
        for (const log3 of skippedLogs) {
          if (dateFrom) {
            const logDate = new Date(log3.date);
            const fromDate = new Date(dateFrom);
            if (logDate < fromDate) continue;
          }
          if (dateTo) {
            const logDate = new Date(log3.date);
            const toDate = new Date(dateTo);
            if (logDate > toDate) continue;
          }
          if (userId && sub.userId !== userId) continue;
          skippedDeliveries.push({
            logId: log3.id,
            subscriptionId: sub.id,
            userId: sub.userId,
            customerName: sub.customerName,
            phone: sub.phone,
            address: sub.address,
            deliveryDate: log3.date,
            deliveryTime: log3.time,
            status: log3.status,
            reason: log3.notes,
            // This contains the skip reason
            createdAt: log3.createdAt
          });
        }
      }
      skippedDeliveries.sort((a, b) => {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return dateB - dateA;
      });
      const paginatedResults = skippedDeliveries.slice(Number(offset) || 0, (Number(offset) || 0) + Number(limit));
      console.log(`\u{1F4CA} [ADMIN-SKIPPED] Retrieved ${paginatedResults.length} skipped deliveries`);
      res.json({
        total: skippedDeliveries.length,
        limit: Number(limit),
        offset: Number(offset) || 0,
        data: paginatedResults
      });
    } catch (error) {
      console.error("Error fetching skipped deliveries:", error);
      res.status(500).json({ message: "Failed to fetch skipped deliveries" });
    }
  });
  app2.get("/api/admin/subscriptions/today", requireAdmin(), async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const enrichedDeliveries = [];
      for (const log3 of todaysLogs) {
        const sub = await storage.getSubscription(log3.subscriptionId);
        if (!sub) continue;
        enrichedDeliveries.push({
          logId: log3.id,
          subscriptionId: sub.id,
          userId: sub.userId,
          chefId: sub.chefId,
          chefName: sub.chefId ? (await storage.getChefById(sub.chefId))?.name : null,
          planName: (await storage.getSubscriptionPlan(sub.planId))?.name,
          customerName: sub.customerName,
          phone: sub.phone,
          address: sub.address,
          deliveryTime: log3.time,
          status: log3.status,
          notes: log3.notes,
          remainingDeliveries: sub.remainingDeliveries
        });
      }
      const summary = {
        scheduled: enrichedDeliveries.filter((d) => d.status === "scheduled").length,
        preparing: enrichedDeliveries.filter((d) => d.status === "preparing").length,
        out_for_delivery: enrichedDeliveries.filter((d) => d.status === "out_for_delivery").length,
        delivered: enrichedDeliveries.filter((d) => d.status === "delivered").length,
        missed: enrichedDeliveries.filter((d) => d.status === "missed").length,
        total: enrichedDeliveries.length
      };
      console.log(`\u{1F4CB} [ADMIN-TODAY] Today's subscriptions summary:`, summary);
      res.json({
        date: today.toISOString().split("T")[0],
        summary,
        deliveries: enrichedDeliveries
      });
    } catch (error) {
      console.error("Error fetching today's subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch today's subscriptions" });
    }
  });
  app2.get("/api/admin/subscriptions/overdue-preparations", requireAdmin(), async (req, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const overduePreparations = [];
      for (const sub of allSubscriptions) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const logs = await storage.getSubscriptionDeliveryLogsByDate(today);
        const todaysLogs = logs.filter((log3) => log3.subscriptionId === sub.id && log3.status === "preparing");
        for (const log3 of todaysLogs) {
          const [hours, minutes] = log3.time.split(":").map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);
          const now = /* @__PURE__ */ new Date();
          if (now > scheduledTime) {
            overduePreparations.push({
              logId: log3.id,
              subscriptionId: sub.id,
              userId: sub.userId,
              chefId: sub.chefId,
              chefName: sub.chefId ? (await storage.getChefById(sub.chefId))?.name : null,
              customerName: sub.customerName,
              phone: sub.phone,
              address: sub.address,
              scheduledTime: log3.time,
              status: log3.status,
              minutesOverdue: Math.floor((now.getTime() - scheduledTime.getTime()) / 6e4)
            });
          }
        }
      }
      console.log(`\u23F0 [ADMIN-OVERDUE] Found ${overduePreparations.length} overdue preparations`);
      res.json(overduePreparations);
    } catch (error) {
      console.error("Error fetching overdue preparations:", error);
      res.status(500).json({ message: "Failed to fetch overdue preparations" });
    }
  });
  app2.get("/api/admin/chef-performance", requireAdmin(), async (req, res) => {
    try {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allChefs = await storage.getChefs();
      const allSubscriptions = await storage.getSubscriptions();
      const performanceData = await Promise.all(
        allChefs.map(async (chef) => {
          const chefSubscriptions = allSubscriptions.filter((sub) => sub.chefId === chef.id);
          let totalDeliveries = 0;
          let delivered = 0;
          let missed = 0;
          for (const sub of chefSubscriptions) {
            const logs = await storage.getSubscriptionDeliveryLogs(sub.id);
            const recentLogs = logs.filter((log3) => new Date(log3.date) >= thirtyDaysAgo);
            totalDeliveries += recentLogs.length;
            delivered += recentLogs.filter((log3) => log3.status === "delivered").length;
            missed += recentLogs.filter((log3) => log3.status === "missed").length;
          }
          return {
            chefId: chef.id,
            chefName: chef.name,
            deliveryRate: totalDeliveries === 0 ? 0 : Math.round(delivered / totalDeliveries * 100),
            totalDeliveries,
            delivered,
            missed
          };
        })
      );
      const sorted = performanceData.sort((a, b) => b.deliveryRate - a.deliveryRate);
      res.json({
        leaderboard: sorted,
        period: "Last 30 days",
        lastUpdated: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error fetching chef performance leaderboard:", error);
      res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
    }
  });
  app2.get("/api/admin/subscriptions/:id", requireAdmin(), async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });
  app2.get("/api/admin/subscriptions/:id/delivery-logs", requireAdmin(), async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const logs = await storage.getSubscriptionDeliveryLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching delivery logs:", error);
      res.status(500).json({ message: "Failed to fetch delivery logs" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/delivery-logs", requireAdmin(), async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const { date, status, notes, deliveryPersonId, deliveryTime } = req.body;
      const log3 = await storage.createSubscriptionDeliveryLog({
        subscriptionId: req.params.id,
        date: new Date(date),
        status: status || "scheduled",
        notes: notes || null,
        deliveryPersonId: deliveryPersonId || null,
        time: deliveryTime || subscription.nextDeliveryTime || "09:00"
      });
      console.log(`\u{1F4DD} Admin created delivery log for subscription ${req.params.id}: ${status}`);
      res.status(201).json(log3);
    } catch (error) {
      console.error("Error creating delivery log:", error);
      res.status(500).json({ message: "Failed to create delivery log" });
    }
  });
  app2.patch("/api/admin/subscriptions/:subscriptionId/delivery-logs/:logId", requireAdmin(), async (req, res) => {
    try {
      const { subscriptionId, logId } = req.params;
      const { status, notes, deliveryPersonId, deliveryTime } = req.body;
      if (!subscriptionId?.trim() || !logId?.trim()) {
        res.status(400).json({ message: "Valid subscription ID and log ID are required" });
        return;
      }
      const validStatuses = ["scheduled", "preparing", "out_for_delivery", "delivered", "missed"];
      if (status && !validStatuses.includes(status)) {
        res.status(400).json({
          message: "Invalid status",
          validStatuses
        });
        return;
      }
      if (deliveryTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(deliveryTime)) {
        res.status(400).json({
          message: "Invalid delivery time format. Use HH:mm"
        });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId.trim());
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const existingLog = await storage.getSubscriptionDeliveryLog(logId.trim());
      if (!existingLog || existingLog.subscriptionId !== subscriptionId.trim()) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== void 0) updateData.notes = notes;
      if (deliveryPersonId !== void 0) updateData.deliveryPersonId = deliveryPersonId;
      if (deliveryTime !== void 0) updateData.time = deliveryTime;
      const updatedLog = await storage.updateSubscriptionDeliveryLog(logId.trim(), updateData);
      if (!updatedLog) {
        res.status(500).json({ message: "Failed to update delivery log" });
        return;
      }
      if (status === "delivered" && existingLog.date && subscription.remainingDeliveries > 0) {
        await storage.updateSubscription(subscriptionId.trim(), {
          lastDeliveryDate: new Date(existingLog.date),
          remainingDeliveries: Math.max(0, subscription.remainingDeliveries - 1)
        });
      }
      console.log(`\u270F\uFE0F Admin updated delivery log ${logId} status to: ${status}`);
      res.json(updatedLog);
    } catch (error) {
      console.error("Error updating delivery log:", error);
      res.status(500).json({
        message: error.message || "Failed to update delivery log"
      });
    }
  });
  app2.post("/api/admin/subscriptions/delivery-logs/today", requireAdmin(), async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      const logs = await storage.getSubscriptionDeliveryLogsByDate(today);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching today's delivery logs:", error);
      res.status(500).json({ message: "Failed to fetch today's delivery logs" });
    }
  });
  app2.patch("/api/admin/subscriptions/:subscriptionId/delivery-status", requireAdmin(), async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { status } = req.body;
      const adminId = req.admin?.adminId || "system";
      if (!status || !["scheduled", "preparing", "out_for_delivery", "delivered", "missed"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const time = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      let deliveryLog = todaysLogs.find((log3) => log3.subscriptionId === subscriptionId);
      if (!deliveryLog) {
        deliveryLog = await storage.createSubscriptionDeliveryLog({
          subscriptionId,
          date: today,
          time,
          status,
          deliveryPersonId: null,
          notes: `Status set to ${status} by admin`
        });
      } else {
        deliveryLog = await storage.updateSubscriptionDeliveryLog(deliveryLog.id, {
          status,
          notes: `Status updated to ${status} by admin`
        });
      }
      if (status === "delivered" && subscription.remainingDeliveries > 0) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        const subscriptionUpdateData = {
          remainingDeliveries: subscription.remainingDeliveries - 1,
          lastDeliveryDate: today
        };
        if (plan) {
          const deliveryDays = plan.deliveryDays;
          const maxDate = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
          const nextDelivery = getNextDeliveryDate(subscription.nextDeliveryDate, plan.frequency, deliveryDays, maxDate);
          subscriptionUpdateData.nextDeliveryDate = nextDelivery;
        } else {
          const nextDate = new Date(subscription.nextDeliveryDate);
          nextDate.setDate(nextDate.getDate() + 1);
          subscriptionUpdateData.nextDeliveryDate = nextDate;
        }
        await storage.updateSubscription(subscriptionId, subscriptionUpdateData);
        await storage.syncDeliveryHistory(subscriptionId, "delivered", today, "Marked delivered by admin");
      }
      if (status === "missed") {
        await storage.syncDeliveryHistory(subscriptionId, "missed", today, "Marked as missed by admin");
        try {
          const user = await storage.getUser(subscription.userId);
          if (user) {
            const deliveryDate = today.toLocaleDateString("en-IN");
            const deliveryTime = time || "Unknown time";
            await sendMissedDeliveryNotification(
              user.id,
              user.phone,
              deliveryDate,
              deliveryTime,
              subscriptionId
            );
            if (user.email) {
              await sendMissedDeliveryEmail(
                user.email,
                user.name || "Valued Customer",
                deliveryDate,
                deliveryTime,
                subscriptionId
              );
            }
          }
        } catch (notifyError) {
          console.warn("\u26A0\uFE0F Failed to send missed delivery notifications:", notifyError);
        }
      }
      console.log(`\u2705 Admin updated subscription ${subscriptionId} delivery status to: ${status}`);
      res.json(deliveryLog);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });
  app2.patch("/api/admin/subscriptions/:subscriptionId/status", requireAdmin(), async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { status } = req.body;
      if (!status || !["active", "paused", "cancelled"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updateData = { status };
      if (status === "paused") {
        updateData.pauseStartDate = /* @__PURE__ */ new Date();
      } else if (status === "active") {
        updateData.pauseStartDate = null;
        updateData.pauseResumeDate = null;
      }
      const updated = await storage.updateSubscription(subscriptionId, updateData);
      console.log(`\u{1F4CB} Admin changed subscription ${subscriptionId} status to: ${status}`);
      res.json(updated);
    } catch (error) {
      console.error("Error changing subscription status:", error);
      res.status(500).json({ message: "Failed to change subscription status" });
    }
  });
  app2.get("/api/admin/subscriptions/missed-deliveries", requireAdmin(), async (req, res) => {
    try {
      const { dateFrom, dateTo, chefId, limit = 50, offset = 0 } = req.query;
      const allSubscriptions = await storage.getSubscriptions();
      const missedDeliveries = [];
      for (const sub of allSubscriptions) {
        const logs = await storage.getSubscriptionDeliveryLogs(sub.id);
        const missedLogs = logs.filter((log3) => log3.status === "missed");
        for (const log3 of missedLogs) {
          if (dateFrom) {
            const logDate = new Date(log3.date);
            const fromDate = new Date(dateFrom);
            if (logDate < fromDate) continue;
          }
          if (dateTo) {
            const logDate = new Date(log3.date);
            const toDate = new Date(dateTo);
            if (logDate > toDate) continue;
          }
          if (chefId && sub.chefId !== chefId) continue;
          missedDeliveries.push({
            logId: log3.id,
            subscriptionId: sub.id,
            userId: sub.userId,
            chefId: sub.chefId,
            customerName: sub.customerName,
            phone: sub.phone,
            address: sub.address,
            deliveryDate: log3.date,
            deliveryTime: log3.time,
            status: log3.status,
            notes: log3.notes,
            createdAt: log3.createdAt
          });
        }
      }
      missedDeliveries.sort((a, b) => {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return dateB - dateA;
      });
      const paginatedResults = missedDeliveries.slice(
        Number(offset) || 0,
        (Number(offset) || 0) + Number(limit)
      );
      console.log(`\u{1F4CA} [ADMIN-MISSED] Retrieved ${paginatedResults.length} missed deliveries (total: ${missedDeliveries.length})`);
      res.json({
        total: missedDeliveries.length,
        limit: Number(limit),
        offset: Number(offset) || 0,
        data: paginatedResults
      });
    } catch (error) {
      console.error("Error fetching missed deliveries:", error);
      res.status(500).json({ message: "Failed to fetch missed deliveries" });
    }
  });
  app2.get("/api/admin/subscriptions/today", requireAdmin(), async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const enrichedDeliveries = [];
      for (const log3 of todaysLogs) {
        const sub = await storage.getSubscription(log3.subscriptionId);
        if (!sub) continue;
        enrichedDeliveries.push({
          logId: log3.id,
          subscriptionId: sub.id,
          userId: sub.userId,
          chefId: sub.chefId,
          chefName: sub.chefId ? (await storage.getChefById(sub.chefId))?.name : null,
          planName: (await storage.getSubscriptionPlan(sub.planId))?.name,
          customerName: sub.customerName,
          phone: sub.phone,
          address: sub.address,
          deliveryTime: log3.time,
          status: log3.status,
          notes: log3.notes,
          remainingDeliveries: sub.remainingDeliveries
        });
      }
      const summary = {
        scheduled: enrichedDeliveries.filter((d) => d.status === "scheduled").length,
        preparing: enrichedDeliveries.filter((d) => d.status === "preparing").length,
        out_for_delivery: enrichedDeliveries.filter((d) => d.status === "out_for_delivery").length,
        delivered: enrichedDeliveries.filter((d) => d.status === "delivered").length,
        missed: enrichedDeliveries.filter((d) => d.status === "missed").length,
        total: enrichedDeliveries.length
      };
      console.log(`\u{1F4CB} [ADMIN-TODAY] Today's subscriptions summary:`, summary);
      res.json({
        date: today.toISOString().split("T")[0],
        summary,
        deliveries: enrichedDeliveries
      });
    } catch (error) {
      console.error("Error fetching today's subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch today's subscriptions" });
    }
  });
  app2.get("/api/admin/subscriptions/overdue-preparations", requireAdmin(), async (req, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const overduePreparations = [];
      for (const sub of allSubscriptions) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const logs = await storage.getSubscriptionDeliveryLogsByDate(today);
        const todaysLogs = logs.filter((log3) => log3.subscriptionId === sub.id && log3.status === "preparing");
        for (const log3 of todaysLogs) {
          const [hours, minutes] = log3.time.split(":").map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);
          const now = /* @__PURE__ */ new Date();
          if (now > scheduledTime) {
            overduePreparations.push({
              logId: log3.id,
              subscriptionId: sub.id,
              userId: sub.userId,
              chefId: sub.chefId,
              chefName: sub.chefId ? (await storage.getChefById(sub.chefId))?.name : null,
              customerName: sub.customerName,
              phone: sub.phone,
              address: sub.address,
              scheduledTime: log3.time,
              status: log3.status,
              minutesOverdue: Math.floor((now.getTime() - scheduledTime.getTime()) / 6e4)
            });
          }
        }
      }
      console.log(`\u23F0 [ADMIN-OVERDUE] Found ${overduePreparations.length} overdue preparations`);
      res.json(overduePreparations);
    } catch (error) {
      console.error("Error fetching overdue preparations:", error);
      res.status(500).json({ message: "Failed to fetch overdue preparations" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/adjust", requireAdmin(), async (req, res) => {
    try {
      const { adjustment, deliveryAdjustment, reason, extendDays, status, nextDeliveryDate } = req.body;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updateData = {};
      const deliveryChange = adjustment ?? deliveryAdjustment;
      if (typeof deliveryChange === "number" && deliveryChange !== 0) {
        const newRemaining = Math.max(0, subscription.remainingDeliveries + deliveryChange);
        updateData.remainingDeliveries = newRemaining;
        updateData.totalDeliveries = Math.max(0, subscription.totalDeliveries + deliveryChange);
      }
      if (typeof extendDays === "number" && extendDays > 0 && subscription.endDate) {
        const currentEndDate = new Date(subscription.endDate);
        currentEndDate.setDate(currentEndDate.getDate() + extendDays);
        updateData.endDate = currentEndDate;
      }
      if (status && ["active", "paused", "cancelled"].includes(status)) {
        updateData.status = status;
        if (status === "active") {
          updateData.pauseStartDate = null;
          updateData.pauseResumeDate = null;
        }
      }
      if (nextDeliveryDate) {
        updateData.nextDeliveryDate = new Date(nextDeliveryDate);
      }
      const updated = await storage.updateSubscription(req.params.id, updateData);
      console.log(`\u2699\uFE0F Admin adjusted subscription ${req.params.id}: deliveryChange=${deliveryChange}, status=${status}, extendDays=${extendDays}, reason=${reason}`);
      if (updated) {
        const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        broadcastSubscriptionUpdate3(updated);
      }
      res.json({ message: "Subscription adjusted successfully", subscription: updated });
    } catch (error) {
      console.error("Error adjusting subscription:", error);
      res.status(500).json({ message: "Failed to adjust subscription" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/status", requireAdmin(), async (req, res) => {
    try {
      const { status, pauseStartDate, pauseResumeDate } = req.body;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updateData = { status };
      if (status === "paused") {
        updateData.pauseStartDate = pauseStartDate ? new Date(pauseStartDate) : /* @__PURE__ */ new Date();
        if (pauseResumeDate) {
          updateData.pauseResumeDate = new Date(pauseResumeDate);
        }
      } else if (status === "active") {
        updateData.pauseStartDate = null;
        updateData.pauseResumeDate = null;
      }
      const updated = await storage.updateSubscription(req.params.id, updateData);
      console.log(`\u{1F504} Admin updated subscription ${req.params.id} status to: ${status}`);
      if (updated) {
        const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        broadcastSubscriptionUpdate3(updated);
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      res.status(500).json({ message: "Failed to update subscription status" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/cancel", requireAdmin(), async (req, res) => {
    try {
      const { reason, refundAmount, refundReason } = req.body;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, {
        status: "cancelled",
        pauseStartDate: null,
        pauseResumeDate: null
      });
      if (refundAmount && refundAmount > 0) {
        await storage.createWalletTransaction({
          userId: subscription.userId,
          amount: refundAmount,
          type: "credit",
          description: refundReason || `Subscription cancellation refund - ${reason || "No reason provided"}`,
          referenceId: subscription.id,
          referenceType: "subscription_refund"
        });
        console.log(`\u{1F4B0} Refund of ${refundAmount} processed for subscription ${req.params.id}`);
      }
      console.log(`\u274C Admin cancelled subscription ${req.params.id}: ${reason || "No reason provided"}`);
      res.json({ message: "Subscription cancelled successfully", subscription: updated, refundProcessed: !!refundAmount });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  app2.put("/api/admin/subscriptions/:id/update-count", requireAdmin(), async (req, res) => {
    try {
      const { deliveriesRemaining, reason } = req.body;
      if (typeof deliveriesRemaining !== "number" || !Number.isInteger(deliveriesRemaining) || deliveriesRemaining < 0) {
        res.status(400).json({ message: "Deliveries remaining must be a non-negative integer" });
        return;
      }
      if (deliveriesRemaining > 1e3) {
        res.status(400).json({ message: "Deliveries remaining cannot exceed 1000" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const previousCount = subscription.remainingDeliveries;
      const updated = await storage.updateSubscription(req.params.id, {
        remainingDeliveries: deliveriesRemaining
      });
      console.log(`\u{1F4CA} Admin updated subscription ${req.params.id} delivery count: ${previousCount} -> ${deliveriesRemaining} (${reason || "No reason"})`);
      res.json({
        message: "Delivery count updated successfully",
        subscription: updated,
        previousCount,
        newCount: deliveriesRemaining
      });
    } catch (error) {
      console.error("Error updating delivery count:", error);
      res.status(500).json({ message: "Failed to update delivery count" });
    }
  });
  app2.put("/api/admin/subscriptions/:id/change-slot", requireAdmin(), async (req, res) => {
    try {
      const { deliverySlotId, deliveryTime, reason } = req.body;
      if (!deliverySlotId && !deliveryTime) {
        res.status(400).json({ message: "Either deliverySlotId or deliveryTime is required" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      let validatedSlotTime = deliveryTime;
      if (deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlotById(deliverySlotId);
        if (!slot) {
          res.status(400).json({ message: "Invalid delivery slot ID" });
          return;
        }
        if (!slot.isActive) {
          res.status(400).json({ message: "Selected delivery slot is not active" });
          return;
        }
        validatedSlotTime = deliveryTime || slot.startTime;
      }
      if (validatedSlotTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(validatedSlotTime)) {
        res.status(400).json({ message: "Invalid delivery time format (use HH:mm)" });
        return;
      }
      const previousSlot = subscription.deliverySlotId;
      const previousTime = subscription.nextDeliveryTime;
      const updated = await storage.updateSubscription(req.params.id, {
        deliverySlotId: deliverySlotId || subscription.deliverySlotId,
        nextDeliveryTime: validatedSlotTime || subscription.nextDeliveryTime
      });
      console.log(`\u{1F550} Admin changed subscription ${req.params.id} delivery slot: ${previousSlot} -> ${deliverySlotId || "unchanged"} (${reason || "No reason"})`);
      res.json({
        message: "Delivery slot changed successfully",
        subscription: updated,
        previousSlot,
        newSlot: deliverySlotId || previousSlot
      });
    } catch (error) {
      console.error("Error changing delivery slot:", error);
      res.status(500).json({ message: "Failed to change delivery slot" });
    }
  });
  app2.put("/api/admin/subscriptions/:id/expire", requireAdmin(), async (req, res) => {
    try {
      const { reason } = req.body;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, {
        status: "expired",
        remainingDeliveries: 0,
        pauseStartDate: null,
        pauseResumeDate: null
      });
      console.log(`\u23F0 Admin expired subscription ${req.params.id}: ${reason || "No reason provided"}`);
      res.json({ message: "Subscription marked as expired", subscription: updated });
    } catch (error) {
      console.error("Error expiring subscription:", error);
      res.status(500).json({ message: "Failed to expire subscription" });
    }
  });
  app2.put("/api/admin/subscriptions/:id/extend", requireAdmin(), async (req, res) => {
    try {
      const { additionalDays, additionalDeliveries, reason } = req.body;
      if (!additionalDays && !additionalDeliveries) {
        res.status(400).json({ message: "Either additionalDays or additionalDeliveries is required" });
        return;
      }
      if (additionalDays !== void 0 && additionalDays !== null) {
        if (typeof additionalDays !== "number" || !Number.isInteger(additionalDays) || additionalDays < 1) {
          res.status(400).json({ message: "additionalDays must be a positive integer" });
          return;
        }
        if (additionalDays > 365) {
          res.status(400).json({ message: "additionalDays cannot exceed 365" });
          return;
        }
      }
      if (additionalDeliveries !== void 0 && additionalDeliveries !== null) {
        if (typeof additionalDeliveries !== "number" || !Number.isInteger(additionalDeliveries) || additionalDeliveries < 1) {
          res.status(400).json({ message: "additionalDeliveries must be a positive integer" });
          return;
        }
        if (additionalDeliveries > 500) {
          res.status(400).json({ message: "additionalDeliveries cannot exceed 500" });
          return;
        }
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const updateData = {};
      if (additionalDays && typeof additionalDays === "number" && additionalDays > 0) {
        const currentEndDate = subscription.endDate ? new Date(subscription.endDate) : /* @__PURE__ */ new Date();
        currentEndDate.setDate(currentEndDate.getDate() + additionalDays);
        updateData.endDate = currentEndDate;
      }
      if (additionalDeliveries && typeof additionalDeliveries === "number" && additionalDeliveries > 0) {
        updateData.remainingDeliveries = (subscription.remainingDeliveries || 0) + additionalDeliveries;
        updateData.totalDeliveries = (subscription.totalDeliveries || 0) + additionalDeliveries;
      }
      if (subscription.status === "expired" || subscription.status === "cancelled") {
        updateData.status = "active";
      }
      const updated = await storage.updateSubscription(req.params.id, updateData);
      console.log(`\u{1F4C8} Admin extended subscription ${req.params.id}: +${additionalDays || 0} days, +${additionalDeliveries || 0} deliveries (${reason || "No reason"})`);
      res.json({
        message: "Subscription extended successfully",
        subscription: updated,
        extended: {
          additionalDays: additionalDays || 0,
          additionalDeliveries: additionalDeliveries || 0
        }
      });
    } catch (error) {
      console.error("Error extending subscription:", error);
      res.status(500).json({ message: "Failed to extend subscription" });
    }
  });
  app2.delete("/api/admin/subscriptions/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const logs = await storage.getSubscriptionDeliveryLogs(id);
      for (const log3 of logs) {
        await storage.deleteSubscriptionDeliveryLog(log3.id);
      }
      await storage.deleteSubscription(id);
      console.log(`\u{1F5D1}\uFE0F Admin deleted subscription ${id} for ${subscription.customerName}`);
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/renew", requireAdmin(), async (req, res) => {
    try {
      const { startDate, customPrice, paymentStatus } = req.body;
      if (customPrice !== void 0 && customPrice !== null) {
        if (typeof customPrice !== "number" || customPrice < 0) {
          res.status(400).json({ message: "customPrice must be a non-negative number" });
          return;
        }
        if (customPrice > 1e5) {
          res.status(400).json({ message: "customPrice cannot exceed 100000" });
          return;
        }
      }
      if (startDate) {
        const parsedDate = new Date(startDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ message: "Invalid startDate format" });
          return;
        }
      }
      const validStatuses = ["pending", "confirmed", "paid"];
      if (paymentStatus && !validStatuses.includes(paymentStatus)) {
        res.status(400).json({ message: `paymentStatus must be one of: ${validStatuses.join(", ")}` });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      const newStartDate = startDate ? new Date(startDate) : /* @__PURE__ */ new Date();
      const deliveryDays = plan.deliveryDays || [];
      const deliveriesPerPeriod = deliveryDays.length || 1;
      const totalDeliveries = subscription.totalDeliveries ?? 30;
      let durationDays = 30;
      if (plan.frequency === "daily") {
        durationDays = totalDeliveries;
      } else if (plan.frequency === "weekly") {
        durationDays = Math.ceil(totalDeliveries / deliveriesPerPeriod) * 7;
      } else if (plan.frequency === "monthly") {
        durationDays = Math.ceil(totalDeliveries / deliveriesPerPeriod) * 30;
      }
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + durationDays);
      const newSubscription = await storage.createSubscription({
        userId: subscription.userId,
        planId: subscription.planId,
        customerName: subscription.customerName,
        phone: subscription.phone,
        email: subscription.email,
        status: paymentStatus === "confirmed" ? "active" : "pending",
        startDate: newStartDate,
        endDate: newEndDate,
        nextDeliveryDate: newStartDate,
        nextDeliveryTime: subscription.nextDeliveryTime || "09:00",
        totalDeliveries,
        remainingDeliveries: totalDeliveries,
        deliverySlotId: subscription.deliverySlotId,
        address: subscription.address,
        chefId: subscription.chefId,
        chefAssignedAt: subscription.chefAssignedAt,
        originalPrice: customPrice || plan.price,
        finalAmount: customPrice || plan.price,
        isPaid: false,
        couponCode: null,
        walletAmountUsed: 0,
        discountAmount: 0,
        couponDiscount: 0,
        paymentNotes: null,
        paymentTransactionId: null,
        customItems: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null
      });
      console.log(`\u{1F504} Admin renewed subscription ${req.params.id} -> ${newSubscription.id}`);
      res.json({
        message: "Subscription renewed successfully",
        newSubscription,
        previousSubscriptionId: req.params.id
      });
    } catch (error) {
      console.error("Error renewing subscription:", error);
      res.status(500).json({ message: "Failed to renew subscription" });
    }
  });
  app2.get("/api/admin/reports/sales", requireAdmin(), async (req, res) => {
    try {
      const { from, to } = req.query;
      const report = await storage.getSalesReport(
        from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3),
        to ? new Date(to) : /* @__PURE__ */ new Date()
      );
      res.json(report);
    } catch (error) {
      console.error("Get sales report error:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });
  app2.get("/api/admin/reports/users", requireAdmin(), async (req, res) => {
    try {
      const { from, to } = req.query;
      const report = await storage.getUserReport(
        from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3),
        to ? new Date(to) : /* @__PURE__ */ new Date()
      );
      res.json(report);
    } catch (error) {
      console.error("Get user report error:", error);
      res.status(500).json({ message: "Failed to fetch user report" });
    }
  });
  app2.get("/api/admin/reports/inventory", requireAdmin(), async (req, res) => {
    try {
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      console.error("Get inventory report error:", error);
      res.status(500).json({ message: "Failed to fetch inventory report" });
    }
  });
  app2.get("/api/admin/reports/subscriptions", requireAdmin(), async (req, res) => {
    try {
      const { from, to } = req.query;
      const report = await storage.getSubscriptionReport(
        from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3),
        to ? new Date(to) : /* @__PURE__ */ new Date()
      );
      res.json(report);
    } catch (error) {
      console.error("Get subscription report error:", error);
      res.status(500).json({ message: "Failed to fetch subscription report" });
    }
  });
  app2.get("/api/admin/reports/visitors", requireAdmin(), async (req, res) => {
    try {
      const todayVisitors = await storage.getTodayVisitors();
      const totalVisitors = await storage.getTotalVisitors();
      const uniqueVisitors = await storage.getUniqueVisitors();
      const visitorsByPage = await storage.getVisitorsByPage();
      const visitorsLastNDays = await storage.getVisitorsLastNDays(30);
      res.json({
        todayVisitors,
        totalVisitors,
        uniqueVisitors,
        visitorsByPage,
        visitorsLastNDays
      });
    } catch (error) {
      console.error("Get visitors report error:", error);
      res.status(500).json({ message: "Failed to fetch visitors report" });
    }
  });
  app2.get("/api/admin/delivery-settings", requireAdmin(), async (req, res) => {
    try {
      const settings = await storage.getDeliverySettings();
      res.json(settings);
    } catch (error) {
      console.error("Get delivery settings error:", error);
      res.status(500).json({ message: "Failed to fetch delivery settings" });
    }
  });
  app2.post("/api/admin/delivery-settings", requireAdminOrManager(), async (req, res) => {
    try {
      const setting = await storage.createDeliverySetting(req.body);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Create delivery setting error:", error);
      res.status(500).json({ message: "Failed to create delivery setting" });
    }
  });
  app2.patch("/api/admin/delivery-settings/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const setting = await storage.updateDeliverySetting(id, req.body);
      if (!setting) {
        res.status(404).json({ message: "Delivery setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      console.error("Update delivery setting error:", error);
      res.status(500).json({ message: "Failed to update delivery setting" });
    }
  });
  app2.delete("/api/admin/delivery-settings/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDeliverySetting(id);
      res.json({ message: "Delivery setting deleted successfully" });
    } catch (error) {
      console.error("Delete delivery setting error:", error);
      res.status(500).json({ message: "Failed to delete delivery setting" });
    }
  });
  app2.get("/api/admin/sms-settings", requireAdmin(), async (req, res) => {
    try {
      const smsSettings = await storage.getSMSSettings();
      res.json(smsSettings || {
        enableSMS: false,
        smsGateway: "twilio",
        fromNumber: "",
        apiKey: ""
      });
    } catch (error) {
      console.error("Get SMS settings error:", error);
      res.status(500).json({ message: "Failed to fetch SMS settings" });
    }
  });
  app2.post("/api/admin/sms-settings", requireAdmin(), async (req, res) => {
    try {
      const { enableSMS, smsGateway, fromNumber, apiKey } = req.body;
      const settings = {
        enableSMS: !!enableSMS,
        smsGateway: smsGateway || "twilio",
        fromNumber: fromNumber || "",
        apiKey: apiKey || ""
      };
      const result = await storage.updateSMSSettings(settings);
      console.log(`\u2705 SMS settings updated: ${enableSMS ? "ENABLED" : "DISABLED"}`);
      res.json(result);
    } catch (error) {
      console.error("Update SMS settings error:", error);
      res.status(500).json({ message: "Failed to update SMS settings" });
    }
  });
  app2.get("/api/admin/notification-settings", requireAdmin(), async (req, res) => {
    try {
      const smsSettings = await storage.getSMSSettings();
      const enableWhatsApp = process.env.WHATSAPP_API_URL ? true : false;
      const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
      const settings = {
        enableWhatsApp,
        whatsappPhoneNumberId,
        enableSMS: smsSettings?.enableSMS || false,
        smsGateway: smsSettings?.smsGateway || "twilio",
        fromNumber: smsSettings?.fromNumber || "",
        updatedAt: smsSettings?.updatedAt
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });
  app2.post("/api/admin/notification-settings", requireAdmin(), async (req, res) => {
    try {
      const { enableWhatsApp, enableSMS, smsGateway, fromNumber, apiKey } = req.body;
      if (!enableWhatsApp && !enableSMS) {
        res.status(400).json({ message: "At least one notification method must be enabled" });
        return;
      }
      const smsSettings = {
        enableSMS: !!enableSMS,
        smsGateway: smsGateway || "twilio",
        fromNumber: fromNumber || "",
        apiKey: apiKey || ""
      };
      await storage.updateSMSSettings(smsSettings);
      console.log(`\u2705 Notification settings updated - WhatsApp: ${enableWhatsApp ? "ENABLED" : "DISABLED"}, SMS: ${enableSMS ? "ENABLED" : "DISABLED"}`);
      const settings = {
        enableWhatsApp,
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        enableSMS,
        smsGateway,
        fromNumber,
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.json(settings);
    } catch (error) {
      console.error("Update notification settings error:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });
  app2.get("/api/admin/wallet-settings", requireAdmin(), async (req, res) => {
    try {
      const walletSetting = await db.query.walletSettings.findFirst({
        where: (ws, { eq: eq7 }) => eq7(ws.isActive, true)
      });
      const referralSetting = await db.query.referralRewards.findFirst({
        where: (rr, { eq: eq7 }) => eq7(rr.isActive, true)
      });
      const defaultWallet = {
        maxUsagePerOrder: 10,
        minOrderAmount: 0,
        referrerBonus: 100,
        referredBonus: 50
      };
      const defaultReferral = {
        maxReferralsPerMonth: 10,
        maxEarningsPerMonth: 500,
        expiryDays: 30
      };
      const response = {
        // From walletSettings table
        id: walletSetting?.id || "default",
        maxUsagePerOrder: walletSetting?.maxUsagePerOrder || defaultWallet.maxUsagePerOrder,
        minOrderAmount: walletSetting?.minOrderAmount || defaultWallet.minOrderAmount,
        referrerBonus: walletSetting?.referrerBonus || defaultWallet.referrerBonus,
        referredBonus: walletSetting?.referredBonus || defaultWallet.referredBonus,
        isActive: walletSetting?.isActive || true,
        // From referralRewards table
        maxReferralsPerMonth: referralSetting?.maxReferralsPerMonth || defaultReferral.maxReferralsPerMonth,
        maxEarningsPerMonth: referralSetting?.maxEarningsPerMonth || defaultReferral.maxEarningsPerMonth,
        expiryDays: referralSetting?.expiryDays || defaultReferral.expiryDays
      };
      console.log("[ADMIN] Wallet settings response:", response);
      res.json(response);
    } catch (error) {
      console.error("Get wallet settings error:", error);
      res.status(500).json({ message: "Failed to fetch wallet settings" });
    }
  });
  app2.post("/api/admin/wallet-settings", requireAdminOrManager(), async (req, res) => {
    try {
      const {
        maxUsagePerOrder,
        referrerBonus,
        referredBonus,
        minOrderAmount,
        maxReferralsPerMonth,
        maxEarningsPerMonth,
        expiryDays
      } = req.body;
      console.log("[ADMIN WALLET SETTINGS] Request received:", {
        maxUsagePerOrder,
        minOrderAmount,
        referrerBonus,
        referredBonus
      });
      await db.update(walletSettings2).set({ isActive: false });
      console.log("[ADMIN WALLET SETTINGS] Attempting to INSERT into walletSettings with:", {
        maxUsagePerOrder,
        minOrderAmount: minOrderAmount || 0,
        referrerBonus,
        referredBonus
      });
      const [newWalletSettings] = await db.insert(walletSettings2).values({
        maxUsagePerOrder,
        minOrderAmount: minOrderAmount || 0,
        referrerBonus,
        referredBonus,
        isActive: true
      }).returning();
      console.log("[ADMIN WALLET SETTINGS] Successfully saved to walletSettings:", newWalletSettings);
      const existingRewards = await db.query.referralRewards.findFirst({
        where: (rr, { eq: eq7 }) => eq7(rr.isActive, true)
      });
      if (existingRewards) {
        console.log("[ADMIN WALLET SETTINGS] Updating existing referralRewards...");
        const [updatedRewards] = await db.update(referralRewards2).set({
          referrerBonus,
          referredBonus,
          minOrderAmount: minOrderAmount || 0,
          maxReferralsPerMonth: maxReferralsPerMonth || 10,
          maxEarningsPerMonth: maxEarningsPerMonth || 500,
          expiryDays: expiryDays || 30,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(referralRewards2.id, existingRewards.id)).returning();
        console.log("[ADMIN WALLET SETTINGS] Successfully updated referralRewards:", updatedRewards);
        res.json({ ...newWalletSettings, ...updatedRewards });
      } else {
        console.log("[ADMIN WALLET SETTINGS] Creating new referralRewards...");
        const [newRewards] = await db.insert(referralRewards2).values({
          name: "Admin Configuration",
          referrerBonus,
          referredBonus,
          minOrderAmount: minOrderAmount || 0,
          maxReferralsPerMonth: maxReferralsPerMonth || 10,
          maxEarningsPerMonth: maxEarningsPerMonth || 500,
          expiryDays: expiryDays || 30,
          isActive: true
        }).returning();
        console.log("[ADMIN WALLET SETTINGS] Successfully created referralRewards:", newRewards);
        res.json({ ...newWalletSettings, ...newRewards });
      }
    } catch (error) {
      console.error("Update wallet settings error:", error);
      res.status(500).json({ message: "Failed to update wallet settings" });
    }
  });
  app2.get("/api/admin/cart-settings", requireAdmin(), async (req, res) => {
    try {
      const settings = await storage.getCartSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching cart settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cart settings" });
    }
  });
  app2.post("/api/admin/cart-settings", requireAdminOrManager(), async (req, res) => {
    try {
      const { categoryId, minOrderAmount } = req.body;
      if (!categoryId || minOrderAmount === void 0) {
        res.status(400).json({ message: "Category ID and minimum order amount are required" });
        return;
      }
      const setting = await storage.createCartSetting({
        categoryId,
        minOrderAmount,
        categoryName: "",
        // Will be fetched in storage.createCartSetting
        isActive: true
      });
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating cart setting:", error);
      res.status(500).json({ message: error.message || "Failed to create cart setting" });
    }
  });
  app2.patch("/api/admin/cart-settings/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const setting = await storage.updateCartSetting(id, req.body);
      if (!setting) {
        res.status(404).json({ message: "Cart setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating cart setting:", error);
      res.status(500).json({ message: error.message || "Failed to update cart setting" });
    }
  });
  app2.delete("/api/admin/cart-settings/:id", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCartSetting(id);
      res.json({ message: "Cart setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting cart setting:", error);
      res.status(500).json({ message: error.message || "Failed to delete cart setting" });
    }
  });
  app2.get("/api/admin/delivery-logs", requireAdmin(), async (req, res) => {
    try {
      const { date, subscriptionId } = req.query;
      if (date) {
        const logs = await storage.getSubscriptionDeliveryLogsByDate(new Date(date));
        res.json(logs);
      } else if (subscriptionId) {
        const logs = await storage.getSubscriptionDeliveryLogs(subscriptionId);
        res.json(logs);
      } else {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const logs = await storage.getSubscriptionDeliveryLogsByDate(today);
        res.json(logs);
      }
    } catch (error) {
      console.error("Get delivery logs error:", error);
      res.status(500).json({ message: "Failed to fetch delivery logs" });
    }
  });
  app2.get("/api/admin/delivery-logs/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const log3 = await storage.getSubscriptionDeliveryLog(id);
      if (!log3) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      res.json(log3);
    } catch (error) {
      console.error("Get delivery log error:", error);
      res.status(500).json({ message: "Failed to fetch delivery log" });
    }
  });
  app2.put("/api/admin/delivery-logs/:id/status", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const validStatuses = ["scheduled", "preparing", "out_for_delivery", "delivered", "missed"];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ message: "Valid status is required (scheduled, preparing, out_for_delivery, delivered, missed)" });
        return;
      }
      const existingLog = await storage.getSubscriptionDeliveryLog(id);
      if (!existingLog) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      const updatedLog = await storage.updateSubscriptionDeliveryLog(id, {
        status,
        notes: notes || existingLog.notes
      });
      res.json(updatedLog);
    } catch (error) {
      console.error("Update delivery log status error:", error);
      res.status(500).json({ message: "Failed to update delivery log status" });
    }
  });
  app2.put("/api/admin/delivery-logs/:id/assign-delivery-partner", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { deliveryPersonId } = req.body;
      const existingLog = await storage.getSubscriptionDeliveryLog(id);
      if (!existingLog) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      if (deliveryPersonId) {
        const deliveryPerson = await storage.getDeliveryPersonnel(deliveryPersonId);
        if (!deliveryPerson) {
          res.status(404).json({ message: "Delivery person not found" });
          return;
        }
      }
      const updatedLog = await storage.updateSubscriptionDeliveryLog(id, {
        deliveryPersonId: deliveryPersonId || null
      });
      res.json(updatedLog);
    } catch (error) {
      console.error("Assign delivery partner error:", error);
      res.status(500).json({ message: "Failed to assign delivery partner" });
    }
  });
  app2.post("/api/admin/delivery-logs/:id/mark-delivered", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const existingLog = await storage.getSubscriptionDeliveryLog(id);
      if (!existingLog) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      const updatedLog = await storage.updateSubscriptionDeliveryLog(id, {
        status: "delivered",
        notes: notes || existingLog.notes
      });
      res.json(updatedLog);
    } catch (error) {
      console.error("Mark delivered error:", error);
      res.status(500).json({ message: "Failed to mark as delivered" });
    }
  });
  app2.post("/api/admin/delivery-logs/:id/mark-missed", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const existingLog = await storage.getSubscriptionDeliveryLog(id);
      if (!existingLog) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      const updatedLog = await storage.updateSubscriptionDeliveryLog(id, {
        status: "missed",
        notes: notes || existingLog.notes
      });
      res.json(updatedLog);
    } catch (error) {
      console.error("Mark missed error:", error);
      res.status(500).json({ message: "Failed to mark as missed" });
    }
  });
  app2.delete("/api/admin/delivery-logs/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const existingLog = await storage.getSubscriptionDeliveryLog(id);
      if (!existingLog) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      await storage.deleteSubscriptionDeliveryLog(id);
      res.json({ message: "Delivery log deleted successfully" });
    } catch (error) {
      console.error("Delete delivery log error:", error);
      res.status(500).json({ message: "Failed to delete delivery log" });
    }
  });
  app2.get("/api/admin/referral-rewards", requireAdmin(), async (req, res) => {
    try {
      const rewards = await storage.getAllReferralRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      res.status(500).json({ message: "Failed to fetch referral rewards" });
    }
  });
  app2.post("/api/admin/referral-rewards", requireAdmin(), async (req, res) => {
    try {
      const validation = insertReferralRewardSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const reward = await storage.createReferralReward(validation.data);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating referral reward:", error);
      res.status(500).json({ message: "Failed to create referral reward" });
    }
  });
  app2.patch("/api/admin/referral-rewards/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertReferralRewardSchema.partial().safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const reward = await storage.updateReferralReward(id, validation.data);
      if (!reward) {
        res.status(404).json({ message: "Referral reward not found" });
        return;
      }
      res.json(reward);
    } catch (error) {
      console.error("Error updating referral reward:", error);
      res.status(500).json({ message: "Failed to update referral reward" });
    }
  });
  app2.delete("/api/admin/referral-rewards/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReferralReward(id);
      if (!deleted) {
        res.status(404).json({ message: "Referral reward not found" });
        return;
      }
      res.json({ message: "Referral reward deleted successfully" });
    } catch (error) {
      console.error("Error deleting referral reward:", error);
      res.status(500).json({ message: "Failed to delete referral reward" });
    }
  });
  app2.get("/api/admin/coupons", requireAdmin(), async (req, res) => {
    try {
      const coupons3 = await storage.getAllCoupons();
      res.json(coupons3);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });
  app2.post("/api/admin/coupons", requireAdmin(), async (req, res) => {
    try {
      const couponData = {
        ...req.body,
        code: req.body.code?.toUpperCase(),
        validFrom: req.body.validFrom || (/* @__PURE__ */ new Date()).toISOString(),
        validUntil: req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        perUserLimit: req.body.perUserLimit || 1
      };
      const validation = insertCouponSchema.safeParse(couponData);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      const coupon = await storage.createCoupon(validation.data);
      res.status(201).json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });
  app2.patch("/api/admin/coupons/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertCouponSchema.partial().safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: fromZodError(validation.error).toString() });
        return;
      }
      await storage.updateCoupon(id, validation.data);
      res.json({ message: "Coupon updated successfully" });
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });
  app2.delete("/api/admin/coupons/:id", requireSuperAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCoupon(id);
      if (!deleted) {
        res.status(404).json({ message: "Coupon not found" });
        return;
      }
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });
  app2.get("/api/admin/referrals", requireAdmin(), async (req, res) => {
    try {
      const referrals3 = await storage.getAllReferrals();
      const enrichedReferrals = await Promise.all(
        referrals3.map(async (referral) => {
          const referrer = referral.referrerId ? await storage.getUser(referral.referrerId) : null;
          const referred = referral.referredId ? await storage.getUser(referral.referredId) : null;
          return {
            ...referral,
            referrerName: referrer?.name || "Unknown",
            referrerPhone: referrer?.phone || "-",
            referredName: referred?.name || "Unknown",
            referredPhone: referred?.phone || "-"
          };
        })
      );
      res.json(enrichedReferrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });
  app2.get("/api/admin/referral-stats", requireAdmin(), async (req, res) => {
    try {
      const referrals3 = await storage.getAllReferrals();
      const totalReferrals = referrals3.length;
      const pendingReferrals = referrals3.filter((r) => r.status === "pending").length;
      const completedReferrals = referrals3.filter((r) => r.status === "completed").length;
      const totalBonusPaid = referrals3.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.referrerBonus + r.referredBonus, 0);
      res.json({
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        totalBonusPaid
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });
  app2.get("/api/admin/referrals/debug/raw", requireAdmin(), async (req, res) => {
    try {
      const referrals3 = await storage.getAllReferrals();
      const sample = referrals3.slice(0, 5).map((r) => ({
        id: r.id,
        referrerId: r.referrerId,
        referredId: r.referredId,
        referralCode: r.referralCode,
        status: r.status,
        createdAt: r.createdAt,
        _referrerIdExists: !!r.referrerId,
        _referredIdExists: !!r.referredId
      }));
      res.json({
        totalCount: referrals3.length,
        sample,
        note: "This is debug data showing if IDs are present in database"
      });
    } catch (error) {
      console.error("Error fetching raw referral data:", error);
      res.status(500).json({ message: "Failed to fetch raw referral data" });
    }
  });
  app2.patch("/api/admin/referrals/:id/status", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["pending", "completed", "expired"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      const referral = await storage.getReferralById(id);
      if (!referral) {
        res.status(404).json({ message: "Referral not found" });
        return;
      }
      if (status === "completed" && referral.status !== "completed") {
        const settings = await storage.getActiveReferralReward();
        const referrerBonus = settings?.referrerBonus || 50;
        const referredBonus = settings?.referredBonus || 50;
        const referrer = await storage.getUser(referral.referrerId);
        if (referrer) {
          await storage.updateUser(referral.referrerId, {
            walletBalance: referrer.walletBalance + referrerBonus
          });
          await storage.createWalletTransaction({
            userId: referral.referrerId,
            amount: referrerBonus,
            type: "referral_bonus",
            description: `Referral bonus for successful referral`,
            referenceId: id,
            referenceType: "referral"
          });
        }
        await storage.updateReferralStatus(id, "completed", referrerBonus, referredBonus);
      } else {
        await storage.updateReferralStatus(id, status, 0, 0);
      }
      res.json({ message: "Referral status updated successfully" });
    } catch (error) {
      console.error("Error updating referral status:", error);
      res.status(500).json({ message: "Failed to update referral status" });
    }
  });
  app2.get("/api/admin/wallet-transactions", requireAdmin(), async (req, res) => {
    try {
      const { date } = req.query;
      const transactions = await storage.getAllWalletTransactions(date);
      const enrichedTransactions = await Promise.all(
        transactions.map(async (tx) => {
          const user = await storage.getUser(tx.userId);
          return {
            ...tx,
            userName: user?.name || "Unknown",
            userPhone: user?.phone || "-"
          };
        })
      );
      res.json(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });
  app2.get("/api/admin/wallet-stats", requireAdmin(), async (req, res) => {
    try {
      const transactions = await storage.getAllWalletTransactions();
      let totalCredits = 0;
      let totalDebits = 0;
      let totalReferralBonus = 0;
      let totalOrderDiscounts = 0;
      for (const tx of transactions) {
        if (tx.type === "credit") {
          totalCredits += Math.abs(tx.amount);
        } else if (tx.type === "debit") {
          totalDebits += Math.abs(tx.amount);
        } else if (tx.type === "referral_bonus") {
          totalReferralBonus += Math.abs(tx.amount);
        } else if (tx.type === "order_discount") {
          totalOrderDiscounts += Math.abs(tx.amount);
        }
      }
      res.json({
        totalCredits,
        totalDebits,
        totalReferralBonus,
        totalOrderDiscounts
      });
    } catch (error) {
      console.error("Error fetching wallet stats:", error);
      res.status(500).json({ message: "Failed to fetch wallet stats" });
    }
  });
  app2.get("/api/admin/delivery-areas", async (req, res) => {
    try {
      const areas = await storage.getAllDeliveryAreas();
      res.json({ areas });
    } catch (error) {
      console.error("Error fetching delivery areas:", error);
      res.status(500).json({ message: "Failed to fetch delivery areas" });
    }
  });
  app2.get("/api/admin/delivery-areas/all", requireAdmin(), async (req, res) => {
    try {
      const areas = await storage.getAllDeliveryAreas();
      res.json({ areas });
    } catch (error) {
      console.error("Error fetching all delivery areas:", error);
      res.status(500).json({ message: "Failed to fetch delivery areas" });
    }
  });
  app2.post("/api/admin/delivery-areas", requireAdmin(), async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        res.status(400).json({ message: "Area name is required and must be a non-empty string" });
        return;
      }
      const area = await storage.addDeliveryArea(name);
      if (!area) {
        res.status(400).json({ message: "Failed to add delivery area" });
        return;
      }
      console.log(`[ADMIN] Added delivery area: ${name}`);
      res.json({
        message: "Delivery area added successfully",
        area
      });
    } catch (error) {
      console.error("Error adding delivery area:", error);
      if (error instanceof Error && error.message.includes("unique constraint")) {
        res.status(400).json({ message: "This area already exists" });
      } else {
        res.status(500).json({ message: "Failed to add delivery area" });
      }
    }
  });
  app2.put("/api/admin/delivery-areas", requireAdmin(), async (req, res) => {
    try {
      const { areas } = req.body;
      if (!Array.isArray(areas) || areas.length === 0) {
        res.status(400).json({ message: "Areas must be a non-empty array" });
        return;
      }
      const failures = [];
      for (const area of areas) {
        if (!area.name || typeof area.name !== "string" || area.name.trim().length === 0) {
          res.status(400).json({ message: "Each area must have a non-empty name" });
          return;
        }
        const pincodes = Array.isArray(area.pincodes) ? area.pincodes.filter((p) => /^\d{5,6}$/.test(String(p).trim())) : [];
        try {
          const isRealDbId = area.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(area.id);
          if (isRealDbId) {
            const updated = await storage.updateDeliveryArea(
              area.id,
              area.name.trim(),
              pincodes,
              area.latitude !== void 0 ? parseFloat(String(area.latitude)) : void 0,
              area.longitude !== void 0 ? parseFloat(String(area.longitude)) : void 0
            );
            if (!updated) {
              console.warn(`[ADMIN] \u26A0\uFE0F updateDeliveryArea returned undefined for area id=${area.id}, name=${area.name}`);
              failures.push(`Update failed for: ${area.name} (id: ${area.id})`);
            }
          } else {
            const added = await storage.addDeliveryArea(area.name.trim(), pincodes);
            if (!added) {
              console.warn(`[ADMIN] \u26A0\uFE0F addDeliveryArea returned undefined for: ${area.name}`);
              failures.push(`Add failed for: ${area.name}`);
            }
          }
        } catch (err) {
          console.error(`[ADMIN] \u274C Error saving area ${area.name}:`, err);
          failures.push(`Exception for: ${area.name} - ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }
      const updatedAreas = await storage.getAllDeliveryAreas();
      if (failures.length > 0) {
        console.warn(`[ADMIN] \u26A0\uFE0F ${failures.length} area(s) failed to save:`, failures);
      }
      console.log(`[ADMIN] Updated delivery areas with pincodes and coordinates:`, updatedAreas.length, "area(s)");
      res.json({
        message: failures.length > 0 ? `Delivery areas updated with ${failures.length} warning(s): ${failures.join("; ")}` : "Delivery areas updated successfully",
        areas: updatedAreas,
        warnings: failures.length > 0 ? failures : void 0
      });
    } catch (error) {
      console.error("Error updating delivery areas:", error);
      res.status(500).json({ message: "Failed to update delivery areas" });
    }
  });
  app2.delete("/api/admin/delivery-areas/:id", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDeliveryArea(id);
      if (!success) {
        res.status(404).json({ message: "Delivery area not found" });
        return;
      }
      console.log(`[ADMIN] Deleted delivery area: ${id}`);
      res.json({ message: "Delivery area deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery area:", error);
      res.status(500).json({ message: "Failed to delete delivery area" });
    }
  });
  app2.patch("/api/admin/delivery-areas/:id/toggle", requireAdmin(), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        res.status(400).json({ message: "isActive must be a boolean" });
        return;
      }
      const area = await storage.toggleDeliveryAreaStatus(id, isActive);
      if (!area) {
        res.status(404).json({ message: "Delivery area not found" });
        return;
      }
      console.log(`[ADMIN] Toggled delivery area status: ${id} \u2192 ${isActive}`);
      res.json({
        message: "Delivery area status updated successfully",
        area
      });
    } catch (error) {
      console.error("Error toggling delivery area status:", error);
      res.status(500).json({ message: "Failed to toggle delivery area status" });
    }
  });
  app2.get("/api/admin/default-coordinates", async (req, res) => {
    try {
      const coords = await storage.getDefaultCoordinates();
      res.json(coords);
    } catch (error) {
      console.error("Error fetching default coordinates:", error);
      res.status(500).json({ message: "Failed to fetch default coordinates" });
    }
  });
  app2.post("/api/admin/default-coordinates", requireAdmin(), async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        res.status(400).json({ message: "Latitude and longitude must be numbers" });
        return;
      }
      if (!isFinite(latitude) || !isFinite(longitude)) {
        res.status(400).json({ message: "Invalid coordinates" });
        return;
      }
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({ message: "Latitude must be between -90 and 90" });
        return;
      }
      if (longitude < -180 || longitude > 180) {
        res.status(400).json({ message: "Longitude must be between -180 and 180" });
        return;
      }
      await storage.setDefaultCoordinates(latitude, longitude);
      console.log(`[ADMIN] Updated default coordinates: ${latitude}, ${longitude}`);
      res.json({
        message: "Default coordinates updated successfully",
        latitude,
        longitude
      });
    } catch (error) {
      console.error("Error updating default coordinates:", error);
      res.status(500).json({ message: "Failed to update default coordinates" });
    }
  });
  app2.get("/api/admin/referrals", requireAdmin(), async (req, res) => {
    try {
      const referrals3 = await storage.getAdminReferrals();
      res.json(referrals3);
    } catch (error) {
      console.error("Error fetching admin referrals:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referrals" });
    }
  });
  app2.get("/api/admin/referral-stats", requireAdmin(), async (req, res) => {
    try {
      const stats = await storage.getAdminReferralStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referral stats" });
    }
  });
  app2.patch("/api/admin/referrals/:id/status", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;
      if (!status || !["approved", "cancelled"].includes(status)) {
        res.status(400).json({ message: "Status must be 'approved' or 'cancelled'" });
        return;
      }
      if (status === "cancelled" && !adminNote) {
        res.status(400).json({ message: "Admin note (reason) is required when cancelling a referral" });
        return;
      }
      if (status === "approved") {
        await storage.adminApproveReferral(id, adminNote);
        res.json({ message: "Referral approved and bonus credited to referrer's wallet" });
      } else {
        await storage.adminCancelReferral(id, adminNote);
        res.json({ message: "Referral cancelled. Bonus reversed if previously credited." });
      }
    } catch (error) {
      console.error("Error updating referral status:", error);
      res.status(400).json({ message: error.message || "Failed to update referral status" });
    }
  });
  app2.patch("/api/admin/referrals/:id/fraud-flag", requireAdminOrManager(), async (req, res) => {
    try {
      const { id } = req.params;
      const { fraudFlag } = req.body;
      if (typeof fraudFlag !== "boolean") {
        res.status(400).json({ message: "fraudFlag must be a boolean (true or false)" });
        return;
      }
      await storage.setReferralFraudFlag(id, fraudFlag);
      res.json({ message: `Referral fraud flag set to: ${fraudFlag}` });
    } catch (error) {
      console.error("Error updating referral fraud flag:", error);
      res.status(500).json({ message: error.message || "Failed to update fraud flag" });
    }
  });
  app2.get("/api/admin/chef-performance/:chefId", requireAdmin(), async (req, res) => {
    try {
      const { chefId } = req.params;
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allLogs = await db.query.subscriptionDeliveryLogs.findMany({
        where: (logs, { and: and3, eq: eq7, gte: gte2 }) => and3(
          eq7(logs.deliveryPersonId, chefId),
          gte2(logs.date, thirtyDaysAgo)
        )
      });
      const delivered = allLogs.filter((log3) => log3.status === "delivered").length;
      const missed = allLogs.filter((log3) => log3.status === "missed").length;
      const scheduled = allLogs.filter((log3) => log3.status === "scheduled").length;
      const preparing = allLogs.filter((log3) => log3.status === "preparing").length;
      const outForDelivery = allLogs.filter((log3) => log3.status === "out_for_delivery").length;
      const skipped = allLogs.filter((log3) => log3.status === "skipped").length;
      const total = allLogs.length;
      const deliveryRate = total > 0 ? Math.round(delivered / (delivered + missed) * 100) : 0;
      res.json({
        chefId,
        chefName: chef.name,
        metrics: {
          totalDeliveries: total,
          delivered,
          missed,
          deliveryRate,
          scheduled,
          preparing,
          outForDelivery,
          skipped,
          averageDeliveriesPerDay: total > 0 ? Math.round(total / 30 * 10) / 10 : 0
        },
        period: "Last 30 days",
        lastUpdated: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error fetching chef performance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch chef performance" });
    }
  });
  app2.get("/api/admin/chef-performance", requireAdmin(), async (req, res) => {
    try {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const allChefs = await storage.getChefs();
      const performanceData = await Promise.all(
        allChefs.map(async (chef) => {
          const logs = await db.query.subscriptionDeliveryLogs.findMany({
            where: (l, { and: and3, eq: eq7, gte: gte2 }) => and3(
              eq7(l.deliveryPersonId, chef.id),
              gte2(l.date, thirtyDaysAgo)
            )
          });
          const delivered = logs.filter((log3) => log3.status === "delivered").length;
          const missed = logs.filter((log3) => log3.status === "missed").length;
          const total = logs.length;
          const deliveryRate = total > 0 ? Math.round(delivered / (delivered + missed) * 100) : 0;
          return {
            chefId: chef.id,
            chefName: chef.name,
            deliveryRate,
            totalDeliveries: total,
            delivered,
            missed
          };
        })
      );
      const sorted = performanceData.sort((a, b) => b.deliveryRate - a.deliveryRate);
      res.json({
        leaderboard: sorted,
        period: "Last 30 days",
        lastUpdated: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error fetching chef performance leaderboard:", error);
      res.status(500).json({ message: error.message || "Failed to fetch leaderboard" });
    }
  });
}

// server/partnerRoutes.ts
init_partnerAuth();
init_storage();
init_websocket();
init_db();
import { eq as eq3 } from "drizzle-orm";
function registerPartnerRoutes(app2) {
  function isDeliveryDay2(date, frequency, deliveryDays) {
    if (!deliveryDays || deliveryDays.length === 0) return false;
    if (frequency === "monthly") {
      const dayOfMonth = date.getDate().toString();
      return deliveryDays.includes(dayOfMonth);
    } else if (frequency === "weekly" || frequency === "daily") {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      return deliveryDays.includes(dayName);
    }
    return false;
  }
  function getNextDeliveryDate(fromDate, frequency, deliveryDays, maxDate) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    let attempts = 0;
    const maxAttempts = frequency === "monthly" ? 31 : 7;
    const limit = maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
    while (attempts < maxAttempts) {
      if (nextDate > limit) {
        return nextDate;
      }
      if (isDeliveryDay2(nextDate, frequency, deliveryDays)) {
        return nextDate;
      }
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }
    return nextDate;
  }
  app2.get("/api/partner/orders", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const orders3 = await storage.getOrdersByChefId(chefId);
      const sanitizedOrders = orders3.map((order) => {
        const { phone, address, email, ...safeOrder } = order;
        return safeOrder;
      });
      res.json(sanitizedOrders);
    } catch (error) {
      console.error("Error fetching partner orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/partner/subscriptions", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const chefSubscriptionsRaw = await storage.getActiveSubscriptionsByChef(chefId);
      console.log(`Partner subscriptions (DB): chefId=${chefId}, matchedSubs=${chefSubscriptionsRaw.length}`);
      const enrichedSubscriptions = await Promise.all(
        chefSubscriptionsRaw.map(async (sub) => {
          const plan = await storage.getSubscriptionPlan(sub.planId);
          const { phone, address, email, ...safeSub } = sub;
          return {
            ...safeSub,
            planName: plan?.name,
            planItems: plan?.items,
            planFrequency: plan?.frequency
          };
        })
      );
      res.json(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching partner subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/partner/subscriptions/:id/logs", requirePartner(), async (req, res) => {
    try {
      const { id } = req.params;
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.chefId !== chefId) {
        res.status(403).json({ message: "Unauthorized access to subscription" });
        return;
      }
      const logs = await storage.getSubscriptionDeliveryLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching subscription logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  app2.get("/api/partner/dashboard/metrics", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const allOrders = await storage.getOrdersByChefId(chefId);
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter((o) => o.status === "pending" && o.paymentStatus === "paid").length;
      const completedOrders = allOrders.filter((o) => o.status === "delivered" || o.status === "completed").length;
      const totalRevenue = allOrders.filter((o) => o.paymentStatus === "confirmed").reduce((sum, order) => sum + order.total, 0);
      res.json({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  app2.post("/api/partner/orders/:orderId/accept", requirePartner(), async (req, res) => {
    try {
      const { orderId } = req.params;
      const partnerId = req.partner?.partnerId;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.chefId !== req.partner?.chefId) {
        res.status(403).json({ message: "Not authorized to accept this order" });
        return;
      }
      if (order.paymentStatus !== "confirmed") {
        res.status(400).json({ message: "Payment not confirmed yet" });
        return;
      }
      if (order.status !== "confirmed") {
        res.status(400).json({ message: "Order cannot be accepted in current status" });
        return;
      }
      console.log(`\u{1F504} Chef ${req.partner?.chefId} accepting order ${orderId}`);
      const [updatedOrder] = await db.update(orders2).set({
        status: "preparing",
        approvedBy: partnerId,
        approvedAt: /* @__PURE__ */ new Date()
      }).where(eq3(orders2.id, orderId)).returning();
      if (updatedOrder) {
        console.log(`\u2705 Chef accepted order ${orderId}, status: ${updatedOrder.status} (auto-preparing)`);
        broadcastOrderUpdate(updatedOrder);
        console.log(`\u{1F4E1} Broadcasted chef acceptance to customer and admin`);
        console.log(`\u{1F4E2} STAGE 1: Broadcasting to delivery personnel - Chef is preparing order ${orderId}`);
        await broadcastPreparedOrderToAvailableDelivery(updatedOrder);
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "Failed to accept order" });
    }
  });
  app2.post("/api/partner/orders/:orderId/reject", requirePartner(), async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const partnerId = req.partner?.partnerId;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.chefId !== req.partner?.chefId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const updatedOrder = await storage.rejectOrder(orderId, partnerId, reason || "Order rejected by partner");
      if (updatedOrder) {
        broadcastOrderUpdate(updatedOrder);
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });
  app2.patch("/api/partner/orders/:orderId/status", requirePartner(), async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.chefId !== req.partner?.chefId) {
        res.status(403).json({ message: "Not authorized to update this order" });
        return;
      }
      console.log(`\u{1F504} Chef updating order ${orderId} status from ${order.status} to ${status}`);
      if (status === "prepared") {
        const items = order.items;
        if (items && items.length > 0) {
          const firstProduct = await storage.getProductById(items[0].id);
          if (firstProduct) {
            const category = await storage.getCategoryById(firstProduct.categoryId);
            const isRotiCategory = category?.name?.toLowerCase() === "roti" || category?.name?.toLowerCase().includes("roti");
            if (isRotiCategory && order.deliveryTime && !order.deliverySlotId) {
              res.status(400).json({ message: "Delivery time slot is required for scheduled Roti orders" });
              return;
            }
          }
        }
      }
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      if (updatedOrder) {
        console.log(`\u2705 Order ${orderId} status updated to ${status}`);
        broadcastOrderUpdate(updatedOrder);
        console.log(`\u{1F4E1} Broadcasted status update to customer and admin`);
        if (status === "prepared") {
          console.log(`\u{1F4E2} STAGE 2: Notifying assigned delivery person - Food is ready for pickup for order ${orderId}`);
          if (updatedOrder.assignedTo) {
            console.log(`\u2705 Order ${orderId} already assigned to ${updatedOrder.deliveryPersonName}, notifying them food is ready`);
          } else {
            console.log(`\u{1F4E2} No delivery person assigned yet, broadcasting to all available delivery personnel`);
            await broadcastPreparedOrderToAvailableDelivery(updatedOrder);
          }
          try {
            const allDeliveryPersonnel = await storage.getAllDeliveryPersonnel();
            const activeDeliveryPersonnel = allDeliveryPersonnel.filter((dp) => dp.isActive);
            if (activeDeliveryPersonnel.length > 0) {
              const deliveryPersonIds = activeDeliveryPersonnel.map((dp) => dp.id);
              const deliveryPersonPhones = new Map(
                activeDeliveryPersonnel.map((dp) => [dp.id, dp.phone])
              );
              const itemsList = updatedOrder.items.map((item) => `${item.name} (x${item.quantity})`).slice(0, 3).join(", ");
              const sentCount = await sendDeliveryAvailableNotification(
                deliveryPersonIds,
                updatedOrder.id,
                updatedOrder.address,
                deliveryPersonPhones
              );
              console.log(`\u2705 Sent WhatsApp notifications to ${sentCount}/${activeDeliveryPersonnel.length} delivery personnel for order ${orderId}`);
            }
          } catch (notificationError) {
            console.error("\u26A0\uFE0F Error sending delivery WhatsApp notifications (non-critical):", notificationError);
          }
        }
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  app2.patch("/api/partner/products/:productId/availability", requirePartner(), async (req, res) => {
    try {
      const { productId } = req.params;
      const { isAvailable } = req.body;
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (typeof isAvailable !== "boolean") {
        res.status(400).json({ message: "isAvailable must be a boolean" });
        return;
      }
      const product = await storage.getProductById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      if (product.chefId !== chefId) {
        res.status(403).json({ message: "Unauthorized - Product does not belong to your kitchen" });
        return;
      }
      const updatedProduct = await storage.updateProduct(productId, { isAvailable });
      if (updatedProduct) {
        broadcastProductAvailabilityUpdate(updatedProduct);
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product availability:", error);
      res.status(500).json({ message: "Failed to update product availability" });
    }
  });
  app2.get("/api/partner/products", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const allProducts = await storage.getAllProducts();
      const chefProducts = allProducts.filter((p) => p.chefId === chefId);
      const sanitizedProducts = chefProducts.map((p) => {
        const { marginPercent, ...safeProduct } = p;
        return safeProduct;
      });
      res.json(sanitizedProducts);
    } catch (error) {
      console.error("Error fetching partner products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/partner/chef", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      res.json(chef);
    } catch (error) {
      console.error("Error fetching chef details:", error);
      res.status(500).json({ message: "Failed to fetch chef details" });
    }
  });
  app2.patch("/api/partner/chef/status", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      const updatedChef = await storage.updateChef(chefId, { isActive });
      if (!updatedChef) {
        return res.status(404).json({ message: "Chef not found" });
      }
      console.log(`\u{1F3EA} Chef ${updatedChef.name} is now ${isActive ? "ACTIVE" : "INACTIVE"}`);
      if (!isActive) {
        const activeSubscriptions = await storage.getActiveSubscriptionsByChef(chefId);
        if (activeSubscriptions.length > 0) {
          const { broadcastChefUnavailableNotification: broadcastChefUnavailableNotification2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
          broadcastChefUnavailableNotification2({
            chef: updatedChef,
            subscriptionCount: activeSubscriptions.length,
            subscriptions: activeSubscriptions
          });
          console.log(`\u26A0\uFE0F Chef ${updatedChef.name} marked unavailable with ${activeSubscriptions.length} active subscriptions - Admin notified for reassignment`);
        }
      }
      broadcastChefStatusUpdate(updatedChef);
      return res.status(200).json(updatedChef);
    } catch (error) {
      console.error("Error updating chef status:", error);
      return res.status(500).json({ message: "Failed to update chef status" });
    }
  });
  app2.get("/api/partner/income-report", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const allOrders = await storage.getOrdersByChefId(chefId);
      const completedOrders = allOrders.filter((o) => o.paymentStatus === "confirmed");
      const totalIncome = completedOrders.reduce((sum, order) => {
        const orderPartnerIncome = order.items.reduce((itemSum, item) => {
          const itemPrice = item.hotelPrice || item.price;
          return itemSum + itemPrice * item.quantity;
        }, 0);
        return sum + orderPartnerIncome;
      }, 0);
      const now = /* @__PURE__ */ new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const thisMonthOrders = completedOrders.filter((o) => new Date(o.createdAt) >= startOfThisMonth);
      const lastMonthOrders = completedOrders.filter(
        (o) => new Date(o.createdAt) >= startOfLastMonth && new Date(o.createdAt) <= endOfLastMonth
      );
      const calculateOrderIncome = (order) => {
        return order.items.reduce((sum, item) => {
          const itemPrice = item.hotelPrice || item.price;
          return sum + itemPrice * item.quantity;
        }, 0);
      };
      const thisMonth = thisMonthOrders.reduce((sum, order) => sum + calculateOrderIncome(order), 0);
      const lastMonth = lastMonthOrders.reduce((sum, order) => sum + calculateOrderIncome(order), 0);
      const monthlyBreakdown = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthOrders = completedOrders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        const monthRevenue = monthOrders.reduce((sum, order) => sum + calculateOrderIncome(order), 0);
        const avgOrderValue = monthOrders.length > 0 ? Math.round(monthRevenue / monthOrders.length) : 0;
        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          orders: monthOrders.length,
          revenue: monthRevenue,
          avgOrderValue
        });
      }
      const orderBreakdown = completedOrders.map((order) => {
        const orderIncome = order.items.reduce((sum, item) => {
          const itemPrice = item.hotelPrice || item.price;
          return sum + itemPrice * item.quantity;
        }, 0);
        return {
          orderId: order.id,
          customerName: order.customerName,
          createdAt: order.createdAt,
          items: order.items,
          orderIncome,
          status: order.status
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({
        totalIncome,
        thisMonth,
        lastMonth,
        monthlyBreakdown,
        orderBreakdown
      });
    } catch (error) {
      console.error("Error fetching income report:", error);
      res.status(500).json({ message: "Failed to fetch income report" });
    }
  });
  app2.get("/api/partner/subscription-deliveries", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const allSubscriptions = await storage.getSubscriptions();
      const subscriptions4 = allSubscriptions.filter(
        (s) => s.chefId === chefId && s.isPaid && s.status !== "cancelled"
      );
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const todaysDeliveries = [];
      let preparing = 0;
      let outForDelivery = 0;
      let delivered = 0;
      for (const sub of subscriptions4) {
        if (!sub.nextDeliveryDate || isNaN(new Date(sub.nextDeliveryDate).getTime())) {
          continue;
        }
        const nextDelivery = new Date(sub.nextDeliveryDate);
        nextDelivery.setHours(0, 0, 0, 0);
        const nextDeliveryStr = nextDelivery.toISOString().split("T")[0];
        if (nextDeliveryStr === todayStr && sub.status !== "paused" && sub.status !== "cancelled") {
          const plan = await storage.getSubscriptionPlan(sub.planId);
          let chefName;
          if (sub.chefId) {
            const chef = await storage.getChefById(sub.chefId);
            chefName = chef?.name;
          }
          const deliveryLog = todaysLogs.find((log3) => log3.subscriptionId === sub.id);
          const currentStatus = deliveryLog?.status || "scheduled";
          if (currentStatus === "preparing") preparing++;
          else if (currentStatus === "out_for_delivery") outForDelivery++;
          else if (currentStatus === "delivered") delivered++;
          todaysDeliveries.push({
            id: deliveryLog?.id || sub.id,
            subscriptionId: sub.id,
            customerName: sub.customerName,
            phone: sub.phone,
            address: sub.address,
            planName: plan?.name || "Unknown Plan",
            // Frontend expects these exact keys
            nextDeliveryDate: sub.nextDeliveryDate,
            nextDeliveryTime: deliveryLog?.time || sub.nextDeliveryTime || "09:00",
            remainingDeliveries: sub.remainingDeliveries,
            totalDeliveries: sub.totalDeliveries,
            planItems: plan?.items || [],
            deliverySlotId: sub.deliverySlotId,
            status: currentStatus,
            chefName
          });
        }
      }
      res.json({
        todayCount: todaysDeliveries.length,
        preparing,
        outForDelivery,
        delivered,
        deliveries: todaysDeliveries
      });
    } catch (error) {
      console.error("Error fetching subscription deliveries:", error);
      res.status(500).json({ message: "Failed to fetch subscription deliveries" });
    }
  });
  app2.patch("/api/partner/subscription-deliveries/:subscriptionId/status", requirePartner(), async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { status } = req.body;
      const chefId = req.partner?.chefId;
      if (!chefId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (!status || !["preparing", "accepted_by_delivery", "out_for_delivery", "delivered", "missed"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription || subscription.chefId !== chefId) {
        res.status(403).json({ message: "You are not authorized to update this subscription" });
        return;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const time = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      let deliveryLog = todaysLogs.find((log3) => log3.subscriptionId === subscriptionId);
      if (!deliveryLog) {
        deliveryLog = await storage.createSubscriptionDeliveryLog({
          subscriptionId,
          date: today,
          time,
          status,
          deliveryPersonId: null,
          notes: `Status set to ${status} by chef`
        });
      } else {
        deliveryLog = await storage.updateSubscriptionDeliveryLog(deliveryLog.id, {
          status,
          notes: `Status updated to ${status} by chef`
        });
      }
      if (status === "preparing") {
        console.log(`\u{1F4E2} Chef started preparing subscription ${subscriptionId} - notifying delivery personnel`);
        const { broadcastSubscriptionDeliveryToAvailableDelivery: broadcastSubscriptionDeliveryToAvailableDelivery2 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
        await broadcastSubscriptionDeliveryToAvailableDelivery2({
          ...deliveryLog,
          subscription: {
            customerName: subscription.customerName,
            phone: subscription.phone,
            address: subscription.address
          }
        });
      }
      if (status === "delivered" && subscription.remainingDeliveries > 0) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        const subscriptionUpdateData = {
          remainingDeliveries: subscription.remainingDeliveries - 1
        };
        if (plan) {
          const deliveryDays = plan.deliveryDays;
          const maxDate = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
          const nextDelivery = getNextDeliveryDate(subscription.nextDeliveryDate, plan.frequency, deliveryDays, maxDate);
          subscriptionUpdateData.nextDeliveryDate = nextDelivery;
        } else {
          const nextDate = new Date(subscription.nextDeliveryDate);
          nextDate.setDate(nextDate.getDate() + 1);
          subscriptionUpdateData.nextDeliveryDate = nextDate;
        }
        await storage.updateSubscription(subscriptionId, subscriptionUpdateData);
        await storage.syncDeliveryHistory(subscriptionId, "delivered", today, "Delivered by chef");
      }
      if (status === "missed") {
        await storage.syncDeliveryHistory(subscriptionId, "missed", today, "Marked as missed by chef");
      }
      res.json(deliveryLog);
    } catch (error) {
      console.error("Error updating subscription delivery status:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });
  app2.get("/api/notifications/pending", requirePartner(), async (req, res) => {
    try {
      const chefId = req.partner?.chefId;
      if (!chefId) return res.status(401).json({ message: "Unauthorized" });
      const pending = await db.query.pendingBroadcasts.findMany({
        where: (pb, { eq: eq7, and: and3 }) => and3(
          eq7(pb.recipientId, String(chefId)),
          eq7(pb.recipientType, "chef"),
          eq7(pb.isDelivered, false)
        ),
        orderBy: (pb, { asc: asc2 }) => [asc2(pb.createdAt)]
      });
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending broadcasts:", error);
      res.status(500).json({ message: "Failed to fetch pending broadcasts" });
    }
  });
  app2.post("/api/notifications/mark-delivered", requirePartner(), async (req, res) => {
    try {
      const { ids } = req.body;
      const chefId = req.partner?.chefId;
      if (!chefId) return res.status(401).json({ message: "Unauthorized" });
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.json({ success: true });
      }
      const { eq: eq7, inArray, and: and3 } = await import("drizzle-orm");
      const { pendingBroadcasts: pendingBroadcasts3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await db.update(pendingBroadcasts3).set({ isDelivered: true }).where(
        and3(
          eq7(pendingBroadcasts3.recipientId, String(chefId)),
          eq7(pendingBroadcasts3.recipientType, "chef"),
          inArray(pendingBroadcasts3.id, ids)
        )
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking broadcasts delivered:", error);
      res.status(500).json({ message: "Failed to mark delivered" });
    }
  });
}

// server/deliveryRoutes.ts
init_storage();
init_deliveryAuth();
init_schema();
init_websocket();
init_db();
import { eq as eq4 } from "drizzle-orm";
function registerDeliveryRoutes(app2) {
  function isDeliveryDay2(date, frequency, deliveryDays) {
    if (!deliveryDays || deliveryDays.length === 0) return false;
    if (frequency === "monthly") {
      const dayOfMonth = date.getDate().toString();
      return deliveryDays.includes(dayOfMonth);
    } else if (frequency === "weekly" || frequency === "daily") {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      return deliveryDays.includes(dayName);
    }
    return false;
  }
  function getNextDeliveryDate(fromDate, frequency, deliveryDays, maxDate) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    let attempts = 0;
    const maxAttempts = frequency === "monthly" ? 31 : 7;
    const limit = maxDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
    while (attempts < maxAttempts) {
      if (nextDate > limit) {
        return nextDate;
      }
      if (isDeliveryDay2(nextDate, frequency, deliveryDays)) {
        return nextDate;
      }
      nextDate.setDate(nextDate.getDate() + 1);
      attempts++;
    }
    return nextDate;
  }
  app2.get("/api/delivery/debug/status", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (!deliveryPerson) {
        return res.status(404).json({ message: "Delivery person not found" });
      }
      const allOrders = await storage.getAllOrders();
      const claimableOrders = allOrders.filter((order) => {
        const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
        return validStatuses.includes(order.status) && !order.assignedTo;
      });
      res.json({
        deliveryPerson: {
          id: deliveryPerson.id,
          name: deliveryPerson.name,
          phone: deliveryPerson.phone,
          isActive: deliveryPerson.isActive,
          status: deliveryPerson.status
        },
        ordersStatus: {
          totalOrders: allOrders.length,
          claimableOrders: claimableOrders.length,
          claimableOrderStatuses: claimableOrders.map((o) => ({
            id: o.id.slice(0, 8),
            status: o.status,
            assignedTo: o.assignedTo || "unassigned"
          }))
        }
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Debug failed" });
    }
  });
  app2.post("/api/delivery/login", async (req, res) => {
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
      const isValid = await verifyPassword2(password, deliveryPerson.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Invalid phone or password" });
        return;
      }
      await storage.updateDeliveryPersonnelLastLogin(deliveryPerson.id);
      const token = generateDeliveryToken(deliveryPerson);
      const { passwordHash, ...deliveryData } = deliveryPerson;
      res.json({
        token,
        deliveryPerson: deliveryData
      });
    } catch (error) {
      console.error("Delivery login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/delivery/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token provided" });
        return;
      }
      const payload = verifyToken2(refreshToken);
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
      const newRefreshToken = generateRefreshToken2(deliveryPerson);
      res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error("Delivery token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });
  app2.get("/api/delivery/profile", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPerson = await storage.getDeliveryPersonnelById(req.delivery.deliveryId);
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
  app2.get("/api/delivery/orders", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const orders3 = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      res.json(orders3);
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/delivery/available-orders", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      console.log(`\u{1F4E6} Delivery person ${deliveryPersonId}:`, {
        isActive: deliveryPerson?.isActive,
        name: deliveryPerson?.name,
        status: deliveryPerson?.status
      });
      if (!deliveryPerson) {
        console.log(`\u274C Delivery person ${deliveryPersonId} not found`);
        res.json([]);
        return;
      }
      if (!deliveryPerson.isActive) {
        console.log(`\u274C Delivery person ${deliveryPersonId} is not active (isActive: false)`);
        res.json([]);
        return;
      }
      const allOrders = await storage.getAllOrders();
      console.log(`\u{1F4CB} Total orders in system: ${allOrders.length}`);
      const availableOrders = allOrders.filter((order) => {
        const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
        const isValid = validStatuses.includes(order.status) && !order.assignedTo;
        if (isValid) {
          console.log(`  \u2705 Order ${order.id}: status=${order.status}, assignedTo=${order.assignedTo || "none"}`);
        }
        return isValid;
      });
      console.log(`\u2705 Available orders for delivery: ${availableOrders.length}`);
      res.json(availableOrders);
    } catch (error) {
      console.error("Error fetching available orders:", error);
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });
  app2.post("/api/delivery/orders/:id/claim", requireDeliveryAuth(), async (req, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery.deliveryId;
      console.log(`
\u{1F4E6} CLAIM REQUEST - Delivery person ${deliveryPersonId} attempting to claim order ${orderId}`);
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      console.log(`  \u{1F4CB} Delivery person found: ${deliveryPerson ? "YES" : "NO"}`);
      if (deliveryPerson) {
        console.log(`     - Name: ${deliveryPerson.name}`);
        console.log(`     - isActive: ${deliveryPerson.isActive}`);
        console.log(`     - status: ${deliveryPerson.status}`);
      }
      if (!deliveryPerson || !deliveryPerson.isActive) {
        console.log(`  \u274C BLOCKED: Delivery person not found or inactive`);
        return res.status(403).json({ message: "You are not active to claim orders" });
      }
      const order = await storage.getOrderById(orderId);
      console.log(`  \u{1F4CB} Order found: ${order ? "YES" : "NO"}`);
      if (order) {
        console.log(`     - Full order object keys: ${Object.keys(order).join(", ")}`);
        console.log(`     - Status field: '${order.status}' (type: ${typeof order.status})`);
        console.log(`     - Status === 'prepared'? ${order.status === "prepared"}`);
        console.log(`     - Status === 'preparing'? ${order.status === "preparing"}`);
        console.log(`     - Status === 'confirmed'? ${order.status === "confirmed"}`);
        console.log(`     - Status === 'accepted_by_chef'? ${order.status === "accepted_by_chef"}`);
        console.log(`     - Assigned to: ${order.assignedTo || "UNASSIGNED"}`);
      }
      if (!order) {
        console.log(`  \u274C BLOCKED: Order not found`);
        return res.status(404).json({ message: "Order not found" });
      }
      const validStatuses = ["confirmed", "accepted_by_chef", "preparing", "prepared"];
      console.log(`  \u2705 Status check: "${order.status}" in [${validStatuses.join(", ")}]? ${validStatuses.includes(order.status) ? "YES" : "NO"}`);
      if (!validStatuses.includes(order.status)) {
        console.log(`  \u274C BLOCKED: Order status not claimable`);
        return res.status(400).json({ message: "Order is not available for delivery assignment" });
      }
      if (order.assignedTo) {
        console.log(`  \u274C BLOCKED: Order already assigned to ${order.assignedTo}`);
        return res.status(400).json({ message: "Order already claimed by another delivery person" });
      }
      const assignedOrder = await storage.assignOrderToDeliveryPerson(orderId, deliveryPersonId);
      if (!assignedOrder) {
        console.log(`  \u274C BLOCKED: Failed to assign order in database`);
        return res.status(500).json({ message: "Failed to claim order" });
      }
      console.log(`  \u2705 SUCCESS: Order ${orderId} assigned to delivery person ${deliveryPerson.name}`);
      console.log(`\u{1F7E2} Order ${orderId} assigned to delivery person. Chef must mark prepared manually.`);
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
  app2.post("/api/delivery/orders/:id/accept", requireDeliveryAuth(), async (req, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery.deliveryId;
      console.log(`\u{1F4E6} Delivery person ${deliveryPersonId} accepting order ${orderId}`);
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.assignedTo !== deliveryPersonId) {
        res.status(403).json({ message: "Order not assigned to you" });
        return;
      }
      if (order.status === "accepted_by_delivery") {
        console.log(`\u2705 Order ${orderId} already accepted`);
        res.json(order);
        return;
      }
      const validStatuses = ["prepared", "accepted_by_chef", "preparing"];
      if (!validStatuses.includes(order.status)) {
        res.status(400).json({ message: "Order cannot be accepted in current status" });
        return;
      }
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (deliveryPerson && (!order.deliveryPersonName || !order.deliveryPersonPhone)) {
        await db.update(orders2).set({
          deliveryPersonName: deliveryPerson.name,
          deliveryPersonPhone: deliveryPerson.phone
        }).where(eq4(orders2.id, orderId));
      }
      const updatedOrder = await storage.updateOrderStatus(orderId, "accepted_by_delivery");
      if (updatedOrder) {
        cancelPreparedOrderTimeout(orderId);
        console.log(`\u2705 Order ${orderId} accepted by ${deliveryPerson?.name || "delivery person"}`);
        broadcastOrderUpdate(updatedOrder);
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "Failed to accept order" });
    }
  });
  app2.post("/api/delivery/orders/:id/pickup", requireDeliveryAuth(), async (req, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery.deliveryId;
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (order.assignedTo !== deliveryPersonId) {
        res.status(403).json({ message: "Order not assigned to you" });
        return;
      }
      const validStatuses = ["accepted_by_delivery", "prepared", "accepted_by_chef", "preparing"];
      if (!validStatuses.includes(order.status)) {
        res.status(400).json({ message: "Order must be accepted before pickup" });
        return;
      }
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
  app2.post("/api/delivery/orders/:id/deliver", requireDeliveryAuth(), async (req, res) => {
    try {
      const orderId = req.params.id;
      const deliveryPersonId = req.delivery.deliveryId;
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
  app2.patch("/api/delivery/status", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const { status, currentLocation } = req.body;
      const updatedPerson = await storage.updateDeliveryPersonnel(deliveryPersonId, {
        status,
        currentLocation
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
  app2.get("/api/delivery/earnings", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const orders3 = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      const completedOrders = orders3.filter((o) => o.status === "delivered");
      const totalEarnings = completedOrders.reduce((sum, order) => sum + order.deliveryFee, 0);
      const now = /* @__PURE__ */ new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const todayOrders = completedOrders.filter((o) => new Date(o.deliveredAt) >= startOfToday);
      const weekOrders = completedOrders.filter((o) => new Date(o.deliveredAt) >= startOfThisWeek);
      const monthOrders = completedOrders.filter((o) => new Date(o.deliveredAt) >= startOfThisMonth);
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
        monthDeliveries: monthOrders.length
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });
  app2.get("/api/delivery/stats", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      const orders3 = await storage.getOrdersByDeliveryPerson(deliveryPersonId);
      const pendingOrders = orders3.filter((o) => o.assignedTo && !["accepted_by_delivery", "out_for_delivery", "delivered", "completed", "cancelled"].includes(o.status));
      const activeOrders = orders3.filter((o) => ["accepted_by_delivery", "out_for_delivery"].includes(o.status));
      const completedOrders = orders3.filter((o) => o.status === "delivered");
      const now = /* @__PURE__ */ new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayCompletedOrders = completedOrders.filter(
        (o) => new Date(o.deliveredAt) >= startOfToday
      );
      res.json({
        pendingCount: pendingOrders.length,
        activeCount: activeOrders.length,
        completedToday: todayCompletedOrders.length,
        totalCompleted: completedOrders.length,
        rating: deliveryPerson?.rating || "5.0",
        status: deliveryPerson?.status || "offline"
      });
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/delivery/subscription-deliveries", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const today = /* @__PURE__ */ new Date();
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const myDeliveries = todayLogs.filter((log3) => log3.deliveryPersonId === deliveryPersonId);
      const enrichedDeliveries = await Promise.all(
        myDeliveries.map(async (log3) => {
          const subscription = await storage.getSubscription(log3.subscriptionId);
          const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : null;
          return {
            ...log3,
            subscription: subscription ? {
              id: subscription.id,
              customerName: subscription.customerName,
              phone: subscription.phone,
              address: subscription.address,
              planName: plan?.name || "Unknown Plan"
            } : null
          };
        })
      );
      res.json(enrichedDeliveries);
    } catch (error) {
      console.error("Error fetching subscription deliveries:", error);
      res.status(500).json({ message: "Failed to fetch subscription deliveries" });
    }
  });
  app2.get("/api/delivery/available-subscription-deliveries", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const deliveryPerson = await storage.getDeliveryPersonnelById(deliveryPersonId);
      if (!deliveryPerson || !deliveryPerson.isActive) {
        res.json([]);
        return;
      }
      const today = /* @__PURE__ */ new Date();
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const availableDeliveries = todayLogs.filter(
        (log3) => !log3.deliveryPersonId && (log3.status === "scheduled" || log3.status === "preparing")
      );
      const enrichedDeliveries = await Promise.all(
        availableDeliveries.map(async (log3) => {
          const subscription = await storage.getSubscription(log3.subscriptionId);
          const plan = subscription ? await storage.getSubscriptionPlan(subscription.planId) : null;
          return {
            ...log3,
            subscription: subscription ? {
              id: subscription.id,
              customerName: subscription.customerName,
              phone: subscription.phone,
              address: subscription.address,
              planName: plan?.name || "Unknown Plan"
            } : null
          };
        })
      );
      res.json(enrichedDeliveries);
    } catch (error) {
      console.error("Error fetching available subscription deliveries:", error);
      res.status(500).json({ message: "Failed to fetch available subscription deliveries" });
    }
  });
  app2.post("/api/delivery/subscription-deliveries/:id/claim", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const logId = req.params.id;
      const log3 = await storage.getSubscriptionDeliveryLog(logId);
      if (!log3) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      if (log3.deliveryPersonId) {
        res.status(400).json({ message: "This delivery is already claimed" });
        return;
      }
      const updated = await storage.updateSubscriptionDeliveryLog(logId, {
        deliveryPersonId,
        status: "preparing"
      });
      console.log(`\u{1F4E6} Delivery person ${deliveryPersonId} claimed subscription delivery ${logId}`);
      res.json(updated);
    } catch (error) {
      console.error("Error claiming subscription delivery:", error);
      res.status(500).json({ message: "Failed to claim subscription delivery" });
    }
  });
  app2.patch("/api/delivery/subscription-deliveries/:id/status", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const logId = req.params.id;
      const { status, notes } = req.body;
      const log3 = await storage.getSubscriptionDeliveryLog(logId);
      if (!log3) {
        res.status(404).json({ message: "Delivery log not found" });
        return;
      }
      if (log3.deliveryPersonId !== deliveryPersonId) {
        res.status(403).json({ message: "This delivery is not assigned to you" });
        return;
      }
      const validTransitions = {
        "scheduled": ["preparing"],
        "preparing": ["out_for_delivery"],
        "out_for_delivery": ["delivered", "missed"]
      };
      if (!validTransitions[log3.status]?.includes(status)) {
        res.status(400).json({ message: `Invalid status transition from ${log3.status} to ${status}` });
        return;
      }
      const updateData = { status };
      if (notes) updateData.notes = notes;
      const updated = await storage.updateSubscriptionDeliveryLog(logId, updateData);
      if (status === "delivered") {
        const subscription = await storage.getSubscription(log3.subscriptionId);
        if (subscription && subscription.remainingDeliveries > 0) {
          const plan = await storage.getSubscriptionPlan(subscription.planId);
          const subscriptionUpdateData = {
            lastDeliveryDate: log3.date,
            remainingDeliveries: Math.max(0, subscription.remainingDeliveries - 1)
          };
          if (plan) {
            const deliveryDays = plan.deliveryDays;
            const maxDate = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
            const nextDelivery = getNextDeliveryDate(subscription.nextDeliveryDate, plan.frequency, deliveryDays, maxDate);
            subscriptionUpdateData.nextDeliveryDate = nextDelivery;
          }
          await storage.updateSubscription(log3.subscriptionId, subscriptionUpdateData);
          await storage.syncDeliveryHistory(log3.subscriptionId, "delivered", log3.date, "Delivered by delivery personnel");
        }
      }
      if (status === "missed") {
        const subscription = await storage.getSubscription(log3.subscriptionId);
        if (subscription) {
          await storage.syncDeliveryHistory(log3.subscriptionId, "missed", log3.date, "Marked as missed by delivery personnel");
          try {
            const user = await storage.getUser(subscription.userId);
            if (user) {
              const deliveryDate = log3.date.toLocaleDateString("en-IN");
              const deliveryTime = log3.date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              await sendMissedDeliveryNotification(
                user.id,
                user.phone,
                deliveryDate,
                deliveryTime,
                log3.subscriptionId
              );
              if (user.email) {
                await sendMissedDeliveryEmail(
                  user.email,
                  user.name || "Valued Customer",
                  deliveryDate,
                  deliveryTime,
                  log3.subscriptionId
                );
              }
            }
          } catch (notifyError) {
            console.warn("\u26A0\uFE0F Failed to send missed delivery notifications:", notifyError);
          }
        }
      }
      console.log(`\u{1F69A} Delivery person ${deliveryPersonId} updated subscription delivery ${logId} to ${status}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription delivery status:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });
  app2.get("/api/delivery/subscription-stats", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      const today = /* @__PURE__ */ new Date();
      const todayLogs = await storage.getSubscriptionDeliveryLogsByDate(today);
      const myLogs = todayLogs.filter((log3) => log3.deliveryPersonId === deliveryPersonId);
      const pending = myLogs.filter((log3) => ["scheduled", "preparing"].includes(log3.status)).length;
      const outForDelivery = myLogs.filter((log3) => log3.status === "out_for_delivery").length;
      const delivered = myLogs.filter((log3) => log3.status === "delivered").length;
      const missed = myLogs.filter((log3) => log3.status === "missed").length;
      res.json({
        pending,
        outForDelivery,
        delivered,
        missed,
        total: myLogs.length
      });
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Failed to fetch subscription statistics" });
    }
  });
  app2.get("/api/notifications/pending", requireDeliveryAuth(), async (req, res) => {
    try {
      const deliveryPersonId = req.delivery.deliveryId;
      if (!deliveryPersonId) return res.status(401).json({ message: "Unauthorized" });
      const pending = await db.query.pendingBroadcasts.findMany({
        where: (pb, { eq: eq7, and: and3 }) => and3(
          eq7(pb.recipientId, String(deliveryPersonId)),
          eq7(pb.recipientType, "delivery"),
          eq7(pb.isDelivered, false)
        ),
        orderBy: (pb, { asc: asc2 }) => [asc2(pb.createdAt)]
      });
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending broadcasts:", error);
      res.status(500).json({ message: "Failed to fetch pending broadcasts" });
    }
  });
  app2.post("/api/notifications/mark-delivered", requireDeliveryAuth(), async (req, res) => {
    try {
      const { ids } = req.body;
      const deliveryPersonId = req.delivery.deliveryId;
      if (!deliveryPersonId) return res.status(401).json({ message: "Unauthorized" });
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.json({ success: true });
      }
      const { eq: eq7, inArray, and: and3 } = await import("drizzle-orm");
      const { pendingBroadcasts: pendingBroadcasts3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await db.update(pendingBroadcasts3).set({ isDelivered: true }).where(
        and3(
          eq7(pendingBroadcasts3.recipientId, String(deliveryPersonId)),
          eq7(pendingBroadcasts3.recipientType, "delivery"),
          inArray(pendingBroadcasts3.id, ids)
        )
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking broadcasts delivered:", error);
      res.status(500).json({ message: "Failed to mark delivered" });
    }
  });
}

// server/routes.ts
init_websocket();
init_userAuth();
init_userAuth();
init_adminAuth();
init_db();
import { eq as eq6 } from "drizzle-orm";
import axios2 from "axios";
var DEFAULT_DELIVERY_TIME = "09:00";
var WEEKDAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
var SEND_SUBSCRIPTION_EMAILS = false;
var SUBSCRIPTION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  EXPIRED: "expired"
};
var DELIVERY_LOG_STATUS = {
  SCHEDULED: "scheduled",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  MISSED: "missed",
  SKIPPED: "skipped"
};
function isDeliveryDay(date, frequency, deliveryDays) {
  if (!deliveryDays || deliveryDays.length === 0) return false;
  const hasWeekdayNames = isWeekdayNameFormat(deliveryDays);
  if (hasWeekdayNames) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    return deliveryDays.includes(dayName);
  } else {
    const dayOfMonth = date.getDate().toString();
    return deliveryDays.includes(dayOfMonth);
  }
}
function isWeekdayNameFormat(deliveryDays) {
  return deliveryDays.some((day) => WEEKDAY_NAMES.includes(day.toLowerCase()));
}
function getNextActualDeliveryDate(fromDate, frequency, deliveryDays) {
  if (!deliveryDays || deliveryDays.length === 0) {
    const tomorrow2 = new Date(fromDate);
    tomorrow2.setDate(tomorrow2.getDate() + 1);
    return tomorrow2;
  }
  const checkDate = new Date(fromDate);
  checkDate.setDate(checkDate.getDate() + 1);
  checkDate.setHours(0, 0, 0, 0);
  const maxIterations = frequency === "monthly" ? 32 : 7;
  let iterations = 0;
  while (iterations < maxIterations) {
    if (isDeliveryDay(checkDate, frequency, deliveryDays)) {
      return new Date(checkDate);
    }
    checkDate.setDate(checkDate.getDate() + 1);
    iterations++;
  }
  const tomorrow = new Date(fromDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}
function calculateTotalDeliveries(frequency, deliveryDays, durationDays, startDate) {
  if (!deliveryDays || deliveryDays.length === 0) {
    return durationDays;
  }
  if (frequency === "daily") {
    if (!startDate) {
      const allWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const hasWeekdayNames2 = isWeekdayNameFormat(deliveryDays);
      if (hasWeekdayNames2 && deliveryDays.length === 7) {
        return durationDays;
      } else if (hasWeekdayNames2) {
        return Math.floor(durationDays / 7) * deliveryDays.length;
      } else {
        return durationDays;
      }
    }
    let count2 = 0;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);
    endDate.setHours(23, 59, 59, 999);
    const hasWeekdayNames = isWeekdayNameFormat(deliveryDays);
    while (currentDate <= endDate) {
      let shouldCount = false;
      if (hasWeekdayNames) {
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        shouldCount = deliveryDays.some((d) => d.toLowerCase() === dayName);
      } else {
        shouldCount = isDeliveryDay(currentDate, "daily", deliveryDays);
      }
      if (shouldCount) count2++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count2;
  }
  if (frequency === "weekly") {
    if (!startDate) {
      return Math.floor(durationDays / 7) * deliveryDays.length;
    }
    let count2 = 0;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);
    endDate.setHours(23, 59, 59, 999);
    const hasWeekdayNames = isWeekdayNameFormat(deliveryDays);
    while (currentDate <= endDate) {
      let shouldCount = false;
      if (hasWeekdayNames) {
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        shouldCount = deliveryDays.some((d) => d.toLowerCase() === dayName);
      } else {
        shouldCount = isDeliveryDay(currentDate, "weekly", deliveryDays);
      }
      if (shouldCount) count2++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count2;
  }
  if (frequency === "monthly") {
    const hasWeekdayNames = isWeekdayNameFormat(deliveryDays);
    if (hasWeekdayNames && startDate) {
      let count2 = 0;
      const currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays - 1);
      endDate.setHours(23, 59, 59, 999);
      while (currentDate <= endDate) {
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (deliveryDays.some((d) => d.toLowerCase() === dayName)) {
          count2++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return count2;
    } else {
      const monthsInDuration = Math.ceil(durationDays / 30);
      return deliveryDays.length * monthsInDuration;
    }
  }
  return Math.ceil(durationDays / 30);
}
async function generateSubscriptionDeliveryLogs(subscription, plan, startDate, endDate, deliveryTime) {
  try {
    const deliveryDays = plan.deliveryDays;
    if (!deliveryDays || deliveryDays.length === 0) {
      console.log(`\u26A0\uFE0F  No delivery days configured for plan ${plan.id}, skipping log generation`);
      return;
    }
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);
    let logsCreated = 0;
    const hasWeekdayNames = isWeekdayNameFormat(deliveryDays);
    while (currentDate <= normalizedEndDate) {
      let shouldCreateLog = false;
      if (hasWeekdayNames) {
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        shouldCreateLog = deliveryDays.some((d) => d.toLowerCase() === dayName);
      } else {
        shouldCreateLog = isDeliveryDay(currentDate, plan.frequency, deliveryDays);
      }
      if (shouldCreateLog) {
        const existingLog = await storage.getDeliveryLogBySubscriptionAndDate(subscription.id, currentDate);
        if (!existingLog) {
          await storage.createSubscriptionDeliveryLog({
            subscriptionId: subscription.id,
            date: new Date(currentDate),
            // Create new Date to avoid reference issues
            time: deliveryTime || DEFAULT_DELIVERY_TIME,
            status: DELIVERY_LOG_STATUS.SCHEDULED,
            deliveryPersonId: null,
            notes: null
          });
          logsCreated++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (logsCreated > 0) {
      console.log(`\u{1F4CB} Generated ${logsCreated} delivery log(s) for ${plan.frequency} subscription ${subscription.id}`);
    }
  } catch (error) {
    console.error("Error generating subscription delivery logs:", error);
  }
}
async function registerRoutes(app2) {
  registerAdminRoutes(app2);
  registerPartnerRoutes(app2);
  registerDeliveryRoutes(app2);
  const getCutoffHoursBefore = (slotOrStartTime) => {
    try {
      const slot = typeof slotOrStartTime === "object" ? slotOrStartTime : null;
      if (slot && typeof slot.cutoffHoursBefore === "number" && isFinite(slot.cutoffHoursBefore)) {
        return Math.max(0, Math.trunc(slot.cutoffHoursBefore));
      }
      const startTime = typeof slotOrStartTime === "string" ? slotOrStartTime : slot?.startTime || "00:00";
      const parts = (startTime || "00:00").split(":");
      const hour = parseInt(parts[0], 10);
      if (!isFinite(hour)) return 4;
      if (hour >= 8 && hour < 11) {
        return hour + 13;
      }
      if (hour < 8) {
        return 10;
      }
      if (hour >= 12) {
        return 1;
      }
      return 4;
    } catch (e) {
      return 4;
    }
  };
  const computeSlotCutoffInfo = (slot, forceNextDay = true) => {
    const now = /* @__PURE__ */ new Date();
    console.log(`[CUTOFF] Starting computation - now: ${now.toISOString()}, slot.startTime: ${slot?.startTime}, forceNextDay: ${forceNextDay}`);
    const currentHour = now.getHours();
    const [hStr, mStr] = (slot?.startTime || "00:00").split(":");
    const h = parseInt(hStr || "0", 10) || 0;
    const m = parseInt(mStr || "0", 10) || 0;
    console.log(`[CUTOFF] Parsed time - h: ${h}, m: ${m}, currentHour: ${currentHour}`);
    const isMorningSlot = h >= 8 && h < 11;
    console.log(`[CUTOFF] Is morning slot: ${isMorningSlot}`);
    const todaySlot = new Date(now);
    todaySlot.setHours(h, m, 0, 0);
    console.log(`[CUTOFF] Today slot time: ${todaySlot.toISOString()}`);
    const slotHasPassed = now > todaySlot;
    console.log(`[CUTOFF] Slot has passed today: ${slotHasPassed}`);
    const cutoffHours = getCutoffHoursBefore(slot);
    console.log(`[CUTOFF] Cutoff hours before: ${cutoffHours}`);
    const cutoffMs = cutoffHours * 60 * 60 * 1e3;
    const todayCutoffTime = new Date(todaySlot.getTime() - cutoffMs);
    console.log(`[CUTOFF] Today cutoff time: ${todayCutoffTime.toISOString()}`);
    let deliveryDate;
    let isPastCutoff;
    let cutoffDate;
    if (forceNextDay || slotHasPassed || now > todayCutoffTime) {
      console.log(`[CUTOFF] ${forceNextDay ? "New subscription - forcing next day" : "Past cutoff"} - scheduling for tomorrow`);
      deliveryDate = new Date(todaySlot);
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      isPastCutoff = true;
      console.log(`[CUTOFF] Tomorrow delivery date: ${deliveryDate.toISOString()}`);
      const tomorrowSlot = new Date(deliveryDate);
      cutoffDate = new Date(tomorrowSlot.getTime() - cutoffMs);
      console.log(`[CUTOFF] Tomorrow cutoff: ${cutoffDate.toISOString()}`);
    } else {
      console.log(`[CUTOFF] Can deliver today`);
      deliveryDate = todaySlot;
      isPastCutoff = false;
      cutoffDate = todayCutoffTime;
      console.log(`[CUTOFF] Today delivery date: ${deliveryDate.toISOString()}`);
    }
    const result = {
      cutoffHoursBefore: cutoffHours,
      cutoffHours,
      cutoffDate,
      isPastCutoff,
      nextAvailableDate: deliveryDate,
      isMorningSlot,
      slotHasPassed,
      inMorningRestriction: currentHour >= 8 && currentHour < 11
    };
    console.log(`[CUTOFF] Final result - nextAvailableDate: ${deliveryDate.toISOString()}, year: ${deliveryDate.getFullYear()}`);
    return result;
  };
  const getAreaCoordinatesMap = async () => {
    try {
      const areas = await storage.getAllDeliveryAreas();
      const coordinatesMap = {};
      areas.forEach((area) => {
        const areaLower = area.name.toLowerCase();
        const lat = typeof area.latitude === "number" ? area.latitude : parseFloat(String(area.latitude || 19.0728));
        const lon = typeof area.longitude === "number" ? area.longitude : parseFloat(String(area.longitude || 72.8826));
        coordinatesMap[areaLower] = {
          lat,
          lon,
          name: area.name
        };
      });
      return coordinatesMap;
    } catch (err) {
      console.error("[COORDINATES] Error fetching area coordinates from database:", err);
      return {
        "kurla": { lat: 19.0686, lon: 72.8817, name: "Kurla" },
        "kurla west": { lat: 19.0728, lon: 72.8826, name: "Kurla West" },
        "kurla east": { lat: 19.0644, lon: 72.8877, name: "Kurla East" },
        "worli": { lat: 19.0176, lon: 72.8194, name: "Worli" },
        "bandra": { lat: 19.0596, lon: 72.8295, name: "Bandra" },
        "andheri": { lat: 19.1136, lon: 72.8697, name: "Andheri" },
        "dadar": { lat: 19.0176, lon: 72.8388, name: "Dadar" }
      };
    }
  };
  app2.post("/api/coupons/verify", async (req, res) => {
    try {
      const { code, orderAmount, userId: providedUserId } = req.body;
      if (!code || typeof code !== "string" || code.trim().length === 0) {
        res.status(400).json({ message: "Coupon code is required" });
        return;
      }
      if (!orderAmount || typeof orderAmount !== "number" || orderAmount <= 0 || !isFinite(orderAmount)) {
        res.status(400).json({ message: "Valid order amount is required" });
        return;
      }
      let userId = providedUserId;
      if (providedUserId && typeof providedUserId === "string") {
        userId = providedUserId.trim();
      }
      if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
        try {
          const token = req.headers.authorization.substring(7);
          const payload = verifyToken5(token);
          if (payload?.userId) userId = payload.userId;
        } catch (tokenError) {
          console.log("Token verification failed for coupon, continuing without userId");
        }
      }
      const result = await storage.verifyCoupon(code.trim().toUpperCase(), orderAmount, userId);
      if (!result) {
        res.status(404).json({ message: "Invalid coupon code" });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error("Coupon verification error:", error);
      res.status(400).json({ message: error.message || "Failed to verify coupon" });
    }
  });
  app2.post("/api/track-visitor", async (req, res) => {
    try {
      const { userId, sessionId, page, userAgent, referrer } = req.body;
      if (page && (page.startsWith("/admin") || page.startsWith("/partner") || page.startsWith("/delivery"))) {
        res.json({ success: true });
        return;
      }
      const visitorData = {
        userId: userId || null,
        sessionId: sessionId || `session-${Date.now()}`,
        page: page || "/",
        userAgent: userAgent || req.get("user-agent") || "Unknown",
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        referrer: referrer || null
      };
      await storage.trackVisitor(visitorData);
      res.json({ success: true });
    } catch (error) {
      console.error("Visitor tracking error:", error);
      res.json({ success: true });
    }
  });
  app2.get("/api/delivery-slots", async (req, res) => {
    try {
      const slots = await storage.getActiveDeliveryTimeSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching delivery slots:", error);
      res.status(500).json({ message: "Failed to fetch delivery slots" });
    }
  });
  app2.post("/api/user/check-phone", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ message: "Phone number is required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      res.json({ exists: !!user });
    } catch (error) {
      console.error("Phone check error:", error);
      res.status(500).json({ message: "Failed to check phone number" });
    }
  });
  app2.post("/api/user/reset-password", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ message: "Phone number is required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const newPassword = phone.slice(-6);
      const passwordHash = await hashPassword5(newPassword);
      await storage.updateUser(user.id, { passwordHash });
      let emailSent = false;
      if (user.email) {
        const emailHtml = createPasswordResetEmail(user.name, user.phone, newPassword);
        emailSent = await sendEmail({
          to: user.email,
          subject: "\u{1F510} Password Reset - RotiHai",
          html: emailHtml
        });
      }
      res.json({
        message: emailSent ? "Password reset successful! Check your email for the new password." : "Password reset successful. Your new password is the last 6 digits of your phone number.",
        newPassword: !emailSent ? newPassword : void 0,
        emailSent,
        hint: "Use the last 6 digits of your phone number to login"
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/user/change-password", requireUser(), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters long" });
        return;
      }
      const userId = req.authenticatedUser.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const isValid = await verifyPassword4(currentPassword, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
      const newPasswordHash = await hashPassword5(newPassword);
      await storage.updateUser(user.id, { passwordHash: newPasswordHash });
      if (user.email) {
        const emailHtml = createPasswordChangeConfirmationEmail(user.name, user.phone);
        await sendEmail({
          to: user.email,
          subject: "\u2705 Password Changed Successfully - RotiHai",
          html: emailHtml
        });
      }
      res.json({
        message: "Password changed successfully",
        success: true
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.post("/api/user/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.error("User registration validation failed:", result.error.flatten());
        res.status(400).json({
          message: "Invalid user data",
          errors: result.error.flatten().fieldErrors
        });
        return;
      }
      const sanitizedPhone = result.data.phone.trim().replace(/\s+/g, "");
      const existingPhoneUser = await storage.getUserByPhone(sanitizedPhone);
      if (existingPhoneUser) {
        res.status(409).json({ message: "Phone number already registered. Please use a different phone number." });
        return;
      }
      const passwordHash = await hashPassword5(result.data.password);
      const user = await storage.createUser({
        name: result.data.name.trim(),
        phone: sanitizedPhone,
        email: result.data.email ? result.data.email.trim().toLowerCase() : null,
        address: result.data.address ? result.data.address.trim() : null,
        passwordHash,
        referralCode: null,
        walletBalance: 0,
        latitude: null,
        longitude: null
      });
      const accessToken = generateAccessToken3(user);
      const refreshToken = generateRefreshToken4(user);
      console.log(`\u2705 User registered successfully: ${user.id}`);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: error.message || "Failed to register user"
      });
    }
  });
  app2.post("/api/user/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        res.status(400).json({ message: "Phone and password are required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(401).json({ message: "Invalid phone number or password" });
        return;
      }
      const passwordMatch = await verifyPassword4(password, user.passwordHash);
      if (!passwordMatch) {
        res.status(401).json({ message: "Invalid phone number or password" });
        return;
      }
      await storage.updateUserLastLogin(user.id);
      const accessToken = generateAccessToken3(user);
      const refreshToken = generateRefreshToken4(user);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  app2.post("/api/user/forgot-password", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || phone.length !== 10) {
        res.status(400).json({ message: "Valid 10-digit phone number is required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        res.status(404).json({ message: "No account found with this phone number" });
        return;
      }
      if (!user.email) {
        res.status(400).json({
          message: "No email address registered for this account. Please contact support."
        });
        return;
      }
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await hashPassword5(tempPassword);
      await storage.updateUser(user.id, { passwordHash: hashedPassword });
      await sendEmail({
        to: user.email,
        subject: "\u{1F510} Password Reset - RotiHai",
        html: createPasswordResetEmail(user.name, user.phone, tempPassword)
      });
      res.json({
        message: "A new password has been sent to your registered email address"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        message: "Failed to reset password. Please try again later."
      });
    }
  });
  app2.post("/api/user/logout", async (req, res) => {
    try {
      console.log("User logout requested");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: error.message || "Failed to logout" });
    }
  });
  app2.post("/api/user/auto-register", async (req, res) => {
    try {
      const { customerName, phone, email, address } = req.body;
      if (!customerName || !phone) {
        res.status(400).json({ message: "Name and phone are required" });
        return;
      }
      let user = await storage.getUserByPhone(phone);
      let isNewUser = false;
      let generatedPassword;
      let emailSent = false;
      if (!user) {
        isNewUser = true;
        generatedPassword = phone.slice(-6);
        if (!generatedPassword || generatedPassword.length < 6) {
          return res.status(400).json({ message: "Invalid phone number: must be at least 6 digits" });
        }
        const passwordHash = await hashPassword5(generatedPassword);
        user = await storage.createUser({
          name: customerName,
          phone,
          email: email || null,
          address: address || null,
          passwordHash,
          referralCode: null,
          walletBalance: 0,
          latitude: null,
          longitude: null
        });
        console.log("New user created:", user.id, "- Default password:", generatedPassword);
        if (email) {
          const emailHtml = createWelcomeEmail(customerName, phone, generatedPassword);
          emailSent = await sendEmail({
            to: email,
            subject: "\u{1F37D}\uFE0F Welcome to RotiHai - Your Account Details",
            html: emailHtml
          });
          if (emailSent) {
            console.log(`\u2705 Welcome email sent to ${email}`);
          }
        }
      } else {
        await storage.updateUserLastLogin(user.id);
        console.log("Existing user logged in:", user.id);
      }
      const accessToken = generateAccessToken3(user);
      const refreshToken = generateRefreshToken4(user);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address
        },
        accessToken,
        refreshToken,
        defaultPassword: isNewUser ? generatedPassword : void 0,
        emailSent: isNewUser ? emailSent : void 0
      });
    } catch (error) {
      console.error("Auto-register error:", error);
      res.status(500).json({ message: "Failed to auto-register" });
    }
  });
  app2.get("/api/user/profile", requireUser(), async (req, res) => {
    try {
      const user = await storage.getUser(req.authenticatedUser.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      let pendingBonus = null;
      const referral = await (await Promise.resolve().then(() => (init_db(), db_exports))).db.query.referrals.findFirst({
        where: (r, { eq: eq7 }) => eq7(r.referredId, user.id)
      });
      if (referral && referral.status === "pending") {
        const settings = await storage.getActiveReferralReward();
        pendingBonus = {
          amount: referral.referredBonus,
          minOrderAmount: settings?.minOrderAmount || 0,
          code: referral.referralCode,
          referrerName: (await storage.getUser(referral.referrerId))?.name
        };
      }
      res.json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance || 0,
        pendingBonus,
        latitude: user.latitude,
        longitude: user.longitude
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.put("/api/user/profile", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { name, email, address, latitude, longitude } = req.body;
      if (email && (typeof email !== "string" || !email.includes("@"))) {
        res.status(400).json({ message: "Valid email is required" });
        return;
      }
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const updateData = {};
      if (name && typeof name === "string") updateData.name = name.trim();
      if (email && typeof email === "string") updateData.email = email.trim();
      if (address && typeof address === "string") updateData.address = address.trim();
      if (latitude !== void 0) updateData.latitude = latitude;
      if (longitude !== void 0) updateData.longitude = longitude;
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "No valid fields to update" });
        return;
      }
      await storage.updateUser(userId, updateData);
      const updatedUser = await storage.getUser(userId);
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        referralCode: updatedUser.referralCode,
        walletBalance: updatedUser.walletBalance || 0,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/referral-settings", async (req, res) => {
    try {
      const settings = await storage.getActiveReferralReward();
      if (!settings) {
        res.json({
          referrerBonus: 50,
          referredBonus: 50,
          minOrderAmount: 100,
          maxReferralsPerMonth: 10,
          maxEarningsPerMonth: 500,
          expiryDays: 30
        });
        return;
      }
      res.json({
        referrerBonus: settings.referrerBonus,
        referredBonus: settings.referredBonus,
        minOrderAmount: settings.minOrderAmount,
        maxReferralsPerMonth: settings.maxReferralsPerMonth,
        maxEarningsPerMonth: settings.maxEarningsPerMonth,
        expiryDays: settings.expiryDays
      });
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });
  app2.post("/api/user/generate-referral", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      if (user.referralCode) {
        res.json({ referralCode: user.referralCode });
        return;
      }
      const referralCode = await storage.generateReferralCode(userId);
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: error.message || "Failed to generate referral code" });
    }
  });
  app2.post("/api/user/apply-referral", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { referralCode } = req.body;
      if (!referralCode) {
        res.status(400).json({ message: "Referral code is required" });
        return;
      }
      const settings = await storage.getActiveReferralReward();
      if (!settings?.isActive) {
        return res.status(400).json({ message: "Referral system is currently disabled" });
      }
      await storage.applyReferralBonus(referralCode, userId);
      const bonus = settings.referredBonus || 50;
      res.json({
        message: "Referral bonus applied successfully",
        bonus,
        note: "Bonus is credited to your wallet. It will be available for your next order."
      });
    } catch (error) {
      console.error("Error applying referral:", error);
      res.status(400).json({ message: error.message || "Failed to apply referral" });
    }
  });
  app2.get("/api/user/referrals", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const referrals3 = await storage.getReferralsByUser(userId);
      res.json(referrals3);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referrals" });
    }
  });
  app2.get("/api/user/referral-code", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const referralCode = await storage.getUserReferralCode(userId);
      if (!referralCode) {
        res.status(404).json({ message: "No referral code found. Generate one first." });
        return;
      }
      res.json({ referralCode });
    } catch (error) {
      console.error("Error fetching referral code:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referral code" });
    }
  });
  app2.get("/api/user/referral-eligibility", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const referral = await storage.getReferralByReferredId(userId);
      if (referral) {
        res.json({ eligible: false, reason: "You have already used a referral code" });
        return;
      }
      res.json({ eligible: true });
    } catch (error) {
      console.error("Error checking referral eligibility:", error);
      res.status(500).json({ message: error.message || "Failed to check eligibility" });
    }
  });
  app2.get("/api/user/wallet", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const balance = await storage.getUserWalletBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet balance" });
    }
  });
  app2.get("/api/user/wallet/transactions", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const transactions = await storage.getWalletTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet transactions" });
    }
  });
  app2.get("/api/user/referral-stats", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch referral stats" });
    }
  });
  app2.post("/api/user/check-bonus-eligibility", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { orderTotal } = req.body;
      if (!orderTotal || orderTotal <= 0) {
        return res.status(400).json({ message: "Order total is required and must be greater than 0" });
      }
      const eligibility = await storage.validateBonusEligibility(userId, orderTotal);
      res.json(eligibility);
    } catch (error) {
      console.error("Error checking bonus eligibility:", error);
      res.status(500).json({ message: error.message || "Failed to check bonus eligibility" });
    }
  });
  app2.post("/api/user/claim-bonus-at-checkout", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { orderTotal, orderId } = req.body;
      if (!orderTotal || orderTotal <= 0) {
        return res.status(400).json({ message: "Order total is required and must be greater than 0" });
      }
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      const result = await storage.claimReferralBonusAtCheckout(userId, orderTotal, orderId);
      if (result.bonusClaimed) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error claiming bonus:", error);
      res.status(500).json({ message: error.message || "Failed to claim bonus" });
    }
  });
  app2.post("/api/subscriptions/:id/skip-delivery", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscriptionId = req.params.id;
      const { deliveryDate, reason } = req.body;
      console.log(`[SKIP-DELIVERY] Starting skip delivery:`, { subscriptionId, deliveryDate, reason });
      const subscription = await storage.getSubscription(subscriptionId);
      console.log(`[SKIP-DELIVERY] Got subscription:`, { subscriptionId, found: !!subscription });
      if (!subscription) {
        console.log(`[SKIP-DELIVERY] Subscription not found`);
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        console.log(`[SKIP-DELIVERY] Unauthorized: subscription belongs to ${subscription.userId}, request from ${userId}`);
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      if (!deliveryDate) {
        console.log(`[SKIP-DELIVERY] Missing deliveryDate`);
        res.status(400).json({ message: "Delivery date is required" });
        return;
      }
      const date = new Date(deliveryDate);
      date.setHours(0, 0, 0, 0);
      console.log(`[SKIP-DELIVERY] Searching for delivery log on ${date.toDateString()}`);
      const todaysLogs = await storage.getSubscriptionDeliveryLogsByDate(date);
      console.log(`[SKIP-DELIVERY] Found ${todaysLogs.length} logs for this date`);
      let log3 = todaysLogs.find((l) => l.subscriptionId === subscriptionId);
      console.log(`[SKIP-DELIVERY] Found matching log:`, { found: !!log3, logId: log3?.id });
      const skipNote = reason ? `Skipped by user: ${reason}` : "Skipped by user";
      if (!log3) {
        console.log(`[SKIP-DELIVERY] Creating new delivery log with skipped status`);
        log3 = await storage.createSubscriptionDeliveryLog({
          subscriptionId,
          date,
          time: subscription.nextDeliveryTime || DEFAULT_DELIVERY_TIME,
          status: DELIVERY_LOG_STATUS.SKIPPED,
          notes: skipNote,
          deliveryPersonId: null
        });
        console.log(`[SKIP-DELIVERY] Created new log:`, { logId: log3.id });
      } else {
        console.log(`[SKIP-DELIVERY] Updating existing log to skipped status:`, { logId: log3.id });
        log3 = await storage.updateSubscriptionDeliveryLog(log3.id, {
          status: "skipped",
          notes: skipNote,
          updatedAt: /* @__PURE__ */ new Date()
        });
        console.log(`[SKIP-DELIVERY] Updated log:`, { logId: log3?.id });
      }
      const user = await storage.getUser(userId);
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      console.log(`[SKIP-DELIVERY] Got plan:`, { planId: subscription.planId, found: !!plan, planName: plan?.name });
      if (!plan) {
        console.error(`[SKIP-DELIVERY] ERROR: Plan not found for planId: ${subscription.planId}`);
        throw new Error(`Subscription plan not found (planId: ${subscription.planId})`);
      }
      if (plan) {
        const deliveryDays = plan.deliveryDays;
        let nextDelivery = new Date(subscription.nextDeliveryDate);
        console.log(`[SKIP-DELIVERY] Plan: ${plan.name} (frequency: ${plan.frequency})`);
        console.log(`[SKIP-DELIVERY] Delivery days: ${JSON.stringify(deliveryDays)}`);
        console.log(`[SKIP-DELIVERY] Current nextDeliveryDate: ${nextDelivery.toDateString()}`);
        const weekdayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const allWeekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const isDayBasedPlan = deliveryDays.some((day) => weekdayNames.includes(day.toLowerCase()));
        const isDailyPlan = isDayBasedPlan && allWeekdays.every((day) => deliveryDays.includes(day));
        console.log(`[SKIP-DELIVERY] Is day-based plan: ${isDayBasedPlan}, Is daily plan (all weekdays): ${isDailyPlan}`);
        if (isDailyPlan) {
          nextDelivery.setDate(nextDelivery.getDate() + 1);
          console.log(`[SKIP-DELIVERY] Daily plan (delivers every day) - shifted to: ${nextDelivery.toDateString()}`);
        } else if (isDayBasedPlan) {
          nextDelivery.setDate(nextDelivery.getDate() + 1);
          console.log(`[SKIP-DELIVERY] Specific weekday plan - looking for next matching day from: ${nextDelivery.toDateString()}`);
          let attempts = 0;
          const maxAttempts = 31;
          while (attempts < maxAttempts) {
            const dayName = nextDelivery.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
            const isDeliveryDay2 = deliveryDays.includes(dayName);
            console.log(`[SKIP-DELIVERY] Attempt ${attempts}: ${nextDelivery.toDateString()} (${dayName}) \u2192 match: ${isDeliveryDay2}`);
            if (isDeliveryDay2) {
              console.log(`[SKIP-DELIVERY] Found next delivery day: ${nextDelivery.toDateString()}`);
              break;
            }
            nextDelivery.setDate(nextDelivery.getDate() + 1);
            attempts++;
          }
        } else {
          console.log(`[SKIP-DELIVERY] Unknown plan type - using fallback (shift by 1 day)`);
          nextDelivery.setDate(nextDelivery.getDate() + 1);
        }
        const daysDifference = Math.floor((nextDelivery.getTime() - new Date(subscription.nextDeliveryDate).getTime()) / (1e3 * 60 * 60 * 24));
        console.log(`[SKIP-DELIVERY] Days shifted forward: ${daysDifference}`);
        const oldMaxDate = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
        let newEndDate = new Date(oldMaxDate);
        newEndDate.setDate(newEndDate.getDate() + daysDifference);
        console.log(`[SKIP-DELIVERY] Old endDate: ${oldMaxDate.toDateString()}`);
        console.log(`[SKIP-DELIVERY] New endDate: ${newEndDate.toDateString()}`);
        console.log(`[SKIP-DELIVERY] About to update subscription with:`, {
          nextDeliveryDate: nextDelivery.toISOString(),
          endDate: newEndDate.toISOString()
        });
        const updateResult = await storage.updateSubscription(subscriptionId, {
          nextDeliveryDate: nextDelivery,
          endDate: newEndDate
        });
        if (!updateResult) {
          throw new Error(`Failed to update subscription (subscription returned null/undefined)`);
        }
        console.log(`[SKIP-DELIVERY] Updated subscription: nextDeliveryDate=${nextDelivery.toDateString()}, endDate=${newEndDate.toDateString()}`);
        if (daysDifference > 0) {
          try {
            const deliveryDaysArray = plan.deliveryDays;
            let logDate = new Date(oldMaxDate);
            logDate.setDate(logDate.getDate() + 1);
            console.log(`[SKIP-DELIVERY] Creating logs for extended period from ${logDate.toDateString()} to ${newEndDate.toDateString()}`);
            while (logDate <= newEndDate) {
              const dayName = logDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
              const isValidDeliveryDay = deliveryDaysArray.includes(dayName);
              if (isValidDeliveryDay) {
                const existingLog = await storage.getDeliveryLogBySubscriptionAndDate(subscriptionId, logDate);
                if (!existingLog) {
                  console.log(`[SKIP-DELIVERY] Creating log for ${logDate.toDateString()}`);
                  await storage.createSubscriptionDeliveryLog({
                    subscriptionId,
                    date: new Date(logDate),
                    time: subscription.nextDeliveryTime || DEFAULT_DELIVERY_TIME,
                    status: DELIVERY_LOG_STATUS.SCHEDULED,
                    deliveryPersonId: null,
                    notes: "Created to extend subscription after skipping delivery"
                  });
                }
              }
              logDate.setDate(logDate.getDate() + 1);
            }
            console.log(`[SKIP-DELIVERY] Extended logs creation completed`);
          } catch (logError) {
            console.error(`[SKIP-DELIVERY] Error creating extended logs:`, logError);
          }
        }
      }
      const updatedSubscription = await storage.getSubscription(subscriptionId);
      console.log(`\u2705 User ${user?.name || userId} skipped delivery for subscription ${subscriptionId} on ${date.toDateString()}`);
      console.log(`   Reason: ${skipNote}`);
      console.log(`   Updated nextDeliveryDate: ${updatedSubscription?.nextDeliveryDate}`);
      res.json({
        message: "Delivery skipped successfully",
        skippedDelivery: log3,
        updatedSubscription
      });
    } catch (error) {
      console.error("\u274C Error skipping delivery:", error);
      console.error("Stack trace:", error.stack);
      console.error("Error message:", error.message);
      console.error("Full error:", JSON.stringify(error, null, 2));
      const isDevelopment = process.env.NODE_ENV === "development";
      const errorMessage = isDevelopment ? error.message : "Failed to skip delivery";
      const errorDetails = isDevelopment ? { originalError: error.message, stack: error.stack } : {};
      res.status(500).json({
        message: errorMessage,
        ...errorDetails
      });
    }
  });
  app2.post("/api/subscriptions/:id/complete-delivery", requireUser(), async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (!subscription.isPaid) {
        res.status(400).json({ message: "Subscription not paid" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Plan not found" });
        return;
      }
      const deliveryHistory = subscription.deliveryHistory || [];
      const now = /* @__PURE__ */ new Date();
      deliveryHistory.push({
        deliveredAt: now,
        items: plan.items,
        deliveryDate: subscription.nextDeliveryDate,
        deliveryTime: subscription.nextDeliveryTime
      });
      const remainingDeliveries = subscription.remainingDeliveries - 1;
      const deliveryDays = plan.deliveryDays;
      let nextDelivery = new Date(subscription.nextDeliveryDate);
      nextDelivery.setDate(nextDelivery.getDate() + 1);
      const maxDateLimit = subscription.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3);
      let attempts = 0;
      const maxAttempts = plan.frequency === "monthly" ? 31 : 7;
      while (nextDelivery <= maxDateLimit && attempts < maxAttempts) {
        const isDeliveryDayCheck = plan.frequency === "monthly" ? deliveryDays.includes(nextDelivery.getDate().toString()) : deliveryDays.includes(nextDelivery.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase());
        if (isDeliveryDayCheck) {
          break;
        }
        nextDelivery.setDate(nextDelivery.getDate() + 1);
        attempts++;
      }
      const updateData = {
        remainingDeliveries,
        lastDeliveryDate: now,
        deliveryHistory,
        nextDeliveryDate: nextDelivery
      };
      if (remainingDeliveries <= 0) {
        updateData.status = "completed";
      }
      const updated = await storage.updateSubscription(req.params.id, updateData);
      if (!updated) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }
      if (updated.chefId) {
        broadcastSubscriptionDelivery(updated);
      }
      res.json({ message: "Delivery completed", subscription: updated });
    } catch (error) {
      console.error("Error completing delivery:", error);
      res.status(500).json({ message: error.message || "Failed to complete delivery" });
    }
  });
  app2.get("/api/user/orders", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      console.log("GET /api/user/orders - User ID:", userId);
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      console.log("GET /api/user/orders - User phone:", user.phone);
      const deliverySettings3 = await storage.getDeliverySettings();
      const minOrderAmount = deliverySettings3[0]?.minOrderAmount || 100;
      const allOrders = await storage.getAllOrders();
      const userOrders = allOrders.filter(
        (order) => order.phone === user.phone || order.userId === userId
      ).map((order) => ({
        ...order,
        isBelowDeliveryMinimum: order.subtotal < minOrderAmount
      }));
      console.log("GET /api/user/orders - Found", userOrders.length, "orders");
      res.json(userOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: error.message || "Failed to fetch orders" });
    }
  });
  app2.get("/api/categories", async (_req, res) => {
    try {
      const categories3 = await storage.getAllCategories();
      res.json(categories3);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const categoryId = req.query.categoryId;
      if (categoryId) {
        const products3 = await storage.getProductsByCategoryId(categoryId);
        res.json(products3);
      } else {
        const products3 = await storage.getAllProducts();
        res.json(products3);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      console.log(" Incoming order body:", JSON.stringify(req.body, null, 2));
      const body = req.body;
      const sanitizeNumber = (val) => typeof val === "string" ? parseFloat(val) : val;
      const sanitized = {
        customerName: body.customerName?.trim(),
        phone: body.phone?.trim(),
        email: body.email || "",
        address: body.address?.trim(),
        // Structured address fields (NEW: for pincode validation)
        addressBuilding: body.addressBuilding?.trim() || "",
        addressStreet: body.addressStreet?.trim() || "",
        addressArea: body.addressArea?.trim() || "",
        addressCity: body.addressCity?.trim() || "Mumbai",
        addressPincode: body.addressPincode?.trim() || "",
        items: Array.isArray(body.items) ? body.items.map((i) => ({
          id: i.id,
          name: i.name,
          price: sanitizeNumber(i.price),
          quantity: sanitizeNumber(i.quantity),
          categoryId: i.categoryId || void 0,
          chefId: i.chefId || void 0,
          // Preserve special cooking instructions — this is saved in JSONB items column
          ...i.specialInstructions ? { specialInstructions: String(i.specialInstructions).trim() } : {}
        })) : [],
        subtotal: sanitizeNumber(body.subtotal),
        deliveryFee: sanitizeNumber(body.deliveryFee),
        total: sanitizeNumber(body.total),
        chefId: body.chefId || body.items?.[0]?.chefId || "",
        paymentStatus: body.paymentStatus || "pending",
        userId: body.userId || void 0,
        couponCode: body.couponCode || void 0,
        discount: body.discount || 0,
        walletAmountUsed: sanitizeNumber(body.walletAmountUsed) || 0,
        categoryId: body.categoryId || void 0,
        categoryName: body.categoryName || void 0,
        deliveryTime: body.deliveryTime || void 0,
        deliverySlotId: body.deliverySlotId || void 0
      };
      const isRotiCategory = sanitized.categoryName?.toLowerCase() === "roti" || sanitized.categoryName?.toLowerCase().includes("roti");
      const customerLatitude = sanitizeNumber(body.customerLatitude);
      const customerLongitude = sanitizeNumber(body.customerLongitude);
      if (customerLatitude === void 0 || customerLongitude === void 0 || isNaN(customerLatitude) || isNaN(customerLongitude)) {
        console.log(`\u{1F6AB} Order blocked - no delivery coordinates provided`);
        return res.status(400).json({
          message: "Delivery address coordinates required. Please enter and confirm your delivery address.",
          requiresAddressValidation: true
        });
      }
      const { calculateDistance: calculateDistance2 } = await Promise.resolve().then(() => (init_deliveryUtils(), deliveryUtils_exports));
      let chefLat = 19.0728;
      let chefLon = 72.8826;
      let chefName = "Kurla West Kitchen";
      let maxDeliveryDistance = 5;
      let chef = null;
      if (sanitized.chefId) {
        chef = await db.query.chefs.findFirst({
          where: (c, { eq: eq7 }) => eq7(c.id, sanitized.chefId)
        });
        if (chef) {
          chefLat = chef.latitude ?? 19.0728;
          chefLon = chef.longitude ?? 72.8826;
          chefName = chef.name;
          maxDeliveryDistance = chef.maxDeliveryDistanceKm ?? 5;
        }
      }
      const addressDistance = calculateDistance2(chefLat, chefLon, customerLatitude, customerLongitude);
      console.log(`[DELIVERY-ZONE] Validating delivery address:`, {
        address: sanitized.address,
        latitude: customerLatitude,
        longitude: customerLongitude,
        chefName,
        chefLocation: `${chefLat.toFixed(4)}, ${chefLon.toFixed(4)}`,
        distanceFromChef: addressDistance.toFixed(2),
        maxDeliveryDistance
      });
      if (addressDistance > maxDeliveryDistance) {
        console.log(`\u{1F6AB} Order blocked - delivery address outside service zone:`, {
          address: sanitized.address,
          chef: chefName,
          distanceFromChef: addressDistance.toFixed(2),
          maxDistance: maxDeliveryDistance
        });
        return res.status(400).json({
          message: `Delivery not available to this address. ${chefName} delivers within ${maxDeliveryDistance}km. This address is ${addressDistance.toFixed(1)}km away.`,
          outsideDeliveryZone: true,
          addressDistance: addressDistance.toFixed(1),
          maxDistance: maxDeliveryDistance,
          address: sanitized.address
        });
      }
      const customerPincode = sanitized.addressPincode;
      if (customerPincode && chef && chef.servicePincodes && chef.servicePincodes.length > 0) {
        const pincodeValid = chef.servicePincodes.includes(customerPincode);
        console.log(`[PINCODE-VALIDATION] Chef service pincodes:`, {
          chef: chefName,
          servicePincodes: chef.servicePincodes,
          customerPincode,
          isValid: pincodeValid
        });
        if (!pincodeValid) {
          console.log(`\u{1F6AB} Order blocked - customer pincode not in chef's service pincodes:`, {
            chef: chefName,
            customerPincode,
            servicePincodes: chef.servicePincodes
          });
          return res.status(400).json({
            message: `${chefName} does not deliver to pincode ${customerPincode}. Served pincodes: ${chef.servicePincodes.join(", ")}`,
            pincodeNotInServiceArea: true,
            customerPincode,
            servicePincodes: chef.servicePincodes
          });
        }
        console.log(`\u2705 Pincode validated:`, {
          chef: chefName,
          pincode: customerPincode
        });
      } else if (customerPincode && (!chef || !chef.servicePincodes || chef.servicePincodes.length === 0)) {
        console.log(`[PINCODE-VALIDATION] Chef has no pincode restrictions (backward compatible):`, {
          chef: chefName,
          customerPincode
        });
      }
      console.log(`\u2705 Delivery address validated successfully:`, {
        address: sanitized.address,
        chef: chefName,
        distanceFromChef: addressDistance.toFixed(2),
        withinZone: true
      });
      try {
        const rawSettings = await storage.getDeliverySettings();
        const deliverySettings3 = rawSettings.map((s) => ({
          ...s,
          minOrderAmount: s.minOrderAmount === null ? void 0 : s.minOrderAmount
        }));
        const { calculateDelivery: calculateDelivery2 } = await Promise.resolve().then(() => (init_deliveryUtils(), deliveryUtils_exports));
        const feeResult = calculateDelivery2(addressDistance, sanitized.subtotal || 0, deliverySettings3);
        const minOrderAmount = feeResult.minOrderAmount || 0;
        const meetsMinimum = minOrderAmount > 0 && (sanitized.subtotal || 0) >= minOrderAmount;
        const expectedDeliveryFee = feeResult.freeDeliveryEligible || meetsMinimum ? 0 : feeResult.deliveryFee;
        console.log("[SERVER] Recomputed delivery fee using Admin settings:", {
          baseFee: feeResult.deliveryFee,
          expectedDeliveryFee,
          isFreeDelivery: feeResult.freeDeliveryEligible || meetsMinimum,
          meetsMinimumThreshold: meetsMinimum,
          minOrderAmount,
          subtotal: sanitized.subtotal,
          addressDistance
        });
        sanitized.deliveryFee = expectedDeliveryFee;
        const baseTotal = (sanitized.subtotal || 0) + (sanitized.deliveryFee || 0) - (sanitized.discount || 0);
        const bonusDeduction = sanitized.bonusUsedAtCheckout || 0;
        const walletDeduction = sanitized.walletAmountUsed || 0;
        sanitized.total = Math.max(0, baseTotal - bonusDeduction - walletDeduction);
        console.log("[SERVER] Final recalculated total:", {
          subtotal: sanitized.subtotal,
          deliveryFee: sanitized.deliveryFee,
          discount: sanitized.discount,
          bonusUsed: bonusDeduction,
          walletUsed: walletDeduction,
          finalTotal: sanitized.total
        });
      } catch (feeErr) {
        console.error("Error computing delivery fee on server:", feeErr);
        return res.status(500).json({ message: "Failed to compute delivery fee" });
      }
      if (isRotiCategory) {
        const rotiSettings3 = await storage.getRotiSettings();
        const now = /* @__PURE__ */ new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        if (rotiSettings3?.isActive) {
          const [blockStartH, blockStartM] = rotiSettings3.morningBlockStartTime.split(":").map(Number);
          const [blockEndH, blockEndM] = rotiSettings3.morningBlockEndTime.split(":").map(Number);
          const blockStartMinutes = blockStartH * 60 + blockStartM;
          const blockEndMinutes = blockEndH * 60 + blockEndM;
          const currentTimeMinutes = currentHour * 60 + currentMinutes;
          if (currentTimeMinutes >= blockStartMinutes && currentTimeMinutes < blockEndMinutes) {
            console.log(`\u{1F6AB} Roti order blocked - current time ${currentHour}:${currentMinutes} is within morning restriction`);
            return res.status(403).json({
              message: rotiSettings3.blockMessage || "Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery.",
              morningRestriction: true,
              isBlocked: true,
              blockStartTime: rotiSettings3.morningBlockStartTime,
              blockEndTime: rotiSettings3.morningBlockEndTime,
              currentTime: `${currentHour.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`
            });
          }
        }
        if (sanitized.deliverySlotId) {
          const slot = await storage.getDeliveryTimeSlot(sanitized.deliverySlotId);
          if (!slot) {
            return res.status(400).json({ message: "Selected delivery slot not found" });
          }
          const cutoffInfo = computeSlotCutoffInfo(slot);
          if (cutoffInfo.inMorningRestriction && cutoffInfo.isMorningSlot) {
            console.log(`\u{1F6AB} Morning slot selection blocked during morning hours`);
            return res.status(403).json({
              message: "Morning delivery slots (8 AM - 11 AM) cannot be selected during morning hours. Please order by 11 PM the previous day or select a later time slot.",
              morningRestriction: true,
              isBlocked: true,
              availableAfter: rotiSettings3?.morningBlockEndTime || "11:00",
              suggestLaterSlot: true
            });
          }
          if (cutoffInfo.isPastCutoff) {
            console.log(`\u{1F4C5} Auto-scheduling Roti order for next day - slot cutoff passed`);
          }
        } else {
          console.log(`\u23F0 No slot selected: Order will be treated as regular order (not scheduled)`);
        }
      }
      if (sanitized.deliveryTime === void 0) {
        delete sanitized.deliveryTime;
      }
      if (sanitized.deliverySlotId === void 0) {
        delete sanitized.deliverySlotId;
      }
      const result = insertOrderSchema.safeParse(sanitized);
      if (!result.success) {
        console.error("\u274C Order validation failed:", result.error.flatten());
        return res.status(400).json({
          message: "Invalid order data",
          errors: result.error.flatten(),
          received: sanitized
        });
      }
      let userId;
      let accountCreated = false;
      let generatedPassword;
      let emailSent = false;
      let appliedReferralBonus = 0;
      const referralCodeInput = req.body.referralCode;
      if (req.headers.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.substring(7);
        const payload = verifyToken5(token);
        if (payload?.userId) userId = payload.userId;
      }
      if (!userId && sanitized.phone) {
        let user = await storage.getUserByPhone(sanitized.phone);
        if (!user) {
          accountCreated = true;
          const tempPassword = sanitized.phone.slice(-6);
          generatedPassword = tempPassword;
          const passwordHash = await hashPassword5(tempPassword);
          try {
            user = await storage.createUser({
              name: sanitized.customerName,
              phone: sanitized.phone,
              email: sanitized.email || null,
              address: sanitized.address || null,
              passwordHash,
              referralCode: null,
              walletBalance: 0,
              // Save geocoded coordinates for reuse in future orders
              latitude: customerLatitude,
              longitude: customerLongitude
            });
            console.log(`\u2705 New account created with phone: ${sanitized.phone}, Email: ${sanitized.email || "Not provided"}`);
            if (referralCodeInput && user.id) {
              try {
                await storage.applyReferralBonus(referralCodeInput.trim().toUpperCase(), user.id);
                console.log(`\u2705 Referral code ${referralCodeInput} applied to new user ${user.id}`);
                const transactions = await storage.getWalletTransactions(user.id, 1);
                const referralTransaction = transactions.find((t) => t.type === "referral_bonus");
                if (referralTransaction) {
                  appliedReferralBonus = referralTransaction.amount;
                }
              } catch (referralError) {
                console.warn(`\u26A0\uFE0F Failed to apply referral code: ${referralError.message}`);
              }
            }
            if (SEND_SUBSCRIPTION_EMAILS && sanitized.email && generatedPassword) {
              const emailHtml = createWelcomeEmail(sanitized.customerName, sanitized.phone, generatedPassword);
              sendEmail({
                to: sanitized.email,
                subject: "\u{1F37D}\uFE0F Welcome to RotiHai - Your Account Details",
                html: emailHtml
              }).then(() => {
                console.log(`\u2705 Welcome email sent to ${sanitized.email}`);
                emailSent = true;
              }).catch((err) => {
                console.error(`\u26A0\uFE0F Failed to send welcome email to ${sanitized.email}:`, err);
              });
            } else if (sanitized.email && generatedPassword) {
              console.log(`\u{1F4E7} Subscription email disabled for performance. Email sending skipped for ${sanitized.email}`);
            }
          } catch (createUserError) {
            console.error("Error creating user:", createUserError);
            throw createUserError;
          }
        } else {
          console.log(`\u2705 Existing account found with phone: ${sanitized.phone}`);
          await storage.updateUserLastLogin(user.id);
          if (user.latitude !== customerLatitude || user.longitude !== customerLongitude) {
            try {
              await storage.updateUser(user.id, {
                latitude: customerLatitude,
                longitude: customerLongitude
              });
              console.log(`\u{1F4CD} Updated user coordinates: ${customerLatitude}, ${customerLongitude}`);
            } catch (updateErr) {
              console.warn(`\u26A0\uFE0F Failed to update user coordinates:`, updateErr);
            }
          }
        }
        if (user) {
          userId = user.id;
        } else {
          throw new Error("Failed to create or find user account");
        }
      }
      const orderPayload = {
        ...result.data,
        paymentStatus: "pending",
        userId
      };
      console.log("\u{1F4E6} Creating order with userId:", userId, "accountCreated:", accountCreated);
      if (!orderPayload.chefId && orderPayload.items.length > 0) {
        const firstProduct = await storage.getProductById(orderPayload.items[0].id);
        orderPayload.chefId = firstProduct?.chefId ?? void 0;
      }
      if (!orderPayload.chefId) {
        return res.status(400).json({ message: "Unable to determine chefId for the order" });
      }
      const chefFromDb = await storage.getChefById(orderPayload.chefId);
      if (chefFromDb) {
        orderPayload.chefName = chefFromDb.name;
      }
      orderPayload.items = await Promise.all(
        orderPayload.items.map(async (item) => {
          const product = await storage.getProductById(item.id);
          return {
            ...item,
            hotelPrice: product?.hotelPrice || 0
            // Add partner's cost price to order item
          };
        })
      );
      if (orderPayload.deliverySlotId) {
        try {
          const slot = await storage.getDeliveryTimeSlot(orderPayload.deliverySlotId);
          if (slot) {
            const cutoffInfo = computeSlotCutoffInfo(slot);
            const deliveryDate = cutoffInfo.nextAvailableDate;
            const year = deliveryDate.getFullYear();
            const month = String(deliveryDate.getMonth() + 1).padStart(2, "0");
            const day = String(deliveryDate.getDate()).padStart(2, "0");
            orderPayload.deliveryDate = `${year}-${month}-${day}`;
            console.log(`\u{1F4C5} Set deliveryDate to: ${orderPayload.deliveryDate}`);
          }
        } catch (error) {
          console.warn("Error calculating deliveryDate:", error);
        }
      }
      console.log("\u{1F4DD} Order payload before DB insert:", JSON.stringify(orderPayload, null, 2));
      const order = await storage.createOrder(orderPayload);
      console.log("\u2705 Order created successfully:", order.id);
      console.log(`\u{1F4CB} Order Details: userId=${userId}, walletAmountUsed=${order.walletAmountUsed}`);
      let accessToken;
      if (accountCreated && userId) {
        const user = await storage.getUser(userId);
        if (user) {
          accessToken = generateAccessToken3(user);
        }
      }
      res.status(201).json({
        ...order,
        accountCreated,
        defaultPassword: accountCreated ? generatedPassword : void 0,
        emailSent: accountCreated ? emailSent : void 0,
        accessToken: accountCreated ? accessToken : void 0,
        appliedReferralBonus: appliedReferralBonus > 0 ? appliedReferralBonus : void 0
      });
      (async () => {
        try {
          if (orderPayload.couponCode && userId) {
            await storage.recordCouponUsage(orderPayload.couponCode, userId, order.id);
          } else if (orderPayload.couponCode) {
            await storage.incrementCouponUsage(orderPayload.couponCode);
          }
        } catch (err) {
          console.error("\u26A0\uFE0F Error recording coupon usage:", err);
        }
      })();
      (async () => {
        try {
          if (userId) {
            const { db: database } = await Promise.resolve().then(() => (init_db(), db_exports));
            const { referrals: referralsTable } = await Promise.resolve().then(() => (init_db(), db_exports));
            const { eq: eq7, and: and3 } = await import("drizzle-orm");
            const pendingReferral = await database.query.referrals.findFirst({
              where: (r, { eq: eq8, and: and4 }) => and4(
                eq8(r.referredId, userId),
                eq8(r.status, "pending")
              )
            });
            if (pendingReferral) {
              await database.transaction(async (tx) => {
                const referredUser = await tx.query.users.findFirst({
                  where: (u, { eq: eq8 }) => eq8(u.id, userId)
                });
                await tx.update(referralsTable).set({
                  status: "completed",
                  referredOrderCompleted: true,
                  completedAt: /* @__PURE__ */ new Date()
                }).where(eq7(referralsTable.id, pendingReferral.id));
                await storage.createWalletTransaction({
                  userId: pendingReferral.referrerId,
                  amount: pendingReferral.referrerBonus,
                  type: "referral_bonus",
                  description: `Referral bonus: ${referredUser?.name || "User"} completed their first order using your code`,
                  referenceId: pendingReferral.id,
                  referenceType: "referral"
                }, tx);
              });
            }
          }
        } catch (err) {
          console.error("\u26A0\uFE0F Error processing referral bonus:", err);
        }
      })();
      (async () => {
        try {
          broadcastNewOrder(order);
          const adminPhone = process.env.ADMIN_PHONE_NUMBER;
          await sendOrderPlacedAdminNotification(
            order.id,
            order.customerName,
            order.total,
            adminPhone
          );
        } catch (err) {
          console.error("\u26A0\uFE0F Error in background notification tasks:", err);
        }
      })();
    } catch (error) {
      console.error("\u274C Create order error:", error);
      res.status(500).json({ message: error.message || "Failed to create order" });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      console.log("GET /api/orders - Auth header:", req.headers.authorization ? "Present" : "Missing");
      console.log("GET /api/orders - Query params:", req.query);
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        const allOrders = await storage.getAllOrders();
        const userOrders = allOrders.filter(
          (order) => order.email === user.email || order.phone === user.email
        );
        res.json(userOrders);
      } else if (req.headers.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.substring(7);
        const { verifyToken: verifyToken6 } = await Promise.resolve().then(() => (init_userAuth(), userAuth_exports));
        const payload = verifyToken6(token);
        if (payload) {
          console.log("GET /api/orders - Valid token for user:", payload.userId);
          const orders3 = await storage.getOrdersByUserId(payload.userId);
          res.json(orders3);
        } else {
          console.log("GET /api/orders - Invalid token");
          res.status(401).json({ message: "Invalid token" });
        }
      } else if (req.query.phone) {
        const allOrders = await storage.getAllOrders();
        const userOrders = allOrders.filter((order) => order.phone === req.query.phone);
        res.json(userOrders);
      } else {
        console.log("GET /api/orders - No valid authentication method found");
        res.status(401).json({ message: "Authentication required or provide phone number" });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/orders/:id/payment-confirmed", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      let accessToken;
      let refreshToken;
      let userCreated = false;
      if (!order.userId) {
        console.log(`\u{1F4DD} Payment confirmed for new user order ${id} - Creating user account`);
        let user = await storage.getUserByPhone(order.phone);
        if (!user) {
          const generatedPassword = order.phone.slice(-6);
          const passwordHash = await hashPassword5(generatedPassword);
          user = await storage.createUser({
            name: order.customerName,
            phone: order.phone,
            email: order.email || null,
            address: order.address || null,
            passwordHash,
            referralCode: null,
            walletBalance: 0,
            latitude: null,
            longitude: null
          });
          console.log(`\u2705 New user created on payment confirmation: ${user.id} - Phone: ${order.phone}`);
          userCreated = true;
          if (SEND_SUBSCRIPTION_EMAILS && order.email) {
            const emailHtml = createWelcomeEmail(order.customerName, order.phone, generatedPassword);
            const emailSent = await sendEmail({
              to: order.email,
              subject: "\u{1F37D}\uFE0F Welcome to RotiHai - Your Account Details",
              html: emailHtml
            });
            if (emailSent) {
              console.log(`\u2705 Welcome email sent to ${order.email}`);
            }
          } else if (order.email) {
            console.log(`\u{1F4E7} Subscription email disabled for performance. Email sending skipped for ${order.email}`);
          }
          await db.update(orders2).set({ userId: user.id }).where(eq6(orders2.id, id));
          order.userId = user.id;
          accessToken = generateAccessToken3(user);
          refreshToken = generateRefreshToken4(user);
        } else {
          console.log(`\u{1F464} User already exists with phone ${order.phone}, linking to order`);
          await db.update(orders2).set({ userId: user.id }).where(eq6(orders2.id, id));
          order.userId = user.id;
          accessToken = generateAccessToken3(user);
          refreshToken = generateRefreshToken4(user);
        }
      }
      const orderBefore = await storage.getOrderById(id);
      const isIdempotentCall = orderBefore?.paymentStatus === "paid";
      if (isIdempotentCall) {
        console.log(`\u23ED\uFE0F Order ${id} already marked as paid. Skipping payment processing...`);
        res.json({
          message: "Payment already confirmed for this order",
          order: orderBefore
        });
        return;
      }
      const updatedOrder = await storage.updateOrderPaymentStatus(id, "paid");
      console.log(`\u2705 Payment confirmed for order ${id} - Status: ${updatedOrder?.paymentStatus}`);
      if (updatedOrder && updatedOrder.walletAmountUsed && updatedOrder.walletAmountUsed > 0 && updatedOrder.userId) {
        console.log(`
\u{1F4B3} [=${"=".repeat(50)}] WALLET DEDUCTION TRACE [${"=".repeat(50)}]`);
        console.log(`\u{1F4B3} [WALLET] Processing wallet deduction for order ${id}...`);
        console.log(`\u{1F4B3} [WALLET] Order walletAmountUsed value: \u20B9${updatedOrder.walletAmountUsed}`);
        console.log(`\u{1F4B3} [WALLET] Order walletAmountUsed type: ${typeof updatedOrder.walletAmountUsed}`);
        const userBefore = await storage.getUser(updatedOrder.userId);
        const balanceBefore = userBefore?.walletBalance || 0;
        console.log(`\u{1F4B3} [WALLET] User ID: ${updatedOrder.userId}`);
        console.log(`\u{1F4B3} [WALLET] STEP 1 - Query user balance BEFORE deduction:`);
        console.log(`\u{1F4B3} [WALLET]   \u2192 Returned walletBalance: ${userBefore?.walletBalance}`);
        console.log(`\u{1F4B3} [WALLET]   \u2192 Actual balanceBefore used: \u20B9${balanceBefore}`);
        const existingTransactions = await storage.getWalletTransactions(updatedOrder.userId, 100);
        const deductionTransactions = existingTransactions.filter(
          (txn) => txn.referenceId === id && txn.type === "debit"
        );
        if (deductionTransactions.length > 0) {
          console.log(`\u23ED\uFE0F [WALLET] Found ${deductionTransactions.length} existing debit transaction(s) for order ${id}. Skipping...`);
          const existingAmount = deductionTransactions.reduce((sum, txn) => sum + txn.amount, 0);
          console.log(`   Already deducted: \u20B9${existingAmount}`);
        } else {
          console.log(`\u{1F4B3} [WALLET] No existing transaction found. Proceeding with deduction...`);
          try {
            await storage.createWalletTransaction({
              userId: updatedOrder.userId,
              amount: updatedOrder.walletAmountUsed,
              type: "debit",
              description: `Wallet payment for order #${updatedOrder.id}`,
              referenceId: updatedOrder.id,
              referenceType: "order"
            });
            console.log(`\u2705 [WALLET] Balance updated and transaction logged`);
            const updatedUser = await storage.getUser(updatedOrder.userId);
            const newWalletBalance = updatedUser?.walletBalance || 0;
            console.log(`   User wallet balance AFTER: \u20B9${newWalletBalance}`);
            console.log(`   Calculation: \u20B9${balanceBefore} - \u20B9${updatedOrder.walletAmountUsed} = \u20B9${newWalletBalance}`);
            broadcastWalletUpdate(updatedOrder.userId, newWalletBalance);
            console.log(`\u2705 [WALLET] Broadcast sent to user ${updatedOrder.userId}`);
            console.log(`\u2705 [WALLET] COMPLETE: \u20B9${updatedOrder.walletAmountUsed} deducted from wallet for order #${updatedOrder.id}`);
            console.log(`\u{1F4B3} [${"=".repeat(100)}]
`);
          } catch (walletError) {
            console.error("\u274C [WALLET] ERROR during deduction:", walletError.message);
            console.error(walletError.stack);
          }
        }
      } else {
        console.log(`\u23ED\uFE0F [WALLET] Skipped deduction: walletAmountUsed=${updatedOrder?.walletAmountUsed}, userId=${updatedOrder?.userId}`);
      }
      const response = {
        message: "Payment confirmation received",
        order: updatedOrder
      };
      if (userCreated) {
        response.userCreated = true;
        response.accessToken = accessToken;
        response.refreshToken = refreshToken;
      }
      if (updatedOrder) {
        console.log(`
\u{1F4E3} Broadcasting payment confirmation for order ${updatedOrder.id}`);
        broadcastOrderUpdate(updatedOrder);
      }
      res.json(response);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: error.message || "Failed to confirm payment" });
    }
  });
  app2.get("/api/chefs", async (_req, res) => {
    try {
      const chefs3 = await storage.getChefs();
      res.json(chefs3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chefs" });
    }
  });
  app2.get("/api/chefs/by-area/:areaName", async (req, res) => {
    try {
      const { areaName } = req.params;
      if (!areaName || areaName.trim().length === 0) {
        return res.status(400).json({ message: "Area name is required" });
      }
      const allChefs = await storage.getChefs();
      console.log(`
\u{1F50D} [DEBUG] /api/chefs/by-area called:`);
      console.log(`   Requested area: "${areaName}"`);
      console.log(`   All chefs in database:`);
      allChefs.forEach((c) => {
        console.log(`     - ${c.name}: addressArea="${c.addressArea || c.address_area || "null"}"`);
      });
      const filteredChefs = allChefs.filter((chef) => {
        const chefArea = chef.addressArea || chef.address_area;
        if (!chefArea) return true;
        return chefArea.toLowerCase().trim() === areaName.toLowerCase().trim();
      });
      console.log(`   Filtered result: ${filteredChefs.length} chef(s) found`);
      filteredChefs.forEach((c) => {
        const area = c.addressArea || c.address_area || "No restriction";
        console.log(`     \u2705 ${c.name} (${area})`);
      });
      console.log("");
      res.json(filteredChefs);
    } catch (error) {
      console.error("\u274C Error fetching chefs by area:", error);
      res.status(500).json({ message: "Failed to fetch chefs for delivery area" });
    }
  });
  app2.get("/api/chefs/by-location", async (req, res) => {
    try {
      const { latitude, longitude, maxDistance } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Missing latitude or longitude" });
      }
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const maxDistanceKm = maxDistance ? parseFloat(maxDistance) : 15;
      if (isNaN(userLat) || isNaN(userLon) || isNaN(maxDistanceKm)) {
        return res.status(400).json({ error: "Invalid coordinates or distance" });
      }
      const allChefs = await storage.getChefs();
      console.log(`
\u{1F5FA}\uFE0F [DEBUG] /api/chefs/by-location called:`);
      console.log(`   User location: (${userLat}, ${userLon})`);
      console.log(`   Max search radius: ${maxDistanceKm}km`);
      const chefsWithDistance = allChefs.map((chef) => {
        const R = 6371;
        const lat1 = userLat * (Math.PI / 180);
        const lat2 = (chef.latitude || 19.0728) * (Math.PI / 180);
        const deltaLat = ((chef.latitude || 19.0728) - userLat) * (Math.PI / 180);
        const deltaLon = ((chef.longitude || 72.8826) - userLon) * (Math.PI / 180);
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return {
          ...chef,
          distanceFromUser: parseFloat(distance.toFixed(2))
        };
      });
      const maxDeliveryDistance = (chef) => {
        const chefMaxDistance = chef.maxDeliveryDistanceKm || 5;
        return (chef.distanceFromUser || 0) <= chefMaxDistance;
      };
      const nearbyChefs = chefsWithDistance.filter((chef) => chef.isActive !== false && maxDeliveryDistance(chef)).sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
      console.log(`   Found ${nearbyChefs.length} nearby chef(s):`);
      nearbyChefs.forEach((c) => {
        console.log(`     \u2705 ${c.name} - ${c.distanceFromUser}km away (max: ${c.maxDeliveryDistanceKm || 5}km)`);
      });
      console.log("");
      res.json(nearbyChefs);
    } catch (error) {
      console.error("\u274C Error fetching chefs by location:", error);
      res.status(500).json({ message: "Failed to fetch nearby chefs" });
    }
  });
  app2.get("/api/chefs/by-pincode/:pincode", async (req, res) => {
    try {
      const { pincode } = req.params;
      if (!pincode || !/^\d{5,6}$/.test(pincode)) {
        return res.status(400).json({ error: "Invalid pincode format. Must be 5-6 digits." });
      }
      const allChefs = await storage.getChefs();
      console.log(`
\u{1F4CD} [DEBUG] /api/chefs/by-pincode called with pincode: ${pincode}`);
      const chefsServingPincode = allChefs.filter((chef) => {
        if (!chef.isActive) return false;
        const servicePincodes = chef.servicePincodes || [];
        const servesThisPincode = servicePincodes.includes(pincode);
        if (servesThisPincode) {
          console.log(`   \u2705 ${chef.name} serves pincode ${pincode}`);
        }
        return servesThisPincode;
      });
      console.log(`   Found ${chefsServingPincode.length} chef(s) serving pincode ${pincode}`);
      console.log("");
      res.json(chefsServingPincode);
    } catch (error) {
      console.error("\u274C Error fetching chefs by pincode:", error);
      res.status(500).json({ message: "Failed to fetch chefs for pincode" });
    }
  });
  app2.get("/api/areas/by-coordinates", async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Missing latitude or longitude" });
      }
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const allChefs = await storage.getChefs();
      const areaMap = /* @__PURE__ */ new Map();
      allChefs.forEach((chef) => {
        const area = chef.addressArea || chef.address_area;
        if (area) {
          const existing = areaMap.get(area) || { count: 0, totalLat: 0, totalLon: 0 };
          existing.count++;
          existing.totalLat += chef.latitude || 19.0728;
          existing.totalLon += chef.longitude || 72.8826;
          areaMap.set(area, existing);
        }
      });
      const areas = [];
      areaMap.forEach((data, area) => {
        areas.push({
          name: area,
          centerLat: data.totalLat / data.count,
          centerLon: data.totalLon / data.count
        });
      });
      let closestArea = null;
      let closestDistance = Infinity;
      areas.forEach((area) => {
        const dLat = (area.centerLat - lat) * Math.PI / 180;
        const dLon = (area.centerLon - lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(area.centerLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c;
        if (distance < closestDistance) {
          closestDistance = distance;
          closestArea = area;
        }
      });
      if (!closestArea) {
        return res.json({ area: null, distance: null, confidence: "none" });
      }
      const confidence = closestDistance < 5 ? "high" : "low";
      const areaName = closestArea.name;
      console.log(`\u{1F4CD} [AREA DETECTION] Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)}) \u2192 Area: ${areaName} (${closestDistance.toFixed(2)}km, ${confidence})`);
      res.json({
        area: areaName,
        distance: closestDistance,
        confidence
      });
    } catch (error) {
      console.error("\u274C Error detecting area from coordinates:", error);
      res.status(500).json({ error: "Failed to detect area" });
    }
  });
  app2.get("/api/areas", async (req, res) => {
    try {
      const allChefs = await storage.getChefs();
      const areas = /* @__PURE__ */ new Set();
      allChefs.forEach((chef) => {
        const area = chef.addressArea || chef.address_area;
        if (area && area.trim()) {
          areas.add(area.trim());
        }
      });
      const areaList = Array.from(areas).sort();
      console.log(`\u{1F4CD} [AREAS LIST] Returning ${areaList.length} areas: ${areaList.join(", ")}`);
      res.json(areaList.map((name) => ({
        name,
        latitude: 19.0728,
        // Default to Kurla West as reference
        longitude: 72.8826
      })));
    } catch (error) {
      console.error("\u274C Error fetching areas:", error);
      res.status(500).json({ error: "Failed to fetch areas" });
    }
  });
  app2.get("/api/chefs/:chefId", async (req, res) => {
    try {
      const { chefId } = req.params;
      if (!chefId || chefId.startsWith("cat-")) {
        const chefs3 = await storage.getChefsByCategory(chefId);
        return res.json(chefs3);
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        return res.status(404).json({ message: "Chef not found" });
      }
      res.json(chef);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chef" });
    }
  });
  app2.post("/api/calculate-delivery", async (req, res) => {
    try {
      const { latitude, longitude, chefId, subtotal = 0 } = req.body;
      if (!latitude || !longitude) {
        res.status(400).json({ message: "Latitude and longitude are required" });
        return;
      }
      let chefLat = 19.0728;
      let chefLon = 72.8826;
      if (chefId) {
        const chef = await storage.getChefById(chefId);
        if (chef && chef.latitude !== null && chef.longitude !== null && chef.latitude !== void 0 && chef.longitude !== void 0) {
          chefLat = chef.latitude;
          chefLon = chef.longitude;
        }
      }
      const { calculateDistance: calculateDistance2, calculateDelivery: calculateDelivery2 } = await Promise.resolve().then(() => (init_deliveryUtils(), deliveryUtils_exports));
      const distance = calculateDistance2(latitude, longitude, chefLat, chefLon);
      const deliverySettingsRaw = await storage.getDeliverySettings();
      const deliverySettings3 = deliverySettingsRaw.map((setting) => ({
        ...setting,
        minOrderAmount: setting.minOrderAmount ?? void 0
      }));
      const deliveryCalc = calculateDelivery2(distance, subtotal, deliverySettings3);
      res.json({
        distance,
        deliveryFee: deliveryCalc.deliveryFee,
        deliveryRangeName: deliveryCalc.deliveryRangeName,
        freeDeliveryEligible: deliveryCalc.freeDeliveryEligible,
        amountForFreeDelivery: deliveryCalc.amountForFreeDelivery,
        estimatedTime: Math.ceil(distance * 2 + 15)
      });
    } catch (error) {
      console.error("Error calculating delivery:", error);
      res.status(500).json({ message: "Failed to calculate delivery" });
    }
  });
  app2.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });
  app2.get("/api/promotional-banners", async (_req, res) => {
    try {
      const banners = await storage.getActivePromotionalBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching promotional banners:", error);
      res.status(500).json({ message: "Failed to fetch promotional banners" });
    }
  });
  app2.post("/api/subscriptions/public", async (req, res) => {
    try {
      const {
        customerName,
        phone,
        email,
        address,
        latitude,
        longitude,
        planId,
        deliveryTime = DEFAULT_DELIVERY_TIME,
        deliverySlotId,
        durationDays = 30
      } = req.body;
      if (!customerName || !phone) {
        res.status(400).json({ message: "Customer name and phone are required" });
        return;
      }
      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }
      const sanitizedPhone = phone.trim().replace(/\s+/g, "");
      if (!/^\d{10}$/.test(sanitizedPhone)) {
        res.status(400).json({ message: "Valid 10-digit phone number is required" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      const existingGuestUser = await storage.getUserByPhone(sanitizedPhone);
      if (existingGuestUser) {
        const allGuestSubs = await storage.getSubscriptions();
        const guestSubscriptions = allGuestSubs.filter((s) => s.userId === existingGuestUser.id);
        const hasDuplicateSubscription = guestSubscriptions?.some(
          (sub) => sub.planId === planId && sub.status !== SUBSCRIPTION_STATUS.EXPIRED && sub.status !== SUBSCRIPTION_STATUS.CANCELLED
        );
        if (hasDuplicateSubscription) {
          res.status(409).json({
            message: "You already have an active subscription to this plan",
            code: "DUPLICATE_SUBSCRIPTION",
            existingSubscriptionId: guestSubscriptions?.find((s) => s.planId === planId)?.id
          });
          return;
        }
      }
      let calculatedDurationDays = durationDays;
      if (durationDays === 30) {
        if (plan.frequency === "weekly") {
          calculatedDurationDays = 7;
        } else if (plan.frequency === "monthly") {
          calculatedDurationDays = 30;
        } else if (plan.frequency === "daily") {
          calculatedDurationDays = 1;
        }
      }
      const category = await storage.getCategoryById(plan.categoryId);
      const isRotiCategory = category?.name?.toLowerCase() === "roti" || category?.name?.toLowerCase().includes("roti");
      if (isRotiCategory && !deliverySlotId) {
        res.status(400).json({
          message: "Delivery time slot is required for Roti category subscriptions",
          requiresDeliverySlot: true,
          categoryName: category?.name
        });
        return;
      }
      if (isRotiCategory && deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        if (!slot) {
          res.status(400).json({ message: "Selected delivery slot not found" });
          return;
        }
        const cutoffInfo = computeSlotCutoffInfo(slot);
        if (cutoffInfo.isPastCutoff) {
          res.status(400).json({
            message: "Selected delivery slot missed the ordering cutoff for the upcoming delivery. Please schedule the subscription to start from the next available date.",
            requiresReschedule: true,
            nextAvailableDate: cutoffInfo.nextAvailableDate.toISOString(),
            cutoffHoursBefore: cutoffInfo.cutoffHoursBefore
          });
          return;
        }
      }
      let user = await storage.getUserByPhone(sanitizedPhone);
      let isNewUser = false;
      let generatedPassword;
      let emailSent = false;
      if (!user) {
        isNewUser = true;
        const newPassword = sanitizedPhone.slice(-6);
        generatedPassword = newPassword;
        const passwordHash = await hashPassword5(newPassword);
        try {
          user = await storage.createUser({
            name: customerName.trim(),
            phone: sanitizedPhone,
            email: email ? email.trim().toLowerCase() : null,
            address: address ? address.trim() : null,
            passwordHash,
            referralCode: null,
            walletBalance: 0,
            latitude: latitude || null,
            longitude: longitude || null
          });
          console.log(`\u2705 New account created during subscription with phone: ${sanitizedPhone}, Email: ${email || "Not provided"}`);
          if (SEND_SUBSCRIPTION_EMAILS && email) {
            const emailHtml = createWelcomeEmail(customerName, sanitizedPhone, newPassword);
            emailSent = await sendEmail({
              to: email,
              subject: "\u{1F37D}\uFE0F Welcome to RotiHai - Your Account Details",
              html: emailHtml
            });
            if (emailSent) {
              console.log(`\u2705 Welcome email sent to ${email}`);
            }
          } else if (email) {
            console.log(`\u{1F4E7} Subscription email disabled for performance. Email sending skipped for ${email}`);
          }
        } catch (createUserError) {
          console.error("Error creating user during subscription:", createUserError);
          throw createUserError;
        }
      } else {
        console.log(`\u2705 Existing account found with phone: ${sanitizedPhone}`);
        await storage.updateUserLastLogin(user.id);
      }
      const accessToken = generateAccessToken3(user);
      const refreshToken = generateRefreshToken4(user);
      const now = /* @__PURE__ */ new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = deliveryTime;
      if (deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        if (slot) {
          const cutoffInfo = computeSlotCutoffInfo(slot, true);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime;
          console.log(`\u{1F4C5} Subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          nextDelivery.setDate(nextDelivery.getDate() + 1);
        }
      } else {
        nextDelivery.setDate(nextDelivery.getDate() + 1);
      }
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + calculatedDurationDays);
      const deliveryDays = plan.deliveryDays;
      const totalDeliveries = calculateTotalDeliveries(plan.frequency, deliveryDays, calculatedDurationDays, now);
      const subscriptionData = {
        userId: user.id,
        planId,
        chefId: null,
        chefAssignedAt: null,
        deliverySlotId: deliverySlotId || null,
        customerName: user.name || customerName.trim(),
        phone: user.phone || sanitizedPhone,
        email: user.email || (email ? email.trim().toLowerCase() : null),
        // ✅ FIX: Handle both address objects and strings
        address: user.address || (address ? typeof address === "object" ? JSON.stringify(address) : address.trim() : null),
        status: SUBSCRIPTION_STATUS.PENDING,
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null
      };
      const subscription = await storage.createSubscription(subscriptionData);
      console.log(`\u2705 Public subscription created: ${subscription.id} for user ${user.id}`);
      await generateSubscriptionDeliveryLogs(subscription, plan, nextDelivery, endDate, finalDeliveryTime);
      const publicSubLogs = await storage.getSubscriptionDeliveryLogs(subscription.id);
      if (publicSubLogs && publicSubLogs.length > 0) {
        const firstLog = publicSubLogs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0];
        const firstLogDate = new Date(firstLog.date);
        firstLogDate.setHours(0, 0, 0, 0);
        const currentNextDeliveryDate = new Date(subscription.nextDeliveryDate);
        currentNextDeliveryDate.setHours(0, 0, 0, 0);
        if (firstLogDate.getTime() !== currentNextDeliveryDate.getTime()) {
          await storage.updateSubscription(subscription.id, { nextDeliveryDate: firstLog.date });
          console.log(`\u2705 Corrected public subscription nextDeliveryDate to match first log`);
        }
      }
      if (subscriptionData.address) {
        try {
          await storage.updateUser(user.id, {
            address: subscriptionData.address
          });
          console.log(`[PUBLIC-SUB] \u2705 Updated user profile with subscription address`);
        } catch (updateError) {
          console.warn(`[PUBLIC-SUB] \u26A0\uFE0F Failed to update user address in profile:`, updateError.message);
        }
      }
      broadcastNewSubscriptionToAdmin(subscription, plan.name);
      res.status(201).json({
        subscription: {
          ...subscription,
          frequency: plan.frequency
          // ✅ Include frequency for frontend use
        },
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address
        },
        accessToken,
        refreshToken,
        isNewUser,
        defaultPassword: isNewUser ? generatedPassword : void 0,
        emailSent: isNewUser ? emailSent : void 0
      });
    } catch (error) {
      console.error("Error creating public subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });
  app2.get("/api/users/exists", async (req, res) => {
    try {
      const phone = (req.query.phone || "").trim().replace(/\s+/g, "");
      if (!phone || !/^\d{10}$/.test(phone)) {
        res.status(400).json({ message: "Valid 10-digit phone query param is required" });
        return;
      }
      const user = await storage.getUserByPhone(phone);
      res.json({ exists: !!user });
    } catch (error) {
      console.error("Error checking user existence:", error);
      res.status(500).json({ message: error.message || "Failed to check user" });
    }
  });
  const toISOStringOrNull = (date, fieldName = "unknown") => {
    try {
      console.log(`[ISO-CONVERT] Converting ${fieldName}: type=${typeof date}`);
      if (!date) {
        console.log(`[ISO-CONVERT] ${fieldName} is null/empty, returning null`);
        return null;
      }
      if (date instanceof Date) {
        const timeValue = date.getTime();
        console.log(`[ISO-CONVERT] ${fieldName} - getTime(): ${timeValue}, isNaN: ${isNaN(timeValue)}`);
        if (isNaN(timeValue)) {
          console.warn(`[ISO-CONVERT] ${fieldName} - INVALID DATE OBJECT (getTime returned NaN), returning null`);
          return null;
        }
        const isoStr = date.toISOString();
        console.log(`[ISO-CONVERT] ${fieldName} - toISOString succeeded: ${isoStr}`);
        const parsedDate = new Date(isoStr);
        const year = parsedDate.getFullYear();
        console.log(`[ISO-CONVERT] ${fieldName} - Parsed year: ${year}`);
        if (year < 1980 || year > 2100) {
          if (year === 1970) {
            console.error(`[ISO-CONVERT] ${fieldName} - EPOCH DATE DETECTED (1970)! This indicates a database issue. Returning null to prevent frontend errors.`);
            console.error(`  Time value: ${timeValue}, ISO: ${isoStr}`);
          } else {
            console.warn(`[ISO-CONVERT] ${fieldName} - INVALID YEAR: ${year}, returning null`);
          }
          return null;
        }
        return isoStr;
      }
      if (typeof date === "string") {
        console.log(`[ISO-CONVERT] ${fieldName} is string: "${date}"`);
        const parsed = new Date(date);
        const time = parsed.getTime();
        console.log(`[ISO-CONVERT] ${fieldName} - Parsed string, getTime(): ${time}, year: ${parsed.getFullYear()}`);
        if (isNaN(time)) {
          console.warn(`[ISO-CONVERT] ${fieldName} - Invalid date string, returning null`);
          return null;
        }
        const year = parsed.getFullYear();
        if (year < 1980 || year > 2100) {
          console.warn(`[ISO-CONVERT] ${fieldName} - Invalid year: ${year}, returning null`);
          return null;
        }
        return date;
      }
      console.log(`[ISO-CONVERT] ${fieldName} - Unhandled type, returning null`);
      return null;
    } catch (e) {
      console.error(`[ISO-CONVERT] Error converting ${fieldName}: type=${typeof date}, error:`, e);
      return null;
    }
  };
  app2.get("/api/subscriptions", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const allSubscriptions = await storage.getSubscriptions();
      const userSubscriptions = allSubscriptions.filter((s) => s.userId === userId);
      const serialized = userSubscriptions.map((s) => {
        try {
          console.log(`
[SERIALIZE-SUB] ===== Starting serialization for ${s.id} =====`);
          const result = {
            ...s,
            startDate: toISOStringOrNull(s.startDate, `${s.id}.startDate`),
            endDate: toISOStringOrNull(s.endDate, `${s.id}.endDate`),
            nextDeliveryDate: toISOStringOrNull(s.nextDeliveryDate, `${s.id}.nextDeliveryDate`),
            lastDeliveryDate: toISOStringOrNull(s.lastDeliveryDate, `${s.id}.lastDeliveryDate`),
            chefAssignedAt: toISOStringOrNull(s.chefAssignedAt, `${s.id}.chefAssignedAt`),
            pauseStartDate: toISOStringOrNull(s.pauseStartDate, `${s.id}.pauseStartDate`),
            pauseResumeDate: toISOStringOrNull(s.pauseResumeDate, `${s.id}.pauseResumeDate`),
            createdAt: toISOStringOrNull(s.createdAt, `${s.id}.createdAt`),
            updatedAt: toISOStringOrNull(s.updatedAt, `${s.id}.updatedAt`)
          };
          console.log(`[SERIALIZE-SUB] Completed serialization for ${s.id}`);
          console.log(`[SERIALIZE-SUB] Final nextDeliveryDate for ${s.id}: ${result.nextDeliveryDate}`);
          return result;
        } catch (e) {
          console.error(`[SERIALIZE-SUB] Error serializing subscription ${s.id}:`, e);
          console.error("Subscription data:", {
            id: s.id,
            startDate: s.startDate,
            endDate: s.endDate,
            nextDeliveryDate: s.nextDeliveryDate,
            lastDeliveryDate: s.lastDeliveryDate,
            chefAssignedAt: s.chefAssignedAt,
            pauseStartDate: s.pauseStartDate,
            pauseResumeDate: s.pauseResumeDate,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
          });
          throw e;
        }
      });
      console.log(`[SUBSCRIPTIONS] Returning ${serialized.length} subscriptions for user ${userId}`);
      serialized.forEach((sub) => {
        if (sub.nextDeliveryDate === null) {
          console.log(`[SUB-GET] ${sub.id}: nextDeliveryDate is NULL after serialization`);
        } else {
          const date = new Date(sub.nextDeliveryDate);
          const year = date.getFullYear();
          if (year === 1970) {
            console.warn(`[SUB-GET] ${sub.id}: nextDeliveryDate is 1970! Raw value: ${sub.nextDeliveryDate}`);
          } else {
            console.log(`[SUB-GET] ${sub.id}: nextDeliveryDate = ${sub.nextDeliveryDate}, year = ${year}`);
          }
        }
      });
      res.json(serialized);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  app2.post("/api/subscriptions", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const {
        planId,
        deliveryTime = DEFAULT_DELIVERY_TIME,
        deliverySlotId,
        durationDays = 30,
        address,
        latitude,
        longitude
      } = req.body;
      if (!planId) {
        res.status(400).json({ message: "Plan ID is required" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      const allSubscriptions = await storage.getSubscriptions();
      const userSubs = allSubscriptions.filter((s) => s.userId === userId);
      const hasDuplicateSubscription = userSubs?.some(
        (sub) => sub.planId === planId && sub.status !== SUBSCRIPTION_STATUS.EXPIRED && sub.status !== SUBSCRIPTION_STATUS.CANCELLED
      );
      if (hasDuplicateSubscription) {
        res.status(409).json({
          message: "You already have an active subscription to this plan",
          code: "DUPLICATE_SUBSCRIPTION",
          existingSubscriptionId: userSubs?.find((s) => s.planId === planId)?.id
        });
        return;
      }
      let calculatedDurationDays = durationDays;
      if (durationDays === 30) {
        if (plan.frequency === "weekly") {
          calculatedDurationDays = 7;
        } else if (plan.frequency === "monthly") {
          calculatedDurationDays = 30;
        } else if (plan.frequency === "daily") {
          calculatedDurationDays = 1;
        }
      }
      const category = await storage.getCategoryById(plan.categoryId);
      const isRotiCategory = category?.name?.toLowerCase() === "roti" || category?.name?.toLowerCase().includes("roti");
      if (isRotiCategory && !deliverySlotId) {
        res.status(400).json({
          message: "Delivery time slot is required for Roti category subscriptions",
          requiresDeliverySlot: true,
          categoryName: category?.name
        });
        return;
      }
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const now = /* @__PURE__ */ new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = deliveryTime;
      console.log(`
[SUB-CREATE] ===== STARTING SUBSCRIPTION CREATION =====`);
      console.log(`[SUB-CREATE] planId: ${planId}, deliverySlotId: ${deliverySlotId}, deliveryTime: ${deliveryTime}`);
      console.log(`[SUB-CREATE] [1] Initial values - now: ${now.toISOString()}, nextDelivery: ${nextDelivery.toISOString()}`);
      if (deliverySlotId) {
        console.log(`[SUB-CREATE] [2] Slot ID provided: ${deliverySlotId}`);
        const slot = await storage.getDeliveryTimeSlot(deliverySlotId);
        console.log(`[SUB-CREATE] [3] Slot lookup result: ${slot ? "FOUND" : "NOT FOUND"}`);
        if (slot) {
          console.log(`[SUB-CREATE] [4] Slot details - id: ${slot.id}, startTime: ${slot.startTime}`);
          const cutoffInfo = computeSlotCutoffInfo(slot, true);
          console.log(`[SUB-CREATE] [5] Cutoff info computed - nextAvailableDate: ${cutoffInfo.nextAvailableDate.toISOString()}`);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime;
          console.log(`[SUB-CREATE] [6] Setting nextDelivery from slot - ${nextDelivery.toISOString()}, finalDeliveryTime: ${finalDeliveryTime}`);
          console.log(`\u{1F4C5} Subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          console.log(`[SUB-CREATE] [4B] Slot not found, using fallback - adding 1 day`);
          nextDelivery.setDate(nextDelivery.getDate() + 1);
          console.log(`[SUB-CREATE] [5B] After fallback - nextDelivery: ${nextDelivery.toISOString()}`);
        }
      } else {
        console.log(`[SUB-CREATE] [2B] No slot ID, calculating next delivery based on plan frequency/days`);
        const deliveryDays2 = plan.deliveryDays;
        nextDelivery = getNextActualDeliveryDate(now, plan.frequency, deliveryDays2);
        console.log(`[SUB-CREATE] [3B] After plan-based calculation - nextDelivery: ${nextDelivery.toISOString()}`);
      }
      console.log(`[SUB-CREATE] [7] Final nextDelivery before validation: ${nextDelivery.toISOString()}, year: ${nextDelivery.getFullYear()}, time: ${nextDelivery.getTime()}`);
      const endDate = new Date(nextDelivery);
      endDate.setDate(endDate.getDate() + calculatedDurationDays - 1);
      const deliveryDays = plan.deliveryDays;
      const totalDeliveries = calculateTotalDeliveries(plan.frequency, deliveryDays, calculatedDurationDays, nextDelivery);
      if (!nextDelivery || isNaN(nextDelivery.getTime())) {
        console.error(`[SUB-CREATE] ERROR: Invalid nextDelivery date!`, { nextDelivery, isoString: nextDelivery?.toISOString?.() });
        res.status(400).json({ message: "Invalid delivery date calculation. Please contact support." });
        return;
      }
      const nextDeliveryYear = nextDelivery.getFullYear();
      if (nextDeliveryYear < 1980 || nextDeliveryYear > 2100) {
        console.error(`[SUB-CREATE] ERROR: Invalid year in nextDelivery!`, { nextDelivery: nextDelivery.toISOString(), year: nextDeliveryYear });
        res.status(400).json({ message: "Delivery date is outside valid range. Please try again." });
        return;
      }
      const subscriptionData = {
        // Use a different variable name to avoid conflict
        userId,
        planId,
        chefId: null,
        chefAssignedAt: null,
        deliverySlotId: deliverySlotId || null,
        customerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        // ✅ FIX: Handle both address objects and strings
        // If address is an object (from SubscriptionAddress), serialize to JSON
        // If it's already a string, use as-is
        address: address ? typeof address === "object" ? JSON.stringify(address) : address.trim() : user.address || "",
        status: SUBSCRIPTION_STATUS.PENDING,
        // Start as pending until payment is confirmed
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null
      };
      console.log(`[SUB-CREATE] About to save subscription with nextDeliveryDate:`, {
        value: subscriptionData.nextDeliveryDate,
        valueString: String(subscriptionData.nextDeliveryDate),
        isoString: subscriptionData.nextDeliveryDate?.toISOString?.(),
        year: subscriptionData.nextDeliveryDate?.getFullYear?.(),
        time: subscriptionData.nextDeliveryDate?.getTime?.(),
        isDate: subscriptionData.nextDeliveryDate instanceof Date
      });
      const subscription = await storage.createSubscription(subscriptionData);
      console.log(`[SUB-CREATE] ===== AFTER STORAGE.CREATE =====`);
      console.log(`[SUB-CREATE] Returned subscription nextDeliveryDate:`, {
        value: subscription.nextDeliveryDate,
        type: typeof subscription.nextDeliveryDate,
        valueString: String(subscription.nextDeliveryDate),
        isDate: subscription.nextDeliveryDate instanceof Date
      });
      if (subscription.nextDeliveryDate instanceof Date) {
        const time = subscription.nextDeliveryDate.getTime();
        const year = subscription.nextDeliveryDate.getFullYear();
        console.log(`[SUB-CREATE] As Date object: getTime()=${time}, getFullYear()=${year}, isNaN=${isNaN(time)}`);
        if (!isNaN(time)) {
          console.log(`[SUB-CREATE] toISOString(): ${subscription.nextDeliveryDate.toISOString()}`);
        } else {
          console.log(`[SUB-CREATE] WARNING: getTime() is NaN - INVALID DATE!`);
        }
      } else if (typeof subscription.nextDeliveryDate === "string") {
        console.log(`[SUB-CREATE] Is string: "${subscription.nextDeliveryDate}"`);
        const parsed = new Date(subscription.nextDeliveryDate);
        console.log(`[SUB-CREATE] Parsed as Date: getTime()=${parsed.getTime()}, getFullYear()=${parsed.getFullYear()}`);
      } else {
        console.log(`[SUB-CREATE] Unknown type: ${typeof subscription.nextDeliveryDate}`);
      }
      console.log(`\u2705 Subscription created: ${subscription.id}`);
      await generateSubscriptionDeliveryLogs(subscription, plan, nextDelivery, endDate, finalDeliveryTime);
      const allLogs = await storage.getSubscriptionDeliveryLogs(subscription.id);
      if (allLogs && allLogs.length > 0) {
        const firstLog = allLogs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0];
        const firstLogDate = new Date(firstLog.date);
        firstLogDate.setHours(0, 0, 0, 0);
        const currentNextDeliveryDate = new Date(subscription.nextDeliveryDate);
        currentNextDeliveryDate.setHours(0, 0, 0, 0);
        if (firstLogDate.getTime() !== currentNextDeliveryDate.getTime()) {
          await storage.updateSubscription(subscription.id, { nextDeliveryDate: firstLog.date });
          console.log(`\u2705 Corrected nextDeliveryDate to match first log`);
        }
      }
      if (subscriptionData.address) {
        try {
          await storage.updateUser(userId, {
            address: subscriptionData.address
          });
          console.log(`[SUB-CREATE] \u2705 Updated user profile with subscription address`);
        } catch (updateError) {
          console.warn(`[SUB-CREATE] \u26A0\uFE0F Failed to update user address in profile:`, updateError.message);
        }
      }
      broadcastNewSubscriptionToAdmin(subscription, plan.name);
      res.status(201).json({
        ...subscription,
        frequency: plan.frequency
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });
  app2.post("/api/subscriptions/:id/pause", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      let { pauseStartDate, pauseResumeDate } = req.body;
      if (pauseStartDate) {
        pauseStartDate = new Date(pauseStartDate);
        pauseStartDate.setHours(0, 0, 0, 0);
      } else {
        pauseStartDate = /* @__PURE__ */ new Date();
        pauseStartDate.setHours(0, 0, 0, 0);
      }
      if (pauseResumeDate) {
        pauseResumeDate = new Date(pauseResumeDate);
        pauseResumeDate.setHours(0, 0, 0, 0);
      }
      const pauseDurationDays = pauseResumeDate ? Math.floor((pauseResumeDate.getTime() - pauseStartDate.getTime()) / (1e3 * 60 * 60 * 24)) : 0;
      if (pauseResumeDate) {
        const allLogs = await storage.getSubscriptionDeliveryLogs(req.params.id);
        for (const log3 of allLogs) {
          const logDate = new Date(log3.date);
          logDate.setHours(0, 0, 0, 0);
          if (logDate >= pauseStartDate && logDate < pauseResumeDate) {
            await storage.updateSubscriptionDeliveryLog(log3.id, {
              status: DELIVERY_LOG_STATUS.SKIPPED,
              notes: "Delivery skipped due to subscription pause period",
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      const currentEndDate = subscription.endDate ? new Date(subscription.endDate) : /* @__PURE__ */ new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + pauseDurationDays);
      const updateData = {
        status: SUBSCRIPTION_STATUS.PAUSED,
        pauseStartDate,
        pauseResumeDate: pauseResumeDate || null,
        endDate: newEndDate
        // ✅ Extend endDate by pause duration
      };
      const updated = await storage.updateSubscription(req.params.id, updateData);
      if (pauseDurationDays > 0 && pauseResumeDate) {
        const plan = await storage.getSubscriptionPlan(subscription.planId);
        if (plan) {
          const deliveryDaysArray = plan.deliveryDays;
          let logDate = new Date(currentEndDate);
          logDate.setDate(logDate.getDate() + 1);
          while (logDate <= newEndDate) {
            const dayName = logDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
            const isValidDeliveryDay = plan.frequency === "monthly" ? deliveryDaysArray.includes(logDate.getDate().toString()) : deliveryDaysArray.includes(dayName);
            if (isValidDeliveryDay) {
              const existingLog = await storage.getDeliveryLogBySubscriptionAndDate(subscription.id, logDate);
              if (!existingLog) {
                await storage.createSubscriptionDeliveryLog({
                  subscriptionId: subscription.id,
                  date: new Date(logDate),
                  time: subscription.nextDeliveryTime || DEFAULT_DELIVERY_TIME,
                  status: DELIVERY_LOG_STATUS.SCHEDULED,
                  deliveryPersonId: null,
                  notes: "Created to extend subscription after pause period"
                });
              }
            }
            logDate.setDate(logDate.getDate() + 1);
          }
        }
      }
      const originalEndDateStr = subscription.endDate instanceof Date ? subscription.endDate.toDateString() : subscription.endDate ? new Date(subscription.endDate).toDateString() : "N/A";
      console.log(`\u23F8\uFE0F Subscription ${req.params.id} paused`);
      console.log(`   Pause period: ${pauseStartDate.toDateString()} to ${pauseResumeDate?.toDateString() || "indefinite"}`);
      console.log(`   Pause duration: ${pauseDurationDays} days`);
      console.log(`   End date extended from ${originalEndDateStr} to ${newEndDate.toDateString()}`);
      console.log(`   Skipped deliveries between pause dates`);
      res.json(updated);
    } catch (error) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({ message: error.message || "Failed to pause subscription" });
    }
  });
  app2.post("/api/subscriptions/:id/resume", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, {
        status: "active",
        pauseStartDate: null,
        pauseResumeDate: null
      });
      console.log(`\u25B6\uFE0F Subscription ${req.params.id} resumed`);
      res.json(updated);
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ message: error.message || "Failed to resume subscription" });
    }
  });
  app2.patch("/api/subscriptions/:id/delivery-time", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const { deliveryTime } = req.body;
      if (!deliveryTime) {
        res.status(400).json({ message: "Delivery time is required" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, {
        nextDeliveryTime: deliveryTime
      });
      console.log(`\u{1F550} Subscription ${req.params.id} delivery time updated to ${deliveryTime}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating delivery time:", error);
      res.status(500).json({ message: error.message || "Failed to update delivery time" });
    }
  });
  app2.get("/api/subscriptions/:id/delivery-logs", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const logs = await storage.getSubscriptionDeliveryLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching delivery logs:", error);
      res.status(500).json({ message: error.message || "Failed to fetch delivery logs" });
    }
  });
  app2.post("/api/subscriptions/:id/payment-confirmed", async (req, res) => {
    try {
      const { paymentTransactionId } = req.body;
      if (!paymentTransactionId || paymentTransactionId.trim() === "") {
        res.status(400).json({ message: "Payment transaction ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      let userId;
      if (req.headers.authorization?.startsWith("Bearer ")) {
        const token = req.headers.authorization.substring(7);
        const payload = verifyToken5(token);
        if (payload?.userId) {
          userId = payload.userId;
          if (subscription.userId !== userId) {
            res.status(403).json({ message: "Unauthorized - This subscription belongs to another user" });
            return;
          }
        }
      }
      if (subscription.isPaid) {
        res.status(400).json({ message: "Subscription already paid" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, {
        paymentTransactionId: paymentTransactionId.trim()
      });
      console.log(`\u{1F4B3} Subscription ${req.params.id} payment confirmed - TxnID: ${paymentTransactionId.trim()}`);
      const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
      if (updated) {
        broadcastSubscriptionUpdate3(updated);
        if (SEND_SUBSCRIPTION_EMAILS) {
          try {
            const customerEmail = updated.email || null;
            if (customerEmail) {
              const emailHtml = `
                <html>
                  <body style="font-family: Arial; max-width:600px; margin:auto;">
                    <h2>Payment received \u2014 awaiting verification</h2>
                    <p>Hi ${updated.customerName || ""},</p>
                    <p>We received your payment submission for subscription <b>${updated.id}</b>.</p>
                    <p>Transaction ID: <b>${paymentTransactionId.trim()}</b></p>
                    <p>Our admin team will verify the payment shortly and activate your subscription.</p>
                    <p>Thank you for subscribing with RotiHai.</p>
                  </body>
                </html>
              `;
              const emailSent = await sendEmail({
                to: customerEmail,
                subject: `Payment received for your subscription ${updated.id}`,
                html: emailHtml
              });
              console.log(`\u{1F4E7} Payment submission email ${emailSent ? "sent" : "skipped"} to customer: ${customerEmail}`);
            }
          } catch (e) {
            console.error("Error sending payment email to customer:", e);
          }
        } else {
          console.log(`\u{1F4E7} Subscription email disabled for performance. Payment email skipped`);
        }
        console.log(`\u{1F4E3} Payment verification notification queued for admin for subscription ${req.params.id}`);
      }
      res.json({
        message: "Payment confirmation submitted. Admin will verify shortly.",
        subscription: updated
      });
    } catch (error) {
      console.error("Error confirming subscription payment:", error);
      res.status(500).json({
        message: error.message || "Failed to confirm payment"
      });
    }
  });
  app2.post("/api/subscriptions/:id/renew", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const oldSubscription = await storage.getSubscription(req.params.id);
      if (!oldSubscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (oldSubscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(oldSubscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const now = /* @__PURE__ */ new Date();
      let nextDelivery = new Date(now);
      let finalDeliveryTime = oldSubscription.nextDeliveryTime || DEFAULT_DELIVERY_TIME;
      if (oldSubscription.deliverySlotId) {
        const slot = await storage.getDeliveryTimeSlot(oldSubscription.deliverySlotId);
        if (slot) {
          const cutoffInfo = computeSlotCutoffInfo(slot);
          nextDelivery = new Date(cutoffInfo.nextAvailableDate);
          finalDeliveryTime = slot.startTime;
          console.log(`\u{1F4C5} Renewed subscription next delivery date set from slot: ${nextDelivery.toISOString()}, time: ${finalDeliveryTime}`);
        } else {
          nextDelivery.setDate(nextDelivery.getDate() + 1);
        }
      } else {
        nextDelivery.setDate(nextDelivery.getDate() + 1);
      }
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      let renewalDurationDays = 30;
      if (plan.frequency === "weekly") {
        renewalDurationDays = 7;
      } else if (plan.frequency === "daily") {
        renewalDurationDays = 1;
      }
      const deliveryDays = plan.deliveryDays;
      const totalDeliveries = calculateTotalDeliveries(plan.frequency, deliveryDays, 30, now);
      const newSubscription = await storage.createSubscription({
        userId,
        planId: oldSubscription.planId,
        chefId: oldSubscription.chefId || null,
        chefAssignedAt: null,
        deliverySlotId: oldSubscription.deliverySlotId || null,
        customerName: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        status: SUBSCRIPTION_STATUS.PENDING,
        startDate: now,
        endDate,
        nextDeliveryDate: nextDelivery,
        nextDeliveryTime: finalDeliveryTime,
        customItems: null,
        remainingDeliveries: totalDeliveries,
        totalDeliveries,
        isPaid: false,
        paymentTransactionId: null,
        originalPrice: plan.price,
        discountAmount: 0,
        walletAmountUsed: 0,
        couponCode: null,
        couponDiscount: 0,
        finalAmount: plan.price,
        paymentNotes: null,
        lastDeliveryDate: null,
        deliveryHistory: [],
        pauseStartDate: null,
        pauseResumeDate: null
      });
      console.log(`\u{1F504} Subscription renewed for user ${userId} - New subscription ID: ${newSubscription.id}`);
      await generateSubscriptionDeliveryLogs(newSubscription, plan, nextDelivery, endDate, finalDeliveryTime);
      const renewalLogs = await storage.getSubscriptionDeliveryLogs(newSubscription.id);
      if (renewalLogs && renewalLogs.length > 0) {
        const firstLog = renewalLogs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0];
        const firstLogDate = new Date(firstLog.date);
        firstLogDate.setHours(0, 0, 0, 0);
        const currentNextDeliveryDate = new Date(newSubscription.nextDeliveryDate);
        currentNextDeliveryDate.setHours(0, 0, 0, 0);
        if (firstLogDate.getTime() !== currentNextDeliveryDate.getTime()) {
          await storage.updateSubscription(newSubscription.id, { nextDeliveryDate: firstLog.date });
          console.log(`\u2705 Corrected renewed subscription nextDeliveryDate to match first log`);
        }
      }
      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error renewing subscription:", error);
      res.status(500).json({ message: error.message || "Failed to renew subscription" });
    }
  });
  app2.patch("/api/subscriptions/:subscriptionId/delivery-time", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const { subscriptionId } = req.params;
      const { deliveryTime } = req.body;
      if (!deliveryTime || typeof deliveryTime !== "string") {
        res.status(400).json({ message: "Valid delivery time is required" });
        return;
      }
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(deliveryTime)) {
        res.status(400).json({ message: "Invalid time format. Use HH:mm" });
        return;
      }
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const updated = await storage.updateSubscription(subscriptionId, {
        nextDeliveryTime: deliveryTime
      });
      console.log(`\u23F0 Updated subscription ${subscriptionId} delivery time to: ${deliveryTime}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating delivery time:", error);
      res.status(500).json({ message: error.message || "Failed to update delivery time" });
    }
  });
  app2.get("/api/subscriptions/:id/schedule", requireUser(), async (req, res) => {
    try {
      const userId = req.authenticatedUser.userId;
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      if (subscription.userId !== userId) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        res.status(404).json({ message: "Subscription plan not found" });
        return;
      }
      const logs = await storage.getSubscriptionDeliveryLogs(req.params.id);
      const sortedLogs = logs.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
        const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
        return dateA - dateB;
      });
      const scheduleItems = sortedLogs.map((log3) => {
        const logDate = log3.date instanceof Date ? log3.date : new Date(log3.date);
        return {
          date: logDate.toISOString(),
          time: log3.time,
          items: plan.items,
          status: log3.status
          // Preserve actual status (scheduled, delivered, skipped, etc.)
        };
      });
      const subscriptionFormatted = {
        ...subscription,
        startDate: subscription.startDate instanceof Date ? subscription.startDate.toISOString() : subscription.startDate,
        endDate: subscription.endDate instanceof Date ? subscription.endDate.toISOString() : subscription.endDate,
        nextDeliveryDate: subscription.nextDeliveryDate instanceof Date ? subscription.nextDeliveryDate.toISOString() : subscription.nextDeliveryDate
      };
      res.json({
        subscription: subscriptionFormatted,
        plan,
        schedule: scheduleItems,
        remainingDeliveries: subscription.remainingDeliveries,
        totalDeliveries: subscription.totalDeliveries,
        deliveryHistory: sortedLogs.map((log3) => ({
          ...log3,
          date: log3.date instanceof Date ? log3.date.toISOString() : log3.date
        }))
      });
    } catch (error) {
      console.error("Error fetching subscription schedule:", error);
      res.status(500).json({ message: error.message || "Failed to fetch schedule" });
    }
  });
  app2.get("/api/delivery-settings", async (req, res) => {
    try {
      const settings = await storage.getDeliverySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching delivery settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch delivery settings" });
    }
  });
  app2.get("/api/cart-settings", async (req, res) => {
    try {
      const settings = await storage.getCartSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching cart settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cart settings" });
    }
  });
  app2.get("/api/cart-settings/category/:categoryId", async (req, res) => {
    try {
      const setting = await storage.getCartSettingByCategoryId(req.params.categoryId);
      if (!setting) {
        res.status(404).json({ message: "Cart setting not found for this category" });
        return;
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching cart setting:", error);
      res.status(500).json({ message: error.message || "Failed to fetch cart setting" });
    }
  });
  app2.get("/api/roti-settings", async (req, res) => {
    try {
      let settings = await storage.getRotiSettings();
      if (!settings) {
        settings = {
          id: "",
          morningBlockStartTime: "08:00",
          morningBlockEndTime: "11:00",
          lastOrderTime: "23:00",
          blockMessage: "Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery.",
          prepareWindowHours: 2,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      const now = /* @__PURE__ */ new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinutes;
      const [startHour, startMin] = settings.morningBlockStartTime.split(":").map(Number);
      const [endHour, endMin] = settings.morningBlockEndTime.split(":").map(Number);
      const [lastHour, lastMin] = settings.lastOrderTime.split(":").map(Number);
      const blockStartMinutes = startHour * 60 + startMin;
      const blockEndMinutes = endHour * 60 + endMin;
      const lastOrderMinutes = lastHour * 60 + lastMin;
      const isInBlockedPeriod = currentTimeMinutes >= blockStartMinutes && currentTimeMinutes < blockEndMinutes;
      const isPastLastOrderTime = currentTimeMinutes >= lastOrderMinutes;
      res.json({
        ...settings,
        isInBlockedPeriod,
        isPastLastOrderTime,
        currentTime: `${String(currentHour).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`
      });
    } catch (error) {
      console.error("Error fetching roti settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch roti settings" });
    }
  });
  app2.get("/api/wallet-settings", async (req, res) => {
    try {
      const walletSetting = await db.query.walletSettings.findFirst({
        where: (ws, { eq: eq7 }) => eq7(ws.isActive, true)
      });
      const defaultWallet = {
        maxUsagePerOrder: 10,
        minOrderAmount: 0,
        referrerBonus: 100,
        referredBonus: 50
      };
      const response = walletSetting || defaultWallet;
      console.log("[WALLET] Public endpoint returning:", response);
      res.json(response);
    } catch (error) {
      console.error("Error fetching wallet settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch wallet settings" });
    }
  });
  app2.put("/api/admin/roti-settings", requireAdmin(), async (req, res) => {
    try {
      const { morningBlockStartTime, morningBlockEndTime, lastOrderTime, blockMessage, prepareWindowHours, isActive } = req.body;
      const timeRegex = /^\d{2}:\d{2}$/;
      if (morningBlockStartTime && !timeRegex.test(morningBlockStartTime)) {
        res.status(400).json({ message: "Invalid morningBlockStartTime format. Use HH:mm" });
        return;
      }
      if (morningBlockEndTime && !timeRegex.test(morningBlockEndTime)) {
        res.status(400).json({ message: "Invalid morningBlockEndTime format. Use HH:mm" });
        return;
      }
      if (lastOrderTime && !timeRegex.test(lastOrderTime)) {
        res.status(400).json({ message: "Invalid lastOrderTime format. Use HH:mm" });
        return;
      }
      if (prepareWindowHours !== void 0 && (typeof prepareWindowHours !== "number" || prepareWindowHours < 1 || prepareWindowHours > 24)) {
        res.status(400).json({ message: "Prepare window hours must be between 1 and 24" });
        return;
      }
      const settings = await storage.updateRotiSettings({
        morningBlockStartTime,
        morningBlockEndTime,
        lastOrderTime,
        blockMessage,
        prepareWindowHours,
        isActive
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating roti settings:", error);
      res.status(500).json({ message: error.message || "Failed to update roti settings" });
    }
  });
  app2.patch("/api/admin/subscriptions/:id/assign-chef", requireAdmin(), async (req, res) => {
    try {
      const { chefId } = req.body;
      if (!chefId) {
        res.status(400).json({ message: "Chef ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      const updated = await storage.updateSubscription(req.params.id, { chefId, chefAssignedAt: /* @__PURE__ */ new Date() });
      console.log(`\u{1F468}\u200D\u{1F373} Subscription ${req.params.id} assigned to chef ${chefId}`);
      if (!updated) {
        res.status(500).json({ message: "Failed to update subscription" });
        return;
      }
      const plan = await storage.getSubscriptionPlan(updated.planId);
      const { broadcastSubscriptionUpdate: broadcastSubscriptionUpdate3, broadcastSubscriptionAssignmentToPartner: broadcastSubscriptionAssignmentToPartner3 } = await Promise.resolve().then(() => (init_websocket(), websocket_exports));
      broadcastSubscriptionUpdate3(updated);
      await broadcastSubscriptionAssignmentToPartner3(updated, chef.name, plan?.name);
      res.json(updated);
    } catch (error) {
      console.error("Error assigning chef to subscription:", error);
      res.status(500).json({ message: error.message || "Failed to assign chef" });
    }
  });
  app2.get("/api/admin/subscriptions/reassignment-pending", requireAdmin(), async (req, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const allOrders = await storage.getAllOrders();
      const now = /* @__PURE__ */ new Date();
      const reassignmentThresholdDays = 2;
      const pendingReassignments = allSubscriptions.filter((sub) => {
        if (!sub.chefId || !sub.chefAssignedAt) return false;
        if (sub.status !== SUBSCRIPTION_STATUS.ACTIVE || !sub.isPaid) return false;
        const daysSinceAssignment = Math.floor((now.getTime() - new Date(sub.chefAssignedAt).getTime()) / (1e3 * 60 * 60 * 24));
        const daysSinceLastDelivery = sub.lastDeliveryDate ? Math.floor((now.getTime() - new Date(sub.lastDeliveryDate).getTime()) / (1e3 * 60 * 60 * 24)) : daysSinceAssignment;
        return daysSinceAssignment >= reassignmentThresholdDays && daysSinceLastDelivery >= reassignmentThresholdDays;
      });
      const enrichedReassignments = await Promise.all(pendingReassignments.map(async (sub) => {
        const chef = sub.chefId ? await storage.getChefById(sub.chefId) : null;
        const plan = await storage.getSubscriptionPlan(sub.planId);
        const subscriptionOrders = allOrders.filter(
          (o) => o.deliverySlotId === sub.deliverySlotId && o.status !== "completed" && o.status !== "cancelled"
        );
        const overdueOrders = subscriptionOrders.filter((o) => {
          if (!o.deliveryTime || !o.deliveryDate) return false;
          const orderTime = /* @__PURE__ */ new Date(`${o.deliveryDate}T${o.deliveryTime}`);
          return orderTime < now;
        });
        return {
          ...sub,
          currentChefName: chef?.name,
          planName: plan?.name,
          overdueOrderCount: overdueOrders.length,
          overdueOrders: overdueOrders.map((o) => ({
            id: o.id,
            status: o.status,
            scheduledFor: o.deliveryDate,
            time: o.deliveryTime
          }))
        };
      }));
      console.log(`\u26A0\uFE0F Found ${enrichedReassignments.length} subscriptions pending reassignment`);
      if (enrichedReassignments.length > 0) {
        console.log(`\u{1F4CB} Details:`, enrichedReassignments.map((r) => ({
          subscriptionId: r.id,
          chef: r.currentChefName,
          overdueOrders: r.overdueOrderCount
        })));
      }
      res.json(enrichedReassignments);
    } catch (error) {
      console.error("Error fetching pending reassignments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pending reassignments" });
    }
  });
  app2.patch("/api/admin/subscriptions/:id/reassign-chef", requireAdmin(), async (req, res) => {
    try {
      const { newChefId } = req.body;
      if (!newChefId) {
        res.status(400).json({ message: "New chef ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const newChef = await storage.getChefById(newChefId);
      if (!newChef) {
        res.status(404).json({ message: "Chef not found" });
        return;
      }
      const oldChefId = subscription.chefId;
      const updated = await storage.updateSubscription(req.params.id, { chefId: newChefId, chefAssignedAt: /* @__PURE__ */ new Date() });
      console.log(`\u{1F504} Subscription ${req.params.id} reassigned from chef ${oldChefId} to ${newChefId}`);
      res.json({
        message: "Subscription reassigned successfully",
        subscription: updated,
        previousChefId: oldChefId,
        newChefId
      });
    } catch (error) {
      console.error("Error reassigning subscription:", error);
      res.status(500).json({ message: error.message || "Failed to reassign subscription" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/reschedule-order", requireAdmin(), async (req, res) => {
    try {
      const { orderId, reason } = req.body;
      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        res.status(404).json({ message: "Subscription not found" });
        return;
      }
      const order = await storage.getOrderById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (!subscription.deliverySlotId) {
        res.status(400).json({ message: "Subscription has no delivery slot" });
        return;
      }
      const slot = await storage.getDeliveryTimeSlot(subscription.deliverySlotId);
      if (!slot) {
        res.status(400).json({ message: "Delivery slot not found for subscription" });
        return;
      }
      const cutoffInfo = computeSlotCutoffInfo(slot);
      const nextDeliveryDate = new Date(cutoffInfo.nextAvailableDate);
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
      console.log(`\u{1F4C5} Rescheduling subscription ${req.params.id}, order ${orderId} to ${nextDeliveryDate.toISOString()}`);
      console.log(`   Reason: ${reason || "Chef did not complete delivery"}`);
      const updatedSubscription = await storage.updateSubscription(req.params.id, {
        nextDeliveryDate,
        chefId: null,
        chefAssignedAt: null
      });
      await storage.updateOrderStatus(orderId, "rescheduled");
      const newOrderData = {
        userId: order.userId,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email || "",
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        status: "pending",
        deliveryDate: nextDeliveryDate.toISOString().split("T")[0],
        deliveryTime: slot.startTime,
        deliverySlotId: subscription.deliverySlotId,
        categoryId: order.categoryId,
        categoryName: order.categoryName,
        chefId: order.chefId,
        chefName: order.chefName,
        paymentStatus: order.paymentStatus
      };
      const newOrder = await storage.createOrder(newOrderData);
      console.log(`\u2705 New order created: ${newOrder.id} for reschedule`);
      console.log(`\u{1F4EC} Notifying user ${order.userId} about rescheduled delivery on ${nextDeliveryDate.toDateString()}`);
      res.json({
        message: "Order rescheduled successfully",
        updatedSubscription,
        rescheduledOrder: order,
        newOrder,
        newDeliveryDate: nextDeliveryDate,
        reason: reason || "Chef did not complete delivery"
      });
    } catch (error) {
      console.error("Error rescheduling order:", error);
      res.status(500).json({ message: error.message || "Failed to reschedule order" });
    }
  });
  app2.post("/api/admin/subscriptions/auto-reschedule-overdue", requireAdmin(), async (req, res) => {
    try {
      const allSubscriptions = await storage.getSubscriptions();
      const allOrders = await storage.getAllOrders();
      const now = /* @__PURE__ */ new Date();
      let rescheduledCount = 0;
      const results = [];
      for (const subscription of allSubscriptions) {
        if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE || !subscription.chefId) continue;
        const subscriptionOrders = allOrders.filter(
          (o) => o.deliverySlotId === subscription.deliverySlotId && o.status !== "completed" && o.status !== "cancelled" && o.status !== "rescheduled"
        );
        const overdueOrders = subscriptionOrders.filter((o) => {
          const orderTime = o.deliveryTime && o.deliveryDate ? /* @__PURE__ */ new Date(`${o.deliveryDate}T${o.deliveryTime}`) : o.deliveryDate ? new Date(o.deliveryDate) : null;
          return orderTime && orderTime < now;
        });
        for (const order of overdueOrders) {
          try {
            if (!subscription.deliverySlotId) continue;
            const slot = await storage.getDeliveryTimeSlot(subscription.deliverySlotId);
            if (!slot) continue;
            const cutoffInfo = computeSlotCutoffInfo(slot);
            const nextDeliveryDate = new Date(cutoffInfo.nextAvailableDate);
            nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
            await storage.updateSubscription(subscription.id, {
              nextDeliveryDate,
              chefId: null,
              chefAssignedAt: null
            });
            await storage.updateOrderStatus(order.id, "rescheduled");
            const newOrderData = {
              userId: order.userId,
              customerName: order.customerName,
              phone: order.phone,
              email: order.email || "",
              address: order.address,
              items: order.items,
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              discount: order.discount,
              total: order.total,
              status: "pending",
              deliveryDate: nextDeliveryDate.toISOString().split("T")[0],
              deliveryTime: slot.startTime,
              deliverySlotId: subscription.deliverySlotId,
              categoryId: order.categoryId,
              categoryName: order.categoryName,
              chefId: order.chefId,
              chefName: order.chefName,
              paymentStatus: order.paymentStatus
            };
            const newOrder = await storage.createOrder(newOrderData);
            rescheduledCount++;
            results.push({
              subscriptionId: subscription.id,
              orderId: order.id,
              newOrderId: newOrder.id,
              newDeliveryDate: nextDeliveryDate,
              reason: "Auto-rescheduled: Chef did not complete delivery"
            });
            console.log(`\u2705 Auto-rescheduled subscription ${subscription.id}, order ${order.id} to ${nextDeliveryDate.toDateString()}`);
          } catch (error) {
            console.error(`\u274C Failed to reschedule order ${order.id}:`, error);
            results.push({
              subscriptionId: subscription.id,
              orderId: order.id,
              error: "Failed to reschedule"
            });
          }
        }
      }
      console.log(`\u{1F504} Auto-reschedule complete: ${rescheduledCount} orders rescheduled`);
      res.json({
        message: "Auto-reschedule complete",
        rescheduledCount,
        results
      });
    } catch (error) {
      console.error("Error in auto-reschedule:", error);
      res.status(500).json({ message: error.message || "Failed to auto-reschedule orders" });
    }
  });
  app2.post("/api/geocode", async (req, res) => {
    try {
      const { address, pincode } = req.body;
      console.log(`[GEOCODE-DEBUG] Body:`, JSON.stringify(req.body));
      if (!address && !pincode) {
        return res.status(400).json({
          success: false,
          message: "Either address or pincode must be provided"
        });
      }
      const query = address || pincode;
      console.log(`[GEOCODE] Attempting to geocode: "${query}"`);
      const geocodeQuery = async (searchQuery) => {
        try {
          const response = await axios2.get("https://nominatim.openstreetmap.org/search", {
            params: {
              q: searchQuery,
              format: "json",
              limit: 1,
              addressdetails: 1
            },
            headers: {
              "User-Agent": "Replitrotihai-App"
            },
            timeout: 5e3
          });
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        } catch (error) {
          console.error(`[GEOCODE] Error geocoding "${searchQuery}":`, error instanceof Error ? error.message : error);
          return null;
        }
      };
      let result = await geocodeQuery(query);
      if (!result && address) {
        const withMumbai = address + ", Mumbai";
        console.log(`[GEOCODE] Trying with Mumbai context: "${withMumbai}"`);
        result = await geocodeQuery(withMumbai);
      }
      if (!result && address) {
        console.log(`[GEOCODE] Full address failed, attempting area extraction...`);
        const areaKeywords = [
          "kurla",
          "bandra",
          "andheri",
          "dadar",
          "colaba",
          "mahim",
          "worli",
          "powai",
          "thane",
          "airoli",
          "mulund",
          "borivali",
          "malad",
          "kandivali",
          "goregaon",
          "dombivli",
          "navi",
          "vile parle",
          "santacruz",
          "chembur",
          "vikhroli",
          "ghatkopar",
          "kanjurmarg"
        ];
        const addressLower = address.toLowerCase();
        let lastAreaIndex = -1;
        let lastAreaKeyword = "";
        for (const keyword of areaKeywords) {
          const index2 = addressLower.lastIndexOf(keyword);
          if (index2 > lastAreaIndex) {
            lastAreaIndex = index2;
            lastAreaKeyword = keyword;
          }
        }
        if (lastAreaKeyword) {
          const extractedArea = address.substring(lastAreaIndex).trim();
          const areaQuery = extractedArea + ", Mumbai";
          console.log(`[GEOCODE] Extracted area: "${areaQuery}" from full address`);
          result = await geocodeQuery(areaQuery);
          if (result) {
            console.log(`[GEOCODE] \u2705 Area extraction successful: "${areaQuery}"`);
          }
        }
      }
      if (result) {
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const formattedAddress = result.display_name || query;
        console.log(`\u2705 [GEOCODE] Successfully geocoded: ${query} -> (${latitude}, ${longitude})`);
        if (pincode) {
          const pincodeRegex = /^\d{5,6}$/;
          if (!pincodeRegex.test(pincode)) {
            console.warn(`\u{1F6AB} [PINCODE-VALIDATION] Invalid pincode format:`, pincode);
            return res.status(400).json({
              success: false,
              message: "Pincode must be 5-6 digits",
              invalidPincode: true
            });
          }
          console.log(`[PINCODE-VALIDATION] Validating pincode: ${pincode}`);
          const geocodedPostcode = result.address?.postcode;
          console.log(`[PINCODE-VALIDATION] Geocoded postcode: ${geocodedPostcode}, User pincode: ${pincode}`);
          console.log(`\u2705 [PINCODE-VALIDATION] Pincode format validated: ${pincode}`);
        }
        if (address) {
          const areaKeywords = [
            "kurla",
            "bandra",
            "andheri",
            "dadar",
            "colaba",
            "mahim",
            "worli",
            "powai",
            "thane",
            "airoli",
            "mulund",
            "borivali",
            "malad",
            "kandivali",
            "goregaon",
            "dombivli",
            "navi",
            "vile parle",
            "santacruz",
            "chembur",
            "vikhroli",
            "ghatkopar",
            "kanjurmarg"
          ];
          const addressLower = address.toLowerCase();
          const mentionedAreas = [];
          for (const keyword of areaKeywords) {
            if (addressLower.includes(keyword)) {
              mentionedAreas.push(keyword);
            }
          }
          const areaCoordinates = await getAreaCoordinatesMap();
          if (mentionedAreas.length > 0) {
            const calculateDist = (lat1, lon1, lat2, lon2) => {
              const R = 6371;
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              return R * c;
            };
            const areaDistances = Object.entries(areaCoordinates).map(([key, val]) => ({
              area: key,
              name: val.name,
              distance: calculateDist(latitude, longitude, val.lat, val.lon)
            })).sort((a, b) => a.distance - b.distance);
            let effectiveArea = areaDistances[0];
            const nearbyAreas = areaDistances.filter((a) => a.distance <= 2);
            const matchedNearbyArea = nearbyAreas.find((candidate) => {
              return mentionedAreas.some((mentioned) => {
                if (mentioned === candidate.area) return true;
                if (mentioned === "kurla" && candidate.area.startsWith("kurla")) return true;
                return false;
              });
            });
            if (matchedNearbyArea) {
              console.log(`\u2705 [GEOCODE-VERIFY] Found nearby matching area: ${matchedNearbyArea.name} (${matchedNearbyArea.distance.toFixed(2)}km)`);
              effectiveArea = matchedNearbyArea;
            }
            const exactAreaMatch = mentionedAreas.some((mentioned) => {
              if (mentioned === effectiveArea.area) return true;
              if (mentioned === "kurla" && effectiveArea.area.startsWith("kurla")) return true;
              return false;
            });
            if (!exactAreaMatch) {
              console.warn(`\u{1F6AB} [GEOCODE-VERIFY] Area mismatch - rejecting address!`, {
                requestedArea: mentionedAreas[0],
                detectedArea: effectiveArea.name,
                distance: effectiveArea.distance.toFixed(2),
                note: "User specified different area than geocoded result"
              });
              return res.status(400).json({
                success: false,
                message: `The address you entered is in ${effectiveArea.name}, not ${mentionedAreas[0]}. Please use an address in ${mentionedAreas[0]} or select a different area.`,
                detectedArea: effectiveArea.name,
                requestedArea: mentionedAreas[0],
                areaMismatch: true
              });
            }
            console.log(`\u2705 [GEOCODE-VERIFY] Area verified - matches requested area:`, {
              requested: mentionedAreas[0],
              detected: effectiveArea.name,
              distance: effectiveArea.distance.toFixed(2)
            });
            try {
              const adminAreas = await storage.getDeliveryAreas();
              const adminAreaNames = adminAreas.map((a) => a.toLowerCase());
              const areaInDeliveryList = adminAreaNames.some((adminArea) => {
                return adminArea === effectiveArea.name.toLowerCase() || adminArea.includes(effectiveArea.name.toLowerCase());
              });
              if (!areaInDeliveryList) {
                console.warn(`\u{1F6AB} [GEOCODE-VERIFY] Area not in admin delivery-areas list!`, {
                  detectedArea: effectiveArea.name,
                  adminAreas: adminAreaNames
                });
                return res.status(400).json({
                  success: false,
                  message: `Sorry, we don't deliver to ${effectiveArea.name} yet. We deliver to: ${adminAreaNames.join(", ")}. Please select a different area.`,
                  detectedArea: effectiveArea.name,
                  availableAreas: adminAreaNames,
                  notInDeliveryList: true
                });
              }
              console.log(`\u2705 [GEOCODE-VERIFY] Area is in admin delivery-areas list:`, {
                area: effectiveArea.name,
                adminAreas: adminAreaNames
              });
            } catch (err) {
              console.error("[GEOCODE-VERIFY] Error checking admin areas:", err);
            }
          }
        }
        res.json({
          success: true,
          latitude,
          longitude,
          formattedAddress,
          pincode: pincode || void 0
          // Return pincode if provided
        });
      } else {
        console.warn(`\u274C [GEOCODE] Could not geocode: ${query}`);
        return res.status(404).json({
          success: false,
          message: "Address not found. Try using area name (e.g., 'Kurla West, Mumbai') or click on map to select your location."
        });
      }
    } catch (error) {
      console.error("[GEOCODE] Geocoding error:", error.message);
      if (error.code === "ECONNABORTED") {
        return res.status(504).json({
          success: false,
          message: "Geocoding service timeout. Please try again."
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to geocode address. Please try again."
      });
    }
  });
  app2.post("/api/validate-pincode", async (req, res) => {
    try {
      const { pincode } = req.body;
      if (!pincode || !/^\d{5,6}$/.test(String(pincode).trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid pincode format. Please enter 5-6 digits."
        });
      }
      const pincodeStr = String(pincode).trim();
      console.log(`[PINCODE-VALIDATION] Validating pincode: ${pincodeStr}`);
      const adminAreas = await storage.getAllDeliveryAreas();
      const activeAreas = adminAreas.filter((area) => area.isActive);
      console.log(`[PINCODE-VALIDATION] Checking against ${activeAreas.length} active delivery areas with configured pincodes`);
      const matchingArea = activeAreas.find((area) => {
        if (!area.pincodes || !Array.isArray(area.pincodes)) return false;
        return area.pincodes.some(
          (p) => String(p).trim() === pincodeStr
        );
      });
      if (matchingArea) {
        console.log(`\u2705 [PINCODE-VALIDATION] Pincode ${pincodeStr} found in delivery area: ${matchingArea.name}`);
        const areaCoords = {
          lat: typeof matchingArea.latitude === "number" ? matchingArea.latitude : parseFloat(String(matchingArea.latitude || 19.0728)),
          lon: typeof matchingArea.longitude === "number" ? matchingArea.longitude : parseFloat(String(matchingArea.longitude || 72.8826))
        };
        console.log(`[PINCODE-VALIDATION] Using dynamic coordinates for area "${matchingArea.name}":`, areaCoords);
        return res.json({
          success: true,
          pincode: pincodeStr,
          area: matchingArea.name,
          areaId: matchingArea.id,
          message: `Delivery available in ${matchingArea.name}`,
          // Return actual area center coordinates for accurate distance calculation
          latitude: areaCoords.lat,
          longitude: areaCoords.lon
        });
      }
      console.log(`[PINCODE-VALIDATION] Pincode ${pincodeStr} not found in admin-configured pincodes, falling back to geocoding...`);
      const query = `${pincodeStr}, Mumbai, India`;
      try {
        const response = await axios2.get("https://nominatim.openstreetmap.org/search", {
          params: {
            q: query,
            format: "json",
            limit: 1,
            timeout: 10
          },
          timeout: 1e4
        });
        if (!response.data || response.data.length === 0) {
          console.warn(`[PINCODE-VALIDATION] Pincode not found in admin config or geocoding: ${pincodeStr}`);
          return res.status(404).json({
            success: false,
            message: "Pincode not configured. Please enter a pincode in our delivery areas."
          });
        }
        const result = response.data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const formattedAddress = result.display_name || "";
        console.log(`[PINCODE-VALIDATION] Geocoded pincode ${pincodeStr} to:`, {
          lat: latitude,
          lon: longitude,
          address: formattedAddress
        });
        const addressParts = formattedAddress.split(",").map((p) => p.trim().toLowerCase());
        const mentionedAreas = addressParts.filter(
          (part) => part.length > 0 && part !== "india" && part !== "mumbai" && !part.match(/^\d+$/)
        );
        console.log(`[PINCODE-VALIDATION] Extracted areas from address:`, mentionedAreas);
        const areaCoordinates = await getAreaCoordinatesMap();
        const calculateDist = (lat1, lon1, lat2, lon2) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        const areaDistances = Object.entries(areaCoordinates).map(([key, val]) => ({
          area: key,
          name: val.name,
          distance: calculateDist(latitude, longitude, val.lat, val.lon)
        })).sort((a, b) => a.distance - b.distance);
        const closestArea = areaDistances[0];
        const adminAreaNames = activeAreas.map((area) => area.name.toLowerCase());
        const isInDeliveryZone = adminAreaNames.some(
          (adminArea) => closestArea.area.includes(adminArea) || adminArea.includes(closestArea.area)
        );
        if (!isInDeliveryZone) {
          console.warn(`[PINCODE-VALIDATION] \u274C Pincode ${pincodeStr} is outside delivery zone. Closest area: ${closestArea.name}`);
          return res.status(403).json({
            success: false,
            message: `Sorry, we don't deliver to ${closestArea.name} yet. We currently deliver to: ${adminAreaNames.join(", ") || "Kurla West"}`
          });
        }
        console.log(`[PINCODE-VALIDATION] \u2705 Pincode ${pincodeStr} is in delivery zone (via geocoding): ${closestArea.name}`);
        return res.json({
          success: true,
          pincode: pincodeStr,
          area: closestArea.name,
          latitude,
          longitude,
          formattedAddress,
          source: "geocoding"
        });
      } catch (geocodeError) {
        console.error(`[PINCODE-VALIDATION] Geocoding error:`, geocodeError.message);
        return res.status(500).json({
          success: false,
          message: "Could not validate pincode. Please try again."
        });
      }
    } catch (error) {
      console.error("[PINCODE-VALIDATION] Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Validation failed. Please try again."
      });
    }
  });
  app2.post("/api/geocode-full-address", async (req, res) => {
    try {
      const { building, street, area, pincode } = req.body;
      if (!area || !pincode) {
        return res.status(400).json({
          success: false,
          message: "Area and pincode are required"
        });
      }
      console.log(`[GEOCODE-FULL] Geocoding address:`, { building, street, area, pincode });
      const tryGoogleGeocode = async () => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.log(`[GEOCODE-FULL] Google API key not configured, skipping Google Geocoding`);
          return null;
        }
        try {
          const addressParts = [building, street, area, pincode, "Mumbai", "India"].filter(Boolean);
          const fullAddress = addressParts.join(", ");
          console.log(`[GEOCODE-FULL] 1. Requesting Google API: "${fullAddress}"`);
          const response = await axios2.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
              address: fullAddress,
              key: apiKey
            },
            timeout: 1e4
          });
          if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            const locationType = result.geometry.location_type;
            let accuracy2 = "area";
            if (locationType === "ROOFTOP") {
              accuracy2 = "exact";
            } else if (locationType === "RANGE_INTERPOLATED") {
              accuracy2 = "street";
            } else if (locationType === "GEOMETRIC_CENTER" || locationType === "APPROXIMATE") {
              accuracy2 = "area";
            }
            console.log(`\u2705 [GEOCODE-FULL] Google Response:`, {
              status: "OK",
              formatted_address: result.formatted_address,
              lat: location.lat,
              lng: location.lng,
              type: locationType,
              accuracy_mapped: accuracy2
            });
            return {
              lat: location.lat,
              lon: location.lng,
              accuracy: accuracy2
            };
          } else {
            console.warn(`\u274C [GEOCODE-FULL] Google Failed. Payload:`, response.data);
            return null;
          }
        } catch (error) {
          console.warn(`\u26A0\uFE0F [GEOCODE-FULL] Google Geocoding failed:`, error.message);
          return null;
        }
      };
      const tryGooglePlacesFallback = async () => {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) return null;
        try {
          const addressParts = [building, street, area, pincode, "Mumbai", "India"].filter(Boolean);
          const textQuery = addressParts.join(", ");
          console.log(`[GEOCODE-FULL] 2. Trying Google Places New API Fallback: "${textQuery}"`);
          const response = await axios2.post(
            "https://places.googleapis.com/v1/places:searchText",
            { textQuery },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "places.formattedAddress,places.location"
              },
              timeout: 1e4
            }
          );
          if (response.data.places && response.data.places.length > 0) {
            const place = response.data.places[0];
            const location = place.location;
            console.log(`\u2705 [GEOCODE-FULL] Google Places New API Success:`, {
              formatted: place.formattedAddress,
              lat: location.latitude,
              lng: location.longitude
            });
            return {
              lat: location.latitude,
              lon: location.longitude,
              accuracy: "exact"
            };
          }
          console.warn(`[GEOCODE-FULL] Google Places returned no results`);
          return null;
        } catch (error) {
          console.warn(`[GEOCODE-FULL] Google Places Fallback Failed: ${error?.response?.data?.error?.message || error.message}`);
          return null;
        }
      };
      const tryGeocode = async (query) => {
        try {
          const response = await axios2.get("https://nominatim.openstreetmap.org/search", {
            params: {
              q: query,
              format: "json",
              limit: 1,
              timeout: 10
            },
            headers: {
              "User-Agent": "ReplitRotihai/1.0 (internal-tool)",
              "Accept-Language": "en"
            },
            timeout: 1e4
          });
          if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
              lat: parseFloat(result.lat),
              lon: parseFloat(result.lon)
            };
          }
          return null;
        } catch (error) {
          console.warn(`[GEOCODE-FULL] OSM Failed: ${error.message}`);
          return null;
        }
      };
      let coords = null;
      let accuracy = "pincode";
      let source = "admin_data";
      const googleResult = await tryGoogleGeocode();
      if (googleResult) {
        coords = { lat: googleResult.lat, lon: googleResult.lon };
        accuracy = googleResult.accuracy;
        source = "google";
        console.log(`\u2705 [GEOCODE-FULL] Using Google Geocoding (${accuracy})`);
        if ((accuracy === "area" || accuracy === "street") && building && building.trim().length > 2) {
          console.log(`[GEOCODE-FULL] Geocoding was generic (${accuracy}), trying Places API for better accuracy...`);
          const placesResult = await tryGooglePlacesFallback();
          if (placesResult) {
            console.log(`\u2705 [GEOCODE-FULL] Places API found better match! Upgrading accuracy.`);
            coords = { lat: placesResult.lat, lon: placesResult.lon };
            accuracy = placesResult.accuracy;
            source = "google";
          }
        }
      }
      if (!coords) {
        const placesResult = await tryGooglePlacesFallback();
        if (placesResult) {
          coords = { lat: placesResult.lat, lon: placesResult.lon };
          accuracy = placesResult.accuracy;
          source = "google";
          console.log(`\u2705 [GEOCODE-FULL] Using Google Places Fallback (${accuracy})`);
        }
      }
      if (!coords) {
        console.log(`[GEOCODE-FULL] Google APIs failed, trying OpenStreetMap fallbacks...`);
        source = "openstreetmap";
        if (building && street) {
          const fullQuery = `${building}, ${street}, ${area}, ${pincode}, Mumbai, India`;
          console.log(`[GEOCODE-FULL] Trying full address: "${fullQuery}"`);
          coords = await tryGeocode(fullQuery);
          if (coords) {
            accuracy = "exact";
            console.log(`\u2705 [GEOCODE-FULL] Got exact coordinates from full address`);
          }
        }
        if (!coords && street) {
          const streetQuery = `${street}, ${area}, ${pincode}, Mumbai, India`;
          console.log(`[GEOCODE-FULL] Trying street-level: "${streetQuery}"`);
          coords = await tryGeocode(streetQuery);
          if (coords) {
            accuracy = "street";
            console.log(`\u2705 [GEOCODE-FULL] Got street-level coordinates`);
          }
        }
        if (!coords) {
          const areaQuery = `${area}, ${pincode}, Mumbai, India`;
          console.log(`[GEOCODE-FULL] Trying area-level: "${areaQuery}"`);
          coords = await tryGeocode(areaQuery);
          if (coords) {
            accuracy = "area";
            console.log(`\u2705 [GEOCODE-FULL] Got area-level coordinates`);
          }
        }
        if (!coords) {
          console.log(`[GEOCODE-FULL] All geocoding failed, using pincode area center`);
          const adminAreas = await storage.getAllDeliveryAreas();
          const activeAreas = adminAreas.filter((area2) => area2.isActive);
          const matchingArea = activeAreas.find((a) => {
            if (!a.pincodes || !Array.isArray(a.pincodes)) return false;
            return a.pincodes.some((p) => String(p).trim() === String(pincode).trim());
          });
          if (matchingArea) {
            coords = {
              lat: typeof matchingArea.latitude === "number" ? matchingArea.latitude : parseFloat(String(matchingArea.latitude || 19.0728)),
              lon: typeof matchingArea.longitude === "number" ? matchingArea.longitude : parseFloat(String(matchingArea.longitude || 72.8826))
            };
            accuracy = "pincode";
            console.log(`\u2705 [GEOCODE-FULL] Using pincode area center from admin data`);
          } else {
            return res.status(404).json({
              success: false,
              message: "Could not geocode address. Please verify your address details."
            });
          }
        }
      }
      res.json({
        success: true,
        latitude: coords.lat,
        longitude: coords.lon,
        accuracy,
        source,
        // 'google', 'openstreetmap', or 'admin_data'
        message: accuracy === "exact" ? "Exact location found" : accuracy === "street" ? "Street-level location found" : accuracy === "area" ? "Area-level location found" : "Using pincode area center"
      });
    } catch (error) {
      console.error("[GEOCODE-FULL] Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to geocode address. Please try again."
      });
    }
  });
  app2.post("/api/calculate-delivery-fee", async (req, res) => {
    try {
      const { chefId, customerLatitude, customerLongitude, orderAmount } = req.body;
      if (!chefId) {
        return res.status(400).json({
          success: false,
          message: "chefId is required"
        });
      }
      if (typeof orderAmount !== "number" || orderAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "orderAmount must be a non-negative number"
        });
      }
      const chef = await storage.getChefById(chefId);
      if (!chef) {
        return res.status(404).json({
          success: false,
          message: "Chef not found"
        });
      }
      console.log(`
\u{1F69A} [FEE-CALC] Request for Chef "${chef.name}" (${chefId})`);
      console.log(`   - User Location: ${customerLatitude}, ${customerLongitude}`);
      console.log(`   - Chef Location: ${chef.latitude}, ${chef.longitude}`);
      let distance = null;
      if (customerLatitude && customerLongitude && chef.latitude && chef.longitude) {
        const R = 6371;
        const dLat = (chef.latitude - customerLatitude) * Math.PI / 180;
        const dLng = (chef.longitude - customerLongitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(customerLatitude * Math.PI / 180) * Math.cos(chef.latitude * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = Math.round((R * c + Number.EPSILON) * 100) / 100;
        console.log(`   - Calculated Distance: ${distance} km`);
      } else {
        console.log(`   - Distance not calculated (missing coordinates)`);
      }
      const rawSettings = await storage.getDeliverySettings();
      const deliverySettings3 = rawSettings.map((s) => ({
        ...s,
        minOrderAmount: s.minOrderAmount === null ? void 0 : s.minOrderAmount
      }));
      const { calculateDelivery: calculateDelivery2 } = await Promise.resolve().then(() => (init_deliveryUtils(), deliveryUtils_exports));
      const feeCalcResult = calculateDelivery2(
        distance || 0,
        orderAmount,
        deliverySettings3
      );
      const feeResult = {
        deliveryFee: feeCalcResult.freeDeliveryEligible ? 0 : feeCalcResult.deliveryFee,
        isFreeDelivery: feeCalcResult.freeDeliveryEligible
      };
      console.log(`\u2705 [FEE-CALC] Fee: \u20B9${feeResult.deliveryFee}, Free? ${feeResult.isFreeDelivery}
`);
      res.json({
        success: true,
        deliveryFee: feeResult.deliveryFee,
        isFreeDelivery: feeResult.isFreeDelivery
      });
      app2.get("/api/push/vapid-public-key", async (req2, res2) => {
        try {
          const { getVapidPublicKey: getVapidPublicKey2, isPushConfigured: isPushConfigured2 } = await Promise.resolve().then(() => (init_pushService(), pushService_exports));
          if (!isPushConfigured2()) {
            return res2.status(503).json({
              message: "Push notifications not configured",
              vapidPublicKey: null
            });
          }
          const publicKey = getVapidPublicKey2();
          if (!publicKey) {
            return res2.status(503).json({
              message: "VAPID public key not available",
              vapidPublicKey: null
            });
          }
          res2.json({
            vapidPublicKey: publicKey,
            message: "VAPID public key retrieved successfully"
          });
        } catch (error) {
          console.error("Error fetching VAPID key:", error);
          res2.status(500).json({
            message: "Failed to fetch VAPID key",
            error: error.message
          });
        }
      });
      app2.post("/api/push/subscribe", async (req2, res2) => {
        try {
          const { subscription, userType, userId } = req2.body;
          if (!subscription || !subscription.endpoint) {
            return res2.status(400).json({
              message: "Invalid subscription data - missing endpoint"
            });
          }
          if (!userType || !userId) {
            return res2.status(400).json({
              message: "Missing userType or userId"
            });
          }
          const validTypes = ["admin", "chef", "delivery", "customer"];
          if (!validTypes.includes(userType)) {
            return res2.status(400).json({
              message: `Invalid userType. Must be one of: ${validTypes.join(", ")}`
            });
          }
          const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
          const { pushSubscriptions: pushSubscriptions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const { eq: eq7, and: and3 } = await import("drizzle-orm");
          const existing = await db2.select().from(pushSubscriptions2).where(
            and3(
              eq7(pushSubscriptions2.userId, userId),
              eq7(pushSubscriptions2.userType, userType)
            )
          ).limit(1);
          if (existing.length > 0) {
            await db2.update(pushSubscriptions2).set({
              subscription,
              isActive: true,
              lastActivatedAt: /* @__PURE__ */ new Date()
            }).where(eq7(pushSubscriptions2.id, existing[0].id));
            console.log(`\u2705 Push subscription updated for ${userType} ${userId}`);
          } else {
            await db2.insert(pushSubscriptions2).values({
              userId,
              userType,
              subscription,
              isActive: true
            });
            console.log(`\u2705 Push subscription registered for ${userType} ${userId}`);
          }
          res2.json({
            success: true,
            message: "Successfully registered for push notifications"
          });
        } catch (error) {
          console.error("Error registering for push notifications:", error);
          res2.status(500).json({
            success: false,
            message: "Failed to register for push notifications",
            error: error.message
          });
        }
      });
      app2.post("/api/push/unsubscribe", async (req2, res2) => {
        try {
          const { userId, userType } = req2.body;
          if (!userId || !userType) {
            return res2.status(400).json({
              message: "Missing userId or userType"
            });
          }
          const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
          const { pushSubscriptions: pushSubscriptions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const { eq: eq7, and: and3 } = await import("drizzle-orm");
          await db2.update(pushSubscriptions2).set({ isActive: false }).where(
            and3(
              eq7(pushSubscriptions2.userId, userId),
              eq7(pushSubscriptions2.userType, userType)
            )
          );
          console.log(`\u{1F5D1}\uFE0F Push subscriptions removed for ${userType} ${userId}`);
          res2.json({
            success: true,
            message: "Successfully unsubscribed from push notifications"
          });
        } catch (error) {
          console.error("Error unsubscribing from push notifications:", error);
          res2.status(500).json({
            success: false,
            message: "Failed to unsubscribe from push notifications"
          });
        }
      });
      app2.post("/api/push/send", requireAdmin, async (req2, res2) => {
        try {
          const { userType, userId, notification } = req2.body;
          if (!notification || !notification.title || !notification.body) {
            return res2.status(400).json({
              message: "Missing notification title or body"
            });
          }
          const { sendPushToUser: sendPushToUser2, sendPushToAllAdmins: sendPushToAllAdmins2, isPushConfigured: isPushConfigured2 } = await Promise.resolve().then(() => (init_pushService(), pushService_exports));
          if (!isPushConfigured2()) {
            return res2.status(503).json({
              success: false,
              message: "Push notifications not configured"
            });
          }
          let result;
          if (userType === "admin" && !userId) {
            result = await sendPushToAllAdmins2(notification);
          } else if (userType && userId) {
            result = await sendPushToUser2(userId, userType, notification);
          } else {
            return res2.status(400).json({
              message: "Must provide either userType+userId or just admin userType"
            });
          }
          res2.json({
            message: "Push notification send attempted",
            ...result
          });
        } catch (error) {
          console.error("Error sending push notification:", error);
          res2.status(500).json({
            success: false,
            message: "Failed to send push notification",
            error: error.message
          });
        }
      });
      res.json({
        success: true,
        distance: distance || 0,
        deliveryFee: feeResult.deliveryFee,
        isFreeDelivery: feeResult.isFreeDelivery,
        breakdown: {
          subtotal: orderAmount,
          deliveryFee: feeResult.deliveryFee,
          total: orderAmount + (feeResult.isFreeDelivery ? 0 : feeResult.deliveryFee)
        }
      });
    } catch (error) {
      console.error("Delivery fee calculation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate delivery fee"
      });
    }
  });
  app2.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address." });
      }
      const existing = await db.select().from(newsletterSubscribers2).where(eq6(newsletterSubscribers2.email, email.toLowerCase().trim())).limit(1);
      if (existing.length > 0) {
        if (existing[0].isActive) {
          return res.json({ success: true, message: "You're already subscribed!" });
        }
        await db.update(newsletterSubscribers2).set({ isActive: true, unsubscribedAt: null }).where(eq6(newsletterSubscribers2.email, email.toLowerCase().trim()));
        return res.json({ success: true, message: "Welcome back! You've been re-subscribed." });
      }
      await db.insert(newsletterSubscribers2).values({
        email: email.toLowerCase().trim()
      });
      console.log(`\u{1F4E7} New newsletter subscriber: ${email}`);
      res.json({ success: true, message: "Successfully subscribed! You'll receive special offers and updates." });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
  });
  const httpServer = createServer(app2);
  setupWebSocket(httpServer);
  return httpServer;
}

// server/index.ts
init_partnerAuth();

// server/imageService.ts
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log(`\u2601\uFE0F  Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}`);
var IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // 5MB
  ALLOWED_MIMETYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"]
};
var validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${IMAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }
  if (!IMAGE_CONFIG.ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} not allowed. Allowed: ${IMAGE_CONFIG.ALLOWED_MIMETYPES.join(", ")}`
    };
  }
  return { valid: true };
};
var saveImageFile = async (file, folder = "rotihai") => {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error("\u274C Cloudinary not configured. Check .env for CLOUDINARY_CLOUD_NAME");
      return {
        success: false,
        error: "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME in environment"
      };
    }
    console.log(`\u23F3 Uploading to Cloudinary/${folder}...`);
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          quality: "auto:good"
          // Auto-optimize
        },
        (error, result2) => {
          if (error) reject(error);
          else resolve(result2);
        }
      );
      Readable.from(file.buffer).pipe(stream);
    });
    const url = result.secure_url;
    console.log(`\u2705 Uploaded to Cloudinary: ${url}`);
    return {
      success: true,
      filename: result.public_id,
      url,
      public_id: result.public_id,
      fileSize: file.size
    };
  } catch (error) {
    console.error("\u274C Upload error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to upload image"
    };
  }
};
var getImagePath = (filename) => {
  if (filename && filename.startsWith("http")) {
    return filename;
  }
  return `/uploads/${filename}`;
};
var imageExists = (filename) => {
  return !!filename && (filename.startsWith("http") || filename.length > 0);
};

// server/index.ts
var log2 = (message, source = "express") => {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};
var app = express2();
console.log("\u{1F680} Server is starting...");
debugger;
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
  } else {
    if (req.path === "/sw.js") {
      res.set({
        "Cache-Control": "no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      });
    } else if (req.path.endsWith(".html") || req.path === "/") {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
    } else if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (req.path.match(/\.(json|xml|webmanifest)$/i)) {
      res.set({
        "Cache-Control": "public, max-age=3600"
        // 1 hour
      });
    } else if (req.path.startsWith("/api/")) {
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
    } else {
      res.set({
        "Cache-Control": "public, max-age=3600"
      });
    }
  }
  next();
});
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
(async () => {
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const { hashPassword: hashPassword7 } = await Promise.resolve().then(() => (init_adminAuth(), adminAuth_exports));
  try {
    const existingAdmin = await storage2.getAdminByUsername("admin");
    if (!existingAdmin) {
      const passwordHash = await hashPassword7("admin123");
      await storage2.createAdmin({
        username: "admin",
        email: "admin@rotihai.com",
        role: "super_admin",
        passwordHash
      });
      log2("Default admin user created successfully");
    }
  } catch (error) {
    log2("Failed to create default admin user:", error?.message || error);
  }
  app.post("/api/partner/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("\u{1F510} Partner login attempt:", { username });
      if (!username || typeof username !== "string" || username.trim().length === 0) {
        console.log("\u274C Invalid username");
        res.status(400).json({ message: "Valid username is required" });
        return;
      }
      if (!password || typeof password !== "string" || password.length === 0) {
        console.log("\u274C Invalid password");
        res.status(400).json({ message: "Valid password is required" });
        return;
      }
      const trimmedUsername = username.trim().toLowerCase();
      const partner = await storage2.getPartnerByUsername(trimmedUsername);
      if (!partner) {
        console.log("\u274C Partner not found:", trimmedUsername);
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      console.log("\u2705 Partner found:", { id: partner.id, username: partner.username });
      if (!partner.passwordHash) {
        console.log("\u274C No password hash found for partner:", trimmedUsername);
        res.status(500).json({ message: "Account configuration error. Please contact admin." });
        return;
      }
      const isValid = await verifyPassword3(password, partner.passwordHash);
      console.log("\u{1F511} Password verification:", isValid);
      if (!isValid) {
        console.log("\u274C Invalid password for:", trimmedUsername);
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const chef = await storage2.getChefById(partner.chefId);
      if (!chef) {
        console.log("\u274C Chef not found for partner:", partner.chefId);
        res.status(500).json({ message: "Account configuration error. Please contact admin." });
        return;
      }
      await storage2.updatePartnerLastLogin(partner.id);
      const accessToken = generateAccessToken2(partner);
      const refreshToken = generateRefreshToken3(partner);
      res.cookie("partnerRefreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1e3
        // 30 days
      });
      const chefName = chef ? chef.name : "Unknown Chef";
      console.log("\u2705 Partner login successful:", partner.username, "Chef:", chefName);
      res.json({
        accessToken,
        partner: {
          id: partner.id,
          username: partner.username,
          chefId: partner.chefId,
          chefName
        }
      });
    } catch (error) {
      console.error("\u274C Partner login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.post("/api/partner/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.partnerRefreshToken;
      if (!refreshToken) {
        res.status(401).json({ message: "No refresh token provided" });
        return;
      }
      const { verifyToken: verifyPartnerToken } = await Promise.resolve().then(() => (init_partnerAuth(), partnerAuth_exports));
      const payload = verifyPartnerToken(refreshToken);
      if (!payload) {
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
      }
      const partner = await storage2.getPartnerById(payload.partnerId);
      if (!partner) {
        res.status(404).json({ message: "Partner not found" });
        return;
      }
      const newAccessToken = generateAccessToken2(partner);
      console.log("\u2705 Partner token refreshed:", partner.username);
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Partner token refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.get("/api/partner/profile", requirePartner(), async (req, res) => {
    try {
      const partnerReq = req;
      const partner = await storage2.getPartnerById(partnerReq.partner.partnerId);
      if (!partner) {
        res.status(404).json({ message: "Partner not found" });
        return;
      }
      const chef = await storage2.getChefById(partner.chefId);
      res.json({
        id: partner.id,
        username: partner.username,
        email: partner.email,
        profilePictureUrl: partner.profilePictureUrl,
        chefId: partner.chefId,
        chefName: chef?.name || "",
        lastLoginAt: partner.lastLoginAt,
        createdAt: partner.createdAt
      });
    } catch (error) {
      console.error("Get partner profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.put("/api/partner/profile", requirePartner(), async (req, res) => {
    try {
      const partnerReq = req;
      const { email, profilePictureUrl } = req.body;
      if (email && (typeof email !== "string" || !email.includes("@"))) {
        res.status(400).json({ message: "Valid email is required" });
        return;
      }
      if (profilePictureUrl && typeof profilePictureUrl !== "string") {
        res.status(400).json({ message: "Profile picture URL must be a string" });
        return;
      }
      const partner = await storage2.getPartnerById(partnerReq.partner.partnerId);
      if (!partner) {
        res.status(404).json({ message: "Partner not found" });
        return;
      }
      const updateData = {};
      if (email) updateData.email = email;
      if (profilePictureUrl !== void 0) updateData.profilePictureUrl = profilePictureUrl;
      await storage2.updatePartner(partner.id, updateData);
      const updatedPartner = await storage2.getPartnerById(partner.id);
      const chef = await storage2.getChefById(updatedPartner.chefId);
      res.json({
        id: updatedPartner.id,
        username: updatedPartner.username,
        email: updatedPartner.email,
        profilePictureUrl: updatedPartner.profilePictureUrl,
        chefId: updatedPartner.chefId,
        chefName: chef?.name || "",
        lastLoginAt: updatedPartner.lastLoginAt,
        createdAt: updatedPartner.createdAt
      });
    } catch (error) {
      console.error("Update partner profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.put("/api/partner/change-password", requirePartner(), async (req, res) => {
    try {
      const partnerReq = req;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters" });
        return;
      }
      const partner = await storage2.getPartnerById(partnerReq.partner.partnerId);
      if (!partner || !partner.passwordHash) {
        res.status(404).json({ message: "Partner not found" });
        return;
      }
      const isValid = await verifyPassword3(currentPassword, partner.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
      const newPasswordHash = await hashPassword7(newPassword);
      await storage2.updatePartner(partner.id, { passwordHash: newPasswordHash });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change partner password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      const result = await saveImageFile(req.file, "rotihai");
      if (!result.success) {
        res.status(400).json({ message: result.error });
        return;
      }
      res.json({
        success: true,
        url: result.url,
        filename: result.filename,
        fileSize: result.fileSize
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  app.get("/uploads/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      if (!filename || filename.includes("..") || filename.includes("/")) {
        res.status(400).json({ message: "Invalid filename" });
        return;
      }
      if (!imageExists(filename)) {
        res.status(404).json({ message: "Image not found" });
        return;
      }
      const filepath = getImagePath(filename);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.sendFile(filepath);
    } catch (error) {
      console.error("Image serving error:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    console.error("Global error handler caught:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.setHeader("Content-Type", "application/json");
    res.status(status).json({ message });
  });
  app.use("/api", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(404).json({ message: "API endpoint not found" });
  });
  if (process.env.NODE_ENV === "development") {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    await setupVite2(app, server);
  } else if (process.env.SERVE_CLIENT === "true") {
    const { serveStatic: serveStatic2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    serveStatic2(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log2(`serving on port ${port}`);
  });
})();
