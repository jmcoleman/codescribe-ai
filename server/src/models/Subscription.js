/**
 * Subscription Model
 *
 * Handles all database operations for user subscriptions.
 * Tracks full subscription history for analytics and debugging.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import { sql } from '@vercel/postgres';

/**
 * Subscription model for managing user subscriptions
 */
class Subscription {
  /**
   * Create a new subscription record
   *
   * @param {Object} data - Subscription data
   * @param {number} data.userId - User ID
   * @param {string} data.stripeSubscriptionId - Stripe subscription ID (sub_xxx)
   * @param {string} data.stripePriceId - Stripe price ID (price_xxx)
   * @param {string} data.tier - Tier: 'starter', 'pro', 'team', 'enterprise'
   * @param {string} data.status - Status: 'active', 'trialing', 'canceled', etc.
   * @param {Date} data.currentPeriodStart - Billing period start
   * @param {Date} data.currentPeriodEnd - Billing period end
   * @param {boolean} [data.livemode=false] - True if production subscription, false if test/sandbox
   * @param {boolean} [data.cancelAtPeriodEnd=false] - Cancel at period end
   * @param {Date} [data.trialStart] - Trial start date
   * @param {Date} [data.trialEnd] - Trial end date
   * @param {string} [data.createdVia='app'] - Origin: 'app', 'stripe_dashboard', 'api', 'migration'
   * @returns {Promise<Object>} Created subscription
   */
  static async create({
    userId,
    stripeSubscriptionId,
    stripePriceId,
    tier,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    livemode = false,
    cancelAtPeriodEnd = false,
    trialStart = null,
    trialEnd = null,
    createdVia = 'app',
  }) {
    const result = await sql`
      INSERT INTO subscriptions (
        user_id,
        stripe_subscription_id,
        stripe_price_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        livemode,
        cancel_at_period_end,
        trial_start,
        trial_end,
        created_via
      ) VALUES (
        ${userId},
        ${stripeSubscriptionId},
        ${stripePriceId},
        ${tier},
        ${status},
        ${currentPeriodStart},
        ${currentPeriodEnd},
        ${livemode},
        ${cancelAtPeriodEnd},
        ${trialStart},
        ${trialEnd},
        ${createdVia}
      )
      RETURNING *
    `;

    return result.rows[0];
  }

  /**
   * Create or update a subscription (upsert)
   * Uses ON CONFLICT to handle race conditions from concurrent webhooks
   *
   * @param {Object} data - Subscription data (same as create)
   * @returns {Promise<Object>} Created or updated subscription
   */
  static async createOrUpdate({
    userId,
    stripeSubscriptionId,
    stripePriceId,
    tier,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    livemode = false,
    cancelAtPeriodEnd = false,
    canceledAt = null,
    trialStart = null,
    trialEnd = null,
    createdVia = 'app',
  }) {
    const result = await sql`
      INSERT INTO subscriptions (
        user_id,
        stripe_subscription_id,
        stripe_price_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        livemode,
        cancel_at_period_end,
        canceled_at,
        trial_start,
        trial_end,
        created_via
      ) VALUES (
        ${userId},
        ${stripeSubscriptionId},
        ${stripePriceId},
        ${tier},
        ${status},
        ${currentPeriodStart},
        ${currentPeriodEnd},
        ${livemode},
        ${cancelAtPeriodEnd},
        ${canceledAt},
        ${trialStart},
        ${trialEnd},
        ${createdVia}
      )
      ON CONFLICT (stripe_subscription_id) DO UPDATE SET
        stripe_price_id = EXCLUDED.stripe_price_id,
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        livemode = EXCLUDED.livemode,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        canceled_at = EXCLUDED.canceled_at,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        updated_at = NOW()
      RETURNING *
    `;

    return result.rows[0];
  }

  /**
   * Find subscription by Stripe subscription ID
   *
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Promise<Object|null>} Subscription or null
   */
  static async findByStripeId(stripeSubscriptionId) {
    const result = await sql`
      SELECT * FROM subscriptions
      WHERE stripe_subscription_id = ${stripeSubscriptionId}
    `;

    return result.rows[0] || null;
  }

  /**
   * Find subscription by ID
   *
   * @param {number} id - Subscription ID
   * @returns {Promise<Object|null>} Subscription or null
   */
  static async findById(id) {
    const result = await sql`
      SELECT * FROM subscriptions
      WHERE id = ${id}
    `;

    return result.rows[0] || null;
  }

  /**
   * Get user's active subscription
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active subscription or null
   */
  static async getActiveSubscription(userId) {
    const result = await sql`
      SELECT * FROM subscriptions
      WHERE user_id = ${userId}
      AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return result.rows[0] || null;
  }

  /**
   * Get all subscriptions for a user (history)
   *
   * @param {number} userId - User ID
   * @returns {Promise<Array>} All subscriptions (current + historical)
   */
  static async getAllByUserId(userId) {
    const result = await sql`
      SELECT * FROM subscriptions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows;
  }

  /**
   * Update subscription status and related fields
   *
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated subscription or null
   */
  static async update(stripeSubscriptionId, updates) {
    // Build SET clause dynamically
    const setClauses = [];
    const values = [];

    if (updates.status !== undefined) {
      setClauses.push(`status = $${setClauses.length + 1}`);
      values.push(updates.status);
    }
    if (updates.tier !== undefined) {
      setClauses.push(`tier = $${setClauses.length + 1}`);
      values.push(updates.tier);
    }
    if (updates.stripePriceId !== undefined || updates.stripe_price_id !== undefined) {
      setClauses.push(`stripe_price_id = $${setClauses.length + 1}`);
      values.push(updates.stripePriceId || updates.stripe_price_id);
    }
    if (updates.currentPeriodStart !== undefined || updates.current_period_start !== undefined) {
      setClauses.push(`current_period_start = $${setClauses.length + 1}`);
      values.push(updates.currentPeriodStart || updates.current_period_start);
    }
    if (updates.currentPeriodEnd !== undefined || updates.current_period_end !== undefined) {
      setClauses.push(`current_period_end = $${setClauses.length + 1}`);
      values.push(updates.currentPeriodEnd || updates.current_period_end);
    }
    if (updates.cancelAtPeriodEnd !== undefined || updates.cancel_at_period_end !== undefined) {
      setClauses.push(`cancel_at_period_end = $${setClauses.length + 1}`);
      values.push(updates.cancelAtPeriodEnd ?? updates.cancel_at_period_end);
    }
    if (updates.canceledAt !== undefined || updates.canceled_at !== undefined) {
      setClauses.push(`canceled_at = $${setClauses.length + 1}`);
      values.push(updates.canceledAt || updates.canceled_at);
    }
    if (updates.endedAt !== undefined || updates.ended_at !== undefined) {
      setClauses.push(`ended_at = $${setClauses.length + 1}`);
      values.push(updates.endedAt || updates.ended_at);
    }
    if (updates.trialStart !== undefined || updates.trial_start !== undefined) {
      setClauses.push(`trial_start = $${setClauses.length + 1}`);
      values.push(updates.trialStart || updates.trial_start);
    }
    if (updates.trialEnd !== undefined || updates.trial_end !== undefined) {
      setClauses.push(`trial_end = $${setClauses.length + 1}`);
      values.push(updates.trialEnd || updates.trial_end);
    }
    if (updates.livemode !== undefined) {
      setClauses.push(`livemode = $${setClauses.length + 1}`);
      values.push(updates.livemode);
    }

    if (setClauses.length === 0) {
      return null;
    }

    // Always update updated_at
    setClauses.push('updated_at = NOW()');

    // Use raw query with placeholders
    const query = `
      UPDATE subscriptions
      SET ${setClauses.join(', ')}
      WHERE stripe_subscription_id = $${values.length + 1}
      RETURNING *
    `;

    values.push(stripeSubscriptionId);

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Mark subscription as canceled
   *
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {boolean} cancelAtPeriodEnd - Whether to cancel at period end or immediately
   * @returns {Promise<Object|null>} Updated subscription
   */
  static async cancel(stripeSubscriptionId, cancelAtPeriodEnd = true) {
    const updates = {
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: new Date(),
    };

    if (!cancelAtPeriodEnd) {
      updates.ended_at = new Date();
    }

    return this.update(stripeSubscriptionId, updates);
  }

  /**
   * Get subscriptions ending soon (for renewal reminders)
   *
   * @param {number} daysAhead - Number of days to look ahead
   * @returns {Promise<Array>} Subscriptions ending soon
   */
  static async getEndingSoon(daysAhead = 7) {
    const result = await sql`
      SELECT s.*, u.email, u.github_username
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
      AND s.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '${sql(daysAhead)} days'
      AND s.cancel_at_period_end = false
      ORDER BY s.current_period_end ASC
    `;

    return result.rows;
  }

  /**
   * Get subscription statistics (for analytics)
   *
   * @returns {Promise<Object>} Subscription stats
   */
  static async getStats() {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'trialing') as trial_count,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled_count,
        COUNT(*) FILTER (WHERE status = 'past_due') as past_due_count,
        COUNT(*) FILTER (WHERE tier = 'starter') as starter_count,
        COUNT(*) FILTER (WHERE tier = 'pro') as pro_count,
        COUNT(*) FILTER (WHERE tier = 'team') as team_count,
        COUNT(*) FILTER (WHERE tier = 'enterprise') as enterprise_count
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
    `;

    return result.rows[0];
  }

  /**
   * Delete a subscription record (use with caution - prefer update)
   *
   * @param {number} id - Subscription ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const result = await sql`
      DELETE FROM subscriptions
      WHERE id = ${id}
    `;

    return result.rowCount > 0;
  }
}

export default Subscription;
