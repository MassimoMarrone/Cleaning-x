import User from '../models/User.js';

export default async function admin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso riservato agli admin' });
    }
    next();
  } catch (err) {
    res.status(403).json({ error: 'Accesso negato' });
  }
}
