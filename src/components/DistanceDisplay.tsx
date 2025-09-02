import { useState, useEffect } from 'react';
import { distanceService } from '../services/distanceService';

interface DistanceDisplayProps {
  providerAddress?: string;
  providerLocation?: {
    lat: number;
    lng: number;
  };
  userLocation?: {
    lat: number;
    lng: number;
  };
  className?: string;
}

export default function DistanceDisplay({ 
  providerAddress, 
  providerLocation, 
  userLocation,
  className = '' 
}: DistanceDisplayProps) {
  const [distance, setDistance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDistance = async () => {
      if (!userLocation || (!providerAddress && !providerLocation)) {
        return;
      }

      setIsLoading(true);
      try {
        const origin = userLocation;
        const destination = providerLocation || providerAddress;
        
        if (!destination) return;

        const result = await distanceService.calculateDistance(origin, destination);
        setDistance(result.distance.text);
      } catch (error) {
        console.error('Errore calcolo distanza:', error);
        setDistance(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Aggiungiamo un ritardo random per distribuire le richieste
    const delay = Math.random() * 2000; // 0-2 secondi
    const timer = setTimeout(fetchDistance, delay);

    return () => clearTimeout(timer);
  }, [userLocation, providerAddress, providerLocation]);

  if (isLoading) {
    return (
      <span className={`distance-display loading ${className}`}>
        📍 Calcolando...
      </span>
    );
  }

  if (!distance) {
    return null;
  }

  return (
    <span className={`distance-display ${className}`}>
      📍 {distance}
    </span>
  );
}
