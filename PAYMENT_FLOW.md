# Stripe Payment Flow - Visual Guide

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. Browse Services                          │
│  User sees services with base prices and service details       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. Select Service                           │
│  • Click "Prenota Ora" on desired service                      │
│  • Booking modal opens                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   3. Fill Booking Details                       │
│  • Select date and time from calendar                           │
│  • Enter phone number                                           │
│  • Enter address                                                │
│  • Select additional services (optional)                        │
│  • Review booking summary with fee breakdown                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  4. Review Price Breakdown                      │
│  ┌───────────────────────────────────────────────────┐         │
│  │ Servizio base:                          €100.00   │         │
│  │ Servizio aggiuntivo 1:                   €20.00   │         │
│  │ ─────────────────────────────────────────────     │         │
│  │ Subtotale servizio:                     €120.00   │         │
│  │ Costi di gestione (9%):                  €10.80   │         │
│  │ ═════════════════════════════════════════════     │         │
│  │ Totale finale:                          €130.80   │         │
│  └───────────────────────────────────────────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              5. Submit Booking Request                          │
│  • Click "Invia Richiesta di Prenotazione"                     │
│  • Backend creates booking with status "pending"                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   6. Payment Modal Opens                        │
│  • Booking modal closes                                         │
│  • Payment modal displays automatically                         │
│  • Shows payment summary                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                7. Payment Intent Creation                       │
│  Backend: POST /api/payments/create-payment-intent              │
│  ┌──────────────────────────────────────────────────┐          │
│  │ • Calculate total with 9% fee                    │          │
│  │ • Create Stripe PaymentIntent                    │          │
│  │ • Return clientSecret to frontend                │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              8. Display Stripe Payment Form                     │
│  ┌──────────────────────────────────────────────────┐          │
│  │  💳 Completa il Pagamento                        │          │
│  │  ────────────────────────────────────────         │          │
│  │  Prezzo servizio:              €120.00           │          │
│  │  Costi di gestione (9%):        €10.80           │          │
│  │  ═════════════════════════════                   │          │
│  │  Totale:                       €130.80           │          │
│  │                                                  │          │
│  │  [Card Number Field]                             │          │
│  │  [Expiry Date]  [CVC]                            │          │
│  │                                                  │          │
│  │  [Annulla]  [Paga €130.80]                      │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   9. User Enters Card Details                   │
│  • Card number: 4242 4242 4242 4242 (test)                     │
│  • Expiry: 12/25                                                │
│  • CVC: 123                                                     │
│  • Click "Paga €130.80"                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  10. Process Payment (Stripe)                   │
│  Frontend: stripe.confirmPayment()                              │
│  ┌──────────────────────────────────────────────────┐          │
│  │ • Validate card details                          │          │
│  │ • Process payment through Stripe                 │          │
│  │ • Handle 3D Secure if required                   │          │
│  │ • Return payment result                          │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         ✅ Success         ❌ Failure
                │                 │
                ▼                 ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   11a. Payment Success   │  │   11b. Payment Failed    │
│  • confirmPayment() OK   │  │  • Show error message    │
│  • Status: "succeeded"   │  │  • Allow retry           │
└───────────┬──────────────┘  └──────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              12. Confirm Payment on Backend                     │
│  Backend: POST /api/payments/confirm-payment                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ • Verify PaymentIntent status with Stripe        │          │
│  │ • Update booking.paymentStatus = "paid"          │          │
│  │ • Store chargeId                                 │          │
│  │ • Return confirmation                            │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  13. Show Success Message                       │
│  • Close payment modal                                          │
│  • Display success alert                                        │
│  • "Pagamento completato con successo!"                        │
│  • Booking confirmed                                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              14. Stripe Webhook (Background)                    │
│  Stripe → Backend: POST /api/payments/webhook                   │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Event: payment_intent.succeeded                  │          │
│  │ • Verify webhook signature                       │          │
│  │ • Update booking status (idempotent)             │          │
│  │ • Send confirmation email (future)               │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 💳 Payment States Diagram

```
                    ┌──────────────┐
                    │   BOOKING    │
                    │   CREATED    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   PENDING    │◄─────┐
                    │   PAYMENT    │      │
                    └──────┬───────┘      │
                           │              │
                  ┌────────┴────────┐     │
                  │                 │     │
            PAYMENT OK      PAYMENT FAILS │
                  │                 │     │
                  ▼                 ▼     │
           ┌──────────────┐  ┌──────────┴────┐
           │     PAID     │  │  RETRY PAYMENT │
           │   (SUCCESS)  │  │  (ERROR SHOWN) │
           └──────────────┘  └────────────────┘
```

## 🔄 Backend API Flow

```
Client                     Backend                    Stripe
  │                          │                          │
  │─────(1) Create Booking──▶│                          │
  │                          │                          │
  │◄────(2) Booking ID───────│                          │
  │                          │                          │
  │──(3) Create Payment──────▶│                          │
  │     Intent               │                          │
  │                          │──(4) Create Payment──────▶│
  │                          │     Intent (with 9% fee) │
  │                          │                          │
  │                          │◄─(5) Client Secret───────│
  │◄─(6) Client Secret───────│                          │
  │                          │                          │
  │──────────────────────────┼──(7) Confirm Payment────▶│
  │     (Stripe.js)          │     (with card details)  │
  │                          │                          │
  │◄─────────────────────────┼──(8) Payment Result──────│
  │                          │                          │
  │──(9) Confirm Payment─────▶│                          │
  │                          │                          │
  │                          │──(10) Verify Status──────▶│
  │                          │                          │
  │                          │◄─(11) Status Confirmed───│
  │                          │                          │
  │                          │─(12) Update Booking      │
  │                          │      Status = "paid"     │
  │                          │                          │
  │◄─(13) Success Response───│                          │
  │                          │                          │
  │                          │◄─(14) Webhook────────────│
  │                          │     (payment_intent.     │
  │                          │      succeeded)          │
  │                          │                          │
  │                          │─(15) Update Status       │
  │                          │     (idempotent)         │
```

## 🧮 Fee Calculation Flow

```
Input: Service Selection
  │
  ├─ Base Service Price: €100.00
  │
  ├─ Additional Services:
  │  ├─ Extra 1: €20.00
  │  └─ Extra 2: €15.00
  │
  ▼
Calculate Subtotal
  │
  │  Subtotal = 100 + 20 + 15 = €135.00
  │
  ▼
Apply Management Fee (9%)
  │
  │  Management Fee = 135 × 0.09 = €12.15
  │
  ▼
Calculate Final Total
  │
  │  Total = 135 + 12.15 = €147.15
  │
  ▼
Display Breakdown
  │
  ├─ Show in Booking Summary
  │  ├─ Subtotal: €135.00
  │  ├─ Fee (9%): €12.15
  │  └─ Total: €147.15
  │
  └─ Show in Payment Modal
     ├─ Amount to Charge: €147.15
     └─ Convert to Cents: 14715
```

## 📊 Database Updates Flow

```
                    Booking Document
┌───────────────────────────────────────────────────┐
│ Initial State (After Booking Creation)            │
├───────────────────────────────────────────────────┤
│ _id: "booking123"                                 │
│ client: "user456"                                 │
│ provider: "provider789"                           │
│ totalPrice: 135.00                                │
│ paymentIntentId: null                             │
│ paymentStatus: "pending"      ◄─── Initial        │
│ amount: null                                      │
│ chargeId: null                                    │
└───────────────────────────────────────────────────┘
                         │
                         ▼ After PaymentIntent Creation
┌───────────────────────────────────────────────────┐
│ paymentIntentId: "pi_1ABC..."   ◄─── Stripe ID   │
│ paymentStatus: "pending"                          │
│ amount: 14715              ◄─── Total in cents    │
│ currency: "EUR"                                   │
└───────────────────────────────────────────────────┘
                         │
                         ▼ After Payment Success
┌───────────────────────────────────────────────────┐
│ paymentIntentId: "pi_1ABC..."                     │
│ paymentStatus: "paid"          ◄─── Updated       │
│ amount: 14715                                     │
│ currency: "EUR"                                   │
│ chargeId: "ch_1XYZ..."         ◄─── Charge ID     │
└───────────────────────────────────────────────────┘
```

## 🎨 UI Component Hierarchy

```
Services Page
└── BookingModal (selectedService)
    ├── SimpleBookingCalendar
    │   └── AvailabilityChecker
    ├── BookingForm
    │   ├── DateTimeSelector
    │   ├── ContactFields
    │   ├── AdditionalServices
    │   └── BookingSummary
    │       ├── BasePrice
    │       ├── AdditionalServicesList
    │       ├── Subtotal
    │       ├── ManagementFee (9%)  ◄─── NEW
    │       └── Total               ◄─── NEW
    └── PaymentModal (after submit)  ◄─── NEW
        └── StripePaymentForm       ◄─── NEW
            ├── PaymentHeader
            │   └── PaymentSummary
            │       ├── Base Amount
            │       ├── Management Fee
            │       └── Total
            ├── StripeElements
            │   └── PaymentElement
            │       ├── CardNumber
            │       ├── Expiry
            │       └── CVC
            └── ActionButtons
                ├── CancelButton
                └── SubmitButton
```

## 🔐 Security Checkpoints

```
1. User Authentication
   └─► JWT Token Validation
       └─► Proceed if valid
           └─► Reject if invalid/expired

2. Booking Ownership
   └─► Verify user owns booking
       └─► Allow payment if owner
           └─► Reject if not owner

3. Payment Intent Creation
   └─► Server-side calculation
       └─► Verify amounts match
           └─► Create Stripe PaymentIntent

4. Payment Confirmation
   └─► Retrieve from Stripe
       └─► Verify status
           └─► Update database

5. Webhook Processing
   └─► Verify Stripe signature
       └─► Process if valid
           └─► Ignore if invalid
```

## 📱 Responsive Design Flow

```
Desktop View (> 768px)
┌────────────────────────────────────┐
│  [Payment Modal - Centered]        │
│  ┌──────────────────────────────┐  │
│  │  Payment Header              │  │
│  │  ─────────────────────────── │  │
│  │  Card Details [Wide Layout]  │  │
│  │  ─────────────────────────── │  │
│  │  [Cancel]  [Pay Button]      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘

Mobile View (< 768px)
┌──────────────────┐
│  Payment Modal   │
│  [Full Screen]   │
│  ──────────────  │
│  Payment Header  │
│  ──────────────  │
│  Card Details    │
│  [Stack Layout]  │
│  ──────────────  │
│  [Cancel]        │
│  [Pay Button]    │
│  [Full Width]    │
└──────────────────┘
```

## 🎯 Key Integration Points

1. **Services.tsx** → Creates booking → Opens payment modal
2. **StripePaymentForm.tsx** → Handles Stripe Elements
3. **paymentService.ts** → Communicates with backend
4. **paymentController.js** → Processes payments
5. **Stripe API** → Processes card charges
6. **Webhook** → Confirms payment asynchronously

## 📈 Success Metrics

```
✅ User completes booking in 3 steps
✅ Fee calculation is transparent (shown twice)
✅ Payment takes < 5 seconds to process
✅ Error messages are clear and actionable
✅ Mobile-friendly throughout
✅ No security vulnerabilities
✅ Webhook confirms payment within 30 seconds
```

## 🚀 Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Calculate Fee | `/api/payments/calculate-total` | POST |
| Create Payment | `/api/payments/create-payment-intent` | POST |
| Confirm Payment | `/api/payments/confirm-payment` | POST |
| Get Details | `/api/payments/booking/:id` | GET |
| Webhook | `/api/payments/webhook` | POST |

---

**For detailed implementation**, see `IMPLEMENTATION_SUMMARY.md`  
**For testing scenarios**, see `STRIPE_TESTING.md`  
**For setup instructions**, see `STRIPE_SETUP.md`
