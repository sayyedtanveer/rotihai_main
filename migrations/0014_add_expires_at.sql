-- Add expiresAt column to orders table for reliable payment expiry handling
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "expires_at" timestamp 
DEFAULT (now() + interval '30 minutes');

-- Add index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_orders_expires_at 
ON orders("expires_at") 
WHERE "payment_status" = 'pending';

-- Add index for payment status lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON orders("payment_status");

-- Add combined index for expiry cron job
CREATE INDEX IF NOT EXISTS idx_orders_pending_created 
ON orders("payment_status", "created_at") 
WHERE "payment_status" = 'pending';

-- Update existing orders to have expiresAt (for orders created before this migration)
UPDATE orders 
SET "expires_at" = "created_at" + interval '30 minutes'
WHERE "expires_at" IS NULL 
  AND "payment_status" = 'pending';
