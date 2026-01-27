/**
 * AuditLog Model
 * HIPAA-compliant audit logging for all user actions
 */

import { sql } from '@vercel/postgres';

/**
 * audit_logs schema:
 * - id: SERIAL PRIMARY KEY
 * - user_id: INTEGER (FK to users, ON DELETE SET NULL)
 * - user_email: VARCHAR(255) (denormalized)
 * - action: VARCHAR(100) (code_generation, code_upload, etc.)
 * - resource_type: VARCHAR(50) (documentation, file, etc.)
 * - resource_id: VARCHAR(255) (optional)
 * - input_hash: VARCHAR(64) (SHA-256 hash)
 * - contains_potential_phi: BOOLEAN
 * - phi_score: INTEGER (0-100)
 * - success: BOOLEAN
 * - error_message: TEXT
 * - ip_address: INET
 * - user_agent: TEXT
 * - duration_ms: INTEGER
 * - metadata: JSONB
 * - created_at: TIMESTAMPTZ
 */

class AuditLog {
  /**
   * Log an activity (async, non-blocking)
   * @param {Object} options - Audit log options
   * @param {number|null} options.userId - User ID (null for anonymous)
   * @param {string|null} options.userEmail - User email (denormalized)
   * @param {string} options.action - Action performed
   * @param {string|null} [options.resourceType] - Type of resource
   * @param {string|null} [options.resourceId] - Resource identifier
   * @param {string|null} [options.inputHash] - SHA-256 hash of input
   * @param {boolean} [options.containsPotentialPhi=false] - PHI detection flag
   * @param {number} [options.phiScore=0] - PHI confidence score (0-100)
   * @param {boolean} [options.success=true] - Action success status
   * @param {string|null} [options.errorMessage] - Sanitized error message
   * @param {string|null} [options.ipAddress] - Client IP address
   * @param {string|null} [options.userAgent] - Client user agent
   * @param {number|null} [options.durationMs] - Duration in milliseconds
   * @param {Object} [options.metadata={}] - Additional context
   * @returns {Promise<Object>} Created audit log entry
   */
  static async log({
    userId,
    userEmail,
    action,
    resourceType = null,
    resourceId = null,
    inputHash = null,
    containsPotentialPhi = false,
    phiScore = 0,
    success = true,
    errorMessage = null,
    ipAddress = null,
    userAgent = null,
    durationMs = null,
    metadata = {},
  }) {
    try {
      const result = await sql`
        INSERT INTO audit_logs (
          user_id,
          user_email,
          action,
          resource_type,
          resource_id,
          input_hash,
          contains_potential_phi,
          phi_score,
          success,
          error_message,
          ip_address,
          user_agent,
          duration_ms,
          metadata
        )
        VALUES (
          ${userId},
          ${userEmail},
          ${action},
          ${resourceType},
          ${resourceId},
          ${inputHash},
          ${containsPotentialPhi},
          ${phiScore},
          ${success},
          ${errorMessage},
          ${ipAddress},
          ${userAgent},
          ${durationMs},
          ${JSON.stringify(metadata)}
        )
        RETURNING *
      `;

      return result.rows[0];
    } catch (error) {
      // Log error but don't throw - audit logging should be non-blocking
      console.error('[AuditLog] Failed to log activity:', error.message);
      return null;
    }
  }

  /**
   * Get audit logs with optional filters and pagination
   * @param {Object} options - Query options
   * @param {number|null} [options.userId] - Filter by user ID
   * @param {string|null} [options.userEmail] - Filter by user email
   * @param {string|null} [options.action] - Filter by action type
   * @param {boolean|null} [options.containsPhi] - Filter by PHI presence
   * @param {string|null} [options.riskLevel] - Filter by risk level (high/medium/low)
   * @param {Date|null} [options.startDate] - Start date for range
   * @param {Date|null} [options.endDate] - End date for range
   * @param {number} [options.limit=50] - Max results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} { logs, total }
   */
  static async getAuditLogs({
    userId = null,
    userEmail = null,
    action = null,
    containsPhi = null,
    riskLevel = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0,
  } = {}) {
    // Build WHERE clauses
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userId !== null) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (userEmail) {
      conditions.push(`user_email = $${paramIndex++}`);
      params.push(userEmail);
    }

    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }

    if (containsPhi !== null) {
      conditions.push(`contains_potential_phi = $${paramIndex++}`);
      params.push(containsPhi);
    }

    // Risk level filter based on PHI score
    if (riskLevel) {
      if (riskLevel === 'high') {
        conditions.push(`phi_score >= 16`);
      } else if (riskLevel === 'medium') {
        conditions.push(`phi_score >= 6 AND phi_score <= 15`);
      } else if (riskLevel === 'low') {
        conditions.push(`phi_score >= 1 AND phi_score <= 5`);
      } else if (riskLevel === 'none') {
        conditions.push(`phi_score = 0`);
      }
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Add limit and offset
    params.push(limit, offset);

    const query = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      sql.query(query, params),
      sql.query(countQuery, params.slice(0, -2)), // Remove limit/offset for count
    ]);

    return {
      logs: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  }

  /**
   * Get audit statistics
   * @param {Object} options - Query options
   * @param {Date|null} [options.startDate] - Start date for stats
   * @param {Date|null} [options.endDate] - End date for stats
   * @returns {Promise<Object>} Audit statistics
   */
  static async getStats({ startDate = null, endDate = null } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE contains_potential_phi = true) as phi_events,
        COUNT(*) FILTER (WHERE phi_score >= 16) as high_risk_events,
        COUNT(*) FILTER (WHERE phi_score >= 6 AND phi_score <= 15) as medium_risk_events,
        COUNT(*) FILTER (WHERE phi_score >= 1 AND phi_score <= 5) as low_risk_events,
        COUNT(*) FILTER (WHERE success = false) as failed_events,
        AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
        MAX(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as max_duration_ms
      FROM audit_logs
      ${whereClause}
    `;

    const result = await sql.query(query, params);
    return result.rows[0];
  }

  /**
   * Get activity by action type
   * @param {Object} options - Query options
   * @param {Date|null} [options.startDate] - Start date
   * @param {Date|null} [options.endDate] - End date
   * @returns {Promise<Array>} Action type counts
   */
  static async getActivityByAction({ startDate = null, endDate = null } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        action,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE contains_potential_phi = true) as phi_count,
        AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms
      FROM audit_logs
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
    `;

    const result = await sql.query(query, params);
    return result.rows;
  }

  /**
   * Get top users by activity
   * @param {Object} options - Query options
   * @param {Date|null} [options.startDate] - Start date
   * @param {Date|null} [options.endDate] - End date
   * @param {number} [options.limit=10] - Max users to return
   * @returns {Promise<Array>} Top users
   */
  static async getTopUsers({ startDate = null, endDate = null, limit = 10 } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate.toISOString());
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);

    const query = `
      SELECT
        user_id,
        user_email,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE contains_potential_phi = true) as phi_events,
        COUNT(*) FILTER (WHERE phi_score >= 16) as high_risk_events,
        MAX(created_at) as last_activity
      FROM audit_logs
      ${whereClause}
      GROUP BY user_id, user_email
      ORDER BY total_events DESC
      LIMIT $${paramIndex++}
    `;

    const result = await sql.query(query, params);
    return result.rows;
  }
}

export default AuditLog;
