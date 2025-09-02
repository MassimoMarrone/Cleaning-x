import mongoose from 'mongoose';
import Notification from './models/Notification.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addTestNotifications = async () => {
  try {
    // Trova il primo utente nel database
    const user = await User.findOne();
    if (!user) {
      console.log('Nessun utente trovato nel database');
      return;
    }

    console.log('Utente trovato:', user.email);

    // Crea notifiche di test
    const testNotifications = [
      {
        user: user._id,
        type: 'booking',
        message: 'La tua prenotazione è stata confermata!',
        link: '/bookings',
        isRead: false
      },
      {
        user: user._id,
        type: 'system',
        message: 'Benvenuto nella piattaforma Cleaning-x!',
        link: '/dashboard',
        isRead: false
      },
      {
        user: user._id,
        type: 'reminder',
        message: 'Non dimenticare di completare il tuo profilo',
        link: '/profile',
        isRead: true
      }
    ];

    // Rimuovi le notifiche esistenti per questo utente
    await Notification.deleteMany({ user: user._id });

    // Inserisci le nuove notifiche
    await Notification.insertMany(testNotifications);

    console.log('Notifiche di test aggiunte con successo!');
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    mongoose.disconnect();
  }
};

addTestNotifications();
