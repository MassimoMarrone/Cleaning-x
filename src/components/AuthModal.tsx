import { useState } from 'react';
import FormInput from './FormInputCompact'; // Usa la versione compatta
import Button from './Button';
import { useFormValidation } from '../hooks/useFormValidation';
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>
        <h2>{modalType === 'login' ? 'Accedi' : 'Registrati'}</h2>
        
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
          />

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
            fullWidth
          >
            {modalType === 'login' ? 'Accedi' : 'Registrati'}
          </Button>
          
          <div className="form-separator">
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
