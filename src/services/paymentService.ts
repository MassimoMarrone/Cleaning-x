const API_BASE_URL = 'http://localhost:8080/api';

interface PaymentCalculation {
  baseAmount: number;
  managementFee: number;
  managementFeePercentage: number;
  totalAmount: number;
  currency: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  baseAmount: number;
  managementFee: number;
  currency: string;
}

interface PaymentConfirmation {
  success: boolean;
  paymentStatus: string;
  booking: any;
}

interface PaymentDetails {
  paymentIntentId?: string;
  paymentStatus: string;
  baseAmount: number;
  managementFee: number;
  totalAmount: number;
  currency: string;
  chargeId?: string;
}

/**
 * Calcola il totale con la commissione di gestione del 9%
 */
export const calculatePaymentTotal = async (amount: number): Promise<PaymentCalculation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/calculate-total`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount })
    });

    if (!response.ok) {
      throw new Error('Errore nel calcolo del totale');
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nel calcolo del totale:', error);
    throw error;
  }
};

/**
 * Crea un PaymentIntent per una prenotazione
 */
export const createPaymentIntent = async (bookingId: string, token: string): Promise<PaymentIntentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nella creazione del pagamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nella creazione del PaymentIntent:', error);
    throw error;
  }
};

/**
 * Conferma il pagamento dopo il processo Stripe
 */
export const confirmPayment = async (paymentIntentId: string, token: string): Promise<PaymentConfirmation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentIntentId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nella conferma del pagamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nella conferma del pagamento:', error);
    throw error;
  }
};

/**
 * Ottieni i dettagli del pagamento per una prenotazione
 */
export const getPaymentDetails = async (bookingId: string, token: string): Promise<PaymentDetails> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nel recupero dei dettagli del pagamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Errore nel recupero dei dettagli del pagamento:', error);
    throw error;
  }
};
