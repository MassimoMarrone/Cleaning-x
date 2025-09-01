import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'client' });
    await user.save();
    res.status(201).json({ message: 'Registrazione avvenuta', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email non trovata' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Password errata' });
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
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
