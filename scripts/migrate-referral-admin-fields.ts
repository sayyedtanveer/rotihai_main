// scripts/migrate-referral-admin-fields.ts
// Run with: npx tsx scripts/migrate-referral-admin-fields.ts

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log("🔄 Running referral admin fields migration...");

        await client.query(`
      ALTER TABLE referrals
        ADD COLUMN IF NOT EXISTS admin_note TEXT,
        ADD COLUMN IF NOT EXISTS fraud_flag BOOLEAN NOT NULL DEFAULT FALSE;
    `);

        console.log("✅ Migration complete: admin_note and fraud_flag columns added to referrals table.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
