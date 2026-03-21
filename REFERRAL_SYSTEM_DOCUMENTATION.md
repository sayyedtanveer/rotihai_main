# Referral System Documentation

**Last Updated**: March 21, 2026  
**Status**: Production (with known bugs)

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Business Rules](#business-rules)
3. [User Flows](#user-flows)
4. [Technical Architecture](#technical-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Bug List](#bug-list)

---

## System Overview

### What is the Referral System?

The referral system incentivizes existing users to refer friends and family to Roti Trothai by offering monetary bonuses:

- **Referred User (New)**: Gets ₹50 bonus immediately upon applying referral code
- **Referrer (Existing)**: Gets ₹100 bonus when their referred friend completes their first order
- **Monthly Caps**: Max ₹500 earnings per referrer, max 10 referrals per month

### Key Concept: Two-Person Transaction

```
Referrer (Existing User)
    ↓ shares code
Referred User (New User)
    ↓ applies code during checkout
Both get bonuses (at different times)
```

### Timeline

| Event | Actor | Bonus | When | Amount |
|-------|-------|-------|------|--------|
| Apply Code | Referred User | ✓ | Immediately | ₹50 |
| First Order Delivery | Referred User's Order System | ✓ | When order delivered | ₹100 to Referrer |

---

## Business Rules

### Referral Code Generation

```
Who Can Generate?
├─ Any authenticated user
├─ One code per user (UNIQUE)
└─ Code Format: REF{8 random alphanumeric} (e.g., REF12345678)

Code Properties:
├─ Unique across system
├─ Associated with referrer's phone/userId
├─ No expiration (but referral transaction expires)
└─ Can be shared via Profile page
```

### Referral Code Application

```
WHO CAN APPLY REFERRAL CODE?
├─ New Users (not in database)
│  └─ During checkout (no login required)
│  └─ Auto-register on order creation
└─ Existing Authenticated Users
   └─ Via Profile → Wallet & Referrals section

HOW MANY TIMES?
└─ Each user applies ONCE (one referral per user lifetime)
```

### Bonus Eligibility & Validation Checks

#### When Applying Code (New User Checkout)

```typescript
✅ VALIDATIONS PERFORMED:
1. Code exists in database (users.referral_code)
2. Referrer user exists
3. Not self-referral (referrer.id ≠ referred.id)
4. Referred user not already used referral (no existing referrals.referredId match)
5. Referrer's monthly limit not exceeded (max 10 this month)
6. Referrer's monthly earnings cap not exceeded (max ₹500 this month)
7. System is enabled (referral_rewards.is_active = true)

🚫 REJECTED IF ANY FAIL
```

#### When First Order Completes (Background Task)

```typescript
✅ ADDITIONAL CHECKS:
1. Referral still in "pending" status
2. Not expired (30 days from creation)
3. Monthly earnings cap still valid for referrer
4. Order successfully delivered (triggers background job)

🚫 MARKS AS "expired" IF PAST 30 DAYS
```

### Monthly Cap Enforcement

```
Period: Calendar Month (1st - Last day)
Referrer Limits:
├─ Max 10 referrals applied per month
└─ Max ₹500 earnings per month (even if 10+ pending)

Example Scenario:
├─ Day 1: Referrer A makes 10 referrals (all applied, all pending)
├─ Day 5: Referrer A tries to make 11th referral → BLOCKED
├─ Day 5: First referral completes → Referrer A gets ₹100
├─ Day 5: Referrer A tries 11th again → Still BLOCKED (10 in month)
└─ Feb 1: Counter resets, can apply again
```

### Referral Status Lifecycle

```
pending
├─ Initial state when referral code applied
├─ Waiting for friend to complete first order
└─ If 30 days pass → Auto-marked "expired"

↓ (Upon first order delivery)

completed
├─ Referral successful
├─ Both bonuses credited
└─ Immutable (final state)

OR

expired
├─ 30 days passed without order
├─ Bonuses NOT credited
└─ Immutable (final state)

OR (Admin-only)

cancelled
├─ Admin manually cancels
└─ Used for fraud/disputes

FRAUD-FLAGGED (special field)
├─ fraud_flag = true
├─ Admin marked as suspicious
├─ Bonuses may be clawed back
└─ Used for fraud prevention
```

---

## User Flows

### Flow 1: New User with Referral Code (During Checkout)

```
┌─────────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY: NEW USER WITH REFERRAL CODE           │
└─────────────────────────────────────────────────────────┘

1. UNREGISTERED USER SEES CHECKOUT
   ├─ Fills in address
   ├─ Validates address
   ├─ Enters phone number
   └─ Referral code input appears (new user only)

2. USER ENTERS REFERRAL CODE
   ├─ Sees field: "Enter friend's referral code"
   ├─ Shows format: REF{8 chars}
   └─ [OPTIONAL] Clicks "Verify" button
        ├─ POST /api/referral/validate {referralCode}
        └─ Shows: "You'll get ₹50 bonus from [Friend's Name]"

3. USER CLICKS "PLACE ORDER"
   ├─ [CLIENT] Creates pending checkout record
   ├─ [SERVER] POST /api/orders
   │  ├─ Body includes: referralCode: "REF12345678"
   │  ├─ Auto-registers new user
   │  ├─ Creates order
   │  └─ Inside transaction: storage.applyReferralBonus()
   │     ├─ All validations pass ✓
   │     ├─ Creates referral record (status: pending)
   │     └─ Credits wallet ₹50 immediately
   └─ Returns: { orderId, accessToken, userCreated: true, defaultPassword }

4. USER SEES PAYMENT QR
   ├─ Scans and pays
   ├─ Payment confirmed
   ├─ [CLIENT] Marks pending checkout as confirmed
   └─ Shows "Account Created!" dialog with password

5. ACCOUNT DIALOG SHOWS
   ├─ Phone
   ├─ Password (last 6 digits of phone)
   └─ Button: "Go to Track Order"

6. USER NAVIGATES TO ORDER TRACKING
   ├─ Can see order status
   └─ Bonus is in wallet (₹50 available immediately)

7. [BACKGROUND] When Order Delivered
   ├─ Referral marked as "completed"
   ├─ Referrer gets ₹100 credit
   └─ Wallet updated next time they refresh

RESULT: ✅ Referral successful, both bonuses credited
```

### Flow 2: Existing User Applying Referral Code (Profile Page)

```
┌─────────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY: EXISTING USER APPLYING CODE            │
└─────────────────────────────────────────────────────────┘

1. LOGGED-IN USER OPENS PROFILE
   ├─ Clicks "Wallet & Referrals" tab
   ├─ Sees section: "Have a referral code from a friend?"
   └─ [CLIENT] Calls GET /api/user/referral-eligibility
        ├─ Check: Has this user used referral before?
        └─ Response: { eligible: true/false, reason? }

2. IF ELIGIBLE:
   ├─ Shows input: "Enter friend's referral code"
   ├─ User enters code: "REF12345678"
   ├─ User clicks "Apply Referral"
   ├─ [CLIENT] POST /api/user/apply-referral {referralCode, userToken}
   │  └─ [SERVER] storage.applyReferralBonus()
   │     ├─ All validations pass ✓
   │     ├─ Creates referral record (status: pending)
   │     ├─ Credits wallet ₹50
   │     └─ Returns success
   └─ Toast: "✓ Referral bonus of ₹50 added!"

3. IF NOT ELIGIBLE:
   ├─ Already used referral? → "You've already applied a referral"
   ├─ Code invalid? → "Referral code not found"
   ├─ System disabled? → "Referral program is not active"
   └─ Monthly limit? → "Referrer's monthly limit reached"

4. WALLET UPDATES
   ├─ ₹50 added immediately
   ├─ Can use in next order
   └─ Balance persists across sessions

5. [BACKGROUND] When This User's First Order Delivers
   ├─ Referral marked as "completed"
   ├─ Referrer gets ₹100 credit
   └─ System tracks completion automatically

RESULT: ✅ Referral applied, bonus credited immediately
```

### Flow 3: Referrer Generating Code & Sharing

```
┌─────────────────────────────────────────────────────────┐
│ REFERRER JOURNEY: GENERATE & SHARE CODE                  │
└─────────────────────────────────────────────────────────┘

1. LOGGED-IN USER OPENS PROFILE
   ├─ Clicks "Wallet & Referrals" tab
   └─ Sees section: "Share with friends and earn ₹100"

2. USER CLICKS "GENERATE REFERRAL CODE"
   ├─ [CLIENT] POST /api/user/generate-referral {userToken}
   ├─ [SERVER] Creates REF{8 chars} if not exists
   ├─ Stores in users.referral_code
   └─ Returns unique code

3. CODE DISPLAYED
   ├─ Shows: "REF12AB34CD"
   ├─ Shows: "[Copy Button]"
   ├─ Shows: "Share with friends via WhatsApp/SMS/Email"
   └─ Instructions:
        ├─ "Friends get ₹50 bonus"
        ├─ "You get ₹100 when they complete first order"
        └─ "Code valid for 30 days per referral"

4. USER SHARES CODE
   ├─ Copies code
   ├─ Sends to friend via WhatsApp/SMS/Email
   └─ Friend uses during checkout

5. TRACKING REFERRALS
   ├─ [CLIENT] GET /api/user/referrals {userToken}
   ├─ Shows list of all referrals made BY this user
   │  ├─ Friend's phone (masked: +91 98765*****)
   │  ├─ Status: pending/completed/expired
   │  ├─ Created date
   │  ├─ Bonus amount (₹100)
   │  └─ Expected bonus date
   └─ Available bonuses visible in wallet

RESULT: ✅ Code shared, awaiting first friend order for ₹100
```

---

## Technical Architecture

### Component Flow (Frontend)

```
CheckoutDialog.tsx (New Users)
├─ Referral code input field (new users only)
├─ [OPTIONAL] Verify button
│  └─ useValidateReferralCode() hook
│     └─ POST /api/referral/validate
│        └─ Shows: bonus amount + referrer name
└─ On submit: passes referralCode to PaymentQRDialog

PaymentQRDialog.tsx (All Users)
├─ Receives: pending_checkout info + referrals
├─ Waits for payment confirmation
├─ If successful:
│  ├─ For new user: storage.applyReferralBonus() already ran
│  └─ Shows AccountCreatedDialog

Profile.tsx (Existing Users)
├─ Wallet & Referrals Tab
├─ Generate Code Button
│  └─ useGenerateReferralCode() hook
│     └─ POST /api/user/generate-referral
├─ Apply Code Section
│  └─ useApplyReferral() hook
│     └─ POST /api/user/apply-referral
├─ View My Referrals
│  └─ useQuery(["/api/user/referrals"])
│     └─ GET /api/user/referrals
└─ Check Eligibility
   └─ useQuery(["/api/user/referral-eligibility"])
      └─ GET /api/user/referral-eligibility
```

### Backend Architecture

```
API Layer (server/routes.ts)
├─ POST   /api/user/generate-referral      → requireUser
├─ POST   /api/referral/validate           → Public
├─ POST   /api/user/apply-referral         → requireUser
├─ GET    /api/user/referral-eligibility   → requireUser
├─ GET    /api/user/referral-code          → requireUser
├─ GET    /api/user/referrals              → requireUser
└─ POST   /api/referral-settings           → Public

Storage Layer (server/storage.ts)
├─ generateReferralCode(userId)
├─ applyReferralBonus(code, userId)        ← Main business logic
├─ completeReferralOnFirstOrder(userId)    ← Background task
├─ getReferralsByUser(userId)
├─ checkReferralEligibility(userId)
└─ validateBonusEligibility(orderTotal)

Database Layer
├─ referrals table
├─ referral_rewards settings table
├─ wallet_transactions table (bonus credits)
└─ users.referral_code column
```

### Key Functions

#### 1. `applyReferralBonus()` - Main Transaction

```typescript
// File: server/storage.ts, Line ~2204

async applyReferralBonus(referralCode: string, newUserId: string) {
  return db.transaction(async (tx) => {
    // 1. Validation checks
    ├─ System enabled?
    ├─ Code exists?
    ├─ Self-referral?
    ├─ User already applied?
    ├─ Referrer monthly limit?
    └─ Referrer earnings cap?
    
    // 2. Create referral record
    ├─ status: "pending"
    ├─ referrer_id: from code
    ├─ referred_id: newUserId
    └─ created_at: now
    
    // 3. Credit wallet immediately
    ├─ Amount: ₹50
    ├─ Type: "referral_bonus"
    ├─ Description: "Welcome bonus from {referrer_name}"
    └─ reference_type: "referral"
    
    // 4. Return success
  });
}
```

#### 2. `completeReferralOnFirstOrder()` - Background Task

```typescript
// File: server/routes.ts, Line ~1930
// Triggered when: POST /api/orders succeeds (order created)

async completeReferralOnFirstOrder(userId: string) {
  return db.transaction(async (tx) => {
    // 1. Find pending referral
    ├─ Status: "pending"
    ├─ referred_id: userId
    └─ created_at: recent
    
    // 2. Check expiry
    ├─ If now > created + 30 days
    ├─ Mark as "expired"
    └─ Return (no bonus)
    
    // 3. Check referrer's monthly cap
    ├─ Sum bonuses from completed referrals this month
    ├─ If sum + ₹100 > ₹500
    ├─ Don't credit (but mark completed)
    └─ Log for admin review
    
    // 4. Credit referrer wallet
    ├─ Amount: ₹100
    ├─ Type: "referral_bonus"
    ├─ Description: "Friend completed first order"
    └─ reference_type: "referral"
    
    // 5. Mark referral complete
    ├─ status: "completed"
    ├─ completed_at: now
    └─ referrer_bonus: ₹100 (or 0 if capped)
  });
}
```

---

## Database Schema

### referrals Table

```sql
CREATE TABLE referrals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Users
  referrer_id VARCHAR NOT NULL,           -- User who shared code
  referred_id VARCHAR NOT NULL,           -- New user who applied
  referral_code VARCHAR(20) NOT NULL,    -- Code used (REF...)

  -- Status & Dates
  status VARCHAR(20) DEFAULT 'pending',  -- pending|completed|expired|cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,                -- When order delivered
  
  -- Bonus Amounts
  referrer_bonus INT DEFAULT 0,          -- ₹100 (or 0 if capped)
  referred_bonus INT DEFAULT 50,         -- ₹50 (fixed)
  
  -- Fraud Tracking (Admin-set)
  fraud_flag BOOLEAN DEFAULT false,      -- Manual fraud marker
  admin_note TEXT,                       -- Reason for flag
  
  -- Indexes
  CONSTRAINT referrals_unique_referrer_per_month 
    CHECK (extract(YEAR FROM created_at) = extract(YEAR FROM NOW()) 
      AND extract(MONTH FROM created_at) = extract(MONTH FROM NOW())),
  
  INDEX idx_referrer_id_status ON referrer_id, status,
  INDEX idx_referred_id ON referred_id,
  INDEX idx_status_created ON status, created_at,
  INDEX idx_created_date ON created_at
);
```

### referral_rewards Table (Settings)

```sql
CREATE TABLE referral_rewards (
  id INT PRIMARY KEY DEFAULT 1,  -- Only one row (singleton)
  
  -- Bonus Amounts
  referrer_bonus INT DEFAULT 100,
  referred_bonus INT DEFAULT 50,
  
  -- Constraints
  max_referrals_per_month INT DEFAULT 10,
  max_earnings_per_month INT DEFAULT 500,
  min_order_amount INT DEFAULT 100,      -- Min order to trigger completion
  
  -- Control
  is_active BOOLEAN DEFAULT true,        -- Master on/off switch
  expiry_days INT DEFAULT 30,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### users Table (Additions)

```sql
ALTER TABLE users ADD COLUMN (
  referral_code VARCHAR(20) UNIQUE,      -- REF... code for this user
  created_at TIMESTAMP                   -- When account created
);

-- Index for lookups
INDEX idx_referral_code ON referral_code;
```

### wallet_transactions Table (Captures Bonuses)

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id VARCHAR NOT NULL,              -- Who got bonus
  amount DECIMAL(10, 2) NOT NULL,        -- ₹50 or ₹100
  type VARCHAR(50),                      -- referral_bonus|coupon|order_refund...
  
  -- Reference to original transaction
  reference_id UUID,                     -- referrals.id
  reference_type VARCHAR(50),            -- "referral"
  
  description TEXT,                      -- "Welcome bonus from {name}"
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_user_id ON user_id,
  INDEX idx_type_created ON type, created_at
);
```

---

## API Endpoints

### 1. Generate Referral Code

```http
POST /api/user/generate-referral
Authorization: Bearer {token}

Response 200:
{
  "referralCode": "REF12AB34CD",
  "isNewCode": true,
  "message": "Referral code generated successfully"
}

Response 401: Unauthorized (no token)
Response 500: Server error
```

### 2. Validate Referral Code (Public)

```http
POST /api/referral/validate
Content-Type: application/json

Body:
{
  "referralCode": "REF12AB34CD"
}

Response 200:
{
  "valid": true,
  "message": "Code is valid",
  "bonus": 50,
  "referrerName": "Rajesh Kumar"
}

Response 400:
{
  "valid": false,
  "message": "Invalid code format",
  "bonus": 0
}
```

### 3. Apply Referral Code (Authenticated)

```http
POST /api/user/apply-referral
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "referralCode": "REF12AB34CD"
}

Response 200:
{
  "success": true,
  "referralId": "uuid-here",
  "bonusAmount": 50,
  "message": "Referral applied successfully, ₹50 added to wallet"
}

Response 400:
{
  "error": "User already used a referral code",
  "code": "ALREADY_USED"
}

Response 400:
{
  "error": "Referrer's monthly limit reached",
  "code": "MONTHLY_LIMIT"
}
```

### 4. Check Referral Eligibility

```http
GET /api/user/referral-eligibility
Authorization: Bearer {token}

Response 200:
{
  "eligible": true,
  "reason": "You can apply a referral code"
}

OR

{
  "eligible": false,
  "reason": "You already applied a referral code on 2026-01-15"
}
```

### 5. Get User's Referrals

```http
GET /api/user/referrals
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "uuid",
    "friendPhone": "+91 98765****5",
    "status": "pending",
    "bonusAmount": 100,
    "createdAt": "2026-03-10",
    "expectedDate": "2026-04-10"
  },
  {
    "id": "uuid",
    "friendPhone": "+91 99876****3",
    "status": "completed",
    "bonusAmount": 100,
    "createdAt": "2026-02-15",
    "completedAt": "2026-02-22"
  }
]
```

### 6. Get Current Settings

```http
POST /api/referral-settings

Response 200:
{
  "referrerBonus": 100,
  "referredBonus": 50,
  "minOrderAmount": 100,
  "maxReferralsPerMonth": 10,
  "maxEarningsPerMonth": 500,
  "isActive": true,
  "expiryDays": 30
}
```

---

## Bug List

### 🔴 HIGH PRIORITY BUGS

#### Bug #1: Double Application of Referral Codes (New Users)

**Severity**: HIGH  
**File**: [client/src/components/CheckoutDialog.tsx](client/src/components/CheckoutDialog.tsx#L2034)  
**Status**: UNFIXED

**Problem**:
- Referral codes are applied **TWICE** for new users during checkout
- Server applies during order creation (inside transaction) ✓
- Frontend then applies AGAIN after receiving token ✗

**Current Code** (Lines ~2034):
```typescript
// BUGGY: Applies referral AGAIN even though already applied on server
if (referralCode.trim() && result.accessToken) {
  applyReferralMutation.mutate({
    referralCode: referralCode.trim(),
    userToken: result.accessToken,
  });
}
```

**Symptoms**:
- User sees: "✓ Referral applied" + "❌ Already used referral" messages
- Logs show two API calls to `/api/user/apply-referral`
- Second error doesn't break anything (bonus already credited)
- But causes confusing UX and error noise in logs

**Root Cause**:
- Server correctly applies during order creation (line 2034 in routes.ts fires `db.transaction()`)
- Frontend doesn't check if referral was already applied
- Frontend blindly calls `/api/user/apply-referral` again

**Fix**:
```typescript
// Check if referral was already applied during order creation
if (referralCode.trim() && result.accessToken && !result.appliedReferralBonus) {
  // Only apply if NOT already applied server-side
  applyReferralMutation.mutate({
    referralCode: referralCode.trim(),
    userToken: result.accessToken,
  });
}
```

**Impact**: UX confusion, error logs pollution, but no money lost  
**Workaround**: None needed (bonus is credited correctly)

---

#### Bug #2: No Bonus Clawback on Order Cancellation

**Severity**: HIGH  
**Files**: 
- [server/routes.ts](server/routes.ts) - POST /api/orders (no refund logic)
- [server/storage.ts](server/storage.ts) - cancelOrder() method

**Status**: UNFIXED

**Problem**:
- Users can get ₹50 bonus for referral
- Then cancel their order
- Bonus NOT reversed from wallet
- Can repeat with new referral codes (abuse)

**Scenario** (Abuse Case):
```
User A applies referral from User B
├─ Gets ₹50 bonus
├─ Places order
├─ Cancels order
├─ Bonus stays in wallet ✓ (Should be clawed back ✗)
└─ Can repeat with different code
```

**Root Cause**:
- `completeReferralOnFirstOrder()` credits referrer when new user's order delivered
- But no `reverseReferralBonus()` when order cancelled/refunded
- Wallet transactions are append-only, no reversals exist

**Fix Needed**:
```typescript
// In cancelOrder() function:
async cancelOrder(orderId: string) {
  // Existing cancellation logic
  const order = await db.query.orders.findFirst({where: eq(orders.id, orderId)});
  
  // NEW: Check if this order had a referral
  const referral = await db.query.referrals.findFirst({
    where: eq(referrals.referredId, order.userId)
  });
  
  if (referral && referral.status === 'completed') {
    // Reverse the ₹100 that referrer received
    await db.insert(walletTransactions).values({
      userId: referral.referrerId,
      amount: -100,
      type: 'referral_reversal',
      reference_id: referral.id,
      description: 'Referral reversed - order cancelled'
    });
    
    // Mark referral as cancelled
    await db.update(referrals)
      .set({status: 'cancelled', cancelledAt: new Date()})
      .where(eq(referrals.id, referral.id));
  }
}
```

**Impact**: Potential abuse, fraud risk, financial loss  
**Workaround**: None (admin manual reversal needed)

---

#### Bug #3: No Minimum Referrer Requirements

**Severity**: MEDIUM  
**Files**: [server/storage.ts](server/storage.ts#L2204)  
**Status**: UNFIXED

**Problem**:
- Any user can generate referral code immediately after account creation
- No check for:
  - Account age (could create account just to refer)
  - Prior order history (never purchased, still refers)
  - Phone verification (unverified accounts can refer)

**Scenario** (Abuse Case):
```
Attacker creates 100 accounts in 10 minutes
├─ Generates referral code for each
├─ Shares with friends/bots
├─ Collects ₹100 per referral with 100% bonus conversion
└─ No friction or prerequisites
```

**Current Validations in `applyReferralBonus()`**:
```typescript
✓ Code exists
✓ Self-referral check
✓ Already applied check
✓ Monthly limits (10 per month)
✓ Earnings cap (₹500 per month)

✗ Missing: Account age
✗ Missing: Prior order history
✗ Missing: Phone verification
✗ Missing: IP/device tracking
```

**Fix Needed**:
```typescript
async applyReferralBonus(referralCode: string, newUserId: string) {
  const referrer = await db.query.users.findFirst({
    where: eq(users.referralCode, referralCode)
  });
  
  // NEW: Check referrer account health
  if (referrer.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    throw new Error("Referrer account must be 7+ days old");
  }
  
  if (!referrer.isPhoneVerified) {
    throw new Error("Referrer must have verified phone");
  }
  
  const referrerOrders = await db.query.orders.findMany({
    where: eq(orders.userId, referrer.id)
  });
  
  if (referrerOrders.length === 0) {
    throw new Error("Referrer must have placed at least one order");
  }
  
  // Continue with existing validations...
}
```

**Impact**: Fraud potential, economics abuse, low-quality referrals  
**Workaround**: Manual review of flagged referrers

---

### 🟡 MEDIUM PRIORITY BUGS

#### Bug #4: No Rate Limiting on Code Validation

**Severity**: MEDIUM  
**File**: [server/routes.ts](server/routes.ts#L1046) - POST /api/referral/validate  
**Status**: UNFIXED

**Problem**:
- Public endpoint `/api/referral/validate` has no rate limiting
- Attacker can brute force all possible codes
- Code format: REF{8 alphanumeric} = ~2.8B combinations
- Server tries all without throttle

**Scenario**:
```
Attacker: while (true) {
  POST /api/referral/validate with random REF codes
  ├─ 1000 requests/second possible
  ├─ No IP blocking
  ├─ No exponential backoff
  └─ System hits performance
}
```

**Fix**:
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const referralValidateLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 10,                     // 10 requests per minute
  keyGenerator: (req) => req.ip,
  message: "Too many validation attempts, please try again later"
});

app.post('/api/referral/validate', referralValidateLimiter, async (req, res) => {
  // ... validation logic
});
```

**Impact**: Performance degradation, DoS potential  
**Workaround**: None (needs deployment fix)

---

#### Bug #5: Lazy Expiration Only (No Proactive Cleanup)

**Severity**: MEDIUM  
**File**: [server/storage.ts](server/storage.ts#L2313)  
**Status**: UNFIXED

**Problem**:
- Referrals only expire when `completeReferralOnFirstOrder()` runs
- This ONLY runs on order creation
- If referred user never places order, referral stays "pending" forever
- Shows as active referral in UI indefinitely

**Scenario**:
```
Jan 1: User A applies referral code
Jan 31: Not expired yet (only 30 days old)
Feb 1: Still shows "pending" (no order placed, no expiry check)
Mar 1: Still "pending" (60 days old now, should be expired)
Oct 1: Still "pending" (300 days old! Should have been purged)
```

**Root Cause**:
- Expiration check only runs here:
  ```typescript
  if (new Date() > referral.createdAt + 30 days) {
    mark as 'expired'  // ← Only happens on order creation
  }
  ```
- No scheduled job to proactively expire old referrals

**Fix**:
```typescript
// Add scheduled job (using node-cron or similar)
import cron from 'node-cron';

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Expiring old referrals...');
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await db.update(referrals)
    .set({status: 'expired', updatedAt: new Date()})
    .where(and(
      eq(referrals.status, 'pending'),
      lt(referrals.createdAt, thirtyDaysAgo)
    ));
});
```

**Impact**: Data inconsistency, misleading UI, mental model breaks  
**Workaround**: Manual admin intervention

---

### 🟠 LOW PRIORITY BUGS

#### Bug #6: No Referral Notifications

**Severity**: LOW  
**File**: [server/storage.ts](server/storage.ts#L2313) - completeReferralOnFirstOrder  
**Status**: UNFIXED

**Problem**:
- Referrer never notified when their referral completes
- They don't know they earned ₹100 until they check Profile
- No push notification, email, or SMS alert

**Expected User Experience**:
```
User A refers User B
User B places order
When User B's order delivered:
  → Push notification: "Your referral earned you ₹100!" ✗ (missing)
  → Wallet updates (happens correctly ✓)
```

**Fix**:
```typescript
async completeReferralOnFirstOrder(userId: string) {
  // ... existing logic ...
  
  if (canCredit) {
    // Credit wallet
    await this.createWalletTransaction({...});
    
    // NEW: Send notification
    await sendNotification({
      userId: referral.referrerId,
      title: "Referral Earned! 🎉",
      body: `Your friend placed their first order. You earned ₹${referrerBonus}!`,
      type: "referral_completion",
      data: {
        referralId: referral.id,
        bonusAmount: referrerBonus
      }
    });
  }
}
```

**Impact**: Poor user engagement, missed feature discovery  
**Workaround**: None

---

#### Bug #7: No Referral Code Share UI Components

**Severity**: LOW  
**Status**: UNFIXED

**Problem**:
- No "Share" button in referral code display
- No QR code for mobile sharing
- No pre-formatted share templates
- Users must manually copy/paste

**Missing Features**:
```
❌ Share to WhatsApp (with pre-filled message)
❌ Share to SMS (with pre-filled message)
❌ Share to Email (with pre-filled message)
❌ QR Code generation
❌ Copy to clipboard button (EXISTS but minimal)
```

**Example Expected UI**:
```
┌─────────────────────────────────┐
│ Your Referral Code              │
┌─────────────────────────────────┐
│ REF12AB34CD                     │
├─────────────────────────────────┤
│ [Copy]  [QR Code]  [Share ↓]   │
├─────────────────────────────────┤
│ Share to:                       │
│ □ WhatsApp                      │
│ □ SMS                           │
│ □ Email                         │
│ □ Copy Link                     │
└─────────────────────────────────┘
```

**Impact**: Low conversion rate, poor discoverability  
**Workaround**: Users manually share

---

#### Bug #8: No Device/IP Fraud Detection

**Severity**: MEDIUM (Security)  
**File**: [server/storage.ts](server/storage.ts#L2204)  
**Status**: UNFIXED

**Problem**:
- No tracking of device/IP addresses
- Same user/bot can create multiple accounts from same device
- No detection when multiple referrals come from same IP

**Scenario** (Fraud):
```
Attacker IP: 192.168.1.100
- Creates account #1 → referral code A
- Creates account #2 → referral code B
- Creates account #3 → referral code C
- All use same IP address but system doesn't flag as suspicious
```

**Fix**:
```typescript
// Track device fingerprint
interface DeviceLog {
  userId: string;
  ipAddress: string;
  userAgent: string;
  firstSeenAt: Date;
  referralCode?: string;
}

// Check on referral generation
const existingByIP = await db.query.deviceLogs.findMany({
  where: eq(deviceLogs.ipAddress, req.ip)
});

// Check referral generation from same IP in last 7 days
const referralsByIP = existingByIP.filter(
  d => d.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
);

if (referralsByIP.length > 3) {
  console.warn(`[FRAUD] Multiple referral codes from same IP: ${req.ip}`);
  // Flag accounts for review
}
```

**Impact**: Fraud potential, revenue loss  
**Workaround**: Manual review needed

---

#### Bug #9: Timezone Issues in Monthly Caps

**Severity**: LOW  
**File**: [server/storage.ts](server/storage.ts#L2220)  
**Status**: UNFIXED

**Problem**:
- Monthly limits calculated in UTC
- User in IST (UTC+5:30) sees different "month" than UTC
- Can apply 10 referrals in IST, but system resets at different time

**Example**:
```
User in Mumbai (IST):
- IST 11:45 PM on Jan 31 → Should be end of month
- System sees UTC 13:15 on Jan 31 → Not end of month yet
- User can still apply referral (thinks it's next month)
- System rejects it (thinks still in Jan)
```

**Fix**:
```typescript
// Use user's timezone for monthly calculations
const userTimezone = user.timezone || 'Asia/Kolkata';
const startOfMonthUser = startOfMonth(now, { ... timeZone: userTimezone });
const endOfMonthUser = endOfMonth(now, { ... timeZone: userTimezone });

// Query within user's month boundaries
const referralsThisMonth = await db.query.referrals.findMany({
  where: and(
    eq(referrals.referrerId, referrer.id),
    gte(referrals.createdAt, startOfMonthUser),
    lte(referrals.createdAt, endOfMonthUser)
  )
});
```

**Impact**: Confusion for users, perceived bugs  
**Workaround**: Accept it or educate users

---

### 📋 Bug Summary Table

| # | Bug | Severity | Status | Impact | File |
|---|-----|----------|--------|--------|------|
| 1 | Double application | 🔴 HIGH | Unfixed | UX/Logs | CheckoutDialog.tsx |
| 2 | No bonus clawback | 🔴 HIGH | Unfixed | Fraud/Revenue | storage.ts |
| 3 | No referrer requirements | 🔴 HIGH | Unfixed | Fraud/Abuse | storage.ts |
| 4 | No rate limiting | 🟡 MEDIUM | Unfixed | DoS Risk | routes.ts |
| 5 | Lazy expiration | 🟡 MEDIUM | Unfixed | Data/UI | storage.ts |
| 6 | No notifications | 🟠 LOW | Unfixed | Engagement | storage.ts |
| 7 | No share UI | 🟠 LOW | Unfixed | Conversion | Profile.tsx |
| 8 | No IP fraud detection | 🟡 MEDIUM | Unfixed | Security | storage.ts |
| 9 | Timezone issues | 🟠 LOW | Unfixed | Edge Case | storage.ts |

---

## Validation Checklist

### Before Going to Production

- [ ] Fix Bug #1: Double application
- [ ] Fix Bug #2: Bonus clawback on cancellation
- [ ] Fix Bug #3: Add referrer account requirements
- [ ] Fix Bug #4: Rate limiting on public endpoints
- [ ] Add Bug #5: Periodic expiration cleanup job
- [ ] Add fraud detection (IP tracking)
- [ ] Add notifications on referral completion
- [ ] Test with multiple referrals in same month
- [ ] Test with timezone edge cases
- [ ] Load test referral validation endpoints

### Recommended Priority Order

1. **Immediate** (Today): Bug #1 (UX breaking)
2. **Urgent** (This week): Bug #2, #3 (Fraud)
3. **Important** (This sprint): Bug #4, #8 (Security)
4. **Nice-to-have** (Later): Bug #6, #7, #9 (UX)

---

## Monitoring & Metrics

### Key Metrics to Track

```
Daily Tracking:
├─ New referrals generated (count)
├─ Referrals applied (count)
├─ Referrals expired (count)
├─ Average days to completion
├─ Referrer repeat rate (%)
└─ Bonus payout total (₹)

Monthly Tracking:
├─ Referral-generated orders (%)
├─ Referral bonus cost (₹)
├─ Revenue per referral (₹)
├─ Referrer retention rate
└─ Fraud flags detected

Admin Dashboard Should Show:
├─ Total active referrers
├─ Pending referrals by age
├─ Expired referrals
├─ High-value referrers
├─ Fraud-flagged referrals
└─ Monthly payout by user
```

### Redis Cache Keys

```
user:{userId}:referralCode          → REF12AB34CD
referral:code:{code}:valid          → true/false (cached)
referrer:{userId}:month:{YYYYMM}    → count of referrals
referrer:{userId}:earnings:{YYYYMM} → total ₹ earned
```

---

## Summary

### What Works Well ✅

1. Transaction-based consistency (all-or-nothing updates)
2. Immediate wallet credit for referred users
3. Monthly caps enforcement (prevents abuse reasonably)
4. Background processing (doesn't block orders)
5. Proper name/phone masking (privacy)
6. Admin override capability (fraud resolution)

### What's Broken ❌

1. Double application UX (confusing messages)
2. No clawback (abuse vector)
3. No referrer verification (spam risk)
4. No rate limiting (DoS risk)
5. No proactive expiration (data stale)

### Quick Wins (Easy Fixes)

- Bug #1: 15 minutes (add eligibility check)
- Bug #4: 20 minutes (add rate limit middleware)
- Bug #7: 1 hour (add share buttons)

### Hard Fixes (Architecture)

- Bug #2: Refactor wallet to support reversals
- Bug #3: Add user lifecycle tracking
- Bug #8: Add device fingerprinting system

---

**Document Version**: 1.0  
**Last Updated**: March 21, 2026  
**Author**: System Analysis  
**Status**: Ready for review and implementation
