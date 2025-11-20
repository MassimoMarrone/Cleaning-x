# Stripe Payment Integration - Setup Guide

## Overview

This guide explains how to configure and use the Stripe payment integration in Cleaning-X. The system automatically adds a **9% management fee** to all service bookings.

## Features Implemented

✅ **Business Logic**: Automatic 9% management fee calculation  
✅ **Stripe Integration**: Secure payment processing via Stripe Elements  
✅ **Payment Flow**: Seamless booking → payment → confirmation  
✅ **Payment Status Tracking**: Real-time payment status updates  
✅ **Webhook Support**: Automatic payment confirmation via Stripe webhooks  
✅ **Responsive Design**: Mobile-friendly payment forms  

## Configuration

### 1. Backend Configuration

#### Update `.env` file in `/backend/` directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional, for production
```

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API keys
3. Copy your test keys (use live keys for production)

### 2. Frontend Configuration

#### Create `.env` file in the root directory:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**Note:** Only the publishable key is needed in the frontend. Never expose the secret key!

## Payment Flow

### 1. User Books a Service

When a user completes the booking form on the Services page:
- Base service price is calculated
- Additional services are added (if selected)
- **9% management fee is automatically calculated**
- Total price is displayed in the booking summary

### 2. Payment Modal Appears

After booking submission:
- A payment modal opens with Stripe Elements
- Payment breakdown shows:
  - Base service price
  - Management fee (9%)
  - Total amount to pay

### 3. Payment Processing

- User enters payment details (card number, expiry, CVC)
- Payment is processed securely through Stripe
- Payment status is updated in the database

### 4. Confirmation

- On success: User receives confirmation
- On failure: Error message is displayed
- Booking status is updated accordingly

## API Endpoints

### Create Payment Intent
```
POST /api/payments/create-payment-intent
Authorization: Bearer {token}

Body:
{
  "bookingId": "booking_id_here"
}

Response:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 109.00,
  "baseAmount": 100.00,
  "managementFee": 9.00,
  "currency": "EUR"
}
```

### Confirm Payment
```
POST /api/payments/confirm-payment
Authorization: Bearer {token}

Body:
{
  "paymentIntentId": "pi_xxx"
}

Response:
{
  "success": true,
  "paymentStatus": "paid",
  "booking": { ... }
}
```

### Get Payment Details
```
GET /api/payments/booking/:bookingId
Authorization: Bearer {token}

Response:
{
  "paymentIntentId": "pi_xxx",
  "paymentStatus": "paid",
  "baseAmount": 100.00,
  "managementFee": 9.00,
  "totalAmount": 109.00,
  "currency": "EUR",
  "chargeId": "ch_xxx"
}
```

### Calculate Payment Total
```
POST /api/payments/calculate-total

Body:
{
  "amount": 100
}

Response:
{
  "baseAmount": 100.00,
  "managementFee": 9.00,
  "managementFeePercentage": 9,
  "totalAmount": 109.00,
  "currency": "EUR"
}
```

### Stripe Webhook
```
POST /api/payments/webhook
Content-Type: application/json
Stripe-Signature: {stripe_signature}

Handles:
- payment_intent.succeeded
- payment_intent.payment_failed
```

## Testing with Stripe Test Cards

Use these test card numbers in development:

| Card Type | Number | CVC | Date |
|-----------|--------|-----|------|
| Success | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Decline | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| Requires Auth | 4000 0025 0000 3155 | Any 3 digits | Any future date |

## Business Logic - Management Fee Calculation

The system automatically adds a **9% management fee** to all bookings:

```javascript
// Example calculation
Base Price: €100.00
Management Fee (9%): €9.00
Total: €109.00
```

### Code Implementation

**Backend** (`paymentController.js`):
```javascript
const MANAGEMENT_FEE_PERCENTAGE = 0.09;

const calculateTotalWithFee = (baseAmount) => {
  const managementFee = baseAmount * MANAGEMENT_FEE_PERCENTAGE;
  const total = baseAmount + managementFee;
  return Math.round(total * 100) / 100;
};
```

**Frontend** (displayed in booking summary):
```javascript
const calculateTotalPriceWithFee = () => {
  const basePrice = calculateTotalPrice();
  const managementFee = basePrice * 0.09;
  return {
    base: basePrice,
    fee: managementFee,
    total: basePrice + managementFee
  };
};
```

## Database Schema

The `Booking` model includes these payment-related fields:

```javascript
{
  paymentIntentId: String,     // Stripe PaymentIntent ID
  paymentStatus: String,       // pending, paid, failed, etc.
  amount: Number,              // Total amount in cents
  currency: String,            // EUR, USD, etc.
  requiresAction: Boolean,     // SCA/3DS required
  chargeId: String,            // Stripe Charge ID
  refundIds: [String]          // Array of refund IDs
}
```

## Webhook Configuration (Production)

### 1. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### 2. Webhook Handler

The webhook automatically updates booking payment status when Stripe confirms payment.

## Security Features

✅ **Server-side validation**: All payment calculations verified on backend  
✅ **Token authentication**: JWT required for all payment endpoints  
✅ **Stripe signature verification**: Webhook events validated  
✅ **HTTPS only**: Production requires SSL/TLS  
✅ **No secret keys in frontend**: Only publishable key exposed  

## Troubleshooting

### Payment Modal Not Appearing

**Check:**
- Stripe publishable key is set in frontend `.env`
- Backend is running and accessible
- Token is valid and not expired

### Payment Fails

**Check:**
- Stripe secret key is valid
- Using correct test card numbers
- Network connection is stable
- Check browser console for errors

### Webhook Not Working

**Check:**
- Webhook secret is correct
- Webhook URL is publicly accessible
- Events are properly selected in Stripe dashboard
- Check Stripe dashboard for webhook delivery logs

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For integration issues:
- Check application logs
- Review browser console errors
- Verify environment variables are set correctly

## License

This integration follows the main project license.
