# Quick ALTER Script Reference

## 📄 File Location
```
alter-missing-columns.sql
```

## 🚀 Run in pgAdmin

1. Open pgAdmin → Query Tool
2. Open `alter-missing-columns.sql`
3. Select All (Ctrl+A)
4. Execute (F5)
5. Done! ✅

## 🎯 What It Does

✅ Adds 52+ missing columns to your database
✅ Creates 7 missing ENUM types
✅ Creates 13 performance indexes
✅ Safe to run multiple times
✅ Won't fail if columns exist

## 📊 Adds Columns To

| Table | Columns Added |
|-------|---------------|
| users | 3 |
| admin_users | 1 |
| partner_users | 2 |
| chefs | 3 |
| products | 6 |
| delivery_personnel | 4 |
| orders | 19 |
| coupons | 1 |
| subscriptions | 12 |
| delivery_time_slots | 1 |
| roti_settings | 4 |
| **TOTAL** | **56 columns** |

## ✅ After Running

Your app will no longer get 500 errors about missing columns:
- ❌ "column 'subtotal' does not exist"
- ❌ "column 'rating' does not exist"
- ❌ "column 'latitude' does not exist"
- ✅ All columns present!

## 🔍 Verify It Worked

```sql
-- Check if column exists
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'subtotal';
-- Should return: 1
```

## ⚡ Time

Takes: **5-30 seconds**

Safe: **YES - Multiple times**

---

**Run this, then your app will work!** 🚀
