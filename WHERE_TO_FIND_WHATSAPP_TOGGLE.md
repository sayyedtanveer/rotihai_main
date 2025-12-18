# 🎯 Where to Find WhatsApp Toggle

## Step-by-Step Guide

### Step 1: Open Admin Panel
```
Your Admin URL: /admin/dashboard
```

### Step 2: Look at Left Sidebar
```
┌──────────────────────────┐
│ Admin Panel              │
├──────────────────────────┤
│ 🏠 Dashboard             │
│ 📦 Orders                │
│ 💳 Payments              │
│ 📝 Products              │
│ 👨‍🍳 Chefs                │
│ ...                      │
│ 🔔 Notifications         │  ← Old notifications page
│ 📊 Reports               │
│ ...                      │
│ 📱 SMS Settings          │  ← SMS toggle only
│ 👁️ Visitor Analytics    │
│ 🔔 Notification Settings │  ← ✅ NEW! Both toggles here
│ 🚪 Logout                │
└──────────────────────────┘
```

### Step 3: Click "Notification Settings"
```
Look for Bell icon (🔔) and "Notification Settings" text
```

---

## What You'll See

```
┌─────────────────────────────────────────────────┐
│  Notification Settings                  [Bell] │
│  Configure how order notifications are sent     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 📱 WhatsApp Notifications      [Toggle]   │  │ ← Click here
│  │ ✅ WhatsApp notifications ENABLED         │  │
│  │                                            │  │
│  │ 📱 When user places order → Admin SMS    │  │
│  │ 📱 When assigned to chef → Chef SMS      │  │
│  │ 📱 When ready for delivery → Delivery SMS│  │
│  │ 📱 When delivered → Customer SMS         │  │
│  │                                            │  │
│  │ 💰 Cost: ₹0.50-1.50 per message          │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 📱 SMS Notifications        [Toggle]      │  │ ← Or here
│  │ ❌ SMS notifications DISABLED              │  │
│  │                                            │  │
│  │ (Configuration fields show when ON)       │  │
│  │                                            │  │
│  │ 💰 Cost: ₹0.20-0.50 per SMS              │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Comparison Table]                             │
│  [Save Button]                                  │
└─────────────────────────────────────────────────┘
```

---

## Toggle Interaction

### WhatsApp Toggle ON (Default)
```
┌──────────────────────────────────────┐
│ 📱 WhatsApp Notifications            │
│                          [●] ← Enabled
│ ✅ WhatsApp notifications ENABLED    │
│                                      │
│ Cost: ₹0.50-1.50 per message         │
│ Status: Orders notify via WhatsApp   │
└──────────────────────────────────────┘
```

### WhatsApp Toggle OFF
```
┌──────────────────────────────────────┐
│ 📱 WhatsApp Notifications            │
│                          [O] ← Disabled
│ ❌ WhatsApp notifications DISABLED   │
│                                      │
│ Cost: ₹0.50-1.50 per message         │
│ Status: Will use SMS (if enabled)    │
└──────────────────────────────────────┘
```

### SMS Toggle ON (Optional)
```
┌──────────────────────────────────────┐
│ 📱 SMS Notifications (Alternative)   │
│                          [●] ← Enabled
│ ✅ SMS notifications ENABLED         │
│                                      │
│ SMS Gateway Provider:                │
│ [Twilio            ▼]  ← Dropdown    │
│                                      │
│ From Number / Sender ID:             │
│ [__________________]  ← Input field  │
│                                      │
│ API Key / Auth Token:                │
│ [••••••••••••••••]  ← Password field  │
│                                      │
│ Cost: ₹0.20-0.50 per SMS             │
└──────────────────────────────────────┘
```

---

## Menu Path Visual

```
Browser Address Bar
         ↓
/admin/notification-settings
         ↓
AdminNotificationSettings Component
         ↓
┌─────────────────────────────┐
│ Notification Settings Page  │
│                             │
│ [WhatsApp Toggle] [SMS Toggle]
│ [Comparison Table]          │
│ [Save Button]               │
└─────────────────────────────┘
```

---

## Location in Sidebar

```
Sidebar Layout:
┌─────────────────────────┐
│ Admin Panel             │
├─────────────────────────┤
│ 🏠 Dashboard            │
│ 📦 Orders               │
│ 💳 Payments             │
│ ...                     │
│ ─────────────────────   │ ← Divider
│ 🔔 Notifications        │ (Reports section)
│ 📊 Reports              │
│ ...                     │
│ ─────────────────────   │ ← Divider
│ 📱 SMS Settings         │ (Settings section)
│ 👁️ Visitor Analytics   │
│ 🔔 Notification Settings│ ← ✅ YOU ARE HERE
│ 🚪 Logout               │
└─────────────────────────┘
```

---

## Quick Access

**Fastest Way to Access:**

1. **Type in URL bar:**
   ```
   /admin/notification-settings
   ```

2. **Or Click Sidebar:**
   - Look for Bell icon (🔔)
   - Text says "Notification Settings"
   - Click it!

3. **Or Search:**
   - Use Ctrl+F
   - Search: "Notification"
   - Should find the menu item

---

## What Each Toggle Controls

### WhatsApp Toggle
```
Controls: Order notifications via WhatsApp
When ON:  ✅ Orders send WhatsApp to admins/chefs/delivery/customers
When OFF: ❌ WhatsApp notifications stop
Price:    ₹0.50-1.50 per message
```

### SMS Toggle
```
Controls: Order notifications via SMS
When ON:  ✅ Orders send SMS to admins/chefs/delivery/customers
When OFF: ❌ SMS notifications stop  
Price:    ₹0.20-0.50 per message
Requires: SMS provider credentials
```

---

## Comparison Table on Page

```
┌──────────────────────────────────────┐
│ Feature          | WhatsApp | SMS    │
├──────────────────────────────────────┤
│ Cost/message     | ₹0.50-1.50 | ₹0.20-0.50 │
│ Speed            | ⚡ Instant | ⚡ Instant │
│ Rich media       | ✅ Yes | ❌ No     │
│ Works globally   | ✅ Yes | ✅ Yes     │
│ Best for         | Premium | Budget  │
└──────────────────────────────────────┘
```

---

## Current Settings Display

After you save, you'll see:

```
┌────────────────────────────────────┐
│ Current Configuration              │
├────────────────────────────────────┤
│ WhatsApp: ✅ Enabled               │
│ SMS: ❌ Disabled                    │
│ Last Updated: 2024-12-16 10:30 AM │
└────────────────────────────────────┘
```

---

## Save & Validation

### When You Click "Save Settings"

**Valid (Both or One):**
- ✅ WhatsApp ON + SMS OFF → Allowed
- ✅ WhatsApp OFF + SMS ON (configured) → Allowed  
- ✅ WhatsApp ON + SMS ON → Allowed

**Invalid (Neither):**
- ❌ WhatsApp OFF + SMS OFF → ERROR

**Error Message:**
```
"At least one notification method must be enabled"
```

---

## Summary

**To toggle WhatsApp:**

1. Admin Panel → Notification Settings
2. Click WhatsApp toggle ON/OFF
3. Click "Save Settings"
4. Done! Status updates immediately

**That's it!** No coding, just admin UI toggles.
