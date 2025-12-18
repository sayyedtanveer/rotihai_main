-- Safe Column Migration - Add columns only if they don't exist
-- Run this safely in production without worrying about duplicates

-- Add min_order_amount column to wallet_settings if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_settings' AND column_name = 'min_order_amount'
  ) THEN
    ALTER TABLE wallet_settings ADD COLUMN min_order_amount integer DEFAULT 0;
  END IF;
END $$;

-- Add max_usage_per_order column to wallet_settings if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_settings' AND column_name = 'max_usage_per_order'
  ) THEN
    ALTER TABLE wallet_settings ADD COLUMN max_usage_per_order integer NOT NULL DEFAULT 10;
  END IF;
END $$;

-- Add referrer_bonus column to wallet_settings if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_settings' AND column_name = 'referrer_bonus'
  ) THEN
    ALTER TABLE wallet_settings ADD COLUMN referrer_bonus integer NOT NULL DEFAULT 100;
  END IF;
END $$;

-- Add referred_bonus column to wallet_settings if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_settings' AND column_name = 'referred_bonus'
  ) THEN
    ALTER TABLE wallet_settings ADD COLUMN referred_bonus integer NOT NULL DEFAULT 50;
  END IF;
END $$;

-- Add min_order_amount column to referral_rewards if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_rewards' AND column_name = 'min_order_amount'
  ) THEN
    ALTER TABLE referral_rewards ADD COLUMN min_order_amount integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add max_referrals_per_month column to referral_rewards if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_rewards' AND column_name = 'max_referrals_per_month'
  ) THEN
    ALTER TABLE referral_rewards ADD COLUMN max_referrals_per_month integer DEFAULT 10;
  END IF;
END $$;

-- Add max_earnings_per_month column to referral_rewards if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_rewards' AND column_name = 'max_earnings_per_month'
  ) THEN
    ALTER TABLE referral_rewards ADD COLUMN max_earnings_per_month integer DEFAULT 500;
  END IF;
END $$;

-- Add expiry_days column to referral_rewards if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_rewards' AND column_name = 'expiry_days'
  ) THEN
    ALTER TABLE referral_rewards ADD COLUMN expiry_days integer DEFAULT 30;
  END IF;
END $$;

-- Add min_order_amount column to delivery_settings if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_settings' AND column_name = 'min_order_amount'
  ) THEN
    ALTER TABLE delivery_settings ADD COLUMN min_order_amount integer DEFAULT 0;
  END IF;
END $$;

-- Add original_price column to subscriptions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN original_price integer;
  END IF;
END $$;

-- Add discount_amount column to subscriptions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN discount_amount integer DEFAULT 0;
  END IF;
END $$;

-- Add coupon_discount column to subscriptions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'coupon_discount'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN coupon_discount integer DEFAULT 0;
  END IF;
END $$;

-- Add final_amount column to subscriptions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'final_amount'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN final_amount integer;
  END IF;
END $$;

-- Add payment_notes column to subscriptions if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payment_notes text;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallet_settings_created ON wallet_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_settings_active ON delivery_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_active ON referral_rewards(is_active);

-- Summary - Columns added only if they don't exist:
-- ✓ wallet_settings: min_order_amount, max_usage_per_order, referrer_bonus, referred_bonus
-- ✓ referral_rewards: min_order_amount, max_referrals_per_month, max_earnings_per_month, expiry_days
-- ✓ delivery_settings: min_order_amount
-- ✓ subscriptions: original_price, discount_amount, coupon_discount, final_amount, payment_notes
-- ✓ All indexes created safely
