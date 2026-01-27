/**
 * Compliance Routes
 * HIPAA audit logging and compliance reporting endpoints
 *
 * Security: All routes require authentication and admin privileges
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import auditLogger from '../services/auditLogger.js';

const router = express.Router();

/**
 * Roles that grant admin access
 */
const ADMIN_ROLES = ['admin', 'support', 'super_admin'];

/**
 * Middleware to check if user has admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Fetch user from database to get role
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has an admin role
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    // Add full user object to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filters and pagination
 *
 * Query params:
 * - userId: Filter by user ID
 * - userEmail: Filter by user email
 * - action: Filter by action type
 * - containsPhi: Filter by PHI presence (true/false)
 * - riskLevel: Filter by risk level (high/medium/low/none)
 * - startDate: Start date (ISO string)
 * - endDate: End date (ISO string)
 * - limit: Max results (default 50, max 200)
 * - offset: Pagination offset (default 0)
 */
router.get('/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      action,
      containsPhi,
      riskLevel,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    // Parse and validate parameters
    const filters = {
      userId: userId ? parseInt(userId, 10) : null,
      userEmail: userEmail || null,
      action: action || null,
      containsPhi: containsPhi === 'true' ? true : containsPhi === 'false' ? false : null,
      riskLevel: riskLevel || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: Math.min(parseInt(limit, 10) || 50, 200), // Max 200 per request
      offset: parseInt(offset, 10) || 0,
    };

    // Validate dates
    if (filters.startDate && isNaN(filters.startDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format',
      });
    }

    if (filters.endDate && isNaN(filters.endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endDate format',
      });
    }

    // Get audit logs
    const { logs, total, summary } = await auditLogger.getAuditLogs(filters);

    // Get overall stats for the date range (without pagination)
    const stats = await AuditLog.getStats({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    res.json({
      success: true,
      data: {
        logs,
        total,
        summary,
        stats,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + logs.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs to CSV
 *
 * Query params: Same as GET /audit-logs (without limit/offset)
 */
router.get('/audit-logs/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, userEmail, action, containsPhi, riskLevel, startDate, endDate } = req.query;

    // Parse parameters (no limit - export all matching logs)
    const filters = {
      userId: userId ? parseInt(userId, 10) : null,
      userEmail: userEmail || null,
      action: action || null,
      containsPhi: containsPhi === 'true' ? true : containsPhi === 'false' ? false : null,
      riskLevel: riskLevel || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: 10000, // Max 10K for export (prevent memory issues)
      offset: 0,
    };

    // Get audit logs
    const { logs } = await AuditLog.getAuditLogs(filters);

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No audit logs found matching filters',
      });
    }

    // Export to CSV
    const csv = auditLogger.exportToCSV(logs);

    // Generate filename with date range
    const startStr = filters.startDate
      ? filters.startDate.toISOString().split('T')[0]
      : 'all';
    const endStr = filters.endDate ? filters.endDate.toISOString().split('T')[0] : 'all';
    const filename = `CodeScribe_Audit_Report_${startStr}_to_${endStr}.csv`;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit statistics
 *
 * Query params:
 * - startDate: Start date (ISO string)
 * - endDate: End date (ISO string)
 */
router.get('/audit-logs/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    const [stats, activityByAction, topUsers] = await Promise.all([
      AuditLog.getStats(filters),
      AuditLog.getActivityByAction(filters),
      AuditLog.getTopUsers({ ...filters, limit: 10 }),
    ]);

    res.json({
      success: true,
      data: {
        stats,
        activityByAction,
        topUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics',
    });
  }
});

export default router;
