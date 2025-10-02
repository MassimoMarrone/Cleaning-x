import dotenv from 'dotenv';
dotenv.config();

/**
 * 🗺️ GOOGLE MAPS SERVICE
 * Gestisce tutte le operazioni con Goog      } else {
        console.error('Errore Distance Matrix:', this.sanitizeError(data));
        return {
          success: false,
          error: 'Impossibile calcolare distanza'
        };
      }
    } catch (error) {
      console.error('Errore calcolo distanza:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Errore servizio distance matrix'
      };
    }*/
class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.geocodingApiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY || this.apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * 📍 GEOCODING - Converte indirizzo in coordinate
   */
  async geocodeAddress(address) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/geocode/json?address=${encodedAddress}&key=${this.geocodingApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Estrai componenti indirizzo
        const addressComponents = this.parseAddressComponents(result.address_components);
        
        return {
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          formattedAddress: result.formatted_address,
          addressComponents
        };
      } else {
        return {
          success: false,
          error: 'Indirizzo non trovato'
        };
      }
    } catch (error) {
      console.error('Errore geocoding:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Errore servizio geocoding'
      };
    }
  }

  /**
   * 🏠 REVERSE GEOCODING - Converte coordinate in indirizzo
   */
  async reverseGeocode(lat, lng) {
    try {
      const url = `${this.baseUrl}/geocode/json?latlng=${lat},${lng}&key=${this.geocodingApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = this.parseAddressComponents(result.address_components);
        
        return {
          success: true,
          formattedAddress: result.formatted_address,
          addressComponents
        };
      } else {
        return {
          success: false,
          error: 'Coordinate non valide'
        };
      }
    } catch (error) {
      console.error('Errore reverse geocoding:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Errore servizio reverse geocoding'
      };
    }
  }

  /**
   * 📏 CALCOLA DISTANZA tra due punti
   */
  async calculateDistance(origin, destination) {
    try {
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
      
      const url = `${this.baseUrl}/distancematrix/json?origins=${encodeURIComponent(originStr)}&destinations=${encodeURIComponent(destStr)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const element = data.rows[0].elements[0];
        
        return {
          success: true,
          distance: {
            text: element.distance.text,
            value: element.distance.value, // metri
            km: Math.round(element.distance.value / 1000 * 100) / 100 // km con 2 decimali
          },
          duration: {
            text: element.duration.text,
            value: element.duration.value // secondi
          }
        };
      } else {
        return {
          success: false,
          error: 'Impossibile calcolare distanza'
        };
      }
    } catch (error) {
      console.error('Errore calcolo distanza:', error);
      return {
        success: false,
        error: 'Errore servizio distanza'
      };
    }
  }

  /**
   * 🎯 TROVA PROVIDER NELLE VICINANZE
   */
  calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raggio Terra in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distanza in km
    
    return Math.round(distance * 100) / 100; // 2 decimali
  }

  /**
   * 💰 CALCOLA COSTI TRASFERTA
   */
  calculateTravelCost(distanceKm, travelCosts) {
    if (!travelCosts.enabled) return 0;
    
    const { freeRadius, pricePerKm, minimumCharge } = travelCosts;
    
    if (distanceKm <= freeRadius) {
      return 0; // Gratuito entro il raggio
    }
    
    const chargableDistance = distanceKm - freeRadius;
    const cost = chargableDistance * pricePerKm;
    
    return Math.max(cost, minimumCharge); // Minimo garantito
  }

  /**
   * 🏷️ PARSING COMPONENTI INDIRIZZO
   */
  parseAddressComponents(components) {
    const parsed = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        parsed.street = component.long_name;
      } else if (types.includes('locality')) {
        parsed.city = component.long_name;
      } else if (types.includes('postal_code')) {
        parsed.zipCode = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.region = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
      }
    });

    if (!parsed.city) {
      const priorityTypes = [
        'postal_town',
        'administrative_area_level_3',
        'sublocality',
        'administrative_area_level_2',
        'administrative_area_level_1'
      ];

      const fallbackComponent = components.find(component =>
        component.types.some(type => priorityTypes.includes(type))
      );

      if (fallbackComponent) {
        parsed.city = fallbackComponent.long_name || fallbackComponent.short_name;
      }
    }
    
    if (!parsed.region) {
      const regionComponent = components.find(component =>
        component.types.includes('administrative_area_level_1')
      );
      if (regionComponent) {
        parsed.region = regionComponent.long_name;
      }
    }
    
    return parsed;
  }

  /**
   * � PLACES AUTOCOMPLETE - Suggerimenti per indirizzi
   */
  async getPlacesAutocomplete(input, sessionToken = null) {
    try {
      const encodedInput = encodeURIComponent(input);
      let url = `${this.baseUrl}/place/autocomplete/json?input=${encodedInput}&key=${this.apiKey}`;
      
      // Aggiungi parametri per migliorare i risultati
      url += '&types=address'; // Solo indirizzi, non POI
      url += '&components=country:it'; // Solo Italia
      url += '&language=it'; // Lingua italiana
      
      if (sessionToken) {
        url += `&sessiontoken=${sessionToken}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          predictions: data.predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting?.main_text || '',
            secondaryText: prediction.structured_formatting?.secondary_text || ''
          }))
        };
      } else if (data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          predictions: []
        };
      } else if (data.status === 'REQUEST_DENIED') {
        console.warn('Places API non abilitata, uso fallback geocoding');
        return this.getFallbackSuggestions(input);
      } else {
        console.error('Errore Places API:', this.sanitizeError(data));
        // Fallback a geocoding
        return this.getFallbackSuggestions(input);
      }
    } catch (error) {
      console.error('Errore autocomplete:', this.sanitizeError(error));
      // Fallback a geocoding
      return this.getFallbackSuggestions(input);
    }
  }

  /**
   * 🔄 FALLBACK SUGGESTIONS - Usa geocoding per suggerimenti base
   */
  async getFallbackSuggestions(input) {
    try {
      // Genera suggerimenti base per città italiane comuni
      const commonCities = ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania'];
      const suggestions = [];
      
      // Cerca città che matchano l'input
      const matchingCities = commonCities.filter(city => 
        city.toLowerCase().includes(input.toLowerCase())
      );
      
      // Aggiungi suggerimenti per città
      matchingCities.forEach((city, index) => {
        suggestions.push({
          placeId: `fallback_city_${index}`,
          description: `${input}, ${city}, Italia`,
          mainText: `${input}, ${city}`,
          secondaryText: 'Italia'
        });
      });
      
      // Aggiungi suggerimenti generici
      if (suggestions.length < 3) {
        const genericSuggestions = [
          { city: 'Roma', region: 'Lazio' },
          { city: 'Milano', region: 'Lombardia' },
          { city: 'Napoli', region: 'Campania' }
        ];
        
        genericSuggestions.forEach((item, index) => {
          if (suggestions.length < 5) {
            suggestions.push({
              placeId: `fallback_generic_${index}`,
              description: `${input}, ${item.city}, ${item.region}, Italia`,
              mainText: `${input}, ${item.city}`,
              secondaryText: `${item.region}, Italia`
            });
          }
        });
      }
      
      return {
        success: true,
        predictions: suggestions.slice(0, 5) // Max 5 suggerimenti
      };
    } catch (error) {
      console.error('Errore fallback suggestions:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Errore nel recupero suggerimenti'
      };
    }
  }

  /**
   * 🏠 PLACE DETAILS - Ottieni dettagli di un posto da place_id (con fallback)
   */
  async getPlaceDetails(placeId, sessionToken = null) {
    try {
      // Se è un placeId fallback, usa geocoding normale
      if (placeId.startsWith('fallback_')) {
        // Estrai l'indirizzo dal placeId o usa una stringa predefinita
        const address = `Roma, Italia`; // Indirizzo di default
        return this.geocodeAddress(address);
      }
      
      let url = `${this.baseUrl}/place/details/json?place_id=${placeId}&key=${this.apiKey}`;
      url += '&fields=formatted_address,geometry,address_components'; // Solo campi necessari
      url += '&language=it';
      
      if (sessionToken) {
        url += `&sessiontoken=${sessionToken}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const location = result.geometry.location;
        const addressComponents = this.parseAddressComponents(result.address_components);
        
        return {
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          formattedAddress: result.formatted_address,
          addressComponents
        };
      } else {
        console.error('Errore Place Details:', this.sanitizeError(data));
        return {
          success: false,
          error: 'Impossibile ottenere dettagli posto'
        };
      }
    } catch (error) {
      console.error('Errore place details:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Errore servizio place details'
      };
    }
  }

  /**
   * �🔧 UTILITY FUNCTIONS
   */
  sanitizeError(error) {
    // Rimuove API key dagli errori per sicurezza
    if (typeof error === 'string') {
      return error.replace(/key=[^&\s]+/g, 'key=***');
    }
    
    if (error && error.message) {
      return {
        ...error,
        message: error.message.replace(/key=[^&\s]+/g, 'key=***')
      };
    }
    
    return error;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * ✅ VALIDA API KEY
   */
  validateApiKey() {
    return !!(this.apiKey && this.geocodingApiKey);
  }
}

export default new GoogleMapsService();
