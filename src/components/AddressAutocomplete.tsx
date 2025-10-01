import { useState, useCallback, useEffect } from 'react';
import { safeFetch, safeConsoleError } from '../utils/security';
import '../styles/GoogleMaps.css';

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressResult {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  addressComponents: any;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressResult) => void;
  placeholder?: string;
  value?: string;
  onInputChange?: (value: string) => void;
}

/**
 * 📍 COMPONENTE AUTOCOMPLETE INDIRIZZI
 * Usa Google Maps Places API per suggerimenti intelligenti
 */
const AddressAutocomplete = ({
  onAddressSelect,
  placeholder = "Inserisci indirizzo...",
  value,
  onInputChange
}: AddressAutocompleteProps) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2)); // Session token per Google Places API

  useEffect(() => {
    if (value !== undefined && value !== input) {
  setInput(value);
    }
  }, [value, input]);

  const handleInputChange = useCallback(async (value: string) => {
    setInput(value);
    onInputChange?.(value);
    
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await safeFetch('/api/maps/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          input: value, 
          sessionToken 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.predictions || []);
      } else {
        safeConsoleError('Errore autocomplete:', data.error);
        setSuggestions([]);
      }
    } catch (error) {
      safeConsoleError('Errore autocomplete:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setInput(suggestion.description);
    setSuggestions([]);
    
    try {
      const token = localStorage.getItem('token');
      
      // Se è un suggerimento fallback, usa direttamente geocoding
      if (suggestion.placeId.startsWith('fallback_')) {
        const response = await safeFetch('/api/maps/geocode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ address: suggestion.description })
        });
        
        const result = await response.json();
        
        if (result.success) {
          const addressResult = {
            address: result.formattedAddress,
            coordinates: result.coordinates,
            addressComponents: result.addressComponents
          };
          onAddressSelect(addressResult);
          onInputChange?.(addressResult.address);
        } else {
          safeConsoleError('Errore geocoding:', result.error);
        }
      } else {
        // Usa place details per placeId reali
        const response = await safeFetch('/api/maps/place-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            placeId: suggestion.placeId, 
            sessionToken 
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          const addressResult = {
            address: result.formattedAddress,
            coordinates: result.coordinates,
            addressComponents: result.addressComponents
          };
          onAddressSelect(addressResult);
          onInputChange?.(addressResult.address);
        } else {
          safeConsoleError('Errore place details:', result.error);
        }
      }
    } catch (error) {
      safeConsoleError('Errore selezione indirizzo:', error);
    }
  };

  return (
    <div className="address-autocomplete">
      <input
        type="text"
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="address-input"
      />
      
      {loading && <div className="loading-suggestions">Cercando...</div>}
      
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map(suggestion => (
            <div
              key={suggestion.placeId}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-main">📍 {suggestion.mainText}</div>
              <div className="suggestion-secondary">{suggestion.secondaryText}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
