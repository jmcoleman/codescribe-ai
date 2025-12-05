/**
 * Trial Service
 * Orchestrates trial operations between InviteCode and Trial models
 */

import InviteCode from '../models/InviteCode.js';
import Trial from '../models/Trial.js';
import User from '../models/User.js';
import { sql } from '@vercel/postgres';

/**
 * Trial service for managing invite codes and user trials
 */
export const trialService = {
  // ============================================================================
  // INVITE CODE OPERATIONS
  // ============================================================================

  /**
   * Create a new invite code
   * @param {Object} options - Invite code options
   * @param {number} adminUserId - Admin user creating the code
   * @returns {Promise<Object>} Created invite code with full URL
   */
  async createInviteCode(options, adminUserId) {
    const inviteCode = await InviteCode.create({
      ...options,
      createdByUserId: adminUserId
    });

    // Generate full invite URL
    const baseUrl = process.env.APP_URL || 'https://codescribeai.com';
    const inviteUrl = `${baseUrl}/trial?code=${inviteCode.code}`;

    return {
      ...inviteCode,
      inviteUrl
    };
  },

  /**
   * Validate an invite code without redeeming
   * @param {string} code - Invite code
   * @returns {Promise<Object>} Validation result
   */
  async validateInviteCode(code) {
    return await InviteCode.validate(code);
  },

  /**
   * Redeem an invite code and start a trial
   * @param {string} code - Invite code
   * @param {number} userId - User redeeming the code
   * @returns {Promise<Object>} Created trial with details
   */
  async redeemInviteCode(code, userId) {
    // 1. Check user eligibility
    const eligibility = await Trial.checkEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // 2. Validate invite code
    const validation = await InviteCode.validate(code);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // 3. Redeem the invite code (increment usage)
    const redeemedCode = await InviteCode.redeem(code);

    // 4. Create the trial
    const trial = await Trial.create({
      userId,
      inviteCodeId: redeemedCode.id,
      trialTier: redeemedCode.trial_tier,
      durationDays: redeemedCode.duration_days,
      source: 'invite'
    });

    // 5. Update user's trial_used_at timestamp
    await sql`
      UPDATE users
      SET trial_used_at = NOW(),
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    return {
      trialId: trial.id,
      trialTier: trial.trial_tier,
      durationDays: trial.duration_days,
      startedAt: trial.started_at,
      endsAt: trial.ends_at
    };
  },

  // ============================================================================
  // TRIAL OPERATIONS
  // ============================================================================

  /**
   * Get active trial for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active trial or null
   */
  async getActiveTrial(userId) {
    return await Trial.findActiveByUserId(userId);
  },

  /**
   * Check if user has an active trial
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user has active trial
   */
  async isTrialActive(userId) {
    const trial = await Trial.findActiveByUserId(userId);
    return trial !== null;
  },

  /**
   * Get comprehensive trial status for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Full trial status
   */
  async getTrialStatus(userId) {
    const activeTrial = await Trial.findActiveByUserId(userId);
    const eligibility = await Trial.checkEligibility(userId);

    if (!activeTrial) {
      return {
        hasActiveTrial: false,
        trialTier: null,
        daysRemaining: null,
        endsAt: null,
        isEligible: eligibility.eligible,
        eligibilityReason: eligibility.reason,
        source: null
      };
    }

    // Calculate days remaining
    const now = new Date();
    const endsAt = new Date(activeTrial.ends_at);
    const msRemaining = endsAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      hasActiveTrial: true,
      trialTier: activeTrial.trial_tier,
      daysRemaining: Math.max(0, daysRemaining),
      endsAt: activeTrial.ends_at,
      startedAt: activeTrial.started_at,
      durationDays: activeTrial.duration_days,
      isEligible: false, // Already has a trial
      eligibilityReason: 'You already have an active trial',
      source: activeTrial.source,
      wasExtended: activeTrial.extended_by_days > 0,
      originalEndsAt: activeTrial.original_ends_at
    };
  },

  /**
   * Get trial tier for effective tier calculation
   * Returns the trial tier if user has an active trial, null otherwise
   * @param {number} userId - User ID
   * @returns {Promise<string|null>} Trial tier or null
   */
  async getTrialTier(userId) {
    const trial = await Trial.findActiveByUserId(userId);
    if (!trial) return null;

    // Verify trial hasn't expired
    if (new Date(trial.ends_at) <= new Date()) {
      return null;
    }

    return trial.trial_tier;
  },

  /**
   * End a user's trial (admin operation)
   * @param {number} userId - User ID
   * @param {string} reason - Reason for ending (cancel or expire)
   * @returns {Promise<Object>} Updated trial
   */
  async endTrial(userId, reason = 'cancelled') {
    const activeTrial = await Trial.findActiveByUserId(userId);

    if (!activeTrial) {
      throw new Error('User does not have an active trial');
    }

    if (reason === 'cancel') {
      return await Trial.cancel(activeTrial.id);
    } else {
      return await Trial.expire(activeTrial.id);
    }
  },

  /**
   * Extend a user's trial (admin operation)
   * @param {number} userId - User ID
   * @param {number} additionalDays - Days to add
   * @param {string} reason - Reason for extension
   * @returns {Promise<Object>} Updated trial
   */
  async extendTrial(userId, additionalDays, reason) {
    const activeTrial = await Trial.findActiveByUserId(userId);

    if (!activeTrial) {
      throw new Error('User does not have an active trial');
    }

    return await Trial.extend(activeTrial.id, additionalDays, reason);
  },

  // ============================================================================
  // CRON JOB SUPPORT
  // ============================================================================

  /**
   * Process all expired trials
   * Called by cron job
   * @returns {Promise<Object>} Processing results
   */
  async processExpiredTrials() {
    const expiredTrials = await Trial.getExpired();
    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const trial of expiredTrials) {
      try {
        // Mark trial as expired
        await Trial.expire(trial.id);

        // Mark user as having used their trial
        await sql`
          UPDATE users
          SET trial_eligible = FALSE,
              updated_at = NOW()
          WHERE id = ${trial.user_id}
        `;

        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          trialId: trial.id,
          userId: trial.user_id,
          error: error.message
        });
      }
    }

    // Also update expired invite codes
    await InviteCode.updateExpiredCodes();

    return results;
  },

  /**
   * Get trials expiring within specified days
   * Used for sending reminder emails
   * @param {number} withinDays - Days until expiration
   * @returns {Promise<Array>} Trials expiring soon
   */
  async getExpiringTrials(withinDays) {
    return await Trial.getExpiring(withinDays);
  },

  /**
   * Mark trial as converted when user subscribes
   * @param {number} userId - User ID
   * @param {string} tier - Subscribed tier
   * @param {number|null} subscriptionId - Subscription ID
   * @returns {Promise<Object|null>} Updated trial or null if no active trial
   */
  async convertTrial(userId, tier, subscriptionId = null) {
    const activeTrial = await Trial.findActiveByUserId(userId);

    if (!activeTrial) {
      return null; // No trial to convert
    }

    return await Trial.convert(activeTrial.id, tier, subscriptionId);
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get trial analytics
   * @returns {Promise<Object>} Trial statistics
   */
  async getAnalytics() {
    const [trialStats, inviteStats] = await Promise.all([
      Trial.getStats(),
      InviteCode.getStats()
    ]);

    return {
      trials: trialStats,
      inviteCodes: inviteStats
    };
  }
};

export default trialService;
