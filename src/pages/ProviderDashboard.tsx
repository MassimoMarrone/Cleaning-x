import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSwitcher from '../components/RoleSwitcher';
import '../styles/ProviderDashboard.css';

interface Booking {
  _id: string;
  clientName: string;
  clientEmail: string;
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

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
}

interface Service {
  _id: string;
  title: string;
  category: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

const ProviderDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providerId, setProviderId] = useState<string>('');
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed' | 'all'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
    fetchServices();
  }, [navigate]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setProviderId(userData.user._id); // Salva l'ID del provider
        const servicesResponse = await fetch(`http://localhost:8080/api/services/provider/${userData.user._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData);
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/bookings/provider', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        calculateStats(data.bookings || []);
      } else {
        console.error('Errore nel caricamento delle prenotazioni');
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookings: Booking[]) => {
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      totalEarnings: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + booking.totalPrice, 0)
    };
    setStats(stats);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchBookings(); // Ricarica le prenotazioni
      } else {
        console.error('Errore nell\'aggiornamento dello stato');
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
      case 'pending': return 'In Attesa';
      case 'accepted': return 'Accettata';
      case 'in_progress': return 'In Corso';
      case 'completed': return 'Completata';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const filteredBookings = activeTab === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === activeTab);

  if (loading) {
    return <div className="loading">Caricamento dashboard...</div>;
  }

  return (
    <div className="provider-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard Fornitore</h1>
        <div className="header-actions">
          <RoleSwitcher currentRole="provider" variant="toggle" />
          <button 
            className="btn-success"
            onClick={() => navigate('/publish-service')}
          >
            📝 Pubblica Servizio
          </button>
          {providerId && (
            <button 
              className="btn-primary"
              onClick={() => navigate(`/reviews/${providerId}`)}
            >
              ⭐ Le Mie Recensioni
            </button>
          )}
          <button 
            className="btn-secondary"
            onClick={() => navigate('/services')}
          >
            Torna ai Servizi
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Prenotazioni Totali</h3>
          <div className="stat-number">{stats.totalBookings}</div>
        </div>
        <div className="stat-card">
          <h3>In Attesa</h3>
          <div className="stat-number pending">{stats.pendingBookings}</div>
        </div>
        <div className="stat-card">
          <h3>Completate</h3>
          <div className="stat-number completed">{stats.completedBookings}</div>
        </div>
        <div className="stat-card">
          <h3>Guadagni Totali</h3>
          <div className="stat-number earnings">€{stats.totalEarnings}</div>
        </div>
        <div className="stat-card">
          <h3>Servizi Pubblicati</h3>
          <div className="stat-number">{services.length}</div>
        </div>
      </div>

      <div className="services-section">
        <div className="section-header">
          <h2>I Tuoi Servizi</h2>
          <button 
            className="btn-primary"
            onClick={() => navigate('/publish-service')}
          >
            ➕ Nuovo Servizio
          </button>
        </div>
        
        {services.length === 0 ? (
          <div className="no-services">
            <h3>Nessun servizio pubblicato</h3>
            <p>Inizia a pubblicare i tuoi servizi per ricevere prenotazioni!</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/publish-service')}
            >
              📝 Pubblica il tuo primo servizio
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <div key={service._id} className="service-card">
                <div className="service-header">
                  <h3>{service.title}</h3>
                  <span className={`service-status ${service.isActive ? 'active' : 'inactive'}`}>
                    {service.isActive ? '🟢 Attivo' : '🔴 Inattivo'}
                  </span>
                </div>
                <div className="service-details">
                  <p className="service-category">{service.category}</p>
                  <p className="service-price">€{service.basePrice}</p>
                  <p className="service-date">
                    Pubblicato: {new Date(service.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="service-actions">
                  <button className="btn-secondary">✏️ Modifica</button>
                  <button className="btn-danger">🗑️ Elimina</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bookings-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            In Attesa ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button 
            className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Accettate ({bookings.filter(b => b.status === 'accepted').length})
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completate ({bookings.filter(b => b.status === 'completed').length})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tutte ({bookings.length})
          </button>
        </div>

        <div className="bookings-list">
          {filteredBookings.length === 0 ? (
            <div className="no-bookings">
              Nessuna prenotazione trovata per questa categoria.
            </div>
          ) : (
            filteredBookings.map((booking) => (
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
                
                <div className="booking-details">
                  <div className="detail-row">
                    <strong>Cliente:</strong> {booking.clientName} ({booking.clientEmail})
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
                  {booking.status === 'pending' && (
                    <>
                      <button 
                        className="btn-primary"
                        onClick={() => updateBookingStatus(booking._id, 'accepted')}
                      >
                        Accetta
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                      >
                        Rifiuta
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'accepted' && (
                    <>
                      <button 
                        className="btn-primary"
                        onClick={() => updateBookingStatus(booking._id, 'in_progress')}
                      >
                        Inizia Lavoro
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                      >
                        Annulla
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'in_progress' && (
                    <button 
                      className="btn-success"
                      onClick={() => updateBookingStatus(booking._id, 'completed')}
                    >
                      Completa Lavoro
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
