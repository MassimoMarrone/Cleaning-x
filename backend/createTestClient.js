import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestClient() {
  try {
    console.log('👤 Creo utente cliente di test...');

    // Controlla se esiste già
    const existingClient = await User.findOne({ email: 'cliente@test.com' });
    if (existingClient) {
      console.log('✅ Cliente di test già esistente');
      console.log('📧 Email: cliente@test.com');
      console.log('🔐 Password: password123');
      mongoose.connection.close();
      return;
    }

    const testClient = new User({
      name: 'Mario Clienti',
      email: 'cliente@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'client',
      phone: '+39 333 999 8888',
      address: 'Via Roma 123, 00100 Roma RM'
    });

    await testClient.save();
    
    console.log('✅ Cliente di test creato con successo!');
    console.log('📧 Email: cliente@test.com');
    console.log('🔐 Password: password123');
    console.log('📍 Indirizzo: Via Roma 123, 00100 Roma RM');

  } catch (error) {
    console.error('❌ Errore durante la creazione del cliente:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestClient();
