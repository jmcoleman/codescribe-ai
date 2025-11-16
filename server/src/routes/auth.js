/**
 * Authentication Routes
 *
 * Handles user registration, login, logout, and OAuth flows.
 * Supports both email/password and GitHub OAuth authentication.
 */

import express from 'express';
import passport from 'passport';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Usage from '../models/Usage.js';
import {
  requireAuth,
  validateBody,
  generateToken,
  sanitizeUser
} from '../middleware/auth.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// ============================================================================
// Email Rate Limiting Configuration
// ============================================================================
// In-memory cache for email rate limiting
// Note: Upgrade to Redis for multi-region deployments
const emailRateLimitCache = new Map();

// Rate limit constants (aligned with industry standards: GitHub, Google)
const EMAIL_VERIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const EMAIL_VERIFICATION_DAILY_MAX = 10; // per user
const PASSWORD_RESET_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const PASSWORD_RESET_HOURLY_MAX = 3; // per email address
const PASSWORD_RESET_DAILY_MAX = 10; // per email address

/**
 * Check if email rate limit is exceeded
 * @param {string} key - Cache key (userId or email)
 * @param {number} cooldownMs - Cooldown period in milliseconds
 * @returns {Object} { allowed: boolean, remainingSeconds: number }
 */
function checkEmailRateLimit(key, cooldownMs) {
  const lastEmailTime = emailRateLimitCache.get(key);
  const now = Date.now();

  if (lastEmailTime && (now - lastEmailTime) < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - (now - lastEmailTime)) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Update email rate limit cache
 * @param {string} key - Cache key
 */
function updateEmailRateLimit(key) {
  emailRateLimitCache.set(key, Date.now());
}

// ============================================================================
// POST /api/auth/signup - User Registration
// ============================================================================
router.post(
  '/signup',
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'password', minLength: 8 }
  }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);

      if (existingUser) {
        // If account is scheduled for deletion (not yet permanently deleted), restore it
        if (existingUser.deletion_scheduled_at && !existingUser.deleted_at) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] User ${existingUser.id} signing up with scheduled-deletion account - restoring account`);
          }

          // Restore the account (cancels deletion)
          await User.restoreAccount(existingUser.id);

          // Update password for the restored account
          const password_hash = await bcrypt.hash(password, 10);
          await sql`
            UPDATE users
            SET password_hash = ${password_hash}, updated_at = NOW()
            WHERE id = ${existingUser.id}
          `;

          // Fetch updated user data
          const user = await User.findById(existingUser.id);

          // Migrate any anonymous usage from this IP to the restored user account
          const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
          if (ipAddress && ipAddress !== 'unknown') {
            try {
              await Usage.migrateAnonymousUsage(ipAddress, user.id);
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Auth] Migrated anonymous usage for IP ${ipAddress} to restored user ${user.id}`);
              }
            } catch (migrationError) {
              console.error('[Auth] Failed to migrate anonymous usage:', migrationError);
            }
          }

          // Generate verification token and send verification email
          try {
            const verificationToken = await User.createVerificationToken(user.id);
            await sendVerificationEmail({
              to: user.email,
              verificationToken
            });
            if (process.env.NODE_ENV === 'development') {
              console.log(`Verification email sent to: ${user.email}`);
            }
          } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
          }

          // Generate JWT token
          const token = generateToken(user);

          // Log user in via session
          req.login(user, (err) => {
            if (err) {
              console.error('Session login error:', err);
            }

            return res.status(200).json({
              success: true,
              message: 'Account deletion cancelled. Welcome back!',
              restored: true,
              user: sanitizeUser(user),
              token
            });
          });
          return;
        }

        // If account is permanently deleted (email is NULL), this won't match
        // If account exists and is NOT scheduled for deletion, it's a duplicate
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Create new user (password will be hashed in User.create)
      const user = await User.create({ email, password });

      // Migrate any anonymous usage from this IP to the new user account
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      if (ipAddress && ipAddress !== 'unknown') {
        try {
          await Usage.migrateAnonymousUsage(ipAddress, user.id);
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] Migrated anonymous usage for IP ${ipAddress} to user ${user.id}`);
          }
        } catch (migrationError) {
          // Don't fail signup if migration fails - log and continue
          console.error('[Auth] Failed to migrate anonymous usage:', migrationError);
        }
      }

      // Generate verification token and send verification email
      try {
        const verificationToken = await User.createVerificationToken(user.id);
        await sendVerificationEmail({
          to: user.email,
          verificationToken
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`Verification email sent to: ${user.email}`);
        }
      } catch (emailError) {
        // Don't fail signup if email fails - log and continue
        console.error('Failed to send verification email:', emailError);
      }

      // Generate JWT token
      const token = generateToken(user);

      // Log user in via session
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          // Continue even if session fails (token is primary)
        }

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: sanitizeUser(user),
          token
        });
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      });
    }
  }
);

// ============================================================================
// POST /api/auth/login - User Login
// ============================================================================
router.post(
  '/login',
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true }
  }),
  async (req, res, next) => {
    // Use Passport local strategy for authentication
    passport.authenticate('local', { session: false }, async (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({
          success: false,
          error: 'Login failed'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: info?.message || 'Invalid email or password'
        });
      }

      // Migrate any anonymous usage from this IP to the user account
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      if (ipAddress && ipAddress !== 'unknown') {
        try {
          await Usage.migrateAnonymousUsage(ipAddress, user.id);
          console.log(`[Auth] Migrated anonymous usage for IP ${ipAddress} to user ${user.id}`);
        } catch (migrationError) {
          // Don't fail login if migration fails - log and continue
          console.error('[Auth] Failed to migrate anonymous usage:', migrationError);
        }
      }

      // Generate JWT token
      const token = generateToken(user);

      // Return JWT token (no session needed - JWT is stateless)
      res.json({
        success: true,
        message: 'Login successful',
        user: sanitizeUser(user),
        token
      });
    })(req, res, next);
  }
);

// ============================================================================
// POST /api/auth/logout - User Logout
// ============================================================================
router.post('/logout', requireAuth, (req, res) => {
  // For JWT-based authentication, logout is primarily handled client-side
  // by removing the token from localStorage. However, we still clean up
  // any session data if it exists.

  // Destroy session if exists
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }

  // Log out passport session only if it was actually established
  // Check if user was logged in via session (req.user exists via session)
  if (req.logout && req.isAuthenticated && req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        // Only log error if it's not the "session support required" error
        if (!err.message.includes('session support')) {
          console.error('Passport logout error:', err);
        }
      }
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================================================
// GET /api/auth/me - Get Current User
// ============================================================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Prevent caching of user-specific data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // req.user is already populated by requireAuth middleware with full user data
    // No need to query database again
    res.json({
      success: true,
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
});

// ============================================================================
// PATCH /api/auth/profile - Update User Profile
// ============================================================================
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;
    const userId = req.user.id;

    // At least one field must be provided
    if (!email && !first_name && !last_name) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (email, first_name, last_name) is required'
      });
    }

    // If updating name, both first and last name must be provided
    if ((first_name && !last_name) || (!first_name && last_name)) {
      return res.status(400).json({
        success: false,
        error: 'Both first_name and last_name are required'
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    // Validate first_name if provided
    if (first_name) {
      const trimmedFirstName = first_name.trim();
      if (trimmedFirstName.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'First name cannot be empty'
        });
      }
      if (trimmedFirstName.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'First name must be less than 100 characters'
        });
      }
    }

    // Validate last_name if provided
    if (last_name) {
      const trimmedLastName = last_name.trim();
      if (trimmedLastName.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Last name cannot be empty'
        });
      }
      if (trimmedLastName.length > 150) {
        return res.status(400).json({
          success: false,
          error: 'Last name must be less than 150 characters'
        });
      }
    }

    // Get current user to check if Stripe customer exists
    const currentUser = await User.findById(userId);

    // Update email in database if provided
    let updatedUser = currentUser;
    if (email) {
      updatedUser = await User.updateEmail(userId, email);
    }

    // Update name in database if provided
    if (first_name && last_name) {
      updatedUser = await User.updateName(userId, first_name.trim(), last_name.trim());
    }

    // If user has a Stripe customer, update their info
    if (currentUser.stripe_customer_id) {
      try {
        const stripeUpdates = {};
        if (email) stripeUpdates.email = email;
        if (first_name && last_name) {
          stripeUpdates.name = `${first_name.trim()} ${last_name.trim()}`;
        }

        await stripe.customers.update(currentUser.stripe_customer_id, stripeUpdates);
        console.log(`✅ Updated Stripe customer for user ${userId}:`, Object.keys(stripeUpdates).join(', '));
      } catch (stripeError) {
        // Log but don't fail the request - database is source of truth
        console.error('Failed to update Stripe customer:', stripeError);
      }
    }

    res.json({
      success: true,
      user: sanitizeUser(updatedUser),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// ============================================================================
// PATCH /api/auth/password - Change Password
// ============================================================================
router.patch('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password_hash (findById doesn't include it for security)
    const result = await sql`
      SELECT id, email, password_hash, github_id, tier
      FROM users
      WHERE id = ${userId}
    `;
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Only allow password change for email auth users (not OAuth)
    // OAuth users are identified by having a github_id
    if (user.github_id) {
      return res.status(400).json({
        success: false,
        error: 'Password management is handled through your GitHub account'
      });
    }

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    // Verify current password
    const isValid = await User.validatePassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// ============================================================================
// DELETE /api/auth/account - Delete Account
// ============================================================================
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { confirmation } = req.body;
    const userId = req.user.id;

    // Require explicit confirmation
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation. Please type DELETE MY ACCOUNT'
      });
    }

    // Get user to check for active subscription
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Cancel active Stripe subscription if exists
    if (user.stripe_customer_id && user.tier !== 'free') {
      try {
        // Cancel subscription immediately
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.cancel(subscriptions.data[0].id);
          console.log(`✅ Canceled subscription for user ${userId}`);
        }
      } catch (stripeError) {
        console.error('Failed to cancel subscription:', stripeError);
        // Continue with account deletion even if subscription cancellation fails
      }
    }

    // Delete user account
    await User.deleteById(userId);

    // Destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// ============================================================================
// PATCH /api/auth/preferences - Update User Preferences
// ============================================================================
router.patch('/preferences', requireAuth, async (req, res) => {
  try {
    const { analytics_enabled, save_docs_preference, docs_consent_shown_at } = req.body;
    const userId = req.user.id;

    const updates = {};

    // Validate analytics_enabled if provided
    if (analytics_enabled !== undefined) {
      if (typeof analytics_enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'analytics_enabled must be a boolean'
        });
      }
      updates.analytics_enabled = analytics_enabled;
    }

    // Validate save_docs_preference if provided
    if (save_docs_preference !== undefined) {
      if (!['always', 'never', 'ask'].includes(save_docs_preference)) {
        return res.status(400).json({
          success: false,
          error: 'save_docs_preference must be one of: always, never, ask'
        });
      }
      updates.save_docs_preference = save_docs_preference;
    }

    // Validate docs_consent_shown_at if provided
    if (docs_consent_shown_at !== undefined) {
      updates.docs_consent_shown_at = docs_consent_shown_at;
    }

    // Update preferences in database
    await User.updatePreferences(userId, updates);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updates
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// ============================================================================
// GET /api/auth/github - GitHub OAuth Initiation
// ============================================================================
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
);

// ============================================================================
// GET /api/auth/github/callback - GitHub OAuth Callback
// ============================================================================
router.get(
  '/github/callback',
  (req, res, next) => {
    passport.authenticate('github', async (err, user, info) => {
      if (err) {
        console.error('[Auth] GitHub OAuth error:', err);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'GitHub authentication failed',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      if (!user) {
        console.error('[Auth] GitHub OAuth failed - no user returned:', info);
        return res.redirect('/login?error=github_auth_failed');
      }

      // No session needed - JWT is stateless
      // Migrate any anonymous usage from this IP to the user account
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      if (ipAddress && ipAddress !== 'unknown') {
        try {
          await Usage.migrateAnonymousUsage(ipAddress, user.id);
          console.log(`[Auth] Migrated anonymous usage for IP ${ipAddress} to user ${user.id} (GitHub OAuth)`);
        } catch (migrationError) {
          // Don't fail OAuth callback if migration fails - log and continue
          console.error('[Auth] Failed to migrate anonymous usage:', migrationError);
        }
      }

      // Generate JWT token
      const token = generateToken(user);

      // Redirect to frontend with token
      // Frontend will extract token from URL and store it
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    })(req, res, next);
  }
);

// ============================================================================
// Rate Limiting for Password Reset
// ============================================================================
// In-memory store for password reset attempts
// Format: { email: { count: number, resetAt: timestamp } }
const passwordResetAttempts = new Map();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_RESET_ATTEMPTS = 3; // Max 3 requests per hour per email

/**
 * Check and update password reset rate limit for an email
 * @param {string} email - Email address to check
 * @returns {boolean} - True if allowed, false if rate limited
 */
function checkPasswordResetRateLimit(email) {
  const now = Date.now();
  const attempt = passwordResetAttempts.get(email);

  // No previous attempts or window expired - allow and reset counter
  if (!attempt || now > attempt.resetAt) {
    passwordResetAttempts.set(email, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }

  // Within window - check if under limit
  if (attempt.count < MAX_RESET_ATTEMPTS) {
    attempt.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Reset password reset rate limit (for testing only)
 * @param {string} [email] - Optional email to reset. If not provided, resets all.
 */
export function resetPasswordResetRateLimit(email) {
  if (email) {
    passwordResetAttempts.delete(email);
    // Also clear email rate limit cache for this email
    emailRateLimitCache.delete(`reset:${email}`);
    emailRateLimitCache.delete(`verify:${email}`);
  } else {
    passwordResetAttempts.clear();
    emailRateLimitCache.clear();
  }
}

/**
 * Reset only email cooldown (for testing rate limit logic)
 * @param {string} email - Email to reset cooldown for
 */
export function resetEmailCooldown(email) {
  emailRateLimitCache.delete(`reset:${email}`);
  emailRateLimitCache.delete(`verify:${email}`);
}

// ============================================================================
// POST /api/auth/forgot-password - Password Reset Request
// ============================================================================
router.post(
  '/forgot-password',
  validateBody({
    email: { required: true, type: 'email' }
  }),
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check cooldown rate limit (5 minute cooldown between requests)
      const cooldownKey = `reset:${email}`;
      const cooldownCheck = checkEmailRateLimit(cooldownKey, PASSWORD_RESET_COOLDOWN_MS);

      if (!cooldownCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${cooldownCheck.remainingSeconds} seconds before requesting another password reset email`
        });
      }

      // Check hourly rate limit (max 3 per hour)
      if (!checkPasswordResetRateLimit(email)) {
        return res.status(429).json({
          success: false,
          error: 'Too many password reset requests. Please try again in an hour.'
        });
      }

      // Check if user exists
      const user = await User.findByEmail(email);

      // Always return success (don't reveal if email exists)
      // This prevents email enumeration attacks
      const successMessage = 'If an account exists with this email, a password reset link has been sent.';

      // Only proceed if user exists
      if (!user) {
        return res.json({
          success: true,
          message: successMessage
        });
      }

      // Allow password reset for both password and OAuth-only users
      // OAuth-only users can use this flow to add a password to their account
      if (!user.password_hash) {
        console.log(`Password set requested for OAuth-only user: ${user.email}`);
      }

      // Generate secure random token (64 characters hex)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store token in database (cryptographically random, single-use)
      await User.setResetToken(user.id, resetToken, expiresAt);

      // Send email with reset link (token is sent unhashed)
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetToken
        });

        // Update rate limit cache after successful send
        updateEmailRateLimit(cooldownKey);

        console.log(`Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Still return success to user for security
      }

      res.json({
        success: true,
        message: successMessage
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still return success to prevent information disclosure
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }
  }
);

// ============================================================================
// POST /api/auth/reset-password - Password Reset Confirmation
// ============================================================================
router.post(
  '/reset-password',
  validateBody({
    token: { required: true, minLength: 32 },
    password: { required: true, type: 'password', minLength: 8 }
  }),
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find user by reset token (also verifies token hasn't expired)
      const user = await User.findByResetToken(token);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Allow password reset for both password and OAuth-only users
      // OAuth-only users are adding a password (account linking)
      // Users with existing passwords are resetting their password
      if (!user.password_hash) {
        console.log(`Setting password for OAuth-only user: ${user.email}`);
      } else {
        console.log(`Resetting password for user: ${user.email}`);
      }

      // Update user password (works for both new and existing password_hash)
      await User.updatePassword(user.id, password);

      // Clear reset token so it can't be reused
      await User.clearResetToken(user.id);

      // Generate JWT token to automatically log user in
      const jwtToken = generateToken(user);

      console.log(`Password reset successful for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully. You are now logged in.',
        token: jwtToken,
        user: sanitizeUser(user)
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }
);

// ============================================================================
// POST /api/auth/verify-email - Verify Email Address
// ============================================================================
router.post(
  '/verify-email',
  validateBody(['token']),
  async (req, res) => {
    try {
      const { token } = req.body;

      // Find user by verification token
      const user = await User.findByVerificationToken(token);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }

      // Mark email as verified
      const updatedUser = await User.markEmailAsVerified(user.id);

      console.log(`Email verified for user: ${updatedUser.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify email'
      });
    }
  }
);

// ============================================================================
// POST /api/auth/resend-verification - Resend Verification Email
// ============================================================================
router.post(
  '/resend-verification',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          error: 'Email already verified'
        });
      }

      // Check rate limit (5 minute cooldown)
      const rateLimitKey = `verify:${userId}`;
      const rateLimit = checkEmailRateLimit(rateLimitKey, EMAIL_VERIFICATION_COOLDOWN_MS);

      if (!rateLimit.allowed) {
        // Format remaining time as minutes and seconds for readability
        const minutes = Math.floor(rateLimit.remainingSeconds / 60);
        const seconds = rateLimit.remainingSeconds % 60;
        const timeStr = minutes > 0
          ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
          : `${seconds} second${seconds !== 1 ? 's' : ''}`;

        return res.status(429).json({
          success: false,
          error: `Please wait ${timeStr} before requesting another verification email`
        });
      }

      // Generate new verification token
      const verificationToken = await User.createVerificationToken(userId);

      // Send verification email
      await sendVerificationEmail({
        to: user.email,
        verificationToken
      });

      // Update rate limit cache
      updateEmailRateLimit(rateLimitKey);

      console.log(`Verification email resent to: ${user.email}`);

      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      console.error('Resend verification error:', error);

      // Check if it's a Resend API rate limit error
      if (error.code === 'RESEND_RATE_LIMIT') {
        return res.status(503).json({
          success: false,
          error: error.message || 'Email service is temporarily unavailable. Please try again in a few minutes.'
        });
      }

      // Generic error response for all other errors
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }
  }
);

export default router;
