# Stripe Integration Testing Guide

**Epic:** 2.4 - Payment Integration
**Date:** October 29, 2025

---

## 🧪 Testing Checklist

### Step 1: Environment Setup

**Backend (.env):**
```bash
# Stripe Environment (defaults to sandbox if not set)
STRIPE_ENV=sandbox  # Use 'sandbox' for testing, 'production' for live payments

# Stripe keys from dashboard (test mode for sandbox)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From stripe listen

# Price IDs from Stripe products (test mode IDs)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_TEAM_MONTHLY=price_xxxxx
STRIPE_PRICE_TEAM_ANNUAL=price_xxxxx

# URLs (local dev only — Vercel auto-resolves via VERCEL_URL)
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/pricing
CLIENT_URL=http://localhost:5173

# Enable auth
ENABLE_AUTH=true
```

**Frontend (.env):**
```bash
# Stripe Environment (defaults to sandbox if not set)
VITE_STRIPE_ENV=sandbox  # Use 'sandbox' for test cards, 'production' for real payments

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_ENABLE_AUTH=true
```

**Note:** The `STRIPE_ENV` and `VITE_STRIPE_ENV` variables control whether you're using Stripe's test mode (sandbox) or live mode (production). By default, sandbox mode is used, allowing you to test with test cards without any risk of real charges.

### Step 2: Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Terminal 3 - Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Step 3: Test Subscription Flow

1. **Navigate to Pricing Page**
   - Go to http://localhost:5173/pricing
   - Verify all 4 tiers display correctly
   - Verify "Pricing" link appears in header

2. **Sign In Required**
   - Click "Subscribe" on Starter tier
   - Should prompt to sign in if not authenticated
   - Sign in with test account

3. **Create Checkout Session**
   - Click "Subscribe" on Starter tier
   - Should redirect to Stripe Checkout
   - Verify correct price displays ($12/month)

4. **Complete Payment with Test Card**
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/25)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

5. **Verify Success Flow**
   - Should redirect to `/payment/success`
   - Success message displays
   - Auto-redirects to app after 5 seconds

6. **Check Database Updates**
   ```sql
   -- Verify stripe_customer_id added to user
   SELECT id, email, stripe_customer_id, tier FROM users WHERE email = 'test@example.com';

   -- Verify subscription created
   SELECT * FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
   ```

7. **Verify Webhook Processing**
   - Check Terminal 3 (Stripe CLI) for webhook events
   - Should see: `checkout.session.completed`
   - Check backend logs for tier update

### Step 4: Test Cancel Flow

1. Click back button during Stripe Checkout
2. Should redirect to `/payment/cancel`
3. Verify cancel message displays
4. Click "View Pricing Plans" - should go to /pricing
5. Click "Back to App" - should go to /

### Step 5: Test Tier Restrictions

1. **Free Tier (Current)**
   - Button should show "Current Plan"
   - Button should be disabled

2. **Other Tiers**
   - Should show "Subscribe" button
   - Should be clickable

### Step 6: Test Failed Payment

```
Card: 4000 0000 0000 0002 (Declined)
Expiry: Any future date
CVC: Any 3 digits
```

- Payment should fail at Stripe
- User should see error from Stripe
- No subscription should be created

---

## 🔍 Verification Commands

### Check User Tier
```bash
psql $POSTGRES_URL -c "SELECT id, email, tier, stripe_customer_id FROM users WHERE email = 'YOUR_EMAIL';"
```

### Check Subscriptions
```bash
psql $POSTGRES_URL -c "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;"
```

### Check Webhook Logs
```bash
# In Stripe Dashboard
# Developers > Webhooks > [Your Endpoint] > Event Logs
```

---

## 🐛 Troubleshooting

### "No Stripe customer" Error
- User doesn't have `stripe_customer_id`
- Should be created automatically on first subscription
- Check backend logs for Stripe API errors

### Webhook Not Received
- Ensure Stripe CLI is running: `stripe listen`
- Check webhook secret matches `.env`
- Check backend route: `POST /api/webhooks/stripe`

### Checkout Session Fails
- Verify price IDs in `.env` match Stripe Dashboard
- Check `STRIPE_SECRET_KEY` is valid
- Ensure user is authenticated

### Tier Not Updating
- Check webhook signature verification passes
- Check `subscriptionService` updates user tier
- Verify `user_quotas` table gets updated

---

## ✅ Production Deployment Checklist

Before deploying to production:

- [ ] Switch Stripe to live mode
- [ ] Update all env vars with live keys (`pk_live_`, `sk_live_`)
- [ ] Create production webhook in Stripe Dashboard
- [ ] Point webhook to: `https://codescribeai.com/api/webhooks/stripe`
- [ ] Update success/cancel URLs to production domain
- [ ] Test with live mode test cards before real payment
- [ ] Add legal links (Terms, Privacy) to checkout
- [ ] Configure Stripe email receipts
- [ ] Set up billing alert in Stripe Dashboard
- [ ] Monitor first 10 production subscriptions closely

---

## 📊 Success Metrics

After testing, you should see:

✅ User can navigate to /pricing
✅ User can start checkout for any paid tier
✅ Stripe Checkout displays correctly
✅ Payment completes successfully with test card
✅ User redirected to success page
✅ `stripe_customer_id` added to user record
✅ Subscription record created in database
✅ User tier updated from 'free' to 'starter'/'pro'/'team'
✅ Webhook events logged in Stripe CLI
✅ Cancel flow works correctly

---

**Ready for v2.4.0 release!** 🚀
