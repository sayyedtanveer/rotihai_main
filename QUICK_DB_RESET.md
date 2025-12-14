# Quick Database Reset - Fast SQL Method

## ⚡ Fastest Way - Copy & Paste into PostgreSQL

### Option 1: Using pgAdmin GUI (Fastest)
1. Open pgAdmin
2. Go to your database
3. Click on "Query Tool" or "SQL Editor"
4. Copy all content from `reset-db-fast.sql`
5. Paste it into the editor
6. Click "Execute" button (or press F5)
7. Done! ✅

### Option 2: Using psql Command Line
```bash
# Navigate to project directory
cd c:\Users\sayye\source\repos\Replitrotihai

# Run the SQL file
psql -U postgres -d your_database_name -f reset-db-fast.sql
```

Replace `your_database_name` with your actual database name.

### Option 3: Direct SQL Commands
If you have a SQL client open, copy-paste this entire script:

```sql
-- See reset-db-fast.sql file for complete script
```

---

## ✅ What Gets Created

### 3 Categories
- **Roti & Breads** (Breakfast/snacks)
- **Lunch & Dinner** (Main meals)
- **Hotel Specials** (Premium dining)

### 6 Chefs (2 per category)
**Roti Category:**
- Roti Wala (4.8★, 245 reviews)
- Bread Master (4.6★, 189 reviews)

**Lunch & Dinner Category:**
- Meal Chef (4.7★, 312 reviews)
- Quick Meals Expert (4.5★, 167 reviews)

**Hotel Specials Category:**
- Premium Chef (4.9★, 428 reviews)
- Gourmet Specialist (4.7★, 256 reviews)

### 12 Products (3-4 per category)
**Roti Products:**
- Plain Roti (5 pcs) - ₹40
- Butter Roti (5 pcs) - ₹50
- Paratha Mix (5 pcs) - ₹60
- Bajra Roti (5 pcs) - ₹55

**Lunch & Dinner Products:**
- Chicken Curry with Rice - ₹150
- Paneer Butter Masala - ₹140
- Dal Makhni with Rice - ₹120
- Mixed Vegetable Curry - ₹100

**Hotel Specials Products:**
- Biryani Special - ₹250
- Tandoori Chicken Plate - ₹220
- Fish Amritsari - ₹280
- Paneer Tikka Masala Deluxe - ₹240

---

## 🎯 Next Steps After Running Script

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Go to http://localhost:5173**

3. **You'll see:**
   - 3 categories with master data
   - 6 chefs with ratings
   - 12 products with prices
   - All ready for testing orders and subscriptions

---

## 📊 Database Structure

The script creates:
- ✅ All 10+ tables with proper foreign keys
- ✅ All enums (admin_role, payment_status, delivery_personnel_status)
- ✅ Proper indexes for performance
- ✅ Master data for immediate testing

---

## ⚠️ Important Notes

- **This completely resets the database** - all existing data will be deleted
- **No migrations needed** - script recreates everything from scratch
- **Takes ~2-5 seconds** - much faster than migrations
- **Safe for testing** - designed for development environment

---

## Verify It Worked

After running the script, check:

```sql
-- Should show 3 rows
SELECT * FROM categories;

-- Should show 6 rows
SELECT * FROM chefs;

-- Should show 12 rows
SELECT * FROM products;

-- Should show 6 rows (2 per category)
SELECT category_id, COUNT(*) as chef_count FROM chefs GROUP BY category_id;

-- Should show 3-4 rows per category
SELECT category_id, COUNT(*) as product_count FROM products GROUP BY category_id;
```

---

## 🚀 You're All Set!

Your database is now:
- ✅ Completely reset
- ✅ Has master data
- ✅ Ready for testing

Just run `npm run dev` and start testing! 🎉
