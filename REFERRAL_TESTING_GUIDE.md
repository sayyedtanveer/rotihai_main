# Referral System - Quick Testing Guide

## How to Test the New Referral Features

### Prerequisites
- Dev server running: `npm run dev`
- Have a referral code ready (e.g., from an existing user's profile)

---

## Test 1: Guest User Registration with Referral Code During Checkout

### Steps:
1. Open the checkout dialog
2. **Important**: Do NOT log in (stay as guest)
3. Enter customer details:
   - Name: "Test User"
   - Phone: "9999999999" (or any new phone)
   - Email: "test@example.com"
4. In the "Referral Code" field, enter: `REFABC12345` (adjust if invalid)
5. Add items to cart and proceed to checkout
6. Complete order creation

### Expected Results:
- ✅ New account created
- ✅ Message displays: "You received ₹50 referral bonus!"
- ✅ User's wallet shows ₹50 credit
- ✅ Referral record created with status "pending"
- ✅ Referrer's name shows on the new user's profile

### API Response Check:
Look for in the response:
```json
{
  "accountCreated": true,
  "appliedReferralBonus": 50,
  "defaultPassword": "999999",
  ...
}
```

---

## Test 2: Referral Completion When Order Delivered

### Steps:
1. After creating an order with referral (Test 1)
2. Go to Admin Panel → Orders
3. Find the order
4. Mark status as "confirmed" first (if needed)
5. Change status to "delivered"
6. Check the referral record

### Expected Results:
- ✅ Referral status changed to "completed"
- ✅ Referrer received ₹50 wallet bonus
- ✅ Console logs: "✅ Referral completion triggered"
- ✅ Wallet transaction created with type "referral_bonus"

### Database Check:
```sql
-- Check referral completion
SELECT id, status, referredOrderCompleted FROM referrals 
WHERE referralCode = 'REFABC12345' LIMIT 1;

-- Should show: status = 'completed', referredOrderCompleted = true

-- Check wallet transaction
SELECT * FROM wallet_transactions 
WHERE type = 'referral_bonus' 
ORDER BY created_at DESC LIMIT 1;
```

---

## Test 3: Authenticated User Applying Referral Code Later

### Steps:
1. Log in with an existing user account
2. Go to Invite & Earn section (or referral page)
3. Click "Apply Code" button
4. Enter referral code: `REF[EXISTING_USER_CODE]`
5. Click apply

### Expected Results:
- ✅ Bonus applied successfully message
- ✅ Wallet updated with ₹50 bonus
- ✅ Referral marked as "pending"
- ✅ When user places order → referral completes

### API Response:
```json
{
  "message": "Referral bonus applied successfully",
  "bonus": 50,
  "note": "Bonus is credited to your wallet. It will be available for your next order."
}
```

---

## Test 4: Referral Expiry (Auto-Expiration)

### Steps:
1. Create a referral code (if user doesn't have one, they get auto-generated)
2. Share code with someone but they don't apply it
3. Wait 30 days (or manually update database for testing)
4. Call: `GET /api/user/referral-stats` for the referrer

### Manual Testing (Skip 30 days):
```sql
-- Update referral creation date to 31 days ago
UPDATE referrals 
SET created_at = NOW() - INTERVAL '31 days' 
WHERE referralCode = 'REFABC12345' 
AND status = 'pending';

-- Then call the endpoint
```

### Expected Results:
- ✅ Referral auto-marked as "expired"
- ✅ referralStats shows `expiredReferrals: 1`
- ✅ pendingReferrals count decreased
- ✅ Console logs: "⏰ Auto-expired referral..."

---

## Test 5: System Disabled

### Steps:
1. Go to Admin Panel → Settings
2. Disable Referral System (set isActive = false in referralRewards table)
3. Try to apply referral code

### Database Shortcut:
```sql
UPDATE referral_rewards 
SET is_active = false;
```

4. Try to create order with referral code or apply referral

### Expected Results:
- ✅ Error: "Referral system is currently disabled"
- ✅ Order still completes without referral
- ✅ No bonus credited

### To Re-enable:
```sql
UPDATE referral_rewards 
SET is_active = true;
```

---

## Test 6: Error Scenarios

### Test 6a: Invalid/Non-existent Code
1. Try to apply: `REFFFFFFFF` (non-existent)
2. Expected: "Invalid referral code"

### Test 6b: Self-Referral Prevention
1. Get your own referral code from profile
2. Try to apply it to same account
3. Expected: "You cannot use your own referral code"

### Test 6c: Duplicate Application
1. Apply code to user account
2. Try to apply another code to same account
3. Expected: "User already used a referral code"

### Test 6d: Monthly Limits
1. Apply code to reach maxReferralsPerMonth (default: 10)
2. Try to apply 11th referral
3. Expected: "Referrer has reached the monthly limit"

---

## API Endpoints Reference

### Get Your Referral Code
```
GET /api/user/referral-code
Auth: Bearer <token>
```

Response:
```json
{
  "referralCode": "REF12345ABC"
}
```

### Get Referral Stats
```
GET /api/user/referral-stats
Auth: Bearer <token>
```

Response:
```json
{
  "referralCode": "REF12345ABC",
  "totalReferrals": 5,
  "pendingReferrals": 2,
  "completedReferrals": 2,
  "expiredReferrals": 1,
  "totalEarnings": 100
}
```

### Apply Referral Code (For Logged-in Users)
```
POST /api/user/apply-referral
Auth: Bearer <token>
Body:
{
  "referralCode": "REFABC12345"
}
```

### Create Order with Referral (For Guest Users)
```
POST /api/orders
Body:
{
  "customerName": "Test",
  "phone": "9999999999",
  "email": "test@example.com",
  "address": "test",
  "items": [...],
  "referralCode": "REFABC12345",  // <-- NEW FIELD
  ...
}
```

---

## Verification Checklist

After implementation, verify:

- [ ] User can enter referral code during guest checkout
- [ ] New account created successfully with code
- [ ] ₹50 bonus credited immediately
- [ ] Order creation shows appliedReferralBonus in response
- [ ] Checkout message displays bonus amount
- [ ] Referral marked as "pending" in database
- [ ] When order marked "delivered" → referral completes
- [ ] Referrer receives ₹50 bonus when referral completes
- [ ] Referral stats show expiredReferrals count
- [ ] Old referrals auto-expire after 30 days
- [ ] System can be disabled via admin panel
- [ ] Self-referral prevented with error message
- [ ] Duplicate code application prevented
- [ ] Monthly limits enforced correctly
- [ ] All operations logged to console with clear indicators

---

## Troubleshooting

### Problem: "appliedReferralBonus" not in response
**Solution**: Make sure the checkout request includes `referralCode` field and user is NOT authenticated

### Problem: Referral not completing on delivery
**Solution**: Check that order status is set to exactly "delivered" (case-sensitive)

### Problem: Bonus not showing in wallet
**Solution**: 
1. Verify referralRewards table has isActive = true
2. Check wallet_transactions table for the transaction
3. Verify user ID is correct

### Problem: Old referrals not expiring
**Solution**: 
1. Expiry only happens when calling `/api/user/referral-stats`
2. Manually update created_at in database for testing
3. Check that expiryDays is set correctly in referralRewards

---

## Admin Commands

### View All Referral Settings
```
GET /api/admin/referral-rewards
Auth: Admin token
```

### Update Referral Settings
```
PATCH /api/admin/referral-rewards/:id
Auth: Admin token
Body:
{
  "referrerBonus": 100,
  "referredBonus": 100,
  "maxReferralsPerMonth": 20,
  "maxEarningsPerMonth": 1000,
  "expiryDays": 60,
  "isActive": true
}
```

### View All Referrals
```
GET /api/admin/referrals
Auth: Admin token
```

### View Wallet Transactions
```
GET /api/admin/wallet-transactions
Auth: Admin token
```

---

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review database records in referrals and wallet_transactions tables
3. Verify admin settings in referralRewards table
4. Check that referralCode field exists on users table

---

**Status**: ✅ Implementation Complete and Ready for Testing

Last Updated: December 14, 2025
