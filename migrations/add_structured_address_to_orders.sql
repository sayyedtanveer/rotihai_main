-- ============================================================================
-- SCRIPT: Add Structured Address Columns to Orders Table
-- Date: December 31, 2025
-- Purpose: Store individual address components for better search and filtering
-- ============================================================================

-- Step 1: Add individual address component columns to orders table
-- These columns will store address components separately from the full address
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS address_building TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_area TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_pincode TEXT;

-- Step 2: Create indexes for faster queries by area and city
-- This improves performance when searching/filtering orders by area or city
CREATE INDEX IF NOT EXISTS idx_orders_address_area ON orders(address_area);
CREATE INDEX IF NOT EXISTS idx_orders_address_city ON orders(address_city);

-- Step 3: Create a composite index for area + city queries
CREATE INDEX IF NOT EXISTS idx_orders_address_area_city ON orders(address_area, address_city);

-- Step 4: Verify the columns were added
-- Run this to confirm all columns exist:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name LIKE 'address%'
-- ORDER BY ordinal_position;

-- Step 5: Verify indexes were created
-- Run this to confirm indexes exist:
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename = 'orders' 
-- AND indexname LIKE 'idx_orders_address%';

-- ============================================================================
-- NOTES:
-- - The existing 'address' column continues to store the full address string
-- - New columns store individual components for structured queries
-- - No data migration needed - new orders will populate these fields automatically
-- - Old orders will have NULL values for these columns (can be populated later if needed)
-- ============================================================================

-- Example queries after deployment:
-- 
-- Find all orders in Kurla West:
-- SELECT * FROM orders WHERE address_area = 'Kurla West' ORDER BY created_at DESC;
--
-- Find all orders in Mumbai with pincode 400070:
-- SELECT * FROM orders WHERE address_city = 'Mumbai' AND address_pincode = '400070';
--
-- Count orders by area:
-- SELECT address_area, COUNT(*) as order_count 
-- FROM orders 
-- WHERE address_area IS NOT NULL 
-- GROUP BY address_area 
-- ORDER BY order_count DESC;
--
-- Find orders with incomplete address:
-- SELECT id, address, address_area FROM orders 
-- WHERE address_area IS NULL 
-- ORDER BY created_at DESC;
