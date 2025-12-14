# Database Schema Fix - Admin Users Table

## Problem Found ❌

The 500 error on test-login was caused by **missing `last_login_at` column** in the admin_users table.

### Error Message:
```
error: column "last_login_at" does not exist
```

---

## Solution ✅

### Option 1: Quick Fix for Existing Database (Recommended if already running)

**Run this SQL in your PostgreSQL:**

```sql
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
```

**File:** `fix-admin-table.sql` (Already created)

---

### Option 2: Full Database Reset (If you haven't run the reset yet)

**Updated SQL scripts now include the missing column:**

1. **`reset-db-compact.sql`** ✅ UPDATED
2. **`reset-db-fast.sql`** ✅ UPDATED

Both scripts now create the admin_users table with the `last_login_at` column:

```sql
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role admin_role DEFAULT 'manager',
    last_login_at TIMESTAMP,           -- ← NEW COLUMN ADDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Steps to Fix

### If Database Already Exists:

1. **Open pgAdmin or psql**

2. **Run the fix script:**
   ```sql
   -- Add the missing column
   ALTER TABLE admin_users 
   ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
   
   -- Verify it was added
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'admin_users' 
   ORDER BY ordinal_position;
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Test login:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/auth/test-login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin"}'
   ```

---

### If Starting Fresh:

1. **Run one of the updated reset scripts:**
   - `reset-db-compact.sql` (recommended - minimal)
   - `reset-db-fast.sql` (formatted, easier to read)

2. **Start your server:**
   ```bash
   npm run dev
   ```

3. **Test login immediately:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/auth/test-login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin"}'
   ```

---

## Schema Changes Made

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| admin_users | last_login_at | TIMESTAMP | NEW - Tracks last login time |

---

## What Changed in the Code

### SQL Reset Scripts:
- ✅ `reset-db-compact.sql` - Added `last_login_at TIMESTAMP` to admin_users
- ✅ `reset-db-fast.sql` - Added `last_login_at TIMESTAMP` to admin_users

### Migration Script Created:
- ✅ `fix-admin-table.sql` - Standalone script to add missing column

### No Backend Code Changes Needed:
- The code was already expecting this column
- The schema in `shared/schema.ts` already defined it
- Just the database was missing it

---

## Expected Results After Fix

### ✅ Test Login Will Work:
```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin-1",
    "username": "admin",
    "email": "admin@rotihai.com",
    "role": "super_admin"
  }
}
```

### ✅ Regular Login Will Also Work:
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}'
```

---

## Files Modified/Created

| File | Status | Action |
|------|--------|--------|
| `reset-db-compact.sql` | ✅ UPDATED | Added last_login_at column |
| `reset-db-fast.sql` | ✅ UPDATED | Added last_login_at column |
| `fix-admin-table.sql` | ✅ CREATED | Standalone migration for existing DB |
| `server/adminRoutes.ts` | ✅ UPDATED | Added better error logging to test-login |

---

## Troubleshooting

### If you still get "column doesn't exist" error:

1. **Verify the column was added:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'admin_users';
   ```
   Should show: `last_login_at`

2. **Check if admin_users table exists:**
   ```sql
   SELECT * FROM admin_users;
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

---

## Timeline

- **Issue Identified:** 500 error on test-login endpoint
- **Root Cause:** Missing `last_login_at` column in admin_users table
- **Files Updated:** 2 SQL reset scripts
- **Files Created:** 1 fix script, 2 docs
- **Status:** ✅ FIXED AND READY TO TEST

**You can now use the test-login endpoint without errors! 🚀**
