/**
 * Analytics Utility for CodeScribe AI
 *
 * Tracks custom events to Vercel Analytics for understanding user behavior,
 * performance metrics, and product insights.
 *
 * Privacy: All tracking is anonymous and respects user privacy.
 * No personal information is collected. Users can opt out via Settings > Privacy.
 *
 * NOTE: Analytics are only enabled in production to avoid performance
 * degradation during development.
 */

import { track } from '@vercel/analytics';
import { API_URL } from '../config/api';

// ===========================================
// PRODUCTION CHECK
// ===========================================

// Helper to check if we're in production
// Use hostname check - most reliable method for Vercel deployments
const isProduction =
  window.location.hostname === 'codescribeai.com' ||
  window.location.hostname.includes('vercel.app');

// ===========================================
// ANALYTICS OPT-OUT SUPPORT
// ===========================================

// Module-level state for opt-out (updated by AuthContext when user changes)
let analyticsOptedOut = false;

/**
 * Update the analytics opt-out state
 * Called from AuthContext when user data changes
 * @param {boolean} optedOut - Whether user has opted out of analytics
 */
export const setAnalyticsOptOut = (optedOut) => {
  analyticsOptedOut = optedOut;
};

// ===========================================
// ADMIN/OVERRIDE EXCLUSION SUPPORT
// ===========================================

// Module-level state for admin/override detection
// These are flagged in events so they can be filtered in analytics queries
let isAdminUser = false;
let hasTierOverride = false;

/**
 * Update the admin/override status
 * Called from AuthContext when user data changes
 * @param {Object} status - Admin/override status
 * @param {boolean} status.isAdmin - Whether user is admin/support role
 * @param {boolean} status.hasTierOverride - Whether user has tier override active
 */
export const setAnalyticsUserStatus = ({ isAdmin, hasTierOverride: hasOverride }) => {
  isAdminUser = isAdmin || false;
  hasTierOverride = hasOverride || false;
};

/**
 * Check if analytics is currently enabled
 * Respects both production check and user opt-out preference
 * @returns {boolean} Whether analytics tracking is enabled
 */
const isAnalyticsEnabled = () => {
  if (!isProduction) return false;
  if (analyticsOptedOut) return false;
  return true;
};

// ===========================================
// SESSION MANAGEMENT
// ===========================================

const SESSION_ID_KEY = 'cs_analytics_session_id';
const SESSION_START_KEY = 'cs_analytics_session_start';
const SESSION_COUNT_KEY = 'cs_analytics_session_count';

/**
 * Get or create a session ID for the current browser session
 * Uses sessionStorage so it persists across page refreshes but clears on tab close
 * @returns {string} The session ID (UUID)
 */
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());

    // Increment session count in localStorage for returning user detection
    const sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
    localStorage.setItem(SESSION_COUNT_KEY, (sessionCount + 1).toString());
  }
  return sessionId;
};

/**
 * Get the timestamp when the current session started
 * @returns {number} Session start timestamp in milliseconds
 */
export const getSessionStart = () => {
  return parseInt(sessionStorage.getItem(SESSION_START_KEY) || Date.now().toString(), 10);
};

/**
 * Check if this is a returning user (has visited before)
 * @returns {boolean} True if user has had more than one session
 */
export const isReturningUser = () => {
  const sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  return sessionCount > 1;
};

/**
 * Get how long the current session has been active
 * @returns {number} Session duration in milliseconds
 */
export const getSessionDuration = () => {
  const start = getSessionStart();
  return Date.now() - start;
};

/**
 * Enhance event data with session context
 * Includes admin/override flags for filtering in analytics queries
 * @param {Object} data - Original event data
 * @returns {Object} Event data with session context added
 */
const withSessionContext = (data) => ({
  ...data,
  session_id: getSessionId(),
  is_returning_user: isReturningUser() ? 'true' : 'false',
  session_duration_ms: getSessionDuration(),
  // Admin/override flags for filtering - exclude from business metrics
  is_internal: (isAdminUser || hasTierOverride) ? 'true' : 'false',
  is_admin: isAdminUser ? 'true' : 'false',
  has_tier_override: hasTierOverride ? 'true' : 'false',
});

// ===========================================
// CORE TRACKING FUNCTION
// ===========================================

/**
 * Send event to backend for admin dashboard
 * Fires asynchronously without blocking
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event data with session context
 */
const sendToBackend = async (eventName, eventData) => {
  try {
    const response = await fetch(`${API_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        eventData,
        sessionId: getSessionId(),
      }),
    });

    if (!response.ok && !isProduction) {
      console.warn(`[Analytics] Backend tracking failed: ${response.status}`);
    }
  } catch (e) {
    // Network errors - log in dev mode, don't break the app
    if (!isProduction) {
      console.warn('[Analytics] Backend tracking network error:', e.message);
    }
  }
};

/**
 * Wrapper function that only tracks when analytics is enabled
 * Sends to both Vercel Analytics and our backend for admin dashboard
 * Respects production check and user opt-out preference
 */
const trackEvent = (eventName, eventData) => {
  if (isAnalyticsEnabled()) {
    // Send to Vercel Analytics
    track(eventName, eventData);
    // Also send to our backend for admin dashboard (fire and forget)
    sendToBackend(eventName, eventData);
  } else if (!isProduction) {
    // Log to console in development for debugging
    console.debug(`[Analytics] ${eventName}:`, eventData);
    // Also send to backend in dev for testing the dashboard
    sendToBackend(eventName, eventData);
  }
  // If opted out in production, silently skip (no logging, no backend)
};

// ===========================================
// EVENT TRACKING FUNCTIONS
// ===========================================

/**
 * Track documentation generation events
 * @param {Object} params - Event parameters
 * @param {string} params.docType - Type of documentation (README, JSDoc, API, ARCHITECTURE)
 * @param {boolean} params.success - Whether generation succeeded
 * @param {number} params.duration - Time taken in milliseconds
 * @param {number} params.codeSize - Size of input code in bytes
 * @param {string} params.language - Programming language detected
 */
export const trackDocGeneration = ({ docType, success, duration, codeSize, language }) => {
  trackEvent('doc_generation', withSessionContext({
    doc_type: docType,
    success: success ? 'true' : 'false',
    duration_ms: Math.round(duration),
    code_size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
  }));
};

/**
 * Track quality score results
 * @param {Object} params - Event parameters
 * @param {number} params.score - Overall quality score (0-100)
 * @param {string} params.grade - Letter grade (A, B, C, D, F)
 * @param {string} params.docType - Type of documentation
 */
export const trackQualityScore = ({ score, grade, docType }) => {
  trackEvent('quality_score', withSessionContext({
    score: Math.round(score),
    grade,
    doc_type: docType,
    score_range: getScoreRange(score),
  }));
};

/**
 * Track code input method
 * @param {string} method - Input method (paste, upload, example)
 * @param {number} codeSize - Size of code in bytes
 * @param {string} language - Programming language
 */
export const trackCodeInput = (method, codeSize, language) => {
  trackEvent('code_input', withSessionContext({
    method,
    code_size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
  }));
};

/**
 * Track errors
 * @param {Object} params - Event parameters
 * @param {string} params.errorType - Type of error (network, validation, api, server)
 * @param {string} params.errorMessage - Error message (sanitized)
 * @param {string} params.context - Where error occurred
 */
export const trackError = ({ errorType, errorMessage, context }) => {
  // Sanitize error message to avoid sending sensitive data
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);

  trackEvent('error', withSessionContext({
    error_type: errorType,
    error_message: sanitizedMessage,
    context,
  }));
};

/**
 * Track streaming vs standard generation
 * @param {string} mode - Generation mode (streaming, standard)
 * @param {number} duration - Time taken in milliseconds
 */
export const trackGenerationMode = (mode, duration) => {
  trackEvent('generation_mode', withSessionContext({
    mode,
    duration_ms: Math.round(duration),
  }));
};

/**
 * Track user interactions
 * @param {string} action - Action performed (copy_code, copy_docs, toggle_quality, view_example, etc.)
 * @param {Object} metadata - Additional metadata
 */
export const trackInteraction = (action, metadata = {}) => {
  trackEvent('user_interaction', withSessionContext({
    action,
    ...metadata,
  }));
};

/**
 * Track example usage
 * @param {string} exampleName - Name of example used
 */
export const trackExampleUsage = (exampleName) => {
  trackEvent('example_usage', withSessionContext({
    example_name: exampleName,
  }));
};

/**
 * Track file upload
 * @param {Object} params - Event parameters
 * @param {string} params.fileType - File extension
 * @param {number} params.fileSize - File size in bytes
 * @param {boolean} params.success - Upload success
 */
export const trackFileUpload = ({ fileType, fileSize, success }) => {
  trackEvent('file_upload', withSessionContext({
    file_type: fileType,
    file_size_kb: Math.round(fileSize / 1024),
    success: success ? 'true' : 'false',
  }));
};

/**
 * Track OAuth authentication flow timing and outcomes
 * @param {Object} params - Event parameters
 * @param {string} params.provider - OAuth provider (github, google, etc.)
 * @param {string} params.action - Action type (initiated, redirect_started, completed, failed)
 * @param {string} params.context - Where OAuth was triggered (login_modal, signup_modal)
 * @param {number} [params.duration] - Time taken in milliseconds (for completed/failed)
 * @param {string} [params.errorType] - Type of error if failed
 */
export const trackOAuth = ({ provider, action, context, duration, errorType }) => {
  const eventData = {
    provider,
    action,
    context,
  };

  if (duration !== undefined) {
    eventData.duration_ms = Math.round(duration);
    eventData.duration_seconds = Math.round(duration / 1000);
  }

  if (errorType) {
    eventData.error_type = errorType;
  }

  trackEvent('oauth_flow', withSessionContext(eventData));
};

/**
 * Track performance metrics
 * @param {Object} params - Event parameters
 * @param {number} params.parseTime - Time to parse code (ms)
 * @param {number} params.generateTime - Time to generate docs (ms)
 * @param {number} params.totalTime - Total time (ms)
 */
export const trackPerformance = ({ parseTime, generateTime, totalTime }) => {
  trackEvent('performance', withSessionContext({
    parse_time_ms: Math.round(parseTime),
    generate_time_ms: Math.round(generateTime),
    total_time_ms: Math.round(totalTime),
  }));
};

// Helper functions

/**
 * Get score range for grouping
 * @param {number} score - Quality score
 * @returns {string} Score range (e.g., "90-100", "80-89")
 */
function getScoreRange(score) {
  if (score >= 90) return '90-100';
  if (score >= 80) return '80-89';
  if (score >= 70) return '70-79';
  if (score >= 60) return '60-69';
  return '0-59';
}

/**
 * Sanitize error message to remove sensitive information
 * @param {string} message - Error message
 * @returns {string} Sanitized message
 */
function sanitizeErrorMessage(message) {
  if (!message) return 'unknown';

  // Truncate long messages
  let sanitized = message.slice(0, 100);

  // Remove potential API keys, tokens, or sensitive data patterns
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9-_]+/g, '[API_KEY]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9-_]+/g, '[TOKEN]');
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  return sanitized;
}

/**
 * Batch track multiple events (for complex operations)
 * @param {Array} events - Array of event objects with { name, data }
 */
export const trackBatch = (events) => {
  events.forEach(({ name, data }) => {
    trackEvent(name, data);
  });
};
