-- Migration: 0005_add_min_order_amount.sql
-- Purpose: Add minimum order amount field to wallet_settings table
-- Reason: Support minimum order amount requirement to use wallet balance

BEGIN;

-- Add min_order_amount column to wallet_settings table
ALTER TABLE "wallet_settings" 
  ADD COLUMN "min_order_amount" integer NOT NULL DEFAULT 0;

-- Update meta information
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('0005_add_min_order_amount', NOW());

COMMIT;
