import { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import AddressAutocomplete from './AddressAutocomplete';
import '../styles/Location.css';

interface LocationSelectorProps {
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

export default function LocationSelector({ onLocationChange, className = '' }: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { 
    isLoadingLocation, 
    getCurrentLocation
  } = useGeolocation();

  const handleUseCurrentLocation = async () => {
    setLocationError(null); // Reset errore precedente
    
    try {
      const coords = await getCurrentLocation();
      
      // Reverse geocoding per ottenere l'indirizzo
      const response = await fetch('/api/maps/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng })
      });
      
      const data = await response.json();
      const address = data.success ? data.formattedAddress : 'Posizione corrente';
      
      const location = {
        lat: coords.lat,
        lng: coords.lng,
        address
      };
      
      setSelectedLocation(location);
      onLocationChange(location);
    } catch (error) {
      console.error('Errore posizione:', error);
      
      // Gestione errori specifici per geolocalizzazione
      let errorMessage = 'Impossibile ottenere la posizione.';
      
      if (error instanceof Error) {
        if (error.message.includes('denied')) {
          errorMessage = 'Permessi di geolocalizzazione negati. Per usare questa funzione, concedi i permessi di posizione nelle impostazioni del browser.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Servizio di geolocalizzazione non disponibile. Prova a inserire manualmente il tuo indirizzo.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout nella rilevazione della posizione. Riprova o inserisci manualmente il tuo indirizzo.';
        }
      }
      
      setLocationError(errorMessage);
    }
  };

  const handleAddressSelect = async (addressResult: any) => {
    try {
      // Cancella eventuali errori precedenti
      setLocationError(null);
      
      const location = {
        lat: addressResult.coordinates.lat,
        lng: addressResult.coordinates.lng,
        address: addressResult.address
      };
      
      setSelectedLocation(location);
      onLocationChange(location);
    } catch (error) {
      console.error('Errore geocoding:', error);
      alert('Impossibile trovare l\'indirizzo specificato.');
    }
  };

  return (
    <div className={`location-selector ${className}`}>
      <div className="location-selector-header">
        <h3>📍 Seleziona la tua posizione</h3>
        <p>Per trovare i servizi più vicini a te</p>
      </div>
      
      <div className="location-options">
        {/* Opzione 1: Usa posizione corrente */}
        <button 
          onClick={handleUseCurrentLocation}
          disabled={isLoadingLocation}
          className={`location-button ${isLoadingLocation ? 'loading' : ''}`}
        >
          {isLoadingLocation ? (
            <>🔄 Rilevando posizione...</>
          ) : (
            <>🎯 Usa la mia posizione</>
          )}
        </button>
        
        {/* Errore geolocalizzazione */}
        {locationError && (
          <div className="location-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{locationError}</span>
          </div>
        )}
        
        {/* Divisore */}
        <div className="location-divider">
          <span>oppure</span>
        </div>
        
        {/* Opzione 2: Inserisci indirizzo */}
        <div className="location-search">
          <AddressAutocomplete
            placeholder="Inserisci il tuo indirizzo..."
            onAddressSelect={handleAddressSelect}
          />
        </div>
      </div>
      
      {/* Posizione selezionata */}
      {selectedLocation && (
        <div className="selected-location">
          <div className="selected-location-info">
            <span className="selected-location-icon">✅</span>
            <div>
              <strong>Posizione selezionata:</strong>
              <br />
              <span className="selected-address">{selectedLocation.address}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedLocation(null);
              setLocationError(null);
              onLocationChange({ lat: 0, lng: 0, address: '' });
            }}
            className="clear-location-button"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
