/**
 * Stripe Configuration
 *
 * Initializes Stripe SDK and exports configuration for payment processing.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import Stripe from 'stripe';

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(
    `⚠️  Missing Stripe environment variables: ${missingVars.join(', ')}`
  );
  console.warn('Stripe features will not be available until configured.');
}

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia', // Latest stable version
      appInfo: {
        name: 'CodeScribe AI',
        version: '2.4.3',
        url: 'https://codescribeai.com',
      },
    })
  : null;

/**
 * Stripe Price IDs for each tier and billing period
 * Populated from environment variables
 */
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    annual: process.env.STRIPE_PRICE_TEAM_ANNUAL,
  },
};

/**
 * Stripe webhook signing secret
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Success and cancel URLs for Stripe Checkout
 */
export const CHECKOUT_URLS = {
  success: process.env.STRIPE_SUCCESS_URL || `${process.env.CLIENT_URL}/payment/success`,
  cancel: process.env.STRIPE_CANCEL_URL || `${process.env.CLIENT_URL}/pricing`,
};

/**
 * Map Stripe Price IDs to tier names
 * Used in webhooks to determine which tier a subscription is for
 *
 * @param {string} priceId - Stripe price ID
 * @returns {string|null} Tier name or null if not found
 */
export function getTierFromPriceId(priceId) {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier;
    }
  }
  return null;
}

/**
 * Get billing period from price ID
 *
 * @param {string} priceId - Stripe price ID
 * @returns {string|null} 'monthly' or 'annual' or null
 */
export function getBillingPeriod(priceId) {
  for (const prices of Object.values(STRIPE_PRICES)) {
    if (prices.monthly === priceId) return 'monthly';
    if (prices.annual === priceId) return 'annual';
  }
  return null;
}

/**
 * Validate that a price ID is valid for the given tier
 *
 * @param {string} tier - Tier name ('starter', 'pro', 'team')
 * @param {string} priceId - Stripe price ID to validate
 * @returns {boolean} True if valid
 */
export function isValidPriceForTier(tier, priceId) {
  const prices = STRIPE_PRICES[tier];
  if (!prices) return false;
  return prices.monthly === priceId || prices.annual === priceId;
}

/**
 * Get tier hierarchy value for comparison
 * Higher number = higher tier
 *
 * @param {string} priceId - Stripe price ID
 * @returns {number} Tier value (0 = unknown, 1 = starter, 2 = pro, 3 = team)
 */
export function getTierValue(priceId) {
  const tier = getTierFromPriceId(priceId);
  const tierValues = {
    starter: 1,
    pro: 2,
    team: 3,
  };
  return tierValues[tier] || 0;
}

export default stripe;
