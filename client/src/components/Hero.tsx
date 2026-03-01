import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Loader2, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";
import { useCart } from "@/hooks/use-cart";
import heroImage from '@assets/generated_images/Indian_food_spread_hero_01f8cdab.png';

export default function Hero() {
  // PINCODE-ONLY interface
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [pincodeValidated, setPincodeValidated] = useState(false);
  const [pincodeArea, setPincodeArea] = useState("");

  const { toast } = useToast();
  const { setDeliveryLocation } = useDeliveryLocation();
  const { setUserLocation } = useCart();

  // On mount: restore saved pincode from localStorage
  useEffect(() => {
    const savedPincode = localStorage.getItem('userPincode');
    if (savedPincode) {
      setPincode(savedPincode);
      const savedArea = localStorage.getItem('pincodeArea');
      const savedLat = localStorage.getItem('userLatitude');
      const savedLng = localStorage.getItem('userLongitude');

      if (savedArea && savedLat && savedLng) {
        setPincodeArea(savedArea);
        setPincodeValidated(true);

        const lat = parseFloat(savedLat);
        const lng = parseFloat(savedLng);

        // CRITICAL: Update cart store to trigger chef loading
        setUserLocation(lat, lng);

        // CRITICAL: Update delivery context so Home.tsx detects pincode and loads chefs
        setDeliveryLocation({
          pincode: savedPincode,
          latitude: lat,
          longitude: lng,
          address: savedArea,
          source: "pincode"
        });

        console.log("[HERO] Loaded saved pincode and triggered chef loading:", savedPincode);
      }
    }
  }, [setUserLocation, setDeliveryLocation]);

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
      setIsValidatingPincode(false);

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
    setIsValidatingPincode(false);
    localStorage.removeItem('userPincode');
    localStorage.removeItem('pincodeArea');
  };

  const scrollToProducts = () => {
    setTimeout(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  return (
    <section className="relative h-[38vh] sm:h-[50vh] min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] max-h-none overflow-hidden">
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
          {/* Show PINCODE CONFIRMED (if pincode was validated) */}
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
          ) : (
            /* Show PINCODE INPUT FORM */
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}