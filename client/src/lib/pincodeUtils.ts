/**
 * Pincode Storage & Sync Utilities
 * 
 * ⚠️ IMPORTANT: Actual validation happens server-side via POST /api/validate-pincode
 * This file ONLY handles localStorage persistence and sync across pages
 * 
 * Do NOT duplicate validation logic - use existing endpoints
 * Existing endpoints:
 * - POST /api/validate-pincode (server/routes.ts line 4075+)
 * - GET /api/admin/delivery-areas (server/adminRoutes.ts)
 */

/**
 * Store validated pincode in localStorage for sync across Hero → Home → Checkout
 * 
 * Called AFTER successful server-side validation via POST /api/validate-pincode
 */
export interface StoredPincodeValidation {
  pincode: string;
  area: string;
  areaId?: string;
  latitude: number;
  longitude: number;
  validatedAt?: string;
}


export function storePincodeValidation(data: {
  pincode: string;
  area: string;
  areaId?: string;
  latitude: number;
  longitude: number;
}): void {
  const storedValue = {
    pincode: data.pincode,
    area: data.area,
    areaId: data.areaId,
    latitude: data.latitude,
    longitude: data.longitude,
    validatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem('validatedPincode', JSON.stringify(storedValue));
    localStorage.setItem('userPincode', data.pincode);
    localStorage.setItem('pincodeArea', data.area);
    localStorage.setItem('userLatitude', String(data.latitude));
    localStorage.setItem('userLongitude', String(data.longitude));
  } catch (error) {
    console.warn('[PINCODE-STORAGE] Unable to persist pincode in localStorage', error);
  }

  // Stored successfully (no noisy console output)
}

/**
 * Get stored pincode validation from localStorage
 * Returns null if not found or malformed
 */
export function getStoredPincodeValidation(): StoredPincodeValidation | null {
  try {
    const stored = localStorage.getItem('validatedPincode');
    if (!stored) return null;

    const data = JSON.parse(stored);
    const latitude = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
    const longitude = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude;

    if (
      !data.pincode ||
      !data.area ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      console.warn('[PINCODE-STORAGE] Invalid stored pincode data');
      return null;
    }

    // Retrieved successfully (no noisy console output)
    return {
      pincode: data.pincode,
      area: data.area,
      areaId: data.areaId,
      latitude,
      longitude,
      validatedAt: data.validatedAt,
    };
  } catch (error) {
    console.error('[PINCODE-STORAGE] Error parsing stored pincode:', error);
    return null;
  }
}

export function getLegacyPincodeCache(): StoredPincodeValidation | null {
  try {
    const pincode = localStorage.getItem('userPincode');
    const area = localStorage.getItem('pincodeArea');
    const latitudeRaw = localStorage.getItem('userLatitude');
    const longitudeRaw = localStorage.getItem('userLongitude');

    if (!pincode || !area || !latitudeRaw || !longitudeRaw) {
      return null;
    }

    const latitude = parseFloat(latitudeRaw);
    const longitude = parseFloat(longitudeRaw);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return {
      pincode,
      area,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('[PINCODE-STORAGE] Error reading legacy cached pincode:', error);
    return null;
  }
}

/**
 * Clear pincode validation from localStorage (when user changes pincode)
 */
export function clearPincodeValidation(): void {
  try {
    localStorage.removeItem('validatedPincode');
    localStorage.removeItem('userPincode');
    localStorage.removeItem('pincodeArea');
    localStorage.removeItem('userLatitude');
    localStorage.removeItem('userLongitude');
    localStorage.removeItem('lastValidatedDeliveryAddress');
  } catch (error) {
    console.warn('[PINCODE-STORAGE] Unable to clear pincode data from localStorage', error);
  }

  // Cleared stored pincode
}

/**
 * Check if pincode is stored and valid
 */
export function hasPincodeValidation(): boolean {
  return getStoredPincodeValidation() !== null;
}

