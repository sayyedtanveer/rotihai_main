# Referral Bonus Claim Logic - Complete Guide

## Overview
You've set up a referral bonus system where:
- **Referrer gets**: ₹10 when referred user completes an order
- **New user gets**: ₹50 bonus to use in their first order
- **Minimum order validation**: ₹50 (or whatever you set in admin settings)

---

## User Journey: From Profile Bonus to Checkout Claim

### Step 1: Referral Bonus Appears in Profile
**Where**: `client/src/pages/InviteEarn.tsx` (Profile → Referral section)

When a user gets referred:
```
Profile shows:
✓ Referral code from referrer
✓ Status: "pending" (waiting for first order)
✓ Can't claim bonus yet
```

---

### Step 2: New User Places Order at Checkout
**Where**: `client/src/components/CheckoutDialog.tsx`

When authenticated user at checkout with pending referral bonus:

#### 2A. Check Bonus Eligibility
```typescript
// Backend checks: server/storage.ts - validateBonusEligibility()
Required conditions:
1. User has a PENDING referral
2. Order total ≥ minOrderAmount (currently ₹50 from admin settings)
3. Referral system is ACTIVE
4. Referral not expired (within 30 days)

If all conditions met:
✓ "Available Referral Bonus" section shows
✓ Checkbox appears: "Use Bonus"
✓ Bonus amount displays (₹50)
```

#### 2B. Current Minimum Order Validation
```
Current Implementation:
- Admin sets: minOrderAmount in referral rewards settings
- Default: ₹0 (NO minimum - user can claim with ANY amount)
- Your case: Should be ₹50 or higher

At Checkout:
if (orderTotal < minOrderAmount) {
  ❌ Show error: "Minimum order ₹50 required to claim bonus"
  ❌ Disable "Use Bonus" checkbox
} else {
  ✅ Allow user to claim bonus
}
```

---

## How Bonus is Claimed

### Flow 1: Bonus Claimed at Checkout (Authenticated User)
```
1. User checks "Use Bonus" checkbox
2. Clicks "Place Order"
3. Order created successfully
4. Backend calls: claimReferralBonusAtCheckout()
   ├─ Validate bonus eligibility (min order amount check)
   ├─ Update wallet balance: +₹50
   └─ Update referral status: "pending" → "completed"
5. User sees success: "₹50 bonus claimed!"
```

### Flow 2: Bonus Credited on Order Delivery
```
Current: When referred user's order is marked "delivered":
1. Auto-completion triggers
2. Referrer's wallet: +₹10 (referrerBonus)
3. New user's wallet: +₹50 (referredBonus) 
4. Both get wallet transactions

Note: This is SEPARATE from bonus claim at checkout
- Referrer gets ₹10 when user completes order
- User can use ₹50 in NEXT order (after first order delivered)
```

---

## Admin Settings Configuration
**Location**: `AdminWalletSettings.tsx`

```
Referral Rewards Settings:
┌─────────────────────────────┐
│ Referrer Bonus: ₹100         │ ← Your current setting
│ New User Bonus: ₹50          │ ← Auto-given to referred users
│ Min Order Amount: [empty]    │ ← MISSING! Add this
│ Max Referrals/Month: 10      │
│ Max Earnings/Month: ₹500     │
│ Expiry Days: 30              │
└─────────────────────────────┘
```

---

## THE ISSUE: Missing UI in Admin Settings

**Current Problem**:
- Admin can set referrer/referred bonuses
- BUT cannot set `minOrderAmount` in UI
- Backend has the field `minOrderAmount` in database
- It defaults to ₹0 (anyone can claim)

**Result**:
- User with ₹50 bonus can claim it on ANY order
- Example: ₹10 order + ₹50 bonus = FREE (not intended!)

---

## Implementation: Add Minimum Order Amount to Admin

### Step 1: Update AdminWalletSettings.tsx
Add this field to the UI:

```tsx
// Add to settings state
const [settings, setSettings] = useState({
  maxUsagePerOrder: 10,
  referrerBonus: 100,
  referredBonus: 50,
  minOrderAmount: 50,  // ← ADD THIS
  maxReferralsPerMonth: 10,
  maxEarningsPerMonth: 500,
  expiryDays: 30,
});

// In form, add:
<div className="space-y-2">
  <Label htmlFor="minOrderAmount">
    Minimum Order Amount for Bonus (₹)
  </Label>
  <Input
    id="minOrderAmount"
    type="number"
    value={settings.minOrderAmount}
    onChange={(e) => 
      setSettings({ 
        ...settings, 
        minOrderAmount: parseInt(e.target.value) || 0 
      })
    }
    min="0"
    required
  />
  <p className="text-xs text-muted-foreground">
    User's order must be at least this amount to claim referral bonus
  </p>
</div>
```

### Step 2: Update Backend Route
Ensure `/api/admin/wallet-settings` handles `minOrderAmount`:

```typescript
// server/adminRoutes.ts
app.post("/api/admin/wallet-settings", async (req, res) => {
  const { minOrderAmount, referrerBonus, referredBonus, ... } = req.body;
  
  // Update referral rewards
  await storage.updateReferralReward(settingId, {
    minOrderAmount,      // ← Include this
    referrerBonus,
    referredBonus,
    maxReferralsPerMonth,
    maxEarningsPerMonth,
    expiryDays,
  });
});
```

---

## Complete Checkout Logic

```
┌─ User at Checkout (Authenticated)
│
├─ Has pending referral bonus?
│  └─ YES → Fetch bonus details
│
├─ Check eligibility:
│  ├─ Bonus status = "pending"? ✓
│  ├─ Order total ≥ minOrderAmount (₹50)? ✓
│  ├─ System active? ✓
│  └─ Not expired? ✓
│
├─ Display:
│  ├─ "Available Referral Bonus: ₹50"
│  ├─ "Minimum order: ₹50"
│  └─ Checkbox: "Use Bonus"
│
├─ User clicks "Place Order" with checkbox checked
│
├─ Validate again:
│  └─ if (₹50 < minOrderAmount) → ❌ ERROR
│  └─ else → ✅ PROCEED
│
└─ Claim bonus:
   ├─ Wallet balance: +₹50
   ├─ Referral status: pending → completed
   └─ Show: "✓ Order placed! ₹50 bonus claimed"
```

---

## Current Settings vs Intended

| Setting | Current | Should Be |
|---------|---------|-----------|
| Referrer Bonus | ₹100 | ₹10 (as per your requirement) |
| Referred Bonus | ₹50 | ₹50 ✓ |
| Min Order Amount | ₹0 (ANY) | ₹50 (NEEDS VALIDATION) |
| Allow Low Orders | YES | NO |
| Bonus Claimable on ₹10 Order | YES ❌ | NO ✓ |

---

## What Happens Now (Current Bug)

```
Example:
User has ₹50 referral bonus
Places ₹10 order
Uses bonus

Result:
Order total = ₹10 - ₹50 = -₹40 (customer gets money back?!)
Or order total becomes ₹0 (free food)
```

---

## What Should Happen (After Fix)

```
Example:
User has ₹50 referral bonus
Tries to place ₹10 order
Shows: "❌ Minimum order ₹50 required to use bonus"
User must add more items

User places ₹80 order
Uses bonus: ₹80 - ₹50 = ₹30 to pay
Shows: "✓ Order placed! ₹50 bonus used"
```

---

## Implementation Checklist

- [ ] Update `AdminWalletSettings.tsx` UI to show `minOrderAmount` input
- [ ] Verify backend route `/api/admin/wallet-settings` saves `minOrderAmount`
- [ ] Confirm `validateBonusEligibility()` checks minimum order amount
- [ ] Test: User with bonus cannot claim on order below minimum
- [ ] Test: User with bonus CAN claim on order above minimum
- [ ] Update referrer bonus from ₹100 to ₹10 (if needed)
- [ ] Verify checkout page shows minimum order warning
- [ ] Test: Display shows "Minimum order: ₹50" in UI

---

## Files to Modify

1. **client/src/pages/admin/AdminWalletSettings.tsx**
   - Add `minOrderAmount` input field
   - Add to settings state

2. **server/adminRoutes.ts** (if not already handling)
   - Ensure `/api/admin/wallet-settings` POST handles `minOrderAmount`

3. **Verification Only** (already implemented):
   - `server/storage.ts` - `validateBonusEligibility()` - checks min order ✓
   - `client/src/components/CheckoutDialog.tsx` - displays message ✓
   - `shared/schema.ts` - database field exists ✓

---

## Testing Guide

### Test Case 1: Minimum Order Enforcement
```
Setup:
- Admin sets: minOrderAmount = ₹50
- User has: ₹50 referral bonus

Test A: Order Below Minimum (₹30)
1. At checkout, add items = ₹30
2. See "Available Referral Bonus ₹50"
3. See "Minimum order: ₹50"
4. Checkbox should be DISABLED
5. Cannot place order with bonus

Test B: Order At Minimum (₹50)
1. At checkout, add items = ₹50
2. See "Available Referral Bonus ₹50"
3. Checkbox should be ENABLED
4. Check checkbox
5. Place order → Success!
6. Pay: ₹0 (bonus covers it)

Test C: Order Above Minimum (₹100)
1. At checkout, add items = ₹100
2. Check bonus checkbox
3. Place order → Success!
4. Pay: ₹50 (₹100 - ₹50 bonus)
```

### Test Case 2: Different Minimum Amounts
```
Change admin setting: minOrderAmount = ₹75

Test: Same user, ₹50 bonus
1. Order = ₹60 → ❌ "Minimum ₹75 required"
2. Order = ₹75 → ✅ Can use bonus
3. Order = ₹100 → ✅ Can use bonus (pay ₹25)
```

---

## Summary

**Current State**:
- Bonus visible in profile ✓
- Can be claimed at checkout ✓
- BUT no minimum order validation in UI ❌
- Admin cannot set minimum order ❌

**Fix Needed**:
- Add `minOrderAmount` field to admin panel
- Frontend already validates (but admin can't control it)
- Enforce minimum order to prevent abuse

**Result After Fix**:
- ₹50 bonus requires ₹50+ order
- Prevents free food or overpaid bonuses
- Admin has full control via settings
