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
    console.log('🔄 Applying migration: creating custom_subscription_requests table...');
    return client.query(`
      CREATE TABLE IF NOT EXISTS custom_subscription_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        address_building TEXT,
        address_street TEXT,
        address_area TEXT,
        address_city TEXT DEFAULT 'Mumbai',
        address_pincode TEXT,
        roti_per_day INTEGER NOT NULL,
        days_per_week INTEGER NOT NULL DEFAULT 7,
        delivery_days JSONB NOT NULL DEFAULT '[]'::jsonb,
        duration TEXT NOT NULL,
        delivery_slot_id VARCHAR,
        price_per_roti INTEGER NOT NULL,
        calculated_price INTEGER NOT NULL,
        assigned_chef_id VARCHAR,
        status TEXT NOT NULL DEFAULT 'pending_chef_assignment',
        rejection_reason TEXT,
        approved_by TEXT,
        approved_at TIMESTAMP,
        subscription_id VARCHAR,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
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
