import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Connesso a MongoDB');
  
  // Cerca l'utente admin esistente
  let adminUser = await User.findOne({ email: 'admin@cleaning-x.com' });
  
  if (adminUser) {
    console.log('👑 Admin esistente trovato:', adminUser.email);
    
    // Aggiorna la password a admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser.password = hashedPassword;
    adminUser.role = 'admin';
    await adminUser.save();
    
    console.log('🔐 Password admin aggiornata a "admin123"');
  } else {
    console.log('🆕 Creazione nuovo utente admin');
    
    // Crea nuovo utente admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = new User({
      name: 'Administrator',
      email: 'admin@cleaning-x.com',
      password: hashedPassword,
      role: 'admin'
    });
    await adminUser.save();
    
    console.log('✅ Admin creato con password "admin123"');
  }
  
  // Test della password admin
  const isValid = await bcrypt.compare('admin123', adminUser.password);
  console.log('🧪 Test password admin "admin123":', isValid ? '✅ VALIDA' : '❌ NON VALIDA');
  
  console.log('📋 Account di test configurati:');
  console.log('');
  console.log('👤 CLIENTE:');
  console.log('  - Email: mario@email.com');
  console.log('  - Password: 123456');
  console.log('  - Ruolo: client');
  console.log('');
  console.log('👑 ADMIN:');
  console.log('  - Email: admin@cleaning-x.com');
  console.log('  - Password: admin123');
  console.log('  - Ruolo: admin');
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Errore:', err.message);
  process.exit(1);
});
