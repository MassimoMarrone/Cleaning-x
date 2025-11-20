import express from 'express';
import { 
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentDetails,
  calculatePaymentTotal
} from '../controllers/paymentController.js';

const router = express.Router();

// POST /api/payments/create-payment-intent - Crea un PaymentIntent per una prenotazione
router.post('/create-payment-intent', createPaymentIntent);

// POST /api/payments/confirm-payment - Conferma il pagamento dopo il processo Stripe
router.post('/confirm-payment', confirmPayment);

// POST /api/payments/webhook - Webhook per eventi Stripe (deve usare raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// GET /api/payments/booking/:bookingId - Ottieni dettagli del pagamento per una prenotazione
router.get('/booking/:bookingId', getPaymentDetails);

// POST /api/payments/calculate-total - Calcola l'anteprima del totale con commissione
router.post('/calculate-total', calculatePaymentTotal);

export default router;
