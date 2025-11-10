/**
 * Authentication Middleware
 *
 * Provides middleware for protecting routes and validating requests.
 * Supports both JWT and session-based authentication.
 */

import passport from 'passport';
import jwt from 'jsonwebtoken';

/**
 * Require authentication via JWT or session
 * Attaches user to req.user if authenticated
 * Returns 401 if not authenticated
 */
const requireAuth = async (req, res, next) => {
  // Try JWT first (for API clients)
  const token = extractTokenFromHeader(req);

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Token is valid, fetch full user data including tier
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(decoded.sub);

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'User not found'
          });
        }

        req.user = user;
        return next();
      } catch (error) {
        console.error('[Auth] Error fetching user data:', error);
        return res.status(500).json({
          success: false,
          error: 'Authentication error'
        });
      }
    });
  }
  // Fall back to session authentication
  else if (req.isAuthenticated && req.isAuthenticated()) {
    // Check if session deserialization actually loaded a user
    if (!req.user) {
      console.log('[Auth] Session exists but no user loaded - clearing session');
      // Destroy invalid session
      req.logout((err) => {
        if (err) console.error('[Auth] Error logging out:', err);
      });
      req.session.destroy((err) => {
        if (err) console.error('[Auth] Error destroying session:', err);
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid session - please log in again',
        sessionCleared: true
      });
    }
    return next();
  }
  // No valid authentication found
  else {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
};

/**
 * Optional authentication
 * Attaches user to req.user if authenticated, but doesn't fail if not
 * Useful for endpoints that have different behavior for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  const token = extractTokenFromHeader(req);

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err && decoded.sub) {
        try {
          // Fetch full user data including tier
          const User = (await import('../models/User.js')).default;
          const user = await User.findById(decoded.sub);

          if (user) {
            req.user = user;
          }
        } catch (error) {
          console.error('[Auth] Error fetching user data in optionalAuth:', error);
          // Don't fail the request, just continue without user
        }
      }
      next();
    });
  } else if (req.isAuthenticated && req.isAuthenticated()) {
    // User is authenticated via session
    next();
  } else {
    // Not authenticated, but that's okay
    next();
  }
};

/**
 * Require specific tier or higher
 * Must be used AFTER requireAuth
 *
 * @param {string} requiredTier - Minimum tier required (free, pro, team, enterprise)
 */
const requireTier = (requiredTier) => {
  const tierHierarchy = ['free', 'pro', 'team', 'enterprise'];
  const requiredIndex = tierHierarchy.indexOf(requiredTier);

  if (requiredIndex === -1) {
    throw new Error(`Invalid tier: ${requiredTier}`);
  }

  return (req, res, next) => {
    if (!req.user || !req.user.tier) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userTierIndex = tierHierarchy.indexOf(req.user.tier);

    if (userTierIndex < requiredIndex) {
      return res.status(403).json({
        success: false,
        error: `This feature requires ${requiredTier} tier or higher`,
        currentTier: req.user.tier,
        requiredTier
      });
    }

    next();
  };
};

/**
 * Validate request body against schema
 * Simple validation for common auth fields
 *
 * @param {object} schema - Object with field names and validators
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = {};

    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required fields
      if (validator.required && (!value || value.trim() === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!validator.required && !value) {
        continue;
      }

      // Email validation
      if (validator.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field] = 'Invalid email format';
        }
      }

      // Password validation
      if (validator.type === 'password') {
        if (value.length < (validator.minLength || 8)) {
          errors[field] = `Password must be at least ${validator.minLength || 8} characters`;
        }
      }

      // Min length validation
      if (validator.minLength && value.length < validator.minLength) {
        errors[field] = `${field} must be at least ${validator.minLength} characters`;
      }

      // Max length validation
      if (validator.maxLength && value.length > validator.maxLength) {
        errors[field] = `${field} must be at most ${validator.maxLength} characters`;
      }

      // Custom validator function
      if (validator.custom) {
        const customError = validator.custom(value);
        if (customError) {
          errors[field] = customError;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

/**
 * Extract JWT token from Authorization header
 * Supports both "Bearer <token>" and just "<token>" formats
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Support just "<token>" format
  return authHeader;
}

/**
 * Generate JWT token for user
 *
 * @param {object} user - User object with id property
 * @param {string} expiresIn - Token expiration (default: 7d)
 * @returns {string} JWT token
 */
function generateToken(user, expiresIn = '7d') {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Require verified email
 * Must be used AFTER requireAuth
 * Returns 403 if email is not verified
 */
const requireVerifiedEmail = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Import User model dynamically to avoid circular dependency
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (!user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      message: 'Please verify your email address to access this feature',
      emailVerified: false
    });
  }

  // Add full user object to request for downstream middleware
  req.user = user;
  next();
};

/**
 * Sanitize user object for client response
 * Removes sensitive fields like password_hash
 *
 * @param {object} user - User object from database
 * @returns {object} Safe user object
 */
function sanitizeUser(user) {
  if (!user) return null;

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export {
  requireAuth,
  optionalAuth,
  requireTier,
  requireVerifiedEmail,
  validateBody,
  generateToken,
  sanitizeUser
};
