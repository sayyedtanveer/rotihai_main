-- ==============================================================================
-- DATABASE VERIFICATION & INSPECTION SCRIPT
-- ==============================================================================
-- Use this script to verify all tables exist and check their structure
-- Run this after applying the migration to confirm all tables are created
-- ==============================================================================

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ============================================================================

-- Check all tables in the public schema
SELECT 
  tablename,
  tableowner,
  schemaname,
  'EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 2: TABLE STRUCTURE VERIFICATION
-- ============================================================================

-- Verify sessions table structure
\d sessions

-- Verify users table structure
\d users

-- Verify admin_users table structure
\d admin_users

-- Verify orders table structure
\d orders

-- Verify subscriptions table structure
\d subscriptions

-- Verify chefs table structure
\d chefs

-- Verify products table structure
\d products

-- ============================================================================
-- SECTION 3: INDEX VERIFICATION
-- ============================================================================

-- List all indexes in the database
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 4: ENUM TYPES VERIFICATION
-- ============================================================================

-- Check all enum types
SELECT 
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_enum
GROUP BY typname
ORDER BY typname;

-- ============================================================================
-- SECTION 5: TABLE ROW COUNT
-- ============================================================================

-- Get row count for all tables
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECTION 6: MISSING TABLES CHECK
-- ============================================================================

-- Check which expected tables might be missing
WITH expected_tables AS (
  SELECT 'sessions' as table_name
  UNION ALL SELECT 'users'
  UNION ALL SELECT 'admin_users'
  UNION ALL SELECT 'partner_users'
  UNION ALL SELECT 'categories'
  UNION ALL SELECT 'chefs'
  UNION ALL SELECT 'products'
  UNION ALL SELECT 'delivery_personnel'
  UNION ALL SELECT 'orders'
  UNION ALL SELECT 'payment_verification_log'
  UNION ALL SELECT 'delivery_settings'
  UNION ALL SELECT 'cart_settings'
  UNION ALL SELECT 'coupons'
  UNION ALL SELECT 'coupon_usages'
  UNION ALL SELECT 'referrals'
  UNION ALL SELECT 'wallet_transactions'
  UNION ALL SELECT 'wallet_settings'
  UNION ALL SELECT 'payout_transactions'
  UNION ALL SELECT 'referral_rewards'
  UNION ALL SELECT 'delivery_time_slots'
  UNION ALL SELECT 'roti_settings'
  UNION ALL SELECT 'visitors'
  UNION ALL SELECT 'delivery_areas'
  UNION ALL SELECT 'admin_settings'
  UNION ALL SELECT 'push_subscriptions'
  UNION ALL SELECT 'newsletter_subscribers'
  UNION ALL SELECT 'pending_broadcasts'
  UNION ALL SELECT 'subscription_plans'
  UNION ALL SELECT 'subscriptions'
  UNION ALL SELECT 'subscription_delivery_logs'
  UNION ALL SELECT 'promotional_banners'
),
actual_tables AS (
  SELECT tablename FROM pg_tables WHERE schemaname = 'public'
)
SELECT 
  et.table_name,
  CASE WHEN at.tablename IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.tablename
ORDER BY status DESC, table_name;

-- ============================================================================
-- SECTION 7: COLUMN COUNT BY TABLE
-- ============================================================================

-- Check column count for critical tables
SELECT 
  t.tablename,
  COUNT(a.attname) as column_count
FROM pg_tables t
LEFT JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
WHERE t.schemaname = 'public' AND a.attnum > 0
GROUP BY t.tablename
ORDER BY t.tablename;

-- ============================================================================
-- SECTION 8: DATA TYPE CHECK
-- ============================================================================

-- Check data types in critical tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN (
  'users', 'orders', 'subscriptions', 'chefs', 'products'
)
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SECTION 9: CONSTRAINT VERIFICATION
-- ============================================================================

-- Check unique constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'UNIQUE'
ORDER BY table_name;

-- Check primary keys
SELECT 
  table_name,
  constraint_name
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'PRIMARY KEY'
ORDER BY table_name;

-- ============================================================================
-- SECTION 10: QUICK HEALTH CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
  check_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Check critical tables exist
  RETURN QUERY
  SELECT 
    'Critical Tables'::text,
    CASE WHEN COUNT(*) = 10 THEN 'OK' ELSE 'FAILED' END::text,
    COUNT(*)::text || ' / 10 critical tables found'::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN (
    'sessions', 'users', 'admin_users', 'orders', 'chefs',
    'products', 'subscriptions', 'coupons', 'wallet_transactions', 'referrals'
  );

  -- Check key indexes exist
  RETURN QUERY
  SELECT 
    'Indexes'::text,
    CASE WHEN COUNT(*) > 20 THEN 'OK' ELSE 'NEEDS_REVIEW' END::text,
    COUNT(*)::text || ' indexes found'::text
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Check enum types
  RETURN QUERY
  SELECT 
    'Enum Types'::text,
    CASE WHEN COUNT(*) = 8 THEN 'OK' ELSE 'FAILED' END::text,
    COUNT(*)::text || ' / 8 enum types found'::text
  FROM pg_type
  WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM check_database_health();

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

/*
DATABASE VERIFICATION SCRIPT

This script provides comprehensive verification of the database setup.

Run the sections in order:
1. TABLE EXISTENCE CHECK - Verify all 30+ tables exist
2. TABLE STRUCTURE VERIFICATION - Inspect specific table schemas
3. INDEX VERIFICATION - Confirm all optimization indexes are in place
4. ENUM TYPES VERIFICATION - Check enum types are defined
5. TABLE ROW COUNT - See how many records in each table
6. MISSING TABLES CHECK - Identify any missing tables (status should all be 'EXISTS')
7. COLUMN COUNT BY TABLE - Verify table structures
8. DATA TYPE CHECK - Ensure correct column types
9. CONSTRAINT VERIFICATION - Check unique and primary keys
10. QUICK HEALTH CHECK - Overall database health status

To run interactively in psql:
  \i /path/to/VERIFY_DATABASE.sql

Expected Results:
  ✓ All tables should show 'EXISTS'
  ✓ 30+ tables should be listed
  ✓ 40+ indexes should be found
  ✓ 8 enum types should exist
  ✓ Health check should show 'OK' for all items
*/
