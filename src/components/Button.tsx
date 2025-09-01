interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  fullWidth = false
}: ButtonProps) {
  const baseClasses = 'form-button';
  const variantClasses = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'danger'
  };
  const sizeClasses = {
    small: 'small',
    medium: 'medium',
    large: 'large'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading ? 'loading' : '',
    fullWidth ? 'full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {!loading && children}
      {loading && <span>Caricamento...</span>}
    </button>
  );
}
