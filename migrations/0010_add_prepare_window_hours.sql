-- Migration: 0010_add_prepare_window_hours.sql
-- Purpose: Add prepareWindowHours column to roti_settings table
-- Description: Allows admin to configure how many hours before scheduled delivery 
--              time the chef can start preparing orders (currently hardcoded as 8 hours)

BEGIN;

-- Add the new column with default value of 2 hours
ALTER TABLE roti_settings
  ADD COLUMN IF NOT EXISTS prepare_window_hours integer NOT NULL DEFAULT 2;

-- Add comment to document the column
COMMENT ON COLUMN roti_settings.prepare_window_hours IS 'Hours before scheduled delivery time when chef can start preparing (1-24 hours, default 2)';

COMMIT;

-- ROLLBACK (manual):
-- To remove the column, run:
-- ALTER TABLE roti_settings DROP COLUMN IF EXISTS prepare_window_hours;
