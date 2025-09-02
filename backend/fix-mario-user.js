import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Connesso a MongoDB');
  
  // Cerca l'utente esistente
  let user = await User.findOne({ email: 'mario@email.com' });
  
  if (user) {
    console.log('👤 Utente esistente trovato:', user.email);
    
    // Aggiorna la password a 123456
    const hashedPassword = await bcrypt.hash('123456', 10);
    user.password = hashedPassword;
    await user.save();
    
    console.log('🔐 Password aggiornata a "123456"');
  } else {
    console.log('🆕 Creazione nuovo utente mario@email.com');
    
    // Crea nuovo utente
    const hashedPassword = await bcrypt.hash('123456', 10);
    user = new User({
      name: 'Mario Rossi',
      email: 'mario@email.com',
      password: hashedPassword,
      role: 'client'
    });
    await user.save();
    
    console.log('✅ Utente creato con password "123456"');
  }
  
  // Test della password
  const isValid = await bcrypt.compare('123456', user.password);
  console.log('🧪 Test password "123456":', isValid ? '✅ VALIDA' : '❌ NON VALIDA');
  
  console.log('📋 Dettagli utente:');
  console.log('  - Email:', user.email);
  console.log('  - Nome:', user.name);
  console.log('  - Ruolo:', user.role);
  console.log('  - ID:', user._id);
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
