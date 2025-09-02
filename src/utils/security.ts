/**
 * 🔒 SECURITY UTILITIES
 * Funzioni per prevenire l'esposizione di informazioni sensibili
 */

/**
 * Sanitizza errori rimuovendo API keys e informazioni sensibili
 */
export const sanitizeError = (error: any): string => {
  let errorMessage = '';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && error.message) {
    errorMessage = error.message;
  } else if (error && error.toString) {
    errorMessage = error.toString();
  } else {
    errorMessage = 'Unknown error';
  }
  
  // Rimuove API keys Google Maps
  errorMessage = errorMessage.replace(/key=[^&\s]+/g, 'key=***');
  
  // Rimuove API keys nel formato AIza...
  errorMessage = errorMessage.replace(/AIza[A-Za-z0-9_-]{35}/g, 'AIza***');
  
  // Rimuove eventuali JWT tokens
  errorMessage = errorMessage.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 'jwt***');
  
  // Rimuove URL completi di Google Maps
  errorMessage = errorMessage.replace(/https:\/\/maps\.googleapis\.com[^\s]*/g, 'https://maps.googleapis.com/***');
  
  return errorMessage;
};

/**
 * Wrapper sicuro per console.error che sanitizza automaticamente gli errori
 */
export const safeConsoleError = (message: string, error?: any) => {
  console.error(message, error ? sanitizeError(error) : '');
};

/**
 * Wrapper sicuro per fetch che gestisce errori in modo sicuro
 */
export const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Log sicuro dell'errore
    safeConsoleError('Fetch error:', error);
    throw new Error(sanitizeError(error));
  }
};
