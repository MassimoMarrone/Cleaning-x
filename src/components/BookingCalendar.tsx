import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AvailabilityChecker from './AvailabilityChecker';
import '../styles/BookingCalendar.css';

interface BookingCalendarProps {
  providerId: string;
  providerName: string;
  onDateTimeSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  providerId,
  providerName,
  onDateTimeSelect,
  selectedDate,
  selectedTime
}) => {
  const [calendarDate, setCalendarDate] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  );
  const [formattedDate, setFormattedDate] = useState<string>(selectedDate || '');
  const [currentTime, setCurrentTime] = useState<string>(selectedTime || '');
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Date validation
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // 3 mesi nel futuro

  // Giorni della settimana disabilitati (es. domenica = 0)
  const disabledDays = [0]; // Domenica disabilitata

  useEffect(() => {
    if (calendarDate) {
      const formatted = formatDateForAPI(calendarDate);
      setFormattedDate(formatted);
    }
  }, [calendarDate]);

  useEffect(() => {
    if (formattedDate && currentTime && isAvailable) {
      onDateTimeSelect(formattedDate, currentTime);
    }
  }, [formattedDate, currentTime, isAvailable, onDateTimeSelect]);

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    // Disabilita domeniche e giorni passati
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return disabledDays.includes(day) || date < today;
  };

  const handleDateChange = (date: Date | null) => {
    setCalendarDate(date);
    setCurrentTime(''); // Reset time selection
    setIsAvailable(false);
    setCalendarOpen(false);
  };

  const handleTimeSelect = (time: string) => {
    setCurrentTime(time);
  };

  const handleAvailabilityChange = (available: boolean) => {
    setIsAvailable(available);
  };

  const clearSelection = () => {
    setCalendarDate(null);
    setFormattedDate('');
    setCurrentTime('');
    setIsAvailable(false);
  };

  // Custom input per il DatePicker
  const CustomInput = React.forwardRef<HTMLButtonElement, any>(({ value, onClick }, ref) => (
    <button 
      className="calendar-input"
      onClick={(e) => {
        e.preventDefault();
        setCalendarOpen(true);
        if (onClick) onClick(e);
      }}
      ref={ref}
      type="button"
    >
      <span className="calendar-icon">📅</span>
      <span className="calendar-text">
        {value || 'Seleziona una data'}
      </span>
      <span className="calendar-arrow">▼</span>
    </button>
  ));

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <h3>📅 Prenota con {providerName}</h3>
        <p>Seleziona data e orario per la tua prenotazione</p>
      </div>

      <div className="calendar-section">
        <div className="calendar-wrapper">
          <label htmlFor="date-picker" className="calendar-label">
            Scegli la Data
          </label>
          
                    <DatePicker
            selected={calendarDate}
            onChange={handleDateChange}
            customInput={<CustomInput />}
            dateFormat="dd/MM/yyyy"
            minDate={minDate}
            maxDate={maxDate}
            filterDate={(date) => !isDateDisabled(date)}
            locale="it"
            placeholderText="Clicca per aprire il calendario"
            open={calendarOpen}
            onClickOutside={() => setCalendarOpen(false)}
            onCalendarOpen={() => setCalendarOpen(true)}
            onCalendarClose={() => setCalendarOpen(false)}
            dayClassName={(date) => {
              const today = new Date();
              if (date.toDateString() === today.toDateString()) {
                return 'today';
              }
              if (isDateDisabled(date)) {
                return 'disabled-day';
              }
              return '';
            }}
            calendarClassName="custom-calendar"
            popperClassName="calendar-popper"
            weekDayClassName={() => 'custom-weekday'}
            monthClassName={() => 'custom-month'}
            shouldCloseOnSelect={true}
            showPopperArrow={false}
          />

          {calendarDate && (
            <div className="selected-date-info">
              <div className="date-display">
                <span className="date-icon">📆</span>
                <span className="date-text">{formatDateForDisplay(calendarDate)}</span>
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

        <div className="calendar-info">
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

      {formattedDate && providerId && (
        <div className="availability-section">
          <AvailabilityChecker
            providerId={providerId}
            selectedDate={formattedDate}
            selectedTime={currentTime}
            onTimeSelect={handleTimeSelect}
            onAvailabilityChange={handleAvailabilityChange}
          />
        </div>
      )}

      {formattedDate && currentTime && isAvailable && (
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
                <span className="summary-value">{formatDateForDisplay(calendarDate!)}</span>
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

export default BookingCalendar;
