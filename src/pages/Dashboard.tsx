import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch('http://localhost:8080/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Redirect basato sul ruolo
          if (data.user.role === 'provider') {
            navigate('/provider-dashboard');
          } else if (data.user.role === 'client') {
            navigate('/client-dashboard');
          } else {
            // Per altri ruoli (admin, etc.) vai alla dashboard generica
            navigate('/client-dashboard');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Errore nel caricamento del profilo:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Caricamento...</h2>
        <p>Reindirizzamento alla tua dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2>Reindirizzamento...</h2>
      <p>Ti stiamo reindirizzando alla dashboard appropriata.</p>
    </div>
  );
};

export default Dashboard;
