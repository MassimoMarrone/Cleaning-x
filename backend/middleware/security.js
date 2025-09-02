import rateLimit from 'express-rate-limit';

// Rate limiting per registrazione
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 3, // Massimo 3 registrazioni per IP ogni 15 minuti
  message: {
    error: 'Troppe registrazioni da questo IP, riprova tra 15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting per password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // Massimo 5 tentativi per IP ogni ora
  message: {
    error: 'Troppi tentativi di reset password, riprova tra 1 ora'
  }
});

// Rate limiting per azioni sensibili
export const sensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 10, // Massimo 10 azioni sensibili per IP ogni 5 minuti
  message: {
    error: 'Troppe azioni sensibili, riprova tra 5 minuti'
  }
});
