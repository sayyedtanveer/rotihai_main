# Subscription Pause/Resume Functionality Analysis

## 1. Pause/Resume Endpoints

### Customer-Facing Endpoints (User)
Located in [server/routes.ts](server/routes.ts) (*requires user authentication*)

#### **POST /api/subscriptions/:id/pause**
**Purpose**: User can pause their subscription with optional auto-resume date
**File**: [server/routes.ts](server/routes.ts#L3382)

```typescript
app.post("/api/subscriptions/:id/pause", requireUser(), async (req: AuthenticatedUserRequest, res) => {
  // Parameters:
  // - pauseStartDate (optional): When pause starts (defaults to today)
  // - pauseResumeDate (optional): When pause auto-resumes (null = indefinite pause)
  
  // Actions performed:
  // 1. Validates user ownership of subscription
  // 2. Marks all delivery logs between pause dates as "skipped"
  // 3. Sets subscription status to "paused"
  // 4. Extends endDate by pause duration to maintain total delivery count
  // 5. Generates new delivery logs for extended period
  // 6. Logs: "⏸️ Subscription paused" with details
});
```

**Request Body**:
```javascript
{
  pauseStartDate: "2026-03-16" or null (defaults to today),  // ISO date string
  pauseResumeDate: "2026-03-31" or null                       // null = indefinite pause
}
```

**Response**: Updated subscription object
```javascript
{
  id: "sub-xxx",
  status: "paused",
  pauseStartDate: "2026-03-16T00:00:00Z",
  pauseResumeDate: "2026-03-31T00:00:00Z",
  endDate: "extended_date",  // Extended by pause duration
  // ... other subscription fields
}
```

#### **POST /api/subscriptions/:id/resume**
**Purpose**: User can manually resume a paused subscription
**File**: [server/routes.ts](server/routes.ts#L3505)

```typescript
app.post("/api/subscriptions/:id/resume", requireUser(), async (req: AuthenticatedUserRequest, res) => {
  // Actions performed:
  // 1. Validates user ownership
  // 2. Clears pause dates
  // 3. Changes status back to "active"
  // 4. Logs: "▶️ Subscription resumed"
});
```

**Request Body**: Empty `{}`

**Response**: Updated subscription with status = "active"

### Admin Endpoint
Located in [server/adminRoutes.ts](server/adminRoutes.ts#L2450) (*requires admin authentication*)

#### **PATCH /api/admin/subscriptions/:subscriptionId/status**
**Purpose**: Admin can change subscription status directly (pause/unpause/cancel)
**File**: [server/adminRoutes.ts](server/adminRoutes.ts#L2450)

```typescript
app.patch("/api/admin/subscriptions/:subscriptionId/status", requireAdmin(), async (req: AuthenticatedAdminRequest, res) => {
  // Parameters:
  // - status: "active" | "paused" | "cancelled"
  
  // Actions:
  // 1. Validates status value
  // 2. If status === "paused":
  //    - Sets pauseStartDate = new Date()
  // 3. If status === "active":
  //    - Clears pauseStartDate = null
  //    - Clears pauseResumeDate = null
  // 4. Logs: "📋 Admin changed subscription status to: {status}"
});
```

**Request Body**:
```javascript
{
  status: "paused" | "active" | "cancelled"
}
```

---

## 2. Subscription Status Values

Defined in [shared/schema.ts](shared/schema.ts#L289)

```typescript
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending",      // Awaiting payment verification
  "active",       // Actively receiving deliveries
  "paused",       // Temporarily paused, can resume
  "cancelled",    // Permanently cancelled
  "expired"       // Subscription period ended
]);
```

**Status Lifecycle**:
```
pending → active ↔ paused → cancelled
           ↓                    ↑
        expired (auto) ←────────┘
```

---

## 3. Broadcast/Notification Logic

### WebSocket Broadcast Function
Located in [server/websocket.ts](server/websocket.ts#L199)

#### **broadcastSubscriptionUpdate(subscription: any)**
Broadcasts subscription status changes to all connected clients.

**Recipients**:
1. **All Admins** - Receive subscription updates
2. **Assigned Chef** - Only if `subscription.chefId` exists
3. **Customer** - Only if `subscription.userId` matches
4. **Browsers** - Unauthenticated browser connections

**Broadcast Details**:
```typescript
export function broadcastSubscriptionUpdate(subscription: any) {
  // Converts all date fields to ISO strings
  // Broadcasts message type: "subscription_update"
  
  // Logging output:
  // 📡 ========== BROADCASTING SUBSCRIPTION UPDATE ==========
  // Subscription ID: {id}
  // Customer: {name}
  // Chef ID: {chefId}
  // Status: {status}
  // 📊 Broadcast Summary:
  //   - Admins notified: {count}
  //   - Chef notified: YES/NO
  //   - Customer notified: YES/NO
  
  // Pending broadcast saved for offline chef
  if (subscription.chefId) {
    savePendingBroadcast(subscription.chefId, "chef", "subscription_update", data);
  }
}
```

**Message Format**:
```json
{
  "type": "subscription_update",
  "data": {
    "id": "sub-xxx",
    "customerName": "...",
    "chefId": "chef-xxx",
    "status": "paused",
    "pauseStartDate": "2026-03-16T00:00:00Z",
    "pauseResumeDate": "2026-03-31T00:00:00Z",
    // ... other fields as ISO strings
  }
}
```

### Current Broadcast Behavior

**When Pause Status is Changed**:
- ✅ Admin receives update
- ✅ Assigned chef receives update  
- ✅ Customer receives update
- ✅ Browser receives update
- ✅ Offline chef receives pending broadcast

**⚠️ Important**: The pause endpoint (`POST /api/subscriptions/:id/pause`) in routes.ts **DOES NOT** call `broadcastSubscriptionUpdate()`. The broadcast only happens when using the admin endpoint.

**Related Broadcasts**:
- `broadcastSubscriptionDelivery()` - Sent when subscription deliveries are scheduled
- `broadcastNewSubscriptionToAdmin()` - Sent when new subscription created
- `broadcastSubscriptionAssignmentToPartner()` - Sent when chef assigned

---

## 4. Database Schema - Pause Related Fields

Located in [shared/schema.ts](shared/schema.ts#L346)

```typescript
// In subscriptions table:
status: subscriptionStatusEnum("status").notNull().default("active")
pauseStartDate: timestamp("pause_start_date")      // When pause started
pauseResumeDate: timestamp("pause_resume_date")    // When to auto-resume
```

**Field Details**:
| Field | Type | Purpose | 
|-------|------|---------|
| `status` | enum('pending','active','paused','cancelled','expired') | Current subscription state |
| `pauseStartDate` | timestamp | When subscription was paused |
| `pauseResumeDate` | timestamp | When pause automatically ends (null = indefinite) |

**Related Fields** (used for pause management):
- `nextDeliveryDate` - Updated when resuming
- `endDate` - Extended by pause duration to maintain total deliveries
- `remainingDeliveries` - Skipped deliveries during pause are counted as used

---

## 5. Delivery Log Handling During Pause

When a subscription is paused, delivery logs are marked as "skipped":

**Subscription Delivery Log Status Values**:
```typescript
const DELIVERY_LOG_STATUS = {
  SCHEDULED: "scheduled",
  PREPARING: "preparing", 
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  MISSED: "missed",
  SKIPPED: "skipped"  // ← Set during pause
};
```

**Pause Logic** ([server/routes.ts](server/routes.ts#L3420)):
1. All logs between `pauseStartDate` and `pauseResumeDate` are marked as "skipped"
2. No notifications sent to chefs for skipped deliveries
3. Customer doesn't lose remaining deliveries (end date extended)

---

## 6. Admin Routes - Subscription Management

Located in [server/adminRoutes.ts](server/adminRoutes.ts)

**Admin Subscription Endpoints**:
```
GET  /api/admin/subscriptions              - List all subscriptions
GET  /api/admin/subscriptions/today        - Today's delivery overview
GET  /api/admin/subscriptions/missed-deliveries - Missed deliveries
PATCH /api/admin/subscriptions/:id/status - Change status (pause/resume/cancel)
PATCH /api/admin/subscriptions/:id/assign-chef - Assign chef to subscription
POST /api/admin/subscriptions/:id/adjust   - Adjust remaining deliveries
DELETE /api/admin/subscriptions/:id        - Delete subscription
```

---

## Current Issues & Gaps

### ⚠️ Broadcasting Issue
**Customer-facing pause endpoint** (`POST /api/subscriptions/:id/pause`) does NOT trigger broadcasts:
- Admins are NOT notified when user pauses
- Chefs are NOT notified to skip deliveries  
- Only admin pause endpoint triggers broadcast

**Recommendation**: Add broadcast call after pause:
```typescript
// In user pause endpoint
const updated = await storage.updateSubscription(req.params.id, updateData);

// ADD THIS:
const { broadcastSubscriptionUpdate } = await import("./websocket");
broadcastSubscriptionUpdate(updated);

res.json(updated);
```

### Auto-Resume Implementation ✅
Located in [server/cronJobs.ts](server/cronJobs.ts#L47)

```typescript
export async function autoResumeSubscriptions(): Promise<void> {
  // Runs every 5 minutes as part of scheduled tasks
  // Finds all paused subscriptions where pauseResumeDate <= now
  // Automatically resumes them by setting status = "active"
  
  const pausedSubscriptions = await db.query.subscriptions.findMany({
    where: (s, { and, eq, lte, isNotNull }) => and(
      eq(s.status, "paused"),
      isNotNull(s.pauseResumeDate),
      lte(s.pauseResumeDate, now)  // resumeDate is in the past
    ),
  });

  for (const subscription of pausedSubscriptions) {
    await db.update(subscriptions).set({
      status: "active",
      pauseStartDate: null,
      pauseResumeDate: null,
      updatedAt: now,
    });
    
    console.log(`▶️ Auto-resumed subscription ${subscription.id}`);
  }
}
```

**Cron Job Schedule**:
- Runs every 5 minutes
- Called from `runScheduledTasks()` which executes:
  1. autoResumeSubscriptions()
  2. generateDailyDeliveryLogs()
  3. updateNextDeliveryDates()
  4. markStaleDeliveriesAsMissed()
  5. sendScheduledOrder2HourNotifications()

### ⚠️ No Email Notifications
- No email sent to customer when pausing
- No email sent to customer when auto-resuming
- No email/SMS to chef about paused deliveries
- **Email disabled for subscriptions**: `SEND_SUBSCRIPTION_EMAILS = false` in routes.ts

### ⚠️ No Broadcast on Auto-Resume
- Auto-resume happens silently through cron job
- **No WebSocket broadcast** to notify customers/chefs
- Customers won't know subscription was auto-resumed until next delivery

---

## 7. Admin UI Implementation

Located in [client/src/pages/admin/AdminSubscriptions.tsx](client/src/pages/admin/AdminSubscriptions.tsx)

**Pause/Resume Buttons**:
```typescript
// Quick toggle buttons in Active Subscriptions tab
{sub.status === "active" ? (
  <Button onClick={() => changeStatusMutation.mutate({ subscriptionId: sub.id, status: "paused" })}>
    <Pause className="w-3 h-3" />
  </Button>
) : (
  <Button onClick={() => changeStatusMutation.mutate({ subscriptionId: sub.id, status: "active" })}>
    <Play className="w-3 h-3" />
  </Button>
)}
```

**Display Information**:
```typescript
{sub.pauseStartDate && (
  <div className="mt-2 text-xs text-amber-600">
    Paused since: {format(new Date(sub.pauseStartDate), "PPP")}
    {sub.pauseResumeDate && ` • Auto-resume: ${format(new Date(sub.pauseResumeDate), "PPP")}`}
  </div>
)}
```

---

## Summary Table

| Feature | Implementation | Status |
|---------|-----------------|--------|
| User pause subscription | POST /api/subscriptions/:id/pause | ✅ Implemented |
| User resume subscription | POST /api/subscriptions/:id/resume | ✅ Implemented |
| Admin pause/resume | PATCH /api/admin/subscriptions/:id/status | ✅ Implemented |
| Broadcast to admins | broadcastSubscriptionUpdate() | ✅ Works (admin endpoint only) |
| Broadcast to chef | broadcastSubscriptionUpdate() | ✅ Works (admin endpoint only) |
| Broadcast to customer | broadcastSubscriptionUpdate() | ⚠️ Missing from user endpoint |
| Email notification | sendEmail() | ❌ Disabled (SEND_SUBSCRIPTION_EMAILS=false) |
| Auto-resume implementation | autoResumeSubscriptions() cron job | ✅ Implemented (runs every 5 min) |
| Broadcast on auto-resume | broadcastSubscriptionUpdate() | ❌ Not called in cron job |

---

## Recommendations

1. **Add WebSocket broadcast to user pause endpoint** - Notify admins/chefs when customers pause
2. **Add broadcast to auto-resume cron job** - Notify customers when subscription auto-resumes
   ```typescript
   // In cronJobs.ts autoResumeSubscriptions():
   const { broadcastSubscriptionUpdate } = await import("./websocket");
   broadcastSubscriptionUpdate(updatedSubscription);
   ```
3. **Enable email notifications** - Set `SEND_SUBSCRIPTION_EMAILS = true` and add pause/resume email templates
4. **Create dedicated pause reason field** - Track why user paused (holiday, busy, etc.)
5. **Add pause duration limit** - Prevent indefinite pauses, suggest max duration (e.g., 90 days)
6. **Add refund logic for pause** - Consider partial refunds for paused periods
7. **Add notification on auto-resume** - Send popup/email when subscription auto-resumes
