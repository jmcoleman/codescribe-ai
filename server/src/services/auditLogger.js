/**
 * Audit Logger Service
 * Provides utilities for HIPAA-compliant audit logging
 */

import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

/**
 * Create SHA-256 hash of input text
 * @param {string} input - Text to hash
 * @returns {string} 64-character hex hash
 */
export function hashInput(input) {
  if (!input) return null;
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Extract client IP address from request
 * Handles proxies (X-Forwarded-For, X-Real-IP)
 * @param {Object} req - Express request object
 * @returns {string|null} IP address
 */
export function getClientIp(req) {
  // Check X-Forwarded-For header (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to direct connection IP
  return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string|null} User agent string
 */
export function getUserAgent(req) {
  return req.headers['user-agent'] || null;
}

/**
 * Log an activity (async, non-blocking)
 * @param {Object} options - Logging options
 * @param {Object|null} options.req - Express request object (for IP/user agent)
 * @param {Object|null} options.user - User object (from req.user)
 * @param {string} options.action - Action performed
 * @param {string|null} [options.resourceType] - Resource type
 * @param {string|null} [options.resourceId] - Resource identifier
 * @param {string|null} [options.inputCode] - Code input (will be hashed)
 * @param {boolean} [options.containsPotentialPhi=false] - PHI detection flag
 * @param {number} [options.phiScore=0] - PHI score (0-100)
 * @param {boolean} [options.success=true] - Success status
 * @param {Error|string|null} [options.error] - Error object or message
 * @param {number|null} [options.durationMs] - Duration in ms
 * @param {Object} [options.metadata={}] - Additional metadata
 * @returns {Promise<void>} Resolves when logged (non-blocking)
 */
export async function logActivity({
  req = null,
  user = null,
  action,
  resourceType = null,
  resourceId = null,
  inputCode = null,
  containsPotentialPhi = false,
  phiScore = 0,
  success = true,
  error = null,
  durationMs = null,
  metadata = {},
}) {
  // Build audit log entry
  const auditEntry = {
    userId: user?.id || null,
    userEmail: user?.email || null,
    action,
    resourceType,
    resourceId,
    inputHash: inputCode ? hashInput(inputCode) : null,
    containsPotentialPhi,
    phiScore,
    success,
    errorMessage: error ? sanitizeErrorMessage(error) : null,
    ipAddress: req ? getClientIp(req) : null,
    userAgent: req ? getUserAgent(req) : null,
    durationMs,
    metadata,
  };

  // Log asynchronously (non-blocking)
  // Don't await - let it run in background
  AuditLog.log(auditEntry).catch((err) => {
    console.error('[AuditLogger] Failed to log activity:', err.message);
  });
}

/**
 * Sanitize error message to remove potential PHI
 * @param {Error|string} error - Error object or message
 * @returns {string} Sanitized error message
 */
export function sanitizeErrorMessage(error) {
  let message = error instanceof Error ? error.message : String(error);

  // Remove anything that looks like PHI patterns
  // SSN: xxx-xx-xxxx
  message = message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]');

  // Email addresses
  message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-REDACTED]');

  // Phone numbers (various formats)
  message = message.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE-REDACTED]');

  // Dates (MM/DD/YYYY, MM-DD-YYYY)
  message = message.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g, '[DATE-REDACTED]');

  // Truncate if too long (max 500 chars)
  if (message.length > 500) {
    message = message.substring(0, 497) + '...';
  }

  return message;
}

/**
 * Get audit logs with filters
 * Wrapper around AuditLog.getAuditLogs with additional processing
 * @param {Object} filters - Filter options (see AuditLog.getAuditLogs)
 * @returns {Promise<Object>} { logs, total, summary }
 */
export async function getAuditLogs(filters = {}) {
  const { logs, total } = await AuditLog.getAuditLogs(filters);

  // Calculate summary stats for this result set
  const summary = {
    total,
    highRisk: logs.filter((log) => log.phi_score >= 16).length,
    mediumRisk: logs.filter((log) => log.phi_score >= 6 && log.phi_score <= 15).length,
    lowRisk: logs.filter((log) => log.phi_score >= 1 && log.phi_score <= 5).length,
    failed: logs.filter((log) => !log.success).length,
  };

  return { logs, total, summary };
}

/**
 * Export audit logs to CSV format
 * @param {Array} logs - Array of audit log entries
 * @returns {string} CSV string
 */
export function exportToCSV(logs) {
  if (!logs || logs.length === 0) {
    return 'No data to export';
  }

  // CSV headers
  const headers = [
    'ID',
    'User Email',
    'Action',
    'Resource Type',
    'Resource ID',
    'Input Hash',
    'Contains PHI',
    'PHI Score',
    'Risk Level',
    'Success',
    'Error Message',
    'IP Address',
    'User Agent',
    'Duration (ms)',
    'Created At',
  ];

  // Build CSV rows
  const rows = logs.map((log) => {
    const riskLevel =
      log.phi_score >= 16 ? 'High' : log.phi_score >= 6 ? 'Medium' : log.phi_score >= 1 ? 'Low' : 'None';

    return [
      log.id,
      escapeCSV(log.user_email || 'N/A'),
      escapeCSV(log.action),
      escapeCSV(log.resource_type || 'N/A'),
      escapeCSV(log.resource_id || 'N/A'),
      log.input_hash || 'N/A',
      log.contains_potential_phi ? 'Yes' : 'No',
      log.phi_score,
      riskLevel,
      log.success ? 'Yes' : 'No',
      escapeCSV(log.error_message || 'N/A'),
      log.ip_address || 'N/A',
      escapeCSV(log.user_agent || 'N/A'),
      log.duration_ms || 'N/A',
      log.created_at,
    ];
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csvContent;
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 * @param {string} field - Field value
 * @returns {string} Escaped field
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';

  const str = String(field);

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export default {
  hashInput,
  getClientIp,
  getUserAgent,
  logActivity,
  sanitizeErrorMessage,
  getAuditLogs,
  exportToCSV,
};
