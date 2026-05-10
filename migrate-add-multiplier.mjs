import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Client } = pg;

async function migrate() {
  const client = new Client();
  try {
    console.log("🔄 Connecting to database...");
    await client.connect();
    
    console.log("🔄 Checking if road_distance_multiplier column exists...");
    
    // Try to add the column if it doesn't exist
    await client.query(`
      ALTER TABLE payment_settings
      ADD COLUMN IF NOT EXISTS road_distance_multiplier NUMERIC(3, 2) NOT NULL DEFAULT '1.50';
    `);
    
    console.log("✅ Migration completed: road_distance_multiplier column added/verified");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

migrate();
