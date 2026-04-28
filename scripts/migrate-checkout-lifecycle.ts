/**
 * Migration: Checkout Lifecycle Hardening
 *
 * Adds:
 * 1. `pending_checkout_id` column to orders (UNIQUE — prevents duplicate orders per checkout)
 * 2. `user_id` column to pending_checkouts (for fast user-based lookup)
 * 3. `expires_at` column to pending_checkouts (lazy 15-min expiry)
 * 4. Adds `pending_verification` to payment_status enum
 * 5. Related indexes
 *
 * Safe: all ADD COLUMN ... IF NOT EXISTS — idempotent.
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL env var not set");

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("🚀 Starting checkout lifecycle migration...");

  // ── 1. Add pending_verification to payment_status enum ──────────────────
  // Postgres enums can only be altered by adding values (no remove)
  try {
    await sql`ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending_verification' BEFORE 'paid'`;
    console.log("✅ payment_status enum: pending_verification added");
  } catch (err: any) {
    if (err.message?.includes("already exists")) {
      console.log("ℹ️  payment_status: pending_verification already exists — skipping");
    } else {
      throw err;
    }
  }

  // ── 2. Add pending_checkout_id to orders ────────────────────────────────
  await sql`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS pending_checkout_id varchar UNIQUE
  `;
  console.log("✅ orders.pending_checkout_id column added (UNIQUE)");

  // ── 3. Add user_id to pending_checkouts ─────────────────────────────────
  await sql`
    ALTER TABLE pending_checkouts
    ADD COLUMN IF NOT EXISTS user_id varchar
  `;
  console.log("✅ pending_checkouts.user_id column added");

  // ── 4. Add expires_at to pending_checkouts ───────────────────────────────
  await sql`
    ALTER TABLE pending_checkouts
    ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
  `;
  console.log("✅ pending_checkouts.expires_at column added (default: now + 15 min)");

  // ── 5. Indexes ───────────────────────────────────────────────────────────
  await sql`
    CREATE INDEX IF NOT EXISTS "IDX_pending_checkouts_user"
    ON pending_checkouts (user_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "IDX_pending_checkouts_expires"
    ON pending_checkouts (expires_at)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "IDX_orders_pending_checkout"
    ON orders (pending_checkout_id)
  `;
  console.log("✅ Indexes created");

  console.log("\n✅ Migration complete! Checkout lifecycle schema is up-to-date.");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
