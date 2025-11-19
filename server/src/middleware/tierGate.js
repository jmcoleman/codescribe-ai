/**
 * Tier-based authorization middleware for CodeScribe AI
 *
 * Checks user tier and enforces feature access + usage limits
 * Works with feature flags defined in config/tiers.js
 */

import {
  getTierFeatures,
  hasFeature,
  getUpgradePath,
  checkUsageLimits,
} from '../config/tiers.js';
import Usage from '../models/Usage.js';
import User from '../models/User.js';

/**
 * Middleware: Require specific feature access
 *
 * Usage:
 *   app.post('/api/batch-generate',
 *     requireFeature('batchProcessing'),
 *     batchGenerateHandler
 *   );
 *
 * @param {string} featureName - Feature to check from TIER_FEATURES
 * @returns {Function} Express middleware
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    // Get user tier from auth (default to free if not authenticated)
    // Support tier override for admin/support users
    let userTier = req.user?.tier || 'free';

    // Check for tier override (admin/support debugging)
    if (req.user) {
      const { getEffectiveTier } = await import('../utils/tierOverride.js');
      userTier = getEffectiveTier(req.user);
    }

    // Check if feature is available in user's tier
    const featureAvailable = hasFeature(userTier, featureName);

    if (!featureAvailable) {
      const upgradePath = getUpgradePath(userTier, featureName);

      return res.status(403).json({
        error: 'Upgrade Required',
        message: `Feature "${featureName}" is not available in your current plan.`,
        feature: featureName,
        currentTier: req.user?.tier || 'free',
        effectiveTier: userTier,
        availableIn: upgradePath.availableIn,
        recommendedTier: upgradePath.recommendedUpgrade,
        pricing: upgradePath.pricing,
        upgradePath: '/pricing',
      });
    }

    next();
  };
};

/**
 * Middleware: Check usage limits before processing
 *
 * Usage:
 *   app.post('/api/generate',
 *     checkUsage(),
 *     generateHandler
 *   );
 *
 * @returns {Function} Express middleware
 */
export const checkUsage = () => {
  return async (req, res, next) => {
    // Admin users bypass usage limits
    if (req.user && User.canBypassRateLimits(req.user)) {
      return next();
    }

    const userTier = req.user?.tier || 'free';
    const userId = req.user?.id;
    const userIdentifier = userId || `ip:${req.ip}`; // Track by user ID or IP

    // Get current usage from database
    const usage = await Usage.getUserUsage(userIdentifier);

    // Get file size if uploading
    const fileSize = req.file?.size || req.body?.code?.length || 0;

    // Check limits
    const usageCheck = checkUsageLimits(userTier, {
      fileSize,
      dailyGenerations: usage.dailyGenerations || 0,
      monthlyGenerations: usage.monthlyGenerations || 0,
    });

    if (!usageCheck.allowed) {
      const tierConfig = getTierFeatures(userTier);
      const upgradePath = getUpgradePath(userTier, 'monthlyGenerations');

      return res.status(429).json({
        error: 'Usage Limit Exceeded',
        message: 'You have reached your usage limit for this period.',
        currentTier: userTier,
        limits: {
          maxFileSize: tierConfig.maxFileSize,
          dailyGenerations: tierConfig.dailyGenerations,
          monthlyGenerations: tierConfig.monthlyGenerations,
        },
        usage: {
          dailyGenerations: usage.dailyGenerations,
          monthlyGenerations: usage.monthlyGenerations,
        },
        remaining: usageCheck.remaining,
        recommendedTier: upgradePath.recommendedUpgrade,
        pricing: upgradePath.pricing,
        upgradePath: '/pricing',
        resetDate: usage.resetDate, // When limits reset
      });
    }

    // Attach usage info to request for logging
    req.usage = {
      tier: userTier,
      remaining: usageCheck.remaining,
    };

    next();
  };
};

/**
 * Middleware: Require minimum tier
 *
 * Usage:
 *   app.get('/api/team/analytics',
 *     requireTier('team'),
 *     teamAnalyticsHandler
 *   );
 *
 * @param {string} minimumTier - Minimum tier required
 * @returns {Function} Express middleware
 */
export const requireTier = (minimumTier) => {
  const tierOrder = ['free', 'pro', 'team', 'enterprise'];

  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const userTierIndex = tierOrder.indexOf(userTier);
    const minimumTierIndex = tierOrder.indexOf(minimumTier);

    if (userTierIndex < minimumTierIndex) {
      return res.status(403).json({
        error: 'Upgrade Required',
        message: `This endpoint requires ${minimumTier} tier or higher.`,
        currentTier: userTier,
        requiredTier: minimumTier,
        upgradePath: '/pricing',
      });
    }

    next();
  };
};

/**
 * Middleware: Add tier info to response headers
 *
 * Useful for frontend to know user's tier and limits
 *
 * Usage:
 *   app.use(addTierHeaders());
 */
export const addTierHeaders = () => {
  return async (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const userId = req.user?.id;
    const userIdentifier = userId || `ip:${req.ip}`;
    const usage = await Usage.getUserUsage(userIdentifier);
    const tierConfig = getTierFeatures(userTier);

    // Add tier info to response headers
    res.set({
      'X-CodeScribe-Tier': userTier,
      'X-CodeScribe-Daily-Limit': tierConfig.dailyGenerations,
      'X-CodeScribe-Daily-Remaining': tierConfig.dailyGenerations === -1
        ? 'unlimited'
        : tierConfig.dailyGenerations - usage.dailyGenerations,
      'X-CodeScribe-Monthly-Limit': tierConfig.monthlyGenerations,
      'X-CodeScribe-Monthly-Remaining': tierConfig.monthlyGenerations === -1
        ? 'unlimited'
        : tierConfig.monthlyGenerations - usage.monthlyGenerations,
    });

    next();
  };
};

/**
 * Helper: Increment usage count
 *
 * Call this after successful generation. Supports both user IDs and IP-based tracking.
 *
 * @param {string|number} userIdentifier - User ID (number) or IP address (string "ip:xxx")
 * @param {number} count - Number to increment by (default: 1)
 * @returns {Promise<Object>} Updated usage statistics
 */
export async function incrementUsage(userIdentifier, count = 1) {
  return await Usage.incrementUsage(userIdentifier, count);
}

/**
 * Utility: Get tier features for client
 *
 * Returns sanitized tier info safe to send to frontend
 *
 * @param {string} tier - User tier
 * @returns {Object} Sanitized tier features
 */
export const getTierInfoForClient = (tier = 'free') => {
  const features = getTierFeatures(tier);

  return {
    tier,
    features: {
      // Volume
      maxFileSize: features.maxFileSize,
      dailyGenerations: features.dailyGenerations,
      monthlyGenerations: features.monthlyGenerations,

      // Core features
      documentTypes: features.documentTypes,
      streaming: features.streaming,
      qualityScoring: features.qualityScoring,

      // Premium features
      batchProcessing: features.batchProcessing,
      customTemplates: features.customTemplates,
      apiAccess: features.apiAccess,
      teamWorkspace: features.teamWorkspace,
      advancedParsing: features.advancedParsing,

      // Integrations
      slackIntegration: features.slackIntegration,
      githubIntegration: features.githubIntegration,
      cicdIntegration: features.cicdIntegration,

      // Enterprise
      ssoSaml: features.ssoSaml,
      whiteLabel: features.whiteLabel,
    },
    support: features.support,
    sla: features.sla,
  };
};

export default {
  requireFeature,
  requireTier,
  checkUsage,
  addTierHeaders,
  incrementUsage,
  getTierInfoForClient,
};
