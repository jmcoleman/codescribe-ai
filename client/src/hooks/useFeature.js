/**
 * React hook for tier-based feature gating
 *
 * Checks user tier and provides feature availability, upgrade paths
 * Works with tier configuration from backend
 */

import { useMemo } from 'react';

/**
 * Tier features configuration (mirrors backend config/tiers.js)
 * In production, fetch this from API endpoint
 *
 * TODO: Replace with API call to /api/user/tier-features
 */
const TIER_FEATURES = {
  free: {
    maxFileSize: 100_000,
    dailyGenerations: 3,
    monthlyGenerations: 10,
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    batchProcessing: false,
    customTemplates: false,
    apiAccess: false,
    priorityQueue: false,
    teamWorkspace: false,
    support: 'community',
  },
  pro: {
    maxFileSize: 1_000_000,
    dailyGenerations: 30,
    monthlyGenerations: 100,
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    priorityQueue: true,
    teamWorkspace: false,
    support: 'email',
  },
  team: {
    maxFileSize: 5_000_000,
    dailyGenerations: 150,
    monthlyGenerations: 500,
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    priorityQueue: true,
    teamWorkspace: true,
    slackIntegration: true,
    githubIntegration: true,
    support: 'priority-email',
  },
  enterprise: {
    maxFileSize: 50_000_000,
    dailyGenerations: -1,
    monthlyGenerations: -1,
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    batchProcessing: true,
    customTemplates: true,
    apiAccess: true,
    priorityQueue: true,
    teamWorkspace: true,
    slackIntegration: true,
    githubIntegration: true,
    ssoSaml: true,
    whiteLabel: true,
    support: 'dedicated-slack',
    sla: '99.9%',
  },
};

const TIER_PRICING = {
  free: { price: 0, description: '10 docs/month OR self-hosted unlimited' },
  pro: { price: 9, period: 'month', description: '100 docs/month, built-in API credits' },
  team: { price: 29, period: 'month', description: '500 docs/month, 10 users, team workspace' },
  enterprise: { price: null, description: 'Unlimited docs, SSO, SLA, white-label' },
};

/**
 * Hook: Check if feature is available in user's tier
 *
 * Usage:
 *   const { enabled, upgrade } = useFeature('batchProcessing');
 *
 *   if (!enabled) {
 *     return <UpgradePrompt {...upgrade} />;
 *   }
 *
 * @param {string} featureName - Feature to check
 * @param {Object} options - Hook options
 * @param {string} options.userTier - Override user tier (for testing)
 * @returns {Object} Feature availability info
 */
export const useFeature = (featureName, options = {}) => {
  // TODO: Replace with actual auth context
  // const { user } = useAuth();
  // const tier = user?.tier || 'free';
  const tier = options.userTier || 'free'; // Fallback for now

  const result = useMemo(() => {
    const tierConfig = TIER_FEATURES[tier] || TIER_FEATURES.free;
    const enabled = tierConfig[featureName] ?? false;

    // Find upgrade path
    const tierOrder = ['free', 'pro', 'team', 'enterprise'];
    const currentIndex = tierOrder.indexOf(tier);
    const availableTiers = tierOrder.filter(
      t => TIER_FEATURES[t]?.[featureName] === true
    );
    const nextTier = availableTiers.find(
      t => tierOrder.indexOf(t) > currentIndex
    );

    return {
      enabled,
      tier,
      feature: featureName,
      upgrade: nextTier ? {
        tier: nextTier,
        pricing: TIER_PRICING[nextTier],
        path: '/pricing',
        message: `Upgrade to ${nextTier} to unlock ${featureName}`,
      } : null,
      availableIn: availableTiers,
    };
  }, [featureName, tier]);

  return result;
};

/**
 * Hook: Check usage limits
 *
 * Usage:
 *   const { allowed, remaining, resetDate } = useUsage();
 *
 *   if (!allowed) {
 *     return <UsageLimitModal remaining={remaining} />;
 *   }
 *
 * @returns {Object} Usage limit info
 */
export const useUsage = () => {
  // TODO: Fetch from API endpoint /api/user/usage
  // const { data } = useSWR('/api/user/usage');

  // PLACEHOLDER: Mock data
  const mockUsage = {
    tier: 'free',
    dailyGenerations: 2,
    monthlyGenerations: 8,
    limits: {
      daily: 3,
      monthly: 10,
    },
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const tierConfig = TIER_FEATURES[mockUsage.tier];
  const allowed = {
    daily: tierConfig.dailyGenerations === -1 ||
           mockUsage.dailyGenerations < tierConfig.dailyGenerations,
    monthly: tierConfig.monthlyGenerations === -1 ||
             mockUsage.monthlyGenerations < tierConfig.monthlyGenerations,
  };

  return {
    allowed: allowed.daily && allowed.monthly,
    remaining: {
      daily: tierConfig.dailyGenerations === -1
        ? 'unlimited'
        : tierConfig.dailyGenerations - mockUsage.dailyGenerations,
      monthly: tierConfig.monthlyGenerations === -1
        ? 'unlimited'
        : tierConfig.monthlyGenerations - mockUsage.monthlyGenerations,
    },
    limits: {
      daily: tierConfig.dailyGenerations,
      monthly: tierConfig.monthlyGenerations,
    },
    usage: {
      daily: mockUsage.dailyGenerations,
      monthly: mockUsage.monthlyGenerations,
    },
    resetDate: mockUsage.resetDate,
    tier: mockUsage.tier,
  };
};

/**
 * Hook: Get all tier features for current user
 *
 * Useful for tier comparison tables, settings pages
 *
 * @returns {Object} All features for user's tier
 */
export const useTierFeatures = () => {
  // TODO: Replace with actual auth context
  const tier = 'free';

  return useMemo(() => {
    const features = TIER_FEATURES[tier] || TIER_FEATURES.free;
    const pricing = TIER_PRICING[tier];

    return {
      tier,
      features,
      pricing,
      allTiers: TIER_FEATURES,
      allPricing: TIER_PRICING,
    };
  }, [tier]);
};

/**
 * Component: Feature gate wrapper
 *
 * Usage:
 *   <FeatureGate feature="batchProcessing" fallback={<UpgradePrompt />}>
 *     <BatchUploadUI />
 *   </FeatureGate>
 *
 * @param {Object} props
 * @param {string} props.feature - Feature name
 * @param {React.ReactNode} props.children - Content to show if feature enabled
 * @param {React.ReactNode} props.fallback - Content to show if feature disabled
 * @returns {React.ReactNode}
 */
export const FeatureGate = ({ feature, children, fallback = null }) => {
  const { enabled } = useFeature(feature);
  return enabled ? children : fallback;
};

/**
 * Component: Default upgrade prompt
 *
 * Shows when feature is not available in current tier
 *
 * @param {Object} props
 * @param {string} props.feature - Feature name
 * @param {string} props.title - Custom title
 * @param {string} props.description - Custom description
 * @returns {React.ReactNode}
 */
export const UpgradePrompt = ({ feature, title, description }) => {
  const { upgrade, tier } = useFeature(feature);

  if (!upgrade) {
    return null; // Feature available in current tier
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
        <svg
          className="h-6 w-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        {title || `${feature} is a Premium Feature`}
      </h3>

      <p className="mb-4 text-sm text-slate-600">
        {description || `Upgrade to ${upgrade.tier} to unlock ${feature} and more.`}
      </p>

      <div className="mb-4 rounded bg-white p-3 text-sm">
        <div className="font-medium text-slate-900">
          {upgrade.pricing.description}
        </div>
        {upgrade.pricing.price && (
          <div className="mt-1 text-2xl font-bold text-purple-600">
            ${upgrade.pricing.price}
            <span className="text-sm font-normal text-slate-500">
              /{upgrade.pricing.period}
            </span>
          </div>
        )}
      </div>

      <a
        href={upgrade.path}
        className="inline-flex items-center rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Upgrade to {upgrade.tier}
        <svg
          className="ml-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </a>

      <div className="mt-3 text-xs text-slate-500">
        Current plan: <span className="font-medium capitalize">{tier}</span>
      </div>
    </div>
  );
};

export default useFeature;
