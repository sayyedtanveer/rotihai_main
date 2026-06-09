/**
 * Hook to fetch and cache delivery configuration
 * This replaces hardcoded coordinates throughout the app
 * Ready for mobile app and multi-city support
 * 
 * Usage:
 * const { config, isLoading } = useDeliveryConfig();
 * 
 * Then use: config.latitude, config.longitude, config.maxDeliveryDistance
 */

import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/apiBase';

export interface DeliveryConfig {
  storeName: string;
  latitude: number;
  longitude: number;
  maxDeliveryDistance: number;
  serviceAreas: string[];
}

// Fallback configuration — used only if the /api/delivery-config API call fails.
// serviceAreas is intentionally empty so the app doesn't artificially restrict pincodes
// when the API is unavailable. The actual pincode list lives in the DB delivery_areas table.
const DEFAULT_CONFIG: DeliveryConfig = {
  storeName: "Rotihai",
  latitude: 19.0728,
  longitude: 72.8826,
  maxDeliveryDistance: 5,
  serviceAreas: []
};

export function useDeliveryConfig() {
  const { 
    data: config = DEFAULT_CONFIG, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["/api/delivery-config"],
    queryFn: async () => {
      try {
        console.log("[DELIVERY-CONFIG] Fetching delivery configuration...");
        const res = await fetch(getApiUrl("/api/delivery-config"));
        
        if (!res.ok) {
          console.warn("[DELIVERY-CONFIG] API returned error, using fallback:", res.status);
          return DEFAULT_CONFIG;
        }
        
        const data = await res.json();
        console.log("[DELIVERY-CONFIG] Fetched successfully:", data);
        return data;
      } catch (error) {
        console.warn("[DELIVERY-CONFIG] Fetch failed, using fallback:", error);
        return DEFAULT_CONFIG;
      }
    },
    // Cache for 1 hour (coordinates don't change often)
    staleTime: 60 * 60 * 1000,
    // Retry once if failed
    retry: 1,
    // Don't refetch on window focus (stable config)
    refetchOnWindowFocus: false
  });

  return {
    config,
    isLoading,
    error,
    refetch, // Manually refetch if needed
    
    // Convenience properties
    storeLocation: {
      latitude: config.latitude,
      longitude: config.longitude
    },
    maxDeliveryDistance: config.maxDeliveryDistance,
    serviceAreas: config.serviceAreas
  };
}

/**
 * MIGRATION GUIDE:
 * 
 * OLD (Hardcoded):
 * ```tsx
 * const CHEF_LAT = 19.0728;
 * const CHEF_LNG = 72.8826;
 * const MAX_DELIVERY_DISTANCE = 2.5;
 * 
 * const distance = calculateDistance(lat, lng, CHEF_LAT, CHEF_LNG);
 * if (distance > MAX_DELIVERY_DISTANCE) { ... }
 * ```
 * 
 * NEW (Dynamic):
 * ```tsx
 * const { config } = useDeliveryConfig();
 * 
 * const distance = calculateDistance(lat, lng, config.latitude, config.longitude);
 * if (distance > config.maxDeliveryDistance) { ... }
 * ```
 */
