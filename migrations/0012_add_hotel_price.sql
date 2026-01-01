-- Migration: 0012_add_hotel_price.sql
-- Purpose: Add hotelPrice (cost price) field to track supplier/hotel costs
-- This enables profit calculation: profit = price - hotelPrice
-- Backward compatible: Default 0 for existing products, admin can update

BEGIN;

-- Add hotel_price column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hotel_price INTEGER NOT NULL DEFAULT 0;

-- Add margin_percent column for easy reference (optional but helpful)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN products.hotel_price IS 'Cost price from hotel/supplier - used to calculate profit margin';
COMMENT ON COLUMN products.margin_percent IS 'Profit margin percentage = ((price - hotel_price) / hotel_price) * 100';

COMMIT;

-- VERIFICATION: Check columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('hotel_price', 'margin_percent', 'price')
ORDER BY ordinal_position;

-- ROLLBACK if needed:
-- ALTER TABLE products DROP COLUMN IF EXISTS hotel_price CASCADE;
-- ALTER TABLE products DROP COLUMN IF EXISTS margin_percent CASCADE;
