interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export default function Loading({ size = 'medium', text = 'Caricamento...', overlay = false }: LoadingProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  const containerClass = overlay 
    ? 'loading-overlay' 
    : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
