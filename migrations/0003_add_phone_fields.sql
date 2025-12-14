-- Migration: 0003_add_phone_fields.sql
-- Purpose: Add phone columns to admin_users and chefs tables for WhatsApp notifications
-- Up: add phone columns for storing phone numbers for WhatsApp notifications
-- Down: drop the columns (see bottom of file)

BEGIN;

-- Add nullable text column for phone to admin_users table
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS phone text;

-- Add nullable text column for phone to chefs table
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS phone text;

COMMIT;

-- Down migration (if needed)
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE chefs DROP COLUMN IF EXISTS phone;
