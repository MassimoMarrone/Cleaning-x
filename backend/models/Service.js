import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['house-cleaning', 'office-cleaning', 'deep-cleaning', 'post-construction', 'windows', 'carpets', 'other']
  },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true },
  priceType: { type: String, enum: ['fixed', 'hourly', 'room'], default: 'fixed' },
  duration: { type: Number, required: true }, // in minuti
  serviceAreas: [{ type: String }], // Zone coperte
  availableDays: [{ type: String }], // Giorni disponibili
  availableHours: {
    start: { type: String }, // es: "08:00"
    end: { type: String }    // es: "18:00"
  },
  includedServices: [{ type: String }], // Cosa include
  additionalServices: [{
    name: { type: String },
    price: { type: Number }
  }],
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Service', ServiceSchema);
