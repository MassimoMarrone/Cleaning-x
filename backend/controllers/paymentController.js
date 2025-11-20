import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Costante per la percentuale di gestione (9%)
const MANAGEMENT_FEE_PERCENTAGE = 0.09;

/**
 * Calcola il totale finale includendo la commissione di gestione del 9%
 * @param {number} baseAmount - Importo base del servizio
 * @returns {number} - Importo totale arrotondato a 2 decimali
 */
const calculateTotalWithFee = (baseAmount) => {
  const managementFee = baseAmount * MANAGEMENT_FEE_PERCENTAGE;
  const total = baseAmount + managementFee;
  return Math.round(total * 100) / 100; // Arrotonda a 2 decimali
};

/**
 * Calcola la commissione di gestione
 * @param {number} baseAmount - Importo base del servizio
 * @returns {number} - Commissione di gestione arrotondata a 2 decimali
 */
const calculateManagementFee = (baseAmount) => {
  const fee = baseAmount * MANAGEMENT_FEE_PERCENTAGE;
  return Math.round(fee * 100) / 100;
};

/**
 * Crea un PaymentIntent Stripe per una prenotazione
 * POST /api/payments/create-payment-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Verifica token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Token non valido' });
    }

    // Recupera la prenotazione
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('service', 'title');

    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    // Verifica che l'utente sia il cliente della prenotazione
    if (booking.client._id.toString() !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Verifica che la prenotazione non sia già pagata
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Prenotazione già pagata' });
    }

    // Calcola il totale con la commissione di gestione del 9%
    const baseAmount = booking.totalPrice;
    const managementFee = calculateManagementFee(baseAmount);
    const totalAmount = calculateTotalWithFee(baseAmount);
    
    // Converti in centesimi per Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Crea o aggiorna il PaymentIntent
    let paymentIntent;
    
    if (booking.paymentIntentId) {
      // Aggiorna il PaymentIntent esistente
      try {
        paymentIntent = await stripe.paymentIntents.update(
          booking.paymentIntentId,
          {
            amount: amountInCents,
            metadata: {
              bookingId: booking._id.toString(),
              baseAmount: baseAmount.toString(),
              managementFee: managementFee.toString(),
              totalAmount: totalAmount.toString()
            }
          }
        );
      } catch (error) {
        // Se il PaymentIntent non esiste più, creane uno nuovo
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'eur',
          metadata: {
            bookingId: booking._id.toString(),
            clientId: booking.client._id.toString(),
            clientName: booking.client.name,
            serviceTitle: booking.service.title,
            baseAmount: baseAmount.toString(),
            managementFee: managementFee.toString(),
            totalAmount: totalAmount.toString()
          },
          description: `Pagamento per ${booking.service.title} - ${booking.client.name}`
        });
      }
    } else {
      // Crea un nuovo PaymentIntent
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        metadata: {
          bookingId: booking._id.toString(),
          clientId: booking.client._id.toString(),
          clientName: booking.client.name,
          serviceTitle: booking.service.title,
          baseAmount: baseAmount.toString(),
          managementFee: managementFee.toString(),
          totalAmount: totalAmount.toString()
        },
        description: `Pagamento per ${booking.service.title} - ${booking.client.name}`
      });
    }

    // Aggiorna la prenotazione con i dettagli del pagamento
    booking.paymentIntentId = paymentIntent.id;
    booking.paymentStatus = 'pending';
    booking.amount = amountInCents;
    booking.currency = 'eur';
    await booking.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      baseAmount: baseAmount,
      managementFee: managementFee,
      currency: 'EUR'
    });
  } catch (error) {
    console.error('Errore nella creazione del PaymentIntent:', error);
    res.status(500).json({ 
      error: 'Errore nella creazione del pagamento',
      details: error.message 
    });
  }
};

/**
 * Conferma il pagamento dopo che Stripe ha processato con successo
 * POST /api/payments/confirm-payment
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Verifica token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Token non valido' });
    }

    // Trova la prenotazione associata al PaymentIntent
    const booking = await Booking.findOne({ paymentIntentId });
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    // Verifica che l'utente sia il cliente della prenotazione
    if (booking.client.toString() !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Recupera lo stato del PaymentIntent da Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Aggiorna lo stato del pagamento nella prenotazione
    if (paymentIntent.status === 'succeeded') {
      booking.paymentStatus = 'paid';
      booking.chargeId = paymentIntent.latest_charge;
    } else if (paymentIntent.status === 'requires_action') {
      booking.paymentStatus = 'requires_action';
      booking.requiresAction = true;
    } else if (paymentIntent.status === 'canceled') {
      booking.paymentStatus = 'cancelled';
    } else {
      booking.paymentStatus = paymentIntent.status;
    }

    await booking.save();

    res.json({
      success: true,
      paymentStatus: booking.paymentStatus,
      booking: booking
    });
  } catch (error) {
    console.error('Errore nella conferma del pagamento:', error);
    res.status(500).json({ 
      error: 'Errore nella conferma del pagamento',
      details: error.message 
    });
  }
};

/**
 * Webhook per gestire gli eventi Stripe
 * POST /api/payments/webhook
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verifica la firma del webhook (se configurato)
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // In development, accetta il payload senza verifica
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci gli eventi Stripe
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentStatus = 'paid';
          booking.chargeId = paymentIntent.latest_charge;
          await booking.save();
          console.log(`✅ Pagamento confermato per booking ${bookingId}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBookingId = failedPayment.metadata.bookingId;
        
        const failedBooking = await Booking.findById(failedBookingId);
        if (failedBooking) {
          failedBooking.paymentStatus = 'failed';
          await failedBooking.save();
          console.log(`❌ Pagamento fallito per booking ${failedBookingId}`);
        }
        break;

      default:
        console.log(`Evento Stripe non gestito: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Errore nella gestione del webhook:', error);
    res.status(500).json({ error: 'Errore nella gestione del webhook' });
  }
};

/**
 * Ottieni i dettagli del pagamento per una prenotazione
 * GET /api/payments/booking/:bookingId
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Verifica token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Autenticazione richiesta' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Token non valido' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    // Verifica che l'utente sia il cliente o il provider della prenotazione
    if (booking.client.toString() !== userId && booking.provider.toString() !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const baseAmount = booking.totalPrice;
    const managementFee = calculateManagementFee(baseAmount);
    const totalAmount = calculateTotalWithFee(baseAmount);

    res.json({
      paymentIntentId: booking.paymentIntentId,
      paymentStatus: booking.paymentStatus,
      baseAmount: baseAmount,
      managementFee: managementFee,
      totalAmount: totalAmount,
      currency: booking.currency || 'EUR',
      chargeId: booking.chargeId
    });
  } catch (error) {
    console.error('Errore nel recupero dei dettagli del pagamento:', error);
    res.status(500).json({ 
      error: 'Errore nel recupero dei dettagli del pagamento',
      details: error.message 
    });
  }
};

/**
 * Calcola l'anteprima del pagamento con commissione di gestione
 * POST /api/payments/calculate-total
 */
export const calculatePaymentTotal = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    const managementFee = calculateManagementFee(amount);
    const totalAmount = calculateTotalWithFee(amount);

    res.json({
      baseAmount: amount,
      managementFee: managementFee,
      managementFeePercentage: MANAGEMENT_FEE_PERCENTAGE * 100,
      totalAmount: totalAmount,
      currency: 'EUR'
    });
  } catch (error) {
    console.error('Errore nel calcolo del totale:', error);
    res.status(500).json({ 
      error: 'Errore nel calcolo del totale',
      details: error.message 
    });
  }
};
