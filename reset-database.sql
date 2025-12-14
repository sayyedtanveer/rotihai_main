/**
 * SQL Script to Reset PostgreSQL Database
 * 
 * This script uses raw SQL to:
 * 1. Drop all tables and reset sequences
 * 2. Clear all data completely
 * 
 * Usage: Load this file in your PostgreSQL client and run all statements
 * Or use: psql -U postgres -d your_db_name -f reset-database.sql
 */

-- Drop all tables in the public schema
DROP TABLE IF EXISTS subscription_delivery_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS delivery_personnel CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS partner_users CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS delivery_personnel_status CASCADE;

-- Reset all sequences
DO $$ 
DECLARE 
    seq record;
BEGIN 
    FOR seq IN 
        SELECT sequence_schema, sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP 
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(seq.sequence_schema) || '.' || quote_ident(seq.sequence_name) || ' CASCADE';
    END LOOP;
END $$;

-- Confirm reset
SELECT 'Database reset complete! All tables and sequences have been dropped.' AS status;
