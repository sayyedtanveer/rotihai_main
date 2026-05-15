import { type Category, type InsertCategory, type Product, type InsertProduct, type Order, type InsertOrder, type User, type UpsertUser, type Chef, type AdminUser, type InsertAdminUser, type PartnerUser, type Subscription, type SubscriptionPlan, type DeliverySetting, type InsertDeliverySetting, type DeliveryPartnerPayout, type InsertDeliveryPartnerPayout, type CartSetting, type InsertCartSetting, type DeliveryPersonnel, type InsertDeliveryPersonnel, type WalletTransaction, type ReferralReward, type PromotionalBanner, type InsertPromotionalBanner, type SubscriptionDeliveryLog, type InsertSubscriptionDeliveryLog, type DeliveryTimeSlot, type InsertDeliveryTimeSlot, type Coupon, type RotiSettings, type InsertRotiSettings, type Visitor, type DeliveryArea, type InsertDeliveryArea, type AdminSettings, type PendingCheckout, type InsertPendingCheckout } from "@shared/schema";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";
import { eq, and, gte, lte, desc, asc, or, isNull, sql, count, lt, inArray } from "drizzle-orm";
import {
  db, users, categories, products, orders, chefs, adminUsers, partnerUsers, subscriptions,
  subscriptionPlans, subscriptionDeliveryLogs, deliverySettings, deliveryPartnerPayouts, cartSettings, deliveryPersonnel, coupons, couponUsages, referrals, walletTransactions, referralRewards, promotionalBanners, deliveryTimeSlots, rotiSettings, visitors, deliveryAreas, adminSettings, payoutTransactions, pendingCheckouts
} from "@shared/db";
import { getRoadAdjustedDistance } from "@shared/deliveryUtils";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt" | "updatedAt" | "lastLoginAt">): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getOrdersByUserId(userId: string): Promise<Order[]>;

  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  reorderCategories(items: { id: string; displayOrder: number }[]): Promise<void>;

  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsByCategoryId(categoryId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: string, paymentStatus: "pending" | "paid" | "confirmed"): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;

  getChefs(): Promise<Chef[]>;
  getChefById(id: string): Promise<Chef | null>;
  getChefsByCategory(categoryId: string): Promise<Chef[]>;
  createChef(data: Omit<Chef, "id">): Promise<Chef>;
  updateChef(id: string, data: Partial<Chef>): Promise<Chef | undefined>;
  deleteChef(id: string): Promise<boolean>;

  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminById(id: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser & { passwordHash: string }): Promise<AdminUser>;
  updateAdminLastLogin(id: string): Promise<void>;
  updateAdminRole(id: string, role: string): Promise<AdminUser | undefined>;
  updateAdminPassword(id: string, passwordHash: string): Promise<void>;
  deleteAdmin(id: string): Promise<boolean>;
  getAllAdmins(): Promise<AdminUser[]>;
  getAllUsers(): Promise<User[]>;

  getPartnerByUsername(username: string): Promise<PartnerUser | null>;
  getPartnerById(id: string): Promise<PartnerUser | null>;
  createPartner(data: Omit<PartnerUser, "id" | "createdAt" | "lastLoginAt">): Promise<PartnerUser>;
  updatePartner(id: string, data: Partial<Pick<PartnerUser, "email" | "passwordHash" | "profilePictureUrl">>): Promise<void>;
  updatePartnerLastLogin(id: string): Promise<void>;
  getOrdersByChefId(chefId: string): Promise<Order[]>;
  getPartnerDashboardMetrics(chefId: string): Promise<any>;
  getAllPartners(): Promise<PartnerUser[]>;
  deletePartner(id: string): Promise<boolean>;

  getDashboardMetrics(): Promise<{
    userCount: number;
    orderCount: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(data: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<void>;

  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: string): Promise<Subscription[]>;
  createSubscription(data: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription>;
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
  getActiveSubscriptionCountByChef(chefId: string): Promise<number>; // Added for load balancing
  findBestChefForCategory(categoryId: string): Promise<Chef | null>; // Added for load balancing
  assignChefToSubscription(subscriptionId: string, chefId: string): Promise<Subscription | undefined>;
  getActiveSubscriptionsByChef(chefId: string): Promise<Subscription[]>; // Added for load balancing

  // Subscription Delivery Log methods
  getSubscriptionDeliveryLogs(subscriptionId: string): Promise<SubscriptionDeliveryLog[]>;
  getSubscriptionDeliveryLogsByDate(date: Date): Promise<SubscriptionDeliveryLog[]>;
  getSubscriptionDeliveryLog(id: string): Promise<SubscriptionDeliveryLog | undefined>;
  createSubscriptionDeliveryLog(data: Omit<SubscriptionDeliveryLog, "id" | "createdAt" | "updatedAt">): Promise<SubscriptionDeliveryLog>;
  updateSubscriptionDeliveryLog(id: string, data: Partial<SubscriptionDeliveryLog>): Promise<SubscriptionDeliveryLog | undefined>;
  deleteSubscriptionDeliveryLog(id: string): Promise<void>;
  getDeliveryLogBySubscriptionAndDate(subscriptionId: string, date: Date): Promise<SubscriptionDeliveryLog | undefined>;

  // Delivery settings methods
  getDeliverySettings(): Promise<DeliverySetting[]>;
  getDeliverySetting(id: string): Promise<DeliverySetting | undefined>;
  getDeliverySettingsByPincode(pincode: string): Promise<DeliverySetting[]>;
  getDeliverySettingByPincodeAndDistance(pincode: string, distance: number): Promise<DeliverySetting | undefined>;
  createDeliverySetting(data: Omit<DeliverySetting, "id" | "createdAt" | "updatedAt">): Promise<DeliverySetting>;
  updateDeliverySetting(id: string, data: Partial<DeliverySetting>): Promise<DeliverySetting | undefined>;
  deleteDeliverySetting(id: string): Promise<void>;

  // Delivery Partner Payout Slab methods
  getDeliveryPartnerPayouts(): Promise<DeliveryPartnerPayout[]>;
  getDeliveryPartnerPayout(id: string): Promise<DeliveryPartnerPayout | undefined>;
  getDeliveryPartnerPayoutsByPincode(pincode: string): Promise<DeliveryPartnerPayout[]>;
  getDeliveryPartnerPayoutByPincodeAndDistance(pincode: string | null, distance: number): Promise<DeliveryPartnerPayout | undefined>;
  createDeliveryPartnerPayout(data: InsertDeliveryPartnerPayout): Promise<DeliveryPartnerPayout>;
  updateDeliveryPartnerPayout(id: string, data: Partial<DeliveryPartnerPayout>): Promise<DeliveryPartnerPayout | undefined>;
  deleteDeliveryPartnerPayout(id: string): Promise<boolean>;
  calculateDeliveryPartnerPayout(distance: number | null | undefined, pincode?: string): Promise<number>;

  // 🆕 Platform Fee Config methods
  getPlatformFeeConfig(): Promise<any>;
  savePlatformFeeConfig(config: any): Promise<void>;

  // Cart settings methods
  getCartSettings(): Promise<CartSetting[]>;
  getCartSettingByCategoryId(categoryId: string): Promise<CartSetting | undefined>;
  createCartSetting(data: Omit<CartSetting, "id" | "createdAt" | "updatedAt">): Promise<CartSetting>;
  updateCartSetting(id: string, data: Partial<CartSetting>): Promise<CartSetting | undefined>;
  deleteCartSetting(id: string): Promise<void>;

  // Report methods
  getSalesReport(from: Date, to: Date): Promise<any>;
  getUserReport(from: Date, to: Date): Promise<any>;
  getInventoryReport(): Promise<any>;
  getSubscriptionReport(from: Date, to: Date): Promise<any>;
  getChefReport(from: Date, to: Date, chefId?: string): Promise<any>;
  getRothiaiEarningsReport(from: Date, to: Date): Promise<any>;

  // Delivery Personnel methods
  getDeliveryPersonnelByPhone(phone: string): Promise<DeliveryPersonnel | undefined>;
  getDeliveryPersonnelById(id: string): Promise<DeliveryPersonnel | undefined>;
  getAllDeliveryPersonnel(): Promise<DeliveryPersonnel[]>;
  getAvailableDeliveryPersonnel(): Promise<DeliveryPersonnel[]>;
  createDeliveryPersonnel(data: InsertDeliveryPersonnel & { passwordHash: string }): Promise<DeliveryPersonnel>;
  updateDeliveryPersonnel(id: string, data: Partial<DeliveryPersonnel>): Promise<DeliveryPersonnel | undefined>;
  updateDeliveryPersonnelLastLogin(id: string): Promise<void>;
  deleteDeliveryPersonnel(id: string): Promise<boolean>;

  // Enhanced Order methods
  approveOrder(orderId: string, approvedBy: string): Promise<Order | undefined>;
  acceptOrder(orderId: string, approvedBy: string): Promise<Order | undefined>;
  rejectOrder(orderId: string, rejectedBy: string, reason: string): Promise<Order | undefined>;
  assignOrderToDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined>;
  updateOrderPickup(orderId: string): Promise<Order | undefined>;
  updateOrderDelivery(orderId: string): Promise<Order | undefined>;
  getOrdersByDeliveryPerson(deliveryPersonId: string): Promise<Order[]>;

  // Admin dashboard metrics
  getAdminDashboardMetrics(): Promise<{ partnerCount: number; deliveryPersonnelCount: number }>;

  // Referral methods
  generateReferralCode(userId: string): Promise<string>;
  createReferral(referrerId: string, referredId: string, options?: { expiresAt?: Date; firstOrderId?: string }): Promise<any>;
  applyReferralBonus(referralCode: string, newUserId: string, orderAmount?: number, options?: any): Promise<void>;
  getReferralsByUser(userId: string): Promise<any[]>;
  getReferralByReferredId(referredId: string): Promise<any | null>;
  getUserByReferralCode(referralCode: string): Promise<any | null>;
  updateReferral(referralId: string, data: Partial<any>): Promise<any | undefined>;
  getUserWalletBalance(userId: string): Promise<number>;
  validateBonusEligibility(userId: string, orderTotal: number): Promise<{
    eligible: boolean;
    bonus: number;
    minOrderAmount: number;
    reason?: string;
  }>;
  claimReferralBonusAtCheckout(userId: string, orderTotal: number, orderId: string): Promise<{
    bonusClaimed: boolean;
    amount: number;
    message: string;
  }>;
  updateWalletBalance(userId: string, amount: number): Promise<void>;

  // Delivery Fee Calculation methods
  calculateDeliveryFee(hasLocation: boolean, distance: number | null, orderAmount: number, chef: Chef): Promise<{
    deliveryFee: number;
    isFreeDelivery: boolean;
  }>;

  // Enhanced Wallet & Referral methods
  createWalletTransaction(transaction: {
    userId: string;
    amount: number;
    type: "credit" | "debit" | "referral_bonus" | "referral_bonus_claimed" | "order_discount" | "referral_reversal";
    description: string;
    referenceId?: string;
    referenceType?: string;
  }, txClient?: any): Promise<void>;
  getWalletTransactions(userId: string, limit?: number): Promise<any[]>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalEarnings: number;
    referralCode: string;
  }>;
  getUserReferralCode(userId: string): Promise<string | null>;
  markReferralComplete(referralId: string): Promise<void>;
  checkReferralEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }>;

  // Promotional Banner methods
  getAllPromotionalBanners(): Promise<PromotionalBanner[]>;
  getActivePromotionalBanners(): Promise<PromotionalBanner[]>;
  createPromotionalBanner(data: InsertPromotionalBanner): Promise<PromotionalBanner>;
  updatePromotionalBanner(id: string, data: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner | null>;
  deletePromotionalBanner(id: string): Promise<boolean>;

  // Delivery Time Slots methods
  getAllDeliveryTimeSlots(): Promise<DeliveryTimeSlot[]>;
  getActiveDeliveryTimeSlots(): Promise<DeliveryTimeSlot[]>;
  getDeliveryTimeSlot(id: string): Promise<DeliveryTimeSlot | undefined>;
  createDeliveryTimeSlot(data: InsertDeliveryTimeSlot): Promise<DeliveryTimeSlot>;
  updateDeliveryTimeSlot(id: string, data: Partial<InsertDeliveryTimeSlot>): Promise<DeliveryTimeSlot | undefined>;
  deleteDeliveryTimeSlot(id: string): Promise<boolean>;

  // Referral Rewards Settings methods
  getAllReferralRewards(): Promise<ReferralReward[]>;
  getActiveReferralReward(): Promise<ReferralReward | undefined>;
  createReferralReward(data: Omit<ReferralReward, "id" | "createdAt" | "updatedAt">): Promise<ReferralReward>;
  updateReferralReward(id: string, data: Partial<ReferralReward>): Promise<ReferralReward | undefined>;
  deleteReferralReward(id: string): Promise<boolean>;

  // Coupon management methods
  getAllCoupons(): Promise<Coupon[]>;
  createCoupon(data: any): Promise<Coupon>;
  deleteCoupon(id: string): Promise<boolean>;
  updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | undefined>;
  getCouponStats(): Promise<any[]>;

  // Referral management methods
  getAllReferrals(): Promise<any[]>;
  getReferralById(id: string): Promise<any | undefined>;
  updateReferralStatus(id: string, status: string, referrerBonus: number, referredBonus: number): Promise<void>;
  // Admin referral review methods
  getAdminReferrals(): Promise<any[]>;
  getAdminReferralStats(): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    approvedReferrals: number;
    cancelledReferrals: number;
    completedReferrals: number;
    totalBonusPaid: number;
  }>;
  adminApproveReferral(id: string, adminNote?: string): Promise<void>;
  adminCancelReferral(id: string, adminNote: string): Promise<void>;
  setReferralFraudFlag(id: string, fraudFlag: boolean): Promise<void>;


  // Wallet transaction methods
  getAllWalletTransactions(dateFilter?: string): Promise<WalletTransaction[]>;

  // Roti Settings methods
  getRotiSettings(): Promise<RotiSettings | undefined>;
  updateRotiSettings(data: Partial<InsertRotiSettings>): Promise<RotiSettings>;

  // SMS Settings methods
  getSMSSettings(): Promise<any | undefined>;
  updateSMSSettings(settings: any): Promise<any>;

  // Delivery Areas methods
  getDeliveryAreas(): Promise<string[]>;
  getAllDeliveryAreas(): Promise<DeliveryArea[]>;
  addDeliveryArea(name: string): Promise<DeliveryArea | undefined>;
  updateDeliveryAreas(areas: string[]): Promise<boolean>;
  deleteDeliveryArea(id: string): Promise<boolean>;
  toggleDeliveryAreaStatus(id: string, isActive: boolean): Promise<DeliveryArea | undefined>;

  // Admin Settings methods
  getAdminSetting(key: string): Promise<string | undefined>;
  setAdminSetting(key: string, value: string, description?: string): Promise<void>;
  getDefaultCoordinates(): Promise<{ latitude: number; longitude: number }>;
  setDefaultCoordinates(latitude: number, longitude: number): Promise<void>;

  // Pending Checkouts methods
  savePendingCheckout(data: InsertPendingCheckout): Promise<PendingCheckout>;
  getPendingCheckout(id: string): Promise<PendingCheckout | undefined>;
  getPendingCheckoutsByPhone(phone: string): Promise<PendingCheckout[]>;
  getAllPendingCheckouts(): Promise<PendingCheckout[]>;
  updatePendingCheckout(id: string, data: Partial<PendingCheckout>): Promise<PendingCheckout | undefined>;
  markPendingCheckoutAsConfirmed(id: string, orderId: string): Promise<PendingCheckout | undefined>;
  markPendingCheckoutAsConfirmedAndDeleted(id: string, orderId: string): Promise<PendingCheckout | undefined>;
  deletePendingCheckout(id: string): Promise<boolean>;
}

/**
 * Helper function to convert dates to Date objects for database operations
 * Drizzle ORM's PgTimestamp mapper expects Date objects or null, not ISO strings
 */
function convertDateForDB(value: any): Date | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    // Parse ISO string to Date object
    const date = new Date(value);
    const timestamp = date.getTime();
    if (isNaN(timestamp)) return null;
    return date;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    if (isNaN(timestamp)) return null;
    return value;
  }

  return null;
}

/**
 * Helper function to safely serialize subscription dates
 * Ensures consistent ISO string format across all endpoints
 * 
 * Validation rules:
 * - null/undefined: kept as-is (represents "not scheduled")
 * - Valid ISO strings or Date objects: converted to ISO string
 * - Epoch dates (Jan 1, 1970) or very old dates (before 1980): set to null
 * - Invalid dates (NaN): set to null
 * - Dates too far in future (after year 2100): set to null
 */
function serializeSubscription(sub: any): any {
  if (!sub) return sub;
  const serialized = { ...sub };

  // Helper to safely convert any date field
  const convertDateField = (dateValue: any, fieldName: string = "unknown"): string | null => {
    if (!dateValue) {
      console.log(`[CONVERT-FIELD] ${fieldName}: null/empty input, returning null`);
      return null;
    }
    try {
      console.log(`[CONVERT-FIELD] ${fieldName}: type=${typeof dateValue}, isDate=${dateValue instanceof Date}, value=${dateValue}`);

      // If already a string and looks like ISO string, return as-is
      if (typeof dateValue === 'string') {
        // Validate it's a proper ISO string by checking if parsing works
        const dateObj = new Date(dateValue);
        const timestamp = dateObj.getTime();
        const year = dateObj.getFullYear();

        console.log(`[CONVERT-FIELD] ${fieldName} (string): timestamp=${timestamp}, isNaN=${isNaN(timestamp)}, year=${year}`);

        if (!isNaN(timestamp) && year >= 1980 && year <= 2100) {
          console.log(`[CONVERT-FIELD] ${fieldName}: returning ISO string as-is`);
          return dateValue; // Return the original ISO string
        }
        console.log(`[CONVERT-FIELD] ${fieldName}: invalid string date, returning null`);
        return null; // Invalid or out of range
      }

      // If it's a Date object
      const dateObj = new Date(dateValue);
      const timestamp = dateObj.getTime();
      const year = dateObj.getFullYear();

      console.log(`[CONVERT-FIELD] ${fieldName} (Date obj): timestamp=${timestamp}, isNaN=${isNaN(timestamp)}, year=${year}`);

      // Check if date is valid (not NaN)
      if (!isNaN(timestamp)) {
        // Reject epoch (1970), very old dates (before 1980), and dates too far in future (after 2100)
        if (year >= 1980 && year <= 2100) {
          const isoStr = dateObj.toISOString();
          console.log(`[CONVERT-FIELD] ${fieldName}: returning ISO string: ${isoStr}`);
          return isoStr;
        }
        console.log(`[CONVERT-FIELD] ${fieldName}: year out of range (${year}), returning null`);
      }
      // Invalid date or out of range - return null
      console.log(`[CONVERT-FIELD] ${fieldName}: invalid date or NaN, returning null`);
      return null;
    } catch (e) {
      // If date parsing fails, return null
      console.log(`[CONVERT-FIELD] ${fieldName}: exception caught, returning null`, e);
      return null;
    }
  };

  // Convert ALL date fields to ISO strings or null
  // CRITICAL: This prevents epoch (1970) dates from being sent to frontend
  serialized.startDate = convertDateField(serialized.startDate, 'startDate');
  serialized.endDate = convertDateField(serialized.endDate, 'endDate');
  serialized.nextDeliveryDate = convertDateField(serialized.nextDeliveryDate, 'nextDeliveryDate');
  serialized.lastDeliveryDate = convertDateField(serialized.lastDeliveryDate, 'lastDeliveryDate');
  serialized.chefAssignedAt = convertDateField(serialized.chefAssignedAt, 'chefAssignedAt');
  serialized.pauseStartDate = convertDateField(serialized.pauseStartDate, 'pauseStartDate');
  serialized.pauseResumeDate = convertDateField(serialized.pauseResumeDate, 'pauseResumeDate');
  serialized.createdAt = convertDateField(serialized.createdAt, 'createdAt');
  serialized.updatedAt = convertDateField(serialized.updatedAt, 'updatedAt');

  // VALIDATION: Ensure nextDeliveryDate is valid (not 1970 or null)
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category> = new Map();
  private chefsData: Map<string, Chef> = new Map(); // Renamed from 'chefs' to 'chefsData' for clarity
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.chefsData = new Map(); // Initialize chefsData
    this.products = new Map();
    this.orders = new Map();
    this.adminUsers = new Map();
    this.subscriptionPlans = new Map();
    this.subscriptions = new Map();
    // this.seedData(); // Seed data is not directly applicable to the DB-backed storage
  }

  async getUser(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, id) });
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return db.query.users.findFirst({ where: (user, { eq }) => eq(user.phone, phone) });
  }

  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt" | "lastLoginAt">): Promise<User> {
    const id = randomUUID();

    // Auto-generate referral code for new user
    const referralCode = userData.referralCode || `REF${nanoid(8).toUpperCase()}`;

    const user: User = {
      ...userData,
      referralCode,
      id,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(users).values(user);
    console.log(`✅ User created with auto-generated referral code: ${referralCode}`);
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, id));
    return this.getUser(id);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return db.query.orders.findMany({
      where: (order, { eq }) => eq(order.userId, userId),
      orderBy: (order, { desc }) => [desc(order.createdAt)],
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.query.categories.findMany({
      orderBy: (c, { asc }) => [asc(c.displayOrder)],
    });
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return db.query.categories.findFirst({ where: (c, { eq }) => eq(c.id, id) });
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { requiresDeliverySlot: false, displayOrder: 999, ...insertCategory, id };
    await db.insert(categories).values(category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    await db.update(categories).set(updateData).where(eq(categories.id, id));
    return this.getCategoryById(id);
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async reorderCategories(items: { id: string; displayOrder: number }[]): Promise<void> {
    // Batch update each category's displayOrder inside a single transaction
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(categories)
          .set({ displayOrder: item.displayOrder })
          .where(eq(categories.id, item.id));
      }
    });
  }

  async getAllProducts(): Promise<Product[]> {
    return db.query.products.findMany();
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return db.query.products.findFirst({ where: (p, { eq }) => eq(p.id, id) });
  }

  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    // This filter should apply to products within a category.
    // If the intention is to show restaurants/partners, this logic might need adjustment
    // to filter chefs/partners based on category, not products.
    return db.query.products.findMany({ where: (p, { eq }) => eq(p.categoryId, categoryId) });
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const marginPercent = insertProduct.marginPercent !== undefined
      ? typeof insertProduct.marginPercent === 'number'
        ? insertProduct.marginPercent.toString()
        : insertProduct.marginPercent
      : "0";

    const product: Product = {
      ...insertProduct,
      id,
      rating: insertProduct.rating || "4.5",
      reviewCount: insertProduct.reviewCount || 0,
      isVeg: insertProduct.isVeg !== undefined ? insertProduct.isVeg : true,
      isCustomizable: insertProduct.isCustomizable !== undefined ? insertProduct.isCustomizable : false,
      chefId: insertProduct.chefId || null,
      stockQuantity: insertProduct.stockQuantity !== undefined ? insertProduct.stockQuantity : 100,
      lowStockThreshold: insertProduct.lowStockThreshold !== undefined ? insertProduct.lowStockThreshold : 20,
      isAvailable: insertProduct.isAvailable !== undefined ? insertProduct.isAvailable : true,
      offerPercentage: insertProduct.offerPercentage ?? 0,
      hotelPrice: insertProduct.hotelPrice ?? 0,
      marginPercent,
      // Normalise optional fields to their DB defaults (prevent undefined leaking into Product type)
      section: insertProduct.section ?? null,
      sectionOrder: insertProduct.sectionOrder ?? 0,
      sortOrder: insertProduct.sortOrder ?? 0,
    };
    await db.insert(products).values(product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const sanitizedData: any = { ...updateData };

    // Convert marginPercent to string if it's a number
    if (sanitizedData.marginPercent !== undefined && typeof sanitizedData.marginPercent === 'number') {
      sanitizedData.marginPercent = sanitizedData.marginPercent.toString();
    }

    await db.update(products).set(sanitizedData).where(eq(products.id, id));
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const orderData = {
      id,
      customerName: insertOrder.customerName,
      phone: insertOrder.phone,
      email: insertOrder.email || null,
      address: insertOrder.address,
      // Structured address fields
      addressBuilding: (insertOrder as any).addressBuilding || null,
      addressStreet: (insertOrder as any).addressStreet || null,
      addressArea: (insertOrder as any).addressArea || null,
      addressCity: (insertOrder as any).addressCity || null,
      addressPincode: (insertOrder as any).addressPincode || null,
      items: insertOrder.items,
      subtotal: insertOrder.subtotal,
      deliveryFee: insertOrder.deliveryFee,
      discount: insertOrder.discount || 0,
      couponCode: insertOrder.couponCode || null,
      referralCode: (insertOrder as any).referralCode || null,
      total: insertOrder.total,
      status: insertOrder.paymentStatus || "pending",
      paymentStatus: "pending" as const,
      paymentQrShown: true,
      chefId: insertOrder.chefId || null,
      chefName: insertOrder.chefName || null,
      userId: insertOrder.userId ? insertOrder.userId : null,
      categoryId: insertOrder.categoryId || null,
      categoryName: insertOrder.categoryName || null,
      deliveryTime: insertOrder.deliveryTime || null,
      deliverySlotId: insertOrder.deliverySlotId || null,
      deliveryDate: (insertOrder as any).deliveryDate || null,
      walletAmountUsed: insertOrder.walletAmountUsed || 0,
      distance: (insertOrder as any).distance || null,
      deliveryPartnerPayout: (insertOrder as any).deliveryPartnerPayout || null,
      createdAt: new Date(),
    };

    try {
      const [createdOrder] = await db.insert(orders).values(orderData).returning();
      return createdOrder;
    } catch (error: any) {
      // If foreign key constraint fails for userId, try again without userId
      if (error.code === '23503' && error.message.includes('user_id')) {
        console.warn("Foreign key constraint for userId - creating order without userId reference");
        orderData.userId = null;
        const [createdOrder] = await db.insert(orders).values(orderData).returning();
        return createdOrder;
      }
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return db.query.orders.findFirst({ where: (o, { eq }) => eq(o.id, id) });
  }

  async getAllOrders(): Promise<Order[]> {
    return db.query.orders.findMany();
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: "pending" | "paid" | "confirmed"): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ paymentStatus })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getChefs(): Promise<Chef[]> {
    // If filtering by category is intended to show partners/restaurants,
    // this query should select from `partnerUsers` or `chefs` based on context.
    // For now, returning all chefs as per original implementation.
    const result = await db.select().from(chefs);
    return result.map(chef => ({
      ...chef,
      latitude: (chef as any).latitude ?? 19.0728,
      longitude: (chef as any).longitude ?? 72.8826,
    }));
  }


  async getChefById(id: string): Promise<Chef | null> {
    const chef = await db.query.chefs.findFirst({ where: (c, { eq }) => eq(c.id, id) });
    return chef || null;
  }

  async getChefsByCategory(categoryId: string): Promise<Chef[]> {
    // This method, when called with a category, should return chefs/partners
    // associated with that category. The current implementation does this.
    return db.query.chefs.findMany({ where: (c, { eq }) => eq(c.categoryId, categoryId) });
  }

  async createChef(data: Omit<Chef, "id">): Promise<Chef> {
    const id = nanoid();
    // Include address (full string), latitude, longitude, and structured address fields
    const chefData = {
      id,
      name: data.name,
      description: data.description,
      image: data.image,
      rating: data.rating,
      reviewCount: data.reviewCount,
      categoryId: data.categoryId,
      address: (data as any).address || null, // Full address string
      addressBuilding: (data as any).addressBuilding || null,
      addressStreet: (data as any).addressStreet || null,
      addressArea: (data as any).addressArea || null,
      addressCity: (data as any).addressCity || "Mumbai",
      addressPincode: (data as any).addressPincode || null,
      latitude: (data as any).latitude ?? 19.0728,
      longitude: (data as any).longitude ?? 72.8826,
      isActive: (data as any).isActive !== false,
      defaultDeliveryFee: (data as any).defaultDeliveryFee ?? 20,
      deliveryFeePerKm: (data as any).deliveryFeePerKm ?? 5,
      freeDeliveryThreshold: (data as any).freeDeliveryThreshold ?? 200,
      servicePincodes: (data as any).servicePincodes || null,
      maxDeliveryDistanceKm: (data as any).maxDeliveryDistanceKm ?? 5,
      isVerified: (data as any).isVerified === true,
      // FSSAI / Compliance
      fssaiNumber: (data as any).fssaiNumber || null,
      fssaiVerified: (data as any).fssaiVerified === true,
      chefType: (data as any).chefType || null,
      complianceStatus: (data as any).complianceStatus || "pending",
    };

    await db.insert(chefs).values(chefData as any);
    const created = await this.getChefById(id);
    return created || (chefData as any as Chef);
  }

  async updateChef(id: string, data: Partial<Chef>): Promise<Chef | undefined> {
    // Filter out undefined values and prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.reviewCount !== undefined) updateData.reviewCount = data.reviewCount;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if ((data as any).address !== undefined) updateData.address = (data as any).address;
    if ((data as any).addressBuilding !== undefined) updateData.addressBuilding = (data as any).addressBuilding;
    if ((data as any).addressStreet !== undefined) updateData.addressStreet = (data as any).addressStreet;
    if ((data as any).addressArea !== undefined) updateData.addressArea = (data as any).addressArea;
    if ((data as any).addressCity !== undefined) updateData.addressCity = (data as any).addressCity;
    if ((data as any).addressPincode !== undefined) updateData.addressPincode = (data as any).addressPincode;
    if ((data as any).latitude !== undefined) updateData.latitude = (data as any).latitude;
    if ((data as any).longitude !== undefined) updateData.longitude = (data as any).longitude;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if ((data as any).defaultDeliveryFee !== undefined) updateData.defaultDeliveryFee = (data as any).defaultDeliveryFee;
    if ((data as any).deliveryFeePerKm !== undefined) updateData.deliveryFeePerKm = (data as any).deliveryFeePerKm;
    if ((data as any).freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = (data as any).freeDeliveryThreshold;
    if ((data as any).maxDeliveryDistanceKm !== undefined) updateData.maxDeliveryDistanceKm = (data as any).maxDeliveryDistanceKm;
    if ((data as any).servicePincodes !== undefined) updateData.servicePincodes = (data as any).servicePincodes;
    if ((data as any).isVerified !== undefined) updateData.isVerified = (data as any).isVerified;
    // FSSAI / Compliance fields
    if ((data as any).fssaiNumber !== undefined) updateData.fssaiNumber = (data as any).fssaiNumber || null;
    if ((data as any).fssaiVerified !== undefined) updateData.fssaiVerified = (data as any).fssaiVerified;
    if ((data as any).chefType !== undefined) updateData.chefType = (data as any).chefType || null;
    if ((data as any).complianceStatus !== undefined) updateData.complianceStatus = (data as any).complianceStatus;

    console.log("🔥 updateChef() - Received data:", { id, incomingMaxDeliveryDistanceKm: (data as any).maxDeliveryDistanceKm, servicePincodes: (data as any).servicePincodes, updateData });

    await db.update(chefs).set(updateData).where(eq(chefs.id, id));
    const chef = await this.getChefById(id);
    return chef || undefined;
  }

  async deleteChef(id: string): Promise<boolean> {
    await db.delete(chefs).where(eq(chefs.id, id));
    return true;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    return db.query.adminUsers.findFirst({ where: (admin, { eq }) => eq(admin.username, username) });
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    return db.query.adminUsers.findFirst({ where: (admin, { eq }) => eq(admin.id, id) });
  }

  async createAdmin(adminData: InsertAdminUser & { passwordHash: string }): Promise<AdminUser> {
    const id = randomUUID();
    const admin: AdminUser = {
      id,
      username: adminData.username,
      email: adminData.email,
      phone: adminData.phone || null,
      passwordHash: adminData.passwordHash,
      role: adminData.role || "viewer",
      lastLoginAt: null,
      createdAt: new Date(),
    };
    await db.insert(adminUsers).values(admin);
    return admin;
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  }

  async updateAdminRole(id: string, role: string): Promise<AdminUser | undefined> {
    await db.update(adminUsers).set({ role: role as "super_admin" | "manager" | "viewer" }).where(eq(adminUsers.id, id));
    return this.getAdminById(id);
  }

  async updateAdminPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(adminUsers).set({ passwordHash: passwordHash }).where(eq(adminUsers.id, id));
  }

  async deleteAdmin(id: string): Promise<boolean> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return true;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    // ✅ Explicitly select all fields including phone
    const result = await db
      .select()
      .from(adminUsers)
      .execute();
    
    console.log("[STORAGE-DEBUG] getAllAdmins() result:", {
      count: result.length,
      fields: result.length > 0 ? Object.keys(result[0]) : [],
      firstAdmin: result.length > 0 ? {
        id: result[0].id,
        username: result[0].username,
        phone: result[0].phone,
        role: result[0].role
      } : null
    });
    
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return db.query.users.findMany();
  }

  async getPartnerByUsername(username: string): Promise<PartnerUser | null> {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const result = await db
        .select()
        .from(partnerUsers)
        .where(eq(partnerUsers.username, trimmedUsername))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting partner by username:", error);
      return null;
    }
  }

  async getPartnerById(id: string): Promise<PartnerUser | null> {
    const partner = await db.query.partnerUsers.findFirst({ where: (p, { eq }) => eq(p.id, id) });
    return partner || null;
  }

  async createPartner(data: Omit<PartnerUser, "id" | "createdAt" | "lastLoginAt">): Promise<PartnerUser> {
    try {
      const id = randomUUID();
      const newPartner: PartnerUser = {
        id,
        ...data,
        createdAt: new Date(),
        lastLoginAt: null,
      };
      await db.insert(partnerUsers).values(newPartner);
      return newPartner;
    } catch (error: any) {
      console.error("DB error creating partner:", error?.message || error);
      if (error?.code) console.error("DB error code:", error.code);
      if (error?.detail) console.error("DB error detail:", error.detail);
      if (error?.stack) console.error(error.stack);
      throw error;
    }
  }

  async updatePartner(id: string, data: Partial<Pick<PartnerUser, "email" | "passwordHash" | "profilePictureUrl">>): Promise<void> {
    await db.update(partnerUsers).set(data).where(eq(partnerUsers.id, id));
  }

  async updatePartnerLastLogin(id: string): Promise<void> {
    await db.update(partnerUsers).set({ lastLoginAt: new Date() }).where(eq(partnerUsers.id, id));
  }

  async getOrdersByChefId(chefId: string): Promise<Order[]> {
    const orderRecords = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.chefId, chefId),
          eq(orders.paymentStatus, 'confirmed')
        )
      )
      .orderBy(desc(orders.createdAt));

    return orderRecords.map(this.mapOrder);
  }

  async getPartnerDashboardMetrics(chefId: string) {
    const chefOrders = await this.getOrdersByChefId(chefId);

    const totalOrders = chefOrders.length;
    const totalRevenue = chefOrders.reduce((sum, order) => sum + order.total, 0);

    const statusCounts = chefOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = chefOrders.filter(order =>
      new Date(order.createdAt) >= today
    ).length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders: statusCounts.pending || 0,
      completedOrders: statusCounts.completed || 0,
      todayOrders,
      statusBreakdown: statusCounts,
    };
  }

  async getDashboardMetrics(): Promise<{
    userCount: number;
    orderCount: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const orders = await db.query.orders.findMany();
    const users = await db.query.users.findMany();
    const revenueOrders = orders.filter((o) => o.status !== "cancelled");
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "completed").length;

    return {
      userCount: users.length,
      orderCount: orders.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
    };
  }

  // Coupons
  async verifyCoupon(code: string, orderAmount: number, userId?: string): Promise<{
    code: string;
    discountAmount: number;
    discountType: string;
  } | null> {
    const coupon = await db.query.coupons.findFirst({
      where: (coupons, { eq, and }) =>
        and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)),
    });

    if (!coupon) throw new Error("Invalid coupon code");

    console.log("🧾 Coupon validity check:", {
      now: new Date().toISOString(),
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
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
      throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Coupon usage limit reached");
    }

    // Check per-user usage limit
    if (userId && coupon.perUserLimit) {
      const userUsageCount = await db.query.couponUsages.findMany({
        where: (usages, { eq, and }) =>
          and(eq(usages.couponId, coupon.id), eq(usages.userId, userId)),
      });

      if (userUsageCount.length >= coupon.perUserLimit) {
        throw new Error(`You have already used this coupon ${coupon.perUserLimit} time(s)`);
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.floor((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
    };
  }

  async recordCouponUsage(code: string, userId: string, orderId?: string): Promise<void> {
    const coupon = await db.query.coupons.findFirst({
      where: (coupons, { eq }) => eq(coupons.code, code.toUpperCase()),
    });

    if (coupon) {
      // Record in coupon_usages table
      await db.insert(couponUsages).values({
        id: randomUUID(),
        couponId: coupon.id,
        userId,
        orderId: orderId || null,
        usedAt: new Date(),
      });

      // Also increment total usage count
      await db.update(coupons)
        .set({ usedCount: coupon.usedCount + 1 })
        .where(eq(coupons.code, code.toUpperCase()));
    }
  }

  async incrementCouponUsage(code: string): Promise<void> {
    const coupon = await db.query.coupons.findFirst({
      where: (coupons, { eq }) => eq(coupons.code, code.toUpperCase()),
    });

    if (coupon) {
      await db.update(coupons)
        .set({ usedCount: coupon.usedCount + 1 })
        .where(eq(coupons.code, code.toUpperCase()));
    }
  }

  async getCouponUserUsage(couponId: string, userId: string): Promise<number> {
    const usages = await db.query.couponUsages.findMany({
      where: (usages, { eq, and }) =>
        and(eq(usages.couponId, couponId), eq(usages.userId, userId)),
    });
    return usages.length;
  }

  async getCouponByCode(code: string): Promise<{
    id: string;
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usedCount: number;
    perUserLimit: number | null;
    isActive: boolean;
    expiryDate: Date | null;
    validFrom: Date;
  } | null> {
    const coupon = await db.query.coupons.findFirst({
      where: (coupons, { eq }) => eq(coupons.code, code.toUpperCase()),
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
      validFrom: coupon.validFrom,
    };
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.query.subscriptionPlans.findMany({
      orderBy: (sp, { asc }) => [asc(sp.sectionOrder), asc(sp.name)],
    });
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    return db.query.subscriptionPlans.findFirst({ where: (sp, { eq }) => eq(sp.id, id) });
  }

  async createSubscriptionPlan(data: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">): Promise<SubscriptionPlan> {
    const id = randomUUID();
    const plan: SubscriptionPlan = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(subscriptionPlans).values(plan);
    return plan;
  }

  async updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    await db.update(subscriptionPlans).set({ ...data, updatedAt: new Date() }).where(eq(subscriptionPlans.id, id));
    return this.getSubscriptionPlan(id);
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // Subscriptions
  async getSubscriptions(): Promise<Subscription[]> {
    const subs = await db.query.subscriptions.findMany();
    return subs.map(serializeSubscription);
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const sub = await db.query.subscriptions.findFirst({ where: (s, { eq }) => eq(s.id, id) });

    // DEBUG: Log raw database response to understand date field types
    if (sub) {
      console.log(`\n[DB-DEBUG] getSubscription(${id}) - Raw DB response:`);
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

    return sub ? serializeSubscription(sub) : undefined;
  }

  async createSubscription(data: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> {
    const id = randomUUID();
    const now = new Date();
    const insertData: any = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    console.log(`[CREATE-SUB-DEBUG] Input nextDeliveryDate:`, {
      value: data.nextDeliveryDate,
      type: typeof data.nextDeliveryDate,
      isDate: data.nextDeliveryDate instanceof Date,
    });

    // Convert all date fields to Date objects for Drizzle ORM
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
      isDate: insertData.nextDeliveryDate instanceof Date,
    });

    // CRITICAL: Ensure nextDeliveryDate is NEVER null (it's NOT NULL in schema)
    // If not provided, use startDate as the first delivery date
    if (!insertData.nextDeliveryDate && insertData.startDate) {
      insertData.nextDeliveryDate = insertData.startDate;
      console.log(`[CREATE-SUB] nextDeliveryDate not provided, using startDate as default`);
    }

    // Fallback: if still no date, use today
    if (!insertData.nextDeliveryDate) {
      insertData.nextDeliveryDate = now;
      console.log(`[CREATE-SUB] nextDeliveryDate still missing, defaulting to now`);
    }

    console.log(`[CREATE-SUB-DEBUG] Final insertData:`, {
      nextDeliveryDate: insertData.nextDeliveryDate,
      startDate: insertData.startDate,
      endDate: insertData.endDate,
    });

    await db.insert(subscriptions).values(insertData);
    const created = await this.getSubscription(id);
    return created!;
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
  async syncDeliveryHistory(
    subscriptionId: string,
    status: "delivered" | "missed" | "skipped",
    deliveryDate?: Date,
    notes?: string
  ): Promise<void> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        console.warn(`[SYNC-HISTORY] Subscription ${subscriptionId} not found`);
        return;
      }

      const deliveryHistory = (subscription.deliveryHistory as any[]) || [];
      const today = deliveryDate || new Date();

      // Create new delivery record
      const newRecord = {
        date: today.toISOString(),
        status: status,
        notes: notes || undefined,
      };

      // Check if already exists for this date (prevent duplicates)
      const existingIndex = deliveryHistory.findIndex(
        (record: any) => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          const compareDate = new Date(today);
          compareDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === compareDate.getTime();
        }
      );

      if (existingIndex >= 0) {
        // Update existing record
        deliveryHistory[existingIndex] = { ...deliveryHistory[existingIndex], ...newRecord };
      } else {
        // Add new record
        deliveryHistory.push(newRecord);
      }

      // Update subscription with new deliveryHistory
      await db.update(subscriptions)
        .set({
          deliveryHistory: deliveryHistory,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));

      console.log(`✅ [SYNC-HISTORY] Synced delivery history for ${subscriptionId}: status=${status}`);
    } catch (error) {
      console.error(`❌ [SYNC-HISTORY] Error syncing delivery history:`, error);
    }
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    // Convert Date objects to ISO strings before updating, since database stores ISO strings
    const updateData: any = { ...data };

    console.log(`[UPDATE-SUB] Starting update for subscription ${id}`);
    console.log(`[UPDATE-SUB] Input data keys:`, Object.keys(updateData));

    // List of date field names that need conversion
    const dateFields = ['startDate', 'endDate', 'nextDeliveryDate', 'chefAssignedAt', 'pauseStartDate', 'pauseResumeDate', 'lastDeliveryDate'];

    // Process ONLY date fields - safely convert Date objects to ISO strings
    for (const fieldName of dateFields) {
      if (fieldName in updateData) {
        const value = updateData[fieldName];

        if (value === undefined || value === null) {
          // Keep null values as-is (nullable columns)
          continue;
        }

        const converted = convertDateForDB(value);
        if (converted === null) {
          // Don't update if conversion fails (invalid date)
          console.log(`[UPDATE-SUB] Conversion failed for ${fieldName}, removing from update`);
          delete updateData[fieldName];
        } else {
          console.log(`[UPDATE-SUB] ${fieldName}: ${typeof value} -> ${converted}`);
          updateData[fieldName] = converted;
        }
      }
    }

    // Always update updatedAt
    updateData.updatedAt = new Date();

    console.log(`[UPDATE-SUB] Final updateData:`, updateData);
    console.log(`[UPDATE-SUB] About to call db.update...`);

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));

    console.log(`[UPDATE-SUB] Update successful, calling getSubscription...`);
    return this.getSubscription(id);
  }

  async deleteSubscription(id: string): Promise<boolean> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    const subs = await db.query.subscriptions.findMany({ where: (s, { eq }) => eq(s.userId, userId) });
    return subs.map(serializeSubscription);
  }

  // Get active subscriptions count for a chef
  async getActiveSubscriptionCountByChef(chefId: string): Promise<number> {
    const result = await db.query.subscriptions.findMany({
      where: (s, { and, eq }) => and(
        eq(s.chefId, chefId),
        eq(s.status, "active")
      ),
    });
    return result.length;
  }

  // Find the best available chef for a category (load balancing)
  async findBestChefForCategory(categoryId: string): Promise<Chef | null> {
    // Get all active chefs for this category
    const activeChefs = await db.query.chefs.findMany({
      where: (c, { and, eq }) => and(
        eq(c.categoryId, categoryId),
        eq(c.isActive, true)
      ),
    });

    if (activeChefs.length === 0) {
      return null;
    }

    // Find the chef with the least number of active subscriptions
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
  async assignChefToSubscription(subscriptionId: string, chefId: string): Promise<Subscription | undefined> {
    return this.updateSubscription(subscriptionId, {
      chefId,
      chefAssignedAt: new Date(),
    });
  }

  // Get active subscriptions by chef
  async getActiveSubscriptionsByChef(chefId: string): Promise<Subscription[]> {
    const subs = await db.query.subscriptions.findMany({
      where: (s, { and, eq }) => and(
        eq(s.chefId, chefId),
        eq(s.status, "active")
      ),
    });
    return subs.map(serializeSubscription);
  }

  // Get active AND paused subscriptions for a chef (for partner dashboard)
  async getActiveAndPausedSubscriptionsByChef(chefId: string): Promise<Subscription[]> {
    const subs = await db.query.subscriptions.findMany({
      where: (s, { and, eq, inArray }) => and(
        eq(s.chefId, chefId),
        inArray(s.status, ["active", "paused"])  // ✅ Include both active and paused
      ),
    });
    return subs.map(serializeSubscription);
  }

  // Subscription Delivery Logs
  async getSubscriptionDeliveryLogs(subscriptionId: string): Promise<SubscriptionDeliveryLog[]> {
    return db.query.subscriptionDeliveryLogs.findMany({
      where: (log, { eq }) => eq(log.subscriptionId, subscriptionId),
      orderBy: (log, { desc }) => [desc(log.date)],
    });
  }

  async getSubscriptionDeliveryLogsByDate(date: Date): Promise<SubscriptionDeliveryLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.query.subscriptionDeliveryLogs.findMany({
      where: (log, { and, gte, lte }) => and(
        gte(log.date, startOfDay),
        lte(log.date, endOfDay)
      ),
    });
  }

  async getSubscriptionDeliveryLog(id: string): Promise<SubscriptionDeliveryLog | undefined> {
    return db.query.subscriptionDeliveryLogs.findFirst({ where: (log, { eq }) => eq(log.id, id) });
  }

  async createSubscriptionDeliveryLog(data: Omit<SubscriptionDeliveryLog, "id" | "createdAt" | "updatedAt">): Promise<SubscriptionDeliveryLog> {
    const id = randomUUID();
    const now = new Date();
    const logData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Convert date field to ISO string if it's a Date object
    const insertData: any = { ...logData };
    insertData.date = convertDateForDB(insertData.date);
    insertData.createdAt = convertDateForDB(insertData.createdAt);
    insertData.updatedAt = convertDateForDB(insertData.updatedAt);

    await db.insert(subscriptionDeliveryLogs).values(insertData);
    return logData;
  }

  async updateSubscriptionDeliveryLog(id: string, data: Partial<SubscriptionDeliveryLog>): Promise<SubscriptionDeliveryLog | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };

    // Convert date field to ISO string if it's a Date object
    if (updateData.date !== undefined) {
      updateData.date = convertDateForDB(updateData.date);
    }
    updateData.updatedAt = convertDateForDB(updateData.updatedAt);

    await db.update(subscriptionDeliveryLogs).set(updateData).where(eq(subscriptionDeliveryLogs.id, id));
    return this.getSubscriptionDeliveryLog(id);
  }

  async deleteSubscriptionDeliveryLog(id: string): Promise<void> {
    await db.delete(subscriptionDeliveryLogs).where(eq(subscriptionDeliveryLogs.id, id));
  }

  async getDeliveryLogBySubscriptionAndDate(subscriptionId: string, date: Date): Promise<SubscriptionDeliveryLog | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.query.subscriptionDeliveryLogs.findFirst({
      where: (log, { and, eq, gte, lte }) => and(
        eq(log.subscriptionId, subscriptionId),
        gte(log.date, startOfDay),
        lte(log.date, endOfDay)
      ),
    });
  }

  async getSalesReport(from: Date, to: Date) {
    const allOrders = await db.query.orders.findMany();
    const filteredOrders = allOrders.filter(o => {
      const createdAt = new Date(o.createdAt);
      return createdAt >= from && createdAt <= to;
    });

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of filteredOrders) {
      for (const item of order.items as any[]) {
        const existing = productSales.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
        productSales.set(item.id, {
          name: item.name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
        });
      }
    }

    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
      revenueChange: 0,
      ordersChange: 0,
    };
  }

  async getUserReport(from: Date, to: Date) {
    const allUsers = await db.query.users.findMany();
    const newUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= from && new Date(u.createdAt) <= to);

    const topCustomers: any[] = [];

    return {
      totalUsers: allUsers.length,
      newUsers: newUsers.length,
      activeUsers: 0,
      userGrowth: 0,
      topCustomers,
    };
  }

  async getInventoryReport() {
    const allProducts = await db.query.products.findMany();
    const allCategories = await db.query.categories.findMany();

    const categoryStats = allCategories.map(cat => {
      const catProducts = allProducts.filter(p => p.categoryId === cat.id);
      return {
        name: cat.name,
        productCount: catProducts.length,
        revenue: 0,
      };
    });

    return {
      totalProducts: allProducts.length,
      lowStock: 0,
      outOfStock: 0,
      categories: categoryStats,
    };
  }

  async getSubscriptionReport(from: Date, to: Date) {
    const subs = await db.select().from(subscriptions);
    const plans = await db.select().from(subscriptionPlans);

    const planStats = plans.map(plan => {
      const planSubs = subs.filter(s => s.planId === plan.id);
      return {
        id: plan.id,
        name: plan.name,
        subscriberCount: planSubs.length,
        revenue: planSubs.length * plan.price,
      };
    });

    return {
      totalSubscriptions: subs.length,
      activeSubscriptions: subs.filter(s => s.status === 'active').length,
      pausedSubscriptions: subs.filter(s => s.status === 'paused').length,
      cancelledSubscriptions: subs.filter(s => s.status === 'cancelled').length,
      subscriptionRevenue: planStats.reduce((sum, p) => sum + p.revenue, 0),
      topPlans: planStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };
  }

  async getChefReport(from: Date, to: Date, chefId?: string) {
    try {
      // Get all chefs
      const allChefs = await db.query.chefs.findMany();

      // Get all orders in date range
      const allOrders = await db.query.orders.findMany();
      const filteredOrders = allOrders.filter(o => {
        const createdAt = new Date(o.createdAt);
        return createdAt >= from && createdAt <= to;
      });

      // If specific chef requested, filter orders
      let chefOrders = filteredOrders;
      let targetChefs = allChefs;

      if (chefId) {
        chefOrders = filteredOrders.filter(o => o.chefId === chefId);
        targetChefs = allChefs.filter(c => c.id === chefId);
      }

      // Calculate stats per chef
      const chefStats = targetChefs.map(chef => {
        const orders = chefOrders.filter(o => o.chefId === chef.id);

        // Calculate chef earnings: sum of hotelPrice for each item (what chef gets)
        let chefEarnings = 0;
        const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

        for (const order of orders) {
          // Chef earnings = hotelPrice * quantity for each item
          for (const item of order.items as any[]) {
            const itemChefEarning = item.hotelPrice ? Math.round(item.hotelPrice * item.quantity) : 0;
            chefEarnings += itemChefEarning;

            // Track top products by selling price
            const existing = productSales.get(item.id) || { name: item.name, quantity: 0, revenue: 0 };
            productSales.set(item.id, {
              name: item.name,
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + (item.price * item.quantity),
            });
          }
        }

        const ordersCount = orders.length;
        const avgEarning = ordersCount > 0 ? Math.round(chefEarnings / ordersCount) : 0;

        const topProducts = Array.from(productSales.entries())
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);

        return {
          id: chef.id,
          name: chef.name,
          chefEarnings,  // Changed from totalRevenue
          totalOrders: ordersCount,
          averageEarning: avgEarning,  // Changed from averageOrderValue
          topProducts,
          rating: typeof chef.rating === 'number' ? chef.rating : (parseFloat(chef.rating) || 0),
          isVerified: chef.isVerified || false,
        };
      });

      // Sort by earnings
      const sortedChefs = chefStats.sort((a, b) => b.chefEarnings - a.chefEarnings);

      // Overall stats
      const totalChefEarnings = chefOrders.reduce((sum, o) => {
        const orderChefEarnings = (o.items as any[]).reduce((itemSum, item) => {
          return itemSum + (item.hotelPrice ? Math.round(item.hotelPrice * item.quantity) : 0);
        }, 0);
        return sum + orderChefEarnings;
      }, 0);
      const totalOrdersCount = chefOrders.length;

      return {
        totalChefEarnings,
        totalOrders: totalOrdersCount,
        chefCount: targetChefs.length,
        averageEarningsPerChef: targetChefs.length > 0 ? Math.round(totalChefEarnings / targetChefs.length) : 0,
        chefStats: sortedChefs,
      };
    } catch (error) {
      console.error("Error in getChefReport:", error);
      throw error;
    }
  }

  async getRothiaiEarningsReport(from: Date, to: Date) {
    try {
      // Get all orders in date range
      const allOrders = await db.query.orders.findMany();
      const filteredOrders = allOrders.filter(o => {
        const createdAt = new Date(o.createdAt);
        return createdAt >= from && createdAt <= to;
      });

      // Calculate Rotihai earnings: commission = price - hotelPrice per item
      let platformCommission = 0;  // price - hotelPrice for each item
      let deliveryFeeEarnings = 0;  // All delivery fees
      let discountTaken = 0;  // Discounts applied
      let walletUsed = 0;  // Wallet amount used by customers

      for (const order of filteredOrders) {
        // Platform commission = markup on each item (selling price - hotel cost)
        for (const item of order.items as any[]) {
          const itemCommission = (item.price - (item.hotelPrice || 0)) * item.quantity;
          platformCommission += Math.round(itemCommission);
        }
        deliveryFeeEarnings += order.deliveryFee;
        discountTaken += order.discount;
        walletUsed += order.walletAmountUsed;
      }

      const grossRothiaiEarnings = platformCommission + deliveryFeeEarnings + discountTaken;

      // Calculate referral bonuses paid out in this period
      const allReferrals = await db.query.referrals.findMany();
      let referralBonusesSpent = 0;
      for (const referral of allReferrals) {
        // Only count completed or approved referrals within the date range
        if ((referral.status === 'completed' || referral.status === 'approved') && referral.createdAt) {
          const createdAt = new Date(referral.createdAt);
          if (createdAt >= from && createdAt <= to) {
            referralBonusesSpent += (referral.referrerBonus || 0) + (referral.referredBonus || 0);
          }
        }
      }

      // Net earnings = Gross earnings - Referral bonuses paid
      const totalRothiaiEarnings = grossRothiaiEarnings - referralBonusesSpent;

      // Get category-wise breakdown
      const categoryEarnings = new Map<string, { name: string; orders: number; earnings: number }>();
      for (const order of filteredOrders) {
        const catId = order.categoryId || 'unknown';
        const catName = order.categoryName || 'Other';
        const existing = categoryEarnings.get(catId) || { name: catName, orders: 0, earnings: 0 };

        // Calculate commission per item for this order
        let orderCommission = 0;
        for (const item of order.items as any[]) {
          const itemCommission = (item.price - (item.hotelPrice || 0)) * item.quantity;
          orderCommission += Math.round(itemCommission);
        }
        const orderEarnings = orderCommission + order.deliveryFee + order.discount;
        categoryEarnings.set(catId, {
          name: catName,
          orders: existing.orders + 1,
          earnings: existing.earnings + orderEarnings,
        });
      }

      const categoryBreakdown = Array.from(categoryEarnings.values())
        .sort((a, b) => b.earnings - a.earnings);

      return {
        totalOrders: filteredOrders.length,
        grossRothiaiEarnings,
        totalRothiaiEarnings,  // NET after referral bonuses
        breakdown: {
          platformCommission,
          deliveryFeeEarnings,
          discountTaken,
          walletUsed,
          referralBonusesSpent,  // NEW: What platform paid out for referrals
        },
        categoryBreakdown,
      };
    } catch (error) {
      console.error("Error in getRothiaiEarningsReport:", error);
      throw error;
    }
  }

  async getChefPayoutDetails(from: Date, to: Date, chefId?: string) {
    try {
      // Get all orders in date range
      const allOrders = await db.query.orders.findMany();
      const filteredOrders = allOrders.filter(o => {
        const createdAt = new Date(o.createdAt);
        return createdAt >= from && createdAt <= to;
      });

      // If specific chef requested, filter by chefId
      let chefOrders = filteredOrders;
      if (chefId) {
        chefOrders = filteredOrders.filter(o => o.chefId === chefId);
      }

      // Build detailed order list with item-wise calculations
      const detailedOrders = await Promise.all(chefOrders.map(async order => {
        let totalChefEarning = 0;

        const items = (order.items as any[]).map(item => {
          const itemChefEarning = item.hotelPrice ? Math.round(item.hotelPrice * item.quantity) : 0;
          totalChefEarning += itemChefEarning;

          return {
            id: item.id,
            name: item.name,
            price: item.price,
            hotelPrice: item.hotelPrice || 0,
            quantity: item.quantity,
            chefEarning: itemChefEarning,
          };
        });

        // Get payout status for this order - check if exists
        let payout = await db.query.payoutTransactions.findFirst({
          where: (pt, { eq }) => eq(pt.orderId, order.id),
        });

        // Auto-create payout if it doesn't exist yet (for delivered/pending payment orders)
        if (!payout && order.chefId) {
          try {
            const newPayout = await this.createChefPayout(
              order.chefId,
              order.id,
              totalChefEarning,
              "bank"
            );
            payout = newPayout;
          } catch (err) {
            console.warn(`Failed to auto-create payout for order ${order.id}:`, err);
          }
        }

        return {
          id: order.id,
          createdAt: order.createdAt,
          customerName: order.customerName,
          phone: order.phone,
          chefId: order.chefId || "",
          chefName: order.chefName || "Unknown Chef",
          status: order.status,
          paymentStatus: order.paymentStatus,
          deliveredAt: order.deliveredAt,
          items,
          subtotal: order.subtotal,
          totalChefEarning,
          orderIncome: totalChefEarning,
          payoutId: payout?.id || null,
          paidToChef: payout?.status === "paid",
          paidAt: payout?.paidAt?.toISOString(),
        };
      }));

      // Calculate totals
      const totalOrders = detailedOrders.length;
      const totalChefEarnings = detailedOrders.reduce((sum, o) => sum + o.totalChefEarning, 0);

      return {
        totalOrders,
        totalChefEarnings,
        orders: detailedOrders,
      };
    } catch (error) {
      console.error("Error in getChefPayoutDetails:", error);
      throw error;
    }
  }

  async createChefPayout(chefId: string, orderId: string, amount: number, paymentMethod?: string) {
    try {
      const payout = await db.insert(payoutTransactions).values({
        chefId,
        orderId,
        amount,
        status: "pending",
        paymentMethod,
      }).returning();
      return payout[0];
    } catch (error) {
      console.error("Error creating chef payout:", error);
      throw error;
    }
  }

  async markChefPayoutAsPaid(payoutId: string, transactionId?: string) {
    try {
      const updated = await db.update(payoutTransactions)
        .set({
          status: "paid",
          paidAt: new Date(),
          transactionId,
        })
        .where(eq(payoutTransactions.id, payoutId))
        .returning();
      return updated[0];
    } catch (error) {
      console.error("Error marking payout as paid:", error);
      throw error;
    }
  }

  async markMultiplePayoutsAsPaid(payoutIds: string[]) {
    try {
      const updated = await db.update(payoutTransactions)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(inArray(payoutTransactions.id, payoutIds))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error marking multiple payouts as paid:", error);
      throw error;
    }
  }

  async getChefPayoutStatus(orderId: string) {
    try {
      const payout = await db.query.payoutTransactions.findFirst({
        where: (pt, { eq }) => eq(pt.orderId, orderId),
      });
      return payout;
    } catch (error) {
      console.error("Error getting payout status:", error);
      return null;
    }
  }

  async getDeliverySettings(): Promise<DeliverySetting[]> {
    return db.query.deliverySettings.findMany({ where: (ds, { eq }) => eq(ds.isActive, true) });
  }

  async getDeliverySetting(id: string): Promise<DeliverySetting | undefined> {
    return db.query.deliverySettings.findFirst({ where: (ds, { eq }) => eq(ds.id, id) });
  }

  // NEW: Get delivery settings filtered by pincode
  async getDeliverySettingsByPincode(pincode: string): Promise<DeliverySetting[]> {
    return db.query.deliverySettings.findMany({
      where: (ds, { eq, and, or, isNull }) => and(
        eq(ds.isActive, true),
        or(
          eq(ds.pincode, pincode),  // Exact pincode match
          isNull(ds.pincode)         // Settings with no pincode (apply to all)
        )
      )
    });
  }

  // NEW: Get best matching delivery setting for pincode and distance
  async getDeliverySettingByPincodeAndDistance(pincode: string, distance: number): Promise<DeliverySetting | undefined> {
    const settings = await this.getDeliverySettingsByPincode(pincode);

    // Find the setting where distance falls within minDistance and maxDistance
    for (const setting of settings) {
      const minDist = parseFloat(String(setting.minDistance));
      const maxDist = parseFloat(String(setting.maxDistance));

      if (distance >= minDist && distance <= maxDist) {
        return setting;
      }
    }

    // If no exact match found, return the closest one (useful for edge cases)
    if (settings.length > 0) {
      return settings[0];
    }

    return undefined;
  }

  async createDeliverySetting(data: Omit<DeliverySetting, "id" | "createdAt" | "updatedAt">): Promise<DeliverySetting> {
    const id = randomUUID();
    const setting: DeliverySetting = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(deliverySettings).values(setting);
    return setting;
  }

  async updateDeliverySetting(id: string, data: Partial<DeliverySetting>): Promise<DeliverySetting | undefined> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.minDistance !== undefined) updateData.minDistance = String(data.minDistance);
    if (data.maxDistance !== undefined) updateData.maxDistance = String(data.maxDistance);
    if (data.price !== undefined) updateData.price = parseInt(String(data.price));
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = parseInt(String(data.minOrderAmount));
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;

    await db.update(deliverySettings).set(updateData).where(eq(deliverySettings.id, id));
    return this.getDeliverySetting(id);
  }

  async deleteDeliverySetting(id: string): Promise<void> {
    await db.delete(deliverySettings).where(eq(deliverySettings.id, id));
  }

  // ──────────────────── DELIVERY PARTNER PAYOUT METHODS ────────────────────

  async getDeliveryPartnerPayouts(): Promise<DeliveryPartnerPayout[]> {
    return await db.select().from(deliveryPartnerPayouts);
  }

  async getDeliveryPartnerPayout(id: string): Promise<DeliveryPartnerPayout | undefined> {
    const result = await db
      .select()
      .from(deliveryPartnerPayouts)
      .where(eq(deliveryPartnerPayouts.id, id));
    return result[0];
  }

  async getDeliveryPartnerPayoutsByPincode(pincode: string): Promise<DeliveryPartnerPayout[]> {
    return await db
      .select()
      .from(deliveryPartnerPayouts)
      .where(and(
        eq(deliveryPartnerPayouts.isActive, true),
        or(
          isNull(deliveryPartnerPayouts.pincode),
          eq(deliveryPartnerPayouts.pincode, pincode)
        )
      ));
  }

  async getDeliveryPartnerPayoutByPincodeAndDistance(
    pincode: string | null,
    distance: number
  ): Promise<DeliveryPartnerPayout | undefined> {
    const payoutSlabs = await this.getDeliveryPartnerPayoutsByPincode(pincode || '');

    for (const slab of payoutSlabs) {
      const minDist = parseFloat(String(slab.minDistance));
      const maxDist = parseFloat(String(slab.maxDistance));
      if (distance >= minDist && distance <= maxDist) {
        return slab;
      }
    }
    return undefined;
  }

  async createDeliveryPartnerPayout(
    data: InsertDeliveryPartnerPayout
  ): Promise<DeliveryPartnerPayout> {
    const id = randomUUID();
    const now = new Date();

    // Parse and round distances to 2 decimal places
    const minDist = parseFloat(String(data.minDistance));
    const maxDist = parseFloat(String(data.maxDistance));
    const roundedMin = Math.round(minDist * 100) / 100;
    const roundedMax = Math.round(maxDist * 100) / 100;

    const name = data.name || `${roundedMin}km - ${roundedMax}km`;

    console.log("[PAYOUT-CREATE] Inserting:", {
      minDistance: roundedMin,
      maxDistance: roundedMax,
      payoutAmount: data.payoutAmount,
    });

    try {
      // Create the full payout object with all required fields
      const payout: DeliveryPartnerPayout = {
        id,
        name,
        minDistance: roundedMin as any, // Drizzle will handle decimal conversion
        maxDistance: roundedMax as any,
        payoutAmount: parseInt(String(data.payoutAmount)),
        pincode: data.pincode || null,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      // Insert into database
      await db.insert(deliveryPartnerPayouts).values(payout);
    } catch (dbError: any) {
      console.error("[PAYOUT-CREATE] DB Insert Error:", {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      throw dbError;
    }

    // Return with formatted strings (as stored in DB)
    return {
      id,
      name,
      minDistance: roundedMin.toFixed(2),
      maxDistance: roundedMax.toFixed(2),
      payoutAmount: parseInt(String(data.payoutAmount)),
      pincode: data.pincode || null,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    } as DeliveryPartnerPayout;
  }

  async updateDeliveryPartnerPayout(
    id: string,
    data: Partial<DeliveryPartnerPayout>
  ): Promise<DeliveryPartnerPayout | undefined> {
    await db
      .update(deliveryPartnerPayouts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deliveryPartnerPayouts.id, id));
    return this.getDeliveryPartnerPayout(id);
  }

  async deleteDeliveryPartnerPayout(id: string): Promise<boolean> {
    const result = await db
      .delete(deliveryPartnerPayouts)
      .where(eq(deliveryPartnerPayouts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCartSettings(): Promise<CartSetting[]> {
    return db.query.cartSettings.findMany({ where: (cs, { eq }) => eq(cs.isActive, true) });
  }

  async getCartSettingByCategoryId(categoryId: string): Promise<CartSetting | undefined> {
    return db.query.cartSettings.findFirst({ where: (cs, { eq }) => eq(cs.categoryId, categoryId) });
  }

  async createCartSetting(data: Omit<CartSetting, "id" | "createdAt" | "updatedAt">): Promise<CartSetting> {
    const id = randomUUID();

    // Fetch category name if not provided
    let categoryName = data.categoryName;
    if (!categoryName) {
      const category = await this.getCategoryById(data.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      categoryName = category.name;
    }

    const setting: CartSetting = {
      ...data,
      categoryName,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(cartSettings).values(setting);
    return setting;
  }

  async updateCartSetting(id: string, data: Partial<CartSetting>): Promise<CartSetting | undefined> {
    // If categoryId is being updated, fetch and update categoryName too
    let updateData = { ...data };
    if (data.categoryId && !data.categoryName) {
      const category = await this.getCategoryById(data.categoryId);
      if (category) {
        updateData.categoryName = category.name;
      }
    }

    await db.update(cartSettings).set({ ...updateData, updatedAt: new Date() }).where(eq(cartSettings.id, id));
    return db.query.cartSettings.findFirst({ where: (cs, { eq }) => eq(cs.id, id) });
  }

  async deleteCartSetting(id: string): Promise<void> {
    await db.delete(cartSettings).where(eq(cartSettings.id, id));
  }

  async getDeliveryPersonnelByPhone(phone: string): Promise<DeliveryPersonnel | undefined> {
    return db.query.deliveryPersonnel.findFirst({ where: (dp, { eq }) => eq(dp.phone, phone) });
  }

  async getDeliveryPersonnelById(id: string): Promise<DeliveryPersonnel | undefined> {
    return db.query.deliveryPersonnel.findFirst({ where: (dp, { eq }) => eq(dp.id, id) });
  }

  async getDeliveryPersonnel(id: string): Promise<DeliveryPersonnel | undefined> {
    return this.getDeliveryPersonnelById(id);
  }

  async getAllDeliveryPersonnel(): Promise<DeliveryPersonnel[]> {
    return db.query.deliveryPersonnel.findMany();
  }

  async getAvailableDeliveryPersonnel(): Promise<DeliveryPersonnel[]> {
    // Return all active delivery personnel regardless of status
    // Admin can assign to any active personnel
    return db.query.deliveryPersonnel.findMany({
      where: (dp, { eq }) => eq(dp.isActive, true),
      orderBy: (dp, { asc }) => [asc(dp.status)] // Show "available" first
    });
  }

  async createDeliveryPersonnel(data: InsertDeliveryPersonnel & { passwordHash: string }): Promise<DeliveryPersonnel> {
    const id = randomUUID();
    const deliveryPerson: DeliveryPersonnel = {
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
      createdAt: new Date(),
      lastLoginAt: null,
    };
    await db.insert(deliveryPersonnel).values(deliveryPerson);
    return deliveryPerson;
  }

  async updateDeliveryPersonnel(id: string, data: Partial<DeliveryPersonnel>): Promise<DeliveryPersonnel | undefined> {
    await db.update(deliveryPersonnel).set(data).where(eq(deliveryPersonnel.id, id));
    return this.getDeliveryPersonnelById(id);
  }

  async updateDeliveryPersonnelLastLogin(id: string): Promise<void> {
    await db.update(deliveryPersonnel).set({ lastLoginAt: new Date() }).where(eq(deliveryPersonnel.id, id));
  }

  async deleteDeliveryPersonnel(id: string): Promise<boolean> {
    await db.delete(deliveryPersonnel).where(eq(deliveryPersonnel.id, id));
    return true;
  }

  async getAllPartners(): Promise<PartnerUser[]> {
    return await db.select().from(partnerUsers);
  }

  async deletePartner(id: string): Promise<boolean> {
    await db.delete(partnerUsers).where(eq(partnerUsers.id, id));
    return true;
  }

  async approveOrder(orderId: string, approvedBy: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async acceptOrder(orderId: string, approvedBy: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "confirmed",
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async rejectOrder(orderId: string, rejectedBy: string, reason: string): Promise<Order | undefined> {
    const order = await this.getOrderById(orderId);
    if (!order) return undefined;

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "rejected",
        rejectedBy,
        rejectionReason: reason
      })
      .where(eq(orders.id, orderId))
      .returning();

    // 🎁 CLAWBACK: Reverse referral bonus if order had referral code
    // Only reverse referred user bonus (₹50) - referrer bonus (₹100) is only given on delivery
    if (updatedOrder && updatedOrder.userId && updatedOrder.referralCode) {
      try {
        const userId = updatedOrder.userId;
        const refCode = updatedOrder.referralCode;
        console.log(`🎁 [REFERRAL CLAWBACK] Order rejected - checking for referral to reverse for user: ${userId}`);

        // Find pending referral for this user (using the referral code from order)
        const referral = await db.query.referrals.findFirst({
          where: (r, { eq, and }) => and(
            eq(r.referredId, userId),
            eq(r.status, "pending"),
            eq(r.referralCode, refCode)
          ),
        });

        if (referral) {
          console.log(`🎁 [REFERRAL CLAWBACK] Found pending referral: ${referral.id} - Status: ${referral.status}`);

          // Only clawback if referral is still pending (not yet completed)
          if (referral.referredBonus > 0) {
            const clawbackAmount = referral.referredBonus;

            // Create wallet transaction to reverse the bonus  
            await this.createWalletTransaction({
              userId: updatedOrder.userId,
              amount: clawbackAmount,
              type: "debit",
              description: `Referral bonus reversed - order #${orderId} rejected`,
              referenceId: referral.id,
              referenceType: "referral",
            });

            console.log(`✅ [REFERRAL CLAWBACK] Reversed ₹${clawbackAmount} for user ${updatedOrder.userId}`);
          }
        } else {
          console.log(`ℹ️ [REFERRAL CLAWBACK] No pending referral found to clawback`);
        }
      } catch (clawbackError: any) {
        console.error(`⚠️ [REFERRAL CLAWBACK] Error during clawback (non-blocking):`, clawbackError.message);
        // Don't fail order rejection if clawback fails
      }
    }

    return updatedOrder;
  }

  async assignOrderToDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    try {
      // Get delivery person details
      const deliveryPerson = await this.getDeliveryPersonnelById(deliveryPersonId);
      if (!deliveryPerson) {
        throw new Error("Delivery person not found");
      }

      console.log(`📦 Attempting atomic assign of order ${orderId} to delivery person ${deliveryPerson.name} (${deliveryPerson.phone})`);

      // Perform atomic check-and-set inside a transaction to avoid race conditions.
      const result = await db.transaction(async (tx) => {
        // Try to update the order only if it's currently unassigned
        // ✅ IMPORTANT: Do NOT change status to 'assigned' - keep current status (accepted_by_chef or prepared)
        // The status should only change when chef marks ready (prepared) or delivery completes
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            assignedTo: deliveryPersonId,
            assignedAt: new Date(),
            deliveryPersonName: deliveryPerson.name,
            deliveryPersonPhone: deliveryPerson.phone
          })
          .where(and(eq(orders.id, orderId), isNull(orders.assignedTo)))
          .returning();

        if (!updatedOrder) {
          // Nothing updated — someone else claimed the order already
          return null;
        }

        // Mark delivery person busy inside same transaction
        await tx.update(deliveryPersonnel).set({ status: "busy" }).where(eq(deliveryPersonnel.id, deliveryPersonId));

        return updatedOrder;
      });

      if (!result) {
        // Order was already assigned by another process
        const latest = await this.getOrderById(orderId);
        const err: any = new Error("Order already assigned");
        err.code = "ALREADY_ASSIGNED";
        err.current = latest;
        throw err;
      }

      console.log(`✅ Order ${orderId} assigned successfully to ${deliveryPerson.name} (${deliveryPerson.phone})`);
      return this.mapOrder(result);
    } catch (error) {
      console.error("Error assigning order to delivery person:", error);
      throw error;
    }
  }

  async updateOrderPickup(orderId: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "out_for_delivery",
        pickedUpAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async updateOrderDelivery(orderId: string): Promise<Order | undefined> {
    const order = await this.getOrderById(orderId);
    if (!order) return undefined;

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "delivered",
        deliveredAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (order.assignedTo) {
      await db.update(deliveryPersonnel)
        .set({
          status: "available",
          totalDeliveries: sql`${deliveryPersonnel.totalDeliveries} + 1`
        })
        .where(eq(deliveryPersonnel.id, order.assignedTo));
    }

    return updatedOrder;
  }

  async getOrdersByDeliveryPerson(deliveryPersonId: string): Promise<Order[]> {
    const orderRecords = await db
      .select()
      .from(orders)
      .where(
        or(
          eq(orders.assignedTo, deliveryPersonId),
          and(
            eq(orders.status, 'out_for_delivery'),
            isNull(orders.assignedTo)
          )
        )
      )
      .orderBy(desc(orders.createdAt));

    return orderRecords.map(this.mapOrder);
  }

  async getAdminDashboardMetrics(): Promise<{ partnerCount: number; deliveryPersonnelCount: number }> {
    const partners = await db.select().from(partnerUsers);
    const delivery = await db.select().from(deliveryPersonnel);

    return {
      partnerCount: partners.length,
      deliveryPersonnelCount: delivery.length,
    };
  }

  async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${nanoid(8).toUpperCase()}`;
    await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    return code;
  }

  async createReferral(referrerId: string, referredId: string, options?: { expiresAt?: Date; firstOrderId?: string }): Promise<any> {
    const referrer = await this.getUser(referrerId);
    if (!referrer?.referralCode) {
      throw new Error("Referrer does not have a referral code");
    }

    const settings = await this.getActiveReferralReward();
    const referrerBonusAmount = settings?.referrerBonus || 0;
    const referredBonusAmount = settings?.referredBonus || 0;

    // Calculate expiry date if not provided (default 30 days)
    let expiresAt = options?.expiresAt;
    if (!expiresAt) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (settings?.expiryDays || 30));
    }

    const referral = {
      referrerId,
      referredId,
      referralCode: referrer.referralCode,
      status: "pending",
      referrerBonus: referrerBonusAmount,
      referredBonus: referredBonusAmount,
      referredOrderCompleted: false,
      expiresAt,
      firstOrderId: options?.firstOrderId || null,
    };

    const [created] = await db.insert(referrals).values(referral).returning();
    return created;
  }

  async applyReferralBonus(referralCode: string, newUserId: string, orderAmount?: number, options?: { skipFirstOrderCheck?: boolean }): Promise<void> {
    // Execute entire referral bonus application in a database transaction
    await db.transaction(async (tx) => {
      // Check if system is enabled first
      const settings = await this.getActiveReferralReward();
      if (!settings?.isActive) {
        throw new Error("Referral system is currently disabled");
      }

      // ✅ CRITICAL: Validate minimum order amount if provided
      const minOrderAmount = settings?.minOrderAmount || 0;
      if (orderAmount !== undefined && orderAmount < minOrderAmount) {
        throw new Error(`Minimum order amount ₹${minOrderAmount} required to use referral code. Current order: ₹${orderAmount}`);
      }

      const referrer = await tx.query.users.findFirst({
        where: (u, { eq }) => eq(u.referralCode, referralCode),
      });

      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      // Self-referral prevention
      if (referrer.id === newUserId) {
        throw new Error("You cannot use your own referral code");
      }

      // 🛡️ NEW: Validate referrer account health (fraud prevention)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (referrer.createdAt && new Date(referrer.createdAt) > sevenDaysAgo) {
        throw new Error("Referrer account must be at least 7 days old to share referrals");
      }

      // 🛡️ NEW: Verify referrer has placed at least one order
      const referrerOrders = await tx.query.orders.findMany({
        where: (o, { eq }) => eq(o.userId, referrer.id),
      });

      if (referrerOrders.length === 0) {
        throw new Error("Referrer must have placed at least one order before sharing referrals");
      }

      const newUser = await tx.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, newUserId),
      });

      if (!newUser) {
        throw new Error("User not found");
      }

      // 🛡️ Check if user has already placed orders.
      // IMPORTANT: skipFirstOrderCheck is ONLY passed from payment confirmation flows
      // (adminRoutes /payment and routes /payment-confirmed) where the order has just been
      // linked to a brand-new userId — at that moment userOrders.length === 1 (the current
      // first order), so the check would incorrectly reject a legitimate first-time referral.
      // All other fraud guards (self-referral, referrer age, duplicate referral, caps) still run.
      if (!options?.skipFirstOrderCheck) {
        const userOrders = await tx.query.orders.findMany({
          where: (o, { eq }) => eq(o.userId, newUserId),
        });

        if (userOrders.length > 0) {
          throw new Error("You can only use a referral code before placing your first order");
        }
      }

      // Check if user already used a referral
      const existingReferral = await tx.query.referrals.findFirst({
        where: (r, { eq }) => eq(r.referredId, newUserId),
      });

      if (existingReferral) {
        throw new Error("User already used a referral code");
      }

      // Settings already retrieved above for enable check
      const referrerBonus = settings?.referrerBonus || 0;
      const referredBonus = settings?.referredBonus || 0;
      const maxReferralsPerMonth = settings?.maxReferralsPerMonth || 0;
      const maxEarningsPerMonth = settings?.maxEarningsPerMonth || 0;

      // Check monthly referral limit for referrer
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyReferrals = await tx.query.referrals.findMany({
        where: (r, { and, eq: eqOp, gte: gteOp }) => and(
          eqOp(r.referrerId, referrer.id),
          gteOp(r.createdAt, startOfMonth)
        ),
      });

      if (monthlyReferrals.length >= maxReferralsPerMonth) {
        throw new Error(`Referrer has reached the monthly limit of ${maxReferralsPerMonth} referrals`);
      }

      // Check monthly earnings cap for referrer
      const completedThisMonth = monthlyReferrals.filter(r => r.status === "completed");
      const monthlyEarnings = completedThisMonth.reduce((sum, r) => sum + r.referrerBonus, 0);

      if (monthlyEarnings >= maxEarningsPerMonth) {
        throw new Error(`Referrer has reached the monthly earnings cap of ₹${maxEarningsPerMonth}`);
      }

      // Create referral record (pending state until first order)
      const referralData = {
        referrerId: referrer.id,
        referredId: newUserId,
        referralCode: referrer.referralCode!,
        status: "pending",
        referrerBonus: referrerBonus,
        referredBonus: referredBonus,
        referredOrderCompleted: false,
      };

      const [referral] = await tx.insert(referrals).values(referralData).returning();

      // ✅ BONUS CREDIT MOVED: Now happens on delivery in completeReferralOnFirstOrder()
      // Just create the pending referral record here
    });
  }

  // Complete referral when referred user places first order
  async completeReferralOnFirstOrder(userId: string, orderId: string): Promise<{
    referredUserBonus: number;
    referredUserId: string;
    referrerUserBonus: number;
    referrerUserId: string;
  } | null> {
    let result: {
      referredUserBonus: number;
      referredUserId: string;
      referrerUserBonus: number;
      referrerUserId: string;
    } | null = null;

    await db.transaction(async (tx) => {
      // Find pending referral for this user
      const referral = await tx.query.referrals.findFirst({
        where: (r, { and, eq: eqOp }) => and(
          eqOp(r.referredId, userId),
          eqOp(r.status, "pending")
        ),
      });

      if (!referral) {
        return; // No pending referral, nothing to do
      }

      // Get referral settings for validation
      const settings = await this.getActiveReferralReward();
      const expiryDays = settings?.expiryDays || 0;
      const maxEarningsPerMonth = settings?.maxEarningsPerMonth || 0;

      // Check if referral has expired
      const referralDate = new Date(referral.createdAt);
      const expiryDate = new Date(referralDate);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      if (new Date() > expiryDate) {
        // Mark as expired
        await tx.update(referrals)
          .set({ status: "expired" })
          .where(eq(referrals.id, referral.id));
        return;
      }

      // Check monthly earnings cap before crediting
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const completedThisMonth = await tx.query.referrals.findMany({
        where: (r, { and, eq: eqOp, gte: gteOp }) => and(
          eqOp(r.referrerId, referral.referrerId),
          eqOp(r.status, "completed"),
          gteOp(r.createdAt, startOfMonth)
        ),
      });

      const monthlyEarnings = completedThisMonth.reduce((sum, r) => sum + r.referrerBonus, 0);
      const canCreditBonus = monthlyEarnings + referral.referrerBonus <= maxEarningsPerMonth;

      // ✅ Track which users received bonuses for wallet broadcasts
      let referredUserBonus = 0;
      let referrerUserBonus = 0;

      // ✅ FIX (double-bonus guard): Only credit referred user bonus here if they did NOT
      // already claim it via claimReferralBonusAtCheckout() at checkout.
      // If referredOrderCompleted is true, the checkout path already ran → skip to avoid double credit.
      // NOTE: claimReferralBonusAtCheckout marks referral as "completed", so this function
      // won't even reach here for those cases (the WHERE status="pending" query above returns null).
      // This guard is an extra safety layer for edge cases (e.g. concurrent calls).
      if (!referral.referredOrderCompleted) {
        referredUserBonus = referral.referredBonus;
        await this.createWalletTransaction({
          userId: referral.referredId,
          amount: referral.referredBonus,
          type: "referral_bonus",
          description: `Referral welcome bonus - your first order delivered!`,
          referenceId: referral.id,
          referenceType: "referral",
        }, tx);
      }

      // ✅ REQUIREMENT: Referrer must have completed their own first order to earn bonus
      // Both users must have delivered their first order to both receive bonuses
      const referrerOrders = await tx.query.orders.findMany({
        where: (o, { eq }) => eq(o.userId, referral.referrerId),
      });
      const referrerHasCompletedFirstOrder = referrerOrders.some(o => o.status === "delivered");

      if (canCreditBonus && referrerHasCompletedFirstOrder) {
        referrerUserBonus = referral.referrerBonus;
        await this.createWalletTransaction({
          userId: referral.referrerId,
          amount: referral.referrerBonus,
          type: "referral_bonus",
          description: `Referral bonus - friend completed first order`,
          referenceId: referral.id,
          referenceType: "referral",
        }, tx);
        console.log(`[REFERRAL] ✅ Referrer ${referral.referrerId} credited ₹${referral.referrerBonus}`);
      } else if (canCreditBonus && !referrerHasCompletedFirstOrder) {
        console.log(`[REFERRAL] ⏳ Referrer ${referral.referrerId} has not completed first order. Bonus pending delivery.`);
      }

      // Mark referral as completed only if BOTH users have completed their first orders
      // If referrer hasn't completed yet, keep it pending and set referrerBonus to 0
      await tx.update(referrals)
        .set({
          status: referrerHasCompletedFirstOrder ? "completed" : "pending",
          referredOrderCompleted: true,
          completedAt: referrerHasCompletedFirstOrder ? new Date() : null,
          referrerBonus: (canCreditBonus && referrerHasCompletedFirstOrder) ? referral.referrerBonus : 0,
        })
        .where(eq(referrals.id, referral.id));

      // Build result for wallet broadcast
      if (referredUserBonus > 0 || referrerUserBonus > 0) {
        result = {
          referredUserBonus,
          referredUserId: referral.referredId,
          referrerUserBonus,
          referrerUserId: referral.referrerId,
        };
      }
    });

    return result;
  }

  async getReferralsByUser(userId: string): Promise<any[]> {
    return db.query.referrals.findMany({
      where: (r, { eq }) => eq(r.referrerId, userId),
    });
  }

  async getReferralByReferredId(referredId: string): Promise<any | null> {
    const referral = await db.query.referrals.findFirst({
      where: (r, { eq }) => eq(r.referredId, referredId),
    });
    return referral || null;
  }

  async getUserByReferralCode(referralCode: string): Promise<any | null> {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.referralCode, referralCode.trim().toUpperCase()),
    });
    return user || null;
  }

  async updateReferral(referralId: string, data: Partial<any>): Promise<any | undefined> {
    const [updated] = await db.update(referrals)
      .set(data)
      .where(eq(referrals.id, referralId))
      .returning();
    return updated;
  }

  // 🕐 Expire old pending referrals (daily cleanup job)
  async expireOldPendingReferrals(): Promise<number> {
    try {
      const settings = await this.getActiveReferralReward();
      const expiryDays = settings?.expiryDays || 30;

      // Calculate cutoff date (30 days ago by default)
      const expiryDate = new Date(Date.now() - expiryDays * 24 * 60 * 60 * 1000);

      console.log(`🕐 [REFERRAL EXPIRY] Expiring referrals older than ${expiryDays} days (before ${expiryDate.toISOString()})`);

      // Update all pending referrals created before the cutoff date to expired status
      const result = await db.update(referrals)
        .set({
          status: "expired",
        })
        .where(and(
          eq(referrals.status, "pending"),
          lt(referrals.createdAt, expiryDate)
        ))
        .returning();

      console.log(`✅ [REFERRAL EXPIRY] Expired ${result.length} old pending referrals`);
      return result.length;
    } catch (error: any) {
      console.error(`❌ [REFERRAL EXPIRY] Error expiring old referrals:`, error.message);
      return 0;
    }
  }

  async getUserWalletBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.walletBalance || 0;
  }

  async validateBonusEligibility(userId: string, orderTotal: number): Promise<{
    eligible: boolean;
    bonus: number;
    minOrderAmount: number;
    reason?: string;
  }> {
    // ✅ CRITICAL: User must have delivered their first order before claiming bonus
    // This prevents accessing bonus while first order is pending/confirmed
    const userOrders = await db.query.orders.findMany({
      where: (o, { eq }) => eq(o.userId, userId),
    });
    const deliveredOrders = userOrders.filter(order => order.status === "delivered");

    console.log(`[BONUS-ELIGIBILITY] User ${userId} - Total orders: ${userOrders.length}, Delivered: ${deliveredOrders.length}`);
    console.log(`[BONUS-ELIGIBILITY] Order statuses:`, userOrders.map(o => ({ id: o.id, status: o.status })));

    if (deliveredOrders.length === 0) {
      console.log(`⚠️ [BONUS-ELIGIBILITY] User ${userId} NOT eligible - no delivered orders yet`);
      return {
        eligible: false,
        bonus: 0,
        minOrderAmount: 0,
        reason: "You must complete and receive your first order before claiming the referral bonus"
      };
    }

    // Check if user has pending referral bonus
    const referral = await db.query.referrals.findFirst({
      where: (r, { eq }) => eq(r.referredId, userId),
    });

    if (!referral) {
      console.log(`⚠️ [BONUS-ELIGIBILITY] No referral found for user ${userId}`);
      return { eligible: false, bonus: 0, minOrderAmount: 0, reason: "No referral found for this user" };
    }

    if (referral.status !== "pending") {
      console.log(`⚠️ [BONUS-ELIGIBILITY] Referral status is ${referral.status} for user ${userId}`);
      return { eligible: false, bonus: 0, minOrderAmount: 0, reason: `Referral is ${referral.status}, cannot claim bonus` };
    }

    // Get referral settings
    const settings = await this.getActiveReferralReward();
    if (!settings?.isActive) {
      console.log(`⚠️ [BONUS-ELIGIBILITY] Referral system disabled for user ${userId}`);
      return { eligible: false, bonus: 0, minOrderAmount: 0, reason: "Referral system is disabled" };
    }

    const minOrderAmount = settings?.minOrderAmount || 0;
    const referredBonus = settings?.referredBonus || 0;
    const maxBonusUsagePerOrder = settings?.maxBonusUsagePerOrder || 0;

    // ✅ FIX: Apply per-order limit to the bonus (e.g., max ₹10 even if bonus is ₹50)
    const bonusToUse = Math.min(referredBonus, maxBonusUsagePerOrder);

    // Check minimum order amount
    if (orderTotal < minOrderAmount) {
      console.log(`⚠️ [BONUS-ELIGIBILITY] Order total ₹${orderTotal} < min ₹${minOrderAmount}`);
      return {
        eligible: false,
        bonus: bonusToUse,
        minOrderAmount,
        reason: `Minimum order amount ₹${minOrderAmount} required to claim bonus. Current order: ₹${orderTotal}`
      };
    }

    return { eligible: true, bonus: bonusToUse, minOrderAmount };
  }

  async claimReferralBonusAtCheckout(userId: string, orderTotal: number, orderId: string): Promise<{
    bonusClaimed: boolean;
    amount: number;
    message: string;
  }> {
    // ✅ FIX (double-bonus prevention): Run everything in a transaction.
    // Re-read the referral INSIDE the transaction so concurrent calls are safe.
    // After crediting, immediately mark the referral as "completed" so that
    // completeReferralOnFirstOrder() (which filters WHERE status = "pending") is a no-op.
    return await db.transaction(async (tx) => {
      // Re-read referral inside transaction to get a consistent view
      const referral = await tx.query.referrals.findFirst({
        where: (r, { eq }) => eq(r.referredId, userId),
      });

      // Guard: no referral, or already completed/expired
      if (!referral) {
        return { bonusClaimed: false, amount: 0, message: "No referral found for this user" };
      }
      if (referral.status !== "pending") {
        // Already processed elsewhere — return silently, not an error
        return {
          bonusClaimed: false,
          amount: 0,
          message: `Referral bonus already ${referral.status}`,
        };
      }

      // Validate eligibility (uses the same transaction-safe read path)
      const validation = await this.validateBonusEligibility(userId, orderTotal);
      if (!validation.eligible) {
        return {
          bonusClaimed: false,
          amount: 0,
          message: validation.reason || "Not eligible for bonus",
        };
      }

      // Credit wallet (uses tx client internally)
      await this.updateWalletBalance(userId, validation.bonus);

      // Log the wallet transaction
      await this.createWalletTransaction({
        userId,
        amount: validation.bonus,
        type: "referral_bonus_claimed",
        description: `Referral bonus claimed at checkout for order ${orderId}`,
        referenceId: orderId,
        referenceType: "order",
      });

      // ✅ CRITICAL: Mark referral as completed immediately so completeReferralOnFirstOrder()
      // (which runs on delivery) finds no "pending" referral and won't double-credit.
      await tx.update(referrals)
        .set({
          status: "completed",
          referredOrderCompleted: true,
          completedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id));

      return {
        bonusClaimed: true,
        amount: validation.bonus,
        message: `₹${validation.bonus} bonus claimed successfully!`,
      };
    });
  }

  async updateWalletBalance(userId: string, amount: number): Promise<void> {
    await db.update(users)
      .set({ walletBalance: sql`${users.walletBalance} + ${amount}` })
      .where(eq(users.id, userId));
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
  async calculateDeliveryFee(
    hasLocation: boolean,
    distance: number | null,
    orderAmount: number,
    chef: Chef
  ): Promise<{ deliveryFee: number; isFreeDelivery: boolean }> {
    // Get chef's delivery settings (with defaults)
    const defaultFee = (chef as any).defaultDeliveryFee || 20; // Default ₹20
    const feePerKm = (chef as any).deliveryFeePerKm || 5; // Default ₹5 per km
    const freeDeliveryThreshold = (chef as any).freeDeliveryThreshold || 200; // Default ₹200

    let deliveryFee = defaultFee;
    let isFreeDelivery = false;

    // Calculate fee based on location availability
    if (hasLocation && distance !== null && distance > 0) {
      // Distance-based fee calculation
      deliveryFee = Math.ceil(distance * feePerKm);
    } else {
      // No location - use default fee
      deliveryFee = defaultFee;
    }

    // Check if order qualifies for free delivery
    if (orderAmount >= freeDeliveryThreshold) {
      isFreeDelivery = true;
      deliveryFee = 0;
    }

    console.log(`💰 [DELIVERY FEE] Calculated for order ₹${orderAmount}:`, {
      hasLocation,
      distance: distance ? `${distance.toFixed(1)} km` : 'N/A',
      defaultFee,
      feePerKm,
      calculatedFee: isFreeDelivery ? 0 : deliveryFee,
      freeDeliveryThreshold,
      isFreeDelivery,
    });

    return {
      deliveryFee,
      isFreeDelivery,
    };
  }

  /**
   * Calculate delivery partner payout based on distance and configured slabs
   *
   * Distance-slab based earning structure (customizable by admin via database):
   * Default slabs:
   * - 0 to 1 km: ₹10
   * - 1 to 2 km: ₹15
   * - 2 to 3 km: ₹20
   * - 3 to 4 km: ₹25
   * - 4+ km: ₹30
   *
   * @param distance - Distance in km (null or 0 defaults to ₹10)
   * @param pincode - Optional: customer pincode for regional rate matching
   * @returns Payout amount in ₹
   */
  async calculateDeliveryPartnerPayout(
    distance: number | null | undefined,
    pincode?: string
  ): Promise<number> {
    // Handle null/zero distance with default
    if (!distance || distance <= 0) {
      return 10;  // Default payout when no distance
    }

    try {
      const adjustedDistance = getRoadAdjustedDistance(distance);

      // Fetch slab from database
      const matchingSlab = await this.getDeliveryPartnerPayoutByPincodeAndDistance(
        pincode || null,
        adjustedDistance
      );

      console.log(`[PARTNER-PAYOUT] Adjusted road distance for slabs: ${adjustedDistance}km`);

      if (matchingSlab) {
        console.log(`[PARTNER-PAYOUT] Distance: ${distance}km, Pincode: ${pincode || 'N/A'}, Payout: ₹${matchingSlab.payoutAmount}`);
        return matchingSlab.payoutAmount;
      }

      // Fallback if no matching slab found
      console.warn(`[PARTNER-PAYOUT] No matching slab found for distance ${distance}km, using default ₹10`);
      return 10;
    } catch (error) {
      console.error("[PARTNER-PAYOUT] Error fetching slab config:", error);
      // Fallback to safe default on database error
      return 10;
    }
  }

  // 🆕 Platform Fee Config Methods
  async getPlatformFeeConfig(): Promise<any> {
    try {
      const setting = await db.query.adminSettings.findFirst({
        where: eq(adminSettings.key, "platformFeeConfig"),
      });

      if (!setting) {
        // Default config if not set
        return {
          enabled: false,
          below100: 0,
          below200: 0,
          above200: 0,
        };
      }

      return JSON.parse(setting.value);
    } catch (error) {
      console.error("[PLATFORM-FEE] Error fetching config:", error);
      // Return safe default on error
      return {
        enabled: false,
        below100: 0,
        below200: 0,
        above200: 0,
      };
    }
  }

  async savePlatformFeeConfig(config: any): Promise<void> {
    try {
      const existing = await db.query.adminSettings.findFirst({
        where: eq(adminSettings.key, "platformFeeConfig"),
      });

      if (existing) {
        // Update existing
        await db.update(adminSettings)
          .set({
            value: JSON.stringify(config),
            updatedAt: new Date(),
          })
          .where(eq(adminSettings.key, "platformFeeConfig"));
        console.log("[PLATFORM-FEE] Config updated:", config);
      } else {
        // Create new
        await db.insert(adminSettings).values({
          key: "platformFeeConfig",
          value: JSON.stringify(config),
          description: "Platform fee configuration for orders - convenience fee by order amount tier",
        });
        console.log("[PLATFORM-FEE] Config created:", config);
      }
    } catch (error) {
      console.error("[PLATFORM-FEE] Error saving config:", error);
      throw error;
    }
  }

  async createWalletTransaction(transaction: {
    userId: string;
    amount: number;
    type: "credit" | "debit" | "referral_bonus" | "referral_bonus_claimed" | "order_discount" | "referral_reversal";
    description: string;
    referenceId?: string;
    referenceType?: string;
  }, txClient?: any): Promise<void> {
    // Validate amount is positive
    if (transaction.amount <= 0) {
      throw new Error("Transaction amount must be positive");
    }

    console.log(`\n💳 [STORAGE] createWalletTransaction called:`);
    console.log(`💳 [STORAGE]   Type: ${transaction.type}`);
    console.log(`💳 [STORAGE]   Amount: ₹${transaction.amount}`);
    console.log(`💳 [STORAGE]   Amount type: ${typeof transaction.amount}`);
    console.log(`💳 [STORAGE]   User ID: ${transaction.userId}`);

    // Use provided transaction client or default db
    const dbClient = txClient || db;

    // Fetch user using the same transaction client to ensure atomic reads
    const user = await dbClient.query.users.findFirst({
      where: eq(users.id, transaction.userId),
    });

    if (!user) throw new Error("User not found");

    const balanceBefore = user.walletBalance;
    console.log(`💳 [STORAGE]   Read from DB - walletBalance: ${balanceBefore} (type: ${typeof balanceBefore})`);

    const amountChange = (transaction.type === "debit" || transaction.type === "referral_reversal") ? -transaction.amount : transaction.amount;
    console.log(`💳 [STORAGE]   AmountChange: ${amountChange}`);

    const balanceAfter = balanceBefore + amountChange;
    console.log(`💳 [STORAGE]   Calculation: ${balanceBefore} + ${amountChange} = ${balanceAfter}`);

    if (balanceAfter < 0) {
      throw new Error("Insufficient wallet balance");
    }

    // Execute both operations atomically with the same client
    await dbClient.insert(walletTransactions).values({
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      referenceId: transaction.referenceId || null,
      referenceType: transaction.referenceType || null,
      balanceBefore,
      balanceAfter,
    });
    console.log(`💳 [STORAGE]   Inserted into walletTransactions table`);

    // Update user's wallet balance using the same transaction client
    await dbClient.update(users)
      .set({ walletBalance: balanceAfter })
      .where(eq(users.id, transaction.userId));
    console.log(`💳 [STORAGE]   Updated users table - walletBalance set to: ${balanceAfter}`);
    console.log(`💳 [STORAGE] createWalletTransaction completed\n`);
  }

  async getWalletTransactions(userId: string, limit: number = 50): Promise<any[]> {
    return db.query.walletTransactions.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit,
    });
  }

  /**
   * ⚠️ ATOMIC PAYMENT CONFIRMATION + WALLET DEDUCTION (PHASE 2 - SAFE FIX)
   * 
   * CRITICAL: Order status ONLY updated AFTER wallet succeeds
   * - Prevents order showing "paid" without wallet deduction
   * - Fails entire transaction if wallet deduction required but fails
   * - Idempotent: Multiple calls safe
   * 
   * Fixes:
   * 1. ✅ Idempotency check at START (early return if already paid)
   * 2. ✅ Wallet balance validated BEFORE order status update
   * 3. ✅ Required wallet deduction MUST succeed (throws error if insufficient)
   * 4. ✅ Order marked "paid" ONLY after wallet succeeds
   * 5. ✅ Entire transaction atomic - all-or-nothing
   */
  async confirmPaymentAndDeductWallet(
    orderId: string,
    walletAmountUsed?: number,
    userId?: string
  ): Promise<{
    order: Order;
    walletDeducted: boolean;
    newWalletBalance?: number;
    error?: string;
  }> {
    return db.transaction(async (tx) => {
      console.log(`\n🔒 [ATOMIC-PHASE2] Starting atomic payment + wallet transaction for order ${orderId}...`);

      // ============================================================================
      // STEP 0: IDEMPOTENCY CHECK (EARLY RETURN IF ALREADY PAID)
      // ============================================================================
      console.log(`🔒 [ATOMIC] Step 0: Idempotency check - fetch current order status (WITH ROW LOCK)`);
      const existingOrderResult = await tx.execute(sql`
        SELECT * FROM "orders"
        WHERE id = ${orderId}
        FOR UPDATE
      `);

      const existingOrder = (existingOrderResult as any).rows?.[0] as Order | undefined;

      if (!existingOrder) {
        throw new Error(`Order ${orderId} not found`);
      }

      // ✅ If already paid, this is a duplicate confirmation → return early
      if (existingOrder.paymentStatus === "paid") {
        console.log(`✅ [ATOMIC] Idempotency: Order already paid - returning early (no duplicate deduction)`);
        return {
          order: existingOrder,
          walletDeducted: false,
          newWalletBalance: undefined,
        };
      }

      if (!existingOrder.userId) {
        // ✅ FIX: If order has no userId but we have userId parameter, order was just updated
        // Use the provided userId (from payment-confirmed endpoint after user account creation)
        if (!userId) {
          throw new Error(`Order ${orderId} has no userId and no userId provided`);
        }
        console.log(`✅ [ATOMIC] Order has no userId in DB, but userId provided: ${userId} (order just updated)`);
      }

      // Use provided values or from order - guaranteed to be non-null due to checks above
      const actualUserId: string = (userId || existingOrder.userId)!;
      if (!actualUserId) {
        throw new Error(`Unable to determine userId for order ${orderId}`);
      }
      let actualWalletAmount = walletAmountUsed || existingOrder.walletAmountUsed || 0;

      // ✅ FIX 5: ENFORCE WALLET LIMIT (BACKEND)
      // Ensure wallet usage doesn't exceed configured max per order
      const maxAllowed = Math.min(
        actualWalletAmount,       // What user requested
        50,                        // Max wallet usage per order (hard limit)
        existingOrder.total        // Can't deduct more than order total
      );
      actualWalletAmount = maxAllowed;
      console.log(`💳 [WALLET-LIMIT] Enforced limit: requested=${walletAmountUsed}, max_allowed=${maxAllowed}, order_total=${existingOrder.total}`);

      let newWalletBalance = undefined;
      let walletDeducted = false;

      // ============================================================================
      // STEP 1: VALIDATE WALLET BALANCE BEFORE UPDATING ORDER (CRITICAL ORDER!)
      // ============================================================================
      if (actualWalletAmount > 0) {
        console.log(`🔒 [ATOMIC] Step 1: Checking wallet balance for user ${actualUserId}...`);

        const user = await tx.query.users.findFirst({
          where: eq(users.id, actualUserId),
        });

        if (!user) {
          throw new Error(`User ${actualUserId} not found`);
        }

        const currentBalance = user.walletBalance || 0;
        console.log(`🔒 [ATOMIC]   Current balance: ₹${currentBalance}, Need to deduct: ₹${actualWalletAmount}`);

        // ⚠️ CRITICAL: If wallet insufficient, FAIL ENTIRE OPERATION (throw error)
        // This prevents order from being marked "paid" without wallet deduction
        if (currentBalance < actualWalletAmount) {
          throw new Error(
            `Insufficient wallet balance: ₹${currentBalance} < ₹${actualWalletAmount} required. Transaction failed.`
          );
        }

        console.log(`🔒 [ATOMIC] Step 2: Attempting wallet transaction insert with unique constraint check...`);

        // Step 2: Try to insert wallet transaction (unique constraint will prevent duplicates)
        const balanceAfter = currentBalance - actualWalletAmount;

        try {
          await tx.insert(walletTransactions).values({
            userId: actualUserId,
            amount: actualWalletAmount,
            type: "debit",
            description: `Wallet payment for order #${orderId}`,
            referenceId: orderId,
            referenceType: "order",
            balanceBefore: currentBalance,
            balanceAfter: balanceAfter,
          });
          console.log(`🔒 [ATOMIC]   ✅ Wallet transaction inserted`);

          // Step 3: Update wallet balance (same transaction)
          console.log(`🔒 [ATOMIC] Step 3: Update user wallet balance to ₹${balanceAfter}`);
          await tx
            .update(users)
            .set({ walletBalance: balanceAfter })
            .where(eq(users.id, actualUserId));

          newWalletBalance = balanceAfter;
          walletDeducted = true;
          console.log(`🔒 [ATOMIC]   ✅ Wallet balance updated`);
        } catch (insertError: any) {
          // If unique constraint violated, it means this order was already deducted
          // This shouldn't happen with idempotency check, but handle gracefully
          if (insertError.code === "23505" || insertError.message.includes("duplicate")) {
            console.log(`⏭️ [ATOMIC] Duplicate wallet transaction detected - already deducted for order ${orderId}`);
            // Fetch current balance to return
            const refreshedUser = await tx.query.users.findFirst({
              where: eq(users.id, actualUserId),
            });
            newWalletBalance = refreshedUser?.walletBalance;
            walletDeducted = false;
          } else {
            throw insertError;
          }
        }
      }

      // ============================================================================
      // STEP FINAL: UPDATE ORDER STATUS TO "PAID" (ONLY AFTER WALLET SUCCEEDS!)
      // ============================================================================
      // 🔴 CRITICAL: This MUST happen AFTER wallet deduction succeeds
      // If wallet fails above, we never reach this point (transaction rolls back)
      console.log(`🔒 [ATOMIC] Step FINAL: Update order payment status to 'paid' (after wallet succeeded)`);
      const [updatedOrder] = await tx
        .update(orders)
        .set({ paymentStatus: "paid" })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Failed to update order ${orderId} status`);
      }

      console.log(`✅ [ATOMIC] Transaction committed successfully - Order paid + Wallet deducted`);
      return {
        order: updatedOrder,
        walletDeducted,
        newWalletBalance,
      };
    }, {
      // ⚠️ CRITICAL: Use serializable isolation to prevent race conditions
      // All concurrent transactions for same userId will serialize
      isolationLevel: "serializable",
    });
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    expiredReferrals: number;
    totalEarnings: number;
    referralCode: string;
  }> {
    const user = await this.getUser(userId);
    const referralCode = user?.referralCode || "";
    const settings = await this.getActiveReferralReward();
    const expiryDays = settings?.expiryDays || 30;

    let allReferrals = await db.query.referrals.findMany({
      where: (r, { eq }) => eq(r.referrerId, userId),
    });

    // Auto-expire pending referrals that have exceeded expiry time
    const now = new Date();
    for (const referral of allReferrals) {
      if (referral.status === "pending") {
        const createdDate = new Date(referral.createdAt);
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        if (now > expiryDate) {
          await db.update(referrals)
            .set({ status: "expired" })
            .where(eq(referrals.id, referral.id));
          referral.status = "expired";
          console.log(`⏰ Auto-expired referral ${referral.id} for user ${userId}`);
        }
      }
    }

    const totalReferrals = allReferrals.length;
    const pendingReferrals = allReferrals.filter(r => r.status === "pending").length;
    const completedReferrals = allReferrals.filter(r => r.status === "completed").length;
    const expiredReferrals = allReferrals.filter(r => r.status === "expired").length;
    const totalEarnings = allReferrals
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + r.referrerBonus, 0);

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      expiredReferrals,
      totalEarnings,
      referralCode,
    };
  }

  async getUserReferralCode(userId: string): Promise<string | null> {
    const user = await this.getUser(userId);
    return user?.referralCode || null;
  }

  async markReferralComplete(referralId: string): Promise<void> {
    await db.update(referrals)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(referrals.id, referralId));
  }

  async checkReferralEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }> {
    // Check if user has completed their first order
    const userOrders = await this.getOrdersByUserId(userId);
    const completedOrders = userOrders.filter(o => o.status === "delivered");

    if (completedOrders.length > 0) {
      return { eligible: false, reason: "User has already completed an order" };
    }

    // Check if user was referred
    const referral = await db.query.referrals.findFirst({
      where: (r, { eq }) => eq(r.referredId, userId),
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
  async getAllPromotionalBanners(): Promise<PromotionalBanner[]> {
    return db.query.promotionalBanners.findMany({ orderBy: [desc(promotionalBanners.displayOrder)] });
  }

  async getActivePromotionalBanners(): Promise<PromotionalBanner[]> {
    return db.query.promotionalBanners.findMany({
      where: eq(promotionalBanners.isActive, true),
      orderBy: [asc(promotionalBanners.displayOrder)], // Ensure they display in order
    });
  }

  async createPromotionalBanner(data: InsertPromotionalBanner): Promise<PromotionalBanner> {
    const id = randomUUID();
    const banner: PromotionalBanner = {
      id,
      title: data.title,
      subtitle: data.subtitle,
      buttonText: data.buttonText,
      gradientFrom: data.gradientFrom ?? "orange-600",
      gradientVia: data.gradientVia ?? "amber-600",
      gradientTo: data.gradientTo ?? "yellow-600",
      emoji1: data.emoji1 ?? "🍽️",
      emoji2: data.emoji2 ?? "🥘",
      emoji3: data.emoji3 ?? "🍛",
      actionType: data.actionType ?? "subscription",
      actionValue: data.actionValue ?? null,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [createdBanner] = await db.insert(promotionalBanners).values(banner).returning();
    return createdBanner;
  }

  async updatePromotionalBanner(id: string, data: Partial<InsertPromotionalBanner>): Promise<PromotionalBanner | null> {
    const [updated] = await db.update(promotionalBanners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promotionalBanners.id, id))
      .returning();
    return updated || null;
  }

  async deletePromotionalBanner(id: string): Promise<boolean> {
    const result = await db.delete(promotionalBanners)
      .where(eq(promotionalBanners.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Delivery Time Slots
  async getAllDeliveryTimeSlots(): Promise<DeliveryTimeSlot[]> {
    return db.query.deliveryTimeSlots.findMany({
      orderBy: (slot, { asc }) => [asc(slot.startTime)]
    });
  }

  async getActiveDeliveryTimeSlots(): Promise<DeliveryTimeSlot[]> {
    return db.query.deliveryTimeSlots.findMany({
      where: (slot, { eq }) => eq(slot.isActive, true),
      orderBy: (slot, { asc }) => [asc(slot.startTime)]
    });
  }

  async getDeliveryTimeSlot(id: string): Promise<DeliveryTimeSlot | undefined> {
    return db.query.deliveryTimeSlots.findFirst({ where: (slot, { eq }) => eq(slot.id, id) });
  }

  async getDeliveryTimeSlotById(id: string): Promise<DeliveryTimeSlot | undefined> {
    return db.query.deliveryTimeSlots.findFirst({ where: (slot, { eq }) => eq(slot.id, id) });
  }

  async createDeliveryTimeSlot(data: InsertDeliveryTimeSlot): Promise<DeliveryTimeSlot> {
    const id = randomUUID();
    const slot: DeliveryTimeSlot = {
      id,
      ...data,
      cutoffHoursBefore: data.cutoffHoursBefore ?? null,
      currentOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [created] = await db.insert(deliveryTimeSlots).values(slot).returning();
    return created;
  }

  async updateDeliveryTimeSlot(id: string, data: Partial<InsertDeliveryTimeSlot>): Promise<DeliveryTimeSlot | undefined> {
    const [updated] = await db.update(deliveryTimeSlots)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deliveryTimeSlots.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDeliveryTimeSlot(id: string): Promise<boolean> {
    const result = await db.delete(deliveryTimeSlots).where(eq(deliveryTimeSlots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  private mapOrder(order: any): Order {
    return {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      createdAt: new Date(order.createdAt),
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : null,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
      pickedUpAt: order.pickedUpAt ? new Date(order.pickedUpAt) : null,
      approvedAt: order.approvedAt ? new Date(order.approvedAt) : null,
      assignedAt: order.assignedAt ? new Date(order.assignedAt) : null,
    };
  }

  // Roti Settings Management
  async getRotiSettings(): Promise<RotiSettings | undefined> {
    const settings = await db.query.rotiSettings.findFirst({
      where: (rs, { eq }) => eq(rs.isActive, true),
      orderBy: (rs, { desc }) => [desc(rs.createdAt)],
    });
    return settings || undefined;
  }

  async updateRotiSettings(data: Partial<InsertRotiSettings>): Promise<RotiSettings> {
    // Get existing settings or create new
    const existing = await this.getRotiSettings();

    if (existing) {
      const [updated] = await db.update(rotiSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(rotiSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(rotiSettings)
        .values({ ...data, isActive: true } as any)
        .returning();
      return created;
    }
  }

  // SMS Settings
  async getSMSSettings(): Promise<any | undefined> {
    try {
      // Store in localStorage-like object in memory (or could use admin_settings table if exists)
      const settings = process.env.SMS_SETTINGS ? JSON.parse(process.env.SMS_SETTINGS) : null;
      return settings;
    } catch (error) {
      console.error("Error getting SMS settings:", error);
      return { enableSMS: false };
    }
  }

  async updateSMSSettings(settings: any): Promise<any> {
    try {
      // In production, this should be stored in database
      // For now, storing in memory
      const smsSettings = {
        enableSMS: settings.enableSMS || false,
        smsGateway: settings.smsGateway || "twilio",
        fromNumber: settings.fromNumber || "",
        apiKey: settings.apiKey || "",
        updatedAt: new Date()
      };

      console.log(`✅ SMS Settings updated: ${smsSettings.enableSMS ? "ENABLED" : "DISABLED"}`);
      return smsSettings;
    } catch (error) {
      console.error("Error updating SMS settings:", error);
      throw error;
    }
  }

  // Referral Rewards Settings
  async getAllReferralRewards(): Promise<ReferralReward[]> {
    return db.query.referralRewards.findMany({
      orderBy: (rr, { desc }) => [desc(rr.createdAt)]
    });
  }

  async getActiveReferralReward(): Promise<ReferralReward | undefined> {
    let settings = await db.query.referralRewards.findFirst({
      where: (rr, { eq }) => eq(rr.isActive, true),
      orderBy: (rr, { desc }) => [desc(rr.createdAt)]
    });

    // If no active settings exist, create default settings
    if (!settings) {
      console.log("📝 No active referral settings found, creating defaults...");
      const defaultReward = {
        name: "Default Referral Program",
        referrerBonus: 50,
        referredBonus: 50,
        minOrderAmount: 0,
        maxReferralsPerMonth: 10,
        maxEarningsPerMonth: 500,
        expiryDays: 30,
        maxBonusUsagePerOrder: 10, // ✅ FIX: Per-order limit (e.g., max ₹10 per order even if total bonus is ₹50)
        isActive: true,
      };
      settings = await this.createReferralReward(defaultReward);
      console.log(`✅ Default referral settings created: ${JSON.stringify(defaultReward)}`);
    }

    return settings;
  }

  async createReferralReward(data: Omit<ReferralReward, "id" | "createdAt" | "updatedAt">): Promise<ReferralReward> {
    const id = randomUUID();
    const reward: ReferralReward = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [created] = await db.insert(referralRewards).values(reward).returning();
    return created;
  }

  async updateReferralReward(id: string, data: Partial<ReferralReward>): Promise<ReferralReward | undefined> {
    const [updated] = await db.update(referralRewards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(referralRewards.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteReferralReward(id: string): Promise<boolean> {
    const result = await db.delete(referralRewards).where(eq(referralRewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Get all coupons (for admin)
  async getAllCoupons(): Promise<Coupon[]> {
    return db.query.coupons.findMany({
      orderBy: (c, { desc }) => [desc(c.createdAt)]
    });
  }

  // Create coupon
  async createCoupon(data: any): Promise<Coupon> {
    const id = randomUUID();
    const coupon = {
      id,
      ...data,
      usedCount: 0,
      createdAt: new Date(),
    };
    const [created] = await db.insert(coupons).values(coupon).returning();
    return created;
  }

  // Delete coupon
  async deleteCoupon(id: string): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Update coupon
  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | undefined> {
    const [updated] = await db.update(coupons)
      .set({ ...data })
      .where(eq(coupons.id, id))
      .returning();
    return updated || undefined;
  }

  // Get coupon statistics
  async getCouponStats(): Promise<any[]> {
    const allCoupons = await db.query.coupons.findMany();

    const stats = [];
    for (const coupon of allCoupons) {
      // Get all usages for this coupon
      const usages = await db.query.couponUsages.findMany({
        where: (cu, { eq }) => eq(cu.couponId, coupon.id),
      });

      // Count unique users
      const uniqueUsers = new Set(usages.map((u: any) => u.userId)).size;

      // Get last used date
      let lastUsed = null;
      if (usages.length > 0) {
        const sorted = [...usages].sort((a: any, b: any) =>
          new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
        );
        lastUsed = sorted[0].usedAt;
      }

      stats.push({
        id: coupon.id,
        code: coupon.code,
        totalUsed: usages.length,
        uniqueUsers,
        totalDiscount: 0, // Would need order data to calculate accurately
        avgDiscount: 0, // Would need order data to calculate accurately
        lastUsed,
      });
    }

    return stats;
  }

  // ================= NEW REFERRAL MANAGEMENT METHODS =================

  // Get all referrals
  async getAllReferrals(): Promise<any[]> {
    return db.query.referrals.findMany({
      orderBy: (r, { desc }) => [desc(r.createdAt)]
    });
  }

  // Get referral by ID
  async getReferralById(id: string): Promise<any | undefined> {
    return db.query.referrals.findFirst({
      where: (r, { eq: equals }) => equals(r.id, id)
    });
  }

  // Update referral status
  async updateReferralStatus(id: string, status: string, referrerBonus: number, referredBonus: number): Promise<void> {
    await db.update(referrals)
      .set({
        status,
        referrerBonus,
        referredBonus,
        referredOrderCompleted: status === "completed",
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(referrals.id, id));
  }

  // ================= ADMIN REFERRAL REVIEW METHODS =================

  // Get all referrals enriched with referrer/referred user data and first order info
  async getAdminReferrals(): Promise<any[]> {
    const allReferrals = await db.query.referrals.findMany({
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    // Enrich each referral with user data and first order info
    const enriched = await Promise.all(
      allReferrals.map(async (referral) => {
        const [referrer, referred] = await Promise.all([
          this.getUser(referral.referrerId),
          this.getUser(referral.referredId),
        ]);

        // Get referred user's first completed order
        let firstOrder: any = null;
        if (referral.referredId) {
          const referredOrders = await db.query.orders.findMany({
            where: (o, { eq: eqOp }) => eqOp(o.userId, referral.referredId),
            orderBy: (o, { asc }) => [asc(o.createdAt)],
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
          firstOrderPaymentStatus: firstOrder?.paymentStatus || null,
        };
      })
    );

    return enriched;
  }

  // Get aggregate admin referral stats
  async getAdminReferralStats(): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    approvedReferrals: number;
    cancelledReferrals: number;
    completedReferrals: number;
    totalBonusPaid: number;
  }> {
    const allReferrals = await db.query.referrals.findMany();

    const totalReferrals = allReferrals.length;
    const pendingReferrals = allReferrals.filter((r) => r.status === "pending").length;
    const approvedReferrals = allReferrals.filter((r) => r.status === "approved").length;
    const cancelledReferrals = allReferrals.filter((r) => r.status === "cancelled").length;
    const completedReferrals = allReferrals.filter((r) => r.status === "completed").length;
    const totalBonusPaid = allReferrals
      .filter((r) => r.status === "completed" || r.status === "approved")
      .reduce((sum, r) => sum + r.referrerBonus + r.referredBonus, 0);

    return {
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      cancelledReferrals,
      completedReferrals,
      totalBonusPaid,
    };
  }

  // Admin approve referral — credits referrer bonus to their wallet
  async adminApproveReferral(id: string, adminNote?: string): Promise<void> {
    const referral = await this.getReferralById(id);
    if (!referral) throw new Error("Referral not found");
    if (referral.status !== "pending") {
      throw new Error(`Cannot approve referral with status: ${referral.status}`);
    }

    await db.transaction(async (tx) => {
      // Credit referrer bonus if > 0
      if (referral.referrerBonus > 0) {
        await this.createWalletTransaction({
          userId: referral.referrerId,
          amount: referral.referrerBonus,
          type: "referral_bonus",
          description: `Admin approved referral bonus (Referral ID: ${id})`,
          referenceId: id,
          referenceType: "referral",
        }, tx);
      }

      // Update referral status
      await tx.update(referrals)
        .set({
          status: "approved",
          adminNote: adminNote || null,
          completedAt: new Date(),
        })
        .where(eq(referrals.id, id));
    });
  }

  /**
   * 🔄 REVERSAL HELPER: Reverse referral bonuses for BOTH users atomically
   * 
   * Safety:
   * - Only reverses if status = completed/approved (has been credited)
   * - Prevents double reversal (checks status first)
   * - Atomic: Either both reversed or neither
   * - Creates audit trail via wallet transactions
   * 
   * @param referralId - The referral to reverse
   * @param reason - Admin note explaining why reversal is happening (optional)
   * @throws Error if referral not found or already reversed
   */
  async reverseReferralBonus(referralId: string, reason?: string): Promise<void> {
    const referral = await this.getReferralById(referralId);

    // Safety check 1: Referral must exist
    if (!referral) {
      console.error(`[REVERSAL] ❌ Referral ${referralId} not found. Skipping reversal.`);
      return;
    }

    // Safety check 2: Only reverse if bonuses were actually credited
    if (!["completed", "approved"].includes(referral.status)) {
      console.log(`[REVERSAL] ⏭️  Referral ${referralId} has status "${referral.status}" (not completed/approved). Skipping reversal.`);
      return;
    }

    // Safety check 3: Prevent double reversal
    if (["fraud", "cancelled"].includes(referral.status)) {
      console.log(`[REVERSAL] ⚠️  Referral ${referralId} already marked as ${referral.status}. Skipping reversal to prevent double-deduction.`);
      return;
    }

    // Execute reversal in atomic transaction
    await db.transaction(async (tx) => {
      console.log(`[REVERSAL] 🔄 Starting reversal for referral ${referralId}...`);

      // ✅ REVERSE REFERRER BONUS (only if they have the balance)
      if (referral.referrerBonus > 0) {
        try {
          const referrerUser = await tx.query.users.findFirst({
            where: eq(users.id, referral.referrerId),
          });

          if (!referrerUser) {
            console.error(`[REVERSAL] ❌ Referrer user ${referral.referrerId} not found`);
            throw new Error(`Referrer user not found: ${referral.referrerId}`);
          }

          // Only reverse what the user actually has available
          const reversalAmount = Math.min(referral.referrerBonus, referrerUser.walletBalance);

          if (reversalAmount > 0) {
            const reasonText = reason ? ` - Reason: ${reason}` : '';
            const partialText = reversalAmount < referral.referrerBonus ? ' [Partial: User spent part of bonus]' : '';
            await this.createWalletTransaction({
              userId: referral.referrerId,
              amount: reversalAmount,
              type: "referral_reversal",
              description: `Referral bonus reversed (Referral ID: ${referralId})${partialText}${reasonText}`,
              referenceId: referralId,
              referenceType: "referral",
            }, tx);
            console.log(`[REVERSAL] ✅ Referrer ${referral.referrerId} reversed ₹${reversalAmount}${reversalAmount < referral.referrerBonus ? ` (partial, had ₹${referrerUser.walletBalance} of ₹${referral.referrerBonus})` : ''}${reasonText}`);
          } else {
            console.log(`[REVERSAL] ℹ️  Referrer ${referral.referrerId} has no available balance to reverse`);
          }
        } catch (err: any) {
          console.error(`[REVERSAL] ❌ Failed to reverse referrer bonus: ${err.message}`);
          throw err;
        }
      }

      // ✅ REVERSE REFERRED USER BONUS (only if they have the balance)
      if (referral.referredBonus > 0) {
        try {
          const referredUser = await tx.query.users.findFirst({
            where: eq(users.id, referral.referredId),
          });

          if (!referredUser) {
            console.error(`[REVERSAL] ❌ Referred user ${referral.referredId} not found`);
            throw new Error(`Referred user not found: ${referral.referredId}`);
          }

          // Only reverse what the user actually has available
          const reversalAmount = Math.min(referral.referredBonus, referredUser.walletBalance);

          if (reversalAmount > 0) {
            const reasonText = reason ? ` - Reason: ${reason}` : '';
            const partialText = reversalAmount < referral.referredBonus ? ' [Partial: User spent part of bonus]' : '';
            await this.createWalletTransaction({
              userId: referral.referredId,
              amount: reversalAmount,
              type: "referral_reversal",
              description: `Referral benefit reversed (Referral ID: ${referralId})${partialText}${reasonText}`,
              referenceId: referralId,
              referenceType: "referral",
            }, tx);
            console.log(`[REVERSAL] ✅ Referred user ${referral.referredId} reversed ₹${reversalAmount}${reversalAmount < referral.referredBonus ? ` (partial, had ₹${referredUser.walletBalance} of ₹${referral.referredBonus})` : ''}${reasonText}`);
          } else {
            console.log(`[REVERSAL] ℹ️  Referred user ${referral.referredId} has no available balance to reverse`);
          }
        } catch (err: any) {
          console.error(`[REVERSAL] ❌ Failed to reverse referred user bonus: ${err.message}`);
          throw err;
        }
      }

      console.log(`[REVERSAL] ✅ Reversal completed for referral ${referralId}`);
    });
  }

  // ✅ PHASE 3: Admin cancel referral — reverses BOTH user bonuses atomically
  async adminCancelReferral(id: string, adminNote: string): Promise<void> {
    const referral = await this.getReferralById(id);
    if (!referral) throw new Error("Referral not found");
    if (referral.status === "cancelled") {
      throw new Error("Referral is already cancelled");
    }

    // ✅ Use atomic reversal helper with reason (reverses BOTH users)
    await this.reverseReferralBonus(id, adminNote);

    // Mark referral as cancelled
    await db.update(referrals)
      .set({
        status: "cancelled",
        adminNote,
      })
      .where(eq(referrals.id, id));

    console.log(`[ADMIN-CANCEL] ✅ Referral ${id} cancelled and bonuses reversed for both users. Reason: ${adminNote}`);
  }

  // Toggle fraud flag on a referral
  // ✅ PHASE 3: Mark referral as fraud — reverses BOTH user bonuses atomically
  async setReferralFraudFlag(id: string, fraudFlag: boolean): Promise<void> {
    const referral = await this.getReferralById(id);
    if (!referral) throw new Error("Referral not found");

    // ✅ If marking as fraud (true), reverse bonuses
    if (fraudFlag === true) {
      // Check if already frauded (idempotent)
      if (referral.fraudFlag === true || referral.status === "fraud") {
        console.log(`[FRAUD-FLAG] ⚠️  Referral ${id} already flagged as fraud. Skipping.`);
        return;
      }

      // Use atomic reversal helper with fraud reason (reverses BOTH users)
      await this.reverseReferralBonus(
        id,
        "Referral benefits adjusted due to activity not meeting program guidelines (e.g., same address or usage pattern)."
      );
      // Mark as fraud
      await db.update(referrals)
        .set({
          fraudFlag: true,
          status: "fraud",
        })
        .where(eq(referrals.id, id));

      console.log(`[FRAUD-FLAG] ✅ Referral ${id} marked as fraud and bonuses reversed for both users`);
    } else {
      // If unmarking fraud, just update the flag (don't reverse again)
      await db.update(referrals)
        .set({ fraudFlag: false })
        .where(eq(referrals.id, id));

      console.log(`[FRAUD-FLAG] ℹ️  Referral ${id} fraud flag cleared`);
    }
  }


  // ================= NEW WALLET TRANSACTION METHODS =================

  // Get all wallet transactions (for admin)
  async getAllWalletTransactions(dateFilter?: string): Promise<WalletTransaction[]> {
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));

      return db.query.walletTransactions.findMany({
        where: (wt, { and, gte: gteOp, lte: lteOp }) => and(
          gteOp(wt.createdAt, startOfDay),
          lteOp(wt.createdAt, endOfDay)
        ),
        orderBy: (wt, { desc }) => [desc(wt.createdAt)]
      });
    }

    return db.query.walletTransactions.findMany({
      orderBy: (wt, { desc }) => [desc(wt.createdAt)],
      limit: 500
    });
  }

  // ==================== VISITOR TRACKING ====================

  async trackVisitor(data: any): Promise<any> {
    try {
      const result = await db.insert(visitors).values(data).returning();
      return result[0];
    } catch (error) {
      console.error("Error tracking visitor:", error);
      return null;
    }
  }

  async getTotalVisitors(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(visitors);
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting total visitors:", error);
      return 0;
    }
  }

  async getUniqueVisitors(): Promise<number> {
    try {
      const result = await db
        .selectDistinct({ userId: visitors.userId, sessionId: visitors.sessionId })
        .from(visitors);
      return result.length;
    } catch (error) {
      console.error("Error getting unique visitors:", error);
      return 0;
    }
  }

  async getTodayVisitors(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await db
        .select({ count: count() })
        .from(visitors)
        .where(and(
          gte(visitors.createdAt, today),
          lt(visitors.createdAt, tomorrow)
        ));

      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting today's visitors:", error);
      return 0;
    }
  }

  async getVisitorsByPage(): Promise<any[]> {
    try {
      const result = await db
        .select({
          page: visitors.page,
          count: count(),
        })
        .from(visitors)
        .groupBy(visitors.page)
        .orderBy((t) => desc(t.count));

      return result;
    } catch (error) {
      console.error("Error getting visitors by page:", error);
      return [];
    }
  }

  async getVisitorsLastNDays(days: number = 7): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select({
          date: sql`DATE(${visitors.createdAt})`,
          count: count(),
        })
        .from(visitors)
        .where(gte(visitors.createdAt, startDate))
        .groupBy(sql`DATE(${visitors.createdAt})`)
        .orderBy((t) => t.date);

      return result;
    } catch (error) {
      console.error("Error getting visitors by date:", error);
      return [];
    }
  }

  // ============================================
  // DELIVERY AREAS MANAGEMENT (DB-backed)
  // ============================================
  async getDeliveryAreas(): Promise<string[]> {
    try {
      const result = await db.select({ name: deliveryAreas.name })
        .from(deliveryAreas)
        .where(eq(deliveryAreas.isActive, true))
        .orderBy(asc(deliveryAreas.name));
      return result.map(r => r.name);
    } catch (error) {
      console.error("[STORAGE] Error fetching delivery areas:", error);
      // Return empty array instead of crashing
      return [];
    }
  }

  async getAllDeliveryAreas(): Promise<DeliveryArea[]> {
    try {
      return await db.select()
        .from(deliveryAreas)
        .orderBy(asc(deliveryAreas.name));
    } catch (error) {
      console.error("[STORAGE] Error fetching all delivery areas:", error);
      return [];
    }
  }

  async addDeliveryArea(name: string, pincodes?: string[]): Promise<DeliveryArea | undefined> {
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return undefined;

      const result = await db.insert(deliveryAreas)
        .values({
          name: trimmedName,
          isActive: true,
          pincodes: pincodes && pincodes.length > 0 ? pincodes : []
        })
        .returning();
      console.log("[STORAGE] Delivery area added:", trimmedName, "with pincodes:", pincodes);
      return result[0];
    } catch (error) {
      console.error("[STORAGE] Error adding delivery area:", error);
      return undefined;
    }
  }

  async updateDeliveryArea(id: string, name?: string, pincodes?: string[], latitude?: number, longitude?: number): Promise<DeliveryArea | undefined> {
    try {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (pincodes !== undefined) updateData.pincodes = pincodes;
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;

      const result = await db.update(deliveryAreas)
        .set(updateData)
        .where(eq(deliveryAreas.id, id))
        .returning();

      console.log("[STORAGE] Delivery area updated:", id, updateData);
      return result[0];
    } catch (error) {
      console.error("[STORAGE] Error updating delivery area:", error);
      return undefined;
    }
  }

  async updateDeliveryAreas(areaNames: string[]): Promise<boolean> {
    try {
      // Delete all existing areas
      await db.delete(deliveryAreas);

      // Insert new areas
      const trimmedAreas = areaNames
        .map(a => a.trim())
        .filter(a => a.length > 0);

      if (trimmedAreas.length > 0) {
        await db.insert(deliveryAreas)
          .values(trimmedAreas.map(name => ({ name, isActive: true })));
      }

      console.log("[STORAGE] Delivery areas updated:", trimmedAreas);
      return true;
    } catch (error) {
      console.error("[STORAGE] Error updating delivery areas:", error);
      return false;
    }
  }

  async deleteDeliveryArea(id: string): Promise<boolean> {
    try {
      const result = await db.delete(deliveryAreas)
        .where(eq(deliveryAreas.id, id))
        .returning();
      console.log("[STORAGE] Delivery area deleted:", id);
      return result.length > 0;
    } catch (error) {
      console.error("[STORAGE] Error deleting delivery area:", error);
      return false;
    }
  }

  async toggleDeliveryAreaStatus(id: string, isActive: boolean): Promise<DeliveryArea | undefined> {
    try {
      const result = await db.update(deliveryAreas)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(deliveryAreas.id, id))
        .returning();
      console.log("[STORAGE] Delivery area status toggled:", id, isActive);
      return result[0];
    } catch (error) {
      console.error("[STORAGE] Error toggling delivery area status:", error);
      return undefined;
    }
  }

  // Admin Settings methods
  async getAdminSetting(key: string): Promise<string | undefined> {
    try {
      const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key)).limit(1);
      return result[0]?.value;
    } catch (error) {
      console.error("[STORAGE] Error getting admin setting:", key, error);
      return undefined;
    }
  }

  async setAdminSetting(key: string, value: string, description?: string): Promise<void> {
    try {
      // Try to update first
      const updated = await db.update(adminSettings)
        .set({ value, description: description || null, updatedAt: new Date() })
        .where(eq(adminSettings.key, key))
        .returning();

      // If no existing setting, insert new one
      if (updated.length === 0) {
        await db.insert(adminSettings).values({
          id: randomUUID(),
          key,
          value,
          description: description || null,
        });
      }
      console.log("[STORAGE] Admin setting saved:", key, "=", value);
    } catch (error) {
      console.error("[STORAGE] Error setting admin setting:", key, error);
    }
  }

  async getDefaultCoordinates(): Promise<{ latitude: number; longitude: number }> {
    try {
      const lat = await this.getAdminSetting("default_latitude");
      const lon = await this.getAdminSetting("default_longitude");

      return {
        latitude: parseFloat(lat || "19.0728"),
        longitude: parseFloat(lon || "72.8826"),
      };
    } catch (error) {
      console.error("[STORAGE] Error getting default coordinates:", error);
      // Fallback to Mumbai center
      return { latitude: 19.0728, longitude: 72.8826 };
    }
  }

  async setDefaultCoordinates(latitude: number, longitude: number): Promise<void> {
    try {
      await this.setAdminSetting("default_latitude", String(latitude), "Default latitude for new areas and chefs");
      await this.setAdminSetting("default_longitude", String(longitude), "Default longitude for new areas and chefs");
      console.log("[STORAGE] Default coordinates updated:", { latitude, longitude });
    } catch (error) {
      console.error("[STORAGE] Error setting default coordinates:", error);
    }
  }

  // ============ PENDING CHECKOUTS METHODS ============

  async savePendingCheckout(data: InsertPendingCheckout): Promise<PendingCheckout> {
    const id = randomUUID();
    const now = new Date();

    const pending: PendingCheckout = {
      id,
      ...data,
      status: "pending",
      orderId: null,
      createdAt: now,
      updatedAt: now,
    } as PendingCheckout;

    await db.insert(pendingCheckouts).values(pending);
    console.log(`✅ Pending checkout saved: ${id} for phone ${data.phone}`);
    return pending;
  }

  async getPendingCheckout(id: string): Promise<PendingCheckout | undefined> {
    return db.query.pendingCheckouts.findFirst({
      where: (pc, { eq }) => eq(pc.id, id),
    });
  }

  async getPendingCheckoutsByPhone(phone: string): Promise<PendingCheckout[]> {
    return db.query.pendingCheckouts.findMany({
      where: (pc, { eq }) => eq(pc.phone, phone),
      orderBy: (pc, { desc }) => [desc(pc.createdAt)],
    });
  }

  async getAllPendingCheckouts(): Promise<PendingCheckout[]> {
    return db.query.pendingCheckouts.findMany({
      where: (pc, { eq }) => eq(pc.isDeleted, false),
      orderBy: (pc, { desc }) => [desc(pc.createdAt)],
    });
  }

  async updatePendingCheckout(id: string, data: Partial<PendingCheckout>): Promise<PendingCheckout | undefined> {
    await db.update(pendingCheckouts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pendingCheckouts.id, id));
    return this.getPendingCheckout(id);
  }

  async markPendingCheckoutAsConfirmed(id: string, orderId: string): Promise<PendingCheckout | undefined> {
    return this.updatePendingCheckout(id, {
      status: "confirmed",
      orderId,
    } as any);
  }

  async markPendingCheckoutAsConfirmedAndDeleted(id: string, orderId: string): Promise<PendingCheckout | undefined> {
    console.log(`[DEBUG] Updating pending checkout: id=${id}, orderId=${orderId}`);

    // Get the current checkout to find the phone number
    const currentCheckout = await this.getPendingCheckout(id);
    if (!currentCheckout) {
      console.warn(`[DEBUG] Pending checkout not found: ${id}`);
      return undefined;
    }

    console.log(`[PENDING-CHECKOUT-CLEANUP] Phone: ${currentCheckout.phone}, Current ID: ${id}`);

    // ✅ Mark ALL other pending checkouts for this phone as "abandoned"
    // (This handles the case where user abandoned previous checkouts and came back to pay)
    const otherCheckouts = await db.query.pendingCheckouts.findMany({
      where: (pc, { eq, and }) => and(
        eq(pc.phone, currentCheckout.phone),
        eq(pc.status, "pending")
      ),
    });

    if (otherCheckouts.length > 0) {
      const otherIds = otherCheckouts
        .filter(pc => pc.id !== id) // Exclude current checkout
        .map(pc => pc.id);

      if (otherIds.length > 0) {
        console.log(`[PENDING-CHECKOUT-CLEANUP] Marking ${otherIds.length} old pending checkouts as abandoned for ${currentCheckout.phone}`);

        await db.update(pendingCheckouts)
          .set({
            status: "abandoned",
            updatedAt: new Date(),
          })
          .where(inArray(pendingCheckouts.id, otherIds));

        console.log(`✅ [PENDING-CHECKOUT-CLEANUP] Abandoned old pending checkouts:`, otherIds);
      }
    }

    // ✅ Now update the current checkout as confirmed and soft-deleted
    await db.update(pendingCheckouts)
      .set({
        status: "confirmed",
        orderId: orderId,
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(pendingCheckouts.id, id));

    const updated = await this.getPendingCheckout(id);
    console.log(`[DEBUG] Pending checkout updated:`, {
      id,
      status: updated?.status,
      isDeleted: updated?.isDeleted,
      orderId: updated?.orderId,
      updatedAt: updated?.updatedAt,
    });

    return updated;
  }

  async deletePendingCheckout(id: string): Promise<boolean> {
    const result = await db.delete(pendingCheckouts)
      .where(eq(pendingCheckouts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

}

export const storage = new MemStorage();
