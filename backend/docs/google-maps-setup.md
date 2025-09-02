# 🗺️ Google Maps API Setup Guide

## Stato Attuale

### ✅ APIs Funzionanti
- **Geocoding API**: Attiva e funzionante
- Converte indirizzi in coordinate
- Test: Roma → 41.9032103, 12.4795059

### ❌ APIs con Problemi  
- **Distance Matrix API**: NON ABILITATA
- Errore: "You're calling a legacy API, which is not enabled for your project"
- Necessario abilitarla nel Google Cloud Console

## Prossimi Passi

### 1. Abilita Distance Matrix API
1. Vai su [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Cerca "Distance Matrix API"
3. Clicca su "ENABLE"

### 2. Alternative Moderne
Google suggerisce di usare:
- **Routes API** (più moderna)
- **Places API (New)**

### 3. Funzionalità Implementate

#### Backend APIs (/api/maps/)
- `POST /geocode` - ✅ Funzionante
- `POST /distance` - ❌ Richiede Distance Matrix API
- `POST /nearby-providers` - ⚠️ Dipende da Distance Matrix
- `POST /calculate-quote` - ⚠️ Dipende da Distance Matrix

#### Costi Stimati (una volta abilitata)
- Conservativo (1,000 utenti): $0/mese
- Moderato: $0/mese  
- Intensivo: $154/mese

## Test Rapidi

### Geocoding (funzionante)
```bash
curl -X POST http://localhost:8080/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"address": "Piazza di Spagna, Roma"}'
```

### Distance (dopo aver abilitato API)
```bash
curl -X POST http://localhost:8080/api/maps/distance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"origin": "Roma Termini", "destination": "Piazza di Spagna"}'
```
