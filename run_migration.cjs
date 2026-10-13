const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:123@localhost:5432/rotihai"
});

async function main() {
  console.log("Creating chef_preorder_settings table...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "chef_preorder_settings" (
        "id" text PRIMARY KEY NOT NULL,
        "chef_id" text NOT NULL,
        "next_day_preorder_opens_at" text DEFAULT '22:00' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  }
  process.exit(0);
}

main();
