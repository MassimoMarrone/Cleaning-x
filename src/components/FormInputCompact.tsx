import '../styles/FormComponents.css';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'date' | 'time';
  value: string;
  error?: string | null;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  showErrorText?: boolean; // Nuova prop per controllare se mostrare il testo
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  placeholder,
  required,
  icon,
  showErrorText = false, // Default: solo indicatori visivi
  onChange,
  onBlur
}: FormInputProps) {
  const hasError = touched && error;
  const isValid = touched && !error && value.length > 0;

  return (
    <div className="form-input-group">
      <label htmlFor={name} className="form-label">
        {icon && <span className="form-icon">{icon}</span>}
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className={`form-input-wrapper ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''}`}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          className="form-input"
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          title={hasError ? error : undefined} // Tooltip nativo del browser
        />
        
        {hasError && (
          <div className="validation-icon error-icon">❌</div>
        )}
        
        {isValid && (
          <div className="validation-icon success-icon">✅</div>
        )}
      </div>
      
      {/* Mostra testo errore solo se richiesto */}
      {hasError && showErrorText && (
        <div id={`${name}-error`} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
