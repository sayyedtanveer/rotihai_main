# Subscription Notifications & Chef Assignment Implementation

## Overview
Fixed subscription payment notifications to properly navigate to subscriptions tab instead of orders/payments tab, and added manual chef assignment functionality when subscriptions are activated, especially important for categories with multiple chefs (like Roti).

## Changes Made

### 1. **Notification Routing Fix** 
**Files Modified:** 
- `client/src/hooks/useAdminNotifications.ts`
- `client/src/components/admin/AdminLayout.tsx`

**Changes:**
- Added `lastNotificationType` state to track whether the latest notification is for an "order" or "subscription"
- Updated `useAdminNotifications` hook to set `lastNotificationType` when processing subscription notifications
- Modified the notification bell in AdminLayout to navigate:
  - `/admin/subscriptions` when the last notification is of type "subscription"
  - `/admin/payments` when the last notification is of type "order"

**How it works:**
- When a subscription payment is submitted, the notification sets `lastNotificationType` to "subscription"
- When the notification bell is clicked, it automatically navigates to the correct page based on the notification type
- This prevents admin from getting confused when clicking on subscription payment notifications

### 2. **Chef Assignment Modal**
**Files Modified:**
- `client/src/pages/admin/AdminSubscriptions.tsx`

**Changes:**
- Added state variables:
  - `chefAssignmentModalOpen`: Controls visibility of the chef selection modal
  - `subscriptionForChefAssignment`: Stores the subscription needing chef assignment
  - `selectedChefId`: Tracks the selected chef

- Updated the "Verify & Activate" button handler to:
  1. Check if subscription has a chef assigned
  2. Check if it's a Roti category subscription (categories with multiple chefs)
  3. If no chef and it's Roti, open chef selection modal instead of directly confirming payment
  4. Otherwise, proceed with normal payment confirmation

- Added Chef Assignment Modal Dialog with:
  - Dropdown selector showing all available chefs
  - Clear description of the subscription being assigned
  - "Assign & Activate" button that:
    - First assigns the selected chef via `/api/admin/subscriptions/:id/assign-chef`
    - Then confirms the payment via `/api/admin/subscriptions/:id/confirm-payment`
    - Invalidates queries to refresh subscription list
    - Shows success/error toast notifications

**User Experience:**
1. Admin clicks "Verify & Activate" on a subscription payment
2. If no chef is assigned AND it's a Roti (multi-chef) category:
   - Modal appears asking to select a chef
   - Admin chooses from available chefs
   - Clicks "Assign & Activate"
   - Chef is assigned and subscription is activated in one flow
3. If chef was already assigned or not a multi-chef category:
   - Payment is directly confirmed (auto-assignment will handle if needed)

### 3. **Auto-Chef Assignment (Existing Logic - Unchanged)**
**Location:** `server/adminRoutes.ts` (lines 1180-1250)

**How it works:**
- When subscription payment is confirmed, system checks if chef is already assigned
- If no chef assigned, it calls `findBestChefForCategory()` from storage
- This function intelligently selects the chef with:
  - Same category
  - Currently active (isActive = true)
  - Least number of active subscriptions (load balancing)
- This serves as a smart fallback if manual assignment is not performed

## Database Schema
- No changes required - existing `chefId` column on subscriptions table is used

## API Endpoints Used
1. **GET /api/admin/subscriptions** - Fetch all subscriptions
2. **POST /api/admin/subscriptions/:id/confirm-payment** - Confirm payment and activate
3. **PUT /api/admin/subscriptions/:id/assign-chef** - Assign chef to subscription
4. **GET /api/admin/chefs** - Fetch available chefs

## Features Summary

### ✅ Notification Routing
- Subscription payment notifications now route to `/admin/subscriptions` page
- Order payment notifications continue to route to `/admin/payments` page
- Smart routing based on notification type

### ✅ Manual Chef Assignment
- Admin can manually select chef when activating subscription
- Modal only appears for multi-chef categories (configurable)
- Prevents issues with auto-assignment for critical categories like Roti
- Clean, single-step activation flow (assign chef + confirm payment)

### ✅ Smart Auto-Assignment
- If admin doesn't manually assign, system auto-assigns best available chef
- Load balancing algorithm ensures even distribution
- Falls back to least-busy chef if no preference specified

### ✅ Category-Aware
- Modal only shows for categories that need manual selection (like Roti)
- Easy to configure which categories require manual chef assignment

## Testing

### Test Case 1: Subscription Payment with Manual Chef Assignment
1. Create a subscription for Roti category
2. Submit payment with transaction ID
3. Admin clicks "Verify & Activate"
4. Chef selection modal should appear
5. Select a chef from dropdown
6. Click "Assign & Activate"
7. Verify subscription is now active with assigned chef

### Test Case 2: Notification Routing
1. Create a subscription and submit payment
2. Receive subscription payment notification
3. Click notification bell
4. Should navigate to `/admin/subscriptions` (not `/admin/payments`)

### Test Case 3: Auto-Assignment Fallback
1. Create subscription for a non-Roti category or skip chef selection
2. Confirm payment without manual assignment
3. Verify system auto-assigns least-busy chef
4. Check subscription has a chefId assigned

## Configuration & Customization

### Adding More Multi-Chef Categories
In `client/src/pages/admin/AdminSubscriptions.tsx`, modify the logic to check more categories:

```typescript
const isCategoryRoti = categories?.find(c => c.id === plan?.categoryId)?.name?.toLowerCase().includes("roti");
// Add similar checks for other multi-chef categories
const isCategoryMultiChef = isCategoryRoti || /* other conditions */;
```

## Notes
- Manual chef assignment is optional - system has intelligent fallback
- Auto-assignment uses load balancing for fair distribution
- Notification type tracking is done in real-time via WebSocket
- All changes are backwards compatible with existing code
