import { useState, useEffect } from 'react';
import SimpleBookingCalendar from '../components/SimpleBookingCalendar';
import Loading from '../components/Loading';
import LocationSelector from '../components/LocationSelector';
// import DistanceDisplay from '../components/DistanceDisplay'; // Temporaneamente disabilitato
import '../styles/Services.css';
import '../styles/Loading.css';
import '../styles/Location.css';

interface Provider {
  _id: string;
  name: string;
  businessName?: string;
  description?: string;
  profileImage?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  serviceAreas: string[];
}

interface Service {
  _id: string;
  provider: Provider;
  title: string;
  category: string;
  description: string;
  basePrice: number;
  priceType: 'fixed' | 'hourly' | 'room';
  duration: number;
  serviceAreas: string[];
  includedServices: string[];
  additionalServices: { name: string; price: number }[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

interface BookingFormData {
  serviceId: string;
  date: string;
  time: string;
  address: string;
  phone: string;
  notes: string;
  additionalServices: string[];
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    serviceId: '',
    date: '',
    time: '',
    address: '',
    phone: '',
    notes: '',
    additionalServices: []
  });

  // Fetch servizi dal backend con cache
  useEffect(() => {
    const fetchServicesWithCache = async () => {
      // Controlla se abbiamo servizi in cache (5 minuti)
      const cachedServices = localStorage.getItem('services_cache');
      const cacheTimestamp = localStorage.getItem('services_cache_timestamp');
      
      if (cachedServices && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (cacheAge < fiveMinutes) {
          console.log('✅ Usando servizi da cache');
          setServices(JSON.parse(cachedServices));
          setLoading(false);
          return;
        } else {
          console.log('🗑️ Cache scaduta, rimuovo');
          localStorage.removeItem('services_cache');
          localStorage.removeItem('services_cache_timestamp');
        }
      }
      
      // Se non abbiamo cache valida, fetch dal server
      await fetchServices();
    };
    
    fetchServicesWithCache();
  }, []);

  // Filtra servizi solo per area
  useEffect(() => {
    let filtered = services;
    console.log('🔍 Filtraggio servizi. Totali:', services.length);

    if (selectedArea) {
      filtered = filtered.filter(service => 
        service.serviceAreas.some(area => 
          area.toLowerCase().includes(selectedArea.toLowerCase())
        )
      );
      console.log('📍 Filtrati per area:', selectedArea, '→', filtered.length);
    }

    console.log('✅ Servizi finali da mostrare:', filtered.length);
    setFilteredServices(filtered);
  }, [services, selectedArea]);

  const fetchServices = async () => {
    try {
      console.log('🔄 Caricamento servizi dal server...');
      const response = await fetch('http://localhost:8080/api/services');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Servizi caricati:', data.length);
        console.log('📋 Primi 2 servizi:', data.slice(0, 2));
        setServices(data);
        
        // Salva in cache
        localStorage.setItem('services_cache', JSON.stringify(data));
        localStorage.setItem('services_cache_timestamp', Date.now().toString());
        console.log('💾 Servizi salvati in cache');
      } else {
        console.error('❌ Errore response:', response.status, response.statusText);
        if (response.status === 429) {
          console.warn('⚠️ Rate limit raggiunto. Riprova tra qualche minuto.');
        }
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento servizi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('🔍 Ricerca eseguita:', { area: selectedArea, date: selectedDate });
    
    // Scroll verso i risultati
    const resultsSection = document.querySelector('.services-grid');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setBookingForm(prev => ({ ...prev, serviceId: service._id }));
    setShowBookingModal(true);
  };

  const calculateTotalPrice = () => {
    if (!selectedService) return 0;
    let total = selectedService.basePrice;
    
    bookingForm.additionalServices.forEach(serviceName => {
      const additional = selectedService.additionalServices.find(as => as.name === serviceName);
      if (additional) total += additional.price;
    });
    
    return total;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) return;

    // Validazione data e orario dal calendario
    if (!bookingForm.date || !bookingForm.time) {
      alert('Seleziona data e orario dal calendario prima di procedere');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Devi effettuare il login per prenotare un servizio');
        return;
      }

      const totalPrice = calculateTotalPrice();
      const additionalServicesData = bookingForm.additionalServices.map(serviceName => {
        const service = selectedService.additionalServices.find(as => as.name === serviceName);
        return service ? { name: service.name, price: service.price } : null;
      }).filter(Boolean);

      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service: selectedService._id,
          provider: selectedService.provider._id,
          date: bookingForm.date,
          time: bookingForm.time,
          address: bookingForm.address,
          phone: bookingForm.phone,
          notes: bookingForm.notes,
          basePrice: selectedService.basePrice,
          additionalServices: additionalServicesData,
          totalPrice
        })
      });

      if (response.ok) {
        alert('Prenotazione inviata con successo! Il fornitore riceverà la tua richiesta.');
        setShowBookingModal(false);
        setBookingForm({
          serviceId: '',
          date: '',
          time: '',
          address: '',
          phone: '',
          notes: '',
          additionalServices: []
        });
      } else {
        const error = await response.json();
        alert(`Errore nella prenotazione: ${error.message}`);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione. Riprova.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBookingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleAdditionalService = (serviceName: string) => {
    setBookingForm(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceName)
        ? prev.additionalServices.filter(s => s !== serviceName)
        : [...prev.additionalServices, serviceName]
    }));
  };

  const handleLocationChange = (location: { lat: number; lng: number; address: string }) => {
    // Pre-popola l'indirizzo nel form di booking
    setBookingForm(prev => ({
      ...prev,
      address: location.address
    }));
  };

  if (loading) {
    return (
      <div className="services-page">
        <Loading size="large" text="Caricamento servizi..." />
      </div>
    );
  }

  return (
    <div className="services-page">
      <div className="services-header">
        <h1>Trova il Tuo Esperto di Pulizie</h1>
        <p>Scopri professionisti verificati nella tua zona</p>
      </div>

      {/* Selettore Posizione */}
      <LocationSelector onLocationChange={handleLocationChange} />

      {/* Barra di Ricerca Migliorata */}
      <div className="search-bar-modern">
        <div className="search-container">
          <div className="search-field">
            <div className="search-icon">📍</div>
            <input
              type="text"
              placeholder="Filtra per area specifica (es: Milano Centro, Roma EUR...)"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="location-input"
            />
          </div>
          
          <div className="search-field">
            <div className="search-icon">📅</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="date-input"
            />
          </div>
          
          <button className="search-btn" onClick={handleSearch}>
            🔍 Cerca
          </button>
        </div>
      </div>

      {/* Lista Servizi */}
      <div className="services-grid">
        {filteredServices.length === 0 ? (
          <div className="no-services">
            <h3>Nessun servizio trovato</h3>
            <p>Prova a modificare la zona di ricerca</p>
          </div>
        ) : (
          filteredServices.map(service => (
            <div key={service._id} className="service-card">
              <div className="service-image">
                <img 
                  src={service.images[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop'} 
                  alt={service.title} 
                />
                {service.provider.isVerified && (
                  <div className="verified-badge">✓ Verificato</div>
                )}
              </div>
              
              <div className="service-content">
                <div className="provider-info">
                  <img 
                    src={service.provider.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'} 
                    alt={service.provider.name}
                    className="provider-avatar"
                  />
                  <div>
                    <h4>{service.provider.businessName || service.provider.name}</h4>
                    <div className="rating">
                      <span className="stars">{'★'.repeat(Math.floor(service.provider.rating))}</span>
                      <span>({service.provider.reviewCount} recensioni)</span>
                    </div>
                  </div>
                </div>

                <h3>{service.title}</h3>
                <p className="service-description">{service.description}</p>

                <div className="service-details">
                  <div className="price">
                    <span className="amount">€{service.basePrice}</span>
                    <span className="type">
                      {service.priceType === 'hourly' ? '/ora' : 
                       service.priceType === 'room' ? '/stanza' : ''}
                    </span>
                  </div>
                  <div className="duration">
                    <span>{Math.floor(service.duration / 60)}h {service.duration % 60}min</span>
                  </div>
                </div>

                <div className="service-areas">
                  <strong>Zone coperte:</strong> {service.serviceAreas.join(', ')}
                  {/* Temporaneamente disabilitato per evitare rate limiting */}
                  {/* userLocation && (
                    <DistanceDisplay
                      providerAddress={service.serviceAreas[0]} // Usa la prima area come riferimento
                      userLocation={userLocation}
                      className="service-distance"
                    />
                  ) */}
                </div>

                <div className="included-services">
                  <strong>Include:</strong>
                  <ul>
                    {service.includedServices.slice(0, 3).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                    {service.includedServices.length > 3 && (
                      <li>...e altro</li>
                    )}
                  </ul>
                </div>

                <button 
                  className="book-btn"
                  onClick={() => handleBookService(service)}
                >
                  Prenota Ora
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Prenotazione */}
      {showBookingModal && selectedService && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="close-modal" 
              onClick={() => setShowBookingModal(false)}
            >
              &times;
            </button>
            
            <div className="modal-header">
              <h2>Prenota: {selectedService.title}</h2>
              <div className="provider-summary">
                con <strong>{selectedService.provider.businessName || selectedService.provider.name}</strong>
              </div>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="booking-form">
              {/* Calendario Interattivo per Data e Orario */}
              <div className="calendar-section">
                <SimpleBookingCalendar
                  providerId={selectedService.provider._id}
                  providerName={selectedService.provider.businessName || selectedService.provider.name}
                  onDateTimeSelect={(date: string, time: string) => {
                    setBookingForm(prev => ({
                      ...prev,
                      date: date,
                      time: time
                    }));
                  }}
                  selectedDate={bookingForm.date}
                  selectedTime={bookingForm.time}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Numero di telefono</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={bookingForm.phone}
                  onChange={handleInputChange}
                  placeholder="Es: 333 123 4567"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Indirizzo completo</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={bookingForm.address}
                  onChange={handleInputChange}
                  placeholder="Via, numero civico, città, CAP"
                  required
                />
              </div>

              {/* Servizi Aggiuntivi */}
              {selectedService.additionalServices.length > 0 && (
                <div className="additional-services">
                  <h4>Servizi Aggiuntivi (opzionali)</h4>
                  {selectedService.additionalServices.map(service => (
                    <label key={service.name} className="additional-service-item">
                      <input
                        type="checkbox"
                        checked={bookingForm.additionalServices.includes(service.name)}
                        onChange={() => toggleAdditionalService(service.name)}
                      />
                      <span>{service.name} (+€{service.price})</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="notes">Note aggiuntive (opzionale)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleInputChange}
                  placeholder="Specifica eventuali richieste particolari..."
                  rows={3}
                />
              </div>

              <div className="booking-summary">
                <h4>Riepilogo Prenotazione:</h4>
                <div className="summary-line">
                  <span>Servizio base:</span>
                  <span>€{selectedService.basePrice}</span>
                </div>
                {bookingForm.additionalServices.map(serviceName => {
                  const service = selectedService.additionalServices.find(as => as.name === serviceName);
                  return service ? (
                    <div key={serviceName} className="summary-line">
                      <span>{service.name}:</span>
                      <span>+€{service.price}</span>
                    </div>
                  ) : null;
                })}
                <div className="summary-total">
                  <span>Totale:</span>
                  <span>€{calculateTotalPrice()}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className={`submit-booking-btn ${(!bookingForm.date || !bookingForm.time) ? 'disabled' : ''}`}
                disabled={!bookingForm.date || !bookingForm.time}
              >
                {(!bookingForm.date || !bookingForm.time) 
                  ? '📅 Seleziona Data e Orario' 
                  : '✅ Invia Richiesta di Prenotazione'
                }
              </button>
              
              <p className="booking-note">
                La tua richiesta sarà inviata al fornitore, che ti contatterà per confermare.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
