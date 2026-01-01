-- Fix: Convert subscription_delivery_logs.date column from DATE to TIMESTAMP
ALTER TABLE subscription_delivery_logs
  ALTER COLUMN date TYPE timestamp without time zone;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscription_delivery_logs'
  AND column_name = 'date';
