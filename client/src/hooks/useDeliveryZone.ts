import { useState, useCallback } from 'react';
import { calculateDistance } from '@/lib/locationUtils';

const KURLA_CENTER = { lat: 19.0728, lng: 72.8826 };
const MAX_DELIVERY_DISTANCE = 5; // km

export interface DeliveryZoneValidation {
  isInZone: boolean;
  distance: number;
  message: string;
}

export function useDeliveryZone() {
  const [isInZone, setIsInZone] = useState(true);
  const [distance, setDistance] = useState<number>(0);
  const [message, setMessage] = useState('');

  const validateLocation = useCallback((latitude: number, longitude: number): DeliveryZoneValidation => {
    const dist = calculateDistance(KURLA_CENTER.lat, KURLA_CENTER.lng, latitude, longitude);
    const inZone = dist <= MAX_DELIVERY_DISTANCE;
    
    let msg = '';
    if (inZone) {
      msg = `Great! We deliver to your area (${dist.toFixed(1)}km from Kurla West).`;
    } else {
      msg = `We currently deliver within ${MAX_DELIVERY_DISTANCE}km of Kurla West. You're ${dist.toFixed(1)}km away.`;
    }
    
    setDistance(dist);
    setIsInZone(inZone);
    setMessage(msg);
    
    return { isInZone: inZone, distance: dist, message: msg };
  }, []);

  const clearValidation = useCallback(() => {
    setIsInZone(true);
    setDistance(0);
    setMessage('');
  }, []);

  return { 
    validateLocation, 
    isInZone, 
    distance,
    message,
    clearValidation,
    maxDeliveryDistance: MAX_DELIVERY_DISTANCE
  };
}
