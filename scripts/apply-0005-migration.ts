import { pool } from "../shared/db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, "../migrations/0005_bumpy_wallow.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    
    // Split by --> statement-breakpoint
    const statements = sqlContent.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
    
    await client.query("BEGIN");
    for (const statement of statements) {
      console.log("Executing:", statement);
      await client.query(statement);
    }
    await client.query("COMMIT");
    console.log("Migration applied successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

applyMigration();
