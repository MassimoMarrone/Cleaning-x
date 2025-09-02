import express from 'express';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

const router = express.Router();

// Middleware: tutte le route richiedono autenticazione admin
router.use(auth);
router.use(admin);

// GET /api/admin/stats - Statistiche generali
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalServices = await Service.countDocuments();
    
    // Calcola il fatturato totale
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Calcola utenti e prenotazioni del mese corrente
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    res.json({
      totalUsers,
      totalBookings,
      totalServices,
      totalRevenue,
      recentUsers,
      recentBookings
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error);
    res.status(500).json({ error: 'Errore nel recupero statistiche' });
  }
});

// GET /api/admin/users - Lista tutti gli utenti
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    res.status(500).json({ error: 'Errore nel recupero utenti' });
  }
});

// PUT /api/admin/users/:id/role - Aggiorna ruolo utente
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['client', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }
    
    // SICUREZZA: Limita il numero di admin
    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 3) { // Massimo 3 admin
        return res.status(403).json({ 
          error: 'Numero massimo di amministratori raggiunto (3)' 
        });
      }
    }
    
    // Impedisci la modifica del proprio ruolo
    if (req.user.id === id && role !== 'admin') {
      return res.status(403).json({ 
        error: 'Non puoi rimuovere i tuoi privilegi di admin' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    res.json({ message: 'Ruolo aggiornato con successo', user });
  } catch (error) {
    console.error('Errore nell\'aggiornamento ruolo:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento ruolo' });
  }
});

// GET /api/admin/bookings - Lista tutte le prenotazioni
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('client', 'name email')
      .populate('service', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Errore nel recupero prenotazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero prenotazioni' });
  }
});

// PUT /api/admin/bookings/:id/status - Aggiorna stato prenotazione
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    ).populate('user', 'name email').populate('service', 'name');
    
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    res.json({ message: 'Stato aggiornato con successo', booking });
  } catch (error) {
    console.error('Errore nell\'aggiornamento stato:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento stato' });
  }
});

// GET /api/admin/services - Lista tutti i servizi
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find()
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Errore nel recupero servizi:', error);
    res.status(500).json({ error: 'Errore nel recupero servizi' });
  }
});

// PUT /api/admin/services/:id/toggle - Attiva/disattiva servizio
router.put('/services/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const service = await Service.findByIdAndUpdate(
      id, 
      { isActive }, 
      { new: true }
    ).populate('provider', 'name email');
    
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    res.json({ 
      message: `Servizio ${isActive ? 'attivato' : 'disattivato'} con successo`, 
      service 
    });
  } catch (error) {
    console.error('Errore nel cambio stato servizio:', error);
    res.status(500).json({ error: 'Errore nel cambio stato servizio' });
  }
});

// PUT /api/admin/users/:id/block - Blocca/sblocca utente
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    
    // Non permettere di bloccare admin
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Non è possibile bloccare un admin' });
    }
    
    // Impedisci di bloccare se stesso
    if (req.user.id === id) {
      return res.status(403).json({ error: 'Non puoi bloccare te stesso' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { isBlocked }, 
      { new: true }
    ).select('-password');
    
    res.json({ 
      message: `Utente ${isBlocked ? 'bloccato' : 'sbloccato'} con successo`, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Errore nel blocco utente:', error);
    res.status(500).json({ error: 'Errore nel blocco utente' });
  }
});

// DELETE /api/admin/bookings/:id - Elimina prenotazione
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    res.json({ message: 'Prenotazione eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione prenotazione:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione prenotazione' });
  }
});

// DELETE /api/admin/services/:id - Elimina servizio
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prima elimina tutte le prenotazioni associate al servizio
    await Booking.deleteMany({ service: id });
    
    // Poi elimina il servizio
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    res.json({ message: 'Servizio e prenotazioni associate eliminate con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione servizio:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione servizio' });
  }
});

// DELETE /api/admin/users/:id - Elimina utente (use with caution)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Non permettere di eliminare admin
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Non è possibile eliminare un admin' });
    }
    
    // Elimina tutte le prenotazioni associate
    await Booking.deleteMany({ user: id });
    
    // Elimina tutti i servizi se è un provider
    if (user.role === 'provider') {
      await Service.deleteMany({ provider: id });
    }
    
    // Elimina l'utente
    await User.findByIdAndDelete(id);
    
    res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione utente:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione utente' });
  }
});

export default router;
