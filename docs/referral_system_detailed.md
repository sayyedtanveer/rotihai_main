# Roti Hai Referral System: Complete Functional & Technical Architecture  
**Document Version:** 2.1 (With All Latest Fixes & Requirements)  
**Last Updated:** April 6, 2026 (Referrer Delivery Requirement Fix)  
**Audience:** Developers • Product Managers • Admins • Non-Technical Stakeholders

---

## 📌 Section 1: Non-Technical Overview (For Everyone)

### What is the Referral System?
It's a **reward program** where existing customers invite friends. When a friend orders for the first time:
- Friend gets ₹50 free credit (bonus)
- Person who referred them gets ₹100 free credit (bonus)
- Both credits are added to their wallet and can be used for future orders

### The Customer Journey (Step-by-Step)

#### **Step 1: Existing Customer Shares Code**
```
Day 1: Ahmad uses RotiHai, completes his first order
Day 3: Ahmad's order is delivered → System generates his referral code "REF3A7K9B2L"
Day 5: Ahmad shares code with friend Priya via WhatsApp
Status: Code is "pending" - waiting for someone to use it
```

#### **Step 2: New Customer Applies Code**  
```
Day 7: Priya downloads RotiHai app, creates account
Day 7: Priya enters code "REF3A7K9B2L" during checkout
Validation:
  ✅ Code exists
  ✅ Priya hasn't used a referral code before
  ✅ Ahmad (referrer) hasn't exceeded limits
Status: Code is now "linked" to Priya's account
```

#### **Step 3: New Customer Places Order**
```
Day 7 (evening): Priya places order for ₹300
System checks:
  ✅ Order amount (₹300) >= minimum required (e.g., ₹100)
Option A: Priya claims bonus at checkout
  - ₹50 added to wallet immediately
  - Order total becomes ₹300 - ₹50 = ₹250 (she pays this)
  
Option B: Priya doesn't claim bonus
  - Order remains ₹300, bonus will be added when order delivers
```

#### **Step 4: Delivery & Bonus Credited**
```
Day 8 (morning): Priya's order delivered
Day 8 (noon): Delivery marked as "delivered" in system

System checks:
  ✅ Priya's first order: DELIVERED
  ✅ Ahmad's first order: DELIVERED (must also be delivered)
  ✅ Monthly earnings cap: Not exceeded

If BOTH conditions met:
  ✅ Credits Priya with ₹50 (if not already claimed)
  ✅ Credits Ahmad with ₹100 bonus
  ✅ Both get notifications about new wallet balance
  ✅ Status: Referral marked as "completed"

If Ahmad's order NOT yet delivered:
  ⏳ Priya gets ₹50 (her bonus is paid)
  ⏳ Ahmad's ₹100 bonus stays pending (waiting for his delivery)
  ⏳ Referral status stays "pending" until Ahmad's order delivers
```

### Key Business Rules (Why They Exist)

| Rule | Why | Example |
|------|-----|---------|
| Must be 7+ days old | Prevents fake promotional accounts | Spammer can't create 100 accounts and immediately refer each other |
| Must have placed 1 order | Proves customer is legitimate | Ensures person isn't just a bot account |
| Both must complete 1st delivery | Both receive value before bonus credit | Ahmad & Priya both get paid only when both have delivered orders |

---

## � Condition Flow Diagrams

### Diagram 1: Complete Referral Application Flow

```
USER APPLIES CODE AT CHECKOUT
           ↓
    [Does code exist?]
         ↙       ↘
       YES        NO → ❌ FAIL: Invalid code
        ↓
    [Self referral?]
         ↙       ↘
       NO        YES → ❌ FAIL: Cannot use own code
        ↓
    [Referrer 7+ days old?]
         ↙       ↘
       YES        NO → ❌ FAIL: Referrer account too new
        ↓
    [Referrer placed 1+ order?]
         ↙       ↘
       YES        NO → ❌ FAIL: Referrer must place order first
        ↓
    [Referred user already ordered?]
         ↙       ↘
       NO        YES → ❌ FAIL: Code can only be used BEFORE first order
        ↓
    [Order amount ≥ minimum?]
         ↙       ↘
       YES        NO → ❌ FAIL: Order below minimum amount
        ↓
    ✅ PASS: Code Applied
    Referral Created (Status: PENDING)
         ↓
    🚚 WAITING FOR DELIVERY
```

### Diagram 2: Bonus Credit Flow (When Order Delivered)

```
ORDER MARKED DELIVERED
           ↓
    ┌─────────────────┐
    │ ALWAYS CREDIT   │
    │ Referred User?  │
    └────────┬────────┘
             ↓
    [Referred user order delivered?]
         ↙       ↘
       YES        NO → ⏳ WAIT for delivery
        ↓
    ✅ Referred User: +₹50 CREDITED
    
    BUT REFERRER GETS:
           ↓
    [Referrer order delivered?]
         ↙       ↘
       YES        NO → ⏳ PENDING
        ↓              Referrer waits until own delivery
    [Earnings ≤ ₹5000/month?]
         ↙       ↘
       YES        NO → ⏳ CAP HIT
        ↓              Referrer gets ₹0 (limit exceeded)
    ✅ REFERRER: +₹100 CREDITED
    
    Status: COMPLETED
    Both wallets updated ✅
```

### Diagram 3: Three Possible Outcomes When Referred User's Order Delivers

```
OUTCOME 1: ✅ BOTH CREDITED (Perfect Case)
══════════════════════════════════════════
Conditions Met:
  ✅ Referred user's order = DELIVERED
  ✅ Referrer's order = DELIVERED
  ✅ Referrer earnings < ₹5000/month

Result:
  Referred User: +₹50 ✅ CREDITED
  Referrer:     +₹100 ✅ CREDITED
  Status:       COMPLETED
  Action:       Both users notified


OUTCOME 2: ⏳ PARTIAL CREDIT (Waiting for Referrer)
════════════════════════════════════════════════════
Conditions Met:
  ✅ Referred user's order = DELIVERED
  ❌ Referrer's order = NOT YET DELIVERED

Result:
  Referred User: +₹50 ✅ CREDITED (gets paid immediately)
  Referrer:     ₹0   ❌ PENDING (waiting for own delivery)
  Status:       PENDING (not complete yet)
  Action:       Referred user notified, referrer bonus on hold


OUTCOME 3: ⏳ CAP HIT (Earnings Limit Exceeded)
═════════════════════════════════════════════════
Conditions Met:
  ✅ Referred user's order = DELIVERED
  ✅ Referrer's order = DELIVERED
  ❌ Referrer earnings ≥ ₹5000/month (limit reached)

Result:
  Referred User: +₹50 ✅ CREDITED
  Referrer:     ₹0   ❌ BLOCKED (monthly cap exceeded)
  Status:       COMPLETED (no more bonuses until next month)
  Action:       Referred user notified, referrer not notified of blocked bonus
```

---

## �📊 Section 2: Database Schema (Detailed Explanation)

### The "referrals" Table (Storage of Referral Relationships)

```sql
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,  -- Unique ID for this referral relationship
  
  referrer_id TEXT NOT NULL,       -- WHO is referring (Ahmad's ID)
  referred_id TEXT NOT NULL,       -- WHO is being referred (Priya's ID)
  referral_code VARCHAR(20),       -- The actual code (REF3A7K9B2L)
  
  status VARCHAR(20) DEFAULT 'pending',  -- pending | completed | expired | cancelled | approved
                                         -- pending = waiting for use
                                         -- completed = bonus credited
                                         -- expired = code not used within 30 days
                                         -- cancelled = admin marked as fraud
                                         -- approved = admin manually approved early
  
  referrer_bonus INTEGER DEFAULT 50,     -- Amount referrer earns (₹50 or ₹100, configurable)
  referred_bonus INTEGER DEFAULT 50,     -- Amount new customer gets (₹50, configurable)
  
  referred_order_completed BOOLEAN DEFAULT FALSE,  -- Has referred customer's first order delivered?

  first_order_id TEXT,                   -- Links to the order that triggered this referral
  expires_at TIMESTAMP,                  -- When code expires (30 days from creation)
  
  fraud_flag BOOLEAN DEFAULT FALSE,      -- Admin marked as suspicious
  admin_note TEXT,                       -- Why admin cancelled/approved
  
  created_at TIMESTAMP DEFAULT NOW(),    -- When referral was created
  completed_at TIMESTAMP,                -- When bonus was credited
  
  INDEX idx_referrer (referrer_id, status),  -- Fast lookup: "Show me all Ahmad's referrals"
  INDEX idx_referred (referred_id)           -- Fast lookup: "Is Priya referred?"
);
```

### The "users" Table (Customer Accounts)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  
  referral_code VARCHAR(20) UNIQUE,  -- Each customer gets one unique code (REF3A7K9B2L)
  wallet_balance INTEGER DEFAULT 0,  -- Total free credit in wallet (in paise)
  
  created_at TIMESTAMP DEFAULT NOW(),
  -- ... other fields
);
```

### The "wallet_transactions" Table (Audit Trail)

```sql
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  
  user_id TEXT NOT NULL,              -- Whose wallet?
  amount INTEGER NOT NULL,            -- How much? (in paise)
  type ENUM('credit', 'debit', 
           'referral_bonus',           -- Bonus from referring someone
           'referral_bonus_claimed',   -- Bonus claimed at checkout
           'order_discount'),          -- Other discounts
  description TEXT,                   -- Why? "Referral bonus - friend completed first order"
  
  reference_id TEXT,                  -- Which order/referral?
  reference_type TEXT,                -- 'order' or 'referral'
  
  balance_before INTEGER,             -- Wallet balance before this transaction
  balance_after INTEGER,              -- Wallet balance after this transaction
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_date (user_id, created_at)  -- "Show Ahmad's wallet history"
);
```

### The "referral_rewards" Table (Configuration)

Admins control bonus amounts and limits here:

```sql
CREATE TABLE referral_rewards (
  id TEXT PRIMARY KEY,
  
  name VARCHAR(100),  -- "Current Bonus Program" or "Q1 Promo"
  
  referrer_bonus INTEGER DEFAULT 100,        -- Amount referrer gets (₹100)
  referred_bonus INTEGER DEFAULT 50,         -- Amount new customer gets (₹50)
  min_order_amount INTEGER DEFAULT 100,      -- New customer's order must be >= ₹100
  
  max_referrals_per_month INTEGER DEFAULT 10,      -- Referrer can create max 10/month
  max_earnings_per_month INTEGER DEFAULT 5000,     -- Referrer can earn max ₹5000/month
  expiry_days INTEGER DEFAULT 30,                  -- Code expires after 30 days
  
  is_active BOOLEAN DEFAULT TRUE,  -- Quick toggle to enable/disable referral system
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  INDEX idx_active (is_active)  -- Quick find of active configuration
);
```

---

## 🔌 Section 3: Complete API Reference

### User Endpoints (For Customers)

#### **1. Generate/Get Referral Code**
```
GET /api/user/referral-code
Authentication: Required (user must be logged in)

Response:
{
  "referralCode": "REF3A7K9B2L",
  "bonus": 100,
  "message": "Your unique referral code"
}

What it does:
- Returns user's unique referral code
- Each user gets ONE code, reused for all referrals
- Generated automatically on first login
```

#### **2. View Your Referrals**
```
GET /api/user/referrals
Authentication: Required

Response:
{
  "totalReferrals": 3,
  "pending": 1,  // Referred person hasn't placed order yet
  "completed": 2,  // Bonuses credited
  "referrals": [
    {
      "id": "ref_123",
      "referredId": "user_priya",
      "referredName": "Priya Singh",
      "referredPhone": "98765432100",
      "status": "completed",
      "referrerBonus": 100,
      "referredBonus": 50,
      "createdAt": "2026-04-01",
      "completedAt": "2026-04-03"
    }
  ]
}

What it does:
- Shows all people the user has referred
- Shows status of each referral
- Shows who earned bonuses
```

#### **3. Check Referral Eligibility** 
```
GET /api/user/referral-eligibility
Authentication: Required

Response:
{
  "eligible": true,
  "reason": null,
  "minimumAge": "7 days",
  "minimumOrders": 1,
  "daysOld": 10,
  "ordersPlaced": 3
}

What it does:
- Tells user if they can share their referral code
- Explains why if not eligible (too new, no orders, etc.)
```

#### **4. Apply Referral Code (NEW CUSTOMER)**
```
POST /api/user/apply-referral
Authentication: Required
Body:
{
  "referralCode": "REF3A7K9B2L"
}

Response:
{
  "message": "Referral code applied successfully!",
  "bonus": 50,
  "note": "Your ₹50 bonus will be credited when your first order is delivered"
}

What it does:
- BEFORE checkout: New customer enters referral code
- System creates pending referral record
- Validates:
  * Code exists
  * Code belongs to valid referrer
  * Customer hasn't used code before
  * Referrer within monthly limits
  * Referrer account valid (7+ days, has orders)

Errors possible:
- "Referrer account must be at least 7 days old"
- "Referrer must have placed at least one order"
- "You can only use a referral code before placing your first order"
- "User already used a referral code"
- "Referrer has reached monthly limit"
```

#### **5. Validate Code During Checkout**
```
POST /api/referral/validate
Authentication: Optional
Body:
{
  "referralCode": "REF3A7K9B2L",
  "cartSubtotal": 350
}

Response:
{
  "valid": true,
  "bonus": 50,
  "minOrderAmount": 100,
  "canUse": true,
  "message": "Code is valid! You'll get ₹50 bonus"
}

What it does:
- Validates code real-time during checkout
- Checks if cart amount meets minimum (e.g., ₹100)
- Returns bonus amount user will receive
- Refreshes on every cart update

Errors:
- "Invalid referral code"
- "Minimum order amount ₹100 required"
- "Code has expired"
```

#### **6. Claim Bonus at Checkout**
```
POST /api/user/claim-bonus-at-checkout
Authentication: Required
Body:
{
  "orderTotal": 300,
  "orderId": "order_12345"
}

Response:
{
  "bonusClaimed": true,
  "amount": 50,
  "message": "₹50 bonus claimed successfully!",
  "newWalletBalance": 50
}

What it does:
- Applies bonus immediately to wallet at checkout
- Deducts bonus from order total
- Marks referral as "completed" to prevent double credit
- Happens BEFORE payment is processed

Flow:
1. System finds user's pending referral
2. Validates bonus eligibility
3. Credits wallet with ₹50
4. Updates referral status to "completed"
5. Returns success

Note: If this succeeds, completeReferralOnFirstOrder() won't re-credit on delivery
```

#### **7. Get Referral Stats**
```
GET /api/user/referral-stats
Authentication: Required

Response:
{
  "totalReferrals": 5,
  "pendingReferrals": 2,
  "completedReferrals": 3,
  "expiredReferrals": 0,
  "totalEarnings": 300,  // ₹100 x 3 completed
  "referralCode": "REF3A7K9B2L"
}

What it does:
- Quick overview of referral performance
- Shows count of referrals in each status
- Shows total earnings from referrals
```

#### **8. Check Bonus Eligibility at Checkout**
```
GET /api/user/bonus-eligibility?orderTotal=350
Authentication: Required

Response:
{
  "eligible": true,
  "bonus": 50,
  "minOrderAmount": 100,
  "reason": null
}

What it does:
- Check if user qualified to use bonus
- Validates order amount meets minimum
- Shows exact bonus amount available
```

### Admin Endpoints (For Management)

#### **1. View All Referrals**
```
GET /api/admin/referrals
?status=pending|completed|expired|cancelled
?fraudFlag=true|false
?dateFrom=2026-04-01&dateTo=2026-04-30
?limit=50&offset=0

Authorization: Admin required

Response:
{
  "total": 240,
  "referrals": [
    {
      "id": "ref_123",
      "referrerName": "Ahmad",
      "referrerPhone": "98765432100",
      "referredName": "Priya",
      "referredPhone": "91234567899",
      "referralCode": "REF3A7K9B2L",
      "status": "completed",
      "referrerBonus": 100,
      "referredBonus": 50,
      "fraudFlag": false,
      "createdAt": "2026-04-01",
      "completedAt": "2026-04-03"
    }
  ]
}

What admin can see:
- Master list of ALL referral relationships
- Filter by status, fraud flag,dates
- See who referred whom
- Bonus amounts credited
- Admin notes/flags
```

#### **2. Mark Referral as Fraud**
```
PATCH /api/admin/referrals/{id}/fraud-flag
Body:
{
  "fraudFlag": true,
  "adminNote": "Multiple referrals to same phone number, likely fake accounts"
}

Response: Updated referral record

What it does:
- Flags referral as suspicious
- Prevents bonus payout
- Stops related referrals from crediting
- Admins can trace patterns
```

#### **3. Manually Approve/Cancel Referral**
```
PATCH /api/admin/referrals/{id}/status
Body:
{
  "status": "approved|cancelled|expired",
  "adminNote": "Legitimate case, approving manually"
}

Response: Updated referral with new status

What it does:
- Override referral status
- "approved" = force bonus credit
- "cancelled" = revoke bonus/prevent payment
- "expired" = mark code as expired
```

#### **4. Configure Bonus Settings**
```
GET /api/admin/wallet-settings
Authorization: Admin required

POST /api/admin/wallet-settings
Body:
{
  "referrerBonus": 100,           // Amount referrer gets
  "referredBonus": 50,            // Amount new customer gets
  "minOrderAmount": 100,          // Minimum order to be eligible
  "maxReferralsPerMonth": 10,     // Referrer cap
  "maxEarningsPerMonth": 5000,    // Earnings cap
  "expiryDays": 30,               // Code expiry duration
  "isActive": true                // Enable/disable system
}

What it does:
- Control all bonus amounts and limits
- Can adjust anytime (affects new referrals)
- Old referrals use values from when created
```

#### **5. View Wallet Transactions**
```
GET /api/admin/wallet-transactions
?userId=user_id
?type=referral_bonus|referral_bonus_claimed|credit|debit
?dateFrom=2026-04-01&dateTo=2026-04-30

Response:
{
  "transactions": [
    {
      "id": "txn_123",
      "userId": "user_ahmad",
      "amount": 100,
      "type": "referral_bonus",
      "description": "Referral bonus - friend completed first order",
      "referenceId": "ref_123",
      "balanceBefore": 0,
      "balanceAfter": 100,
      "createdAt": "2026-04-03"
    }
  ]
}

What admin can track:
- Every wallet credit/debit
- Who earned bonuses and how much
- Complete audit trail
- Fraud detection (unusual patterns)
```

#### **6. View Referral Statistics**
```
GET /api/admin/referral-stats

Response:
{
  "totalReferrals": 240,
  "pendingReferrals": 45,
  "completedReferrals": 180,
  "expiredReferrals": 15,
  "cancelledReferrals": 0,
  "totalBonusEarned": 18000,      // ₹100 x 180 completed
  "totalBonusPending": 4500,      // ₹100 x 45 pending
  "totalNewCustomersAcquired": 180,
  "avgBonusPerReferrer": 112
}

What it shows:
- High-level referral program health
- Acquisition cost analysis
- Fraud/cancellation rates
```

---

## 🔄 Section 4: Complete Business Logic Flow

### Referral Lifecycle (Detailed State Machine)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REFERRAL LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────┘

STATE 0: CODE GENERATION
├─ When: Users complete their first order successfully
├─ Action: System generates unique code (REF + 8 random chars)
├─ Storage: Saved in users.referral_code
└─ Duration: Permanent (never expires)

STATE 1: PENDING (Waiting for Use)
├─ When: Code created, or someone uses it but hasn't ordered yet
├─ Actions allowed:
│  ├─ Customer can share code via chat/social
│  ├─ Multiple people can know this code (but only one uses it)
│  └─ Code is valid for 30 days
├─ Stored in: referrals.status = "pending"
└─ Expires after: 30 days

STATE 1A: CODE APPLIED (Referral Created)
├─ When: New customer enters code at checkout
├─ Validations:
│  ├─ Referrer code exists
│  ├─ Referrer is eligible (7+ days, has orders)
│  ├─ Referred customer new (no previous referrals)
│  ├─ Referrer within monthly limits (10 per month)
│  └─ Referrer within earnings cap (₹5000/month)
├─ Result: referrals record created with status = "pending"
├─ Priya's perspective: "Code linked, bonus pending"
└─ Ahmad's perspective: "Priya using my code"

STATE 2: VERIFIED AT CHECKOUT
├─ When: New customer in checkout, before payment
├─ System checks:
│  ├─ Order amount >= minimum (₹100)
│  ├─ Bonus is available (referrer within cap)
│  └─ Referral still valid and not expired
├─ Returns: Exact bonus amount Priya will get
└─ User can claim bonus OR defer till delivery

STATE 2A: BONUS CLAIMED AT CHECKOUT
├─ When: Customer elects to claim ₹50 immediately
├─ Transaction:
│  ├─ ₹50 added to Priya's wallet
│  ├─ referrals.status = "completed"
│  ├─ referrals.referred_order_completed = true
│  └─ Wallet transaction logged
├─ Effect: Payment processes with discount applied
└─ Note: Won't be credited again on delivery

STATE 3: ORDER PLACED & PAYMENT CONFIRMED
├─ When: Payment gateway confirms payment success
├─ System creates: Order record linked to Priya
├─ Bonus status:
│  ├─ If claimed at checkout: Already in wallet
│  └─ If not claimed: Still pending
└─ Priya now waits for delivery

STATE 4: ORDER IN TRANSIT
├─ When: Delivery personnel picks up order
├─ System status: order.status = "out_for_delivery"
└─ Bonuses: Still not credited (wait for delivery confirmation)

STATE 5: ORDER DELIVERED
├─ When: Delivery personnel marks order delivered
├─ System calls: completeReferralOnFirstOrder()
├─ Checks:
│  ├─ Referral status still "pending"? (if claimed, skips)
│  ├─ Referral not expired?
│  └─ Referrer still within monthly cap?
├─ Credits applied:
│  ├─ Priya gets ₹50 (if not claimed at checkout)
│  ├─ Ahmad gets ₹100 (if within cap)
│  └─ referrals.status = "completed"
└─ Both users notified via WhatsApp/Email

STATE 6: COMPLETED (Active)
├─ When: Both users' first orders delivered
├─ Storage: referrals.status = "completed"
├─ Requirement: 
│  ├─ Priya's order DELIVERED → ₹50 credited
│  ├─ Ahmad's order DELIVERED → ₹100 credited
│  └─ Only mark "completed" when BOTH delivered
├─ Bonuses in wallets: Priya +₹50, Ahmad +₹100
└─ Both can use bonuses for future orders

STATE 7E: EXPIRED (Auto)
├─ When: 30 days pass, code never used
├─ Storage: referrals.status = "expired"
├─ Trigger: Daily scheduler job: expireOldPendingReferrals()
├─ Effect:
│  ├─ No bonuses will ever be credited
│  ├─ Doesn't affect wallet balance
│  └─ Code still exists, just marked inactive
└─ Admin can still view in reports

STATE 7F: CANCELLED (Admin)
├─ When: Admin flags as fraud
├─ Storage: referrals.status = "cancelled"
├─ Effect:
│  ├─ No bonuses credited (or revoked if pending)
│  ├─ Referrer marked for review
│  └─ Admin note explains why
└─ Used for: Fake accounts, exploits, violations

STATE 7A: APPROVED (Admin Override)
├─ When: Admin manually approves early
├─ Effect: Bonuses credited without delivery
├─ Used for: Manual review cases, special requests
└─ Skips: Normal delivery requirement
```

### Technical Flow: Payment Confirmation to Bonus Credit

```
User Action: Priya places order ₹300 with Ahmad's referral code

Step 1: ORDER CREATION
├─ payload: { userId: "priya", subtotal: 300, referralCode: "REF3A7K..." }
├─ storage.createOrder() called
└─ Result: order_456 created with status "pending"

Step 2: PAYMENT CONFIRMATION (Auto after payment succeeds)
├─ POST /api/orders/order_456/payment-confirmed
├─ System:
│  ├─ Idempotency check (already paid? → return early)
│  ├─ Lock row (FOR UPDATE) to prevent race conditions
│  ├─ Validate wallet balance (if using wallet)
│  ├─ Create wallet transaction (if deducting)
│  ├─ Update order.paymentStatus = "paid"
│  └─ Create/update referral link
│
├─ Referral linking:
│  ├─ Check if referral exists for Priya
│  ├─ If exists and pending → create link
│  ├─ If doesn't exist → skip (not using referral)
│  └─ applyReferralBonus() called (creates referral record)
│
└─ Result: order paid, referral pending (unless claimed at checkout)

Step 3: ORDER DELIVERY (Later)
├─ Delivery person marks order "delivered"
├─ POST /api/orders/{id}/delivery
├─ System calls: completeReferralOnFirstOrder(priya, order_456)
│
├─ completeReferralOnFirstOrder() flow:
│  ├─ Transaction wrapper (atomic, serializable isolation)
│  ├─ Find: referral where referredId = "priya", status = "pending"
│  ├─ If not found → return (already completed or never created)
│  ├─ Validate: expiry check (30 days)
│  │           earnings cap check (₹5000/month)
│  │           ✅ CRITICAL: Ahmad (referrer) must have delivered order
│  ├─ Check: referrer Ahmad has delivered order?
│  ├─ Calculate: monthlyEarnings + referrerBonus <= 5000?
│  │
│  ├─ Credit Priya: ₹50 to wallet (if not claimed, always credited)
│  │
│  ├─ Credit Ahmad: 
│  │  ├─ IF Ahmad has delivered order AND within cap → ₹100 to wallet
│  │  ├─ IF Ahmad has NOT delivered yet → ₹0 (pending his delivery)
│  │  └─ Log: "Referrer has not completed first order. Bonus pending."
│  │
│  ├─ Update: referrals.status = "completed" (if Ahmad delivered) 
│  │           referrals.status = "pending" (if Ahmad not delivered)
│  ├─ Log: wallet_transactions for both
│  └─ Broadcast: WebSocket updates to both customers
│
└─ Result: 
   ├─ Priya gets ₹50 ALWAYS (when her order delivers)
   ├─ Ahmad gets ₹100 ONLY when his order also delivers
   └─ If Ahmad's order already delivered: Both get paid immediately

Step 4: WALLET UPDATE
├─ Both customers see new balance
├─ walletTransactions log shows source
└─ Can use bonuses on next order
```

---

## 🛡️ Section 5: Edge Cases & Safeguards

### Case 1: Double Credit Prevention
```
Scenario: Priya claims ₹50 at checkout AND tries to claim again on delivery

What system does:
- At checkout: referrals.status = "pending" → "completed"
- On delivery: completeReferralOnFirstOrder() runs
  - WHERE status = "pending" → No row found!
  - Returns early, prevents double credit
- Result: Priya gets ₹50 (one time)
```

### Case 2: Referrer Earnings Cap Hit
```
Scenario: Ahmad has earned ₹4900 this month. Priya orders (₹100 bonus).

What system does:
- Check: monthlyEarnings (₹4900) + referrerBonus (₹100) = ₹5000
- Result: ✅ Passes, Ahmad gets ₹100
- Next referral:
  - monthlyEarnings (₹5000) + referrerBonus (₹100) = ₹5100
  - Fails, referrer gets ₹0, no bonus credited
  - Referral still marked "completed" but with ₹0
  - System logs: "Referrer earnings cap exceeded"
```

### Case 3: Code Expires
```
Scenario: Ahmad shares code, nobody uses it for 35 days

What system does:
- Daily scheduler: expireOldPendingReferrals()
  - Finds all referrals WHERE status = "pending" AND createdAt < 30 days ago
  - Updates status = "expired"
- Result: Code unusable, no bonus possible
- Storage: referrals record still exists (for audit)
```

### Case 4: Concurrent Orders from Same User
```
Scenario: Priya places 2 orders with same referral code (somehow?)

What system does:
- applyReferralBonus() called twice
- Check: "User already used a referral"
  - First call: Creates referral
  - Second call: Finds existing referral → Rejects with error
- Result: Only 1 referral created, fraud prevented
```

### Case 5: User Tries to Refer Before Eligible
```
Scenario: Ravi tries to share code after creating account (2 days old, 0 orders)

When Ravi tries:
- GET /api/user/referral-eligibility
- System checks:
  - createdAt (2 days ago) < 7 days? ❌ TOO NEW
  - orderCount = 0 < 1? ❌ NO ORDERS
- Response: { eligible: false, reason: "Account too new (5 days remaining)" }
- Code is not generated yet

When Ravi qualifies (Day 8, after first order):
- Code auto-generated
- Can share immediately
```

### Case 6: New User Tries Code Before Order
```
Scenario: Priya enters code at checkout, but later cancels order and tries again

Option A: Priya cancels and doesn't order
- applyReferralBonus() was called (created referral, status="pending")
- 30 days pass → CODE EXPIRES
- If Priya tries again later: "Code has expired"

Option B: Priya orders with code, order cancelled, reorders
- First order paid → referral marked "pending"
- First order cancelled → referral stays "pending"
- Second order placed with SAME code
- System already has referral record → reuses it
- When either order delivers → bonus credited
```

### Case 7: Admin Fraud Detection
```
Scenario: System detects same phone number in 50 referral relationships

What admin sees:
- GET /api/admin/referrals?fraudFlag=true
- 50 referrals all with phone "98765432100"
- Pattern: All created same day, min order amounts, similar order times

Admin action:
- PATCH /api/admin/referrals/{id}/fraud-flag
  {fraudFlag: true, adminNote: "Fake farm - 50 accounts from single phone"}
- Can bulk update multiple referrals

System blocks:
- These referrals blocked from earning
- Ahmad's account flagged for review
- Future referrals from this account require approval
```

---

## 📈 Section 6: Performance & Monitoring

### Database Indexes (Why They Matter)

```sql
-- Referrer lookup (used in applyReferralBonus validation)
INDEX idx_referrals_referrer (referrer_id, status)
  → Fast: "Find all Ahmad's completed referrals this month"
  → Used for: Earnings cap calculation

-- Referred lookup (used in duplicate prevention)
INDEX idx_referrals_referred (referred_id)
  → Fast: "Is Priya already referred?"
  → Used for: Block multiple codes per user

-- Expiry job (runs daily)
INDEX idx_referrals_expires (expires_at)
  → Fast: "Find all referrals older than 30 days"
  → Used for: Daily expiry scheduler
```

### Key Performance Notes

1. **Transaction Isolation:** serializable level
   - Prevents race conditions on concurrent referrals
   - Slightly slower but guarantees correctness

2. **Row Locking:** FOR UPDATE
   - Lock acquired during payment confirmation
   - Prevents double-crediting

3. **Bulk Operations:** expireOldPendingReferrals()
   - Runs daily at off-peak time
   - Batch updates to avoid individual locks

---

## 🔧 Section 7: Configuration & Customization

### What Admins Can Change (via Wallet Settings)

| Setting | Default | Range | Notes |
|---------|---------|-------|-------|
| `referrerBonus` | ₹100 | ₹0-₹10,000 | Earned by person who refers |
| `referredBonus` | ₹50 | ₹0-₹5,000 | Earned by new customer |
| `minOrderAmount` | ₹100 | ₹0-₹10,000 | New order must be >= this |
| `maxReferralsPerMonth` | 10 | 0-∞ | Max referrals one person can create |
| `maxEarningsPerMonth` | ₹5,000 | ₹0-₹100,000 | Max earnings per month |
| `expiryDays` | 30 | 1-180 | Days before code expires |
| `isActive` | true | true/false | Enable/disable system |

### Scenarios Admins Handle

**Scenario 1: Promo Campaign**
```
Admin wants: ₹200 referrer bonus, ₹100 new customer for March only

Action:
- POST /api/admin/wallet-settings
  { referrerBonus: 200, referredBonus: 100 }
- All referrals created in March use these amounts
- April: Reset to normal (₹100/₹50)
- Old referrals unchanged (use values from creation date)
```

**Scenario 2: Fraud Spike**
```
Admin notices: 200 referrals created in 2 hours

Action:
- POST /api/admin/wallet-settings { isActive: false }
- System disables referral system
- Existing codes still work, but no new codes can be created
- Can flag suspicious referrals manually
- Re-enable when issue resolved
```

**Scenario 3: Cost Control**
```
Admin realizes: Spending too much on bonuses

Action:
- Reduce referrerBonus: ₹100 → ₹50
- Reduce maxEarningsPerMonth: ₹5000 → ₹3000
- Changes apply to new referrals immediately
- Old referrals keep their original amounts
```

---

## 🐛 Section 8: Known Issues & Fixes

### Current System Status
✅ **Healthy** - All critical flows working

### Recently Fixed Issues

#### Issue 1: Double Bonus Credit
- **Problem:** Users got bonus both at checkout AND on delivery
- **Fix:** Mark referral "completed" immediately at checkout claim
- **Code:** claimReferralBonusAtCheckout() → referrals.status = "completed"

#### Issue 2: Earnings Cap Not Enforced
- **Problem:** Referrer could earn beyond ₹5000/month limit
- **Fix:** Check monthlyEarnings before crediting bonus
- **Code:** completeReferralOnFirstOrder() → canCreditBonus check

#### Issue 3: Duplicate Referrals
- **Problem:** Same person referred twice (system allowed it)
- **Fix:** Prevent by checking existing referral before creating
- **Code:** getReferralByReferredId() guard in payment-confirmed

#### Issue 4: Referrer Bonus Without Own Delivery ✅ FIXED (April 6, 2026)
- **Problem:** Referrer was getting bonus without requiring their own order to be delivered
- **Root Cause:** Missing validation check in completeReferralOnFirstOrder() function
- **Business Requirement:** BOTH users must have completed (delivered) their first orders to BOTH receive bonuses
- **Fix Applied:** Re-added referrerHasCompletedFirstOrder constraint in storage.ts (lines 2490-2510)
- **Code Change:**
  ```typescript
  // Check: Referrer must have completed their own first order
  const referrerOrders = await tx.query.orders.findMany({
    where: (o, { eq }) => eq(o.userId, referral.referrerId),
  });
  const referrerHasCompletedFirstOrder = referrerOrders.some(o => o.status === "delivered");
  
  if (canCreditBonus && referrerHasCompletedFirstOrder) {
    // Credit referrer ₹100
  } else {
    // Referrer bonus pending until their delivery
  }
  ```
- **New Behavior:** 
  - Referred user always gets ₹50 when their order delivers
  - Referrer gets ₹100 ONLY when referrer's own order also delivered
  - Referral stays "pending" until referrer delivers (if needed)
- **Status:** ✅ Verified & Build Tested (April 6, 2026)

---

## 📞 Section 9: Common Support Questions

**Q: "I entered a code but haven't ordered yet. Will it expire?"**  
A: The code itself never expires. You have 30 days to place your order after entering the code. After that, the referral expires but the customer's code is still shareable.

**Q: "I referred 5 people but only got bonus for 3. Why?"**  
A: Possible reasons:
- Others haven't placed orders yet (bonus pending)
- Orders haven't been delivered (bonus pending delivery)
- Monthly earnings cap reached (₹5000 max)
- Referral marked as fraud by admin

**Q: "Can I use my referral code for myself?"**  
A: No. System explicitly blocks self-referrals. You must use someone else's code as a new customer.

**Q: "What if the person I referred places 2 orders with my code?"**  
A: Only the first order triggers the referral. The second order doesn't create a new referral or bonus.

**Q: "I received bonus but it disappeared. What happened?"**  
A: Unlikely but possible:
- Used it on an order (deducted from wallet)
- Admin reversed it due to fraud investigation
- System error (should contact support)

**Q: "Do BOTH users need to have delivered their first orders to get bonuses?"**  
A: YES. This is the key requirement:
- Referred user's bonus (₹50): Credited when THEIR first order is delivered
- Referrer's bonus (₹100): Credited ONLY when REFERRER's order is also delivered
- If referrer hasn't received delivery yet, their ₹100 bonus stays pending
- Once referrer's order delivers, they both immediately receive their bonuses

**Q: "What if I refer someone but my order hasn't been delivered yet?"**  
A: You referred them successfully, but you won't get your ₹100 bonus until YOUR order is delivered.
- Their order delivers → They get ₹50 ✅
- Your order delivers → You get ₹100 ✅
- If your order is cancelled → You get ₹0 (requirement not met)

**Q: "Why do BOTH orders need to be delivered?"**  
A: Business fairness - both users should have completed a successful transaction before getting rewards. It prevents abuse and ensures quality transactions.

---

## 📝 Summary: State Machine Quick Reference

```
Referral States:
pending    → Waiting for someone to use code (0-30 days)
completed  → Bonuses credited, referral finished
expired    → Not used within 30 days, auto-expired
cancelled  → Admin marked as fraud
approved   → Admin manually approved early
```

---

**Document Complete**  
For technical questions: See Section 3 (API Reference)  
For business questions: See Section 1 (Overview)  
For troubleshooting: See Section 8 (Known Issues)
