import { useState } from 'react';
import { safeFetch, safeConsoleError } from '../utils/security';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationResult {
  coordinates: Coordinates;
  formattedAddress: string;
  addressComponents: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
    zipCode?: string;
  };
}

interface DistanceResult {
  distance: {
    text: string;
    value: number;
    km: number;
  };
  duration: {
    text: string;
    value: number;
  };
}

export const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Ottieni posizione dell'utente tramite GPS
  const getCurrentLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalizzazione non supportata'));
        return;
      }

      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          setIsLoadingLocation(false);
          resolve(coords);
        },
        (error) => {
          setIsLoadingLocation(false);
          setLocationError(error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minuti
        }
      );
    });
  };

  // Geocoding: converte indirizzo in coordinate
  const geocodeAddress = async (address: string): Promise<LocationResult> => {
    try {
      const token = localStorage.getItem('token');
      const response = await safeFetch('/api/maps/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Errore geocoding');
      }

      return data;
    } catch (error) {
      safeConsoleError('Errore geocoding:', error);
      throw error;
    }
  };

  // Calcola distanza tra due punti
  const calculateDistance = async (origin: string | Coordinates, destination: string | Coordinates): Promise<DistanceResult> => {
    try {
      const token = localStorage.getItem('token');
      const response = await safeFetch('/api/maps/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ origin, destination })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Errore calcolo distanza');
      }

      return data;
    } catch (error) {
      safeConsoleError('Errore calcolo distanza:', error);
      throw error;
    }
  };

  // Trova provider nelle vicinanze
  const findNearbyProviders = async (location: Coordinates, radius: number = 20) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/maps/nearby-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location, radius })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Errore ricerca provider');
      }

      return data;
    } catch (error) {
      console.error('Errore ricerca provider:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  return {
    userLocation,
    isLoadingLocation,
    locationError,
    getCurrentLocation,
    geocodeAddress,
    calculateDistance,
    findNearbyProviders
  };
};
