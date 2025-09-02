// Service per gestire le richieste di distanza con rate limiting e cache
class DistanceService {
  private cache = new Map<string, { distance: string; timestamp: number }>();
  private requestQueue: Array<{ resolve: Function; reject: Function; request: any }> = [];
  private isProcessing = false;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minuti
  private readonly REQUEST_DELAY = 500; // 500ms tra richieste

  // Genera chiave cache
  private getCacheKey(origin: any, destination: any): string {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
    return `${originStr}->${destStr}`;
  }

  // Verifica se il risultato è in cache e ancora valido
  private getFromCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.distance;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Salva nel cache
  private saveToCache(key: string, distance: string): void {
    this.cache.set(key, {
      distance,
      timestamp: Date.now()
    });
  }

  // Processa la queue delle richieste
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, request } = this.requestQueue.shift()!;
      
      try {
        // Ritardo tra richieste per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY));
        
        const result = await this.makeDistanceRequest(request);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  // Fa la richiesta effettiva all'API
  private async makeDistanceRequest({ origin, destination }: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/maps/distance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ origin, destination })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Errore calcolo distanza');
    }

    return data;
  }

  // Metodo pubblico per calcolare la distanza
  public async calculateDistance(origin: any, destination: any): Promise<any> {
    const cacheKey = this.getCacheKey(origin, destination);
    
    // Controlla cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        distance: { text: cached },
        duration: { text: 'N/A' }
      };
    }

    // Aggiunge alla queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve: (result: any) => {
          // Salva nel cache
          this.saveToCache(cacheKey, result.distance.text);
          resolve(result);
        },
        reject,
        request: { origin, destination }
      });

      // Avvia processamento queue
      this.processQueue();
    });
  }

  // Pulisce cache vecchia
  public clearOldCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Ottieni statistiche
  public getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Istanza singleton
export const distanceService = new DistanceService();

// Pulizia cache periodica
setInterval(() => {
  distanceService.clearOldCache();
}, 60000); // Ogni minuto
