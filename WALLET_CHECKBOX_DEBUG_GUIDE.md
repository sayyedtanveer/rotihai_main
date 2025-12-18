# Wallet Checkbox Disable Logic - Debug Guide

## Implementation Summary

The "Use Balance" checkbox in the checkout dialog is now properly disabled when the minimum order amount (set by admin in wallet settings) is not met.

## How It Works

### 1. **Wallet Settings Fetched from Admin**
- Endpoint: `/api/wallet-settings`
- Returns: `{ maxUsagePerOrder: number, minOrderAmount: number }`
- Refetch interval: 60 seconds

**Log to check:** 
```
[WALLET] Fetched wallet settings: {...}
[WALLET] Set minOrderAmountForWallet to: <amount>
```

### 2. **Disabled Condition Calculation**
The checkbox is disabled when:
```javascript
minOrderAmountForWallet > 0 && (subtotal + deliveryFee - discount) < minOrderAmountForWallet
```

This is calculated in a `useMemo` for performance optimization.

**Logs to check:**
```
[WALLET DISABLE CHECK] Calculation Values: {
  calculatedSubtotal: <amount>,
  calculatedDeliveryFee: <amount>,
  calculatedDiscount: <amount>,
  baseTotal: <amount>,
  minOrderAmountForWallet: <amount>,
  "isCheckboxDisabled?": true/false
}

[WALLET CHECKBOX] Disabled state calculation: {
  minOrderAmountForWallet: <amount>,
  subtotal: <amount>,
  deliveryFee: <amount>,
  discount: <amount>,
  orderTotal: <amount>,
  isDisabled: true/false
}
```

### 3. **Visual Feedback**
- **Checkbox:** Disabled with reduced opacity and "not-allowed" cursor
- **Label:** Changes from blue to gray when disabled
- **Warning Message:** Shows "⚠️ Minimum order ₹{amount} required to use wallet (Current: ₹{amount})"
- **Success Message:** Shows "✓ Will use ₹{amount} from wallet" when conditions are met

### 4. **onChange Logging**
When user tries to change the checkbox:
```
[WALLET] Checkbox changed to: true/false
```

## Testing Checklist

1. **Open browser DevTools Console** (F12 → Console tab)

2. **Add an item to cart** and open checkout

3. **Check logs appear:**
   - `[WALLET] Fetched wallet settings:` - Verify minOrderAmount value
   - `[WALLET] Set minOrderAmountForWallet to:` - Confirm value set

4. **Test Case 1: Order Below Minimum**
   - Add item with total BELOW minimum (e.g., ₹200 below ₹500 minimum)
   - Check logs: `isCheckboxDisabled? true`
   - Checkbox should be: **DISABLED** ✓
   - Label should be: **GRAY** ✓
   - Warning message should appear ✓

5. **Test Case 2: Order Meets Minimum**
   - Add items with total ABOVE minimum (e.g., ₹500 when minimum is ₹500)
   - Check logs: `isCheckboxDisabled? false`
   - Checkbox should be: **ENABLED** ✓
   - Label should be: **BLUE** ✓
   - No warning message ✓
   - Can click checkbox (logs will show: `[WALLET] Checkbox changed to: true`)

6. **Test Case 3: No Minimum Set**
   - If admin hasn't set a minimum (minOrderAmount = 0):
   - Checkbox should always be: **ENABLED** ✓
   - No warning message ✓

## Key Code Changes

### File: `client/src/components/CheckoutDialog.tsx`

1. **Wallet Settings State:**
   ```javascript
   const [minOrderAmountForWallet, setMinOrderAmountForWallet] = useState<number>(0);
   const [maxWalletUsagePerOrder, setMaxWalletUsagePerOrder] = useState<number>(10);
   ```

2. **Disabled State Calculation (useMemo):**
   ```javascript
   const isWalletCheckboxDisabled = useMemo(() => {
     const disabled = minOrderAmountForWallet > 0 && (subtotal + deliveryFee - discount) < minOrderAmountForWallet;
     console.log("[WALLET CHECKBOX] Disabled state calculation:", { ... });
     return disabled;
   }, [minOrderAmountForWallet, subtotal, deliveryFee, discount]);
   ```

3. **Checkbox HTML:**
   ```jsx
   <input
     type="checkbox"
     id="useWalletCheckbox"
     checked={useWalletBalance}
     onChange={(e) => {
       console.log("[WALLET] Checkbox changed to:", e.target.checked);
       setUseWalletBalance(e.target.checked);
     }}
     disabled={isWalletCheckboxDisabled}
     className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
   />
   ```

4. **Label Styling:**
   ```jsx
   className={`text-xs font-medium cursor-pointer ${
     isWalletCheckboxDisabled
       ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
       : "text-blue-700 dark:text-blue-300"
   }`}
   ```

## Troubleshooting

### Issue: Checkbox still editable when it shouldn't be

**Check these logs in order:**

1. Is wallet settings being fetched?
   - Look for: `[WALLET] Fetched wallet settings:`
   - If not found: API endpoint issue

2. Is minOrderAmountForWallet being set correctly?
   - Look for: `[WALLET] Set minOrderAmountForWallet to: <value>`
   - If value is 0 or undefined: Check admin wallet settings

3. Is the disabled calculation correct?
   - Look for: `[WALLET CHECKBOX] Disabled state calculation:`
   - Compare: `orderTotal` vs `minOrderAmountForWallet`
   - If `isDisabled: false` when should be `true`: Verify calculation logic

4. Is the checkbox receiving the disabled prop?
   - Try clicking it - if you can't: it's actually disabled
   - If you can: disabled prop not being applied correctly

### Issue: Warning message not showing

- Should only show when: `isWalletCheckboxDisabled === true`
- Check: `[WALLET CHECKBOX] Disabled state calculation: { isDisabled: ? }`

### Issue: Admin settings not being applied

- Admin endpoint: `/api/wallet-settings`
- Check network tab in DevTools
- Verify admin panel is saving settings correctly

## Admin Configuration

Admin should set wallet minimum order in wallet settings page:
- Min Order Amount: The minimum order value required to use wallet
- This value is fetched every 60 seconds (configurable via `refetchInterval`)

