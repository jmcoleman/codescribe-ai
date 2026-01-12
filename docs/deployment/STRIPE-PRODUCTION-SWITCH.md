# Switching Stripe from Sandbox to Production

## Overview

This guide walks through switching CodeScribe AI from Stripe test mode (sandbox) to live mode (production) to accept real payments. The switch is done entirely through Stripe Dashboard and Vercel environment variables - no code changes required.

**Estimated Time:** 30-60 minutes
**Prerequisite:** Stripe account with completed business verification

---

## Before You Begin

### Prerequisites Checklist

- [ ] Stripe account created and logged in
- [ ] Business verification completed in Stripe Dashboard
- [ ] Bank account connected to Stripe for payouts
- [ ] Terms of Service and Privacy Policy published
- [ ] Test subscription flow working in sandbox mode
- [ ] Access to Vercel Dashboard for environment variables

### What This Switch Does

| Aspect | Sandbox (Current) | Production (After) |
|--------|------------------|-------------------|
| **API Keys** | `sk_test_...` / `pk_test_...` | `sk_live_...` / `pk_live_...` |
| **Price IDs** | Test mode prices | Live mode prices |
| **Test Cards** | 4242 4242 4242 4242 works | Real cards only |
| **Charges** | Fake (no money moves) | Real (actual charges) |
| **Stripe Dashboard** | "Test Mode" badge | "Live Mode" badge |
| **Webhooks** | Local CLI or test endpoint | Production endpoint |

---

## Step 1: Complete Stripe Business Verification

Before you can accept live payments, Stripe requires business verification.

### 1.1 Navigate to Business Settings

1. Log into **Stripe Dashboard**: https://dashboard.stripe.com
2. Ensure you're in **Live Mode** (toggle in top-right corner should be OFF)
3. Go to **Settings → Account**

### 1.2 Complete Business Profile

Fill in all required fields:

- **Business name**: CodeScribe AI (or your registered business name)
- **Business type**: Individual or Company (based on your LLC status)
- **Tax ID**: SSN (individual) or EIN (company)
- **Business address**: Your legal address
- **Phone number**: Contact phone
- **Website**: https://codescribeai.com
- **Product description**: "AI-powered code documentation generator for developers"

### 1.3 Add Bank Account

1. Go to **Settings → Bank accounts and scheduling**
2. Click **Add bank account**
3. Enter your bank details for receiving payouts
4. Verify micro-deposits (if required)

### 1.4 Verify Identity

Stripe may require identity verification:
- Upload government-issued ID
- Provide any additional documentation requested
- Wait for approval (usually 1-2 business days)

---

## Step 2: Create Live Mode Products and Prices

Your test mode products don't automatically carry over to live mode. You must recreate them.

### 2.1 Switch to Live Mode

1. In Stripe Dashboard, click the **Test mode** toggle (top-right)
2. Ensure it's OFF (you should see "Live mode" in the interface)

### 2.2 Create Starter Product

1. **Navigate:** Products → **Add product**
2. **Configure:**
   ```
   Name: CodeScribe AI - Starter
   Description: 50 docs/month, built-in API credits, priority queue, email support (48hr)
   ```

3. **Add Monthly Price:**
   - Click **Add another price**
   - Pricing model: **Recurring**
   - Price: **$12.00 USD**
   - Billing period: **Monthly**
   - Click **Add price**

4. **Add Annual Price:**
   - Click **Add another price**
   - Pricing model: **Recurring**
   - Price: **$120.00 USD**
   - Billing period: **Yearly**
   - Click **Add price**

5. **Add Metadata** (optional but recommended):
   - Click **Metadata** section
   - Add key-value pairs:
     - `tier`: `starter`
     - `docs_per_month`: `50`
     - `daily_limit`: `10`

6. **Save Product**
7. **Copy Price IDs:**
   - Click on the **Monthly price** → Copy the Price ID (starts with `price_`)
   - Click on the **Annual price** → Copy the Price ID
   - Save these IDs - you'll need them for environment variables

### 2.3 Create Pro Product

1. **Navigate:** Products → **Add product**
2. **Configure:**
   ```
   Name: CodeScribe AI - Pro
   Description: 200 docs/month, batch processing, custom templates, export formats (HTML/PDF), email support (24hr)
   ```

3. **Add Monthly Price:** $29.00 USD, Monthly
4. **Add Annual Price:** $290.00 USD, Yearly
5. **Add Metadata:**
   - `tier`: `pro`
   - `docs_per_month`: `200`
   - `daily_limit`: `50`

6. **Save and Copy Price IDs**

### 2.4 Create Team Product

1. **Navigate:** Products → **Add product**
2. **Configure:**
   ```
   Name: CodeScribe AI - Team
   Description: 1,000 docs/month, 10 users, team workspace, integrations (Slack/GitHub), priority email support
   ```

3. **Add Monthly Price:** $99.00 USD, Monthly
4. **Add Annual Price:** $990.00 USD, Yearly
5. **Add Metadata:**
   - `tier`: `team`
   - `docs_per_month`: `1000`
   - `daily_limit`: `250`
   - `max_users`: `10`

6. **Save and Copy Price IDs**

### 2.5 Price ID Reference Sheet

Create a reference document with your new live mode Price IDs:

```
LIVE MODE PRICE IDs (Created on YYYY-MM-DD)
==========================================
Starter Monthly: price_XXXXXXXXXXXXX
Starter Annual:  price_XXXXXXXXXXXXX
Pro Monthly:     price_XXXXXXXXXXXXX
Pro Annual:      price_XXXXXXXXXXXXX
Team Monthly:    price_XXXXXXXXXXXXX
Team Annual:     price_XXXXXXXXXXXXX
```

**Important:** Keep this secure - you'll need it for Vercel configuration.

---

## Step 3: Get Live Mode API Keys

### 3.1 Navigate to API Keys

1. Ensure you're in **Live Mode** (toggle OFF)
2. Go to **Developers → API keys**

### 3.2 Copy Live Keys

You should see two keys:

1. **Publishable key** (starts with `pk_live_`)
   - Click **"Reveal live key"** if hidden
   - Copy the entire key
   - Safe to expose in frontend code

2. **Secret key** (starts with `sk_live_`)
   - Click **"Reveal live key"**
   - Copy the entire key
   - ⚠️ **Never commit to Git or expose publicly**

### 3.3 Key Security

- Store keys in password manager
- Never commit to version control
- Only add to Vercel environment variables
- Rotate immediately if exposed

---

## Step 4: Set Up Production Webhook

Webhooks notify your server of subscription events (payments, cancellations, etc.).

### 4.1 Create Webhook Endpoint

1. **Navigate:** Workbench → **Webhooks** tab
2. Click **"Create an event destination"**

### 4.2 Configure Event Source

- **Event source:** Select **"Your account"**
- **API version:** Select latest (or match your current version)

### 4.3 Select Events to Send

Search for and select these events:

```
✅ checkout.session.completed       (New subscription created)
✅ customer.subscription.created    (Track new subscriptions)
✅ customer.subscription.updated    (Plan changes, renewals)
✅ customer.subscription.deleted    (Cancellations)
✅ invoice.payment_succeeded        (Successful payments)
✅ invoice.payment_failed           (Failed payments)
```

**Note:** If `customer.subscription.updated` is not visible, ensure you've selected the correct API version or search for "subscription" to find related events.

### 4.4 Configure Endpoint

- **Destination type:** Select **"Webhook endpoint"**
- **Endpoint URL:** `https://codescribeai.com/api/webhooks/stripe`
- **Description:** "CodeScribe AI Production Webhook"

### 4.5 Save and Copy Secret

1. Click **Save** or **Create**
2. Copy the **webhook signing secret** (starts with `whsec_`)
3. Store securely - you'll need this for Vercel

### 4.6 Verify Endpoint (After Deployment)

After you deploy with the new webhook secret:

1. Go back to **Workbench → Webhooks**
2. Click on your endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Click **Send test webhook**
6. Verify the response shows **200 OK**

---

## Step 5: Update Vercel Environment Variables

All configuration changes happen in Vercel - no code changes needed.

### 5.1 Navigate to Vercel Settings

1. Go to **Vercel Dashboard**: https://vercel.com
2. Select your **codescribe-ai** project
3. Go to **Settings → Environment Variables**

### 5.2 Update Backend Variables (Production Environment)

For each variable below, click **Edit** and update the **Production** environment value:

#### Switch to Production Mode
```bash
STRIPE_ENV=production
```

#### Update API Keys
```bash
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
```
Replace with your live keys from Step 3.

#### Update Webhook Secret
```bash
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX
```
Replace with your production webhook secret from Step 4.

#### Update Price IDs
```bash
STRIPE_PRICE_STARTER_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_STARTER_ANNUAL=price_XXXXXXXXXXXXX
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_PRO_ANNUAL=price_XXXXXXXXXXXXX
STRIPE_PRICE_TEAM_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_TEAM_ANNUAL=price_XXXXXXXXXXXXX
```
Replace with your live mode Price IDs from Step 2.

### 5.3 Update Frontend Variables (Production Environment)

```bash
VITE_STRIPE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
```
Use the same live publishable key from Step 3.

### 5.4 Verify All Changes

Before saving, double-check:
- [ ] All keys start with `sk_live_` or `pk_live_` (not `sk_test_`)
- [ ] All price IDs start with `price_` (from live mode products)
- [ ] Webhook secret starts with `whsec_`
- [ ] Both `STRIPE_ENV` and `VITE_STRIPE_ENV` set to `production`
- [ ] Changes are only for **Production** environment (not Preview/Development)

---

## Step 6: Deploy to Production

### 6.1 Trigger Redeploy

After updating environment variables, you must redeploy for changes to take effect:

**Option A: Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Find your latest production deployment
3. Click the **three dots (⋯)** menu
4. Click **Redeploy**
5. Confirm redeploy

**Option B: Push New Commit**
```bash
# Make a trivial change to trigger deployment
git commit --allow-empty -m "chore: deploy Stripe production mode"
git push origin main
```

### 6.2 Monitor Deployment

1. Watch deployment logs in Vercel Dashboard
2. Wait for **"Build Completed"** status
3. Verify deployment shows **"Ready"**

### 6.3 Verify Environment Variables Loaded

Check your production logs to ensure variables loaded correctly:

1. Go to **Vercel Dashboard → Deployments**
2. Click on the latest production deployment
3. Go to **Logs** tab
4. Look for any errors related to Stripe configuration

---

## Step 7: Test Production Payments

Before announcing to users, thoroughly test the live payment flow.

### 7.1 Test Successful Subscription

1. **Open production site:** https://codescribeai.com
2. **Create test account** (or use existing account)
3. **Navigate to Pricing:** `/pricing`
4. **Click "Subscribe"** on Starter plan (lowest cost for testing)
5. **Enter real payment details:**
   - Card number: Your actual credit/debit card
   - Expiration: Actual expiration date
   - CVC: Actual security code
   - Billing address: Your real address

6. **Complete payment**
7. **Verify success flow:**
   - [ ] Redirects to `/payment/success`
   - [ ] Success message displays
   - [ ] Account shows upgraded tier (e.g., "Starter")
   - [ ] Usage limits updated (e.g., 50 docs/month)

### 7.2 Verify Webhook Delivery

1. **Go to Stripe Dashboard (Live Mode)**
2. **Navigate:** Workbench → **Webhooks**
3. **Click on your endpoint**
4. **View recent events:**
   - [ ] `checkout.session.completed` event delivered
   - [ ] Response status: **200 OK**
   - [ ] No errors in response body

### 7.3 Test Customer Portal

1. **Go to Account Settings** in CodeScribe
2. **Click "Manage Subscription"**
3. **Verify:**
   - [ ] Opens Stripe Customer Portal
   - [ ] Shows active subscription
   - [ ] Displays correct plan and price
   - [ ] Can view invoices

### 7.4 Test Subscription Cancellation

1. **In Customer Portal, click "Cancel plan"**
2. **Confirm cancellation**
3. **Verify:**
   - [ ] Cancellation confirmation shown
   - [ ] Subscription shows "Cancels on [date]"
   - [ ] Webhook `customer.subscription.updated` delivered
   - [ ] (After billing period ends) Account downgrades to Free

### 7.5 Test Failed Payment (Optional)

If you want to test payment failure handling:

1. Use Stripe's test card **4000 0000 0000 0341** (live mode)
2. This card will always fail with "card declined"
3. Verify error handling works correctly

⚠️ **Note:** Don't actually do this with your real card - Stripe has test endpoints for this in live mode.

### 7.6 Check Stripe Dashboard

After testing, verify in **Stripe Dashboard (Live Mode)**:

1. **Navigate to:** Payments
   - [ ] Your test payment appears
   - [ ] Status: Succeeded
   - [ ] Amount: $12.00 (or selected plan price)

2. **Navigate to:** Customers
   - [ ] Your test customer created
   - [ ] Shows active subscription
   - [ ] Email address correct

3. **Navigate to:** Subscriptions
   - [ ] Your test subscription active
   - [ ] Correct plan selected
   - [ ] Next billing date shown

---

## Step 8: Post-Launch Configuration

After successful testing, configure additional Stripe settings for production.

### 8.1 Configure Email Receipts

1. **Navigate:** Settings → **Emails**
2. **Enable:**
   - [ ] Successful payment receipts
   - [ ] Failed payment notifications
   - [ ] Refund confirmations

3. **Customize email branding** (optional):
   - Upload logo
   - Set brand colors
   - Customize email footer

### 8.2 Set Up Payment Retry Logic

1. **Navigate:** Settings → **Billing**
2. **Configure Smart Retries:**
   - Enable automatic payment retries
   - Set retry schedule (recommended: 3, 5, 7 days)
   - Configure dunning emails

### 8.3 Configure Tax Collection (If Required)

If you need to collect sales tax:

1. **Navigate:** Settings → **Tax**
2. **Enable Stripe Tax** (additional fee applies)
3. **Configure tax jurisdictions:**
   - Select regions where you have tax nexus
   - Stripe automatically calculates tax rates

### 8.4 Set Up Radar for Fraud Prevention

Stripe Radar is included with standard fees:

1. **Navigate:** Radar → **Rules**
2. **Enable recommended rules:**
   - Block payments from high-risk countries
   - Require 3D Secure for high-value transactions
   - Block cards with high decline rates

### 8.5 Configure Webhooks Monitoring

Set up alerts for webhook failures:

1. **Navigate:** Workbench → **Webhooks**
2. Click on your endpoint
3. **Configure alerts:**
   - Email notifications for failed webhooks
   - Slack integration (optional)

---

## Step 9: Rollback Plan (If Needed)

If you encounter issues and need to revert to sandbox mode:

### 9.1 Quick Rollback Steps

1. **Go to Vercel:** Settings → Environment Variables (Production)
2. **Change these variables back to test mode:**
   ```bash
   STRIPE_ENV=sandbox
   VITE_STRIPE_ENV=sandbox
   STRIPE_SECRET_KEY=sk_test_XXXXX  (your original test key)
   STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
   STRIPE_WEBHOOK_SECRET=whsec_XXXXX  (your test webhook secret)
   # Revert all price IDs to test mode IDs
   ```

3. **Redeploy** (same as Step 6)

### 9.2 Handle Active Subscriptions

If you created test subscriptions in production before rolling back:

1. **Go to Stripe Dashboard (Live Mode)**
2. **Navigate:** Customers
3. **Find test customers**
4. **Cancel subscriptions:**
   - Click customer → Subscriptions tab
   - Cancel each subscription
   - Select "Cancel immediately" (not end of period)

### 9.3 Refund Test Payments

If you charged your own card for testing:

1. **Navigate:** Payments
2. **Find your test payment**
3. **Click "Refund"**
4. **Select full refund amount**
5. **Confirm refund**

⚠️ **Note:** Refunds take 5-10 business days to appear on your card.

---

## Troubleshooting

### Issue: Webhook Events Not Arriving

**Symptoms:**
- Payments succeed but tier doesn't upgrade
- No webhook events in Stripe Dashboard logs

**Solutions:**
1. **Verify endpoint URL:**
   - Go to Workbench → Webhooks
   - Ensure endpoint is `https://codescribeai.com/api/webhooks/stripe`
   - Check for typos (trailing slashes, http vs https)

2. **Test webhook manually:**
   - Click on your endpoint
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Check response - should be 200 OK

3. **Check webhook secret:**
   - Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches dashboard
   - Look for "Webhook signature verification failed" in logs

4. **Verify endpoint is public:**
   - Visit `https://codescribeai.com/api/webhooks/stripe` in browser
   - Should return error (not 404) - endpoint exists but rejects GET requests

### Issue: "Invalid API Key" Error

**Symptoms:**
- Checkout fails with "invalid API key"
- Dashboard shows authentication errors

**Solutions:**
1. **Verify you're using live keys:**
   - Keys must start with `sk_live_` and `pk_live_`
   - NOT `sk_test_` or `pk_test_`

2. **Check key hasn't been rolled/deleted:**
   - Go to Developers → API keys
   - Ensure your key still exists
   - Regenerate if necessary

3. **Verify environment variable loaded:**
   - Check Vercel deployment logs
   - Look for `STRIPE_SECRET_KEY` value (redacted)

### Issue: "No such price" Error

**Symptoms:**
- Checkout fails with "No such price: price_XXXXX"
- Error mentions price not found

**Solutions:**
1. **Verify price IDs are from live mode:**
   - Go to Products (live mode)
   - Click product → Copy Price ID
   - Compare with Vercel environment variables

2. **Ensure all 6 price IDs updated:**
   - Starter: monthly + annual
   - Pro: monthly + annual
   - Team: monthly + annual

3. **Check price is active:**
   - In Stripe Dashboard, open the price
   - Ensure it's not archived or deleted

### Issue: Subscription Created but Tier Not Upgraded

**Symptoms:**
- Stripe shows successful subscription
- User still shows "Free" tier in CodeScribe

**Solutions:**
1. **Check webhook delivery:**
   - Stripe Dashboard → Workbench → Webhooks
   - Look for `checkout.session.completed` event
   - Response should be 200 OK

2. **Check server logs:**
   - Vercel → Deployments → Latest → Logs
   - Search for "webhook" or "subscription"
   - Look for errors in tier update logic

3. **Manually trigger tier update:**
   - Query database for user's `stripe_subscription_id`
   - Check if it matches Stripe Dashboard
   - If mismatch, webhook likely failed

### Issue: Customer Portal Not Loading

**Symptoms:**
- "Manage Subscription" button doesn't work
- Portal returns error or doesn't open

**Solutions:**
1. **Verify customer has subscription:**
   - Check user's `stripe_customer_id` in database
   - Look up customer in Stripe Dashboard
   - Ensure active subscription exists

2. **Check return URL:**
   - Portal session creation requires return URL
   - Verify `CLIENT_URL` environment variable is correct
   - Should be `https://codescribeai.com` (not localhost)

3. **Verify Customer Portal enabled:**
   - Go to Settings → Customer Portal
   - Ensure Customer Portal is activated
   - Configure allowed actions (cancel, update payment, etc.)

### Issue: Test Cards Still Working in Production

**Symptoms:**
- Card 4242 4242 4242 4242 successfully processes payment
- No real charge occurs

**Solutions:**
1. **Verify you're in live mode:**
   - Check Stripe Dashboard - should NOT show "Test mode" badge
   - Check Vercel environment: `STRIPE_ENV=production`

2. **Verify using live publishable key:**
   - Frontend should use `pk_live_` key
   - Check `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel

3. **Clear browser cache:**
   - Old Stripe.js may have cached test key
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
   - Try in incognito mode

### Issue: Payments Succeed but Don't Show in Stripe

**Symptoms:**
- User says payment went through
- No payment in Stripe Dashboard

**Solutions:**
1. **Check correct Stripe account:**
   - Ensure logged into correct account
   - Check account switcher (top-left)

2. **Verify in live mode:**
   - Toggle must be OFF (showing "Live mode")
   - Payments won't appear in test mode if made in live mode

3. **Check payment date filter:**
   - Dashboard defaults to last 30 days
   - Adjust date range if testing older payments

---

## Security Best Practices

### API Key Security

- ✅ **Never commit API keys to Git**
  - Keys should only exist in Vercel environment variables
  - Add `.env` to `.gitignore`

- ✅ **Use different keys per environment**
  - Test keys for Development/Preview
  - Live keys only for Production

- ✅ **Rotate keys if exposed**
  - If key is accidentally committed or exposed
  - Generate new key in Stripe Dashboard
  - Update Vercel environment variable
  - Delete old key

- ✅ **Limit key permissions** (if using restricted keys)
  - Only grant necessary permissions
  - Use separate keys for different services

### Webhook Security

- ✅ **Always verify webhook signatures**
  - CodeScribe already implements this
  - Never process webhooks without verification
  - Prevents spoofed webhook requests

- ✅ **Use HTTPS for production webhooks**
  - Stripe requires HTTPS for live mode
  - HTTP only allowed for local development

- ✅ **Monitor webhook failures**
  - Set up alerts for failed webhooks
  - Investigate failures immediately

### Payment Security

- ✅ **Never store card details**
  - Use Stripe Checkout (hosted page)
  - Stripe handles PCI compliance
  - Only store `customer_id` and `subscription_id`

- ✅ **Enable 3D Secure**
  - Reduces fraud risk
  - Required in many regions (EU)
  - Stripe handles automatically

- ✅ **Use Stripe Radar**
  - Machine learning fraud prevention
  - Included with standard fees
  - Configure rules in dashboard

---

## Monitoring and Maintenance

### Daily Monitoring

- [ ] Check Stripe Dashboard for failed payments
- [ ] Review webhook delivery logs
- [ ] Monitor subscription churn rate

### Weekly Reviews

- [ ] Review fraud/dispute reports
- [ ] Check subscription metrics (MRR, churn, new subscriptions)
- [ ] Verify webhook delivery success rate > 99%

### Monthly Tasks

- [ ] Reconcile Stripe revenue with accounting
- [ ] Review failed payment retry outcomes
- [ ] Update pricing if needed (create new prices, don't modify existing)
- [ ] Review and respond to customer feedback

### Quarterly Tasks

- [ ] Review and optimize pricing strategy
- [ ] Analyze conversion rates by plan
- [ ] Update tax nexus settings if expanded to new regions
- [ ] Review and update refund policy if needed

---

## Additional Resources

### Documentation

- [STRIPE-SETUP.md](./STRIPE-SETUP.md) - Initial Stripe integration guide
- [STRIPE-TESTING-GUIDE.md](./STRIPE-TESTING-GUIDE.md) - Testing subscription flows
- [SUBSCRIPTION-MANAGEMENT.md](../architecture/SUBSCRIPTION-MANAGEMENT.md) - Hybrid proration system

### Stripe Resources

- **Dashboard:** https://dashboard.stripe.com
- **Documentation:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Support:** https://support.stripe.com

### CodeScribe Resources

- **Admin Dashboard:** https://codescribeai.com/admin
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Production Logs:** Vercel → Deployments → Latest → Logs

---

## Final Checklist

Before considering the switch complete:

### Stripe Configuration
- [ ] Business verification completed
- [ ] Bank account connected and verified
- [ ] Live mode products created (Starter, Pro, Team)
- [ ] All 6 price IDs copied and saved
- [ ] Live API keys copied from dashboard
- [ ] Production webhook endpoint created
- [ ] All 6 webhook events selected
- [ ] Webhook signing secret copied

### Vercel Configuration
- [ ] `STRIPE_ENV=production` (backend)
- [ ] `VITE_STRIPE_ENV=production` (frontend)
- [ ] `STRIPE_SECRET_KEY` updated to live key
- [ ] `STRIPE_PUBLISHABLE_KEY` updated to live key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` updated to live key
- [ ] `STRIPE_WEBHOOK_SECRET` updated to production secret
- [ ] All 6 `STRIPE_PRICE_*` variables updated to live price IDs
- [ ] Changes applied to Production environment only
- [ ] Site redeployed after changes

### Testing Verification
- [ ] Test subscription with real payment method
- [ ] Payment succeeds and tier upgrades
- [ ] Webhook events deliver successfully (200 OK)
- [ ] Customer Portal loads and works
- [ ] Subscription cancellation works
- [ ] Account downgrades after cancellation
- [ ] Email receipts received (if configured)

### Post-Launch Configuration
- [ ] Email receipts enabled
- [ ] Payment retry logic configured
- [ ] Tax collection configured (if required)
- [ ] Fraud prevention rules enabled
- [ ] Webhook monitoring alerts set up

### Documentation
- [ ] Live mode price IDs documented
- [ ] API keys stored in password manager
- [ ] Team notified of production launch
- [ ] Support team briefed on subscription handling

---

**Last Updated:** January 2026
**Status:** Ready for Production Launch
**Contact:** support@codescribeai.com for questions

---

## Quick Reference

### Current Configuration (Sandbox)

```bash
# Backend (server/.env)
STRIPE_ENV=sandbox
STRIPE_SECRET_KEY=sk_test_51SNgi33TG9RmxrgW...
STRIPE_PUBLISHABLE_KEY=pk_test_51SNgi33TG9RmxrgW...
STRIPE_WEBHOOK_SECRET=whsec_ea860155e38d7e124...

# Frontend (client/.env)
VITE_STRIPE_ENV=sandbox
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SNgi33TG9RmxrgW...
```

### Production Configuration (Target)

```bash
# Backend (Vercel Production Environment)
STRIPE_ENV=production
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXX
STRIPE_PRICE_STARTER_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_STARTER_ANNUAL=price_XXXXXXXXXXXXX
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_PRO_ANNUAL=price_XXXXXXXXXXXXX
STRIPE_PRICE_TEAM_MONTHLY=price_XXXXXXXXXXXXX
STRIPE_PRICE_TEAM_ANNUAL=price_XXXXXXXXXXXXX

# Frontend (Vercel Production Environment)
VITE_STRIPE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXX
```

### Webhook Endpoints

- **Development:** Stripe CLI forwards to `http://localhost:3000/api/webhooks/stripe`
- **Production:** `https://codescribeai.com/api/webhooks/stripe`

### Test vs. Live Indicators

| Check | Sandbox | Production |
|-------|---------|-----------|
| Dashboard Badge | "Test mode" ON | "Live mode" (toggle OFF) |
| API Keys | `sk_test_...` / `pk_test_...` | `sk_live_...` / `pk_live_...` |
| Price IDs | `price_1SNh...` (test) | `price_...` (new live IDs) |
| Test Cards | 4242 4242 4242 4242 works | Real cards only |
| Charges | No real money moves | Real charges |
| Payouts | No payouts | Real payouts to bank |

---

**You're ready to go live! 🚀**
