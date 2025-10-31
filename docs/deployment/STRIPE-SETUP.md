# Stripe Integration Setup Guide

**Last Updated:** October 29, 2025
**Status:** Implementation Guide for Epic 2.4
**Estimated Time:** 2-3 days

---

## 📋 Overview

This guide walks through setting up Stripe for CodeScribe AI's subscription-based monetization model. We'll configure 3 subscription products (Starter, Pro, Team) with monthly and annual billing options.

**Architecture:**
- **Backend:** Express routes + Stripe SDK + webhook handlers
- **Frontend:** Pricing page + Stripe Checkout + Customer Portal
- **Database:** User tier updates via webhooks

---

## 🎯 Products & Pricing

Based on [server/src/config/tiers.js](../../server/src/config/tiers.js):

| Tier | Monthly | Annual | Features |
|------|---------|--------|----------|
| **Free** | $0 | - | 10 docs/month, all core features |
| **Starter** | $12 | $120 (2 months free) | 50 docs/month, priority queue |
| **Pro** | $29 | $290 (2 months free) | 200 docs/month, batch processing, custom templates |
| **Team** | $99 | $990 (2 months free) | 1,000 docs/month, 10 users, integrations |
| **Enterprise** | Custom | Custom | Unlimited, SSO, SLA, white-label |

---

## 📝 Step 1: Create Stripe Account

1. **Sign up for Stripe**
   - Go to [https://stripe.com](https://stripe.com)
   - Create account with business email
   - Complete business profile (required for live mode)

2. **Enable Test Mode**
   - Use test mode for development
   - Toggle: Top-left corner "Test mode" switch
   - Test API keys start with `pk_test_` and `sk_test_`

3. **Get API Keys**
   ```bash
   # Navigate to: Developers > API keys
   # Copy these values (test mode first):

   Publishable key: pk_test_xxxxx
   Secret key: sk_test_xxxxx
   ```

---

## 🛍️ Step 2: Create Products in Stripe Dashboard

### Product 1: Starter Tier

1. **Navigate:** Products > Add Product
2. **Configure:**
   ```
   Name: CodeScribe AI - Starter
   Description: 50 docs/month, built-in API credits, priority queue, email support (48hr)

   Pricing:
   ✅ Recurring
   - Monthly: $12.00 USD
   - Annual: $120.00 USD (save $24/year)

   Metadata:
   - tier: starter
   - docs_per_month: 50
   - daily_limit: 10
   - max_file_size: 500000
   ```

3. **Save Product** → Copy Product ID and Price IDs

### Product 2: Pro Tier

1. **Navigate:** Products > Add Product
2. **Configure:**
   ```
   Name: CodeScribe AI - Pro
   Description: 200 docs/month, batch processing, custom templates, export formats (HTML/PDF), email support (24hr)

   Pricing:
   ✅ Recurring
   - Monthly: $29.00 USD
   - Annual: $290.00 USD (save $58/year)

   Metadata:
   - tier: pro
   - docs_per_month: 200
   - daily_limit: 50
   - max_file_size: 1000000
   ```

3. **Save Product** → Copy Product ID and Price IDs

### Product 3: Team Tier

1. **Navigate:** Products > Add Product
2. **Configure:**
   ```
   Name: CodeScribe AI - Team
   Description: 1,000 docs/month, 10 users, team workspace, integrations (Slack/GitHub), priority email support

   Pricing:
   ✅ Recurring
   - Monthly: $99.00 USD
   - Annual: $990.00 USD (save $198/year)

   Metadata:
   - tier: team
   - docs_per_month: 1000
   - daily_limit: 250
   - max_file_size: 5000000
   - max_users: 10
   ```

3. **Save Product** → Copy Product ID and Price IDs

---

## 🔑 Step 3: Configure Environment Variables

Add these to `server/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From Step 4

# Price IDs (from Step 2)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_TEAM_MONTHLY=price_xxxxx
STRIPE_PRICE_TEAM_ANNUAL=price_xxxxx

# URLs
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/pricing
CLIENT_URL=http://localhost:5173
```

Add to `client/.env`:

```bash
# Stripe Publishable Key (safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

## 🔔 Step 4: Set Up Webhooks

### Local Development (Stripe CLI)

The Stripe CLI is a **global command-line tool** (not an npm package) that forwards webhook events from Stripe's servers to your local development environment.

1. **Install Stripe CLI globally on your Mac:**
   ```bash
   # This installs the 'stripe' command globally via Homebrew
   # (Similar to how 'git' or 'npm' are installed globally)
   brew install stripe/stripe-cli/stripe

   # For other operating systems: https://stripe.com/docs/stripe-cli#install
   ```

2. **Login to Stripe (one-time setup):**
   ```bash
   # Run from anywhere - this saves your credentials globally
   stripe login

   # This will open your browser to authorize the CLI
   ```

3. **Forward webhooks to local server:**
   ```bash
   # Start this in a separate terminal while developing
   # (Keep it running alongside your server)
   stripe listen --forward-to localhost:3000/api/webhooks/stripe

   # Output will show webhook signing secret:
   # > Ready! Your webhook signing secret is whsec_xxxxx (copy this!)
   ```

4. **Copy webhook secret to `server/.env`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

**Note:** The Stripe CLI runs as a separate process - keep it running in its own terminal tab while you develop. When you test payments locally, Stripe will send webhook events to the CLI, which forwards them to your local server.

### Production (Stripe Dashboard - New Workbench UI)

Stripe has rolled out a new **Workbench** interface that replaces the old Developers Dashboard.

1. **Navigate to Workbench:**
   - Open Stripe Dashboard
   - Go to **Workbench** in the left sidebar
   - Click the **Webhooks** tab

2. **Create Event Destination:**
   - Click **"Create an event destination"** button
   - **Event source:** Select "Your account"
   - **API version:** Select latest version (or match your code's version)

3. **Select Events:**
   Select these event types to send to your webhook (search for each):
   ```
   ✅ checkout.session.completed       (Required - Initial subscription setup)
   ✅ customer.subscription.created    (Required - Track new subscriptions)
   ✅ customer.subscription.updated    (Required - Handle plan changes/renewals)
   ✅ customer.subscription.deleted    (Required - Downgrade to Free on cancel)
   ✅ invoice.payment_succeeded        (Required - Confirm successful payments)
   ✅ invoice.payment_failed           (Required - Handle failed payments)
   ```

   **Note:** If `customer.subscription.updated` is not visible in the event list, it may be:
   - Listed under a different category (try searching "subscription")
   - Included automatically with other subscription events
   - Available after selecting the API version

   At minimum, ensure you have:
   - `checkout.session.completed` (for new subscriptions)
   - `customer.subscription.deleted` (for cancellations)
   - `invoice.payment_failed` (for handling payment issues)

4. **Configure Endpoint:**
   - **Destination type:** Select "Webhook endpoint"
   - **Endpoint URL:** `https://codescribeai.com/api/webhooks/stripe`
   - **Description:** (Optional) "CodeScribe AI Production Webhook"

5. **Save & Copy Secret:**
   - After creation, copy the **webhook signing secret** (starts with `whsec_`)
   - Add to production `.env` as `STRIPE_WEBHOOK_SECRET`

**Note:** Your endpoint must be publicly accessible HTTPS for production. HTTP is only allowed for local development with the Stripe CLI.

---

## 🧪 Step 5: Test with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

| Scenario | Card Number | CVC | Expiry |
|----------|-------------|-----|--------|
| **Success** | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| **Declined** | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| **Requires Auth** | 4000 0025 0000 3155 | Any 3 digits | Any future date |
| **Insufficient Funds** | 4000 0000 0000 9995 | Any 3 digits | Any future date |

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🚀 Implementation Checklist

### Backend (server/)

- [ ] Install dependencies: `npm install stripe`
- [ ] Create `src/config/stripe.js` - Stripe SDK initialization
- [ ] Create `src/routes/payments.js` - Payment routes
  - [ ] `POST /api/payments/create-checkout-session`
  - [ ] `POST /api/payments/create-portal-session`
- [ ] Create `src/routes/webhooks.js` - Webhook handler
  - [ ] `POST /api/webhooks/stripe`
- [ ] Create `src/services/subscriptionService.js` - Tier update logic
- [ ] Add webhook signature verification
- [ ] Register routes in `server.js`

### Frontend (client/)

- [ ] Install dependencies: `npm install @stripe/stripe-js`
- [ ] Create `src/pages/PricingPage.jsx` - Pricing comparison
- [ ] Create `src/components/SubscriptionManagement.jsx` - Portal button
- [ ] Create `src/pages/PaymentSuccess.jsx` - Success page
- [ ] Add routes to `App.jsx`
- [ ] Update `Header.jsx` - Add "Pricing" link

### Database

- [ ] Add `stripe_customer_id` column to `users` table (migration)
- [ ] Add `stripe_subscription_id` column to `users` table
- [ ] Add `subscription_status` enum column (active, canceled, past_due, etc.)

### Testing

- [ ] Unit tests for payment routes
- [ ] Unit tests for webhook handlers
- [ ] Integration tests for subscription flow
- [ ] E2E tests with Stripe test cards

---

## 📊 Webhook Event Flow

### 1. User Subscribes

```
User clicks "Subscribe" on PricingPage
  → POST /api/payments/create-checkout-session
  → Redirect to Stripe Checkout
  → User completes payment
  → Stripe sends webhook: checkout.session.completed
  → Update user tier in database
  → Redirect user to /payment/success
```

### 2. Subscription Renews

```
Stripe auto-charges customer
  → Stripe sends webhook: invoice.payment_succeeded
  → Extend subscription period
  → Send receipt email (optional)
```

### 3. Payment Fails

```
Payment declined
  → Stripe sends webhook: invoice.payment_failed
  → Send dunning email (optional)
  → After 3 failures: customer.subscription.deleted
  → Downgrade user to Free tier
```

### 4. User Cancels

```
User clicks "Cancel Subscription" in Customer Portal
  → Stripe cancels subscription (end of billing period)
  → Stripe sends webhook: customer.subscription.deleted
  → Downgrade user to Free tier
```

---

## 🔒 Security Considerations

1. **Webhook Signature Verification**
   - ALWAYS verify webhook signatures before processing
   - Use `stripe.webhooks.constructEvent()` with webhook secret
   - Prevents unauthorized webhook requests

2. **API Key Security**
   - Never commit API keys to Git
   - Use environment variables
   - Rotate keys if exposed

3. **Idempotency**
   - Handle duplicate webhook events (Stripe may retry)
   - Use `event.id` to deduplicate
   - Store processed event IDs in database

4. **User Authorization**
   - Verify `req.user.id` matches Stripe customer
   - Prevent subscription management for other users

---

## 📚 Stripe Resources

- [Stripe Checkout Quickstart](https://stripe.com/docs/checkout/quickstart)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

```bash
# 1. Check Stripe CLI is running
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Verify endpoint in Stripe Dashboard
# Developers > Webhooks > [Your endpoint] > Test webhook

# 3. Check server logs for errors
# Look for "Webhook signature verification failed"
```

### Checkout Session Not Creating

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY
echo $STRIPE_PRICE_STARTER_MONTHLY

# Verify Price IDs are correct in Stripe Dashboard
# Products > [Product] > Copy Price ID
```

### User Tier Not Updating

```bash
# Check webhook logs in Stripe Dashboard
# Developers > Webhooks > [Endpoint] > Event logs

# Verify subscriptionService.js is updating database correctly
# Add console.log() statements to debug
```

---

## ✅ Go-Live Checklist

Before deploying to production:

- [ ] Switch to live mode in Stripe Dashboard
- [ ] Update `.env` with live API keys (`pk_live_`, `sk_live_`)
- [ ] Update webhook URL to `https://codescribeai.com/api/webhooks/stripe`
- [ ] Test with live mode test cards
- [ ] Complete Stripe business verification
- [ ] Set up payment method required for free trials (if applicable)
- [ ] Configure email receipts in Stripe Dashboard
- [ ] Add links to Terms of Service and Privacy Policy in Checkout
- [ ] Test subscription cancellation flow
- [ ] Monitor webhook delivery in production

---

**Next Steps:** Proceed to implementation with [Step 6: Install Stripe SDK](#step-6-install-stripe-sdk)

