import { useMemo, useState } from 'react';
import FormInput from './FormInputCompact'; // Usa la versione compatta
import Button from './Button';
import { useFormValidation } from '../hooks/useFormValidation';
import GuidedTourButton from './GuidedTourButton';
import '../styles/FormComponents.css';

interface AuthModalProps {
  showModal: boolean;
  modalType: 'login' | 'register';
  onClose: () => void;
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>;
  onSwitchType: (type: 'login' | 'register') => void;
}

export default function AuthModal({ showModal, modalType, onClose, onSubmit, onSwitchType }: AuthModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = modalType === 'register';

  const initialValues = {
    name: '',
    email: '',
    password: ''
  };

  const validationRules = {
    name: { 
      required: modalType === 'register', 
      minLength: 2 
    },
    email: { 
      required: true, 
      email: true 
    },
    password: { 
      required: true, 
      minLength: 6 
    }
  };

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateAll,
    reset
  } = useFormValidation(initialValues, validationRules);

  const registerTourSteps = useMemo(() => {
    if (!isRegister) {
      return [];
    }

    return [
      {
        element: '#tour-register-modal',
        popover: {
          title: 'Benvenuto nel percorso di registrazione',
          description: 'In pochi passaggi crei il tuo profilo per prenotare servizi o monitorare le richieste in tempo reale.'
        }
      },
      {
        element: '#tour-register-name',
        popover: {
          title: 'Presentati con il tuo nome',
          description: 'I professionisti vedranno questo nome quando ricevono una richiesta, così sanno sempre con chi stanno parlando.'
        }
      },
      {
        element: '#tour-register-email',
        popover: {
          title: 'Email di riferimento',
          description: 'Usiamo l\'indirizzo email per conferme, notifiche di prenotazione e recupero password in modo sicuro.'
        }
      },
      {
        element: '#tour-register-password',
        popover: {
          title: 'Proteggi il tuo account',
          description: 'Scegli una password di almeno 6 caratteri: puoi sempre aggiornarla dalla tua area personale in seguito.'
        }
      },
      {
        element: '#tour-register-submit',
        popover: {
          title: 'Completa la registrazione',
          description: 'Quando tutti i campi sono validi questo pulsante si attiva e in pochi secondi il tuo account è pronto.'
        }
      },
      {
        element: '#tour-register-switch',
        popover: {
          title: 'Già registrato?',
          description: 'Da qui puoi tornare rapidamente al login senza chiudere la finestra.'
        }
      }
    ];
  }, [isRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        email: values.email,
        password: values.password,
        ...(modalType === 'register' && { name: values.name })
      });
      reset();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        id={isRegister ? 'tour-register-modal' : undefined}
        onClick={e => e.stopPropagation()}
      >
        <button className="close-modal" onClick={onClose}>&times;</button>
        <div className="modal-title-row">
          <h2>{modalType === 'login' ? 'Accedi' : 'Registrati'}</h2>
          {isRegister && registerTourSteps.length > 0 && (
            <GuidedTourButton
              steps={registerTourSteps}
              variant="secondary"
              className="tour-button--inline"
              label="Tour registrazione"
            />
          )}
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {modalType === 'register' && (
            <FormInput
              label="Nome"
              name="name"
              value={values.name}
              error={errors.name}
              touched={touched.name}
              placeholder="Inserisci il tuo nome"
              required
              icon="👤"
              showErrorText={false} // Solo indicatori visivi
              onChange={handleChange}
              onBlur={handleBlur}
              containerId="tour-register-name"
            />
          )}
          
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            error={errors.email}
            touched={touched.email}
            placeholder="Inserisci la tua email"
            required
            icon="📧"
            showErrorText={false} // Solo indicatori visivi
            onChange={handleChange}
            onBlur={handleBlur}
            containerId="tour-register-email"
          />
          
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={values.password}
            error={errors.password}
            touched={touched.password}
            placeholder="Inserisci la password"
            required
            icon="🔒"
            showErrorText={false} // Solo indicatori visivi
            onChange={handleChange}
            onBlur={handleBlur}
            containerId="tour-register-password"
          />

          <div id={isRegister ? 'tour-register-submit' : undefined}>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
              fullWidth
            >
              {modalType === 'login' ? 'Accedi' : 'Registrati'}
            </Button>
          </div>
          
          <div className="form-separator" id={isRegister ? 'tour-register-switch' : undefined}>
            {modalType === 'login' ? (
              <span>Non hai un account? <button type="button" className="link-btn" onClick={() => onSwitchType('register')}>Registrati</button></span>
            ) : (
              <span>Hai già un account? <button type="button" className="link-btn" onClick={() => onSwitchType('login')}>Accedi</button></span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
