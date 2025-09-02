import express from 'express';
import { register, login, getProfile, switchRole } from '../controllers/authController.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Route esistenti
router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/switch-role', switchRole);

// Route speciale per creare il primo admin (SOLO se non esistono admin)
router.post('/create-first-admin', async (req, res) => {
  try {
    // Verifica se esistono già admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(403).json({ 
        error: 'Admin già esistenti. Utilizza la dashboard admin per gestire i ruoli.' 
      });
    }
    
    const { name, email, password, secretKey } = req.body;
    
    // Chiave segreta per sicurezza extra (opzionale)
    if (secretKey && secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: 'Chiave segreta non valida' });
    }
    
    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }
    
    // Crea il primo admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'admin' 
    });
    
    await admin.save();
    
    res.status(201).json({ 
      message: 'Primo amministratore creato con successo',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Errore nella creazione admin:', err);
    res.status(500).json({ error: 'Errore nella creazione dell\'amministratore' });
  }
});

export default router;
