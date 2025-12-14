-- ==========================================
-- COMPREHENSIVE ALTER SCRIPT FOR MISSING COLUMNS
-- Safe to run multiple times - uses IF NOT EXISTS
-- ==========================================

-- ===========================================
-- ENUMS (Create if not exists)
-- ===========================================

DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'manager', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'confirmed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_personnel_status AS ENUM ('available', 'busy', 'offline');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'paused', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_log_status AS ENUM ('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'missed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- USERS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS wallet_balance INT DEFAULT 0;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- ===========================================
-- ADMIN_USERS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- ===========================================
-- PARTNER_USERS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS partner_users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE IF EXISTS partner_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- ===========================================
-- CHEFS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS chefs ADD COLUMN IF NOT EXISTS latitude REAL DEFAULT 19.0728;
ALTER TABLE IF EXISTS chefs ADD COLUMN IF NOT EXISTS longitude REAL DEFAULT 72.8826;
ALTER TABLE IF EXISTS chefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ===========================================
-- PRODUCTS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS offer_percentage INT DEFAULT 0;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 4.5;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 20;

-- ===========================================
-- DELIVERY_PERSONNEL TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS delivery_personnel ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE IF EXISTS delivery_personnel ADD COLUMN IF NOT EXISTS total_deliveries INT DEFAULT 0;
ALTER TABLE IF EXISTS delivery_personnel ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 5.0;
ALTER TABLE IF EXISTS delivery_personnel ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- ===========================================
-- ORDERS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS subtotal INT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_fee INT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS discount INT DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS wallet_amount_used INT DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_date TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_slot_id VARCHAR;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS rejected_by TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_person_name TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivery_person_phone TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_qr_shown BOOLEAN DEFAULT FALSE;

-- ===========================================
-- COUPONS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS coupons ADD COLUMN IF NOT EXISTS used_count INT DEFAULT 0;

-- ===========================================
-- SUBSCRIPTIONS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS chef_assigned_at TIMESTAMP;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS delivery_slot_id VARCHAR;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS custom_items JSONB;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS original_price INT;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS discount_amount INT DEFAULT 0;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS wallet_amount_used INT DEFAULT 0;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS coupon_discount INT DEFAULT 0;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS final_amount INT;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS last_delivery_date TIMESTAMP;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS delivery_history JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS pause_start_date TIMESTAMP;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS pause_resume_date TIMESTAMP;

-- ===========================================
-- DELIVERY_TIME_SLOTS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS delivery_time_slots ADD COLUMN IF NOT EXISTS cutoff_hours_before INT;

-- ===========================================
-- ROTI_SETTINGS TABLE - Missing Columns
-- ===========================================
ALTER TABLE IF EXISTS roti_settings ADD COLUMN IF NOT EXISTS morning_block_start_time VARCHAR(5) DEFAULT '08:00';
ALTER TABLE IF EXISTS roti_settings ADD COLUMN IF NOT EXISTS morning_block_end_time VARCHAR(5) DEFAULT '11:00';
ALTER TABLE IF EXISTS roti_settings ADD COLUMN IF NOT EXISTS last_order_time VARCHAR(5) DEFAULT '23:00';
ALTER TABLE IF EXISTS roti_settings ADD COLUMN IF NOT EXISTS block_message TEXT DEFAULT 'Roti orders are not available from 8 AM to 11 AM.';

-- ===========================================
-- CREATE INDEXES (if not exists)
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user_created ON wallet_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_chef ON orders(chef_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_chef ON subscriptions(chef_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_subscription ON subscription_delivery_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_chefs_category ON chefs(category_id);
CREATE INDEX IF NOT EXISTS idx_products_chef ON products(chef_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ===========================================
-- VERIFY RESULTS
-- ===========================================
SELECT '✅ ALTER TABLE script completed successfully!' as status;

-- Show column count for each table
SELECT 
    tablename,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
