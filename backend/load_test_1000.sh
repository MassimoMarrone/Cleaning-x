#!/bin/bash

echo "🧪 Test di carico per 1000 utenti concorrenti"
echo "============================================="

# Verifica che Apache Bench sia installato
if ! command -v ab &> /dev/null; then
    echo "❌ Apache Bench non trovato. Installa con:"
    echo "   macOS: brew install httpd"
    echo "   Ubuntu: sudo apt-get install apache2-utils"
    exit 1
fi

# URL del server
SERVER_URL="http://localhost:8080"

echo "🎯 Testando $SERVER_URL"
echo ""

# Test 1: Endpoint servizi (il più usato)
echo "📋 Test 1: GET /api/services (simulazione utenti che cercano servizi)"
ab -n 1000 -c 100 -H "Accept: application/json" $SERVER_URL/api/services

echo ""
echo "============================================="

# Test 2: Endpoint specifico servizio
echo "📋 Test 2: GET /api/services/:id (dettaglio servizio)"
# Nota: sostituisci con un ID servizio reale dal tuo database
SERVICE_ID="66b472b218d05249f2a9fe78" # Esempio ID
ab -n 500 -c 50 -H "Accept: application/json" $SERVER_URL/api/services/$SERVICE_ID

echo ""
echo "============================================="

# Test 3: Homepage
echo "📋 Test 3: GET / (homepage)"
ab -n 500 -c 50 $SERVER_URL/

echo ""
echo "============================================="

# Test 4: Test autenticazione (simulazione login)
echo "📋 Test 4: POST /api/auth/login (simulazione login)"
# Crea file temporaneo con dati login
cat > /tmp/login_test.json << EOF
{
  "email": "mario@email.com",
  "password": "123456"
}
EOF

ab -n 100 -c 10 -p /tmp/login_test.json -T "application/json" $SERVER_URL/api/auth/login

# Pulisci file temporaneo
rm /tmp/login_test.json

echo ""
echo "🎉 Test completati!"
echo ""
echo "📊 Interpretazione risultati:"
echo "   - Requests per second: dovrebbe essere >100 per 1000 utenti"
echo "   - Time per request: dovrebbe essere <500ms per buona UX"
echo "   - Failed requests: dovrebbe essere 0"
echo ""
echo "⚠️  Se vedi errori di connessione, il server potrebbe aver bisogno di:"
echo "   - Più RAM (aumenta a 2GB)"
echo "   - PM2 cluster mode"
echo "   - Database ottimizzazioni"
