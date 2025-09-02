import express from 'express';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Ottieni tutte le notifiche dell'utente loggato
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero notifiche' });
  }
});

// Ottieni tutte le notifiche di un utente specifico (per il frontend)
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero notifiche' });
  }
});

// Crea una nuova notifica
router.post('/', auth, async (req, res) => {
  try {
    const { type, message, link } = req.body;
    const notification = new Notification({
      user: req.user.id,
      type,
      message,
      link
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: 'Errore nella creazione notifica' });
  }
});

// Marca una notifica come letta
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: 'Errore nel marcare come letta' });
  }
});

// Marca una notifica come letta (metodo PATCH)
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: 'Errore nel marcare come letta' });
  }
});

// Elimina una notifica
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Notifica eliminata' });
  } catch (error) {
    res.status(400).json({ error: 'Errore nell\'eliminazione notifica' });
  }
});

// Elimina una notifica (senza auth per frontend)
router.delete('/:id/simple', async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id });
    res.json({ message: 'Notifica eliminata' });
  } catch (error) {
    res.status(400).json({ error: 'Errore nell\'eliminazione notifica' });
  }
});

export default router;
