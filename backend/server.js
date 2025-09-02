import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import userRoutes from './routes/user.js';
import serviceRoutes from './routes/service.js';
import bookingRoutes from './routes/booking.js';
import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/review.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notification.js';
import mapsRoutes from './routes/maps.js';
import { performanceLogger, sanitizeInput } from './middleware/performance.js';

dotenv.config();

const app = express();

// 🛡️ SECURITY & PERFORMANCE MIDDLEWARE
app.use(helmet()); // Sicurezza headers HTTP
app.use(compression()); // Compressione gzip

// 🔒 CORS SICURO - Solo domini autorizzati
const corsOptions = {
  origin: [
    'http://localhost:5173', // Frontend dev
    'http://localhost:3000', // Frontend prod
    'https://cleaning-x.vercel.app', // Prod domain (example)
    'https://www.cleaning-x.com' // Prod domain (example)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Limita payload size
app.use(performanceLogger); // Log performance
app.use(sanitizeInput); // Sanitizza input

// 🚦 RATE LIMITING per 1000 utenti (aumentato per sviluppo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 1000, // 1000 richieste per IP ogni 15 minuti (aumentato per dev)
  message: {
    error: 'Troppe richieste da questo IP, riprova tra 15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 20, // 20 tentativi login per IP ogni 15 minuti (era 10)
  message: {
    error: 'Troppi tentativi di login, riprova tra 15 minuti'
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // 300 richieste API per minuto (aumentato per dev)
  message: {
    error: 'Troppe richieste API, rallenta'
  }
});

// Applica rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use(generalLimiter);

// Connessione a MongoDB ottimizzata per 1000 utenti
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 25, // Aumentato per 1000 utenti (era 10)
  minPoolSize: 5,  // Pool minimo per evitare lag
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000 // Monitoring connessione più frequente
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Errore connessione MongoDB:'));
db.once('open', () => {
  console.log('✅ Connesso a MongoDB');
  console.log(`📊 Pool size: ${mongoose.connection.readyState ? '25 connections (ottimizzato per 1000 utenti)' : 'Non connesso'}`);
});

// Rotta di test
app.get('/', (req, res) => {
  res.json({ message: 'Backend Cleaning-x attivo!' });
});

app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/maps', mapsRoutes); // 🗺️ Google Maps API

// Avvio server con gestione graceful shutdown
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`🛡️ Rate limiting: 300 req/15min per IP`);
  console.log(`⚡ Compressione gzip attiva`);
  console.log(`� In-memory cache attiva`);
  console.log(`🎯 Ottimizzato per ~1000 utenti concorrenti`);
  console.log(`📈 Pool DB: 25 connessioni`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔄 Avvia con PM2: pm2 start ecosystem.config.json`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM ricevuto, chiudo server...');
  server.close(() => {
    console.log('Server chiuso');
    mongoose.connection.close(false, () => {
      console.log('Connessione MongoDB chiusa');
      process.exit(0);
    });
  });
});
