-- Migration: 0004_allow_null_email.sql
-- Purpose: Allow NULL values in users table email column
-- Reason: Email should be optional when creating new user accounts with phone number only

BEGIN;

-- Drop the existing NOT NULL constraint on email column (if it exists)
ALTER TABLE "users" 
  ALTER COLUMN "email" DROP NOT NULL;

-- Also update partner_users to allow NULL email
ALTER TABLE "partner_users" 
  ALTER COLUMN "email" DROP NOT NULL;

COMMIT;
