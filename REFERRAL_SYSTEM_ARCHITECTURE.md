# Referral System Architecture

## Current Implementation Overview

The referral system is a complete module that allows users to earn bonuses by referring friends. Here's the detailed architecture:

---

## 1. DATABASE SCHEMA (Shared/Schema.ts)

```typescript
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(),     // User who refers
  referredId: varchar("referred_id").notNull(),     // User who was referred
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, expired
  referrerBonus: integer("referrer_bonus").notNull().default(0),   // ₹ for referrer
  referredBonus: integer("referred_bonus").notNull().default(0),   // ₹ for referred user
  referredOrderCompleted: boolean("referred_order_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Users table includes:
- referralCode: varchar (unique code per user)
- walletBalance: integer (accumulates bonuses)
```

**Statuses:**
- `pending` - Referral created, waiting for referred user's first order
- `completed` - Referred user placed first order, bonuses awarded
- `expired` - Referral expired (default: 30 days)

---

## 2. API ENDPOINTS

### Backend Routes (server/routes.ts)

#### A. GET /api/referral-settings (PUBLIC)
Returns current referral reward configuration
```
Response:
{
  referrerBonus: 50,           // Amount referrer gets
  referredBonus: 50,           // Amount referred user gets
  minOrderAmount: 100,         // Min order value to trigger completion
  maxReferralsPerMonth: 10,    // Max referrals allowed per month
  maxEarningsPerMonth: 500,    // Max earnings cap per month
  expiryDays: 30               // Days before referral expires
}
```

#### B. POST /api/user/generate-referral (REQUIRES AUTH)
Generates a referral code for the logged-in user
```
Input: (none)
Output:
{
  referralCode: "REF12345ABC"  // 3 letters + 8 random alphanumeric
}
```
- Called once per user (returns existing code if already generated)
- Code format: `REF` + nanoid(8)

#### C. POST /api/user/apply-referral (REQUIRES AUTH)
User applies a friend's referral code to their account
```
Input:
{
  referralCode: "REF12345ABC"
}
Output:
{
  message: "Referral bonus applied successfully",
  bonus: 50  // Wallet credit
}
```
**Eligibility Checks:**
- User can only apply one referral code (first time only)
- Cannot use own referral code
- Referred user gets wallet bonus immediately

#### D. GET /api/user/referral-code (REQUIRES AUTH)
Get the authenticated user's referral code
```
Response:
{
  referralCode: "REF12345ABC"
}
```

#### E. GET /api/user/referral-eligibility (REQUIRES AUTH)
Check if user is eligible to apply a referral code
```
Response:
{
  eligible: true/false,
  reason?: "User already used a referral code"
}
```

#### F. GET /api/user/referrals (REQUIRES AUTH)
Get all referrals made by the user (people who used their code)
```
Response: Array of Referral objects
{
  id: "uuid",
  referredName: "John",
  referredPhone: "9876543210",
  status: "pending|completed|expired",
  referrerBonus: 50,
  createdAt: "2025-12-14T...",
  completedAt: null or timestamp
}
```

#### G. GET /api/user/referral-stats (REQUIRES AUTH)
Get summary statistics for the user's referral activity
```
Response:
{
  referralCode: "REF12345ABC",
  totalReferrals: 5,
  completedReferrals: 3,
  pendingReferrals: 2,
  totalEarned: 150,  // ₹ amount
  monthlyEarned: 50,
  monthlyLimit: 500
}
```

---

### Admin Routes (server/adminRoutes.ts)

#### A. GET /api/admin/referrals (ADMIN ONLY)
View all referrals system-wide with user details
```
Response: Array with enriched data
{
  id: "uuid",
  referrerId: "user1",
  referredId: "user2",
  referralCode: "REF12345ABC",
  status: "pending",
  referrerBonus: 50,
  referredBonus: 50,
  referrerName: "Alice",
  referrerPhone: "9876543210",
  referredName: "Bob",
  referredPhone: "9876543211",
  createdAt: timestamp,
  completedAt: null
}
```

#### B. GET /api/admin/referral-stats (ADMIN ONLY)
System-wide referral statistics
```
Response:
{
  totalReferrals: 100,
  pendingReferrals: 20,
  completedReferrals: 75,
  totalBonusPaid: 3750
}
```

#### C. PUT /api/admin/referrals/:id (ADMIN ONLY)
Update referral status manually (complete or expire)
```
Input:
{
  status: "completed" | "expired"
}
```

---

## 3. BACKEND STORAGE LOGIC (server/storage.ts)

### Key Methods:

1. **generateReferralCode(userId)**
   - Creates code: `REF` + nanoid(8)
   - Stores in users.referralCode
   - Returns if already exists

2. **applyReferralBonus(referralCode, newUserId)**
   - Validates referral code exists
   - Prevents self-referral
   - Checks monthly limits (10 referrals/month, ₹500/month cap)
   - Creates referral record with "pending" status
   - Adds `referredBonus` to new user's wallet immediately
   - Transaction ensures atomicity

3. **completeReferralOnFirstOrder(userId, orderId)**
   - Triggered when referred user places their first order
   - Validates referral hasn't expired (30 days default)
   - Checks monthly earning limits
   - Updates referral status to "completed"
   - Awards `referrerBonus` to referrer's wallet
   - Set completedAt timestamp

4. **getReferralsByUser(userId)**
   - Gets all referrals made BY this user (people who used their code)

5. **getReferralByReferredId(referredId)**
   - Gets the referral FOR this user (code they used)

6. **getReferralStats(userId)**
   - Calculates total, pending, completed referrals
   - Sums earnings from completed referrals

7. **updateWalletBalance(userId, amount)**
   - Increments user's walletBalance

---

## 4. FRONTEND USER INTERFACE

### A. InviteEarn Page (client/src/pages/InviteEarn.tsx)
**Purpose:** Main referral earning page

**Features:**
1. **Referral Code Display**
   - Shows user's generated code
   - Copy to clipboard button
   - Share via WhatsApp (pre-filled message)
   - Share via SMS

2. **Referral Stats Tab**
   - Total referrals count
   - Completed referrals count
   - Pending referrals count
   - Total earned amount (₹)
   - Monthly earned amount

3. **My Referrals Tab**
   - List of people who used the code
   - Shows name, phone, status, bonus amount
   - Displays date referred
   - Status badges: Completed (green), Pending (yellow), Expired (red)

4. **How It Works Section**
   - Share code with friends
   - They sign up using code
   - Get bonus on first order
   - Bonus amount from admin settings

### B. Profile Page (client/src/pages/Profile.tsx)
**Purpose:** Apply referral code during account setup

**Features:**
1. **Apply Referral Code Section**
   - Input field for entering friend's referral code
   - Eligibility check before showing
   - Error message if already used a code
   - Shows referral bonus amount from settings

2. **Referral Settings Display**
   - How referrals work explanation
   - Current bonus amounts

3. **Referrals View**
   - Shows all referrals made by user (same as InviteEarn)

### C. Admin Referrals Page (client/src/pages/admin/AdminReferrals.tsx)
**Purpose:** Admin dashboard for referral management

**Features:**
1. **System-Wide Stats**
   - Total referrals
   - Pending referrals
   - Completed referrals
   - Total bonuses paid

2. **Referral Table**
   - Referral code
   - Referrer name and phone
   - Referred user name and phone
   - Status (Completed, Pending, Expired)
   - Bonus amounts
   - Dates created and completed

3. **Management Actions**
   - Filter by status
   - Search by code
   - Manual completion (award bonus)
   - Expire referral (cancel)

---

## 5. REFERRAL FLOW - STEP BY STEP

### For Referrer (Person Sharing Code):
1. User generates referral code → `POST /api/user/generate-referral`
2. Code displayed in InviteEarn page
3. User shares code via WhatsApp/SMS/manual copy
4. Admin can view all referrals made in admin dashboard
5. When referred user places first order → referrer gets bonus to wallet

### For Referred User (New User):
1. New user signs up (`POST /api/user/register` or `/api/user/auto-register`)
2. User sees Profile page with "Apply Referral Code" section (if eligible)
3. User applies referral code → `POST /api/user/apply-referral`
4. User gets `referredBonus` (₹50) added to wallet immediately
5. User must place first order → triggers referral completion
6. When order placed → referral status changes to "completed"
7. Referrer wallet gets `referrerBonus` (₹50) added

---

## 6. INTEGRATION POINTS

### During Order Creation:
**File:** `server/routes.ts` (Order creation endpoint)
```typescript
// After order is successfully created:
if (userId) {
  const pendingReferral = await database.query.referrals.findFirst({
    where: (r, { eq, and }) => and(
      eq(r.referredId, userId),
      eq(r.status, "pending")
    ),
  });

  if (pendingReferral) {
    await storage.completeReferralOnFirstOrder(userId, order.id);
  }
}
```
**Purpose:** Auto-complete referral when referred user places first order

---

## 7. KEY CONSTRAINTS & RULES

| Rule | Value | Location |
|------|-------|----------|
| Referrer bonus per referral | ₹50 | Admin settings |
| Referred user bonus | ₹50 | Admin settings |
| Max referrals per month | 10 | Admin settings |
| Max earnings per month | ₹500 | Admin settings |
| Min order amount | ₹100 | Admin settings |
| Referral expiry period | 30 days | Admin settings |
| Code format | REF + 8 chars | generateReferralCode() |
| Can apply own code | NO | applyReferralBonus() |
| Can apply multiple codes | NO | referral-eligibility check |
| Bonus timing | Immediate (referred), On first order (referrer) | applyReferralBonus(), completeReferralOnFirstOrder() |

---

## 8. CURRENT IMPLEMENTATION STATUS

### ✅ IMPLEMENTED:
- Generate referral codes
- Apply referral codes
- Track referrals in database
- Award bonuses to wallet
- Admin management panel
- Referral statistics
- Monthly limits enforcement
- Expiry date validation
- InviteEarn page with full UI
- Profile page referral integration
- Share via WhatsApp/SMS

### ⚠️ POINTS TO CHECK:
1. Is referral code input accessible at registration/signup?
2. Are users able to apply codes in Profile page?
3. Is wallet balance displaying correctly after bonus?
4. Are referrals auto-completing when orders are placed?
5. Are monthly limits being enforced correctly?
6. Is referral expiry working (30 days)?
7. Is admin able to see and manage referrals?

---

## 9. USER JOURNEY VERIFICATION CHECKLIST

- [ ] User A can generate referral code
- [ ] User A can see code on InviteEarn page
- [ ] User A can copy/share code via WhatsApp
- [ ] User B can register new account
- [ ] User B can see "Apply Referral" section in Profile
- [ ] User B can enter User A's code
- [ ] User B gets ₹50 bonus immediately in wallet
- [ ] User B places first order
- [ ] Referral marked as "completed"
- [ ] User A wallet receives ₹50 bonus
- [ ] Admin can view referral in dashboard
- [ ] Monthly limits prevent >10 referrals/month
- [ ] Monthly earnings capped at ₹500/month
- [ ] Referrals expire after 30 days if not completed

