import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoleSwitcher.css';

interface RoleSwitcherProps {
  currentRole: 'client' | 'provider';
  onRoleChange?: (newRole: 'client' | 'provider') => void;
  className?: string;
  variant?: 'dropdown' | 'button' | 'card' | 'toggle';
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ 
  currentRole, 
  onRoleChange, 
  className = '',
  variant = 'button'
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchRole = async (newRole: 'client' | 'provider') => {
    if (newRole === currentRole || loading) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/switch-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        if (onRoleChange) {
          onRoleChange(newRole);
        }
        
        // Reindirizza alla dashboard appropriata
        if (newRole === 'provider') {
          navigate('/provider-dashboard');
        } else {
          navigate('/client-dashboard');
        }
      } else {
        console.error('Errore nel cambio di ruolo');
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`role-switcher-dropdown ${className}`}>
        <div className="dropdown-item role-indicator">
          <span className="role-icon">
            {currentRole === 'provider' ? '🏢' : '👤'}
          </span>
          Modalità: {currentRole === 'provider' ? 'Fornitore' : 'Cliente'}
        </div>
        <div className="dropdown-toggle-container">
          <div 
            className={`dropdown-toggle ${currentRole === 'provider' ? 'toggled' : ''} ${loading ? 'loading' : ''}`}
            onClick={() => switchRole(currentRole === 'provider' ? 'client' : 'provider')}
          >
            <span className="toggle-option left">👤</span>
            <div className="toggle-slider-mini">
              {loading ? '⏳' : (currentRole === 'client' ? '👤' : '🏢')}
            </div>
            <span className="toggle-option right">🏢</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`role-switcher-card ${className}`}>
        <h3>Cambia Modalità</h3>
        <p>Stai navigando come <strong>{currentRole === 'provider' ? 'Fornitore' : 'Cliente'}</strong></p>
        <div className="role-options">
          <button 
            className={`role-option ${currentRole === 'client' ? 'active' : ''}`}
            onClick={() => switchRole('client')}
            disabled={loading}
          >
            <span className="role-icon">👤</span>
            <span>Cliente</span>
            <span className="role-description">Prenota servizi</span>
          </button>
          <button 
            className={`role-option ${currentRole === 'provider' ? 'active' : ''}`}
            onClick={() => switchRole('provider')}
            disabled={loading}
          >
            <span className="role-icon">🏢</span>
            <span>Fornitore</span>
            <span className="role-description">Offri servizi</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={`role-switcher-toggle ${className}`}>
        <div className="toggle-container">
          <div className="toggle-labels">
            <span className={`toggle-label ${currentRole === 'client' ? 'active' : ''}`}>
              👤 Cliente
            </span>
            <span className={`toggle-label ${currentRole === 'provider' ? 'active' : ''}`}>
              🏢 Fornitore
            </span>
          </div>
          <div 
            className={`toggle-switch ${currentRole === 'provider' ? 'toggled' : ''} ${loading ? 'loading' : ''}`}
            onClick={() => switchRole(currentRole === 'provider' ? 'client' : 'provider')}
          >
            <div className="toggle-slider">
              <div className="toggle-icon">
                {loading ? '⏳' : (currentRole === 'client' ? '👤' : '🏢')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant 'button' (default)
  return (
    <button 
      className={`role-switcher-button ${className}`}
      onClick={() => switchRole(currentRole === 'provider' ? 'client' : 'provider')}
      disabled={loading}
    >
      {loading ? (
        <span>⏳ Cambiando...</span>
      ) : (
        <>
          <span className="switch-icon">🔄</span>
          Passa a {currentRole === 'provider' ? 'Cliente' : 'Fornitore'}
        </>
      )}
    </button>
  );
};

export default RoleSwitcher;
