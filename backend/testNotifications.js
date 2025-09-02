import mongoose from 'mongoose';
import NotificationService from './utils/notificationService.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testNotifications = async () => {
  try {
    // Trova un utente nel database
    const user = await User.findOne();
    if (!user) {
      console.log('Nessun utente trovato nel database');
      return;
    }

    console.log('Testando notifiche automatiche per utente:', user.email);

    // Test notifica di benvenuto
    console.log('🔔 Creando notifica di benvenuto...');
    await NotificationService.createWelcomeNotification(user._id, user.role);

    // Test notifica promemoria profilo
    console.log('🔔 Creando notifica promemoria profilo...');
    await NotificationService.createProfileReminderNotification(user._id);

    // Test notifica prenotazione (simula)
    console.log('🔔 Creando notifica prenotazione...');
    await NotificationService.createBookingNotification(
      user._id,
      'Cliente Test',
      'Pulizia Appartamento',
      new Date()
    );

    // Test notifica conferma prenotazione
    console.log('🔔 Creando notifica conferma prenotazione...');
    await NotificationService.createBookingConfirmationNotification(
      user._id,
      'Pulizia Ufficio',
      new Date()
    );

    // Test notifica recensione
    console.log('🔔 Creando notifica recensione...');
    await NotificationService.createReviewNotification(
      user._id,
      'Cliente Soddisfatto',
      5,
      'Pulizia Professionale'
    );

    console.log('✅ Tutte le notifiche di test sono state create con successo!');
    console.log('Controlla la campanella nell\'header per vederle.');

  } catch (error) {
    console.error('Errore nei test delle notifiche:', error);
  } finally {
    mongoose.disconnect();
  }
};

testNotifications();
