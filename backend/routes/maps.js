import express from 'express';
import GoogleMapsService from '../utils/googleMapsService.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * 📍 GEOCODE INDIRIZZO
 * POST /api/maps/geocode
 */
router.post('/geocode', auth, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Indirizzo richiesto' });
    }
    
    const result = await GoogleMapsService.geocodeAddress(address);
    res.json(result);
  } catch (error) {
    console.error('Errore geocoding route:', GoogleMapsService.sanitizeError(error));
    res.status(500).json({ error: 'Errore geocoding' });
  }
});

/**
 * 🏠 REVERSE GEOCODE
 * POST /api/maps/reverse-geocode
 */
router.post('/reverse-geocode', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordinate richieste' });
    }
    
    const result = await GoogleMapsService.reverseGeocode(lat, lng);
    res.json(result);
  } catch (error) {
    console.error('Errore reverse geocoding route:', GoogleMapsService.sanitizeError(error));
    res.status(500).json({ error: 'Errore reverse geocoding' });
  }
});

/**
 * 📏 CALCOLA DISTANZA
 * POST /api/maps/distance
 */
router.post('/distance', auth, async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origine e destinazione richieste' });
    }
    
    const result = await GoogleMapsService.calculateDistance(origin, destination);
    res.json(result);
  } catch (error) {
    console.error('Errore distance route:', GoogleMapsService.sanitizeError(error));
    res.status(500).json({ error: 'Errore calcolo distanza' });
  }
});

/**
 * 🔍 AUTOCOMPLETE INDIRIZZI
 * POST /api/maps/autocomplete
 */
router.post('/autocomplete', auth, async (req, res) => {
  try {
    const { input, sessionToken } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Input richiesto' });
    }
    
    if (input.length < 3) {
      return res.json({ success: true, predictions: [] });
    }
    
    const result = await GoogleMapsService.getPlacesAutocomplete(input, sessionToken);
    res.json(result);
  } catch (error) {
    console.error('Errore autocomplete route:', GoogleMapsService.sanitizeError(error));
    res.status(500).json({ error: 'Errore autocomplete' });
  }
});

/**
 * 🏠 DETTAGLI POSTO
 * POST /api/maps/place-details
 */
router.post('/place-details', auth, async (req, res) => {
  try {
    const { placeId, sessionToken } = req.body;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID richiesto' });
    }
    
    const result = await GoogleMapsService.getPlaceDetails(placeId, sessionToken);
    res.json(result);
  } catch (error) {
    console.error('Errore place details route:', GoogleMapsService.sanitizeError(error));
    res.status(500).json({ error: 'Errore dettagli posto' });
  }
});

/**
 * 🎯 TROVA PROVIDER NELLE VICINANZE
 * POST /api/maps/nearby-providers
 */
router.post('/nearby-providers', auth, async (req, res) => {
  try {
    const { userLocation, maxDistance = 20, category } = req.body;
    
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return res.status(400).json({ error: 'Posizione utente richiesta' });
    }
    
    // Query base per provider
    let serviceQuery = { isActive: true };
    if (category) {
      serviceQuery.category = category;
    }
    
    // Trova servizi attivi
    const services = await Service.find(serviceQuery)
      .populate('provider', 'name businessName location rating reviewCount')
      .lean();
    
    // Filtra per distanza e calcola costi
    const nearbyServices = [];
    
    for (const service of services) {
      const provider = service.provider;
      
      // Skip se provider non ha coordinate
      if (!provider.location?.coordinates?.lat || !provider.location?.coordinates?.lng) {
        continue;
      }
      
      // Calcola distanza
      const distance = GoogleMapsService.calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        provider.location.coordinates.lat,
        provider.location.coordinates.lng
      );
      
      // Filtra per distanza massima
      if (distance <= maxDistance) {
        // Calcola costi trasferta
        const travelCost = GoogleMapsService.calculateTravelCost(distance, service.travelCosts);
        const totalPrice = service.basePrice + travelCost;
        
        nearbyServices.push({
          ...service,
          distance: distance,
          travelCost: travelCost,
          totalPrice: totalPrice,
          provider: {
            ...provider,
            distance: distance
          }
        });
      }
    }
    
    // Ordina per distanza
    nearbyServices.sort((a, b) => a.distance - b.distance);
    
    res.json({
      success: true,
      count: nearbyServices.length,
      services: nearbyServices,
      userLocation
    });
    
  } catch (error) {
    console.error('Errore ricerca provider:', error);
    res.status(500).json({ error: 'Errore ricerca provider nelle vicinanze' });
  }
});

/**
 * 💰 CALCOLA PREVENTIVO CON TRASFERTA
 * POST /api/maps/calculate-quote
 */
router.post('/calculate-quote', auth, async (req, res) => {
  try {
    const { serviceId, userLocation } = req.body;
    
    if (!serviceId || !userLocation) {
      return res.status(400).json({ error: 'Service ID e posizione richiesti' });
    }
    
    const service = await Service.findById(serviceId)
      .populate('provider', 'name location')
      .lean();
    
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    const provider = service.provider;
    
    if (!provider.location?.coordinates?.lat || !provider.location?.coordinates?.lng) {
      return res.status(400).json({ error: 'Provider senza coordinate' });
    }
    
    // Calcola distanza usando Google Maps API per precisione
    const distanceResult = await GoogleMapsService.calculateDistance(
      provider.location.coordinates,
      userLocation
    );
    
    if (!distanceResult.success) {
      // Fallback calcolo matematico
      const distance = GoogleMapsService.calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        provider.location.coordinates.lat,
        provider.location.coordinates.lng
      );
      
      const travelCost = GoogleMapsService.calculateTravelCost(distance, service.travelCosts);
      
      return res.json({
        success: true,
        basePrice: service.basePrice,
        travelCost: travelCost,
        totalPrice: service.basePrice + travelCost,
        distance: distance,
        estimatedDuration: Math.round(distance / 50 * 60) // Stima 50km/h
      });
    }
    
    // Usa risultato Google Maps
    const travelCost = GoogleMapsService.calculateTravelCost(
      distanceResult.distance.km, 
      service.travelCosts
    );
    
    res.json({
      success: true,
      basePrice: service.basePrice,
      travelCost: travelCost,
      totalPrice: service.basePrice + travelCost,
      distance: distanceResult.distance.km,
      estimatedDuration: Math.round(distanceResult.duration.value / 60), // minuti
      travelTime: distanceResult.duration.text
    });
    
  } catch (error) {
    console.error('Errore calcolo preventivo:', error);
    res.status(500).json({ error: 'Errore calcolo preventivo' });
  }
});

/**
 * 🔧 STATUS API KEY
 * GET /api/maps/status
 */
router.get('/status', (req, res) => {
  const isConfigured = GoogleMapsService.validateApiKey();
  res.json({
    configured: isConfigured,
    message: isConfigured ? 'Google Maps API configurata' : 'Google Maps API non configurata'
  });
});

export default router;
