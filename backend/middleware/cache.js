// Simple in-memory cache per 1000 utenti (senza Redis)
class SimpleCache {
  constructor(ttl = 300000) { // 5 minuti default
    this.cache = new Map();
    this.ttl = ttl;
    
    // Cleanup automatico ogni 10 minuti
    setInterval(() => this.cleanup(), 600000);
  }
  
  set(key, value, customTtl = null) {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiry });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    console.log(`🧹 Cache cleanup: ${this.cache.size} items remaining`);
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxAge: this.ttl
    };
  }
}

// Cache instances per diversi tipi di dati
const serviceCache = new SimpleCache(300000); // 5 minuti per servizi
const userCache = new SimpleCache(600000);    // 10 minuti per utenti
const reviewCache = new SimpleCache(900000);  // 15 minuti per recensioni

// Middleware di cache
export const cacheMiddleware = (cacheInstance, keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    const cached = cacheInstance.get(key);
    
    if (cached) {
      console.log(`💨 Cache HIT: ${key}`);
      return res.json(cached);
    }
    
    // Intercetta la risposta JSON originale
    const originalJson = res.json;
    res.json = function(data) {
      // Salva in cache solo se la risposta è OK
      if (res.statusCode === 200 && data) {
        cacheInstance.set(key, data, ttl);
        console.log(`💾 Cache SET: ${key}`);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Cache invalidation helpers
export const invalidateCache = {
  services: () => serviceCache.clear(),
  users: () => userCache.clear(),
  reviews: () => reviewCache.clear(),
  all: () => {
    serviceCache.clear();
    userCache.clear();
    reviewCache.clear();
  }
};

export { serviceCache, userCache, reviewCache };
