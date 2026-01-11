import { useState, useEffect } from "react";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import Header from "@/components/Header";
  import Hero from "@/components/Hero";
  import CategoryCard from "@/components/CategoryCard";
  import ProductCard from "@/components/ProductCard";
  import CartSidebar from "@/components/CartSidebar";
  import CheckoutDialog from "@/components/CheckoutDialog";
  import PaymentQRDialog from "@/components/PaymentQRDialog";
  import MenuDrawer from "@/components/MenuDrawer";
  import CategoryMenuDrawer from "@/components/CategoryMenuDrawer";
  import ChefListDrawer from "@/components/ChefListDrawer";
  import SubscriptionDrawer from "@/components/SubscriptionDrawer";
  import LoginDialog from "@/components/LoginDialog";
  import Footer from "@/components/Footer";
  import PromotionalBannersSection from "@/components/PromotionalBannersSection";
  import { LocationPermissionModal } from "@/components/LocationPermissionModal";
  import { getImageUrl, handleImageError } from "@/lib/imageUrl";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card } from "@/components/ui/card";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import {
    UtensilsCrossed, ChefHat, Hotel, MessageCircle, Star, Clock,
    SlidersHorizontal, Zap, Sparkles, CalendarClock, Home as HomeIcon, ShoppingBag,
    User, Percent, ArrowRight, TrendingUp, MapPin, AlertCircle
  } from "lucide-react";
  import type { Category, Chef, Product } from "@shared/schema";
  import { useCart } from "@/hooks/use-cart";
  import { toast } from "@/hooks/use-toast";
  import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
  import { useAuth } from "@/hooks/useAuth";
  import { calculateDistance } from "@/lib/locationUtils";
  import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
  import { detectDeliveryArea } from "@/lib/deliveryAreas";
  import { AreaSelector } from "@/components/AreaSelector";

  const iconMap: Record<string, React.ReactNode> = {
    UtensilsCrossed: <UtensilsCrossed className="h-6 w-6 text-primary" />,
    ChefHat: <ChefHat className="h-6 w-6 text-primary" />,
    Hotel: <Hotel className="h-6 w-6 text-primary" />,
  };

  const filterOptions = [
    { id: "filters", label: "Filters", icon: SlidersHorizontal },
    { id: "near-fast", label: "Near & Fast", icon: Zap },
    { id: "new", label: "New to you", icon: Sparkles },
    { id: "rating", label: "Rating 4.0+", icon: Star },
    { id: "offers", label: "Great Offers", icon: Percent },
  ];

  export default function Home() {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutCategoryId, setCheckoutCategoryId] = useState<string>("");
    const [isPaymentQROpen, setIsPaymentQROpen] = useState(false);
    const [paymentOrderDetails, setPaymentOrderDetails] = useState<{
      orderId: string;
      amount: number;
      customerName: string;
      phone: string;
      email?: string;
      address: string;
      accountCreated?: boolean;
      defaultPassword?: string;
    } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isChefListOpen, setIsChefListOpen] = useState(false);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [selectedCategoryForChefList, setSelectedCategoryForChefList] = useState<Category | null>(null);
    const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState<Category | null>(null);
    const [selectedChefForMenu, setSelectedChefForMenu] = useState<Chef | null>(null);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCart, setSelectedCart] = useState<any>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [mobileNavTab, setMobileNavTab] = useState<string>("delivery");
    const [vegOnly, setVegOnly] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const { user } = useAuth();

    const { carts, addToCart: cartAddToCart, canAddItem, clearCart, getTotalItems, setUserLocation, getAllCartsWithDelivery, updateChefStatus, fetchChefStatuses, userLatitude, userLongitude, updateQuantity, removeFromCart } = useCart();
    const queryClient = useQueryClient();

    // DELIVERY ZONE DETECTION (Zomato-style)
    const [deliveryZoneDetected, setDeliveryZoneDetected] = useState(false);
    const [userInDeliveryZone, setUserInDeliveryZone] = useState(false); // Default to false - REQUIRE location before showing categories
    const [isDetectingLocation, setIsDetectingLocation] = useState(true);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState("");
    const [manualAddress, setManualAddress] = useState("");
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [isSafariOnIOS, setIsSafariOnIOS] = useState(false); // Detect Safari on iPhone

    // Get delivery location from Context (syncs with CheckoutDialog)
    const { location: deliveryLocation } = useDeliveryLocation();

    // Use WebSocket for real-time chef status and product availability updates
    const { chefStatuses, productAvailability, wsConnected } = useCustomerNotifications();

    // Sync WebSocket chef statuses to cart store
    useEffect(() => {
      Object.entries(chefStatuses).forEach(([chefId, isActive]) => {
        updateChefStatus(chefId, isActive);
      });
    }, [chefStatuses, updateChefStatus]);

    // Fetch initial chef statuses on mount
    useEffect(() => {
      fetchChefStatuses();
    }, [fetchChefStatuses]);

    // ZOMATO-STYLE LOCATION DETECTION ON PAGE LOAD
    // Auto-detect user location and check if they're in delivery zone
    // DO NOT show categories until location confirmed
    useEffect(() => {
      const detectLocationAndZone = async () => {
        try {
          setIsDetectingLocation(true);
          
          // FIRST: Check if address was already validated in checkout (from Context)
          if (deliveryLocation.isInZone && deliveryLocation.address) {
            console.log("[LOCATION-DETECTION] ✅ Using previously validated address from Context:", deliveryLocation.address);
            setUserInDeliveryZone(true);
            setDeliveryZoneDetected(true);
            setLocationPermissionDenied(false);
            setIsDetectingLocation(false);
            return; // Use context location, no need for GPS
          }
          
          // SECOND: Detect if user is on Safari/iPhone
          const userAgent = navigator.userAgent.toLowerCase();
          const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
          const isIOS = /iphone|ipad|ipod/.test(userAgent);
          const onSafariIOS = isSafari && isIOS;
          
          if (onSafariIOS) {
            console.log("[LOCATION-DETECTION] ⚠️ Safari on iOS detected - showing browser recommendation");
            setIsSafariOnIOS(true);
          }
          
          // Try to get user's GPS location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log("[LOCATION-DETECTION] User location detected:", lat, lng);
                
                // Set location in cart store
                setUserLocation(lat, lng);
                
                // Check if location is in delivery zone (within 2.5km of chef)
                // Chef is at Kurla West, Mumbai (19.068604, 72.87658)
                const CHEF_LAT = 19.068604;
                const CHEF_LNG = 72.87658;
                const MAX_DELIVERY_DISTANCE = 2.5; // km
                
                const distance = calculateDistance(lat, lng, CHEF_LAT, CHEF_LNG);
                console.log("[LOCATION-DETECTION] Distance to chef:", distance, "km");
                
                if (distance <= MAX_DELIVERY_DISTANCE) {
                  setUserInDeliveryZone(true);
                  setLocationPermissionDenied(false);
                  console.log("[LOCATION-DETECTION] ✅ User is in delivery zone - NOW SHOWING CATEGORIES");
                } else {
                  setUserInDeliveryZone(false);
                  setLocationPermissionDenied(true);
                  console.log("[LOCATION-DETECTION] ❌ User is OUTSIDE delivery zone");
                }
                
                setDeliveryZoneDetected(true);
              },
              (error) => {
                console.log("[LOCATION-DETECTION] Location permission denied or unavailable:", error);
                // Location NOT detected - BLOCK categories
                setDeliveryZoneDetected(true);
                setUserInDeliveryZone(false); // BLOCK categories
                setLocationPermissionDenied(true);
              },
              { timeout: 8000, enableHighAccuracy: false }
            );
          } else {
            console.log("[LOCATION-DETECTION] Geolocation not supported - BLOCKING categories");
            setDeliveryZoneDetected(true);
            setUserInDeliveryZone(false); // BLOCK categories if geo not supported
            setLocationPermissionDenied(true);
          }
        } catch (error) {
          console.error("[LOCATION-DETECTION] Error detecting location:", error);
          setDeliveryZoneDetected(true);
          setUserInDeliveryZone(false); // BLOCK categories on error
          setLocationPermissionDenied(true);
        } finally {
          setIsDetectingLocation(false);
        }
      };
      
      detectLocationAndZone();
    }, [setUserLocation]);

    const handleCategoryTabChange = (value: string) => {
      setSelectedCategoryTab(value);
      setIsChefListOpen(false);
      setIsCategoryMenuOpen(false);
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // ZOMATO-STYLE: Only load categories/chefs/products if location is detected!
    // Can be from GPS OR validated address from Context
    const shouldLoadMenu = userInDeliveryZone && deliveryZoneDetected;
    
    // ============================================
    // PHASE 4: SMART AREA DETECTION WITH FALLBACK
    // ============================================
    const [detectedArea, setDetectedArea] = useState<string | null>(null);
    const [detectionSource, setDetectionSource] = useState<'address' | 'gps' | 'fallback' | 'manual' | null>(null);
    
    // Smart detection: Try Tier 1 (address) → Tier 2 (GPS) → Tier 3 (fallback/selector)
    useEffect(() => {
      const detectArea = async () => {
        const contextLocation = deliveryLocation as any;
        if (!contextLocation?.address && !contextLocation?.latitude && !contextLocation?.longitude) {
          return; // No location data available
        }

        const detected = await detectDeliveryArea(
          contextLocation?.address || null,
          contextLocation?.latitude || null,
          contextLocation?.longitude || null
        );
        
        if (detected) {
          setDetectedArea(detected.name);
          setDetectionSource(detected.source);
          console.log(`🎯 Area detected: ${detected.name} (source: ${detected.source})`);
        } else {
          setDetectedArea(null);
          setDetectionSource('fallback');
          console.log("🎯 Area detection failed, showing selector");
        }
      };
      
      detectArea();
    }, [deliveryLocation]);
    
    const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
      queryKey: ["/api/categories"],
      enabled: shouldLoadMenu, // Only load if location confirmed
    });

    // Use smart detected area, fallback to context address parsing
    const contextLocation = deliveryLocation as any;
    const selectedArea = detectedArea || (contextLocation?.address 
      ? contextLocation.address.split(",")[0].trim() 
      : null);

    const { data: chefs = [], isLoading: chefsLoading } = useQuery<Chef[]>({
      // 🔴 CRITICAL FIX: Query chefs by delivery area to show only area-specific chefs
      // E.g., if user selects Kurla West, show ONLY Kurla West chefs, NOT Mahim chefs
      queryKey: selectedArea ? ["/api/chefs/by-area", selectedArea] : ["/api/chefs"],
      queryFn: async () => {
        if (selectedArea) {
          console.log(`📍 Loading chefs for delivery area: ${selectedArea}`);
          const res = await fetch(`/api/chefs/by-area/${encodeURIComponent(selectedArea)}`);
          if (!res.ok) throw new Error("Failed to fetch chefs for area");
          const data = await res.json();
          console.log(`✅ Loaded ${data.length} chefs for ${selectedArea}`);
          return data;
        }
        // Fallback to all chefs if no area selected
        const res = await fetch("/api/chefs");
        if (!res.ok) throw new Error("Failed to fetch chefs");
        return res.json();
      },
      enabled: shouldLoadMenu, // Only load if location confirmed
    });

    const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
      queryKey: ["/api/products"],
      enabled: shouldLoadMenu, // Only load if location confirmed
    });

    const handleAddToCart = (product: Product) => {
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category?.name || "Unknown";

      // Get chef location if available
      const chef = product.chefId ? chefs.find(c => c.id === product.chefId) : null;

      // Calculate discounted price if offer exists
      const discountedPrice = product.offerPercentage && product.offerPercentage > 0
        ? Math.round(product.price * (1 - product.offerPercentage / 100))
        : product.price;

      const cartItem = {
        id: product.id,
        name: product.name,
        price: discountedPrice,
        originalPrice: product.price,
        offerPercentage: product.offerPercentage || 0,
        image: product.image,
        chefId: product.chefId || undefined,
        chefName: selectedChefForMenu?.name || chef?.name || undefined,
        categoryId: product.categoryId,
      };

      const checkResult = canAddItem(cartItem.chefId, cartItem.categoryId);
      if (!checkResult.canAdd) {
        const confirmed = window.confirm(
          `Your ${categoryName} cart contains items from ${checkResult.conflictChef}. Do you want to replace them with items from ${cartItem.chefName || "this chef"}?`
        );
        if (confirmed) {
          clearCart(cartItem.categoryId || "");
          cartAddToCart(cartItem, categoryName, chef?.latitude, chef?.longitude);
        }
        return;
      }

      cartAddToCart(cartItem, categoryName, chef?.latitude, chef?.longitude);
    };

    const totalItems = getTotalItems();

    // ✅ Called when checkout creates order successfully
    const handleCheckout = (categoryId: string) => {
      // ZOMATO-STYLE: Check if user is in delivery zone before allowing checkout
      if (!userInDeliveryZone && !userLatitude && !userLongitude) {
        toast({
          title: "Location Required",
          description: "Please enter your delivery address to proceed",
          variant: "destructive",
        });
        setShowAddressModal(true);
        return;
      }

      // Get the cart with precomputed delivery values
      const cartsWithDelivery = getAllCartsWithDelivery();
      const cart = cartsWithDelivery.find(c => c.categoryId === categoryId);

      console.log("[CHECKOUT] Cart selected for checkout:", {
        categoryId,
        cart: cart ? {
          categoryId: cart.categoryId,
          chefId: cart.chefId,
          chefLatitude: cart.chefLatitude,
          chefLongitude: cart.chefLongitude,
          deliveryFee: cart.deliveryFee,
          distance: cart.distance,
        } : null,
      });

      if (cart) {
        setSelectedCart(cart);
        setCheckoutCategoryId(categoryId);
        setIsCartOpen(false);
        // Wait for sidebar animation before showing checkout
        setTimeout(() => {
          setIsCheckoutOpen(true);
        }, 250);
      }
    };


    // ✅ Called when checkout creates order successfully
    const handleShowPaymentQR = (orderDetails: {
      orderId: string;
      amount: number;
      customerName: string;
      phone: string;
      email?: string;
      address: string;
      accountCreated?: boolean;
      defaultPassword?: string;
    }) => {
      setPaymentOrderDetails(orderDetails);
      setIsCheckoutOpen(false);
      setTimeout(() => {
        setIsPaymentQROpen(true);
      }, 100);
    };

    // ✅ Called after QR payment flow completes
    const handleOrderSuccess = (categoryId: string | null) => {
      setIsPaymentQROpen(false);
      setPaymentOrderDetails(null);

      // Clear the cart for the completed order
      if (categoryId) {
        clearCart(categoryId);
        toast({
          title: "Cart cleared",
          description: "Your order has been placed successfully",
        });
      }
    };

    // ✅ Called when checkout dialog closes
    const handleCheckoutClose = () => {
      setIsCheckoutOpen(false);
      setCheckoutCategoryId("");
      setSelectedCart(null); // Reset selected cart
    };

    const handleCategoryClick = (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategoryTab(categoryId);
        setIsMenuOpen(false);
        setTimeout(() => {
          const productsSection = document.getElementById("products-section");
          if (productsSection) {
            productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    };

    const handleChefClick = (chef: Chef) => {
    // Get realtime chef status
    const realtimeStatus = chefStatuses[chef.id];
    const isActive = realtimeStatus !== undefined ? realtimeStatus : (chef.isActive !== false);
    const chefWithStatus = { ...chef, isActive };
    setSelectedChefForMenu(chefWithStatus);
    setSelectedCategoryForMenu(selectedCategoryForChefList);
    setIsCategoryMenuOpen(true);
  };

    const handleBrowseCategory = (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategoryForChefList(category);
        setSelectedCategoryTab(categoryId);
        setIsChefListOpen(true);
      }
    };

    const handleWhatsAppSupport = () => {
      const message = "Hi! I need help with ordering from RotiHai.";
      const whatsappUrl = `https://wa.me/918169020290?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const [showOffersOnly, setShowOffersOnly] = useState(false);

    // Compute chef data with best offers and menu info
  const chefsWithOffers = chefs.map(chef => {
    const chefProducts = products.filter(p => p.chefId === chef.id);
    const bestOffer = chefProducts.reduce((max, p) => Math.max(max, p.offerPercentage || 0), 0);
    const hasVegItems = chefProducts.some(p => p.isVeg);
    const hasNonVegItems = chefProducts.some(p => !p.isVeg);
    const isVegOnly = hasVegItems && !hasNonVegItems;
    const lowestPrice = chefProducts.length > 0 ? Math.min(...chefProducts.map(p => p.price)) : 0;
    
    // Sort products deterministically: by best offer first, then by lowest price
    const sortedProducts = [...chefProducts].sort((a, b) => {
      const aOffer = a.offerPercentage || 0;
      const bOffer = b.offerPercentage || 0;
      if (bOffer !== aOffer) return bOffer - aOffer;
      return a.price - b.price;
    });
    const highlightDish = sortedProducts.length > 0 ? sortedProducts[0].name : "";
    
    return {
      ...chef,
      bestOfferPercentage: bestOffer,
      hasVegItems,
      isVegOnly,
      lowestPrice,
      highlightDish,
      productCount: chefProducts.length,
    };
  });

  // Filter chefs when a category is selected (Zomato-style)
  const filteredChefs = chefsWithOffers.filter(chef => {
    // Filter by search query first - show chefs that have matching products
    if (searchQuery.trim()) {
      const searchLower = searchQuery.trim().toLowerCase();
      const chefProducts = products.filter(p => p.chefId === chef.id);
      const hasMatchingProduct = chefProducts.some(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
      // Also match chef name
      const chefNameMatches = chef.name.toLowerCase().includes(searchLower);
      if (!hasMatchingProduct && !chefNameMatches) {
        return false;
      }
    }

    // Filter by selected category
    if (selectedCategoryTab !== "all" && chef.categoryId !== selectedCategoryTab) {
      return false;
    }

    // Apply veg only filter - only when products are loaded
    if (vegOnly && !productsLoading && !chef.hasVegItems) {
      return false;
    }

    // Apply offers filter - only filter out when products are loaded (avoid race condition)
    if ((activeFilters.includes("offers") || showOffersOnly) && !productsLoading && chef.bestOfferPercentage === 0) {
      return false;
    }

    // Apply rating filter (4.0+)
    if (activeFilters.includes("rating")) {
      if (parseFloat(chef.rating) < 4.0) return false;
    }

    // Apply near & fast filter (within 5km)
    if (activeFilters.includes("near-fast")) {
      if (userLatitude && userLongitude && chef.latitude && chef.longitude) {
        const R = 6371;
        const lat1 = userLatitude;
        const lon1 = userLongitude;
        const lat2 = chef.latitude;
        const lon2 = chef.longitude;
        const toRad = (deg: number) => deg * (Math.PI / 180);
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.asin(Math.sqrt(a));
        const distance = R * c;

        if (distance > 5) return false;
      }
    }

    // Apply "new to you" filter (high ratings 4.3+)
    if (activeFilters.includes("new")) {
      if (parseFloat(chef.rating) < 4.3) return false;
    }

    return true;
  });

  // Filter products when showing "all" categories
  const filteredProducts = products.filter((product, index) => {
      const searchLower = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      // When searching, show all categories; otherwise filter by selected category
      const matchesCategory =
        searchLower || selectedCategoryTab === "all" || product.categoryId === selectedCategoryTab;

      // Apply rating filter (4.0+)
      if (activeFilters.includes("rating")) {
        if (parseFloat(product.rating) < 4.0) return false;
      }

      // Apply offers filter
      if (activeFilters.includes("offers") || showOffersOnly) {
        const hasOffer = index % 3 === 0 || index % 3 === 1 || (product.offerPercentage && product.offerPercentage > 0);
        if (!hasOffer) return false;
      }

      // Apply near & fast filter (within 5km)
      if (activeFilters.includes("near-fast")) {
        const chef = product.chefId ? chefs.find(c => c.id === product.chefId) : null;

        if (chef && userLatitude && userLongitude && chef.latitude && chef.longitude) {
          const R = 6371;
          const lat1 = userLatitude;
          const lon1 = userLongitude;
          const lat2 = chef.latitude;
          const lon2 = chef.longitude;
          const toRad = (deg: number) => deg * (Math.PI / 180);
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.asin(Math.sqrt(a));
          const distance = R * c;

          if (distance > 5) return false;
        }
      }

      // Apply "new to you" filter (high ratings 4.3+)
      if (activeFilters.includes("new")) {
        if (parseFloat(product.rating) < 4.3) return false;
      }

      // Apply veg only filter
      if (vegOnly && !product.isVeg) {
        return false;
      }

      return matchesSearch && matchesCategory;
    });

    const requestLocationPermission = () => {
      // Modal will handle location requests with better UX
      setIsLocationModalOpen(true);
    };

    const handleLocationGranted = (lat: number, lng: number) => {
      setUserLocation(lat, lng);
      setIsLocationModalOpen(false);
    };

    // Show toast notifications for chef status changes
    useEffect(() => {
      requestLocationPermission();
    }, []);

    // Listen for chef status updates and show notifications
    useEffect(() => {
      // This effect will run when chefStatuses changes.
      // It's important to ensure we don't show toasts on initial load if chefStatuses is empty or already reflects the current state.
      // A more robust solution might involve comparing previous and current statuses, but for now, we rely on the toast logic within the WebSocket handler if it were still present.
      // Since we've removed the direct WebSocket handler, we need to ensure the `chefStatuses` from `useCustomerNotifications` are correctly processed.
      // The `updateChefStatus` call in the earlier useEffect handles syncing the status to the cart.
      // If we need to show toasts on status changes, we'd need to compare `chefStatuses` across renders or have a dedicated callback from `useCustomerNotifications`.
      // Without direct access to `useCustomerNotifications`'s internal logic for triggering toasts, this part is a placeholder for where such logic would reside if needed.

      // For now, assuming `useCustomerNotifications` or a subsequent effect handles the UI feedback.
      // The original code invalidated queries and showed toasts directly in the WebSocket handler.
      // If `useCustomerNotifications` provides a way to react to status *changes* (not just the current state), that's where toasts should be triggered.
      // Without direct access to `useCustomerNotifications`'s internal logic for triggering toasts, this part is a placeholder for where such logic would reside if needed.

      // To avoid spam on initial load, we might add checks like:
      // if (previousChefStatuses.current && !isEqual(previousChefStatuses.current, chefStatuses)) { ... show toasts ... }
      // However, for this edit, we are just removing the duplicate WebSocket.

    }, [chefStatuses]); // Depend on chefStatuses to re-run if statuses change

    const toggleFilter = (filterId: string) => {
      // Don't open subscription drawer for offers filter anymore
      setActiveFilters(prev =>
        prev.includes(filterId)
          ? prev.filter(f => f !== filterId)
          : [...prev, filterId]
      );
    };

    return (
      <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
        <Header
          cartItemCount={totalItems}
          onCartClick={() => setIsCartOpen(true)}
          onMenuClick={() => setIsMenuOpen(true)}
          onChefListClick={() => setIsChefListOpen(true)}
          onSubscriptionClick={() => setIsSubscriptionOpen(true)}
          onLoginClick={() => setIsLoginOpen(true)}
          onOffersClick={() => setShowOffersOnly(!showOffersOnly)}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim() && selectedCategoryTab !== "all") {
              setSelectedCategoryTab("all");
            }
          }}
        />

        {/* ZOMATO-STYLE: Show location required banner if not detected */}
        {deliveryZoneDetected && !userInDeliveryZone && (
          <div className={`${isSafariOnIOS ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border-b-2 py-4 px-4`}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isSafariOnIOS ? 'text-red-600' : 'text-orange-600'}`} />
                <div className="flex-1">
                  {isSafariOnIOS ? (
                    <>
                      <h3 className="font-semibold text-red-900">📱 Switch to Chrome for Better Location Access</h3>
                      <p className="text-sm text-red-800 mt-1">
                        We detected Safari on iPhone. Chrome provides better location detection. Please open in Chrome for the best experience.
                      </p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <a 
                          href="https://apps.apple.com/app/chrome/id535886823" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
                        >
                          Get Chrome
                        </a>
                        <button 
                          onClick={() => setShowAddressModal(true)}
                          className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
                        >
                          Or Enter Address
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-orange-900">📍 Enable Location to See Our Menu</h3>
                      <p className="text-sm text-orange-800 mt-1">
                        We need your location to show delivery availability. Or enter your address manually.
                      </p>
                      <button 
                        onClick={() => setShowAddressModal(true)}
                        className="text-sm font-semibold text-orange-700 hover:text-orange-900 underline mt-2"
                      >
                        Enter Address →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          <Hero />

          {/* Zomato-style Category Tabs - Circular Icons */}
          <section className="bg-background py-4 border-b">
            <div className="max-w-7xl mx-auto px-3">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3">
                {/* All Category */}
                <button
                  onClick={() => handleCategoryTabChange("all")}
                  className={`flex flex-col items-center gap-2 min-w-[70px] group transition-all justify-start pt-1 ${
                    selectedCategoryTab === "all" ? "scale-105" : ""
                  }`}
                  data-testid="button-category-all"
                >
                  <div className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 flex-shrink-0 ${
                    selectedCategoryTab === "all" ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}>
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center">
                      <UtensilsCrossed className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <span className={`text-xs font-medium text-center whitespace-nowrap ${
                    selectedCategoryTab === "all" ? "text-primary font-bold" : "text-muted-foreground"
                  }`}>All</span>
                </button>

                {/* Dynamic Categories */}
                {categoriesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                      <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                      <div className="w-12 h-3 bg-muted rounded animate-pulse" />
                    </div>
                  ))
                ) : (
                  categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleBrowseCategory(category.id)}
                      className={`flex flex-col items-center gap-2 min-w-[70px] sm:min-w-[80px] group transition-all ${selectedCategoryTab === category.id ? "scale-105" : ""}`}
                      data-testid={`button-category-${category.id}`}
                    >
                      <div className={`relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 flex-shrink-0 ${
                        selectedCategoryTab === category.id ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}>
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      </div>
                      <span className={`text-xs font-medium text-center whitespace-nowrap max-w-[70px] sm:max-w-[80px] truncate ${
                        selectedCategoryTab === category.id ? "text-primary font-bold" : "text-muted-foreground"
                      }`}>{category.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Filter Pills */}
          <section className="sticky top-14 sm:top-16 z-40 bg-background/95 backdrop-blur-md border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-3 py-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {filterOptions.map(filter => {
                  const Icon = filter.icon;
                  const isActive = activeFilters.includes(filter.id);
                  return (
                    <button
                      key={filter.id}
                      onClick={() => toggleFilter(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                      data-testid={`button-filter-${filter.id}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Dynamic Promotional Banners */}
          <PromotionalBannersSection
            onSubscriptionClick={() => setIsSubscriptionOpen(true)}
            onCategoryClick={(categoryId) => {
              setSelectedCategoryTab(categoryId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* PHASE 4: Area Selector - Show when area detection fails (fallback mode) */}
          {detectionSource === 'fallback' && (
            <div className="max-w-7xl mx-auto px-3 py-2">
              <AreaSelector
                selectedArea={selectedArea}
                onAreaChange={(area) => {
                  setDetectedArea(area);
                  setDetectionSource('manual');
                  console.log(`🎯 User manually selected area: ${area}`);
                }}
              />
            </div>
          )}

          {/* Area detection indicator for debugging (optional) */}
          {selectedArea && detectionSource && (
            <div className="max-w-7xl mx-auto px-3 py-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                📍 Showing chefs for: {selectedArea}
                {detectionSource === 'gps' && " (GPS detected)"}
                {detectionSource === 'address' && " (Address detected)"}
                {detectionSource === 'manual' && " (You selected)"}
                {detectionSource === 'fallback' && " (Select above)"}
              </div>
            </div>
          )}

          {/* Main Content Section */}
          <section className="max-w-7xl mx-auto px-3 py-4" id="products-section">
            {selectedCategoryTab === "all" ? (
              <>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Recommended For You
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Top-rated restaurants and home chefs near you
                    </p>
                  </div>
                  {/* Filters for Search */}
                  <div className="flex items-center gap-4 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="veg-filter"
                        checked={vegOnly}
                        onChange={(e) => setVegOnly(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        data-testid="checkbox-veg-only"
                      />
                      <label htmlFor="veg-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Veg Only
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="offers-filter"
                        checked={showOffersOnly}
                        onChange={(e) => setShowOffersOnly(e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        data-testid="checkbox-offers-only"
                      />
                      <label htmlFor="offers-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Offers Only
                      </label>
                    </div>
                  </div>
                </div>

                {/* Partners/Restaurants Grid - Zomato Style Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chefsLoading ? (
                    [...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden animate-pulse">
                        <div className="h-40 bg-muted" />
                        <div className="p-4 space-y-2">
                          <div className="h-5 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </Card>
                    ))
                  ) : filteredChefs.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        {searchQuery ? `No restaurants found matching "${searchQuery}"` : "No restaurants match your filters"}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setVegOnly(false);
                          setShowOffersOnly(false);
                          setActiveFilters([]);
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    filteredChefs.map(chef => {
                      const realtimeStatus = chefStatuses[chef.id];
                      const isChefActive = realtimeStatus !== undefined ? realtimeStatus : (chef.isActive !== false);
                      let distance: number | null = null;

                      if (userLatitude && userLongitude && chef.latitude && chef.longitude) {
                        const R = 6371;
                        const toRad = (deg: number) => deg * (Math.PI / 180);
                        const dLat = toRad(chef.latitude - userLatitude);
                        const dLon = toRad(chef.longitude - userLongitude);
                        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos(toRad(userLatitude)) * Math.cos(toRad(chef.latitude)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.asin(Math.sqrt(a));
                        distance = Math.round(R * c * 10) / 10;
                      }

                      return (
                        <Card
                          key={chef.id}
                          className={`overflow-hidden transition-all ${
                            isChefActive
                              ? "cursor-pointer hover:shadow-lg"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if (!isChefActive) {
                              toast({
                                title: "Currently Unavailable",
                                description: `${chef.name} is not accepting orders right now`,
                                variant: "destructive",
                              });
                              return;
                            }
                            const category = categories.find(c => c.id === chef.categoryId);
                            setSelectedChefForMenu({ ...chef, isActive: isChefActive });
                            setSelectedCategoryForMenu(category || null);
                            setIsCategoryMenuOpen(true);
                          }}
                          data-testid={`card-partner-${chef.id}`}
                        >
                          <div className="relative h-36 sm:h-44 overflow-hidden">
                            <img
                              src={chef.image}
                              alt={chef.name}
                              className={`w-full h-full object-cover transition-transform duration-300 ${
                                isChefActive ? "group-hover:scale-105" : "grayscale"
                              }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            
                            {/* Offer Badge - only show if there's a real offer */}
                            {chef.bestOfferPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                {chef.bestOfferPercentage}% OFF
                              </div>
                            )}

                            {/* Veg indicator */}
                            {chef.isVegOnly && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 border-2 border-green-600 bg-white rounded-sm flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                                </div>
                              </div>
                            )}

                            {/* Rating and delivery info */}
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-600 text-white border-0 text-xs">
                                  <Star className="h-3 w-3 fill-current mr-0.5" />
                                  {parseFloat(chef.rating).toFixed(1)}
                                </Badge>
                                <span className="text-white text-xs">
                                  ({chef.reviewCount} reviews)
                                </span>
                              </div>
                              {distance !== null && (
                                <span className="text-white text-xs">
                                  {distance} km
                                </span>
                              )}
                            </div>

                            {/* Unavailable overlay */}
                            {!isChefActive && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="text-sm">
                                  Currently Unavailable
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-base line-clamp-1" data-testid={`text-partner-name-${chef.id}`}>
                              {chef.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {chef.description}
                            </p>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>30-40 mins</span>
                              </div>
                              {chef.lowestPrice > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  From ₹{chef.lowestPrice}
                                </span>
                              )}
                            </div>
                            {chef.highlightDish && (
                              <p className="text-xs text-primary mt-1.5 font-medium line-clamp-1">
                                Try: {chef.highlightDish}
                              </p>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Category View - Chefs/Restaurants */}
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                    <ChefHat className="h-6 w-6 text-primary" />
                    {categories.find(c => c.id === selectedCategoryTab)?.name || "Restaurants"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select a restaurant to view their menu
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chefsLoading ? (
                    [...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden animate-pulse">
                        <div className="h-40 bg-muted" />
                        <div className="p-4 space-y-2">
                          <div className="h-5 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </Card>
                    ))
                  ) : (
                    filteredChefs
                      .map(chef => {
                        let distance: number | null = null;
                        let deliveryFee: number | null = null;
                        const isChefActive = chef.isActive !== false;

                        if (userLatitude && userLongitude && chef.latitude && chef.longitude) {
                          const R = 6371;
                          const lat1 = userLatitude;
                          const lon1 = userLongitude;
                          const lat2 = chef.latitude;
                          const lon2 = chef.longitude;

                          if (lat1 >= -90 && lat1 <= 90 && lon1 >= -180 && lon1 <= 180 &&
                              lat2 >= -90 && lat2 <= 90 && lon2 >= -180 && lon2 <= 180) {
                            const toRad = (deg: number) => deg * (Math.PI / 180);
                            const dLat = toRad(lat2 - lat1);
                            const dLon = toRad(lon2 - lon1);
                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                            const c = 2 * Math.asin(Math.sqrt(a));
                            const calculatedDistance = R * c;
                            if (calculatedDistance < 100) {
                              distance = parseFloat(calculatedDistance.toFixed(1));
                              
                              // Calculate delivery fee: distance × ₹5/km
                              const feePerKm = 5;
                              deliveryFee = Math.ceil(distance * feePerKm);
                            }
                          }
                        } else {
                          // No location: show default delivery fee (₹20)
                          deliveryFee = 20;
                        }

                        return (
                          <Card
                            key={chef.id}
                            className={`overflow-hidden transition-all ${
                              isChefActive
                                ? "cursor-pointer hover:shadow-lg"
                                : "opacity-60 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (!isChefActive) {
                                toast({
                                  title: "Currently Unavailable",
                                  description: `${chef.name} is not accepting orders right now`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              const category = categories.find(c => c.id === selectedCategoryTab);
                              setSelectedChefForMenu(chef);
                              setSelectedCategoryForMenu(category || null);
                              setIsCategoryMenuOpen(true);
                            }}
                            data-testid={`card-chef-${chef.id}`}
                          >
                            <div className="relative h-36 sm:h-44 overflow-hidden">
                              <img
                                src={getImageUrl(chef.image)}
                                alt={chef.name}
                                onError={handleImageError}
                                className={`w-full h-full object-cover transition-transform duration-300 ${
                                  isChefActive ? "group-hover:scale-105" : "grayscale"
                                }`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                              {/* Rating Badge */}
                              <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                {chef.rating}
                              </div>

                              {!isChefActive && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Badge variant="destructive" className="text-sm">
                                    Currently Closed
                                  </Badge>
                                </div>
                              )}

                              {distance !== null && isChefActive && (
                                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                                  {distance.toFixed(1)} km
                                </div>
                              )}
                            </div>

                            <div className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-bold text-base sm:text-lg truncate ${!isChefActive ? "text-muted-foreground" : ""}`}>
                                    {chef.name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                    {chef.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3 mt-2">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {distance !== null ? `~${Math.ceil(distance * 2 + 15)} mins` : "30-45 mins"}
                                  </span>
                                  <span>•</span>
                                  <span>{chef.reviewCount} reviews</span>
                                </div>
                              </div>
                              
                              {/* Delivery Fee Display - Zomato Style */}
                              {deliveryFee !== null && (
                                <div className="mt-2 pt-2 border-t border-muted">
                                  {userLatitude && userLongitude ? (
                                    <p className="text-xs text-muted-foreground">
                                      Delivery: <span className="font-semibold text-foreground">₹{deliveryFee}</span>
                                    </p>
                                  ) : (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                      Estimated delivery: <span className="font-semibold">₹{deliveryFee}</span>
                                      <br />
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsLocationModalOpen(true);
                                        }}
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        Get accurate fee
                                      </button>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </section>
        </main>

        <Footer />

        {/* Mobile Bottom Navigation - Zomato Style */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 md:hidden safe-area-inset-bottom">
          <div className="flex items-center justify-around h-14">
            <Button
          onClick={handleWhatsAppSupport}
          className="fixed bottom-20 md:bottom-6 right-4 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white z-40"
          size="icon"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
            
            {/* <button
              onClick={() => setMobileNavTab("delivery")}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                mobileNavTab === "delivery" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="nav-delivery"
            >
              <HomeIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">Delivery</span>
              {mobileNavTab === "delivery" && (
                <span className="absolute top-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              )}
            </button> */}

            <button
              onClick={() => setIsSubscriptionOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                mobileNavTab === "offers" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="nav-offers"
            >
              <Percent className="h-5 w-5" />
              <span className="text-[10px] font-medium">Under ₹200</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground relative"
              data-testid="nav-cart"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </button>

            <button
              onClick={() => user ? window.location.href = '/profile' : setIsLoginOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground"
              data-testid="nav-profile"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">{user ? 'Profile' : 'Sign In'}</span>
            </button>
          </div>
        </nav>

        {/* Floating WhatsApp Support Button - Adjusted for mobile nav */}
        {/* <Button
          onClick={handleWhatsAppSupport}
          className="fixed bottom-20 md:bottom-6 right-4 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white z-40"
          size="icon"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        </Button> */}

        {/* Drawers */}
        <MenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          categories={categories}
          onCategoryClick={handleCategoryClick}
          selectedCategoryTab={selectedCategoryTab}
          onCategoryTabChange={handleCategoryTabChange}
          onSubscriptionClick={() => setIsSubscriptionOpen(true)}
          onLoginClick={() => setIsLoginOpen(true)}
        />

        <ChefListDrawer
          isOpen={isChefListOpen}
          onClose={() => setIsChefListOpen(false)}
          category={selectedCategoryForChefList}
          chefs={chefs}
          onChefClick={handleChefClick}
        />

        <CategoryMenuDrawer
          isOpen={isCategoryMenuOpen}
          onClose={() => setIsCategoryMenuOpen(false)}
          category={selectedCategoryForMenu}
          chef={selectedChefForMenu}
          products={products}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={updateQuantity}
          cartItems={
            selectedCategoryForMenu
              ? carts.find(c => c.categoryId === selectedCategoryForMenu.id)?.items.map(item => ({
                  id: item.id,
                  quantity: item.quantity,
                  price: item.price,
                })) || []
              : []
          }
          autoCloseOnAdd={false}
          onProceedToCart={() => {
            setIsCategoryMenuOpen(false);
            setIsCartOpen(true);
          }}
        />

        {/* ✅ Sidebar + Checkout Dialog */}
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
        />

       <CheckoutDialog
    isOpen={isCheckoutOpen}
    onClose={handleCheckoutClose}
    cart={selectedCart} // Use selectedCart for the checkout dialog
    onClearCart={() => {
      if (selectedCart) {
        clearCart(selectedCart.categoryId);
      }
    }}
    onShowPaymentQR={handleShowPaymentQR}
  />

        {paymentOrderDetails && (
          <PaymentQRDialog
            isOpen={isPaymentQROpen}
            onClose={() => handleOrderSuccess(checkoutCategoryId)}
            orderId={paymentOrderDetails.orderId}
            amount={paymentOrderDetails.amount}
            customerName={paymentOrderDetails.customerName}
            phone={paymentOrderDetails.phone}
            email={paymentOrderDetails.email}
            address={paymentOrderDetails.address}
            accountCreated={paymentOrderDetails.accountCreated}
            defaultPassword={paymentOrderDetails.defaultPassword}
          />
        )}

        <SubscriptionDrawer isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} />

        <LoginDialog
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={() => {
            window.location.reload();
          }}
        />

        {/* Location Permission Modal - Zomato Style */}
        <LocationPermissionModal
          isOpen={isLocationModalOpen}
          onLocationGranted={handleLocationGranted}
          onClose={() => setIsLocationModalOpen(false)}
        />

        {/* ZOMATO-STYLE ADDRESS ENTRY MODAL */}
        <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[400px] max-h-[80vh] flex flex-col overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background z-10">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Delivery Address
              </DialogTitle>
              <DialogDescription>
                Enter your delivery address to check if we deliver to your area
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 px-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Address</label>
                <Input
                  placeholder="e.g., 18/20, M.I.G, Kurla West, Mumbai, 400070"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="mt-1 h-10 text-sm"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 Tip: Click "Detect Location" to use your GPS, or enter your address manually above.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddressModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={async () => {
                    if (!manualAddress.trim()) {
                      toast({
                        title: "Address Required",
                        description: "Please enter your delivery address",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      // Geocode the entered address
                      const response = await fetch("/api/geocode", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address: manualAddress }),
                      });

                      if (!response.ok) {
                        throw new Error("Could not find location");
                      }

                      const { latitude, longitude } = await response.json();
                      
                      // Check if in delivery zone
                      const CHEF_LAT = 19.068604;
                      const CHEF_LNG = 72.87658;
                      const MAX_DELIVERY_DISTANCE = 2.5;
                      
                      const distance = calculateDistance(latitude, longitude, CHEF_LAT, CHEF_LNG);
                      console.log("[ADDRESS-CHECK] Distance:", distance, "km");

                      if (distance <= MAX_DELIVERY_DISTANCE) {
                        // Address is in delivery zone!
                        setUserLocation(latitude, longitude);
                        setUserInDeliveryZone(true);
                        setDetectedAddress(manualAddress);
                        setManualAddress("");
                        setShowAddressModal(false);
                        
                        toast({
                          title: "✅ Great!",
                          description: "We deliver to your area. Browse and order now!",
                        });
                      } else {
                        // Outside delivery zone
                        toast({
                          title: "❌ Out of Zone",
                          description: `Sorry, your area is ${distance.toFixed(1)} km away. We currently deliver only within 2.5 km of Kurla West.`,
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("[ADDRESS-CHECK] Error:", error);
                      toast({
                        title: "Error",
                        description: "Could not find your address. Please try again or enter a different address.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Check Delivery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }