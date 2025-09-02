// Middleware per logging performance e monitoring (ottimizzato per 1000 utenti)
export const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log richiesta in arrivo (ridotto per performance)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  }
  
  // Intercetta la fine della risposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    // Log solo in development o per richieste lente/errori
    if (process.env.NODE_ENV !== 'production' || duration > 1000 || res.statusCode >= 400) {
      console.log(`📤 ${statusColor} ${res.statusCode} - ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Alert per richieste molto lente (soglia ridotta per 1000 utenti)
    if (duration > 1000) {
      console.warn(`⚠️ SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    // Monitoring memoria ogni 100 richieste
    if (Math.random() < 0.01) { // 1% delle richieste
      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      console.log(`📊 Memory: ${memMB}MB heap used`);
      
      if (memMB > 700) { // Alert se supera 700MB
        console.warn(`⚠️ HIGH MEMORY USAGE: ${memMB}MB`);
      }
    }
  });
  
  next();
};

// Middleware per limitare dimensione upload
export const uploadLimiter = (req, res, next) => {
  if (req.get('Content-Length') > 10 * 1024 * 1024) { // 10MB
    return res.status(413).json({ error: 'File troppo grande. Limite 10MB' });
  }
  next();
};

// Middleware per sanitizzare input
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Rimuovi script tags potenzialmente pericolosi
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
};
