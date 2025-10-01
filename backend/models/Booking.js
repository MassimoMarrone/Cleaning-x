import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  
  // Dettagli prenotazione
  date: { type: String, required: true }, // "2025-09-15"
  time: { type: String, required: true }, // "14:00"
  address: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String, default: '' },
  
  // Pricing
  basePrice: { type: Number, required: true },
  additionalServices: [{
    name: { type: String },
    price: { type: Number }
  }],
  totalPrice: { type: Number, required: true },
  
  // Stat
  status: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
  },

  // Prova di completamento inviata dal fornitore
  completionProof: {
    photos: [{ type: String }], // Base64 o URL immagini
    note: { type: String },
    submittedAt: { type: Date },
    verifiedByClient: { type: Boolean, default: false }
  },
  
  // Review system
  clientReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date }
  },
  providerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 🔒 INDICE COMPOSTO: Previene prenotazioni duplicate per stesso provider/data/ora
BookingSchema.index({ 
  provider: 1, 
  date: 1, 
  time: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    status: { $in: ['pending', 'accepted', 'in_progress'] } 
  }
});

// 🔒 INDICE: Ottimizza query per disponibilità
BookingSchema.index({ provider: 1, date: 1, status: 1 });

// 🔒 INDICE: Query veloci per dashboard utenti
BookingSchema.index({ client: 1, status: 1 });
BookingSchema.index({ provider: 1, status: 1 });

export default mongoose.model('Booking', BookingSchema);
