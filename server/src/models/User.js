/**
 * User Model
 * Defines the user schema and database operations for authentication
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { encrypt, decrypt, isEncryptionConfigured } from '../utils/encryption.js';

const SALT_ROUNDS = 10;

/**
 * User schema:
 * - id: SERIAL PRIMARY KEY
 * - email: VARCHAR(255) UNIQUE NOT NULL
 * - password_hash: VARCHAR(255) (nullable for OAuth users)
 * - github_id: VARCHAR(255) UNIQUE (nullable for local users)
 * - tier: VARCHAR(50) DEFAULT 'free' (free, pro, enterprise)
 * - role: VARCHAR(50) DEFAULT 'user' (user, support, admin, super_admin)
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
   * @param {string} accessToken - GitHub OAuth access token (will be encrypted)
   * @returns {Promise<Object>} User object with email_verified=true and _created flag
   *                            (_created=true if newly created, false if existing)
   */
  static async findOrCreateByGithub({ githubId, email, accessToken }) {
    // Encrypt the access token if provided and encryption is configured
    let encryptedToken = null;
    if (accessToken && isEncryptionConfigured()) {
      try {
        encryptedToken = encrypt(accessToken);
      } catch (err) {
        console.error('[User.findOrCreateByGithub] Failed to encrypt access token:', err.message);
        // Continue without storing the token - private repos won't work but auth will
      }
    } else if (accessToken && !isEncryptionConfigured()) {
      console.warn('[User.findOrCreateByGithub] TOKEN_ENCRYPTION_KEY not configured - GitHub access token will not be stored');
    }

    // Try to find existing user by GitHub ID
    let result = await sql`
      SELECT id, email, github_id, tier, email_verified,
             terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted,
             deletion_scheduled_at, deleted_at, created_at
      FROM users
      WHERE github_id = ${githubId}
    `;

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // If account is scheduled for deletion, restore it
      if (user.deletion_scheduled_at && !user.deleted_at) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[GitHub OAuth] User ${user.id} signing in with scheduled-deletion account - restoring account`);
        }
        await User.restoreAccount(user.id);
        // Fetch updated user data without deletion fields
        const restoredUser = await User.findById(user.id);

        // Update the access token on re-login (tokens can change/refresh)
        if (encryptedToken) {
          await sql`
            UPDATE users
            SET github_access_token_encrypted = ${encryptedToken}, updated_at = NOW()
            WHERE id = ${user.id}
          `;
        }

        // Existing user (restored), not newly created
        return { ...restoredUser, _created: false };
      }

      // Update the access token on re-login (tokens can change/refresh)
      if (encryptedToken) {
        await sql`
          UPDATE users
          SET github_access_token_encrypted = ${encryptedToken}, updated_at = NOW()
          WHERE id = ${user.id}
        `;
      }

      // Existing user, not newly created
      return { ...user, _created: false };
    }

    // Try to find by email and link GitHub account
    result = await sql`
      SELECT id, email, github_id, tier, email_verified,
             terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted,
             deletion_scheduled_at, deleted_at, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length > 0) {
      const existingUser = result.rows[0];

      // If account is scheduled for deletion, restore it before linking
      if (existingUser.deletion_scheduled_at && !existingUser.deleted_at) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[GitHub OAuth] User ${existingUser.id} linking GitHub to scheduled-deletion account - restoring account`);
        }
        await User.restoreAccount(existingUser.id);
      }

      // Link GitHub account to existing user and mark email as verified
      // (GitHub has already verified the email address)
      // Also store the encrypted access token for private repo access
      const updateResult = await sql`
        UPDATE users
        SET github_id = ${githubId},
            email_verified = true,
            email_verified_at = NOW(),
            github_access_token_encrypted = ${encryptedToken},
            updated_at = NOW()
        WHERE id = ${existingUser.id}
        RETURNING id, email, github_id, tier, email_verified, email_verified_at,
                  terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
      `;
      // Existing user (linked), not newly created
      return { ...updateResult.rows[0], _created: false };
    }

    // Create new user with verified email
    // (GitHub has already verified the email address)
    const createResult = await sql`
      INSERT INTO users (email, github_id, tier, email_verified, email_verified_at, github_access_token_encrypted)
      VALUES (${email}, ${githubId}, 'free', true, NOW(), ${encryptedToken})
      RETURNING id, email, github_id, tier, email_verified, email_verified_at,
                terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, created_at
    `;

    // Newly created user
    return { ...createResult.rows[0], _created: true };
  }

  /**
   * Find user by ID
   * Excludes deleted users (deleted_at IS NOT NULL)
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    try {
      const result = await sql`
        SELECT id, email, first_name, last_name, password_hash, github_id, github_access_token_encrypted, tier, role, stripe_customer_id, customer_created_via, email_verified,
               terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, analytics_enabled, theme_preference,
               viewing_as_tier, override_expires_at, override_reason, override_applied_at,
               deletion_scheduled_at, deleted_at, created_at
        FROM users
        WHERE id = ${id}
          AND (deleted_at IS NULL OR deleted_at IS NOT NULL)
      `;

      const user = result.rows[0] || null;

      // Filter out soft-deleted users
      if (user && user.deleted_at) {
        return null;
      }

      return user;
    } catch (error) {
      console.error(`[User.findById] Error finding user ${id}:`, {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const result = await sql`
      SELECT id, email, first_name, last_name, password_hash, github_id, tier, role, stripe_customer_id, customer_created_via,
             email_verified, terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, analytics_enabled, theme_preference,
             viewing_as_tier, override_expires_at, override_reason, override_applied_at,
             deletion_scheduled_at, deleted_at, created_at
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
   * Also cleans up user's sessions to prevent orphaned session errors
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    // Delete user's sessions first (prevent orphaned sessions)
    await sql`
      DELETE FROM session
      WHERE sess::jsonb->'passport'->>'user' = ${id.toString()}
    `;

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
      RETURNING id, email, first_name, last_name, github_id, tier, stripe_customer_id, customer_created_via, email_verified,
                terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, analytics_enabled, created_at
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
      RETURNING id, email, first_name, last_name, github_id, tier, stripe_customer_id, customer_created_via, email_verified,
                terms_accepted_at, terms_version_accepted, privacy_accepted_at, privacy_version_accepted, analytics_enabled, created_at
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
          email_verified_at = NOW(),
          verification_token = NULL,
          verification_token_expires = NULL,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, email_verified, email_verified_at
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

  /**
   * Delete user by ID (alias for delete method)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async deleteById(id) {
    return this.delete(id);
  }

  /**
   * Schedule account for deletion (soft delete with 30-day grace period)
   * Sets deletion_scheduled_at to NOW() + 30 days and generates restore token
   * User can restore account within 30 days by clicking restore link in email
   *
   * @param {number} id - User ID
   * @param {string|null} reason - Optional reason for deletion (for product insights)
   * @returns {Promise<Object>} User object with restore_token
   */
  static async scheduleForDeletion(id, reason = null) {
    // Generate secure restore token
    const restoreToken = crypto.randomBytes(32).toString('hex');

    // Schedule deletion for 30 days from now
    const deletionScheduledAt = new Date();
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 30);

    const result = await sql`
      UPDATE users
      SET deletion_scheduled_at = ${deletionScheduledAt.toISOString()},
          deletion_reason = ${reason},
          restore_token = ${restoreToken},
          updated_at = NOW()
      WHERE id = ${id}
        AND deleted_at IS NULL
      RETURNING id, email, first_name, last_name, deletion_scheduled_at, restore_token
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found or already deleted');
    }

    return result.rows[0];
  }

  /**
   * Find user by restore token
   * Used when user clicks restore link in deletion confirmation email
   *
   * @param {string} restoreToken - Restore token from email link
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByRestoreToken(restoreToken) {
    const result = await sql`
      SELECT id, email, first_name, last_name, deletion_scheduled_at, restore_token
      FROM users
      WHERE restore_token = ${restoreToken}
        AND deletion_scheduled_at IS NOT NULL
        AND deleted_at IS NULL
    `;

    return result.rows[0] || null;
  }

  /**
   * Restore account (cancel scheduled deletion)
   * Clears deletion_scheduled_at, deletion_reason, and restore_token
   *
   * @param {number} id - User ID
   * @returns {Promise<Object>} Restored user object
   */
  static async restoreAccount(id) {
    const result = await sql`
      UPDATE users
      SET deletion_scheduled_at = NULL,
          deletion_reason = NULL,
          restore_token = NULL,
          updated_at = NOW()
      WHERE id = ${id}
        AND deletion_scheduled_at IS NOT NULL
        AND deleted_at IS NULL
      RETURNING id, email, first_name, last_name
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found or deletion not scheduled');
    }

    return result.rows[0];
  }

  /**
   * Find accounts scheduled for permanent deletion
   * Returns users where deletion_scheduled_at <= NOW() and not yet deleted
   * Used by cron job to permanently delete expired accounts
   *
   * @returns {Promise<Array>} Array of user objects ready for deletion
   */
  static async findExpiredDeletions() {
    const result = await sql`
      SELECT id, email, first_name, last_name, deletion_scheduled_at, deletion_reason
      FROM users
      WHERE deletion_scheduled_at <= NOW()
        AND deleted_at IS NULL
      ORDER BY deletion_scheduled_at ASC
    `;

    return result.rows;
  }

  /**
   * Find all users whose deletion grace period has expired
   * Returns users where deletion_scheduled_at is in the past and user hasn't been deleted yet
   *
   * @returns {Promise<Array>} Array of users ready for permanent deletion
   */
  static async findExpiredDeletions() {
    const result = await sql`
      SELECT
        id,
        email,
        first_name,
        last_name,
        deletion_scheduled_at,
        deletion_reason
      FROM users
      WHERE deletion_scheduled_at IS NOT NULL
        AND deletion_scheduled_at <= NOW()
        AND deleted_at IS NULL
      ORDER BY deletion_scheduled_at ASC
    `;

    return result.rows;
  }

  /**
   * Permanently delete account using tombstone approach (GDPR/CCPA compliant)
   *
   * Strategy:
   * 1. Aggregate user_quotas data into usage_analytics_aggregate (business intelligence)
   * 2. Delete granular user_quotas records (data minimization)
   * 3. Tombstone user record: NULL all PII, keep IDs for billing/legal compliance
   * 4. Keep user row (don't DELETE) so subscriptions.user_id foreign key remains valid
   *
   * GDPR Compliance:
   * - Article 17(3)(b): Legal obligation exemption for financial records (7 years)
   * - Article 5: Data minimization (aggregate analytics, delete granular data)
   * - Billing records preserved but effectively anonymized (no PII linkable)
   *
   * @param {number} id - User ID
   * @returns {Promise<Object>} Deleted user info (id, stripe_customer_id)
   */
  static async permanentlyDelete(id) {
    // Step 0: Delete user's sessions (prevent orphaned sessions)
    await sql`
      DELETE FROM session
      WHERE sess::jsonb->'passport'->>'user' = ${id.toString()}
    `;

    // Step 1: Aggregate usage data before deletion (preserve business intelligence)
    await sql`
      INSERT INTO usage_analytics_aggregate (
        tier,
        account_age_days,
        created_at_month,
        total_daily_count,
        total_monthly_count,
        avg_daily_count,
        avg_monthly_count,
        usage_periods_count
      )
      SELECT
        u.tier,
        EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER,
        DATE_TRUNC('month', u.created_at)::DATE,
        COALESCE(SUM(uq.daily_count), 0),
        COALESCE(SUM(uq.monthly_count), 0),
        COALESCE(AVG(uq.daily_count), 0),
        COALESCE(AVG(uq.monthly_count), 0),
        COUNT(uq.id)
      FROM users u
      LEFT JOIN user_quotas uq ON uq.user_id = u.id
      WHERE u.id = ${id}
      GROUP BY u.tier, u.created_at
    `;

    // Step 2: Delete granular usage data (data minimization)
    await sql`
      DELETE FROM user_quotas
      WHERE user_id = ${id}
    `;

    // Step 3: Tombstone user record - NULL all PII but preserve IDs for billing/legal
    const result = await sql`
      UPDATE users
      SET
        -- NULL all PII fields (GDPR right to erasure)
        email = NULL,
        first_name = NULL,
        last_name = NULL,
        password_hash = NULL,
        github_id = NULL,
        github_access_token_encrypted = NULL,
        verification_token = NULL,
        verification_token_expires = NULL,
        restore_token = NULL,
        deletion_reason = NULL,

        -- Mark as deleted (tombstone marker)
        deleted_at = NOW(),
        updated_at = NOW()

        -- PRESERVE: id, stripe_customer_id, tier, created_at, tier_updated_at
        -- These fields required for:
        -- - Billing disputes (stripe_customer_id correlates to Stripe records)
        -- - Tax audits (tier + created_at for revenue reporting)
        -- - Legal compliance (7-year retention requirement)
        -- - Foreign key integrity (subscriptions.user_id references users.id)

      WHERE id = ${id}
        AND deleted_at IS NULL
      RETURNING id, stripe_customer_id, tier, created_at
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found or already deleted');
    }

    return result.rows[0];
  }

  /**
   * Get user data export (GDPR/CCPA compliance - right to access)
   * Returns all user data in structured JSON format
   *
   * @param {number} id - User ID
   * @returns {Promise<Object>} Complete user data export
   */
  static async exportUserData(id) {
    // Get user profile data
    const userResult = await sql`
      SELECT id, email, first_name, last_name, github_id, tier, tier_updated_at,
             stripe_customer_id, customer_created_via,
             email_verified, verification_token_expires,
             terms_accepted_at, terms_version_accepted,
             privacy_accepted_at, privacy_version_accepted,
             analytics_enabled,
             created_at, updated_at,
             deletion_scheduled_at, deletion_reason
      FROM users
      WHERE id = ${id}
    `;

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get usage quota data
    const quotasResult = await sql`
      SELECT period_start_date, daily_count, monthly_count, last_reset_date
      FROM user_quotas
      WHERE user_id = ${id}
      ORDER BY period_start_date DESC
    `;

    // Get subscription data (if exists)
    const subscriptionsResult = await sql`
      SELECT stripe_subscription_id, tier, status, current_period_start, current_period_end,
             cancel_at_period_end, canceled_at, ended_at, created_at, updated_at
      FROM subscriptions
      WHERE user_id = ${id}
      ORDER BY created_at DESC
    `;

    // Note: Anonymous quotas are IP-based only (no user_id column)
    // When user signs up, their IP usage is migrated to user_quotas
    // We cannot include pre-signup anonymous data as there's no user linkage

    return {
      export_date: new Date().toISOString(),
      export_version: '1.0',
      user_profile: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        github_connected: !!user.github_id,
        tier: user.tier,
        tier_updated_at: user.tier_updated_at,
        stripe_customer_id: user.stripe_customer_id,
        customer_created_via: user.customer_created_via,
        email_verified: user.email_verified,
        terms_accepted_at: user.terms_accepted_at,
        terms_version_accepted: user.terms_version_accepted,
        privacy_accepted_at: user.privacy_accepted_at,
        privacy_version_accepted: user.privacy_version_accepted,
        analytics_enabled: user.analytics_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deletion_scheduled_at: user.deletion_scheduled_at,
        deletion_reason: user.deletion_reason
      },
      usage_history: quotasResult.rows,
      subscriptions: subscriptionsResult.rows,
      data_retention_policy: {
        code_processing: 'Code is processed in memory only and never stored',
        generated_documentation: 'Not stored on our servers',
        account_data: 'Retained until account deletion',
        usage_logs: 'Retained for billing and analytics purposes',
        deletion_grace_period: '30 days'
      }
    };
  }

  /**
   * Update user preferences
   * @param {number} id - User ID
   * @param {Object} preferences - Preferences to update
   * @param {boolean} preferences.analytics_enabled - Analytics enabled flag
   * @param {string} preferences.theme_preference - Theme preference (light, dark, auto)
   * @returns {Promise<Object>} Updated user object
   */
  static async updatePreferences(id, preferences) {
    const { analytics_enabled, save_docs_preference, docs_consent_shown_at, theme_preference } = preferences;

    // Build dynamic SET clause based on provided preferences
    const setClauses = ['updated_at = NOW()'];
    const values = [];

    if (analytics_enabled !== undefined) {
      setClauses.push(`analytics_enabled = $${values.length + 1}`);
      values.push(analytics_enabled);
    }

    if (save_docs_preference !== undefined) {
      setClauses.push(`save_docs_preference = $${values.length + 1}`);
      values.push(save_docs_preference);
    }

    if (docs_consent_shown_at !== undefined) {
      setClauses.push(`docs_consent_shown_at = $${values.length + 1}`);
      values.push(docs_consent_shown_at);
    }

    if (theme_preference !== undefined) {
      // Validate theme preference
      if (!['light', 'dark', 'auto'].includes(theme_preference)) {
        throw new Error('Invalid theme preference. Must be light, dark, or auto.');
      }
      setClauses.push(`theme_preference = $${values.length + 1}`);
      values.push(theme_preference);
    }

    // Add user ID for WHERE clause
    values.push(id);

    const result = await sql.query(`
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, email, analytics_enabled, save_docs_preference, docs_consent_shown_at, theme_preference
    `, values);

    return result.rows[0];
  }

  /**
   * Check if user can bypass rate limits based on role
   * Admin, support, and super_admin roles bypass rate limiting
   * UNLESS they have an active tier override (for testing as a specific tier)
   * @param {Object} user - User object with role and tier override fields
   * @returns {boolean} True if user can bypass rate limits
   */
  static canBypassRateLimits(user) {
    if (!user || !user.role) return false;

    const isPrivilegedRole = ['admin', 'support', 'super_admin'].includes(user.role);
    if (!isPrivilegedRole) return false;

    // If admin has an active tier override, they should NOT bypass limits
    // This allows them to experience the app as the overridden tier
    if (user.viewing_as_tier && user.override_expires_at) {
      const now = new Date();
      const expiry = new Date(user.override_expires_at);
      if (expiry > now) {
        // Active tier override - do not bypass limits
        return false;
      }
    }

    return true;
  }

  /**
   * Get audit log for a user
   * Retrieves history of all tracked field changes
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.field_name - Filter by specific field (optional)
   * @param {number} options.limit - Limit number of results (default: 100)
   * @returns {Promise<Array>} Array of audit log entries
   */
  static async getAuditLog(userId, options = {}) {
    const { field_name, limit = 100 } = options;

    let query;
    if (field_name) {
      query = sql`
        SELECT id, user_id, user_email, changed_by, field_name,
               old_value, new_value, change_type, reason, changed_at, metadata
        FROM user_audit_log
        WHERE user_id = ${userId}
          AND field_name = ${field_name}
        ORDER BY changed_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT id, user_id, user_email, changed_by, field_name,
               old_value, new_value, change_type, reason, changed_at, metadata
        FROM user_audit_log
        WHERE user_id = ${userId}
        ORDER BY changed_at DESC
        LIMIT ${limit}
      `;
    }

    const result = await query;
    return result.rows;
  }

  /**
   * Get role change history for a user
   * Convenience method for retrieving only role changes
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of role change entries
   */
  static async getRoleHistory(userId) {
    return await User.getAuditLog(userId, { field_name: 'role', limit: 50 });
  }

  /**
   * Update user role (admin operation)
   * Note: Audit logging is automatic via database trigger
   * @param {number} id - User ID
   * @param {string} role - New role ('user', 'support', 'admin', 'super_admin')
   * @returns {Promise<Object>} Updated user object
   */
  static async updateRole(id, role) {
    const validRoles = ['user', 'support', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }

    const result = await sql`
      UPDATE users
      SET role = ${role},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, role
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Apply tier override for admin/support testing
   * Sets viewing_as_tier and expiry timestamp
   * @param {number} userId - User ID
   * @param {string} targetTier - Tier to view as ('free', 'starter', 'pro', 'team', 'enterprise')
   * @param {string} reason - Reason for override (required for audit trail)
   * @param {number} hoursValid - Hours until override expires (default: 4)
   * @returns {Promise<Object>} Updated user object with override fields
   */
  static async applyTierOverride(userId, targetTier, reason, hoursValid = 4) {
    const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];
    if (!validTiers.includes(targetTier)) {
      throw new Error(`Invalid tier: ${targetTier}. Must be one of: ${validTiers.join(', ')}`);
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error('Reason must be at least 10 characters for audit compliance');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursValid);

    const result = await sql`
      UPDATE users
      SET viewing_as_tier = ${targetTier},
          override_expires_at = ${expiresAt.toISOString()},
          override_reason = ${reason.trim()},
          override_applied_at = NOW(),
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, tier, role, viewing_as_tier, override_expires_at, override_reason, override_applied_at
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Clear tier override for a user
   * Sets all override fields to NULL
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  static async clearTierOverride(userId) {
    const result = await sql`
      UPDATE users
      SET viewing_as_tier = NULL,
          override_expires_at = NULL,
          override_reason = NULL,
          override_applied_at = NULL,
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, tier, role, viewing_as_tier, override_expires_at, override_reason, override_applied_at
    `;

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Check if user has an active tier override
   * Returns override details if active and not expired
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Override details or null if no active override
   */
  static async getActiveTierOverride(userId) {
    const result = await sql`
      SELECT viewing_as_tier, override_expires_at, override_reason, override_applied_at
      FROM users
      WHERE id = ${userId}
        AND viewing_as_tier IS NOT NULL
        AND override_expires_at > NOW()
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const override = result.rows[0];
    const now = new Date();
    const expiry = new Date(override.override_expires_at);
    const remainingMs = expiry.getTime() - now.getTime();
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      tier: override.viewing_as_tier,
      expiresAt: override.override_expires_at,
      reason: override.override_reason,
      appliedAt: override.override_applied_at,
      remainingTime: {
        hours,
        minutes,
        totalMs: remainingMs
      }
    };
  }

  /**
   * Find all users with expired tier overrides
   * Used by cleanup job to automatically clear expired overrides
   * @returns {Promise<Array>} Array of user IDs with expired overrides
   */
  static async findExpiredTierOverrides() {
    const result = await sql`
      SELECT id, email, viewing_as_tier, override_expires_at
      FROM users
      WHERE viewing_as_tier IS NOT NULL
        AND override_expires_at <= NOW()
      ORDER BY override_expires_at ASC
    `;

    return result.rows;
  }

  /**
   * Get decrypted GitHub access token for a user
   * Used for making authenticated GitHub API requests on behalf of the user
   * @param {number} userId - User ID
   * @returns {Promise<string|null>} Decrypted GitHub access token or null
   */
  static async getGitHubToken(userId) {
    if (!isEncryptionConfigured()) {
      console.warn('[User.getGitHubToken] TOKEN_ENCRYPTION_KEY not configured');
      return null;
    }

    const result = await sql`
      SELECT github_access_token_encrypted
      FROM users
      WHERE id = ${userId}
        AND github_access_token_encrypted IS NOT NULL
        AND deleted_at IS NULL
    `;

    if (result.rows.length === 0 || !result.rows[0].github_access_token_encrypted) {
      return null;
    }

    try {
      return decrypt(result.rows[0].github_access_token_encrypted);
    } catch (err) {
      console.error('[User.getGitHubToken] Failed to decrypt token:', err.message);
      return null;
    }
  }

  /**
   * Check if user has a GitHub access token stored
   * Does not decrypt the token - just checks existence
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user has a GitHub token
   */
  static async hasGitHubToken(userId) {
    const result = await sql`
      SELECT 1
      FROM users
      WHERE id = ${userId}
        AND github_access_token_encrypted IS NOT NULL
        AND deleted_at IS NULL
    `;

    return result.rows.length > 0;
  }

  /**
   * Clear GitHub access token for a user
   * Used when user wants to disconnect GitHub or revoke access
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if token was cleared
   */
  static async clearGitHubToken(userId) {
    const result = await sql`
      UPDATE users
      SET github_access_token_encrypted = NULL,
          updated_at = NOW()
      WHERE id = ${userId}
    `;

    return result.rowCount > 0;
  }
}

export default User;
