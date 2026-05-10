import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useCheckoutAddress } from "@/hooks/useCheckoutAddress";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletUpdates } from "@/hooks/useWalletUpdates";
import { useApplyReferral } from "@/hooks/useApplyReferral";
import { useValidateReferralCode } from "@/hooks/useValidateReferralCode";
import { Loader2, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { getDeliveryMessage, calculateDistance as calculateDistanceLoc } from "@/lib/locationUtils";
import { calculateDistance, calculateDelivery } from "@shared/deliveryUtils";
import api from "@/lib/apiClient";
import { getApiUrl } from "@/lib/apiBase";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { getAreaSuggestions } from "@/lib/deliveryAreas";
import { getStoredPincodeValidation } from "@/lib/pincodeUtils";
import { CartItem } from "@/types/cartItem";
import { CheckoutDialogProps } from "@/types/checkoutdialogprops";
import { useCart } from "@/hooks/use-cart";
import OrderSummaryCard from "@/components/OrderSummaryCard";


// Hook to check for mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}



export default function CheckoutDialog({
  isOpen,
  onClose,
  cart,
  onClearCart,
  onShowPaymentQR,
}: CheckoutDialogProps) {
  // Login tab removed — auth happens silently at checkout via login-or-create
  const [showAddressForm, setShowAddressForm] = useState(false); // 🆕 Show/hide address form

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // 🛡️ Multi-click protection for checkout
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // 🔄 Retry order detection
  const retryOrderId = new URLSearchParams(window.location.search).get("retryOrder");

  // Structured address fields
  const [addressBuilding, setAddressBuilding] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressArea, setAddressArea] = useState("");
  const [addressCity, setAddressCity] = useState("Mumbai");
  const [addressPincode, setAddressPincode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState(""); // ✅ NEW: Optional delivery instructions

  // Full address for display
  const address = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
    .filter(Boolean)
    .join(", ");

  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralOpen, setReferralOpen] = useState<string | undefined>(undefined);
  const [referralValidation, setReferralValidation] = useState<{
    valid: boolean;
    message: string;
    bonus?: number;
    referrerName?: string;
    minOrderAmount?: number; // ✅ Minimum order amount from backend
    bonusNote?: string; // ✅ Note about when bonus is credited
    minRequired?: number; // ✅ Used when validation fails (min required from error)
    currentAmount?: number; // ✅ Current order amount
    validatedAmount?: number; // ✅ FIX: Track amount verified at for dynamic re-validation
  } | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [originalSubtotal, setOriginalSubtotal] = useState(0); // Original price before item discounts
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [platformFee, setPlatformFee] = useState(0); // 🆕 Convenience fee
  const [platformFeeConfig, setPlatformFeeConfig] = useState<any>(null); // 🆕 Platform fee config
  const [discount, setDiscount] = useState(0);
  const [itemDiscountSavings, setItemDiscountSavings] = useState(0); // Track savings from item offers
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Phone check on typing removed — auth happens only at checkout submit via login-or-create
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  // showForgotPassword state removed — login tab removed
  const [showReferralConfirmModal, setShowReferralConfirmModal] = useState(false);
  const [confirmedProceedWithoutReferral, setConfirmedProceedWithoutReferral] = useState(false);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState(""); // RAW time for API (HH:mm)
  const [deliveryTimeLabel, setDeliveryTimeLabel] = useState(""); // Formatted label for UI display
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState("");
  // ✅ DELIVERY LABEL (ASAP vs selected slot)
  const deliveryLabel = deliveryTimeLabel
    ? deliveryTimeLabel
    : "As soon as possible";
  // Referral bonus states
  const [pendingBonus, setPendingBonus] = useState<number>(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxBonusUsagePerOrder, setMaxBonusUsagePerOrder] = useState<number>(10);
  const [bonusEligible, setBonusEligible] = useState<boolean>(false);
  const [useBonusAtCheckout, setUseBonusAtCheckout] = useState<boolean>(false);
  const [isCheckingBonusEligibility, setIsCheckingBonusEligibility] = useState(false);
  const [bonusEligibilityMsg, setBonusEligibilityMsg] = useState<string>("");
  const handleClearDeliverySlot = () => {
    setSelectedDeliveryTime("");
    setDeliveryTimeLabel("");
    setSelectedDeliverySlotId("");
  };
  // Bonus amount to actually use (respecting limit)
  const [bonusAmountToUse, setBonusAmountToUse] = useState<number>(0);

  // Wallet balance states
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [walletAmountToUse, setWalletAmountToUse] = useState<number>(0);
  const [maxWalletUsagePerOrder, setMaxWalletUsagePerOrder] = useState<number>(10);
  const [minOrderAmountForWallet, setMinOrderAmountForWallet] = useState<number>(0);

  // Delivery minimum order flexibility states
  const [deliveryMinOrderAmount, setDeliveryMinOrderAmount] = useState<number>(0);
  const [isBelowDeliveryMinimum, setIsBelowDeliveryMinimum] = useState<boolean>(false);
  const [amountNeededForFreeDelivery, setAmountNeededForFreeDelivery] = useState<number>(0);

  // Location states
  const [customerLatitude, setCustomerLatitude] = useState<number | null>(null);
  const [customerLongitude, setCustomerLongitude] = useState<number | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // Delivery address zone validation (NOT GPS-based)
  const [addressInDeliveryZone, setAddressInDeliveryZone] = useState(true);
  const [addressZoneValidated, setAddressZoneValidated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("lastValidatedDeliveryAddress");
      if (stored) {
        const parsed = JSON.parse(stored);
        return !!(parsed && parsed.isInZone && parsed.address && parsed.pincode);
      }
    } catch (e) {
      // ignore
    }
    return false;
  });
  const [addressZoneDistance, setAddressZoneDistance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("lastValidatedDeliveryAddress");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed && parsed.distance ? Number(parsed.distance) : 0;
      }
    } catch (e) {
      // ignore
    }
    return 0;
  });
  const [isReValidatingPincode, setIsReValidatingPincode] = useState(false);
  const autoGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Address confirmation state - controls visibility of below content
  const [addressConfirmed, setAddressConfirmed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("lastValidatedDeliveryAddress");
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasComplete = parsed && parsed.isInZone && parsed.address && parsed.pincode && parsed.areaName;
        return !!hasComplete;
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  const prepareRestoredAddressForRevalidation = (hasCompleteAddress: boolean) => {
    setAddressZoneValidated(false);
    setAddressInDeliveryZone(false);
    setAddressConfirmed(false);
    setLocationError("");
    setDeliveryDistance(null);
    // Do not force the edit panel open when restoring a stored/auto-filled pincode.
    // Only open the edit form if it was already open previously and the restored
    // data indicates incompleteness. This avoids a visual flash on dialog open.
    setIsEditingAddress((prev) => prev && !hasCompleteAddress);
  };

  const hasUsableCoordinates = (latitude: unknown, longitude: unknown) => {
    const lat = typeof latitude === "number" ? latitude : Number(latitude);
    const lon = typeof longitude === "number" ? longitude : Number(longitude);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      !(lat === 0 && lon === 0)
    );
  };

  // Auto-scroll state for UX improvement
  const deliverySlotRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToSlots, setShouldScrollToSlots] = useState(false);

  // ✅ NEW: Ref for Pay button focus management
  const payButtonRef = useRef<HTMLButtonElement>(null);
  const geocodingAddressInFlightRef = useRef<string | null>(null);

  // ✅ Validation run id to cancel stale validations when referral code changes
  const validationRunRef = useRef(0);
  // ✅ NEW: Ref for first input (Name field) - for initial focus on incomplete address
  const firstInputRef = useRef<HTMLInputElement>(null);

  // State for View/Edit mode
  // Default to closed (not editing) when a recently validated delivery address exists
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("lastValidatedDeliveryAddress");
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasComplete = parsed && parsed.isInZone && parsed.address && parsed.pincode && parsed.areaName;
        return !hasComplete; // if complete and validated, do not show edit form
      }
    } catch (e) {
      // ignore parse errors and fall through
    }
    return true;
  });

  // ✅ HELPER: Check if all 4 required address fields are complete
  const isAddressComplete =
    addressBuilding?.trim() &&
    addressStreet?.trim() &&
    addressArea?.trim() &&
    addressPincode?.trim();

  // phoneExists reset removed — no longer tracking phone existence on typing

  // Log when cart changes
  useEffect(() => {
    console.log("[CHECKOUT-DIALOG] Received cart prop:", {
      isOpen,
      hasCart: !!cart,
      cartChefId: cart?.chefId,
      cartChefLatitude: cart?.chefLatitude,
      cartChefLongitude: cart?.chefLongitude,
      cartDeliveryFee: cart?.deliveryFee,
      cartDistance: cart?.distance,
    });
  }, [cart, isOpen]);

  // Listen to cart changes and clear validation ONLY when chef actually changes
  // This forces user to re-validate address when selecting a different chef
  const prevChefIdRef = useRef<string | undefined>(cart?.chefId);
  useEffect(() => {
    if (cart?.chefId && cart.chefId !== prevChefIdRef.current) {
      // Chef changed - require address re-validation and re-confirmation
      setAddressZoneValidated(false);
      setAddressInDeliveryZone(false);
      setAddressConfirmed(false);
      setLocationError("");
      console.log("[CHECKOUT] Chef changed - cleared address validation. User must re-validate.");
      prevChefIdRef.current = cart.chefId;
    }
  }, [cart?.chefId]);

  // ✅ NEW: Focus on first input when dialog opens with incomplete address
  useEffect(() => {
    if (!isOpen) return;

    if (!isAddressComplete) {
      // Address incomplete - focus on first input field
      firstInputRef.current?.focus();
    }
  }, [isOpen, isAddressComplete]);

  // NOTE: Auto-validation removed — validation only occurs via explicit
  // "Validate Address" button click (handleValidateAddressClick)

  // ✅ FIX: Reset referral validation when cart amount changes
  useEffect(() => {
    if (referralValidation && referralValidation.validatedAmount !== subtotal) {
      console.log("[REFERRAL] ⚠️ Cart amount changed - resetting validation", {
        validatedAt: referralValidation.validatedAmount,
        currentAmount: subtotal
      });
      setReferralValidation(null);
    }
  }, [subtotal, referralValidation]);

  // Handle smooth scrolling to delivery slots upon validation success
  useEffect(() => {
    if (shouldScrollToSlots && isAddressComplete) {
      // ✅ FIX: Only scroll if address is complete
      // Timeout to ensure DOM has completely updated and the section is mounted
      const timer = setTimeout(() => {
        const container = document.getElementById("checkout-scroll-container");
        const target = deliverySlotRef.current || document.getElementById("delivery-and-summary-section");

        if (container && target) {
          // Precise relative scrolling inside the overflow container
          const targetPos = target.offsetTop - 20; // 20px padding
          container.scrollTo({ top: targetPos, behavior: "smooth" });
        } else if (target) {
          // Fallback
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setShouldScrollToSlots(false); // Reset after scrolling
      }, 300); // increased to 300ms for safety
      return () => clearTimeout(timer);
    }
  }, [shouldScrollToSlots, isAddressComplete]);

  // ============================================
  // AUTO-SYNC STORED PINCODE FROM HERO
  // When dialog opens, auto-populate from localStorage if available
  // This syncs the validated pincode from Hero to Checkout seamlessly
  // ============================================
  useEffect(() => {
    if (!isOpen || !cart?.chefId) {
      return;
    }

    // Only auto-fill if user hasn't already entered a pincode
    if (addressPincode) {
      console.log("[AUTO-SYNC-PINCODE] User already has pincode entered, skipping auto-sync");
      return;
    }

    const storedPincode = getStoredPincodeValidation();
    if (storedPincode) {
      console.log("[AUTO-SYNC-PINCODE] Found stored pincode from Hero, auto-syncing:", storedPincode.pincode);

      // Pre-fill all fields from stored validation
      setAddressPincode(storedPincode.pincode);
      setAddressArea(storedPincode.area);
      setCustomerLatitude(storedPincode.latitude);
      setCustomerLongitude(storedPincode.longitude);

      // ✅ FIX: Only set validated if ALL required fields will be present
      // Note: This will be validated on next check when other fields are filled
      const hasCompleteAddress =
        !!addressBuilding?.trim() &&
        !!addressStreet?.trim() &&
        !!storedPincode.area?.trim() &&
        !!storedPincode.pincode?.trim();

      prepareRestoredAddressForRevalidation(hasCompleteAddress);

      console.log("[AUTO-SYNC-PINCODE] ✅ Pre-filled checkout form with stored pincode");
    }
  }, [isOpen, cart?.chefId, addressPincode, addressBuilding, addressStreet]);

  // ============================================
  // RESTORE ADDRESS CONFIRMATION ON DIALOG REOPEN
  // When dialog opens with an already-validated address,
  // automatically confirm it to restore the Pay button's enabled state
  // ============================================
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // ✅ FIX: Only confirm if ALL 4 address fields are complete AND validated
    if (addressZoneValidated && addressInDeliveryZone && isAddressComplete && !addressConfirmed) {
      console.log("[RESTORE-ADDRESS] Dialog reopened with fully validated address. Auto-confirming.");
      setAddressConfirmed(true);
      setIsEditingAddress(false); // ✅ Show the collapsed view (green badge) instead of hiding everything

      // Scroll down to order summary / Pay & Confirm so user sees totals immediately
      setShouldScrollToSlots(true);
    }
  }, [isOpen, addressZoneValidated, addressInDeliveryZone, isAddressComplete]);


  // ============================================
  // FOCUS PAY BUTTON WHEN READY
  // When address is confirmed and Pay button becomes enabled,
  // move focus to the Pay button for better UX
  // ============================================
  useEffect(() => {
    // ✅ FIX: Only focus Pay button if address is COMPLETE, confirmed, AND not editing
    // SAFE GUARD: Don't steal focus if user is actively in an input field
    if (addressConfirmed && !isEditingAddress && isOpen && isAddressComplete && payButtonRef.current) {
      if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        console.log("[FOCUS-PAY-BUTTON] Address confirmed and complete - focusing Pay button");
        setTimeout(() => {
          payButtonRef.current?.focus();
        }, 100); // Small delay to ensure DOM is ready
      }
    }
  }, [addressConfirmed, isEditingAddress, isOpen, isAddressComplete]);

  // Area suggestions for autocomplete
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  // New state for GPS loading
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isUserLoading, userToken } = useAuth();
  const { location: deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const applyReferralMutation = useApplyReferral();
  const validateReferralMutation = useValidateReferralCode();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOpen) return;

    // ✅ ONLY initialize once
    const isComplete =
      addressBuilding?.trim() &&
      addressStreet?.trim() &&
      addressArea?.trim() &&
      addressPincode?.trim();

    console.log("[ADDRESS INIT SAFE]", { isComplete });

    // ✅ ONLY set default state (do not override user interaction later)
    if (!isComplete) {
      setIsEditingAddress(true);
    }

    // ❌ DO NOT auto-confirm here
    // ❌ DO NOT force view mode
  }, [isOpen]);
  // STALE TOKEN RECOVERY: If the browser has a userToken but useAuth says we are NOT authenticated
  // (meaning the token expired or was wiped on the server back-end), we must proactively clear 
  // localStorage here. Otherwise, the checkout form might try to use the string or accidentally 
  // block the user from checking out because it incorrectly thinks they are halfway logged in.
  useEffect(() => {
    if (!isUserLoading && !isAuthenticated && userToken) {
      console.warn("🧹 CheckoutDialog detected a stale userToken but user is not authenticated. Clearing localStorage.");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      // Note: we don't need a page reload, the state in useAuth already reflects !isAuthenticated
    }
  }, [isUserLoading, isAuthenticated, userToken]);

  // 🔄 RETRY ORDER: Handle user returning from failed payment with retryOrder query param
  useEffect(() => {
    if (retryOrderId) {
      console.log("[RETRY] Loading previous order:", retryOrderId);

      toast({
        title: "Retry Payment",
        description: "Continuing your previous order",
      });
    }
  }, [retryOrderId]);

  // 🎁 MANUAL VERIFY REFERRAL CODE on button click
  const handleVerifyReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralValidation({
        valid: false,
        message: "Please enter a referral code"
      });
      return;
    }

    setIsValidatingReferral(true);
    validationRunRef.current += 1;
    const thisRunId = validationRunRef.current;
    let validationCompleted = false;
    let safetyTimeout: NodeJS.Timeout | null = null;

    try {
      // Safety timeout (5 seconds)
      safetyTimeout = setTimeout(() => {
        if (!validationCompleted && thisRunId === validationRunRef.current) {
          setIsValidatingReferral(false);
          setReferralValidation({
            valid: false,
            message: "Validation took too long. Please try again."
          });
          localStorage.removeItem("pendingReferralCode");
        }
      }, 5000);

      const codeToValidate = referralCode.trim();

      // Validate with food subtotal ONLY
      const result = await validateReferralMutation.mutateAsync({
        referralCode: codeToValidate,
        orderAmount: subtotal // ✅ Use SUBTOTAL ONLY for accurate referral eligibility
      });

      validationCompleted = true;
      if (safetyTimeout) clearTimeout(safetyTimeout);

      // Ignore if newer validation started
      if (thisRunId !== validationRunRef.current) {
        return;
      }

      // ✅ FIX: Store validatedAmount to track which amount this was verified at
      setReferralValidation({
        ...result,
        validatedAmount: subtotal, // Store current subtotal when verified
        currentAmount: subtotal, // Ensure currentAmount is always set for display
        minRequired: result.minOrderAmount // Map minOrderAmount to minRequired for display
      });
      if (result.valid) {
        localStorage.setItem("pendingReferralCode", codeToValidate);
      } else {
        localStorage.removeItem("pendingReferralCode");
      }
    } catch (error: any) {
      validationCompleted = true;
      if (safetyTimeout) clearTimeout(safetyTimeout);

      // Ignore if newer validation started
      if (thisRunId !== validationRunRef.current) {
        return;
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid referral code";

      // ✅ Extract minimum required amount from error message if present
      // Message format: "Minimum order check failed. Required: ₹130, Current: ₹15"
      let minRequired: number | undefined;
      const minMatch = errorMessage.match(/Required:\s*[₹$]?(\d+)/);
      if (minMatch) {
        minRequired = parseInt(minMatch[1], 10);
      } else if (error.minOrderAmount) {
        minRequired = error.minOrderAmount;
      }

      setReferralValidation({
        valid: false,
        message: errorMessage,
        minRequired: minRequired,
        currentAmount: subtotal,
        validatedAmount: subtotal
      });
      localStorage.removeItem("pendingReferralCode");
    } finally {
      if (thisRunId === validationRunRef.current) {
        setIsValidatingReferral(false);
      }
    }
  };

  // Listen for wallet updates via WebSocket
  useWalletUpdates();

  // Password/login state removed — auth happens silently via login-or-create

  // TWO-STEP CHECKOUT: Step 1 = Address Entry, Step 2 = Order Confirmation
  // This follows Zomato's approach: address first, then partners/fees
  const [checkoutStep, setCheckoutStep] = useState<"address" | "confirmation">("address");
  const [addressValidationMessage, setAddressValidationMessage] = useState("");

  // Fetch category data to see if it requires delivery slots
  // Fetch category data to see if it requires delivery slots
  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["/api/categories", cart?.categoryId],
    queryFn: async () => {
      if (!cart?.categoryId) return null;
      // We don't have a single category endpoint, so get all and filter
      const res = await api.get("/api/categories");
      const found = res.data?.find((c: any) => c.id === cart.categoryId) || null;
      console.log("[DEBUG CheckoutDialog] Fetched Categories. Found match for", cart.categoryId, ":", found);
      return found;
    },
    enabled: !!cart?.categoryId && isOpen,
  });

  // Check if delivery slots should be shown:
  // 1. If category has requiresDeliverySlot flag set (admin configured), OR
  // 2. If category name contains "roti" (regular roti orders)
  const requiresDeliverySlot = !!categoryData?.requiresDeliverySlot ||
    (categoryData?.name?.toLowerCase().includes('roti') ?? false);

  useEffect(() => {
    if (isOpen) {
      console.log("[DEBUG CheckoutDialog] requiresDeliverySlot evaluates to:", requiresDeliverySlot, "based on categoryData:", categoryData);
    }
  }, [isOpen, requiresDeliverySlot, categoryData]);

  // Fetch wallet settings (maxUsagePerOrder and minOrderAmount limits)
  const { data: walletSettings } = useQuery<{
    maxUsagePerOrder: number;
    minOrderAmount: number;
    isActive: boolean;
  }>({
    queryKey: ["/api/wallet-settings"],
    enabled: isOpen,
    refetchInterval: 60000,
  });

  // Fetch referral settings (maxBonusUsagePerOrder limit)
  const { data: referralSettings } = useQuery<{
    referrerBonus: number;
    referredBonus: number;
    minOrderAmount: number;
    maxBonusUsagePerOrder: number;
    maxReferralsPerMonth: number;
    maxEarningsPerMonth: number;
    expiryDays: number;
  }>({
    queryKey: ["/api/referral-settings"],
    enabled: isOpen,
    refetchInterval: 60000,
  });

  // ✅ FIX 1: Fetch user's order history to detect returning users
  const { data: userOrders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && isOpen,
  });

  // ✅ FIX 1: Referral input visibility logic
  // Show ONLY for brand new users (no account yet or first order)
  // Hide if: user already has an active referral (pendingBonus) OR has placed orders before
  // We explicitly ignore "pending" and "cancelled" orders so if a new user returns from 
  // the payment QR dialog, they don't lose the referral panel just because a pending order was created.
  const hasUsedReferral = isAuthenticated && !!user?.pendingBonus;
  const hasPlacedOrder = isAuthenticated && Array.isArray(userOrders) && 
    userOrders.filter(o => o.status !== "pending" && o.status !== "cancelled").length > 0;
  const showReferralInput = !hasUsedReferral && !hasPlacedOrder;

  // GPS Fallback: Get Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("[GPS] Got coordinates:", latitude, longitude);

        // Reverse geocode to get address details
        try {
          const res = await api.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = res.data;

          if (data && data.address) {
            const addr = data.address;
            const pincode = addr.postcode || "";
            const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
            const city = addr.city || addr.town || addr.village || "Mumbai";
            const street = addr.road || "";
            const building = addr.house_number || addr.building || "";

            setAddressPincode(pincode);
            setAddressArea(area);
            setAddressCity(city);
            setAddressStreet(street);
            setAddressBuilding(building);

            // Important: Set coordinates but DO NOT Validate/Finalize yet
            // User must confirm the address first
            setCustomerLatitude(latitude);
            setCustomerLongitude(longitude);

            // Verify if this location is within delivery zone
            if (cart?.chefId) {
              const chefRes = await api.get(`/api/chefs/${cart.chefId}`);
              const chef = chefRes.data;
              const distance = calculateDistance(chef.latitude, chef.longitude, latitude, longitude);

              const maxDist = parseFloat(chef.maxDeliveryDistanceKm);
              if (distance > maxDist) {
                setLocationError(`This location is ${distance.toFixed(1)}km away. We only deliver within ${maxDist}km.`);
                setAddressInDeliveryZone(false);
              } else {
                setAddressInDeliveryZone(true);
                setAddressZoneDistance(distance);
                // Calculate estimated fee for display
                const fee = calculateDynamicDeliveryFee(latitude, longitude, chef.latitude, chef.longitude);
                setDeliveryFee(fee);
                setDeliveryDistance(distance);
              }
            }

            toast({
              title: "Location detected",
              description: "Address details filled. Please verify and confirm.",
            });
          }
        } catch (err) {
          console.error("[GPS] Reverse geocoding failed", err);
          toast({
            title: "Address lookup failed",
            description: "We got your location but couldn't find the address details. Please fill them manually.",
            variant: "destructive",
          });
          // Still set coordinates for fee calc if they fill address
          setCustomerLatitude(latitude);
          setCustomerLongitude(longitude);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("[GPS] Error:", error);
        setIsGettingLocation(false);
        let msg = "Could not get your location.";
        if (error.code === 1) msg = "Location permission denied.";
        if (error.code === 2) msg = "Location unavailable.";
        if (error.code === 3) msg = "Location request timed out.";

        toast({
          title: "Location Error",
          description: msg + " Please enter address manually.",
          variant: "destructive",
        });
      }
    );
  };


  // Update local state when wallet settings are fetched
  useEffect(() => {
    if (walletSettings) {
      console.log("[WALLET] Fetched wallet settings:", walletSettings);
      setMaxWalletUsagePerOrder(walletSettings.maxUsagePerOrder || 10);
      setMinOrderAmountForWallet(walletSettings.minOrderAmount || 0);
      console.log("[WALLET] Set minOrderAmountForWallet to:", walletSettings.minOrderAmount || 0);
    } else {
      console.log("[WALLET] No wallet settings fetched");
    }
  }, [walletSettings]);

  // Update local state when referral settings are fetched
  useEffect(() => {
    if (referralSettings) {
      console.log("[REFERRAL] Fetched referral settings:", referralSettings);
      setMaxBonusUsagePerOrder(referralSettings.maxBonusUsagePerOrder || 10);
      console.log("[REFERRAL] Set maxBonusUsagePerOrder to:", referralSettings.maxBonusUsagePerOrder || 10);
    } else {
      console.log("[REFERRAL] No referral settings fetched");
    }
  }, [referralSettings]);

  // Fetch roti time settings for blocking logic
  const { data: rotiSettings } = useQuery<{
    isBlocked: boolean;
    blockMessage: string;
    currentTime: string;
  }>({
    queryKey: ["/api/roti-settings"],
    enabled: requiresDeliverySlot && isOpen,
    refetchInterval: 60000,
  });

  // Determine if Roti ordering is blocked
  const isRotiOrderBlocked = requiresDeliverySlot && rotiSettings?.isBlocked;
  const rotiBlockMessage =
    rotiSettings?.blockMessage ||
    "Roti orders are not available from 8 AM to 11 AM. Please order before 11 PM for next morning delivery.";

  // Fetch delivery time slots for Roti orders
  const { data: deliverySlots = [] } = useQuery<
    Array<{
      id: string;
      startTime: string;
      endTime: string;
      label: string;
      capacity: number;
      currentOrders: number;
      isActive: boolean;
    }>
  >({
    queryKey: ["/api/delivery-slots"],
    enabled: requiresDeliverySlot,
  });

  // Compute cutoff info for each slot (client-side advisory). Keep in sync with server logic.
  const slotCutoffMap = useMemo(() => {
    const map: Record<
      string,
      {
        cutoffHoursBefore: number;
        cutoffDate: Date;
        isPastCutoff: boolean;
        nextAvailableDate: Date;
        deliveryDateLabel: string;
        isMorningSlot: boolean;
        slotHasPassed: boolean;
      }
    > = {};
    const now = new Date();

    deliverySlots.forEach((slot) => {
      const [hStr, mStr] = (slot.startTime || "00:00").split(":");
      const h = parseInt(hStr || "0", 10) || 0;
      const m = parseInt(mStr || "0", 10) || 0;

      // Check if this is a morning slot (8 AM to 11 AM)
      const isMorningSlot = h >= 8 && h < 11;

      // Get cutoff hours - prefer slot's configured value, otherwise NO cutoff (0 hours)
      let cutoffHours: number;
      if (typeof (slot as any).cutoffHoursBefore === "number") {
        cutoffHours = (slot as any).cutoffHoursBefore;
      } else {
        // Default: NO cutoff (0 hours) - always allow same-day delivery
        cutoffHours = 0;
      }

      // Build today's occurrence of this slot
      const todaySlot = new Date(now);
      todaySlot.setHours(h, m, 0, 0);

      // Special handling for early morning slots (midnight - 6 AM)
      // If current time is evening/night (after 6 PM) and slot is early morning,
      // treat it as "tonight" (add 1 day to slot time)
      const isEarlyMorningSlot = h >= 0 && h < 6;
      const isCurrentlyEvening = now.getHours() >= 18;

      let slotHasPassed: boolean;
      if (isEarlyMorningSlot && isCurrentlyEvening) {
        // It's evening now and slot is early morning - slot is "tonight" (hasn't passed yet)
        slotHasPassed = false;
        // Adjust todaySlot to be tomorrow morning for proper delivery date calculation
        todaySlot.setDate(todaySlot.getDate() + 1);
      } else {
        // Normal calculation: check if slot time has passed
        slotHasPassed = now > todaySlot;
      }

      // Determine if we can still order for today's slot
      let deliveryDate: Date;
      let isPastCutoff: boolean;

      // Simple logic: If slot time has already passed, deliver tomorrow
      // Otherwise, deliver today (no cutoff for afternoon/evening)
      if (slotHasPassed) {
        // Slot already passed today, schedule for tomorrow
        deliveryDate = new Date(todaySlot);
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        isPastCutoff = true;
      } else {
        // Slot hasn't passed yet, deliver today
        deliveryDate = todaySlot;
        isPastCutoff = false;
      }

      // Calculate cutoff date for reference (even though we're not using it for afternoon/evening)
      const cutoffDate = new Date(todaySlot.getTime() - (cutoffHours * 60 * 60 * 1000));

      // Create friendly label for delivery date
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const deliveryDateStart = new Date(deliveryDate);
      deliveryDateStart.setHours(0, 0, 0, 0);

      let deliveryDateLabel: string;
      if (deliveryDateStart.getTime() === todayStart.getTime()) {
        deliveryDateLabel = "Today";
      } else if (deliveryDateStart.getTime() === tomorrowStart.getTime()) {
        deliveryDateLabel = "Tomorrow";
      } else {
        deliveryDateLabel = deliveryDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
      }

      map[slot.id] = {
        cutoffHoursBefore: cutoffHours,
        cutoffDate: cutoffDate,
        isPastCutoff,
        nextAvailableDate: deliveryDate,
        deliveryDateLabel,
        isMorningSlot,
        slotHasPassed,
      };
    });
    return map;
  }, [deliverySlots]);

  const [suggestedReschedule, setSuggestedReschedule] = useState<null | {
    slotId: string;
    nextAvailableDate: string;
  }>(null);

  // Determine if wallet checkbox should be disabled
  const isWalletCheckboxDisabled = useMemo(() => {
    // Calculate if delivery fee should actually be charged
    const deliveryMin = cart?.minOrderAmount || 0;
    const isBelowMin = deliveryMin > 0 && subtotal < deliveryMin;
    const actualFeeForCalc = isBelowMin ? deliveryFee : 0;
    const disabled = minOrderAmountForWallet > 0 && (subtotal + actualFeeForCalc - discount) < minOrderAmountForWallet;
    console.log("[WALLET CHECKBOX] Disabled state calculation:", {
      minOrderAmountForWallet,
      subtotal,
      deliveryFee,
      actualFeeForCalc,
      discount,
      orderTotal: subtotal + actualFeeForCalc - discount,
      isDisabled: disabled,
    });
    return disabled;
  }, [minOrderAmountForWallet, subtotal, deliveryFee, discount, cart?.minOrderAmount]);

  useEffect(() => {
    if (cart) {
      // Calculate original subtotal and item savings
      // If item has offerPercentage, item.price is already the discounted price
      // We need to calculate the original price from: originalPrice = discountedPrice / (1 - offerPercentage/100)
      let originalSubtotalValue = 0;
      let itemSavings = 0;

      cart.items.forEach((item) => {
        console.log("[CHECKOUT] Item:", item.name, "offerPercentage:", item.offerPercentage, "price:", item.price);
        if (item.offerPercentage && item.offerPercentage > 0) {
          // item.price is the discounted price, calculate original price
          const originalPrice = item.price / (1 - item.offerPercentage / 100);
          originalSubtotalValue += originalPrice * item.quantity;
          itemSavings += (originalPrice - item.price) * item.quantity;
          console.log("[CHECKOUT] Calculated savings for", item.name, ":", itemSavings);
        } else {
          // No discount, item.price is the original price
          originalSubtotalValue += item.price * item.quantity;
        }
      });

      // Actual subtotal is always the sum of item.price (which is already discounted if applicable)
      const calculatedSubtotal = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      setOriginalSubtotal(originalSubtotalValue);
      setSubtotal(calculatedSubtotal);
      setItemDiscountSavings(itemSavings);

      // Use current deliveryFee state (updated by calculateDynamicDeliveryFee) or cart default
      // This ensures that geocoding-triggered fee updates are reflected in totals
      const calculatedDeliveryFee = deliveryFee !== 0 || customerLatitude !== null ? deliveryFee : (cart.deliveryFee ?? 20);
      const calculatedDeliveryDistance = deliveryDistance;

      // Check if order is below delivery minimum
      const deliveryMin = cart?.minOrderAmount || 0;
      const isBelowMin = deliveryMin > 0 && calculatedSubtotal < deliveryMin;

      // ⚠️ CRITICAL FIX: Charge delivery fee ONLY if BELOW minimum order amount
      // If order meets minimum threshold, delivery is FREE (deliveryFee = 0)
      // If order is below minimum, user MUST pay delivery fee
      const actualDeliveryFee = isBelowMin ? calculatedDeliveryFee : 0;

      const calculatedDiscount = appliedCoupon
        ? Math.min(
          appliedCoupon.discountAmount,
          calculatedSubtotal + actualDeliveryFee,
        )
        : 0;

      // Log discount changes for debugging cache issues
      if (calculatedDiscount !== discount) {
        console.log("[DISCOUNT CHANGE] Discount updated:", {
          previousDiscount: discount,
          newDiscount: calculatedDiscount,
          appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, discountAmount: appliedCoupon.discountAmount } : null,
          subtotal: calculatedSubtotal,
          calculatedDeliveryFee: calculatedDeliveryFee,
          actualDeliveryFee: actualDeliveryFee,
          maxApplicableDiscount: calculatedSubtotal + actualDeliveryFee,
        });
      }
      setDiscount(calculatedDiscount);

      // ✅ DISPLAY shows calculatedDeliveryFee (the calculated amount like ₹20)
      // ✅ TOTAL uses actualDeliveryFee (what user pays - ₹0 if minimum met)
      // This ensures display shows "₹20 FREE" while total is correctly ₹0 delivery charge
      setDeliveryFee(calculatedDeliveryFee);

      // 🆕 Calculate platform fee based on subtotal and config
      let calculatedPlatformFee = 0;

      if (platformFeeConfig?.platformFeeEnabled) {
        const threshold = platformFeeConfig.platformFeeWaiverThreshold || 200;

        console.log("[CHECKOUT-CALC] Platform fee ENABLED, subtotal:", calculatedSubtotal);

        // ✅ FIX: FREE above threshold
        if (calculatedSubtotal >= threshold) {
          calculatedPlatformFee = 0;
          console.log("[CHECKOUT-CALC] Subtotal >= threshold, platform fee waived");
        }
        // Below threshold → apply slabs
        else if (calculatedSubtotal < 100) {
          calculatedPlatformFee = platformFeeConfig.platformFeeBelow100 || 0;
          console.log("[CHECKOUT-CALC] Subtotal < 100, fee:", calculatedPlatformFee);
        }
        else {
          calculatedPlatformFee = platformFeeConfig.platformFeeBelow200 || 0;
          console.log("[CHECKOUT-CALC] Subtotal < threshold, fee:", calculatedPlatformFee);
        }
      } else {
        console.log("[CHECKOUT-CALC] Platform fee DISABLED or config missing", {
          platformFeeEnabled: platformFeeConfig?.platformFeeEnabled,
          configExists: !!platformFeeConfig,
        });
      }
      setPlatformFee(calculatedPlatformFee);

      console.log("[CHECKOUT-CALC] Final platform fee set to:", calculatedPlatformFee);

      // Calculate base total with actual delivery fee (only added if below minimum) + platform fee
      let baseTotal = calculatedSubtotal + actualDeliveryFee + calculatedPlatformFee - calculatedDiscount;

      console.log("[WALLET DISABLE CHECK] Calculation Values:", {
        calculatedSubtotal,
        calculatedDeliveryFee,
        actualDeliveryFee,
        deliveryMin,
        isBelowMinimum: deliveryMin > 0 && calculatedSubtotal < deliveryMin,
        calculatedDiscount,
        baseTotal,
        minOrderAmountForWallet,
        "isCheckboxDisabled?": minOrderAmountForWallet > 0 && baseTotal < minOrderAmountForWallet,
      });

      // Apply bonus if user has chosen to use it
      if (useBonusAtCheckout && bonusEligible && pendingBonus > 0) {
        // Apply bonus respecting maxBonusUsagePerOrder limit
        const maxAllowed = Math.min(maxBonusUsagePerOrder, pendingBonus);
        const amountToDeduct = Math.min(maxAllowed, baseTotal);
        console.log("[BONUS-CALCULATION] Bonus deduction calculation:", {
          "pendingBonusFromDB": pendingBonus,
          "maxBonusUsagePerOrderFromSettings": maxBonusUsagePerOrder,
          "maxAllowed (min of above two)": maxAllowed,
          "baseTotal": baseTotal,
          "amountToDeduct (min of maxAllowed & baseTotal)": amountToDeduct,
          "reason": "Can't deduct more than total order value"
        });
        setBonusAmountToUse(amountToDeduct);
        baseTotal = Math.max(0, baseTotal - amountToDeduct);
      } else {
        setBonusAmountToUse(0);
      }

      // Apply wallet balance if user has chosen to use it
      if (useWalletBalance && user?.walletBalance && user.walletBalance > 0) {
        // Check minimum order amount requirement
        const isOrderBelowMinimum = minOrderAmountForWallet > 0 && baseTotal < minOrderAmountForWallet;
        console.log("[WALLET] Apply wallet balance check:", {
          useWalletBalance,
          userWalletBalance: user?.walletBalance,
          minOrderAmountForWallet,
          baseTotal,
          isOrderBelowMinimum,
        });

        if (isOrderBelowMinimum) {
          // Don't apply wallet if order is below minimum
          console.log("[WALLET] ❌ Order is BELOW minimum - NOT applying wallet balance");
          setWalletAmountToUse(0);
        } else {
          console.log("[WALLET] ✓ Order meets minimum - applying wallet balance");
          // Apply wallet respecting both maxUsagePerOrder limit and available balance
          const maxAllowed = Math.min(maxWalletUsagePerOrder, user.walletBalance);
          const amountToDeduct = Math.min(maxAllowed, baseTotal);
          setWalletAmountToUse(amountToDeduct);
          baseTotal = Math.max(0, baseTotal - amountToDeduct);
        }
      } else {
        setWalletAmountToUse(0);
      }

      setTotal(baseTotal);

      // Set minimum order display state
      setDeliveryMinOrderAmount(deliveryMin);

      if (deliveryMin > 0 && calculatedSubtotal < deliveryMin) {
        setIsBelowDeliveryMinimum(true);
        setAmountNeededForFreeDelivery(deliveryMin - calculatedSubtotal);
      } else {
        setIsBelowDeliveryMinimum(false);
        setAmountNeededForFreeDelivery(0);
      }
    }
  }, [cart, address, appliedCoupon, useBonusAtCheckout, bonusEligible, pendingBonus, maxBonusUsagePerOrder, bonusAmountToUse, useWalletBalance, user?.walletBalance, maxWalletUsagePerOrder, minOrderAmountForWallet, deliveryFee, customerLatitude, customerLongitude, platformFeeConfig]);
  const profileInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      profileInitializedRef.current = false;
      return;
    }

    if (isOpen && isAuthenticated && user && !profileInitializedRef.current) {
      // Use data from useAuth() hook which fetches from /api/user/profile
      // Always update name from latest profile
      setCustomerName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setDeliveryInstructions(""); // ✅ Reset delivery instructions when loading from profile

      // ✅ FIX: Parse structured address properly from user profile
      let parsedAddress = null;
      if (user.address) {
        try {
          // Try to parse address as JSON if it's stored as object
          parsedAddress = typeof user.address === 'string'
            ? JSON.parse(user.address)
            : user.address;

          // Extract structured fields from parsed address
          setAddressBuilding(parsedAddress.building || "");
          setAddressStreet(parsedAddress.street || "");
          setAddressArea(parsedAddress.area || "");
          setAddressCity(parsedAddress.city || "Mumbai");
          setAddressPincode(parsedAddress.pincode || "");

          console.log("[CHECKOUT] ✅ Parsed and set address from user profile:", parsedAddress);
        } catch (error) {
          // If parsing fails or it's just a plain text address, set as building
          console.log("[CHECKOUT] Address is plain text or unparseable, setting as building field");
          setAddressBuilding(user.address);
        }
      }

      // ✅ Restore coordinates from DB if localStorage is empty and we don't have them yet
      const hasStoredCoords = !!localStorage.getItem("lastValidatedDeliveryAddress") || !!localStorage.getItem("lastValidatedAddressStructured");
      const userWithLocation = user as any; // Cast to bypass TS if User type is missing these fields

      // ✅ ALL 4 FIELDS REQUIRED: Building, Street, Area, Pincode must all be present
      const hasCompleteAddress =
        parsedAddress?.building?.trim() &&
        parsedAddress?.street?.trim() &&
        parsedAddress?.area?.trim() &&
        parsedAddress?.pincode?.trim();

      if (hasUsableCoordinates(userWithLocation.latitude, userWithLocation.longitude) && !hasStoredCoords && customerLatitude === null) {
        console.log("[CHECKOUT] Restoring coordinates from DB profile:", userWithLocation.latitude, userWithLocation.longitude);
        setCustomerLatitude(userWithLocation.latitude);
        setCustomerLongitude(userWithLocation.longitude);

        // Only mark validated if ALL 4 address fields are complete
        if (hasCompleteAddress) {
          setShowAddressForm(true); // ✅ Show address panel immediately when complete address loaded
          prepareRestoredAddressForRevalidation(true);
          console.log("[CHECKOUT] Complete address loaded from profile and queued for re-validation");
        } else {
          prepareRestoredAddressForRevalidation(false);
          console.log("[CHECKOUT] Incomplete address loaded from profile and left in edit mode");
        }
      }

      profileInitializedRef.current = true;
      // activeTab removed — single checkout view only
    }
  }, [user, isAuthenticated, isOpen]);

  // ✅ NEW: Reset delivery instructions when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setDeliveryInstructions("");
    }
  }, [isOpen]);

  // 🛡️ FIX BUG 5: Validate cart exists when dialog opens to prevent stale prop issue
  // If cart prop is null/empty but exists in Zustand store, refresh it
  useEffect(() => {
    if (isOpen && (!cart || cart.items.length === 0)) {
      const { getAllCarts } = useCart.getState();
      const allCarts = getAllCarts();

      if (allCarts.length > 0) {
        // If we have carts in store but cart prop is stale, log a warning
        // This helps debug the state sync issue
        console.log("[CHECKOUT] 🚨 Cart prop is empty but store has carts. Cart prop may be stale.", {
          cartProp: cart,
          storeCarts: allCarts,
          cartPropChefId: cart?.chefId,
          storeCartChefIds: allCarts.map(c => c.chefId)
        });
      }
    }
  }, [isOpen, cart]);

  // 🛡️ FIX BUG 1: Restore user form data when dialog reopens (for ALL users)
  // This ensures address and contact details don't get cleared when user closes and reopens checkout
  useEffect(() => {
    if (isOpen) {
      // Try to restore previously entered form data from localStorage
      const savedFormData = localStorage.getItem("checkoutFormData");
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          if (formData.customerName) setCustomerName(formData.customerName);
          if (formData.phone) setPhone(formData.phone);
          if (formData.email) setEmail(formData.email);
          if (formData.addressBuilding) setAddressBuilding(formData.addressBuilding);
          if (formData.addressStreet) setAddressStreet(formData.addressStreet);
          if (formData.addressArea) setAddressArea(formData.addressArea);
          if (formData.addressCity) setAddressCity(formData.addressCity);
          if (formData.addressPincode) setAddressPincode(formData.addressPincode);
          if (formData.customerLatitude !== undefined) setCustomerLatitude(formData.customerLatitude);
          if (formData.customerLongitude !== undefined) setCustomerLongitude(formData.customerLongitude);
          console.log("[CHECKOUT-FIX] Restored form data for non-authenticated user");

          // 🛡️ FIX: Also restore address validation states if same chef
          const hasCompleteRestoredAddress =
            !!formData.addressBuilding?.trim() &&
            !!formData.addressStreet?.trim() &&
            !!formData.addressArea?.trim() &&
            !!formData.addressPincode?.trim();

          if (formData.chefId === cart?.chefId && formData.addressValidationStates) {
            if (hasCompleteRestoredAddress) {
              setShowAddressForm(true); // ✅ Show address panel immediately when complete address restored
            }
            prepareRestoredAddressForRevalidation(hasCompleteRestoredAddress);
            console.log("[CHECKOUT-FIX] Restored address fields for same chef and queued re-validation");
          }
        } catch (e) {
          console.error("[CHECKOUT] Failed to restore form data:", e);
        }
      }
    }
  }, [isOpen, isAuthenticated, cart?.chefId]);

  // Auto-check phone removed — frontend does NOT check if user exists on typing
  // 🛡️ FIX BUG 1: Save form data to localStorage whenever values change (for non-authenticated users)
  // 🛡️ FIX BUG 1: Save form data to localStorage whenever values change (for ALL users)
  useEffect(() => {
    if (customerName || phone || email || addressBuilding || addressStreet || addressArea || addressPincode) {
      const formData = {
        customerName,
        phone,
        email,
        addressBuilding,
        addressStreet,
        addressArea,
        addressCity,
        addressPincode,
        customerLatitude,
        customerLongitude,
        // 🛡️ FIX: Also save chef ID and address validation states
        chefId: cart?.chefId,
        addressValidationStates: {
          addressZoneValidated,
          addressInDeliveryZone,
          addressConfirmed
        }
      };
      localStorage.setItem("checkoutFormData", JSON.stringify(formData));
    }
  }, [
    customerName, phone, email, 
    addressBuilding, addressStreet, addressArea, addressCity, addressPincode,
    customerLatitude, customerLongitude,
    isAuthenticated, addressZoneValidated, addressInDeliveryZone, addressConfirmed, cart?.chefId
  ]);

  // Restore saved address fields from Context and localStorage when checkout opens
  useEffect(() => {
    // Check if pincode is available in delivery context
    if (isOpen && deliveryLocation.pincode && !addressPincode) {
      console.log("[CHECKOUT] Prepopulating pincode from Context:", deliveryLocation.pincode);
      setAddressPincode(deliveryLocation.pincode);
    }

    const hasCheckoutAddressFields =
      !!addressBuilding.trim() ||
      !!addressStreet.trim() ||
      !!addressArea.trim() ||
      !!addressPincode.trim();

    if (isOpen && deliveryLocation.address && !hasCheckoutAddressFields) {
      console.log("[CHECKOUT] Restoring address from Context:", deliveryLocation.address);

      // Try to restore from localStorage - it has the structured fields
      const stored = localStorage.getItem("lastValidatedDeliveryAddress");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("[CHECKOUT] Found structured address in localStorage:", parsed);

          // Try to get from the full address string as fallback
          // localStorage stores the full address, we need to break it down
          // Check if we have structured fields stored separately
          const structuredStored = localStorage.getItem("lastValidatedAddressStructured");
          if (structuredStored) {
            try {
              const structured = JSON.parse(structuredStored);
              console.log("[CHECKOUT] Restoring structured fields:", structured);
              setAddressBuilding(structured.building || "");
              setAddressStreet(structured.street || "");
              setAddressArea(structured.area || "");
              setAddressCity(structured.city || "Mumbai");
              // Don't override pincode if it came from context
              if (!deliveryLocation.pincode) {
                setAddressPincode(structured.pincode || "");
              }
              // Also restore coordinates for delivery fee calculation
              setCustomerLatitude(parsed.latitude);
              setCustomerLongitude(parsed.longitude);
              
              // ✅ FIX: Show address form immediately when full address loaded
              const hasCompleteAddress = structured.building && structured.street && structured.area && structured.pincode;
              if (hasCompleteAddress) {
                setShowAddressForm(true); // ✅ Show address panel immediately
                prepareRestoredAddressForRevalidation(true);
              } else {
                prepareRestoredAddressForRevalidation(false);
              }
              
              console.log("[CHECKOUT] Address structured fields restored.", { hasCompleteAddress });
              return;
            } catch (e) {
              console.log("[CHECKOUT] Could not parse structured address, will use full address");
            }
          }
        } catch (e) {
          console.warn("[CHECKOUT] Error parsing localStorage address:", e);
        }
      }
    }
  }, [isOpen, deliveryLocation.address, deliveryLocation.pincode, addressPincode, addressBuilding, addressStreet, addressArea]);

  // ============================================
  // RESTORE COORDINATES FROM USER PROFILE
  // IF address matches user's saved address
  // ============================================
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) {
      return;
    }

    // Check if user has saved coordinates
    if (!user.latitude || !user.longitude) {
      console.log("[PROFILE-COORDS] User has no saved coordinates");
      return;
    }

    // Build current checkout address from form fields
    const currentCheckoutAddress = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
      .filter(Boolean)
      .join(", ");

    console.log("[PROFILE-COORDS] Comparing addresses:", {
      userSavedAddress: user.address,
      currentCheckoutAddress,
      match: user.address === currentCheckoutAddress,
      userHasCoordinates: !!user.latitude && !!user.longitude,
    });

    // Only restore if address EXACTLY matches AND user is not already editing
    if (user.address && user.address === currentCheckoutAddress && !addressConfirmed) {
      console.log("[PROFILE-COORDS] ✅ Address match found! Restoring coordinates from user profile");
      console.log("[PROFILE-COORDS] Coordinates source: user_profile (persistent)");

      // Restore coordinates
      setCustomerLatitude(user.latitude);
      setCustomerLongitude(user.longitude);

      // Mark as validated (since we're using saved coordinates)
      setAddressZoneValidated(true);
      setAddressInDeliveryZone(true);
      setLocationError("");

      // Update delivery location context
      setDeliveryLocation({
        latitude: user.latitude,
        longitude: user.longitude,
        address: currentCheckoutAddress,
        isInZone: true,
        validatedAt: new Date().toISOString(),
        source: "user_profile", // ← Track that coords came from saved profile
      });

      console.log("[PROFILE-COORDS] ✅ Coordinates restored successfully");
      console.log(`[PROFILE-COORDS] Using saved coordinates: ${user.latitude}, ${user.longitude}`);
    } else if (user.address && user.address !== currentCheckoutAddress && addressConfirmed) {
      // Address changed since last order - require re-validation
      console.log("[PROFILE-COORDS] ⚠️  Address changed since last order. Re-validation required.");
      setAddressZoneValidated(false);
      setAddressConfirmed(false);
    }
  }, [isOpen, isAuthenticated, user?.latitude, user?.longitude, user?.address, addressBuilding, addressStreet, addressArea, addressPincode, addressCity, addressConfirmed]);

  // Auto-request geolocation when checkout opens for DELIVERY FEE CALCULATION ONLY
  // GPS is NOT used for zone validation - only for accurate delivery fee
  // BUT: Address geocoding is preferred over GPS when available (more accurate in urban areas)
  useEffect(() => {
    if (isOpen && !customerLatitude && !customerLongitude && !hasLocationPermission && !addressArea.trim()) {
      console.log("[LOCATION] Checkout opened - requesting GPS for delivery fee accuracy (NOT for zone validation, and only if no address entered)");

      if (!navigator.geolocation) {
        console.log("[LOCATION] Geolocation not supported by browser");
        return; // Silent fail - address will be used instead
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log("[LOCATION] ✓ GPS captured (for fee calculation only):", { latitude: lat, longitude: lon });
          setCustomerLatitude(lat);
          setCustomerLongitude(lon);
          setHasLocationPermission(true);
          setLocationError("");
        },
        (error) => {
          console.log("[LOCATION] GPS unavailable (fallback to address):", error.message);
          // Silent fail - user will use address-based delivery instead
          // NO zone validation blocking based on GPS
        },
        {
          timeout: 15000, // Longer timeout for Safari
          enableHighAccuracy: false, // False for faster response on mobile
          maximumAge: 0,
        }
      );

    }
  }, [isOpen, customerLatitude, customerLongitude, hasLocationPermission, addressArea]);

  // Fetch pending bonus and referral info from user profile
  // Recalculate delivery fee whenever customer or chef coordinates change
  useEffect(() => {
    console.log("[DELIVERY-FEE-CALC] useEffect triggered:", {
      hasCart: !!cart,
      customerLatitude,
      customerLongitude,
      cartChefLatitude: cart?.chefLatitude,
      cartChefLongitude: cart?.chefLongitude,
      checkLatitude: cart?.chefLatitude || cart?.chefLatitude === 0,
      checkLongitude: cart?.chefLongitude || cart?.chefLongitude === 0,
    });

    if (
      cart &&
      customerLatitude !== null &&
      customerLongitude !== null &&
      (cart.chefLatitude || cart.chefLatitude === 0) &&
      (cart.chefLongitude || cart.chefLongitude === 0)
    ) {
      // Use chef coordinates from cart (populated from chef API response)
      const chefLat = cart.chefLatitude;
      const chefLon = cart.chefLongitude;

      console.log("[DELIVERY-FEE-CALC] Calling calculateDynamicDeliveryFee:", {
        customerLatitude,
        customerLongitude,
        chefLat,
        chefLon,
        subtotal,
        coordinateSource: deliveryLocation.source || "geocoded",
      });

      // Calculate fee using chef coordinates from cart (chef fee data comes from API when needed)
      const newDeliveryFee = calculateDynamicDeliveryFee(
        customerLatitude,
        customerLongitude,
        chefLat,
        chefLon
      );

      console.log("[DELIVERY-FEE-CALC] Fee calculated:", {
        newDeliveryFee,
        coordinateSource: deliveryLocation.source || "geocoded",
        savedAddress: user?.address,
        currentAddress: [addressBuilding, addressStreet, addressArea, addressPincode].filter(Boolean).join(", "),
      });
      setDeliveryFee(newDeliveryFee);

      // Also recalculate total with new delivery fee
      const distance = calculateDistance(chefLat, chefLon, customerLatitude, customerLongitude);
      console.log("[DELIVERY-FEE-CALC] Distance calculated:", distance);
      setDeliveryDistance(distance);

      // ✅ Update cart store with exact location status if address is validated
      // This ensures the "Starting from" message is removed in UI
      if (addressZoneValidated && addressInDeliveryZone) {
        useCart.getState().setUserLocation(customerLatitude, customerLongitude, true);
      }
    } else {
      console.log("[DELIVERY-FEE-CALC] Conditions not met - skipping fee calculation");
    }
  }, [customerLatitude, customerLongitude, cart?.chefLatitude, cart?.chefLongitude, subtotal, addressZoneValidated, addressInDeliveryZone]);

  // Auto-validate delivery on dialog open - use chef's coordinates if area is empty
  useEffect(() => {
    console.log("[CHECKOUT-INIT] Dialog opened with cart:", {
      cartId: cart?.categoryId,
      cartChefId: cart?.chefId,
      cartChefLatitude: cart?.chefLatitude,
      cartChefLongitude: cart?.chefLongitude,
      cartDeliveryFee: cart?.deliveryFee,
      cartDistance: cart?.distance,
      addressArea: addressArea.trim(),
      isOpen,
      addressZoneValidated,
      customerLatitude,
      customerLongitude,
    });

    if (isOpen && cart && !addressZoneValidated && !isEditingAddress && !isGeocodingAddress) {
      if (!addressArea.trim()) {
        console.log("[DELIVERY-ZONE] Skipping auto-validation because address area is empty");
        return;
      } else {
        // If area has value AND we already have coordinates, skip geocoding and validate directly
        const canReuseRestoredCoordinates =
          customerLatitude !== null &&
          customerLongitude !== null &&
          deliveryLocation.source !== "pincode";

        if (canReuseRestoredCoordinates) {
          console.log("[DELIVERY-ZONE] Using restored coordinates instead of re-geocoding");
          // Validate distance directly with restored coordinates
          if (cart.chefLatitude !== undefined && cart.chefLatitude !== null && cart.chefLongitude !== undefined && cart.chefLongitude !== null) {
            const distance = calculateDistance(
              cart.chefLatitude,
              cart.chefLongitude,
              customerLatitude,
              customerLongitude
            );
            const maxDeliveryDistance = cart.maxDeliveryDistanceKm || 10;
            const isInZone = distance <= maxDeliveryDistance;
            const restoredDeliveryFee = calculateDynamicDeliveryFee(
              customerLatitude,
              customerLongitude,
              cart.chefLatitude,
              cart.chefLongitude
            );

            setAddressZoneDistance(distance);
            setDeliveryDistance(distance);
            setDeliveryFee(restoredDeliveryFee);
            setAddressInDeliveryZone(isInZone);
            setAddressZoneValidated(true);

            if (!isInZone) {
              setLocationError(`Address is ${distance.toFixed(1)}km away. Max delivery distance is ${maxDeliveryDistance}km.`);
            } else {
              setLocationError("");
            }
            console.log("[DELIVERY-ZONE] Direct validation completed:", {
              distance,
              isInZone,
              maxDeliveryDistance,
              coordinateSource: deliveryLocation.source || "restored",
            });
          }
          return;
        } else {
          // No coordinates, need to geocode
          const fullAddress = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
            .filter(Boolean)
            .join(", ");
          console.log("[DELIVERY-ZONE] Auto-geocoding on dialog open:", fullAddress);
          autoGeocodeAddress(fullAddress);
          return;
        }
      }
    }
  }, [
    isOpen,
    cart?.chefId,
    cart?.chefLatitude,
    cart?.chefLongitude,
    cart?.maxDeliveryDistanceKm,
    addressArea,
    addressBuilding,
    addressStreet,
    addressCity,
    addressPincode,
    customerLatitude,
    customerLongitude,
    addressZoneValidated,
    isEditingAddress,
    isGeocodingAddress,
    deliveryLocation.source,
  ]);

  // Fetch pending bonus and referral info from user profile
  useEffect(() => {
    if (user && user.pendingBonus) {
      setPendingBonus(user.pendingBonus.amount || 0);
      setMinOrderAmount(user.pendingBonus.minOrderAmount || 0);
      setBonusEligibilityMsg("");
      console.log("[BONUS-FETCH] From DB - Pending Bonus:", {
        amount: user.pendingBonus.amount,
        minOrderAmount: user.pendingBonus.minOrderAmount,
      });
    }
  }, [user]);

  // Check bonus eligibility when total changes
  useEffect(() => {
    if (
      isAuthenticated &&
      userToken &&
      pendingBonus > 0 &&
      total > 0 &&
      isOpen
    ) {
      checkBonusEligibility();
    }
  }, [total, isOpen]);

  // ============================================
  // 🆕 FETCH PLATFORM FEE CONFIG ON DIALOG OPEN
  // ============================================
  useEffect(() => {
    const fetchPlatformFeeConfig = async () => {
      try {
        console.log("[CHECKOUT] Fetching platform fee config from /api/payment-settings...");
        const response = await fetch(getApiUrl("/api/payment-settings"));
        if (response.ok) {
          const config = await response.json();
          setPlatformFeeConfig(config);
          console.log("[CHECKOUT] ✅ Platform fee config fetched successfully:", {
            platformFeeEnabled: config?.platformFeeEnabled,
            below100: config?.platformFeeBelow100,
            below200: config?.platformFeeBelow200,
            above200: config?.platformFeeAbove200,
            platformFeeWaiverThreshold: config?.platformFeeWaiverThreshold,
          });
        } else {
          console.warn("[CHECKOUT] ⚠️ Failed to fetch payment settings, status:", response.status);
          // Default if fetch fails
          const defaults = {
            platformFeeEnabled: false,
            platformFeeBelow100: 0,
            platformFeeBelow200: 0,
            platformFeeAbove200: 0,
            platformFeeWaiverThreshold: 200,
          };
          setPlatformFeeConfig(defaults);
          console.log("[CHECKOUT] Using default config:", defaults);
        }
      } catch (error) {
        console.error("[CHECKOUT] ❌ Failed to fetch payment settings:", error);
        // Default if fetch fails
        const defaults = {
          platformFeeEnabled: false,
          platformFeeBelow100: 0,
          platformFeeBelow200: 0,
          platformFeeAbove200: 0,
          platformFeeWaiverThreshold: 200,
        };
        setPlatformFeeConfig(defaults);
        console.log("[CHECKOUT] Using default config on error:", defaults);
      }
    };

    if (isOpen) {
      console.log("[CHECKOUT] Dialog opened - fetching platform fee config");
      fetchPlatformFeeConfig();
    }
  }, [isOpen]);

  // ============================================
  // PHASE 5: CHECKOUT SAFETY - AUTO-FILL AREA IF USER CLEARS IT
  // ============================================
  useEffect(() => {
    // Only run if area field becomes empty after user had other address fields filled
    if (addressArea === "" && (addressBuilding.trim() || addressStreet.trim())) {
      // Wait 1 second to see if user is still typing
      const timer = setTimeout(async () => {
        // Check if area is STILL empty
        if (addressArea === "") {
          console.log("[CHECKOUT-SAFETY] Area field is empty, attempting auto-detection");

          // Try to detect area from coordinates if available
          if (customerLatitude !== null && customerLongitude !== null) {
            try {
              const response = await fetch(
                `/api/areas/by-coordinates?latitude=${customerLatitude}&longitude=${customerLongitude}`
              );

              if (response.ok) {
                const data = await response.json();
                if (data.area) {
                  setAddressArea(data.area);
                  console.log(`✅ [CHECKOUT-SAFETY] Auto-filled area at checkout: ${data.area}`);

                  // Trigger re-geocoding with the newly filled area
                  const fullAddress = [addressBuilding, addressStreet, data.area, addressCity, addressPincode]
                    .filter(Boolean)
                    .join(", ");
                  autoGeocodeAddress(fullAddress);
                }
              }
            } catch (error) {
              console.warn("[CHECKOUT-SAFETY] Area auto-fill failed:", error);
              // Gracefully fail - user can still manually enter area
            }
          }
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [addressArea, addressBuilding, addressStreet, customerLatitude, customerLongitude]);

  const checkBonusEligibility = async () => {
    if (!userToken || pendingBonus <= 0) return;

    setIsCheckingBonusEligibility(true);
    try {
      // ✅ FIX: Use subtotal (food-only cost), NOT total (which includes delivery fee).
      // minOrderAmount is configured by admin expecting food cost only.
      // Using total caused mobile/desktop inconsistency (different delivery fees = different totals).
      const orderAmount = Number(subtotal || 0);
      const response = await api.post("/api/user/check-bonus-eligibility", {
        orderTotal: orderAmount,
      });

      const result = response.data;
      setBonusEligible(result.eligible);
      console.log("[BONUS-ELIGIBILITY-RESPONSE] Backend returned:", {
        eligible: result.eligible,
        bonus: result.bonus,
        minOrderAmount: result.minOrderAmount,
        reason: result.reason
      });
      if (result.eligible) {
        setBonusEligibilityMsg(`✓ You can claim ₹${result.bonus} bonus!`);
      } else {
        // Show actionable shortfall message if minOrderAmount is known
        if (result.minOrderAmount && result.minOrderAmount > 0) {
          const shortfall = Math.max(0, result.minOrderAmount - orderAmount);
          if (shortfall > 0) {
            setBonusEligibilityMsg(
              `Add ₹${shortfall.toFixed(0)} more to unlock ₹${result.bonus || pendingBonus} referral bonus 🎁`,
            );
          } else {
            setBonusEligibilityMsg(
              result.reason ||
              `Minimum order of ₹${result.minOrderAmount} required for bonus`,
            );
          }
        } else {
          setBonusEligibilityMsg(
            result.reason || "Minimum order amount not met for referral bonus",
          );
        }
      }
    } catch (error: any) {
      console.error("Error checking bonus eligibility:", error);
      setBonusEligible(false);
      // ✅ FIX: Show friendly message instead of raw HTTP error string
      const serverMsg = error?.response?.data?.message;
      const minAmt = error?.response?.data?.minOrderAmount;
      if (minAmt && minAmt > 0) {
        const shortfall = Math.max(0, minAmt - Number(subtotal || 0));
        setBonusEligibilityMsg(
          shortfall > 0
            ? `Add ₹${shortfall.toFixed(0)} more to unlock referral bonus 🎁`
            : serverMsg || "Minimum order amount not met for referral bonus",
        );
      } else {
        setBonusEligibilityMsg(
          serverMsg || "Minimum order amount not met for referral bonus",
        );
      }
    } finally {
      setIsCheckingBonusEligibility(false);
    }
  };

  const handlePhoneChange = async (value: string) => {
    const cleanPhone = value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleanPhone); // Allow only digits, max 10
  };

  // (old/duplicate ensureUserAuthenticated removed)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsVerifyingCoupon(true);
    setCouponError("");

    try {
      const response = await api.post("/api/coupons/verify", {
        code: couponCode,
      });

      const data = response.data;
      console.log("[COUPON] Coupon verified successfully:", {
        code: couponCode,
        discountAmount: data.discountAmount,
      });
      // Only set appliedCoupon - let useEffect handle discount recalculation
      // This prevents double state updates and ensures consistent batching
      setAppliedCoupon({
        code: couponCode,
        discountAmount: data.discountAmount,
      });
      console.log("[COUPON] Applied coupon state updated, awaiting useEffect to recalculate discount");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Invalid coupon code";
      console.log("[COUPON] Coupon verification failed:", errorMessage);
      setCouponError(errorMessage);
      setAppliedCoupon(null);
      console.error("Coupon application error:", error);
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    console.log("[COUPON] Removing applied coupon");
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    // Let useEffect handle discount recalculation when appliedCoupon state changes
    console.log("[COUPON] Coupon state cleared, awaiting useEffect to recalculate discount");
  };

  // Handle geolocation request
  const handleRequestLocation = async () => {
    setIsRequestingLocation(true);
    setLocationError("");

    try {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        return;
      }

      // For Safari compatibility: Use watchPosition with timeout instead of just getCurrentPosition
      let watchId: number | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      const clearWatch = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log("[LOCATION] ✓ GPS location captured (watchPosition):", { latitude: lat, longitude: lon, accuracy: position.coords.accuracy });
          setCustomerLatitude(lat);
          setCustomerLongitude(lon);
          setHasLocationPermission(true);
          setLocationError("");
          setIsRequestingLocation(false);
          clearWatch();
          toast({
            title: "✓ GPS Location Captured",
            description: `Accuracy: ${position.coords.accuracy?.toFixed(0)}m - Delivery fee calculated`,
          });
        },
        (error) => {
          console.error("[LOCATION] Geolocation error:", { code: error.code, message: error.message });
          setIsRequestingLocation(false);

          // Safari-specific error handling
          let errorMsg = "Could not get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location permission denied. Go to Settings → Privacy → Location Services to enable it.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location not available. Please check signal strength and try again.";
              break;
            case error.TIMEOUT:
              errorMsg = "Location detection timed out. Please try again or enter address manually.";
              break;
            default:
              errorMsg = "Could not detect location. You can still enter your address manually.";
          }
          setLocationError(errorMsg);
          clearWatch();
        },
        {
          timeout: 10000,
          enableHighAccuracy: false, // Faster location, accuracy is fine for delivery
        }
      );
    } catch (error) {
      setLocationError("Error requesting location permission");
      console.error("[LOCATION] Geolocation error:", error);
    } finally {
      setIsRequestingLocation(false);
    }
  };



  // Handle any address field change - NO AUTO-GEOCODING anymore
  // User must click "Validate Address" button to trigger validation
  const handleAddressChange = (field: string, value: string) => {
    // Update the specific field - text input NEVER gets cleared
    switch (field) {
      case 'building':
        setAddressBuilding(value);
        break;
      case 'street':
        setAddressStreet(value);
        break;
      case 'area':
        setAddressArea(value);
        // Show area suggestions if user is typing
        if (value.trim().length > 0) {
          const suggestions = getAreaSuggestions(value);
          setAreaSuggestions(suggestions);
          setShowAreaSuggestions(suggestions.length > 0);
        } else {
          setShowAreaSuggestions(false);
          setAreaSuggestions([]);
        }
        break;
      case 'city':
        setAddressCity(value);
        break;
      case 'pincode':
        setAddressPincode(value);
        // 🔥 REMOVED auto-validation on typing
        break;
    }

    // Any edit means we are in "Editing" mode and validation is invalid
    setIsEditingAddress(true);
    setAddressZoneValidated(false);
    setAddressInDeliveryZone(false);
    setAddressConfirmed(false); // Reset confirmation so Pay button disables until re-validation
    setLocationError("");
    setDeliveryLocation({ ...deliveryLocation, isInZone: false }); // Hide menu temporarily

    // Clear previous timeout if any
    if (autoGeocodeTimeoutRef.current) {
      clearTimeout(autoGeocodeTimeoutRef.current);
    }
  };



  const handlePincodeChange = async (newPincode: string) => {
    console.log("[PINCODE-CHANGE] User changed pincode to:", newPincode);

    // Only proceed if pincode is valid format
    if (!newPincode || !/^\d{5,6}$/.test(newPincode)) {
      console.log("[PINCODE-CHANGE] Invalid pincode format, skipping validation");
      setAddressZoneValidated(false);
      setLocationError("Pincode must be 5-6 digits");
      setIsReValidatingPincode(false);
      return;
    }

    setIsReValidatingPincode(true);

    // STEP 1: Validate pincode format and existence
    console.log("[PINCODE-CHANGE] Step 1: Validating pincode format and existence...");
    try {
      // Increased timeout to 15 seconds for mobile networks (slower connections)
      const pincodeValidationResponse = await api.post("/api/validate-pincode", {
        pincode: newPincode,
      }, { timeout: 15000 });

      if (!pincodeValidationResponse.data.success) {
        console.warn("[PINCODE-CHANGE] ❌ Pincode validation failed:", pincodeValidationResponse.data.message);
        setLocationError(pincodeValidationResponse.data.message || "Pincode not available in delivery areas");
        setAddressZoneValidated(false);
        setIsReValidatingPincode(false);
        return;
      }

      const pincodeData = pincodeValidationResponse.data;
      console.log("[PINCODE-CHANGE] ✅ Pincode validated:", {
        pincode: newPincode,
        area: pincodeData.area,
        latitude: pincodeData.latitude,
        longitude: pincodeData.longitude,
      });

      // STEP 2: Check if chef serves this pincode (Layer 2 validation)
      console.log("[PINCODE-CHANGE] Step 2: Checking if chef serves this pincode...");
      if (cart?.chefId) {
        try {
          const chefResponse = await api.get(`/api/chefs/${cart.chefId}`, { timeout: 10000 });
          const chefData = chefResponse.data;

          // Check Layer 2: Chef's service pincodes
          if (chefData.servicePincodes && Array.isArray(chefData.servicePincodes) && chefData.servicePincodes.length > 0) {
            const pincodeValid = chefData.servicePincodes.includes(newPincode);
            console.log("[PINCODE-CHANGE] Chef service pincodes check:", {
              chefId: chefData.id,
              chefName: chefData.name,
              servicePincodes: chefData.servicePincodes,
              userPincode: newPincode,
              valid: pincodeValid,
            });

            if (!pincodeValid) {
              console.warn("[PINCODE-CHANGE] ❌ Chef does not serve this pincode");
              setLocationError(
                `${chefData.name} does not deliver to pincode ${newPincode}. Served pincodes: ${chefData.servicePincodes.join(", ")}`
              );
              setAddressZoneValidated(false);
              setIsReValidatingPincode(false);
              return;
            }
            console.log("[PINCODE-CHANGE] ✅ Chef serves this pincode");
          }
        } catch (chefError) {
          console.warn("[PINCODE-CHANGE] Could not fetch chef details for pincode validation:", chefError);
          // Don't block, let user proceed with address validation
        }
      }

      // STEP 3: Refine coordinates if building/street provided (for more accurate distance)
      console.log("[PINCODE-CHANGE] Step 3: Refining delivery coordinates...");

      let finalLat = pincodeData.latitude;
      let finalLon = pincodeData.longitude;
      let geocodingAccuracy = 'pincode'; // Default to pincode center

      // Try to get more precise coordinates using the new smart geocoding endpoint
      if (addressArea.trim()) {
        try {
          console.log("[PINCODE-CHANGE] Attempting to geocode full address with smart fallbacks:", {
            building: addressBuilding,
            street: addressStreet,
            area: addressArea,
            pincode: newPincode
          });

          // Use new geocode-full-address endpoint with smart fallbacks
          const geocodeResponse = await api.post("/api/geocode-full-address",
            {
              building: addressBuilding,
              street: addressStreet,
              area: addressArea,
              pincode: newPincode
            },
            { timeout: 15000 } // Longer timeout for multiple fallback attempts
          );

          if (geocodeResponse.data?.success) {
            finalLat = geocodeResponse.data.latitude;
            finalLon = geocodeResponse.data.longitude;
            geocodingAccuracy = geocodeResponse.data.accuracy;
            console.log("[PINCODE-CHANGE] ✅ Coordinates geocoded:", {
              latitude: finalLat,
              longitude: finalLon,
              accuracy: geocodingAccuracy,
              message: geocodeResponse.data.message
            });
          } else {
            console.log("[PINCODE-CHANGE] Geocoding failed, using pincode center coordinates");
          }
        } catch (error) {
          // If geocoding fails, just use pincode center (fallback)
          console.log("[PINCODE-CHANGE] Geocoding error, using pincode center coordinates (fallback)");
        }
      }

      // STEP 4: Recalculate distance
      console.log("[PINCODE-CHANGE] Step 4: Recalculating distance...");
      if (cart?.chefId) {
        try {
          const chefResponse = await api.get(`/api/chefs/${cart.chefId}`, { timeout: 10000 });
          const chefData = chefResponse.data;
          // Use chef API response directly (chef data always has these fields)
          const chefLat = chefData.latitude;
          const chefLon = chefData.longitude;
          const maxDeliveryDistance = chefData.maxDeliveryDistanceKm;

          const newDistance = calculateDistance(
            chefLat,
            chefLon,
            finalLat,
            finalLon
          );

          const isInZone = newDistance <= maxDeliveryDistance;
          console.log("[PINCODE-CHANGE] Distance recalculated:", {
            distance: newDistance.toFixed(2),
            maxDistance: maxDeliveryDistance,
            inZone: isInZone,
          });

          if (!isInZone) {
            console.warn("[PINCODE-CHANGE] ❌ Pincode is outside delivery zone");
            setLocationError(
              `Pincode ${newPincode} is ${newDistance.toFixed(1)}km away. ${chefData.name} delivers within ${maxDeliveryDistance}km.`
            );
            setAddressZoneValidated(false);
            setAddressInDeliveryZone(false);
            setAddressZoneDistance(newDistance);
            setIsReValidatingPincode(false);
            return;
          }

          // STEP 5: Recalculate delivery fee with refined coordinates
          console.log("[PINCODE-CHANGE] Step 5: Recalculating delivery fee...");
          // Pass chef data to calculate fee using chef-specific fee parameters
          const newDeliveryFee = calculateDynamicDeliveryFee(
            finalLat,
            finalLon,
            chefLat,
            chefLon
          );

          console.log("[PINCODE-CHANGE] ✅ All validations passed!", {
            pincode: newPincode,
            area: pincodeData.area,
            distance: newDistance.toFixed(2),
            deliveryFee: newDeliveryFee,
            coordinateSource: finalLat === pincodeData.latitude ? 'pincode-center' : 'geocoded',
          });

          // Update all state with new validated data
          setAddressArea(pincodeData.area); // Auto-correct area to database value for confirmation
          setCustomerLatitude(finalLat);
          setCustomerLongitude(finalLon);
          setAddressZoneDistance(newDistance);
          setDeliveryDistance(newDistance); // ✅ FIX: Ensure payment screen shows same distance as validation

          // 🔍 DEBUG: Log exact coordinates used for pincode/area validation
          console.log("[DISTANCE-DEBUG] Coordinates used for pincode/area calculation:", {
            chef: { lat: chefLat, lon: chefLon, source: "Database (AdminChefs)" },
            user: { lat: finalLat, lon: finalLon, source: geocodingAccuracy === 'pincode' ? 'Pincode Center' : 'Smart Geocoding' },
            calculatedDistance: newDistance.toFixed(3) + "km",
            note: "Ensuring consistency between validation and fee calculation"
          });

          setAddressInDeliveryZone(true);
          setAddressZoneValidated(true);

          // ✅ GUARD: Only switch to view mode AND confirm if ALL 4 fields are complete
          if (isAddressComplete) {
            setIsEditingAddress(false); // Collapsed View mode
            setAddressConfirmed(true);  // Allow viewing payment immediately since they already pushed validate
            setShouldScrollToSlots(true); // ✅ Trigger auto-scroll
          } else {
            // Keep in edit mode so user sees what's missing
            setIsEditingAddress(true);
            setAddressConfirmed(false);  // Prevent premature confirmation
          }

          setLocationError("");

          // Update Context
          setDeliveryLocation({
            isInZone: true,
            address: `${pincodeData.area}, ${newPincode}`,
            latitude: finalLat,
            longitude: finalLon,
            distance: newDistance,
            pincode: newPincode,
            areaName: pincodeData.area,
            validatedAt: new Date().toISOString(),
            source: geocodingAccuracy === 'pincode' ? 'pincode' : 'manual',
          });

          // Also save structured address fields
          localStorage.setItem("lastValidatedAddressStructured", JSON.stringify({
            building: addressBuilding,
            street: addressStreet,
            area: pincodeData.area,
            city: addressCity,
            pincode: newPincode,
          }));

          console.log("[PINCODE-CHANGE] ✅ State updated - checkout ready!");

        } catch (error) {
          console.warn("[PINCODE-CHANGE] Error during re-validation:", error);
          setLocationError("Could not validate pincode. Please try again.");
          setAddressZoneValidated(false);
        }
      }
    } catch (error: any) {
      console.error("[PINCODE-CHANGE] Pincode validation request failed:", error);

      // Provide more specific error messages based on error type
      if (error?.response?.data?.message) {
        setLocationError(error.response.data.message);
      } else if (error?.message?.includes("timeout")) {
        setLocationError("Validation timed out. Please check your internet connection and try again.");
      } else if (error?.message?.includes("Network")) {
        setLocationError("Network error. Please check your internet connection.");
      } else {
        setLocationError("Could not validate pincode. Please try again.");
      }

      setAddressZoneValidated(false);
    } finally {
      setIsReValidatingPincode(false);
    }
  };

  // Manual validation function - called only when user clicks "Validate Address" button
  const handleValidateAddressClick = async () => {
    // ✅ Enforce Name & Phone before address validation
    if (!customerName?.trim() || !phone?.trim()) {
      toast({
        title: "Missing details",
        description: "Please enter your name and phone number before validating address",
        variant: "destructive",
      });
      setIsEditingAddress(true);
      return;
    }

    const fullAddress = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
      .filter(Boolean)
      .join(", ");

    // Validate that pincode is provided
    if (!addressPincode || addressPincode.trim().length === 0) {
      setLocationError("Pincode is required for delivery validation");
      setAddressZoneValidated(false);
      return;
    }

    // Validate pincode format (5-6 digits)
    const pincodeRegex = /^\d{5,6}$/;
    if (!pincodeRegex.test(addressPincode)) {
      setLocationError("Pincode must be 5-6 digits (e.g., 400070)");
      setAddressZoneValidated(false);
      return;
    }

    // Require at least area
    if (!addressArea.trim() || addressArea.trim().length < 2) {
      setLocationError("Please enter at least the area/locality name");
      setAddressZoneValidated(false);
      return;
    }

    // ✅ MANDATORY: Require Building/House No
    if (!addressBuilding.trim()) {
      setLocationError("Please enter building/house number");
      setAddressZoneValidated(false);
      return;
    }

    // ✅ MANDATORY: Require Street/Colony
    if (!addressStreet.trim()) {
      setLocationError("Please enter street/colony name");
      setAddressZoneValidated(false);
      return;
    }

    console.log("[LOCATION] User clicked Validate Address button, will geocode:", fullAddress);
    await autoGeocodeAddress(fullAddress);
  };

  const autoGeocodeAddress = async (addressToGeocode: string) => {
    const normalizedGeocodeKey = addressToGeocode.trim().toLowerCase();

    if (geocodingAddressInFlightRef.current === normalizedGeocodeKey) {
      console.log("[LOCATION] Skipping duplicate geocode request already in progress:", addressToGeocode);
      return;
    }

    geocodingAddressInFlightRef.current = normalizedGeocodeKey;
    setIsGeocodingAddress(true);
    setLocationError("");

    try {
      console.log("[LOCATION] Starting geocoding with structured address:", {
        building: addressBuilding,
        street: addressStreet,
        area: addressArea,
        pincode: addressPincode
      });

      // Use new geocode-full-address endpoint with smart fallbacks
      const response = await api.post("/api/geocode-full-address",
        {
          building: addressBuilding,
          street: addressStreet,
          area: addressArea,
          pincode: addressPincode
        },
        { timeout: 15000 } // Longer timeout for multiple fallback attempts
      );

      const data = response.data;

      if (!data.success) {
        console.warn("[LOCATION] Geocode returned success=false:", data);
        setLocationError(data.message || "Could not find this address. Try a different one.");
        setAddressZoneValidated(false);
        setIsGeocodingAddress(false);
        return;
      }

      console.log("[LOCATION] Address geocoded successfully:", {
        address: addressToGeocode.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        source: data.source, // 'google', 'openstreetmap', or 'admin_data'
        message: data.message
      });

      if (data.accuracy === 'pincode') {
        console.warn("⚠️ [LOCATION] Using Pincode Fallback (Low Accuracy) - This is normal if precise geocoding unavailable");
        // Silent fallback - system continues normally with pincode coordinates
        // No toast warning shown because coordinates are valid and delivery will work correctly
      }

      // Get chef coordinates for automatic zone validation from API
      let chefLat: number | null = null;
      let chefLon: number | null = null;
      let chefName = "";
      let maxDeliveryDistance: number | null = null;

      if (cart?.chefId) {
        try {
          console.log("[LOCATION] Fetching chef details for ID:", cart.chefId);
          const chefResponse = await api.get(`/api/chefs/${cart.chefId}`, {
            timeout: 5000,
          });
          const chefData = chefResponse.data;
          // Set chef coordinates from API response (no hardcoded values)
          chefLat = chefData.latitude;
          chefLon = chefData.longitude;
          maxDeliveryDistance = chefData.maxDeliveryDistanceKm;
          console.log("[DELIVERY-ZONE] Chef coordinates fetched:", { chefLat, chefLon, chefName, maxDeliveryDistance });
        } catch (chefError) {
          console.warn("[DELIVERY-ZONE] Could not fetch chef details:", chefError);
          setLocationError("Could not fetch chef details for distance validation. Please try again.");
          setIsGeocodingAddress(false);
          return;
        }
      }

      // If we couldn't get chef data, we can't validate distance
      if (chefLat === null || chefLon === null || maxDeliveryDistance === null) {
        console.warn("[DELIVERY-ZONE] Missing chef data, cannot validate distance");
        setLocationError("Chef information not available. Please try again.");
        setIsGeocodingAddress(false);
        return;
      }


      const distanceFromChef = calculateDistance(
        chefLat,
        chefLon,
        data.latitude,
        data.longitude
      );

      // 🔍 DEBUG: Log exact coordinates used for distance calculation
      console.log("[DISTANCE-DEBUG] Coordinates used for calculation:", {
        chef: { lat: chefLat, lon: chefLon, source: "Database (AdminChefs)" },
        user: { lat: data.latitude, lon: data.longitude, source: "Google Geocoding" },
        calculatedDistance: distanceFromChef.toFixed(3) + "km",
        note: "If same address, distance should be ~0km"
      });


      const isInZone = distanceFromChef <= maxDeliveryDistance;
      const areaName = addressToGeocode.trim().split(",")[0].trim();

      console.log("[DELIVERY-ZONE] Auto-validation completed:", {
        address: addressToGeocode.trim(),
        areaName,
        distance: distanceFromChef.toFixed(3),
        maxDistance: maxDeliveryDistance,
        isInZone,
        chef: chefName,
      });

      // Store coordinates automatically
      // IMPORTANT: Address geocoding coordinates are preferred over GPS
      // because they are more accurate for delivery in urban areas
      console.log("[LOCATION] Setting customer coordinates in state (address-geocoded):", {
        latitude: data.latitude,
        longitude: data.longitude,
        distanceFromChef,
        note: "Address geocoding preferred over GPS for accuracy",
      });
      setCustomerLatitude(data.latitude);
      setCustomerLongitude(data.longitude);
      setHasLocationPermission(true);
      setAddressZoneDistance(distanceFromChef);
      setDeliveryDistance(distanceFromChef); // ✅ FIX: Ensure payment screen shows same distance as validation

      if (!isInZone) {
        console.log("[DELIVERY-ZONE] ❌ OUT OF ZONE - Address blocked");
        setLocationError(
          `${areaName} is ${distanceFromChef.toFixed(1)}km away. ${chefName} delivers within ${maxDeliveryDistance}km.`
        );
        setAddressInDeliveryZone(false);
        setAddressZoneValidated(true);
        // Update Context to BLOCK menu
        setDeliveryLocation({
          isInZone: false,
          address: addressToGeocode.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          distance: distanceFromChef,
          validatedAt: new Date().toISOString(),
          source: data.accuracy === 'pincode' ? 'pincode' : 'manual',
        });
        // Also save structured address fields for rebinding
        localStorage.setItem("lastValidatedAddressStructured", JSON.stringify({
          building: addressBuilding,
          street: addressStreet,
          area: addressArea,
          city: addressCity,
          pincode: addressPincode,
        }));
      } else {
        console.log("[DELIVERY-ZONE] ✅ IN ZONE - Address validated");
        setLocationError("");
        setAddressInDeliveryZone(true);
        setAddressZoneValidated(true);
        setIsEditingAddress(false); // Switch to View Mode on success
        // Update Context to SHOW menu (this triggers Home.tsx to load categories!)
        setDeliveryLocation({
          isInZone: true,
          address: addressToGeocode.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          distance: distanceFromChef,
          validatedAt: new Date().toISOString(),
          source: data.accuracy === 'pincode' ? 'pincode' : 'manual',
        });
        // Also save structured address fields for rebinding
        localStorage.setItem("lastValidatedAddressStructured", JSON.stringify({
          building: addressBuilding,
          street: addressStreet,
          area: addressArea,
          city: addressCity,
          pincode: addressPincode,
        }));
        console.log("[CONTEXT] Updated delivery location - Home.tsx will now show menu!");

        console.log("[CONTEXT] Updated delivery location - Home.tsx will now show menu!");

        // Trigger safe auto-scroll via state and ref mechanism
        setShouldScrollToSlots(true);
      }
    } catch (error: any) {
      console.error("[LOCATION] Auto-geocoding failed:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        response: error?.response?.data,
        type: error instanceof TypeError ? "Network/Fetch Error" : "Other Error",
      });

      // Check if it's an axios error with response data (e.g., area mismatch)
      if (error?.response?.data) {
        const errData = error.response.data;
        if (errData.distanceMismatch && errData.detectedArea && errData.requestedArea) {
          setLocationError(
            `The address you entered appears to be in ${errData.detectedArea}, not ${errData.requestedArea}. Please verify and try again.`
          );
        } else if (errData.message) {
          setLocationError(errData.message);
        } else {
          setLocationError("Could not validate address. Please try again.");
        }
      } else if (error instanceof TypeError) {
        // Network error (fetch failed)
        setLocationError(
          "Location service unavailable. Please check your internet connection and try again."
        );
      } else if (error instanceof DOMException && error.name === "AbortError") {
        // Timeout
        setLocationError("Location detection timed out. Please try again.");
      } else {
        setLocationError(
          error instanceof Error
            ? error.message
            : "Unable to detect location. Please check the address and try again."
        );
      }

      setAddressZoneValidated(false);
    } finally {
      if (geocodingAddressInFlightRef.current === normalizedGeocodeKey) {
        geocodingAddressInFlightRef.current = null;
      }
      setIsGeocodingAddress(false);
    }
  };

  // Calculate delivery fee using shared utility (respects Admin Settings)
  const calculateDynamicDeliveryFee = (
    customerLat: number,
    customerLon: number,
    chefLat: number,
    chefLon: number
  ) => {
    const distance = calculateDistance(chefLat, chefLon, customerLat, customerLon);

    // Get delivery settings and admin multiplier from cart store
    const state = useCart.getState();
    const settings = state.deliverySettings;
    const ps = state.paymentSettings;
    const multiplier = ps && ps.enableRoadDistanceMultiplier === false
      ? 1.0
      : parseFloat(ps?.roadDistanceMultiplier ?? "1.50");

    const { deliveryFee, freeDeliveryEligible, amountForFreeDelivery, minOrderAmount } = calculateDelivery(
      distance,
      subtotal,
      settings,
      multiplier
    );

    // Update state to reflect delivery constraints
    const requiredAmount = minOrderAmount || 0;
    const isBelowMin = subtotal < requiredAmount;
    const amountNeeded = isBelowMin ? requiredAmount - subtotal : 0;

    console.log("[DEBUG-FEE] Logic Check:", {
      requiredAmount,
      isBelowMin,
      amountNeeded,
      subtotal,
      deliveryFeeFromSettings: deliveryFee
    });

    setAmountNeededForFreeDelivery(amountNeeded);
    setIsBelowDeliveryMinimum(isBelowMin);
    setMinOrderAmount(requiredAmount);

    console.log("[DELIVERY-FEE] Calculated using Admin Settings:", {
      rawDistance: distance.toFixed(5) + " km", // Show full precision
      displayDistance: Math.max(distance, 0.5).toFixed(1) + " km (Because UI shows min 0.5km)",
      deliveryFee,
      freeDeliveryEligible,
      minOrderAmount
    });

    return deliveryFee;
  };

  const ensureUserAuthenticated = async () => {
    if (isAuthenticated) return true;

    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid phone",
        description: "Please enter a valid 10-digit number",
        variant: "destructive",
      });
      return false;
    }

    try {
      const res = await api.post("/api/user/login-or-create", {
        name: customerName,
        phone,
        email,
        address: addressBuilding,
      });

      const data = res.data;

      if (!data?.accessToken || !data?.user) {
        throw new Error("Invalid auth response");
      }

      localStorage.setItem("userToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken || "");
      localStorage.setItem("userData", JSON.stringify(data.user));

      return true;
    } catch (err) {
      console.error("[AUTH] Failed", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ MULTI-CLICK PROTECTION: Prevent double submission
    if (isProcessingCheckout) return;
    setIsProcessingCheckout(true);
    try {

      // ✅ FIX 3: HARD REFETCH wallet before placing order to prevent double usage
      if (isAuthenticated) {
        try {
          console.log("[CHECKOUT] Refetching wallet balance before order...");
          await queryClient.refetchQueries({ queryKey: ['/api/user/profile'] });
          console.log("[CHECKOUT] ✅ Wallet refreshed");
        } catch (err) {
          console.warn('[CHECKOUT] Wallet refetch failed, continuing anyway:', err);
          // Non-blocking - user can still place order
        }
      }

      // 🛡️ FIX BUG 5: Check both cart prop AND live Zustand store for cart data
      // This prevents stale prop issue after payment clearing
      let validCart = cart;

      if (!validCart || validCart.items.length === 0) {
        // Cart prop is empty, check if there's a fresh cart in Zustand store
        const { getAllCarts } = useCart.getState();
        const allCarts = getAllCarts();

        if (allCarts.length > 0) {
          // Use the first available cart from store
          validCart = allCarts[0];
          console.log("[CHECKOUT] Using cart from Zustand store instead of stale prop:", validCart);
        }
      }

      if (!validCart || validCart.items.length === 0) {
        toast({
          title: "Error",
          description: "Your cart is empty",
          variant: "destructive",
        });
        return;
      }

      // Check if chef is accepting orders
      if (validCart.chefIsActive === false) {
        toast({
          title: "Chef Currently Closed",
          description: `${validCart.chefName} is not accepting orders right now. Please try again later.`,
          variant: "destructive",
        });
        return;
      }

      // ✅ RELAXED: If coordinates weren't captured (e.g., user refreshed page), 
      // we'll use Kurla West defaults. Only enforce zone validation if user explicitly set coordinates.
      // This allows users who refresh to still place orders with default coordinates.
      if (customerLatitude !== null && customerLongitude !== null && (!addressZoneValidated || !addressInDeliveryZone)) {
        toast({
          title: "Address Out of Service Zone",
          description: "This address is outside our delivery zone. Please adjust your address.",
          variant: "destructive",
        });
        return;
      }

      // Validate phone number
      if (phone.length !== 10) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive",
        });
        return;
      }

      // ✅ Validate email if provided (optional field but must be valid if entered)
      if (email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address",
            variant: "destructive",
          });
          return;
        }
      }

      // 🎁 Validate referral code if entered
      // Initialize variable to track which code to use (null if invalid/cleared)
      let referralCode_to_use = null;

      if (referralCode.trim()) {
        // Still validating - don't let them proceed yet
        if (isValidatingReferral) {
          toast({
            title: "Please Wait",
            description: "Referral code validation in progress...",
            variant: "default",
          });
          return;
        }

        // ✅ FIX: Check if validation is OUTDATED (cart changed since verification)
        const isValidationOutdated =
          referralValidation &&
          referralValidation.validatedAmount !== subtotal;

        // ✅ Check if referral code is actually entered
        const hasReferralInput = referralCode?.trim().length > 0;

        // ✅ Check if referral is INVALID (unverified, invalid, or outdated)
        const isReferralInvalid =
          hasReferralInput &&
          (!referralValidation || !referralValidation.valid || isValidationOutdated);

        // ✅ Show confirmation modal if referral is invalid
        if (isReferralInvalid && !confirmedProceedWithoutReferral) {
          setShowReferralConfirmModal(true);
          return;
        } else if (referralValidation?.valid && !isValidationOutdated) {
          // Code is valid AND amount hasn't changed - use it
          referralCode_to_use = referralCode.trim();
        }
      }

      // ✅ NEW: Validate all 4 address fields are mandatory
      if (!addressBuilding.trim()) {
        toast({
          title: "Address Incomplete",
          description: "Please enter building/house number",
          variant: "destructive",
        });
        return;
      }

      if (!addressStreet.trim()) {
        toast({
          title: "Address Incomplete",
          description: "Please enter street/colony name",
          variant: "destructive",
        });
        return;
      }

      if (!addressArea.trim()) {
        toast({
          title: "Address Incomplete",
          description: "Please enter area/locality name",
          variant: "destructive",
        });
        return;
      }

      if (!addressPincode.trim()) {
        toast({
          title: "Address Incomplete",
          description: "Please enter pincode",
          variant: "destructive",
        });
        return;
      }

      // ✅ SILENT AUTO-AUTH: Try to auto-login/create user WITHOUT blocking checkout
      if (!isAuthenticated) {
        console.log("[CHECKOUT] User not authenticated - attempting silent auth...");
        const authSuccess = await ensureUserAuthenticated();

        if (!authSuccess) {
          // Silent auth failed, show error and block checkout
          toast({
            title: "Authentication Failed",
            description: "Unable to login. Please try again.",
            variant: "destructive",
          });
          setIsProcessingCheckout(false);
          return;
        }

        console.log("[CHECKOUT] ✅ Silent auth successful, continuing checkout...");
      }

      // Check morning restriction for Roti orders (8 AM - 11 AM)
      const now = new Date();
      const currentHour = now.getHours();
      const inMorningRestriction = currentHour >= 8 && currentHour < 11;

      if (requiresDeliverySlot && inMorningRestriction && selectedDeliverySlotId) {
        const selectedSlotInfo = slotCutoffMap[selectedDeliverySlotId];
        if (selectedSlotInfo?.isMorningSlot) {
          toast({
            title: "Morning Slot Unavailable",
            description:
              "Morning delivery slots (8 AM - 11 AM) must be ordered by 11 PM the previous day. Please select a later time slot or order after 11 AM.",
            variant: "destructive",
          });
          return;
        }
      }

      // Delivery time is optional for delivery slot orders

      setIsLoading(true);

      try {
        // Get delivery date info if slot selected
        const slotInfo = selectedDeliverySlotId
          ? slotCutoffMap[selectedDeliverySlotId]
          : null;
        const deliveryDateStr = slotInfo
          ? slotInfo.nextAvailableDate.toISOString().split("T")[0]
          : undefined;

        // Require validated customer coordinates so checkout and server use the same distance basis.
        if (!hasUsableCoordinates(customerLatitude, customerLongitude)) {
          toast({
            title: "Address Validation Required",
            description: "Please validate your delivery address so we can calculate the correct delivery distance and fee.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const finalLatitude = customerLatitude;
        const finalLongitude = customerLongitude;

        const orderData = {
          customerName,
          phone,
          email: email || "",
          address,
          // Structured address fields
          addressBuilding,
          addressStreet,
          addressArea,
          addressCity,
          addressPincode,
          deliveryInstructions: deliveryInstructions.trim() || undefined, // ✅ NEW: Add optional delivery instructions
          items: validCart.items.map((item: CartItem) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            categoryId: item.categoryId,
            chefId: item.chefId,
            specialInstructions: item.specialInstructions || undefined,
          })),
          subtotal,
          deliveryFee,
          discount,
          customerLatitude: finalLatitude,
          customerLongitude: finalLongitude,
          couponCode: appliedCoupon?.code,
          referralCode: referralCode_to_use,
          total,
          chefId: validCart.chefId || validCart.items[0]?.chefId,
          categoryId: validCart.categoryId,
          categoryName: validCart.categoryName,
          deliveryTime:
            requiresDeliverySlot && selectedDeliveryTime
              ? selectedDeliveryTime
              : undefined,
          deliverySlotId:
            requiresDeliverySlot && selectedDeliverySlotId
              ? selectedDeliverySlotId
              : undefined,
          deliveryDate:
            requiresDeliverySlot && deliveryDateStr ? deliveryDateStr : undefined,
          status: "pending" as const,
          paymentStatus: "pending" as const,
          bonusUsedAtCheckout: useBonusAtCheckout ? bonusAmountToUse : 0,
          walletAmountUsed: useWalletBalance ? walletAmountToUse : 0,
        };

        console.log("=== OPTION A FLOW: CREATE ORDER NOW ===");
        console.log("Creating order immediately at checkout");
        console.log("orderData:", orderData);

        // 🎁 ✅ CRITICAL FIX: Claim bonus BEFORE creating order (if user selected it)
        // This ensures:
        // 1. Deducts from user.pendingBonus
        // 2. Marks referral as referredOrderCompleted=true
        // 3. Prevents double-credit on delivery
        if (useBonusAtCheckout && bonusAmountToUse > 0) {
          try {
            console.log("[BONUS-CLAIM] Claiming bonus before order creation...", {
              bonusAmountToUse,
              pendingBonus,
            });

            // Create a temporary order ID for tracking (will be replaced after order is created)
            const tempOrderId = `temp_${Date.now()}`;

            const claimResponse = await api.post("/api/user/claim-bonus-at-checkout", {
              orderTotal: subtotal,
              orderId: tempOrderId,  // Temporary - will be updated after real order created
            });

            if (!claimResponse.data.bonusClaimed) {
              console.error("[BONUS-CLAIM] Failed to claim bonus:", claimResponse.data.message);
              toast({
                title: "Bonus Claim Failed",
                description: claimResponse.data.message || "Failed to claim bonus",
                variant: "destructive",
              });
              setIsLoading(false);
              return;
            }

            console.log("[BONUS-CLAIM] ✅ Bonus claimed successfully:", {
              amount: claimResponse.data.amount,
              message: claimResponse.data.message,
            });
          } catch (bonusError: any) {
            console.error("[BONUS-CLAIM] Error claiming bonus:", bonusError);
            toast({
              title: "Bonus Error",
              description: bonusError?.response?.data?.message || "Failed to claim bonus",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        // ✅ CREATE ORDER IMMEDIATELY (with paymentStatus: pending)
        // This ensures admin sees order in notifications even before payment
        let orderId: string | null = null;
        let orderResponse: any = null;

        // 🔥 AUTH FIRST: Ensure user is authenticated before creating order
        const isAuthReady = await ensureUserAuthenticated();

        if (!isAuthReady) {
          setIsProcessingCheckout(false);
          return;
        }

        try {
          // 🛡️ SMART FIX: Prevent duplicate pending orders!
          // If the user backed out of payment and clicked checkout again, cancel the old pending order.
          try {
            if (isAuthenticated && userOrders) {
              const duplicateOrders = userOrders.filter(
                (o) => o.status === "pending" && o.paymentStatus === "pending" && o.chefId === cart?.chefId
              );
              for (const oldOrder of duplicateOrders) {
                console.log("[CHECKOUT] Cancelling abandoned duplicate order:", oldOrder.id);
                await api.post(`/api/orders/${oldOrder.id}/cancel`);
              }
            } else {
              const oldGuestOrderId = localStorage.getItem("guestPendingOrderId");
              if (oldGuestOrderId) {
                console.log("[CHECKOUT] Cancelling abandoned guest order:", oldGuestOrderId);
                await api.post(`/api/orders/${oldGuestOrderId}/cancel`).catch(() => {});
              }
            }
          } catch (cleanupError) {
            console.error("[CHECKOUT] Failed to cleanup old pending orders:", cleanupError);
          }

          orderResponse = await api.post("/api/orders", orderData);
          orderId = orderResponse.data.id;
          
          if (!isAuthenticated && orderId) {
            localStorage.setItem("guestPendingOrderId", orderId);
          }

          console.log("[CHECKOUT] Order created successfully:", orderId);
          console.log("[CHECKOUT] Order waiting for payment confirmation...");
        } catch (err: any) {
          console.error("[CHECKOUT] Failed to create order:", err);
          toast({
            title: "Error",
            description: err?.response?.data?.message || "Failed to create order",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsProcessingCheckout(false);
          return;
        }

        // ✅ DO NOT clear the cart immediately here. We wait for payment confirmation.
        // Wait for Home.tsx's handleOrderSuccess to clear the cart and checkoutFormData.

        // ✅ FIX 4: Reset wallet state to prevent reusing same balance in next order
        setUseWalletBalance(false);
        setWalletAmountToUse(0);

        // ✅ Now show payment QR with order created
        onShowPaymentQR({
          orderData: orderResponse.data, // Pass complete order object
          amount: total,
          customerName,
          phone,
          email,
          address,
          pendingCheckoutId: null, // No pending checkout needed, order already created
        });

        // Unlock processing flag after initiating payment flow
        setIsProcessingCheckout(false);

        // ✅ FIX 2: Invalidate user orders query so checkout dialog will hide referral input next time it opens
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        // ✅ Restoring a 4-5 second delay to the active banner per request
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["active-order"] });
        }, 4500);

        // ✅ IMPORTANT: DO NOT reset form fields or clear checkoutFormData here.
        // If the user cancels the payment QR, they should return to the checkout with their state intact.
        // Form cleanup and cart clearing now happens strictly upon successful payment in Home.tsx.

        // We also DO NOT call onClose() here because that triggers handleCheckoutClose in Home.tsx,
        // which clears the selectedCart and breaks the delivery slot logic.
        // onShowPaymentQR already unmounts this dialog by setting isCheckoutOpen to false.
      } catch (error: any) {
        console.error("Order validation error:", error);

        const errorData = error.response?.data || {};

        if (errorData.requiresLogin) {
          toast({
            title: "Login Required",
            description: errorData.message || "This phone number is already registered. Please login.",
            variant: "destructive",
          });
          return;
        }

        // Handle server telling client to reschedule due to cutoff
        if (errorData.requiresReschedule) {
          setSuggestedReschedule({
            slotId: selectedDeliverySlotId as string,
            nextAvailableDate: errorData.nextAvailableDate,
          });
          toast({
            title: "Selected slot passed cutoff",
            description: errorData.message || "Selected delivery slot missed the ordering cutoff. Please schedule for the next available date.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Order failed",
          description: errorData.message || (error instanceof Error ? error.message : "Failed to create order. Please try again."),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false); // Changed from setIsSubmitting to setIsLoading
        // inner finally: keep, outer finally will also clear as safety
        setIsProcessingCheckout(false); // ✅ Unlock multi-click protection
      }
    } finally {
      // Ensure processing flag is cleared on any early returns before inner try
      setIsProcessingCheckout(false);
    }
  };

  // handleLogin removed — auth happens silently at checkout via login-or-create API

  // handleForgotPassword removed — login tab removed

  // ✅ Helper: Format 24-hour time to 12-hour format with AM/PM
  const formatTo12Hour = (time: string) => {
    if (!time) return "";

    const [hourStr, minute] = time.split(":");
    let hour = parseInt(hourStr, 10);

    if (isNaN(hour)) return time;

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${hour}:${minute} ${ampm}`;
  };

  // Determine if the form is valid for submission
  const isFormValid = customerName && phone && address;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* Use a responsive dialog size with max height to avoid mobile distortion */}
        <DialogContent
          className="w-full sm:w-[calc(100%-2rem)] max-w-[480px] max-h-[90vh] flex flex-col rounded-lg p-0 mx-auto"
          onInteractOutside={(e) => {
            // Prevent dialog close when clicking inside a Select dropdown portal
            const target = e.target as HTMLElement;
            if (target?.closest?.("[data-radix-select-content]") || target?.closest?.("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-lg sm:text-xl">Checkout</DialogTitle>
            <DialogDescription className="text-sm">
              Complete your order.
            </DialogDescription>
          </DialogHeader>

          <div id="checkout-scroll-container" className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-0 space-y-4">
            {/* Chef closed warning */}
            {cart?.chefIsActive === false && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Chef Currently Closed
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                  {cart.chefName} is not accepting orders right now. Please
                  check back later.
                </p>
              </div>
            )}

            {/* Roti order blocked during morning window (8-11 AM) */}
            {isRotiOrderBlocked && (
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-2 mb-1">
                <p className="text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Roti Orders Currently Paused
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                  {rotiBlockMessage}
                </p>
              </div>
            )}

            <div className="w-full">
              {/* Checkout UI */}
              <div>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4"
                  data-checkout-form
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* STEP 1: Show "Enter Delivery Address" button before form is shown */}
                    {!showAddressForm && !addressConfirmed && (
                      <Button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(true);
                          setIsEditingAddress(true); // 🆕 Show in edit mode
                        }}
                        className="w-full h-10 text-base font-semibold"
                        variant="default"
                      >
                        📍 Enter Delivery Address
                      </Button>
                    )}

                    {/* STEP 2: Show address form only when showAddressForm is true OR before validation is complete */}
                    {/* Form input fields - HIDDEN when addressConfirmed=true */}
                    {!addressConfirmed && (
                      <>
                        {/* Customer Information */}
                        <div>
                          <Label htmlFor="customerName" className="text-sm">
                            Full Name *
                          </Label>
                          <Input
                            ref={firstInputRef}
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            data-testid="input-customer-name"
                          />
                        </div>

                        {/* Phone Number Input */}
                        <div>
                          <Label htmlFor="phone" className="text-sm">
                            Mobile Number *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            maxLength={10}
                            required
                            disabled={isAuthenticated}
                            placeholder="Enter 10-digit mobile number"
                            data-testid="input-phone"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-sm">
                            Email (Optional)
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            data-testid="input-email"
                          />
                        </div>

                        {/* Structured Address Fields */}
                        {isEditingAddress && (
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold">Delivery Address *</Label>

                            {/* Row 1: Building/House Number and Street */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="building" className="text-xs text-gray-600">
                                  Building/House No <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="building"
                                  value={addressBuilding}
                                  onChange={(e) => handleAddressChange('building', e.target.value)}
                                  placeholder="e.g., 18/20"
                                  className="text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="street" className="text-xs text-gray-600">
                                  Street/Colony <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="street"
                                  value={addressStreet}
                                  onChange={(e) => handleAddressChange('street', e.target.value)}
                                  placeholder="e.g., LJG Colony"
                                  className="text-sm"
                                  required
                                />
                              </div>
                            </div>

                            {/* Row 2: GPS and Area */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="area" className="text-xs text-gray-600 font-semibold">
                                  Area/Locality *
                                </Label>
                                {!deliveryLocation.pincode && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-blue-600 px-2"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isGettingLocation}
                                  >
                                    {isGettingLocation ? (
                                      <>
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Locating...
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="mr-1 h-3 w-3" />
                                        Use My Location
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                              <div className="relative">
                                <Input
                                  id="area"
                                  value={addressArea}
                                  onChange={(e) => handleAddressChange('area', e.target.value)}
                                  onFocus={() => {
                                    if (addressArea.trim().length > 0) {
                                      const suggestions = getAreaSuggestions(addressArea);
                                      setAreaSuggestions(suggestions);
                                      setShowAreaSuggestions(suggestions.length > 0);
                                    }
                                  }}
                                  placeholder="e.g., Kurla West"
                                  className="text-sm"
                                  required
                                />
                                {isGeocodingAddress && (
                                  <div className="absolute right-3 top-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  </div>
                                )}

                                {/* Area Suggestions Dropdown */}
                                {showAreaSuggestions && areaSuggestions.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                                    {areaSuggestions.map((suggestion, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setAddressArea(suggestion);
                                          setShowAreaSuggestions(false);
                                          setAreaSuggestions([]);
                                          // NO Auto-validation! User must click Validate Address
                                          console.log("[LOCATION] Selected suggestion:", suggestion, "waiting for manual validation");
                                          // Just update the field state (which is already done via setAddressArea but let's be safe if needed)
                                          // handleAddressChange('area', suggestion); // Already called by setAddressArea effectively
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-200 dark:border-gray-700 last:border-0 cursor-pointer"
                                      >
                                        {suggestion}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Row 3: City and Pincode */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="city" className="text-xs text-gray-600">
                                  City
                                </Label>
                                <Input
                                  id="city"
                                  value={addressCity}
                                  onChange={(e) => handleAddressChange('city', e.target.value)}
                                  placeholder="Mumbai"
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor="pincode" className="text-xs text-gray-600 flex items-center justify-between">
                                  <span>Pincode <span className="text-red-500">*</span></span>
                                  {isReValidatingPincode && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Checking...
                                    </span>
                                  )}
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="pincode"
                                    value={addressPincode}
                                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                    placeholder="e.g., 400070"
                                    className={`text-sm ${isReValidatingPincode ? 'border-blue-500 border-2' : ''} ${deliveryLocation.pincode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    readOnly={!!deliveryLocation.pincode}
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            {/* ✅ NEW: Delivery Instructions (Optional) */}
                            <div className="space-y-2">
                              <Label htmlFor="deliveryInstructions" className="text-xs text-gray-600">
                                Delivery Instructions (Optional)
                              </Label>
                              <textarea
                                id="deliveryInstructions"
                                value={deliveryInstructions}
                                onChange={(e) => setDeliveryInstructions(e.target.value.slice(0, 200))}
                                placeholder="e.g., 'Red gate building', 'Near the temple', 'Watch dog present'"
                                maxLength={200}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              />
                              <p className="text-xs text-gray-500">{deliveryInstructions.length}/200</p>
                            </div>
                          </div>
                        )}

                        {/* Other form content here if needed */}
                      </>
                    )}

                    {/* STEP 3: Show address confirmed badge ALWAYS when addressConfirmed=true (in view mode) */}
                    {addressConfirmed && !isEditingAddress && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Address Validated
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {addressBuilding}, {addressStreet}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {addressArea}, {addressCity} - {addressPincode}
                            </p>
                            {/* <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                              Distance: {deliveryDistance !== null ? `${deliveryDistance.toFixed(2)} km` : 'Awaiting validation'}
                            </p> */}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddressForm(true); // 🆕 Show address form when editing
                              setIsEditingAddress(true);
                              setAddressZoneValidated(false);
                              setAddressInDeliveryZone(false);
                              setAddressConfirmed(false);
                              setLocationError("");
                            }}
                            className="h-7 text-xs"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Pincode Validation Messages */}
                    <div>
                      {isReValidatingPincode && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">⏳ Validating pincode...</p>
                      )}
                      {!isReValidatingPincode && addressPincode && !/^\d{5,6}$/.test(addressPincode) && (
                        <p className="text-xs text-red-500 mt-0.5">Pincode must be 5-6 digits</p>
                      )}
                      {!isReValidatingPincode && addressZoneValidated && !addressInDeliveryZone && addressPincode && (
                        <p className="text-xs text-red-600 mt-0.5">❌ Pincode outside delivery zone</p>
                      )}
                    </div>


                    {/* Full Address Display */}
                    {!addressConfirmed && (
                      <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs text-gray-700 dark:text-gray-300">
                        <p className="font-semibold">Full Address:</p>
                        <p>{address || "(Enter details above)"}</p>
                      </div>
                    )}

                    {/* Validation hint - button is in footer */}
                    {!addressZoneValidated && isEditingAddress && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Fill in your address details and tap "Validate Delivery Address" below.
                      </p>
                    )}

                    {/* Smart Location Validation Feedback - Zomato Style */}


                    {locationError && (
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-700 rounded-md p-3">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          ⚠️ {locationError}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* ============================================
                        SHOW DELIVERY, COUPONS, TOTALS ONLY AFTER ADDRESS IS CONFIRMED
                        ============================================ */}
                  {!isEditingAddress && addressZoneValidated && addressInDeliveryZone && (
                    <div id="delivery-and-summary-section" ref={deliverySlotRef}>
                      {/* Delivery Time Selection - OPTIONAL for delivery slot orders */}
                      {isCategoryLoading ? (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-md p-4 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Checking delivery options...</span>
                        </div>
                      ) : requiresDeliverySlot && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-md p-2 sm:p-3">
                          <div className="space-y-1.5 sm:space-y-2 w-full">
                            <Label
                              htmlFor="delivery-slot"
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Select Delivery Time (Optional)
                            </Label>

                            {/* Show time slot picker */}
                            <p className="text-xs text-primary flex items-start gap-1">
                              <span>
                                Choose a preferred time slot for your fresh rotis
                              </span>
                            </p>
                            <Select
                              value={selectedDeliverySlotId}
                              onValueChange={(value) => {
                                setSelectedDeliverySlotId(value);
                                const slot = deliverySlots.find(
                                  (s: any) => s.id === value,
                                );
                                if (slot) {
                                  // ✅ Set RAW time for API (HH:mm format)
                                  setSelectedDeliveryTime(slot.startTime);

                                  // ✅ Format the delivery time with date label for UI
                                  const cutoffInfo = slotCutoffMap[slot.id];
                                  const formattedStart = formatTo12Hour(slot.startTime);
                                  const formattedEnd = formatTo12Hour(slot.endTime);
                                  const deliveryLabel = cutoffInfo?.deliveryDateLabel || "";
                                  const formattedDeliveryLabel = `${deliveryLabel} • ${formattedStart} – ${formattedEnd}`;
                                  setDeliveryTimeLabel(formattedDeliveryLabel);
                                } else {
                                  setSelectedDeliveryTime("");
                                  setDeliveryTimeLabel("");
                                }
                              }}
                            >
                              <SelectTrigger
                                id="delivery-slot"
                                data-testid="select-delivery-slot"
                                className="w-full text-sm"
                              >
                                <SelectValue placeholder="Choose a time slot" />
                              </SelectTrigger>
                              <SelectContent
                                align="center"
                                className="max-w-[calc(100vw-2rem)] sm:max-w-[400px]"
                                position="popper"
                                sideOffset={5}
                              >
                                {deliverySlots
                                  .filter(
                                    (slot) =>
                                      slot.isActive &&
                                      slot.currentOrders < slot.capacity,
                                  )
                                  .map((slot) => {
                                    const cutoff = slotCutoffMap[slot.id];
                                    const slotsLeft =
                                      slot.capacity - slot.currentOrders;
                                    const now = new Date();
                                    const currentHour = now.getHours();

                                    // Check if we're in morning restriction period (8 AM - 11 AM)
                                    const inMorningRestriction =
                                      currentHour >= 8 && currentHour < 11;
                                    const isDisabled =
                                      cutoff?.isMorningSlot &&
                                      inMorningRestriction;

                                    const formattedStart = formatTo12Hour(slot.startTime);
                                    const formattedEnd = formatTo12Hour(slot.endTime);

                                    return (
                                      <SelectItem
                                        key={slot.id}
                                        value={slot.id}
                                        data-testid={`delivery-slot-${slot.id}`}
                                        className="w-full py-3"
                                        disabled={isDisabled}
                                      >
                                        <div className="flex flex-col w-full gap-0.5">
                                          <span className="font-medium text-sm">
                                            {cutoff?.deliveryDateLabel} • {formattedStart} – {formattedEnd}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {slotsLeft} slots left
                                            {cutoff?.slotHasPassed &&
                                              " (Next day)"}
                                          </span>
                                          {isDisabled && (
                                            <span className="text-xs text-red-500 mt-1">
                                              Not available 8-11 AM
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                {deliverySlots.filter(
                                  (slot) =>
                                    slot.isActive &&
                                    slot.currentOrders < slot.capacity,
                                ).length === 0 && (
                                    <SelectItem value="none" disabled>
                                      No delivery slots available
                                    </SelectItem>
                                  )}
                              </SelectContent>
                            </Select>

                            {/* ✅ ADD THIS HERE (clear selection option) */}
                            {selectedDeliverySlotId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeliverySlotId("");
                                  setSelectedDeliveryTime("");
                                  setDeliveryTimeLabel("");
                                }}
                                className="text-xs text-blue-600 mt-1 underline"
                              >
                                Deliver Now Click Here to Clear Selection
                              </button>
                            )}

                            {/* Validation message for missing slot */}
                            {requiresDeliverySlot && !selectedDeliverySlotId && !isRotiOrderBlocked && (
                              <p className="text-[11px] text-red-500 font-medium px-4 pb-2 -mt-1 text-center bg-white dark:bg-slate-900">
                                Prefer a later delivery? Choose a time slot
                              </p>
                            )}
                            {selectedDeliverySlotId &&
                              slotCutoffMap[selectedDeliverySlotId] && (
                                <div className="mt-1 text-center">
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    Delivery:{" "}
                                    {
                                      slotCutoffMap[selectedDeliverySlotId]
                                        .deliveryDateLabel
                                    }{" "}
                                    at {selectedDeliveryTime}
                                  </p>
                                  {slotCutoffMap[selectedDeliverySlotId]
                                    .slotHasPassed && (
                                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                        This time has passed today - your order
                                        will be delivered tomorrow at this time
                                      </p>
                                    )}
                                </div>
                              )}
                            {!selectedDeliveryTime && (
                              <p className="text-xs text-slate-500 mt-2 text-center leading-relaxed">
                                <span className="inline-block text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-1">
                                  Optional
                                </span>
                                If not selected, we’ll deliver at the earliest available time
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Referral Code Input - Manual verification with button */}
                      {/* ✅ FIX 1: Show only if user hasn't used a referral AND hasn't placed an order yet */}
                      {showReferralInput && (
                        <div className="mt-4 mb-4">
                          <Accordion
                            type="single"
                            collapsible
                            value={referralOpen}
                            onValueChange={(val) => setReferralOpen(val)}
                            className="w-full border border-blue-100 rounded-xl px-3 py-2 bg-blue-50/40 shadow-sm"
                          >
                            <AccordionItem value="referral" className="border-none">

                              {/* HEADER */}
                              <AccordionTrigger className="text-sm font-semibold text-blue-700 py-2">
                                Referral Code (Optional)
                              </AccordionTrigger>

                              {/* CONTENT */}
                              <AccordionContent className="pt-3 space-y-3">

                                {/* INPUT */}
                                <div className="flex gap-2">
                                  <Input
                                    id="referralCode"
                                    type="text"
                                    placeholder="Enter friend's referral code"
                                    value={referralCode}
                                    onChange={(e) => {
                                      const newCode = e.target.value.toUpperCase();
                                      setReferralCode(newCode);

                                      if (!referralOpen) {
                                        setReferralOpen("referral");
                                      }

                                      if (!newCode.trim()) {
                                        setReferralValidation(null);
                                      }
                                    }}
                                    className="font-mono uppercase"
                                    maxLength={20}
                                    data-testid="input-checkout-referral-code"
                                  />

                                  <Button
                                    onClick={handleVerifyReferralCode}
                                    disabled={!referralCode.trim() || isValidatingReferral}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {isValidatingReferral ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Verifying...
                                      </>
                                    ) : (
                                      "Verify"
                                    )}
                                  </Button>
                                </div>

                                {/* INFO BOX */}
                                <div className="bg-blue-100/60 border border-blue-200 rounded-md p-2.5 text-xs text-blue-800">
                                  <p className="font-medium mb-1.5">
                                    ℹ️ Referral Info
                                  </p>
                                  <p className="leading-relaxed">
                                    Referral rewards are meant to be shared with friends. To keep things fair, benefits may be adjusted if multiple accounts are used from the same address, location, or device, or if activity doesn’t meet our program guidelines.
                                  </p>
                                </div>

                                {/* VALIDATION */}
                                {referralCode.trim() && (
                                  <div
                                    className={`text-xs p-2.5 rounded-md border ${referralValidation?.valid
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : referralValidation?.valid === false
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}
                                  >
                                    {isValidatingReferral && (
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Validating code...
                                      </div>
                                    )}

                                    {!isValidatingReferral && referralValidation && (
                                      <>
                                        {referralValidation.valid ? (
                                          <>
                                            <div className="flex items-center gap-1 mb-1">
                                              <CheckCircle2 className="w-4 h-4" />
                                              <span className="font-medium">
                                                ✅ Code Valid{" "}
                                                {referralValidation.bonus &&
                                                  `₹${referralValidation.bonus} bonus`}
                                              </span>
                                            </div>

                                            {referralValidation.referrerName && (
                                              <p>
                                                From:{" "}
                                                <strong>{referralValidation.referrerName}</strong>
                                              </p>
                                            )}

                                            <p className="mt-1">
                                              💰 Bonus will be credited after your first order is delivered
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            <div className="font-medium mb-1">
                                              ⚠️ {referralValidation.message}
                                            </div>

                                            {referralValidation.minRequired &&
                                              referralValidation.currentAmount && (
                                                <div className="mt-1 space-y-1">
                                                  <p>
                                                    Required:{" "}
                                                    <strong>₹{referralValidation.minRequired}</strong> |
                                                    Your order:{" "}
                                                    <strong>₹{referralValidation.currentAmount}</strong>
                                                  </p>
                                                  <p>
                                                    Add ₹
                                                    {referralValidation.minRequired -
                                                      referralValidation.currentAmount}{" "}
                                                    more to use this code
                                                  </p>
                                                </div>
                                              )}
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* EMPTY STATE */}
                                {!referralCode.trim() && !referralValidation && (
                                  <p className="text-xs text-blue-700">
                                    💝 Have a referral code? Enter it to unlock bonus rewards!
                                  </p>
                                )}

                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                      {/* Coupon Code */}
                      <div className="mt-4">
                        <Label htmlFor="couponCode" className="text-sm">
                          Coupon Code (Optional)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="couponCode"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            placeholder="Enter coupon code"
                            disabled={!!appliedCoupon}
                            className="uppercase"
                          />
                          {appliedCoupon ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRemoveCoupon}
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleApplyCoupon}
                              disabled={isVerifyingCoupon || !couponCode.trim()}
                            >
                              {isVerifyingCoupon ? "Verifying..." : "Apply"}
                            </Button>
                          )}
                        </div>
                        {couponError && (
                          <p className="text-xs text-destructive mt-1">
                            {couponError}
                          </p>
                        )}
                        {appliedCoupon && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Coupon "{appliedCoupon.code}" applied - You save ₹
                            {appliedCoupon.discountAmount}
                          </p>
                        )}
                      </div>

                      {/* Totals - Inside form - ONLY SHOW AFTER ADDRESS CONFIRMED */}
                      {addressConfirmed && (
                        <div className="border-t pt-3 space-y-2 mt-4">
                          {/* 💬 COMMENTED OUT: Subtotal display - already shows in OrderSummaryCard */}
                          {/* <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div> */}

                          {/* COMMENTED OUT: Delivery Fee display in inline checkout form.
                            Delivery fee is now shown ONLY in OrderSummaryCard after address validation.
                            This prevents duplicate/confusing fee information during checkout form editing.
                            Original code removed - can be restored from git history if needed.
                        */}

                          {/* COMMENTED OUT: Platform Fee display in inline checkout form.
                            Platform fee and "add more to waive" hints are now shown ONLY in 
                            OrderSummaryCard after address validation. This prevents duplicate
                            fee information and keeps the checkout form clean during data entry.
                            
                            Original code removed - can be restored from git history if needed.
                        */}

                          {/* Summary section continues below */}

                          {/* Item Discount Savings from offer percentages */}
                          {/* {typeof itemDiscountSavings === 'number' && itemDiscountSavings > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span>Original Price:</span>
                              <span className="line-through">₹{originalSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                              <span>Item Offer (You Save):</span>
                              <span>-₹{itemDiscountSavings.toFixed(2)}</span>
                            </div>
                          </div>
                        )} */}

                          {/* Coupon Discount */}
                          {typeof discount === 'number' && discount > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                                <span>Coupon Discount:</span>
                                <span>-₹{discount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}



                          {/* Referral Bonus Section - ONLY show when user has delivered orders (bonusEligible) AND referral system is active */}
                          {isAuthenticated &&
                            typeof pendingBonus === 'number' && pendingBonus > 0 &&
                            bonusEligible &&
                            walletSettings?.isActive && (
                              <div className="border-t pt-2 mt-2 space-y-2">
                                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-2 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-green-900 dark:text-green-100">
                                        Available Referral Bonus (Per Order)
                                      </p>
                                      <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                        ₹{Math.min(maxBonusUsagePerOrder, pendingBonus)}
                                      </p>
                                      {pendingBonus > maxBonusUsagePerOrder && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                          Total bonus: ₹{pendingBonus} (₹{maxBonusUsagePerOrder} per order)
                                        </p>
                                      )}
                                      {minOrderAmount > 0 && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                          Minimum order: ₹{minOrderAmount}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="useBonusCheckbox"
                                        checked={useBonusAtCheckout}
                                        onChange={(e) =>
                                          setUseBonusAtCheckout(e.target.checked)
                                        }
                                        className="cursor-pointer"
                                      />
                                      <label
                                        htmlFor="useBonusCheckbox"
                                        className="text-xs cursor-pointer font-medium text-green-700 dark:text-green-300"
                                      >
                                        Use Bonus
                                      </label>
                                    </div>
                                  </div>

                                  {bonusEligibilityMsg && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {bonusEligibilityMsg}
                                    </p>
                                  )}

                                  {useBonusAtCheckout && bonusAmountToUse > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      ✓ Using ₹{bonusAmountToUse.toFixed(2)} from bonus
                                    </p>
                                  )}

                                  {isCheckingBonusEligibility && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      Checking eligibility...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* ✅ REMOVED: Ineligibility message panel - Don't confuse user with error messages */}

                          {/* Wallet Balance - ONLY show when referral system is active */}
                          {isAuthenticated && (user?.walletBalance || 0) > 0 && walletSettings?.isActive && (
                            <div className="border-t pt-2 mt-2">
                              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                      Available Wallet Balance
                                    </p>
                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                      ₹{user?.walletBalance ?? 0}
                                    </p>
                                    {/* Platform fee hint removed from inline checkout UI.
                                    Platform fee is shown in OrderSummaryCard after validation. */}
                                  </div>
                                  {(user?.walletBalance ?? 0) > 0 && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="useWalletCheckbox"
                                        checked={useWalletBalance}
                                        onChange={(e) => {
                                          console.log("[WALLET] Checkbox changed to:", e.target.checked);
                                          setUseWalletBalance(e.target.checked);
                                        }}
                                        disabled={isWalletCheckboxDisabled}
                                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                      <label
                                        htmlFor="useWalletCheckbox"
                                        className={`text-xs font-medium cursor-pointer ${isWalletCheckboxDisabled
                                          ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                          : "text-blue-700 dark:text-blue-300"
                                          }`}
                                      >
                                        Use Balance
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {isWalletCheckboxDisabled && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    ⚠️ Minimum order ₹{minOrderAmountForWallet} required to use wallet (Current: ₹{(total).toFixed(2)})
                                  </p>
                                )}

                                {useWalletBalance && walletAmountToUse > 0 && !isWalletCheckboxDisabled && (
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    ✓ Will use ₹{walletAmountToUse} from wallet
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* COMMENTED OUT: Delivery Minimum Order Message */}

                          {/* <div className="flex justify-between font-bold text-base border-t pt-2">
                          <span>Total:</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div> */}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden Submit Button to Capture "Enter" Key Presses on Inputs */}
                  <button
                    type="submit"
                    className="hidden"
                    disabled={
                      isLoading ||
                      !isFormValid ||
                      cart?.chefIsActive === false ||
                      isRotiOrderBlocked ||
                      !addressZoneValidated ||
                      (addressZoneValidated && !addressInDeliveryZone) ||
                      !addressConfirmed
                    }
                  >
                    Submit
                  </button>
                </form>

                {/* Order Summary Card - ONLY SHOW AFTER ADDRESS CONFIRMED */}
                {addressConfirmed && (
                  <div className="mt-4 pt-4 border-t">
                    <OrderSummaryCard
                      cart={cart}
                      deliveryTimeLabel={deliveryTimeLabel}
                      subtotal={subtotal}
                      originalItemsTotal={originalSubtotal}
                      deliveryFee={deliveryFee}
                      deliveryDistance={deliveryDistance}
                      isBelowDeliveryMinimum={isBelowDeliveryMinimum}
                      deliveryMinOrderAmount={deliveryMinOrderAmount}
                      itemDiscountSavings={itemDiscountSavings}
                      discount={discount}
                      platformFee={platformFee}
                      platformFeeConfig={platformFeeConfig}
                      platformFeeThreshold={platformFeeConfig?.platformFeeWaiverThreshold || 200}
                      walletUsed={walletAmountToUse}

                      total={total}

                      defaultExpanded={addressConfirmed}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Always at bottom */}
          {/* Footer - Always at bottom */}
          <DialogFooter className="flex-shrink-0 border-t px-4 sm:px-6 py-4 bg-background">
            <div className="flex gap-2 w-full flex-col-reverse sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              {isEditingAddress && !addressZoneValidated ? (
                // While editing and not yet validated, show Validate button in footer
                <Button
                  type="button"
                  onClick={() => {
                    // ✅ Enforce Name & Phone first
                    if (!customerName?.trim() || !phone?.trim()) {
                      toast({
                        title: "Missing details",
                        description: "Please enter your name and phone number before validating address",
                        variant: "destructive",
                      });
                      setIsEditingAddress(true);
                      return;
                    }
                    if (addressPincode && addressArea && addressStreet) {
                      handlePincodeChange(addressPincode);
                    } else {
                      toast({
                        title: "Incomplete Address",
                        description: "Please enter your street and area details before validating.",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={isLoading || isReValidatingPincode || !addressPincode || !addressArea || !addressStreet}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isReValidatingPincode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "✓ Validate Delivery Address"
                  )}
                </Button>
              ) : (
                <Button
                  ref={payButtonRef}
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isLoading ||
                    isValidatingReferral || // ✅ Disable while validating referral code (industry standard)
                    !isFormValid ||
                    cart?.chefIsActive === false ||
                    isRotiOrderBlocked ||
                    !addressZoneValidated ||
                    (addressZoneValidated && !addressInDeliveryZone) ||
                    !addressConfirmed
                  }
                  className="w-full sm:w-auto"
                  data-testid="button-checkout-submit"
                  title={addressZoneValidated && !addressInDeliveryZone ? `${address.split(",")[0].trim()} is outside our service area` : isValidatingReferral ? "Validating referral code..." : ""}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isValidatingReferral ? (
                    // ✅ Show validation spinner during referral code check (Zomato/Swiggy standard)
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating Code...
                    </>
                  ) : isRotiOrderBlocked ? (
                    "🚫 Roti Not Available Now"
                  ) : !addressZoneValidated ? (
                    "⚠️ Validate Delivery Address"
                  ) : addressZoneValidated && !addressInDeliveryZone ? (
                    `🚫 ${address.split(",")[0].trim()} - ${addressZoneDistance.toFixed(1)}km away`
                  ) : (
                    `Pay & Confirm ₹${total.toFixed(2)}`
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ✅ FIX 2: Referral Confirmation Modal */}
      <Dialog open={showReferralConfirmModal} onOpenChange={setShowReferralConfirmModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Referral Code Not Valid</DialogTitle>
            <DialogDescription>
              Your referral code is not valid for the current cart.
              <br /><br />
              <strong>Do you want to proceed without applying it?</strong>
              <br />
              <span className="text-muted-foreground text-sm">Your order will be placed without any referral bonus.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowReferralConfirmModal(false)}
              className="w-full sm:w-auto"
            >
              Go Back & Verify
            </Button>
            <Button
              variant="default"
              onClick={() => {
                // Clear the unverified code, mark bypass, then re-submit
                localStorage.removeItem("pendingReferralCode");
                setReferralCode("");
                setReferralValidation(null);
                setShowReferralConfirmModal(false);
                setConfirmedProceedWithoutReferral(true);
                // ✅ FIX 3: Use direct function call instead of unsafe form resubmit
                setTimeout(() => {
                  handleSubmit(new Event('submit') as unknown as React.FormEvent);
                }, 50);
              }}
              className="w-full sm:w-auto"
            >
              Proceed Without Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
