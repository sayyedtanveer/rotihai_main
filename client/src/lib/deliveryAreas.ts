// ============================================
// DELIVERY AREAS - DYNAMIC & CONFIGURABLE
// ============================================
// 
// Areas are loaded from admin API for flexibility.
// Hardcoded fallback is used if API fails.
// 
// NOTE: This is temporary. Once native mobile app
// launches with Google services, we can remove this
// and use Google Maps API directly.

import api from "./apiClient";

// Fallback areas (used when API unavailable)
const FALLBACK_DELIVERY_AREAS = [
  "Kurla West",
  "Kurla East",
  "Fort",
  "Colaba",
  "Bandra",
  "Worli",
  "Marine Drive",
];

// Cache key for localStorage
const DELIVERY_AREAS_CACHE_KEY = "deliveryAreasList";
const DELIVERY_AREAS_CACHE_TIME = 15 * 60 * 1000; // 15 minutes

// ============================================
// DYNAMIC AREAS LOADER
// ============================================
let dynamicAreasCache: string[] | null = null;
let cacheTimestamp = 0;

/**
 * Get delivery areas from admin API with fallback
 * Caches result for 15 minutes to reduce API calls
 */
export const getDeliveryAreas = async (): Promise<string[]> => {
  // Return cached areas if still valid
  if (dynamicAreasCache && Date.now() - cacheTimestamp < DELIVERY_AREAS_CACHE_TIME) {
    console.log("[DELIVERY-AREAS] Using cached areas");
    return dynamicAreasCache;
  }

  try {
    // Try to fetch from admin API
    const response = await api.get("/api/admin/delivery-areas", { timeout: 5000 });
    if (response.data?.areas && Array.isArray(response.data.areas) && response.data.areas.length > 0) {
      const areas = response.data.areas;
      console.log("[DELIVERY-AREAS] Loaded from API:", areas);
      
      // Cache in memory
      dynamicAreasCache = areas;
      cacheTimestamp = Date.now();
      
      // Also cache in localStorage as backup
      localStorage.setItem(DELIVERY_AREAS_CACHE_KEY, JSON.stringify({
        areas,
        timestamp: Date.now(),
      }));
      
      return areas;
    }
  } catch (error) {
    console.warn("[DELIVERY-AREAS] API failed:", error instanceof Error ? error.message : error);
  }

  // Try to restore from localStorage backup
  try {
    const cached = localStorage.getItem(DELIVERY_AREAS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log("[DELIVERY-AREAS] Restored from localStorage backup:", parsed.areas);
      dynamicAreasCache = parsed.areas;
      cacheTimestamp = parsed.timestamp;
      return parsed.areas;
    }
  } catch (e) {
    console.warn("[DELIVERY-AREAS] localStorage restore failed:", e);
  }

  // Fallback to hardcoded areas
  console.log("[DELIVERY-AREAS] Using fallback hardcoded areas");
  dynamicAreasCache = FALLBACK_DELIVERY_AREAS;
  cacheTimestamp = Date.now();
  return FALLBACK_DELIVERY_AREAS;
};

/**
 * Get areas synchronously (uses cache, doesn't fetch)
 * Use for instant suggestions while async load happens
 */
export const getDeliveryAreasCached = (): string[] => {
  if (dynamicAreasCache) {
    return dynamicAreasCache;
  }

  // Try localStorage cache first
  try {
    const cached = localStorage.getItem(DELIVERY_AREAS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      dynamicAreasCache = parsed.areas;
      return parsed.areas;
    }
  } catch (e) {
    // Ignore
  }

  // Return fallback
  return FALLBACK_DELIVERY_AREAS;
};

// Store validated location in localStorage
export const storeValidatedAddress = (address: string, latitude: number, longitude: number) => {
  localStorage.setItem(
    "lastValidatedDeliveryAddress",
    JSON.stringify({
      address,
      latitude,
      longitude,
      validatedAt: new Date().toISOString(),
    })
  );
  console.log("[DELIVERY-STORE] Saved validated address to localStorage:", address);
};

// Retrieve validated location from localStorage
export const getValidatedAddress = () => {
  const stored = localStorage.getItem("lastValidatedDeliveryAddress");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Check if validation is less than 24 hours old
      const validatedTime = new Date(parsed.validatedAt).getTime();
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - validatedTime < twentyFourHours) {
        console.log("[DELIVERY-STORE] Retrieved valid cached address:", parsed.address);
        return parsed;
      } else {
        console.log("[DELIVERY-STORE] Cached address expired, clearing");
        localStorage.removeItem("lastValidatedDeliveryAddress");
        return null;
      }
    } catch (e) {
      console.warn("[DELIVERY-STORE] Error parsing cached address:", e);
      return null;
    }
  }
  return null;
};

// Clear validated address from localStorage
export const clearValidatedAddress = () => {
  localStorage.removeItem("lastValidatedDeliveryAddress");
  console.log("[DELIVERY-STORE] Cleared validated address from localStorage");
};

// Filter areas by search query for suggestions
export const getAreaSuggestions = (query: string, areas?: string[]): string[] => {
  const areasList = areas || getDeliveryAreasCached();
  
  if (!query.trim()) return areasList.slice(0, 5);

  const lowerQuery = query.toLowerCase();
  return areasList.filter((area) =>
    area.toLowerCase().includes(lowerQuery)
  ).slice(0, 5); // Return max 5 suggestions
};

// Check if entered area is valid (exact or close match)
export const isValidArea = (area: string, areas?: string[]): boolean => {
  const areasList = areas || getDeliveryAreasCached();
  const lowerArea = area.toLowerCase().trim();
  return areasList.some(
    (validArea) => validArea.toLowerCase() === lowerArea
  );
};

// Force refresh areas from API (use after admin updates settings)
export const refreshDeliveryAreas = async (): Promise<string[]> => {
  dynamicAreasCache = null;
  cacheTimestamp = 0;
  return getDeliveryAreas();
};
