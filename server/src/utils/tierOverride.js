/**
 * Tier Override System Utilities
 *
 * Provides helper functions for admin/support tier overrides.
 * Allows privileged users to temporarily test features as different tiers.
 *
 * Key Principles:
 * - Override is stored in database (viewing_as_tier column) and time-limited (default 4 hours)
 * - Never modifies user.tier in database (billing integrity)
 * - All overrides logged to user_audit_log for compliance
 * - Only admin/support/super_admin roles can apply overrides
 *
 * See: docs/architecture/TIER-OVERRIDE-SYSTEM.md
 */

import { getTierFeatures, hasFeature } from '../config/tiers.js';

/**
 * Get effective tier (considering override if present and valid)
 *
 * @param {Object} user - User object from database
 * @param {string} user.tier - Real tier from database (billing tier)
 * @param {string} user.role - User role (user, support, admin, super_admin)
 * @param {string} [user.viewing_as_tier] - Override tier (if applied)
 * @param {string} [user.override_expires_at] - Override expiry timestamp
 * @returns {string} - Effective tier to use for feature checks
 */
export const getEffectiveTier = (user) => {
  if (!user) return 'free';

  // Only admin/support/super_admin can have overrides
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    return user.tier || 'free';
  }

  // Check if override exists in database
  if (!user.viewing_as_tier || !user.override_expires_at) {
    return user.tier || 'free';
  }

  // Check if override has expired
  const now = new Date();
  const expiry = new Date(user.override_expires_at);

  // Handle invalid date
  if (isNaN(expiry.getTime())) {
    return user.tier || 'free';
  }

  if (now > expiry) {
    return user.tier || 'free';
  }

  return user.viewing_as_tier;
};

/**
 * Check if user has feature (considering override)
 *
 * @param {Object} user - User object from JWT
 * @param {string} feature - Feature name (e.g., 'batchProcessing')
 * @returns {boolean} - Whether user has access to feature
 */
export const hasFeatureWithOverride = (user, feature) => {
  const effectiveTier = getEffectiveTier(user);
  return hasFeature(effectiveTier, feature);
};

/**
 * Validate override request
 *
 * @param {Object} user - User object from JWT
 * @param {string} targetTier - Tier to override to
 * @param {string} reason - Reason for override (required)
 * @throws {Error} - If validation fails
 * @returns {boolean} - True if valid
 */
export const validateOverrideRequest = (user, targetTier, reason) => {
  // Role check
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    throw new Error('Only admin/support roles can apply tier overrides');
  }

  // Tier check
  const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];
  if (!validTiers.includes(targetTier)) {
    throw new Error(`Invalid tier: ${targetTier}. Must be one of: ${validTiers.join(', ')}`);
  }

  // Reason required (min 10 characters for meaningful context)
  if (!reason || typeof reason !== 'string') {
    throw new Error('Override reason is required');
  }

  if (reason.trim().length < 10) {
    throw new Error('Override reason must be at least 10 characters');
  }

  return true;
};

/**
 * Create override payload for JWT
 *
 * @param {string} targetTier - Tier to override to
 * @param {string} reason - Reason for override
 * @param {number} [hoursValid=4] - Hours until expiry (default 4)
 * @returns {Object} - Override payload { tierOverride, overrideExpiry, overrideReason, overrideAppliedAt }
 */
export const createOverridePayload = (targetTier, reason, hoursValid = 4) => {
  const now = new Date();
  const expiry = new Date(now.getTime() + hoursValid * 60 * 60 * 1000);

  return {
    tierOverride: targetTier,
    overrideExpiry: expiry.toISOString(),
    overrideReason: reason.trim(),
    overrideAppliedAt: now.toISOString()
  };
};

/**
 * Check if user has an active override
 *
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether user has active override
 */
export const hasActiveOverride = (user) => {
  if (!user || !user.viewing_as_tier || !user.override_expires_at) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(user.override_expires_at);

  return now < expiry;
};

/**
 * Get override details (for logging/display)
 *
 * @param {Object} user - User object from database
 * @returns {Object|null} - Override details or null if no active override
 */
export const getOverrideDetails = (user) => {
  if (!hasActiveOverride(user)) {
    return null;
  }

  const now = new Date();
  const expiry = new Date(user.override_expires_at);
  const remainingMs = expiry.getTime() - now.getTime();

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    tier: user.viewing_as_tier,
    reason: user.override_reason,
    appliedAt: user.override_applied_at,
    expiresAt: user.override_expires_at,
    remainingTime: {
      hours,
      minutes,
      totalMs: remainingMs
    }
  };
};

/**
 * Get tier features (considering override)
 *
 * @param {Object} user - User object from JWT
 * @returns {Object} - Tier features configuration
 */
export const getEffectiveTierFeatures = (user) => {
  const effectiveTier = getEffectiveTier(user);
  return getTierFeatures(effectiveTier);
};

export default {
  getEffectiveTier,
  hasFeatureWithOverride,
  validateOverrideRequest,
  createOverridePayload,
  hasActiveOverride,
  getOverrideDetails,
  getEffectiveTierFeatures
};
