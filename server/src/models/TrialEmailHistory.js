/**
 * Trial Email History Model
 * Tracks email reminders sent for trials to prevent duplicate sends
 */

import { sql } from '@vercel/postgres';

/**
 * TrialEmailHistory schema (trial_email_history table):
 * - id: SERIAL PRIMARY KEY
 * - trial_id: INTEGER NOT NULL (FK to user_trials)
 * - user_id: INTEGER NOT NULL (FK to users)
 * - email_type: VARCHAR(50) NOT NULL ('3_day_reminder', '1_day_reminder', 'trial_expired', 'trial_extended')
 * - status: VARCHAR(20) NOT NULL DEFAULT 'pending' ('pending', 'sent', 'failed', 'skipped')
 * - error_message: TEXT (nullable)
 * - sent_at: TIMESTAMPTZ (nullable)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

class TrialEmailHistory {
  /**
   * Valid email types for trial notifications
   */
  static EMAIL_TYPES = {
    THREE_DAY_REMINDER: '3_day_reminder',
    ONE_DAY_REMINDER: '1_day_reminder',
    TRIAL_EXPIRED: 'trial_expired',
    TRIAL_EXTENDED: 'trial_extended'
  };

  /**
   * Valid status values
   */
  static STATUSES = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    SKIPPED: 'skipped'
  };

  /**
   * Check if an email of a specific type has already been sent for a trial
   * @param {number} trialId - Trial ID
   * @param {string} emailType - Type of email
   * @returns {Promise<boolean>} True if already sent
   */
  static async hasBeenSent(trialId, emailType) {
    const result = await sql`
      SELECT id FROM trial_email_history
      WHERE trial_id = ${trialId}
        AND email_type = ${emailType}
        AND status = 'sent'
      LIMIT 1
    `;
    return result.rows.length > 0;
  }

  /**
   * Create a pending email record (for tracking before send attempt)
   * @param {Object} options - Record options
   * @param {number} options.trialId - Trial ID
   * @param {number} options.userId - User ID
   * @param {string} options.emailType - Type of email
   * @returns {Promise<Object>} Created record
   */
  static async createPending({ trialId, userId, emailType }) {
    try {
      const result = await sql`
        INSERT INTO trial_email_history (trial_id, user_id, email_type, status)
        VALUES (${trialId}, ${userId}, ${emailType}, 'pending')
        ON CONFLICT (trial_id, email_type) DO NOTHING
        RETURNING id, trial_id, user_id, email_type, status, created_at
      `;

      // If no row returned, the record already exists (duplicate)
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violation (duplicate send attempt)
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Mark email as sent successfully
   * @param {number} id - Record ID
   * @returns {Promise<Object>} Updated record
   */
  static async markSent(id) {
    const result = await sql`
      UPDATE trial_email_history
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${id}
      RETURNING id, trial_id, user_id, email_type, status, sent_at
    `;
    return result.rows[0];
  }

  /**
   * Mark email as failed with error message
   * @param {number} id - Record ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} Updated record
   */
  static async markFailed(id, errorMessage) {
    const result = await sql`
      UPDATE trial_email_history
      SET status = 'failed', error_message = ${errorMessage}
      WHERE id = ${id}
      RETURNING id, trial_id, user_id, email_type, status, error_message
    `;
    return result.rows[0];
  }

  /**
   * Mark email as skipped (already sent)
   * @param {number} id - Record ID
   * @returns {Promise<Object>} Updated record
   */
  static async markSkipped(id) {
    const result = await sql`
      UPDATE trial_email_history
      SET status = 'skipped'
      WHERE id = ${id}
      RETURNING id, trial_id, user_id, email_type, status
    `;
    return result.rows[0];
  }

  /**
   * Get email history for a trial
   * @param {number} trialId - Trial ID
   * @returns {Promise<Array>} Email history records
   */
  static async findByTrialId(trialId) {
    const result = await sql`
      SELECT id, trial_id, user_id, email_type, status, error_message, sent_at, created_at
      FROM trial_email_history
      WHERE trial_id = ${trialId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  }

  /**
   * Get email history for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Email history records
   */
  static async findByUserId(userId) {
    const result = await sql`
      SELECT id, trial_id, user_id, email_type, status, error_message, sent_at, created_at
      FROM trial_email_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  }

  /**
   * Get pending or failed emails for retry
   * @returns {Promise<Array>} Records needing retry
   */
  static async getPendingOrFailed() {
    const result = await sql`
      SELECT teh.id, teh.trial_id, teh.user_id, teh.email_type, teh.status,
             ut.trial_tier, ut.ends_at,
             u.email as user_email, u.name as user_name
      FROM trial_email_history teh
      JOIN user_trials ut ON ut.id = teh.trial_id
      JOIN users u ON u.id = teh.user_id
      WHERE teh.status IN ('pending', 'failed')
      ORDER BY teh.created_at ASC
    `;
    return result.rows;
  }

  /**
   * Get email statistics for analytics
   * @returns {Promise<Object>} Email statistics
   */
  static async getStats() {
    const result = await sql`
      SELECT
        email_type,
        status,
        COUNT(*)::int as count
      FROM trial_email_history
      GROUP BY email_type, status
      ORDER BY email_type, status
    `;

    // Transform into a more useful format
    const stats = {
      byType: {},
      totals: {
        pending: 0,
        sent: 0,
        failed: 0,
        skipped: 0
      }
    };

    for (const row of result.rows) {
      if (!stats.byType[row.email_type]) {
        stats.byType[row.email_type] = { pending: 0, sent: 0, failed: 0, skipped: 0 };
      }
      stats.byType[row.email_type][row.status] = row.count;
      stats.totals[row.status] += row.count;
    }

    return stats;
  }
}

export default TrialEmailHistory;
