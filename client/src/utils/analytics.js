/**
 * Analytics Utility for CodeScribe AI
 *
 * Tracks custom events to Vercel Analytics for understanding user behavior,
 * performance metrics, and product insights.
 *
 * Privacy: All tracking is anonymous and respects user privacy.
 * No personal information is collected.
 */

import { track } from '@vercel/analytics';

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
  track('doc_generation', {
    doc_type: docType,
    success: success ? 'true' : 'false',
    duration_ms: Math.round(duration),
    code_size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
  });
};

/**
 * Track quality score results
 * @param {Object} params - Event parameters
 * @param {number} params.score - Overall quality score (0-100)
 * @param {string} params.grade - Letter grade (A, B, C, D, F)
 * @param {string} params.docType - Type of documentation
 */
export const trackQualityScore = ({ score, grade, docType }) => {
  track('quality_score', {
    score: Math.round(score),
    grade,
    doc_type: docType,
    score_range: getScoreRange(score),
  });
};

/**
 * Track code input method
 * @param {string} method - Input method (paste, upload, example)
 * @param {number} codeSize - Size of code in bytes
 * @param {string} language - Programming language
 */
export const trackCodeInput = (method, codeSize, language) => {
  track('code_input', {
    method,
    code_size_kb: Math.round(codeSize / 1024),
    language: language || 'unknown',
  });
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

  track('error', {
    error_type: errorType,
    error_message: sanitizedMessage,
    context,
  });
};

/**
 * Track streaming vs standard generation
 * @param {string} mode - Generation mode (streaming, standard)
 * @param {number} duration - Time taken in milliseconds
 */
export const trackGenerationMode = (mode, duration) => {
  track('generation_mode', {
    mode,
    duration_ms: Math.round(duration),
  });
};

/**
 * Track user interactions
 * @param {string} action - Action performed (copy_code, copy_docs, toggle_quality, view_example, etc.)
 * @param {Object} metadata - Additional metadata
 */
export const trackInteraction = (action, metadata = {}) => {
  track('user_interaction', {
    action,
    ...metadata,
  });
};

/**
 * Track example usage
 * @param {string} exampleName - Name of example used
 */
export const trackExampleUsage = (exampleName) => {
  track('example_usage', {
    example_name: exampleName,
  });
};

/**
 * Track file upload
 * @param {Object} params - Event parameters
 * @param {string} params.fileType - File extension
 * @param {number} params.fileSize - File size in bytes
 * @param {boolean} params.success - Upload success
 */
export const trackFileUpload = ({ fileType, fileSize, success }) => {
  track('file_upload', {
    file_type: fileType,
    file_size_kb: Math.round(fileSize / 1024),
    success: success ? 'true' : 'false',
  });
};

/**
 * Track performance metrics
 * @param {Object} params - Event parameters
 * @param {number} params.parseTime - Time to parse code (ms)
 * @param {number} params.generateTime - Time to generate docs (ms)
 * @param {number} params.totalTime - Total time (ms)
 */
export const trackPerformance = ({ parseTime, generateTime, totalTime }) => {
  track('performance', {
    parse_time_ms: Math.round(parseTime),
    generate_time_ms: Math.round(generateTime),
    total_time_ms: Math.round(totalTime),
  });
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
    track(name, data);
  });
};
