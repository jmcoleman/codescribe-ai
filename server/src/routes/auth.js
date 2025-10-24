/**
 * Authentication Routes
 *
 * Handles user registration, login, logout, and OAuth flows.
 * Supports both email/password and GitHub OAuth authentication.
 */

import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import {
  requireAuth,
  validateBody,
  generateToken,
  sanitizeUser
} from '../middleware/auth.js';

const router = express.Router();

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
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Create new user (password will be hashed in User.create)
      const user = await User.create({ email, password });

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
    passport.authenticate('local', { session: false }, (err, user, info) => {
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

      // Generate JWT token
      const token = generateToken(user);

      // Log user in via session
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          // Continue even if session fails (token is primary)
        }

        res.json({
          success: true,
          message: 'Login successful',
          user: sanitizeUser(user),
          token
        });
      });
    })(req, res, next);
  }
);

// ============================================================================
// POST /api/auth/logout - User Logout
// ============================================================================
router.post('/logout', requireAuth, (req, res) => {
  // Destroy session if exists
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }

  // Log out passport session
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
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
    // req.user should contain at least { id }
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user)
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
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/login?error=github_auth_failed'
  }),
  (req, res) => {
    try {
      // User authenticated via GitHub
      const user = req.user;

      if (!user) {
        return res.redirect('/login?error=no_user_data');
      }

      // Generate JWT token
      const token = generateToken(user);

      // Log user in via session
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
        }

        // Redirect to frontend with token
        // Frontend should extract token from URL and store it
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      });
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

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

      // Check if user exists
      const user = await User.findByEmail(email);

      // Always return success (don't reveal if email exists)
      // This prevents email enumeration attacks
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });

      // Only proceed if user exists
      if (!user) {
        return;
      }

      // TODO: Generate password reset token
      // TODO: Store reset token in database with expiration (e.g., 1 hour)
      // TODO: Send email with reset link containing token
      // TODO: Implement email service integration

      // For now, log the reset request
      console.log(`Password reset requested for user: ${user.email}`);

      // Example implementation would be:
      // const resetToken = crypto.randomBytes(32).toString('hex');
      // const resetTokenHash = await bcrypt.hash(resetToken, 10);
      // const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      //
      // await User.setResetToken(user.id, resetTokenHash, expiresAt);
      //
      // await emailService.sendPasswordReset({
      //   to: user.email,
      //   resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
      // });
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

      // TODO: Verify reset token
      // TODO: Check token hasn't expired
      // TODO: Update user password
      // TODO: Invalidate reset token
      // TODO: Optionally invalidate all sessions

      // For now, return not implemented
      return res.status(501).json({
        success: false,
        error: 'Password reset functionality not yet implemented'
      });

      // Example implementation would be:
      // const user = await User.findByResetToken(token);
      //
      // if (!user || user.reset_token_expires < new Date()) {
      //   return res.status(400).json({
      //     success: false,
      //     error: 'Invalid or expired reset token'
      //   });
      // }
      //
      // await User.updatePassword(user.id, password);
      // await User.clearResetToken(user.id);
      //
      // res.json({
      //   success: true,
      //   message: 'Password reset successfully'
      // });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }
);

export default router;
