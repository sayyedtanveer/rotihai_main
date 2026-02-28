-- Migration: 0013_add_chef_is_verified.sql
-- Purpose: Add is_verified to chefs for "Verified chef" badge (verified by platform)
-- Backward compatible: Default false for existing chefs

BEGIN;

ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN chefs.is_verified IS 'Verified chef badge - shown to customers as trusted by platform';

COMMIT;

-- ROLLBACK if needed:
-- ALTER TABLE chefs DROP COLUMN IF EXISTS is_verified;
