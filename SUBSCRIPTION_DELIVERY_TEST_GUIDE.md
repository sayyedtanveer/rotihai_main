# Subscription Delivery Date - Manual Testing Guide

## Overview
This guide provides step-by-step manual tests to verify the next delivery date fix across all user roles (User, Admin, Partner).

## Prerequisites
- Application running on `http://localhost:5173`
- Server running on `http://localhost:5000`
- Browser Developer Tools (F12)

---

## Test 1: User - Create Subscription and Verify Delivery Date

### Steps:
1. **Login as Customer**
   - Go to http://localhost:5173
   - Login with test credentials

2. **Create a New Subscription**
   - Navigate to "Subscribe" section
   - Select a plan (preferably one with slots like "Rotis")
   - Select a delivery slot (e.g., "8:00 PM")
   - Complete payment

3. **Verify in My Subscriptions**
   - Go to "My Subscriptions"
   - Look for the newly created subscription
   - Expected: Should show "Next Delivery: Dec 15, 2025" (or similar valid date)
   - NOT expected: Should NOT show "Jan 1, 1970" or "Not scheduled"

4. **Browser Console Check**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Check for errors or warnings related to date parsing
   - Expected: No errors

### Validation Points:
- ✅ Delivery date displays as "MMM DD, YYYY" format
- ✅ Delivery time shows correct slot time (e.g., "8:00 PM" for 8PM slot)
- ✅ Date is in the future (not past)
- ❌ No "Jan 1, 1970" or "Not scheduled" text

---

## Test 2: Admin - Verify Subscription Delivery Dates

### Steps:
1. **Login as Admin**
   - Go to http://localhost:5173/admin/login
   - Login with admin credentials

2. **Open Subscriptions Page**
   - Navigate to "Subscriptions" in sidebar
   - View all subscriptions list

3. **Check Each Subscription**
   - Look at each subscription card
   - Find the "Next:" field showing delivery date
   - Find the "Time:" field showing delivery time

4. **Verify Display Quality**
   - Expected date format: "Dec 15, 2025" (or similar)
   - Expected time format: "8:00 PM" (12-hour format)
   - NOT expected: "Not scheduled", "Jan 1, 1970", or empty

5. **Network Inspection**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Go to Subscriptions page (if not already there)
   - Find request to `/api/admin/subscriptions`
   - Click on it, go to Response tab
   - Verify `nextDeliveryDate` is ISO string format: `"2025-12-15T10:30:00.000Z"`
   - NOT: `null`, `undefined`, or epoch timestamp

### Validation Points:
- ✅ API returns ISO string dates: `"2025-12-15T10:30:00.000Z"`
- ✅ Frontend displays formatted dates: `"Dec 15, 2025"`
- ✅ No 500 errors on subscriptions page
- ✅ Each subscription has valid delivery info
- ❌ No "Not scheduled" for paid subscriptions
- ❌ No "Jan 1, 1970"

---

## Test 3: Partner - Verify Assigned Subscriptions

### Steps:
1. **Login as Partner/Chef**
   - Go to http://localhost:5173/partner/login
   - Login with chef credentials (e.g., "rotiwala")

2. **Open Dashboard**
   - Navigate to "My Subscriptions" or similar section
   - View list of subscriptions assigned to this chef

3. **Verify Delivery Info Card**
   - Each subscription should show:
     - Customer name
     - Status (active/paused)
     - "Next Delivery:" with date
     - "Delivery Time:" with time

4. **Check Date Format**
   - Expected: `"Dec 15, 2025"` or similar
   - NOT expected: `"Not scheduled"`, `"Jan 1, 1970"`

5. **Network Inspection**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Go to Subscriptions page
   - Find request to `/api/partner/subscriptions`
   - Verify response shows ISO formatted dates
   - Check that phone/address are not included (privacy check)

### Validation Points:
- ✅ Subscriptions display with valid next delivery dates
- ✅ Delivery time matches slot configuration
- ✅ No 500 errors
- ✅ Customer info properly sanitized (no phone/address exposed)
- ❌ No "Not scheduled" for active subscriptions
- ❌ No "Jan 1, 1970"

---

## Test 4: API Response Format Verification

### Using Postman/Browser Console:

1. **Get Admin Subscriptions**
```javascript
// In browser console, after login
fetch('/api/admin/subscriptions', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => {
  console.log('First subscription:', data[0]);
  console.log('nextDeliveryDate type:', typeof data[0].nextDeliveryDate);
  console.log('nextDeliveryDate value:', data[0].nextDeliveryDate);
  
  // Should be ISO string like "2025-12-15T10:30:00.000Z"
  const date = new Date(data[0].nextDeliveryDate);
  console.log('Parsed date:', date.toLocaleDateString());
});
```

2. **Get User Subscriptions**
```javascript
fetch('/api/subscriptions')
.then(r => r.json())
.then(data => {
  if (data.length > 0) {
    console.log('First subscription:', data[0]);
    console.log('nextDeliveryDate:', data[0].nextDeliveryDate);
  } else {
    console.log('No subscriptions found');
  }
});
```

3. **Get Partner Subscriptions**
```javascript
fetch('/api/partner/subscriptions', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('partner-token')}` }
})
.then(r => r.json())
.then(data => {
  if (data.length > 0) {
    console.log('First subscription:', data[0]);
    console.log('nextDeliveryDate:', data[0].nextDeliveryDate);
    console.log('Has phone?', 'phone' in data[0]); // Should be false
  }
});
```

### Expected API Response:
```json
{
  "id": "sub-12345",
  "userId": "user-xyz",
  "status": "active",
  "nextDeliveryDate": "2025-12-15T10:30:00.000Z",
  "nextDeliveryTime": "20:00",
  "isPaid": true,
  ...
}
```

### NOT Expected:
```json
{
  "nextDeliveryDate": null,
  "nextDeliveryDate": "1970-01-01T00:00:00.000Z",
  "nextDeliveryDate": 0,
  "nextDeliveryDate": undefined
}
```

---

## Test 5: Edge Cases

### Test Case: Subscription Without Slot
1. Create subscription WITHOUT selecting delivery slot
2. Verify system handles it gracefully:
   - Should show "Not scheduled" OR
   - Should show default next day
   - Should NOT show error

### Test Case: Paused Subscription
1. Pause an active subscription
2. Verify:
   - Delivery date still displays
   - Status shows "Paused"
   - Can be resumed

### Test Case: Expired Subscription
1. Check an expired/completed subscription
2. Verify:
   - Shows as "Completed" or "Expired"
   - No active delivery date shown
   - Does not appear in "Next Deliveries"

---

## Test 6: Date Validation in Frontend

### Browser Console - Direct Validation:
```javascript
// Test the validation logic
function isValidDeliveryDate(date) {
  if (!date) return false;
  try {
    const dateObj = new Date(date);
    const timestamp = dateObj.getTime();
    const year = dateObj.getFullYear();
    if (isNaN(timestamp) || year < 2020) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Test cases
console.log('2025-12-15:', isValidDeliveryDate('2025-12-15')); // true
console.log('Epoch:', isValidDeliveryDate(new Date(0))); // false
console.log('Null:', isValidDeliveryDate(null)); // false
console.log('Invalid:', isValidDeliveryDate('invalid')); // false
```

Expected Output:
```
2025-12-15: true
Epoch: false
Null: false
Invalid: false
```

---

## Debugging Checklist

If tests fail:

### Issue: "Not scheduled" appears for paid subscriptions
- [ ] Check API response in Network tab
- [ ] Verify `nextDeliveryDate` is not null in API response
- [ ] Check browser console for errors
- [ ] Verify database has valid date stored

### Issue: "Jan 1, 1970" appears
- [ ] Check API response - should be ISO string or null
- [ ] Verify date validation logic in frontend
- [ ] Check storage.ts `serializeSubscription` function is being called

### Issue: 500 error on subscription pages
- [ ] Check server logs for error message
- [ ] Look for "Invalid time value" error
- [ ] Verify all subscription records have valid nextDeliveryDate

### Issue: Different dates on different pages
- [ ] All endpoints should use same serialization logic
- [ ] Check that storage.ts is being used by all routes
- [ ] Verify no additional transformations in routes

---

## Success Criteria

All tests pass when:
1. ✅ No "Jan 1, 1970" displayed anywhere
2. ✅ No "Not scheduled" for paid subscriptions
3. ✅ Dates display as "MMM DD, YYYY" format
4. ✅ Times display in 12-hour format (AM/PM)
5. ✅ No 500 errors on subscription pages
6. ✅ API returns ISO string dates
7. ✅ All three user roles see consistent data
8. ✅ Invalid dates gracefully show as null in API
9. ✅ Frontend validates dates before displaying

---

## Quick Test Checklist

Use this quick checklist for fast verification:

- [ ] User: My Subscriptions shows valid date
- [ ] Admin: Subscriptions page shows valid dates
- [ ] Partner: My Subscriptions shows valid dates
- [ ] API: /api/admin/subscriptions returns ISO dates
- [ ] No console errors related to dates
- [ ] No "Jan 1, 1970" anywhere
- [ ] No "Not scheduled" for active paid subscriptions
- [ ] Delivery time matches selected slot time

If all boxes are checked ✅, the fix is successful!
