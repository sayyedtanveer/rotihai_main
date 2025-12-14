# Wallet Updates Architecture - Complete Guide

## Problem Statement
- New users (unauthenticated) were unable to complete checkout
- Page was redirecting to `/login` when it shouldn't
- Wallet settings endpoint needs to work for both authenticated and guest users

## Solution Overview
The issue was resolved by implementing a **context-aware, component-level** wallet updates hook that:
1. Only connects to WebSocket for authenticated users
2. Safely skips for guest/new users without breaking functionality
3. Works where needed (Profile page, CheckoutDialog) without global interference

---

## Architecture Design

### Hook: `useWalletUpdates()`
**Location:** `client/src/hooks/useWalletUpdates.ts`

#### Key Features:
```typescript
interface UseWalletUpdatesOptions {
  enabled?: boolean;  // Control when hook is active
}

useWalletUpdates(options?: UseWalletUpdatesOptions)
```

#### Safety Guarantees:
1. **Authentication Check First**: Returns early if user is not authenticated
2. **Graceful Degradation**: Guest users get NO WebSocket (no errors)
3. **Controlled Visibility**: Optional `enabled` flag for conditional mounting
4. **Proper Cleanup**: Closes WebSocket on unmount

#### Flow Diagram:
```
useWalletUpdates() called
    ↓
Check: enabled = true? (default: yes)
    ├─ NO → Log "Skipping - enabled=false" → Return
    └─ YES ↓
      Check: isAuthenticated?
        ├─ NO → Log "Skipping - guest user" → Return (SAFE for checkout)
        └─ YES ↓
          Check: user.id available?
            ├─ NO → Return (wait for auth to complete)
            └─ YES ↓
              Connect to WebSocket
              Listen for "wallet_updated" messages
              Invalidate queries → Profile re-fetches wallet
```

---

## Implementation Locations

### 1. **Profile Page** (Authenticated Users)
**File:** `client/src/pages/Profile.tsx`

```tsx
export default function Profile() {
  // ... other code ...
  
  // 📡 Enable real-time wallet updates for authenticated users
  useWalletUpdates();
  
  // Wallet data will auto-update when WebSocket receives wallet_updated
  const { data: walletBalance } = useQuery(...);
  
  return (
    // Wallet balance displays with live updates
  );
}
```

**When this runs:**
- User logged in: ✅ Connects to WebSocket, watches for wallet updates
- User NOT logged in: ✅ Hook safely skips, no errors

### 2. **Checkout Dialog** (Both Authenticated & Guest Users)
**File:** `client/src/components/CheckoutDialog.tsx`

```tsx
export default function CheckoutDialog({ isOpen, onClose, ... }) {
  // ... other code ...
  
  // 📡 Listen for wallet updates (safe for both user types)
  useWalletUpdates();
  
  return (
    // New user can complete checkout without issues
    // Authenticated user gets wallet updates in real-time
  );
}
```

**When this runs:**
- Guest user: ✅ Hook skips (no impact on checkout)
- Authenticated user: ✅ Watches for wallet updates during checkout

### 3. **Server Wallet Settings** (Public Endpoint)
**File:** `server/routes.ts` (lines 2592-2604)

```typescript
// Public wallet settings endpoint (for checkout page)
app.get("/api/wallet-settings", async (req, res) => {
  try {
    const walletSetting = await db.query.walletSettings.findFirst({
      where: (ws, { eq }) => eq(ws.isActive, true)
    });

    const defaultWallet = { 
      maxUsagePerOrder: 10,      // ✅ Fixed default
      minOrderAmount: 0,
      referrerBonus: 100,
      referredBonus: 50
    };

    res.json(walletSetting || defaultWallet);  // ✅ Works for guests
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch wallet settings" });
  }
});
```

**Why this works for guests:**
- No authentication required (no `requireUser()`)
- Returns default wallet settings if none configured
- Checkout page can load wallet settings for any user

---

## Data Flow: New User Checkout

```
New User clicks "Complete Checkout"
    ↓
CheckoutDialog mounts
    ↓
useWalletUpdates() hook runs
    ├─ Checks: isAuthenticated = false
    └─ Returns early ✅ (no WebSocket, no errors)
    ↓
Fetch /api/wallet-settings (public endpoint)
    ├─ Returns default wallet settings ✅
    └─ Display in checkout
    ↓
User fills form + pays
    ↓
POST /api/subscriptions/public (no auth required)
    ├─ Create order ✅
    └─ Redirect to /track/:orderId
    ↓
OrderTracking page loads (no auth required) ✅
```

---

## Data Flow: Authenticated User with Wallet Updates

```
Authenticated user on Profile page
    ↓
Profile component mounts
    ↓
useWalletUpdates() hook runs
    ├─ Checks: isAuthenticated = true ✅
    └─ Connects to WebSocket
    ↓
Fetch /api/user/wallet (requires auth)
    └─ Display current balance
    ↓
[Another user sends money or referral bonus awarded]
    ↓
Server broadcasts "wallet_updated" via WebSocket
    ↓
useWalletUpdates() receives message
    ├─ Invalidates /api/user/wallet query
    ├─ Invalidates /api/user/profile query
    └─ Triggers re-fetch
    ↓
Profile page updates with new balance ✅ (real-time)
```

---

## Safety Guarantees

### ✅ For New/Guest Users:
1. Hook returns early if not authenticated
2. No WebSocket connection attempts
3. No authentication errors
4. Checkout flow unaffected
5. Can still use public endpoints

### ✅ For Authenticated Users:
1. WebSocket connects automatically
2. Real-time wallet updates work
3. Profile page stays in sync
4. Proper cleanup on unmount

### ✅ Edge Cases:
1. **Slow auth load**: Hook waits for `isAuthenticated` to be set
2. **Multiple instances**: Each component instance has its own WebSocket
3. **Navigation away**: WebSocket closes when component unmounts
4. **Network error**: Log error, continue gracefully (no app crash)

---

## Testing Checklist

### New User Checkout:
- [ ] Guest can access checkout page
- [ ] No login redirect occurs
- [ ] Wallet settings display correctly
- [ ] Can complete order without authentication
- [ ] Redirects to `/track/:orderId` after payment
- [ ] Console shows: "Skipping - isAuthenticated=false (guest user, this is expected)"

### Authenticated User:
- [ ] Profile page shows wallet balance
- [ ] Console shows WebSocket connection
- [ ] When wallet updates (referral, bonus): balance refreshes in real-time
- [ ] No duplicate WebSocket connections
- [ ] WebSocket closes when leaving Profile page

### Checkout Dialog (Both Types):
- [ ] Renders correctly for guest
- [ ] Renders correctly for authenticated user
- [ ] No console errors
- [ ] Proper cleanup on close/unmount

---

## Code Changes Summary

### 1. Updated `useWalletUpdates` Hook
- Added comprehensive documentation
- Added `enabled` option for controlled mounting
- Better logging for debugging
- Comments explaining architecture decisions

### 2. Profile Page Integration
- Added import: `import { useWalletUpdates } from "@/hooks/useWalletUpdates";`
- Added hook call: `useWalletUpdates();`
- Now works with real-time wallet updates

### 3. CheckoutDialog (No Changes Needed)
- Already had: `import { useWalletUpdates } from "@/hooks/useWalletUpdates";`
- Already had: `useWalletUpdates();` 
- Works correctly for both guest and authenticated users

### 4. Server Wallet Settings
- Endpoint: `GET /api/wallet-settings`
- No auth required (public endpoint)
- Returns default if none configured
- ✅ Works for new user checkout

---

## Future Enhancements

### Optional (Not Needed Now):
1. Add optional toast notification for wallet updates
2. Disable WebSocket when component is not visible (performance)
3. Add retry logic for failed WebSocket connections
4. Add metrics for real-time update latency

### Implementation Example (if needed):
```typescript
// Optional: Only connect when visible
useWalletUpdates({ 
  enabled: isProfileVisible  // from visibility API
});

// Optional: Toast on update
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "wallet_updated") {
    toast({
      title: "💰 Wallet Updated",
      description: `New balance: ₹${message.data.newBalance}`,
    });
  }
};
```

---

## Debugging Guide

### If new user sees login redirect:
1. Check: Is `/api/wallet-settings` endpoint accessible? (No auth required)
2. Check: Does checkout component mount properly?
3. Check Console: Look for error messages
4. Check: Are there any global auth guards?

### If wallet updates not working for authenticated user:
1. Check Console: Should see "WebSocket OPEN"
2. Check: Is server broadcasting "wallet_updated" message?
3. Check: Is user ID in WebSocket URL?
4. Check: Browser DevTools → Network → WS should show WebSocket connection

### If multiple WebSocket connections:
1. Check: Is hook called multiple times?
2. Check: Are dependencies correct in useEffect?
3. Check: Is component remounting unexpectedly?

---

## Summary

The new architecture is **safe, scalable, and maintainable**:

- ✅ **New users**: No impact on checkout flow
- ✅ **Authenticated users**: Real-time wallet updates via WebSocket
- ✅ **Public endpoints**: Work for all user types
- ✅ **Code organization**: Component-level, not global
- ✅ **Error handling**: Graceful degradation
- ✅ **Performance**: Connects only when needed
