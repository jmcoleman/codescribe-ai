/**
 * Server-side Analytics Tracking
 *
 * Sends events to structured logs for Vercel log processing
 * AND persists to database for admin dashboard queries.
 * Used for tracking server-side events like webhook completions.
 *
 * @module utils/serverAnalytics
 */

import { analyticsService } from '../services/analyticsService.js';

/**
 * Track a server-side analytics event
 * In production, logs structured JSON for log processing.
 * In development, logs to console for debugging.
 * Always persists to database for admin dashboard.
 *
 * @param {string} eventName - The event name (e.g., 'checkout_completed')
 * @param {Object} data - Event data to include
 * @param {Object} context - Context for database storage
 * @param {number} [context.userId] - User ID if available
 * @param {boolean} [context.isInternal] - Whether from admin/override user
 */
export const trackServerEvent = async (eventName, data = {}, context = {}) => {
  const event = {
    type: 'analytics_event',
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log for Vercel log drains
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(event));
  } else {
    console.log(`[Analytics] ${eventName}:`, data);
  }

  // Persist to database for admin dashboard
  try {
    // Only persist if event is valid for our schema
    if (analyticsService.isValidEvent(eventName)) {
      await analyticsService.recordEvent(eventName, data, {
        userId: context.userId || data.user_id,
        isInternal: context.isInternal || false,
      });
    }
  } catch (error) {
    // Log error but don't fail - analytics shouldn't break business logic
    console.error(JSON.stringify({
      type: 'analytics_error',
      event: eventName,
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
  }
};

/**
 * Track checkout completion (webhook event)
 * @param {Object} params - Event parameters
 * @param {string} params.userId - User ID
 * @param {string} params.tier - Subscription tier
 * @param {number} params.amount - Payment amount in cents
 * @param {string} params.billingPeriod - 'monthly' or 'annual'
 */
export const trackCheckoutCompleted = async ({ userId, tier, amount, billingPeriod }) => {
  await trackServerEvent('checkout_completed', {
    user_id: userId,
    tier,
    amount_cents: amount,
    billing_period: billingPeriod,
  }, { userId });
};

/**
 * Track tier change (webhook event)
 * Consolidated event for upgrades, downgrades, and cancellations
 * @param {Object} params - Event parameters
 * @param {string} params.action - Action: 'upgrade', 'downgrade', or 'cancel'
 * @param {string} params.userId - User ID
 * @param {string} params.previousTier - Previous tier
 * @param {string} [params.newTier] - New tier (null for cancel)
 * @param {string} [params.source] - Source of change (e.g., 'stripe_webhook', 'stripe_checkout')
 * @param {string} [params.reason] - Cancellation reason (for cancel action)
 */
export const trackTierChange = async ({ action, userId, previousTier, newTier, source = 'stripe_webhook', reason }) => {
  // Use the analyticsService helper for consistent event structure
  try {
    await analyticsService.trackTierChange({
      action,
      userId,
      previousTier,
      newTier,
      source,
      reason,
    });
  } catch (error) {
    // Log error but don't fail - analytics shouldn't break business logic
    console.error(JSON.stringify({
      type: 'analytics_error',
      event: 'tier_change',
      action,
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
  }
};

/**
 * Track user signup (auth event)
 * @param {Object} params - Event parameters
 * @param {number} params.userId - User ID
 * @param {string} params.method - Signup method (email, github, google)
 */
export const trackSignup = async ({ userId, method = 'email' }) => {
  await trackServerEvent('signup', {
    user_id: userId,
    method,
  }, { userId });
};
