import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RoleSwitcher from './RoleSwitcher';
import NotificationBell from './NotificationBell';
import ChatPanel from './chat/ChatPanel';

interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'client' | 'provider' | 'admin';
  onOpenModal: (type: 'login' | 'register') => void;
  onLogout: () => void;
  onRoleChange: (role: 'client' | 'provider' | 'admin') => void;
}

export default function Header({ isLoggedIn, userRole, onOpenModal, onLogout, onRoleChange }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown se clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="header">
      <div className="logo">Cleaning-x</div>
      <nav className="nav-center">
        <Link to="/">Home</Link>
        <Link to="/services">Servizi</Link>
        <Link to="/about">Chi siamo</Link>
        <Link to="/contact">Contatti</Link>
      </nav>
      {isLoggedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ChatPanel />
          <NotificationBell />
        </div>
      )}
      {!isLoggedIn ? (
        <div className="auth-buttons">
          <button className="login-btn" onClick={() => onOpenModal('login')}>Accedi</button>
          <button className="register-btn" onClick={() => onOpenModal('register')}>Registrati</button>
        </div>
      ) : (
        <div className="user-dropdown-container" ref={dropdownRef}>
          <button className="user-dropdown-btn" onClick={() => setShowDropdown(v => !v)}>
            Area personale <span style={{marginLeft:4}}>▼</span>
          </button>
          {showDropdown && (
            <div className="user-dropdown-menu">
              {userRole !== 'admin' && (
                <RoleSwitcher 
                  currentRole={userRole as 'client' | 'provider'} 
                  onRoleChange={onRoleChange}
                  variant="dropdown"
                />
              )}
              <Link className="dropdown-item" to="/dashboard" onClick={()=>setShowDropdown(false)}>Dashboard</Link>
              <Link className="dropdown-item" to="/profile" onClick={()=>setShowDropdown(false)}>Profilo utente</Link>
              {userRole === 'admin' && (
                <Link className="dropdown-item admin-link" to="/admin" onClick={()=>setShowDropdown(false)}>
                  🛡️ Amministrazione
                </Link>
              )}
              <Link className="dropdown-item" to="/settings" onClick={()=>setShowDropdown(false)}>Impostazioni</Link>
              <Link className="dropdown-item" to="/bookings" onClick={()=>setShowDropdown(false)}>Prenotazioni</Link>
              <Link className="dropdown-item" to="/favorites" onClick={()=>setShowDropdown(false)}>Servizi preferiti</Link>
              <Link className="dropdown-item" to="/support" onClick={()=>setShowDropdown(false)}>Supporto</Link>
              <hr style={{margin: '8px 0'}} />
              <button className="dropdown-item logout" onClick={()=>{onLogout(); setShowDropdown(false);}}>Esci</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
