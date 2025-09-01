import express from 'express';
import { 
  createReview,
  getProviderReviews,
  getServiceReviews,
  canReview,
  getReviewableBookings
} from '../controllers/reviewController.js';

const router = express.Router();

// POST /api/reviews - Crea una nuova recensione
router.post('/', createReview);

// GET /api/reviews/provider/:providerId - Ottieni recensioni per un fornitore
router.get('/provider/:providerId', getProviderReviews);

// GET /api/reviews/service/:serviceId - Ottieni recensioni per un servizio
router.get('/service/:serviceId', getServiceReviews);

// GET /api/reviews/can-review/:bookingId - Verifica se può recensire
router.get('/can-review/:bookingId', canReview);

// GET /api/reviews/reviewable - Ottieni prenotazioni recensibili
router.get('/reviewable', getReviewableBookings);

export default router;
