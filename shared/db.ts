// Determine database type from connection string
export const dbType = (() => {
  const connStr = process.env.DATABASE_URL || '';
  if (connStr.includes('mysql') || connStr.includes(':3306')) return 'mysql';
  if (connStr.includes('mongodb') || connStr.includes(':27017')) return 'mongodb';
  return 'postgresql'; // default
})();

// shared/db.ts (or wherever this file exists)

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

export { sql };
export const {
  users,
  sessions,
  categories,
  products,
  orders,
  chefs,
  adminUsers,
  partnerUsers,
  subscriptions,
  subscriptionPlans,
  subscriptionDeliveryLogs,
  deliverySettings,
  deliveryPartnerPayouts,
  cartSettings,
  deliveryPersonnel,
  coupons,
  couponUsages,
  referrals,
  walletTransactions,
  walletSettings,
  referralRewards,
  promotionalBanners,
  deliveryTimeSlots,
  rotiSettings,
  visitors,
  deliveryAreas,
  adminSettings,
  newsletterSubscribers,
  pendingBroadcasts,
  pendingCheckouts,
  payoutTransactions,
  paymentVerificationLog,
  paymentSettings,
  payLaterTransactions
} = schema;