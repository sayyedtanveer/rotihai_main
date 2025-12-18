# Chef Prepare Button Timing Configuration - Implementation Complete

## Summary
Made the chef's "Prepare" button timing configurable by admin instead of hardcoded. Chefs can now start preparing scheduled orders `X` hours before delivery (configurable by admin, default 2 hours).

## Changes Made

### 1. Database Schema (shared/schema.ts)
✅ Added `prepareWindowHours` field to `rotiSettings` table
- Type: integer
- Default: 2 hours
- Range: 1-24 hours (validated via schema)
- Migration: 0010_add_prepare_window_hours.sql

### 2. Admin UI (client/src/pages/admin/AdminRotiSettings.tsx)
✅ Added number input field to AdminRotiSettings page
- Label: "Chef Prepare Button Enable Window (Hours)"
- Range: 1-24 hours
- Input type: number with step=1
- Fetches from API: `/api/roti-settings`
- Saves to: `PUT /api/admin/roti-settings`

### 3. Chef Dashboard (client/src/pages/partner/PartnerDashboard.tsx)
✅ Updated `canEnablePrepareButton()` function
- Now fetches `prepareWindowHours` from rotiSettings API
- Uses admin-configured value instead of hardcoded 8 hours
- Calculates: `subHours(deliveryDateTime, prepareWindowHours)`
- Falls back to 2 hours if settings unavailable

## How It Works

1. **Admin Configuration**
   - Admin logs into Admin Settings → Roti Time Settings
   - Finds new input field "Chef Prepare Button Enable Window (Hours)"
   - Sets desired hours (1-24, default 2)
   - Clicks Save

2. **Chef Preparation**
   - Chef sees scheduled orders in "Scheduled" tab
   - Prepare button becomes enabled when current time >= (delivery time - configured hours)
   - Example: If admin sets 2 hours and delivery is 9:00 AM, button enables at 7:00 AM
   - Chef can click "Mark as Ready" to change order status to "preparing"

3. **Backend Support**
   - `/api/roti-settings` endpoint returns `prepareWindowHours` value
   - Admin route `/api/admin/roti-settings` (PUT) saves new value
   - No additional backend changes needed

## Testing Checklist

- [ ] Run database migrations (Drizzle will handle schema changes)
- [ ] Admin can view new input field in Roti Settings
- [ ] Admin can set prepare window hours (1-24)
- [ ] Admin settings save successfully
- [ ] Chef dashboard fetches rotiSettings on load
- [ ] Prepare button respects admin-configured timing
- [ ] Prepare button test: Set 1 hour, delivery at 9:00 AM → button enabled at 8:00 AM
- [ ] Prepare button test: Set 6 hours, delivery at 9:00 AM → button enabled at 3:00 AM

## Files Modified

1. `shared/schema.ts` - Added prepareWindowHours field
2. `client/src/pages/admin/AdminRotiSettings.tsx` - Added UI input
3. `client/src/pages/partner/PartnerDashboard.tsx` - Updated logic
4. `migrations/0010_add_prepare_window_hours.sql` - Created migration

## Backwards Compatibility

✅ No breaking changes
- Existing code uses default value of 2 hours
- All existing orders continue to work
- Admin can customize anytime after deployment
