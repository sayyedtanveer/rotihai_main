-- Add min_order_amount column to wallet_settings table
-- Run this in pgAdmin SQL Editor

ALTER TABLE "wallet_settings" 
ADD COLUMN "min_order_amount" integer NOT NULL DEFAULT 0;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'wallet_settings'
ORDER BY ordinal_position;
