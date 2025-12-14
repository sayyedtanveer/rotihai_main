# ALTER TABLE Script - Add Missing Columns

## 📋 Overview

This script adds **all missing columns** to your existing database tables. It's safe to run multiple times because all commands use `IF NOT EXISTS`.

**File:** `alter-missing-columns.sql`

---

## 🎯 What This Script Does

✅ Creates missing **ENUMs** (7 enums)
✅ Adds missing columns to **13 tables**
✅ Creates missing **indexes** (13 indexes)
✅ **Safe** - Won't fail if columns already exist
✅ **Idempotent** - Can run multiple times

---

## 📊 Columns Being Added

### users (3 columns)
- `referral_code` - VARCHAR(20) UNIQUE
- `wallet_balance` - INT DEFAULT 0
- `last_login_at` - TIMESTAMP

### admin_users (1 column)
- `last_login_at` - TIMESTAMP

### partner_users (2 columns)
- `profile_picture_url` - TEXT
- `last_login_at` - TIMESTAMP

### chefs (3 columns)
- `latitude` - REAL DEFAULT 19.0728
- `longitude` - REAL DEFAULT 72.8826
- `is_active` - BOOLEAN DEFAULT TRUE

### products (6 columns)
- `offer_percentage` - INT DEFAULT 0
- `rating` - DECIMAL(2,1) DEFAULT 4.5
- `review_count` - INT DEFAULT 0
- `is_veg` - BOOLEAN DEFAULT TRUE
- `is_customizable` - BOOLEAN DEFAULT FALSE
- `low_stock_threshold` - INT DEFAULT 20

### delivery_personnel (4 columns)
- `password_hash` - TEXT
- `total_deliveries` - INT DEFAULT 0
- `rating` - DECIMAL(2,1) DEFAULT 5.0
- `last_login_at` - TIMESTAMP

### orders (19 columns)
- `subtotal` - INT
- `delivery_fee` - INT
- `discount` - INT DEFAULT 0
- `coupon_code` - VARCHAR(50)
- `wallet_amount_used` - INT DEFAULT 0
- `delivery_time` - TEXT
- `delivery_date` - TEXT
- `delivery_slot_id` - VARCHAR
- `approved_by` - TEXT
- `rejected_at` - TIMESTAMP
- `approved_at` - TIMESTAMP
- `rejected_by` - TEXT
- `rejection_reason` - TEXT
- `assigned_to` - TEXT
- `delivery_person_name` - TEXT
- `delivery_person_phone` - TEXT
- `assigned_at` - TIMESTAMP
- `picked_up_at` - TIMESTAMP
- `delivered_at` - TIMESTAMP
- `payment_qr_shown` - BOOLEAN DEFAULT FALSE

### coupons (1 column)
- `used_count` - INT DEFAULT 0

### subscriptions (12 columns)
- `chef_assigned_at` - TIMESTAMP
- `delivery_slot_id` - VARCHAR
- `custom_items` - JSONB
- `original_price` - INT
- `discount_amount` - INT DEFAULT 0
- `wallet_amount_used` - INT DEFAULT 0
- `coupon_discount` - INT DEFAULT 0
- `final_amount` - INT
- `payment_notes` - TEXT
- `last_delivery_date` - TIMESTAMP
- `delivery_history` - JSONB DEFAULT '[]'
- `pause_start_date` - TIMESTAMP
- `pause_resume_date` - TIMESTAMP

### delivery_time_slots (1 column)
- `cutoff_hours_before` - INT

### roti_settings (4 columns)
- `morning_block_start_time` - VARCHAR(5) DEFAULT '08:00'
- `morning_block_end_time` - VARCHAR(5) DEFAULT '11:00'
- `last_order_time` - VARCHAR(5) DEFAULT '23:00'
- `block_message` - TEXT

---

## 🚀 How to Run

### Option 1: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Copy entire content from `alter-missing-columns.sql`
5. Paste into Query Tool
6. Click **Execute** (F5)
7. Check results at bottom

### Option 2: Using psql Command Line

```bash
psql -U postgres -d your_database_name -f alter-missing-columns.sql
```

Replace:
- `postgres` with your PostgreSQL username
- `your_database_name` with your database name

### Option 3: Using Windows CMD

```cmd
cd C:\Users\sayye\source\repos\Replitrotihai
psql -U postgres -d rotihai -f alter-missing-columns.sql
```

### Option 4: Using PowerShell

```powershell
$env:PGPASSWORD = "your_password"
psql -U postgres -d rotihai -f alter-missing-columns.sql
```

---

## ✅ Expected Output

If successful, you'll see:
```
✅ ALTER TABLE script completed successfully!

 tablename                    | column_count
------------------------------+--------------
 admin_users                  |     7
 cart_settings                |     5
 categories                   |     5
 ...
```

---

## 🔍 Verify Results

After running the script, verify columns were added:

### Check specific table
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

### Check all tables
```sql
SELECT 
    tablename,
    (SELECT count(*) FROM information_schema.columns 
     WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check specific column exists
```sql
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'referral_code'
);
-- Should return: true
```

---

## ⚠️ Troubleshooting

### Error: "relation does not exist"
**Cause:** Table doesn't exist yet
**Solution:** Run the full reset script first to create tables

### Error: "column already exists"
**Cause:** Column was already added
**Solution:** This is safe - script uses IF NOT EXISTS

### Error: "type already exists"
**Cause:** ENUM type already created
**Solution:** This is safe - uses exception handling

### Error: "permission denied"
**Cause:** User doesn't have ALTER TABLE permission
**Solution:** Run as database owner or with admin privileges

---

## 🔄 Safe to Run Multiple Times

The script is **idempotent** - you can run it multiple times safely:

✅ `IF NOT EXISTS` prevents duplicate columns
✅ `DO $$ ... EXCEPTION WHEN ...` handles duplicate enums
✅ `CREATE INDEX IF NOT EXISTS` prevents duplicate indexes

**Safe to run even if:**
- Some columns already exist
- Enums already created
- Indexes already present

---

## 📝 What Gets Created

### ENUMs (7 total)
- `admin_role`
- `payment_status`
- `delivery_personnel_status`
- `discount_type`
- `subscription_status`
- `subscription_frequency`
- `delivery_log_status`

### Tables Modified (13 total)
- users
- admin_users
- partner_users
- chefs
- products
- delivery_personnel
- orders
- coupons
- subscriptions
- delivery_time_slots
- roti_settings

### Indexes Created (13 total)
Performance indexes for:
- Sessions expiry
- Coupon usage lookups
- Referral tracking
- Wallet transactions
- Orders and subscriptions
- Delivery logs

---

## ✨ After Running the Script

Your database will have:
✅ All required columns
✅ All necessary indexes
✅ All enum types
✅ Proper defaults
✅ Schema aligned with application code

---

## 🎯 Next Steps

1. ✅ Run `alter-missing-columns.sql`
2. ✅ Verify columns with SQL query
3. ✅ Run application: `npm run dev`
4. ✅ Test endpoints
5. ✅ Check for 500 errors

If you still get column errors, check:
- Table exists: `\dt` in psql
- Column exists: `\d table_name` in psql
- Data type matches schema: Check `schema.ts`

---

## 💡 Pro Tips

### Backup Before Running
```bash
pg_dump -U postgres -d rotihai > backup.sql
```

### Run in Transaction (Rollback on Error)
```sql
BEGIN;
-- Run the script here
ROLLBACK;  -- If you want to undo
-- OR
COMMIT;    -- If everything is good
```

### Check Log for Warnings
Many "Column already exists" messages are normal and expected.

---

## Support

If you encounter issues:
1. Check PostgreSQL is running
2. Verify database connection
3. Check user permissions
4. Review PostgreSQL logs
5. Run verification queries

**Expected time to run:** 5-30 seconds

**Safe to run:** YES - Multiple times

**Backup recommended:** YES - Before first run

---

**You're ready to go!** 🚀
