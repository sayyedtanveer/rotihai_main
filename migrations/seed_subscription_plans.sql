-- ============================================================
-- Rotihai – Subscription Plans Seed Script
-- ============================================================
-- Safe to run multiple times (idempotent via ON CONFLICT DO NOTHING)
-- Targets: subscription_plans table
-- UUID generation: gen_random_uuid() (PostgreSQL native, matches ORM)
--
-- Plans seeded:
--   1. Weekly Roti Plan  – 10 rotis/day, 7 days,  ₹630
--   2. Monthly Roti Plan – 10 rotis/day, 30 days, ₹2700
--
-- category_id: 'ce4cbd16-a9ef-4e8b-94fa-9cf1548062b8' = "Ghar Ka Khana" (production value).
-- ============================================================

-- ── Safety: verify the target table exists before inserting ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'subscription_plans'
  ) THEN
    RAISE EXCEPTION 'Table subscription_plans does not exist. Aborting.';
  END IF;
END $$;

-- ── Plan 1: Weekly Roti Plan ─────────────────────────────────
-- 10 rotis/day × 7 days = 70 total | ₹630 (₹9/roti)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  category_id,
  frequency,
  price,
  delivery_days,
  items,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Weekly Roti Plan',
  '10 fresh rotis delivered daily for 7 days (70 rotis total)',
  'ce4cbd16-a9ef-4e8b-94fa-9cf1548062b8',              -- Ghar Ka Khana category
  'weekly',                                            -- frequency enum
  630,                                                 -- ₹630 total
  '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
  '[{"productId":"prod1","name":"Butter Roti","quantity":10,"pricePerUnit":9}]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Weekly Roti Plan'
);

-- ── Plan 2: Monthly Roti Plan ────────────────────────────────
-- 10 rotis/day × 30 days = 300 total | ₹2700 (₹9/roti)
INSERT INTO subscription_plans (
  id,
  name,
  description,
  category_id,
  frequency,
  price,
  delivery_days,
  items,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Monthly Roti Plan',
  '10 fresh rotis delivered daily for 30 days (300 rotis total)',
  'ce4cbd16-a9ef-4e8b-94fa-9cf1548062b8',              -- Ghar Ka Khana category
  'monthly',                                           -- frequency enum
  2700,                                                -- ₹2700 total
  '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
  '[{"productId":"prod1","name":"Butter Roti","quantity":10,"pricePerUnit":9}]'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Monthly Roti Plan'
);

-- ============================================================
-- Post-seed verification (run to confirm rows were inserted)
-- ============================================================
-- SELECT id, name, frequency, price, is_active, created_at
-- FROM   subscription_plans
-- WHERE  name IN ('Weekly Roti Plan', 'Monthly Roti Plan')
-- ORDER  BY price;
