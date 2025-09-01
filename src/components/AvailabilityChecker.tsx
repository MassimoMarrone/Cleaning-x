import React, { useState, useEffect } from 'react';
import '../styles/AvailabilityChecker.css';

interface AvailabilityCheckerProps {
  providerId: string;
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  onAvailabilityChange: (isAvailable: boolean) => void;
}

interface AvailabilityData {
  date: string;
  provider: {
    id: string;
    name: string;
  };
  availableSlots: string[];
  totalSlots: number;
}

const AvailabilityChecker: React.FC<AvailabilityCheckerProps> = ({
  providerId,
  selectedDate,
  selectedTime,
  onTimeSelect,
  onAvailabilityChange
}) => {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<string>('');

  useEffect(() => {
    if (providerId && selectedDate) {
      checkAvailability();
    }
  }, [providerId, selectedDate]);

  // Auto-refresh ogni 30 secondi per sincronizzare con altre prenotazioni
  useEffect(() => {
    const interval = setInterval(() => {
      if (providerId && selectedDate) {
        checkAvailability(true); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [providerId, selectedDate]);

  const checkAvailability = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:8080/api/bookings/availability/${providerId}/${selectedDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
        setLastChecked(new Date().toLocaleTimeString('it-IT'));
        
        // Notifica il parent component se l'orario selezionato è ancora disponibile
        const isCurrentTimeAvailable = data.availableSlots.includes(selectedTime);
        onAvailabilityChange(isCurrentTimeAvailable);
        
        // Se l'orario selezionato non è più disponibile, reset la selezione
        if (selectedTime && !isCurrentTimeAvailable) {
          onTimeSelect('');
        }
      } else {
        throw new Error('Errore nel controllo disponibilità');
      }
    } catch (err) {
      console.error('Errore:', err);
      setError('Errore nel controllo disponibilità');
      onAvailabilityChange(false);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (availability?.availableSlots.includes(time)) {
      onTimeSelect(time);
      onAvailabilityChange(true);
    }
  };

  const getTimeStatus = (time: string) => {
    if (!availability) return 'unknown';
    if (availability.availableSlots.includes(time)) {
      return selectedTime === time ? 'selected' : 'available';
    }
    return 'booked';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="availability-checker">
        <div className="loading-availability">
          <div className="spinner"></div>
          <span>Controllo disponibilità...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="availability-checker">
        <div className="error-availability">
          <span>⚠️ {error}</span>
          <button onClick={() => checkAvailability()} className="retry-btn">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="availability-checker">
        <div className="no-availability">
          Seleziona una data per vedere gli orari disponibili
        </div>
      </div>
    );
  }

  return (
    <div className="availability-checker">
      <div className="availability-header">
        <h3>Orari Disponibili</h3>
        <div className="availability-info">
          <div className="date-info">
            📅 {formatDate(selectedDate)}
          </div>
          <div className="provider-info">
            👤 {availability.provider.name}
          </div>
          <div className="last-checked">
            🔄 Aggiornato: {lastChecked}
          </div>
        </div>
      </div>

      <div className="availability-stats">
        <div className="stat">
          <span className="stat-number">{availability.availableSlots.length}</span>
          <span className="stat-label">Slot Disponibili</span>
        </div>
        <div className="stat">
          <span className="stat-number">{availability.totalSlots - availability.availableSlots.length}</span>
          <span className="stat-label">Slot Prenotati</span>
        </div>
      </div>

      <div className="time-slots">
        {['09:00', '11:00', '13:00', '15:00', '17:00'].map((time) => {
          const status = getTimeStatus(time);
          return (
            <button
              key={time}
              className={`time-slot ${status}`}
              onClick={() => handleTimeSelect(time)}
              disabled={status === 'booked'}
            >
              <span className="time-text">{time}</span>
              <span className="status-indicator">
                {status === 'available' && '✅'}
                {status === 'selected' && '⭐'}
                {status === 'booked' && '❌'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="availability-legend">
        <div className="legend-item">
          <span className="legend-color available"></span>
          <span>Disponibile</span>
        </div>
        <div className="legend-item">
          <span className="legend-color selected"></span>
          <span>Selezionato</span>
        </div>
        <div className="legend-item">
          <span className="legend-color booked"></span>
          <span>Prenotato</span>
        </div>
      </div>

      <div className="availability-actions">
        <button 
          onClick={() => checkAvailability()} 
          className="refresh-btn"
        >
          🔄 Aggiorna Disponibilità
        </button>
      </div>
    </div>
  );
};

export default AvailabilityChecker;
