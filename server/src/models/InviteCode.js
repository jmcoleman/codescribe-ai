/**
 * InviteCode Model
 * Manages invite codes for trial access to Pro/Team features
 */

import crypto from 'crypto';
import { sql } from '@vercel/postgres';

/**
 * InviteCode schema:
 * - id: SERIAL PRIMARY KEY
 * - code: VARCHAR(32) UNIQUE NOT NULL
 * - trial_tier: VARCHAR(50) DEFAULT 'pro'
 * - duration_days: INTEGER DEFAULT 14
 * - max_uses: INTEGER DEFAULT 1
 * - current_uses: INTEGER DEFAULT 0
 * - valid_from: TIMESTAMPTZ DEFAULT NOW()
 * - valid_until: TIMESTAMPTZ (nullable)
 * - status: VARCHAR(20) DEFAULT 'active'
 * - source: VARCHAR(100) DEFAULT 'admin'
 * - campaign: VARCHAR(100) (nullable)
 * - notes: TEXT (nullable)
 * - created_by_user_id: INTEGER (FK to users)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

class InviteCode {
  /**
   * Generate a unique, URL-safe invite code
   * Format: XXXX-XXXX-XXXX (12 chars with dashes)
   * @returns {string} Generated invite code
   */
  static generateCode() {
    const bytes = crypto.randomBytes(9); // 9 bytes = 12 base64url chars
    const code = bytes.toString('base64url').toUpperCase().slice(0, 12);
    // Insert dashes for readability: XXXX-XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
  }

  /**
   * Create a new invite code
   * @param {Object} options - Invite code options
   * @param {string} options.trialTier - Tier to grant (default: 'pro')
   * @param {number} options.durationDays - Trial duration in days (default: 14)
   * @param {number|null} options.maxUses - Max redemptions (null = unlimited)
   * @param {Date|null} options.validUntil - Code expiry date (null = no expiry)
   * @param {string} options.source - Origin: admin, sales, marketing, partner
   * @param {string|null} options.campaign - Trial Program identifier
   * @param {string|null} options.notes - Admin notes
   * @param {number|null} options.createdByUserId - Admin user ID
   * @returns {Promise<Object>} Created invite code
   */
  static async create({
    trialTier = 'pro',
    durationDays = 14,
    maxUses = 1,
    validUntil = null,
    source = 'admin',
    campaign = null,
    notes = null,
    createdByUserId = null
  }) {
    const code = InviteCode.generateCode();

    const result = await sql`
      INSERT INTO invite_codes (
        code, trial_tier, duration_days, max_uses,
        valid_until, source, campaign, notes, created_by_user_id
      )
      VALUES (
        ${code}, ${trialTier}, ${durationDays}, ${maxUses},
        ${validUntil ? validUntil.toISOString() : null},
        ${source}, ${campaign}, ${notes}, ${createdByUserId}
      )
      RETURNING id, code, trial_tier, duration_days, max_uses, current_uses,
                valid_from, valid_until, status, source, campaign, notes,
                created_by_user_id, created_at
    `;

    return result.rows[0];
  }

  /**
   * Find invite code by code string
   * @param {string} code - The invite code
   * @returns {Promise<Object|null>} Invite code or null
   */
  static async findByCode(code) {
    // Normalize code (uppercase, handle with/without dashes)
    const normalizedCode = code.toUpperCase().trim();

    const result = await sql`
      SELECT id, code, trial_tier, duration_days, max_uses, current_uses,
             valid_from, valid_until, status, source, campaign, notes,
             created_by_user_id, created_at, updated_at
      FROM invite_codes
      WHERE code = ${normalizedCode}
    `;

    return result.rows[0] || null;
  }

  /**
   * Find invite code by ID
   * @param {number} id - Invite code ID
   * @returns {Promise<Object|null>} Invite code or null
   */
  static async findById(id) {
    const result = await sql`
      SELECT id, code, trial_tier, duration_days, max_uses, current_uses,
             valid_from, valid_until, status, source, campaign, notes,
             created_by_user_id, created_at, updated_at
      FROM invite_codes
      WHERE id = ${id}
    `;

    return result.rows[0] || null;
  }

  /**
   * Validate if an invite code can be redeemed
   * @param {string} code - The invite code
   * @returns {Promise<Object>} Validation result
   */
  static async validate(code) {
    const inviteCode = await InviteCode.findByCode(code);

    if (!inviteCode) {
      return { valid: false, reason: 'Invalid invite code' };
    }

    const now = new Date();

    // Check status
    if (inviteCode.status !== 'active') {
      return {
        valid: false,
        reason: inviteCode.status === 'paused'
          ? 'This invite code is currently paused'
          : inviteCode.status === 'exhausted'
            ? 'This invite code has reached its usage limit'
            : 'This invite code has expired'
      };
    }

    // Check valid_from
    if (new Date(inviteCode.valid_from) > now) {
      return { valid: false, reason: 'This invite code is not yet active' };
    }

    // Check valid_until
    if (inviteCode.valid_until && new Date(inviteCode.valid_until) < now) {
      return { valid: false, reason: 'This invite code has expired' };
    }

    // Check usage limit
    if (inviteCode.max_uses !== null && inviteCode.current_uses >= inviteCode.max_uses) {
      return { valid: false, reason: 'This invite code has reached its usage limit' };
    }

    return {
      valid: true,
      tier: inviteCode.trial_tier,
      durationDays: inviteCode.duration_days,
      inviteCodeId: inviteCode.id
    };
  }

  /**
   * Redeem an invite code (increment usage)
   * @param {string} code - The invite code
   * @returns {Promise<Object>} Updated invite code with redemption details
   */
  static async redeem(code) {
    const normalizedCode = code.toUpperCase().trim();

    // Increment usage and update status if needed
    const result = await sql`
      UPDATE invite_codes
      SET current_uses = current_uses + 1,
          status = CASE
            WHEN max_uses IS NOT NULL AND current_uses + 1 >= max_uses THEN 'exhausted'
            ELSE status
          END,
          updated_at = NOW()
      WHERE code = ${normalizedCode}
        AND status = 'active'
        AND (valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
      RETURNING id, code, trial_tier, duration_days, max_uses, current_uses, status
    `;

    if (result.rows.length === 0) {
      throw new Error('Failed to redeem invite code - code may be invalid or exhausted');
    }

    return result.rows[0];
  }

  /**
   * Get all invite codes with pagination, sorting, and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.limit - Results per page
   * @param {string|null} options.status - Filter by status
   * @param {string|null} options.tier - Filter by trial tier
   * @param {string|null} options.campaign - Filter by campaign
   * @param {number|null} options.createdByUserId - Filter by creator
   * @param {string} options.sortBy - Column to sort by (created_at, status, trial_tier, current_uses)
   * @param {string} options.sortOrder - Sort direction (asc, desc)
   * @returns {Promise<Object>} { rows: [], total: number }
   */
  static async getAll({
    page = 1,
    limit = 20,
    status = null,
    tier = null,
    campaign = null,
    createdByUserId = null,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = {}) {
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause (use ic. prefix for joined query)
    let whereConditions = [];
    let values = [];

    if (status) {
      values.push(status);
      whereConditions.push(`ic.status = $${values.length}`);
    }

    if (tier) {
      values.push(tier);
      whereConditions.push(`ic.trial_tier = $${values.length}`);
    }

    if (campaign) {
      values.push(campaign);
      whereConditions.push(`ic.campaign = $${values.length}`);
    }

    if (createdByUserId) {
      values.push(createdByUserId);
      whereConditions.push(`ic.created_by_user_id = $${values.length}`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validate and build ORDER BY clause
    const allowedSortColumns = {
      'created_at': 'ic.created_at',
      'status': 'ic.status',
      'trial_tier': 'ic.trial_tier',
      'current_uses': 'ic.current_uses',
      'duration_days': 'ic.duration_days',
      'valid_until': 'ic.valid_until'
    };
    const sortColumn = allowedSortColumns[sortBy] || 'ic.created_at';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const orderClause = `ORDER BY ${sortColumn} ${sortDir}`;

    // Add pagination values
    values.push(limit, offset);
    const limitIdx = values.length - 1;
    const offsetIdx = values.length;

    // Execute query with dynamic WHERE
    // Join with users table to get creator info
    const query = `
      SELECT ic.id, ic.code, ic.trial_tier, ic.duration_days, ic.max_uses, ic.current_uses,
             ic.valid_from, ic.valid_until, ic.status, ic.source, ic.campaign, ic.notes,
             ic.created_by_user_id, ic.created_at, ic.updated_at,
             u.email as created_by_email,
             COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) as created_by_name
      FROM invite_codes ic
      LEFT JOIN users u ON ic.created_by_user_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM invite_codes ic
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      sql.query(query, values),
      sql.query(countQuery, values.slice(0, -2)) // Remove limit/offset for count
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  /**
   * Update invite code
   * @param {string} code - The invite code
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated invite code or null
   */
  static async update(code, updates) {
    const { status, maxUses, validUntil, notes } = updates;
    const normalizedCode = code.toUpperCase().trim();

    const setClauses = ['updated_at = NOW()'];
    const values = [];

    if (status !== undefined) {
      values.push(status);
      setClauses.push(`status = $${values.length}`);
    }

    if (maxUses !== undefined) {
      values.push(maxUses);
      setClauses.push(`max_uses = $${values.length}`);
    }

    if (validUntil !== undefined) {
      values.push(validUntil ? validUntil.toISOString() : null);
      setClauses.push(`valid_until = $${values.length}`);
    }

    if (notes !== undefined) {
      values.push(notes);
      setClauses.push(`notes = $${values.length}`);
    }

    // Add code for WHERE clause
    values.push(normalizedCode);

    const query = `
      UPDATE invite_codes
      SET ${setClauses.join(', ')}
      WHERE code = $${values.length}
      RETURNING id, code, trial_tier, duration_days, max_uses, current_uses,
                valid_from, valid_until, status, source, campaign, notes,
                created_by_user_id, created_at, updated_at
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Get statistics for invite codes
   * @returns {Promise<Object>} Aggregate statistics
   */
  static async getStats() {
    const result = await sql`
      SELECT
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE status = 'active') as active_codes,
        COUNT(*) FILTER (WHERE status = 'exhausted') as exhausted_codes,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_codes,
        COUNT(*) FILTER (WHERE status = 'paused') as paused_codes,
        SUM(current_uses) as total_redemptions,
        AVG(current_uses) FILTER (WHERE current_uses > 0) as avg_uses_per_code
      FROM invite_codes
    `;

    const byCampaign = await sql`
      SELECT
        campaign,
        COUNT(*) as code_count,
        SUM(current_uses) as total_uses
      FROM invite_codes
      WHERE campaign IS NOT NULL
      GROUP BY campaign
      ORDER BY total_uses DESC
      LIMIT 10
    `;

    return {
      ...result.rows[0],
      byCampaign: byTrialProgram.rows
    };
  }

  /**
   * Update status of expired codes
   * Called by cron job to mark codes as expired
   * @returns {Promise<number>} Number of codes updated
   */
  static async updateExpiredCodes() {
    const result = await sql`
      UPDATE invite_codes
      SET status = 'expired',
          updated_at = NOW()
      WHERE status = 'active'
        AND valid_until IS NOT NULL
        AND valid_until < NOW()
      RETURNING id
    `;

    return result.rowCount;
  }

  /**
   * Delete invite code (admin only)
   * Only allows deletion of codes that have never been used (current_uses = 0)
   * @param {string} code - The invite code
   * @returns {Promise<{deleted: boolean, error?: string}>} Result with deleted status or error
   */
  static async delete(code) {
    const normalizedCode = code.toUpperCase().trim();

    // First check if the code exists and has been used
    const existing = await sql`
      SELECT current_uses FROM invite_codes WHERE code = ${normalizedCode}
    `;

    if (existing.rows.length === 0) {
      return { deleted: false, error: 'Invite code not found' };
    }

    if (existing.rows[0].current_uses > 0) {
      return { deleted: false, error: 'Cannot delete invite codes that have been used' };
    }

    const result = await sql`
      DELETE FROM invite_codes
      WHERE code = ${normalizedCode}
      AND current_uses = 0
    `;

    return { deleted: result.rowCount > 0 };
  }
}

export default InviteCode;
