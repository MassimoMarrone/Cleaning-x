import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../styles/Admin.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

interface Booking {
  _id: string;
  service: { name: string };
  client: { name: string; email: string };
  date: string;
  status: string;
  totalPrice: number;
}

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  provider: { name: string };
  isActive: boolean;
}

interface Stats {
  totalUsers: number;
  totalBookings: number;
  totalServices: number;
  totalRevenue: number;
  recentUsers: number;
  recentBookings: number;
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBookings: 0,
    totalServices: 0,
    totalRevenue: 0,
    recentUsers: 0,
    recentBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token trovato:', token); // Debug
      console.log('User role:', user?.role); // Debug
      
      await Promise.all([
        loadUsers(),
        loadBookings(),
        loadServices(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Caricamento utenti...'); // Debug
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Response users:', response.status, response.ok); // Debug
      if (response.ok) {
        const data = await response.json();
        console.log('Dati utenti ricevuti:', data); // Debug
        setUsers(data);
      } else {
        console.error('Errore response users:', await response.text()); // Debug
      }
    } catch (error) {
      console.error('Errore nel caricamento utenti:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento prenotazioni:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento servizi:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        loadUsers(); // Ricarica la lista utenti
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento ruolo:', error);
    }
  };

  const toggleUserBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isBlocked: !isBlocked })
      });
      
      if (response.ok) {
        loadUsers(); // Ricarica la lista utenti
      }
    } catch (error) {
      console.error('Errore nel blocco utente:', error);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadBookings(); // Ricarica la lista prenotazioni
        loadStats(); // Aggiorna le statistiche
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione prenotazione:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo servizio? Verranno eliminate anche tutte le prenotazioni associate.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadServices(); // Ricarica la lista servizi
        loadBookings(); // Ricarica prenotazioni (potrebbero essere cambiate)
        loadStats(); // Aggiorna le statistiche
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione servizio:', error);
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/services/${serviceId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (response.ok) {
        loadServices(); // Ricarica la lista servizi
      }
    } catch (error) {
      console.error('Errore nel cambio stato servizio:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-container">
        <h1>Accesso Negato</h1>
        <p>Non hai i permessi per accedere a questa area.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <h1>Caricamento...</h1>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Dashboard Amministratore</h1>
      
      <nav className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Utenti ({users.length})
        </button>
        <button 
          className={activeTab === 'bookings' ? 'active' : ''} 
          onClick={() => setActiveTab('bookings')}
        >
          Prenotazioni ({bookings.length})
        </button>
        <button 
          className={activeTab === 'services' ? 'active' : ''} 
          onClick={() => setActiveTab('services')}
        >
          Servizi ({services.length})
        </button>
      </nav>

      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Utenti Totali</h3>
              <p className="stat-number">{stats.totalUsers}</p>
              <span className="stat-label">+{stats.recentUsers} questo mese</span>
            </div>
            <div className="stat-card">
              <h3>Prenotazioni Totali</h3>
              <p className="stat-number">{stats.totalBookings}</p>
              <span className="stat-label">+{stats.recentBookings} questo mese</span>
            </div>
            <div className="stat-card">
              <h3>Servizi Attivi</h3>
              <p className="stat-number">{stats.totalServices}</p>
            </div>
            <div className="stat-card">
              <h3>Fatturato Totale</h3>
              <p className="stat-number">€{stats.totalRevenue}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-content">
          <h2>Gestione Utenti</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Data Registrazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                    >
                      <option value="client">Cliente</option>
                      <option value="provider">Fornitore</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                      {user.isBlocked ? 'Bloccato' : 'Attivo'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`btn-action ${user.isBlocked ? 'btn-unblock' : 'btn-block'}`}
                        onClick={() => toggleUserBlock(user._id, user.isBlocked)}
                        disabled={user.role === 'admin'}
                      >
                        {user.isBlocked ? 'Sblocca' : 'Blocca'}
                      </button>
                      <button className="btn-action btn-details">Dettagli</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-content">
          <h2>Gestione Prenotazioni</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Servizio</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Stato</th>
                <th>Prezzo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.service?.name}</td>
                  <td>{booking.client?.name}</td>
                  <td>{new Date(booking.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>€{booking.totalPrice}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-details">Dettagli</button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => deleteBooking(booking._id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-content">
          <h2>Gestione Servizi</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrizione</th>
                <th>Prezzo</th>
                <th>Fornitore</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service._id}>
                  <td>{service.name}</td>
                  <td>{service.description.substring(0, 50)}...</td>
                  <td>€{service.price}</td>
                  <td>{service.provider?.name}</td>
                  <td>
                    <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                      {service.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-action"
                        onClick={() => toggleServiceStatus(service._id, service.isActive)}
                      >
                        {service.isActive ? 'Disattiva' : 'Attiva'}
                      </button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => deleteService(service._id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
