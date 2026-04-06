# Roti Hai Referral System: Complete Functional & Technical Architecture

**Document Version:** 2.0 (Comprehensive Deep Dive)  
**Last Updated:** April 6, 2026  
**Scope:** Database Schema • API Endpoints • Business Logic • Frontend Flows • Admin Controls • Edge Cases • Performance

This document provides a COMPLETE, detailed explanation of the Referral Module suitable for both technical developers and non-technical stakeholders. Every feature, rule, and flow is explained in depth.

---

## 📌 Section 1: What is the Referral System? (Non-Technical Explanation)

### The Big Picture
The referral system is a **reward program** that encourages existing customers to invite their friends. When a friend places their first order, both the person who referred them AND the new customer receive wallet bonuses (free credit toward future orders).

### How It Works (Simple Version)
1. **Existing Customer** gets a unique referral code (like `REF3A7K9B2L`)
2. **New Customer** uses that code when placing their first order
3. **Both benefit:** 
   - New customer gets ₹50 bonus (credited when order is delivered)
   - Existing customer gets ₹100 bonus (credited when new customer's order is delivered)
4. **Monthly limits protect** the business:
   - Each person can refer max 10 others per month
   - Each referrer earns max ₹5000 per month from referrals

### Why This Matters
- **For customers:** Free money to spend on future orders
- **For RotiHai:** Grows customer base through word-of-mouth
- **Safety:** System prevents fraud (people can't cheat the system)

---

## 🔒 Section 2: Safety Rules & Fraud Prevention (Important!)

The system has **multiple layers of protection** to prevent cheating:

### Who Can Refer Others?
A customer can share their referral code ONLY if:
- ✅ Their account is at least **7 days old** (prevents brand new fake accounts)
- ✅ They have **placed at least 1 order** (proves they're a real customer)
- ✅ The person they're referring is NEW to RotiHai (prevents duplicate referrals)
- ✅ The person being referred hasn't already used another referral code

### What Bonuses Can They Earn?
- ❌ **Cannot** refer themselves (self-referral blocked)
- ❌ **Cannot** earn bonus if monthly limit reached (max 10 referrals/month)
- ❌ **Cannot** earn bonus if monthly earnings cap reached (max ₹5000/month)
- ✅ **Can** earn bonus if everything above is met

### When Are Bonuses Actually Credited?
- **Referred user's bonus (₹50):** Credited when their order is **DELIVERED** (not just ordered)
  - OR: Can be claimed early at checkout if user pays with the bonus
- **Referrer's bonus (₹100):** Credited when referred user's order is **DELIVERED**
  - This happens automatically when delivery is marked complete

### Special Cases (Edge Cases Handled)
1. **Code expires:** If no one uses a referral code within 30 days, it automatically expires
2. **Double-credit prevention:** If bonus is claimed at checkout, it won't be given again on delivery
3. **Referral cap:** Can only create max 10 referral relationships per month
4. **Earnings cap** Can only earn max ₹5000 bonus per month

---

## 📊 2. Database Schema (`shared/schema.ts`)

| Table | Field | Type/Role | Purpose |
| ---- | ---- | ---- | ---- |
| **`users`** | `referralCode` | String (Unique) | The unique, auto-generated shareable string (`NAMEXXXX`). |
| **`users`** | `walletBalance` | Integer | Hard, settled money available to spend. |
| **`referrals`** | `referrerId` | String | User ID of the person who shared the link. |
| **`referrals`** | `referredId` | String | User ID of the new guest. |
| **`referrals`** | `referralCode` | String | The exact string key entered. |
| **`referrals`** | `status` | Enum | `pending` (code applied, order not delivered), `completed` (order delivered, bonuses credited), `cancelled` (fraud), `expired` (not used within expiry window), `approved` (admin override). |
| **`referrals`** | `referredBonus` | Integer | Bonus amount for referred user (default ₹50). Credited when order is delivered. |
| **`referrals`** | `referrerBonus` | Integer | Bonus amount for referrer (default ₹50). Credited when referred user's order is delivered, capped by monthly earnings limit. |
| **`referrals`** | `referredOrderCompleted`| Boolean | True only when the guest physically receives the food AND bonus is claimed. |
| **`referrals`** | `firstOrderId` | String (FK) | Links to the referred user's first order after referral is applied. |
| **`referrals`** | `expiresAt` | Timestamp | When the referral code expires if not used (default 30 days from creation). |
| **`referrals`** | `createdAt` | Timestamp | When the referral was created. |
| **`referrals`** | `completedAt` | Timestamp | When the referral bonuses were credited (on delivery). |
| **`referrals`** | `fraudFlag` | Boolean | Set by Admin to soft-flag suspicious referral patterns. |
| **`referrals`** | `adminNote` | String | Admin's reason for approve/cancel action. |
| **`wallet_transactions`** | `type` | Enum | `credit` (general), `debit` (used), `referral_bonus` (referrer/referred bonus on delivery), `referral_bonus_claimed` (claimed at checkout), `order_discount`. |

---

## 🖥️ 3. UI Screens & Functional Flow

### A. Referrer (Existing User) Flow
1. **Screen:** `Profile.tsx` (or `Home.tsx` Hero Banner)
   - **Condition:** User logs in. Must have >0 orders to share code safely. 
   - **Functionality:** Displays their `referralCode`. Shows an aggregated "Bonus Earned" alert.

### B. Guest (Referred User) Journey

**Phase 1: Apply Referral Code (Before Checkout)**
1. **Screen:** User profile or checkout page
   - **Endpoint:** `POST /api/user/apply-referral`
   - **Input:** Referral code from referrer
   - **Logic:** Creates a `pending` referral record linking guest to referrer
   - **Validation:** Referrer exists, referrer has placed orders, guest hasn't used a code before, referrer hasn't exceeded monthly cap
   - **Result:** Referral saved in DB with status `pending`; guest becomes eligible for bonus on first order

**Phase 2: Checkout Flow**
1. **Screen:** `CheckoutDialog.tsx`
   - **State Visibility:** The "Have a Referral Code?" input block ONLY appears if `userOrders.length === 0` (preventing legacy users from using referral codes)
2. **Action: "Verify Code"**
   - Calls **`POST /api/referral/validate`** to check eligibility
   - Ensures cart `subtotal` >= Admin `minOrderAmount` (e.g., ₹100)
   - Returns bonus amount guest will receive if order is delivered
   - **Validation Cache:** The UI stores `validatedAmount = subtotal`. If user removes items below minimum, code auto-unbinds
3. **Action: "Complete Payment"**
   - **Claim Bonus at Checkout:** Calls **`POST /api/user/claim-bonus-at-checkout`** with `orderTotal` and `orderId`
   - Deducts from pending bonus using `maxBonusUsagePerOrder` cap (guest can't use 100% of bonus in one order)
   - Credits user's wallet with claimed amount
   - Marks referral as `completed` to prevent double-crediting
   - **Payment Confirmation:** After payment succeeds, calls **`POST /api/orders/:id/payment-confirmed`**
   - Creates/links user account to order

**Phase 3: Order Delivery & Bonus Distribution**
1. **Trigger:** When order delivery status changes to `delivered`
   - **From:** `deliveryRoutes.ts` line 441
   - **Calls:** `storage.completeReferralOnFirstOrder(userId, orderId)`
2. **Referrer Bonus:**
   - Checks if referrer has exceeded monthly earnings cap (e.g., ₹5000/month)
   - If within cap: Credits `referrerBonus` amount to referrer's wallet
   - Creates `walletTransaction` with type `referral_bonus`
3. **Referred User Bonus:**
   - Only credited here if NOT already claimed at checkout (guard: `!referral.referredOrderCompleted`)
   - For users who didn't claim bonus at checkout, credit now
4. **Referral Status Update:**
   - Updates referral status to `completed`
   - Sets `referredOrderCompleted = true`
   - Records `completedAt` timestamp
   - Both users notified of new wallet balance

---

## ⚙️ 4. Admin Dashboard Module & Capabilities

The comprehensive Admin suite actively logs and controls referrals:

### Screen 1: Wallet Settings (`AdminWalletSettings.tsx`)
**Global configuration for referral system behavior.**
- **Enable/Disable:** Toggle referral system on/off
- **Referrer Bonus Amount:** Default ₹50 (paid when referred user's order delivers)
- **Referred Bonus Amount:** Default ₹50 (pending, credited on delivery or claimed at checkout)
- **Minimum Order Amount:** ₹100 (guest's cart must meet this before checking out with code)
- **Max Referrals Per Month:** 10 (max times 1 person can invite friends per month)
- **Max Bonus Usage Per Order:** ₹10 (limits how much pending bonus can be used on one order)
- **Max Earnings Per Month:** ₹5000 (total bonus earnings cap per referrer per month)
- **Expiry Days:** 30 (days before unapplied codes auto-expire)

### Screen 2: Referrals Dashboard (`AdminReferrals.tsx`)
**Master table of all live referrals with full audit trail.**
- **Data Columns:** Referrer Name, Referred User, Phone, Order Amount, Status, Created Date, Completed Date
- **Status Filter:** pending | completed | expired | cancelled | approved
- **Fraud Filter:** Show flagged/unflagged referrals
- **Actions:** 
  - **Approve:** Force early bonus payout for manual decision
  - **Cancel:** Revoke referral and prevent payout
  - **Mark Fraud:** Soft-flag suspicious patterns
  - **View Details:** See referral history and linked order info

### Screen 3: Wallet Transactions Log (`AdminWalletLogs.tsx`)
**For auditing and financial tracking.**
- **Data Columns:** User Name, Transaction Type, Amount, Date, Reference (Order ID or Referral ID)
- **Filter by Type:** `credit` | `debit` | `referral_bonus` | `referral_bonus_claimed` | `order_discount`
- **Purpose:** Trace every rupee credited into wallets; verify bonus payouts
- **Reporting:** Export transactions for financial reconciliation

### Screen 4: Financial Reports (`AdminReports.tsx`)
**Revenue reconciliation dashboard.**
- **Total Revenue:** Gross earnings from all orders
- **Less: Referral Bonuses Spent:** Total bonuses paid out this month
- **Net RotiHai Revenue:** Actual profit after referral costs
- **Pending Payouts:** Bonuses yet to be credited (on delivery)
- **Fraud Losses:** Value of cancelled referrals due to fraud flags

### Screen 5: Referral Reward Configs (New)
**A/B testing and bonus amount variations.**
- **Create Config:** Set different bonus amounts for different user segments
- **Enable/Disable:** Activate different configurations
- **View Usage:** See how many referrals use each config

---

## 🔌 5. Core Backend API Integrations

### User Endpoints (Guest/Referrer)

| Endpoint | File Location | Core Responsibility |
| --- | --- | --- |
| `POST /api/user/apply-referral` | `server/routes.ts` | Apply referral code BEFORE checkout. Creates pending referral record. Validates referrer eligibility & cap limits. |
| `POST /api/referral/validate` | `server/routes.ts` | Checks if code is valid and calculates bonus. Verifies referrer exists, referrer has orders, cart meets minimum amount. |
| `POST /api/user/claim-bonus-at-checkout` | `server/routes.ts` | Claims referral bonus at checkout. Deducts from pending bonus using `maxBonusUsagePerOrder` cap. Updates wallet. |
| `GET /api/user/referrals` | `server/routes.ts` | Gets all referrals created/received by user with status and bonus info. |
| `GET /api/user/referral-code` | `server/routes.ts` | Returns user's unique referral code for sharing. |
| `GET /api/user/referral-stats` | `server/routes.ts` | Returns aggregated stats: total referrals, pending, completed, and earnings. |
| `GET /api/user/referral-eligibility` | `server/routes.ts` | Checks if user can share referrals (7+ days old, has placed orders). |
| `GET /api/referral-settings` | `server/routes.ts` | Gets public referral settings (bonus amounts, minimum order, expiry). |
| `POST /api/orders/:id/payment-confirmed` | `server/routes.ts` | Triggered after payment success. Links user to order, initiates wallet deduction. |

### Admin Endpoints 

| Endpoint | File Location | Core Responsibility |
| --- | --- | --- |
| `GET /api/admin/referrals` | `server/adminRoutes.ts` | Master table of all referrals. Filterable by status, fraud flag, date range. Shows referrer/referred names, bonus amounts. |
| `GET /api/admin/referral-stats` | `server/adminRoutes.ts` | High-level stats: total referrals, pending, completed, earnings this month. |
| `PATCH /api/admin/referrals/:id/status` | `server/adminRoutes.ts` | Admin can manually update referral status (approve, cancel). Force early payout or revoke. |
| `PATCH /api/admin/referrals/:id/fraud-flag` | `server/adminRoutes.ts` | Admin can flag/unflag referral as suspected fraud. Prevents payout. |
| `POST /api/admin/referrals/expire` | `server/adminRoutes.ts` | Manually expire old pending referrals (runs daily via scheduler). |
| `GET /api/admin/wallet-settings` | `server/adminRoutes.ts` | Fetch current global referral limits (bonus amounts, caps, minimum order). |
| `POST /api/admin/wallet-settings` | `server/adminRoutes.ts` | Update global referral limits and configuration. |
| `GET /api/admin/referral-rewards` | `server/adminRoutes.ts` | View bonus reward configs (can have multiple versions for A/B testing). |
| `POST /api/admin/referral-rewards` | `server/adminRoutes.ts` | Create new bonus reward configuration. |
| `PATCH /api/admin/referral-rewards/:id` | `server/adminRoutes.ts` | Edit existing bonus reward configuration. |
| `GET /api/admin/wallet-transactions` | `server/adminRoutes.ts` | Audit log of all wallet credit/debit transactions for referrals. |
| `GET /api/admin/wallet-stats` | `server/adminRoutes.ts` | Financial reconciliation: total earned, spent, pending payouts. |
| `GET /api/admin/referrals/debug/raw` | `server/adminRoutes.ts` | Debug endpoint to view raw referral data (for troubleshooting). |

## 🛠️ 6. Referral Bonus Credit Flow (Detailed)

### When are bonuses credited?
- **Referred User Bonus:** Credited when order is **delivered** via `completeReferralOnFirstOrder()` OR claimed at checkout via `claimReferralBonusAtCheckout()` (prevents double-credit)
- **Referrer Bonus:** Credited when referred user's order is **delivered**, subject to referrer's monthly earnings cap (₹5000/month default)

### Key Safeguards
1. **Double-Credit Prevention:** Once `claimReferralBonusAtCheckout()` marks referral as `completed`, `completeReferralOnFirstOrder()` returns early (status no longer `pending`)
2. **Monthly Earnings Cap:** Referrer only receives bonus if `monthlyEarnings + referrerBonus <= ₹5000`
3. **Referrer Account Age:** Referrer must be 7+ days old and have placed at least 1 order
4. **Monthly Referral Cap:** Referrer can create max 10 referrals per month
5. **Code Expiry:** Unapplied codes expire after 30 days

### Referral Status Lifecycle
```
PENDING (code applied)
  ├─ On checkout: COMPLETED (bonus claimed)
  ├─ On delivery: COMPLETED (bonus credited)
  └─ After 30 days unused: EXPIRED
  └─ Admin action: CANCELLED or APPROVED
```

---

## 🛠️ 7. How to Edit Future Requirements
- **To Change Wallet Limitations (e.g., Let a user use 100% of bonus on one order):** 
  - Navigate to Admin Dashboard → Wallet Settings
  - Edit `maxBonusUsagePerOrder` field (e.g., change from ₹10 to ₹50)
  - Or edit `referral_rewards` table directly with new config

- **To Change Referrer/Referred Bonus Amounts:**
  - Admin Dashboard → Wallet Settings → Update `referrerBonus` and `referredBonus` fields
  - Or create new `referral_rewards` configuration in `POST /api/admin/referral-rewards`

- **To Change Monthly Earning Caps:**
  - Edit `maxEarningsPerMonth` (default ₹5000 per referrer per month) in Admin Wallet Settings

- **To Block Fraudulent Referral Chains:**
  - Go to Admin Dashboard → Admin Referrals
  - Select affected referral → Click "Mark Fraud" (`PATCH /api/admin/referrals/:id/fraud-flag`)
  - Or "Cancel Referral" to revoke bonus payout

- **To Manually Approve a Pending Referral Early:**
  - Admin Dashboard → Referrals → Select referral
  - Click "Approve" to credit bonuses immediately (`PATCH /api/admin/referrals/:id/status`)

- **If Referral Bonuses are Missing on Delivery:**
  - Check **Storage Logic:** `completeReferralOnFirstOrder()` in `server/storage.ts` lines ~2407-2530
  - Verify: (1) Order status is indeed `delivered`, (2) Referral status is `pending`, (3) Referrer hasn't exceeded monthly cap
  - Check **Trigger:** `deliveryRoutes.ts` line ~441 calls the completion function
  - Check Logs: Look for `[REFERRAL] ✅ Referrer` debug logs indicating bonus was credited

- **To Add IP/Device Blocking for Fraud Prevention:**
  - Edit `POST /api/referral/validate` in `server/routes.ts` 
  - Add validation logic after referrer lookup (line ~1150)
  - Example: Check if IP matches referrer's typical location pattern

---

## 📝 8. Important Implementation Notes

### Removed Constraints (As of Current Build)
⚠️ **The following requirement was REMOVED for better user experience:**
- ~~"Referrer must have completed their own first delivered order before receiving referral bonus"~~
- **Current behavior:** Referrer receives bonus immediately when referred user's order is delivered, regardless of referrer's own order history
- **Rationale:** Prevents new referrers from being stuck unable to earn bonuses until they themselves receive delivery
- **Safeguard:** Age requirement (7 days) + Must have placed at least 1 order still enforced

### Key Implementation Details
1. **User Creation Timing:** Users are created BEFORE order creation to ensure `userId` exists immediately
2. **Payment Confirmation Flow:** Links pending checkout to user, deducts wallet, and creates referral binding in atomic transaction
3. **Scheduler Job:** `expireOldPendingReferrals()` runs daily to auto-expire unused codes after 30 days
4. **Delivery Trigger:** `completeReferralOnFirstOrder()` called from `deliveryRoutes.ts` when delivery personnel marks order as delivered
5. **Double-Credit Guard:** `claimReferralBonusAtCheckout()` marks referral as `completed` immediately, preventing secondary credit during delivery

### Database Indexes (Performance)
- `IDX_referrals_referrer` on `(referrer_id, status)` — Fast lookup of referrer's pending/completed referrals
- `IDX_referrals_referred` on `(referred_id)` — Quick check for existing referral per user
- `IDX_referrals_expires` on `(expires_at)` — Efficient expiry job execution
