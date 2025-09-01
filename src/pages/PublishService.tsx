import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PublishService.css';

interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  basePrice: number;
  duration: string;
  serviceAreas: string[];
  additionalServices: Array<{
    name: string;
    price: number;
  }>;
  images: string[];
}

const PublishService: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    category: 'pulizia-casa',
    basePrice: 25,
    duration: '2 ore',
    serviceAreas: ['Roma'],
    additionalServices: [],
    images: []
  });
  const [newServiceArea, setNewServiceArea] = useState('');
  const [newAdditionalService, setNewAdditionalService] = useState({ name: '', price: 0 });
  const navigate = useNavigate();

  const categories = [
    { value: 'pulizia-casa', label: 'Pulizia Casa' },
    { value: 'pulizia-ufficio', label: 'Pulizia Ufficio' },
    { value: 'pulizia-post-ristrutturazione', label: 'Pulizia Post-Ristrutturazione' },
    { value: 'pulizia-vetri', label: 'Pulizia Vetri' },
    { value: 'pulizia-condominiale', label: 'Pulizia Condominiale' },
    { value: 'sanificazione', label: 'Sanificazione' },
    { value: 'pulizia-tappeti', label: 'Pulizia Tappeti e Divani' },
    { value: 'altro', label: 'Altro' }
  ];

  const durations = ['1 ora', '2 ore', '3 ore', '4 ore', '6 ore', '8 ore', 'Giornata intera'];

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addServiceArea = () => {
    if (newServiceArea.trim() && !formData.serviceAreas.includes(newServiceArea.trim())) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, newServiceArea.trim()]
      }));
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(a => a !== area)
    }));
  };

  const addAdditionalService = () => {
    if (newAdditionalService.name.trim() && newAdditionalService.price > 0) {
      setFormData(prev => ({
        ...prev,
        additionalServices: [...prev.additionalServices, { ...newAdditionalService }]
      }));
      setNewAdditionalService({ name: '', price: 0 });
    }
  };

  const removeAdditionalService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Servizio pubblicato con successo!');
        navigate('/provider-dashboard');
      } else {
        const error = await response.json();
        alert(error.message || 'Errore nella pubblicazione del servizio');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.description.trim() && formData.category;
      case 2:
        return formData.basePrice > 0 && formData.duration && formData.serviceAreas.length > 0;
      case 3:
        return true; // Step 3 è opzionale
      default:
        return false;
    }
  };

  return (
    <div className="publish-service">
      <header className="publish-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/provider-dashboard')}
        >
          ← Torna alla Dashboard
        </button>
        <h1>Pubblica un Nuovo Servizio</h1>
      </header>

      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Dettagli Base</span>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Prezzi e Aree</span>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Servizi Extra</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="service-form">
        {currentStep === 1 && (
          <div className="form-step">
            <h2>📝 Informazioni di Base</h2>
            
            <div className="form-group">
              <label htmlFor="title">Titolo del Servizio *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="es: Pulizia Completa Appartamento"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Categoria *</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descrizione del Servizio *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrivi dettagliatamente cosa include il tuo servizio..."
                rows={6}
                required
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            <h2>💰 Prezzi e Zone di Servizio</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="basePrice">Prezzo Base (€) *</label>
                <input
                  id="basePrice"
                  type="number"
                  min="1"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Durata Stimata *</label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  required
                >
                  {durations.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Zone di Servizio *</label>
              <div className="service-areas">
                <div className="areas-list">
                  {formData.serviceAreas.map((area, index) => (
                    <span key={index} className="area-tag">
                      {area}
                      <button 
                        type="button" 
                        onClick={() => removeServiceArea(area)}
                        className="remove-tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-area">
                  <input
                    type="text"
                    value={newServiceArea}
                    onChange={(e) => setNewServiceArea(e.target.value)}
                    placeholder="Aggiungi città/zona"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
                  />
                  <button type="button" onClick={addServiceArea} className="btn-add">
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-step">
            <h2>⭐ Servizi Aggiuntivi (Opzionale)</h2>
            <p className="step-description">
              Aggiungi servizi extra che i clienti possono richiedere con costi aggiuntivi
            </p>
            
            <div className="additional-services">
              {formData.additionalServices.length > 0 && (
                <div className="services-list">
                  {formData.additionalServices.map((service, index) => (
                    <div key={index} className="service-item">
                      <span>{service.name}</span>
                      <span className="service-price">+€{service.price}</span>
                      <button 
                        type="button" 
                        onClick={() => removeAdditionalService(index)}
                        className="remove-service"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="add-service">
                <input
                  type="text"
                  value={newAdditionalService.name}
                  onChange={(e) => setNewAdditionalService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome servizio aggiuntivo"
                />
                <input
                  type="number"
                  min="1"
                  value={newAdditionalService.price || ''}
                  onChange={(e) => setNewAdditionalService(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="Prezzo"
                />
                <button type="button" onClick={addAdditionalService} className="btn-add">
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="btn-secondary">
              ← Indietro
            </button>
          )}
          
          <div className="nav-right">
            {currentStep < 3 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="btn-primary"
                disabled={!isStepValid()}
              >
                Avanti →
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-success"
                disabled={loading || !isStepValid()}
              >
                {loading ? '⏳ Pubblicando...' : '🚀 Pubblica Servizio'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PublishService;
