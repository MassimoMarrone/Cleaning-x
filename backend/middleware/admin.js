import User from '../models/User.js';

export default async function admin(req, res, next) {
  try {
    console.log('Admin middleware - req.user:', req.user); // Debug
    
    if (!req.user || !req.user.id) {
      return res.status(403).json({ error: 'Utente non autenticato' });
    }
    
    const user = await User.findById(req.user.id);
    console.log('User trovato:', user ? `${user.email} (${user.role})` : 'null'); // Debug
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso riservato agli admin' });
    }
    next();
  } catch (err) {
    console.error('Errore middleware admin:', err); // Debug
    res.status(403).json({ error: 'Accesso negato' });
  }
}
