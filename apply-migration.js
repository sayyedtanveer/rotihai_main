import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Convert asyncpg protocol to regular postgres if needed
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgresql+asyncpg://')) {
  dbUrl = dbUrl.replace('postgresql+asyncpg://', 'postgresql://');
}

console.log('🔄 Connecting to database...');
const client = new Client(dbUrl);

client.connect()
  .then(() => {
    console.log('🔄 Applying migration: adding road_distance_multiplier column...');
    return client.query(`
      ALTER TABLE payment_settings
      ADD COLUMN IF NOT EXISTS road_distance_multiplier NUMERIC(3, 2) NOT NULL DEFAULT '1.50';
    `);
  })
  .then(res => {
    console.log('✅ Migration applied successfully');
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err.message);
    if (client) client.end();
    process.exit(1);
  });
