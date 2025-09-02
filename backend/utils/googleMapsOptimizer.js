/**
 * 🎯 IMPLEMENTAZIONE OTTIMIZZAZIONI GOOGLE MAPS
 * Strategie per minimizzare costi API
 */

import NodeCache from 'node-cache';

class GoogleMapsOptimizer {
  constructor() {
    // Cache per 24 ore
    this.cache = new NodeCache({ stdTTL: 86400 });
    this.debounceTimers = new Map();
  }

  /**
   * 🗺️ CACHE GEOCODING RESULTS
   */
  async cachedGeocode(address, geocodeFunction) {
    const cacheKey = `geocode_${address.toLowerCase().trim()}`;
    
    // Controlla cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('🟢 Cache hit - Geocoding:', address);
      return cached;
    }
    
    // Chiamata API
    console.log('🔴 API call - Geocoding:', address);
    const result = await geocodeFunction(address);
    
    // Salva in cache se successo
    if (result.success) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * 📏 CACHE DISTANCE CALCULATIONS
   */
  async cachedDistance(origin, destination, distanceFunction) {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
    const cacheKey = `distance_${originStr}_${destStr}`;
    
    // Controlla cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('🟢 Cache hit - Distance calculation');
      return cached;
    }
    
    // Chiamata API
    console.log('🔴 API call - Distance calculation');
    const result = await distanceFunction(origin, destination);
    
    // Salva in cache se successo
    if (result.success) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * 🔍 DEBOUNCED AUTOCOMPLETE
   */
  debouncedAutocomplete(query, callback, delay = 300) {
    const timerId = this.debounceTimers.get('autocomplete');
    
    if (timerId) {
      clearTimeout(timerId);
    }
    
    const newTimerId = setTimeout(() => {
      if (query.length >= 3) {
        console.log('🔍 Autocomplete API call:', query);
        callback(query);
      }
      this.debounceTimers.delete('autocomplete');
    }, delay);
    
    this.debounceTimers.set('autocomplete', newTimerId);
  }

  /**
   * 📊 BATCH DISTANCE CALCULATIONS
   */
  async batchDistanceCalculation(origins, destinations, distanceFunction) {
    // Google Distance Matrix supporta fino a 25 origins e 25 destinations
    const maxBatchSize = 25;
    const results = [];
    
    for (let i = 0; i < origins.length; i += maxBatchSize) {
      const originBatch = origins.slice(i, i + maxBatchSize);
      
      for (let j = 0; j < destinations.length; j += maxBatchSize) {
        const destBatch = destinations.slice(j, j + maxBatchSize);
        
        console.log(`🔴 Batch API call - ${originBatch.length}x${destBatch.length} calculations`);
        const batchResult = await distanceFunction(originBatch, destBatch);
        results.push(batchResult);
      }
    }
    
    return results;
  }

  /**
   * 📈 USAGE STATISTICS
   */
  getUsageStats() {
    const stats = this.cache.getStats();
    return {
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) * 100,
      cachedKeys: stats.keys,
      estimatedSavings: `$${((stats.hits * 0.005) / 1000).toFixed(2)}/mese` // Stima risparmio
    };
  }
}

export default GoogleMapsOptimizer;
