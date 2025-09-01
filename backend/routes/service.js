import express from 'express';
import { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  deleteService, 
  getProviderServices 
} from '../controllers/serviceController.js';

const router = express.Router();

// Rotte pubbliche
router.get('/', getServices);
router.get('/:id', getService);
router.get('/provider/:providerId', getProviderServices);

// Rotte protette (richiedono autenticazione)
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
