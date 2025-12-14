# Referral Bonus Claim Logic - Visual Summary

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REFERRAL BONUS FLOW - COMPLETE                       │
└─────────────────────────────────────────────────────────────────────────┘

                           ADMIN SETS RULES
                           ═══════════════
                    Admin Panel → Wallet Settings
                           │
                    ┌──────┴─────────────────┐
                    │  Referrer Bonus: ₹10   │
                    │  Referred Bonus: ₹50   │
                    │  Min Order: ₹50    ⭐ │ ← NEW FIELD
                    │  Max/Month: ₹500       │
                    └──────┬─────────────────┘
                           │
                           ▼
                      [SAVE SETTINGS]
                           │
                    Database Updated:
                    referralRewards table
                           │
                           ▼
          ┌──────────────────────────────────┐
          │   Rule Now Active: Min ₹50 Order  │
          │   to use ₹50 referral bonus      │
          └──────────────────────────────────┘


                      USER GETS BONUS
                      ════════════════
                    Friend shares code
                           │
                    User signs up with code
                           │
                    ✓ ₹50 added to wallet
                    ✓ Status: "pending"
                    ✓ Profile shows bonus
                           │
                           ▼


                   USER PLACES ORDER
                   ═════════════════
                (User is authenticated)
                           │
            ┌──────────────┴──────────────┐
            │ At Checkout Page            │
            │ ─────────────────────────   │
            │ Order Total: ₹30            │
            │                             │
            │ Available Referral Bonus    │
            │ ₹50                         │
            │                             │
            │ ⚠️ Minimum order: ₹50       │
            │                             │
            │ ☐ Use Bonus  [DISABLED]     │
            │   (Not enough items)        │
            │                             │
            │ ❌ Cannot claim bonus on    │
            │    this order               │
            └──────────────┬──────────────┘
                           │
                  Add more items
                           │
                           ▼
            ┌──────────────────────────────┐
            │ Order Total: ₹80             │
            │                              │
            │ Available Referral Bonus     │
            │ ₹50                          │
            │                              │
            │ ✓ Minimum order: ₹50         │
            │                              │
            │ ☑ Use Bonus  [ENABLED] ⭐   │
            │   (Meets minimum)            │
            │                              │
            │ ✓ Can use bonus              │
            │   Final: ₹80 - ₹50 = ₹30    │
            └──────────────┬───────────────┘
                           │
                   [Place Order]
                           │
                           ▼
            ┌──────────────────────────────┐
            │ BACKEND VALIDATION           │
            │ ─────────────────────────    │
            │ ✓ Referral status="pending" │
            │ ✓ System enabled            │
            │ ✓ Not expired (<30 days)    │
            │ ✓ Order ₹80 >= Min ₹50      │
            │                              │
            │ VALIDATION PASSED ✓         │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │ CLAIM BONUS                  │
            │ ─────────────────────────    │
            │ • Wallet: +₹50               │
            │ • Status: "pending"→"compl" │
            │ • Transaction logged         │
            │                              │
            │ SUCCESS ✓                    │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │ Order Placed                 │
            │ ─────────────────────────    │
            │ Amount to Pay: ₹30           │
            │ (₹80 total - ₹50 bonus)      │
            │                              │
            │ Message: "✓ Bonus claimed!"  │
            └──────────────────────────────┘
```

---

## Validation Flow Diagram

```
USER CHECKOUT
    │
    ▼
Has Pending Referral?
    │
    ├─ NO → No bonus section shown
    │
    └─ YES → Fetch bonus details
            │
            ▼
        Backend Validation:
        validateBonusEligibility()
        │
        ├─ Is system active?
        │  └─ NO → "Referral system disabled"
        │
        ├─ Is referral pending?
        │  └─ NO → "Bonus already claimed"
        │
        ├─ Is within 30 days?
        │  └─ NO → "Bonus expired"
        │
        ├─ Order >= minOrderAmount? ⭐ KEY CHECK
        │  ├─ NO → "Minimum order ₹50 required" ❌
        │  │
        │  └─ YES → ELIGIBLE ✓
        │       │
        │       ▼
        │   Show "Use Bonus" checkbox
        │   Enable checkbox
        │   User can claim
        │
        ▼
   [Place Order]
        │
        ▼
   Claim Bonus Endpoint:
   claimReferralBonusAtCheckout()
        │
        ├─ Validate AGAIN (security)
        │  └─ Still >= minOrderAmount?
        │
        └─ If YES → Update wallet & complete referral
           If NO → Return error
```

---

## Database Changes

### No Migration Needed ✓
Field already exists in schema:

```typescript
// shared/schema.ts - Line 259
export const referralRewards = pgTable("referral_rewards", {
  id: varchar("id").primaryKey(),
  name: text("name"),
  referrerBonus: integer("referrer_bonus"),
  referredBonus: integer("referred_bonus"),
  minOrderAmount: integer("min_order_amount") ⭐ // Already here!
  maxReferralsPerMonth: integer("max_referrals_per_month"),
  maxEarningsPerMonth: integer("max_earnings_per_month"),
  expiryDays: integer("expiry_days"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

---

## Configuration Control Panel

```
┌────────────────────────────────────────────────────────────┐
│         ADMIN WALLET & REFERRAL SETTINGS PAGE              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  WALLET USAGE SETTINGS        REFERRAL REWARDS            │
│  ┌──────────────────────┐    ┌──────────────────────┐    │
│  │ Max Usage/Order: 10₹ │    │ Referrer Bonus: 10₹  │    │
│  │ Save [Button]        │    │ Referred Bonus: 50₹  │    │
│  └──────────────────────┘    │ Min Order: 50₹   ⭐ │    │
│                              │ Max/Month: ₹500      │    │
│                              │ Max Referrals: 10    │    │
│                              │ Expiry Days: 30      │    │
│                              │ Save [Button]        │    │
│                              └──────────────────────┘    │
│                                                            │
│  CURRENT CONFIGURATION                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Max Wallet Usage Per Order: ₹10                   │  │
│  │ Referrer Bonus: ₹10                               │  │
│  │ Referred User Bonus: ₹50                          │  │
│  │ Min Order Amount for Bonus: ₹50            ⭐     │  │
│  │ Max Referrals Per Month: 10                       │  │
│  │ Max Earnings Per Month: ₹500                      │  │
│  │ Referral Expiry Days: 30                          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Bonus Claiming Scenarios

### Scenario 1: Order Too Small ❌
```
Admin Setting: Min Order = ₹50
User Bonus: ₹50

Action: User tries ₹30 order

Result:
✗ "Minimum order ₹50 required"
✗ Checkbox DISABLED
✗ Cannot place order with bonus
✗ Order fails if user tries to force it

User must add more items → ₹50+ order
```

### Scenario 2: Order Meets Minimum ✓
```
Admin Setting: Min Order = ₹50
User Bonus: ₹50

Action: User places ₹50 order

Result:
✓ "Minimum met - Use Bonus enabled"
✓ Checkbox ENABLED
✓ User checks checkbox
✓ Order placed

Final Payment:
₹50 (order) - ₹50 (bonus) = ₹0
(User pays nothing)
```

### Scenario 3: Order Exceeds Minimum ✓
```
Admin Setting: Min Order = ₹50
User Bonus: ₹50

Action: User places ₹100 order

Result:
✓ "Can use bonus - order exceeds minimum"
✓ Checkbox ENABLED
✓ User checks checkbox
✓ Order placed

Final Payment:
₹100 (order) - ₹50 (bonus) = ₹50
(User pays half price!)
```

### Scenario 4: Bonus Larger Than Order
```
Admin Setting: Min Order = ₹50
User Bonus: ₹50

Action: User places ₹120 order, tries to use ₹50 bonus

Result:
✓ Validation passes (₹120 >= ₹50)
✓ Bonus applied
✓ Bonus amount clipped at order total

Final Payment:
₹120 (order) - ₹50 (bonus) = ₹70
(Cannot go negative)
```

---

## Admin Control Matrix

| Scenario | Min=0 | Min=50 | Min=100 | Note |
|----------|-------|--------|---------|------|
| ₹30 order, ₹50 bonus | ✓ Can claim | ❌ Cannot | ❌ Cannot | Admin sets minimum |
| ₹50 order, ₹50 bonus | ✓ Can claim | ✓ Can claim | ❌ Cannot | Must match minimum |
| ₹100 order, ₹50 bonus | ✓ Can claim | ✓ Can claim | ✓ Can claim | Exceeds all minimums |
| ₹50 order, ₹100 bonus | ✓ Can claim | ✓ Can claim | ✓ Can claim | Bonus amount flexible |

---

## Files Changed Summary

```
Client Side:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 client/src/pages/admin/AdminWalletSettings.tsx
   • Added minOrderAmount input field
   • Added maxReferralsPerMonth input field
   • Added maxEarningsPerMonth input field
   • Added expiryDays input field
   • Updated state to include all fields
   • Updated display to show all settings


Server Side:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 server/adminRoutes.ts (2 changes)
   1. Line 14: Add referralRewards import
      import { ..., referralRewards } from "@shared/db"
   
   2. Lines 2594-2616: GET /api/admin/wallet-settings
      • Now returns both wallet & referral settings
      • Merges data from both tables
   
   3. Lines 2618-2656: POST /api/admin/wallet-settings
      • Accepts all new fields in request body
      • Updates referral_rewards table
      • Creates/updates referral rewards record


Already Implemented (No changes):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ server/storage.ts - validateBonusEligibility()
✓ server/storage.ts - claimReferralBonusAtCheckout()
✓ shared/schema.ts - minOrderAmount field in referralRewards
✓ client/src/components/CheckoutDialog.tsx - displays minimum order warning
```

---

## Testing Checklist

### Admin Panel Testing
- [ ] Load Admin Settings page
- [ ] See "Minimum Order Amount for Bonus" field
- [ ] Can change value from 0 to 50 to 100
- [ ] Click Save - settings updated
- [ ] Refresh page - value persists
- [ ] See "Current Configuration" shows all fields

### User Testing - Below Minimum
- [ ] Login as user with ₹50 bonus
- [ ] Go to checkout
- [ ] Add items worth ₹30
- [ ] See "Available Referral Bonus ₹50"
- [ ] See "Minimum order: ₹50"
- [ ] "Use Bonus" checkbox is DISABLED
- [ ] See error message
- [ ] Add more items → ₹50+

### User Testing - At Minimum
- [ ] Go back to checkout
- [ ] Items now = ₹50 (at minimum)
- [ ] "Use Bonus" checkbox is ENABLED
- [ ] Check the checkbox
- [ ] Click "Place Order"
- [ ] See "✓ Bonus claimed!"
- [ ] Payment = ₹0

### User Testing - Above Minimum
- [ ] Add items = ₹80 (above minimum)
- [ ] "Use Bonus" checkbox ENABLED
- [ ] Check it
- [ ] Place order
- [ ] See "✓ Bonus claimed!"
- [ ] Payment = ₹30 (₹80 - ₹50)

### Admin Changes Minimum
- [ ] Change minimum to ₹100 (admin)
- [ ] Save settings
- [ ] New user tries ₹50 order with bonus
- [ ] See "Minimum order ₹100 required"
- [ ] ₹100 order: Works ✓

---

## Security Validations

### Double Validation Pattern
```
┌─ Frontend Validation
│  └─ Checks minOrderAmount client-side
│     └─ Disables/enables checkbox
│        (User experience)
│
└─ Backend Validation
   └─ Checks minOrderAmount server-side
      └─ Even if user bypasses frontend
         (Security enforcement)
```

### Protection Against:
- ✓ Users manually bypassing checkbox
- ✓ Invalid/expired referral codes
- ✓ Double claiming same bonus
- ✓ Orders below minimum amount
- ✓ Referral system disabled by admin

---

## Expected Behavior After Implementation

### What Users See
```
Before setting minimum order:
At checkout with ₹30 order:
"Available Bonus: ₹50" ✓
"Use Bonus" [Checkbox: ENABLED] ❌ PROBLEM

After setting minimum order (₹50):
At checkout with ₹30 order:
"Available Bonus: ₹50" ✓
"Minimum order: ₹50" ⚠️
"Use Bonus" [Checkbox: DISABLED] ✓ FIXED
"Cannot use bonus - minimum ₹50 required"
```

### What Happens in Database
```
referral_rewards table:
Before:
  minOrderAmount: 0
  (Anyone can claim at any order amount)

After Admin Update:
  minOrderAmount: 50
  (Only orders ≥ ₹50 can claim)
```

---

## Quick Reference

**Key Formula for Validation:**
```
if (userOrder >= minOrderAmount AND referralStatus == "pending") {
  allowBonusClaimButton()
} else {
  disableBonusClaimButton()
  showError("Minimum order ₹X required")
}
```

**Current Recommended Settings:**
```
Referrer Bonus: ₹10
Referred Bonus: ₹50
Min Order: ₹50 (or 75, or 100 - up to you!)
Max/Month: ₹500
Max Referrals: 10/month
Expiry: 30 days
```

---

## What's Next?

1. **Deploy** the changes
2. **Test** with admin user
3. **Verify** database has minOrderAmount set
4. **Monitor** checkout flow
5. **Adjust** minimum order amount if needed

The system is now complete and ready to use! 🎉
