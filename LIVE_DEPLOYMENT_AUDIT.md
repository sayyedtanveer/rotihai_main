# 🚨 LIVE DEPLOYMENT - CRITICAL AUDIT

## Status: PARTIALLY BROKEN - 30+ Fetch Calls Still Need Fixing

Your app is live but there are **30+ files still using old fetch() API** that won't route through VITE_API_URL.

### Files That Will FAIL on Vercel (Calling wrong domain):

**CRITICAL (User Checkout Flow):**
1. ✗ CheckoutDialog.tsx - 10 fetch calls
   - Bonus eligibility check
   - Phone validation
   - Coupon verification
   - Geocoding
   - Order creation
   - Login/password reset
   
2. ✗ Profile.tsx - 11 fetch calls
   - Profile fetch
   - Categories/chefs
   - Wallet balance
   - Referral codes
   - All read/write operations

**HIGH PRIORITY (Partner/Admin):**
3. ✗ PartnerLogin.tsx - 1 fetch call
4. ✗ PartnerDashboard.tsx - 9 fetch calls
5. ✗ AdminChefs.tsx - 1 fetch call

**MEDIUM PRIORITY (Helper Features):**
6. ✗ App.tsx - Visitor tracking
7. ✗ ChangePasswordDialog.tsx - 1 fetch call
8. ✗ ImageUploader.tsx - 1 fetch call
9. ✗ PartnerProfile.tsx - 3 fetch calls

### Current Admin Login Fix: ✅ WORKING
- AdminLogin.tsx - FIXED to use axios
- AdminDashboard.tsx - FIXED to use axios
- AdminLayout.tsx - FIXED to use axios

### The Problem:
```typescript
// WRONG - Calls Vercel domain:
await fetch("/api/orders", ...)
// On Vercel → https://rotihai.vercel.app/api/orders ❌

// RIGHT - Calls Render domain via env var:
await api.post("/api/orders", ...)
// On Vercel → https://rotihai-backend.onrender.com/api/orders ✅
```

### Fix Required:
Replace all 30+ `fetch()` calls with `api.post()` / `api.get()` / etc.

Pattern:
```typescript
// Before
const response = await fetch("/api/endpoint", { ... });
const data = await response.json();

// After
import api from "@/lib/apiClient";
const response = await api.get("/api/endpoint");
const data = response.data;
```

### Immediate Action Items:

**MUST FIX NOW (User-facing):**
- [ ] CheckoutDialog.tsx - Users can't place orders
- [ ] Profile.tsx - Users can't access profile/wallet/referrals
- [ ] PartnerLogin.tsx - Partners can't log in
- [ ] PartnerDashboard.tsx - Partners can't see data

**SHOULD FIX SOON (Admin):**
- [ ] AdminChefs.tsx - Admins can't manage chefs
- [ ] All remaining admin pages

**CAN FIX LATER:**
- [ ] Visitor tracking (App.tsx)
- [ ] Image uploads
- [ ] Other utilities

### Risk Assessment:
🔴 **HIGH RISK** - Checkout broken, users can't complete orders
🔴 **HIGH RISK** - Profile broken, users can't see wallet/referrals
🟡 **MEDIUM RISK** - Partner features broken
🟢 **LOW RISK** - Admin features (non-critical admin features)

