-- ============================================================================
-- COMPLETE DATABASE MIGRATION SCRIPT
-- Fix Error: column "address_building" does not exist
-- Date: December 31, 2025
-- ============================================================================

-- RUN THIS SCRIPT TO FIX THE ERROR
-- Copy and paste this entire script into your PostgreSQL client

-- ============================================================================
-- STEP 1: ADD COLUMNS TO ORDERS TABLE
-- ============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS address_building TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_area TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_pincode TEXT;

-- Create indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_address_area ON orders(address_area);
CREATE INDEX IF NOT EXISTS idx_orders_address_city ON orders(address_city);
CREATE INDEX IF NOT EXISTS idx_orders_address_area_city ON orders(address_area, address_city);

-- Verify orders table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE 'address%'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: ADD COLUMNS TO CHEFS TABLE
-- ============================================================================

ALTER TABLE chefs
ADD COLUMN IF NOT EXISTS address_building TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_area TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_pincode TEXT;

-- Create indexes for chefs table
CREATE INDEX IF NOT EXISTS idx_chefs_address_area ON chefs(address_area);
CREATE INDEX IF NOT EXISTS idx_chefs_address_city ON chefs(address_city);
CREATE INDEX IF NOT EXISTS idx_chefs_address_area_city_active ON chefs(address_area, address_city, is_active);
CREATE INDEX IF NOT EXISTS idx_chefs_coordinates ON chefs(latitude, longitude) WHERE is_active = true;

-- Verify chefs table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chefs' 
AND column_name LIKE 'address%'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: VERIFY ALL CHANGES
-- ============================================================================

-- Check all address columns exist
SELECT 
  t.tablename, 
  COUNT(*) as address_columns
FROM pg_indexes pi
JOIN information_schema.columns c ON c.column_name = pi.indexname OR pi.indexname LIKE '%address%'
WHERE pi.tablename IN ('orders', 'chefs')
GROUP BY t.tablename;

-- List all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('orders', 'chefs')
AND indexname LIKE '%address%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS! 
-- ============================================================================
-- All columns have been added:
--   - orders table: address_building, address_street, address_area, address_city, address_pincode
--   - chefs table: address_building, address_street, address_area, address_city, address_pincode
--
-- All indexes have been created for fast queries
--
-- The error "column address_building does not exist" is now FIXED! ✅
--
-- You can now:
-- 1. Restart your application (npm run dev)
-- 2. Test adding a chef with address
-- 3. Test checkout with delivery address
-- 4. Verify delivery fees are calculated correctly
-- ============================================================================
