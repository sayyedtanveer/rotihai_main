import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/apiClient";
import { calculateDistance } from "@/lib/locationUtils";
import { useDeliveryLocation } from "@/contexts/DeliveryLocationContext";

interface UseCheckoutAddressProps {
  cart: any;
  isOpen: boolean;
}

export function useCheckoutAddress({ cart, isOpen }: UseCheckoutAddressProps) {
  // ===============================
  // ADDRESS FIELDS
  // ===============================
  const [addressBuilding, setAddressBuilding] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressArea, setAddressArea] = useState("");
  const [addressCity, setAddressCity] = useState("Mumbai");
  const [addressPincode, setAddressPincode] = useState("");

  const address = useMemo(
    () =>
      [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
        .filter(Boolean)
        .join(", "),
    [addressBuilding, addressStreet, addressArea, addressCity, addressPincode]
  );

  // ===============================
  // LOCATION & VALIDATION
  // ===============================
  const [customerLatitude, setCustomerLatitude] = useState<number | null>(null);
  const [customerLongitude, setCustomerLongitude] = useState<number | null>(null);

  const [addressZoneValidated, setAddressZoneValidated] = useState(false);
  const [addressInDeliveryZone, setAddressInDeliveryZone] = useState(false);
  const [addressZoneDistance, setAddressZoneDistance] = useState(0);

  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [isReValidatingPincode, setIsReValidatingPincode] = useState(false);
  const [locationError, setLocationError] = useState("");

  const autoGeocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { setDeliveryLocation } = useDeliveryLocation();

  // ===============================
  // RESET WHEN CHEF CHANGES
  // ===============================
  useEffect(() => {
    if (!cart?.chefId) return;

    setAddressZoneValidated(false);
    setAddressInDeliveryZone(false);
    setAddressConfirmed(false);
    setLocationError("");
  }, [cart?.chefId]);

  // ===============================
  // DELIVERY FEE CALCULATION
  // ===============================
  const calculateDynamicDeliveryFee = (
    customerLat: number,
    customerLon: number,
    chefLat: number,
    chefLon: number,
    chefData?: {
      defaultDeliveryFee?: number;
      deliveryFeePerKm?: number;
      freeDeliveryThreshold?: number;
    }
  ) => {
    const distance = calculateDistance(chefLat, chefLon, customerLat, customerLon);

    const baseFee = chefData?.defaultDeliveryFee ?? 20;
    const perKm = chefData?.deliveryFeePerKm ?? 5;
    const freeThreshold = chefData?.freeDeliveryThreshold ?? 200;

    const additionalFee = Math.max(0, distance - 0.5) * perKm;
    const calculatedFee = Math.round(baseFee + additionalFee);

    return calculatedFee;
  };

  // ===============================
  // ADDRESS CHANGE HANDLER
  // ===============================
  const handleAddressChange = (field: string, value: string) => {
    if (autoGeocodeTimeoutRef.current) {
      clearTimeout(autoGeocodeTimeoutRef.current);
    }

    switch (field) {
      case "building":
        setAddressBuilding(value);
        break;
      case "street":
        setAddressStreet(value);
        break;
      case "area":
        setAddressArea(value);
        break;
      case "city":
        setAddressCity(value);
        break;
      case "pincode":
        setAddressPincode(value);
        handlePincodeChange(value);
        break;
    }

    setAddressZoneValidated(false);
    setAddressConfirmed(false);
    setLocationError("");
  };

  // ===============================
  // PINCODE CHANGE HANDLER
  // ===============================
  const handlePincodeChange = async (newPincode: string) => {
    if (!newPincode || !/^\d{5,6}$/.test(newPincode)) {
      setAddressZoneValidated(false);
      setLocationError("Pincode must be 5-6 digits");
      return;
    }

    if (!cart?.chefId) return;

    setIsReValidatingPincode(true);
    setLocationError("");

    try {
      const pincodeRes = await api.post("/api/validate-pincode", {
        pincode: newPincode,
      });

      if (!pincodeRes.data.success) {
        setLocationError(pincodeRes.data.message || "Invalid pincode");
        setAddressZoneValidated(false);
        return;
      }

      const { latitude, longitude, area } = pincodeRes.data;

      const chefRes = await api.get(`/api/chefs/${cart.chefId}`);
      const chef = chefRes.data;

      const distance = calculateDistance(
        chef.latitude,
        chef.longitude,
        latitude,
        longitude
      );

      const inZone = distance <= chef.maxDeliveryDistanceKm;

      setCustomerLatitude(latitude);
      setCustomerLongitude(longitude);
      setAddressZoneDistance(distance);
      setAddressZoneValidated(true);
      setAddressInDeliveryZone(inZone);

      if (!inZone) {
        setLocationError(
          `Pincode ${newPincode} is ${distance.toFixed(
            1
          )}km away. Delivery radius is ${chef.maxDeliveryDistanceKm}km`
        );
        return;
      }

      const fee = calculateDynamicDeliveryFee(
        latitude,
        longitude,
        chef.latitude,
        chef.longitude,
        chef
      );

      setDeliveryFee(fee);
      setDeliveryDistance(distance);

      setDeliveryLocation({
        isInZone: true,
        address: `${area}, ${newPincode}`,
        latitude,
        longitude,
        distance,
        pincode: newPincode,
        areaName: area,
        validatedAt: new Date().toISOString(),
        source: "pincode",
      });
    } catch (err: any) {
      setLocationError(
        err?.response?.data?.message ||
          "Could not validate pincode. Please try again."
      );
      setAddressZoneValidated(false);
    } finally {
      setIsReValidatingPincode(false);
    }
  };

  // ===============================
  // MANUAL ADDRESS VALIDATION
  // ===============================
  const handleValidateAddressClick = async () => {
    if (!addressArea || !addressPincode) {
      setLocationError("Area and pincode are required");
      return;
    }

    await autoGeocodeAddress(address);
  };

  // ===============================
  // GEOCODING
  // ===============================
  const autoGeocodeAddress = async (addressToGeocode: string) => {
    if (!cart?.chefId) return;

    setIsGeocodingAddress(true);
    setLocationError("");

    try {
      const geoRes = await api.post("/api/geocode", {
        address: addressToGeocode,
        pincode: addressPincode,
      });

      if (!geoRes.data.success) {
        setLocationError(geoRes.data.message || "Address not found");
        setAddressZoneValidated(false);
        return;
      }

      const { latitude, longitude } = geoRes.data;

      const chefRes = await api.get(`/api/chefs/${cart.chefId}`);
      const chef = chefRes.data;

      const distance = calculateDistance(
        chef.latitude,
        chef.longitude,
        latitude,
        longitude
      );

      const inZone = distance <= chef.maxDeliveryDistanceKm;

      setCustomerLatitude(latitude);
      setCustomerLongitude(longitude);
      setAddressZoneDistance(distance);
      setAddressZoneValidated(true);
      setAddressInDeliveryZone(inZone);

      if (!inZone) {
        setLocationError(
          `Address is ${distance.toFixed(
            1
          )}km away. Delivery radius is ${chef.maxDeliveryDistanceKm}km`
        );
        return;
      }

      const fee = calculateDynamicDeliveryFee(
        latitude,
        longitude,
        chef.latitude,
        chef.longitude,
        chef
      );

      setDeliveryFee(fee);
      setDeliveryDistance(distance);

      setDeliveryLocation({
        isInZone: true,
        address: addressToGeocode,
        latitude,
        longitude,
        distance,
        validatedAt: new Date().toISOString(),
        source: "manual",
      });
    } catch (err: any) {
      setLocationError("Could not validate address. Please try again.");
      setAddressZoneValidated(false);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // ===============================
  // PUBLIC API
  // ===============================
  return {
    // Address fields
    addressBuilding,
    addressStreet,
    addressArea,
    addressCity,
    addressPincode,
    address,

    // Setters
    setAddressBuilding,
    setAddressStreet,
    setAddressArea,
    setAddressCity,
    setAddressPincode,

    // Validation state
    addressZoneValidated,
    addressInDeliveryZone,
    addressZoneDistance,
    addressConfirmed,
    setAddressConfirmed,

    // Location
    customerLatitude,
    customerLongitude,

    // Fees
    deliveryFee,
    deliveryDistance,

    // Status
    isGeocodingAddress,
    isReValidatingPincode,
    locationError,

    // Actions
    handleAddressChange,
    handleValidateAddressClick,
  };
}
