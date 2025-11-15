/**
 * Rate Limit Bypass Middleware
 *
 * Allows admin, support, and super_admin users to bypass rate limiting.
 * This middleware should be applied BEFORE rate limiters on protected routes.
 *
 * Usage:
 *   router.post('/api/generate', requireAuth, rateLimitBypass, generationLimiter, generate);
 *
 * Bypass roles:
 *   - admin: Full admin access
 *   - support: Customer support staff
 *   - super_admin: System administrators
 *
 * Regular users (role='user') are subject to normal rate limits.
 */

import User from '../models/User.js';

/**
 * Check if user should bypass rate limiting based on their role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const rateLimitBypass = (req, res, next) => {
  // Check if user is authenticated and has a bypass role
  if (req.user && User.canBypassRateLimits(req.user)) {
    // Skip rate limiting - immediately call next middleware
    return next();
  }

  // User doesn't have bypass privileges - continue to rate limiter
  return next();
};

export default rateLimitBypass;
