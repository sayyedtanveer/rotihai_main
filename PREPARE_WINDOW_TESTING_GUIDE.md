# Chef Prepare Button Timing Configuration - Testing Guide

## Implementation Complete ✅
The chef's "Prepare" button timing is now fully configurable by admin. Default is 2 hours before delivery.

## Quick Start

### Step 1: Admin Sets Prepare Window
1. Log in as **Admin**
2. Navigate to **Admin Settings** → **Roti Time Settings**
3. Find new field: **"Chef Prepare Button Enable Window (Hours)"**
4. Enter desired hours (1-24, default 2)
5. Click **Save**

### Step 2: Chef Sees Dynamic Timing
1. Log in as **Chef/Partner**
2. Go to **Scheduled** tab
3. Observe "Mark as Ready" button timing based on admin setting
4. Button enables when: **current_time >= (delivery_time - configured_hours)**

## Detailed Test Cases

### TC1: Set 2-Hour Window (Default)
**Setup:**
- Admin sets: 2 hours
- Order scheduled for: 9:00 AM
- Current time in system: 6:50 AM

**Expected:**
- ❌ Prepare button is DISABLED (not yet 7:00 AM)
- Status: "Confirmed" (not yet preparing)

**Follow-up:** Change system time to 7:00 AM
- ✅ Prepare button becomes ENABLED
- Chef can click "Mark as Ready"

---

### TC2: Set 6-Hour Window
**Setup:**
- Admin changes to: 6 hours
- Order scheduled for: 9:00 AM
- Current time: 3:00 AM

**Expected:**
- ✅ Prepare button is ENABLED (at exactly 3:00 AM)
- Chef can click "Mark as Ready"

---

### TC3: Set 1-Hour Window
**Setup:**
- Admin changes to: 1 hour
- Order scheduled for: 3:00 PM
- Current time: 1:50 PM

**Expected:**
- ❌ Prepare button is DISABLED (not yet 2:00 PM)

**Follow-up:** Change to 2:01 PM
- ✅ Prepare button becomes ENABLED

---

### TC4: Admin Changes Window Mid-Day
**Setup:**
- Initial setting: 2 hours
- Order A scheduled for: 9:00 AM (already prepared)
- Order B scheduled for: 2:00 PM
- Current time: 12:30 PM

**Step 1:** Admin changes setting to 4 hours
- ✅ Settings saved successfully
- Toast: "Settings updated"

**Step 2:** Chef dashboard refreshes
- Order B: Prepare button remains DISABLED (need 10:00 AM for 4-hour window, current is 12:30 PM)
- After refresh: Button respects new 4-hour window

---

### TC5: Boundary Condition - At Exact Window Start
**Setup:**
- Admin sets: 3 hours
- Order scheduled for: 12:00 PM (noon)
- Current time: 9:00 AM (exactly 3 hours before)

**Expected:**
- ✅ Prepare button becomes ENABLED (at 9:00 AM exactly)
- Chef can click "Mark as Ready"

---

### TC6: Past Delivery Time
**Setup:**
- Admin sets: 2 hours
- Order scheduled for: 8:00 AM
- Current time: 11:00 AM (delivery time has passed)

**Expected:**
- ✅ Prepare button remains ENABLED
- Chef can still mark as ready (system allows it)
- Note: This order should have been prepared earlier

---

## Validation Checklist

### Database Level
- [ ] `roti_settings` table has `prepare_window_hours` column (integer)
- [ ] Column has default value of 2
- [ ] Migration 0010 applied successfully

### Admin UI
- [ ] Input field visible in Roti Time Settings
- [ ] Can input values 1-24
- [ ] Rejects values < 1 or > 24
- [ ] Save button updates settings
- [ ] Settings persist after page refresh

### API Endpoints
- [ ] `GET /api/roti-settings` returns `prepareWindowHours`
- [ ] `PUT /api/admin/roti-settings` accepts `prepareWindowHours` in request
- [ ] Validation rejects out-of-range values (< 1 or > 24)
- [ ] Response includes updated `prepareWindowHours` value

### Chef Dashboard
- [ ] Dashboard fetches rotiSettings on load
- [ ] Button timing uses fetched value
- [ ] Button respects admin-configured hours
- [ ] Changes reflected immediately on refresh

## Running Tests

```bash
# Start the app
npm run dev

# Open in browser
# Admin: http://localhost:5173/admin/roti-settings
# Chef: http://localhost:5173/partner/dashboard
```

## SQL Verification (Optional)

If you need to manually verify database:

```sql
-- Check if column exists
\d roti_settings;

-- View current settings
SELECT id, prepare_window_hours, morning_block_start_time, morning_block_end_time 
FROM roti_settings;

-- Update via SQL (if needed)
UPDATE roti_settings SET prepare_window_hours = 3 WHERE id = '...';
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prepare button doesn't respect timing | Refresh chef dashboard, check rotiSettings API response |
| Admin UI shows old value after save | Clear browser cache or hard refresh (Ctrl+Shift+R) |
| Input field not visible | Check if in correct admin page: Roti Time Settings (not general Settings) |
| "Update failed" error | Check browser console for API error message |
| Button stays disabled despite time | Verify delivery time format is HH:mm and delivery date is set correctly |

## Files Modified Summary

```
shared/schema.ts
├─ Added prepareWindowHours field to rotiSettings table
└─ Validation: 1-24 hours

client/src/pages/admin/AdminRotiSettings.tsx
├─ Added RotiSettings interface field
├─ Added formData.prepareWindowHours state
├─ Added number input UI with range 1-24

client/src/pages/partner/PartnerDashboard.tsx
├─ Added rotiSettings query
├─ Updated canEnablePrepareButton() logic
└─ Uses admin-configured value instead of hardcoded 8

server/routes.ts
├─ GET /api/roti-settings: Returns prepareWindowHours
└─ PUT /api/admin/roti-settings: Validates and saves prepareWindowHours

migrations/0010_add_prepare_window_hours.sql
└─ Database migration to add column
```

## Rollback (If Needed)

To revert this feature:

```sql
-- Remove column from database
ALTER TABLE roti_settings DROP COLUMN IF EXISTS prepare_window_hours;

-- Code changes would need to be reverted manually
```

---

**Status:** ✅ **IMPLEMENTATION COMPLETE - READY FOR TESTING**
