# Referral Module - User End Testing Checklist

## Overview
This document provides a comprehensive testing plan to verify that the referral module is fully functional at the user end without breaking anything.

---

## REFERRAL USER FLOWS

### Flow 1: NEW USER REGISTERS WITH REFERRAL CODE
**Where:** Checkout Dialog (guest purchase → registration)
**Steps:**
1. Guest user adds items to cart
2. Clicks checkout
3. Fills in name, phone, email, address
4. Optional: Enters friend's referral code in "Referral Code" field
5. Submits → Account created + Order placed
6. **Expected Result:** 
   - Account created with login credentials (last 6 digits of phone)
   - Order created
   - ₹50 bonus added to new user's wallet (referredBonus)
   - Referral record created with "pending" status
   - Upon first order completion → referral status becomes "completed"

**Test Case:**
```
Phone: 9876543210
Name: Test User
Email: test@example.com
Referral Code: REF12345ABC (from friend)

Expected:
✓ User account created
✓ Order created
✓ Wallet balance = 50 (referredBonus)
✓ Referral record visible in admin dashboard (status: pending)
✓ Friend (referrer) gets ₹50 bonus when this user completes first order
```

---

### Flow 2: EXISTING LOGGED-IN USER APPLIES REFERRAL CODE
**Where:** Profile Page → Referral Section
**Steps:**
1. Logged-in user visits Profile page
2. Finds "Apply Referral Code" section
3. Enters friend's referral code
4. Clicks apply button
5. **Expected Result:**
   - Eligibility check runs (user hasn't used a code before)
   - Bonus applied immediately to wallet
   - Referral status: "pending" (waiting for first order)

**Test Case:**
```
User: Already logged in
Referral Code: REF12345ABC

Expected:
✓ Code input visible on Profile page
✓ Eligibility message shows (if eligible)
✓ Error message shows (if already used a code)
✓ ₹50 bonus applied immediately to wallet
✓ Referral record created (status: pending)
```

---

### Flow 3: USER GENERATES REFERRAL CODE TO SHARE
**Where:** InviteEarn Page
**Steps:**
1. Logged-in user visits InviteEarn page
2. Clicks "Generate Code" button
3. Code displayed (REF + 8 characters)
4. User can:
   - Copy to clipboard
   - Share via WhatsApp (auto-filled message)
   - Share via SMS

**Test Case:**
```
User: John
Expected Code Format: REF[8 CHARS]
Expected Message (WhatsApp): "Join RotiHai and get ₹50 off! Use my code: REF12345ABC"

✓ Code generated
✓ Copy button works
✓ WhatsApp link opens with pre-filled message
✓ SMS opens default SMS app with message
```

---

### Flow 4: VIEW REFERRAL STATISTICS
**Where:** InviteEarn Page → Stats Tab
**Displays:**
- Total referrals made
- Completed referrals (first order placed)
- Pending referrals (waiting for first order)
- Total earned amount (₹)
- Monthly earned amount (₹)
- Monthly earning limit (₹500)

**Test Case:**
```
User: John (referred 5 people)
Expected Stats:
- Total Referrals: 5
- Completed: 2 (got bonuses)
- Pending: 3 (waiting for first order)
- Total Earned: 100 (₹50 × 2 completed)
- Monthly Earned: 50
- Monthly Limit: 500

✓ Numbers match database records
✓ Breakdown by status is accurate
```

---

### Flow 5: VIEW LIST OF REFERRED USERS
**Where:** InviteEarn Page → My Referrals Tab
**Displays for each referral:**
- Name (referred user)
- Phone number
- Status (Pending/Completed/Expired)
- Bonus amount (₹)
- Date referred
- Status badge with icon

**Test Case:**
```
List shows:
1. Alice (9876543210) - Pending - ₹50 - Dec 10, 2025
2. Bob (9876543211) - Completed - ₹50 - Dec 9, 2025
3. Carol (9876543212) - Expired - ₹50 - Nov 14, 2025

✓ All referred users listed
✓ Status badges color correct (green/yellow/red)
✓ Dates formatted correctly
✓ Bonus amounts match records
```

---

### Flow 6: AUTO-COMPLETE REFERRAL ON FIRST ORDER
**Where:** Backend (automatic when order placed)
**Trigger:** Referred user places their first order
**Expected Result:**
- Referral status changes from "pending" → "completed"
- Referrer gets bonus (₹50) added to wallet
- completedAt timestamp set
- Referral appears in admin dashboard as completed

**Test Case:**
```
Setup:
- User B referred by User A using code REF12345ABC
- User B gets ₹50 bonus immediately

Action:
- User B places first order

Expected:
✓ Referral status changes to "completed"
✓ User A wallet increases by ₹50
✓ Admin dashboard shows referral as completed
✓ Timestamp recorded in completedAt field
```

---

### Flow 7: REFERRAL EXPIRY (AUTOMATIC)
**Duration:** 30 days (configurable by admin)
**Trigger:** Referred user doesn't place order within 30 days
**Expected Result:**
- Referral status auto-expires
- No bonuses awarded
- Referral shows as "Expired" in UI

**Test Case (Admin Configuration):**
```
Settings: expiryDays = 30

Setup:
- User B referred on Nov 14
- 30 days = Dec 14

Action on Dec 15 (after 30 days):
- User B hasn't placed order yet

Expected:
✓ Referral status = "expired"
✓ No bonus to User A
✓ Referral visible in admin dashboard (status: expired)
✓ Can't be manually completed (expired)
```

---

### Flow 8: MONTHLY LIMITS ENFORCEMENT
**Limits:**
- Max 10 referrals per referrer per month
- Max ₹500 earnings per referrer per month

**Test Case 1 - Referral Count Limit:**
```
User A tries to refer 11 people in December

Expected:
✓ 1st-10th referral: Success ✓
✓ 11th referral: Error "Monthly limit reached"
```

**Test Case 2 - Earnings Limit:**
```
User A has referred 10 people (all completed)
Earnings = 10 × ₹50 = ₹500

11th referral completes on same month:
Expected:
✓ First 10 referrals: ₹50 each (total ₹500)
✓ 11th completion: ₹0 bonus (limit reached)
```

---

### Flow 9: PREVENT SELF-REFERRAL
**Test Case:**
```
User A's referral code: REF12345ABC
User A tries to use their own code

Expected:
✗ Error: "You cannot use your own referral code"
✗ No bonus applied
```

---

### Flow 10: PREVENT MULTIPLE REFERRAL CODES (User)
**Rule:** Each user can apply only one referral code

**Test Case:**
```
User B already used referral code REF11111111 (from User A)

User B tries to apply another code REF22222222:
Expected:
✗ Error: "User already used a referral code"
✗ Eligibility check shows: eligible = false
```

---

### Flow 11: ADMIN REFERRAL MANAGEMENT
**Where:** Admin Dashboard → Referrals Tab

**Features:**
1. **View All Referrals**
   - Referral code
   - Referrer name/phone
   - Referred user name/phone
   - Status (Completed/Pending/Expired)
   - Bonus amounts
   - Dates

2. **Filter by Status**
   - All / Pending / Completed / Expired

3. **Search**
   - By referral code

4. **Manual Actions**
   - Mark as completed (manually award bonus)
   - Expire referral (cancel)

**Test Case:**
```
Admin views referrals table:
✓ Can see all referrals with complete data
✓ Filter works (show only pending)
✓ Search finds referral by code
✓ Can manually complete pending referral
✓ Can expire active referral
```

---

### Flow 12: ADMIN REFERRAL STATISTICS
**Where:** Admin Dashboard → Referrals Tab (Stats Cards)

**Metrics:**
- Total Referrals (all time)
- Pending Referrals (count)
- Completed Referrals (count)
- Total Bonuses Paid (₹ amount)

**Test Case:**
```
System has:
- 100 total referrals
- 20 pending
- 75 completed
- 5 expired

Total Bonuses Paid: ₹3,750 (75 × ₹50)

Expected in Admin Dashboard:
✓ Card 1: Total = 100
✓ Card 2: Pending = 20
✓ Card 3: Completed = 75
✓ Card 4: Paid = ₹3,750
```

---

### Flow 13: WALLET INTEGRATION
**Where:** Wallet shows combined bonuses from:
- Referral bonuses
- Order refunds
- Coupons/Discounts
- Manual admin additions

**Test Case:**
```
User receives:
- ₹50 from referral (immediate when code applied)
- ₹50 from referral (when referred user orders)
- ₹25 from coupon
Total = ₹125

Expected:
✓ Wallet balance = 125
✓ Can be used for next order
✓ Breakdown visible in wallet logs
```

---

### Flow 14: REFERRAL BONUS DURING CHECKOUT
**Where:** Payment/Checkout process

**Test Case:**
```
User has wallet balance: ₹150 (from referral bonuses)
Order total: ₹200

Expected Options:
1. Use ₹150 wallet → Pay ₹50 cash
2. Use ₹200 wallet (if available) → Pay ₹0
3. Pay full ₹200 (no wallet use)

✓ Wallet balance deducted correctly
✓ Order reflects wallet usage
```

---

## CRITICAL INTEGRATION POINTS TO TEST

### 1. Registration → Referral Application
**File:** CheckoutDialog.tsx (lines 630-640)
```
When new user registers:
✓ Referral code input is visible
✓ Code is captured and trimmed
✓ Applied immediately after account creation
✓ Bonus appears in wallet
```

### 2. Order Completion → Referral Completion
**File:** server/routes.ts (Order creation endpoint)
```
When referred user places first order:
✓ Pending referral found
✓ Referral status updated to completed
✓ Referrer bonus added to wallet
✓ completedAt timestamp set
```

### 3. Referral Settings → Admin Configuration
**File:** Admin Wallet Settings page
```
Admin can set:
✓ Referrer bonus amount (₹)
✓ Referred user bonus amount (₹)
✓ Min order amount to trigger completion
✓ Max referrals per month
✓ Max earnings per month
✓ Expiry days
```

---

## POTENTIAL GAPS/ISSUES TO CHECK

### Issue 1: Referral Code Input in Registration
**Current State:** ✓ Present in CheckoutDialog.tsx
**Check:** Is input visible for all new users during checkout?

### Issue 2: Referral Eligibility Display
**Current State:** ✓ Query exists `/api/user/referral-eligibility`
**Check:** Is eligibility message shown on Profile page?

### Issue 3: Auto-Completion Logic
**Current State:** ✓ Implemented in order creation
**Check:** Does it work when order created via:
- CheckoutDialog (direct)
- Guest order → auto-register
- Partner assignment

### Issue 4: Expiry Date Handling
**Current State:** ✓ Logic exists in storage.ts
**Check:** 
- Are expired referrals correctly marked?
- Do they show as "Expired" in UI?
- Can admin force expire?

### Issue 5: Monthly Limits Enforcement
**Current State:** ✓ Logic in applyReferralBonus()
**Check:**
- Are month boundaries (1st-30th) correct?
- Does it prevent 11th referral?
- Does it prevent earnings beyond ₹500?

### Issue 6: Wallet Balance Display
**Current State:** ✓ Wallet system exists
**Check:**
- After referral bonus → does wallet show updated balance?
- Can user use bonus for checkout?
- Are wallet logs recording referral sources?

---

## TESTING ENVIRONMENT SETUP

### Test Users to Create:
```
User A (Referrer):
- Phone: 9876543210
- Name: Referrer Test
- Email: referrer@test.com
- Referral Code: REF12345ABC

User B (Referred - New):
- Phone: 9876543211
- Name: Referred Test
- Email: referred@test.com
- Applied Code: REF12345ABC

User C (Self-referral attempt):
- Phone: 9876543212
- Name: Self Test
- Generated Code: REF11111111
- Tries to use own code
```

### Test Admin Account:
- Email: admin@test.com
- Access to referral management

---

## EXECUTION STEPS FOR TESTING

### Step 1: Setup
- [ ] Start dev server: `npm run dev`
- [ ] Ensure backend is running
- [ ] Clear test database (or use test data)
- [ ] Create test admin account

### Step 2: Test Flow 1 (New User with Referral)
- [ ] Open application in incognito window
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Create account with referral code
- [ ] Verify account created and bonus applied
- [ ] Check admin dashboard for referral record

### Step 3: Test Flow 2 (Apply Referral as Logged User)
- [ ] Login as existing user
- [ ] Navigate to Profile page
- [ ] Find referral section
- [ ] Apply referral code
- [ ] Verify bonus applied
- [ ] Check referral record in admin

### Step 4: Test Flow 3 (Generate and Share)
- [ ] Login as referrer
- [ ] Go to InviteEarn page
- [ ] Generate code
- [ ] Test copy to clipboard
- [ ] Test WhatsApp share (should open)
- [ ] Test SMS share (should open)

### Step 5: Test Flow 6 (Auto-Completion)
- [ ] As referred user, place first order
- [ ] Wait for order completion
- [ ] Check referrer's wallet → should increase by ₹50
- [ ] Check admin dashboard → referral should show "completed"

### Step 6: Test Limits
- [ ] Create user with max referrals (10)
- [ ] Try to create 11th → should fail
- [ ] Check monthly earnings cap (₹500)

### Step 7: Admin Testing
- [ ] View all referrals in admin dashboard
- [ ] Filter by status
- [ ] Search by code
- [ ] Manually complete pending referral
- [ ] Manually expire referral
- [ ] Check statistics cards

---

## SUCCESS CRITERIA

### All Flows Working ✓
- New user can apply referral during registration
- Existing user can apply referral in Profile
- User can generate and share referral code
- Stats and referral list display correctly
- Auto-completion triggers on first order
- Monthly limits prevent abuse
- Admin can manage referrals

### No Breaking Changes ✓
- Existing order flow works
- Wallet integration doesn't break
- User authentication unaffected
- Admin dashboard functional
- No console errors
- Performance acceptable

---

## IDENTIFIED IMPLEMENTATION DETAILS

### Architecture Confirmed:
1. **Database:** PostgreSQL with referrals table
2. **Backend:** Node.js/Express with complete referral endpoints
3. **Frontend:** React with InviteEarn, Profile, CheckoutDialog components
4. **Admin:** Full referral management dashboard
5. **Integration:** Auto-completion on first order

### Key Files to Monitor for Changes:
- `server/routes.ts` - Referral endpoints & order completion logic
- `server/storage.ts` - Referral database operations
- `client/src/components/CheckoutDialog.tsx` - Registration with referral
- `client/src/pages/Profile.tsx` - Apply referral UI
- `client/src/pages/InviteEarn.tsx` - Share & stats UI
- `client/src/pages/admin/AdminReferrals.tsx` - Admin management

### No Risk of Breaking:
- Referral system is isolated with dedicated endpoints
- Doesn't interfere with order, user, or product flows
- Database transactions ensure consistency
- Backward compatible (old users don't break)

