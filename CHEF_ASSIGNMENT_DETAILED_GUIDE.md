# Chef Assignment Modal - Visual Guide

## UI Flow

```
Admin Dashboard
    ↓
Subscriptions Tab
    ↓
┌─────────────────────────────────────────────┐
│ PENDING PAYMENT VERIFICATION (1)             │
│                                             │
│ tanveer                  Awaiting Verification
│ Plan: Weekly                                │
│ Phone: 9999999999                          │
│ Amount: ₹100                               │
│ Transaction ID: TXID76E1030387I7           │
│ Submitted: December 7th, 2025 at 5:33 PM  │
│                                            │
│                    [Verify & Activate] ←─── CLICK HERE
│                                            │
└─────────────────────────────────────────────┘
                    ↓
            ┌──────────────────┐
            │ MODAL APPEARS    │
            ├──────────────────┤
            │ Assign Chef to   │
            │ Subscription     │
            │                  │
            │ tanveer -        │
            │ Weekly           │
            │                  │
            │ Select Chef *    │
            │ ┌──────────────┐ │
            │ │ Choose chef  │ │ ← SELECT CHEF
            │ │ ↓            │ │
            │ │ Chef 1       │ │
            │ │ Chef 2       │ │
            │ │ Chef 3       │ │
            │ └──────────────┘ │
            │                  │
            │ You can change   │
            │ later            │
            │                  │
            │ [Cancel]         │
            │ [Assign & Act...]│ ← CLICK TO ASSIGN
            └──────────────────┘
                    ↓
            ✅ Success!
            Chef assigned and
            subscription activated
```

## Step-by-Step Instructions

### Step 1: Navigate to Subscriptions
- Click **Admin Menu** → **Subscriptions**

### Step 2: Find Pending Payment Section
Look for the card titled:
```
🧑‍💼 Pending Payment Verification (X)
```

### Step 3: Click Verify & Activate
In the pending subscription card, find the orange button:
```
[Verify & Activate]
```
Click it!

### Step 4: Select Chef (Modal Opens)
A dialog box will appear with:
- Subscription name and plan
- Chef selection dropdown
- Cancel and Assign & Activate buttons

### Step 5: Choose Chef
Click the dropdown to see all available chefs:
```
Select Chef *
┌─────────────────┐
│ Chef 1          │
│ Chef 2          │
│ Chef 3          │
│ Chef 4          │
└─────────────────┘
```

### Step 6: Confirm Assignment
Click **[Assign & Activate]** button

### Result
- ✅ Chef is assigned to subscription
- ✅ Payment is confirmed
- ✅ Subscription is activated
- ✅ Delivery schedule begins

---

## What If I Don't See the Modal?

### Reason 1: Chef Already Assigned
If the subscription already has a chef:
- Modal won't appear
- Payment will be directly confirmed

**Solution:** Look in "Active Subscriptions" section and click "Reassign Chef" if you need to change it

### Reason 2: No Chefs Available
If there are no active chefs in the system:
- Modal will appear but dropdown will be empty

**Solution:** 
1. Go to **Admin → Chefs**
2. Create or activate chefs
3. Try again

### Reason 3: Page Not Refreshed
If changes don't appear after activation:
- Refresh the page (F5 or Ctrl+R)

---

## After Activation

### In Active Subscriptions
Once activated, the subscription will move to the "Active Subscriptions" section where you can:
- **Pause/Resume** the subscription
- **Adjust Deliveries** quantity and dates
- **Reassign Chef** if needed
- **View Schedule** of deliveries
- **Delete** the subscription

### Change Chef Later
If you assigned wrong chef and need to change:
1. Find subscription in "Active Subscriptions"
2. Click **"Reassign Chef"** button
3. Select new chef
4. Click **"Save"**

---

## Chef Load Balancing

### Auto-Assignment Smart Logic
If you DON'T manually assign a chef:
- System finds the chef with least active subscriptions
- Ensures fair distribution of work
- Example:
  - Chef A: 5 active subscriptions
  - Chef B: 2 active subscriptions
  - Chef C: 3 active subscriptions
  - → New subscription will be assigned to **Chef B** (least busy)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Modal doesn't appear | Chef might already be assigned - check active subscriptions |
| Modal shows but can't select chef | Click the dropdown field - it should expand |
| "Assign & Activate" button disabled | Make sure a chef is selected |
| Got error after clicking button | Check internet connection and try again |
| Subscription doesn't appear in active list | Refresh the page |

---

## Tips & Best Practices

✅ **DO:**
- Always manually assign for important categories like Roti
- Check chef availability before assignment
- Reassign if chef becomes unavailable later

❌ **DON'T:**
- Assign same chef to too many subscriptions
- Forget to activate payment before expecting delivery
- Skip chef assignment if manual assignment is available

---

## Need Help?

If you still don't see the modal or can't assign chef:
1. Check browser console for errors (F12)
2. Verify you have admin access
3. Refresh the page completely
4. Check if chefs are created and marked as active
5. Contact support with:
   - Subscription ID
   - Screenshot of the screen
   - Error message (if any)
