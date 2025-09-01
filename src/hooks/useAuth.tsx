import { useState, useEffect } from 'react';

interface UseAuthProps {
  onShowSuccess?: (title: string, message?: string) => void;
  onShowError?: (title: string, message?: string) => void;
}

export function useAuth(props?: UseAuthProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'provider'>('client');

  const BASE_URL = 'http://localhost:8080';

  const handleOpenModal = (type: 'login' | 'register') => {
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleAuthSubmit = async (data: { email: string; password: string; name?: string }) => {
    try {
      const endpoint = modalType === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await res.json();
      if (res.ok && responseData.token) {
        localStorage.setItem('token', responseData.token);
        setIsLoggedIn(true);
        setUserRole(responseData.user.role || 'client');
        setShowModal(false);
        
        // Usa toast se disponibile, altrimenti fallback ad alert
        if (props?.onShowSuccess) {
          props.onShowSuccess(
            modalType === 'login' ? 'Accesso effettuato!' : 'Registrazione completata!',
            `Benvenuto${modalType === 'register' ? ' nel nostro servizio' : ' di nuovo'}!`
          );
        } else {
          alert('Accesso effettuato!');
        }
      } else {
        if (props?.onShowError) {
          props.onShowError('Errore di autenticazione', responseData.message || 'Credenziali non valide');
        } else {
          alert(responseData.message || 'Errore di autenticazione');
        }
        throw new Error(responseData.message || 'Errore di autenticazione');
      }
    } catch (err) {
      if (props?.onShowError) {
        props.onShowError('Errore di connessione', 'Impossibile contattare il server');
      } else {
        alert('Errore di connessione al server');
      }
      throw err;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('client');
    localStorage.removeItem('token');
  };

  // Controllo token all'avvio
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:8080/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setIsLoggedIn(true);
          setUserRole(data.user.role || 'client');
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  return {
    showModal,
    modalType,
    isLoggedIn,
    userRole,
    handleOpenModal,
    handleCloseModal,
    handleAuthSubmit,
    handleLogout,
    setModalType,
    setUserRole
  };
}
