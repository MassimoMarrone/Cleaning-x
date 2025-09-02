import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'provider', 'admin'], default: 'client' },
  phone: { type: String },
  address: { type: String },
  
  // Campi specifici per i fornitori di servizi
  businessName: { type: String }, // Solo per provider
  description: { type: String }, // Bio del fornitore
  profileImage: { type: String },
  serviceAreas: [{ type: String }], // Zone coperte
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
