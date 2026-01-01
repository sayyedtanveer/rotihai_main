-- Migration: Add address column to chefs table
-- Date: December 31, 2025
-- Purpose: Enable chef location tracking by storing physical address

-- Step 1: Add address column (if it doesn't exist)
ALTER TABLE chefs
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Verify the column was added
-- After running the above, verify with:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'chefs' AND column_name = 'address';

-- Result should show:
-- column_name | data_type
-- ------------|----------
-- address     | text

-- Step 3: Optional - Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chefs_address ON chefs(address);

-- Step 4: Verify all columns in chefs table
-- SELECT * FROM chefs LIMIT 1;
-- Should show: id, name, phone, description, image, rating, review_count, category_id, address, latitude, longitude, is_active, default_delivery_fee, delivery_fee_per_km, free_delivery_threshold
