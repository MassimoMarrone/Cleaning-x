import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GuidedTourButton from '../components/GuidedTourButton';
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

const DEMO_FORM_TEMPLATE: ServiceFormData = {
  title: 'Pulizia Appartamento Premium',
  description: 'Team professionale con materiali certificati, sanificazione profonda e garanzia soddisfatti o rimborsati.',
  category: 'pulizia-casa',
  basePrice: 45,
  duration: '3 ore',
  serviceAreas: ['Milano'],
  additionalServices: [
    {
      name: 'Sanificazione anti-allergeni',
      price: 25
    }
  ],
  images: []
};

const CATEGORY_MAP: Record<string, string> = {
  'pulizia-casa': 'house-cleaning',
  'pulizia-ufficio': 'office-cleaning',
  'pulizia-post-ristrutturazione': 'post-construction',
  'pulizia-vetri': 'windows',
  'pulizia-condominiale': 'house-cleaning',
  sanificazione: 'deep-cleaning',
  'pulizia-tappeti': 'carpets',
  altro: 'other'
};

const REVERSE_CATEGORY_MAP: Record<string, string> = Object.entries(CATEGORY_MAP).reduce((acc, [itLabel, backendValue]) => {
  acc[backendValue] = itLabel;
  return acc;
}, {} as Record<string, string>);

const DURATION_LOOKUP: Record<string, number> = {
  '1 ora': 60,
  '2 ore': 120,
  '3 ore': 180,
  '4 ore': 240,
  '6 ore': 360,
  '8 ore': 480,
  'Giornata intera': 480
};

const mapDurationToMinutes = (duration: string): number => {
  if (DURATION_LOOKUP[duration]) {
    return DURATION_LOOKUP[duration];
  }

  const numericMatch = duration.match(/\d+/);
  if (numericMatch) {
    return Number(numericMatch[0]) * 60;
  }

  return 120; // Default a 2 ore se non riconosciuta
};

const mapMinutesToDuration = (minutes?: number): string => {
  if (!minutes || Number.isNaN(minutes)) {
    return '2 ore';
  }

  const found = Object.entries(DURATION_LOOKUP).find(([, value]) => value === minutes);
  if (found) {
    return found[0];
  }

  const hours = Math.max(1, Math.round(minutes / 60));
  return hours === 1 ? '1 ora' : `${hours} ore`;
};

const PublishService: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = (location.state as { serviceId?: string } | null) ?? {};
  const isEditMode = Boolean(serviceId);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState<boolean>(isEditMode);
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
  const tourSnapshotRef = useRef<{
    formData: ServiceFormData;
    newServiceArea: string;
    newAdditionalService: { name: string; price: number };
    currentStep: number;
  } | null>(null);
  const publishRequestRef = useRef(false);
  const [tourPhase, setTourPhase] = useState<'idle' | 'step1' | 'step2' | 'step3'>('idle');
  const [isTourAutoProgress, setIsTourAutoProgress] = useState(false);
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [tourButtonKey, setTourButtonKey] = useState(0);

  const cloneFormData = useCallback((data: ServiceFormData): ServiceFormData => ({
    ...data,
    serviceAreas: [...data.serviceAreas],
    additionalServices: data.additionalServices.map(service => ({ ...service })),
    images: [...data.images]
  }), []);

  const waitForFrame = useCallback((ms: number = 200) => new Promise(resolve => {
    window.setTimeout(resolve, ms);
  }), []);

  const restoreTourSnapshot = useCallback(() => {
    if (!tourSnapshotRef.current) {
      setTourPhase('idle');
      setIsTourAutoProgress(false);
      setAutoStartNext(false);
      return;
    }

    const snapshot = tourSnapshotRef.current;
    setFormData(snapshot.formData);
    setNewServiceArea(snapshot.newServiceArea);
    setNewAdditionalService(snapshot.newAdditionalService);
    setCurrentStep(snapshot.currentStep);
    tourSnapshotRef.current = null;
    setTourPhase('idle');
    setIsTourAutoProgress(false);
    setAutoStartNext(false);
    setTourButtonKey(prev => prev + 1);
  }, []);

  const ensureSnapshot = useCallback(() => {
    if (tourSnapshotRef.current) {
      return;
    }

    tourSnapshotRef.current = {
      formData: cloneFormData(formData),
      newServiceArea,
      newAdditionalService: { ...newAdditionalService },
      currentStep
    };
  }, [cloneFormData, formData, newAdditionalService, newServiceArea, currentStep]);

  const handlePublishTourBeforeStart = useCallback(async () => {
    let phase = tourPhase;

    ensureSnapshot();
    setAutoStartNext(false);

    if (phase === 'idle') {
      if (currentStep === 1) {
        setTourPhase('step1');
        setIsTourAutoProgress(true);
        phase = 'step1';
      } else if (currentStep === 2) {
        setTourPhase('step2');
        phase = 'step2';
      } else if (currentStep === 3) {
        setTourPhase('step3');
        phase = 'step3';
      }
    }

    if (phase === 'step1') {
      setCurrentStep(1);
      setFormData(cloneFormData(DEMO_FORM_TEMPLATE));
      setNewServiceArea('');
      setNewAdditionalService({ name: '', price: 0 });
    } else if (phase === 'step2') {
      setCurrentStep(2);
      setFormData(prev => ({
        ...prev,
        basePrice: DEMO_FORM_TEMPLATE.basePrice,
        duration: DEMO_FORM_TEMPLATE.duration,
        serviceAreas: [...DEMO_FORM_TEMPLATE.serviceAreas]
      }));
    } else if (phase === 'step3') {
      setCurrentStep(3);
      setFormData(prev => ({
        ...prev,
        additionalServices: DEMO_FORM_TEMPLATE.additionalServices.map(service => ({ ...service }))
      }));
    }

    await waitForFrame();
    setIsTourAutoProgress(true);
  }, [cloneFormData, ensureSnapshot, tourPhase, waitForFrame]);

  const handlePublishTourAfterEnd = useCallback(() => {
    if (!isTourAutoProgress) {
      restoreTourSnapshot();
      return;
    }

    if (tourPhase === 'step1') {
      setCurrentStep(2);
      setTourPhase('step2');
      setAutoStartNext(true);
      setTourButtonKey(prev => prev + 1);
    } else if (tourPhase === 'step2') {
      setCurrentStep(3);
      setTourPhase('step3');
      setAutoStartNext(true);
      setTourButtonKey(prev => prev + 1);
    } else {
      setAutoStartNext(false);
      restoreTourSnapshot();
    }
  }, [isTourAutoProgress, restoreTourSnapshot, tourPhase]);

  // Invalida la cache locale della pagina pubblica servizi così le modifiche sono visibili subito
  const clearServicesCache = () => {
    localStorage.removeItem('services_cache');
    localStorage.removeItem('services_cache_timestamp');
  };

  const publishTourSteps = useMemo(() => {
    const steps = [
      {
        element: '#tour-publish-header',
        popover: {
          title: 'Crea la tua vetrina professionale',
          description: 'In questa pagina pubblichi un nuovo servizio in tre passaggi guidati con salvataggio automatico alla fine.'
        }
      },
      {
        element: '#tour-publish-indicator',
        popover: {
          title: 'Avanzamento sempre visibile',
          description: 'Il percorso è diviso in tre step: i pallini ti mostrano a colpo d\'occhio dove ti trovi e cosa resta da completare.'
        }
      }
    ];

    if (tourPhase === 'step1' || (tourPhase === 'idle' && currentStep === 1)) {
      steps.push(
        {
          element: '#tour-publish-title',
          popover: {
            title: 'Titolo ad alto impatto',
            description: 'Usa un titolo chiaro e specifico: aiuta i clienti a capire subito cosa offri.'
          }
        },
        {
          element: '#tour-publish-category',
          popover: {
            title: 'Categoria corretta',
            description: 'Scegli la categoria più pertinente per comparire nei filtri giusti e aumentare la visibilità.'
          }
        },
        {
          element: '#tour-publish-description',
          popover: {
            title: 'Descrivi il tuo metodo',
            description: 'Racconta cosa include il servizio, quali materiali utilizzi e perché i clienti dovrebbero scegliere te.'
          }
        }
      );
    }

    if (tourPhase === 'step2' || (tourPhase === 'idle' && currentStep === 2)) {
      steps.push(
        {
          element: '#tour-publish-price',
          popover: {
            title: 'Prezzi trasparenti',
            description: 'Indica il prezzo base e la durata stimata: il sistema usa queste informazioni per calcolare il preventivo.'
          }
        },
        {
          element: '#tour-publish-areas',
          popover: {
            title: 'Zone coperte',
            description: 'Aggiungi tutte le aree servite: più zone inserisci, più richieste mirate riceverai.'
          }
        }
      );
    }

    if (tourPhase === 'step3' || (tourPhase === 'idle' && currentStep === 3)) {
      steps.push(
        {
          element: '#tour-publish-extras',
          popover: {
            title: 'Valorizza con i servizi extra',
            description: 'Offri opzioni aggiuntive per aumentare il valore medio delle richieste e far scegliere pacchetti personalizzati.'
          }
        },
        {
          element: '#tour-publish-add-extra',
          popover: {
            title: 'Aggiungi in un clic',
            description: 'Imposta nome e prezzo: li potrai riutilizzare in futuro e i clienti li vedranno subito nel checkout.'
          }
        }
      );
    }

    steps.push({
      element: '#tour-publish-navigation',
      popover: {
        title: 'Controlla e prosegui',
        description: currentStep < 3
          ? 'Puoi tornare indietro o usare “Avanti” per passare al prossimo step.'
          : 'Quando sei pronto pubblica: qui trovi il pulsante finale e puoi sempre rivedere gli step precedenti.'
      }
    });

    return steps;
  }, [currentStep, tourPhase]);

  useEffect(() => {
    if (!isEditMode || !serviceId) {
      setInitializing(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessione scaduta. Effettua di nuovo il login.');
      navigate('/login');
      return;
    }

    const fetchService = async () => {
      setInitializing(true);
      try {
        const response = await fetch(`http://localhost:8080/api/services/${serviceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error || data?.message || 'Impossibile caricare il servizio.';
          alert(message);
          navigate('/provider-dashboard');
          return;
        }

        const normalizedCategory = REVERSE_CATEGORY_MAP[data.category] || 'altro';
        const normalizedAreas = Array.isArray(data.serviceAreas) && data.serviceAreas.length
          ? data.serviceAreas
          : ['Roma'];
        const normalizedExtras = Array.isArray(data.additionalServices)
          ? data.additionalServices.map((service: any) => ({
              name: service?.name || '',
              price: typeof service?.price === 'number' ? service.price : Number(service?.price) || 0
            }))
          : [];

        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: normalizedCategory,
          basePrice: typeof data.basePrice === 'number' ? data.basePrice : Number(data.basePrice) || 25,
          duration: mapMinutesToDuration(data.duration),
          serviceAreas: normalizedAreas,
          additionalServices: normalizedExtras,
          images: Array.isArray(data.images) ? data.images : []
        });
        setCurrentStep(1);
      } catch (error) {
        console.error('Errore nel caricamento del servizio:', error);
        alert('Errore di connessione durante il caricamento del servizio.');
        navigate('/provider-dashboard');
      } finally {
        setInitializing(false);
      }
    };

    fetchService();
  }, [isEditMode, serviceId, navigate]);

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
    const trimmed = newServiceArea.trim();
    if (!trimmed || formData.serviceAreas.includes(trimmed)) return;

    setFormData(prev => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, trimmed]
    }));
    setNewServiceArea('');
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

  const isStepValid = () => {
    if (initializing) return false;
    switch (currentStep) {
      case 1:
        return Boolean(formData.title.trim() && formData.description.trim() && formData.category);
      case 2:
        return Boolean(formData.basePrice > 0 && formData.duration && formData.serviceAreas.length > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const removeAdditionalService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nativeEvent = e.nativeEvent as SubmitEvent | undefined;
    const submitter = nativeEvent?.submitter as (HTMLButtonElement | HTMLInputElement | null);
    const submitRole = submitter?.getAttribute?.('data-submit-role');

    if (currentStep < 3) {
      nextStep();
      return;
    }

    if (submitRole !== 'publish-final') {
      return;
    }

    if (!publishRequestRef.current) {
      return;
    }

    publishRequestRef.current = false;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Sessione scaduta. Effettua di nuovo il login.');
        navigate('/login');
        return;
      }

      const payload = {
        ...formData,
        category: CATEGORY_MAP[formData.category] || formData.category,
        duration: mapDurationToMinutes(formData.duration)
      };

      const url = isEditMode
        ? `http://localhost:8080/api/services/${serviceId}`
        : 'http://localhost:8080/api/services';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        clearServicesCache();
        alert(isEditMode ? 'Servizio aggiornato con successo!' : 'Servizio pubblicato con successo!');
        navigate('/provider-dashboard');
      } else {
        const message = data?.error || data?.message || (isEditMode
          ? 'Errore nell\'aggiornamento del servizio'
          : 'Errore nella pubblicazione del servizio');
        alert(message);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (initializing) return;
    publishRequestRef.current = false;
    tourSnapshotRef.current = null;
    setTourPhase('idle');
    setIsTourAutoProgress(false);
    setAutoStartNext(false);
    setTourButtonKey(prev => prev + 1);
    setCurrentStep(prev => {
      const next = Math.min(3, prev + 1);
      if (next === 3) {
        setFormData(prevData => ({
          ...prevData,
          additionalServices: prevData.additionalServices.filter(service => service.name.trim())
        }));
      }
      return next;
    });
  };

  const prevStep = () => {
    if (initializing) return;
    publishRequestRef.current = false;
    tourSnapshotRef.current = null;
    setTourPhase('idle');
    setIsTourAutoProgress(false);
    setAutoStartNext(false);
    setTourButtonKey(prev => prev + 1);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.tagName.toLowerCase() === 'textarea') {
      return;
    }

    const isSubmitLike =
      target.tagName.toLowerCase() === 'button' ||
      (target instanceof HTMLInputElement && ['submit', 'button'].includes((target.type || '').toLowerCase()));

    if (target.closest('.add-area')) {
      event.preventDefault();
      addServiceArea();
      return;
    }

    if (target.closest('.add-service')) {
      event.preventDefault();
      if (currentStep === 3) {
        addAdditionalService();
      }
      return;
    }

    if (currentStep < 3) {
      event.preventDefault();
      if (!initializing && !loading && isStepValid()) {
        nextStep();
      }
      return;
    }

    if (!isSubmitLike) {
      event.preventDefault();
    }
  };

  return (
    <div className="publish-service">
      <header className="publish-header" id="tour-publish-header">
        <div className="publish-header-top">
          <button 
            className="btn-back"
            onClick={() => navigate('/provider-dashboard')}
          >
            ← Torna alla Dashboard
          </button>
          <GuidedTourButton
            key={tourButtonKey}
            steps={publishTourSteps}
            variant="secondary"
            className="tour-button--inline"
            label="Tour pubblicazione"
            autoStart={autoStartNext}
            autoProgress={tourPhase !== 'idle'}
            onBeforeStart={handlePublishTourBeforeStart}
            onAfterEnd={handlePublishTourAfterEnd}
          />
        </div>
        <h1>{isEditMode ? 'Modifica Servizio' : 'Pubblica un Nuovo Servizio'}</h1>
      </header>

      <div className="step-indicator" id="tour-publish-indicator">
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

  <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="service-form">
        {initializing ? (
          <div className="loading">Caricamento dati del servizio...</div>
        ) : (
          <>
            {currentStep === 1 && (
              <div className="form-step" id="tour-publish-step1">
                <h2>📝 Informazioni di Base</h2>
                
                <div className="form-group" id="tour-publish-title">
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

                <div className="form-group" id="tour-publish-category">
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

                <div className="form-group" id="tour-publish-description">
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
              <div className="form-step" id="tour-publish-step2">
                <h2>💰 Prezzi e Zone di Servizio</h2>
                
                <div className="form-row">
                  <div className="form-group" id="tour-publish-price">
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

                  <div className="form-group" id="tour-publish-duration">
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

                <div className="form-group" id="tour-publish-areas">
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
                        disabled={loading}
                      />
                      <button type="button" onClick={addServiceArea} className="btn-add" disabled={loading}>
                        Aggiungi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="form-step" id="tour-publish-step3">
                <h2>⭐ Servizi Aggiuntivi (Opzionale)</h2>
                <p className="step-description">
                  Aggiungi servizi extra che i clienti possono richiedere con costi aggiuntivi
                </p>
                
                <div className="additional-services" id="tour-publish-extras">
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
                  
                  <div className="add-service" id="tour-publish-add-extra">
                    <input
                      type="text"
                      value={newAdditionalService.name}
                      onChange={(e) => setNewAdditionalService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome servizio aggiuntivo"
                      disabled={loading}
                    />
                    <input
                      type="number"
                      min="1"
                      value={newAdditionalService.price || ''}
                      onChange={(e) => setNewAdditionalService(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="Prezzo"
                      disabled={loading}
                    />
                    <button type="button" onClick={addAdditionalService} className="btn-add" disabled={loading}>
                      Aggiungi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="form-navigation" id="tour-publish-navigation">
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={prevStep} 
              className="btn-secondary"
              disabled={loading || initializing}
            >
              ← Indietro
            </button>
          )}
          
          <div className="nav-right">
            {currentStep < 3 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="btn-primary"
                disabled={!isStepValid() || loading}
              >
                Avanti →
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-success"
                data-submit-role="publish-final"
                disabled={loading || initializing || !isStepValid()}
                onClick={() => {
                  publishRequestRef.current = true;
                }}
              >
                {loading 
                  ? (isEditMode ? '⏳ Salvando...' : '⏳ Pubblicando...')
                  : (isEditMode ? '💾 Salva modifiche' : '🚀 Pubblica Servizio')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PublishService;
