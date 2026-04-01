-- ============================================================
-- FSSAI Compliance Migration
-- Extends `chefs` table with 4 nullable compliance columns.
-- All fields are optional → fully backward-compatible.
-- Run once against prod DB via psql / Neon console.
-- ============================================================

-- 1. FSSAI licence number (text, nullable)
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS fssai_number TEXT;

-- 2. Whether admin has verified the FSSAI licence (boolean, defaults false)
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS fssai_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Type of kitchen: 'home' | 'restaurant' (text, nullable)
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS chef_type TEXT
    CHECK (chef_type IS NULL OR chef_type IN ('home', 'restaurant'));

-- 4. Overall compliance status (text, defaults 'pending')
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS compliance_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (compliance_status IN ('pending', 'verified', 'rejected'));

-- ============================================================
-- Post-migration verification (run this to confirm columns)
-- ============================================================
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM   information_schema.columns
-- WHERE  table_name = 'chefs'
--   AND  column_name IN ('fssai_number','fssai_verified','chef_type','compliance_status');
