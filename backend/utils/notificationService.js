import Notification from '../models/Notification.js';

class NotificationService {
  // Crea una notifica per nuova prenotazione (per il provider)
  static async createBookingNotification(providerId, clientName, serviceName, bookingDate) {
    try {
      const notification = new Notification({
        user: providerId,
        type: 'booking',
        message: `Nuova prenotazione da ${clientName} per il servizio "${serviceName}" in data ${new Date(bookingDate).toLocaleDateString('it-IT')}`,
        link: '/bookings',
        isRead: false
      });
      await notification.save();
      console.log('Notifica prenotazione creata per provider:', providerId);
    } catch (error) {
      console.error('Errore nella creazione notifica prenotazione:', error);
    }
  }

  // Crea una notifica di conferma prenotazione (per il cliente)
  static async createBookingConfirmationNotification(clientId, serviceName, bookingDate) {
    try {
      const notification = new Notification({
        user: clientId,
        type: 'booking',
        message: `La tua prenotazione per "${serviceName}" del ${new Date(bookingDate).toLocaleDateString('it-IT')} è stata confermata!`,
        link: '/bookings',
        isRead: false
      });
      await notification.save();
      console.log('Notifica conferma prenotazione creata per cliente:', clientId);
    } catch (error) {
      console.error('Errore nella creazione notifica conferma:', error);
    }
  }

  // Crea una notifica per nuova recensione (per il provider)
  static async createReviewNotification(providerId, clientName, rating, serviceName) {
    try {
      const stars = '⭐'.repeat(rating);
      const notification = new Notification({
        user: providerId,
        type: 'review',
        message: `Nuova recensione ${stars} da ${clientName} per il servizio "${serviceName}"`,
        link: '/reviews',
        isRead: false
      });
      await notification.save();
      console.log('Notifica recensione creata per provider:', providerId);
    } catch (error) {
      console.error('Errore nella creazione notifica recensione:', error);
    }
  }

  // Crea una notifica di benvenuto per nuovi utenti
  static async createWelcomeNotification(userId, userRole) {
    try {
      let message = '';
      let link = '/dashboard';
      
      if (userRole === 'client') {
        message = 'Benvenuto su Cleaning-x! Esplora i nostri servizi di pulizia e prenota subito.';
        link = '/services';
      } else if (userRole === 'provider') {
        message = 'Benvenuto su Cleaning-x! Inizia a pubblicare i tuoi servizi di pulizia.';
        link = '/publish-service';
      }

      const notification = new Notification({
        user: userId,
        type: 'system',
        message,
        link,
        isRead: false
      });
      await notification.save();
      console.log('Notifica benvenuto creata per utente:', userId);
    } catch (error) {
      console.error('Errore nella creazione notifica benvenuto:', error);
    }
  }

  // Crea una notifica di promemoria profilo incompleto
  static async createProfileReminderNotification(userId) {
    try {
      const notification = new Notification({
        user: userId,
        type: 'reminder',
        message: 'Completa il tuo profilo per ottenere più prenotazioni e migliorare la tua visibilità!',
        link: '/profile',
        isRead: false
      });
      await notification.save();
      console.log('Notifica promemoria profilo creata per utente:', userId);
    } catch (error) {
      console.error('Errore nella creazione notifica promemoria:', error);
    }
  }

  // Crea una notifica per servizio approvato (per il provider)
  static async createServiceApprovedNotification(providerId, serviceName) {
    try {
      const notification = new Notification({
        user: providerId,
        type: 'system',
        message: `Il tuo servizio "${serviceName}" è stato approvato ed è ora visibile ai clienti!`,
        link: '/services',
        isRead: false
      });
      await notification.save();
      console.log('Notifica servizio approvato creata per provider:', providerId);
    } catch (error) {
      console.error('Errore nella creazione notifica servizio approvato:', error);
    }
  }

  // Crea una notifica per servizio rifiutato (per il provider)
  static async createServiceRejectedNotification(providerId, serviceName, reason) {
    try {
      const notification = new Notification({
        user: providerId,
        type: 'system',
        message: `Il tuo servizio "${serviceName}" è stato rifiutato. Motivo: ${reason}`,
        link: '/publish-service',
        isRead: false
      });
      await notification.save();
      console.log('Notifica servizio rifiutato creata per provider:', providerId);
    } catch (error) {
      console.error('Errore nella creazione notifica servizio rifiutato:', error);
    }
  }

  // Crea una notifica per cancellazione prenotazione
  static async createBookingCancelledNotification(userId, serviceName, bookingDate, reason) {
    try {
      const notification = new Notification({
        user: userId,
        type: 'booking',
        message: `La prenotazione per "${serviceName}" del ${new Date(bookingDate).toLocaleDateString('it-IT')} è stata cancellata. ${reason ? `Motivo: ${reason}` : ''}`,
        link: '/bookings',
        isRead: false
      });
      await notification.save();
      console.log('Notifica cancellazione prenotazione creata per utente:', userId);
    } catch (error) {
      console.error('Errore nella creazione notifica cancellazione:', error);
    }
  }

  // Notifica inviata al cliente quando il provider conferma il completamento
  static async createBookingCompletionNotification(clientId, serviceName) {
    try {
      const notification = new Notification({
        user: clientId,
        type: 'booking',
        message: `Il tuo professionista ha confermato il completamento di "${serviceName}". Controlla le foto e fornisci un feedback!`,
        link: '/bookings',
        isRead: false
      });
      await notification.save();
      console.log('Notifica completamento prenotazione creata per cliente:', clientId);
    } catch (error) {
      console.error('Errore nella creazione notifica completamento:', error);
    }
  }
}

export default NotificationService;
