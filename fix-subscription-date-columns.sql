-- Fix: Convert DATE columns to TIMESTAMP columns for subscriptions table
-- Root cause: Schema defines these as timestamp() but database has them as date type
-- This mismatch causes Drizzle to create Invalid Date objects

ALTER TABLE subscriptions
  ALTER COLUMN start_date TYPE timestamp without time zone,
  ALTER COLUMN end_date TYPE timestamp without time zone,
  ALTER COLUMN next_delivery_date TYPE timestamp without time zone;

-- Verify the changes
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('start_date', 'end_date', 'next_delivery_date')
ORDER BY column_name;
