# Delivery Fee Race Condition Fix - Test Scenarios

## Issue Summary
**Intermittent delivery fee display bug:** Shows delivery fee (₹35) when order meets minimum and should show FREE
- Non-deterministic behavior based on timing
- Address panel flickers open/close
- Same order distance shows different fees depending on UI timing

## Root Cause
Two separate state update sources calculating `isBelowDeliveryMinimum` independently, causing race condition.

## Fix Applied
✅ **Consolidated into single `useMemo` source of truth**
- `deliveryMinimumLogic` memoized logic object
- Prevents race condition via single calculation → multiple state setters
- Display and charge logic now synchronized

---

## Test Scenarios (Manual)

### Scenario 1: Order Below Minimum (Should Show Fee)
**Setup:**
- Cart subtotal: ₹110
- Delivery minimum: ₹130
- Delivery fee: ₹35

**Test:**
1. Open checkout
2. Address panel should open in expanded state
3. Verify delivery fee shows: **"₹35"** (red/orange text)
4. Verify message shows: **"Add ₹20 more to get FREE delivery"**
5. Close and reopen address panel → should remain consistent

**Expected:** No flickering, consistent display of ₹35

---

### Scenario 2: Order Meets Minimum (Should Show FREE)
**Setup:**
- Cart subtotal: ₹150
- Delivery minimum: ₹130
- Delivery fee: ₹35 (calculated but not charged)

**Test:**
1. Open checkout
2. Address panel should open in expanded state
3. Verify delivery fee shows: **"FREE ✓"** (green text)
4. Verify NO message about adding more
5. Close and reopen address panel → should remain consistent
6. Total should NOT include delivery fee

**Expected:** Immediately shows FREE, no flickering, total = ₹150

---

### Scenario 3: Add Items to Cross Minimum
**Setup:**
- Start with cart subtotal: ₹110 (below minimum of ₹130)
- Delivery minimum: ₹130

**Test:**
1. Open checkout → delivery shows "₹35"
2. Add item (e.g., +₹20) → total now ₹130
3. Verify delivery fee smoothly transitions from **"₹35"** to **"FREE ✓"**
4. Total updates correctly: doesn't include delivery fee

**Expected:** Smooth transition, no momentary flip-flop

---

### Scenario 4: Change Delivery Address
**Setup:**
- Cart: ₹150 (meets minimum)
- Currently shows: "FREE ✓"

**Test:**
1. Open checkout, verify "FREE ✓" showing
2. Click address edit → modify pincode
3. Wait for geolocation to complete
4. Verify delivery fee remains "FREE ✓" (doesn't flicker to ₹XX)
5. Close address panel → fee should remain consistent

**Expected:** Fee display stable, no unnecessary updates

---

### Scenario 5: Mobile vs Desktop (Distance Consistency)
**Setup:**
- Same order from identical location
- Test on mobile & desktop

**Test:**
1. Mobile: Open checkout → check delivery fee display
2. Desktop: Same order → check delivery fee display
3. Both should show SAME delivery fee (both FREE or both ₹XX)
4. Repeat from different location → should still match

**Expected:** Consistent delivery fee across platforms

---

## Debug Console Output

### Before Fix (Expected Race Condition)
```
[CHECKOUT-CALC] Platform fee ENABLED...
[DELIVERY-FEE] Calculated using Admin Settings: {...}
[WALLET CHECKBOX] Disabled state calculation: {...}
// Multiple updates to same state = potential out-of-order rendering
```

### After Fix (Synchronized)
```
[WALLET CHECKBOX] Disabled state calculation: {
  minOrderAmountForWallet: 0,
  subtotal: 150,
  deliveryFee: 35,
  actualFeeForCalc: 0,  // ← Correctly 0 when above minimum
  discount: 0,
  orderTotal: 150,
  isDisabled: false
}
```

**Key indicator:** `actualFeeForCalc` should always match the display (0 when FREE, deliveryFee value when charged)

---

## Validation Checklist

- [ ] Scenario 1: Fee displays consistently when below minimum
- [ ] Scenario 2: FREE displays immediately when above minimum
- [ ] Scenario 3: Fee transitions smoothly when crossing minimum
- [ ] Scenario 4: Address change doesn't cause flickering
- [ ] Scenario 5: Mobile and desktop show same fees
- [ ] Console: No race condition logs
- [ ] Total: Never includes delivery fee when minimum met
- [ ] Mobile UX: Address panel closes after 2-3 seconds (no infinite loop)

---

## Files Changed
- `client/src/components/CheckoutDialog.tsx`
  - Added: `deliveryMinimumLogic` useMemo (lines ~925-940)
  - Updated: `isWalletCheckboxDisabled` useMemo dependency (line ~973)
  - Updated: Main useEffect to use `deliveryMinimumLogic.isBelowMin` (line ~1010)
  - Updated: State setters to use consolidated logic (lines ~1135-1137)
  - Updated: useEffect dependency array (line ~1175)

---

## Rollback (if needed)
```bash
git revert <commit-hash>
```

Or manually revert the 5 changes to CheckoutDialog.tsx above.

---

## Performance Impact
- ✅ **No regression:** useMemo prevents unnecessary recalculations
- ✅ **Faster UI:** Single calculation replaces duplicate logic
- ✅ **Less state churn:** Synchronized setters reduce re-renders
