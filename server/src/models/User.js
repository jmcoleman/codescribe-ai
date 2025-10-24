/**
 * User Model
 * Defines the user schema and database operations for authentication
 */

import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';

const SALT_ROUNDS = 10;

/**
 * User schema:
 * - id: SERIAL PRIMARY KEY
 * - email: VARCHAR(255) UNIQUE NOT NULL
 * - password_hash: VARCHAR(255) (nullable for OAuth users)
 * - github_id: VARCHAR(255) UNIQUE (nullable for local users)
 * - tier: VARCHAR(50) DEFAULT 'free' (free, pro, enterprise)
 * - created_at: TIMESTAMP DEFAULT NOW()
 * - updated_at: TIMESTAMP DEFAULT NOW()
 */

class User {
  /**
   * Initialize the users table (for development/migration)
   */
  static async initTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        github_id VARCHAR(255) UNIQUE,
        tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`;
  }

  /**
   * Create a new user with email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} tier - User tier (default: 'free')
   * @returns {Promise<Object>} Created user object (without password_hash)
   */
  static async create({ email, password, tier = 'free' }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await sql`
      INSERT INTO users (email, password_hash, tier)
      VALUES (${email}, ${password_hash}, ${tier})
      RETURNING id, email, tier, created_at
    `;

    return result.rows[0];
  }

  /**
   * Create or update a user from GitHub OAuth
   * @param {string} githubId - GitHub user ID
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   */
  static async findOrCreateByGithub({ githubId, email }) {
    // Try to find existing user by GitHub ID
    let result = await sql`
      SELECT id, email, github_id, tier, created_at
      FROM users
      WHERE github_id = ${githubId}
    `;

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Try to find by email and link GitHub account
    result = await sql`
      SELECT id, email, github_id, tier, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length > 0) {
      // Link GitHub account to existing user
      const updateResult = await sql`
        UPDATE users
        SET github_id = ${githubId}, updated_at = NOW()
        WHERE id = ${result.rows[0].id}
        RETURNING id, email, github_id, tier, created_at
      `;
      return updateResult.rows[0];
    }

    // Create new user
    const createResult = await sql`
      INSERT INTO users (email, github_id, tier)
      VALUES (${email}, ${githubId}, 'free')
      RETURNING id, email, github_id, tier, created_at
    `;

    return createResult.rows[0];
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const result = await sql`
      SELECT id, email, github_id, tier, created_at
      FROM users
      WHERE id = ${id}
    `;

    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const result = await sql`
      SELECT id, email, password_hash, github_id, tier, created_at
      FROM users
      WHERE email = ${email}
    `;

    return result.rows[0] || null;
  }

  /**
   * Validate user password
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} True if password matches
   */
  static async validatePassword(password, hash) {
    if (!hash) return false;
    return await bcrypt.compare(password, hash);
  }

  /**
   * Update user tier
   * @param {number} id - User ID
   * @param {string} tier - New tier (free, pro, enterprise)
   * @returns {Promise<Object>} Updated user object
   */
  static async updateTier(id, tier) {
    const result = await sql`
      UPDATE users
      SET tier = ${tier}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, github_id, tier, created_at, updated_at
    `;

    return result.rows[0];
  }

  /**
   * Delete user by ID
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const result = await sql`
      DELETE FROM users
      WHERE id = ${id}
    `;

    return result.rowCount > 0;
  }
}

export default User;
