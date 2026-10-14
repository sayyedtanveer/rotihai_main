-- ============================================================
-- ROLLBACK: Product Variants System
-- ============================================================
-- This script REMOVES the product variants system if deployed
-- in error. Use ONLY if migration caused critical issues.
-- 
-- WARNING: Removes all variant data and reverts schema.
--
-- TO RUN:
-- psql -d rotihai_db < scripts/rollback-variants.sql
-- ============================================================

BEGIN TRANSACTION;

-- ============================================================
-- Step 1: Drop product_variants table
-- ============================================================

DROP TABLE IF EXISTS product_variants CASCADE;

-- ============================================================
-- Step 2: Remove has_variants column from products
-- ============================================================

ALTER TABLE products 
DROP COLUMN IF EXISTS has_variants;

-- ============================================================
-- Step 3: Drop indexes
-- ============================================================

DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_product_variants_active;
DROP INDEX IF EXISTS idx_product_variants_created;
DROP INDEX IF EXISTS idx_products_has_variants;

-- ============================================================
-- Step 4: Record rollback in migrations table
-- ============================================================

UPDATE schema_migrations 
SET applied_at = now()
WHERE version = 15;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = 15;

-- ============================================================
-- Step 5: Verify rollback successful
-- ============================================================

-- Check table removed
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'product_variants'
  )::text as "product_variants table exists (should be false)";

-- Check column removed
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'has_variants'
  )::text as "has_variants column exists (should be false)";

-- Check migration removed
SELECT 
  EXISTS(
    SELECT 1 FROM schema_migrations WHERE version = 15
  )::text as "migration 15 exists (should be false)";

-- Check product count unchanged
SELECT COUNT(*)::text as "total products" FROM products;

-- ============================================================
-- Transaction Summary
-- ============================================================

COMMIT;

RAISE NOTICE 'Product Variants system rolled back successfully';
RAISE NOTICE 'All variant data has been removed';
RAISE NOTICE 'Schema is reverted to pre-migration state';

-- ============================================================
-- POST-ROLLBACK VERIFICATION
-- ============================================================

-- Verify products table is intact
SELECT COUNT(*)::text as "products count" FROM products;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position LIMIT 1;

-- Verify no variant tables exist
SELECT 
  COUNT(*) as variant_tables_found 
FROM information_schema.tables 
WHERE table_name LIKE '%variant%';

-- Show remaining migrations
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY version DESC LIMIT 5;

