/**
 * 💰 CALCOLATORE COSTI GOOGLE MAPS API
 * Stima costi mensili per piattaforma Cleaning-x
 */

class GoogleMapsCostCalculator {
  constructor() {
    // Prezzi Google Maps API (dopo crediti gratuiti)
    this.pricing = {
      mapLoads: 7.00,        // $7 per 1,000 map loads
      geocoding: 5.00,       // $5 per 1,000 geocoding requests
      distanceMatrix: 10.00, // $10 per 1,000 distance requests
      placesAutocomplete: 32.00 // $32 per 1,000 autocomplete requests
    };
    
    // Crediti gratuiti mensili
    this.freeCredits = {
      mapLoads: 28000,
      geocoding: 40000,
      distanceMatrix: 40000,
      placesAutocomplete: 40000
    };
  }

  /**
   * 📊 CALCOLA COSTI PER SCENARIO D'USO
   */
  calculateMonthlyCosts(users, scenario = 'conservative') {
    const scenarios = {
      // Scenario conservativo
      conservative: {
        mapLoadsPerUser: 10,      // 10 visualizzazioni mappa/mese
        geocodingPerUser: 3,      // 3 geocoding (registrazione + 2 prenotazioni)
        distancePerUser: 5,       // 5 calcoli distanza
        autocompletePerUser: 8    // 8 autocomplete ricerche
      },
      
      // Scenario medio
      moderate: {
        mapLoadsPerUser: 25,      // 25 visualizzazioni mappa/mese
        geocodingPerUser: 8,      // 8 geocoding
        distancePerUser: 15,      // 15 calcoli distanza
        autocompletePerUser: 20   // 20 autocomplete ricerche
      },
      
      // Scenario intensivo
      intensive: {
        mapLoadsPerUser: 50,      // 50 visualizzazioni mappa/mese
        geocodingPerUser: 15,     // 15 geocoding
        distancePerUser: 30,      // 30 calcoli distanza
        autocompletePerUser: 40   // 40 autocomplete ricerche
      }
    };

    const usage = scenarios[scenario];
    
    // Calcola usage totale mensile
    const totalUsage = {
      mapLoads: users * usage.mapLoadsPerUser,
      geocoding: users * usage.geocodingPerUser,
      distanceMatrix: users * usage.distancePerUser,
      placesAutocomplete: users * usage.autocompletePerUser
    };

    // Calcola costi per ogni API
    const costs = {};
    let totalCost = 0;

    Object.keys(totalUsage).forEach(api => {
      const usage = totalUsage[api];
      const freeCredit = this.freeCredits[api];
      
      if (usage <= freeCredit) {
        costs[api] = 0;
      } else {
        const billableUsage = usage - freeCredit;
        const costPer1000 = this.pricing[api];
        costs[api] = (billableUsage / 1000) * costPer1000;
        totalCost += costs[api];
      }
    });

    return {
      scenario,
      users,
      totalUsage,
      costs,
      totalMonthlyCost: Math.round(totalCost * 100) / 100,
      totalYearlyCost: Math.round(totalCost * 12 * 100) / 100
    };
  }

  /**
   * 🎯 OTTIMIZZAZIONI PER RIDURRE COSTI
   */
  getOptimizationStrategies() {
    return {
      '🗺️ Caching Intelligente': {
        savings: '30-50%',
        description: 'Cache risultati geocoding e distanze per richieste simili',
        implementation: 'Redis cache con TTL 24h per coordinate'
      },
      
      '📍 Batch Requests': {
        savings: '20-30%',
        description: 'Raggruppa richieste Distance Matrix',
        implementation: 'Calcola distanze multiple in una richiesta'
      },
      
      '🎯 Lazy Loading': {
        savings: '15-25%',
        description: 'Carica mappe solo quando necessario',
        implementation: 'Inizializza mappa solo on-click/scroll'
      },
      
      '🔍 Autocomplete Debouncing': {
        savings: '40-60%',
        description: 'Ritarda richieste autocomplete',
        implementation: 'Debounce 300ms + minimo 3 caratteri'
      },
      
      '📊 Fallback Services': {
        savings: '10-20%',
        description: 'Usa servizi alternativi per funzioni base',
        implementation: 'OpenStreetMap per visualizzazioni semplici'
      }
    };
  }
}

// Test calcolatore
const calculator = new GoogleMapsCostCalculator();

console.log('💰 GOOGLE MAPS API - STIMA COSTI CLEANING-X');
console.log('='.repeat(50));

// Scenari per 1,000 utenti
const scenarios = ['conservative', 'moderate', 'intensive'];

scenarios.forEach(scenario => {
  const costs = calculator.calculateMonthlyCosts(1000, scenario);
  
  console.log(`\n📊 SCENARIO ${scenario.toUpperCase()} (1,000 utenti):`);
  console.log(`   Maps loads: ${costs.totalUsage.mapLoads.toLocaleString()}/mese`);
  console.log(`   Geocoding: ${costs.totalUsage.geocoding.toLocaleString()}/mese`);
  console.log(`   Distance Matrix: ${costs.totalUsage.distanceMatrix.toLocaleString()}/mese`);
  console.log(`   Autocomplete: ${costs.totalUsage.placesAutocomplete.toLocaleString()}/mese`);
  console.log(`   💰 COSTO MENSILE: $${costs.totalMonthlyCost}`);
  console.log(`   💰 COSTO ANNUALE: $${costs.totalYearlyCost}`);
});

console.log('\n🎯 OTTIMIZZAZIONI RACCOMANDATE:');
const optimizations = calculator.getOptimizationStrategies();
Object.entries(optimizations).forEach(([name, opt]) => {
  console.log(`   ${name}: Risparmio ${opt.savings}`);
  console.log(`      ${opt.description}`);
});

export default GoogleMapsCostCalculator;
