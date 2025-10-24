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
const requireAuth = (req, res, next) => {
  // Try JWT first (for API clients)
  const token = extractTokenFromHeader(req);

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Token is valid, user ID is in decoded.sub
      req.user = { id: decoded.sub };
      return next();
    });
  }
  // Fall back to session authentication
  else if (req.isAuthenticated && req.isAuthenticated()) {
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
const optionalAuth = (req, res, next) => {
  const token = extractTokenFromHeader(req);

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err && decoded.sub) {
        req.user = { id: decoded.sub };
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
  validateBody,
  generateToken,
  sanitizeUser
};
