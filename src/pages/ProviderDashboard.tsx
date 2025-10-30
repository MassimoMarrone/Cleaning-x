import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleSwitcher from '../components/RoleSwitcher';
import '../styles/ProviderDashboard.css';
import BookingChatButton from '../components/BookingChatButton';

interface CompletionProof {
  photos: string[];
  note?: string;
  submittedAt?: string;
  verifiedByClient?: boolean;
}

interface Booking {
  _id: string;
  clientId?: string;
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
  completionProof?: CompletionProof;
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

const MAX_COMPLETION_PHOTOS = 5;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Impossibile leggere il file.'));
      }
    };
    reader.onerror = () => reject(new Error('Errore nella lettura del file.'));
    reader.readAsDataURL(file);
  });
};

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
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionTarget, setCompletionTarget] = useState<string | null>(null);
  const [completionForm, setCompletionForm] = useState<{ note: string; photos: string[] }>({ note: '', photos: [] });
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
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

  const openCompletionModal = (bookingId: string) => {
    setCompletionTarget(bookingId);
    setCompletionForm({ note: '', photos: [] });
    setCompletionError(null);
    setCompletionModalOpen(true);
  };

  const closeCompletionModal = () => {
    setCompletionModalOpen(false);
    setCompletionTarget(null);
    setCompletionForm({ note: '', photos: [] });
    setCompletionError(null);
  };

  const handleCompletionFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_COMPLETION_PHOTOS - completionForm.photos.length;
    if (remainingSlots <= 0) {
      setCompletionError(`Puoi caricare al massimo ${MAX_COMPLETION_PHOTOS} foto.`);
      event.target.value = '';
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    try {
      const base64Images = await Promise.all(selectedFiles.map((file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('Sono ammessi solo file immagine.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Ogni immagine deve essere inferiore a 5MB.');
        }
        return fileToBase64(file);
      }));

      setCompletionForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...base64Images]
      }));
      setCompletionError(null);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Errore durante il caricamento delle immagini.');
    } finally {
      event.target.value = '';
    }
  };

  const removeCompletionPhoto = (index: number) => {
    setCompletionForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const submitCompletionProof = async () => {
    if (!completionTarget) {
      setCompletionError('Prenotazione non valida.');
      return;
    }

    if (completionForm.photos.length === 0) {
      setCompletionError('Carica almeno una foto del lavoro completato.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setCompletionError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    try {
      setSubmittingCompletion(true);
      const response = await fetch(`http://localhost:8080/api/bookings/${completionTarget}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photos: completionForm.photos,
          note: completionForm.note.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCompletionError(data.error || data.message || 'Errore durante l\'invio della conferma.');
        return;
      }

      closeCompletionModal();
      await fetchBookings();
      setActiveTab('completed');
    } catch (error) {
      console.error('Errore invio completamento:', error);
      setCompletionError('Errore di connessione durante l\'invio della conferma.');
    } finally {
      setSubmittingCompletion(false);
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

  const handleEditService = (serviceId: string) => {
    navigate('/publish-service', { state: { serviceId } });
  };

  const handleDeleteService = async (serviceId: string, serviceTitle: string) => {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare "${serviceTitle}"? Il servizio verrà rimosso dall'elenco dei clienti.`
    );
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessione scaduta. Effettua di nuovo il login.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error?.error || error?.message || 'Errore durante l\'eliminazione del servizio.';
        alert(message);
        return;
      }

  setServices(prev => prev.filter(service => service._id !== serviceId));
  // Svuota la cache locale usata dalla pagina pubblica dei servizi
  localStorage.removeItem('services_cache');
  localStorage.removeItem('services_cache_timestamp');
      alert('Servizio eliminato con successo.');
    } catch (error) {
      console.error('Errore nell\'eliminazione del servizio:', error);
      alert('Errore di connessione durante l\'eliminazione del servizio.');
    }
  };

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
                  <button 
                    className="btn-secondary"
                    onClick={() => handleEditService(service._id)}
                  >
                    ✏️ Modifica
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteService(service._id, service.title)}
                  >
                    🗑️ Elimina
                  </button>
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

                  {booking.completionProof?.note && (
                    <div className="detail-row">
                      <strong>Nota completamento:</strong> {booking.completionProof.note}
                    </div>
                  )}

                  {booking.completionProof?.photos?.length ? (
                    <div className="detail-row completion-proof-row">
                      <strong>Foto completamento:</strong>
                      <div className="completion-proof-gallery">
                        {booking.completionProof.photos.map((photo, index) => (
                          <img key={index} src={photo} alt={`Completamento ${index + 1}`} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="detail-row">
                    <strong>Prenotato il:</strong> {new Date(booking.createdAt).toLocaleDateString('it-IT')}
                  </div>
                </div>

                <div className="booking-actions">
                  {/* Chat con il cliente per questa prenotazione */}
                  {booking.clientId && (
                    <BookingChatButton otherUserId={booking.clientId} bookingId={booking._id} />
                  )}
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
                      onClick={() => openCompletionModal(booking._id)}
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

      {completionModalOpen && (
        <div className="completion-modal-overlay">
          <div className="completion-modal">
            <h3>Conferma completamento lavoro</h3>
            <p>Carica fino a {MAX_COMPLETION_PHOTOS} foto del lavoro svolto e aggiungi una nota opzionale per il cliente.</p>

            {completionError && <div className="completion-modal-error">{completionError}</div>}

            <div className="completion-photos-preview">
              {completionForm.photos.map((photo, index) => (
                <div key={index} className="completion-photo">
                  <img src={photo} alt={`Prova completamento ${index + 1}`} />
                  <button 
                    type="button" 
                    className="remove-photo"
                    onClick={() => removeCompletionPhoto(index)}
                    aria-label="Rimuovi foto"
                  >
                    ×
                  </button>
                </div>
              ))}
              {completionForm.photos.length === 0 && (
                <div className="completion-photo-placeholder">
                  Nessuna foto caricata
                </div>
              )}
            </div>

            <label className="completion-upload">
              <span className="btn-secondary">📷 Carica foto</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleCompletionFiles}
                hidden
              />
            </label>

            <textarea
              className="completion-note"
              placeholder="Scrivi un breve riepilogo (opzionale)"
              value={completionForm.note}
              onChange={(e) => setCompletionForm(prev => ({ ...prev, note: e.target.value }))}
            />

            <div className="completion-modal-actions">
              <button className="btn-secondary" onClick={closeCompletionModal} disabled={submittingCompletion}>
                Annulla
              </button>
              <button 
                className="btn-success" 
                onClick={submitCompletionProof}
                disabled={submittingCompletion || completionForm.photos.length === 0}
              >
                {submittingCompletion ? 'Invio in corso...' : 'Invia conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
