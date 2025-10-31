/**
 * Payment Routes
 *
 * Handles Stripe Checkout and Customer Portal sessions.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import express from 'express';
import stripe, { STRIPE_PRICES, CHECKOUT_URLS, getTierValue } from '../config/stripe.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/payments/create-checkout-session
 *
 * Create a Stripe Checkout session for a subscription.
 * Requires authentication and verified email.
 *
 * Body:
 * - tier: 'starter' | 'pro' | 'team'
 * - billingPeriod: 'monthly' | 'annual'
 */
router.post('/create-checkout-session', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { tier, billingPeriod } = req.body;
    const userId = req.user.id;

    // Validate tier
    const validTiers = ['starter', 'pro', 'team'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Tier must be one of: starter, pro, team',
      });
    }

    // Validate billing period
    if (!['monthly', 'annual'].includes(billingPeriod)) {
      return res.status(400).json({
        error: 'Invalid billing period',
        message: 'Billing period must be monthly or annual',
      });
    }

    // Get price ID for tier and billing period
    const priceId = STRIPE_PRICES[tier]?.[billingPeriod];
    if (!priceId) {
      return res.status(500).json({
        error: 'Price not configured',
        message: `Price ID not found for ${tier} ${billingPeriod}`,
      });
    }

    // Get or create Stripe customer
    const user = await User.findById(userId);
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customerData = {
        email: user.email,
        metadata: {
          userId: user.id,
          githubUsername: user.github_username || '',
        },
      };

      // Add name if available (first_name + last_name)
      if (user.first_name && user.last_name) {
        customerData.name = `${user.first_name} ${user.last_name}`;
      }

      const customer = await stripe.customers.create(customerData);

      customerId = customer.id;

      // Save customer ID to database with 'app' origin
      await User.updateStripeCustomerId(userId, customerId, 'app');
    }

    // Check if user already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      // User has an active subscription - need to update it, not create a new one
      const existingSubscription = existingSubscriptions.data[0];
      const currentPriceId = existingSubscription.items.data[0].price.id;

      // If trying to subscribe to the same plan, just redirect to success
      if (currentPriceId === priceId) {
        return res.json({
          url: CHECKOUT_URLS.success,
          message: 'Already subscribed to this plan',
        });
      }

      // Determine if this is an upgrade or downgrade
      const currentTierValue = getTierValue(currentPriceId);
      const newTierValue = getTierValue(priceId);
      const isUpgrade = newTierValue > currentTierValue;

      // Hybrid approach:
      // - Upgrades: Immediate access with proration (user pays prorated difference now)
      // - Downgrades: Scheduled for end of billing period (user keeps current tier, no refund)
      const updateParams = {
        items: [
          {
            id: existingSubscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: isUpgrade ? 'create_prorations' : 'none',
        metadata: {
          userId: user.id,
          tier: tier,
        },
      };

      // For downgrades, set proration_date to end of current period
      if (!isUpgrade) {
        updateParams.proration_date = existingSubscription.current_period_end;
      }

      await stripe.subscriptions.update(existingSubscription.id, updateParams);

      if (isUpgrade) {
        console.log(`✅ Upgraded subscription for user ${userId} - immediate access with proration`);
      } else {
        console.log(`✅ Downgrade scheduled for user ${userId} - change at end of billing period`);
      }

      // Redirect to success page
      return res.json({
        url: `${CHECKOUT_URLS.success}?${isUpgrade ? 'upgraded' : 'downgraded'}=true&tier=${tier}`,
        message: isUpgrade
          ? 'Subscription upgraded successfully'
          : 'Downgrade scheduled for end of billing period',
      });
    }

    // No active subscription - create new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${CHECKOUT_URLS.success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: CHECKOUT_URLS.cancel,
      metadata: {
        userId: user.id,
        tier: tier,
        billingPeriod: billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier: tier,
        },
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
});

/**
 * POST /api/payments/create-portal-session
 *
 * Create a Stripe Customer Portal session for managing subscriptions.
 * Requires authentication and verified email.
 */
router.post('/create-portal-session', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const user = await User.findById(userId);
    const customerId = user.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({
        error: 'No Stripe customer',
        message: 'User does not have a Stripe customer ID',
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/account`,
    });

    res.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
});

export default router;
