import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSwitcher from '../components/RoleSwitcher';
import BookingChatButton from '../components/BookingChatButton';
import '../styles/ClientDashboard.css';

interface Booking {
  _id: string;
  providerId?: string;
  providerName: string;
  providerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  additionalServices: Array<{
    name: string;
    price: number;
  }>;
  notes?: string;
  createdAt: string;
}

const ClientDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/bookings/client', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        console.error('Errore nel caricamento delle prenotazioni');
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm('Sei sicuro di voler annullare questa prenotazione?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchBookings(); // Ricarica le prenotazioni
      } else {
        console.error('Errore nell\'annullamento della prenotazione');
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'in_progress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Attesa di Conferma';
      case 'accepted': return 'Confermata';
      case 'in_progress': return 'In Corso';
      case 'completed': return 'Completata';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Il fornitore deve ancora confermare la tua prenotazione.';
      case 'accepted': return 'Il fornitore ha confermato la prenotazione. Ti contatterà presto!';
      case 'in_progress': return 'Il servizio è attualmente in corso.';
      case 'completed': return 'Il servizio è stato completato con successo.';
      case 'cancelled': return 'Questa prenotazione è stata annullata.';
      default: return '';
    }
  };

  const filteredBookings = () => {
    switch (activeTab) {
      case 'active':
        return bookings.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status));
      case 'completed':
        return bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
      case 'all':
      default:
        return bookings;
    }
  };

  const activeBookings = bookings.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  if (loading) {
    return <div className="loading">Caricamento dashboard...</div>;
  }

  return (
    <div className="client-dashboard">
      <header className="dashboard-header">
        <h1>Le Mie Prenotazioni</h1>
        <div className="header-actions">
          <RoleSwitcher currentRole="client" variant="toggle" />
          <button 
            className="btn-primary"
            onClick={() => navigate('/services')}
          >
            Prenota Nuovo Servizio
          </button>
        </div>
      </header>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Prenotazioni Attive</h3>
          <div className="stat-number active">{activeBookings.length}</div>
        </div>
        <div className="stat-card">
          <h3>Prenotazioni Completate</h3>
          <div className="stat-number completed">{completedBookings.length}</div>
        </div>
        <div className="stat-card">
          <h3>Totale Prenotazioni</h3>
          <div className="stat-number">{bookings.length}</div>
        </div>
      </div>

      <div className="bookings-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Attive ({activeBookings.length})
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completate ({completedBookings.length})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tutte ({bookings.length})
          </button>
        </div>

        <div className="bookings-list">
          {filteredBookings().length === 0 ? (
            <div className="no-bookings">
              <h3>Nessuna prenotazione trovata</h3>
              <p>Non hai ancora effettuato prenotazioni in questa categoria.</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/services')}
              >
                Prenota il tuo primo servizio
              </button>
            </div>
          ) : (
            filteredBookings().map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-info">
                    <h3>{booking.serviceName}</h3>
                    <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  <div className="booking-price">€{booking.totalPrice}</div>
                </div>
                
                <div className="status-message">
                  {getStatusMessage(booking.status)}
                </div>
                
                <div className="booking-details">
                  <div className="detail-row">
                    <strong>Fornitore:</strong> {booking.providerName}
                  </div>
                  <div className="detail-row">
                    <strong>Data e Ora:</strong> {new Date(booking.date).toLocaleDateString('it-IT')} alle {booking.time}
                  </div>
                  <div className="detail-row">
                    <strong>Indirizzo:</strong> {booking.address}
                  </div>
                  
                  {booking.additionalServices && booking.additionalServices.length > 0 && (
                    <div className="detail-row">
                      <strong>Servizi Aggiuntivi:</strong>
                      <ul className="additional-services">
                        {booking.additionalServices.map((service, index) => (
                          <li key={index}>{service.name} (+€{service.price})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {booking.notes && (
                    <div className="detail-row">
                      <strong>Note:</strong> {booking.notes}
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <strong>Prenotato il:</strong> {new Date(booking.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>

                <div className="booking-actions">
                  {/* Chat tra cliente e provider per questa prenotazione */}
                  {booking.providerId && (
                    <BookingChatButton otherUserId={booking.providerId} bookingId={booking._id} />
                  )}
                  {(booking.status === 'pending' || booking.status === 'accepted') && (
                    <button 
                      className="btn-danger"
                      onClick={() => cancelBooking(booking._id)}
                    >
                      Annulla Prenotazione
                    </button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate(`/write-review/${booking._id}`)}
                    >
                      Lascia una Recensione
                    </button>
                  )}
                  
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate(`/booking/${booking._id}`)}
                  >
                    Visualizza Dettagli
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
