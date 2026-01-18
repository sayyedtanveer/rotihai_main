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
export function storePincodeValidation(data: {
  pincode: string;
  area: string;
  areaId?: string;
  latitude: number;
  longitude: number;
}): void {
  localStorage.setItem(
    'validatedPincode',
    JSON.stringify({
      pincode: data.pincode,
      area: data.area,
      areaId: data.areaId,
      latitude: data.latitude,
      longitude: data.longitude,
      validatedAt: new Date().toISOString(),
    })
  );
  console.log('[PINCODE-STORAGE] Stored validated pincode:', data.pincode);
}

/**
 * Get stored pincode validation from localStorage
 * Returns null if not found or expired
 */
export function getStoredPincodeValidation(): {
  pincode: string;
  area: string;
  areaId?: string;
  latitude: number;
  longitude: number;
} | null {
  try {
    const stored = localStorage.getItem('validatedPincode');
    if (!stored) return null;

    const data = JSON.parse(stored);
    
    // Validate data structure
    if (!data.pincode || !data.area || !data.latitude || !data.longitude) {
      console.warn('[PINCODE-STORAGE] Invalid stored pincode data');
      return null;
    }

    console.log('[PINCODE-STORAGE] Retrieved stored pincode:', data.pincode);
    return data;
  } catch (error) {
    console.error('[PINCODE-STORAGE] Error parsing stored pincode:', error);
    return null;
  }
}

/**
 * Clear pincode validation from localStorage (when user changes pincode)
 */
export function clearPincodeValidation(): void {
  localStorage.removeItem('validatedPincode');
  console.log('[PINCODE-STORAGE] Cleared stored pincode');
}

/**
 * Check if pincode is stored and valid
 */
export function hasPincodeValidation(): boolean {
  return getStoredPincodeValidation() !== null;
}

