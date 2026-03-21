import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Copy, Smartphone, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { useLocation } from "wouter";
import { generateUPIIntent, getPaymentAppDeepLink, isMobileDevice } from "@/lib/upi-payment";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import api from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import AccountCreatedDialog from "./AccountCreatedDialog";

interface PaymentQRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: {
    orderData: any;
    amount: number;
    customerName: string;
    phone: string;
    email?: string;
    address: string;
    pendingCheckoutId?: string | null;
  } | null;
  checkoutCategoryId?: string;
  // Legacy props for backward compatibility (subscriptions)
  orderId?: string;
  amount?: number;
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  accountCreated?: boolean;
  defaultPassword?: string;
  onPaymentConfirmed?: (transactionId: string) => void;
  isSubmitting?: boolean;
  onOrderSuccess?: () => void;
}

export default function PaymentQRDialog({
  isOpen,
  onClose,
  paymentData,
  checkoutCategoryId,
  // Legacy props
  orderId: legacyOrderId,
  amount: legacyAmount,
  customerName: legacyCustomerName,
  phone: legacyPhone,
  email: legacyEmail,
  address: legacyAddress,
  accountCreated = false,
  defaultPassword = "",
  onPaymentConfirmed,
  isSubmitting = false,
  onOrderSuccess
}: PaymentQRDialogProps) {
  // ✅ OPTION A: Use paymentData if available (normal orders), fallback to legacy props (subscriptions)
  const isOptionA = !!paymentData;
  const orderId = paymentData ? "" : legacyOrderId;
  const amount = paymentData ? paymentData.amount : legacyAmount;
  const customerName = paymentData ? paymentData.customerName : legacyCustomerName;
  const phone = paymentData ? paymentData.phone : legacyPhone;
  const email = paymentData ? paymentData.email : legacyEmail;
  const address = paymentData ? paymentData.address : legacyAddress;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [upiId] = useState(PAYMENT_CONFIG.upiId);
  const [hasPaid, setHasPaid] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [upiIntent, setUpiIntent] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [accountCreatedAfterPayment, setAccountCreatedAfterPayment] = useState(false);
  const [createdAccountPassword, setCreatedAccountPassword] = useState<string | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = isMobileDevice();

  // Set isConfirming to true when dialog opens (prevents closing immediately)
  // Reset when dialog closes
  useEffect(() => {
    if (isOpen) {
      console.log("[PAYMENT QR] Dialog opened - preventing accidental closes until payment confirmed");
      // Don't set isConfirming here - let it be controlled by the actual confirmation action
    } else {
      console.log("[PAYMENT QR] Dialog closed - resetting state");
      setIsConfirming(false);
      setHasPaid(false);
      setShowQRCode(false); // Reset to false
    }
  }, [isOpen]);

  // Generate UPI intent as soon as dialog opens (don't wait for canvas)
  useEffect(() => {
    if (isOpen) {
      const transactionRef = isOptionA ? `TEMP${Date.now()}` : (orderId || "TXN").slice(0, 8);
      const intent = generateUPIIntent({
        upiId: upiId,
        name: PAYMENT_CONFIG.merchantName,
        amount: amount || 0,
        transactionNote: `Order #${transactionRef}`,
      });

      console.log("[PAYMENT QR] Generated UPI intent:", intent);
      console.log("[PAYMENT QR] Dialog opened, setting intent");
      setUpiIntent(intent);
    }
  }, [isOpen, upiId, amount, orderId, isOptionA]);

  // Render QR code to canvas separately after intent is set
  useEffect(() => {
    if (upiIntent && canvasRef.current && showQRCode) {
      console.log("[PAYMENT QR] Rendering QR code to canvas");
      const qrSize = window.innerWidth < 768 ? 200 : 256;

      QRCode.toCanvas(
        canvasRef.current,
        upiIntent,
        {
          width: qrSize,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error);
            toast({
              title: "Error",
              description: "Failed to generate payment QR code",
              variant: "destructive",
            });
          }
        }
      );
    }
  }, [upiIntent, toast, showQRCode]);

  useEffect(() => {
    console.log("[PAYMENT QR] upiIntent state changed:", upiIntent ? "SET (buttons should render)" : "NOT SET (buttons hidden)");
  }, [upiIntent]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handlePayWithApp = (app: "gpay" | "phonepe" | "paytm") => {
    try {
      const deepLink = getPaymentAppDeepLink(app, upiIntent);
      console.log(`[PAYMENT QR] Opening ${app}:`, deepLink);
      window.location.href = deepLink;

      toast({
        title: "Opening Payment App",
        description: `Redirecting to ${app === "gpay" ? "Google Pay" : app === "phonepe" ? "PhonePe" : "Paytm"}...`,
      });
    } catch (error) {
      console.error("[PAYMENT QR] Error opening payment app:", error);
      toast({
        title: "Error",
        description: "Failed to open payment app. Please scan QR code instead.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!hasPaid) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you have completed the payment.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const txnId = `TXN${Date.now()}`;

      // If custom payment confirmed handler is provided (for subscriptions), use it
      if (onPaymentConfirmed) {
        await onPaymentConfirmed(txnId);
        return;
      }

      // ✅ OPTION A: Create order + account on payment confirmation
      if (isOptionA && paymentData) {
        console.log("[PAYMENT QR] OPTION A: Creating order on payment confirmation...");
        
        // Step 1: Create order
        const orderResponse = await api.post("/api/orders", paymentData.orderData);
        const orderResult = orderResponse.data;
        console.log("[PAYMENT QR] Order created:", orderResult.id);

        const newOrderId = orderResult.id;

        // Step 2: Confirm payment for the newly created order
        const paymentResponse = await fetch(`/api/orders/${newOrderId}/payment-confirmed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!paymentResponse.ok) {
          let errorMessage = "Failed to confirm payment";
          try {
            const contentType = paymentResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await paymentResponse.json();
              errorMessage = errorData.message || errorMessage;
            }
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }

        const paymentData_res = await paymentResponse.json();

        // Step 3: Mark pending checkout as confirmed and soft-deleted (non-blocking)
        if (paymentData?.pendingCheckoutId) {
          try {
            console.log(`[PAYMENT QR] Marking pending checkout as confirmed - ID: ${paymentData.pendingCheckoutId}, Order: ${newOrderId}`);
            const confirmResponse = await api.patch(`/api/pending-checkouts/${paymentData.pendingCheckoutId}/confirm`, {
              orderId: newOrderId,
            });
            console.log(`[PAYMENT QR] ✅ Pending checkout confirmed response:`, confirmResponse.data);
            console.log(`[PAYMENT QR] Pending checkout marked as confirmed: ${paymentData.pendingCheckoutId}`);
          } catch (err) {
            console.error(`[PAYMENT QR] Warning: Failed to mark pending checkout as confirmed (non-blocking):`, err);
            // Non-blocking - don't interrupt user experience
          }
        } else {
          console.warn(`[PAYMENT QR] ⚠️ No pendingCheckoutId found in paymentData`);
        }

        // Store tokens if new account was created
        if (paymentData_res.userCreated && paymentData_res.accessToken) {
          localStorage.setItem("userToken", paymentData_res.accessToken);
          if (paymentData_res.refreshToken) {
            localStorage.setItem("userRefreshToken", paymentData_res.refreshToken);
          }
          console.log(`✅ New user auto-logged in with tokens`);
          setAccountCreatedAfterPayment(true);
          
          // Capture the default password from API response
          if (paymentData_res.defaultPassword) {
            setCreatedAccountPassword(paymentData_res.defaultPassword);
            console.log(`📝 [PAYMENT QR] Account created with phone: ${phone}, password: ${paymentData_res.defaultPassword}`);
          }

          // Refresh user profile
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
        }

        // Show appropriate toast
        if (paymentData_res.userCreated) {
          let accountMessage = `Order #${newOrderId.slice(0, 8)} created. Your account has been created!`;
          if (paymentData_res.appliedReferralBonus && paymentData_res.appliedReferralBonus > 0) {
            accountMessage += ` You received ₹${paymentData_res.appliedReferralBonus} referral bonus!`;
          }

          toast({
            title: "✓ Payment Confirmed!",
            description: accountMessage,
          });

          // ✅ Clear cart and form data after order confirmation
          if (onOrderSuccess) {
            onOrderSuccess();
          }
          // Clear saved form data from localStorage
          localStorage.removeItem("checkoutFormData");
          console.log("[PAYMENT QR] Cleared checkout form data from localStorage");

          // ✅ Show account created dialog instead of immediately navigating
          setCreatedOrderId(newOrderId);
          setShowAccountDialog(true);
        } else {
          toast({
            title: "✓ Payment Confirmed!",
            description: "Your order has been submitted. We'll verify the payment shortly.",
          });

          // ✅ Clear cart and form data after order confirmation
          if (onOrderSuccess) {
            onOrderSuccess();
          }
          // Clear saved form data from localStorage
          localStorage.removeItem("checkoutFormData");
          console.log("[PAYMENT QR] Cleared checkout form data from localStorage");

          // Navigate to tracking page for existing users
          setLocation(`/track/${newOrderId}`);
          setTimeout(() => {
            onClose();
          }, 100);
        }
      } 
      // ✅ Legacy flow: Payment confirmation for pre-existing orders (subscriptions, etc.)
      else {
        console.log("[PAYMENT QR] Legacy flow: Confirming payment for order ID:", orderId);
        
        const response = await fetch(`/api/orders/${orderId}/payment-confirmed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorMessage = "Failed to confirm payment";
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } else {
              const errorText = await response.text();
              console.error("Non-JSON error response:", errorText);
              errorMessage = "Server error occurred. Please try again.";
            }
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.userCreated && data.accessToken) {
          localStorage.setItem("userToken", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("userRefreshToken", data.refreshToken);
          }
          console.log(`✅ New user auto-logged in with tokens`);
          setAccountCreatedAfterPayment(true);
        }

        toast({
          title: "✓ Payment Confirmed!",
          description: data.userCreated
            ? "Your account has been created and you're logged in!"
            : "Your order has been submitted. We'll verify the payment shortly.",
        });

        // ✅ Clear cart and form data after order confirmation
        if (onOrderSuccess) {
          onOrderSuccess();
        }
        // Clear saved form data from localStorage
        localStorage.removeItem("checkoutFormData");
        console.log("[PAYMENT QR] Cleared checkout form data from localStorage");

        setLocation(`/track/${orderId}`);
        setTimeout(() => {
          onClose();
        }, 100);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm payment. Please contact support.";
      toast({
        title: "Confirmation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsConfirming(false);
    }
  };

  const handlePaymentQRDialogContentProps = {
    onPointerDownOutside: (e: any) => {
      // Always prevent closing by clicking outside - user must use Cancel button
      console.log("[PAYMENT QR] onPointerDownOutside - blocking outside click");
      e.preventDefault();
    },
    onEscapeKeyDown: (e: any) => {
      // Always prevent closing with ESC - user must use Cancel button
      console.log("[PAYMENT QR] ESC key detected - blocking ESC key");
      e.preventDefault();
    },
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          console.log("[PAYMENT QR] Dialog onOpenChange called with open:", open);
          if (!open) {
            // Close is being triggered - only allow it to proceed
            // (outside clicks are already blocked by onPointerDownOutside and onEscapeKeyDown)
            onClose();
          }
        }}
      >
      <DialogContent
        className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        {...handlePaymentQRDialogContentProps}
      >
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Scan QR code to pay with any UPI app</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Payment Options Highlight Section */}
          {upiIntent && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-2 rounded-full">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Multiple Payment Options Available</p>
                  <p className="text-xs text-muted-foreground">Choose any method below</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment App Buttons - Show On Top */}
          {upiIntent && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Quick Pay with App</span>
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold">Recommended</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
                  onClick={() => handlePayWithApp("gpay")}
                  data-testid="button-pay-gpay"
                >
                  <SiGooglepay className="h-6 w-6" />
                  <span className="text-xs font-semibold">GPay</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 opacity-50 cursor-not-allowed"
                  data-testid="button-pay-phonepe"
                  disabled={true}
                  title="Currently unavailable"
                >
                  <SiPhonepe className="h-6 w-6" />
                  <span className="text-xs font-semibold">PhonePe</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4 opacity-50 cursor-not-allowed"
                  data-testid="button-pay-paytm"
                  disabled={true}
                  title="Currently unavailable"
                >
                  <SiPaytm className="h-6 w-6" />
                  <span className="text-xs font-semibold">Paytm</span>
                </Button>
              </div>
            </div>
          )}

          {/* Collapsible QR Code Section - Alternative Payment Option */}
          <div className="border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/20">
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-foreground">Scan QR Code</span>
                  <span className="text-xs text-muted-foreground">Open any UPI app & scan</span>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${showQRCode ? 'rotate-180' : ''}`}
              />
            </button>

            {showQRCode && (
              <>
                <Separator />
                <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/30">
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                    <canvas ref={canvasRef} data-testid="payment-qr-canvas" className="w-full max-w-[200px] h-auto" />
                  </div>

                  <div className="text-center space-y-1 sm:space-y-2">
                    <p className="text-lg sm:text-xl font-bold">₹{amount}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {isOptionA ? "Temporary Order" : `Order #${(orderId || "TXN").slice(0, 8)}`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 rounded-lg border">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount to Pay:</span>
                <span className="font-bold text-base sm:text-lg">₹{amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference:</span>
                <span className="font-mono text-xs sm:text-sm">
                  {isOptionA ? "Pending" : (orderId || "TXN").slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between bg-muted/50 p-2 sm:p-3 rounded-lg">
              <span className="text-sm font-medium">UPI ID: {upiId}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyUpiId}
                data-testid="button-copy-upi"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Account Info - Show only after payment confirmed OR if already created */}
            {(accountCreatedAfterPayment || (accountCreated && hasPaid)) && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-300 text-lg">✓</span>
                  </div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Account Created Successfully!
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                  <p className="text-xs text-muted-foreground mb-2">Your Login Credentials:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Phone:</span>
                      <span className="font-mono font-semibold text-sm">{phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <span className="font-mono font-bold text-sm text-green-600 dark:text-green-400">
                        {createdAccountPassword || defaultPassword || phone?.slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Your password is always the last 6 digits of your phone number. You can login anytime to track your orders!
                  </p>
                </div>
              </div>
            )}

            {/* Manual Payment Confirmation */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Important:</strong> After completing payment, check the box below and click "Confirm Payment".
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="payment-confirm"
                checked={hasPaid}
                onCheckedChange={(checked) => {
                  const newVal = checked as boolean;
                  console.log("[PAYMENT QR] Payment confirmation checkbox changed:", newVal);
                  setHasPaid(newVal);
                }}
                data-testid="checkbox-payment-confirmed"
              />
              <label
                htmlFor="payment-confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have completed the payment of ₹{amount}
              </label>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to pay:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Open any UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
                <li>Scan the QR code above</li>
                <li>Verify the amount and complete the payment</li>
                <li>Wait for our confirmation (usually within 5 minutes)</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onClose()}
              className="flex-1"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!hasPaid || isConfirming || isSubmitting}
              className="flex-1"
              data-testid="button-confirm-payment"
            >
              {isConfirming || isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isSubmitting ? "Processing..." : "Confirming..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            After confirmation, you'll be redirected to track your order. Our team will verify your payment within 5 minutes.
          </p>
        </div>
      </DialogContent>
    </Dialog>

    {/* Account Created Dialog - shown after new account is created during payment */}
    <AccountCreatedDialog
      isOpen={showAccountDialog}
      onClose={() => {
        setShowAccountDialog(false);
      }}
      phone={phone || ""}
      password={createdAccountPassword || ""}
      orderId={createdOrderId || ""}
      customerName={customerName || ""}
      onGoToTrack={() => {
        setShowAccountDialog(false);
        setLocation(`/track/${createdOrderId}`);
        setTimeout(() => {
          onClose();
        }, 100);
      }}
    />
    </>
  );
}