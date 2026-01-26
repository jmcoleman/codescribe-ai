/**
 * AdminAuditLog Model
 * Comprehensive audit logging for all admin actions
 */

import { sql } from '@vercel/postgres';

/**
 * admin_audit_log schema:
 * - id: SERIAL PRIMARY KEY
 * - admin_user_id: INTEGER (FK to users)
 * - admin_email: VARCHAR(255) (denormalized)
 * - action: VARCHAR(50) (create, update, delete, activate, etc.)
 * - resource_type: VARCHAR(50) (trial_program, invite_code, user, etc.)
 * - resource_id: INTEGER (nullable)
 * - resource_name: VARCHAR(255) (denormalized)
 * - old_values: JSONB (snapshot before change)
 * - new_values: JSONB (snapshot after change)
 * - reason: TEXT (admin-provided reason)
 * - metadata: JSONB (IP, user agent, etc.)
 * - created_at: TIMESTAMPTZ
 */

class AdminAuditLog {
  /**
   * Log an admin action
   * @param {Object} options - Audit log options
   * @param {number} options.adminUserId - Admin user ID
   * @param {string} options.adminEmail - Admin email (denormalized)
   * @param {string} options.action - Action performed (create, update, delete, etc.)
   * @param {string} options.resourceType - Type of resource (trial_program, invite_code, etc.)
   * @param {number} [options.resourceId] - Resource ID (optional for bulk operations)
   * @param {string} [options.resourceName] - Resource name for clarity
   * @param {Object} [options.oldValues] - Values before change
   * @param {Object} [options.newValues] - Values after change
   * @param {string} [options.reason] - Reason for action
   * @param {Object} [options.metadata] - Additional context
   * @returns {Promise<Object>} Created audit log entry
   */
  static async log({
    adminUserId,
    adminEmail,
    action,
    resourceType,
    resourceId = null,
    resourceName = null,
    oldValues = null,
    newValues = null,
    reason = null,
    metadata = {},
  }) {
    const result = await sql`
      INSERT INTO admin_audit_log (
        admin_user_id,
        admin_email,
        action,
        resource_type,
        resource_id,
        resource_name,
        old_values,
        new_values,
        reason,
        metadata
      )
      VALUES (
        ${adminUserId},
        ${adminEmail},
        ${action},
        ${resourceType},
        ${resourceId},
        ${resourceName},
        ${oldValues ? JSON.stringify(oldValues) : null},
        ${newValues ? JSON.stringify(newValues) : null},
        ${reason},
        ${JSON.stringify(metadata)}
      )
      RETURNING *
    `;

    return result.rows[0];
  }

  /**
   * Get audit logs with optional filters
   * @param {Object} options - Query options
   * @param {string} [options.resourceType] - Filter by resource type
   * @param {number} [options.resourceId] - Filter by resource ID
   * @param {number} [options.adminUserId] - Filter by admin user
   * @param {string} [options.action] - Filter by action type
   * @param {number} [options.limit=50] - Max results
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Object>} { logs, total }
   */
  static async list({
    resourceType = null,
    resourceId = null,
    adminUserId = null,
    action = null,
    limit = 50,
    offset = 0,
  } = {}) {
    // Build WHERE clauses
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(resourceType);
    }

    if (resourceId !== null) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(resourceId);
    }

    if (adminUserId) {
      conditions.push(`admin_user_id = $${paramIndex++}`);
      params.push(adminUserId);
    }

    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Add limit and offset
    params.push(limit, offset);

    const query = `
      SELECT *
      FROM admin_audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM admin_audit_log
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
   * Get audit logs for a specific resource
   * @param {string} resourceType - Resource type
   * @param {number} resourceId - Resource ID
   * @returns {Promise<Array>} Audit log entries
   */
  static async getByResource(resourceType, resourceId) {
    const result = await sql`
      SELECT *
      FROM admin_audit_log
      WHERE resource_type = ${resourceType}
        AND resource_id = ${resourceId}
      ORDER BY created_at DESC
    `;

    return result.rows;
  }

  /**
   * Get recent admin activity
   * @param {number} [adminUserId] - Optional filter by admin user
   * @param {number} [limit=100] - Max results
   * @returns {Promise<Array>} Recent audit log entries
   */
  static async getRecentActivity(adminUserId = null, limit = 100) {
    if (adminUserId) {
      const result = await sql`
        SELECT *
        FROM admin_audit_log
        WHERE admin_user_id = ${adminUserId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result.rows;
    }

    const result = await sql`
      SELECT *
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  }

  /**
   * Get audit statistics
   * @param {Object} options - Query options
   * @param {Date} [options.startDate] - Start date for stats
   * @param {Date} [options.endDate] - End date for stats
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
        COUNT(*) as total_actions,
        COUNT(DISTINCT admin_user_id) as unique_admins,
        COUNT(DISTINCT resource_type) as resource_types_affected,
        jsonb_object_agg(
          action,
          action_count
        ) as actions_by_type,
        jsonb_object_agg(
          resource_type,
          resource_count
        ) as actions_by_resource
      FROM (
        SELECT
          action,
          resource_type,
          COUNT(*) OVER (PARTITION BY action) as action_count,
          COUNT(*) OVER (PARTITION BY resource_type) as resource_count,
          admin_user_id
        FROM admin_audit_log
        ${whereClause}
      ) subquery
    `;

    const result = await sql.query(query, params);
    return result.rows[0];
  }
}

export default AdminAuditLog;
