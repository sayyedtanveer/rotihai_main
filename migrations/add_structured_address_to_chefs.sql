-- ============================================================================
-- SCRIPT: Add Structured Address Columns to Chefs Table
-- Date: December 31, 2025
-- Purpose: Store chef/restaurant address components separately for exact location tracking
-- ============================================================================

-- Step 1: Add individual address component columns to chefs table
-- These columns will store address components separately from the full address
ALTER TABLE chefs
ADD COLUMN IF NOT EXISTS address_building TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_area TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_pincode TEXT;

-- Step 2: Create indexes for faster queries by area and city
-- This improves performance when searching/filtering chefs by area or city
CREATE INDEX IF NOT EXISTS idx_chefs_address_area ON chefs(address_area);
CREATE INDEX IF NOT EXISTS idx_chefs_address_city ON chefs(address_city);

-- Step 3: Create a composite index for area + city + active status queries
-- Useful for finding active chefs in a specific area
CREATE INDEX IF NOT EXISTS idx_chefs_address_area_city_active ON chefs(address_area, address_city, is_active);

-- Step 4: Create index for geolocation queries
-- Useful for finding chefs near a location
CREATE INDEX IF NOT EXISTS idx_chefs_coordinates ON chefs(latitude, longitude) WHERE is_active = true;

-- Step 5: Verify the columns were added
-- Run this to confirm all columns exist:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'chefs' 
-- AND column_name LIKE 'address%'
-- ORDER BY ordinal_position;

-- Step 6: Verify indexes were created
-- Run this to confirm indexes exist:
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename = 'chefs' 
-- AND indexname LIKE 'idx_chefs_address%' OR indexname LIKE 'idx_chefs_coordinates';

-- ============================================================================
-- NOTES:
-- - The existing 'address' column continues to store the full address string
-- - New columns store individual components for structured queries
-- - latitude and longitude already exist and are used for delivery zone validation
-- - No data migration needed - new chefs will populate these fields automatically
-- - Old chefs will have NULL values for these columns (can be populated via admin panel)
-- ============================================================================

-- Example queries after deployment:
-- 
-- Find all chefs in Kurla West:
-- SELECT id, name, address, address_area FROM chefs 
-- WHERE address_area = 'Kurla West' AND is_active = true 
-- ORDER BY rating DESC;
--
-- Find all active chefs in Mumbai:
-- SELECT id, name, address_area, address_city FROM chefs 
-- WHERE address_city = 'Mumbai' AND is_active = true 
-- ORDER BY name;
--
-- Find chefs with incomplete address:
-- SELECT id, name, address, address_area FROM chefs 
-- WHERE address_area IS NULL AND is_active = true 
-- ORDER BY name;
--
-- Find all chefs near a location (with distance calculation in app):
-- SELECT id, name, address, latitude, longitude 
-- FROM chefs 
-- WHERE is_active = true AND address_area = 'Kurla West'
-- ORDER BY name;
--
-- Count chefs by area:
-- SELECT address_area, COUNT(*) as chef_count 
-- FROM chefs 
-- WHERE address_area IS NOT NULL AND is_active = true
-- GROUP BY address_area 
-- ORDER BY chef_count DESC;
