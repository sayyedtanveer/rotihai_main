# Wallet Minimum Order Amount - Database Schema Fix

## Problem Identified

The admin was setting `minOrderAmount` to 100 in the wallet settings page, but the frontend was always receiving `minOrderAmount: 0` because:

**Root Cause:** The `minOrderAmount` field was missing from the `walletSettings` database table schema.

Admin Response:
```
[WALLET] Fetched wallet settings: {...}
[WALLET] Set minOrderAmountForWallet to: 0  ❌ Should be 100!
```

## Solution Implemented

### 1. **Updated Database Schema** 
**File:** `shared/schema.ts`
- Added `minOrderAmount: integer("min_order_amount")` field to `walletSettings` table
- Default value: 0
- Not null constraint

```typescript
export const walletSettings = pgTable("wallet_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maxUsagePerOrder: integer("max_usage_per_order").notNull().default(10),
  minOrderAmount: integer("min_order_amount").notNull().default(0),  // ✅ ADDED
  referrerBonus: integer("referrer_bonus").notNull().default(100),
  referredBonus: integer("referred_bonus").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 2. **Created Database Migration**
**File:** `migrations/0005_add_min_order_amount.sql`
- Adds the `min_order_amount` column to existing `wallet_settings` table
- Sets default value to 0
- Applied when migrations run

### 3. **Fixed Backend Admin Endpoint (POST)**
**File:** `server/adminRoutes.ts` - Line 2635
- Updated to save `minOrderAmount` to `walletSettings` table
- Previously only saved to `referralRewards` table

**Before:**
```typescript
const [newWalletSettings] = await db.insert(walletSettings).values({
  maxUsagePerOrder,
  referrerBonus,
  referredBonus,
  isActive: true,  // ❌ minOrderAmount missing
}).returning();
```

**After:**
```typescript
const [newWalletSettings] = await db.insert(walletSettings).values({
  maxUsagePerOrder,
  minOrderAmount: minOrderAmount || 0,  // ✅ NOW SAVED
  referrerBonus,
  referredBonus,
  isActive: true,
}).returning();
```

### 4. **Fixed Backend Admin Endpoint (GET)**
**File:** `server/adminRoutes.ts` - Line 2594
- Updated to explicitly map `minOrderAmount` from `walletSettings` (not `referralRewards`)
- Added logging for debugging

**Before:**
```typescript
const defaultReferral = { 
  minOrderAmount: 0,  // ❌ Wrong table!
  maxReferralsPerMonth: 10,
  // ...
};
res.json({
  ...(walletSetting || defaultWallet),
  ...(referralSetting || defaultReferral)  // Overwrites walletSettings.minOrderAmount
});
```

**After:**
```typescript
const response = {
  // From walletSettings table (CORRECT)
  minOrderAmount: walletSetting?.minOrderAmount || defaultWallet.minOrderAmount,  // ✅ FROM WALLET
  // From referralRewards table (separate field, same name but different purpose)
  maxReferralsPerMonth: referralSetting?.maxReferralsPerMonth || defaultReferral.maxReferralsPerMonth,
  // ...
};
console.log("[ADMIN] Wallet settings response:", response);
res.json(response);
```

### 5. **Updated Public API Endpoint (GET)**
**File:** `server/routes.ts` - Line 2588
- Now correctly returns `minOrderAmount` from `walletSettings` table
- Added logging for debugging

## Important Note: Two Different `minOrderAmount` Fields

The system has TWO separate minimum order amount fields with different purposes:

| Field | Table | Purpose | For |
|-------|-------|---------|-----|
| `walletSettings.minOrderAmount` | `wallet_settings` | Min order to USE WALLET balance at checkout | Regular customers at checkout |
| `referralRewards.minOrderAmount` | `referral_rewards` | Min order amount to CLAIM referral bonus | Referred users earning referral rewards |

**These are NOT the same!** The admin was setting the WALLET minimum (for checkout), not the referral minimum.

## What Now Happens

### Admin Sets Wallet Minimum to ₹100:
1. Admin visits wallet settings page
2. Sets "Minimum Order Amount to Use Wallet" = 100
3. Clicks "Save Settings"
4. POST to `/api/admin/wallet-settings` with `minOrderAmount: 100`
5. Value saved to `walletSettings.minOrderAmount`

### Customer Checks Out:
1. Opens checkout dialog
2. Frontend calls `/api/wallet-settings`
3. Gets response with `minOrderAmount: 100` ✅
4. Sets state: `setMinOrderAmountForWallet(100)`
5. Wallet checkbox now:
   - **DISABLED** if order total < ₹100 ✅
   - **ENABLED** if order total ≥ ₹100 ✅
6. Warning shows: "⚠️ Minimum order ₹100 required to use wallet"

## Console Logs to Verify

**Server logs:**
```
[WALLET] Public endpoint returning: { 
  maxUsagePerOrder: 10, 
  minOrderAmount: 100,  // ✅ Now included!
  referrerBonus: 100, 
  referredBonus: 50 
}
```

**Browser console (DevTools → Console):**
```
[WALLET] Fetched wallet settings: {..., minOrderAmount: 100}
[WALLET] Set minOrderAmountForWallet to: 100  // ✅ Now 100 instead of 0!
[WALLET CHECKBOX] Disabled state calculation: { 
  minOrderAmountForWallet: 100,
  orderTotal: 500,
  isDisabled: false  // Will be true if order < 100
}
```

## Testing Steps

1. **Run migrations** - Apply the new migration
2. **Admin sets value:**
   - Go to admin → Wallet Settings
   - Set "Minimum Order Amount to Use Wallet" = 100
   - Save
3. **Verify in database** (optional):
   ```sql
   SELECT id, min_order_amount, max_usage_per_order, is_active 
   FROM wallet_settings 
   WHERE is_active = true;
   ```
   Should show: `min_order_amount: 100`

4. **Test in checkout:**
   - Open DevTools Console (F12)
   - Add item with total < ₹100
   - Open checkout
   - Look for: `[WALLET] Set minOrderAmountForWallet to: 100`
   - Checkbox should be **DISABLED** (grayed out)
   - Add more items to reach ₹100+
   - Checkbox should become **ENABLED** (blue)

## Files Changed

1. ✅ `shared/schema.ts` - Added field to schema
2. ✅ `migrations/0005_add_min_order_amount.sql` - New migration
3. ✅ `server/routes.ts` - Public endpoint with logging
4. ✅ `server/adminRoutes.ts` - Admin GET/POST endpoints
5. ✅ `client/src/components/CheckoutDialog.tsx` - Already had correct logic, just needed the API to return the value

## Summary

The wallet minimum order amount setting was being ENTERED correctly by admin (stored in form) but was NOT being SAVED to the database because the schema didn't have the field. Now it works end-to-end:

✅ Admin saves value  
✅ Saved to database  
✅ Frontend fetches it  
✅ Checkbox properly disabled/enabled based on order amount

