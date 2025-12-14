# Complete Database Reset - Instructions

## Option 1: Using TypeScript Script (Recommended) ⭐

This is the easiest way - it will handle everything automatically.

### Step 1: Run the reset script
```bash
npx tsx scripts/reset-database.ts
```

This script will automatically:
- Drop all existing tables
- Run migrations to recreate the schema
- Seed initial data (categories, chefs, products, etc.)

### What gets reset:
- ✅ All user data (customers, admins, partners)
- ✅ All orders and subscriptions
- ✅ All delivery logs
- ✅ All products and categories
- ✅ Database schema completely rebuilt

---

## Option 2: Using SQL Script (Direct PostgreSQL)

If you prefer direct database access:

### Step 1: Connect to your PostgreSQL database
```bash
# Using psql command line
psql -U postgres -d your_database_name
```

### Step 2: Run the reset SQL script
```bash
# From command line
psql -U postgres -d your_database_name -f reset-database.sql

# Or from inside psql prompt
\i reset-database.sql
```

### Step 3: Verify tables are dropped
```sql
-- Run this in PostgreSQL to check tables are gone
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
Should return: `(0 rows)` - meaning all tables are dropped

### Step 4: Run migrations manually
```bash
# After confirming tables are dropped
npx drizzle-kit migrate
```

### Step 5: Seed data
```bash
npx tsx scripts/seed.ts
```

---

## Option 3: Using pgAdmin (GUI Tool)

If you're using pgAdmin:

### Step 1: Open pgAdmin
- Go to your PostgreSQL server in pgAdmin

### Step 2: Right-click on database → Maintenance → Clear All
- This will drop all objects

### Step 3: Run migrations
```bash
npx drizzle-kit migrate
```

### Step 4: Seed initial data
```bash
npx tsx scripts/seed.ts
```

---

## Option 4: Complete Fresh Start (Nuclear Option)

If you want to drop and recreate the entire database:

### Step 1: Drop the entire database
```bash
# From your terminal
psql -U postgres -c "DROP DATABASE IF EXISTS your_database_name;"
psql -U postgres -c "CREATE DATABASE your_database_name;"
```

### Step 2: Run migrations
```bash
npx drizzle-kit migrate
```

### Step 3: Seed initial data
```bash
npx tsx scripts/seed.ts
```

---

## Verification Steps

After reset, verify everything is working:

### Check 1: Tables exist
```sql
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
```
Should return: `(1 row)` with count > 10

### Check 2: Sample data
```sql
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as chef_count FROM chefs;
SELECT COUNT(*) as product_count FROM products;
```

### Check 3: Run the application
```bash
npm run dev
```
- Go to http://localhost:5173
- You should see fresh data (reset categories, chefs, products)

---

## What Data Gets Created After Reset?

After running the seed script, you'll have:

### Categories (3)
- Rotis & Breads
- Lunch & Dinner
- Hotel Specials

### Chefs (Multiple per category)
- Roti Wala (Roti specialist)
- Meal Chef (Lunch/Dinner)
- Premium Chef (Hotel Specials)
- etc.

### Products (15+)
- Various rotis, meals, and dishes
- All with pricing and descriptions

### Admin Users
- Default admin account (if configured in seed.ts)

### Everything Else
- Empty orders table
- Empty subscriptions table
- Empty users table
- Ready for fresh testing

---

## Rollback / Restore Backup

If you have a backup you want to restore instead:

### Restore from SQL backup
```bash
psql -U postgres -d your_database_name -f backup-file.sql
```

### Restore from JSON backup
```bash
npx tsx scripts/restore-database.ts
```

---

## Recommended Workflow

1. **Run the reset script:**
   ```bash
   npx tsx scripts/reset-database.ts
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Test the application:**
   - Create new orders
   - Create subscriptions
   - Test all features

4. **If something breaks:**
   - Run the reset again
   - Start fresh

---

## Common Issues & Solutions

### Issue: "No such file or directory" for scripts
**Solution:** Make sure you're in the project root directory
```bash
cd c:\Users\sayye\source\repos\Replitrotihai
npx tsx scripts/reset-database.ts
```

### Issue: Database connection error
**Solution:** Check your `.env` file has correct `DATABASE_URL`
```bash
# Check your DATABASE_URL
echo $env:DATABASE_URL  # PowerShell
echo $DATABASE_URL      # Bash
```

### Issue: "permission denied" when running SQL
**Solution:** Make sure you have PostgreSQL admin rights or use correct credentials:
```bash
psql -U postgres -W  # Will prompt for password
```

### Issue: Migration fails
**Solution:** Check if tables already exist
```sql
-- List all tables
\dt

-- If tables exist, drop them first
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## Recommended: Start with Option 1 ⭐

```bash
# This one command does everything:
npx tsx scripts/reset-database.ts

# Then start your app:
npm run dev
```

That's it! Your database will be completely fresh and ready for testing.
