import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

/**
 * Check if request should skip rate limiting
 * Admin, support, and super_admin users bypass rate limits
 * @param {Object} req - Express request object
 * @returns {boolean} True if request should skip rate limiting
 */
const shouldSkipRateLimit = (req) => {
  return req.user && User.canBypassRateLimits(req.user);
};

// Primary rate limiter: 10 requests per minute
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please try again in 60 seconds.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: true,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again in 60 seconds.',
      retryAfter: 60
    });
  }
});

// Stricter limiter for generation endpoints
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_HOURLY_MAX) || 100,
  message: {
    error: 'Hourly limit exceeded',
    message: 'You have exceeded 100 generations per hour. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: true,
  skip: shouldSkipRateLimit,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Hourly limit exceeded',
      message: 'You have exceeded 100 generations per hour. Please try again later.',
      retryAfter: 3600
    });
  }
});