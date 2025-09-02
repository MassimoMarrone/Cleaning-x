import User from '../models/User.js';

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // SICUREZZA: Solo admin esistenti possono modificare ruoli
    // Questo endpoint dovrebbe essere usato solo attraverso le route admin protette
    if (!['client', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }
    
    // Impedisci la modifica del proprio ruolo admin per evitare lockout
    if (req.user && req.user.id === id && role !== 'admin') {
      return res.status(403).json({ error: 'Non puoi modificare il tuo stesso ruolo admin' });
    }
    
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ message: 'Ruolo aggiornato', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
