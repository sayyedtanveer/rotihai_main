import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCheckoutAddress } from "@/hooks/useCheckoutAddress";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWalletUpdates } from "@/hooks/useWalletUpdates";
import { useApplyReferral } from "@/hooks/useApplyReferral";
import { Loader2, Clock, MapPin } from "lucide-react";
import { getDeliveryMessage, calculateDistance as calculateDistanceLoc } from "@/lib/locationUtils";
import { calculateDistance, calculateDelivery } from "@shared/deliveryUtils";
import api from "@/lib/apiClient";
import { useDeliveryLocation, getAreaSuggestions } from "@/contexts/DeliveryLocationContext";
import { getStoredPincodeValidation } from "@/lib/pincodeUtils";
import { CartItem } from "@/types/cartItem";
import { CheckoutDialogProps } from "@/types/checkoutdialogprops";
import { useCart } from "@/hooks/use-cart";


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
  const [activeTab, setActiveTab] = useState("checkout");


  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Structured address fields
  const [addressBuilding, setAddressBuilding] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressArea, setAddressArea] = useState("");
  const [addressCity, setAddressCity] = useState("Mumbai");
  const [addressPincode, setAddressPincode] = useState("");

  // Full address for display
  const address = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
    .filter(Boolean)
    .join(", ");

  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [originalSubtotal, setOriginalSubtotal] = useState(0); // Original price before item discounts
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [itemDiscountSavings, setItemDiscountSavings] = useState(0); // Track savings from item offers
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState<boolean | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState("");
  const [selectedDeliverySlotId, setSelectedDeliverySlotId] = useState("");

  // Referral bonus states
  const [pendingBonus, setPendingBonus] = useState<number>(0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [bonusEligible, setBonusEligible] = useState<boolean>(false);
  const [useBonusAtCheckout, setUseBonusAtCheckout] = useState<boolean>(false);
  const [isCheckingBonusEligibility, setIsCheckingBonusEligibility] = useState(false);
  const [bonusEligibilityMsg, setBonusEligibilityMsg] = useState<string>("");

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
  const [addressZoneValidated, setAddressZoneValidated] = useState(false);
  const [addressZoneDistance, setAddressZoneDistance] = useState<number>(0);
  const [isReValidatingPincode, setIsReValidatingPincode] = useState(false);
  const autoGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Address confirmation state - controls visibility of below content
  const [addressConfirmed, setAddressConfirmed] = useState(false);

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
  // Listen to cart changes and clear validation when cart/chef changes
  // This forces user to re-validate address when selecting a different chef
  useEffect(() => {
    if (cart?.chefId) {
      // Chef changed - require address re-validation and re-confirmation
      setAddressZoneValidated(false);
      setAddressInDeliveryZone(false);
      setAddressConfirmed(false);
      setLocationError("");
      console.log("[CHECKOUT] Chef changed - cleared address validation. User must re-validate.");
    }
  }, [cart?.chefId]);

  // ============================================
  // AUTO-VALIDATION ON DEBOUNCE (Zomato/Swiggy Style)
  // Remove manual button - validate automatically when user stops typing
  // ============================================
  useEffect(() => {
    // Only auto-validate if we have required fields and dialog is open
    if (!isOpen || !cart?.chefId) {
      return;
    }

    // Check if we have complete address to validate
    const hasPincode = addressPincode && /^\d{5,6}$/.test(addressPincode);
    const hasArea = addressArea.trim().length >= 2;

    // If either is missing or invalid, don't attempt validation
    if (!hasPincode || !hasArea) {
      return;
    }

    // Clear any existing timeout
    if (autoGeocodeTimeoutRef.current) {
      clearTimeout(autoGeocodeTimeoutRef.current);
    }

    // Set new debounce timer
    console.log("[AUTO-VALIDATE] Debounce triggered for:", { addressPincode, addressArea });
    autoGeocodeTimeoutRef.current = setTimeout(() => {
      console.log("[AUTO-VALIDATE] Debounce fired - starting auto-validation");
      handlePincodeChange(addressPincode);
    }, 600); // 600ms debounce

    return () => {
      if (autoGeocodeTimeoutRef.current) {
        clearTimeout(autoGeocodeTimeoutRef.current);
      }
    };
  }, [addressPincode, addressArea, isOpen, cart?.chefId]);

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
      setAddressZoneValidated(true);
      setAddressInDeliveryZone(true);

      console.log("[AUTO-SYNC-PINCODE] ✅ Pre-filled checkout form with stored pincode");
    }
  }, [isOpen, cart?.chefId, addressPincode]);

  // Area suggestions for autocomplete
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  // New state for GPS loading
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isUserLoading, userToken } = useAuth();
  const { location: deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const applyReferralMutation = useApplyReferral();
  const isMobile = useIsMobile();

  // Listen for wallet updates via WebSocket
  useWalletUpdates();

  // Dummy password state for login form
  const [password, setPassword] = useState("");

  // TWO-STEP CHECKOUT: Step 1 = Address Entry, Step 2 = Order Confirmation
  // This follows Zomato's approach: address first, then partners/fees
  const [checkoutStep, setCheckoutStep] = useState<"address" | "confirmation">("address");
  const [addressValidationMessage, setAddressValidationMessage] = useState("");

  // Check if this is a Roti category order
  const isRotiCategory =
    cart?.categoryName?.toLowerCase() === "roti" ||
    cart?.categoryName?.toLowerCase().includes("roti");

  // Fetch wallet settings (maxUsagePerOrder and minOrderAmount limits)
  const { data: walletSettings } = useQuery<{
    maxUsagePerOrder: number;
    minOrderAmount: number;
  }>({
    queryKey: ["/api/wallet-settings"],
    enabled: isOpen,
    refetchInterval: 60000,
  });

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

              if (distance > chef.maxDeliveryDistanceKm) {
                setLocationError(`This location is ${distance.toFixed(1)}km away. We only deliver within ${chef.maxDeliveryDistanceKm}km.`);
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

  // Fetch roti time settings for blocking logic
  const { data: rotiSettings } = useQuery<{
    isBlocked: boolean;
    blockMessage: string;
    currentTime: string;
  }>({
    queryKey: ["/api/roti-settings"],
    enabled: isRotiCategory && isOpen,
    refetchInterval: 60000,
  });

  // Determine if Roti ordering is blocked
  const isRotiOrderBlocked = isRotiCategory && rotiSettings?.isBlocked;
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
    enabled: isRotiCategory,
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

      // Calculate base total with actual delivery fee (only added if below minimum)
      let baseTotal = calculatedSubtotal + actualDeliveryFee - calculatedDiscount;

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
        baseTotal = Math.max(0, baseTotal - pendingBonus);
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
  }, [cart, address, appliedCoupon, useBonusAtCheckout, bonusEligible, pendingBonus, useWalletBalance, user?.walletBalance, maxWalletUsagePerOrder, minOrderAmountForWallet, deliveryFee, customerLatitude, customerLongitude]);

  // Auto-fill checkout fields when user profile is loaded or dialog opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      // Use data from useAuth() hook which fetches from /api/user/profile
      setCustomerName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      // Parse structured address if available
      if (user.address) {
        setAddressBuilding(user.address);
      }
      setActiveTab("checkout");
    }
  }, [user, isAuthenticated, isOpen]);

  // Restore saved address fields from Context and localStorage when checkout opens
  useEffect(() => {
    // Check if pincode is available in delivery context
    if (isOpen && deliveryLocation.pincode) {
      console.log("[CHECKOUT] Prepopulating pincode from Context:", deliveryLocation.pincode);
      setAddressPincode(deliveryLocation.pincode);
    }

    if (isOpen && deliveryLocation.address) {
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
              // ⚠️ DO NOT restore validation status - force re-validation with new chef!
              // This ensures we validate against the CURRENT chef, not a previous one
              console.log("[CHECKOUT] Address restored BUT validation cleared - user must re-validate with this chef");
              setAddressZoneValidated(false);
              setAddressInDeliveryZone(false);
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
  }, [isOpen, deliveryLocation.address, deliveryLocation.pincode]);

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
      });

      // Calculate fee using chef coordinates from cart (chef fee data comes from API when needed)
      const newDeliveryFee = calculateDynamicDeliveryFee(
        customerLatitude,
        customerLongitude,
        chefLat,
        chefLon
      );

      console.log("[DELIVERY-FEE-CALC] Fee calculated:", newDeliveryFee);
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

    if (isOpen && cart && !addressZoneValidated) {
      // If area is empty, use chef's coordinates for validation
      if (!addressArea.trim() && cart.chefLatitude && cart.chefLongitude) {
        console.log("[DELIVERY-ZONE] Area empty - using chef's coordinates for validation");
        setCustomerLatitude(cart.chefLatitude);
        setCustomerLongitude(cart.chefLongitude);
        setAddressZoneValidated(true);
        setAddressInDeliveryZone(true);
        setLocationError("");

        // Calculate delivery fee immediately with chef's coordinates
        const newDeliveryFee = calculateDynamicDeliveryFee(
          cart.chefLatitude,
          cart.chefLongitude,
          cart.chefLatitude,
          cart.chefLongitude
        );
        setDeliveryFee(newDeliveryFee);
        setDeliveryDistance(0); // Distance is 0 when using chef's location
      } else if (addressArea.trim()) {
        // If area has value AND we already have coordinates, skip geocoding and validate directly
        if (customerLatitude !== null && customerLongitude !== null) {
          console.log("[DELIVERY-ZONE] Using restored coordinates instead of re-geocoding");
          // Validate distance directly with restored coordinates
          if (cart?.chefLatitude && cart?.chefLongitude) {
            const distance = calculateDistance(
              cart.chefLatitude,
              cart.chefLongitude,
              customerLatitude,
              customerLongitude
            );
            const maxDeliveryDistance = cart?.maxDeliveryDistanceKm || 10;
            const isInZone = distance <= maxDeliveryDistance;

            setAddressZoneDistance(distance);
            setAddressInDeliveryZone(isInZone);
            setAddressZoneValidated(true);

            if (!isInZone) {
              setLocationError(`Address is ${distance.toFixed(1)}km away. Max delivery distance is ${maxDeliveryDistance}km.`);
            } else {
              setLocationError("");
            }
            console.log("[DELIVERY-ZONE] Direct validation completed:", { distance, isInZone, maxDeliveryDistance });
          }
        } else {
          // No coordinates, need to geocode
          const fullAddress = [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
            .filter(Boolean)
            .join(", ");
          console.log("[DELIVERY-ZONE] Auto-geocoding on dialog open:", fullAddress);
          autoGeocodeAddress(fullAddress);
        }
      } else if (customerLatitude !== null && customerLongitude !== null && !addressArea.trim()) {
        // If we have coordinates but no area, this is invalid state - force area entry
        console.log("[DELIVERY-ZONE] ⚠️ Coordinates exist but no area - forcing user to enter area");
        setLocationError("Please enter your delivery area to proceed");
        setAddressZoneValidated(false);
        setAddressInDeliveryZone(false);
      }
    }
  }, [isOpen, cart?.chefId, addressArea, addressBuilding, addressStreet, addressCity, addressPincode, customerLatitude, customerLongitude]);

  // Fetch pending bonus and referral info from user profile
  useEffect(() => {
    if (user && user.pendingBonus) {
      setPendingBonus(user.pendingBonus.amount || 0);
      setMinOrderAmount(user.pendingBonus.minOrderAmount || 0);
      setBonusEligibilityMsg("");
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
      const response = await api.post("/api/user/check-bonus-eligibility", {
        orderTotal: total,
      });

      const result = response.data;
      setBonusEligible(result.eligible);
      if (result.eligible) {
        setBonusEligibilityMsg(`✓ You can claim ₹${result.bonus} bonus!`);
      } else {
        setBonusEligibilityMsg(
          result.reason ||
          `Minimum order of ₹${result.minOrderAmount} required for bonus`,
        );
      }
    } catch (error) {
      console.error("Error checking bonus eligibility:", error);
      setBonusEligible(false);
    } finally {
      setIsCheckingBonusEligibility(false);
    }
  };

  const handlePhoneChange = async (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 10)); // Allow only digits, max 10
    if (value.length === 10) {
      setIsCheckingPhone(true);
      setPhoneExists(null); // Reset previous state
      try {
        const response = await api.post("/api/user/check-phone", {
          phone: value,
        });
        const data = response.data;
        setPhoneExists(data.exists);
        if (data.exists && !userToken) {
          toast({
            title: "Phone number already registered",
            description: "Please login to continue.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking phone:", error);
        toast({
          title: "Error checking phone",
          description: "Could not verify phone number. Please try again.",
          variant: "destructive",
        });
        setPhoneExists(false); // Assume not exists on error
      } finally {
        setIsCheckingPhone(false);
      }
    } else {
      setPhoneExists(null); // Reset if not 10 digits
    }
  };

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
    } catch (error) {
      const errorData = error instanceof Error ? error.message : "Invalid coupon code";
      console.log("[COUPON] Coupon verification failed:", errorData);
      setCouponError(errorData || "Invalid coupon code");
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
        // 🔥 PINCODE CHANGED: Trigger comprehensive re-validation
        handlePincodeChange(value);
        break;
    }

    // Clear validation status when user edits address (they need to re-validate)
    // But DON'T clear the text input fields
    setAddressZoneValidated(false);
    setLocationError("");

    // Clear previous timeout if any
    if (autoGeocodeTimeoutRef.current) {
      clearTimeout(autoGeocodeTimeoutRef.current);
    }
  };

  // 🔥 NEW: Comprehensive pincode change handler
  // Re-validates everything when user changes pincode at checkout
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
            source: 'pincode',
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

    console.log("[LOCATION] User clicked Validate Address button, will geocode:", fullAddress);
    await autoGeocodeAddress(fullAddress);
  };

  const autoGeocodeAddress = async (addressToGeocode: string) => {
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
        console.warn("⚠️ [LOCATION] Using Pincode Fallback (Low Accuracy)");
        toast({
          title: "Low Accuracy Warning",
          description: "Could not find exact address. Using Pincode area center.",
          variant: "destructive",
        });
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
          source: 'manual',
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
        // Update Context to SHOW menu (this triggers Home.tsx to load categories!)
        setDeliveryLocation({
          isInZone: true,
          address: addressToGeocode.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          distance: distanceFromChef,
          validatedAt: new Date().toISOString(),
          source: 'manual',
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

    // Get delivery settings from cart store or props
    // This ensures we use the exact same logic as the backend/admin panel
    const settings = useCart.getState().deliverySettings;

    const { deliveryFee, freeDeliveryEligible, amountForFreeDelivery, minOrderAmount } = calculateDelivery(
      distance,
      subtotal,
      settings
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    // Check if chef is accepting orders
    if (cart.chefIsActive === false) {
      toast({
        title: "Chef Currently Closed",
        description: `${cart.chefName} is not accepting orders right now. Please try again later.`,
        variant: "destructive",
      });
      return;
    }

    // ENFORCE: Location must be enabled to place order
    if (customerLatitude === null || customerLongitude === null || !addressZoneValidated || !addressInDeliveryZone) {
      toast({
        title: "Address Validation Required",
        description: "Please enter and confirm a delivery address within our service zone.",
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

    // Prevent checkout if phone exists but user is not logged in
    if (phoneExists && !userToken) {
      toast({
        title: "Login Required",
        description:
          "This phone number is already registered. Please switch to the Login tab to continue.",
        variant: "destructive",
      });
      // Switch to login tab to make it easier for user
      setActiveTab("login");
      return;
    }

    // Check morning restriction for Roti orders (8 AM - 11 AM)
    const now = new Date();
    const currentHour = now.getHours();
    const inMorningRestriction = currentHour >= 8 && currentHour < 11;

    if (isRotiCategory && inMorningRestriction && selectedDeliverySlotId) {
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

    // Delivery time is optional for Roti orders

    setIsLoading(true);

    try {
      // Get delivery date info if slot selected
      const slotInfo = selectedDeliverySlotId
        ? slotCutoffMap[selectedDeliverySlotId]
        : null;
      const deliveryDateStr = slotInfo
        ? slotInfo.nextAvailableDate.toISOString().split("T")[0]
        : undefined;

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
        items: cart.items.map((item: CartItem) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          categoryId: item.categoryId,
          chefId: item.chefId,
        })),
        subtotal,
        deliveryFee,
        discount,
        customerLatitude,
        customerLongitude,
        couponCode: appliedCoupon?.code,
        referralCode: referralCode && !userToken ? referralCode.trim().toUpperCase() : undefined,
        total,
        chefId: cart.chefId || cart.items[0]?.chefId,
        categoryId: cart.categoryId,
        categoryName: cart.categoryName,
        deliveryTime:
          isRotiCategory && selectedDeliveryTime
            ? selectedDeliveryTime
            : undefined,
        deliverySlotId:
          isRotiCategory && selectedDeliverySlotId
            ? selectedDeliverySlotId
            : undefined,
        deliveryDate:
          isRotiCategory && deliveryDateStr ? deliveryDateStr : undefined,
        status: "pending" as const,
        paymentStatus: "pending" as const,
        bonusUsedAtCheckout: useBonusAtCheckout ? user?.pendingBonus?.amount || 0 : 0,
        walletAmountUsed: useWalletBalance ? walletAmountToUse : 0,
      };

      console.log("=== ORDER DATA ===");
      console.log("useWalletBalance:", useWalletBalance);
      console.log("walletAmountToUse:", walletAmountToUse);
      console.log("walletAmountUsed in order:", orderData.walletAmountUsed);
      console.log("Sending order data:", orderData);
      console.log("================");

      const response = await api.post("/api/orders", orderData);

      try {
        const result = response.data;
      } catch (error: any) {
        const errorData = error.response?.data || {};
        if (errorData.requiresLogin) {
          toast({
            title: "Login Required",
            description:
              errorData.message ||
              "This phone number is already registered. Please login.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Handle server telling client to reschedule due to cutoff
        if (errorData.requiresReschedule) {
          setSuggestedReschedule({
            slotId: orderData.deliverySlotId as string,
            nextAvailableDate: errorData.nextAvailableDate,
          });
          toast({
            title: "Selected slot passed cutoff",
            description:
              errorData.message ||
              "Selected delivery slot missed the ordering cutoff. Please schedule for the next available date.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.message || "Failed to create order");
      }

      const result = response.data;

      console.log("Order created successfully:", result);

      // Claim referral bonus if eligible and user wants to use it
      if (
        useBonusAtCheckout &&
        isAuthenticated &&
        userToken &&
        bonusEligible &&
        pendingBonus > 0
      ) {
        try {
          const bonusResponse = await api.post(
            "/api/user/claim-bonus-at-checkout",
            {
              orderTotal: total,
              orderId: result.id,
            },
          );

          const bonusResult = bonusResponse.data;
          if (bonusResult.bonusClaimed) {
            toast({
              title: "✓ Referral bonus claimed!",
              description: `₹${bonusResult.amount} bonus has been added to your wallet.`,
              duration: 5000,
            });
          }
        } catch (err) {
          console.error("Error claiming bonus:", err);
        }
      }

      // Show different messages for new vs existing users
      if (result.accountCreated) {
        let accountMessage = `Order #${result.id.slice(0, 8)} created. Your login password is the last 6 digits of your phone: ${phone.slice(-6)}`;
        if (result.appliedReferralBonus && result.appliedReferralBonus > 0) {
          accountMessage += `. You received ₹${result.appliedReferralBonus} referral bonus!`;
        }
        toast({
          title: "✓ Account Created & Order Placed!",
          description: accountMessage,
          duration: 10000, // Show for 10 seconds
        });

        // Store the new user token for future requests
        if (result.accessToken) {
          localStorage.setItem("userToken", result.accessToken);
          // Store user data for immediate use
          localStorage.setItem(
            "userData",
            JSON.stringify({
              id: result.userId || result.user?.id,
              name: customerName,
              phone: phone,
              email: email || "",
              address: address || "",
            }),
          );
        }

        // Apply referral code if provided by new user
        if (referralCode.trim() && result.accessToken) {
          try {
            applyReferralMutation.mutate({
              referralCode: referralCode.trim(),
              userToken: result.accessToken,
            });
          } catch (err) {
            console.error("Failed to apply referral code:", err);
          }
        }
      } else {
        toast({
          title: "✓ Order placed successfully!",
          description: `Order #${result.id.slice(0, 8)} created`,
        });
      }

      // Clear the cart for this category after successful order
      if (onClearCart && cart?.categoryId) {
        onClearCart();
      }

      // Call the payment QR callback
      onShowPaymentQR({
        orderId: result.id,
        amount: total,
        customerName,
        phone,
        email,
        address,
        accountCreated: result.accountCreated,
        defaultPassword: phone.slice(-6), // Always use last 6 digits
      });

      // Reset form
      setCustomerName("");
      setPhone("");
      setEmail("");
      setAddressBuilding("");
      setAddressStreet("");
      setAddressArea("");
      setAddressCity("Mumbai");
      setAddressPincode("");
      setCouponCode("");
      setReferralCode("");
      setAppliedCoupon(null);
      setPhoneExists(null);
      setSelectedDeliveryTime("");
      setSelectedDeliverySlotId("");

      // Close the checkout dialog
      onClose();
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: "Order failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Changed from setIsSubmitting to setIsLoading
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Changed from setIsSubmitting to setIsLoading

    try {
      const response = await api.post("/api/user/login", { phone, password });

      const data = response.data;

      // Store token and user data
      localStorage.setItem("userToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          email: data.user.email || "",
          address: data.user.address || "",
        }),
      );

      // Auto-fill user details
      setCustomerName(data.user.name || "");
      setPhone(data.user.phone || "");
      setEmail(data.user.email || "");
      // Parse structured address if available
      if (data.user.address) {
        setAddressBuilding(data.user.address);
      }

      toast({
        title: "✓ Login successful",
        description: "Your details have been filled automatically",
      });

      // Switch to checkout tab
      setActiveTab("checkout");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Changed from setIsSubmitting to setIsLoading
    }
  };

  const handleForgotPassword = async () => {
    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter your registered phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post("/api/user/reset-password", { phone });

      const data = response.data;

      toast({
        title: "✓ Password Reset Successful",
        description: `Your password is: ${data.newPassword} (last 6 digits of your phone)`,
        duration: 10000, // Show for 10 seconds
      });

      setShowForgotPassword(false);
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Could not reset password. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Determine if the form is valid for submission
  const isFormValid = customerName && phone && address;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* Use a responsive dialog size with max height to avoid mobile distortion */}
        <DialogContent className="w-full sm:w-[calc(100%-2rem)] max-w-[480px] max-h-[90vh] flex flex-col rounded-lg p-0 mx-auto">
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-lg sm:text-xl">Checkout</DialogTitle>
            <DialogDescription className="text-sm">
              Complete your order.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-0 space-y-4">
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

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="checkout"
                  onClick={() => setActiveTab("checkout")}
                >
                  Checkout
                </TabsTrigger>
                <TabsTrigger
                  value="login"
                  onClick={() => setActiveTab("login")}
                  disabled={!!userToken}
                  className={userToken ? "cursor-not-allowed opacity-50" : ""}
                >
                  Login
                </TabsTrigger>
              </TabsList>

              {/* Checkout Tab */}
              <TabsContent value="checkout">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4"
                  data-checkout-form
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Customer Information */}
                    <div>
                      <Label htmlFor="customerName" className="text-sm">
                        Full Name *
                      </Label>
                      <Input
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
                      <div className="relative">
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          maxLength={10}
                          className={`pr-10 ${phoneExists && !userToken ? "border-orange-500 ring-orange-500" : ""}`}
                          required
                          disabled={!!userToken}
                          placeholder="Enter 10-digit mobile number"
                          data-testid="input-phone"
                        />
                        {isCheckingPhone && (
                          <div className="absolute right-3 top-3">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {phoneExists && !userToken && (
                        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-2 mt-1">
                          <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                            ⚠️ This phone number is already registered.
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Please switch to the <strong>Login</strong> tab to
                            continue with this number, or use a different phone
                            number.
                          </p>
                        </div>
                      )}
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
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Delivery Address *</Label>

                      {/* Row 1: Building/House Number and Street */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="building" className="text-xs text-gray-600">
                            Building/House No
                          </Label>
                          <Input
                            id="building"
                            value={addressBuilding}
                            onChange={(e) => handleAddressChange('building', e.target.value)}
                            placeholder="e.g., 18/20"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="street" className="text-xs text-gray-600">
                            Street/Colony
                          </Label>
                          <Input
                            id="street"
                            value={addressStreet}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            placeholder="e.g., LJG Colony"
                            className="text-sm"
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
                                    // Use pincode validation instead of full-address geocoding (more reliable)
                                    console.log("[LOCATION] Selected suggestion:", suggestion, "will validate via pincode");
                                    if (addressPincode && /^\d{5,6}$/.test(addressPincode)) {
                                      setTimeout(() => {
                                        handlePincodeChange(addressPincode);
                                      }, 100);
                                    } else {
                                      console.log("[LOCATION] Pincode not ready, validation will trigger on pincode entry");
                                    }
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
                            {isReValidatingPincode && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pincode Validation Messages */}
                      <div>
                        {isReValidatingPincode && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">⏳ Validating pincode...</p>
                        )}
                        {!isReValidatingPincode && addressPincode && !/^\d{5,6}$/.test(addressPincode) && (
                          <p className="text-xs text-red-500 mt-0.5">Pincode must be 5-6 digits</p>
                        )}
                        {!isReValidatingPincode && addressZoneValidated && addressInDeliveryZone && addressPincode && (
                          <p className="text-xs text-green-600 mt-0.5">✅ Valid pincode for this delivery area</p>
                        )}
                        {!isReValidatingPincode && addressZoneValidated && !addressInDeliveryZone && addressPincode && (
                          <p className="text-xs text-red-600 mt-0.5">❌ Pincode outside delivery zone</p>
                        )}
                      </div>
                    </div>

                    {/* Full Address Display */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs text-gray-700 dark:text-gray-300">
                      <p className="font-semibold">Full Address:</p>
                      <p>{address || "(Enter details above)"}</p>
                    </div>

                    {/* Auto-Validation Status - Shows automatically while validating */}
                    {(isGeocodingAddress || isReValidatingPincode) && (
                      <div className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Validating address...</span>
                      </div>
                    )}

                    {/* Smart Location Validation Feedback - Zomato Style */}
                    {addressZoneValidated && (
                      <div
                        className={`rounded-md p-3 border ${addressInDeliveryZone
                          ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700"
                          : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700"
                          }`}
                      >
                        <div className="flex gap-2 items-start">
                          <MapPin
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${addressInDeliveryZone
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm font-semibold ${addressInDeliveryZone
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                                }`}
                            >
                              {addressInDeliveryZone
                                ? "✓ Delivery Available"
                                : "✗ Outside Service Area"}
                            </p>
                            <p
                              className={`text-xs mt-1 ${addressInDeliveryZone
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300"
                                }`}
                            >
                              {addressInDeliveryZone
                                ? `${address.split(",")[0].trim()}`
                                : `${address.split(",")[0].trim()} is ${addressZoneDistance.toFixed(1)}km away. We deliver within ${cart?.maxDeliveryDistanceKm || 10}km only.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                  {addressConfirmed && addressZoneValidated && addressInDeliveryZone && (
                    <div>
                      {/* Delivery Time Selection - OPTIONAL for Roti orders */}
                      {isRotiCategory && (
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
                                  setSelectedDeliveryTime(slot.startTime);
                                } else {
                                  setSelectedDeliveryTime("");
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
                                            {slot.label}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {cutoff?.deliveryDateLabel} •{" "}
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
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                Optional - if not selected, we'll deliver at the
                                earliest available time
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Referral Code Input - for new users only (not logged in) */}
                      {!isAuthenticated && (
                        <div>
                          <Label
                            htmlFor="referralCode"
                            className="text-sm flex items-center gap-1"
                          >
                            Referral Code{" "}
                            <span className="text-muted-foreground font-normal">
                              (Optional)
                            </span>
                          </Label>
                          <Input
                            id="referralCode"
                            type="text"
                            placeholder="Enter friend's referral code"
                            value={referralCode}
                            onChange={(e) =>
                              setReferralCode(e.target.value.toUpperCase())
                            }
                            className="font-mono uppercase"
                            maxLength={20}
                            data-testid="input-checkout-referral-code"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Have a referral code? Enter it to earn bonus rewards!
                          </p>
                        </div>
                      )}

                      {/* Coupon Code */}
                      <div>
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

                      {/* Totals - Inside form */}
                      <div className="border-t pt-3 space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>
                            Delivery Fee
                            {deliveryDistance !== null && deliveryDistance < 100
                              ? ` (${(Math.max(deliveryDistance, 0.5)).toFixed(1)} km)`
                              : ""}:
                          </span>
                          {!isBelowDeliveryMinimum ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              <span className="line-through text-gray-400 dark:text-gray-500">₹{deliveryFee.toFixed(2)}</span> FREE
                            </span>
                          ) : (
                            <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
                          )}
                        </div>

                        {/* Debugging Ghost 0 */}
                        {/* Debugging Ghost 0 */}
                        {(function () {
                          console.log("[RENDER DEBUG] Zero Check:", {
                            itemDiscountSavings,
                            discount,
                            pendingBonus,
                            walletBalance: user?.walletBalance,
                            isBelowDeliveryMinimum,
                            deliveryFee,
                            "wallet_cond_check": isAuthenticated && user?.walletBalance
                          });
                          return null;
                        })()}

                        {/* Item Discount Savings from offer percentages */}
                        {typeof itemDiscountSavings === 'number' && itemDiscountSavings > 0 && (
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
                        )}

                        {/* Coupon Discount */}
                        {typeof discount === 'number' && discount > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                              <span>Coupon Discount:</span>
                              <span>-₹{discount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}



                        {/* Referral Bonus Section */}
                        {isAuthenticated &&
                          typeof pendingBonus === 'number' && pendingBonus > 0 &&
                          (bonusEligible || !bonusEligibilityMsg) && (
                            <div className="border-t pt-2 mt-2 space-y-2">
                              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-2 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                                      Available Referral Bonus
                                    </p>
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                      ₹{pendingBonus}
                                    </p>
                                    {minOrderAmount > 0 && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        Minimum order: ₹{minOrderAmount}
                                      </p>
                                    )}
                                  </div>
                                  {bonusEligible && (
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
                                        className="text-xs cursor-pointer font-medium text-amber-700 dark:text-amber-300"
                                      >
                                        Use Bonus
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {bonusEligibilityMsg && (
                                  <p
                                    className={`text-xs ${bonusEligible
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                      }`}
                                  >
                                    {bonusEligibilityMsg}
                                  </p>
                                )}

                                {isCheckingBonusEligibility && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Checking eligibility...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Show ineligibility message */}
                        {isAuthenticated &&
                          pendingBonus > 0 &&
                          !bonusEligible &&
                          bonusEligibilityMsg && (
                            <div className="border-t pt-2 mt-2">
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-2">
                                <p className="text-xs text-red-700 dark:text-red-300">
                                  {bonusEligibilityMsg}
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Wallet Balance */}
                        {isAuthenticated && (user?.walletBalance || 0) > 0 && (
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
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Max per order: ₹{maxWalletUsagePerOrder}
                                  </p>
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

                        {/* Delivery Minimum Order Message */}
                        {isBelowDeliveryMinimum && (
                          <div className="border-t pt-2 mt-2">
                            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-lg">🚚</span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    Delivery charge ₹{deliveryFee.toFixed(2)} is applicable
                                  </p>
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Add ₹{amountNeededForFreeDelivery || 0} more items to avoid delivery charge
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between font-bold text-base border-t pt-2">
                          <span>Total:</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </form>
              </TabsContent>

              {/* Login Tab */}
              <TabsContent
                value="login"
                className="space-y-3 sm:space-y-4 mt-4"
              >
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2 sm:p-3 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      Returning customer? Login to auto-fill your details
                    </div>

                    <div>
                      <Label htmlFor="login-phone" className="text-sm">
                        Phone Number *
                      </Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="Enter your registered number"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="login-password" className="text-sm">
                          Password *
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Last 6 digits of your phone"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Default password: last 6 digits of your phone number
                      </p>
                    </div>

                    {showForgotPassword && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 space-y-2">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                          Reset your password? A new password will be sent to
                          you.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowForgotPassword(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleForgotPassword}
                          >
                            Reset Password
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>

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
              {activeTab === "checkout" ? (
                <>
                  {!addressConfirmed && addressZoneValidated && addressInDeliveryZone ? (
                    <Button
                      type="button"
                      onClick={() => setAddressConfirmed(true)}
                      disabled={isLoading || isRotiOrderBlocked || isReValidatingPincode}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "✓ Confirm Address"
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        isLoading ||
                        !isFormValid ||
                        (phoneExists && !userToken) ||
                        cart?.chefIsActive === false ||
                        isRotiOrderBlocked ||
                        !addressZoneValidated ||
                        (addressZoneValidated && !addressInDeliveryZone) ||
                        !addressConfirmed
                      }
                      className="w-full sm:w-auto"
                      data-testid="button-checkout-submit"
                      title={addressZoneValidated && !addressInDeliveryZone ? `${address.split(",")[0].trim()} is outside our service area` : ""}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isRotiOrderBlocked ? (
                        "🚫 Roti Not Available Now"
                      ) : !addressZoneValidated ? (
                        "⚠️ Validate Delivery Address"
                      ) : addressZoneValidated && !addressInDeliveryZone ? (
                        `🚫 ${address.split(",")[0].trim()} - ${addressZoneDistance.toFixed(1)}km away`
                      ) : (
                        `Pay ₹${total.toFixed(2)}`
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading || !phone || !password}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
}