# Referral Module - Quick Reference Guide

**Purpose:** Quick lookup for referral system components, without breaking anything

---

## WHERE TO FIND REFERRAL CODE

### During Registration/Checkout ✓
**File:** `client/src/components/CheckoutDialog.tsx`  
**Lines:** 1076-1090  
**When:** New user is not logged in  
**What:** Optional input field to enter referral code  
**Applied After:** Account creation (line 631-640)

```tsx
// Input field for new users
{!isAuthenticated && (
  <Input
    id="referralCode"
    placeholder="Enter friend's referral code"
    value={referralCode}
    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
  />
)}
```

### In Profile Page ✓
**File:** `client/src/pages/Profile.tsx`  
**Lines:** 136-170, 654-700 (estimate)  
**When:** User is logged in  
**What:** Apply referral code section  
**Visibility:** Only shown if eligible (hasn't used code before)

### Referral Sharing Page ✓
**File:** `client/src/pages/InviteEarn.tsx`  
**Features:**
- View generated code
- Share via WhatsApp (line 80-85)
- Share via SMS (line 87-92)
- Copy to clipboard (line 73-78)
- View all referrals (line 253+)
- View stats (line 42+)

---

## API ENDPOINTS

### Public (No Auth)
```
GET /api/referral-settings
└─ Returns: bonuses, limits, expiry days
```

### User Routes (Require Auth)
```
POST /api/user/generate-referral
└─ Returns: { referralCode: "REF..." }

POST /api/user/apply-referral
├─ Body: { referralCode: "REF..." }
└─ Returns: { message, bonus }

GET /api/user/referral-code
└─ Returns: { referralCode: "REF..." }

GET /api/user/referral-eligibility
└─ Returns: { eligible: true/false, reason? }

GET /api/user/referrals
└─ Returns: Array of referred users

GET /api/user/referral-stats
└─ Returns: { referralCode, totalReferrals, completedReferrals, etc }
```

### Admin Routes (Admin Only)
```
GET /api/admin/referrals
└─ Returns: All referrals with user details

GET /api/admin/referral-stats
└─ Returns: System-wide stats

PUT /api/admin/referrals/:id
├─ Body: { status: "completed" | "expired" }
└─ Returns: Updated referral
```

---

## DATABASE SCHEMA

### referrals Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| referrerId | UUID | User who has the code |
| referredId | UUID | User who used the code |
| referralCode | VARCHAR(20) | The code (REF + 8 chars) |
| status | VARCHAR(20) | pending \| completed \| expired |
| referrerBonus | INTEGER | Amount referrer gets |
| referredBonus | INTEGER | Amount referred user gets |
| referredOrderCompleted | BOOLEAN | Flag for first order |
| createdAt | TIMESTAMP | When referral created |
| completedAt | TIMESTAMP | When first order placed |

### users Table (Related)
| Column | Type | Description |
|--------|------|-------------|
| referralCode | VARCHAR | User's unique code |
| walletBalance | INTEGER | Total balance |

---

## KEY FILES & LOCATIONS

### Backend
```
server/routes.ts
├─ POST /api/user/generate-referral (line 644)
├─ POST /api/user/apply-referral (line 668)
├─ GET /api/referral-settings (line 615)
├─ GET /api/user/referral-code (line 697)
├─ GET /api/user/referral-eligibility (line 716)
├─ GET /api/user/referrals (line 686)
└─ GET /api/user/referral-stats (line 738)

server/adminRoutes.ts
├─ GET /api/admin/referrals (line 2992)
├─ GET /api/admin/referral-stats (line ~3050)
└─ PUT /api/admin/referrals/:id (line ~3080)

server/storage.ts
├─ generateReferralCode() (line 1387)
├─ applyReferralBonus() (line 1414)
├─ createReferral() (line 1400)
├─ completeReferralOnFirstOrder() (line 1504)
├─ getReferralsByUser() (line 1575)
├─ getReferralStats() (line 1663)
└─ markReferralComplete() (line 1686)
```

### Frontend
```
client/src/components/CheckoutDialog.tsx
├─ Referral code input (line 1076-1090)
├─ Reference code in state (line 120)
├─ Apply after registration (line 630-640)
└─ useApplyReferral hook (line 34)

client/src/pages/Profile.tsx
├─ Referral eligibility query (line 136-149)
├─ Apply referral section (line 654-700, estimate)
└─ useApplyReferral hook (line 151+)

client/src/pages/InviteEarn.tsx
├─ Generate code button (line 42-65)
├─ Share via WhatsApp (line 80-85)
├─ Share via SMS (line 87-92)
├─ Copy to clipboard (line 73-78)
├─ Referral stats display (line 42+)
└─ Referral list (line 253+)

client/src/pages/admin/AdminReferrals.tsx
├─ Referral table (line 215+)
├─ Filter by status (line 189+)
├─ Manual complete/expire (line 98+)
└─ System stats cards (line 127+)

client/src/hooks/useApplyReferral.ts
└─ Hook for applying referral codes
```

---

## USER WORKFLOWS

### Workflow 1: NEW USER WITH REFERRAL CODE
```
Home Page → Add to Cart → Checkout
    ↓
Enter Details + Referral Code
    ↓
{!isAuthenticated && <Input referralCode />}  [CheckoutDialog.tsx:1076]
    ↓
CREATE ACCOUNT + APPLY CODE
    ↓
applyReferralMutation.mutate()  [CheckoutDialog.tsx:633]
    ↓
POST /api/user/apply-referral  [server/routes.ts:668]
    ↓
storage.applyReferralBonus()  [server/storage.ts:1414]
    ↓
✓ Account created
✓ ₹50 bonus to wallet
✓ Referral record created (pending)
```

### Workflow 2: APPLY CODE IN PROFILE
```
Login → Profile Page
    ↓
/api/user/referral-eligibility check  [server/routes.ts:716]
    ↓
IF eligible → Show input field
    ↓
Enter code + Submit
    ↓
POST /api/user/apply-referral  [server/routes.ts:668]
    ↓
✓ ₹50 bonus to wallet
✓ Referral record created (pending)
```

### Workflow 3: GENERATE & SHARE CODE
```
InviteEarn Page
    ↓
Click "Generate Code"
    ↓
POST /api/user/generate-referral  [server/routes.ts:644]
    ↓
Code generated: REF + 8 chars
    ↓
Share via:
├─ WhatsApp (shareViaWhatsApp) [InviteEarn.tsx:80-85]
├─ SMS (shareViaSMS) [InviteEarn.tsx:87-92]
└─ Copy (copyToClipboard) [InviteEarn.tsx:73-78]
```

### Workflow 4: AUTO-COMPLETION ON FIRST ORDER
```
Referred user places first order
    ↓
Order creation succeeds  [server/routes.ts:1200+]
    ↓
IF referral pending for this user:
    ↓
storage.completeReferralOnFirstOrder()  [server/storage.ts:1504]
    ↓
UPDATE referral SET status = 'completed'
UPDATE users SET walletBalance += referrerBonus
    ↓
✓ Referral marked completed
✓ Referrer gets ₹50 bonus
✓ completedAt timestamp set
```

---

## IMPORTANT NUMBERS (CONFIG)

| Parameter | Value | Location |
|-----------|-------|----------|
| Referrer Bonus | ₹50 | Admin settings (hardcoded) |
| Referred Bonus | ₹50 | Admin settings (hardcoded) |
| Code Length | 8 (REF + 8) | generateReferralCode() |
| Max per Month | 10 referrals | applyReferralBonus() |
| Month Earnings Cap | ₹500 | applyReferralBonus() |
| Expiry Days | 30 days | Admin settings (hardcoded) |

---

## VALIDATION RULES

### Self-Referral Prevention
```typescript
if (referrer.id === newUserId) {
  throw new Error("You cannot use your own referral code");
}
```
**Location:** `server/storage.ts:1425`

### Duplicate Referral Prevention
```typescript
const existingReferral = await tx.query.referrals.findFirst({
  where: (r, { eq }) => eq(r.referredId, newUserId),
});
if (existingReferral) {
  throw new Error("User already used a referral code");
}
```
**Location:** `server/storage.ts:1432`

### Monthly Referral Limit
```typescript
if (monthlyReferrals.length >= maxReferralsPerMonth) {
  throw new Error(`Monthly referral limit (${maxReferralsPerMonth}) reached`);
}
```
**Location:** `server/storage.ts:1468`

### Monthly Earning Limit
```typescript
if (monthlyEarnings + referrerBonus > maxEarningsPerMonth) {
  // Reduce bonus to match limit
  bonus = maxEarningsPerMonth - monthlyEarnings;
}
```
**Location:** `server/storage.ts:1500`

### Referral Expiry Check
```typescript
if (new Date() > expiryDate) {
  // Mark as expired
  await tx.update(referrals).set({ status: "expired" });
}
```
**Location:** `server/storage.ts:1535`

---

## ERROR MESSAGES

| Error | Cause | Location |
|-------|-------|----------|
| "Invalid referral code" | Code doesn't exist | applyReferralBonus() |
| "You cannot use your own referral code" | Self-referral | applyReferralBonus() |
| "User already used a referral code" | Already applied once | applyReferralBonus() |
| "Monthly referral limit reached" | >10 referrals/month | applyReferralBonus() |
| "User not found" | userId invalid | applyReferralBonus() |
| "No referral code found" | User hasn't generated one | GET /user/referral-code |

---

## STATUS VALUES

| Status | Meaning | Auto-Transition | Manual? |
|--------|---------|-----------------|---------|
| pending | Waiting for first order | → completed (on 1st order) | ✓ (admin) |
| completed | First order placed, bonuses awarded | None | ✗ |
| expired | 30+ days without first order | (auto on check) | ✓ (admin) |

---

## QUICK TEST COMMANDS

### Generate Referral Code
```
Method: POST
URL: /api/user/generate-referral
Auth: Bearer [userToken]
Body: {} (empty)
Expected: { referralCode: "REF..." }
```

### Apply Referral Code
```
Method: POST
URL: /api/user/apply-referral
Auth: Bearer [userToken]
Body: { referralCode: "REF12345ABC" }
Expected: { message: "...", bonus: 50 }
```

### Get User's Referral Code
```
Method: GET
URL: /api/user/referral-code
Auth: Bearer [userToken]
Expected: { referralCode: "REF..." }
```

### Get User's Referral Stats
```
Method: GET
URL: /api/user/referral-stats
Auth: Bearer [userToken]
Expected: { referralCode, totalReferrals, completedReferrals, totalEarned, ... }
```

### Get User's Referrals List
```
Method: GET
URL: /api/user/referrals
Auth: Bearer [userToken]
Expected: [{ id, referredName, referredPhone, status, referrerBonus, ... }]
```

### Check Eligibility
```
Method: GET
URL: /api/user/referral-eligibility
Auth: Bearer [userToken]
Expected: { eligible: true/false, reason?: "..." }
```

---

## ADMIN QUICK COMMANDS

### View All Referrals
```
Method: GET
URL: /api/admin/referrals
Auth: Bearer [adminToken]
Expected: Array of referrals with user details
```

### Get Admin Stats
```
Method: GET
URL: /api/admin/referral-stats
Auth: Bearer [adminToken]
Expected: { totalReferrals, pendingReferrals, completedReferrals, totalBonusPaid }
```

### Update Referral Status
```
Method: PUT
URL: /api/admin/referrals/:id
Auth: Bearer [adminToken]
Body: { status: "completed" | "expired" }
Expected: Updated referral object
```

---

## SAFE TO MODIFY / TEST

✅ Can test without breaking:
- Registration with referral code
- Code application in Profile
- Wallet bonus distribution
- Stats calculations
- Admin dashboard
- Share buttons
- Copy to clipboard

⚠️ Need to be careful:
- Order completion logic (don't change triggering)
- Wallet balance calculations
- Database transactions (ensure atomic)
- Monthly limit calculations

❌ Don't modify without understanding:
- Database schema (referrals table)
- Authorization checks (admin/user)
- Bonus amounts (affects business logic)

---

## DOCUMENTATION REFERENCE

| Document | Purpose | Read If |
|----------|---------|---------|
| REFERRAL_ANALYSIS_REPORT.md | Executive summary | You want overview |
| REFERRAL_SYSTEM_ARCHITECTURE.md | Technical details | You want to understand code |
| REFERRAL_USER_END_TESTING.md | Testing guide | You want to test |
| REFERRAL_MODULE_ISSUES_AND_GAPS.md | Known issues | You want to identify problems |
| REFERRAL_MODULE_QUICK_REFERENCE.md | This file | You want quick lookup |

---

**Last Updated:** December 14, 2025  
**Status:** Complete Analysis Done ✓  
**Ready for Testing:** YES ✓

