/**
 * Usage Model
 * Handles user quota tracking and usage limits enforcement
 *
 * Manages two tables:
 * 1. user_quotas: For authenticated users (user_id references users table)
 * 2. anonymous_quotas: For anonymous users tracked by IP address
 *
 * When an anonymous user signs up, their usage can be migrated to user_quotas.
 */

import { sql } from '@vercel/postgres';

/**
 * Schema:
 *
 * user_quotas (authenticated users):
 * - id: SERIAL PRIMARY KEY
 * - user_id: INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
 * - daily_count: INTEGER DEFAULT 0 NOT NULL
 * - monthly_count: INTEGER DEFAULT 0 NOT NULL
 * - last_reset_date: TIMESTAMP NOT NULL DEFAULT NOW()
 * - period_start_date: DATE NOT NULL DEFAULT CURRENT_DATE
 * - created_at: TIMESTAMP DEFAULT NOW()
 * - updated_at: TIMESTAMP DEFAULT NOW()
 * - CONSTRAINT unique_user_period UNIQUE (user_id, period_start_date)
 *
 * anonymous_quotas (anonymous users tracked by IP):
 * - id: SERIAL PRIMARY KEY
 * - ip_address: VARCHAR(45) NOT NULL (supports IPv6)
 * - daily_count: INTEGER DEFAULT 0 NOT NULL
 * - monthly_count: INTEGER DEFAULT 0 NOT NULL
 * - last_reset_date: TIMESTAMP NOT NULL DEFAULT NOW()
 * - period_start_date: DATE NOT NULL DEFAULT CURRENT_DATE
 * - created_at: TIMESTAMP DEFAULT NOW()
 * - updated_at: TIMESTAMP DEFAULT NOW()
 * - CONSTRAINT unique_ip_period UNIQUE (ip_address, period_start_date)
 *
 * Indexes:
 * - idx_user_quotas_user_period: (user_id, period_start_date)
 * - idx_user_quotas_last_reset: (last_reset_date)
 * - idx_anonymous_quotas_ip_period: (ip_address, period_start_date)
 * - idx_anonymous_quotas_last_reset: (last_reset_date)
 */

class Usage {
  /**
   * Get user's current usage statistics
   *
   * Returns usage for the current period. If no record exists, returns zeroed stats.
   * Automatically handles period rollovers (daily/monthly resets).
   * Supports both authenticated users (by ID) and anonymous users (by IP).
   *
   * @param {number|string} userIdentifier - User ID (number) or IP address (string starting with "ip:")
   * @returns {Promise<Object>} Usage statistics
   * @property {number} dailyGenerations - Number of generations today
   * @property {number} monthlyGenerations - Number of generations this month
   * @property {Date} resetDate - Next daily reset time (midnight UTC)
   * @property {Date} periodStart - Start of current monthly period
   */
  static async getUserUsage(userIdentifier) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Determine if this is an authenticated user or anonymous user
    const isAnonymous = typeof userIdentifier === 'string' && userIdentifier.startsWith('ip:');

    let result;
    if (isAnonymous) {
      // Anonymous user tracked by IP
      const ipAddress = userIdentifier.substring(3); // Remove "ip:" prefix
      result = await sql`
        SELECT
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        FROM anonymous_quotas
        WHERE ip_address = ${ipAddress}
          AND period_start_date = ${periodStart.toISOString().split('T')[0]}
      `;
    } else {
      // Authenticated user tracked by user_id
      // Get the current period record (exact match like admin query and anonymous query)
      result = await sql`
        SELECT
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        FROM user_quotas
        WHERE user_id = ${userIdentifier}
          AND period_start_date = ${periodStart.toISOString().split('T')[0]}
      `;
    }

    if (result.rows.length === 0) {
      // No record exists for current period, return zeroed stats
      return {
        dailyGenerations: 0,
        monthlyGenerations: 0,
        resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow midnight
        periodStart,
      };
    }

    const usage = result.rows[0];
    const lastResetDate = new Date(usage.last_reset_date);
    lastResetDate.setHours(0, 0, 0, 0);

    // Check if daily reset is needed
    if (today.getTime() > lastResetDate.getTime()) {
      // Daily counter needs reset
      await this.resetDailyUsage(userIdentifier);
      return {
        dailyGenerations: 0,
        monthlyGenerations: usage.monthly_count,
        resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        periodStart: new Date(usage.period_start_date),
      };
    }

    return {
      dailyGenerations: usage.daily_count,
      monthlyGenerations: usage.monthly_count,
      resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      periodStart: new Date(usage.period_start_date),
    };
  }

  /**
   * Increment usage counters for a user
   *
   * Creates a new usage record if none exists for the current period.
   * Increments both daily_count and monthly_count atomically.
   * Supports both authenticated users (by ID) and anonymous users (by IP).
   *
   * @param {number|string} userIdentifier - User ID (number) or IP address (string starting with "ip:")
   * @param {number} count - Number to increment by (default: 1)
   * @returns {Promise<Object>} Updated usage statistics
   */
  static async incrementUsage(userIdentifier, count = 1) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Determine if this is an authenticated user or anonymous user
    const isAnonymous = typeof userIdentifier === 'string' && userIdentifier.startsWith('ip:');

    let result;
    if (isAnonymous) {
      // Anonymous user tracked by IP
      const ipAddress = userIdentifier.substring(3); // Remove "ip:" prefix
      result = await sql`
        INSERT INTO anonymous_quotas (
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        )
        VALUES (
          ${ipAddress},
          ${count},
          ${count},
          NOW(),
          ${periodStart.toISOString().split('T')[0]}
        )
        ON CONFLICT (ip_address, period_start_date)
        DO UPDATE SET
          daily_count = anonymous_quotas.daily_count + ${count},
          monthly_count = anonymous_quotas.monthly_count + ${count},
          updated_at = NOW()
        RETURNING
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    } else {
      // Authenticated user tracked by user_id
      result = await sql`
        INSERT INTO user_quotas (
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        )
        VALUES (
          ${userIdentifier},
          ${count},
          ${count},
          NOW(),
          ${periodStart.toISOString().split('T')[0]}
        )
        ON CONFLICT (user_id, period_start_date)
        DO UPDATE SET
          daily_count = user_quotas.daily_count + ${count},
          monthly_count = user_quotas.monthly_count + ${count},
          updated_at = NOW()
        RETURNING
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    }

    const usage = result.rows[0];

    return {
      dailyGenerations: usage.daily_count,
      monthlyGenerations: usage.monthly_count,
      resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      periodStart: new Date(usage.period_start_date),
    };
  }

  /**
   * Reset daily usage counter for a user
   *
   * Called automatically when a new day starts.
   * Preserves monthly_count but resets daily_count to 0.
   * Supports both authenticated users (by ID) and anonymous users (by IP).
   *
   * @param {number|string} userIdentifier - User ID (number) or IP address (string starting with "ip:")
   * @returns {Promise<Object>} Updated usage statistics
   */
  static async resetDailyUsage(userIdentifier) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Determine if this is an authenticated user or anonymous user
    const isAnonymous = typeof userIdentifier === 'string' && userIdentifier.startsWith('ip:');

    let result;
    if (isAnonymous) {
      // Anonymous user tracked by IP
      const ipAddress = userIdentifier.substring(3); // Remove "ip:" prefix
      result = await sql`
        UPDATE anonymous_quotas
        SET
          daily_count = 0,
          last_reset_date = NOW(),
          updated_at = NOW()
        WHERE ip_address = ${ipAddress}
          AND period_start_date = ${periodStart.toISOString().split('T')[0]}
        RETURNING
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    } else {
      // Authenticated user tracked by user_id
      result = await sql`
        UPDATE user_quotas
        SET
          daily_count = 0,
          last_reset_date = NOW(),
          updated_at = NOW()
        WHERE user_id = ${userIdentifier}
          AND period_start_date = ${periodStart.toISOString().split('T')[0]}
        RETURNING
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    }

    if (result.rows.length === 0) {
      // No record exists, return zeroed stats
      return {
        dailyGenerations: 0,
        monthlyGenerations: 0,
        resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        periodStart,
      };
    }

    const usage = result.rows[0];

    return {
      dailyGenerations: usage.daily_count,
      monthlyGenerations: usage.monthly_count,
      resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      periodStart: new Date(usage.period_start_date),
    };
  }

  /**
   * Reset monthly usage counter for a user
   *
   * Called at the start of each new month.
   * Resets both daily_count and monthly_count to 0.
   * Creates a new usage record for the new period.
   * Supports both authenticated users (by ID) and anonymous users (by IP).
   *
   * @param {number|string} userIdentifier - User ID (number) or IP address (string starting with "ip:")
   * @returns {Promise<Object>} Updated usage statistics
   */
  static async resetMonthlyUsage(userIdentifier) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Determine if this is an authenticated user or anonymous user
    const isAnonymous = typeof userIdentifier === 'string' && userIdentifier.startsWith('ip:');

    let result;
    if (isAnonymous) {
      // Anonymous user tracked by IP
      const ipAddress = userIdentifier.substring(3); // Remove "ip:" prefix
      result = await sql`
        INSERT INTO anonymous_quotas (
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        )
        VALUES (
          ${ipAddress},
          0,
          0,
          NOW(),
          ${newPeriodStart.toISOString().split('T')[0]}
        )
        ON CONFLICT (ip_address, period_start_date)
        DO UPDATE SET
          daily_count = 0,
          monthly_count = 0,
          last_reset_date = NOW(),
          updated_at = NOW()
        RETURNING
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    } else {
      // Authenticated user tracked by user_id
      result = await sql`
        INSERT INTO user_quotas (
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
        )
        VALUES (
          ${userIdentifier},
          0,
          0,
          NOW(),
          ${newPeriodStart.toISOString().split('T')[0]}
        )
        ON CONFLICT (user_id, period_start_date)
        DO UPDATE SET
          daily_count = 0,
          monthly_count = 0,
          last_reset_date = NOW(),
          updated_at = NOW()
        RETURNING
          user_id,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date
      `;
    }

    const usage = result.rows[0];

    return {
      dailyGenerations: usage.daily_count,
      monthlyGenerations: usage.monthly_count,
      resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      periodStart: new Date(usage.period_start_date),
    };
  }

  /**
   * Get usage statistics for a specific date range
   *
   * Useful for analytics and reporting.
   *
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date (inclusive)
   * @param {Date} endDate - End date (inclusive)
   * @returns {Promise<Array>} Array of usage records
   */
  static async getUsageHistory(userId, startDate, endDate) {
    const result = await sql`
      SELECT
        user_id,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date,
        created_at,
        updated_at
      FROM user_quotas
      WHERE user_id = ${userId}
        AND period_start_date >= ${startDate.toISOString().split('T')[0]}
        AND period_start_date <= ${endDate.toISOString().split('T')[0]}
      ORDER BY period_start_date DESC
    `;

    return result.rows.map((row) => ({
      dailyGenerations: row.daily_count,
      monthlyGenerations: row.monthly_count,
      lastResetDate: new Date(row.last_reset_date),
      periodStart: new Date(row.period_start_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * Delete usage records for a user
   *
   * Called when a user is deleted (cascade should handle this automatically).
   * Provided for manual cleanup if needed.
   *
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if records were deleted
   */
  static async deleteUserUsage(userId) {
    const result = await sql`
      DELETE FROM user_quotas
      WHERE user_id = ${userId}
    `;

    return result.rowCount > 0;
  }

  /**
   * Get total system-wide usage statistics
   *
   * Useful for admin dashboards and monitoring.
   *
   * @returns {Promise<Object>} System-wide statistics
   */
  static async getSystemUsageStats() {
    const result = await sql`
      SELECT
        COUNT(DISTINCT user_id) as total_users,
        SUM(daily_count) as total_daily_generations,
        SUM(monthly_count) as total_monthly_generations,
        AVG(daily_count) as avg_daily_per_user,
        AVG(monthly_count) as avg_monthly_per_user
      FROM user_quotas
      WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE)
    `;

    const stats = result.rows[0];

    return {
      totalUsers: parseInt(stats.total_users) || 0,
      totalDailyGenerations: parseInt(stats.total_daily_generations) || 0,
      totalMonthlyGenerations: parseInt(stats.total_monthly_generations) || 0,
      avgDailyPerUser: parseFloat(stats.avg_daily_per_user) || 0,
      avgMonthlyPerUser: parseFloat(stats.avg_monthly_per_user) || 0,
    };
  }

  /**
   * Migrate anonymous usage to a user account
   *
   * Called when an anonymous user signs up or logs in.
   * Merges their IP-based usage into their user account.
   * Deletes the anonymous usage record after migration.
   *
   * @param {string} ipAddress - IP address (without "ip:" prefix)
   * @param {number} userId - User ID to migrate usage to
   * @returns {Promise<Object>} Migration result with merged usage stats
   */
  static async migrateAnonymousUsage(ipAddress, userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get anonymous usage for current period
    const anonymousResult = await sql`
      SELECT
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date
      FROM anonymous_quotas
      WHERE ip_address = ${ipAddress}
        AND period_start_date = ${periodStart.toISOString().split('T')[0]}
    `;

    if (anonymousResult.rows.length === 0) {
      // No anonymous usage to migrate
      return {
        migrated: false,
        message: 'No anonymous usage found for this IP',
      };
    }

    const anonymousUsage = anonymousResult.rows[0];

    // Merge anonymous usage into user quota (upsert)
    const mergeResult = await sql`
      INSERT INTO user_quotas (
        user_id,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date
      )
      VALUES (
        ${userId},
        ${anonymousUsage.daily_count},
        ${anonymousUsage.monthly_count},
        ${anonymousUsage.last_reset_date},
        ${periodStart.toISOString().split('T')[0]}
      )
      ON CONFLICT (user_id, period_start_date)
      DO UPDATE SET
        daily_count = user_quotas.daily_count + ${anonymousUsage.daily_count},
        monthly_count = user_quotas.monthly_count + ${anonymousUsage.monthly_count},
        last_reset_date = GREATEST(user_quotas.last_reset_date, EXCLUDED.last_reset_date),
        updated_at = NOW()
      RETURNING
        user_id,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date
    `;

    // Delete anonymous usage record
    await sql`
      DELETE FROM anonymous_quotas
      WHERE ip_address = ${ipAddress}
        AND period_start_date = ${periodStart.toISOString().split('T')[0]}
    `;

    const merged = mergeResult.rows[0];

    return {
      migrated: true,
      message: 'Anonymous usage migrated successfully',
      usage: {
        dailyGenerations: merged.daily_count,
        monthlyGenerations: merged.monthly_count,
        resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        periodStart: new Date(merged.period_start_date),
      },
    };
  }
}

export default Usage;
