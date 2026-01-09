/**
 * Analytics Service
 * Provides functions for recording and querying analytics events
 * Used by the admin analytics dashboard
 */

import { sql } from '@vercel/postgres';

/**
 * Event name to category mapping
 */
const EVENT_CATEGORIES = {
  // Workflow events - core user workflow progression
  session_start: 'workflow',
  code_input: 'workflow',
  generation_started: 'workflow',
  generation_completed: 'workflow',
  doc_export: 'workflow', // User exports documentation (action: copy/download)

  // Business events - monetization and conversion
  login: 'business',
  signup: 'business',
  trial: 'business', // Trial lifecycle (action: started/expired/converted)
  tier_change: 'business', // Subscription changes (action: upgrade/downgrade/cancel)
  checkout_completed: 'business',
  usage_alert: 'business', // Quota warnings (action: warning_shown/limit_hit) - monetization trigger

  // Usage events - product usage patterns
  doc_generation: 'usage',
  batch_generation: 'usage',
  quality_score: 'usage',
  oauth_flow: 'usage',
  user_interaction: 'usage',

  // System events - infrastructure and technical metrics
  error: 'system',
  performance: 'system',
};

/**
 * Allowed event names for validation
 */
const ALLOWED_EVENTS = new Set(Object.keys(EVENT_CATEGORIES));

/**
 * Events with action sub-types
 * Maps event name to { actionField, actions }
 * - actionField: The JSONB key containing the action (e.g., 'action', 'origin')
 * - actions: Array of valid action values
 */
const EVENT_ACTIONS = {
  code_input: {
    actionField: 'origin',
    actions: ['paste', 'upload', 'sample', 'github'],
  },
  doc_export: {
    actionField: 'action',
    actions: ['copy', 'download'],
  },
  usage_alert: {
    actionField: 'action',
    actions: ['warning_shown', 'limit_hit'],
  },
  trial: {
    actionField: 'action',
    actions: ['started', 'expired', 'converted'],
  },
  tier_change: {
    actionField: 'action',
    actions: ['upgrade', 'downgrade', 'cancel'],
  },
  user_interaction: {
    actionField: 'action',
    actions: [
      'view_quality_breakdown',
      'pricing_page_viewed',
      'upgrade_cta_clicked',
      'checkout_started',
      'regeneration_complete',
      'batch_generation_complete',
    ],
  },
};

/**
 * Analytics service for recording and querying events
 */
export const analyticsService = {
  // ============================================================================
  // EVENT RECORDING
  // ============================================================================

  /**
   * Record an analytics event
   * @param {string} eventName - Event name (must be in ALLOWED_EVENTS)
   * @param {Object} eventData - Event-specific data
   * @param {Object} context - Context information
   * @param {string} [context.sessionId] - Browser session ID
   * @param {number} [context.userId] - Authenticated user ID
   * @param {string} [context.ipAddress] - Client IP address
   * @param {boolean} [context.isInternal] - Whether from admin/override user
   * @returns {Promise<Object>} Created event
   */
  async recordEvent(eventName, eventData = {}, context = {}) {
    // Validate event name
    if (!ALLOWED_EVENTS.has(eventName)) {
      throw new Error(`Invalid event name: ${eventName}`);
    }

    const category = EVENT_CATEGORIES[eventName];
    const { sessionId, userId, ipAddress, isInternal = false } = context;

    // Detect internal users by checking the user's role in the database
    // This ensures admin/support users are always excluded from business metrics
    let isInternalUser = isInternal;
    let userRole = null;
    let viewingAsTier = null;

    if (userId) {
      try {
        const userResult = await sql`
          SELECT role, viewing_as_tier FROM users WHERE id = ${userId}
        `;
        if (userResult.rows.length > 0) {
          const { role, viewing_as_tier } = userResult.rows[0];
          // Check specific reasons for being internal
          const isAdminRole = ['admin', 'support', 'super_admin'].includes(role);
          if (isAdminRole) {
            userRole = role; // Capture specific role (admin, support, super_admin)
          }
          if (viewing_as_tier) {
            viewingAsTier = viewing_as_tier; // Capture which tier they're viewing as
          }
          // Mark as internal if admin/support role OR if they have an active tier override
          isInternalUser = isAdminRole || !!viewing_as_tier;
        }
      } catch (error) {
        // Don't fail event recording if user lookup fails
        console.error('[Analytics] User lookup failed:', error.message);
      }
    }

    // Add server-determined internal flags to event data for audit/debugging
    // These are authoritative (unlike client-side flags which may be stale)
    // Grouped under 'internal_user' for clarity
    if (isInternalUser) {
      eventData.internal_user = {
        role: userRole, // admin, support, super_admin, or null if only tier override
        has_tier_override: !!viewingAsTier, // boolean for easy filtering
        viewing_as_tier: viewingAsTier, // pro, team, etc. or null if not overriding
      };
    }

    try {
      const result = await sql`
        INSERT INTO analytics_events (
          event_name,
          event_category,
          session_id,
          user_id,
          ip_address,
          event_data,
          is_internal
        ) VALUES (
          ${eventName},
          ${category},
          ${sessionId || null},
          ${userId || null},
          ${ipAddress || null},
          ${JSON.stringify(eventData)},
          ${isInternalUser}
        )
        RETURNING id, created_at
      `;

      // For login events, retroactively update ALL events from this session as internal
      // This ensures pre-login events (session_start, code_input, etc.) are properly
      // filtered when "Exclude Internal" is enabled
      if (eventName === 'login' && sessionId && isInternalUser) {
        try {
          await sql`
            UPDATE analytics_events
            SET is_internal = TRUE
            WHERE session_id = ${sessionId}
              AND is_internal = FALSE
          `;
        } catch (updateError) {
          // Don't fail the login event recording if update fails
          console.error('[Analytics] Failed to update session is_internal:', updateError.message);
        }
      }

      return {
        id: result.rows[0].id,
        eventName,
        category,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      // Log error for monitoring but don't rethrow (analytics shouldn't break app)
      console.error(JSON.stringify({
        type: 'analytics_error',
        event: eventName,
        error: error.message,
        timestamp: new Date().toISOString(),
      }));
      throw error;
    }
  },

  /**
   * Get the category for an event name
   * @param {string} eventName - Event name
   * @returns {string|null} Category or null if invalid
   */
  getEventCategory(eventName) {
    return EVENT_CATEGORIES[eventName] || null;
  },

  /**
   * Check if an event name is valid
   * @param {string} eventName - Event name to check
   * @returns {boolean} Whether the event name is valid
   */
  isValidEvent(eventName) {
    return ALLOWED_EVENTS.has(eventName);
  },

  // ============================================================================
  // SERVER-SIDE EVENT HELPERS
  // ============================================================================

  /**
   * Track trial lifecycle events (server-side)
   * Called when trial starts, expires, or converts to paid
   * @param {Object} params - Event parameters
   * @param {string} params.action - Trial action: 'started', 'expired', 'converted'
   * @param {number} params.userId - User ID
   * @param {string} params.source - Trial source: 'campaign', 'invite', 'admin_grant', 'self_serve'
   * @param {string} [params.tier] - Trial tier (usually 'pro')
   * @param {number} [params.durationDays] - Trial duration in days (for 'started')
   * @param {number} [params.daysActive] - Days the trial was active (for 'expired', 'converted')
   * @param {number} [params.generationsUsed] - Generations used during trial (for 'expired', 'converted')
   * @param {number} [params.daysToConvert] - Days from trial start to conversion (for 'converted')
   * @returns {Promise<Object>} Created event
   */
  async trackTrial({ action, userId, source, tier, durationDays, daysActive, generationsUsed, daysToConvert }) {
    const eventData = {
      action,
      source,
      tier: tier || 'pro',
    };

    // Add action-specific attributes
    if (action === 'started' && durationDays !== undefined) {
      eventData.duration_days = durationDays;
    }

    if ((action === 'expired' || action === 'converted') && daysActive !== undefined) {
      eventData.days_active = daysActive;
    }

    if ((action === 'expired' || action === 'converted') && generationsUsed !== undefined) {
      eventData.generations_used = generationsUsed;
    }

    if (action === 'converted' && daysToConvert !== undefined) {
      eventData.days_to_convert = daysToConvert;
    }

    return this.recordEvent('trial', eventData, { userId });
  },

  /**
   * Track tier change events (server-side)
   * Called when user upgrades, downgrades, or cancels subscription
   * @param {Object} params - Event parameters
   * @param {string} params.action - Tier change action: 'upgrade', 'downgrade', 'cancel'
   * @param {number} params.userId - User ID
   * @param {string} params.previousTier - Previous tier (e.g., 'free', 'pro', 'team')
   * @param {string} [params.newTier] - New tier (null for cancel)
   * @param {string} [params.source] - Source of change (e.g., 'stripe_checkout', 'stripe_webhook', 'admin')
   * @param {string} [params.reason] - Cancellation reason (for 'cancel' action)
   * @returns {Promise<Object>} Created event
   */
  async trackTierChange({ action, userId, previousTier, newTier, source, reason }) {
    const eventData = {
      action,
      previous_tier: previousTier,
    };

    // Add new_tier for upgrade/downgrade, null for cancel
    if (action === 'upgrade' || action === 'downgrade') {
      eventData.new_tier = newTier;
    } else if (action === 'cancel') {
      eventData.new_tier = null;
      if (reason) {
        eventData.reason = reason;
      }
    }

    // Add source if provided
    if (source) {
      eventData.source = source;
    }

    return this.recordEvent('tier_change', eventData, { userId });
  },

  // ============================================================================
  // FUNNEL QUERIES
  // ============================================================================

  /**
   * Get conversion funnel metrics
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/override users
   * @returns {Promise<Object>} Funnel metrics
   */
  async getConversionFunnel({ startDate, endDate, excludeInternal = true }) {
    // Get counts for each funnel stage
    // Query funnel events + derive generation stages from doc_generation events
    let funnelResult, genStartedResult, genCompletedResult;

    if (excludeInternal) {
      // Get standard funnel events (session_start, code_input)
      funnelResult = await sql`
        SELECT
          event_name,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_category = 'workflow'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_name
      `;

      // Get generation_started from doc_generation (all attempts)
      genStartedResult = await sql`
        SELECT
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;

      // Get generation_completed from doc_generation where success = 'true'
      genCompletedResult = await sql`
        SELECT
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;
    } else {
      // Get standard funnel events (session_start, code_input, doc_export)
      funnelResult = await sql`
        SELECT
          event_name,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_category = 'workflow'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_name
      `;

      // Get generation_started from doc_generation (all attempts)
      genStartedResult = await sql`
        SELECT
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `;

      // Get generation_completed from doc_generation where success = 'true'
      genCompletedResult = await sql`
        SELECT
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `;
    }

    // Build funnel data with conversion rates
    const stages = ['session_start', 'code_input', 'generation_started', 'generation_completed', 'doc_export'];
    const funnelData = {};

    stages.forEach((stage) => {
      if (stage === 'generation_started') {
        // Use doc_generation count for generation_started
        funnelData[stage] = {
          sessions: parseInt(genStartedResult.rows[0]?.unique_sessions || 0),
          events: parseInt(genStartedResult.rows[0]?.total_events || 0),
        };
      } else if (stage === 'generation_completed') {
        // Use successful doc_generation count for generation_completed
        funnelData[stage] = {
          sessions: parseInt(genCompletedResult.rows[0]?.unique_sessions || 0),
          events: parseInt(genCompletedResult.rows[0]?.total_events || 0),
        };
      } else {
        const row = funnelResult.rows.find((r) => r.event_name === stage);
        funnelData[stage] = {
          sessions: parseInt(row?.unique_sessions || 0),
          events: parseInt(row?.total_events || 0),
        };
      }
    });

    // Calculate conversion rates
    const conversionRates = {};
    for (let i = 1; i < stages.length; i++) {
      const current = funnelData[stages[i]]?.sessions || 0;
      const previous = funnelData[stages[i - 1]]?.sessions || 0;
      const rate = previous > 0 ? (current / previous) * 100 : 0;
      conversionRates[`${stages[i - 1]}_to_${stages[i]}`] = Math.round(rate * 10) / 10;
    }

    return {
      stages: funnelData,
      conversionRates,
      totalSessions: funnelData.session_start?.sessions || 0,
      completedSessions: funnelData.doc_export?.sessions || 0,
      overallConversion: funnelData.session_start?.sessions > 0
        ? Math.round((funnelData.doc_export?.sessions / funnelData.session_start?.sessions) * 1000) / 10
        : 0,
    };
  },

  // ============================================================================
  // BUSINESS QUERIES
  // ============================================================================

  /**
   * Get business conversion funnel (Visitors → Engaged → Signups → Trial → Paid)
   * Different from usage funnel - this tracks the financial conversion path
   * "Engaged" = visitors who generated at least one doc (used the free tier)
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/override users
   * @returns {Promise<Object>} Business conversion funnel data
   */
  async getBusinessConversionFunnel({ startDate, endDate, excludeInternal = true }) {
    // Get unique visitors (session_start events)
    let visitorResult;
    if (excludeInternal) {
      visitorResult = await sql`
        SELECT COUNT(DISTINCT session_id) as count
        FROM analytics_events
        WHERE event_name = 'session_start'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;
    } else {
      visitorResult = await sql`
        SELECT COUNT(DISTINCT session_id) as count
        FROM analytics_events
        WHERE event_name = 'session_start'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `;
    }

    // Get engaged visitors (sessions with at least one successful doc_generation)
    // This represents users who actually tried the product (free tier usage)
    let engagedResult;
    if (excludeInternal) {
      engagedResult = await sql`
        SELECT COUNT(DISTINCT session_id) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;
    } else {
      engagedResult = await sql`
        SELECT COUNT(DISTINCT session_id) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `;
    }

    // Get signups
    let signupResult;
    if (excludeInternal) {
      signupResult = await sql`
        SELECT COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'signup'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;
    } else {
      signupResult = await sql`
        SELECT COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'signup'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
      `;
    }

    // Get trial starts with breakdown by type (campaign vs individual)
    let trialResult;
    if (excludeInternal) {
      trialResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE t.source = 'auto_campaign') as campaign,
          COUNT(*) FILTER (WHERE t.source != 'auto_campaign') as individual
        FROM user_trials t
        JOIN users u ON t.user_id = u.id
        WHERE t.started_at >= ${startDate}
          AND t.started_at < ${endDate}
          AND u.role NOT IN ('admin', 'support', 'super_admin')
          AND u.viewing_as_tier IS NULL
      `;
    } else {
      trialResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE source = 'auto_campaign') as campaign,
          COUNT(*) FILTER (WHERE source != 'auto_campaign') as individual
        FROM user_trials
        WHERE started_at >= ${startDate}
          AND started_at < ${endDate}
      `;
    }

    // Get paid conversions with breakdown (via trial vs direct)
    // "Via Trial" = users who had a trial that converted
    // "Direct" = users who paid without going through a trial
    let paidResult;
    if (excludeInternal) {
      paidResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM user_trials ut
            WHERE ut.user_id = ae.user_id
              AND ut.status = 'converted'
              AND ut.converted_at >= ${startDate}
              AND ut.converted_at < ${endDate}
          )) as via_trial,
          COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM user_trials ut
            WHERE ut.user_id = ae.user_id
              AND ut.status = 'converted'
          )) as direct
        FROM analytics_events ae
        WHERE (
          ae.event_name = 'checkout_completed'
          OR (ae.event_name = 'tier_change' AND ae.event_data->>'action' = 'upgrade')
        )
          AND ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.is_internal = FALSE
      `;
    } else {
      paidResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM user_trials ut
            WHERE ut.user_id = ae.user_id
              AND ut.status = 'converted'
              AND ut.converted_at >= ${startDate}
              AND ut.converted_at < ${endDate}
          )) as via_trial,
          COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM user_trials ut
            WHERE ut.user_id = ae.user_id
              AND ut.status = 'converted'
          )) as direct
        FROM analytics_events ae
        WHERE (
          ae.event_name = 'checkout_completed'
          OR (ae.event_name = 'tier_change' AND ae.event_data->>'action' = 'upgrade')
        )
          AND ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
      `;
    }

    const visitors = parseInt(visitorResult.rows[0]?.count || 0);
    const engaged = parseInt(engagedResult.rows[0]?.count || 0);
    const signups = parseInt(signupResult.rows[0]?.count || 0);

    // Trial breakdown
    const trialsTotal = parseInt(trialResult.rows[0]?.total || 0);
    const trialsCampaign = parseInt(trialResult.rows[0]?.campaign || 0);
    const trialsIndividual = parseInt(trialResult.rows[0]?.individual || 0);

    // Paid breakdown
    const paidTotal = parseInt(paidResult.rows[0]?.total || 0);
    const paidViaTrial = parseInt(paidResult.rows[0]?.via_trial || 0);
    const paidDirect = parseInt(paidResult.rows[0]?.direct || 0);

    // Calculate conversion rates
    const visitorToEngaged = visitors > 0 ? Math.round((engaged / visitors) * 1000) / 10 : 0;
    const engagedToSignup = engaged > 0 ? Math.round((signups / engaged) * 1000) / 10 : 0;
    const signupToTrial = signups > 0 ? Math.round((trialsTotal / signups) * 1000) / 10 : 0;
    const trialToPaid = trialsTotal > 0 ? Math.round((paidViaTrial / trialsTotal) * 1000) / 10 : 0;
    const signupToPaid = signups > 0 ? Math.round((paidTotal / signups) * 1000) / 10 : 0; // Overall signup to paid (both paths)
    const signupToDirectPaid = signups > 0 ? Math.round((paidDirect / signups) * 1000) / 10 : 0;
    const overallConversion = visitors > 0 ? Math.round((paidTotal / visitors) * 1000) / 10 : 0;

    return {
      stages: {
        visitors: { count: visitors, label: 'Visitors' },
        engaged: { count: engaged, label: 'Engaged' },
        signups: { count: signups, label: 'Signups' },
        trials: {
          count: trialsTotal,
          label: 'Trial Started',
          breakdown: {
            campaign: { count: trialsCampaign, label: 'Campaign Trials' },
            individual: { count: trialsIndividual, label: 'Individual Trials' },
          },
        },
        paid: {
          count: paidTotal,
          label: 'Paid Conversion',
          breakdown: {
            viaTrial: { count: paidViaTrial, label: 'Via Trial' },
            direct: { count: paidDirect, label: 'Direct' },
          },
        },
      },
      conversionRates: {
        visitor_to_engaged: visitorToEngaged,
        engaged_to_signup: engagedToSignup,
        signup_to_trial: signupToTrial,
        trial_to_paid: trialToPaid,
        signup_to_paid: signupToPaid,
        signup_to_direct_paid: signupToDirectPaid,
      },
      totalVisitors: visitors,
      totalPaid: paidTotal,
      overallConversion,
    };
  },

  /**
   * Get business metrics (signups, upgrades, revenue)
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/override users
   * @returns {Promise<Object>} Business metrics
   */
  async getBusinessMetrics({ startDate, endDate, excludeInternal = true }) {
    // Get event counts - use separate queries based on excludeInternal
    let result;
    if (excludeInternal) {
      result = await sql`
        SELECT
          event_name,
          COUNT(*) as count,
          SUM(CASE WHEN event_data->>'amount_cents' IS NOT NULL
              THEN (event_data->>'amount_cents')::integer ELSE 0 END) as revenue_cents
        FROM analytics_events
        WHERE event_category = 'business'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_name
      `;
    } else {
      result = await sql`
        SELECT
          event_name,
          COUNT(*) as count,
          SUM(CASE WHEN event_data->>'amount_cents' IS NOT NULL
              THEN (event_data->>'amount_cents')::integer ELSE 0 END) as revenue_cents
        FROM analytics_events
        WHERE event_category = 'business'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_name
      `;
    }

    const metrics = {};
    result.rows.forEach((row) => {
      metrics[row.event_name] = {
        count: parseInt(row.count),
        revenueCents: parseInt(row.revenue_cents || 0),
      };
    });

    // Get tier_change action counts (new consolidated event)
    let tierChangeActions;
    if (excludeInternal) {
      tierChangeActions = await sql`
        SELECT
          event_data->>'action' as action,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'tier_change'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->>'action'
      `;
    } else {
      tierChangeActions = await sql`
        SELECT
          event_data->>'action' as action,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'tier_change'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'action'
      `;
    }

    // Map tier_change actions to metrics
    const tierChangeMetrics = {};
    tierChangeActions.rows.forEach((row) => {
      tierChangeMetrics[row.action] = parseInt(row.count);
    });

    // Get tier upgrade breakdown by target tier
    let tierBreakdown;
    if (excludeInternal) {
      tierBreakdown = await sql`
        SELECT
          event_data->>'new_tier' as tier,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'tier_change'
          AND event_data->>'action' = 'upgrade'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->>'new_tier'
      `;
    } else {
      tierBreakdown = await sql`
        SELECT
          event_data->>'new_tier' as tier,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'tier_change'
          AND event_data->>'action' = 'upgrade'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'new_tier'
      `;
    }

    return {
      signups: metrics.signup?.count || 0,
      tierUpgrades: tierChangeMetrics.upgrade || 0,
      tierDowngrades: tierChangeMetrics.downgrade || 0,
      checkouts: metrics.checkout_completed?.count || 0,
      cancellations: tierChangeMetrics.cancel || 0,
      revenueCents: metrics.checkout_completed?.revenueCents || 0,
      upgradesByTier: tierBreakdown.rows.reduce((acc, row) => {
        acc[row.tier] = parseInt(row.count);
        return acc;
      }, {}),
    };
  },

  // ============================================================================
  // USAGE QUERIES
  // ============================================================================

  /**
   * Get usage patterns
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/override users
   * @returns {Promise<Object>} Usage patterns
   */
  async getUsagePatterns({ startDate, endDate, excludeInternal = true }) {
    // Get doc type breakdown (only successful generations)
    let docTypes;
    if (excludeInternal) {
      docTypes = await sql`
        SELECT
          event_data->>'doc_type' as doc_type,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->>'doc_type'
        ORDER BY count DESC
      `;
    } else {
      docTypes = await sql`
        SELECT
          event_data->>'doc_type' as doc_type,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'doc_type'
        ORDER BY count DESC
      `;
    }

    // Get quality score distribution
    let qualityScores;
    if (excludeInternal) {
      qualityScores = await sql`
        SELECT
          CASE
            WHEN (event_data->>'score')::integer >= 90 THEN '90-100'
            WHEN (event_data->>'score')::integer >= 80 THEN '80-89'
            WHEN (event_data->>'score')::integer >= 70 THEN '70-79'
            WHEN (event_data->>'score')::integer >= 60 THEN '60-69'
            ELSE '0-59'
          END as score_range,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'quality_score'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY score_range
        ORDER BY score_range DESC
      `;
    } else {
      qualityScores = await sql`
        SELECT
          CASE
            WHEN (event_data->>'score')::integer >= 90 THEN '90-100'
            WHEN (event_data->>'score')::integer >= 80 THEN '80-89'
            WHEN (event_data->>'score')::integer >= 70 THEN '70-79'
            WHEN (event_data->>'score')::integer >= 60 THEN '60-69'
            ELSE '0-59'
          END as score_range,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'quality_score'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY score_range
        ORDER BY score_range DESC
      `;
    }

    // Get batch vs single generation (only successful generations)
    let batchVsSingle;
    if (excludeInternal) {
      batchVsSingle = await sql`
        SELECT
          CASE WHEN event_name = 'batch_generation' THEN 'batch' ELSE 'single' END as type,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name IN ('doc_generation', 'batch_generation')
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY type
      `;
    } else {
      batchVsSingle = await sql`
        SELECT
          CASE WHEN event_name = 'batch_generation' THEN 'batch' ELSE 'single' END as type,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name IN ('doc_generation', 'batch_generation')
          AND event_data->>'success' = 'true'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY type
      `;
    }

    // Get language breakdown (only successful generations)
    // Language is nested under code_input for better organization
    let languages;
    if (excludeInternal) {
      languages = await sql`
        SELECT
          event_data->'code_input'->>'language' as language,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->'code_input'->>'language' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->'code_input'->>'language'
        ORDER BY count DESC
        LIMIT 10
      `;
    } else {
      languages = await sql`
        SELECT
          event_data->'code_input'->>'language' as language,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->'code_input'->>'language' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->'code_input'->>'language'
        ORDER BY count DESC
        LIMIT 10
      `;
    }

    // Get origin breakdown (only successful generations)
    // Origin is nested under code_input for better organization
    // GitHub origins are split into private vs public based on repo.is_private flag
    let origins;
    if (excludeInternal) {
      origins = await sql`
        SELECT
          CASE
            WHEN event_data->'code_input'->>'origin' = 'github'
              AND (event_data->'code_input'->'repo'->>'is_private')::boolean = true
            THEN 'github_private'
            WHEN event_data->'code_input'->>'origin' = 'github'
            THEN 'github_public'
            ELSE event_data->'code_input'->>'origin'
          END as origin,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->'code_input'->>'origin' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY 1
        ORDER BY count DESC
      `;
    } else {
      origins = await sql`
        SELECT
          CASE
            WHEN event_data->'code_input'->>'origin' = 'github'
              AND (event_data->'code_input'->'repo'->>'is_private')::boolean = true
            THEN 'github_private'
            WHEN event_data->'code_input'->>'origin' = 'github'
            THEN 'github_public'
            ELSE event_data->'code_input'->>'origin'
          END as origin,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->'code_input'->>'origin' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY 1
        ORDER BY count DESC
      `;
    }

    return {
      docTypes: docTypes.rows.map((r) => ({ type: r.doc_type, count: parseInt(r.count) })),
      qualityScores: qualityScores.rows.map((r) => ({ range: r.score_range, count: parseInt(r.count) })),
      batchVsSingle: batchVsSingle.rows.reduce((acc, r) => {
        acc[r.type] = parseInt(r.count);
        return acc;
      }, { batch: 0, single: 0 }),
      languages: languages.rows.map((r) => ({ language: r.language, count: parseInt(r.count) })),
      origins: origins.rows.map((r) => ({ origin: r.origin, count: parseInt(r.count) })),
    };
  },

  // ============================================================================
  // TIME SERIES QUERIES
  // ============================================================================

  /**
   * Get time series data for a metric
   * @param {Object} options - Query options
   * @param {string} options.metric - Metric to query (sessions, generations, signups, revenue)
   * @param {string} options.interval - Time interval (day, week, month)
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/override users
   * @returns {Promise<Array>} Time series data points
   */
  async getTimeSeries({ metric, interval, startDate, endDate, excludeInternal = true }) {
    // Map interval to PostgreSQL date_trunc
    const intervalMap = {
      day: 'day',
      week: 'week',
      month: 'month',
    };
    const truncInterval = intervalMap[interval] || 'day';

    // Build query based on metric - use separate queries based on excludeInternal
    // to avoid SQL fragment interpolation issues with @vercel/postgres
    let result;
    switch (metric) {
      case 'sessions':
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(DISTINCT session_id) as value
            FROM analytics_events
            WHERE event_name = 'session_start'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(DISTINCT session_id) as value
            FROM analytics_events
            WHERE event_name = 'session_start'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'generations':
        // Only count successful generations
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(*) as value
            FROM analytics_events
            WHERE event_name IN ('doc_generation', 'batch_generation')
              AND event_data->>'success' = 'true'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(*) as value
            FROM analytics_events
            WHERE event_name IN ('doc_generation', 'batch_generation')
              AND event_data->>'success' = 'true'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'signups':
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(*) as value
            FROM analytics_events
            WHERE event_name = 'signup'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              COUNT(*) as value
            FROM analytics_events
            WHERE event_name = 'signup'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'revenue':
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              SUM((event_data->>'amount_cents')::integer) as value
            FROM analytics_events
            WHERE event_name = 'checkout_completed'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              SUM((event_data->>'amount_cents')::integer) as value
            FROM analytics_events
            WHERE event_name = 'checkout_completed'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      // ========================================================================
      // PERFORMANCE METRICS (from generated_documents table)
      // ========================================================================

      case 'latency':
        // Average latency per interval from generated_documents
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, gd.generated_at) as date,
              ROUND(AVG(gd.latency_ms)) as value
            FROM generated_documents gd
            JOIN users u ON gd.user_id = u.id
            WHERE gd.generated_at >= ${startDate}
              AND gd.generated_at < ${endDate}
              AND gd.deleted_at IS NULL
              AND gd.latency_ms IS NOT NULL
              AND u.role NOT IN ('admin', 'support', 'super_admin')
              AND u.viewing_as_tier IS NULL
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, generated_at) as date,
              ROUND(AVG(latency_ms)) as value
            FROM generated_documents
            WHERE generated_at >= ${startDate}
              AND generated_at < ${endDate}
              AND deleted_at IS NULL
              AND latency_ms IS NOT NULL
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'cache_hit_rate':
        // Cache hit rate per interval from generated_documents (percentage 0-100)
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, gd.generated_at) as date,
              ROUND(
                (SUM(CASE WHEN gd.was_cached THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
              ) as value
            FROM generated_documents gd
            JOIN users u ON gd.user_id = u.id
            WHERE gd.generated_at >= ${startDate}
              AND gd.generated_at < ${endDate}
              AND gd.deleted_at IS NULL
              AND u.role NOT IN ('admin', 'support', 'super_admin')
              AND u.viewing_as_tier IS NULL
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, generated_at) as date,
              ROUND(
                (SUM(CASE WHEN was_cached THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
              ) as value
            FROM generated_documents
            WHERE generated_at >= ${startDate}
              AND generated_at < ${endDate}
              AND deleted_at IS NULL
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'throughput':
        // Token throughput (tokens/second) per interval from generated_documents
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, gd.generated_at) as date,
              ROUND(
                SUM(gd.output_tokens)::numeric / NULLIF(SUM(gd.latency_ms) / 1000.0, 0),
                1
              ) as value
            FROM generated_documents gd
            JOIN users u ON gd.user_id = u.id
            WHERE gd.generated_at >= ${startDate}
              AND gd.generated_at < ${endDate}
              AND gd.deleted_at IS NULL
              AND gd.latency_ms IS NOT NULL
              AND gd.latency_ms > 0
              AND u.role NOT IN ('admin', 'support', 'super_admin')
              AND u.viewing_as_tier IS NULL
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, generated_at) as date,
              ROUND(
                SUM(output_tokens)::numeric / NULLIF(SUM(latency_ms) / 1000.0, 0),
                1
              ) as value
            FROM generated_documents
            WHERE generated_at >= ${startDate}
              AND generated_at < ${endDate}
              AND deleted_at IS NULL
              AND latency_ms IS NOT NULL
              AND latency_ms > 0
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      // ========================================================================
      // LATENCY BREAKDOWN METRICS (from analytics_events - client-side captured)
      // ========================================================================

      case 'ttft':
        // Time to First Token per interval from analytics_events
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              ROUND(AVG((event_data->'latency'->>'ttft_ms')::numeric)) as value
            FROM analytics_events
            WHERE event_name = 'performance'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
              AND event_data->'latency'->>'ttft_ms' IS NOT NULL
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              ROUND(AVG((event_data->'latency'->>'ttft_ms')::numeric)) as value
            FROM analytics_events
            WHERE event_name = 'performance'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND event_data->'latency'->>'ttft_ms' IS NOT NULL
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      case 'streaming_time':
        // Streaming time per interval from analytics_events
        if (excludeInternal) {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              ROUND(AVG((event_data->'latency'->>'streaming_ms')::numeric)) as value
            FROM analytics_events
            WHERE event_name = 'performance'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND is_internal = FALSE
              AND event_data->'latency'->>'streaming_ms' IS NOT NULL
            GROUP BY 1
            ORDER BY date
          `;
        } else {
          result = await sql`
            SELECT
              DATE_TRUNC(${truncInterval}, created_at) as date,
              ROUND(AVG((event_data->'latency'->>'streaming_ms')::numeric)) as value
            FROM analytics_events
            WHERE event_name = 'performance'
              AND created_at >= ${startDate}
              AND created_at < ${endDate}
              AND event_data->'latency'->>'streaming_ms' IS NOT NULL
            GROUP BY 1
            ORDER BY date
          `;
        }
        break;

      default:
        throw new Error(`Invalid metric: ${metric}`);
    }

    return result.rows.map((row) => ({
      date: row.date,
      value: parseInt(row.value || 0),
    }));
  },

  // ============================================================================
  // RAW EVENTS QUERIES
  // ============================================================================

  /**
   * Get raw analytics events with pagination and filtering
   * Supports filtering by event_name and optionally by action within event_data
   *
   * @param {Object} options - Query options
   * @param {Date} [options.startDate] - Start of date range
   * @param {Date} [options.endDate] - End of date range
   * @param {string} [options.category] - Filter by event category
   * @param {Array<string>} [options.eventNames] - Filter by event names (array for multi-select)
   * @param {Object} [options.eventActions] - Filter by actions: { eventName: { actionField: 'action', actions: ['upgrade'] } }
   * @param {boolean} [options.excludeInternal=false] - Exclude internal users
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @param {number} [options.limit=50] - Events per page
   * @returns {Promise<Object>} { events: Array, total: number, page: number, totalPages: number }
   */
  async getEvents({ startDate, endDate, category, eventNames, eventActions, excludeInternal = false, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const hasEventNames = eventNames && eventNames.length > 0;
    const hasEventActions = eventActions && Object.keys(eventActions).length > 0;

    // Build WHERE conditions based on filters
    // We need separate queries for each filter combination due to @vercel/postgres limitations
    // Join with users table to get email for authenticated events
    let events;
    let countResult;

    if (category && hasEventNames && excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ANY(${eventNames})
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_category = ${category}
          AND event_name = ANY(${eventNames})
          AND is_internal = FALSE
      `;
    } else if (category && hasEventNames) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ANY(${eventNames})
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_category = ${category}
          AND event_name = ANY(${eventNames})
      `;
    } else if (category && excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_category = ${category}
          AND is_internal = FALSE
      `;
    } else if (hasEventNames && excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ANY(${eventNames})
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_name = ANY(${eventNames})
          AND is_internal = FALSE
      `;
    } else if (category) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_category = ${category}
      `;
    } else if (hasEventNames) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ANY(${eventNames})
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_name = ANY(${eventNames})
      `;
    } else if (excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
      `;
    } else {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
      `;
    }

    let total = parseInt(countResult.rows[0]?.total || 0);

    // Map events to response format
    let mappedEvents = events.rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      category: row.event_category,
      sessionId: row.session_id,
      userId: row.user_id,
      userEmail: row.user_email,
      ipAddress: row.ip_address,
      eventData: row.event_data,
      isInternal: row.is_internal,
      createdAt: row.created_at,
    }));

    // Apply action filtering in application layer if eventActions is specified
    // This handles cases where we need to filter by event_data action values
    if (hasEventActions) {
      mappedEvents = mappedEvents.filter((event) => {
        const actionConfig = eventActions[event.eventName];
        if (!actionConfig) {
          // No action filter for this event type - include it
          return true;
        }
        // Check if the event's action matches one of the selected actions
        const eventActionValue = event.eventData?.[actionConfig.actionField];
        return actionConfig.actions.includes(eventActionValue);
      });

      // Note: When action filtering is active, pagination may be slightly off
      // because we're filtering post-query. For accurate counts, we'd need
      // more complex SQL. This is acceptable for current scale.
      // Adjust total to reflect filtered count (estimate based on this page)
      if (mappedEvents.length < events.rows.length) {
        // Some events were filtered out - adjust total estimate
        const filterRatio = mappedEvents.length / Math.max(events.rows.length, 1);
        total = Math.ceil(total * filterRatio);
      }
    }

    const totalPages = Math.ceil(total / limit);

    return {
      events: mappedEvents,
      total,
      page,
      limit,
      totalPages,
    };
  },

  // ============================================================================
  // PERFORMANCE METRICS (from generated_documents table)
  // ============================================================================

  /**
   * Get detailed latency breakdown (TTFT, streaming, TPOT) from analytics_events
   * This data is captured client-side during streaming and stored in event_data JSONB
   *
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude internal users
   * @returns {Promise<Object>} Latency breakdown metrics
   */
  async getLatencyBreakdown({ startDate, endDate, excludeInternal = true }) {
    let result;

    if (excludeInternal) {
      result = await sql`
        SELECT
          COUNT(*) as total_events,
          ROUND(AVG((event_data->'latency'->>'total_ms')::numeric)) as avg_total_ms,
          ROUND(AVG((event_data->'latency'->>'ttft_ms')::numeric)) as avg_ttft_ms,
          ROUND(AVG((event_data->'latency'->>'streaming_ms')::numeric)) as avg_streaming_ms,
          ROUND(AVG((event_data->'latency'->>'tpot_ms')::numeric)::numeric, 2) as avg_tpot_ms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->'latency'->>'ttft_ms')::numeric) as median_ttft_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->'latency'->>'ttft_ms')::numeric) as p95_ttft_ms
        FROM analytics_events
        WHERE event_name = 'performance'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
          AND event_data->'latency'->>'ttft_ms' IS NOT NULL
      `;
    } else {
      result = await sql`
        SELECT
          COUNT(*) as total_events,
          ROUND(AVG((event_data->'latency'->>'total_ms')::numeric)) as avg_total_ms,
          ROUND(AVG((event_data->'latency'->>'ttft_ms')::numeric)) as avg_ttft_ms,
          ROUND(AVG((event_data->'latency'->>'streaming_ms')::numeric)) as avg_streaming_ms,
          ROUND(AVG((event_data->'latency'->>'tpot_ms')::numeric)::numeric, 2) as avg_tpot_ms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->'latency'->>'ttft_ms')::numeric) as median_ttft_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (event_data->'latency'->>'ttft_ms')::numeric) as p95_ttft_ms
        FROM analytics_events
        WHERE event_name = 'performance'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_data->'latency'->>'ttft_ms' IS NOT NULL
      `;
    }

    const data = result.rows[0] || {};

    return {
      totalEvents: parseInt(data.total_events || 0),
      avgTotalMs: parseInt(data.avg_total_ms || 0),
      avgTtftMs: parseInt(data.avg_ttft_ms || 0),
      avgStreamingMs: parseInt(data.avg_streaming_ms || 0),
      avgTpotMs: parseFloat(data.avg_tpot_ms || 0),
      medianTtftMs: parseInt(data.median_ttft_ms || 0),
      p95TtftMs: parseInt(data.p95_ttft_ms || 0),
    };
  },

  /**
   * Get performance metrics from generated_documents table
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {boolean} [options.excludeInternal=true] - Exclude admin/support users
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics({ startDate, endDate, excludeInternal = true }) {
    // Query generated_documents with optional internal user filtering
    // Join with users table to filter admin/support users
    let metricsResult;
    let providerResult;
    let modelResult;

    if (excludeInternal) {
      // Exclude admin/support users
      metricsResult = await sql`
        SELECT
          COUNT(*) as total_generations,
          ROUND(AVG(latency_ms)) as avg_latency_ms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as median_latency_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
          SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cached_count,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(latency_ms) as total_latency_ms
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.generated_at >= ${startDate}
          AND gd.generated_at < ${endDate}
          AND gd.deleted_at IS NULL
          AND gd.latency_ms IS NOT NULL
          AND u.role NOT IN ('admin', 'support', 'super_admin')
          AND u.viewing_as_tier IS NULL
      `;

      providerResult = await sql`
        SELECT
          provider,
          COUNT(*) as count,
          ROUND(AVG(latency_ms)) as avg_latency_ms,
          SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cached_count
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.generated_at >= ${startDate}
          AND gd.generated_at < ${endDate}
          AND gd.deleted_at IS NULL
          AND gd.latency_ms IS NOT NULL
          AND u.role NOT IN ('admin', 'support', 'super_admin')
          AND u.viewing_as_tier IS NULL
        GROUP BY provider
        ORDER BY count DESC
      `;

      modelResult = await sql`
        SELECT
          model,
          COUNT(*) as count,
          ROUND(AVG(latency_ms)) as avg_latency_ms
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.generated_at >= ${startDate}
          AND gd.generated_at < ${endDate}
          AND gd.deleted_at IS NULL
          AND gd.latency_ms IS NOT NULL
          AND u.role NOT IN ('admin', 'support', 'super_admin')
          AND u.viewing_as_tier IS NULL
        GROUP BY model
        ORDER BY count DESC
      `;
    } else {
      // Include all users
      metricsResult = await sql`
        SELECT
          COUNT(*) as total_generations,
          ROUND(AVG(latency_ms)) as avg_latency_ms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as median_latency_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
          SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cached_count,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(latency_ms) as total_latency_ms
        FROM generated_documents
        WHERE generated_at >= ${startDate}
          AND generated_at < ${endDate}
          AND deleted_at IS NULL
          AND latency_ms IS NOT NULL
      `;

      providerResult = await sql`
        SELECT
          provider,
          COUNT(*) as count,
          ROUND(AVG(latency_ms)) as avg_latency_ms,
          SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cached_count
        FROM generated_documents
        WHERE generated_at >= ${startDate}
          AND generated_at < ${endDate}
          AND deleted_at IS NULL
          AND latency_ms IS NOT NULL
        GROUP BY provider
        ORDER BY count DESC
      `;

      modelResult = await sql`
        SELECT
          model,
          COUNT(*) as count,
          ROUND(AVG(latency_ms)) as avg_latency_ms
        FROM generated_documents
        WHERE generated_at >= ${startDate}
          AND generated_at < ${endDate}
          AND deleted_at IS NULL
          AND latency_ms IS NOT NULL
        GROUP BY model
        ORDER BY count DESC
      `;
    }

    const metrics = metricsResult.rows[0] || {};
    const totalGenerations = parseInt(metrics.total_generations || 0);
    const cachedCount = parseInt(metrics.cached_count || 0);
    const totalInputTokens = parseInt(metrics.total_input_tokens || 0);
    const totalOutputTokens = parseInt(metrics.total_output_tokens || 0);
    const totalLatencyMs = parseInt(metrics.total_latency_ms || 0);

    // Calculate throughput (tokens per second)
    const avgThroughput = totalLatencyMs > 0
      ? Math.round((totalOutputTokens / (totalLatencyMs / 1000)) * 10) / 10
      : 0;

    // Provider breakdown
    const providerBreakdown = {};
    for (const row of providerResult.rows) {
      const providerCount = parseInt(row.count);
      const providerCached = parseInt(row.cached_count || 0);
      providerBreakdown[row.provider] = {
        count: providerCount,
        avgLatencyMs: parseInt(row.avg_latency_ms || 0),
        cacheHitRate: providerCount > 0 ? Math.round((providerCached / providerCount) * 1000) / 10 : 0,
      };
    }

    // Model usage
    const modelUsage = {};
    for (const row of modelResult.rows) {
      modelUsage[row.model] = {
        count: parseInt(row.count),
        avgLatencyMs: parseInt(row.avg_latency_ms || 0),
      };
    }

    return {
      totalGenerations,
      avgLatencyMs: parseInt(metrics.avg_latency_ms || 0),
      medianLatencyMs: parseInt(metrics.median_latency_ms || 0),
      p95LatencyMs: parseInt(metrics.p95_latency_ms || 0),
      cacheHitRate: totalGenerations > 0 ? Math.round((cachedCount / totalGenerations) * 1000) / 10 : 0,
      avgThroughput, // tokens/sec
      totalInputTokens,
      totalOutputTokens,
      providerBreakdown,
      modelUsage,
    };
  },

  /**
   * Get all event names with their actions (for filter dropdown)
   * Returns all events that have actions defined, plus any additional events from the database
   *
   * @returns {Promise<Object>} { events: [{ name, category, actions?, actionField? }] }
   */
  async getEventNames() {
    // Get events that exist in the database
    const result = await sql`
      SELECT DISTINCT event_name
      FROM analytics_events
      ORDER BY event_name
    `;
    const dbEventNames = new Set(result.rows.map((row) => row.event_name));

    // Start with all events that have actions defined (always show these)
    const allEventNames = new Set(Object.keys(EVENT_ACTIONS));

    // Add any additional events from the database
    for (const name of dbEventNames) {
      allEventNames.add(name);
    }

    // Build the events array
    const events = Array.from(allEventNames)
      .sort()
      .map((eventName) => {
        const category = EVENT_CATEGORIES[eventName] || 'unknown';
        const actionConfig = EVENT_ACTIONS[eventName];

        const event = {
          name: eventName,
          category,
        };

        // Add actions if this event has action sub-types
        if (actionConfig) {
          event.actionField = actionConfig.actionField;
          event.actions = actionConfig.actions;
        }

        return event;
      });

    return events;
  },

  /**
   * Get event actions configuration
   * @returns {Object} EVENT_ACTIONS mapping
   */
  getEventActions() {
    return EVENT_ACTIONS;
  },

  // ============================================================================
  // HIGH-PERFORMANCE CSV EXPORT WITH SCHEMA DISCOVERY
  // ============================================================================

  /**
   * Export limits - industry best practice
   */
  EXPORT_LIMITS: {
    MAX_DAYS: 90,
    MAX_ROWS: 100000,
    BATCH_SIZE: 1000,
  },

  /**
   * Fixed columns that appear first in CSV export
   * action/origin are promoted from event_data for easier filtering
   */
  FIXED_COLUMNS: [
    'id',
    'event_name',
    'event_category',
    'action',      // Promoted: tier_change, trial, usage_alert, doc_export, user_interaction
    'origin',      // Promoted: code_input (paste, upload, sample, github)
    'session_id',
    'user_id',
    'user_email',
    'ip_address',
    'is_internal',
    'created_at',
  ],

  /**
   * Discover all unique JSONB keys across matching events
   * Pass 1 of two-pass schema discovery
   *
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {string} [options.category] - Filter by event category
   * @param {Array<string>} [options.eventNames] - Filter by event names
   * @param {boolean} [options.excludeInternal=false] - Exclude internal users
   * @returns {Promise<Array<string>>} Sorted list of unique JSONB paths
   */
  async discoverEventSchema({ startDate, endDate, category, eventNames, excludeInternal = false }) {
    // Use recursive CTE to extract all unique JSONB keys (handles nested objects)
    // Build WHERE clause dynamically based on filters
    let result;
    const hasEventNames = eventNames && eventNames.length > 0;

    // We need to use different queries based on filter combinations
    // due to @vercel/postgres parameterization limitations
    if (category && hasEventNames && excludeInternal) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_category = ${category}
            AND event_name = ANY(${eventNames})
            AND is_internal = FALSE
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (category && hasEventNames) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_category = ${category}
            AND event_name = ANY(${eventNames})
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (category && excludeInternal) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_category = ${category}
            AND is_internal = FALSE
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (hasEventNames && excludeInternal) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_name = ANY(${eventNames})
            AND is_internal = FALSE
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (category) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_category = ${category}
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (hasEventNames) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND event_name = ANY(${eventNames})
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else if (excludeInternal) {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
            AND is_internal = FALSE
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    } else {
      result = await sql`
        WITH RECURSIVE json_keys AS (
          SELECT
            key AS path,
            value,
            jsonb_typeof(value) AS value_type
          FROM analytics_events, jsonb_each(event_data)
          WHERE created_at >= ${startDate}
            AND created_at < ${endDate}
          UNION ALL
          SELECT
            parent.path || '.' || child.key AS path,
            child.value,
            jsonb_typeof(child.value) AS value_type
          FROM json_keys parent, jsonb_each(parent.value) child
          WHERE parent.value_type = 'object'
        )
        SELECT DISTINCT path
        FROM json_keys
        WHERE value_type != 'object'
        ORDER BY path
      `;
    }

    return result.rows.map((row) => row.path);
  },

  /**
   * Get nested value from object using dot notation path
   * @param {Object} obj - Object to traverse
   * @param {string} path - Dot-notation path (e.g., 'latency.ttft_ms')
   * @returns {*} Value at path or undefined
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  },

  /**
   * Normalize value for CSV output
   * @param {*} value - Value to normalize
   * @returns {string} Normalized string value
   */
  normalizeValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  },

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   * @param {string} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeCSV(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  },

  /**
   * Fetch a batch of events for streaming export
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {string} [options.category] - Filter by category
   * @param {Array<string>} [options.eventNames] - Filter by event names
   * @param {boolean} [options.excludeInternal=false] - Exclude internal users
   * @param {number} options.offset - Offset for pagination
   * @param {number} options.limit - Batch size
   * @returns {Promise<Array>} Batch of events
   */
  async fetchEventBatch({ startDate, endDate, category, eventNames, excludeInternal = false, offset, limit }) {
    const hasEventNames = eventNames && eventNames.length > 0;

    let result;
    // Use different queries based on filter combinations
    if (category && hasEventNames && excludeInternal) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ANY(${eventNames})
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category && hasEventNames) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ANY(${eventNames})
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category && excludeInternal) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (hasEventNames && excludeInternal) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ANY(${eventNames})
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (hasEventNames) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ANY(${eventNames})
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (excludeInternal) {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id,
               ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return result.rows;
  },

  /**
   * Stream events to CSV with schema discovery
   * Two-pass export: 1) discover schema, 2) stream rows
   *
   * @param {Object} options - Export options
   * @param {Date} options.startDate - Start of date range
   * @param {Date} options.endDate - End of date range
   * @param {string} [options.category] - Filter by category
   * @param {Array<string>} [options.eventNames] - Filter by event names
   * @param {boolean} [options.excludeInternal=false] - Exclude internal users
   * @param {Object} res - Express response object for streaming
   * @returns {Promise<void>}
   */
  async streamEventsToCSV({ startDate, endDate, category, eventNames, excludeInternal = false, res }) {
    const { MAX_ROWS, BATCH_SIZE } = this.EXPORT_LIMITS;

    // Pass 1: Discover schema
    const variantPaths = await this.discoverEventSchema({
      startDate,
      endDate,
      category,
      eventNames,
      excludeInternal,
    });

    // Build CSV header
    const fixedHeaders = this.FIXED_COLUMNS;
    // Exclude action/origin from variant paths (already promoted to fixed columns)
    const promotedFields = ['action', 'origin'];
    const filteredPaths = variantPaths.filter((path) => !promotedFields.includes(path));
    // Add 'v_' prefix to variant columns and replace dots with underscores
    const variantHeaders = filteredPaths.map((path) => `v_${path.replace(/\./g, '_')}`);
    const allHeaders = [...fixedHeaders, ...variantHeaders];

    // Write header
    res.write(allHeaders.map((h) => this.escapeCSV(h)).join(',') + '\n');

    // Pass 2: Stream rows with cursor pagination
    let offset = 0;
    let totalRows = 0;

    while (totalRows < MAX_ROWS) {
      const batch = await this.fetchEventBatch({
        startDate,
        endDate,
        category,
        eventNames,
        excludeInternal,
        offset,
        limit: BATCH_SIZE,
      });

      if (batch.length === 0) break;

      for (const event of batch) {
        if (totalRows >= MAX_ROWS) break;

        // Build row with fixed columns
        // Extract action/origin from event_data (promoted columns)
        const eventData = event.event_data || {};
        const row = [
          this.normalizeValue(event.id),
          this.normalizeValue(event.event_name),
          this.normalizeValue(event.event_category),
          this.normalizeValue(eventData.action),   // Promoted from event_data
          this.normalizeValue(eventData.origin),   // Promoted from event_data
          this.normalizeValue(event.session_id),
          this.normalizeValue(event.user_id),
          this.normalizeValue(event.user_email),
          this.normalizeValue(event.ip_address),
          event.is_internal ? 'Yes' : 'No',
          event.created_at ? new Date(event.created_at).toISOString() : '',
        ];

        // Add variant columns from event_data (excluding promoted fields)
        for (const path of filteredPaths) {
          const value = this.getNestedValue(event.event_data, path);
          row.push(this.normalizeValue(value));
        }

        res.write(row.map((v) => this.escapeCSV(v)).join(',') + '\n');
        totalRows++;
      }

      offset += BATCH_SIZE;
    }
  },

  /**
   * Get metric comparison between current and previous period
   * @param {Object} options - Query options
   * @param {string} options.metric - Metric name (sessions, signups, revenue, etc.)
   * @param {Date} options.startDate - Current period start
   * @param {Date} options.endDate - Current period end
   * @param {boolean} [options.excludeInternal=true] - Exclude internal users
   * @returns {Promise<Object>} { current, previous, change }
   */
  async getMetricComparison({ metric, startDate, endDate, excludeInternal = true }) {
    // Calculate previous period (same duration, immediately prior)
    const duration = endDate - startDate;
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate - duration);

    // Helper to format date range for display
    const formatDateRange = (start, end) => {
      const opts = { month: 'short', day: 'numeric' };
      return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
    };

    // Fetch metric value for a period
    const getMetricValue = async (start, end) => {
      const params = { startDate: start, endDate: end, excludeInternal };

      switch (metric) {
        case 'sessions': {
          const funnel = await this.getConversionFunnel(params);
          return funnel.totalSessions;
        }
        case 'signups': {
          const data = await this.getBusinessMetrics(params);
          return data.signups;
        }
        case 'revenue': {
          const data = await this.getBusinessMetrics(params);
          return data.revenueCents;
        }
        case 'generations': {
          const data = await this.getPerformanceMetrics(params);
          return data.totalGenerations;
        }
        case 'completed_sessions': {
          const funnel = await this.getConversionFunnel(params);
          return funnel.stages?.generation_completed?.events || 0;
        }
        case 'avg_latency': {
          const data = await this.getPerformanceMetrics(params);
          return data.avgLatencyMs;
        }
        case 'cache_hit_rate': {
          const data = await this.getPerformanceMetrics(params);
          return data.cacheHitRate;
        }
        case 'throughput': {
          const data = await this.getPerformanceMetrics(params);
          return data.avgThroughput;
        }
        case 'errors': {
          let result;
          if (excludeInternal) {
            result = await sql`
              SELECT COUNT(*) as count
              FROM analytics_events
              WHERE event_name = 'error'
                AND created_at >= ${start}
                AND created_at < ${end}
                AND is_internal = FALSE
            `;
          } else {
            result = await sql`
              SELECT COUNT(*) as count
              FROM analytics_events
              WHERE event_name = 'error'
                AND created_at >= ${start}
                AND created_at < ${end}
            `;
          }
          return parseInt(result.rows[0]?.count || 0);
        }
        case 'error_rate': {
          let errors;
          if (excludeInternal) {
            errors = await sql`
              SELECT COUNT(*) as count
              FROM analytics_events
              WHERE event_name = 'error'
                AND created_at >= ${start}
                AND created_at < ${end}
                AND is_internal = FALSE
            `;
          } else {
            errors = await sql`
              SELECT COUNT(*) as count
              FROM analytics_events
              WHERE event_name = 'error'
                AND created_at >= ${start}
                AND created_at < ${end}
            `;
          }
          const funnel = await this.getConversionFunnel(params);
          const generations = funnel.stages?.generation_started?.events || 0;
          const errorCount = parseInt(errors.rows[0]?.count || 0);
          return generations > 0 ? (errorCount / generations) * 100 : 0;
        }
        default:
          throw new Error(`Unknown metric: ${metric}`);
      }
    };

    // Fetch both periods
    const [current, previous] = await Promise.all([
      getMetricValue(startDate, endDate),
      getMetricValue(prevStartDate, prevEndDate),
    ]);

    // Calculate change
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current: { value: current, period: formatDateRange(startDate, endDate) },
      previous: { value: previous, period: formatDateRange(prevStartDate, prevEndDate) },
      change: {
        value: Math.abs(change),
        percent: change,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      },
    };
  },

  /**
   * Get bulk metric comparisons for multiple metrics
   * @param {Object} options - Query options
   * @param {Array<string>} options.metrics - Array of metric names
   * @param {Date} options.startDate - Current period start
   * @param {Date} options.endDate - Current period end
   * @param {boolean} [options.excludeInternal=true] - Exclude internal users
   * @returns {Promise<Object>} Map of metric names to comparison objects
   */
  async getBulkComparisons({ metrics, startDate, endDate, excludeInternal = true }) {
    const comparisons = {};

    // Fetch all comparisons in parallel
    await Promise.all(
      metrics.map(async (metric) => {
        try {
          comparisons[metric] = await this.getMetricComparison({
            metric,
            startDate,
            endDate,
            excludeInternal,
          });
        } catch (error) {
          // If a metric fails, return null for that metric
          console.error(`Failed to get comparison for metric ${metric}:`, error.message);
          comparisons[metric] = null;
        }
      })
    );

    return comparisons;
  },

  /**
   * Get summary metrics for Health at a Glance dashboard
   * Returns key metrics with their current values and period-over-period changes
   * @param {Object} params
   * @param {Date} params.startDate - Start date for the period
   * @param {Date} params.endDate - End date for the period
   * @param {boolean} [params.excludeInternal=true] - Exclude internal test users
   * @returns {Promise<Object>} Summary metrics with values and comparisons
   */
  async getSummaryMetrics({ startDate, endDate, excludeInternal = true }) {
    try {
      // Fetch all metrics in parallel for efficiency
      const [
        businessData,
        funnelData,
        performanceData,
      ] = await Promise.all([
        this.getBusinessMetrics({ startDate, endDate, excludeInternal }),
        this.getConversionFunnel({ startDate, endDate, excludeInternal }),
        this.getPerformanceMetrics({ startDate, endDate, excludeInternal }),
      ]);

      // Calculate completion rate (completed sessions / total sessions)
      const totalSessions = funnelData.totalSessions || 0;
      const completedSessions = funnelData.completedSessions || 0;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Calculate error count (started - completed generations)
      const generationsStarted = funnelData.stages?.generation_started?.events || 0;
      const generationsCompleted = funnelData.stages?.generation_completed?.events || 0;
      const errorCount = generationsStarted - generationsCompleted;

      // Get comparisons for key metrics
      const comparisons = await this.getBulkComparisons({
        metrics: ['signups', 'revenue', 'sessions', 'avg_latency', 'errors'],
        startDate,
        endDate,
        excludeInternal,
      });

      // Build summary response
      return {
        signups: {
          value: businessData.signups || 0,
          change: comparisons.signups?.change?.percent || 0,
          direction: comparisons.signups?.change?.direction || 'neutral',
        },
        revenue: {
          value: businessData.revenueCents || 0,
          change: comparisons.revenue?.change?.percent || 0,
          direction: comparisons.revenue?.change?.direction || 'neutral',
        },
        sessions: {
          value: totalSessions,
          change: comparisons.sessions?.change?.percent || 0,
          direction: comparisons.sessions?.change?.direction || 'neutral',
        },
        completionRate: {
          value: completionRate,
          change: 0, // TODO: Could calculate completion rate comparison if needed
          direction: 'neutral',
        },
        avgLatency: {
          value: performanceData.avgLatencyMs || 0,
          change: comparisons.avg_latency?.change?.percent || 0,
          direction: comparisons.avg_latency?.change?.direction || 'neutral',
        },
        errorCount: {
          value: errorCount,
          change: comparisons.errors?.change?.percent || 0,
          direction: comparisons.errors?.change?.direction || 'neutral',
        },
      };
    } catch (error) {
      console.error('Failed to get summary metrics:', error);
      throw error;
    }
  },
};

export default analyticsService;
