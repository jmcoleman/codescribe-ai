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
    projectManagement: false,
  },
  starter: {
    batchProcessing: false,
    customTemplates: false,
    apiAccess: false,
    versionHistory: false,
    projectManagement: false,
  },
  pro: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: false,
    versionHistory: false,
    projectManagement: true,
  },
  team: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    versionHistory: true,
    projectManagement: true,
  },
  enterprise: {
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    versionHistory: true,
    projectManagement: true,
  },
};

/**
 * Get effective tier (considering trials and overrides)
 *
 * The backend calculates effectiveTier considering:
 * 1. Admin/support overrides
 * 2. Paid subscription tier
 * 3. Active trial tier
 * 4. Default (free)
 *
 * We prefer to use the backend-calculated effectiveTier when available,
 * falling back to local calculation for admin overrides only.
 *
 * @param {Object} user - User object from auth context
 * @returns {string} - Effective tier to use for feature checks
 */
export function getEffectiveTier(user) {
  if (!user) return 'free';

  // Prefer backend-calculated effectiveTier (includes trials, overrides, etc.)
  if (user.effectiveTier) {
    return user.effectiveTier;
  }

  // Fallback: local calculation for admin overrides
  // (only needed if effectiveTier not provided by backend)
  if (['admin', 'support', 'super_admin'].includes(user.role)) {
    if (user.viewing_as_tier && user.override_expires_at) {
      const now = new Date();
      const expiry = new Date(user.override_expires_at);

      if (!isNaN(expiry.getTime()) && now < expiry) {
        return user.viewing_as_tier;
      }
    }
  }

  return user.tier || 'free';
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
  if (!user || !user.viewing_as_tier || !user.override_expires_at) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(user.override_expires_at);

  // Handle invalid dates
  if (isNaN(expiry.getTime())) {
    return false;
  }

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
 * @returns {string|null} - Recommended tier to upgrade to, or null if already has feature or feature not available
 */
export function getUpgradeTierForFeature(currentTier, feature) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  // Check if current tier already has the feature
  if (TIER_FEATURES[currentTier] && TIER_FEATURES[currentTier][feature]) {
    return null;
  }

  // Find the next tier that has the feature
  for (let i = currentIndex + 1; i < TIER_ORDER.length; i++) {
    const tier = TIER_ORDER[i];
    if (TIER_FEATURES[tier][feature]) {
      return tier;
    }
  }

  return null;
}
