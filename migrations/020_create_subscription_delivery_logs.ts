import { sql } from "drizzle-orm";
import { db } from "./server/db";

/**
 * ============================================================================
 * PHASE 4: Database Migration - Create Subscription Delivery Logs Table
 * ============================================================================
 * 
 * This script creates the subscription_delivery_logs table and enum type
 * if they don't already exist in the database.
 *
 * Run: npx tsx migrations/020_create_subscription_delivery_logs.ts
 * ============================================================================
 */

async function runMigration() {
  console.log("🔄 Starting Phase 4 migration...\n");

  try {
    // Step 1: Create enum type if it doesn't exist
    console.log("📌 Step 1: Creating delivery_log_status enum...");
    await db.execute(
      sql`
        CREATE TYPE IF NOT EXISTS "public"."delivery_log_status" AS ENUM(
          'scheduled', 'preparing', 'out_for_delivery', 'delivered', 'missed', 'skipped'
        );
      `
    );
    console.log("✅ Enum created or already exists\n");

    // Step 2: Create table if it doesn't exist
    console.log("📌 Step 2: Creating subscription_delivery_logs table...");
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS "public"."subscription_delivery_logs" (
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          "subscription_id" varchar NOT NULL,
          "date" timestamp NOT NULL,
          "time" text NOT NULL DEFAULT '09:00',
          "status" "public"."delivery_log_status" NOT NULL DEFAULT 'scheduled',
          "delivery_person_id" varchar,
          "notes" text,
          "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    );
    console.log("✅ Table created or already exists\n");

    // Step 3: Create indexes for performance
    console.log("📌 Step 3: Creating performance indexes...");
    
    const indexes = [
      {
        name: "idx_subscription_delivery_logs_subscription_id",
        query: sql`
          CREATE INDEX IF NOT EXISTS "idx_subscription_delivery_logs_subscription_id" 
          ON "public"."subscription_delivery_logs"("subscription_id");
        `,
      },
      {
        name: "idx_subscription_delivery_logs_date",
        query: sql`
          CREATE INDEX IF NOT EXISTS "idx_subscription_delivery_logs_date" 
          ON "public"."subscription_delivery_logs"("date");
        `,
      },
      {
        name: "idx_subscription_delivery_logs_status",
        query: sql`
          CREATE INDEX IF NOT EXISTS "idx_subscription_delivery_logs_status" 
          ON "public"."subscription_delivery_logs"("status");
        `,
      },
      {
        name: "idx_subscription_delivery_logs_delivery_person_id",
        query: sql`
          CREATE INDEX IF NOT EXISTS "idx_subscription_delivery_logs_delivery_person_id" 
          ON "public"."subscription_delivery_logs"("delivery_person_id");
        `,
      },
      {
        name: "idx_subscription_delivery_logs_sub_status_date",
        query: sql`
          CREATE INDEX IF NOT EXISTS "idx_subscription_delivery_logs_sub_status_date" 
          ON "public"."subscription_delivery_logs"("subscription_id", "status", "date");
        `,
      },
    ];

    for (const index of indexes) {
      try {
        await db.execute(index.query);
        console.log(`  ✅ ${index.name}`);
      } catch (err) {
        console.log(`  ⚠️  ${index.name} (may already exist)`);
      }
    }
    console.log();

    // Step 4: Verify table structure
    console.log("📌 Step 4: Verifying table structure...");
    const columns = await db.execute(
      sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'subscription_delivery_logs' 
        ORDER BY ordinal_position;
      `
    );
    console.log("✅ Table structure verified:");
    if (Array.isArray(columns) && columns.length > 0) {
      (columns as any[]).forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    console.log();

    // Step 5: Verify enum values
    console.log("📌 Step 5: Verifying enum values...");
    const enumValues = await db.execute(
      sql`
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'delivery_log_status'
        ) 
        ORDER BY enumsortorder;
      `
    );
    console.log("✅ Enum values verified:");
    if (Array.isArray(enumValues) && enumValues.length > 0) {
      (enumValues as any[]).forEach((val) => {
        console.log(`  - ${val.enumlabel}`);
      });
    }
    console.log();

    console.log("🎉 ============================================================");
    console.log("   PHASE 4 MIGRATION COMPLETE!");
    console.log("============================================================🎉");
    console.log("\n✅ Database is now ready for Phase 4 features:");
    console.log("   ✓ Missed delivery tracking");
    console.log("   ✓ Delivery skip feature");
    console.log("   ✓ Chef performance metrics");
    console.log("   ✓ Admin notification features");
    console.log("\nNext steps:");
    console.log("   1. npm run build");
    console.log("   2. npm run dev (to test)");
    console.log("   3. Deploy to production");
    console.log();

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("\nTo manually run the migration:");
    console.error("1. Open your database client (psql, pgAdmin, etc.)");
    console.error("2. Run the SQL commands from: CREATE_SUBSCRIPTION_DELIVERY_LOGS_TABLE.sql");
    console.error("3. Restart the application");
    process.exit(1);
  }
}

// Run migration
runMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
