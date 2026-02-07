import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance } from "@/lib/locationUtils";
import api from "@/lib/apiClient";

interface AddressVerificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chefId?: string;
  chefName?: string;
  chefLatitude?: number;
  chefLongitude?: number;
  maxDeliveryDistance?: number;
  initialAddress?: {
    pincode: string;
    area: string;
    building: string;
    street: string;
  };
  isEditMode?: boolean;
  onAddressVerified: (data: {
    pincode: string;
    area: string;
    latitude: number;
    longitude: number;
    distance: number;
  }) => void;
}

export function AddressVerificationDrawer({
  isOpen,
  onClose,
  chefId,
  chefName,
  chefLatitude = 19.068604,
  chefLongitude = 72.87658,
  maxDeliveryDistance = 2.5,
  initialAddress,
  isEditMode = false,
  onAddressVerified,
}: AddressVerificationDrawerProps) {
  const [pincode, setPincode] = useState(initialAddress?.pincode || "");
  const [area, setArea] = useState(initialAddress?.area || "");
  const [building, setBuilding] = useState(initialAddress?.building || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const { toast } = useToast();

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setPincode("");
      setArea("");
      setBuilding("");
      setStreet("");
      setError("");
      setIsVerified(false);
      setVerifiedData(null);
    }
  }, [isOpen]);

  const handleVerifyAddress = async () => {
    setError("");

    // Validate required fields
    if (!pincode || !/^\d{5,6}$/.test(pincode)) {
      setError("Please enter a valid 5-6 digit pincode");
      return;
    }

    if (!area.trim()) {
      setError("Please enter an area name");
      return;
    }

    if (!building.trim()) {
      setError("Please enter a building/house number");
      return;
    }

    setIsValidating(true);
    console.log("[ADDRESS-VERIFY] Starting address verification:", {
      pincode,
      area,
      building,
      street,
      chefId,
    });

    try {
      // STEP 1: Validate pincode exists in delivery areas
      console.log("[ADDRESS-VERIFY] Step 1: Validating pincode...");
      const pincodeResponse = await api.post(
        "/api/validate-pincode",
        { pincode: pincode.trim() },
        { timeout: 8000 }
      );

      if (!pincodeResponse.data.success) {
        setError(pincodeResponse.data.message || "Pincode not in delivery areas");
        setIsValidating(false);
        return;
      }

      const pincodeData = pincodeResponse.data;
      console.log("[ADDRESS-VERIFY] ✅ Pincode validated:", pincodeData);

      // STEP 2: If chef ID provided, verify chef serves this pincode
      if (chefId) {
        console.log("[ADDRESS-VERIFY] Step 2: Checking if chef serves this pincode...");
        try {
          const chefResponse = await api.get(`/api/chefs/${chefId}`, {
            timeout: 5000,
          });
          const chefData = chefResponse.data;

          if (
            chefData.servicePincodes &&
            Array.isArray(chefData.servicePincodes) &&
            chefData.servicePincodes.length > 0
          ) {
            if (!chefData.servicePincodes.includes(pincode)) {
              setError(
                `${chefData.name} does not deliver to pincode ${pincode}`
              );
              setIsValidating(false);
              return;
            }
            console.log("[ADDRESS-VERIFY] ✅ Chef serves this pincode");
          }
        } catch (chefError) {
          console.warn("[ADDRESS-VERIFY] Could not verify chef:", chefError);
          // Continue with address validation
        }
      }

      // STEP 3: Calculate distance from chef location
      console.log("[ADDRESS-VERIFY] Step 3: Calculating distance...");
      const distance = calculateDistance(
        chefLatitude,
        chefLongitude,
        pincodeData.latitude,
        pincodeData.longitude
      );

      console.log("[ADDRESS-VERIFY] Distance calculated:", {
        distance: distance.toFixed(2),
        maxDistance: maxDeliveryDistance,
      });

      if (distance > maxDeliveryDistance) {
        setError(
          `Address is ${distance.toFixed(1)}km away. ${chefName || "This restaurant"} delivers within ${maxDeliveryDistance}km.`
        );
        setIsValidating(false);
        return;
      }

      // STEP 4: Address verified successfully
      console.log("[ADDRESS-VERIFY] ✅ Address verified successfully");
      setIsVerified(true);
      setVerifiedData({
        pincode: pincodeData.pincode,
        area: pincodeData.area,
        latitude: pincodeData.latitude,
        longitude: pincodeData.longitude,
        distance,
      });

      toast({
        title: "Address Verified",
        description: `${pincodeData.area} verified successfully. Ready for checkout!`,
      });
    } catch (err) {
      console.error("[ADDRESS-VERIFY] Error:", err);
      setError("Failed to verify address. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (verifiedData) {
      console.log("[ADDRESS-VERIFY] Proceeding to checkout with verified address");
      onAddressVerified(verifiedData);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            {isEditMode ? "Change Delivery Address" : "Verify Your Delivery Address"}
          </DrawerTitle>
          <DrawerDescription>
            {isEditMode
              ? "Update your address to recalculate delivery fees"
              : "We need to verify your address before checkout"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!isVerified ? (
            <div className="space-y-4">
              {/* Pincode Field */}
              <div className="space-y-2">
                <Label htmlFor="pincode" className="font-semibold">
                  Pincode *
                </Label>
                <Input
                  id="pincode"
                  type="text"
                  placeholder="Enter 5-6 digit pincode"
                  value={pincode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits.length <= 6) {
                      setPincode(digits);
                    }
                  }}
                  disabled={isValidating}
                  maxLength={6}
                  className="text-lg font-semibold tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  {pincode.length}/6 digits
                </p>
              </div>

              {/* Area Field */}
              <div className="space-y-2">
                <Label htmlFor="area" className="font-semibold">
                  Area Name *
                </Label>
                <Input
                  id="area"
                  type="text"
                  placeholder="e.g., Kurla West"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={isValidating}
                />
              </div>

              {/* Building/House Number */}
              <div className="space-y-2">
                <Label htmlFor="building" className="font-semibold">
                  Building/House Number *
                </Label>
                <Input
                  id="building"
                  type="text"
                  placeholder="e.g., 18/20 M.I.G"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  disabled={isValidating}
                />
              </div>

              {/* Street Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="street" className="font-semibold">
                  Street/Road (Optional)
                </Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="e.g., Station Road"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isValidating}
                />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 We use your address to verify delivery availability and
                  calculate accurate delivery fees.
                </p>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyAddress}
                disabled={isValidating || !pincode || !area || !building}
                className="w-full bg-orange-500 hover:bg-orange-600 h-11"
                size="lg"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying Address...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Verify Address
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Verified State
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Address Verified
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                      {building}, {street && street + ", "}
                      {area}
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      Pincode: {pincode}
                    </p>
                    {verifiedData?.distance && (
                      <p className="text-xs text-green-700 mt-1">
                        Distance: {verifiedData.distance.toFixed(1)} km
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  ✅ Your address is verified and ready for checkout. Delivery
                  charges will be calculated based on this location.
                </p>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-green-600 hover:bg-green-700 h-11"
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <Button
                onClick={() => {
                  setIsVerified(false);
                  setVerifiedData(null);
                  setError("");
                }}
                variant="outline"
                className="w-full"
              >
                Change Address
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
