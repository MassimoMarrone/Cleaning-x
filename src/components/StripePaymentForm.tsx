import { useState, useEffect } from 'react';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';
import '../styles/StripePaymentForm.css';

// Carica la chiave pubblica Stripe (da sostituire con la chiave reale)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  baseAmount: number;
  managementFee: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Conferma il pagamento con Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Errore nel pagamento');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Conferma il pagamento nel backend
        const token = localStorage.getItem('token');
        if (token) {
          await confirmPayment(paymentIntent.id, token);
        }
        
        onSuccess();
      }
    } catch (error) {
      console.error('Errore nel processo di pagamento:', error);
      setErrorMessage('Errore nel processo di pagamento. Riprova.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <PaymentElement />
      
      {errorMessage && (
        <div className="payment-error">
          {errorMessage}
        </div>
      )}
      
      <div className="payment-actions">
        <button
          type="button"
          onClick={onCancel}
          className="cancel-payment-btn"
          disabled={isProcessing}
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="submit-payment-btn"
        >
          {isProcessing ? 'Elaborazione...' : `Paga €${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function StripePaymentForm({
  bookingId,
  amount,
  baseAmount,
  managementFee,
  onSuccess,
  onCancel
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Devi effettuare il login per procedere con il pagamento');
          setLoading(false);
          return;
        }

        const response = await createPaymentIntent(bookingId, token);
        setClientSecret(response.clientSecret);
        setLoading(false);
      } catch (err) {
        console.error('Errore nell\'inizializzazione del pagamento:', err);
        setError('Errore nell\'inizializzazione del pagamento');
        setLoading(false);
      }
    };

    initializePayment();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="payment-loading">
        <div className="spinner"></div>
        <p>Caricamento modulo di pagamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-error-container">
        <p>{error}</p>
        <button onClick={onCancel} className="cancel-payment-btn">
          Torna indietro
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="payment-error-container">
        <p>Impossibile caricare il modulo di pagamento</p>
        <button onClick={onCancel} className="cancel-payment-btn">
          Torna indietro
        </button>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0066ff',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h3>💳 Completa il Pagamento</h3>
        <div className="payment-summary-compact">
          <div className="summary-row">
            <span>Prezzo servizio:</span>
            <span>€{baseAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row management-fee">
            <span>Costi di gestione (9%):</span>
            <span>€{managementFee.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span><strong>Totale:</strong></span>
            <span><strong>€{amount.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          bookingId={bookingId}
          amount={amount}
          baseAmount={baseAmount}
          managementFee={managementFee}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
      
      <div className="payment-security-note">
        <span className="security-icon">🔒</span>
        <p>Il tuo pagamento è protetto da crittografia SSL</p>
      </div>
    </div>
  );
}
