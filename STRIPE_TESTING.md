# Stripe Payment Integration - Testing Guide

## Quick Start Testing

### Prerequisites

1. **Stripe Account**: Sign up at [Stripe](https://dashboard.stripe.com/register)
2. **Test API Keys**: Get from Stripe Dashboard → Developers → API keys
3. **Environment Setup**: Configure `.env` files as described in `STRIPE_SETUP.md`

### Setup Steps

#### 1. Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your Stripe test keys:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Frontend Configuration

```bash
cd ..  # Return to root
cp .env.example .env
```

Edit `.env` and add your Stripe publishable key:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

#### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Testing Scenarios

### Scenario 1: Successful Payment Flow

**Steps:**
1. Navigate to Services page (`http://localhost:5173`)
2. Click "Prenota Ora" on any service
3. Fill in booking details:
   - Select date and time from calendar
   - Enter phone number
   - Enter address
   - Optionally add additional services
4. Click "✅ Invia Richiesta di Prenotazione"
5. Payment modal appears showing:
   - Base service price
   - Management fee (9%)
   - Total amount
6. Enter test card details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
7. Click "Paga €X.XX"
8. Confirm payment succeeds

**Expected Results:**
- ✅ Payment modal shows correct calculations
- ✅ 9% fee is added to base price
- ✅ Payment processes successfully
- ✅ Success message appears
- ✅ Booking status updates to "paid"

### Scenario 2: Payment Declined

**Steps:**
1. Follow steps 1-5 from Scenario 1
2. Enter declined test card:
   - **Card Number**: `4000 0000 0000 0002`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
3. Click "Paga €X.XX"

**Expected Results:**
- ❌ Error message: "Your card was declined"
- ❌ Payment status remains "pending"
- ✅ User can retry with different card

### Scenario 3: 3D Secure Authentication

**Steps:**
1. Follow steps 1-5 from Scenario 1
2. Enter 3DS test card:
   - **Card Number**: `4000 0025 0000 3155`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
3. Click "Paga €X.XX"
4. Complete 3DS challenge (click "Complete" in test modal)

**Expected Results:**
- ✅ 3DS modal appears
- ✅ After completing authentication, payment succeeds
- ✅ Payment status updates correctly

### Scenario 4: Management Fee Calculation

**Test Case 1: Base Service Only**
- Base Price: €100.00
- Management Fee (9%): €9.00
- **Total: €109.00**

**Test Case 2: With Additional Services**
- Base Price: €100.00
- Additional Service 1: €20.00
- Additional Service 2: €15.00
- Subtotal: €135.00
- Management Fee (9%): €12.15
- **Total: €147.15**

**Verification:**
1. Create a booking with the above combinations
2. Check booking summary in modal
3. Verify payment modal shows correct amounts
4. Confirm backend calculates same amounts

### Scenario 5: Payment Cancellation

**Steps:**
1. Follow steps 1-5 from Scenario 1
2. Click "Annulla" button in payment modal
3. Observe behavior

**Expected Results:**
- ✅ Payment modal closes
- ✅ Alert: "Pagamento annullato..."
- ✅ Booking exists but payment status is "pending"

### Scenario 6: Token Expiration

**Steps:**
1. Login to the application
2. Wait for token to expire or manually clear localStorage
3. Try to create a booking and proceed to payment

**Expected Results:**
- ❌ Error: "Devi effettuare il login per procedere con il pagamento"
- ✅ User redirected to login

## Test Cards Reference

### Successful Payments

| Description | Card Number | CVC | Expiry |
|-------------|-------------|-----|--------|
| Visa | 4242 4242 4242 4242 | Any | Any future date |
| Mastercard | 5555 5555 5555 4444 | Any | Any future date |
| American Express | 3782 822463 10005 | Any | Any future date |

### Failed Payments

| Description | Card Number | CVC | Expiry |
|-------------|-------------|-----|--------|
| Generic Decline | 4000 0000 0000 0002 | Any | Any future date |
| Insufficient Funds | 4000 0000 0000 9995 | Any | Any future date |
| Lost Card | 4000 0000 0000 9987 | Any | Any future date |
| Stolen Card | 4000 0000 0000 9979 | Any | Any future date |

### 3D Secure Cards

| Description | Card Number | CVC | Expiry |
|-------------|-------------|-----|--------|
| 3DS Required | 4000 0025 0000 3155 | Any | Any future date |
| 3DS Optional | 4000 0027 6000 3184 | Any | Any future date |

## API Testing with cURL

### Test Payment Calculation

```bash
curl -X POST http://localhost:8080/api/payments/calculate-total \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

**Expected Response:**
```json
{
  "baseAmount": 100,
  "managementFee": 9,
  "managementFeePercentage": 9,
  "totalAmount": 109,
  "currency": "EUR"
}
```

### Test Payment Intent Creation

```bash
curl -X POST http://localhost:8080/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"bookingId": "YOUR_BOOKING_ID_HERE"}'
```

**Expected Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 109,
  "baseAmount": 100,
  "managementFee": 9,
  "currency": "EUR"
}
```

## Database Verification

### Check Payment Status

```javascript
// MongoDB query
db.bookings.find({ _id: ObjectId("YOUR_BOOKING_ID") })
```

**Expected Fields:**
```json
{
  "_id": "...",
  "paymentIntentId": "pi_xxx",
  "paymentStatus": "paid",
  "amount": 10900,  // In cents
  "currency": "EUR",
  "chargeId": "ch_xxx"
}
```

## Browser Console Testing

Open browser console (F12) and check for:

### Successful Payment
```
✅ Pagamento confermato per booking 123abc
```

### Payment Errors
```
❌ Errore nel pagamento: [error message]
```

### Network Requests
1. Open Network tab
2. Filter by "payments"
3. Verify requests to:
   - `/api/payments/create-payment-intent`
   - `/api/payments/confirm-payment`

## Stripe Dashboard Verification

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Payments**
3. Verify test payments appear with:
   - Correct amount (including 9% fee)
   - Status: "Succeeded"
   - Description: "Pagamento per [Service Name]"
   - Metadata: booking ID, client details

## Troubleshooting

### Payment Modal Not Opening

**Check:**
```javascript
// Browser console
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
// Should output: pk_test_...
```

### Wrong Amount Calculated

**Verify:**
1. Backend calculation in `paymentController.js`
2. Frontend calculation in `Services.tsx`
3. Both should use 9% (0.09) multiplier

### Payment Fails with "Invalid Key"

**Solution:**
- Verify API keys are correct
- Ensure using test keys (start with `pk_test_` and `sk_test_`)
- Check for extra spaces in `.env` file

### Webhook Not Triggering (Production)

**Debug:**
1. Check Stripe Dashboard → Webhooks
2. Verify endpoint URL is correct
3. Check webhook secret in `.env`
4. Review webhook logs in Stripe Dashboard

## Performance Testing

### Load Testing with Multiple Bookings

```bash
# Create 10 bookings in quick succession
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{...booking data...}'
done
```

**Monitor:**
- Response times
- Database connections
- Stripe API rate limits

## Security Checklist

- [ ] Secret keys never exposed in frontend
- [ ] All payment endpoints require authentication
- [ ] HTTPS used in production
- [ ] Webhook signature verified
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled

## Test Coverage

### Backend
- [x] Payment calculation (9% fee)
- [x] PaymentIntent creation
- [x] Payment confirmation
- [x] Webhook handling
- [x] Error handling
- [x] Authentication checks

### Frontend
- [x] Payment modal rendering
- [x] Stripe Elements integration
- [x] Amount display with fee
- [x] Success/error handling
- [x] Loading states
- [x] Cancellation flow

## Next Steps

After successful testing:

1. **Update API Keys for Production**
   - Replace test keys with live keys
   - Update webhook endpoints
   - Configure production webhook secret

2. **Monitor in Production**
   - Set up Stripe monitoring
   - Configure email alerts
   - Review payment logs regularly

3. **Customer Support**
   - Document common payment issues
   - Train support team on Stripe dashboard
   - Prepare refund procedures

## Support Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Elements Customization](https://stripe.com/docs/stripe-js)
- Project `STRIPE_SETUP.md` for configuration

## Report Issues

Found a bug? Report it with:
- Steps to reproduce
- Expected vs actual behavior
- Browser console errors
- Network request details
- Test card used
