import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2, Navigation, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getDeliveryMessage } from "@/lib/locationUtils";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { useCart } from "@/hooks/use-cart";
import heroImage from '@assets/generated_images/Indian_food_spread_hero_01f8cdab.png';

export default function Hero() {
  // PINCODE-FIRST interface
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [pincodeValidated, setPincodeValidated] = useState(false);
  const [pincodeArea, setPincodeArea] = useState("");

  // FALLBACK: Address interface
  const [location, setLocation] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const { toast } = useToast();
  const { setDeliveryLocation } = useDeliveryLocation();
  const { setUserLocation } = useCart();

  useEffect(() => {
    const checkLocationOnLoad = () => {
      // STEP 1: Check if pincode was already validated
      const savedPincode = localStorage.getItem('userPincode');
      if (savedPincode) {
        setPincode(savedPincode);
        const savedArea = localStorage.getItem('pincodeArea');
        const savedLat = localStorage.getItem('userLatitude');
        const savedLng = localStorage.getItem('userLongitude');

        if (savedArea && savedLat && savedLng) {
          setPincodeArea(savedArea);
          setPincodeValidated(true);

          // CRITICAL: Update cart store to trigger chef loading
          const lat = parseFloat(savedLat);
          const lng = parseFloat(savedLng);
          setUserLocation(lat, lng);

          console.log("[HERO] Loaded saved pincode and triggered chef loading:", savedPincode);
          return; // Use pincode if available
        }
      }

      // STEP 2: Check if GPS was already detected
      const savedLat = localStorage.getItem('userLatitude');
      const savedLng = localStorage.getItem('userLongitude');

      if (savedLat && savedLng) {
        const lat = parseFloat(savedLat);
        const lng = parseFloat(savedLng);
        const deliveryCheck = getDeliveryMessage(lat, lng);
        setDeliveryAvailable(deliveryCheck.available);
        setHasLocation(true);
        console.log("[HERO] Loaded saved GPS location:", lat, lng);

        if (deliveryCheck.available) {
          setLocation(`Kurla West, Mumbai`);
        } else {
          setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        return;
      }

      // STEP 3: No saved location, require manual pincode input
      console.log("[HERO] No saved location, skipping auto-GPS to require Pincode...");
      setIsGettingLocation(false);
      setHasLocation(false);
    };

    checkLocationOnLoad();
  }, [toast, setUserLocation]);

  // AUTO-DETECT GPS on first load
  const attemptAutoGPS = () => {
    if (!navigator.geolocation) {
      console.log("[HERO] Geolocation not supported, will show pincode input");
      return; // Show pincode input if GPS not available
    }

    setIsGettingLocation(true);
    console.log("[HERO] Requesting GPS permission on page load...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('userLatitude', latitude.toString());
        localStorage.setItem('userLongitude', longitude.toString());

        const deliveryCheck = getDeliveryMessage(latitude, longitude);
        setDeliveryAvailable(deliveryCheck.available);
        setHasLocation(true);
        setIsGettingLocation(false);

        console.log("[HERO] ✅ Auto-GPS detected on load:", latitude, longitude);

        if (deliveryCheck.available) {
          setLocation(`Kurla West, Mumbai`);
          toast({
            title: "Location Detected",
            description: deliveryCheck.message,
          });
        } else {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast({
            title: "Coming Soon to Your Area",
            description: deliveryCheck.message,
          });
        }
      },
      (error) => {
        console.log("[HERO] GPS auto-detect failed on load:", error.message);
        setIsGettingLocation(false);
        // GPS failed - show pincode input (NOT address fallback)
        console.log("[HERO] User will see pincode input instead");
      }
    );
  };

  const handleValidatePincode = async () => {
    setPincodeError("");

    // Validate format
    if (!pincode || !/^\d{5,6}$/.test(pincode.trim())) {
      setPincodeError("Please enter a valid 5-6 digit pincode");
      return;
    }

    setIsValidatingPincode(true);
    console.log("[HERO] Validating pincode:", pincode);

    try {
      const response = await fetch("/api/validate-pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pincode.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsValidatingPincode(false);
        setPincodeError(data.message || "Pincode validation failed. Please try again.");
        console.warn("[HERO] Validation failed:", data.message);
        return;
      }

      // Validation successful!
      console.log("[HERO] ✅ Pincode validated successfully:", {
        pincode: data.pincode,
        area: data.area,
        lat: data.latitude,
        lon: data.longitude,
      });

      // Save to localStorage
      localStorage.setItem('userPincode', data.pincode);
      localStorage.setItem('pincodeArea', data.area);
      localStorage.setItem('userLatitude', data.latitude.toString());
      localStorage.setItem('userLongitude', data.longitude.toString());

      // CRITICAL: Update cart store coordinates FIRST (triggers chef query in Home.tsx)
      setUserLocation(data.latitude, data.longitude);

      // CRITICAL: Update global delivery context to trigger chef loading
      setDeliveryLocation({
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.area,
        source: "pincode"
      });

      setPincodeArea(data.area);
      setPincodeValidated(true);

      toast({
        title: "Location Confirmed",
        description: `Delivering to ${data.area}. Let's find your rotis!`,
      });

      // Auto-scroll to products
      setTimeout(() => {
        scrollToProducts();
      }, 500);
    } catch (error) {
      setIsValidatingPincode(false);
      setPincodeError("Could not validate pincode. Please check your internet connection.");
      console.error("[HERO] Error:", error);
    }
  };

  const handleChangePincode = () => {
    setPincode("");
    setPincodeError("");
    setPincodeValidated(false);
    setPincodeArea("");
    localStorage.removeItem('userPincode');
    localStorage.removeItem('pincodeArea');
  };

  const getUserLocation = () => {
    setIsGettingLocation(true);
    console.log("[HERO] User clicked 'Detect My Location' button");

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your delivery pincode instead",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('userLatitude', latitude.toString());
        localStorage.setItem('userLongitude', longitude.toString());

        const deliveryCheck = getDeliveryMessage(latitude, longitude);
        setDeliveryAvailable(deliveryCheck.available);
        setHasLocation(true);
        setIsGettingLocation(false);

        console.log("[HERO] ✅ GPS detected from button click:", latitude, longitude);

        if (deliveryCheck.available) {
          setLocation(`Kurla West, Mumbai`);
          toast({
            title: "Location Detected",
            description: deliveryCheck.message,
          });
        } else {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast({
            title: "Coming Soon to Your Area",
            description: deliveryCheck.message,
          });
        }

        setShowManualInput(false);
      },
      (error) => {
        console.log("[HERO] GPS detection failed:", error.message);
        setIsGettingLocation(false);
        // GPS failed - don't show address, user should use pincode
        toast({
          title: "Location error",
          description: "Please enter your delivery pincode instead",
          variant: "destructive",
        });
        // Return to pincode input
        setHasLocation(false);
        setShowManualInput(false);
      }
    );
  };

  const scrollToProducts = () => {
    setTimeout(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  const handleChangeLocation = () => {
    setLocation("");
    localStorage.removeItem('userLatitude');
    localStorage.removeItem('userLongitude');
    localStorage.removeItem('userAddress');
    setDeliveryAvailable(null);
    setShowManualInput(false);
    setHasLocation(false);
  };

  return (
    <section className="relative h-[50vh] sm:h-[60vh] min-h-[480px] sm:min-h-[500px] lg:min-h-[600px] max-h-none overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative h-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 flex flex-col items-center justify-center text-center py-6 sm:py-8">
        <h2
          className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg"
          data-testid="text-hero-title"
        >
          Fresh Rotis Delivered
          <br />
          <span className="text-primary-foreground/90">Ghar Ka Khana, Apno Ka Swaad</span>
        </h2>
        <p className="text-xs sm:text-base lg:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl px-2 drop-shadow" data-testid="text-hero-subtitle">
          Fresh rotis, homestyle meals, and restaurant specials in 30 minutes
        </p>

        <div className="w-full max-w-xl px-2 sm:px-3">
          {/* PRIORITY 1: Show PINCODE CONFIRMED (if pincode was validated) */}
          {pincodeValidated && pincodeArea ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Pincode {pincode}</p>
                    <p className="text-xs text-muted-foreground">{pincodeArea}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleChangePincode}
                    data-testid="button-change-pincode"
                  >
                    Change
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="border-t px-3 sm:px-4 py-2 sm:py-3 bg-green-50">
                <Button
                  className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10"
                  onClick={scrollToProducts}
                  data-testid="button-browse-menu"
                >
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  Browse Menu
                </Button>
              </div>
            </div>
          ) : isGettingLocation ? (
            // PRIORITY 2: Show LOADING STATE during auto-GPS detection
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm sm:text-base font-semibold text-foreground">Detecting Your Location</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Please allow GPS access when prompted by your browser
                  </p>
                </div>
              </div>
            </div>
          ) : (location && hasLocation && !showManualInput) ? (
            // PRIORITY 3: Show GPS LOCATION CONFIRMED
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{location}</p>
                    <p className="text-xs text-muted-foreground">
                      {deliveryAvailable ? "Delivery available" : "Coming soon to your area"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleChangeLocation}
                    data-testid="button-change-location"
                  >
                    Change
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
              {deliveryAvailable && (
                <div className="border-t px-3 sm:px-4 py-2 sm:py-3 bg-primary/5">
                  <Button
                    className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10"
                    onClick={scrollToProducts}
                    data-testid="button-browse-menu"
                  >
                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    Browse Menu
                  </Button>
                </div>
              )}
            </div>
          ) : !pincodeValidated ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="text-center pb-1 sm:pb-2">
                    <MapPin className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-primary" />
                    <p className="text-sm sm:text-base font-bold text-foreground">
                      Enter Your Delivery Pincode
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Quick way to check if we deliver to your area
                    </p>
                  </div>

                  {/* Pincode Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter 5-6 digit pincode"
                        value={pincode}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          if (digits.length <= 6) {
                            setPincode(digits);
                            setPincodeError("");
                          }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidatePincode()}
                        disabled={isValidatingPincode}
                        maxLength={6}
                        className="text-lg font-semibold tracking-widest h-10 sm:h-11 text-center"
                        data-testid="input-pincode"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        {pincode.length}/6 digits
                      </p>
                    </div>

                    {/* Error Alert */}
                    {pincodeError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-red-700">{pincodeError}</p>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs sm:text-sm text-blue-800">
                        💡 Enter your delivery pincode to see available restaurants and delivery charges.
                      </p>
                    </div>
                  </div>

                  {/* Check Delivery Button */}
                  <Button
                    size="lg"
                    variant="default"
                    onClick={handleValidatePincode}
                    disabled={isValidatingPincode || pincode.length === 0}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    data-testid="button-check-delivery"
                  >
                    {isValidatingPincode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Checking Delivery...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Check Delivery
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Optional: GPS Fallback Button */}
              {!isGettingLocation && (
                <div className="border-t">
                  <div className="relative py-2 sm:py-3">
                    <div className="absolute inset-0 flex items-center px-3 sm:px-4">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 sm:px-3 text-muted-foreground font-medium">Or use GPS</span>
                    </div>
                  </div>
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getUserLocation}
                      className="w-full text-xs sm:text-sm h-9 sm:h-10"
                      data-testid="button-detect-location"
                    >
                      <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Detect My Location
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : pincodeValidated && pincodeArea ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Pincode {pincode}</p>
                    <p className="text-xs text-muted-foreground">{pincodeArea}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleChangePincode}
                    data-testid="button-change-pincode"
                  >
                    Change
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
              <div className="border-t px-3 sm:px-4 py-2 sm:py-3 bg-green-50">
                <Button
                  className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10"
                  onClick={scrollToProducts}
                  data-testid="button-browse-menu"
                >
                  <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                  Browse Menu
                </Button>
              </div>
            </div>
          ) : (location && hasLocation && !showManualInput) ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{location}</p>
                    <p className="text-xs text-muted-foreground">
                      {deliveryAvailable ? "Delivery available" : "Coming soon to your area"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleChangeLocation}
                    data-testid="button-change-location"
                  >
                    Change
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
              {deliveryAvailable && (
                <div className="border-t px-3 sm:px-4 py-2 sm:py-3 bg-primary/5">
                  <Button
                    className="w-full gap-2 text-sm sm:text-base h-9 sm:h-10"
                    onClick={scrollToProducts}
                    data-testid="button-browse-menu"
                  >
                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    Browse Menu
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {deliveryAvailable === false && (
          <div className="mt-3 sm:mt-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 sm:px-4 py-2 max-w-md">
            <p className="text-xs sm:text-sm text-white font-medium">
              Coming soon to your area! Currently serving Kurla West, Mumbai.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}