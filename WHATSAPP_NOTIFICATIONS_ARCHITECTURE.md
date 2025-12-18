# WhatsApp Notifications Architecture

## Overview
Implement WhatsApp notifications at key workflow steps without impacting existing functionality.

## Current WhatsApp Integration
✅ Already implemented: `server/whatsappService.ts` with Twilio integration

## Proposed Notification Flow

### 1. **User Places Order** → Admin Gets WhatsApp
```
User submits order
↓
Create order in DB
↓
Send WhatsApp to Admin: "New order #{orderId} from {userName} for ₹{amount}"
↓
Continue existing order flow
```

**Implementation:**
- Trigger: After `POST /api/orders` successfully creates order
- Recipient: Admin phone number (from settings)
- Message: Order details with link to admin dashboard

---

### 2. **Admin Approves Payment/Assigns to Chef** → Chef Gets WhatsApp
```
Admin approves payment
↓
Admin assigns to chef
↓
Send WhatsApp to Chef: "New order assigned! #{orderId}, Items: {list}, Prep time: {time}"
↓
Continue existing flow
```

**Implementation:**
- Trigger: After subscription/order assigned to chef
- Recipient: Chef's phone number
- Message: Order details + expected prep time

---

### 3. **Chef Accepts Order** → All Available Delivery Boys Get WhatsApp
```
Chef accepts order
↓
Order status = 'ready'
↓
Get all active delivery personnel
↓
Send WhatsApp to each: "Order ready for delivery! #{orderId}, Pickup from {chef}, Deliver to {address}"
↓
Continue existing flow
```

**Implementation:**
- Trigger: When chef marks order as ready
- Recipients: All active delivery personnel
- Message: Order pickup & delivery details

---

### 4. **Delivery Complete** → User Gets WhatsApp
```
Delivery person marks delivered
↓
Order status = 'delivered'
↓
Send WhatsApp to User: "Order delivered! #{orderId}, Rate your experience here: [link]"
↓
Update order in DB
```

**Implementation:**
- Trigger: When delivery marked as completed
- Recipient: User's phone number
- Message: Confirmation + rating link

---

## Technical Design

### Flow Diagram
```
User Order                Admin Notification
    ↓                            ↓
Create Order ──────→ Send WhatsApp (Admin)
    ↓
Admin Approves ────→ Send WhatsApp (Chef)
    ↓
Chef Accepts ──────→ Send WhatsApp (All Delivery Boys)
    ↓
Delivery Done ─────→ Send WhatsApp (User)
```

### Files to Modify

#### 1. `server/whatsappService.ts` (existing)
- ✅ Already has: `sendScheduledOrder2HourReminder()`
- Add new functions:
  - `sendOrderPlacedAdminNotification(orderId, userName, amount, phone)`
  - `sendChefAssignmentNotification(chefId, orderId, items, phone)`
  - `sendDeliveryAvailableNotification(deliveryPersonIds, orderId, address, phone)`
  - `sendDeliveryCompletedNotification(userId, orderId, phone)`

#### 2. `server/routes.ts`
- After order creation → call `sendOrderPlacedAdminNotification()`
- After chef assignment → call `sendChefAssignmentNotification()`

#### 3. `server/partnerRoutes.ts`
- After chef accepts order → call `sendDeliveryAvailableNotification()`

#### 4. `server/deliveryRoutes.ts`
- After marking delivered → call `sendDeliveryCompletedNotification()`

---

## Data Required

### Admin Settings
```typescript
interface AdminSettings {
  adminPhoneNumber: string;  // For order notifications
  enableWhatsAppNotifications: boolean;
}
```

### Chef Profile
```typescript
// Already exists, just ensure phone is populated
chefPhoneNumber: string;
```

### User Profile
```typescript
// Already exists, just ensure phone is populated
userPhoneNumber: string;
```

### Delivery Personnel
```typescript
// Already exists
deliveryPersonnelPhoneNumber: string;
isActive: boolean;
```

---

## Implementation Safety

### ✅ No Breaking Changes
1. **All new** - Creating new WhatsApp functions
2. **Optional** - Can be toggled via admin settings
3. **Non-blocking** - Notifications sent async (fire and forget)
4. **Error Handling** - WhatsApp failures don't stop order flow

### Error Handling Strategy
```typescript
try {
  await sendWhatsAppNotification(...);
} catch (error) {
  console.error("WhatsApp notification failed (non-critical):", error);
  // Don't throw - order flow continues normally
}
```

---

## Database Changes Needed

### Add to AdminSettings table (if not exists)
```sql
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS admin_phone_number VARCHAR(20);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS enable_whatsapp_notifications BOOLEAN DEFAULT true;
```

---

## Testing Strategy

### Test Each Step
1. ✅ Place order → Check admin receives WhatsApp
2. ✅ Admin assigns → Check chef receives WhatsApp
3. ✅ Chef accepts → Check all delivery boys receive WhatsApp
4. ✅ Mark delivered → Check user receives WhatsApp

### Verification
- Phone numbers in database
- WhatsApp credits available
- Message templates clear and helpful
- No duplicate messages

---

## Benefits
✅ Real-time notifications for all stakeholders
✅ Reduced manual follow-ups
✅ Better order tracking visibility
✅ Improved user engagement
✅ Non-breaking implementation

---

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| WhatsApp API rate limits | Batch notifications, implement queue system |
| Missing phone numbers | Validate before sending, skip gracefully |
| Wrong numbers | Admin settings validation, phone verification |
| Cost increase | Monitor usage, set daily limits if needed |

---

## Next Steps
1. ✅ Approve architecture
2. Implement WhatsApp functions
3. Update routes/handlers
4. Add admin settings UI
5. Test each workflow
6. Deploy with monitoring
