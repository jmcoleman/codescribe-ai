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
  // Funnel events
  session_start: 'funnel',
  code_input: 'funnel',
  generation_started: 'funnel',
  generation_completed: 'funnel',
  doc_copied: 'funnel',
  doc_downloaded: 'funnel',

  // Business events
  signup: 'business',
  tier_upgrade: 'business',
  tier_downgrade: 'business',
  checkout_completed: 'business',
  subscription_cancelled: 'business',

  // Usage events
  doc_generation: 'usage',
  batch_generation: 'usage',
  quality_score: 'usage',
  file_upload: 'usage',
  oauth_flow: 'usage',
  user_interaction: 'usage',
  error: 'usage',
};

/**
 * Allowed event names for validation
 */
const ALLOWED_EVENTS = new Set(Object.keys(EVENT_CATEGORIES));

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
    if (userId && !isInternalUser) {
      try {
        const userResult = await sql`
          SELECT role, viewing_as_tier FROM users WHERE id = ${userId}
        `;
        if (userResult.rows.length > 0) {
          const { role, viewing_as_tier } = userResult.rows[0];
          // Mark as internal if admin/support role OR if they have an active tier override
          isInternalUser = ['admin', 'support', 'super_admin'].includes(role) || !!viewing_as_tier;
        }
      } catch (error) {
        // Don't fail event recording if user lookup fails
        console.error('[Analytics] User lookup failed:', error.message);
      }
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
    // Use separate queries to avoid SQL fragment interpolation issues
    let result;
    if (excludeInternal) {
      result = await sql`
        SELECT
          event_name,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_category = 'funnel'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_name
      `;
    } else {
      result = await sql`
        SELECT
          event_name,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(*) as total_events
        FROM analytics_events
        WHERE event_category = 'funnel'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_name
      `;
    }

    // Build funnel data with conversion rates
    const stages = ['session_start', 'code_input', 'generation_started', 'generation_completed', 'doc_copied'];
    const funnelData = {};

    stages.forEach((stage) => {
      const row = result.rows.find((r) => r.event_name === stage);
      funnelData[stage] = {
        sessions: parseInt(row?.unique_sessions || 0),
        events: parseInt(row?.total_events || 0),
      };
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
      completedSessions: funnelData.doc_copied?.sessions || 0,
      overallConversion: funnelData.session_start?.sessions > 0
        ? Math.round((funnelData.doc_copied?.sessions / funnelData.session_start?.sessions) * 1000) / 10
        : 0,
    };
  },

  // ============================================================================
  // BUSINESS QUERIES
  // ============================================================================

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

    // Get tier upgrade breakdown
    let tierBreakdown;
    if (excludeInternal) {
      tierBreakdown = await sql`
        SELECT
          event_data->>'new_tier' as tier,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'tier_upgrade'
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
        WHERE event_name = 'tier_upgrade'
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'new_tier'
      `;
    }

    return {
      signups: metrics.signup?.count || 0,
      tierUpgrades: metrics.tier_upgrade?.count || 0,
      tierDowngrades: metrics.tier_downgrade?.count || 0,
      checkouts: metrics.checkout_completed?.count || 0,
      cancellations: metrics.subscription_cancelled?.count || 0,
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
    let languages;
    if (excludeInternal) {
      languages = await sql`
        SELECT
          event_data->>'language' as language,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->>'language' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->>'language'
        ORDER BY count DESC
        LIMIT 10
      `;
    } else {
      languages = await sql`
        SELECT
          event_data->>'language' as language,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->>'language' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'language'
        ORDER BY count DESC
        LIMIT 10
      `;
    }

    // Get origin breakdown (only successful generations)
    let origins;
    if (excludeInternal) {
      origins = await sql`
        SELECT
          event_data->>'origin' as origin,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->>'origin' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
          AND is_internal = FALSE
        GROUP BY event_data->>'origin'
        ORDER BY count DESC
      `;
    } else {
      origins = await sql`
        SELECT
          event_data->>'origin' as origin,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_name = 'doc_generation'
          AND event_data->>'success' = 'true'
          AND event_data->>'origin' IS NOT NULL
          AND created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY event_data->>'origin'
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
   * @param {Object} options - Query options
   * @param {Date} [options.startDate] - Start of date range
   * @param {Date} [options.endDate] - End of date range
   * @param {string} [options.category] - Filter by event category
   * @param {string} [options.eventName] - Filter by event name
   * @param {boolean} [options.excludeInternal=false] - Exclude internal users
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @param {number} [options.limit=50] - Events per page
   * @returns {Promise<Object>} { events: Array, total: number, page: number, totalPages: number }
   */
  async getEvents({ startDate, endDate, category, eventName, excludeInternal = false, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;

    // Build WHERE conditions based on filters
    // We need separate queries for each filter combination due to @vercel/postgres limitations
    // Join with users table to get email for authenticated events
    let events;
    let countResult;

    if (category && eventName && excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ${eventName}
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
          AND event_name = ${eventName}
          AND is_internal = FALSE
      `;
    } else if (category && eventName) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_category = ${category}
          AND ae.event_name = ${eventName}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_category = ${category}
          AND event_name = ${eventName}
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
    } else if (eventName && excludeInternal) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ${eventName}
          AND ae.is_internal = FALSE
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_name = ${eventName}
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
    } else if (eventName) {
      events = await sql`
        SELECT ae.id, ae.event_name, ae.event_category, ae.session_id, ae.user_id, ae.ip_address, ae.event_data, ae.is_internal, ae.created_at, u.email as user_email
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= ${startDate}
          AND ae.created_at < ${endDate}
          AND ae.event_name = ${eventName}
        ORDER BY ae.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND event_name = ${eventName}
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

    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      events: events.rows.map((row) => ({
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
      })),
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * Get distinct event names (for filter dropdown)
   * @returns {Promise<Array<string>>} List of event names
   */
  async getEventNames() {
    const result = await sql`
      SELECT DISTINCT event_name
      FROM analytics_events
      ORDER BY event_name
    `;
    return result.rows.map((row) => row.event_name);
  },
};

export default analyticsService;
