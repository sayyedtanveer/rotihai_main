# Chef Assignment - Quick Guide

## Where to Assign Chef

### For Pending Payment Subscriptions

1. Go to **Admin → Subscriptions** tab
2. Look for **"Pending Payment Verification"** section
3. Find the subscription you want to activate
4. Click **"Verify & Activate"** button

### What Happens Next

**If no chef is assigned yet:**
- A modal will pop up asking you to select a chef
- Choose the chef from the dropdown list
- Click **"Assign & Activate"**
- The system will:
  - Assign the selected chef to the subscription
  - Confirm the payment
  - Activate the subscription

**If chef was already assigned:**
- Payment will be directly confirmed
- Subscription will be activated

---

## For Active Subscriptions

If you need to **change/reassign chef** for an already active subscription:

1. Go to **Admin → Subscriptions** tab
2. Find the active subscription in the list
3. Click **"Reassign Chef"** button
4. Select new chef from dropdown
5. Click **"Save"**

---

## Which Subscriptions Need Chef Assignment?

Currently, **ALL subscriptions** will show the chef selection modal if they don't have a chef assigned yet.

This is especially important for:
- **Roti** (multiple chefs available)
- **Other multi-chef categories**

---

## Auto-Assignment Fallback

If you activate without manually assigning a chef:
- System will automatically assign the chef with the **least number of active subscriptions**
- This ensures fair load distribution across chefs
- You can still manually reassign later if needed

---

## Troubleshooting

**I don't see the chef selection modal:**
- Make sure the subscription doesn't have a chef already assigned
- Check if you clicked "Verify & Activate" button
- Refresh the page if needed

**The modal appears but chefs list is empty:**
- No active chefs available in the system
- Go to **Admin → Chefs** and check if any chefs are marked as active

**Want to skip chef assignment:**
- Click "Cancel" on the modal
- Chef will be auto-assigned when you try again or during confirmation
