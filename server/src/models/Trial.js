/**
 * Trial Model
 * Manages user trial periods for Pro/Team access
 */

import { sql } from '@vercel/postgres';

/**
 * Trial schema (user_trials table):
 * - id: SERIAL PRIMARY KEY
 * - user_id: INTEGER NOT NULL (FK to users)
 * - invite_code_id: INTEGER (FK to invite_codes, nullable for self-serve)
 * - trial_tier: VARCHAR(50) DEFAULT 'pro'
 * - duration_days: INTEGER DEFAULT 14
 * - started_at: TIMESTAMPTZ DEFAULT NOW()
 * - ends_at: TIMESTAMPTZ NOT NULL
 * - status: VARCHAR(50) DEFAULT 'active'
 * - converted_at: TIMESTAMPTZ (nullable)
 * - converted_to_tier: VARCHAR(50) (nullable)
 * - converted_subscription_id: INTEGER (FK to subscriptions)
 * - source: VARCHAR(50) DEFAULT 'invite'
 * - original_ends_at: TIMESTAMPTZ (nullable)
 * - extended_by_days: INTEGER DEFAULT 0
 * - extension_reason: TEXT (nullable)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

class Trial {
  /**
   * Create a new trial for a user
   * @param {Object} options - Trial options
   * @param {number} options.userId - User ID
   * @param {number|null} options.inviteCodeId - Invite code ID (null for self-serve)
   * @param {string} options.trialTier - Tier to grant (default: 'pro')
   * @param {number} options.durationDays - Trial duration in days (default: 14)
   * @param {string} options.source - Origin: invite, self_serve, admin_grant
   * @returns {Promise<Object>} Created trial
   */
  static async create({
    userId,
    inviteCodeId = null,
    trialTier = 'pro',
    durationDays = 14,
    source = 'invite'
  }) {
    // Calculate end date
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    const result = await sql`
      INSERT INTO user_trials (
        user_id, invite_code_id, trial_tier, duration_days, ends_at, source
      )
      VALUES (
        ${userId}, ${inviteCodeId}, ${trialTier}, ${durationDays},
        ${endsAt.toISOString()}, ${source}
      )
      RETURNING id, user_id, invite_code_id, trial_tier, duration_days,
                started_at, ends_at, status, source, created_at
    `;

    return result.rows[0];
  }

  /**
   * Find active trial for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active trial or null
   */
  static async findActiveByUserId(userId) {
    const result = await sql`
      SELECT id, user_id, invite_code_id, trial_tier, duration_days,
             started_at, ends_at, status, source,
             original_ends_at, extended_by_days, extension_reason,
             created_at, updated_at
      FROM user_trials
      WHERE user_id = ${userId}
        AND status = 'active'
        AND ends_at > NOW()
      LIMIT 1
    `;

    return result.rows[0] || null;
  }

  /**
   * Find trial by ID
   * @param {number} id - Trial ID
   * @returns {Promise<Object|null>} Trial or null
   */
  static async findById(id) {
    const result = await sql`
      SELECT id, user_id, invite_code_id, trial_tier, duration_days,
             started_at, ends_at, status, source,
             converted_at, converted_to_tier, converted_subscription_id,
             original_ends_at, extended_by_days, extension_reason,
             created_at, updated_at
      FROM user_trials
      WHERE id = ${id}
    `;

    return result.rows[0] || null;
  }

  /**
   * Find all trials for a user (history)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of trials
   */
  static async findAllByUserId(userId) {
    const result = await sql`
      SELECT id, user_id, invite_code_id, trial_tier, duration_days,
             started_at, ends_at, status, source,
             converted_at, converted_to_tier,
             original_ends_at, extended_by_days, extension_reason,
             created_at, updated_at
      FROM user_trials
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows;
  }

  /**
   * Find trials by invite code ID
   * @param {number} inviteCodeId - Invite code ID
   * @returns {Promise<Array>} Array of trials using this code
   */
  static async findByInviteCodeId(inviteCodeId) {
    const result = await sql`
      SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
             t.started_at, t.ends_at, t.status, t.source,
             t.converted_at, t.converted_to_tier,
             u.email as user_email
      FROM user_trials t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.invite_code_id = ${inviteCodeId}
      ORDER BY t.created_at DESC
    `;

    return result.rows;
  }

  /**
   * Mark trial as expired
   * @param {number} id - Trial ID
   * @returns {Promise<Object>} Updated trial
   */
  static async expire(id) {
    const result = await sql`
      UPDATE user_trials
      SET status = 'expired',
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, user_id, status, ends_at
    `;

    if (result.rows.length === 0) {
      throw new Error('Trial not found');
    }

    return result.rows[0];
  }

  /**
   * Mark trial as converted to paid subscription
   * @param {number} id - Trial ID
   * @param {string} tier - Converted tier
   * @param {number|null} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Updated trial
   */
  static async convert(id, tier, subscriptionId = null) {
    const result = await sql`
      UPDATE user_trials
      SET status = 'converted',
          converted_at = NOW(),
          converted_to_tier = ${tier},
          converted_subscription_id = ${subscriptionId},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, user_id, status, converted_at, converted_to_tier
    `;

    if (result.rows.length === 0) {
      throw new Error('Trial not found');
    }

    return result.rows[0];
  }

  /**
   * Cancel trial early
   * @param {number} id - Trial ID
   * @returns {Promise<Object>} Updated trial
   */
  static async cancel(id) {
    const result = await sql`
      UPDATE user_trials
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = ${id}
        AND status = 'active'
      RETURNING id, user_id, status
    `;

    if (result.rows.length === 0) {
      throw new Error('Trial not found or not active');
    }

    return result.rows[0];
  }

  /**
   * Extend trial by additional days
   * @param {number} id - Trial ID
   * @param {number} additionalDays - Days to add
   * @param {string} reason - Reason for extension (for audit)
   * @returns {Promise<Object>} Updated trial
   */
  static async extend(id, additionalDays, reason) {
    // First, get the current trial to preserve original_ends_at
    const current = await Trial.findById(id);
    if (!current) {
      throw new Error('Trial not found');
    }

    if (current.status !== 'active') {
      throw new Error('Can only extend active trials');
    }

    // Set original_ends_at if this is the first extension
    const originalEndsAt = current.original_ends_at || current.ends_at;

    // Calculate new end date
    const newEndsAt = new Date(current.ends_at);
    newEndsAt.setDate(newEndsAt.getDate() + additionalDays);

    const totalExtendedDays = (current.extended_by_days || 0) + additionalDays;

    const result = await sql`
      UPDATE user_trials
      SET ends_at = ${newEndsAt.toISOString()},
          original_ends_at = ${originalEndsAt},
          extended_by_days = ${totalExtendedDays},
          extension_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, user_id, trial_tier, started_at, ends_at,
                original_ends_at, extended_by_days, extension_reason
    `;

    return result.rows[0];
  }

  /**
   * Get trials expiring within specified days
   * Used for sending reminder emails
   * @param {number} withinDays - Days until expiration
   * @returns {Promise<Array>} Trials expiring soon
   */
  static async getExpiring(withinDays) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + withinDays);

    // Get trials that expire on exactly that day (not before, not after)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await sql`
      SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
             t.started_at, t.ends_at, t.status, t.source,
             u.email as user_email, u.first_name, u.last_name
      FROM user_trials t
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'active'
        AND t.ends_at >= ${startOfDay.toISOString()}
        AND t.ends_at <= ${endOfDay.toISOString()}
    `;

    return result.rows;
  }

  /**
   * Get all expired trials that haven't been processed yet
   * @returns {Promise<Array>} Expired trials
   */
  static async getExpired() {
    const result = await sql`
      SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
             t.started_at, t.ends_at, t.invite_code_id,
             u.email as user_email, u.first_name, u.last_name
      FROM user_trials t
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'active'
        AND t.ends_at < NOW()
    `;

    return result.rows;
  }

  /**
   * Get all active trials with user info
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.limit - Results per page
   * @returns {Promise<Object>} { rows: [], total: number }
   */
  static async getAllActive({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      sql`
        SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
               t.started_at, t.ends_at, t.status, t.source,
               t.original_ends_at, t.extended_by_days,
               u.email as user_email, u.first_name, u.last_name
        FROM user_trials t
        JOIN users u ON u.id = t.user_id
        WHERE t.status = 'active'
        ORDER BY t.ends_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as total
        FROM user_trials
        WHERE status = 'active'
      `
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  /**
   * Get recent trials (all statuses)
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Results per page
   * @param {string|null} options.status - Filter by status
   * @returns {Promise<Object>} { rows: [], total: number }
   */
  static async getRecent({ page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;

    let dataQuery;
    let countQuery;

    if (status) {
      dataQuery = sql`
        SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
               t.started_at, t.ends_at, t.status, t.source,
               t.converted_at, t.converted_to_tier,
               u.email as user_email, u.first_name, u.last_name
        FROM user_trials t
        JOIN users u ON u.id = t.user_id
        WHERE t.status = ${status}
        ORDER BY t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM user_trials
        WHERE status = ${status}
      `;
    } else {
      dataQuery = sql`
        SELECT t.id, t.user_id, t.trial_tier, t.duration_days,
               t.started_at, t.ends_at, t.status, t.source,
               t.converted_at, t.converted_to_tier,
               u.email as user_email, u.first_name, u.last_name
        FROM user_trials t
        JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM user_trials
      `;
    }

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  /**
   * Get trial statistics
   * @returns {Promise<Object>} Aggregate statistics
   */
  static async getStats() {
    const result = await sql`
      SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
        COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE status = 'converted') /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('expired', 'converted')), 0),
          2
        ) as conversion_rate,
        AVG(
          EXTRACT(EPOCH FROM (converted_at - started_at)) / 86400
        ) FILTER (WHERE status = 'converted') as avg_days_to_convert
      FROM user_trials
    `;

    // Stats by tier
    const byTier = await sql`
      SELECT
        trial_tier,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'converted') as converted
      FROM user_trials
      GROUP BY trial_tier
      ORDER BY total DESC
    `;

    // Stats by source
    const bySource = await sql`
      SELECT
        source,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'converted') as converted
      FROM user_trials
      GROUP BY source
      ORDER BY total DESC
    `;

    return {
      ...result.rows[0],
      byTier: byTier.rows,
      bySource: bySource.rows
    };
  }

  /**
   * Check if user is eligible for a trial
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Eligibility status
   */
  static async checkEligibility(userId) {
    // Check if user has any previous trials
    const previousTrials = await sql`
      SELECT id, status, trial_tier, ended_at
      FROM user_trials
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (previousTrials.rows.length === 0) {
      return { eligible: true, reason: null };
    }

    const lastTrial = previousTrials.rows[0];

    // Check if there's an active trial
    if (lastTrial.status === 'active') {
      return { eligible: false, reason: 'You already have an active trial' };
    }

    // Could add cooldown period check here in the future
    // For now, allow one trial per user

    return { eligible: false, reason: 'You have already used a trial' };
  }
}

export default Trial;
