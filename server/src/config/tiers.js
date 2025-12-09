/**
 * Tier-based feature configuration for CodeScribe AI
 *
 * Open Core Model: All features exist in codebase, gated by tier
 * Revenue Strategy: Volume + Convenience + Collaboration, not features
 *
 * Philosophy: Generous free tier drives adoption, natural upgrade paths via usage limits
 *
 * Source of Truth: private/strategic-planning/MONETIZATION-STRATEGY.md
 * Last Updated: October 27, 2025 (aligned with MONETIZATION-STRATEGY.md)
 */

export const TIER_FEATURES = {
  free: {
    // Volume Limits (Primary conversion driver)
    maxFileSize: 100_000,              // 100KB - typical single file
    dailyGenerations: 3,                // ~10/month (assumes ~3 docs every 3 days)
    monthlyGenerations: 10,             // Hard monthly cap

    // Core Features (ALL included - drives adoption)
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,                    // Real-time generation
    qualityScoring: true,               // 0-100 scoring with feedback
    monacoEditor: true,                 // Syntax highlighting
    fileUpload: true,                   // Single file upload
    codeParser: true,                   // AST parsing
    mermaidDiagrams: true,              // Diagram generation
    markdownExport: true,               // Export to markdown

    // Soft Features (Marketing differentiators, not technical limits)
    builtInApiCredits: false,           // Soft feature: All tiers use server API key
    priorityQueue: false,               // Soft feature: Flag only (same speed in v2.1)

    // Hard Limitations (Encourage upgrade)
    batchProcessing: false,             // Single file only (Phase 3 Epic 3.3)
    customTemplates: false,             // Default templates only (Phase 4 Epic 4.3)
    exportFormats: ['markdown'],        // Only markdown (HTML/PDF in Phase 4)
    apiAccess: false,                   // Web UI only (Team+ feature)

    // Support
    support: 'community',               // GitHub Discussions, Discord
    sla: null,                          // No uptime guarantee

    // Deployment
    selfHosted: true,                   // Can self-host with own API key for unlimited
    whiteLabel: false,                  // CodeScribe branding required
  },

  starter: {
    // Volume Limits (5x free tier - convenience tier)
    maxFileSize: 500_000,               // 500KB - larger files
    dailyGenerations: 10,               // ~50/month for regular use
    monthlyGenerations: 50,             // Hard monthly cap (5x Free)

    // All Free Features
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    codeParser: true,
    mermaidDiagrams: true,
    markdownExport: true,

    // Soft Features (Marketing differentiators - same as Free technically)
    builtInApiCredits: true,            // Soft feature: Uses server API key (same as Free)
    priorityQueue: true,                // Soft feature: Flag only (same speed in v2.1)

    // Hard Limitations (Same as Free)
    batchProcessing: false,             // Single file only (Phase 3 Epic 3.3)
    customTemplates: false,             // Default templates only (Phase 4 Epic 4.3)
    exportFormats: ['markdown'],        // Only markdown (HTML/PDF in Phase 4)
    apiAccess: false,                   // Web UI only (Team+ feature)

    // Support (Upgrade from Free)
    support: 'email',                   // Email support, 48hr response
    sla: null,                          // No formal SLA

    // Deployment
    selfHosted: true,                   // Still can self-host
    whiteLabel: false,                  // CodeScribe branding required
  },

  pro: {
    // Volume Limits (20x free tier - perfect for active developers)
    maxFileSize: 1_000_000,             // 1MB - multiple files or large projects
    dailyGenerations: 50,               // ~200/month for daily use
    monthlyGenerations: 200,            // Hard monthly cap (20x Free)

    // All Starter Features
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    codeParser: true,
    mermaidDiagrams: true,
    markdownExport: true,

    // Soft Features (Same as Starter)
    builtInApiCredits: true,            // Soft feature: Uses server API key
    priorityQueue: true,                // Soft feature: Flag only (same speed in v2.1)

    // Pro Additions (Power user features - DEFERRED to later phases)
    batchProcessing: true,              // Deferred to Phase 3 Epic 3.3
    customTemplates: true,              // Deferred to Phase 4 Epic 4.3
    exportFormats: ['markdown', 'html', 'pdf'],  // Deferred to Phase 4 Epic 4.3
    advancedParsing: true,              // Deferred to Phase 4
    projectManagement: true,            // Epic 5.4: Project organization for multi-file docs

    // Team+ Features (Not in Pro)
    apiAccess: false,                   // Reserved for Team+
    versionHistory: false,              // Reserved for Team+

    // Support (Upgrade from Starter)
    support: 'email',                   // Email support, 24hr response (faster than Starter)
    sla: null,                          // No formal SLA

    // Deployment
    selfHosted: true,                   // Still can self-host
    whiteLabel: false,                  // CodeScribe branding required
  },

  team: {
    // Volume Limits (Shared across team - encourages collaboration)
    maxFileSize: 5_000_000,             // 5MB - large codebases
    dailyGenerations: 250,              // ~1,000/month shared
    monthlyGenerations: 1000,           // Shared team quota (100x free tier)
    maxUsers: 10,                       // Team size limit

    // All Pro Features
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    codeParser: true,
    mermaidDiagrams: true,
    builtInApiCredits: true,
    batchProcessing: true,              // Up to 50 files at once
    customTemplates: true,
    priorityQueue: true,
    exportFormats: ['markdown', 'html', 'pdf'],
    advancedParsing: true,
    projectManagement: true,            // Epic 5.4: Project organization for multi-file docs

    // Team Additions (Collaboration-focused)
    apiAccess: true,                    // REST API + CLI access
    versionHistory: true,               // Last 90 days
    teamWorkspace: true,                // Shared projects and templates
    sharedTemplates: true,              // Team template library
    usageAnalytics: true,               // Team usage dashboard
    roleBasedAccess: true,              // Admin, member, viewer roles
    slackIntegration: true,             // Notifications to Slack
    githubIntegration: true,            // Auto-doc on PR merge
    cicdIntegration: true,              // GitHub Actions, GitLab CI

    // Support
    support: 'priority-email',          // Email support, 24hr priority (business hours)
    sla: null,                          // No formal SLA

    // Deployment
    selfHosted: true,                   // Can self-host with team features
    whiteLabel: false,                  // CodeScribe branding required
  },

  enterprise: {
    // Volume Limits (Effectively unlimited)
    maxFileSize: 50_000_000,            // 50MB - entire repositories
    dailyGenerations: -1,               // Unlimited
    monthlyGenerations: -1,             // Unlimited
    maxUsers: -1,                       // Unlimited

    // All Team Features
    documentTypes: ['README', 'JSDOC', 'API', 'ARCHITECTURE'],
    streaming: true,
    qualityScoring: true,
    monacoEditor: true,
    fileUpload: true,
    codeParser: true,
    mermaidDiagrams: true,
    builtInApiCredits: true,
    batchProcessing: true,              // Unlimited files
    customTemplates: true,
    apiAccess: true,
    priorityQueue: true,                // Dedicated processing queue
    exportFormats: ['markdown', 'html', 'pdf'],
    versionHistory: true,               // Unlimited retention
    advancedParsing: true,
    projectManagement: true,            // Epic 5.4: Project organization for multi-file docs
    teamWorkspace: true,
    sharedTemplates: true,
    usageAnalytics: true,
    roleBasedAccess: true,
    slackIntegration: true,
    githubIntegration: true,
    cicdIntegration: true,

    // Enterprise Additions (Compliance + Control)
    ssoSaml: true,                      // Single Sign-On
    auditLogs: true,                    // Compliance logging
    customModelFinetuning: true,        // Custom AI model training
    dedicatedInfrastructure: true,      // Isolated deployment
    customIntegrations: true,           // Jira, Confluence, etc.
    advancedSecurity: true,             // IP whitelisting, 2FA enforcement
    dataResidency: true,                // Region-specific hosting

    // Support
    support: 'dedicated-slack',         // Dedicated Slack channel
    sla: '99.9%',                       // Uptime guarantee
    accountManager: true,               // Dedicated success manager

    // Deployment
    selfHosted: true,                   // Docker/Kubernetes deployment
    whiteLabel: true,                   // Full branding customization
    onPremise: true,                    // Air-gapped deployment option
  },
};

/**
 * Pricing information (for reference, not enforcement)
 * Actual payment processing handled by Stripe
 */
export const TIER_PRICING = {
  free: {
    price: 0,
    period: null,
    description: '10 docs/month OR self-hosted unlimited',
  },
  starter: {
    price: 12,
    period: 'month',
    annual: 120,                        // 2 months free
    description: '50 docs/month, built-in API credits, priority queue',
  },
  pro: {
    price: 29,
    period: 'month',
    annual: 290,                        // 2 months free
    description: '200 docs/month, batch processing, custom templates, export formats',
  },
  team: {
    price: 99,
    period: 'month',
    annual: 990,                        // 2 months free
    description: '1,000 docs/month, 10 users, team workspace, integrations',
  },
  enterprise: {
    price: null,                        // Custom pricing
    period: null,
    description: 'Unlimited docs, SSO, SLA, white-label, dedicated support',
    startingAt: 500,                    // Starting monthly price for sales page
  },
};

/**
 * Helper: Get features for a tier
 */
export const getTierFeatures = (tier = 'free') => {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
};

/**
 * Helper: Check if feature is available in tier
 */
export const hasFeature = (tier = 'free', feature) => {
  const tierConfig = getTierFeatures(tier);
  return tierConfig?.[feature] ?? false;
};

/**
 * Helper: Get all tiers that have a feature
 */
export const getTiersWithFeature = (feature) => {
  return Object.keys(TIER_FEATURES).filter(tier =>
    TIER_FEATURES[tier][feature] === true
  );
};

/**
 * Helper: Get upgrade path for a feature
 */
export const getUpgradePath = (currentTier, feature) => {
  const tiersWithFeature = getTiersWithFeature(feature);
  const tierOrder = ['free', 'starter', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);

  // Find first tier with feature that's higher than current
  const upgradeTier = tiersWithFeature.find(tier =>
    tierOrder.indexOf(tier) > currentIndex
  );

  return {
    availableIn: tiersWithFeature,
    recommendedUpgrade: upgradeTier,
    pricing: upgradeTier ? TIER_PRICING[upgradeTier] : null,
  };
};

/**
 * Helper: Check if usage limits are exceeded
 */
export const checkUsageLimits = (tier, usage) => {
  const tierConfig = getTierFeatures(tier);
  const limits = {
    fileSize: usage.fileSize <= tierConfig.maxFileSize,
    daily: tierConfig.dailyGenerations === -1 ||
           usage.dailyGenerations < tierConfig.dailyGenerations,
    monthly: tierConfig.monthlyGenerations === -1 ||
             usage.monthlyGenerations < tierConfig.monthlyGenerations,
  };

  return {
    allowed: limits.fileSize && limits.daily && limits.monthly,
    limits,
    remaining: {
      daily: tierConfig.dailyGenerations === -1 ? 'unlimited' :
             tierConfig.dailyGenerations - usage.dailyGenerations,
      monthly: tierConfig.monthlyGenerations === -1 ? 'unlimited' :
               tierConfig.monthlyGenerations - usage.monthlyGenerations,
    },
  };
};

export default TIER_FEATURES;
