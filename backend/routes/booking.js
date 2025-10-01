import express from 'express';
import { 
  getBookings, 
  createBooking, 
  updateBookingStatus, 
  getProviderBookings, 
  getClientBookings, 
  cancelBooking,
  checkAvailability,
  submitCompletionProof
} from '../controllers/bookingController.js';

const router = express.Router();

// GET /api/bookings - Ottieni prenotazioni (richiede autenticazione)
router.get('/', getBookings);

// GET /api/bookings/provider - Ottieni prenotazioni per dashboard fornitore
router.get('/provider', getProviderBookings);

// GET /api/bookings/client - Ottieni prenotazioni per dashboard cliente
router.get('/client', getClientBookings);

// GET /api/bookings/availability/:providerId/:date - Controlla disponibilità
router.get('/availability/:providerId/:date', checkAvailability);

// POST /api/bookings - Crea nuova prenotazione (richiede autenticazione)
router.post('/', createBooking);

// PUT /api/bookings/:id/status - Aggiorna status prenotazione (solo per provider)
router.put('/:id/status', updateBookingStatus);

// PUT /api/bookings/:id/complete - Invia prova di completamento e chiudi la prenotazione
router.put('/:id/complete', submitCompletionProof);

// PUT /api/bookings/:id/cancel - Annulla prenotazione (solo per client)
router.put('/:id/cancel', cancelBooking);

export default router;
