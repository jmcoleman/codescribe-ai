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
import { STORAGE_KEYS } from '../constants/storage';

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
const SESSION_TRACKED_KEY = 'cs_analytics_session_tracked';

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
    // Reset tracked flag when new session starts (ensures session_start event fires)
    sessionStorage.removeItem(SESSION_TRACKED_KEY);
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
 * Get how long the current session has been active
 * @returns {number} Session duration in milliseconds
 */
export const getSessionDuration = () => {
  const start = getSessionStart();
  return Date.now() - start;
};

/**
 * Reset the analytics session (call on logout)
 * This ensures a new session starts when a different user logs in
 */
export const resetAnalyticsSession = () => {
  sessionStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(SESSION_START_KEY);
  sessionStorage.removeItem(SESSION_TRACKED_KEY);
};

/**
 * Enhance event data with session context
 * Note: is_internal/is_admin/has_tier_override flags are set server-side
 * based on user role lookup, which is more accurate than client-side detection
 * (especially for events that fire before login like session_start).
 * @param {Object} data - Original event data
 * @returns {Object} Event data with session context added
 */
const withSessionContext = (data) => ({
  ...data,
  session_id: getSessionId(),
  session_duration_ms: getSessionDuration(),
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
    // Include auth token if available to associate events with users
    const headers = {
      'Content-Type': 'application/json',
      'X-Analytics-Key': import.meta.env.VITE_ANALYTICS_API_KEY,
    };
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/analytics/track`, {
      method: 'POST',
      headers,
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
 * @param {string} params.origin - Where code came from (sample, paste, upload, github, gitlab, bitbucket)
 * @param {string} params.filename - Name of the file being documented
 * @param {Object} [params.repo] - Repository context for git-based origins (optional)
 * @param {boolean} [params.repo.isPrivate] - Whether the repo is private
 * @param {string} [params.repo.name] - Repository name (owner/repo)
 * @param {string} [params.repo.branch] - Branch name
 * @param {Object} [params.llm] - LLM context (optional)
 * @param {string} [params.llm.provider] - Provider (claude, openai)
 * @param {string} [params.llm.model] - Model name
 */
export const trackDocGeneration = ({ docType, success, duration, codeSize, language, origin, filename, repo, llm }) => {
  const eventData = {
    doc_type: docType,
    success: success ? 'true' : 'false',
    duration_ms: Math.round(duration),
    // Group code input attributes for easier management when adding project context
    code_input: {
      filename: filename || 'untitled',
      language: language || 'unknown',
      origin: origin || 'unknown',
      size_kb: Math.round(codeSize / 1024),
    },
  };

  // Add repo context for git-based origins (github, gitlab, bitbucket)
  if (repo && origin && ['github', 'gitlab', 'bitbucket'].includes(origin)) {
    eventData.code_input.repo = {
      is_private: repo.isPrivate || false,
      name: repo.name || 'unknown',
      branch: repo.branch || null,
    };
  }

  // Add LLM context if provided
  if (llm) {
    eventData.llm = {
      provider: llm.provider || 'unknown',
      model: llm.model || 'unknown',
    };
  }

  trackEvent('doc_generation', withSessionContext(eventData));
};

/**
 * Track quality score results
 * @param {Object} params - Event parameters
 * @param {number} params.score - Overall quality score (0-100)
 * @param {string} params.grade - Letter grade (A, B, C, D, F)
 * @param {string} params.docType - Type of documentation
 * @param {Object} [params.llm] - LLM provider information
 * @param {string} [params.llm.provider] - LLM provider (claude, openai, etc.)
 * @param {string} [params.llm.model] - LLM model name
 */
export const trackQualityScore = ({ score, grade, docType, llm }) => {
  const eventData = {
    score: Math.round(score),
    grade,
    doc_type: docType,
    score_range: getScoreRange(score),
  };

  // Add LLM context if provided
  if (llm) {
    eventData.llm = {
      provider: llm.provider || 'unknown',
      model: llm.model || 'unknown',
    };
  }

  trackEvent('quality_score', withSessionContext(eventData));
};

/**
 * Track code input method
 * @param {string} origin - Input origin (paste, upload, sample, github)
 * @param {number} codeSize - Size of code in bytes
 * @param {string} language - Programming language
 * @param {string} filename - Name of the file (optional)
 * @param {Object} [metadata] - Additional metadata based on origin (optional)
 * @param {string} [metadata.owner] - Repository owner (for git origins)
 * @param {string} [metadata.name] - Repository name (for git origins)
 * @param {string} [metadata.path] - File path in repository (for git origins)
 * @param {boolean} [metadata.isPrivate] - Whether the repo is private (for git origins)
 * @param {string} [metadata.fileType] - File extension (for upload origin)
 * @param {number} [metadata.fileSize] - Original file size in bytes (for upload origin)
 * @param {boolean} [metadata.success] - Upload success (for upload origin, defaults to true)
 */
export const trackCodeInput = (origin, codeSize, language, filename, metadata) => {
  const eventData = {
    origin: origin || 'unknown',
    size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
    filename: filename || 'untitled',
  };

  // Add repo context for git-based origins
  if (metadata && origin && ['github', 'gitlab', 'bitbucket'].includes(origin)) {
    eventData.repo = {
      owner: metadata.owner,
      name: metadata.name,
      path: metadata.path,
      is_private: metadata.isPrivate || false,
    };
  }

  // Add file context for upload origin
  if (metadata && origin === 'upload') {
    eventData.file = {
      type: metadata.fileType,
      size_kb: metadata.fileSize ? Math.round(metadata.fileSize / 1024) : undefined,
      success: metadata.success !== false, // defaults to true
    };
  }

  trackEvent('code_input', withSessionContext(eventData));
};

/**
 * Track errors
 * @param {Object} params - Event parameters
 * @param {string} params.errorType - Type of error (network, validation, api, server)
 * @param {string} params.errorMessage - Error message (sanitized)
 * @param {string} params.context - Where error occurred
 * @param {Object} [params.codeInput] - Code input context (optional)
 * @param {string} [params.codeInput.filename] - Filename
 * @param {string} [params.codeInput.language] - Language
 * @param {string} [params.codeInput.origin] - Origin (paste, upload, sample, github, gitlab, bitbucket)
 * @param {number} [params.codeInput.sizeKb] - Size in KB
 * @param {Object} [params.codeInput.repo] - Repository context for git-based origins (optional)
 * @param {boolean} [params.codeInput.repo.isPrivate] - Whether the repo is private
 * @param {string} [params.codeInput.repo.name] - Repository name (owner/repo)
 * @param {string} [params.codeInput.repo.branch] - Branch name
 * @param {Object} [params.llm] - LLM context (optional)
 * @param {string} [params.llm.provider] - Provider (claude, openai)
 * @param {string} [params.llm.model] - Model name
 */
export const trackError = ({ errorType, errorMessage, context, codeInput, llm }) => {
  // Sanitize error message to avoid sending sensitive data
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);

  const eventData = {
    error_type: errorType,
    error_message: sanitizedMessage,
    context,
  };

  // Add code input context if provided
  if (codeInput) {
    eventData.code_input = {
      filename: codeInput.filename || 'untitled',
      language: codeInput.language || 'unknown',
      origin: codeInput.origin || 'unknown',
      size_kb: codeInput.sizeKb || 0,
    };

    // Add repo context for git-based origins
    if (codeInput.repo && codeInput.origin && ['github', 'gitlab', 'bitbucket'].includes(codeInput.origin)) {
      eventData.code_input.repo = {
        is_private: codeInput.repo.isPrivate || false,
        name: codeInput.repo.name || 'unknown',
        branch: codeInput.repo.branch || null,
      };
    }
  }

  // Add LLM context if provided
  if (llm) {
    eventData.llm = {
      provider: llm.provider || 'unknown',
      model: llm.model || 'unknown',
    };
  }

  trackEvent('error', withSessionContext(eventData));
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
 * Track doc export (funnel event)
 * Called when user copies or downloads generated documentation
 * @param {Object} params - Event parameters
 * @param {string} params.action - Export action: 'copy' or 'download'
 * @param {string} params.docType - Type of documentation exported
 * @param {string} [params.filename] - Name of the file
 * @param {string} [params.format] - Download format (md, txt, etc.) - only for download action
 * @param {string} [params.source] - Export source: 'fresh' (just generated) or 'cached' (loaded from history/storage)
 */
export const trackDocExport = ({ action, docType, filename, format, source }) => {
  const eventData = {
    action,
    doc_type: docType,
    filename: filename || 'untitled',
    source: source || 'fresh', // Default to 'fresh' for backward compatibility
  };

  // Add format only for download action
  if (action === 'download' && format) {
    eventData.format = format;
  }

  trackEvent('doc_export', withSessionContext(eventData));
};

/**
 * Track usage alert events (warning at 80%, limit hit at 100%)
 * @param {Object} params - Event parameters
 * @param {string} params.action - Alert type: 'warning_shown' (80%) or 'limit_hit' (100%)
 * @param {string} params.tier - User's current tier
 * @param {number} [params.percentUsed] - Percentage of limit used
 * @param {number} [params.remaining] - Docs remaining
 * @param {number} [params.limit] - Total limit
 * @param {string} [params.period] - Billing period (monthly, etc.)
 */
export const trackUsageAlert = ({ action, tier, percentUsed, remaining, limit, period }) => {
  trackEvent('usage_alert', withSessionContext({
    action,
    tier,
    percent_used: percentUsed,
    docs_remaining: remaining,
    limit,
    period: period || 'monthly',
  }));
};

/**
 * Track session start for funnel analytics
 * Called once per browser session (deduplication handled internally)
 */
export const trackSessionStart = () => {
  // Check if already tracked this session (prevents duplicates on HMR/remounts)
  if (sessionStorage.getItem(SESSION_TRACKED_KEY)) {
    return;
  }

  trackEvent('session_start', withSessionContext({
    referrer: document.referrer || 'direct',
    landing_page: window.location.pathname,
  }));

  // Mark session as tracked
  sessionStorage.setItem(SESSION_TRACKED_KEY, 'true');
};

/**
 * Track user login for associating sessions with users
 * Called after successful email/password login
 * @param {Object} params - Event parameters
 * @param {string} params.method - Login method (email, oauth_github, oauth_google)
 */
export const trackLogin = ({ method = 'email' } = {}) => {
  trackEvent('login', withSessionContext({
    method,
  }));
};

/**
 * Track user signup for business metrics
 * Called after successful account creation
 * @param {Object} params - Event parameters
 * @param {string} params.method - Signup method (email, oauth_github, oauth_google)
 * @param {string} params.tier - Initial tier (free, pro, team)
 * @param {boolean} params.hasTrial - Whether signup included a trial
 */
export const trackSignup = ({ method = 'email', tier = 'free', hasTrial = false } = {}) => {
  trackEvent('signup', withSessionContext({
    method,
    tier,
    has_trial: hasTrial ? 'true' : 'false',
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
 * Track performance metrics for LLM streaming
 * Organized into logical groups: latency, throughput, input, cache, request, context, llm
 *
 * @param {Object} params - Event parameters
 * @param {Object} params.latency - Latency metrics
 * @param {number} params.latency.totalMs - Total end-to-end latency (ms)
 * @param {number} [params.latency.ttftMs] - Time to First Token (ms)
 * @param {number} [params.latency.tpotMs] - Time Per Output Token (ms) - avg inter-token latency
 * @param {number} [params.latency.streamingMs] - Time spent streaming (total - ttft)
 * @param {Object} [params.throughput] - Throughput metrics
 * @param {number} [params.throughput.outputTokens] - Number of output tokens
 * @param {number} [params.throughput.tokensPerSecond] - Output throughput rate
 * @param {Object} [params.input] - Input metrics
 * @param {number} [params.input.tokens] - Input token count
 * @param {number} [params.input.chars] - Input character count
 * @param {Object} [params.cache] - Prompt cache metrics (Claude)
 * @param {boolean} [params.cache.hit] - Whether cache was used
 * @param {number} [params.cache.readTokens] - Tokens read from cache
 * @param {Object} [params.request] - Request metrics
 * @param {number} [params.request.retryCount] - Number of retries before success
 * @param {Object} [params.context] - Generation context
 * @param {string} [params.context.docType] - Documentation type (README, JSDOC, etc.)
 * @param {string} [params.context.language] - Programming language
 * @param {string} [params.context.docName] - Document/file name
 * @param {Object} [params.llm] - LLM provider info
 * @param {string} [params.llm.provider] - Provider name (claude, openai)
 * @param {string} [params.llm.model] - Model name
 */
export const trackPerformance = ({ latency, throughput, input, cache, request, context, llm }) => {
  const eventData = {};

  // Latency metrics (required)
  if (latency) {
    eventData.latency = {
      total_ms: Math.round(latency.totalMs),
    };
    if (latency.ttftMs !== undefined) {
      eventData.latency.ttft_ms = Math.round(latency.ttftMs);
    }
    if (latency.tpotMs !== undefined) {
      eventData.latency.tpot_ms = Math.round(latency.tpotMs * 100) / 100; // 2 decimal places
    }
    if (latency.streamingMs !== undefined) {
      eventData.latency.streaming_ms = Math.round(latency.streamingMs);
    }
  }

  // Throughput metrics
  if (throughput) {
    eventData.throughput = {};
    if (throughput.outputTokens !== undefined) {
      eventData.throughput.output_tokens = throughput.outputTokens;
    }
    if (throughput.tokensPerSecond !== undefined) {
      eventData.throughput.tokens_per_second = Math.round(throughput.tokensPerSecond * 10) / 10; // 1 decimal
    }
  }

  // Input metrics
  if (input) {
    eventData.input = {};
    if (input.tokens !== undefined) {
      eventData.input.tokens = input.tokens;
    }
    if (input.chars !== undefined) {
      eventData.input.chars = input.chars;
    }
  }

  // Cache metrics (Claude prompt caching)
  if (cache) {
    eventData.cache = {};
    if (cache.hit !== undefined) {
      eventData.cache.hit = cache.hit;
    }
    if (cache.readTokens !== undefined) {
      eventData.cache.read_tokens = cache.readTokens;
    }
  }

  // Request metrics
  if (request) {
    eventData.request = {};
    if (request.retryCount !== undefined) {
      eventData.request.retry_count = request.retryCount;
    }
  }

  // Context (doc type, language, doc name)
  if (context) {
    eventData.context = {};
    if (context.docType) {
      eventData.context.doc_type = context.docType;
    }
    if (context.language) {
      eventData.context.language = context.language;
    }
    if (context.docName) {
      eventData.context.doc_name = context.docName;
    }
  }

  // LLM provider info
  if (llm) {
    eventData.llm = {
      provider: llm.provider || 'unknown',
      model: llm.model || 'unknown',
    };
  }

  trackEvent('performance', withSessionContext(eventData));
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
