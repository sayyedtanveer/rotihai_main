# Admin Login Fix - API Client Centralization

## Status: ✅ PARTIALLY COMPLETE

The admin login system has been updated to use the centralized axios API client that reads the `VITE_API_URL` environment variable. However, for it to work on Vercel, you **must configure the environment variable**.

---

## What Was Fixed

### 1. ✅ Admin Login Page (`client/src/pages/admin/AdminLogin.tsx`)
**Before:** Used `fetch("/api/admin/auth/login", ...)`
**After:** Uses `api.post("/api/admin/auth/login", data)`

**Fixed endpoints:**
- `/api/admin/auth/login` - Login with credentials
- `/api/admin/auth/reset-password` - Reset forgotten password
- `/api/admin/auth/test-login` - Test login button

### 2. ✅ Admin Dashboard (`client/src/pages/admin/AdminDashboard.tsx`)
**Before:** Hardcoded Bearer tokens in fetch headers
**After:** All queries use `api.get()` with automatic token handling

**Updated queries:**
- `/api/admin/dashboard/metrics` - Dashboard stats
- `/api/admin/reports/visitors` - Visitor analytics
- `/api/admin/partners` - Partner list
- `/api/admin/delivery-personnel` - Delivery staff

### 3. ✅ Admin Layout (`client/src/components/admin/AdminLayout.tsx`)
**Before:** Used `fetch("/api/admin/auth/logout", ...)`
**After:** Uses `api.post("/api/admin/auth/logout")`

---

## What Still Needs Work

### Remaining Admin Pages (Non-Critical for Login)
The following pages still use direct `fetch()` calls and should be updated in batch 2:

- `AdminInventory.tsx` - 2 fetch calls
- `AdminChefs.tsx` - 1 fetch call
- `AdminDeliveryTimeSlots.tsx` - 4 fetch calls
- `AdminDeliverySettings.tsx` - 6 fetch calls
- `AdminCategories.tsx` - 2 fetch calls
- `AdminManagement.tsx` - Multiple fetch calls
- `PromotionalBannersDrawer.tsx` - 4 fetch calls

**Impact:** These won't affect login but will fail when making admin requests. To be fixed in next sprint.

---

## Critical Configuration Needed

### 🚨 MUST DO: Set Environment Variable in Vercel

Your Vercel frontend needs to know where the Render backend is located:

**Environment Variable Name:** `VITE_API_URL`
**Environment Variable Value:** `https://rotihai-backend.onrender.com`

### How to Set It in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `rotihai` project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://rotihai-backend.onrender.com`
   - **Environments:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** the project (or it will auto-deploy on next git push)

---

## How the API Client Works

```typescript
// apiClient.ts - Centralized Axios Instance
const apiUrl = import.meta.env.VITE_API_URL; // ← Gets URL from Vercel env var

const api = axios.create({
  baseURL: apiUrl, // ← All requests prepend this URL
  withCredentials: true, // ← Includes auth tokens
  timeout: 30000,
});
```

**Example Flow:**
```
Before Fix (doesn't work on Vercel):
  Frontend: api.post("/api/admin/auth/login", ...)
  → Vercel resolves to: https://rotihai.vercel.app/api/admin/auth/login ❌
  → But backend is on https://rotihai-backend.onrender.com 🔴

After Fix (works on Vercel):
  Frontend: api.post("/api/admin/auth/login", ...)
  → VITE_API_URL = "https://rotihai-backend.onrender.com"
  → Axios creates: https://rotihai-backend.onrender.com/api/admin/auth/login ✅
  → Hits Render backend correctly 🟢
```

---

## Testing the Fix

### 1. **Local Testing (Before Deploying)**
```bash
# Set the environment variable locally
$env:VITE_API_URL="https://rotihai-backend.onrender.com"

# Run dev server
npm run dev

# Try to login at http://localhost:5173/admin/login
# Should work if Render backend is running
```

### 2. **On Vercel After Env Variable Set**
1. After setting `VITE_API_URL` in Vercel, the app will redeploy
2. Navigate to `https://rotihai.vercel.app/admin/login`
3. Enter credentials: `admin` / `admin123`
4. Should redirect to `/admin/dashboard` ✅

### 3. **Debug - Check Browser Network Tab**
- Open DevTools → Network tab
- Click Login button
- Look for request to `/api/admin/auth/login`
- **Should show:** `https://rotihai-backend.onrender.com/api/admin/auth/login`
- **NOT:** `https://rotihai.vercel.app/api/admin/auth/login`

---

## Render Backend Status

✅ Backend is running at: `https://rotihai-backend.onrender.com`
✅ Can be tested directly:
```bash
curl -X POST https://rotihai-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return:
```json
{
  "accessToken": "...",
  "admin": {
    "id": "...",
    "username": "admin",
    "role": "super_admin"
  }
}
```

---

## Admin Credentials

**Username:** `admin`
**Password:** `admin123`

(Or if you created a different admin with the create-admin.ts script, use those credentials)

---

## Summary Checklist

- [x] Fix AdminLogin.tsx to use axios
- [x] Fix AdminDashboard.tsx to use axios
- [x] Fix AdminLayout logout to use axios
- [ ] **CRITICAL:** Set `VITE_API_URL` env var in Vercel
- [ ] Verify admin login works on Vercel
- [ ] Test creating/editing chefs from admin panel
- [ ] Update remaining admin pages (non-critical, can be done later)

---

## Quick Reference

| Component | File | Status | Impact |
|-----------|------|--------|--------|
| Login | AdminLogin.tsx | ✅ Fixed | Admin can now log in via Render |
| Dashboard | AdminDashboard.tsx | ✅ Fixed | Metrics load from Render |
| Logout | AdminLayout.tsx | ✅ Fixed | Logout works correctly |
| Inventory | AdminInventory.tsx | 🟡 Pending | Cannot manage products yet |
| Chefs | AdminChefs.tsx | 🟡 Pending | Cannot manage chefs yet |
| Settings | AdminDeliverySettings.tsx | 🟡 Pending | Cannot manage delivery settings yet |

---

## Next Steps

1. **NOW:** Set `VITE_API_URL` in Vercel ⚠️
2. **Then:** Test admin login at https://rotihai.vercel.app/admin/login
3. **Later:** Update remaining admin pages (non-critical)

**Without step 1, the admin login will still try to hit Vercel domain instead of Render backend!**
