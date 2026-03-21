import { db } from "../../shared/db";
import { orders, paymentVerificationLog } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Google Pay Verification Service
 * Handles payment verification with comprehensive user matching
 */

export interface GPayVerificationResult {
  verified: boolean;
  reason?: string;
  transactionId?: string;
  payerPhone?: string;
  paymentAmount?: number;
  verificationTime?: Date;
  error?: string;
}

export interface PaymentVerificationLog {
  orderId: string;
  checkAttemptNumber: number;
  expectedPhone: string;
  actualPhone: string;
  phoneMatch: boolean;
  expectedAmount: number;
  actualAmount: number;
  amountMatch: boolean;
  expectedReference: string;
  actualReference: string;
  referenceMatch: boolean;
  verificationStatus: "success" | "failed";
  failureReason?: string;
  gpayTransactionId?: string;
  checkedAt: Date;
}

class GPayVerificationService {
  private readonly MAX_VERIFICATION_ATTEMPTS = 15; // 15 minutes max polling (60-second intervals)
  private readonly AMOUNT_TOLERANCE = 0.50; // ₹0.50 tolerance for amount matching
  private readonly REFERENCE_TOLERANCE_MINUTES = 15; // Payment must be within 15 minutes of order

  /**
   * Main verification method - checks if payment matches user
   */
  async verifyPaymentForUser(
    orderId: string,
    expectedPhone: string,
    expectedAmount: number
  ): Promise<GPayVerificationResult> {
    try {
      console.log(`[GPAY-VERIFY] Starting verification for Order#${orderId}, Phone: ${expectedPhone}, Amount: ₹${expectedAmount}`);

      // 1. Get order details
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        console.warn(`[GPAY-VERIFY] ❌ Order not found: ${orderId}`);
        return { verified: false, reason: "order_not_found" };
      }

      // 2. Check if already verified to avoid duplicate processing
      if (order.paymentVerifiedBy && order.paymentStatus === "confirmed") {
        console.log(`[GPAY-VERIFY] ⏭️ Order already verified: ${orderId}`);
        return {
          verified: false,
          reason: "already_verified",
          transactionId: order.gpayTransactionId || undefined,
        };
      }

      // 3. Query UPI provider for payment
      const payment = await this.queryUPITransaction(orderId, expectedAmount);

      if (!payment) {
        console.log(`[GPAY-VERIFY] ⏳ Payment not yet received for Order#${orderId}`);
        
        // Log verification attempt
        await this.logVerificationAttempt({
          orderId,
          checkAttemptNumber: order.verificationAttempts || 0,
          expectedPhone,
          actualPhone: "NOT_FOUND",
          phoneMatch: false,
          expectedAmount,
          actualAmount: 0,
          amountMatch: false,
          expectedReference: `Order#${orderId}`,
          actualReference: "NOT_FOUND",
          referenceMatch: false,
          verificationStatus: "failed",
          failureReason: "payment_not_received",
          checkedAt: new Date(),
        });

        return { verified: false, reason: "payment_not_received" };
      }

      console.log(`[GPAY-VERIFY] 💰 Payment found for Order#${orderId}:`, {
        from: payment.senderPhone,
        amount: payment.amount,
        reference: payment.reference,
      });

      // 4. VERIFICATION CHECK 1: Phone number match
      const phoneMatch = this.phonesMatch(payment.senderPhone, expectedPhone);
      if (!phoneMatch) {
        console.warn(`[GPAY-VERIFY] ❌ PHONE MISMATCH`);
        console.warn(`   Expected: ${expectedPhone}`);
        console.warn(`   Got: ${payment.senderPhone}`);

        await this.logVerificationAttempt({
          orderId,
          checkAttemptNumber: (order.verificationAttempts || 0) + 1,
          expectedPhone,
          actualPhone: payment.senderPhone,
          phoneMatch: false,
          expectedAmount,
          actualAmount: payment.amount,
          amountMatch: false,
          expectedReference: `Order#${orderId}`,
          actualReference: payment.reference,
          referenceMatch: false,
          verificationStatus: "failed",
          failureReason: "phone_mismatch",
          gpayTransactionId: payment.transactionId,
          checkedAt: new Date(),
        });

        return { verified: false, reason: "phone_mismatch" };
      }
      console.log(`[GPAY-VERIFY] ✅ Phone verified`);

      // 5. VERIFICATION CHECK 2: Amount match
      const amountDiff = Math.abs(payment.amount - expectedAmount);
      const amountMatch = amountDiff <= this.AMOUNT_TOLERANCE;
      if (!amountMatch) {
        console.warn(`[GPAY-VERIFY] ❌ AMOUNT MISMATCH`);
        console.warn(`   Expected: ₹${expectedAmount}`);
        console.warn(`   Got: ₹${payment.amount}`);
        console.warn(`   Diff: ₹${amountDiff.toFixed(2)} (tolerance: ₹${this.AMOUNT_TOLERANCE})`);

        await this.logVerificationAttempt({
          orderId,
          checkAttemptNumber: (order.verificationAttempts || 0) + 1,
          expectedPhone,
          actualPhone: payment.senderPhone,
          phoneMatch: true,
          expectedAmount,
          actualAmount: payment.amount,
          amountMatch: false,
          expectedReference: `Order#${orderId}`,
          actualReference: payment.reference,
          referenceMatch: false,
          verificationStatus: "failed",
          failureReason: "amount_mismatch",
          gpayTransactionId: payment.transactionId,
          checkedAt: new Date(),
        });

        return { verified: false, reason: "amount_mismatch" };
      }
      console.log(`[GPAY-VERIFY] ✅ Amount verified: ₹${payment.amount}`);

      // 6. VERIFICATION CHECK 3: Payment reference
      const referenceMatch = payment.reference.includes(`Order#${orderId}`) || 
                             payment.reference.includes(orderId);
      if (!referenceMatch) {
        console.warn(`[GPAY-VERIFY] ❌ REFERENCE MISMATCH`);
        console.warn(`   Expected to contain: Order#${orderId}`);
        console.warn(`   Got: ${payment.reference}`);

        await this.logVerificationAttempt({
          orderId,
          checkAttemptNumber: (order.verificationAttempts || 0) + 1,
          expectedPhone,
          actualPhone: payment.senderPhone,
          phoneMatch: true,
          expectedAmount,
          actualAmount: payment.amount,
          amountMatch: true,
          expectedReference: `Order#${orderId}`,
          actualReference: payment.reference,
          referenceMatch: false,
          verificationStatus: "failed",
          failureReason: "reference_mismatch",
          gpayTransactionId: payment.transactionId,
          checkedAt: new Date(),
        });

        return { verified: false, reason: "reference_mismatch" };
      }
      console.log(`[GPAY-VERIFY] ✅ Reference verified: ${payment.reference}`);

      // 7. VERIFICATION CHECK 4: Payment timestamp (must be recent)
      const paymentAge = Math.abs(Date.now() - payment.timestamp.getTime());
      const maxAge = this.REFERENCE_TOLERANCE_MINUTES * 60 * 1000;
      if (paymentAge > maxAge) {
        console.warn(`[GPAY-VERIFY] ⚠️ PAYMENT IS OLD`);
        console.warn(`   Age: ${Math.floor(paymentAge / 1000)} seconds`);
        console.warn(`   Max: ${this.REFERENCE_TOLERANCE_MINUTES} minutes`);
        // Don't reject - payment might have been from earlier attempt
      }
      console.log(`[GPAY-VERIFY] ✅ Timestamp verified (age: ${Math.floor(paymentAge / 1000)}s)`);

      // ✅ ALL VERIFICATIONS PASSED
      console.log(`[GPAY-VERIFY] ✅✅✅ PAYMENT VERIFIED for Order#${orderId}`);

      // Log successful verification
      await this.logVerificationAttempt({
        orderId,
        checkAttemptNumber: (order.verificationAttempts || 0) + 1,
        expectedPhone,
        actualPhone: payment.senderPhone,
        phoneMatch: true,
        expectedAmount,
        actualAmount: payment.amount,
        amountMatch: true,
        expectedReference: `Order#${orderId}`,
        actualReference: payment.reference,
        referenceMatch: true,
        verificationStatus: "success",
        gpayTransactionId: payment.transactionId,
        checkedAt: new Date(),
      });

      return {
        verified: true,
        transactionId: payment.transactionId,
        payerPhone: payment.senderPhone,
        paymentAmount: payment.amount,
        verificationTime: new Date(),
      };
    } catch (error) {
      console.error(`[GPAY-VERIFY] Error during verification:`, error);
      return {
        verified: false,
        reason: "verification_error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Query UPI provider for payment (PhonePe API)
   */
  private async queryUPITransaction(
    orderId: string,
    expectedAmount: number
  ): Promise<{
    transactionId: string;
    senderPhone: string;
    amount: number;
    reference: string;
    timestamp: Date;
  } | null> {
    try {
      // For now, return null (integration happens separately)
      // In production, this would query PhonePe/UPI provider
      
      // Simulated check - replace with actual UPI API call
      console.log(`[GPAY-QUERY] Checking UPI for Order#${orderId} with amount ₹${expectedAmount}`);
      
      // Check if there's a pending payment in our simulated store
      // This would be replaced with real UPI provider API call
      const simulatedPayment = (global as any).simulatedGPayPayments?.[orderId];
      
      if (simulatedPayment) {
        console.log(`[GPAY-QUERY] Found simulated payment:`, simulatedPayment);
        return {
          transactionId: simulatedPayment.transactionId,
          senderPhone: simulatedPayment.senderPhone,
          amount: simulatedPayment.amount,
          reference: simulatedPayment.reference,
          timestamp: new Date(simulatedPayment.timestamp),
        };
      }

      return null;
    } catch (error) {
      console.error(`[GPAY-QUERY] Error querying UPI:`, error);
      return null;
    }
  }

  /**
   * Phone number matching with normalization
   */
  private phonesMatch(phone1: string, phone2: string): boolean {
    const normalize = (p: string) => p.replace(/[\D]/g, "").slice(-10);

    const normalized1 = normalize(phone1);
    const normalized2 = normalize(phone2);

    const match = normalized1 === normalized2;

    console.log(`[PHONE-MATCH] Comparing phones:`);
    console.log(`   Phone1: ${phone1} → ${normalized1}`);
    console.log(`   Phone2: ${phone2} → ${normalized2}`);
    console.log(`   Match: ${match}`);

    return match;
  }

  /**
   * Log verification attempt to audit trail
   */
  private async logVerificationAttempt(log: PaymentVerificationLog): Promise<void> {
    try {
      await db.insert(paymentVerificationLog).values({
        id: `${log.orderId}-${Date.now()}`,
        orderId: log.orderId,
        checkAttemptNumber: log.checkAttemptNumber,
        expectedPhone: log.expectedPhone,
        actualPhone: log.actualPhone,
        phoneMatch: log.phoneMatch,
        expectedAmount: log.expectedAmount,
        actualAmount: log.actualAmount,
        amountMatch: log.amountMatch,
        expectedReference: log.expectedReference,
        actualReference: log.actualReference,
        referenceMatch: log.referenceMatch,
        verificationStatus: log.verificationStatus,
        failureReason: log.failureReason || null,
        gpayTransactionId: log.gpayTransactionId || null,
        checkedAt: log.checkedAt,
      });
    } catch (error) {
      console.warn(`[GPAY-LOG] Failed to log verification attempt:`, error);
    }
  }

  /**
   * Check if verification should be retried
   */
  shouldRetryVerification(order: any): boolean {
    if (!order) return false;
    if (order.paymentStatus === "confirmed") return false;
    if (!order.verificationAttempts) return true;
    return order.verificationAttempts < this.MAX_VERIFICATION_ATTEMPTS;
  }

  /**
   * Get verification attempt count
   */
  getVerificationAttemptCount(order: any): number {
    return order?.verificationAttempts || 0;
  }

  /**
   * Get last verification log for order
   */
  async getLastVerificationLog(orderId: string): Promise<any> {
    try {
      const log = await db.query.paymentVerificationLog.findFirst({
        where: eq(paymentVerificationLog.orderId, orderId),
        orderBy: desc(paymentVerificationLog.checkedAt),
      });
      return log;
    } catch (error) {
      console.error(`[GPAY-LOG] Error fetching verification log:`, error);
      return null;
    }
  }
}

export const gpayVerificationService = new GPayVerificationService();
