# Subscription Management Guide

**Epic:** 2.4 - Payment Integration
**Last Updated:** October 31, 2025
**Status:** Production Ready (Test Mode)

## Overview

CodeScribe AI uses Stripe for subscription management with a **hybrid proration approach** that balances user experience with business sustainability:

- **Upgrades**: Immediate access with prorated billing
- **Downgrades**: Scheduled for end of billing period (no refund)

This matches industry standards from companies like GitHub, Spotify, and Netflix.

---

## Subscription Tiers

| Tier | Monthly Price | Annual Price | Features |
|------|--------------|--------------|----------|
| Free | $0 | N/A | 10 docs/month, 3 docs/day |
| Starter | $12 | TBD | 50 docs/month, 10 docs/day |
| Pro | $29 | TBD | 200 docs/month, 40 docs/day |
| Team | $99 | TBD | 1,000 docs/month, 200 docs/day |

**Tier Hierarchy:** Free (0) < Starter (1) < Pro (2) < Team (3)

---

## Upgrade Flow (Immediate Access + Proration)

### Example: Starter → Pro (Mid-Billing Cycle)

**Scenario:**
- User on Starter ($12/month)
- Day 15 of 30-day billing cycle
- Clicks "Subscribe" on Pro tier ($29/month)

**What Happens:**

1. **Detection** ([payments.js:98-101](../../server/src/routes/payments.js#L98-L101))
   ```javascript
   const isUpgrade = getTierValue(priceId) > getTierValue(currentPriceId);
   // Starter (1) < Pro (2) = true (upgrade)
   ```

2. **Proration Calculation** (Stripe automatic)
   - Unused Starter value: $12 × 15/30 = $6.00
   - Pro cost for remaining period: $29 × 15/30 = $14.50
   - **Prorated charge: $14.50 - $6.00 = $8.50**

3. **Immediate Charge** ([payments.js:113](../../server/src/routes/payments.js#L113))
   ```javascript
   proration_behavior: 'create_prorations' // Charge $8.50 now
   ```

4. **Subscription Update**
   - Stripe charges payment method: $8.50
   - Webhook fires: `customer.subscription.updated`
   - User tier updated to 'pro' in database
   - User gets Pro features **immediately**

5. **Next Billing Cycle**
   - Original billing date (day 30): Charged full $29/month for Pro
   - Billing cycle continues on same schedule

**User Experience:**
- ✅ Clicks "Subscribe" → Pays $8.50 → Gets Pro access instantly
- ✅ Clear messaging: "Subscription upgraded successfully"
- ✅ Next charge: Full $29 on original billing date

---

## Downgrade Flow (End of Period, No Refund)

### Example: Pro → Starter (Mid-Billing Cycle)

**Scenario:**
- User on Pro ($29/month)
- Day 15 of 30-day billing cycle
- Clicks "Subscribe" on Starter tier ($12/month)

**What Happens:**

1. **Detection** ([payments.js:98-101](../../server/src/routes/payments.js#L98-L101))
   ```javascript
   const isUpgrade = getTierValue(priceId) > getTierValue(currentPriceId);
   // Pro (2) > Starter (1) = false (downgrade)
   ```

2. **Schedule Change** ([payments.js:113, 120-123](../../server/src/routes/payments.js#L113))
   ```javascript
   proration_behavior: 'none' // No refund
   proration_date: existingSubscription.current_period_end // Change at end
   ```

3. **Subscription Update**
   - Stripe schedules plan change for day 30 (end of period)
   - Webhook fires: `customer.subscription.updated`
   - User **stays on Pro** tier in database (no immediate change)
   - No charges, no refunds

4. **End of Billing Period** (Day 30)
   - Webhook fires: `customer.subscription.updated` (again)
   - User tier updated to 'starter' in database
   - Next charge: $12/month for Starter

**User Experience:**
- ✅ Clicks "Subscribe" → No charge → Keeps Pro until day 30
- ✅ Clear messaging: "Downgrade scheduled for end of billing period"
- ✅ Generous UX (already paid for Pro, gets to keep it)

---

## New Subscription Flow (Free → Paid)

**Scenario:**
- User on Free tier (no subscription)
- Clicks "Subscribe" on Starter tier

**What Happens:**

1. **Check for Existing Subscription** ([payments.js:78-84](../../server/src/routes/payments.js#L78-L84))
   ```javascript
   const existingSubscriptions = await stripe.subscriptions.list({
     customer: customerId,
     status: 'active',
   });
   // Returns 0 results (no active subscription)
   ```

2. **Create Checkout Session** ([payments.js:142-165](../../server/src/routes/payments.js#L142-L165))
   - Redirects to Stripe Checkout
   - User enters payment details
   - Charged $12 immediately

3. **Webhook Events**
   - `checkout.session.completed` → Creates subscription record
   - `customer.subscription.created` → Updates user tier to 'starter'
   - `invoice.payment_succeeded` → Confirms payment

**User Experience:**
- ✅ Stripe-hosted checkout (secure, PCI-compliant)
- ✅ Immediate access after payment
- ✅ Success page redirect with confirmation

---

## Edge Cases & Handling

### Same Tier Re-subscription
**Scenario:** User on Pro clicks "Subscribe" on Pro again

**Handling:** ([payments.js:90-96](../../server/src/routes/payments.js#L90-L96))
```javascript
if (currentPriceId === priceId) {
  return res.json({
    url: CHECKOUT_URLS.success,
    message: 'Already subscribed to this plan',
  });
}
```

**Result:** Redirect to success page, no changes

---

### Multiple Active Subscriptions (Bug Prevention)
**Scenario:** User somehow has 2 active subscriptions

**Handling:** ([payments.js:78-84](../../server/src/routes/payments.js#L78-L84))
```javascript
const existingSubscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: 'active',
  limit: 1, // Only get the first one
});
```

**Result:** Updates the first active subscription found, prevents creating a 3rd

---

### Billing Cycle Mismatch (Monthly → Annual)
**Status:** Not currently supported

**Current Behavior:** Treats as upgrade/downgrade based on tier only, ignores billing period difference

**Future Enhancement (Epic 2.8):** Allow switching between monthly/annual within same tier

---

### Manual Cancellation via Stripe Dashboard/Portal
**Scenario:** Admin cancels subscription in Stripe Dashboard, or user cancels via Customer Portal

**Handling:** ([webhooks.js:66-172](../../server/src/routes/webhooks.js#L66-L172))
```javascript
case 'customer.subscription.deleted':
  // Updates subscription status to 'canceled' in DB
  // Downgrades user to 'free' tier
```

**Result:** Automatic sync to database, user loses paid tier access

---

### Subscription Creation via Stripe Dashboard
**Scenario:** Admin creates subscription directly in Stripe Dashboard for existing customer

**Handling:** ([webhooks.js:130-153](../../server/src/routes/webhooks.js#L130-L153))
```javascript
case 'customer.subscription.created':
  // Attempts to find userId from subscription.metadata.userId
  // Falls back to customer.metadata.userId if not found
  // Creates subscription record in database
  // Upgrades user tier if subscription is active/trialing
```

**Flow:**
1. Admin creates subscription in Stripe Dashboard
2. Webhook fires: `customer.subscription.created`
3. Checks subscription metadata for `userId`
4. If not found, retrieves customer and checks customer metadata for `userId`
5. Creates subscription record in database
6. Upgrades user tier to match subscription tier
7. Logs origin: `(via: stripe_dashboard)` or `(via: app)`

**Result:** User automatically upgraded with subscription synced to database

**Note:** For this to work, either the subscription or customer must have `metadata.userId` set. If neither has this metadata, the webhook will skip the sync and log an error.

---

### Customer Creation via Stripe Dashboard
**Scenario:** Admin creates customer in Stripe Dashboard with `metadata.userId`

**Handling:** ([webhooks.js:187-242](../../server/src/routes/webhooks.js#L187-L242))
```javascript
case 'customer.created':
  // Links Stripe customer to user (saves stripe_customer_id)
  // Syncs email if different
  // Syncs name if provided (splits into first_name and last_name)
```

**Flow:**
1. Admin creates customer in Stripe with `metadata: { userId: 123 }`
2. Webhook fires: `customer.created`
3. Validates user exists in database
4. Links customer ID to user if not already linked
5. Syncs email and name fields from Stripe to database

**Result:** User automatically linked to Stripe customer with all fields synced

---

### Customer Deletion via Stripe Dashboard
**Scenario:** Admin deletes customer in Stripe Dashboard

**Handling:** ([webhooks.js:248-277](../../server/src/routes/webhooks.js#L248-L277))
```javascript
case 'customer.deleted':
  // Clears stripe_customer_id from user record
  // Deletes all subscription records
  // User account remains active
```

**Result:** User unlinked from Stripe, can create new customer on next subscription

---

### Profile Updates - Bidirectional Sync (Email & Name)

#### Direction 1: User Updates Profile in App
**Scenario:** User updates email, first_name, or last_name via your app's profile settings

**Handling:** ([auth.js:215-333](../../server/src/routes/auth.js#L215-L333))
```javascript
PATCH /api/auth/profile
  // Accepts email, first_name, and/or last_name
  // Validates email format and uniqueness
  // Validates first_name (required, max 100 chars)
  // Validates last_name (required, max 150 chars)
  // Both first and last name must be provided together
  // Updates database
  // Syncs to Stripe customer (joins first + last as single name field)
```

**Flow:**
1. User submits new email and/or first_name + last_name
2. **Email validation:** Format check + duplicate check
3. **Name validation:**
   - Both first_name and last_name required together
   - first_name: non-empty, max 100 chars
   - last_name: non-empty, max 150 chars
4. Updates database with `User.updateEmail()` and/or `User.updateName(firstName, lastName)`
5. Calls `stripe.customers.update()` to sync fields to Stripe
   - Joins name as: `${first_name} ${last_name}` for Stripe's single name field
6. Returns success

**Result:** Both systems stay in sync, user receives personalized Stripe emails

---

#### Direction 2: Profile Changed in Stripe Dashboard
**Scenario:** Admin updates customer email or name in Stripe Dashboard

**Handling:** ([webhooks.js:219-264](../../server/src/routes/webhooks.js#L219-L264))
```javascript
case 'customer.updated':
  // Detects email and/or name changes
  // Splits Stripe name into first_name and last_name
  // Updates database for each changed field
```

**Flow:**
1. Admin changes email or name in Stripe
2. Webhook fires: `customer.updated`
3. Compares old vs new email
4. Splits Stripe `name` field into first_name and last_name:
   - First word = first_name
   - Remaining words = last_name (handles multi-part surnames like "Garcia Lopez")
   - Single word fallback: uses same word for both fields
5. Calls `User.updateEmail()` and/or `User.updateName(firstName, lastName)` for changed fields
6. Logs all updates

**Result:** Database automatically syncs with Stripe changes

---

## Webhook Event Flow

### Upgrade (Starter → Pro)

1. **API Call:** `POST /api/payments/create-checkout-session`
2. **Stripe API:** `subscriptions.update()` with `proration_behavior: 'create_prorations'`
3. **Webhooks:**
   ```
   customer.subscription.updated → Update subscription record
   invoice.created → Proration invoice created
   invoice.payment_succeeded → Payment confirmed
   ```
4. **Database Updates:**
   - Subscription record updated with new tier/price
   - User tier updated to 'pro'

### Downgrade (Pro → Starter)

1. **API Call:** `POST /api/payments/create-checkout-session`
2. **Stripe API:** `subscriptions.update()` with `proration_behavior: 'none'`
3. **Webhooks (Immediate):**
   ```
   customer.subscription.updated → Subscription marked for change
   ```
4. **Webhooks (End of Period):**
   ```
   customer.subscription.updated → Tier changes to Starter
   invoice.payment_succeeded → $12 charge for next month
   ```
5. **Database Updates:**
   - Subscription record updated at period end
   - User tier updated to 'starter' at period end

---

## Testing Guide

### Local Testing (Stripe CLI Required)

**Setup:**
```bash
cd server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
npm run dev
```

**Test Upgrade (Starter → Pro):**
1. Create Starter subscription using test card: `4242 4242 4242 4242`
2. Navigate to Pricing page
3. Click "Subscribe" on Pro tier
4. Check console logs for proration charge
5. Verify webhook: `customer.subscription.updated`
6. Verify user tier updated to 'pro' in database

**Test Downgrade (Pro → Starter):**
1. Create Pro subscription
2. Click "Subscribe" on Starter tier
3. Verify NO charge
4. Verify subscription.schedule shows change at period end
5. Fast-forward time in Stripe CLI:
   ```bash
   stripe trigger customer.subscription.updated
   ```
6. Verify tier changes to 'starter'

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

---

## Code References

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| [server/src/routes/payments.js](../../server/src/routes/payments.js) | 27-165 | Checkout session creation, upgrade/downgrade logic |
| [server/src/routes/webhooks.js](../../server/src/routes/webhooks.js) | 28-265 | Webhook event handlers |
| [server/src/config/stripe.js](../../server/src/config/stripe.js) | 115-130 | `getTierValue()` helper function |
| [server/src/models/Subscription.js](../../server/src/models/Subscription.js) | All | Subscription database model |

### Key Functions

- `getTierValue(priceId)` - Returns tier hierarchy value (1-3)
- `stripe.subscriptions.update()` - Updates existing subscription
- `stripe.checkout.sessions.create()` - Creates new subscription checkout
- `createOrUpdateSubscription()` - Webhook helper for syncing to DB

---

## Configuration

### Environment Variables (.env)

**Required for Payments:**
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_TEAM_MONTHLY=price_xxx

# URLs
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success
STRIPE_CANCEL_URL=http://localhost:5173/pricing
CLIENT_URL=http://localhost:5173
```

**Get Price IDs from:** [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)

---

## Future Enhancements (Epic 2.8+)

### Subscription Management UI (Epic 2.8)
- [ ] **Upgrade/Downgrade UI** - Dedicated page showing current plan, available changes, pricing preview
- [ ] **Annual Billing Support** - Allow switching between monthly/annual within same tier
- [ ] **Proration Preview** - Show user exact charge before confirming upgrade
- [ ] **Downgrade Confirmation** - Modal confirming feature loss when downgrading
- [ ] **Billing History** - Show past invoices, upcoming charges
- [ ] **Customer Portal Integration** - Link to Stripe-hosted portal for self-service

### Origin Tracking (Analytics & Support)
- [x] **Track Subscription/Customer Creation Source** - Complete (needs migration execution)
  - **Why:** Analytics, support debugging, understanding admin vs self-service usage
  - **Implementation Status:**
    - ✅ Database migration created: [008-add-name-and-origin-tracking.sql](../../server/src/db/migrations/008-add-name-and-origin-tracking.sql)
    - ✅ Enum type: `subscription_origin_enum` with values: `app`, `stripe_dashboard`, `api`, `migration`
    - ✅ Subscription model accepts `createdVia` parameter ([Subscription.js:44](../../server/src/models/Subscription.js#L44))
    - ✅ Webhook logs origin for subscriptions ([webhooks.js:432](../../server/src/routes/webhooks.js#L432))
    - ✅ Webhook logs origin for customers ([webhooks.js:225-230](../../server/src/routes/webhooks.js#L225-L230))
    - ⏳ Run migration: `npm run migrate` (pending)
  - **Origin Detection Logic:**
    - **Subscriptions:**
      - Checks `subscription.metadata.userId` first
      - Falls back to `customer.metadata.userId`
      - If fallback used → `stripe_dashboard`, else → `app`
    - **Customers:**
      - Checks if user already has `stripe_customer_id` when webhook fires
      - If NO → `stripe_dashboard` (created in Stripe first)
      - If YES and matches → `app` (app created it, webhook is confirmation)
  - **Use cases:**
    - Support: "Was this subscription created by user or admin?"
    - Analytics: "What % of subscriptions are admin-assisted vs self-service?"
    - Debugging: "Did this issue occur from app flow or manual intervention?"

### User Profile & Personalization
- [x] **Name Field Backend with Bidirectional Sync** - Complete (needs DB migration + email templates)
  - **Why:** Personalize emails ("Hi John" vs generic greetings)
  - **Implementation Status:**
    - ✅ `User.updateName(id, firstName, lastName)` method added ([User.js:329-339](../../server/src/models/User.js#L329-L339))
    - ✅ `PATCH /api/auth/profile` accepts first_name and last_name ([auth.js:215-333](../../server/src/routes/auth.js#L215-L333))
      - Validates first_name: required, max 100 chars
      - Validates last_name: required, max 150 chars
      - Both fields required together
      - Joins as single name for Stripe: `${first_name} ${last_name}` (max 251 chars, under Stripe's 255 limit)
    - ✅ `customer.updated` webhook syncs name from Stripe ([webhooks.js:244-260](../../server/src/routes/webhooks.js#L244-L260))
      - Splits Stripe name: first word → first_name, rest → last_name
      - Handles multi-part surnames (e.g., "Garcia Lopez")
    - ⏳ Database migration: Add columns (pending)
      ```sql
      ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN last_name VARCHAR(150);
      ```
    - ⏳ Email templates: Add `${first_name || 'there'}` personalization (pending)
  - **Email improvements needed:**
    - Password reset: "Hi John, we received a request..." (currently generic)
    - Email verification: "Hi John, thanks for signing up!" (currently generic)
    - Subscription emails: "Hi John, your plan has been upgraded..." (future)

### Email Notifications (Epic 2.7)
- [ ] **Transactional Emails** - Send emails on upgrade/downgrade/renewal
- [ ] **Personalized Templates** - Use name field for all emails

---

## Test vs Production Subscriptions

### Overview

CodeScribe AI automatically detects whether subscriptions are created in **Stripe test mode** (sandbox) or **live mode** (production) using Stripe's built-in `livemode` boolean property. This allows:

1. ✅ **Test checkout flow** - Users can complete Stripe Checkout to test the UX
2. ✅ **Prevent tier upgrades** - Test subscriptions don't upgrade user tiers (stays FREE)
3. ✅ **Analytics** - Track which tiers users tested vs actually purchased
4. ✅ **Debugging** - Distinguish test data from production data

### How It Works

**Stripe's `livemode` Property:**
- Every Stripe object (subscription, payment, customer) includes `livemode: boolean`
- `livemode: false` - Created with test API keys (sandbox, test cards)
- `livemode: true` - Created with live API keys (production, real payments)

**CodeScribe Implementation:**

1. **Webhook Processing** ([webhooks.js:427](../../server/src/routes/webhooks.js#L427))
   ```javascript
   const subscriptionData = {
     // ... other fields
     livemode: stripeSubscription.livemode, // Track test vs production
   };
   ```

2. **Tier Upgrade Logic** ([webhooks.js:455-468](../../server/src/routes/webhooks.js#L455-L468))
   ```javascript
   if (['active', 'trialing'].includes(stripeSubscription.status)) {
     if (stripeSubscription.livemode === true) {
       // Production subscription - upgrade tier
       await User.updateTier(userId, tier);
       console.log(`✅ Updated user ${userId} tier to ${tier} (production)`);
     } else {
       // Test subscription - record but don't upgrade tier
       console.log(`⚠️  Test subscription (livemode=false) - tier unchanged`);
       // Still process subscription for analytics and testing
     }
   }
   ```

3. **Database Storage** ([Migration 009](../../server/src/db/migrations/009-add-livemode-to-subscriptions.sql))
   ```sql
   ALTER TABLE subscriptions
   ADD COLUMN livemode BOOLEAN NOT NULL DEFAULT false;

   CREATE INDEX idx_subscriptions_livemode ON subscriptions(livemode);
   ```

### Example Scenarios

#### Scenario 1: Test User (Sandbox Checkout)

**Setup:**
- Production app connected to Stripe **test mode** (default)
- Environment: `STRIPE_ENV=sandbox`
- API Keys: `sk_test_xxx`, `pk_test_xxx`

**Flow:**
1. User clicks "Subscribe to Starter" → Opens Stripe Checkout
2. User enters test card: `4242 4242 4242 4242`
3. Stripe creates subscription with `livemode: false`
4. Webhook fires → Subscription created in database with `livemode: false`
5. **User tier stays FREE** (no upgrade)
6. Subscription visible in database for analytics

**Database Record:**
```sql
subscription_id | user_id | tier    | status | livemode | user_actual_tier
sub_test_123   | 42      | starter | active | false    | free
```

**Benefit:** Users can test checkout UX without getting extra API credits

---

#### Scenario 2: Production User (Live Checkout)

**Setup:**
- Production app connected to Stripe **live mode**
- Environment: `STRIPE_ENV=production`
- API Keys: `sk_live_xxx`, `pk_live_xxx`

**Flow:**
1. User clicks "Subscribe to Starter" → Opens Stripe Checkout
2. User enters real payment method
3. Stripe creates subscription with `livemode: true`
4. Webhook fires → Subscription created with `livemode: true`
5. **User tier upgraded to STARTER** (real subscription)
6. User gets 50 generations/month immediately

**Database Record:**
```sql
subscription_id | user_id | tier    | status | livemode | user_actual_tier
sub_live_456   | 42      | starter | active | true     | starter
```

**Benefit:** Real payments correctly upgrade user tiers

---

### Analytics Queries

**Count test vs production subscriptions:**
```sql
SELECT
  livemode,
  tier,
  COUNT(*) as count
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY livemode, tier
ORDER BY livemode DESC, tier;
```

**Find users who tested but didn't subscribe:**
```sql
SELECT
  u.id,
  u.email,
  s.tier as tested_tier,
  s.created_at as test_date
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.livemode = false
  AND u.tier = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s2
    WHERE s2.user_id = u.id AND s2.livemode = true
  );
```

### Migration from LOCK_USER_TIERS

**Old Approach (Deprecated):**
```bash
# .env
LOCK_USER_TIERS=true  # Manual flag to prevent tier upgrades
```

**New Approach (Active):**
- Automatic detection via `subscription.livemode`
- No manual configuration needed
- Works across dev/preview/production environments
- Stripe controls the mode via API keys

**Migration Steps:**
1. ✅ Added `livemode` column to subscriptions table (Migration 009)
2. ✅ Updated `Subscription.create()` to store livemode ([Subscription.js:43](../../server/src/models/Subscription.js#L43))
3. ✅ Updated webhooks to check livemode instead of env var ([webhooks.js:458](../../server/src/routes/webhooks.js#L458))
4. ✅ Removed `LOCK_USER_TIERS` from .env.example

**Benefits:**
- Simpler configuration (no manual flag to remember)
- Automatic detection prevents human error
- Analytics on test behavior included free

---

## FAQs

**Q: Why hybrid approach instead of proration for both?**
A: Better UX. Users expect upgrades to be immediate (they need features now). For downgrades, letting them keep paid features until period ends feels generous and reduces regret.

**Q: What if user upgrades on day 29 of 30?**
A: Stripe calculates 1/30 of price difference (~$0.57 for Starter→Pro). Still charged and get immediate access. Fair both ways.

**Q: Can users downgrade from Starter to Free?**
A: Not via Subscribe button (Free has no price). User must cancel subscription via Customer Portal. Webhook handles downgrade to Free tier.

**Q: What happens if payment fails on upgrade?**
A: Upgrade doesn't complete, user stays on current tier. Webhook `invoice.payment_failed` fires, subscription marked as `past_due`.

**Q: Do we support refunds?**
A: Not currently. Downgrades don't refund (user keeps access until period end). For cancellations, see [Customer Portal docs](../deployment/CUSTOMER-PORTAL-SETUP.md) (Epic 2.5).

---

## Related Documentation

- [Stripe Setup Guide](../deployment/STRIPE-SETUP.md) - Initial Stripe configuration
- [Stripe Testing Guide](../deployment/STRIPE-TESTING-GUIDE.md) - Test cards, scenarios
- [API Reference](../api/API-Reference.md) - `/api/payments/*` endpoints
- [Roadmap](../planning/roadmap/ROADMAP.md) - Epic 2.4, 2.7, 2.8
- [Architecture](./ARCHITECTURE.md) - System design, data flows

---

**Questions?** See [Epic 2.4 Testing](../deployment/STRIPE-TESTING-GUIDE.md) or contact jenni.m.coleman@gmail.com
