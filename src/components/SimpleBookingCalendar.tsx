import React, { useState, useEffect } from 'react';
import AvailabilityChecker from './AvailabilityChecker';
import '../styles/SimpleBookingCalendar.css';

interface SimpleBookingCalendarProps {
  providerId: string;
  providerName: string;
  onDateTimeSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

const SimpleBookingCalendar: React.FC<SimpleBookingCalendarProps> = ({
  providerId,
  providerName,
  onDateTimeSelect,
  selectedDate,
  selectedTime
}) => {
  const [currentDate, setCurrentDate] = useState<string>(selectedDate || '');
  const [currentTime, setCurrentTime] = useState<string>(selectedTime || '');

  // Genera il minimo e massimo per l'input date
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 mesi

  useEffect(() => {
    if (currentDate && currentTime) {
      onDateTimeSelect(currentDate, currentTime);
    }
  }, [currentDate, currentTime, onDateTimeSelect]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateStr = e.target.value;
    
    // Verifica che non sia domenica (0 = domenica)
    const selectedDateObj = new Date(selectedDateStr);
    if (selectedDateObj.getDay() === 0) {
      alert('La domenica non è disponibile per le prenotazioni.');
      return;
    }
    
    setCurrentDate(selectedDateStr);
    setCurrentTime(''); // Reset time when date changes
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const clearSelection = () => {
    setCurrentDate('');
    setCurrentTime('');
  };

  return (
    <div className="simple-booking-calendar">
      <div className="calendar-header">
        <h3>📅 Prenota con {providerName}</h3>
        <p>Seleziona data e orario per la tua prenotazione</p>
      </div>

      <div className="calendar-main-content">
        <div className="date-selection-section">
          <div className="date-input-wrapper">
            <label htmlFor="booking-date" className="date-label">
              Scegli la Data
            </label>
            
            <div className="date-input-container">
              <input
                type="date"
                id="booking-date"
                value={currentDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDate}
                className="modern-date-input"
                placeholder="Seleziona una data"
              />
            </div>

            {currentDate && (
              <div className="selected-date-info">
                <div className="date-display">
                  <span className="date-icon">📆</span>
                  <span className="date-text">{formatDateForDisplay(currentDate)}</span>
                </div>
                <button 
                  onClick={clearSelection}
                  className="clear-date-btn"
                  title="Cancella selezione"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="calendar-info-section">
          <div className="info-card">
            <h4>ℹ️ Informazioni Prenotazione</h4>
            <ul>
              <li>🕐 Durata servizio: ~2 ore</li>
              <li>📅 Prenotazioni fino a 3 mesi</li>
              <li>❌ Domenica non disponibile</li>
              <li>🔄 Orari: 9:00 - 17:00</li>
              <li>⏰ Slot ogni 2 ore</li>
            </ul>
          </div>
        </div>
      </div>

      {currentDate && providerId && (
        <div className="availability-section">
          <AvailabilityChecker
            providerId={providerId}
            selectedDate={currentDate}
            selectedTime={currentTime}
            onTimeSelect={setCurrentTime}
            onAvailabilityChange={() => {}} // Gestito internamente
          />
        </div>
      )}

      {currentDate && currentTime && (
        <div className="booking-summary">
          <div className="summary-card">
            <h4>✅ Riepilogo Prenotazione</h4>
            <div className="summary-details">
              <div className="summary-item">
                <span className="summary-label">👤 Fornitore:</span>
                <span className="summary-value">{providerName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">📅 Data:</span>
                <span className="summary-value">{formatDateForDisplay(currentDate)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🕐 Orario:</span>
                <span className="summary-value">{currentTime}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">⏱️ Durata:</span>
                <span className="summary-value">~2 ore</span>
              </div>
            </div>
            <div className="summary-status">
              <span className="status-badge available">
                ✅ Slot Disponibile
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBookingCalendar;
