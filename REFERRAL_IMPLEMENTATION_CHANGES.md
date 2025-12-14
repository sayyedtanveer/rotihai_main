# Referral System - Implementation Code Changes

This file contains all the code changes needed to fix the referral system.
These changes should be applied to the files listed.

---

## CHANGE SET 1: server/routes.ts - POST /api/orders endpoint

**Location:** After user auto-registration, before order creation (around line 1590)

**ADD THIS CODE** - After the user creation/fetch logic, add referral code application:

```typescript
    // Apply referral code if provided (new user only)
    if (referralCode && userId && accountCreated) {
      try {
        await storage.applyReferralBonus(referralCode.trim().toUpperCase(), userId);
        console.log(`✅ Referral code ${referralCode} applied to new user ${userId}`);
      } catch (referralError: any) {
        console.warn(`⚠️ Failed to apply referral code: ${referralError.message}`);
        // Don't fail the order if referral fails - it's optional
      }
    }
```

**MODIFY THIS** - In POST /api/orders endpoint signature, add referralCode parameter:

```typescript
// BEFORE: 
const orderPayload: any = {
  ...result.data,
  paymentStatus: "pending",
  userId,
};

// AFTER:
const orderPayload: any = {
  ...result.data,
  paymentStatus: "pending",
  userId,
  referralCode: req.body.referralCode || undefined,
};
```

**MODIFY RESPONSE** - When order created successfully, include applied referral bonus:

```typescript
// After successful order creation:
let appliedReferralBonus = 0;
if (result.accountCreated && req.body.referralCode) {
  // Check if referral was applied by querying wallet transactions
  const transactions = await storage.getWalletTransactions(userId, 1);
  const referralTransaction = transactions.find(t => t.type === 'referral_bonus');
  if (referralTransaction) {
    appliedReferralBonus = referralTransaction.amount;
  }
}

res.json({
  id: order.id,
  accountCreated,
  accountDetails: accountCreated ? { defaultPassword: generatedPassword } : undefined,
  appliedReferralBonus,
  // ...rest of response
});
```

---

## CHANGE SET 2: server/storage.ts - Referral completion hook

**ADD THIS METHOD:**

```typescript
  async completeReferralOnOrderDelivery(userId: string, orderId: string): Promise<void> {
    // Only complete referral when order is delivered (not just created)
    // This is called when order status changes to "delivered"
    
    const referral = await db.query.referrals.findFirst({
      where: (r, { and, eq: eqOp }) => and(
        eqOp(r.referredId, userId),
        eqOp(r.status, "pending")
      ),
    });

    if (!referral) {
      return; // No pending referral or already completed
    }

    await db.transaction(async (tx) => {
      const settings = await this.getActiveReferralReward();
      if (!settings?.isActive) {
        console.log("⚠️ Referral system disabled, skipping completion");
        return;
      }

      const expiryDays = settings.expiryDays || 30;

      // Check if referral has expired
      const referralDate = new Date(referral.createdAt);
      const expiryDate = new Date(referralDate);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      if (new Date() > expiryDate) {
        await tx.update(referrals)
          .set({ status: "expired" })
          .where(eq(referrals.id, referral.id));
        console.log(`⏰ Referral ${referral.id} expired, not completing`);
        return;
      }

      // Check monthly earnings limit
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const completedThisMonth = await tx.query.referrals.findMany({
        where: (r, { and, eq: eqOp, gte: gteOp }) => and(
          eqOp(r.referrerId, referral.referrerId),
          eqOp(r.status, "completed"),
          gteOp(r.createdAt, startOfMonth)
        ),
      });

      const monthlyEarnings = completedThisMonth.reduce((sum, r) => sum + r.referrerBonus, 0);
      const canAwardBonus = monthlyEarnings + referral.referrerBonus <= (settings.maxEarningsPerMonth || 500);

      // Mark referral as completed
      await tx.update(referrals)
        .set({
          status: "completed",
          referredOrderCompleted: true,
          completedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id));

      // Award bonus to referrer if within monthly limit
      if (canAwardBonus) {
        await this.createWalletTransaction({
          userId: referral.referrerId,
          amount: referral.referrerBonus,
          type: "referral_bonus",
          description: `Referral bonus - ${referral.referralCode} completed first order`,
          referenceId: referral.id,
          referenceType: "referral",
        }, tx);

        console.log(`✅ Referral completed: ${referral.referralCode} awarded ₹${referral.referrerBonus} to referrer`);
      } else {
        console.log(`⚠️ Monthly earnings limit reached, bonus not awarded for ${referral.referralCode}`);
      }
    });
  }
```

**MODIFY updateOrderDelivery METHOD** to include referral completion:

```typescript
// AFTER delivery is marked as delivered in updateOrderDelivery:

async updateOrderDelivery(orderId: string): Promise<Order | undefined> {
  const order = await this.getOrderById(orderId);
  if (!order) return undefined;

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "delivered",
      deliveredAt: new Date()
    })
    .where(eq(orders.id, orderId))
    .returning();

  if (order.assignedTo) {
    await db.update(deliveryPersonnel)
      .set({
        status: "available",
        totalDeliveries: sql`${deliveryPersonnel.totalDeliveries} + 1`
      })
      .where(eq(deliveryPersonnel.id, order.assignedTo));
  }

  // ✅ NEW: Complete referral when order delivered
  if (order.userId) {
    try {
      await this.completeReferralOnOrderDelivery(order.userId, orderId);
    } catch (err: any) {
      console.error("⚠️ Error completing referral:", err.message);
      // Don't fail the order update if referral completion fails
    }
  }

  return updatedOrder;
}
```

---

## CHANGE SET 3: server/storage.ts - getReferralStats auto-expiry

**REPLACE getReferralStats METHOD:**

```typescript
async getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  expiredReferrals: number;
  totalEarnings: number;
  referralCode: string;
}> {
  const user = await this.getUser(userId);
  if (!user) throw new Error("User not found");

  const referralCode = user.referralCode || "";
  const settings = await this.getActiveReferralReward();
  const expiryDays = settings?.expiryDays || 30;

  let allReferrals = await db.query.referrals.findMany({
    where: (r, { eq }) => eq(r.referrerId, userId),
  });

  // Auto-expire pending referrals
  const now = new Date();
  for (const referral of allReferrals) {
    if (referral.status === "pending") {
      const createdDate = new Date(referral.createdAt);
      const expiryDate = new Date(createdDate);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      if (now > expiryDate) {
        await db.update(referrals)
          .set({ status: "expired" })
          .where(eq(referrals.id, referral.id));
        referral.status = "expired";
        console.log(`⏰ Auto-expired referral ${referral.id}`);
      }
    }
  }

  const totalReferrals = allReferrals.length;
  const pendingReferrals = allReferrals.filter(r => r.status === "pending").length;
  const completedReferrals = allReferrals.filter(r => r.status === "completed").length;
  const expiredReferrals = allReferrals.filter(r => r.status === "expired").length;
  const totalEarnings = allReferrals
    .filter(r => r.status === "completed")
    .reduce((sum, r) => sum + r.referrerBonus, 0);

  return {
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    expiredReferrals,
    totalEarnings,
    referralCode,
  };
}
```

---

## CHANGE SET 4: server/routes.ts - Apply referral response

**MODIFY POST /api/user/apply-referral endpoint:**

```typescript
app.post("/api/user/apply-referral", requireUser(), async (req: AuthenticatedUserRequest, res) => {
  try {
    const userId = req.authenticatedUser!.userId;
    const { referralCode } = req.body;

    if (!referralCode) {
      res.status(400).json({ message: "Referral code is required" });
      return;
    }

    // Check if system is enabled
    const settings = await storage.getActiveReferralReward();
    if (!settings?.isActive) {
      res.status(400).json({ message: "Referral system is currently disabled" });
      return;
    }

    await storage.applyReferralBonus(referralCode, userId);
    
    const bonus = settings.referredBonus || 50;
    res.json({ 
      message: "Referral bonus applied successfully", 
      bonus,
      note: "Bonus is credited to your wallet. It will be available for your next order."
    });
  } catch (error: any) {
    console.error("Error applying referral:", error);
    res.status(400).json({ message: error.message || "Failed to apply referral" });
  }
});
```

---

## CHANGE SET 5: server/storage.ts - applyReferralBonus improvements

**MODIFY applyReferralBonus METHOD** to check system enabled:

```typescript
// At the start of applyReferralBonus, add:
const settings = await this.getActiveReferralReward();
if (!settings?.isActive) {
  throw new Error("Referral system is currently disabled");
}
```

---

## CHANGE SET 6: client/src/components/CheckoutDialog.tsx

**ADD** to the order payload when creating order:

```typescript
// In the handleCreateOrder function, add referralCode to the payload:

const payloadToSend = {
  customerName: formData.customerName,
  phone: formData.phone,
  email: formData.email,
  address: formData.address,
  items: cartItems,
  subtotal: formData.subtotal,
  total: formData.total,
  deliveryFee: formData.deliveryFee,
  couponCode: couponCode || undefined,
  categoryId: cart?.categoryId,
  categoryName: cart?.categoryName,
  deliverySlotId: formData.deliverySlotId,
  referralCode: referralCodeInput && !isAuthenticated ? referralCodeInput.trim().toUpperCase() : undefined,
  // ... other fields
};
```

**SHOW** referral bonus in the response message:

```typescript
if (result.accountCreated) {
  let bonusMessage = "";
  if (result.appliedReferralBonus && result.appliedReferralBonus > 0) {
    bonusMessage = ` You received ₹${result.appliedReferralBonus} referral bonus!`;
  }
  
  toast({
    title: "✓ Account Created & Order Placed!",
    description: `Order #${result.id.slice(0, 8)} created.${bonusMessage}`,
    duration: 10000,
  });
}
```

---

## DATABASE MIGRATION (if needed)

If you need to auto-generate codes for existing users without codes:

```sql
UPDATE users SET referral_code = 'REF' || substring(md5(random()::text), 1, 8) 
WHERE referral_code IS NULL;
```

---

## API RESPONSE EXAMPLES

### New response for POST /api/orders (with referral applied):

```json
{
  "id": "order-123",
  "accountCreated": true,
  "accountDetails": {
    "defaultPassword": "123456"
  },
  "appliedReferralBonus": 50,
  "bonus": 50,
  "message": "Order created successfully"
}
```

### New response for POST /api/user/apply-referral:

```json
{
  "message": "Referral bonus applied successfully",
  "bonus": 50,
  "note": "Bonus is credited to your wallet. It will be available for your next order."
}
```

### New response for GET /api/user/referral-stats:

```json
{
  "referralCode": "REFABC12345",
  "totalReferrals": 5,
  "pendingReferrals": 2,
  "completedReferrals": 2,
  "expiredReferrals": 1,
  "totalEarnings": 100
}
```

---

## IMPLEMENTATION ORDER

1. Apply CHANGE SET 1 (checkout referral code capture)
2. Apply CHANGE SET 2 (referral completion hook)
3. Apply CHANGE SET 3 (auto-expiry logic)
4. Apply CHANGE SET 4 (apply referral endpoint enhancement)
5. Apply CHANGE SET 5 (system enabled check)
6. Apply CHANGE SET 6 (frontend UI updates)
7. Test all flows
8. Deploy and monitor

---

## TESTING CHECKLIST AFTER IMPLEMENTATION

- [ ] New user can apply referral code during checkout
- [ ] Referral code auto-applied after account creation
- [ ] Wallet bonus shows up immediately
- [ ] Referral completes when order delivered (not just created)
- [ ] Referrer gets bonus when referral completes
- [ ] Monthly limits enforced
- [ ] Referrals auto-expire after 30 days
- [ ] Self-referral prevented
- [ ] Duplicate code application prevented
- [ ] Admin can disable system
- [ ] Existing referrals still work after deploy

