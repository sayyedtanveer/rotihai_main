/**
 * Google Pay Payment Verification API Routes
 * Handles payment verification, manual checks, and recovery flows
 */

import { Router } from "express";
import { db } from "../../shared/db";
import { orders } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { gpayVerificationService } from "../services/gpayVerificationService";

const router = Router();

/**
 * POST /api/payments/verify-gpay
 * Manual verification endpoint for users to verify their payment
 * 
 * Used when:
 * - User paid but app crashed
 * - User wants to manually verify payment
 * - Auto-polling hasn't detected payment yet
 */
router.post("/verify-gpay", async (req, res) => {
  try {
    const { orderId, phone, amount } = req.body;

    if (!orderId || !phone || !amount) {
      return res.status(400).json({
        error: "missing_fields",
        message: "orderId, phone, and amount required",
      });
    }

    console.log(`[GPAY-API] Manual verification request for Order#${orderId}`);

    // Verify payment
    const result = await gpayVerificationService.verifyPaymentForUser(
      orderId,
      phone,
      amount
    );

    if (result.verified) {
      // Update order
      await db.update(orders)
        .set({
          paymentStatus: "confirmed",
          paymentVerifiedBy: "manual-check",
          gpayTransactionId: result.transactionId,
        })
        .where(eq(orders.id, orderId));

      console.log(`✅ [GPAY-API] Order#${orderId} manually verified`);

      return res.json({
        success: true,
        message: "Payment verified successfully",
        transactionId: result.transactionId,
        payerPhone: result.payerPhone,
        paymentAmount: result.paymentAmount,
      });
    }

    return res.status(400).json({
      success: false,
      message: `Payment verification failed: ${result.reason}`,
      reason: result.reason,
    });
  } catch (error) {
    console.error("[GPAY-API] Error:", error);
    return res.status(500).json({
      error: "verification_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/payments/verification-status/:orderId
 * Get current verification status for an order
 */
router.get("/verification-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return res.status(404).json({
        error: "order_not_found",
        message: `Order#${orderId} not found`,
      });
    }

    const lastLog = await gpayVerificationService.getLastVerificationLog(orderId);

    return res.json({
      orderId,
      paymentStatus: order.paymentStatus,
      verified: order.paymentStatus === "confirmed",
      verifiedBy: order.paymentVerifiedBy,
      attemptCount: order.verificationAttempts || 0,
      lastVerificationLog: lastLog,
      gpayTransactionId: order.gpayTransactionId,
    });
  } catch (error) {
    console.error("[GPAY-API] Error:", error);
    return res.status(500).json({
      error: "status_check_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/payments/simulate-gpay-payment
 * DEVELOPMENT ONLY: Simulate a Google Pay payment for testing
 * 
 * This endpoint should be disabled in production
 */
router.post("/simulate-gpay-payment", async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      error: "forbidden",
      message: "This endpoint is only available in development mode",
    });
  }

  try {
    const { orderId, senderPhone, amount, reference } = req.body;

    if (!orderId || !senderPhone || !amount) {
      return res.status(400).json({
        error: "missing_fields",
        message: "orderId, senderPhone, and amount required",
      });
    }

    // Store simulated payment
    if (!(global as any).simulatedGPayPayments) {
      (global as any).simulatedGPayPayments = {};
    }

    (global as any).simulatedGPayPayments[orderId] = {
      orderId,
      transactionId: `GPY-SIM-${Date.now()}`,
      senderPhone,
      amount: parseFloat(amount),
      reference: reference || `Order#${orderId}`,
      timestamp: new Date(),
    };

    console.log(
      `[GPAY-SIMULATE] Simulated payment for Order#${orderId} from ${senderPhone} for ₹${amount}`
    );

    return res.json({
      success: true,
      message: "Payment simulated successfully",
      orderId,
      transactionId: (global as any).simulatedGPayPayments[orderId].transactionId,
      note: "Run verification to confirm this payment",
    });
  } catch (error) {
    console.error("[GPAY-SIMULATE] Error:", error);
    return res.status(500).json({
      error: "simulation_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/payments/verification-logs/:orderId
 * Get all verification attempts for an order (admin/debug only)
 */
router.get("/verification-logs/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // In production, add authorization check here
    // For now, allow access for debugging

    // Get all verification logs
    const logs = await db.query.paymentVerificationLog.findMany({
      where: (pvl: any, { eq: eqOp }: any) => eqOp(pvl.orderId, orderId),
    }) as any[];

    return res.json({
      orderId,
      totalAttempts: logs.length,
      logs: logs.sort(
        (a, b) =>
          new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
      ),
    });
  } catch (error) {
    console.error("[GPAY-API] Error:", error);
    return res.status(500).json({
      error: "logs_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/payments/retry-verification/:orderId
 * Manually trigger a re-verification for an order
 */
router.post("/retry-verification/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return res.status(404).json({
        error: "order_not_found",
        message: `Order#${orderId} not found`,
      });
    }

    if (order.paymentStatus === "confirmed") {
      return res.status(400).json({
        error: "already_confirmed",
        message: "Order is already confirmed",
      });
    }

    // Retry verification
    const result = await gpayVerificationService.verifyPaymentForUser(
      orderId,
      order.expectedPayerPhone || order.phone,
      order.total
    );

    if (result.verified) {
      // Update order
      await db.update(orders)
        .set({
          paymentStatus: "confirmed",
          paymentVerifiedBy: "manual-retry",
          gpayTransactionId: result.transactionId,
        })
        .where(eq(orders.id, orderId));

      return res.json({
        success: true,
        message: "Payment verified on retry",
        transactionId: result.transactionId,
      });
    }

    // Update attempt counter
    await db.update(orders)
      .set({
        verificationAttempts: (order.verificationAttempts || 0) + 1,
      })
      .where(eq(orders.id, orderId));

    return res.status(400).json({
      success: false,
      message: `Verification failed: ${result.reason}`,
      reason: result.reason,
      attemptNumber: (order.verificationAttempts || 0) + 1,
    });
  } catch (error) {
    console.error("[GPAY-API] Error:", error);
    return res.status(500).json({
      error: "retry_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
