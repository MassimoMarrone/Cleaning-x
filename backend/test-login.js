import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Connesso a MongoDB');
  const user = await User.findOne({ email: 'mario@email.com' });
  if (user) {
    console.log('👤 Utente trovato:', user.email);
    console.log('📧 Nome:', user.name);
    console.log('🏷️ Ruolo:', user.role);
    
    // Test password 123456
    const isValid = await bcrypt.compare('123456', user.password);
    console.log('🔐 Password "123456" valida:', isValid);
    
    if (!isValid) {
      console.log('🔍 Testando altre password comuni...');
      const testPasswords = ['password', 'mario123', 'admin', '1234567', 'mario'];
      for (const pwd of testPasswords) {
        const valid = await bcrypt.compare(pwd, user.password);
        if (valid) {
          console.log('✅ Password corretta trovata:', pwd);
          break;
        } else {
          console.log('❌ Password', pwd, 'non valida');
        }
      }
    }
  } else {
    console.log('❌ Utente non trovato');
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
