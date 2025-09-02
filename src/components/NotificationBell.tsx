
import { useState, useEffect } from 'react';
import NotificationList from './NotificationList';
import { useAuth } from '../hooks/useAuth';
import '../styles/NotificationBell.css';

export default function NotificationBell() {
  const [showList, setShowList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notification/user/${user?._id}`);
      if (res.ok) {
        const notifications = await res.json();
        const unread = notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Errore nel conteggio notifiche non lette:', error);
    }
  };

  const handleNotificationUpdate = () => {
    fetchUnreadCount(); // Ricarica il conteggio quando le notifiche vengono aggiornate
  };

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={() => setShowList(!showList)}>
        <span role="img" aria-label="notifiche">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {showList && user && (
        <NotificationList 
          userId={user._id} 
          onClose={() => setShowList(false)}
          onUpdate={handleNotificationUpdate}
        />
      )}
    </div>
  );
}
