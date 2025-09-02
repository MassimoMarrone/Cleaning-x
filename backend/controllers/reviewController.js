import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import NotificationService from '../utils/notificationService.js';

// Crea una nuova recensione
export const createReview = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const { bookingId, rating, comment, aspects } = req.body;

    // Verifica che la prenotazione esista e sia completata
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Puoi recensire solo servizi completati' });
    }

    // Verifica che l'utente sia il cliente della prenotazione
    if (booking.client.toString() !== decoded.userId) {
      return res.status(403).json({ error: 'Non autorizzato a recensire questa prenotazione' });
    }

    // Verifica che non esista già una recensione per questa prenotazione
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ error: 'Hai già recensito questo servizio' });
    }

    const reviewData = {
      booking: bookingId,
      reviewer: decoded.userId,
      reviewee: booking.provider,
      service: booking.service,
      rating,
      comment,
      aspects: aspects || {}
    };

    const review = new Review(reviewData);
    await review.save();

    // Aggiorna il rating del fornitore
    await updateProviderRating(booking.provider);

    await review.populate([
      { path: 'reviewer', select: 'name' },
      { path: 'service', select: 'title' }
    ]);

    // 🔔 NOTIFICA: Nuova recensione per il provider
    await NotificationService.createReviewNotification(
      booking.provider,
      review.reviewer.name,
      rating,
      review.service.title
    );

    res.status(201).json({ 
      message: 'Recensione creata con successo', 
      review 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ottieni recensioni per un fornitore
export const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Definisci l'ordinamento
    let sortOrder = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOrder = { createdAt: 1 };
        break;
      case 'highest':
        sortOrder = { rating: -1 };
        break;
      case 'lowest':
        sortOrder = { rating: 1 };
        break;
      default:
        sortOrder = { createdAt: -1 };
    }

    const reviews = await Review.find({ 
      reviewee: providerId,
      isVisible: true 
    })
    .populate('reviewer', 'name')
    .populate('service', 'title')
    .sort(sortOrder)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      reviewee: providerId,
      isVisible: true 
    });

    // Calcola statistiche complete
    const stats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(providerId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: '$rating' },
          avgPunctuality: { $avg: '$aspects.punctuality' },
          avgQuality: { $avg: '$aspects.quality' },
          avgCommunication: { $avg: '$aspects.communication' },
          avgValue: { $avg: '$aspects.value' }
        }
      }
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating]++;
      });
    }

    // Formatta le recensioni con nomi e date
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      clientName: review.reviewer.name,
      rating: review.rating,
      comment: review.comment,
      aspects: review.aspects,
      date: review.createdAt,
      serviceName: review.service ? review.service.title : 'Servizio non specificato'
    }));

    const responseStats = stats.length > 0 ? {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
      ratingDistribution,
      aspectAverages: {
        punctuality: Math.round((stats[0].avgPunctuality || 0) * 10) / 10,
        quality: Math.round((stats[0].avgQuality || 0) * 10) / 10,
        communication: Math.round((stats[0].avgCommunication || 0) * 10) / 10,
        value: Math.round((stats[0].avgValue || 0) * 10) / 10
      }
    } : {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution,
      aspectAverages: {
        punctuality: 0,
        quality: 0,
        communication: 0,
        value: 0
      }
    };

    res.json({
      reviews: formattedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: responseStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ottieni recensioni per un servizio
export const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const reviews = await Review.find({ 
      service: serviceId,
      isVisible: true 
    })
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      service: serviceId,
      isVisible: true 
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verifica se l'utente può recensire una prenotazione
export const canReview = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    // Verifica che l'utente sia il cliente
    if (booking.client.toString() !== decoded.userId) {
      return res.status(403).json({ canReview: false, reason: 'Non autorizzato' });
    }

    // Verifica che il servizio sia completato
    if (booking.status !== 'completed') {
      return res.status(200).json({ canReview: false, reason: 'Servizio non ancora completato' });
    }

    // Verifica che non ci sia già una recensione
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(200).json({ canReview: false, reason: 'Già recensito' });
    }

    res.json({ canReview: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Funzione helper per aggiornare il rating del fornitore
const updateProviderRating = async (providerId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(providerId), isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(providerId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        reviewCount: stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error('Errore aggiornamento rating:', error);
  }
};

// Ottieni prenotazioni che possono essere recensite
export const getReviewableBookings = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Accesso negato' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    // Trova prenotazioni completate senza recensione
    const bookings = await Booking.find({
      client: decoded.userId,
      status: 'completed'
    })
    .populate('provider', 'name businessName')
    .populate('service', 'title')
    .sort({ updatedAt: -1 });

    // Filtra quelle senza recensione
    const reviewableBookings = [];
    for (const booking of bookings) {
      const existingReview = await Review.findOne({ booking: booking._id });
      if (!existingReview) {
        reviewableBookings.push(booking);
      }
    }

    res.json({ bookings: reviewableBookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
