import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import NotificationService from '../utils/notificationService.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 🔒 VALIDAZIONE PASSWORD SICURA
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password deve essere almeno 6 caratteri' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });
    
    // 🔐 Hash password con bcrypt rounds maggiori per sicurezza
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, role: 'client' });
    await user.save();
    
    // 🔔 NOTIFICA: Benvenuto per nuovo utente
    await NotificationService.createWelcomeNotification(user._id, user.role);
    
    res.status(201).json({ message: 'Registrazione avvenuta', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // 🔒 PREVENZIONE USER ENUMERATION - Stesso messaggio per entrambi i casi
    if (!user) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Credenziali non valide' });
    }
    
    // 🔐 TOKEN JWT con scadenza sicura
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' } // Scadenza più specifica
    );
    
    res.json({ message: 'Login riuscito', token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato, token richiesto' });
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({ user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token non valido' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato, token richiesto' });
    }

    if (!['client', 'provider'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // 🛡️ PROTEZIONE ADMIN: Gli admin non possono cambiare ruolo
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Gli amministratori non possono cambiare ruolo' });
    }

    // Se passa a provider ma non ha informazioni business, inizializza campi base
    if (role === 'provider' && !user.businessName) {
      user.businessName = user.name + ' Services';
      user.businessDescription = 'Servizi di pulizia professionale';
      user.serviceAreas = ['Roma'];
      user.verified = false;
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(decoded.userId).select('-password');
    res.json({ 
      message: `Ruolo cambiato a ${role} con successo`, 
      user: updatedUser 
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token non valido' });
    }
    res.status(500).json({ error: err.message });
  }
};
