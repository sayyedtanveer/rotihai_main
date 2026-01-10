/**
 * Safari-compatible location detection utilities
 * Handles iOS Safari geolocation issues and fallbacks
 */

/**
 * Request geolocation with Safari-specific handling
 * iOS Safari requires HTTPS and proper permission prompts
 */
export function requestGeolocationWithSafariFallback(
  onSuccess: (coords: GeolocationCoordinates) => void,
  onError: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number | null {
  if (!navigator.geolocation) {
    console.warn("[LOCATION] Geolocation API not available");
    const error = new DOMException("Geolocation not supported");
    onError(error as unknown as GeolocationPositionError);
    return null;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: false, // Set to false for faster response on mobile/Safari
    timeout: 15000, // Longer timeout for Safari
    maximumAge: 0, // Don't use cached position
    ...options,
  };

  console.log("[LOCATION] Requesting geolocation with options:", defaultOptions);

  // Use watchPosition instead of getCurrentPosition for better Safari support
  // This is more reliable on iOS Safari
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      console.log("[LOCATION] Position received:", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      onSuccess(position.coords);
      // Clear watch after first successful position
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    },
    (error) => {
      console.warn("[LOCATION] Geolocation error:", {
        code: error.code,
        message: error.message,
      });
      onError(error);
      // Clear watch on error
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    },
    defaultOptions
  );

  return watchId;
}

/**
 * Check if we're on iOS/Safari
 */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/(Android|CriOS)/.test(ua);
}

/**
 * Check if we're on HTTPS (required for iOS Safari geolocation)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}

/**
 * Get user-friendly location error message
 */
export function getLocationErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 1: // PERMISSION_DENIED
      return "Location permission denied. Go to Settings → [Your App/Safari] → Location and enable it.";
    case 2: // POSITION_UNAVAILABLE
      return "Location unavailable. Please enable Location Services in Settings → Privacy.";
    case 3: // TIMEOUT
      return "Location detection timed out. Please try again in an area with better signal.";
    default:
      return "Could not detect location. Please enter your address manually.";
  }
}

/**
 * Fallback method: Use IP-based geolocation (less accurate but no permission needed)
 * This is useful for when device geolocation fails
 */
export async function getIPBasedLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      console.log("[LOCATION] IP-based location obtained:", {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
      });
      return {
        latitude: data.latitude,
        longitude: data.longitude,
      };
    }
  } catch (error) {
    console.warn("[LOCATION] IP-based location failed:", error);
  }
  
  return null;
}
