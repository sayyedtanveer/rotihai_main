import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDeliveryAreas } from "@/lib/deliveryAreas";

// ============================================
// DELIVERY LOCATION INTERFACE
// ============================================
export interface DeliveryLocation {
  // GPS Detection
  gpsDetected: boolean;
  latitude: number | null;
  longitude: number | null;

  // Pincode (for early validation on Home page)
  pincode: string | null;

  // Validated Address
  address: string | null;
  isInZone: boolean;
  distance: number | null; // km from chef

  // Metadata
  validatedAt: string | null;
  source: "gps" | "manual" | "pincode" | null; // How was location detected?
}

// ============================================
// CONTEXT TYPE
// ============================================
interface DeliveryLocationContextType {
  location: DeliveryLocation;
  setDeliveryLocation: (location: Partial<DeliveryLocation>) => void;
  clearLocation: () => void;
  isLoading: boolean;
}

// ============================================
// CREATE CONTEXT
// ============================================
const DeliveryLocationContext = createContext<DeliveryLocationContextType | undefined>(
  undefined
);

// ============================================
// PROVIDER COMPONENT
// ============================================
export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation>(() => {
    // Try to restore from localStorage on mount
    const stored = localStorage.getItem("lastValidatedDeliveryAddress");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if validation is less than 24 hours old
        const validatedTime = new Date(parsed.validatedAt).getTime();
        const now = new Date().getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - validatedTime < twentyFourHours) {
          console.log("[DELIVERY-CONTEXT] Restored location from localStorage:", parsed.address);
          return {
            gpsDetected: parsed.gpsDetected || false,
            latitude: parsed.latitude || null,
            longitude: parsed.longitude || null,
            pincode: parsed.pincode || null,
            address: parsed.address || null,
            isInZone: parsed.isInZone || false,
            distance: parsed.distance || null,
            validatedAt: parsed.validatedAt || null,
            source: parsed.source || null,
          };
        }
      } catch (e) {
        console.warn("[DELIVERY-CONTEXT] Error restoring from localStorage:", e);
      }
    }

    // Default state
    return {
      gpsDetected: false,
      latitude: null,
      longitude: null,
      pincode: null,
      address: null,
      isInZone: false,
      distance: null,
      validatedAt: null,
      source: null,
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // LOAD DELIVERY AREAS ON MOUNT
  // ============================================
  useEffect(() => {
    // Load delivery areas in background (no blocking)
    getDeliveryAreas().catch((error) => {
      console.warn("[DELIVERY-CONTEXT] Failed to load areas:", error);
      // Will use fallback - not a critical error
    });
  }, []);

  // ============================================
  // SET DELIVERY LOCATION
  // ============================================
  const setDeliveryLocation = (newLocation: Partial<DeliveryLocation>) => {
    setLocation((prev) => {
      const updated = { ...prev, ...newLocation };

      // Auto-save to localStorage
      if (newLocation.isInZone || newLocation.address || newLocation.pincode) {
        const toStore = {
          gpsDetected: updated.gpsDetected,
          latitude: updated.latitude,
          longitude: updated.longitude,
          pincode: updated.pincode,
          address: updated.address,
          isInZone: updated.isInZone,
          distance: updated.distance,
          validatedAt: new Date().toISOString(),
          source: updated.source,
        };
        localStorage.setItem("lastValidatedDeliveryAddress", JSON.stringify(toStore));
        console.log("[DELIVERY-CONTEXT] Saved location to localStorage:", updated.address || updated.pincode);
      }

      console.log("[DELIVERY-CONTEXT] Updated location:", {
        address: updated.address,
        isInZone: updated.isInZone,
        distance: updated.distance,
        source: updated.source,
      });

      return updated;
    });
  };

  // ============================================
  // CLEAR LOCATION
  // ============================================
  const clearLocation = () => {
    setLocation({
      gpsDetected: false,
      latitude: null,
      longitude: null,
      pincode: null,
      address: null,
      isInZone: false,
      distance: null,
      validatedAt: null,
      source: null,
    });
    localStorage.removeItem("lastValidatedDeliveryAddress");
    console.log("[DELIVERY-CONTEXT] Cleared location");
  };

  const value: DeliveryLocationContextType = {
    location,
    setDeliveryLocation,
    clearLocation,
    isLoading,
  };

  return (
    <DeliveryLocationContext.Provider value={value}>
      {children}
    </DeliveryLocationContext.Provider>
  );
}

// ============================================
// HOOK TO USE CONTEXT
// ============================================
export function useDeliveryLocation() {
  const context = useContext(DeliveryLocationContext);
  if (!context) {
    throw new Error(
      "useDeliveryLocation must be used within DeliveryLocationProvider"
    );
  }
  return context;
}

// ============================================
// VALID DELIVERY AREAS (for suggestions)
// ============================================
export const VALID_DELIVERY_AREAS = [
  "Kurla West",
  "Kurla East",
  "Fort",
  "Colaba",
  "Kala Ghoda",
  "Bandra",
  "Worli",
  "Marine Drive",
  "South Mumbai",
  "Mahim",
  "Dharavi",
  "Shivaji Park",
  "Dadar",
  "Prabhadevi",
  "Lower Parel",
  "Koala",
  "Chembur",
  "Vile Parle",
  "Andheri",
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Filter areas by search query for suggestions
export const getAreaSuggestions = (query: string): string[] => {
  if (!query.trim()) return VALID_DELIVERY_AREAS.slice(0, 5);

  const lowerQuery = query.toLowerCase();
  return VALID_DELIVERY_AREAS.filter((area) =>
    area.toLowerCase().includes(lowerQuery)
  ).slice(0, 5); // Return max 5 suggestions
};

// Check if entered area is valid (exact or close match)
export const isValidArea = (area: string): boolean => {
  const lowerArea = area.toLowerCase().trim();
  return VALID_DELIVERY_AREAS.some(
    (validArea) => validArea.toLowerCase() === lowerArea
  );
};
