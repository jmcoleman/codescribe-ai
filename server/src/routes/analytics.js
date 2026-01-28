/**
 * Analytics Routes
 * Internal endpoint for frontend event tracking
 *
 * Security: API key authentication, validates event names
 */

import express from 'express';
import { analyticsService } from '../services/analyticsService.js';

const router = express.Router();

/**
 * Validate analytics API key
 * Ensures only the app itself can submit events (blocks external spam)
 * while still allowing anonymous users to track without a JWT
 */
const requireAnalyticsKey = (req, res, next) => {
  const key = req.headers['x-analytics-key'];
  if (!key || key !== process.env.ANALYTICS_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
  next();
};

/**
 * Extract client IP address from request
 * Handles various proxy configurations
 * @param {Object} req - Express request
 * @returns {string} IP address
 */
const getClientIP = (req) => {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take first IP if multiple (client IP is first)
    return forwarded.split(',')[0].trim();
  }

  // Check X-Real-IP header (set by some proxies)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // Fall back to direct connection IP
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * POST /api/analytics/track
 * Record an analytics event from the frontend
 *
 * Body:
 * - eventName: string (required) - Event name from allowed list
 * - eventData: object (optional) - Event-specific properties
 * - sessionId: string (optional) - Browser session ID
 *
 * Note: User ID is extracted from Bearer token if provided
 */
router.post('/track', requireAnalyticsKey, async (req, res) => {
  try {
    const { eventName, eventData = {}, sessionId } = req.body;

    // Validate required fields
    if (!eventName) {
      console.error(JSON.stringify({
        type: 'analytics_tracking_error',
        error_type: 'validation',
        error_message: 'Missing eventName',
        ip_address: getClientIP(req),
        timestamp: new Date().toISOString(),
      }));

      return res.status(400).json({
        success: false,
        error: 'eventName is required',
      });
    }

    // Validate event name
    if (!analyticsService.isValidEvent(eventName)) {
      console.error(JSON.stringify({
        type: 'analytics_tracking_error',
        error_type: 'validation',
        error_message: `Invalid event name: ${eventName}`,
        ip_address: getClientIP(req),
        timestamp: new Date().toISOString(),
      }));

      return res.status(400).json({
        success: false,
        error: 'Invalid event name',
      });
    }

    // Extract user ID from auth token if provided
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.substring(7);
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        // JWT uses 'sub' (standard) or 'id' for user ID
        userId = decoded.sub || decoded.id;
      } catch (e) {
        // Invalid token - continue without user ID
      }
    }

    // Determine if internal user (from event data flags)
    const isInternal = eventData.is_internal === 'true' ||
                       eventData.is_admin === 'true' ||
                       eventData.has_tier_override === 'true';

    // Record the event
    const event = await analyticsService.recordEvent(eventName, eventData, {
      sessionId,
      userId,
      ipAddress: getClientIP(req),
      isInternal,
    });

    return res.status(201).json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    // Log error for monitoring
    console.error(JSON.stringify({
      type: 'analytics_tracking_error',
      error_type: 'db_error',
      error_message: error.message,
      event_name: req.body?.eventName,
      ip_address: getClientIP(req),
      timestamp: new Date().toISOString(),
    }));

    return res.status(500).json({
      success: false,
      error: 'Failed to record event',
    });
  }
});

export default router;
