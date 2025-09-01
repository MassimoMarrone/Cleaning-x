import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const getBookings = async (req, res) => {
  try {
    let query = {};
    
    // Se c'è un token, filtra per utente
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        // Mostra solo le prenotazioni dell'utente (come cliente o fornitore)
        query = {
          $or: [
            { client: decoded.userId },
            { provider: decoded.userId }
          ]
        };
      } catch (err) {
        return res.status(401).json({ error: 'Token non valido' });
      }
    }
    
    const bookings = await Booking.find(query)
      .populate('client', 'name email phone')
      .populate('provider', 'name businessName email phone')
      .populate('service', 'title category')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { service, provider, date, time, address, phone, notes, basePrice, additionalServices, totalPrice } = req.body;
    
    // Verifica token per ottenere l'utente cliente
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Login richiesto per prenotare' });
    }
    
    let clientId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      clientId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Token non valido' });
    }
    
    // Verifica che il servizio esista
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    // Verifica che il fornitore esista e sia effettivamente un provider
    const providerExists = await User.findById(provider);
    if (!providerExists || providerExists.role !== 'provider') {
      return res.status(404).json({ error: 'Fornitore non trovato' });
    }

    // 🔒 CONTROLLO DISPONIBILITÀ - Previene conflitti di prenotazione
    const conflictingBooking = await Booking.findOne({
      provider: provider,
      date: date,
      time: time,
      status: { $in: ['pending', 'accepted', 'in_progress'] } // Solo prenotazioni attive
    });

    if (conflictingBooking) {
      return res.status(409).json({ 
        error: 'Slot non disponibile',
        message: `Il fornitore è già prenotato per ${date} alle ${time}. Scegli un altro orario.`,
        availableSlots: await getAvailableSlots(provider, date)
      });
    }

    // 🔒 CONTROLLO DOPPIA PRENOTAZIONE UTENTE
    const userExistingBooking = await Booking.findOne({
      client: clientId,
      provider: provider,
      date: date,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    if (userExistingBooking) {
      return res.status(409).json({ 
        error: 'Prenotazione già esistente',
        message: 'Hai già una prenotazione attiva con questo fornitore per questa data.'
      });
    }
    
    const bookingData = {
      client: clientId,
      provider,
      service,
      date,
      time,
      address,
      phone,
      notes: notes || '',
      basePrice,
      additionalServices: additionalServices || [],
      totalPrice,
      status: 'pending'
    };
    
    const booking = new Booking(bookingData);
    await booking.save();
    
    // Popola i dati per la risposta
    await booking.populate('client', 'name email');
    await booking.populate('provider', 'name businessName email');
    await booking.populate('service', 'title category');
    
    res.status(201).json({ 
      message: 'Richiesta di prenotazione inviata con successo!', 
      booking 
    });
  } catch (err) {
    console.error('Errore creazione prenotazione:', err);
    res.status(400).json({ error: err.message });
  }
};

// Aggiorna stato prenotazione (per i fornitori)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    // Solo il fornitore può aggiornare lo status
    if (booking.provider.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();
    
    res.json({ message: 'Status aggiornato con successo', booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ottieni prenotazioni per dashboard fornitore
export const getProviderBookings = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const bookings = await Booking.find({ provider: decoded.userId })
      .populate('client', 'name email phone')
      .populate('service', 'title category')
      .sort({ createdAt: -1 });
    
    // Trasforma i dati per il frontend
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      serviceName: booking.service.title,
      date: booking.date,
      time: booking.time,
      address: booking.address,
      totalPrice: booking.totalPrice,
      status: booking.status,
      additionalServices: booking.additionalServices,
      notes: booking.notes,
      createdAt: booking.createdAt
    }));
    
    res.json({ bookings: formattedBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottieni prenotazioni per dashboard cliente
export const getClientBookings = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const bookings = await Booking.find({ client: decoded.userId })
      .populate('provider', 'name businessName email phone')
      .populate('service', 'title category')
      .sort({ createdAt: -1 });
    
    // Trasforma i dati per il frontend
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      providerName: booking.provider.businessName || booking.provider.name,
      providerEmail: booking.provider.email,
      serviceName: booking.service.title,
      date: booking.date,
      time: booking.time,
      address: booking.address,
      totalPrice: booking.totalPrice,
      status: booking.status,
      additionalServices: booking.additionalServices,
      notes: booking.notes,
      createdAt: booking.createdAt
    }));
    
    res.json({ bookings: formattedBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Annulla prenotazione (per clienti)
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    // Solo il cliente può annullare la propria prenotazione
    if (booking.client.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    // Solo prenotazioni pending o accepted possono essere annullate
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ error: 'Questa prenotazione non può essere annullata' });
    }
    
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();
    
    res.json({ message: 'Prenotazione annullata con successo', booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🚀 FUNZIONE HELPER: Ottieni slot disponibili per una data
const getAvailableSlots = async (providerId, date) => {
  try {
    // Slot standard (9:00 - 18:00 ogni 2 ore)
    const allSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
    
    // Trova prenotazioni esistenti per quella data
    const existingBookings = await Booking.find({
      provider: providerId,
      date: date,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    }, 'time');
    
    const bookedTimes = existingBookings.map(booking => booking.time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    return availableSlots;
  } catch (error) {
    console.error('Errore nel calcolo slot disponibili:', error);
    return [];
  }
};

// 🚀 ENDPOINT: Verifica disponibilità per un fornitore
export const checkAvailability = async (req, res) => {
  try {
    const { providerId, date } = req.params;
    
    // Verifica che il fornitore esista
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ error: 'Fornitore non trovato' });
    }
    
    const availableSlots = await getAvailableSlots(providerId, date);
    
    res.json({
      date,
      provider: {
        id: provider._id,
        name: provider.businessName || provider.name
      },
      availableSlots,
      totalSlots: 5
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
