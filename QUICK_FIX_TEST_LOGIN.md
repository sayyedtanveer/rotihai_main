# Quick Fix - 500 Error on Test Login

## Problem
```
POST /api/admin/auth/test-login → 500 Error
Error: column "last_login_at" does not exist
```

## Solution (Pick ONE)

### Option A: Quick SQL Fix (30 seconds)
If your database already has data:

```sql
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
```

**Then restart server:**
```bash
npm run dev
```

---

### Option B: Full Reset (2 minutes)
If you want a fresh database with all data:

**Run this SQL script:**
- `reset-db-compact.sql` (UPDATED - includes all fixes)

OR

- `reset-db-fast.sql` (UPDATED - includes all fixes)

**Then restart:**
```bash
npm run dev
```

---

## Test It Works

```bash
curl -X POST http://localhost:5000/api/admin/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

**Should return:**
```json
{
  "accessToken": "...",
  "admin": {
    "id": "admin-1",
    "username": "admin",
    "email": "admin@rotihai.com",
    "role": "super_admin"
  }
}
```

---

## What Was Wrong?

The database was missing a column that the application code expected:
- ❌ Database: admin_users table (NO last_login_at column)
- ✅ Code: Expects last_login_at column

**Fixed by:** Adding `last_login_at TIMESTAMP` to admin_users table

---

## Done! ✅

Now you can:
- ✅ Use test-login endpoint (no password required)
- ✅ Use regular login endpoint (with password)
- ✅ Test admin features
- ✅ Test partner features

**Enjoy! 🚀**
