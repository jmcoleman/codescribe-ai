/**
 * TrialProgram Model
 * Manages trial programs for promotional periods
 */

import { sql } from '@vercel/postgres';

/**
 * TrialProgram schema (trial_programs table):
 * - id: SERIAL PRIMARY KEY
 * - name: VARCHAR(100) NOT NULL
 * - description: TEXT
 * - trial_tier: VARCHAR(50) DEFAULT 'pro'
 * - trial_days: INTEGER DEFAULT 14
 * - starts_at: TIMESTAMPTZ NOT NULL
 * - ends_at: TIMESTAMPTZ (nullable)
 * - is_active: BOOLEAN DEFAULT false
 * - auto_enroll: BOOLEAN DEFAULT false
 * - allow_previous_trial_users: BOOLEAN DEFAULT false
 * - cooldown_days: INTEGER DEFAULT 0
 * - signups_count: INTEGER DEFAULT 0
 * - conversions_count: INTEGER DEFAULT 0
 * - created_by_user_id: INTEGER (FK to users)
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 */

class TrialProgram {
  /**
   * Create a new campaign
   * @param {Object} options - Trial Program options
   * @param {string} options.name - Trial Program name
   * @param {string} [options.description] - Trial Program description
   * @param {string} [options.trialTier='pro'] - Tier to grant
   * @param {number} [options.trialDays=14] - Trial duration
   * @param {Date} [options.startsAt] - Start date (defaults to now)
   * @param {Date} [options.endsAt] - End date (optional)
   * @param {boolean} [options.isActive=false] - Whether to activate immediately
   * @param {boolean} [options.autoEnroll=false] - Auto-enroll new signups
   * @param {boolean} [options.allowPreviousTrialUsers=false] - Allow users with previous trials
   * @param {number} [options.cooldownDays=90] - Cooldown period in days
   * @param {number} [options.createdByUserId] - Admin user creating the campaign
   * @returns {Promise<Object>} Created campaign
   */
  static async create({
    name,
    description = null,
    trialTier = 'pro',
    trialDays = 14,
    startsAt = new Date(),
    endsAt = null,
    isActive = false,
    autoEnroll = false,
    allowPreviousTrialUsers = false,
    cooldownDays = 90,
    createdByUserId = null,
  }) {
    const result = await sql`
      INSERT INTO trial_programs (
        name, description, trial_tier, trial_days,
        starts_at, ends_at, is_active, auto_enroll,
        allow_previous_trial_users, cooldown_days, created_by_user_id
      )
      VALUES (
        ${name}, ${description}, ${trialTier}, ${trialDays},
        ${startsAt.toISOString()}, ${endsAt ? endsAt.toISOString() : null},
        ${isActive}, ${autoEnroll},
        ${allowPreviousTrialUsers}, ${cooldownDays}, ${createdByUserId}
      )
      RETURNING *
    `;

    return result.rows[0];
  }

  /**
   * Find campaign by ID
   * @param {number} id - Trial Program ID
   * @returns {Promise<Object|null>} Trial Program or null
   */
  static async findById(id) {
    const result = await sql`
      SELECT * FROM trial_programs WHERE id = ${id}
    `;

    return result.rows[0] || null;
  }

  /**
   * Get the currently active campaign
   * Only one campaign can be active at a time (enforced by trigger)
   * Also checks that current time is within campaign dates
   *
   * @returns {Promise<Object|null>} Active campaign or null
   */
  static async getActive() {
    const result = await sql`
      SELECT * FROM trial_programs
      WHERE is_active = true
        AND starts_at <= NOW()
        AND (ends_at IS NULL OR ends_at > NOW())
      LIMIT 1
    `;

    return result.rows[0] || null;
  }

  /**
   * List all campaigns with optional pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit=50] - Max results
   * @param {number} [options.offset=0] - Offset for pagination
   * @param {string} [options.sortBy='created_at'] - Sort field
   * @param {string} [options.sortOrder='DESC'] - Sort direction
   * @returns {Promise<Object>} { campaigns, total }
   */
  static async list({ limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    // Validate sortBy to prevent SQL injection
    const allowedSortColumns = {
      'created_at': 'created_at',
      'starts_at': 'starts_at',
      'ends_at': 'ends_at',
      'name': 'name',
      'signups_count': 'signups_count',
      'is_active': 'is_active',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'created_at';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build query with dynamic ORDER BY (safe because we validated)
    const query = `
      SELECT c.*, u.email as created_by_email
      FROM trial_programs c
      LEFT JOIN users u ON c.created_by_user_id = u.id
      ORDER BY ${sortColumn} ${sortDir}
      LIMIT $1 OFFSET $2
    `;

    const [dataResult, countResult] = await Promise.all([
      sql.query(query, [limit, offset]),
      sql`SELECT COUNT(*) as total FROM trial_programs`,
    ]);

    return {
      campaigns: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  }

  /**
   * Update a campaign
   * @param {number} id - Trial Program ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated campaign or null
   */
  static async update(id, updates) {
    // Build dynamic update query
    const setClauses = ['updated_at = NOW()'];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.trialTier !== undefined) {
      setClauses.push(`trial_tier = $${paramIndex++}`);
      values.push(updates.trialTier);
    }
    if (updates.trialDays !== undefined) {
      setClauses.push(`trial_days = $${paramIndex++}`);
      values.push(updates.trialDays);
    }
    if (updates.startsAt !== undefined) {
      setClauses.push(`starts_at = $${paramIndex++}`);
      values.push(updates.startsAt instanceof Date ? updates.startsAt.toISOString() : updates.startsAt);
    }
    if (updates.endsAt !== undefined) {
      setClauses.push(`ends_at = $${paramIndex++}`);
      values.push(updates.endsAt instanceof Date ? updates.endsAt.toISOString() : updates.endsAt);
    }
    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }
    if (updates.autoEnroll !== undefined) {
      setClauses.push(`auto_enroll = $${paramIndex++}`);
      values.push(updates.autoEnroll);
    }
    if (updates.allowPreviousTrialUsers !== undefined) {
      setClauses.push(`allow_previous_trial_users = $${paramIndex++}`);
      values.push(updates.allowPreviousTrialUsers);
    }
    if (updates.cooldownDays !== undefined) {
      setClauses.push(`cooldown_days = $${paramIndex++}`);
      values.push(updates.cooldownDays);
    }

    // Add ID as last parameter
    values.push(id);

    const query = `
      UPDATE trial_programs
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Toggle trial program active status
   * @param {number} id - Trial Program ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object|null>} Updated campaign or null
   */
  static async setActive(id, isActive) {
    const result = await sql`
      UPDATE trial_programs
      SET is_active = ${isActive}
      WHERE id = ${id}
      RETURNING *
    `;

    return result.rows[0] || null;
  }

  /**
   * Increment signup count for a campaign
   * @param {number} id - Trial Program ID
   * @returns {Promise<void>}
   */
  static async incrementSignups(id) {
    await sql`
      UPDATE trial_programs
      SET signups_count = signups_count + 1
      WHERE id = ${id}
    `;
  }

  /**
   * Increment conversion count for a campaign
   * @param {number} id - Trial Program ID
   * @returns {Promise<void>}
   */
  static async incrementConversions(id) {
    await sql`
      UPDATE trial_programs
      SET conversions_count = conversions_count + 1
      WHERE id = ${id}
    `;
  }

  /**
   * Delete a campaign
   * @param {number} id - Trial Program ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const result = await sql`
      DELETE FROM trial_programs WHERE id = ${id}
      RETURNING id
    `;

    return result.rows.length > 0;
  }

  /**
   * Get campaign statistics including trial data
   * @param {number} id - Trial Program ID
   * @returns {Promise<Object|null>} Trial Program with stats or null
   */
  static async getStats(id) {
    const trialProgram = await TrialProgram.findById(id);
    if (!trialProgram) return null;

    // Get trial stats from user_trials
    const trialStats = await sql`
      SELECT
        COUNT(*) as total_trials,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trials,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_trials,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_trials
      FROM user_trials
      WHERE trial_program_id = ${id}
    `;

    return {
      ...trialProgram,
      trialStats: trialStats.rows[0],
    };
  }
}

export default TrialProgram;
