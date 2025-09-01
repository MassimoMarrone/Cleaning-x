import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import serviceRoutes from './routes/service.js';
import bookingRoutes from './routes/booking.js';
import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/review.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@cleaningx.knbxkfz.mongodb.net/Cleaning-X', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Errore connessione MongoDB:'));
db.once('open', () => {
  console.log('Connesso a MongoDB');
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

// Avvio server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
