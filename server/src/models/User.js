/**
 * User Model
 * Defines the user schema and database operations for authentication
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';

const SALT_ROUNDS = 10;

/**
 * User schema:
 * - id: SERIAL PRIMARY KEY
 * - email: VARCHAR(255) UNIQUE NOT NULL
 * - password_hash: VARCHAR(255) (nullable for OAuth users)
 * - github_id: VARCHAR(255) UNIQUE (nullable for local users)
 * - tier: VARCHAR(50) DEFAULT 'free' (free, pro, enterprise)
 * - email_verified: BOOLEAN DEFAULT FALSE
 * - verification_token: VARCHAR(255) (nullable)
 * - verification_token_expires: TIMESTAMP (nullable)
 * - reset_token_hash: VARCHAR(255) (nullable)
 * - reset_token_expires: TIMESTAMP (nullable)
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
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_token_hash VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token_hash)`;
  }

  /**
   * Create a new user with email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} tier - User tier (default: 'free')
   * @param {string} first_name - User first name (optional)
   * @param {string} last_name - User last name (optional)
   * @returns {Promise<Object>} Created user object (without password_hash)
   */
  static async create({ email, password, tier = 'free', first_name, last_name }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await sql`
      INSERT INTO users (email, password_hash, tier, first_name, last_name)
      VALUES (${email}, ${password_hash}, ${tier}, ${first_name || null}, ${last_name || null})
      RETURNING id, email, tier, first_name, last_name, created_at
    `;

    return result.rows[0];
  }

  /**
   * Create or update a user from GitHub OAuth
   * GitHub OAuth users are automatically marked as verified since GitHub
   * has already verified their email address.
   *
   * @param {string} githubId - GitHub user ID
   * @param {string} email - User email
   * @returns {Promise<Object>} User object with email_verified=true
   */
  static async findOrCreateByGithub({ githubId, email }) {
    // Try to find existing user by GitHub ID
    let result = await sql`
      SELECT id, email, github_id, tier, email_verified,
             terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
      FROM users
      WHERE github_id = ${githubId}
    `;

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Try to find by email and link GitHub account
    result = await sql`
      SELECT id, email, github_id, tier, email_verified,
             terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length > 0) {
      // Link GitHub account to existing user and mark email as verified
      // (GitHub has already verified the email address)
      const updateResult = await sql`
        UPDATE users
        SET github_id = ${githubId}, email_verified = true, updated_at = NOW()
        WHERE id = ${result.rows[0].id}
        RETURNING id, email, github_id, tier, email_verified,
                  terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
      `;
      return updateResult.rows[0];
    }

    // Create new user with verified email
    // (GitHub has already verified the email address)
    const createResult = await sql`
      INSERT INTO users (email, github_id, tier, email_verified)
      VALUES (${email}, ${githubId}, 'free', true)
      RETURNING id, email, github_id, tier, email_verified,
                terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
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
      SELECT id, email, first_name, last_name, github_id, tier, stripe_customer_id, customer_created_via, email_verified,
             terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
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
      SELECT id, email, first_name, last_name, password_hash, github_id, tier, stripe_customer_id, customer_created_via,
             email_verified, terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
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

  /**
   * Set password reset token for user
   * @param {number} id - User ID
   * @param {string} token - Reset token (securely generated, stored directly)
   * @param {Date} expiresAt - Token expiration timestamp
   * @returns {Promise<Object>} Updated user object
   */
  static async setResetToken(id, token, expiresAt) {
    const result = await sql`
      UPDATE users
      SET reset_token_hash = ${token},
          reset_token_expires = ${expiresAt.toISOString()},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, tier
    `;

    return result.rows[0];
  }

  /**
   * Find user by reset token and verify not expired
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByResetToken(token) {
    const result = await sql`
      SELECT id, email, password_hash, github_id, tier, reset_token_hash, reset_token_expires
      FROM users
      WHERE reset_token_hash = ${token}
        AND reset_token_expires > NOW()
    `;

    return result.rows[0] || null;
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<Object>} Updated user object
   */
  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await sql`
      UPDATE users
      SET password_hash = ${password_hash},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, tier
    `;

    return result.rows[0];
  }

  /**
   * Clear password reset token
   * @param {number} id - User ID
   * @returns {Promise<Object>} Updated user object
   */
  static async clearResetToken(id) {
    const result = await sql`
      UPDATE users
      SET reset_token_hash = NULL,
          reset_token_expires = NULL,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, tier
    `;

    return result.rows[0];
  }

  /**
   * Update user's Stripe customer ID
   * @param {number} id - User ID
   * @param {string} stripeCustomerId - Stripe customer ID (cus_xxx)
   * @param {string|null} customerCreatedVia - Origin: 'app', 'stripe_dashboard', 'api', 'migration'
   * @returns {Promise<Object>} Updated user object
   */
  static async updateStripeCustomerId(id, stripeCustomerId, customerCreatedVia = null) {
    // If customerCreatedVia is provided, only set it if the user doesn't already have a stripe_customer_id
    // This prevents overwriting the origin when updating an existing customer
    if (customerCreatedVia) {
      // Use COALESCE to only set customer_created_via if stripe_customer_id is currently NULL
      const result = await sql`
        UPDATE users
        SET stripe_customer_id = ${stripeCustomerId},
            customer_created_via = COALESCE(customer_created_via, ${customerCreatedVia}),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, first_name, last_name, tier, stripe_customer_id, customer_created_via
      `;
      return result.rows[0];
    } else {
      // Original behavior: just update stripe_customer_id without touching customer_created_via
      const result = await sql`
        UPDATE users
        SET stripe_customer_id = ${stripeCustomerId},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, first_name, last_name, tier, stripe_customer_id, customer_created_via
      `;
      return result.rows[0];
    }
  }

  /**
   * Update user's tier (called from webhook handler)
   * @param {number} id - User ID
   * @param {string} tier - New tier ('free', 'starter', 'pro', 'team', 'enterprise')
   * @returns {Promise<Object>} Updated user object
   */
  static async updateTier(id, tier) {
    const result = await sql`
      UPDATE users
      SET tier = ${tier},
          tier_updated_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, tier, tier_updated_at
    `;

    return result.rows[0];
  }

  /**
   * Update user email
   * @param {number} id - User ID
   * @param {string} newEmail - New email address
   * @returns {Promise<Object>} Updated user object
   */
  static async updateEmail(id, newEmail) {
    const result = await sql`
      UPDATE users
      SET email = ${newEmail},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, name, tier, stripe_customer_id
    `;

    return result.rows[0];
  }

  /**
   * Update user name
   * @param {number} id - User ID
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {Promise<Object>} Updated user object
   */
  static async updateName(id, firstName, lastName) {
    const result = await sql`
      UPDATE users
      SET first_name = ${firstName},
          last_name = ${lastName},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, tier, stripe_customer_id
    `;

    return result.rows[0];
  }

  /**
   * Create verification token for email verification
   * @param {number} id - User ID
   * @returns {Promise<string>} Verification token
   */
  static async createVerificationToken(id) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await sql`
      UPDATE users
      SET verification_token = ${token},
          verification_token_expires = ${expires.toISOString()},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return token;
  }

  /**
   * Find user by verification token and verify not expired
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByVerificationToken(token) {
    const result = await sql`
      SELECT id, email, first_name, last_name, email_verified, verification_token_expires
      FROM users
      WHERE verification_token = ${token}
        AND verification_token_expires > NOW()
    `;

    return result.rows[0] || null;
  }

  /**
   * Mark email as verified and clear verification token
   * @param {number} id - User ID
   * @returns {Promise<Object>} Updated user object
   */
  static async markEmailAsVerified(id) {
    const result = await sql`
      UPDATE users
      SET email_verified = TRUE,
          verification_token = NULL,
          verification_token_expires = NULL,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, email_verified
    `;

    return result.rows[0];
  }

  /**
   * Record user's acceptance of Terms of Service
   * @param {number} id - User ID
   * @param {string} version - Terms version (e.g., '2025-11-02')
   * @returns {Promise<Object>} Updated user object
   */
  static async acceptTerms(id, version) {
    const result = await sql`
      UPDATE users
      SET terms_accepted_at = NOW(),
          terms_version_accepted = ${version},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, terms_accepted_at, terms_version_accepted
    `;

    return result.rows[0];
  }

  /**
   * Record user's acceptance of Privacy Policy
   * @param {number} id - User ID
   * @param {string} version - Privacy policy version (e.g., '2025-11-02')
   * @returns {Promise<Object>} Updated user object
   */
  static async acceptPrivacyPolicy(id, version) {
    const result = await sql`
      UPDATE users
      SET privacy_accepted_at = NOW(),
          privacy_version_accepted = ${version},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, privacy_accepted_at, privacy_version_accepted
    `;

    return result.rows[0];
  }

  /**
   * Record user's acceptance of both Terms and Privacy Policy
   * @param {number} id - User ID
   * @param {string} termsVersion - Terms version
   * @param {string} privacyVersion - Privacy policy version
   * @returns {Promise<Object>} Updated user object
   */
  static async acceptLegalDocuments(id, termsVersion, privacyVersion) {
    const result = await sql`
      UPDATE users
      SET terms_accepted_at = NOW(),
          terms_version_accepted = ${termsVersion},
          privacy_accepted_at = NOW(),
          privacy_version_accepted = ${privacyVersion},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, terms_accepted_at, terms_version_accepted,
                privacy_accepted_at, privacy_version_accepted
    `;

    return result.rows[0];
  }

  /**
   * Get users who need to re-accept legal documents
   * (Users whose accepted version doesn't match current version)
   * @param {string} currentTermsVersion - Current Terms version
   * @param {string} currentPrivacyVersion - Current Privacy version
   * @returns {Promise<Array>} Users who need to re-accept
   */
  static async getUsersNeedingReacceptance(currentTermsVersion, currentPrivacyVersion) {
    const result = await sql`
      SELECT id, email, terms_version_accepted, privacy_version_accepted,
             terms_accepted_at, privacy_accepted_at
      FROM users
      WHERE terms_version_accepted != ${currentTermsVersion}
         OR privacy_version_accepted != ${currentPrivacyVersion}
         OR terms_version_accepted IS NULL
         OR privacy_version_accepted IS NULL
      ORDER BY id
    `;

    return result.rows;
  }
}

export default User;
