import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { calculateDistance, isInDeliveryZone, getDeliveryMessage } from '@/lib/locationUtils';
import { getDefaultCoordinates, getDefaultCoordinatesCached } from '@/lib/deliveryAreas';

// Use cached coordinates initially, will be updated by async API call
const DEFAULT_LOCATION = getDefaultCoordinatesCached();

const STORAGE_KEYS = {
  latitude: 'userLatitude',
  longitude: 'userLongitude',
  address: 'userAddress',
  locality: 'userLocality'
};

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  locality: string;
  isServiceable: boolean;
  distance: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface LocationContextType extends LocationState {
  detectLocation: () => Promise<void>;
  setManualLocation: (address: string) => void;
  clearLocation: () => void;
  validateServiceArea: (lat: number, lng: number) => { isServiceable: boolean; message: string; distance: number };
}

const defaultState: LocationState = {
  latitude: null,
  longitude: null,
  address: '',
  locality: `${getDefaultCoordinatesCached().latitude.toFixed(4)}, ${getDefaultCoordinatesCached().longitude.toFixed(4)}`,
  isServiceable: true,
  distance: null,
  isLoading: false,
  error: null
};

const LocationContext = createContext<LocationContextType | null>(null);

export function useLocationProvider(): LocationContextType {
  const [state, setState] = useState<LocationState>(() => {
    const savedLat = localStorage.getItem(STORAGE_KEYS.latitude);
    const savedLng = localStorage.getItem(STORAGE_KEYS.longitude);
    const savedAddress = localStorage.getItem(STORAGE_KEYS.address) || '';
    const defaultCoords = getDefaultCoordinatesCached();
    const defaultLocalityStr = `${defaultCoords.latitude.toFixed(4)}, ${defaultCoords.longitude.toFixed(4)}`;
    const savedLocality = localStorage.getItem(STORAGE_KEYS.locality) || defaultLocalityStr;

    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      const deliveryCheck = getDeliveryMessage(lat, lng);
      
      return {
        ...defaultState,
        latitude: lat,
        longitude: lng,
        address: savedAddress,
        locality: savedLocality,
        isServiceable: deliveryCheck.available,
        distance: deliveryCheck.distance
      };
    }
    
    return defaultState;
  });

  const validateServiceArea = useCallback((lat: number, lng: number) => {
    const result = getDeliveryMessage(lat, lng);
    return {
      isServiceable: result.available,
      message: result.message,
      distance: result.distance
    };
  }, []);

  const saveToStorage = useCallback((lat: number, lng: number, address: string, locality: string) => {
    localStorage.setItem(STORAGE_KEYS.latitude, lat.toString());
    localStorage.setItem(STORAGE_KEYS.longitude, lng.toString());
    localStorage.setItem(STORAGE_KEYS.address, address);
    localStorage.setItem(STORAGE_KEYS.locality, locality);
  }, []);

  const detectLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      const deliveryCheck = validateServiceArea(latitude, longitude);
      
      // Get default location from API for display
      const defaultCoords = getDefaultCoordinatesCached();
      
      const locality = deliveryCheck.isServiceable 
        ? `${defaultCoords.latitude.toFixed(4)}, ${defaultCoords.longitude.toFixed(4)}` 
        : 'Location detected';
      
      const address = deliveryCheck.isServiceable
        ? `Service Area (${deliveryCheck.distance.toFixed(1)}km from center)`
        : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      saveToStorage(latitude, longitude, address, locality);

      setState({
        latitude,
        longitude,
        address,
        locality,
        isServiceable: deliveryCheck.isServiceable,
        distance: deliveryCheck.distance,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      let errorMessage = 'Unable to get your location';
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [validateServiceArea, saveToStorage]);

  const setManualLocation = useCallback((address: string) => {
    const addressLower = address.toLowerCase().trim();
    const defaultCoords = getDefaultCoordinatesCached();
    
    const isKurlaArea = addressLower.includes('kurla') || 
                        addressLower.includes('chunabhatti') ||
                        addressLower.includes('sion') ||
                        addressLower.includes('bkc');
    
    if (isKurlaArea) {
      saveToStorage(defaultCoords.latitude, defaultCoords.longitude, address, `${defaultCoords.latitude.toFixed(4)}, ${defaultCoords.longitude.toFixed(4)}`);
      
      setState({
        latitude: defaultCoords.latitude,
        longitude: defaultCoords.longitude,
        address,
        locality: `${defaultCoords.latitude.toFixed(4)}, ${defaultCoords.longitude.toFixed(4)}`,
        isServiceable: true,
        distance: 0,
        isLoading: false,
        error: null
      });
    } else {
      setState(prev => ({
        ...prev,
        address,
        locality: address,
        isServiceable: false,
        error: 'We currently deliver only in Kurla West, Mumbai area.'
      }));
    }
  }, [saveToStorage]);

  const clearLocation = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setState(defaultState);
  }, []);

  // Load default coordinates from API on mount
  useEffect(() => {
    const loadDefaultCoordinates = async () => {
      try {
        await getDefaultCoordinates();
        console.log('[useLocation] Default coordinates loaded from API');
      } catch (error) {
        console.warn('[useLocation] Failed to load default coordinates:', error);
        // Will use cached fallback
      }
    };
    loadDefaultCoordinates();
  }, []);

  return {
    ...state,
    detectLocation,
    setManualLocation,
    clearLocation,
    validateServiceArea
  };
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export { LocationContext };
