import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Adding allow_manual_order_assignment column to chefs table...");
    await db.execute(sql`
      ALTER TABLE chefs 
      ADD COLUMN IF NOT EXISTS allow_manual_order_assignment boolean NOT NULL DEFAULT false;
    `);
    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
