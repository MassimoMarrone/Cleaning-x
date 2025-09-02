import express from 'express';
import { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  deleteService, 
  getProviderServices 
} from '../controllers/serviceController.js';
import { cacheMiddleware, serviceCache, invalidateCache } from '../middleware/cache.js';

const router = express.Router();

// Cache key generators
const serviceListKey = (req) => `services:${JSON.stringify(req.query)}`;
const serviceDetailKey = (req) => `service:${req.params.id}`;
const providerServicesKey = (req) => `provider_services:${req.params.providerId}`;

// Rotte pubbliche con cache
router.get('/', cacheMiddleware(serviceCache, serviceListKey, 300000), getServices); // 5 min cache
router.get('/:id', cacheMiddleware(serviceCache, serviceDetailKey, 600000), getService); // 10 min cache
router.get('/provider/:providerId', cacheMiddleware(serviceCache, providerServicesKey, 300000), getProviderServices);

// Rotte protette (richiedono autenticazione) con cache invalidation
router.post('/', createService, (req, res, next) => {
  invalidateCache.services(); // Invalida cache quando si crea un servizio
  next();
});

router.put('/:id', updateService, (req, res, next) => {
  invalidateCache.services(); // Invalida cache quando si aggiorna un servizio
  next();
});

router.delete('/:id', deleteService, (req, res, next) => {
  invalidateCache.services(); // Invalida cache quando si elimina un servizio
  next();
});

export default router;
