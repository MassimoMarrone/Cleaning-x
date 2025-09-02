import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function auth(req, res, next) {
  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token non fornito' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verifica il token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Trova l'utente nel database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }

    // Aggiungi l'utente alla richiesta
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Errore autenticazione:', error);
    res.status(401).json({ error: 'Token non valido' });
  }
}
