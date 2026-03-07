/**
 * SubscriptionAddressInput Component
 * ===============================
 * Provides structured address input with service area validation for subscriptions.
 * Matches the UI and validation logic from CheckoutDialog, but WITHOUT delivery fee calculation.
 * 
 * Features:
 * - Structured fields: building, street, area, city, pincode
 * - Pincode validation against admin-configured delivery areas
 * - Geocoding to get coordinates for service area verification
 * - Area suggestions dropdown
 * - NO delivery fee calculation (unlike checkout)
 * - Stores: address, pincode, latitude, longitude
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/apiClient";
import { getAreaSuggestions } from "@/lib/deliveryAreas";

export interface SubscriptionAddress {
  building: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

interface SubscriptionAddressInputProps {
  initialAddress?: SubscriptionAddress;
  onAddressValidated: (address: SubscriptionAddress) => void;
  isEditing?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
}

export function SubscriptionAddressInput({
  initialAddress,
  onAddressValidated,
  isEditing: initialIsEditing = true,
  onEditModeChange,
}: SubscriptionAddressInputProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [building, setBuilding] = useState(initialAddress?.building || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [area, setArea] = useState(initialAddress?.area || "");
  const [city, setCity] = useState(initialAddress?.city || "Mumbai");
  const [pincode, setPincode] = useState(initialAddress?.pincode || "");

  const [isValidating, setIsValidating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [isInServiceArea, setIsInServiceArea] = useState(true);

  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: initialAddress?.latitude || null,
    longitude: initialAddress?.longitude || null,
  });

  const autoGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format full address for display
  const fullAddress = [building, street, area, city, pincode]
    .filter(Boolean)
    .join(", ");

  // Handle address field changes
  const handleAddressChange = (field: string, value: string) => {
    switch (field) {
      case "building":
        setBuilding(value);
        break;
      case "street":
        setStreet(value);
        break;
      case "area":
        setArea(value);
        if (value.trim().length > 0) {
          const suggestions = getAreaSuggestions(value);
          setAreaSuggestions(suggestions);
          setShowAreaSuggestions(suggestions.length > 0);
        } else {
          setShowAreaSuggestions(false);
          setAreaSuggestions([]);
        }
        break;
      case "city":
        setCity(value);
        break;
      case "pincode":
        setPincode(value);
        break;
    }

    // Any edit means validation is invalid
    setIsValidated(false);
    setIsEditing(true);
    setLocationError("");
    onEditModeChange?.(true);
  };

  // Validate pincode against delivery areas
  const handleValidatePincode = async () => {
    if (!pincode.trim()) {
      setLocationError("Pincode is required");
      return;
    }

    if (!/^\d{5,6}$/.test(pincode)) {
      setLocationError("Pincode must be 5-6 digits");
      return;
    }

    if (!area.trim()) {
      setLocationError("Area is required");
      return;
    }

    setIsValidating(true);
    setLocationError("");

    try {
      // Validate pincode against delivery areas
      const response = await api.post("/api/validate-pincode", {
        pincode: pincode.trim(),
        area: area.trim(),
      });

      if (response.data?.valid) {
        console.log("[SUBSCRIPTION-ADDR] Pincode validated successfully");
        setIsInServiceArea(true);
        setLocationError("");
        
        // Geocode the address to get coordinates
        await geocodeAddress();
      } else {
        console.warn("[SUBSCRIPTION-ADDR] Pincode validation failed");
        setLocationError(response.data?.message || "Pincode not available in our delivery areas");
        setIsInServiceArea(false);
        setIsValidated(false);
      }
    } catch (error: any) {
      console.error("[SUBSCRIPTION-ADDR] Pincode validation error:", error);
      setLocationError(
        error?.response?.data?.message || "Failed to validate pincode. Please try again."
      );
      setIsInServiceArea(false);
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Geocode address to get coordinates
  const geocodeAddress = async () => {
    const addressToGeocode = [building, street, area, city, pincode]
      .filter(Boolean)
      .join(", ");

    try {
      console.log("[SUBSCRIPTION-ADDR] Geocoding address:", addressToGeocode);
      
      const response = await api.post("/api/geocode-full-address", {
        address: addressToGeocode,
        pincode: pincode.trim(),
        area: area.trim(),
      });

      if (response.data?.latitude && response.data?.longitude) {
        const lat = response.data.latitude;
        const lon = response.data.longitude;
        
        console.log("[SUBSCRIPTION-ADDR] Geocoding successful:", { lat, lon });
        
        setCoordinates({ latitude: lat, longitude: lon });
        setIsValidated(true);
        setIsEditing(false);
        setLocationError("");
        onEditModeChange?.(false);

        // Call callback with validated address
        onAddressValidated({
          building,
          street,
          area,
          city,
          pincode,
          latitude: lat,
          longitude: lon,
        });

        toast({
          title: "Address Validated",
          description: "Your delivery address is within our service area",
        });
      }
    } catch (error: any) {
      console.error("[SUBSCRIPTION-ADDR] Geocoding error:", error);
      setLocationError(
        error?.response?.data?.message || "Could not verify address. Please check and try again."
      );
      setIsValidated(false);
    }
  };

  // Display validated address
  if (isValidated && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Address Verified
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {building}, {street}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {area}, {city} - {pincode}
              </p>
              <p className="text-xs text-green-700 mt-1">✓ Within service area</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setIsValidated(false);
                onEditModeChange?.(true);
              }}
            >
              Edit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode - structured address fields
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
        {/* Building/House Number */}
        <div className="space-y-2">
          <Label htmlFor="sub-building" className="font-semibold">
            Building/House Number *
          </Label>
          <Input
            id="sub-building"
            type="text"
            placeholder="e.g., 18/20 M.I.G"
            value={building}
            onChange={(e) => handleAddressChange("building", e.target.value)}
            disabled={isValidating}
          />
        </div>

        {/* Street */}
        <div className="space-y-2">
          <Label htmlFor="sub-street" className="font-semibold">
            Street/Road (Optional)
          </Label>
          <Input
            id="sub-street"
            type="text"
            placeholder="e.g., Station Road"
            value={street}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            disabled={isValidating}
          />
        </div>

        {/* Area with suggestions */}
        <div className="space-y-2 relative">
          <Label htmlFor="sub-area" className="font-semibold">
            Area/Locality *
          </Label>
          <Input
            id="sub-area"
            type="text"
            placeholder="e.g., Kurla West"
            value={area}
            onChange={(e) => handleAddressChange("area", e.target.value)}
            disabled={isValidating}
            autoComplete="off"
          />
          
          {/* Area Suggestions Dropdown */}
          {showAreaSuggestions && areaSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
              {areaSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setArea(suggestion);
                    setShowAreaSuggestions(false);
                    setAreaSuggestions([]);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="sub-city" className="font-semibold">
            City *
          </Label>
          <Input
            id="sub-city"
            type="text"
            placeholder="e.g., Mumbai"
            value={city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            disabled={isValidating}
          />
        </div>

        {/* Pincode */}
        <div className="space-y-2">
          <Label htmlFor="sub-pincode" className="font-semibold">
            Pincode *
          </Label>
          <Input
            id="sub-pincode"
            type="text"
            placeholder="e.g., 400070"
            value={pincode}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
              handleAddressChange("pincode", cleaned);
            }}
            disabled={isValidating}
          />
          {pincode && !/^\d{5,6}$/.test(pincode) && (
            <p className="text-xs text-red-500 mt-1">Pincode must be 5-6 digits</p>
          )}
        </div>

        {/* Full Address Display */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
          <p className="font-semibold">Preview:</p>
          <p>{fullAddress || "(Enter details above)"}</p>
        </div>

        {/* Error message */}
        {locationError && (
          <div className="flex gap-2 items-start p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{locationError}</p>
          </div>
        )}

        {/* Validation button */}
        <Button
          type="button"
          onClick={handleValidatePincode}
          disabled={isValidating || !pincode || !area || !building}
          className="w-full"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Validate Service Area
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
        Enter your delivery address and validate against our service area
      </p>
    </div>
  );
}
