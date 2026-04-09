# Delivery Partner Payouts - Manual Test Guide

## Setup: Configure Payout Slabs (Admin)

1. Go to admin panel: `https://rotihai.com/admin/delivery-settings`
2. Click "Delivery Management" → **Payouts** tab
3. Create payout slabs for delivery personnel:

### Standard Slabs (All Areas)
- **0 - 1km**: ₹10
- **1 - 2km**: ₹15
- **2 - 3km**: ₹20
- **3 - 4km**: ₹25
- **4+km**: ₹30

### Regional Slabs (Optional - Pincode-Specific)
- **400070 (Kurla)**: 0-1km = ₹12
- **400001 (Fort)**: 0-1km = ₹14

## Test Case 1: Verify Payout Slab Creation ✅

**Steps:**
1. Go to Payouts tab in Delivery Settings
2. Enter: Min Distance: `0`, Max Distance: `1`, Payout: `10`, Pincode: (leave empty)
3. Click "Add Slab"

**Expected:**
- Slab appears in "Current Payout Slabs" table
- Shows: "0.00 km - 1.00 km" with "₹10"
- Status shows "Active" toggle

**Pass:** ✓ Slab created and visible in table

---

## Test Case 2: Verify Payout for New Order (Delivery Personnel)

**Setup:**
- Create an order from customer to delivery location
- Distance calculated: 0.5km
- Assigned to delivery personnel

**Expected Payout:** ₹10 (matches 0-1km slab)

**Verification Steps:**
1. Go to Delivery Personnel profile → Earnings tab
2. Find the new order
3. Check payout amount shown = ₹10

**Pass:** ✓ Payout matches distance slab

---

## Test Case 3: Verify Different Distance Ranges

Create test orders at different distances and verify payouts:

| Distance | Expected Slab | Expected Payout |
|----------|---------------|-----------------|
| 0.3 km   | 0-1 km        | ₹10            |
| 1.5 km   | 1-2 km        | ₹15            |
| 2.8 km   | 2-3 km        | ₹20            |
| 3.2 km   | 3-4 km        | ₹25            |
| 5.0 km   | 4+ km         | ₹30            |

**Steps:**
1. Create orders at these distances
2. Assign to delivery personnel
3. Check earnings → verify payout matches slab

**Pass:** ✓ All distances match correct payout slabs

---

## Test Case 4: Verify Regional Rates (Pincode-Specific)

**Setup:**
1. Create regional slab: 400070 (Kurla), 0-1km = ₹12
2. Create order in 400070 area with 0.5km distance

**Expected:**
- Uses pincode-specific rate: ₹12 (NOT global ₹10)

**Verification:**
1. Check delivery personnel earnings for this order
2. Should show ₹12 payout

**Pass:** ✓ Regional rate applied correctly

---

## Test Case 5: Verify Fallback to Global Rate

**Setup:**
1. Create order in 400050 (no specific rate configured)
2. Distance: 0.5km

**Expected:**
- Uses global 0-1km slab: ₹10 (since no 400050-specific rule exists)

**Pass:** ✓ Correct fallback behavior

---

## Test Case 6: Verify Inactive Slabs Are Ignored

**Setup:**
1. Toggle "Active" OFF for 0-1km slab
2. Create order with 0.5km distance

**Expected:**
- Should fallback to default ₹10 (system default if no active slab matches)

**Verification:**
1. Check earnings for this order
2. Should handle gracefully without error

**Pass:** ✓ Inactive slabs properly skipped

---

## Test Case 7: Verify Update Payout Slab

**Steps:**
1. Find 1-2km slab in table
2. Click edit (if available) or note the slab ID
3. Update payout: ₹15 → ₹18

**Expected:**
- New orders in 1-2km range show ₹18 payout
- Existing orders unaffected (stored values don't change)

**Pass:** ✓ Future orders use updated rate

---

## Test Case 8: Verify Delete Payout Slab

**Steps:**
1. Create a test slab: 5-6km = ₹35
2. Click Delete button
3. Slab should disappear from table

**Expected:**
- Slab removed from list
- System handles gracefully if order falls in deleted range

**Pass:** ✓ Slab deletion works

---

## Test Case 9: Verify Order Earnings Summary

**For Delivery Personnel:**
1. Go to delivery personnel dashboard
2. Check "Total Earnings" section

**Expected Breakdown:**
- Should show individual order payouts
- Sum of all orders matches total earnings
- Each payout correctly calculated by distance

**Example:**
```
Order #1: 0.5km → ₹10
Order #2: 1.8km → ₹15
Order #3: 3.2km → ₹25
─────────────────────
Total Earnings: ₹50
```

**Pass:** ✓ Earnings accurately calculated

---

## Test Case 10: Database Verification

**Direct Database Check (for admins):**

```sql
-- Check payouts table
SELECT * FROM delivery_partner_payouts WHERE is_active = true ORDER BY min_distance;

-- Check order payouts
SELECT id, distance, "deliveryPartnerPayout" FROM orders WHERE "deliveryPartnerPayout" IS NOT NULL LIMIT 10;

-- Verify distance format (should be string with .00)
SELECT distance, "deliveryPartnerPayout" FROM orders WHERE id = 'order-id-here';
```

**Expected:**
- Distances stored as: "0.50", "1.50", "2.80" (DECIMAL format)
- Payouts stored as: 10, 15, 20, 25, 30 (INTEGER)
- All queries return results without errors

---

## Troubleshooting

### Issue: 500 Error When Creating Slab

**Cause:** Distance type conversion issue
**Fix:** Ensure distances are numeric (toFixed(2) applied)
**Status:** ✅ FIXED in commit ddc3975

### Issue: Payout Shows as NULL

**Cause:** Distance not calculated or no matching slab
**Verify:**
1. Distance stored in order? `SELECT distance FROM orders WHERE id = '...'`
2. Matching slab exists? `SELECT * FROM delivery_partner_payouts WHERE min_distance <= 0.5`
3. System logs show calculation attempt?

### Issue: Wrong Payout Amount

**Cause:** Slab doesn't match distance range
**Debug:**
```sql
-- Check which slab would match for 1.5km
SELECT * FROM delivery_partner_payouts
WHERE min_distance <= 1.5 AND max_distance > 1.5 AND is_active = true;
```

### Issue: Regional Rate Not Applied

**Cause:** Pincode mismatch or slab inactive
**Debug:**
```sql
-- Check if pincode-specific slab exists
SELECT * FROM delivery_partner_payouts
WHERE pincode = '400070' AND is_active = true;
```

---

## Performance Notes

### Query Optimization
The database has 3 indexes for fast lookups:
1. `(pincode, is_active)` - Fast pincode-specific rate lookup
2. `(min_distance, max_distance, is_active)` - Fast distance range lookup
3. `(is_active) WHERE pincode IS NULL` - Fast global rate lookup

### Expected Performance
- **Payout lookup:** < 5ms (indexed queries)
- **Order creation:** < 100ms (including all calculations)
- **List all payouts:** < 50ms (typically 5-20 slabs)

---

## Summary Checklist

- [ ] Admin can create payout slabs
- [ ] Slabs appear in table correctly
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] Delivery personnel see correct payouts in earnings
- [ ] Distance ranges matched correctly
- [ ] Regional (pincode-specific) rates work
- [ ] Fallback behavior (no matching slab) works
- [ ] Inactive slabs ignored
- [ ] Database stores distances correctly (decimal format)
- [ ] No 500 errors when creating orders

✅ **All tests pass** = Delivery partner payout system fully operational!
