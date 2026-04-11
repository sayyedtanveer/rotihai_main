import { useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/apiBase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, Smartphone, CheckCircle2 } from "lucide-react";
// import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { useLocation } from "wouter";
import { generateUPIIntent, isMobileDevice } from "@/lib/upi-payment";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import api from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import AccountCreatedDialog from "./AccountCreatedDialog";
import { useAuth } from "@/hooks/useAuth";

interface PaymentQRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: {
    orderId?: string; // ✅ NEW: Order already created at checkout
    orderData?: any;  // OLD: Order data to create later
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
  // ✅ Extract orderId from either top-level (NEW) or from orderData.id (CURRENT)
  const orderIdFromCheckout = paymentData?.orderId || paymentData?.orderData?.id;
  const orderId = orderIdFromCheckout || legacyOrderId || "";
  const amount = paymentData ? paymentData.amount : legacyAmount;
  const customerName = paymentData ? paymentData.customerName : legacyCustomerName;
  const phone = paymentData ? paymentData.phone : legacyPhone;
  const email = paymentData ? paymentData.email : legacyEmail;
  const address = paymentData ? paymentData.address : legacyAddress;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(PAYMENT_CONFIG);
  const [hasPaid, setHasPaid] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [upiIntent, setUpiIntent] = useState("");
  const [showQRCode, setShowQRCode] = useState(false); // ✅ Collapsible QR (closed by default)
  const [accountCreatedAfterPayment, setAccountCreatedAfterPayment] = useState(false);
  const [createdAccountPassword, setCreatedAccountPassword] = useState<string | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();  // ✅ NEW: Check if user is logged in
  const [, setLocation] = useLocation();
  const isMobile = isMobileDevice();

  // ✅ Fetch payment settings dynamically on component mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const url = getApiUrl("/api/payment-settings");
        console.log("[PAYMENT QR] DEBUG: Calling API URL:", url);
        
        const response = await fetch(url);
        console.log("[PAYMENT QR] DEBUG: Response status:", response.status, response.statusText);
        
        if (response.ok) {
          const settings = await response.json();
          setPaymentSettings(settings);
          console.log("[PAYMENT QR] ✅ Fetched payment settings:", settings);
        } else {
          const errorText = await response.text();
          console.warn("[PAYMENT QR] ❌ API returned error:", response.status, errorText);
        }
      } catch (error) {
        console.warn("[PAYMENT QR] ❌ Failed to fetch payment settings:", error);
        // Use defaults if fetch fails
      }
    };

    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

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
      setShowQRCode(false); // Reset QR visibility
    }
  }, [isOpen]);

  // Generate UPI intent as soon as dialog opens (don't wait for canvas)
  useEffect(() => {
    if (isOpen) {
      const transactionRef = isOptionA ? `TEMP${Date.now()}` : (orderId || "TXN").slice(0, 8);
      const intent = generateUPIIntent({
        upiId: paymentSettings.upiId,
        name: paymentSettings.merchantName,
        amount: amount || 0,
        transactionNote: `Order #${transactionRef}`,
      });

      console.log("[PAYMENT QR] Generated UPI intent:", intent);
      console.log("[PAYMENT QR] Dialog opened, setting intent");
      setUpiIntent(intent);
    }
  }, [isOpen, paymentSettings.upiId, paymentSettings.merchantName, amount, orderId, isOptionA]);

  // Render QR code to canvas separately after intent is set
  // QR code is collapsible - only render when opened
  useEffect(() => {
    if (upiIntent && canvasRef.current && showQRCode) {
      console.log("[PAYMENT QR] Rendering QR code to canvas");
      const qrSize = 120; // Compact size - smaller for no scroll

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
    navigator.clipboard.writeText(paymentSettings.upiId);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handlePayWithApp = (app: "gpay" | "phonepe" | "paytm") => {
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (app === "gpay") {
        if (isIOS) {
          // iOS: Open Google Pay app from App Store
          // Using app scheme to open the app if installed, otherwise goes to App Store
          window.location.href = "https://apps.apple.com/in/app/google-pay-a-safe-way-to-pay/id1193357744";
        } else {
          // Android: Open Google Pay app from Play Store
          // Users will manually enter UPI ID and amount in Google Pay
          window.location.href = "https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user";
        }
      }

      toast({
        title: "Opening Google Pay",
        description: `Open Google Pay and send ₹${amount} to ${paymentSettings.merchantPhone || "merchant"}`,
      });
    } catch (error) {
      console.error("[PAYMENT QR] Error opening payment app:", error);
      toast({
        title: "Error",
        description: "Failed to open app. Please scan QR code instead.",
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

      // ✅ OPTION NEW: Order already created at checkout - just confirm it
      if (orderIdFromCheckout) {
        console.log("[PAYMENT QR] OPTION NEW: Confirming existing order...", orderIdFromCheckout);
        
        // Confirm payment for existing order
        const paymentResponse = await fetch(getApiUrl(`/api/orders/${orderIdFromCheckout}/payment-confirmed`), {
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

          toast({
            title: "Payment Confirmation Failed",
            description: errorMessage,
            variant: "destructive",
          });

          setIsConfirming(false);
          return;
        }

        const paymentResult = await paymentResponse.json();
        console.log("[PAYMENT QR] Payment confirmed successfully", paymentResult);

        // ✅ EMAIL NOTIFICATION: Show email status
        if (email) {
          toast({
            title: "📧 Sending Confirmation Email",
            description: `Confirmation email being sent to ${email}`,
          });
        }

        // ✅ SCENARIO HANDLING:
        // 1. NEW user (account just created) → Show account dialog with credentials
        // 2. EXISTING user (account already exists, not logged in) → Auto-login, go to tracking
        // 3. ALREADY logged in → Go directly to tracking
        
        // ✅ KEY: Only show dialog for NEW accounts, NOT for existing users
        const shouldShowAccountDialog = paymentResult.userCreated;
        
        if (shouldShowAccountDialog) {
          console.log("[PAYMENT QR] New account created on payment - showing credentials dialog");
          
          // Store tokens for auto-login when user dismisses dialog
          if (paymentResult.accessToken && paymentResult.refreshToken) {
            localStorage.setItem("userToken", paymentResult.accessToken);
            localStorage.setItem("refreshToken", paymentResult.refreshToken);
            console.log("[PAYMENT QR] Tokens stored for auto-login");
          }
          
          setCreatedAccountPassword(paymentResult.defaultPassword || "");
          setCreatedOrderId(orderIdFromCheckout || "");
          setShowAccountDialog(true);  // ✅ Show account credentials dialog
          
          // ✅ FIX 1: Invalidate wallet after new account created
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          
          toast({
            title: "✓ Payment Confirmed!",
            description: "Your account has been created!",
          });
        } else if (!isAuthenticated && paymentResult.accessToken) {
          // ✅ EXISTING user just logged in (or first login after admin creation) - auto-login and go to tracking
          console.log("[PAYMENT QR] Existing user - auto-logging in and going to tracking");
          
          // Store tokens for login
          localStorage.setItem("userToken", paymentResult.accessToken);
          localStorage.setItem("refreshToken", paymentResult.refreshToken);
          
          toast({
            title: "Payment Confirmed!",
            description: "You're logged in. Go to track your order.",
          });

          // Invalidate query and wait for refetch before navigating
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          
          // ✅ Wait 200ms to ensure profile query completes and user is authenticated
          setTimeout(() => {
            setLocation(`/track/${orderIdFromCheckout}`);
            setTimeout(() => {
              onClose();
            }, 100);
          }, 200);
        } else {
          // ✅ User already logged in - go directly to tracking
          console.log("[PAYMENT QR] User already logged in - skipping account dialog");
          
          toast({
            title: "Payment Confirmed!",
            description: "Your order is being prepared",
          });

          // ✅ FIX 2: Invalidate wallet IMMEDIATELY after payment (for logged-in users)
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          queryClient.invalidateQueries({ queryKey: ["user-orders"] });

          // ✅ CRITICAL: Clear cart BEFORE navigating away to prevent race conditions
          onOrderSuccess?.();

          setLocation(`/track/${orderIdFromCheckout}`);
          setTimeout(() => {
            onClose();
          }, 100);
        }

        return;
      }

      // ✅ OPTION A (OLD): Create order + account on payment confirmation
      if (isOptionA && paymentData) {
        console.log("[PAYMENT QR] OPTION A: Creating order on payment confirmation...");
        
        // Step 1: Create order
        const orderResponse = await api.post("/api/orders", paymentData.orderData);
        const orderResult = orderResponse.data;
        console.log("[PAYMENT QR] Order created:", orderResult.id);

        const newOrderId = orderResult.id;

        // Step 2: Confirm payment for the newly created order
        const paymentResponse = await fetch(getApiUrl(`/api/orders/${newOrderId}/payment-confirmed`), {
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

        // ✅ EMAIL NOTIFICATION: Show email status
        if (email) {
          toast({
            title: "📧 Sending Confirmation Email",
            description: `Confirmation email being sent to ${email}`,
          });
        }

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

          // ✅ CRITICAL: Clear cart BEFORE navigating away to prevent race conditions
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
        
        const response = await fetch(getApiUrl(`/api/orders/${orderId}/payment-confirmed`), {
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

        // ✅ EMAIL NOTIFICATION: Show email status (Legacy flow)
        if (email) {
          toast({
            title: "📧 Sending Confirmation Email",
            description: `Confirmation email being sent to ${email}`,
          });
        }

        // ✅ SCENARIO HANDLING (same logic as OPTION NEW):
        // 1. NEW user → Show account dialog with credentials
        // 2. EXISTING user, not logged in → Auto-login, go to tracking  
        // 3. Already logged in → Go directly to tracking
        
        const shouldShowAccountDialog = data.userCreated;
        
        if (shouldShowAccountDialog) {
          console.log("[PAYMENT QR] New account created - showing credentials dialog");
          
          // Store tokens for auto-login
          if (data.accessToken) {
            localStorage.setItem("userToken", data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
            }
            console.log("[PAYMENT QR] Tokens stored for auto-login");
          }
          
          setCreatedAccountPassword(data.defaultPassword || "");
          setCreatedOrderId(orderId || "");
          setShowAccountDialog(true);
          
          toast({
            title: "✓ Payment Confirmed!",
            description: "Your account has been created!",
          });
        } else if (!isAuthenticated && data.accessToken) {
          // ✅ Existing user not logged in - auto-login and track
          console.log("[PAYMENT QR] Existing user - auto-logging in and tracking");
          
          // Store tokens for auto-login
          localStorage.setItem("userToken", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          
          toast({
            title: "✓ Payment Confirmed!",
            description: "You're logged in. Go to track your order.",
          });

          // Invalidate query and wait for refetch before navigating
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          setTimeout(() => {
            setLocation(`/track/${orderId}`);
            setTimeout(() => {
              onClose();
            }, 100);
          }, 100);
        } else {
          // User already logged in - go to tracking
          console.log("[PAYMENT QR] User already logged in - going to tracking");
          
          toast({
            title: "✓ Payment Confirmed!",
            description: "Your order has been submitted.",
          });

          setLocation(`/track/${orderId}`);
          setTimeout(() => {
            onClose();
          }, 100);
        }

        // ✅ CRITICAL: Clear cart BEFORE dialog closes to prevent race conditions
        if (onOrderSuccess) {
          onOrderSuccess();
        }
        // Clear saved form data from localStorage
        localStorage.removeItem("checkoutFormData");
        console.log("[PAYMENT QR] Cleared checkout form data from localStorage");
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

  const handleCancelPayment = async () => {
    console.log("[PAYMENT QR] Cancel clicked - cancelling order and saving pending checkout");
    
    try {
      // ✅ STEP 1: Cancel the order
      if (orderIdFromCheckout) {
        console.log("[PAYMENT QR] Cancelling order:", orderIdFromCheckout);
        try {
          console.log(`[PAYMENT QR] Sending POST request to /api/orders/${orderIdFromCheckout}/cancel`);
          const cancelResponse = await api.post(`/api/orders/${orderIdFromCheckout}/cancel`);
          console.log("[PAYMENT QR] ✅ Order cancelled successfully:", cancelResponse.data);
          
          toast({
            title: "✓ Order Cancelled",
            description: `Order #${orderIdFromCheckout.slice(0, 8)} has been cancelled successfully.`,
          });
        } catch (cancelError: any) {
          console.error("[PAYMENT QR] ❌ Error cancelling order:", {
            status: cancelError.response?.status,
            data: cancelError.response?.data,
            message: cancelError.message,
            errorCode: cancelError.response?.data?.errorCode
          });
          
          // Show specific error message to user
          const errorMessage = cancelError.response?.data?.message || "Failed to cancel order";
          toast({
            title: "⚠️ Cancel Failed",
            description: errorMessage,
            variant: "destructive",
          });
          // Continue with pending checkout save even if order cancel fails
        }
      }

      // ✅ STEP 2: Save pending checkout for cart recovery
      const orderData = paymentData?.orderData || {};
      
      const pendingCheckoutData = {
        orderId: orderIdFromCheckout,  // Link back to the cancelled order
        phone: phone || orderData.customerPhone || "",
        customerName: customerName || orderData.customerName || "",
        email: email || orderData.email,
        address: address || orderData.address,
        addressBuilding: orderData.addressBuilding,
        addressStreet: orderData.addressStreet,
        addressArea: orderData.addressArea,
        addressCity: orderData.addressCity || "Mumbai",
        addressPincode: orderData.addressPincode,
        items: orderData.items || [],
        subtotal: orderData.subtotal?.toString() || "0",
        deliveryFee: orderData.deliveryFee?.toString() || "0",
        discount: orderData.discount?.toString() || "0",
        total: orderData.total?.toString() || amount?.toString() || "0",
        chefId: orderData.chefId,
        categoryId: checkoutCategoryId || orderData.categoryId,
        categoryName: orderData.categoryName,
        customerLatitude: orderData.customerLatitude,
        customerLongitude: orderData.customerLongitude,
        couponCode: orderData.couponCode,
        referralCode: orderData.referralCode,
        walletAmountUsed: orderData.walletAmountUsed?.toString() || "0",
        bonusUsedAtCheckout: orderData.bonusUsedAtCheckout?.toString() || "0",
        deliverySlotId: orderData.deliverySlotId,
        deliveryTime: orderData.deliveryTime,
        deliveryDate: orderData.deliveryDate,
      };

      console.log("[PAYMENT QR] Saving pending checkout for cart recovery:", pendingCheckoutData);
      
      const response = await api.post("/api/pending-checkouts", pendingCheckoutData);
      console.log("[PAYMENT QR] ✅ Pending checkout saved:", response.data.id);
      
      toast({
        title: "✓ Checkout Saved",
        description: "Your cart has been saved. You can resume payment anytime.",
      });
    } catch (error: any) {
      console.error("[PAYMENT QR] Error in cancel flow:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Don't fail if operations fail - user can still close dialog
      toast({
        title: "Info",
        description: "Closing payment dialog. You can place a new order anytime.",
        variant: "default",
      });
    } finally {
      // Always close dialog regardless of what happened
      onClose();
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
        className="w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto"
        {...handlePaymentQRDialogContentProps}
      >
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Choose your preferred payment method</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {/* ✅ SECTION 1: UPI ID - COMPACT, TOP */}
          {upiIntent && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-400 dark:border-green-600 rounded-lg p-2 space-y-1.5">
              <p className="text-xs font-bold text-green-700 dark:text-green-300">💚 UPI ID</p>
              <div className="bg-white dark:bg-slate-800 rounded p-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">{paymentSettings.upiId}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyUpiId}
                  data-testid="button-copy-upi"
                  className="hover:bg-green-100 dark:hover:bg-green-900/30 h-7 w-7 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ✅ SECTION 2: PAYMENT NUMBER - COMPACT */}
          {upiIntent && paymentSettings.merchantPhone && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-lg p-2">
              <div className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300">📱 {paymentSettings.merchantPhone}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Send payment directly</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ SECTION 3: QR CODE - COLLAPSIBLE (CLOSED BY DEFAULT) */}
          {upiIntent && (
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/20">
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">🔲 Scan QR Code</span>
                </div>
                <span className="text-xs text-slate-500">{showQRCode ? '▼' : '▶'}</span>
              </button>
              {showQRCode && (
                <div className="border-t border-slate-300 dark:border-slate-600 flex flex-col items-center p-2 bg-muted/30">
                  <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm">
                    <canvas ref={canvasRef} data-testid="payment-qr-canvas" className="w-[120px] h-[120px]" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Use any UPI app</p>
                </div>
              )}
            </div>
          )}

          {/* ✅ SECTION 4: PAY WITH APP BUTTONS - SUBTLE & COMPACT */}
          {upiIntent && (
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">💳 Quick Payment</p>
              
              <div className="flex gap-1.5 justify-center">
                <Button
                  variant="default"
                  className="flex flex-col items-center justify-center gap-0.5 h-14 w-20 bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0 transition-all rounded-lg"
                  onClick={() => handlePayWithApp("gpay")}
                  data-testid="button-pay-gpay"
                >
                  <span className="text-base">💳</span>
                  <span className="text-xs">Google Pay</span>
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="flex flex-col items-center justify-center gap-0.5 h-14 w-20 opacity-35 cursor-not-allowed rounded-lg"
                  data-testid="button-pay-phonepe"
                  title="Coming soon"
                >
                  <span className="text-base">📱</span>
                  <span className="text-xs">PhonePe</span>
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="flex flex-col items-center justify-center gap-0.5 h-14 w-20 opacity-35 cursor-not-allowed rounded-lg"
                  data-testid="button-pay-paytm"
                  title="Coming soon"
                >
                  <span className="text-base">💰</span>
                  <span className="text-xs">Paytm</span>
                </Button>
              </div>
            </div>
          )}

          {/* ✅ SECTION 5: AMOUNT SUMMARY - COMPACT */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Total:</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">₹{amount}</span>
            </div>
          </div>

          {/* ✅ SECTION 6: CONFIRMATION CHECKBOX - ALWAYS VISIBLE, NO SCROLL */}
          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Checkbox
              id="payment-confirm"
              checked={hasPaid}
              onCheckedChange={(checked) => {
                const newVal = checked as boolean;
                console.log("[PAYMENT QR] Payment confirmation checkbox changed:", newVal);
                setHasPaid(newVal);
              }}
              data-testid="checkbox-payment-confirmed"
              className="mt-0.5 h-4 w-4"
            />
            <label
              htmlFor="payment-confirm"
              className="text-xs leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-amber-900 dark:text-amber-100"
            >
              I paid ₹{amount}
            </label>
          </div>

          {/* ✅ SECTION 7: QUICK INSTRUCTIONS */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
              <strong>📝 Steps:</strong> Pay using UPI ID/QR/Number → Check box → Confirm
            </p>
          </div>

          {/* Account Info - Show only after payment confirmed OR if already created */}
          {(accountCreatedAfterPayment || (accountCreated && hasPaid)) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-semibold text-green-800 dark:text-green-200">Account Created!</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded p-1.5 border border-green-200 dark:border-green-700 text-xs">
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-mono font-bold">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono font-bold text-green-600 dark:text-green-400">
                      {createdAccountPassword || defaultPassword || phone?.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ACTION BUTTONS - COMPACT, ALWAYS VISIBLE */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={handleCancelPayment}
              className="flex-1 h-9 text-sm"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!hasPaid || isConfirming || isSubmitting}
              className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-confirm-payment"
            >
              {isConfirming || isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  {isSubmitting ? "Processing..." : "Confirming..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Confirm
                </>
              )}
            </Button>
          </div>
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
        // ✅ IMPORTANT: Invalidate user profile query AND wait for refetch to complete
        // This ensures useAuth fetches the user profile with the new token before we navigate
        queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        // Give the query refetch time to complete (50ms should be enough for network + state update)
        setTimeout(() => {
          setLocation(`/track/${createdOrderId}`);
          setTimeout(() => {
            onClose();
          }, 100);
        }, 50);
      }}
    />
    </>
  );
}