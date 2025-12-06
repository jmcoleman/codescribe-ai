/**
 * Stripe Webhook Handler
 *
 * Processes webhook events from Stripe to update subscription status.
 *
 * IMPORTANT:
 * - Webhooks must use raw body (not JSON parsed) for signature verification
 * - This route must be registered BEFORE body-parser middleware in server.js
 * - Always verify webhook signatures to prevent unauthorized requests
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import express from 'express';
import { sql } from '@vercel/postgres';
import stripe, { STRIPE_WEBHOOK_SECRET, getTierFromPriceId } from '../config/stripe.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events.
 * Must use raw body for signature verification.
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log event for debugging
    console.log(`📥 Received webhook: ${event.type}`);

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'customer.created':
          await handleCustomerCreated(event.data.object);
          break;

        case 'customer.deleted':
          await handleCustomerDeleted(event.data.object);
          break;

        case 'customer.updated':
          await handleCustomerUpdated(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      console.error(`Error processing webhook ${event.type}:`, error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * Handle checkout.session.completed event
 * Fired when a checkout session is completed (user subscribed)
 */
async function handleCheckoutCompleted(session) {
  console.log('💳 Checkout completed:', session.id);

  const userId = parseInt(session.metadata.userId);
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in session metadata');
    return;
  }

  // Fetch full subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create subscription record in database
  await createOrUpdateSubscription(subscription, userId);
}

/**
 * Handle customer.subscription.created event
 * Fired when a new subscription is created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('✅ Subscription created:', subscription.id);

  // Check if subscription already exists in our database
  const existingSubscription = await Subscription.findByStripeId(subscription.id);

  // Determine origin: If subscription already in DB, app created it (via checkout.session.completed)
  // If NOT in DB, it was created directly in Stripe Dashboard
  let createdVia = existingSubscription ? 'app' : 'stripe_dashboard';

  // Find userId from subscription or customer metadata
  let userId = parseInt(subscription.metadata?.userId);

  if (!userId) {
    console.log('No userId in subscription metadata, looking up by customer ID...');

    const customer = await stripe.customers.retrieve(subscription.customer);
    userId = parseInt(customer.metadata?.userId);

    if (!userId) {
      console.error('Cannot find userId - no metadata on subscription or customer');
      return;
    }

    console.log(`✅ Found user ${userId} via customer ${subscription.customer}`);
  }

  await createOrUpdateSubscription(subscription, userId, createdVia);
}

/**
 * Handle customer.subscription.updated event
 * Fired when a subscription is modified (plan change, renewal, etc.)
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const userId = parseInt(subscription.metadata.userId);
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  await createOrUpdateSubscription(subscription, userId);
}

/**
 * Handle customer.subscription.deleted event
 * Fired when a subscription is canceled/expires
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  const userId = parseInt(subscription.metadata.userId);
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  // Update subscription status to canceled
  await Subscription.update(subscription.id, {
    status: 'canceled',
    ended_at: new Date(subscription.ended_at * 1000),
  });

  // Downgrade user to free tier
  await User.updateTier(userId, 'free');

  console.log(`✅ User ${userId} downgraded to free tier`);
}

/**
 * Handle customer.created event
 * Fired when a customer is created in Stripe (e.g., via Dashboard)
 */
async function handleCustomerCreated(customer) {
  console.log('✨ Customer created:', customer.id);

  const userId = parseInt(customer.metadata?.userId);
  if (!userId) {
    console.log('No userId in customer metadata - skipping sync');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error(`User ${userId} not found`);
    return;
  }

  // Determine origin by checking if customer already linked in our database
  // App flow: Creates Stripe customer → Saves stripe_customer_id to DB → Webhook fires (customer already in DB)
  // Dashboard flow: Admin creates customer in Stripe → Webhook fires → Customer NOT in DB yet
  let createdVia = 'stripe_dashboard';
  if (user.stripe_customer_id === customer.id) {
    // Customer already linked = app created it before webhook fired
    createdVia = 'app';
  }

  // Link Stripe customer to user if not already linked
  if (!user.stripe_customer_id) {
    // Customer not in DB = created via Stripe Dashboard
    await User.updateStripeCustomerId(userId, customer.id, createdVia);
    console.log(`✅ Linked Stripe customer ${customer.id} to user ${userId} (via: ${createdVia})`);
  } else if (user.stripe_customer_id !== customer.id) {
    // User already has different customer - don't replace
    console.warn(`⚠️  User ${userId} already has different Stripe customer: ${user.stripe_customer_id}, skipping link to ${customer.id}`);
    return;
  } else {
    // Customer already linked (app flow confirmation)
    console.log(`✅ Customer ${customer.id} already linked to user ${userId} (via: ${createdVia})`);
  }

  let updates = [];

  // Sync email if different
  if (customer.email && user.email !== customer.email) {
    console.log(`📧 Email from Stripe: ${customer.email} (current: ${user.email})`);
    await User.updateEmail(userId, customer.email);
    updates.push('email');
  }

  // Sync name if provided
  if (customer.name) {
    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    const currentFullName = user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : '';

    if (currentFullName !== customer.name) {
      console.log(`👤 Name from Stripe: ${customer.name} (current: ${currentFullName || '(empty)'})`);
      await User.updateName(userId, firstName, lastName);
      updates.push('name');
    }
  }

  if (updates.length > 0) {
    console.log(`✅ Synced ${updates.join(' and ')} from Stripe for user ${userId}`);
  } else {
    console.log(`✅ Customer ${customer.id} linked, no field updates needed`);
  }
}

/**
 * Handle customer.deleted event
 * Fired when a customer is deleted from Stripe
 */
async function handleCustomerDeleted(customer) {
  console.log('🗑️  Customer deleted:', customer.id);

  const userId = parseInt(customer.metadata?.userId);
  if (!userId) {
    console.error('Missing userId in customer metadata');
    return;
  }

  // Clear Stripe customer ID from user record
  // Note: User account remains, just unlinked from Stripe
  const result = await sql`
    UPDATE users
    SET stripe_customer_id = NULL,
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email
  `;

  if (result.rows.length > 0) {
    console.log(`✅ Cleared Stripe customer ID for user ${userId} (${result.rows[0].email})`);
  }

  // Delete all subscriptions for this customer
  await sql`
    DELETE FROM subscriptions
    WHERE stripe_customer_id = ${customer.id}
  `;

  console.log(`✅ Deleted all subscriptions for customer ${customer.id}`);
}

/**
 * Handle customer.updated event
 * Fired when customer details are updated in Stripe (e.g., email/name change)
 */
async function handleCustomerUpdated(customer) {
  console.log('📧 Customer updated:', customer.id);

  const userId = parseInt(customer.metadata?.userId);
  if (!userId) {
    console.error('Missing userId in customer metadata');
    return;
  }

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    console.error(`User ${userId} not found`);
    return;
  }

  let updates = [];

  // Check if email changed
  if (currentUser.email !== customer.email) {
    console.log(`📧 Email changed for user ${userId}: ${currentUser.email} → ${customer.email}`);
    await User.updateEmail(userId, customer.email);
    updates.push('email');
  }

  // Check if name changed
  if (customer.name) {
    // Split Stripe name into first_name and last_name
    // First word = first_name, rest = last_name (handles "John Smith" and "John Garcia Lopez")
    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Fallback to first name if only one word

    const currentFullName = currentUser.first_name && currentUser.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : '';

    if (currentFullName !== customer.name) {
      console.log(`👤 Name changed for user ${userId}: ${currentFullName || '(empty)'} → ${customer.name}`);
      await User.updateName(userId, firstName, lastName);
      updates.push('name');
    }
  }

  if (updates.length > 0) {
    console.log(`✅ Updated ${updates.join(' and ')} for user ${userId}`);
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Fired when a subscription payment succeeds (renewal)
 */
async function handlePaymentSucceeded(invoice) {
  console.log('💰 Payment succeeded:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    return; // Not a subscription payment
  }

  // Fetch subscription to ensure we have latest data
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = parseInt(subscription.metadata.userId);

  if (userId) {
    await createOrUpdateSubscription(subscription, userId);
  }
}

/**
 * Handle invoice.payment_failed event
 * Fired when a subscription payment fails
 */
async function handlePaymentFailed(invoice) {
  console.error('⚠️  Payment failed:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    return; // Not a subscription payment
  }

  // Update subscription status to past_due
  await Subscription.update(subscriptionId, {
    status: 'past_due',
  });

  // TODO: Send email to user about failed payment
  console.log(`⚠️  User should be notified about failed payment`);
}

/**
 * Helper: Create or update subscription record in database
 * Extracts data from Stripe subscription object and syncs to our DB
 */
async function createOrUpdateSubscription(stripeSubscription, userId, createdVia = 'app') {
  const priceId = stripeSubscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  if (!tier) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  // Helper to safely convert Unix timestamp to Date
  const toDate = (unixTimestamp) => {
    if (unixTimestamp === null || unixTimestamp === undefined || isNaN(unixTimestamp)) {
      return null;
    }
    const date = new Date(unixTimestamp * 1000);
    // Validate the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp: ${unixTimestamp}`);
      return null;
    }
    return date;
  };

  const subscriptionData = {
    userId,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    tier,
    status: stripeSubscription.status,
    currentPeriodStart: toDate(stripeSubscription.current_period_start) || new Date(),
    currentPeriodEnd: toDate(stripeSubscription.current_period_end) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    livemode: stripeSubscription.livemode, // Track test vs production subscriptions
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    canceledAt: toDate(stripeSubscription.canceled_at),
    trialStart: toDate(stripeSubscription.trial_start),
    trialEnd: toDate(stripeSubscription.trial_end),
    createdVia, // 'app' or 'stripe_dashboard'
  };

  // Use upsert to handle race conditions from concurrent webhooks
  // (e.g., checkout.session.completed and customer.subscription.created arriving simultaneously)
  await Subscription.createOrUpdate(subscriptionData);
  console.log(`✅ Upserted subscription ${stripeSubscription.id} (via: ${createdVia})`)

  // Update user's tier ONLY if subscription is active AND in production mode
  // Test/sandbox subscriptions (livemode=false) are recorded but don't upgrade tier
  if (['active', 'trialing'].includes(stripeSubscription.status)) {
    if (stripeSubscription.livemode === true) {
      // Production subscription - upgrade tier
      await User.updateTier(userId, tier);
      console.log(`✅ Updated user ${userId} tier to ${tier} (production subscription)`);
    } else {
      // Test/sandbox subscription - record but don't upgrade tier
      console.log(`⚠️  Test subscription (livemode=false) - tier unchanged for user ${userId}`);
      console.log(`   Subscription tier: ${tier}, User tier: unchanged (still free)`);
      // Still process subscription for analytics and testing checkout flow
    }
  }
}

export default router;
