/**
 * Mock Stripe Configuration for Testing
 *
 * Provides a mocked Stripe instance to avoid real API calls in tests.
 */

// Create mock Stripe instance with all methods used in the codebase
const mockStripe = {
  customers: {
    create: jest.fn(),
    update: jest.fn(),
    retrieve: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    list: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mock configuration values
export const STRIPE_PRICES = {
  starter: {
    monthly: 'price_starter_monthly_test',
    annual: 'price_starter_annual_test',
  },
  pro: {
    monthly: 'price_pro_monthly_test',
    annual: 'price_pro_annual_test',
  },
  team: {
    monthly: 'price_team_monthly_test',
    annual: 'price_team_annual_test',
  },
};

export const STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

export const CHECKOUT_URLS = {
  success: 'http://localhost:5173/payment/success',
  cancel: 'http://localhost:5173/pricing',
};

export function getTierFromPriceId(priceId) {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier;
    }
  }
  return null;
}

export function getBillingPeriod(priceId) {
  for (const prices of Object.values(STRIPE_PRICES)) {
    if (prices.monthly === priceId) return 'monthly';
    if (prices.annual === priceId) return 'annual';
  }
  return null;
}

export function isValidPriceForTier(tier, priceId) {
  const prices = STRIPE_PRICES[tier];
  if (!prices) return false;
  return prices.monthly === priceId || prices.annual === priceId;
}

export function getTierValue(priceId) {
  const tier = getTierFromPriceId(priceId);
  const tierValues = {
    starter: 1,
    pro: 2,
    team: 3,
  };
  return tierValues[tier] || 0;
}

export default mockStripe;
