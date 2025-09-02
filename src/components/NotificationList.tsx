import React, { useEffect, useState } from 'react';
import '../styles/NotificationBell.css';

export interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListProps {
  userId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ userId, onClose, onUpdate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notification/user/${userId}`);
        if (!res.ok) throw new Error('Errore nel recupero delle notifiche');
        const data = await res.json();
        setNotifications(data);
      } catch (err: any) {
        setError(err.message || 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notification/${id}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (onUpdate) onUpdate(); // Notifica il parent component
    } catch (err) {
      // Gestione errore
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notification/${id}`, {
        method: 'DELETE',
      });
      setNotifications((prev) => prev.filter(n => n._id !== id));
      if (onUpdate) onUpdate(); // Notifica il parent component
    } catch (err) {
      // Gestione errore
    }
  };

  return (
    <div className="notification-list">
      <h4>Notifiche</h4>
      <button className="btn-notification" style={{ float: 'right', marginTop: '-32px' }} onClick={onClose}>Chiudi</button>
      {loading ? (
        <div>Caricamento...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : notifications.length === 0 ? (
        <div>Nessuna notifica</div>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n._id} className={n.isRead ? 'read' : 'unread'}>
              <span>{n.message}</span>
              <small style={{ color: '#888' }}>{new Date(n.createdAt).toLocaleString()}</small>
              <div>
                {!n.isRead && (
                  <button className="btn-notification" onClick={() => markAsRead(n._id)}>Segna come letta</button>
                )}
                <button className="btn-notification delete" onClick={() => deleteNotification(n._id)}>Elimina</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
