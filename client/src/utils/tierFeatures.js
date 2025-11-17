/**
 * Tier Feature Utilities (Client-side)
 *
 * Checks if user has access to features based on tier and tier overrides.
 * Synced with server/src/config/tiers.js
 */

// Tier feature configuration (synced with backend)
export const TIER_FEATURES = {
  free: {
    batchProcessing: false,
    customTemplates: false,
    apiAccess: false,
    versionHistory: false,
  },
  starter: {
    batchProcessing: false,
    customTemplates: false,
    apiAccess: false,
    versionHistory: false,
  },
  pro: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: false,
    versionHistory: false,
  },
  team: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    versionHistory: true,
  },
  enterprise: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    versionHistory: true,
  },
};

/**
 * Get effective tier (considering override if present and valid)
 *
 * @param {Object} user - User object from auth context
 * @returns {string} - Effective tier to use for feature checks
 */
export function getEffectiveTier(user) {
  if (!user) return 'free';

  // Only admin/support/super_admin can have overrides
  if (!['admin', 'support', 'super_admin'].includes(user.role)) {
    return user.tier || 'free';
  }

  // Check if override exists
  if (!user.tierOverride || !user.overrideExpiry) {
    return user.tier || 'free';
  }

  // Check if override has expired
  const now = new Date();
  const expiry = new Date(user.overrideExpiry);

  if (now > expiry) {
    return user.tier || 'free';
  }

  return user.tierOverride;
}

/**
 * Check if user has access to a feature (considering tier override)
 *
 * @param {Object} user - User object from auth context
 * @param {string} feature - Feature name (e.g., 'batchProcessing')
 * @returns {boolean} - Whether user has access to feature
 */
export function hasFeature(user, feature) {
  const effectiveTier = getEffectiveTier(user);
  const tierConfig = TIER_FEATURES[effectiveTier] || TIER_FEATURES.free;
  return tierConfig[feature] ?? false;
}

/**
 * Get all features for user's effective tier
 *
 * @param {Object} user - User object from auth context
 * @returns {Object} - Feature configuration for effective tier
 */
export function getTierFeatures(user) {
  const effectiveTier = getEffectiveTier(user);
  return TIER_FEATURES[effectiveTier] || TIER_FEATURES.free;
}

/**
 * Check if user has an active tier override
 *
 * @param {Object} user - User object from auth context
 * @returns {boolean} - Whether user has active override
 */
export function hasActiveOverride(user) {
  if (!user || !user.tierOverride || !user.overrideExpiry) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(user.overrideExpiry);

  return now < expiry;
}

/**
 * Get tier order for upgrade comparisons
 */
export const TIER_ORDER = ['free', 'starter', 'pro', 'team', 'enterprise'];

/**
 * Get recommended upgrade tier for a feature
 *
 * @param {string} currentTier - User's current tier
 * @param {string} feature - Feature name
 * @returns {string|null} - Recommended tier to upgrade to, or null if feature not available
 */
export function getUpgradeTierForFeature(currentTier, feature) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  for (let i = currentIndex + 1; i < TIER_ORDER.length; i++) {
    const tier = TIER_ORDER[i];
    if (TIER_FEATURES[tier][feature]) {
      return tier;
    }
  }

  return null;
}
