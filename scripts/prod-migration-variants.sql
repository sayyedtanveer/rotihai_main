-- ============================================================
-- PRODUCTION MIGRATION: Product Variants System
-- ============================================================
-- Migration Name: 0015_create_product_variants
-- Date: 2026-10-13
-- Purpose: Enable product variants (Half/Full/Large sizes)
-- 
-- BEFORE RUNNING:
-- 1. Backup database: pg_dump rotihai_db > backup_$(date +%s).sql
-- 2. Test on staging database first
-- 3. Schedule during low-traffic hours
-- 4. Have database restore plan ready
--
-- TO RUN:
-- psql -d rotihai_db < scripts/prod-migration-variants.sql
-- ============================================================

BEGIN TRANSACTION;

-- ============================================================
-- Step 1: Create product_variants table
-- ============================================================

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant Identity
  name VARCHAR(100) NOT NULL,              -- "Half", "Full", "Regular", "Large", "Family", custom
  display_name VARCHAR(100),               -- Optional: Friendly display (e.g., "Half Plate")
  description TEXT,                        -- Optional: Variant description
  
  -- Pricing
  hotel_price INTEGER,                     -- Optional: Override parent hotel price (cost)
  price INTEGER NOT NULL,                  -- Variant selling price (₹)
  margin_percent DECIMAL(5,2),             -- Auto-calculated: ((price - hotel_price) / hotel_price) * 100
  
  -- Availability
  is_available BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  low_stock_threshold INTEGER NOT NULL DEFAULT 20,
  
  -- Ordering & Display
  sort_order INTEGER NOT NULL DEFAULT 0,   -- Lower = first in variant list
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_variant_per_product UNIQUE(product_id, name),
  CONSTRAINT variant_sort_order CHECK(sort_order >= 0)
);

COMMENT ON TABLE product_variants IS 
  'Product variants table enables products to be sold in multiple sizes/options with different prices.
   Each product can have zero (single-price) or many variants (multi-size).
   Normalized design avoids product duplication and supports clean cart deduplication.';

-- ============================================================
-- Step 2: Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
  ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_active 
  ON product_variants(product_id, is_active);

CREATE INDEX IF NOT EXISTS idx_product_variants_created 
  ON product_variants(created_at);

-- ============================================================
-- Step 3: Add has_variants column to products table
-- ============================================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.has_variants IS 
  'Flag indicating if product has multiple variants.
   true = product has multiple variants (use product_variants table)
   false = legacy single-price product (use price field directly)';

-- ============================================================
-- Step 4: Create index for querying variant products
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_has_variants 
  ON products(has_variants);

-- ============================================================
-- Step 5: Verify schema created successfully
-- ============================================================

-- Check table structure
\dt product_variants

-- Check indexes
\di idx_product_variants*
\di idx_products_has_variants

-- Check new column on products
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'has_variants';

-- ============================================================
-- Step 6: Record migration completion
-- ============================================================

-- Create migrations tracking table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  description VARCHAR(255),
  applied_at TIMESTAMP DEFAULT now()
);

-- Record this migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES (15, 'Create product variants system', now())
ON CONFLICT (version) DO NOTHING;

-- Show migration history
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY version DESC LIMIT 5;

-- ============================================================
-- Transaction Summary
-- ============================================================

COMMIT;

-- ============================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================

-- 1. Verify product_variants table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'product_variants'
ORDER BY ordinal_position;

-- 2. Verify has_variants column on products
SELECT COUNT(*)::text as "products table columns" 
FROM information_schema.columns 
WHERE table_name = 'products';

-- 3. Verify indexes created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('product_variants', 'products')
AND indexname LIKE 'idx_%variants%'
ORDER BY indexname;

-- 4. Check for any existing variants (should be 0 initially)
SELECT COUNT(*)::text as "existing variants" 
FROM product_variants;

-- 5. Check for products with has_variants flag
SELECT COUNT(*)::text as "products with variants" 
FROM products 
WHERE has_variants = true;

-- ============================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================
-- 
-- DROP TABLE IF EXISTS product_variants;
-- ALTER TABLE products DROP COLUMN IF EXISTS has_variants;
-- DROP INDEX IF EXISTS idx_products_has_variants;
-- DELETE FROM schema_migrations WHERE version = 15;
--
-- ============================================================

