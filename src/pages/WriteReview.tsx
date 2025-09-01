import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/WriteReview.css';

interface BookingDetails {
  _id: string;
  serviceName: string;
  providerName: string;
  date: string;
  totalPrice: number;
}

const WriteReview: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    aspects: {
      punctuality: 0,
      quality: 0,
      communication: 0,
      value: 0
    }
  });

  useEffect(() => {
    if (bookingId) {
      checkCanReview();
      fetchBookingDetails();
    }
  }, [bookingId]);

  const checkCanReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/reviews/can-review/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.canReview) {
        setCanReview(true);
      } else {
        alert(data.reason || 'Non puoi recensire questa prenotazione');
        navigate('/client-dashboard');
      }
    } catch (error) {
      console.error('Errore verifica recensione:', error);
      navigate('/client-dashboard');
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/client`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const targetBooking = data.bookings.find((b: any) => b._id === bookingId);
        
        if (targetBooking) {
          setBooking({
            _id: targetBooking._id,
            serviceName: targetBooking.serviceName,
            providerName: targetBooking.providerName,
            date: targetBooking.date,
            totalPrice: targetBooking.totalPrice
          });
        }
      }
    } catch (error) {
      console.error('Errore caricamento prenotazione:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleAspectRatingChange = (aspect: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      aspects: {
        ...prev.aspects,
        [aspect]: rating
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      alert('Seleziona una valutazione generale');
      return;
    }

    if (formData.comment.trim().length < 10) {
      alert('Il commento deve essere di almeno 10 caratteri');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          ...formData
        })
      });

      if (response.ok) {
        alert('Recensione pubblicata con successo!');
        navigate('/client-dashboard');
      } else {
        const error = await response.json();
        alert(error.error || 'Errore nella pubblicazione della recensione');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`star ${star <= currentRating ? 'active' : ''}`}
            onClick={() => onRatingChange(star)}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  if (!canReview || !booking) {
    return <div className="error">Impossibile caricare la recensione</div>;
  }

  return (
    <div className="write-review">
      <header className="review-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/client-dashboard')}
        >
          ← Torna alla Dashboard
        </button>
        <h1>Scrivi una Recensione</h1>
      </header>

      <div className="booking-summary">
        <h2>📋 Dettagli Servizio</h2>
        <div className="summary-content">
          <div className="summary-item">
            <strong>Servizio:</strong> {booking.serviceName}
          </div>
          <div className="summary-item">
            <strong>Fornitore:</strong> {booking.providerName}
          </div>
          <div className="summary-item">
            <strong>Data:</strong> {new Date(booking.date).toLocaleDateString('it-IT')}
          </div>
          <div className="summary-item">
            <strong>Prezzo:</strong> €{booking.totalPrice}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-section">
          <h3>⭐ Valutazione Generale</h3>
          <p>Quanto sei soddisfatto del servizio ricevuto?</p>
          {renderStars(formData.rating, handleRatingChange)}
          <div className="rating-labels">
            <span>Pessimo</span>
            <span>Eccellente</span>
          </div>
        </div>

        <div className="form-section">
          <h3>📊 Valutazioni Dettagliate</h3>
          <div className="aspects-grid">
            <div className="aspect-item">
              <label>Puntualità</label>
              {renderStars(formData.aspects.punctuality, (rating) => handleAspectRatingChange('punctuality', rating))}
            </div>
            <div className="aspect-item">
              <label>Qualità del Lavoro</label>
              {renderStars(formData.aspects.quality, (rating) => handleAspectRatingChange('quality', rating))}
            </div>
            <div className="aspect-item">
              <label>Comunicazione</label>
              {renderStars(formData.aspects.communication, (rating) => handleAspectRatingChange('communication', rating))}
            </div>
            <div className="aspect-item">
              <label>Rapporto Qualità/Prezzo</label>
              {renderStars(formData.aspects.value, (rating) => handleAspectRatingChange('value', rating))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>💬 Il Tuo Commento</h3>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Racconta la tua esperienza... Cosa è andato bene? Cosa potrebbe essere migliorato?"
            rows={6}
            required
            minLength={10}
          />
          <div className="char-count">
            {formData.comment.length}/500 caratteri
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/client-dashboard')}
          >
            Annulla
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting || formData.rating === 0}
          >
            {submitting ? '⏳ Pubblicando...' : '🚀 Pubblica Recensione'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteReview;
