/**
 * Admin Routes
 * Protected endpoints for administrative access
 *
 * Security: All routes require authentication and admin privileges
 */

import express from 'express';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import InviteCode from '../models/InviteCode.js';
import Trial from '../models/Trial.js';
import TrialEmailHistory from '../models/TrialEmailHistory.js';
import trialService from '../services/trialService.js';
import {
  sendTrialExtendedEmail,
  sendAccountSuspendedEmail,
  sendAccountUnsuspendedEmail,
  sendTrialGrantedByAdminEmail
} from '../services/emailService.js';
import {
  validateOverrideRequest,
  createOverridePayload,
  hasActiveOverride,
  getOverrideDetails
} from '../utils/tierOverride.js';
import { analyticsService } from '../services/analyticsService.js';
import TrialProgram from '../models/TrialProgram.js';
import { clearCampaignCache, getCampaignStatus } from '../config/trialProgram.js';
import AdminAuditLog from '../models/AdminAuditLog.js';

const router = express.Router();

/**
 * Roles that grant admin access
 */
const ADMIN_ROLES = ['admin', 'support', 'super_admin'];

/**
 * Middleware to check if user has admin privileges
 * Checks the user's role in the database (admin, support, or super_admin)
 */
const requireAdmin = async (req, res, next) => {
  try {
    // requireAuth only sets req.user.id, we need to fetch the full user object
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Fetch user from database to get role
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has an admin role
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Add full user object to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/usage-stats
 * Get comprehensive usage statistics for both anonymous and authenticated users
 *
 * Returns:
 * - Total counts (IPs, users, total usage)
 * - Last 24 hours activity
 * - Top IPs by usage
 * - Anonymous vs authenticated ratio
 * - Recent anonymous users (last 50)
 */
router.get('/usage-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // 1. Get total counts
    const [anonymousCounts, userCounts] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT ip_address) as total_ips,
          SUM(daily_count) as total_daily,
          SUM(monthly_count) as total_monthly
        FROM anonymous_quotas
        WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE)
      `,
      sql`
        SELECT
          COUNT(DISTINCT u.id) as total_users,
          COALESCE(SUM(uq.daily_count), 0) as total_daily,
          COALESCE(SUM(uq.monthly_count), 0) as total_monthly
        FROM users u
        LEFT JOIN user_quotas uq ON u.id = uq.user_id
          AND uq.period_start_date = DATE_TRUNC('month', CURRENT_DATE)
        WHERE u.deleted_at IS NULL
      `
    ]);

    // 2. Get last 24 hours activity (both anonymous and authenticated)
    const [last24HoursAnonymous, last24HoursAuthenticated] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT ip_address) as active_count,
          SUM(daily_count) as generations
        FROM anonymous_quotas
        WHERE last_reset_date >= NOW() - INTERVAL '24 hours'
      `,
      sql`
        SELECT
          COUNT(DISTINCT uq.user_id) as active_count,
          SUM(uq.daily_count) as generations
        FROM user_quotas uq
        JOIN users u ON uq.user_id = u.id
        WHERE uq.updated_at >= NOW() - INTERVAL '24 hours'
          AND u.deleted_at IS NULL
      `
    ]);

    const last24Hours = {
      activeAnonymous: parseInt(last24HoursAnonymous.rows[0]?.active_count || 0),
      activeAuthenticated: parseInt(last24HoursAuthenticated.rows[0]?.active_count || 0),
      anonymousGenerations: parseInt(last24HoursAnonymous.rows[0]?.generations || 0),
      authenticatedGenerations: parseInt(last24HoursAuthenticated.rows[0]?.generations || 0)
    };

    // 3. Get top users by usage (current billing period)
    // Sorted by THIS PERIOD usage (monthly_count), not lifetime
    // Note: Shows all users in current period with:
    //   - This Period: monthly_count for current billing period
    //   - All Time: total_generations maintained by database trigger (users only)
    //   - Anonymous IPs: monthly_count for current period (no lifetime tracking)
    const [topIPs, topUsers] = await Promise.all([
      sql`
        SELECT
          ip_address,
          monthly_count as this_period,
          monthly_count as total_generations,
          last_reset_date as last_activity
        FROM anonymous_quotas
        WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY monthly_count DESC
        LIMIT 10
      `,
      sql`
        SELECT
          uq.user_id,
          u.email,
          u.tier,
          uq.monthly_count as this_period,
          u.total_generations as all_time,
          uq.updated_at as last_activity
        FROM user_quotas uq
        JOIN users u ON uq.user_id = u.id
        WHERE u.deleted_at IS NULL
          AND u.email NOT LIKE 'test-%'
          AND u.email NOT LIKE '%@example.com'
          AND uq.period_start_date = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY this_period DESC
        LIMIT 10
      `
    ]);

    // 4. Get recent generations from generated_documents table (actual doc generations)
    // Note: generated_documents is only populated when user's save_docs_preference allows it
    // If empty, documents are being generated but not persisted (user preference = 'ask' or 'never')
    const [recentGenerations, generationsByDocType] = await Promise.all([
      // Recent 50 individual generations (all time, not filtered by month)
      sql`
        SELECT
          gd.id,
          gd.user_id,
          u.email,
          u.tier,
          gd.filename,
          gd.doc_type,
          gd.language,
          gd.origin,
          gd.quality_score,
          gd.generated_at
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND u.email NOT LIKE 'test-%'
          AND u.email NOT LIKE '%@example.com'
        ORDER BY gd.generated_at DESC
        LIMIT 50
      `,
      // Aggregated by user and doc type (all time)
      sql`
        SELECT
          gd.user_id,
          u.email,
          u.tier,
          COUNT(*) FILTER (WHERE gd.doc_type = 'README') as readme_count,
          COUNT(*) FILTER (WHERE gd.doc_type = 'JSDOC') as jsdoc_count,
          COUNT(*) FILTER (WHERE gd.doc_type = 'API') as api_count,
          COUNT(*) FILTER (WHERE gd.doc_type = 'OPENAPI') as openapi_count,
          COUNT(*) FILTER (WHERE gd.doc_type = 'ARCHITECTURE') as architecture_count,
          COUNT(*) as total_count,
          MAX(gd.generated_at) as last_generation
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND u.email NOT LIKE 'test-%'
          AND u.email NOT LIKE '%@example.com'
        GROUP BY gd.user_id, u.email, u.tier
        ORDER BY total_count DESC
        LIMIT 50
      `
    ]);

    // 5. Calculate ratios
    const totalAnonymous = parseInt(anonymousCounts.rows[0]?.total_monthly || 0);
    const totalAuthenticated = parseInt(userCounts.rows[0]?.total_monthly || 0);
    const totalGenerations = totalAnonymous + totalAuthenticated;

    const anonymousPercentage = totalGenerations > 0
      ? ((totalAnonymous / totalGenerations) * 100).toFixed(1)
      : 0;
    const authenticatedPercentage = totalGenerations > 0
      ? ((totalAuthenticated / totalGenerations) * 100).toFixed(1)
      : 0;

    // Format response
    const stats = {
      summary: {
        totalIPs: parseInt(anonymousCounts.rows[0]?.total_ips || 0),
        totalUsers: parseInt(userCounts.rows[0]?.total_users || 0),
        totalGenerations,
        anonymousGenerations: totalAnonymous,
        authenticatedGenerations: totalAuthenticated,
        anonymousPercentage: parseFloat(anonymousPercentage),
        authenticatedPercentage: parseFloat(authenticatedPercentage)
      },
      last24Hours: {
        activeAnonymous: last24Hours.activeAnonymous,
        activeAuthenticated: last24Hours.activeAuthenticated,
        totalActive: last24Hours.activeAnonymous + last24Hours.activeAuthenticated,
        anonymousGenerations: last24Hours.anonymousGenerations,
        authenticatedGenerations: last24Hours.authenticatedGenerations,
        totalGenerations: last24Hours.anonymousGenerations + last24Hours.authenticatedGenerations
      },
      topIPs: topIPs.rows.map(row => ({
        ipAddress: row.ip_address,
        thisPeriod: parseInt(row.this_period),
        totalGenerations: parseInt(row.total_generations),
        lastActivity: row.last_activity
      })),
      topUsers: topUsers.rows.map(row => ({
        userId: row.user_id,
        email: row.email,
        tier: row.tier,
        thisPeriod: parseInt(row.this_period),
        allTime: parseInt(row.all_time),
        lastActivity: row.last_activity
      })),
      // Recent individual generations (last 50)
      recentGenerations: recentGenerations.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        tier: row.tier,
        filename: row.filename,
        docType: row.doc_type,
        language: row.language,
        origin: row.origin,
        qualityScore: row.quality_score,
        generatedAt: row.generated_at
      })),
      // Generations by doc type per user (current month)
      generationsByUser: generationsByDocType.rows.map(row => ({
        userId: row.user_id,
        email: row.email,
        tier: row.tier,
        readme: parseInt(row.readme_count || 0),
        jsdoc: parseInt(row.jsdoc_count || 0),
        api: parseInt(row.api_count || 0),
        openapi: parseInt(row.openapi_count || 0),
        architecture: parseInt(row.architecture_count || 0),
        total: parseInt(row.total_count || 0),
        lastGeneration: row.last_generation
      }))
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: `Failed to fetch usage statistics: ${error.message}`
    });
  }
});

/**
 * GET /api/admin/usage-stats/ip/:ipAddress
 * Get detailed usage statistics for a specific IP address
 *
 * Useful for investigating specific anonymous users
 */
router.get('/usage-stats/ip/:ipAddress', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { ipAddress } = req.params;

    // Get all records for this IP (current + historical periods)
    const ipHistory = await sql`
      SELECT
        ip_address,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date,
        created_at,
        updated_at
      FROM anonymous_quotas
      WHERE ip_address = ${ipAddress}
      ORDER BY period_start_date DESC, last_reset_date DESC
    `;

    if (ipHistory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `No usage records found for IP: ${ipAddress}`
      });
    }

    // Calculate totals across all periods
    const totalGenerations = ipHistory.rows.reduce((sum, row) =>
      sum + parseInt(row.monthly_count), 0
    );
    const periodsActive = ipHistory.rows.length;
    const firstSeen = ipHistory.rows[ipHistory.rows.length - 1].created_at;
    const lastActivity = ipHistory.rows[0].last_reset_date;

    res.json({
      success: true,
      data: {
        ipAddress,
        summary: {
          totalGenerations,
          periodsActive,
          firstSeen,
          lastActivity
        },
        history: ipHistory.rows.map(row => ({
          periodStart: row.period_start_date,
          dailyCount: parseInt(row.daily_count),
          monthlyCount: parseInt(row.monthly_count),
          lastActivity: row.last_reset_date,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching IP usage stats:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: `Failed to fetch IP usage statistics: ${error.message}`
    });
  }
});

/**
 * POST /api/admin/tier-override
 * Apply tier override to current admin/support user
 *
 * Body:
 * - targetTier: string (free, starter, pro, team, enterprise)
 * - reason: string (min 10 characters)
 * - hoursValid: number (optional, default 4)
 *
 * Security: Only admin/support/super_admin roles
 */
router.post('/tier-override', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { targetTier, reason, hoursValid = 4 } = req.body;

    // Validate request
    validateOverrideRequest(req.user, targetTier, reason);

    // Apply override to database
    const updatedUser = await User.applyTierOverride(req.user.id, targetTier, reason, hoursValid);

    // Log to audit trail
    await sql`
      INSERT INTO user_audit_log (
        user_id,
        user_email,
        changed_by,
        field_name,
        old_value,
        new_value,
        reason
      ) VALUES (
        ${req.user.id},
        ${req.user.email},
        ${req.user.id},
        'tier_override',
        ${req.user.tier},
        ${JSON.stringify({
          targetTier,
          reason: reason.trim(),
          expiresAt: updatedUser.override_expires_at
        })},
        ${reason.trim()}
      )
    `;

    res.json({
      success: true,
      message: `Tier override applied: ${targetTier} for ${hoursValid} hours`,
      data: {
        override: {
          tier: updatedUser.viewing_as_tier,
          expiresAt: updatedUser.override_expires_at,
          reason: updatedUser.override_reason,
          appliedAt: updatedUser.override_applied_at
        }
      }
    });

  } catch (error) {
    console.error('Error applying tier override:', error);

    // Return validation errors with appropriate status
    if (error.message.includes('Only admin/support') || error.message.includes('Invalid tier') || error.message.includes('reason')) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to apply tier override'
    });
  }
});

/**
 * POST /api/admin/tier-override/clear
 * Clear active tier override and return to real tier
 *
 * Security: Only admin/support/super_admin roles
 */
router.post('/tier-override/clear', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Check if user has active override
    if (!hasActiveOverride(req.user)) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'No active tier override to clear'
      });
    }

    // Store old values for audit log
    const oldOverride = {
      tier: req.user.viewing_as_tier,
      expiresAt: req.user.override_expires_at
    };

    // Clear override in database
    const updatedUser = await User.clearTierOverride(req.user.id);

    // Log to audit trail
    await sql`
      INSERT INTO user_audit_log (
        user_id,
        user_email,
        changed_by,
        field_name,
        old_value,
        new_value,
        reason
      ) VALUES (
        ${req.user.id},
        ${req.user.email},
        ${req.user.id},
        'tier_override_cleared',
        ${JSON.stringify(oldOverride)},
        ${req.user.tier},
        'Tier override cleared by admin'
      )
    `;

    res.json({
      success: true,
      message: 'Tier override cleared successfully',
      data: {
        tier: updatedUser.tier
      }
    });

  } catch (error) {
    console.error('Error clearing tier override:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear tier override'
    });
  }
});

/**
 * GET /api/admin/tier-override/status
 * Get current tier override status
 *
 * Security: Only admin/support/super_admin roles
 */
router.get('/tier-override/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const overrideDetails = getOverrideDetails(req.user);

    if (!overrideDetails) {
      return res.json({
        success: true,
        data: {
          active: false,
          realTier: req.user.tier,
          effectiveTier: req.user.tier
        }
      });
    }

    res.json({
      success: true,
      data: {
        active: true,
        realTier: req.user.tier,
        effectiveTier: overrideDetails.tier,
        override: overrideDetails
      }
    });

  } catch (error) {
    console.error('Error fetching tier override status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch tier override status'
    });
  }
});

/**
 * GET /api/admin/tier-override/audit
 * Get tier override audit log for current user
 *
 * Returns last 50 tier override events
 *
 * Security: Only admin/support/super_admin roles
 */
router.get('/tier-override/audit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const auditLog = await sql`
      SELECT
        id,
        field_name,
        old_value,
        new_value,
        changed_at,
        changed_by
      FROM user_audit_log
      WHERE user_id = ${req.user.id}
        AND field_name = 'tier_override'
      ORDER BY changed_at DESC
      LIMIT 50
    `;

    const formattedLog = auditLog.rows.map(entry => ({
      id: entry.id,
      timestamp: entry.changed_at,
      action: entry.new_value === entry.old_value ? 'cleared' : 'applied',
      oldValue: entry.old_value,
      newValue: entry.new_value,
      changedBy: entry.changed_by
    }));

    res.json({
      success: true,
      data: {
        entries: formattedLog,
        count: formattedLog.length
      }
    });

  } catch (error) {
    console.error('Error fetching tier override audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch tier override audit log'
    });
  }
});

// ============================================================================
// INVITE CODE MANAGEMENT
// ============================================================================

/**
 * POST /api/admin/invite-codes
 * Create a new invite code
 */
router.post('/invite-codes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      trialTier = 'pro',
      durationDays = 14,
      maxUses = 1,
      validUntil = null,
      source = 'admin',
      campaign = null,
      notes = null
    } = req.body;

    // Validation
    if (!['pro', 'team', 'enterprise'].includes(trialTier)) {
      return res.status(400).json({
        success: false,
        error: 'Trial tier must be pro, team, or enterprise'
      });
    }

    if (durationDays < 1 || durationDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 90 days'
      });
    }

    // Parse validUntil as end-of-day UTC to ensure the code is valid for the entire selected day
    let validUntilDate = null;
    if (validUntil) {
      validUntilDate = new Date(validUntil + 'T23:59:59.999Z');
    }

    const inviteCode = await trialService.createInviteCode({
      trialTier,
      durationDays,
      maxUses,
      validUntil: validUntilDate,
      source,
      campaign,
      notes
    }, req.user.id);

    res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        inviteUrl: inviteCode.inviteUrl,
        tier: inviteCode.trial_tier,
        durationDays: inviteCode.duration_days,
        maxUses: inviteCode.max_uses,
        validUntil: inviteCode.valid_until
      }
    });
  } catch (error) {
    console.error('[Admin] Create invite code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invite code'
    });
  }
});

/**
 * GET /api/admin/invite-codes
 * List all invite codes (with pagination)
 */
router.get('/invite-codes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      tier,
      campaign,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const codes = await InviteCode.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null,
      tier: tier || null,
      campaign: campaign || null,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: {
        codes: codes.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: codes.total,
          totalPages: Math.ceil(codes.total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[Admin] List invite codes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invite codes'
    });
  }
});

/**
 * GET /api/admin/invite-codes/:code/stats
 * Get usage statistics for a specific invite code
 */
router.get('/invite-codes/:code/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const inviteCode = await InviteCode.findByCode(req.params.code);

    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        error: 'Invite code not found'
      });
    }

    const redemptions = await Trial.findByInviteCodeId(inviteCode.id);

    res.json({
      success: true,
      data: {
        code: inviteCode.code,
        tier: inviteCode.trial_tier,
        durationDays: inviteCode.duration_days,
        uses: inviteCode.current_uses,
        maxUses: inviteCode.max_uses,
        status: inviteCode.status,
        source: inviteCode.source,
        campaign: inviteCode.campaign,
        createdAt: inviteCode.created_at,
        validUntil: inviteCode.valid_until,
        redemptions: redemptions.map(t => ({
          userId: t.user_id,
          userEmail: t.user_email,
          startedAt: t.started_at,
          endsAt: t.ends_at,
          status: t.status,
          converted: t.status === 'converted',
          convertedToTier: t.converted_to_tier
        }))
      }
    });
  } catch (error) {
    console.error('[Admin] Get invite code stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invite code stats'
    });
  }
});

/**
 * PATCH /api/admin/invite-codes/:code
 * Update invite code (pause, extend validity, etc.)
 */
router.patch('/invite-codes/:code', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, maxUses, validUntil, notes } = req.body;

    // Validate status if provided
    if (status && !['active', 'paused', 'exhausted', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updated = await InviteCode.update(req.params.code, {
      status,
      maxUses,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Invite code not found'
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[Admin] Update invite code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invite code'
    });
  }
});

/**
 * DELETE /api/admin/invite-codes/:code
 * Delete an invite code (only if unused)
 */
router.delete('/invite-codes/:code', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await InviteCode.delete(req.params.code);

    if (!result.deleted) {
      const status = result.error === 'Invite code not found' ? 404 : 400;
      return res.status(status).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Invite code deleted'
    });
  } catch (error) {
    console.error('[Admin] Delete invite code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invite code'
    });
  }
});

// ============================================================================
// TRIAL MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/trials
 * List all trials (with pagination and filtering)
 */
router.get('/trials', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const trials = await Trial.getRecent({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null
    });

    res.json({
      success: true,
      data: trials.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: trials.total,
        totalPages: Math.ceil(trials.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Admin] List trials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trials'
    });
  }
});

/**
 * GET /api/admin/trials/analytics
 * Get trial analytics dashboard data
 * NOTE: This route MUST be before /trials/:userId to avoid matching "analytics" as userId
 */
router.get('/trials/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [trialAnalytics, emailStats] = await Promise.all([
      trialService.getAnalytics(),
      TrialEmailHistory.getStats()
    ]);

    res.json({
      success: true,
      data: {
        ...trialAnalytics,
        emailStats
      }
    });
  } catch (error) {
    console.error('[Admin] Trial analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial analytics'
    });
  }
});

/**
 * GET /api/admin/trials/:userId
 * Get trial details for a specific user
 */
router.get('/trials/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const trials = await Trial.findAllByUserId(userId);
    const status = await trialService.getTrialStatus(userId);

    res.json({
      success: true,
      data: {
        currentStatus: status,
        trialHistory: trials
      }
    });
  } catch (error) {
    console.error('[Admin] Get user trials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user trials'
    });
  }
});

/**
 * PATCH /api/admin/trials/:userId/extend
 * Extend a user's trial by adding days
 */
router.patch('/trials/:userId/extend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { additionalDays, reason, sendEmail = true } = req.body;

    if (!additionalDays || additionalDays < 1 || additionalDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Additional days must be between 1 and 90'
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    const extended = await trialService.extendTrial(userId, additionalDays, reason.trim());

    // Send notification email if requested
    let emailSent = false;
    if (sendEmail && extended) {
      try {
        // Get user info for email
        const user = await User.findById(userId);
        if (user && user.email) {
          await sendTrialExtendedEmail({
            to: user.email,
            userName: user.name || user.email.split('@')[0],
            trialTier: extended.trial_tier,
            additionalDays,
            newExpiresAt: extended.ends_at,
            reason: reason.trim()
          });
          emailSent = true;

          // Record email in history
          await TrialEmailHistory.createPending({
            trialId: extended.id,
            userId,
            emailType: TrialEmailHistory.EMAIL_TYPES.TRIAL_EXTENDED
          }).then(record => {
            if (record) TrialEmailHistory.markSent(record.id);
          });
        }
      } catch (emailError) {
        console.error('[Admin] Failed to send trial extension email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: `Trial extended by ${additionalDays} days`,
      data: {
        ...extended,
        emailSent
      }
    });
  } catch (error) {
    console.error('[Admin] Extend trial error:', error);

    if (error.message.includes('not have an active')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extend trial'
    });
  }
});

/**
 * POST /api/admin/trials/:userId/cancel
 * Cancel a user's trial early
 */
router.post('/trials/:userId/cancel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const cancelled = await trialService.endTrial(userId, 'cancel');

    res.json({
      success: true,
      message: 'Trial cancelled',
      data: cancelled
    });
  } catch (error) {
    console.error('[Admin] Cancel trial error:', error);

    if (error.message.includes('not have an active')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to cancel trial'
    });
  }
});

/**
 * GET /api/admin/trials/:trialId/emails
 * Get email history for a specific trial
 */
router.get('/trials/:trialId/emails', requireAuth, requireAdmin, async (req, res) => {
  try {
    const trialId = parseInt(req.params.trialId);
    const emails = await TrialEmailHistory.findByTrialId(trialId);

    res.json({
      success: true,
      data: emails
    });
  } catch (error) {
    console.error('[Admin] Get trial emails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial email history'
    });
  }
});

// ============================================================================
// Generation Analytics Endpoints
// ============================================================================

/**
 * GET /api/admin/generations
 * Get paginated list of recent generations with sorting and filtering
 *
 * Query params:
 * - page (default: 1)
 * - limit (default: 20, max: 100)
 * - sortBy (default: 'generated_at') - generated_at, filename, doc_type, quality_score
 * - sortOrder (default: 'desc') - asc, desc
 * - docType (filter) - README, JSDOC, API, OPENAPI, ARCHITECTURE
 * - userId (filter) - filter by specific user
 */
router.get('/generations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'generated_at',
      sortOrder = 'desc',
      docType,
      userId
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['generated_at', 'filename', 'doc_type', 'language', 'origin'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'generated_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Build dynamic query based on filters
    let dataQuery;
    let countQuery;

    if (docType && userId) {
      dataQuery = sql`
        SELECT
          gd.id,
          gd.user_id,
          u.email,
          u.tier,
          gd.filename,
          gd.doc_type,
          gd.language,
          gd.origin,
          gd.quality_score,
          gd.generated_at,
          gd.batch_id,
          gb.batch_type,
          gb.total_files as batch_total_files
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        LEFT JOIN generation_batches gb ON gd.batch_id = gb.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.doc_type = ${docType}
          AND gd.user_id = ${parseInt(userId)}
        ORDER BY gd.generated_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.doc_type = ${docType}
          AND gd.user_id = ${parseInt(userId)}
      `;
    } else if (docType) {
      dataQuery = sql`
        SELECT
          gd.id,
          gd.user_id,
          u.email,
          u.tier,
          gd.filename,
          gd.doc_type,
          gd.language,
          gd.origin,
          gd.quality_score,
          gd.generated_at,
          gd.batch_id,
          gb.batch_type,
          gb.total_files as batch_total_files
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        LEFT JOIN generation_batches gb ON gd.batch_id = gb.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.doc_type = ${docType}
        ORDER BY gd.generated_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.doc_type = ${docType}
      `;
    } else if (userId) {
      dataQuery = sql`
        SELECT
          gd.id,
          gd.user_id,
          u.email,
          u.tier,
          gd.filename,
          gd.doc_type,
          gd.language,
          gd.origin,
          gd.quality_score,
          gd.generated_at,
          gd.batch_id,
          gb.batch_type,
          gb.total_files as batch_total_files
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        LEFT JOIN generation_batches gb ON gd.batch_id = gb.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.user_id = ${parseInt(userId)}
        ORDER BY gd.generated_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND gd.user_id = ${parseInt(userId)}
      `;
    } else {
      dataQuery = sql`
        SELECT
          gd.id,
          gd.user_id,
          u.email,
          u.tier,
          gd.filename,
          gd.doc_type,
          gd.language,
          gd.origin,
          gd.quality_score,
          gd.generated_at,
          gd.batch_id,
          gb.batch_type,
          gb.total_files as batch_total_files
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        LEFT JOIN generation_batches gb ON gd.batch_id = gb.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ORDER BY gd.generated_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
          AND u.deleted_at IS NULL
      `;
    }

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        generations: dataResult.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          email: row.email,
          tier: row.tier,
          filename: row.filename,
          docType: row.doc_type,
          language: row.language,
          origin: row.origin,
          qualityScore: row.quality_score,
          generatedAt: row.generated_at,
          batchId: row.batch_id,
          batchType: row.batch_type,
          batchTotalFiles: row.batch_total_files
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('[Admin] Get generations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generations'
    });
  }
});

/**
 * GET /api/admin/generations/by-user
 * Get generation counts aggregated by user and doc type
 *
 * Query params:
 * - page (default: 1)
 * - limit (default: 20, max: 100)
 * - sortBy (default: 'total') - total, readme, jsdoc, api, openapi, architecture, last_generation
 * - sortOrder (default: 'desc') - asc, desc
 */
router.get('/generations/by-user', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'total',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Map frontend sort names to SQL columns
    const sortColumnMap = {
      total: 'total_count',
      readme: 'readme_count',
      jsdoc: 'jsdoc_count',
      api: 'api_count',
      openapi: 'openapi_count',
      architecture: 'architecture_count',
      last_generation: 'last_generation'
    };

    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get aggregated data
    const dataResult = await sql`
      SELECT
        gd.user_id,
        u.email,
        u.tier,
        COUNT(*) FILTER (WHERE gd.doc_type = 'README') as readme_count,
        COUNT(*) FILTER (WHERE gd.doc_type = 'JSDOC') as jsdoc_count,
        COUNT(*) FILTER (WHERE gd.doc_type = 'API') as api_count,
        COUNT(*) FILTER (WHERE gd.doc_type = 'OPENAPI') as openapi_count,
        COUNT(*) FILTER (WHERE gd.doc_type = 'ARCHITECTURE') as architecture_count,
        COUNT(*) as total_count,
        MAX(gd.generated_at) as last_generation
      FROM generated_documents gd
      JOIN users u ON gd.user_id = u.id
      WHERE gd.deleted_at IS NULL
        AND u.deleted_at IS NULL
      GROUP BY gd.user_id, u.email, u.tier
      ORDER BY total_count DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Get total count of unique users with generations
    const countResult = await sql`
      SELECT COUNT(DISTINCT gd.user_id) as total
      FROM generated_documents gd
      JOIN users u ON gd.user_id = u.id
      WHERE gd.deleted_at IS NULL
        AND u.deleted_at IS NULL
    `;

    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        users: dataResult.rows.map(row => ({
          userId: row.user_id,
          email: row.email,
          tier: row.tier,
          readme: parseInt(row.readme_count || 0),
          jsdoc: parseInt(row.jsdoc_count || 0),
          api: parseInt(row.api_count || 0),
          openapi: parseInt(row.openapi_count || 0),
          architecture: parseInt(row.architecture_count || 0),
          total: parseInt(row.total_count || 0),
          lastGeneration: row.last_generation
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('[Admin] Get generations by user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generation data'
    });
  }
});

// ============================================================================
// ANALYTICS DASHBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/analytics/funnel
 * Get conversion funnel metrics
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true) - Exclude admin/override users
 */
router.get('/analytics/funnel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const funnel = await analyticsService.getConversionFunnel({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      excludeInternal: excludeInternal === 'true',
    });

    res.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('[Admin] Get analytics funnel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch funnel metrics',
    });
  }
});

/**
 * GET /api/admin/analytics/conversion-funnel
 * Get business conversion funnel (Visitors → Signups → Trial → Paid)
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true)
 */
router.get('/analytics/conversion-funnel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const funnel = await analyticsService.getBusinessConversionFunnel({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      excludeInternal: excludeInternal === 'true',
    });

    res.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('[Admin] Get conversion funnel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversion funnel',
    });
  }
});

/**
 * GET /api/admin/analytics/business
 * Get business metrics (signups, upgrades, revenue)
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true)
 */
router.get('/analytics/business', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const metrics = await analyticsService.getBusinessMetrics({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      excludeInternal: excludeInternal === 'true',
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[Admin] Get analytics business error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business metrics',
    });
  }
});

/**
 * GET /api/admin/analytics/usage
 * Get usage pattern metrics
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true)
 * - model: string (optional) - Filter by LLM provider ('claude', 'openai', 'all')
 */
router.get('/analytics/usage', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true', model = 'all' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeInternalBool = excludeInternal === 'true';

    // Fetch usage patterns and retention metrics in parallel
    const [patterns, retentionMetrics] = await Promise.all([
      analyticsService.getUsagePatterns({
        startDate: start,
        endDate: end,
        excludeInternal: excludeInternalBool,
        model,
      }),
      analyticsService.getRetentionMetrics({
        startDate: start,
        endDate: end,
        excludeInternal: excludeInternalBool,
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...patterns,
        retentionMetrics,
      },
    });
  } catch (error) {
    console.error('[Admin] Get analytics usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage metrics',
    });
  }
});

/**
 * GET /api/admin/analytics/performance
 * Get LLM performance metrics (latency, cache hit rate, throughput)
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true)
 */
router.get('/analytics/performance', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeInternalBool = excludeInternal === 'true';

    // Fetch performance metrics, latency breakdown, and error metrics in parallel
    const [metrics, latencyBreakdown, errorMetrics] = await Promise.all([
      analyticsService.getPerformanceMetrics({
        startDate: start,
        endDate: end,
        excludeInternal: excludeInternalBool,
      }),
      analyticsService.getLatencyBreakdown({
        startDate: start,
        endDate: end,
        excludeInternal: excludeInternalBool,
      }),
      analyticsService.getErrorMetrics({
        startDate: start,
        endDate: end,
        excludeInternal: excludeInternalBool,
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...metrics,
        latencyBreakdown,
        errorMetrics,
      },
    });
  } catch (error) {
    console.error('[Admin] Get analytics performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance metrics',
    });
  }
});

/**
 * GET /api/admin/analytics/timeseries
 * Get time series data for a specific metric
 *
 * Query params:
 * - metric: string (required) - sessions, generations, signups, revenue, latency, cache_hit_rate, throughput
 * - interval: string (required) - day, week, month
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - excludeInternal: boolean (default: true)
 */
router.get('/analytics/timeseries', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { metric, interval, startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!metric || !interval || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'metric, interval, startDate, and endDate are required',
      });
    }

    const validMetrics = ['sessions', 'generations', 'signups', 'revenue', 'latency', 'cache_hit_rate', 'throughput', 'ttft', 'streaming_time'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      });
    }

    const validIntervals = ['day', 'week', 'month'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`,
      });
    }

    const timeSeries = await analyticsService.getTimeSeries({
      metric,
      interval,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      excludeInternal: excludeInternal === 'true',
    });

    res.json({
      success: true,
      data: timeSeries,
    });
  } catch (error) {
    console.error('[Admin] Get analytics timeseries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time series data',
    });
  }
});

/**
 * GET /api/admin/analytics/events
 * Get raw analytics events with pagination, filtering, and sorting
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - category: funnel | business | usage (optional)
 * - eventNames: comma-separated event names (optional, for multi-select filter)
 * - eventActions: JSON object for action filtering (optional)
 *   Format: {"tier_change":{"actionField":"action","actions":["upgrade","downgrade"]}}
 * - excludeInternal: boolean (optional, default false)
 * - page: number (optional, default 1)
 * - limit: number (optional, default 50, max 100)
 * - sortBy: string (optional, default 'createdAt') - Column to sort by
 * - sortOrder: 'asc' | 'desc' (optional, default 'desc')
 */
router.get('/analytics/events', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      eventNames,
      eventActions,
      excludeInternal,
      userEmail,
      page = '1',
      limit = '50',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    // Parse eventNames from comma-separated string to array
    const eventNameList = eventNames ? eventNames.split(',').filter(Boolean) : null;

    // Parse eventActions from JSON string
    let eventActionsParsed = null;
    if (eventActions) {
      try {
        eventActionsParsed = JSON.parse(eventActions);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid eventActions format - must be valid JSON',
        });
      }
    }

    const result = await analyticsService.getEvents({
      startDate: start,
      endDate: end,
      category: category || null,
      eventNames: eventNameList,
      eventActions: eventActionsParsed,
      excludeInternal: excludeInternal === 'true',
      userEmail: userEmail || null,
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Admin] Get analytics events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
    });
  }
});

/**
 * GET /api/admin/analytics/event-names
 * Get distinct event names with their actions for filter dropdown
 *
 * Response format:
 * {
 *   success: true,
 *   events: [
 *     { name: 'session_start', category: 'workflow' },
 *     { name: 'tier_change', category: 'business', actionField: 'action', actions: ['upgrade', 'downgrade', 'cancel'] },
 *     ...
 *   ]
 * }
 */
router.get('/analytics/event-names', requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = await analyticsService.getEventNames();
    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('[Admin] Get event names error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event names',
    });
  }
});

/**
 * GET /api/admin/analytics/events/export
 * Export analytics events as CSV with schema discovery
 *
 * Features:
 * - Two-pass schema discovery (discovers all JSONB keys first)
 * - Streaming I/O with cursor pagination (1000 rows/batch)
 * - Flattened JSONB columns with 'v_' prefix
 * - Max 100,000 rows, 90 days date range
 * - UTF-8 encoding, standard CSV escaping
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - category: funnel | business | usage (optional)
 * - eventNames: comma-separated event names (optional)
 * - excludeInternal: boolean (optional, default false)
 */
router.get('/analytics/events/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      eventNames,
      excludeInternal,
      userEmail,
    } = req.query;

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    // Validate date range (max 90 days)
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > analyticsService.EXPORT_LIMITS.MAX_DAYS) {
      return res.status(400).json({
        success: false,
        error: `Date range exceeds maximum of ${analyticsService.EXPORT_LIMITS.MAX_DAYS} days. Please narrow your date range.`,
      });
    }

    // Parse eventNames from comma-separated string to array
    const eventNameList = eventNames ? eventNames.split(',').filter(Boolean) : null;

    // Set streaming headers
    const filename = `analytics-export-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Transfer-Encoding', 'chunked');

    // Stream the export with schema discovery
    await analyticsService.streamEventsToCSV({
      startDate: start,
      endDate: end,
      category: category || null,
      eventNames: eventNameList,
      excludeInternal: excludeInternal === 'true',
      userEmail: userEmail || null,
      res,
    });

    res.end();
  } catch (error) {
    console.error('[Admin] Export analytics events error:', error);
    // If headers already sent, we can't send JSON error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to export events',
      });
    } else {
      res.end();
    }
  }
});

/**
 * GET /api/admin/analytics/comparisons
 * Get period-over-period comparisons for multiple metrics
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - metrics: comma-separated metric names (required)
 * - excludeInternal: boolean (optional, default true)
 *
 * Supported metrics:
 * - sessions, code_input, signups, revenue, generations, completed_sessions, doc_export
 * - avg_latency, cache_hit_rate, throughput
 * - errors, error_rate
 */
router.get('/analytics/comparisons', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, metrics, excludeInternal } = req.query;

    // Validate required params
    if (!startDate || !endDate || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'startDate, endDate, and metrics are required',
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    // Parse metrics from comma-separated string
    const metricList = metrics.split(',').map(m => m.trim()).filter(Boolean);
    if (metricList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one metric is required',
      });
    }

    // Fetch comparisons
    const comparisons = await analyticsService.getBulkComparisons({
      metrics: metricList,
      startDate: start,
      endDate: end,
      excludeInternal: excludeInternal !== 'false', // default true
    });

    res.json({
      success: true,
      data: comparisons,
    });
  } catch (error) {
    console.error('[Admin] Get analytics comparisons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metric comparisons',
    });
  }
});

/**
 * GET /api/admin/analytics/summary - Get summary metrics for Health at a Glance
 * Returns key metrics with current values and period-over-period changes
 */
router.get('/analytics/summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal } = req.query;

    // Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    // Fetch summary metrics
    const summary = await analyticsService.getSummaryMetrics({
      startDate: start,
      endDate: end,
      excludeInternal: excludeInternal !== 'false', // default true
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[Admin] Get analytics summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary metrics',
    });
  }
});

// ============================================================================
// CAMPAIGN MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/admin/trial-programs/status - Get current trial program status
 * Returns the active trial program (if any) and its configuration
 */
router.get('/trial-programs/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = await getCampaignStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[Admin] Get trial program status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trial program status',
    });
  }
});

/**
 * GET /api/admin/trial-programs - List all campaigns
 * Query params: page, limit, sortBy, sortOrder
 */
router.get('/trial-programs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '25',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    const result = await TrialProgram.list({
      limit: limitNum,
      offset,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum)
      }
    });
  } catch (error) {
    console.error('[Admin] List campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list campaigns',
    });
  }
});

/**
 * GET /api/admin/trial-programs/export - Export trial program metrics with trial breakdown
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), campaignSource (default: 'auto_campaign')
 *
 * Returns comprehensive trial program metrics including:
 * - Trial breakdown (trial program vs individual trials)
 * - Weekly aggregations
 * - Cohort summary (signups, verified, activated, trials, conversions)
 * - Spreadsheet-ready format
 */
router.get('/trial-programs/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, campaignSource = 'auto_campaign' } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required (YYYY-MM-DD format)',
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'startDate must be before endDate',
      });
    }

    // Get trial breakdown by source
    const trialBreakdown = await sql`
      SELECT
        source,
        COUNT(*) as trials_started,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
        ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC, 2) as conversion_rate,
        ROUND(AVG(CASE
          WHEN status = 'converted'
          THEN EXTRACT(EPOCH FROM (converted_at - started_at)) / 86400
        END)::NUMERIC, 1) as avg_days_to_convert
      FROM user_trials
      WHERE started_at >= ${startDate}
        AND started_at < ${endDate}
      GROUP BY source
      ORDER BY trials_started DESC
    `;

    // Separate campaign vs individual trials
    const campaignTrials = trialBreakdown.rows.find(t => t.source === campaignSource) || {
      source: campaignSource,
      trials_started: '0',
      conversions: '0',
      conversion_rate: '0',
      avg_days_to_convert: null
    };

    const individualTrials = trialBreakdown.rows.filter(t => t.source !== campaignSource);
    const individualTrialsTotal = individualTrials.reduce((acc, trial) => ({
      trials_started: acc.trials_started + parseInt(trial.trials_started),
      conversions: acc.conversions + parseInt(trial.conversions)
    }), { trials_started: 0, conversions: 0 });

    const individualConversionRate = individualTrialsTotal.trials_started > 0
      ? ((individualTrialsTotal.conversions / individualTrialsTotal.trials_started) * 100).toFixed(2)
      : '0';

    // Calculate campaign lift
    const campaignLift = parseFloat(individualConversionRate) > 0
      ? (((parseFloat(campaignTrials.conversion_rate) - parseFloat(individualConversionRate)) / parseFloat(individualConversionRate)) * 100).toFixed(1)
      : null;

    // Get cohort summary (signups, verified, activated in date range)
    const cohortSummary = await sql`
      SELECT
        COUNT(*) as total_signups,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN
          EXISTS (
            SELECT 1 FROM generated_documents gd
            WHERE gd.user_id = users.id AND gd.deleted_at IS NULL
          )
        THEN 1 END) as activated_users
      FROM users
      WHERE created_at >= ${startDate}
        AND created_at < ${endDate}
    `;

    // Get daily breakdown with origin type (direct, individual trial, or campaign name)
    const dailyMetrics = await sql`
      WITH user_origins AS (
        SELECT
          u.id,
          DATE(u.created_at) as date,
          u.email_verified,
          COALESCE(
            c.name,
            CASE
              WHEN ut.id IS NULL THEN 'Direct'
              WHEN ut.source = 'self_serve' AND ut.trial_program_id IS NULL THEN 'Individual Trial'
              ELSE 'Unknown'
            END
          ) as origin_type
        FROM users u
        LEFT JOIN user_trials ut ON u.id = ut.user_id
        LEFT JOIN trial_programs c ON ut.trial_program_id = c.id
        WHERE u.created_at >= ${startDate}
          AND u.created_at < ${endDate}
          AND u.role != 'admin'
      )
      SELECT
        date,
        origin_type,
        COUNT(*) as signups,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified
      FROM user_origins
      GROUP BY date, origin_type
      ORDER BY date, origin_type
    `;

    // ✨ NEW: Get time-to-value metrics
    const timeToValueMetrics = await sql`
      SELECT
        COUNT(CASE WHEN email_verified = true THEN 1 END) as total_verified,
        ROUND(AVG(CASE
          WHEN email_verified = true
          THEN EXTRACT(EPOCH FROM (email_verified_at - created_at)) / 3600
        END)::NUMERIC, 1) as avg_hours_to_verify,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY CASE
            WHEN email_verified = true
            THEN EXTRACT(EPOCH FROM (email_verified_at - created_at)) / 3600
          END
        )::NUMERIC, 1) as median_hours_to_verify,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM generated_documents gd
          WHERE gd.user_id = users.id AND gd.deleted_at IS NULL
        ) THEN 1 END) as total_activated
      FROM users
      WHERE created_at >= ${startDate}
        AND created_at < ${endDate}
        AND role != 'admin'
    `;

    // Get time to first generation
    const timeToFirstGen = await sql`
      SELECT
        COUNT(DISTINCT u.id) as activated_users,
        ROUND(AVG(EXTRACT(EPOCH FROM (first_gen.created_at - u.created_at)) / 3600)::NUMERIC, 1) as avg_hours_to_first_gen,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (first_gen.created_at - u.created_at)) / 3600
        )::NUMERIC, 1) as median_hours_to_first_gen
      FROM users u
      JOIN (
        SELECT user_id, MIN(created_at) as created_at
        FROM generated_documents
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) first_gen ON u.id = first_gen.user_id
      WHERE u.created_at >= ${startDate}
        AND u.created_at < ${endDate}
        AND u.role != 'admin'
    `;

    // ✨ NEW: Get usage segment breakdown
    const usageSegments = await sql`
      WITH segments AS (
        SELECT
          CASE
            WHEN monthly_count = 0 THEN 'No Usage'
            WHEN monthly_count BETWEEN 1 AND 9 THEN 'Light (1-9)'
            WHEN monthly_count BETWEEN 10 AND 49 THEN 'Engaged (10-49)'
            WHEN monthly_count BETWEEN 50 AND 99 THEN 'Power (50-99)'
            WHEN monthly_count >= 100 THEN 'Max (100+)'
          END as segment,
          u.id as user_id
        FROM user_quotas uq
        JOIN users u ON uq.user_id = u.id
        WHERE u.created_at >= ${startDate}
          AND u.created_at < ${endDate}
          AND u.role != 'admin'
      )
      SELECT
        segment,
        COUNT(*) as users,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::NUMERIC, 1) as percentage
      FROM segments
      GROUP BY segment
      ORDER BY
        CASE segment
          WHEN 'No Usage' THEN 1
          WHEN 'Light (1-9)' THEN 2
          WHEN 'Engaged (10-49)' THEN 3
          WHEN 'Power (50-99)' THEN 4
          WHEN 'Max (100+)' THEN 5
        END
    `;

    // Get user list with origin type and key dates
    const userList = await sql`
      SELECT
        u.email,
        u.first_name,
        u.last_name,
        u.tier,
        u.created_at,
        u.email_verified,
        u.email_verified_at,
        COALESCE(
          c.name,
          CASE
            WHEN ut.id IS NULL THEN 'Direct'
            WHEN ut.source = 'self_serve' AND ut.trial_program_id IS NULL THEN 'Individual Trial'
            ELSE 'Unknown'
          END
        ) as origin_type,
        ut.trial_tier,
        ut.started_at as trial_started_at,
        ut.ends_at as trial_ends_at,
        ut.status as trial_status,
        ut.converted_at as trial_converted_at,
        first_gen.first_generation_at,
        uq.monthly_count as usage_count
      FROM users u
      LEFT JOIN user_trials ut ON u.id = ut.user_id
      LEFT JOIN trial_programs c ON ut.trial_program_id = c.id
      LEFT JOIN (
        SELECT user_id, MIN(created_at) as first_generation_at
        FROM generated_documents
        WHERE deleted_at IS NULL
        GROUP BY user_id
      ) first_gen ON u.id = first_gen.user_id
      LEFT JOIN user_quotas uq ON u.id = uq.user_id
      WHERE u.created_at >= ${startDate}
        AND u.created_at < ${endDate}
        AND u.role != 'admin'
      ORDER BY u.created_at DESC
    `;

    // Get all trial programs active during this period
    let trialProgramsInfo = [];
    try {
      const trialProgramsResult = await sql`
        SELECT id, name, trial_tier, trial_days, starts_at, ends_at, is_active
        FROM trial_programs
        WHERE starts_at <= ${endDate}
          AND (ends_at IS NULL OR ends_at >= ${startDate})
        ORDER BY starts_at DESC
      `;

      trialProgramsInfo = trialProgramsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        trialTier: row.trial_tier,
        trialDays: row.trial_days,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        isActive: row.is_active
      }));
    } catch (trialProgramError) {
      console.log('[Trial Program Export] Error fetching trial programs:', trialProgramError);
    }

    // Build response
    const totalTrials = parseInt(campaignTrials.trials_started) + individualTrialsTotal.trials_started;
    const totalConversions = parseInt(campaignTrials.conversions) + individualTrialsTotal.conversions;
    const totalConversionRate = totalTrials > 0
      ? ((totalConversions / totalTrials) * 100).toFixed(2)
      : '0';

    const response = {
      trialProgram: {
        startDate,
        endDate,
        source: campaignSource,
        count: trialProgramsInfo.length,
        trialPrograms: trialProgramsInfo
      },

      summary: {
        total_signups: parseInt(cohortSummary.rows[0].total_signups),
        verified_users: parseInt(cohortSummary.rows[0].verified_users),
        activated_users: parseInt(cohortSummary.rows[0].activated_users),

        trials_breakdown: {
          trial_program_trials: {
            started: parseInt(campaignTrials.trials_started),
            converted: parseInt(campaignTrials.conversions),
            conversion_rate: parseFloat(campaignTrials.conversion_rate),
            avg_days_to_convert: campaignTrials.avg_days_to_convert ? parseFloat(campaignTrials.avg_days_to_convert) : null,
            source: campaignSource
          },

          individual_trials: {
            started: individualTrialsTotal.trials_started,
            converted: individualTrialsTotal.conversions,
            conversion_rate: parseFloat(individualConversionRate),

            by_source: individualTrials.map(trial => ({
              source: trial.source,
              trials_started: parseInt(trial.trials_started),
              conversions: parseInt(trial.conversions),
              conversion_rate: parseFloat(trial.conversion_rate),
              avg_days_to_convert: trial.avg_days_to_convert ? parseFloat(trial.avg_days_to_convert) : null
            }))
          },

          total_trials: {
            started: totalTrials,
            converted: totalConversions,
            conversion_rate: parseFloat(totalConversionRate)
          }
        },

        comparison: {
          trial_program_vs_individual: {
            trial_program_conversion_rate: parseFloat(campaignTrials.conversion_rate),
            individual_conversion_rate: parseFloat(individualConversionRate),
            trial_program_lift: campaignLift ? `${campaignLift > 0 ? '+' : ''}${campaignLift}%` : 'N/A',
            trial_program_performs_better: parseFloat(campaignTrials.conversion_rate) > parseFloat(individualConversionRate)
          },

          trial_source_distribution: totalTrials > 0 ? {
            trial_program_percentage: ((parseInt(campaignTrials.trials_started) / totalTrials) * 100).toFixed(1),
            individual_percentage: ((individualTrialsTotal.trials_started / totalTrials) * 100).toFixed(1)
          } : {
            trial_program_percentage: '0',
            individual_percentage: '0'
          }
        }
      },

      daily: dailyMetrics.rows.map(row => ({
        date: row.date,
        origin_type: row.origin_type,
        signups: parseInt(row.signups),
        verified: parseInt(row.verified)
      })),

      spreadsheet_ready: {
        trial_comparison: {
          trial_program_trials: {
            started: parseInt(campaignTrials.trials_started),
            converted: parseInt(campaignTrials.conversions),
            conversion_rate: parseFloat(campaignTrials.conversion_rate)
          },
          individual_trials: {
            started: individualTrialsTotal.trials_started,
            converted: individualTrialsTotal.conversions,
            conversion_rate: parseFloat(individualConversionRate)
          },
          total_trials: {
            started: totalTrials,
            converted: totalConversions,
            conversion_rate: parseFloat(totalConversionRate)
          },
          trial_program_lift: campaignLift
        },

        cohort_summary: {
          signups: parseInt(cohortSummary.rows[0].total_signups),
          verified: parseInt(cohortSummary.rows[0].verified_users),
          activated: parseInt(cohortSummary.rows[0].activated_users),
          verification_rate: cohortSummary.rows[0].total_signups > 0
            ? ((cohortSummary.rows[0].verified_users / cohortSummary.rows[0].total_signups) * 100).toFixed(1)
            : '0',
          activation_rate: cohortSummary.rows[0].verified_users > 0
            ? ((cohortSummary.rows[0].activated_users / cohortSummary.rows[0].verified_users) * 100).toFixed(1)
            : '0'
        },

        trial_funnel_summary: {
          trials_started: totalTrials,
          trials_converted: totalConversions,
          conversion_rate: totalTrials > 0
            ? ((totalConversions / totalTrials) * 100).toFixed(1)
            : '0'
        }
      },

      // ✨ NEW: Extended metrics (time-to-value and usage segments)
      extended_metrics: {
        time_to_value: {
          email_verification: {
            total_verified: parseInt(timeToValueMetrics.rows[0].total_verified || 0),
            avg_hours: timeToValueMetrics.rows[0].avg_hours_to_verify ? parseFloat(timeToValueMetrics.rows[0].avg_hours_to_verify) : null,
            median_hours: timeToValueMetrics.rows[0].median_hours_to_verify ? parseFloat(timeToValueMetrics.rows[0].median_hours_to_verify) : null,
            avg_days: timeToValueMetrics.rows[0].avg_hours_to_verify ? (parseFloat(timeToValueMetrics.rows[0].avg_hours_to_verify) / 24).toFixed(1) : null
          },
          first_generation: {
            total_activated: parseInt(timeToFirstGen.rows[0]?.activated_users || 0),
            avg_hours: timeToFirstGen.rows[0]?.avg_hours_to_first_gen ? parseFloat(timeToFirstGen.rows[0].avg_hours_to_first_gen) : null,
            median_hours: timeToFirstGen.rows[0]?.median_hours_to_first_gen ? parseFloat(timeToFirstGen.rows[0].median_hours_to_first_gen) : null,
            avg_days: timeToFirstGen.rows[0]?.avg_hours_to_first_gen ? (parseFloat(timeToFirstGen.rows[0].avg_hours_to_first_gen) / 24).toFixed(1) : null
          }
        },

        usage_segments: usageSegments.rows.map(row => ({
          segment: row.segment,
          users: parseInt(row.users),
          percentage: parseFloat(row.percentage)
        })),

        engagement_summary: {
          no_usage: parseInt(usageSegments.rows.find(r => r.segment === 'No Usage')?.users || 0),
          light_users: parseInt(usageSegments.rows.find(r => r.segment === 'Light (1-9)')?.users || 0),
          engaged_users: parseInt(usageSegments.rows.find(r => r.segment === 'Engaged (10-49)')?.users || 0),
          power_users: parseInt(usageSegments.rows.find(r => r.segment === 'Power (50-99)')?.users || 0),
          max_users: parseInt(usageSegments.rows.find(r => r.segment === 'Max (100+)')?.users || 0)
        }
      },

      // User list with full details for filtering/export
      user_list: userList.rows.map(row => ({
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        tier: row.tier,
        signup_date: row.created_at,
        email_verified: row.email_verified,
        email_verified_at: row.email_verified_at,
        origin_type: row.origin_type,
        trial_tier: row.trial_tier,
        trial_started_at: row.trial_started_at,
        trial_ends_at: row.trial_ends_at,
        trial_status: row.trial_status,
        trial_converted_at: row.trial_converted_at,
        first_generation_at: row.first_generation_at,
        usage_count: row.usage_count ? parseInt(row.usage_count) : 0
      }))
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('[Admin] Trial Program export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export trial program metrics'
    });
  }
});

/**
 * GET /api/admin/trial-programs/:id - Get trial program details with stats
 */
router.get('/trial-programs/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const trialProgram = await TrialProgram.getStats(parseInt(id, 10));

    if (!trialProgram) {
      return res.status(404).json({
        success: false,
        error: 'Trial Program not found',
      });
    }

    res.json({
      success: true,
      data: trialProgram,
    });
  } catch (error) {
    console.error('[Admin] Get trial program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trial program',
    });
  }
});

/**
 * POST /api/admin/trial-programs - Create a new trial program
 * Body: { name, description, trialTier, trialDays, startsAt, endsAt, isActive, autoEnroll, allowPreviousTrialUsers, cooldownDays }
 */
router.post('/trial-programs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      trialTier = 'pro',
      trialDays = 14,
      startsAt,
      endsAt,
      isActive = false,
      autoEnroll = false,
      allowPreviousTrialUsers = false,
      cooldownDays = 90,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Trial Program name is required',
      });
    }

    if (!['pro', 'team'].includes(trialTier)) {
      return res.status(400).json({
        success: false,
        error: 'Trial tier must be "pro" or "team"',
      });
    }

    if (trialDays < 1 || trialDays > 90) {
      return res.status(400).json({
        success: false,
        error: 'Trial days must be between 1 and 90',
      });
    }

    // Auto-enroll trials don't use eligibility settings (only for invite-only)
    // Force these to false/0 when auto-enroll is enabled
    const finalAllowPreviousTrialUsers = autoEnroll ? false : allowPreviousTrialUsers;
    const finalCooldownDays = autoEnroll ? 0 : cooldownDays;

    const trialProgram = await TrialProgram.create({
      name: name.trim(),
      description: description?.trim() || null,
      trialTier,
      trialDays,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive,
      autoEnroll,
      allowPreviousTrialUsers: finalAllowPreviousTrialUsers,
      cooldownDays: finalCooldownDays,
      createdByUserId: req.user.id,
    });

    // Clear cache if activating a trial program
    if (isActive) {
      clearCampaignCache();
    }

    // Audit log
    await AdminAuditLog.log({
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      action: 'create',
      resourceType: 'trial_program',
      resourceId: trialProgram.id,
      resourceName: trialProgram.name,
      oldValues: null,
      newValues: {
        name: trialProgram.name,
        description: trialProgram.description,
        trial_tier: trialProgram.trial_tier,
        trial_days: trialProgram.trial_days,
        starts_at: trialProgram.starts_at,
        ends_at: trialProgram.ends_at,
        is_active: trialProgram.is_active,
        auto_enroll: trialProgram.auto_enroll,
        allow_previous_trial_users: trialProgram.allow_previous_trial_users,
        cooldown_days: trialProgram.cooldown_days,
      },
      reason: null,
      metadata: {},
    });

    console.log(`[Admin] Trial Program created: ${trialProgram.id} "${trialProgram.name}" by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: trialProgram,
    });
  } catch (error) {
    console.error('[Admin] Create trial program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trial program',
    });
  }
});

/**
 * PUT /api/admin/trial-programs/:id - Update a trial program
 * Body: { name, description, trialTier, trialDays, startsAt, endsAt, isActive, autoEnroll, allowPreviousTrialUsers, cooldownDays }
 */
router.put('/trial-programs/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate trialTier if provided
    if (updates.trialTier && !['pro', 'team'].includes(updates.trialTier)) {
      return res.status(400).json({
        success: false,
        error: 'Trial tier must be "pro" or "team"',
      });
    }

    // Validate trialDays if provided
    if (updates.trialDays !== undefined && (updates.trialDays < 1 || updates.trialDays > 90)) {
      return res.status(400).json({
        success: false,
        error: 'Trial days must be between 1 and 90',
      });
    }

    // Parse dates if provided
    if (updates.startsAt) {
      updates.startsAt = new Date(updates.startsAt);
    }
    if (updates.endsAt) {
      updates.endsAt = new Date(updates.endsAt);
    }

    // Get old values for audit log
    const oldTrialProgram = await TrialProgram.findById(parseInt(id, 10));
    if (!oldTrialProgram) {
      return res.status(404).json({
        success: false,
        error: 'Trial Program not found',
      });
    }

    // Auto-enroll trials don't use eligibility settings (only for invite-only)
    // If enabling auto-enroll OR if already auto-enroll, clear eligibility settings
    const willBeAutoEnroll = updates.autoEnroll !== undefined ? updates.autoEnroll : oldTrialProgram.auto_enroll;
    if (willBeAutoEnroll) {
      // Force eligibility settings to false/0 when auto-enroll is enabled
      updates.allowPreviousTrialUsers = false;
      updates.cooldownDays = 0;
    }

    const trialProgram = await TrialProgram.update(parseInt(id, 10), updates);

    // Always clear cache on updates (active status might have changed)
    clearCampaignCache();

    // Audit log
    await AdminAuditLog.log({
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      action: 'update',
      resourceType: 'trial_program',
      resourceId: trialProgram.id,
      resourceName: trialProgram.name,
      oldValues: {
        name: oldTrialProgram.name,
        description: oldTrialProgram.description,
        trial_tier: oldTrialProgram.trial_tier,
        trial_days: oldTrialProgram.trial_days,
        starts_at: oldTrialProgram.starts_at,
        ends_at: oldTrialProgram.ends_at,
        is_active: oldTrialProgram.is_active,
        auto_enroll: oldTrialProgram.auto_enroll,
        allow_previous_trial_users: oldTrialProgram.allow_previous_trial_users,
        cooldown_days: oldTrialProgram.cooldown_days,
      },
      newValues: {
        name: trialProgram.name,
        description: trialProgram.description,
        trial_tier: trialProgram.trial_tier,
        trial_days: trialProgram.trial_days,
        starts_at: trialProgram.starts_at,
        ends_at: trialProgram.ends_at,
        is_active: trialProgram.is_active,
        auto_enroll: trialProgram.auto_enroll,
        allow_previous_trial_users: trialProgram.allow_previous_trial_users,
        cooldown_days: trialProgram.cooldown_days,
      },
      reason: null,
      metadata: { updated_fields: Object.keys(updates) },
    });

    console.log(`[Admin] Trial Program updated: ${trialProgram.id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: trialProgram,
    });
  } catch (error) {
    console.error('[Admin] Update trial program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update trial program',
    });
  }
});

/**
 * POST /api/admin/trial-programs/:id/toggle - Toggle trial program active status
 * Body: { isActive: boolean }
 */
router.post('/trial-programs/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean',
      });
    }

    // Get old values for audit log
    const oldTrialProgram = await TrialProgram.findById(parseInt(id, 10));
    if (!oldTrialProgram) {
      return res.status(404).json({
        success: false,
        error: 'Trial Program not found',
      });
    }

    const trialProgram = await TrialProgram.setActive(parseInt(id, 10), isActive);

    // Clear cache when toggling
    clearCampaignCache();

    // Audit log
    await AdminAuditLog.log({
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      action: isActive ? 'activate' : 'deactivate',
      resourceType: 'trial_program',
      resourceId: trialProgram.id,
      resourceName: trialProgram.name,
      oldValues: { is_active: oldTrialProgram.is_active },
      newValues: { is_active: trialProgram.is_active },
      reason: null,
      metadata: {},
    });

    console.log(`[Admin] Trial Program ${isActive ? 'activated' : 'deactivated'}: ${trialProgram.id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: trialProgram,
    });
  } catch (error) {
    console.error('[Admin] Toggle trial program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle trial program',
    });
  }
});

/**
 * DELETE /api/admin/trial-programs/:id - Delete a trial program
 * Only allows deletion if trial program has 0 signups
 */
router.delete('/trial-programs/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const trialProgramId = parseInt(id, 10);

    // Check if trial program exists and has signups
    const trialProgram = await TrialProgram.findById(trialProgramId);
    if (!trialProgram) {
      return res.status(404).json({
        success: false,
        error: 'Trial Program not found',
      });
    }

    if (trialProgram.signups_count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete trial program with existing signups. Deactivate it instead.',
      });
    }

    await TrialProgram.delete(trialProgramId);

    // Clear cache
    clearCampaignCache();

    // Audit log
    await AdminAuditLog.log({
      adminUserId: req.user.id,
      adminEmail: req.user.email,
      action: 'delete',
      resourceType: 'trial_program',
      resourceId: trialProgramId,
      resourceName: trialProgram.name,
      oldValues: {
        name: trialProgram.name,
        description: trialProgram.description,
        trial_tier: trialProgram.trial_tier,
        trial_days: trialProgram.trial_days,
        starts_at: trialProgram.starts_at,
        ends_at: trialProgram.ends_at,
        is_active: trialProgram.is_active,
        auto_enroll: trialProgram.auto_enroll,
        allow_previous_trial_users: trialProgram.allow_previous_trial_users,
        cooldown_days: trialProgram.cooldown_days,
        signups_count: trialProgram.signups_count,
        conversions_count: trialProgram.conversions_count,
      },
      newValues: null,
      reason: null,
      metadata: {},
    });

    console.log(`[Admin] Trial Program deleted: ${trialProgramId} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Trial Program deleted',
    });
  } catch (error) {
    console.error('[Admin] Delete trial program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete trial program',
    });
  }
});

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

/**
 * GET /api/admin/audit-logs - Get admin audit logs with filters
 * Query params: resourceType, resourceId, adminUserId, action, limit, offset
 */
router.get('/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      resourceType,
      resourceId,
      adminUserId,
      action,
      limit = 50,
      offset = 0,
    } = req.query;

    const result = await AdminAuditLog.list({
      resourceType,
      resourceId: resourceId ? parseInt(resourceId, 10) : null,
      adminUserId: adminUserId ? parseInt(adminUserId, 10) : null,
      action,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    console.error('[Admin] Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /api/admin/audit-logs/resource/:resourceType/:resourceId - Get audit history for a specific resource
 */
router.get('/audit-logs/resource/:resourceType/:resourceId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    const logs = await AdminAuditLog.getByResource(resourceType, parseInt(resourceId, 10));

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('[Admin] Get resource audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource audit logs',
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats - Get audit statistics
 * Query params: startDate, endDate
 */
router.get('/audit-logs/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await AdminAuditLog.getStats({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Admin] Get audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics',
    });
  }
});

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/admin/users - List all users with pagination and filtering
 * Query params:
 * - page: page number (default 1)
 * - limit: items per page (default 50)
 * - sortBy: column to sort by (default created_at)
 * - sortOrder: asc or desc (default desc)
 * - search: search by email, first_name, last_name
 * - tier: filter by tier
 * - role: filter by role
 * - status: filter by account status (active, suspended, deleted)
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search = '',
      tier = '',
      role = '',
      status = '' // no default - show all when not specified
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Search filter (email, first_name, last_name)
    if (search) {
      conditions.push(`(
        u.email ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Tier filter
    if (tier && tier !== 'all') {
      conditions.push(`u.tier = $${paramIndex}`);
      params.push(tier);
      paramIndex++;
    }

    // Role filter
    if (role && role !== 'all') {
      conditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    // Status filter
    if (status === 'active') {
      conditions.push(`u.suspended = FALSE AND u.deletion_scheduled_at IS NULL AND u.deleted_at IS NULL`);
    } else if (status === 'suspended') {
      conditions.push(`u.suspended = TRUE AND u.deleted_at IS NULL`);
    } else if (status === 'scheduled_for_deletion') {
      conditions.push(`u.deletion_scheduled_at IS NOT NULL AND u.deleted_at IS NULL`);
    } else if (status === 'deleted') {
      conditions.push(`u.deleted_at IS NOT NULL`);
    }
    // 'all' status - no condition added

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const allowedSortColumns = ['email', 'first_name', 'last_name', 'role', 'tier', 'created_at', 'total_generations', 'status'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);

    // Build ORDER BY clause (handle status field specially)
    const orderByClause = sortColumn === 'status'
      ? `ORDER BY
          CASE
            WHEN u.deleted_at IS NOT NULL THEN 4
            WHEN u.deletion_scheduled_at IS NOT NULL THEN 3
            WHEN u.suspended = TRUE THEN 2
            ELSE 1
          END ${sortDir}`
      : `ORDER BY u.${sortColumn} ${sortDir}`;

    // Get users with trial information
    const usersQuery = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.tier,
        u.email_verified,
        u.email_verified_at,
        u.suspended,
        u.suspended_at,
        u.suspension_reason,
        u.deletion_scheduled_at,
        u.deleted_at,
        u.total_generations,
        u.created_at,
        u.updated_at,
        ut.id as trial_id,
        ut.trial_tier,
        ut.status as trial_status,
        ut.ends_at as trial_ends_at
      FROM users u
      LEFT JOIN user_trials ut ON u.id = ut.user_id AND ut.status = 'active'
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await sql.query(usersQuery, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/users/stats - Get user statistics for dashboard cards
 */
router.get('/users/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE suspended = FALSE AND deletion_scheduled_at IS NULL AND deleted_at IS NULL) as active_users,
        COUNT(*) FILTER (WHERE role IN ('admin', 'support', 'super_admin')) as admin_users,
        COUNT(*) FILTER (WHERE suspended = TRUE AND deleted_at IS NULL) as suspended_users
      FROM users
    `;

    const trialQuery = `
      SELECT COUNT(DISTINCT user_id) as trial_users
      FROM user_trials
      WHERE status = 'active'
    `;

    const [statsResult, trialResult] = await Promise.all([
      sql.query(statsQuery),
      sql.query(trialQuery)
    ]);

    const stats = statsResult.rows[0];
    const trialUsers = parseInt(trialResult.rows[0].trial_users, 10);

    res.json({
      success: true,
      data: {
        total_users: parseInt(stats.total_users, 10),
        active_users: parseInt(stats.active_users, 10),
        admin_users: parseInt(stats.admin_users, 10),
        trial_users: trialUsers,
        suspended_users: parseInt(stats.suspended_users, 10)
      }
    });
  } catch (error) {
    console.error('[Admin] Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

/**
 * PATCH /api/admin/users/:userId/role - Update user role
 * Body: { role: 'user' | 'support' | 'admin' | 'super_admin', reason: string }
 */
router.patch('/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, reason } = req.body;

    // Validation
    if (!role || !ADMIN_ROLES.concat(['user']).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: user, support, admin, super_admin'
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    // Prevent admin from demoting themselves to user
    if (parseInt(userId, 10) === req.user.id && role === 'user') {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own role to "user". Ask another admin to do this.'
      });
    }

    // Get current user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const oldRole = user.role;

    // Update role
    await sql.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
      [role, userId]
    );

    // Log to audit table (will be automatically logged by trigger, but we add reason to metadata)
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'role',
        oldRole,
        role,
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({ admin_email: req.user.email })
      ]
    );

    console.log(`[Admin] User ${userId} role changed from ${oldRole} to ${role} by admin ${req.user.id}. Reason: ${reason}`);

    // Return updated user
    const updatedUser = await User.findById(parseInt(userId, 10));

    res.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('[Admin] Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

/**
 * POST /api/admin/users/:userId/suspend - Suspend user account
 * Body: { reason: string, duration_days?: number }
 */
router.post('/users/:userId/suspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validation
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    // Get user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already suspended
    if (user.suspended) {
      return res.status(400).json({
        success: false,
        error: 'User is already suspended'
      });
    }

    // Suspend account (lock account, preserve data indefinitely)
    await sql.query(
      `UPDATE users
       SET suspended = TRUE,
           suspended_at = NOW(),
           suspension_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason.trim(), userId]
    );

    // Log to audit table
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'suspended',
        'false',
        'true',
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          action: 'suspend'
        })
      ]
    );

    console.log(`[Admin] User ${userId} suspended by admin ${req.user.id}. Reason: ${reason}`);

    // Send suspension email notification
    try {
      await sendAccountSuspendedEmail({
        to: user.email,
        userName: user.first_name || user.email.split('@')[0],
        reason: reason.trim(),
        suspendedUntil: null // No deletion date for pure suspension
      });
    } catch (emailError) {
      console.error('[Admin] Failed to send suspension email:', emailError);
      // Don't fail the request if email fails - suspension still succeeded
    }

    // Return updated user
    const updatedUser = await User.findById(parseInt(userId, 10));

    res.json({
      success: true,
      data: updatedUser,
      message: 'User account suspended successfully'
    });
  } catch (error) {
    console.error('[Admin] Suspend user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user account'
    });
  }
});

/**
 * POST /api/admin/users/:userId/unsuspend - Unsuspend user account
 * Body: { reason: string }
 */
router.post('/users/:userId/unsuspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validation
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    // Get user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if suspended
    if (!user.suspended) {
      return res.status(400).json({
        success: false,
        error: 'User is not suspended'
      });
    }

    // Unsuspend account (restore access)
    await sql.query(
      `UPDATE users
       SET suspended = FALSE,
           suspended_at = NULL,
           suspension_reason = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Log to audit table
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'suspended',
        'true',
        'false',
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          action: 'unsuspend'
        })
      ]
    );

    console.log(`[Admin] User ${userId} unsuspended by admin ${req.user.id}. Reason: ${reason}`);

    // Send unsuspension email notification
    try {
      await sendAccountUnsuspendedEmail({
        to: user.email,
        userName: user.first_name || user.email.split('@')[0]
      });
    } catch (emailError) {
      console.error('[Admin] Failed to send unsuspension email:', emailError);
      // Don't fail the request if email fails - unsuspension still succeeded
    }

    // Return updated user
    const updatedUser = await User.findById(parseInt(userId, 10));

    res.json({
      success: true,
      data: updatedUser,
      message: 'User account unsuspended successfully'
    });
  } catch (error) {
    console.error('[Admin] Unsuspend user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsuspend user account'
    });
  }
});

/**
 * GET /api/admin/users/:userId/trial-history - Get user's trial history
 */
router.get('/users/:userId/trial-history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const trials = await Trial.findAllByUserId(parseInt(userId, 10));

    // Track analytics
    await analyticsService.track({
      eventName: 'admin_action',
      userId: req.user.id,
      metadata: {
        action: 'view_trial_history',
        target_user_id: parseInt(userId, 10),
        trial_count: trials.length,
        is_internal: true
      }
    });

    res.json({
      success: true,
      trials: trials.map(t => ({
        id: t.id,
        trial_tier: t.trial_tier,
        source: t.source,
        status: t.status,
        started_at: t.started_at,
        ends_at: t.ends_at,
        duration_days: t.duration_days,
        converted_at: t.converted_at,
        converted_to_tier: t.converted_to_tier,
        created_at: t.created_at
      }))
    });
  } catch (error) {
    console.error('[Admin] Trial history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial history'
    });
  }
});

/**
 * POST /api/admin/users/:userId/grant-trial - Grant trial to user
 * Body: { trial_tier: 'pro' | 'team', duration_days: number, reason: string, force?: boolean }
 */
router.post('/users/:userId/grant-trial', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { trial_tier, duration_days, reason, force } = req.body;

    // Validation
    if (!trial_tier || !['pro', 'team'].includes(trial_tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trial_tier. Must be "pro" or "team"'
      });
    }

    if (!duration_days || duration_days < 1 || duration_days > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid duration_days. Must be between 1 and 90'
      });
    }

    const minReasonLength = force ? 20 : 5;
    if (!reason || reason.trim().length < minReasonLength) {
      return res.status(400).json({
        success: false,
        error: `Reason is required (minimum ${minReasonLength} characters${force ? ' for forced grants' : ''})`
      });
    }

    // Get user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check eligibility (same as campaigns)
    const eligibility = await Trial.checkEligibility(parseInt(userId, 10));

    if (!eligibility.eligible && !force) {
      // Get trial history for context
      const trialHistory = await Trial.findAllByUserId(parseInt(userId, 10));

      return res.status(400).json({
        success: false,
        error: eligibility.reason,
        hasUsedTrial: true,
        canForce: true,
        trialHistory: trialHistory.map(t => ({
          tier: t.trial_tier,
          source: t.source,
          startedAt: t.started_at,
          endedAt: t.ends_at,
          status: t.status
        }))
      });
    }

    // If force=true, admin is overriding eligibility check
    if (force && !eligibility.eligible) {
      console.log(`[Admin] Force-granting trial to user ${userId} despite ineligibility. Admin: ${req.user.id}, Reason: ${reason}`);
    }

    // Create trial
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(duration_days, 10));

    const trial = await Trial.create({
      userId: parseInt(userId, 10),
      trialTier: trial_tier,
      durationDays: parseInt(duration_days, 10),
      source: force ? 'admin_grant_forced' : 'admin_grant'
    });

    // Get previous trial count for analytics
    const allTrials = await Trial.findAllByUserId(parseInt(userId, 10));
    const previousTrialCount = allTrials.length - 1; // Subtract the one we just created

    // Log action with force flag in metadata
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'trial',
        null,
        trial_tier,
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          trial_tier,
          duration_days: parseInt(duration_days, 10),
          trial_id: trial.id,
          action: 'grant_trial',
          forced: force || false, // Track if this was forced
          override_reason: force ? eligibility.reason : null,
          previous_trial_count: previousTrialCount
        })
      ]
    );

    // Track analytics
    await analyticsService.track({
      eventName: 'trial',
      userId: parseInt(userId, 10),
      metadata: {
        action: 'admin_grant_succeeded',
        forced: force || false,
        source: force ? 'admin_grant_forced' : 'admin_grant',
        tier: trial_tier,
        duration_days: parseInt(duration_days, 10),
        override_reason: force ? eligibility.reason : null,
        previous_trial_count: previousTrialCount,
        has_previous_trial: previousTrialCount > 0,
        is_internal: true
      }
    });

    console.log(`[Admin] Trial granted to user ${userId}: ${trial_tier} for ${duration_days} days by admin ${req.user.id}${force ? ' (FORCED)' : ''}. Reason: ${reason}`);

    // Send trial granted email notification
    try {
      await sendTrialGrantedByAdminEmail({
        to: user.email,
        userName: user.first_name || user.email.split('@')[0],
        trialTier: trial_tier,
        durationDays: parseInt(duration_days, 10),
        expiresAt: endsAt
      });
    } catch (emailError) {
      console.error('[Admin] Failed to send trial granted email:', emailError);
      // Don't fail the request if email fails - trial grant still succeeded
    }

    res.json({
      success: true,
      data: trial,
      message: 'Trial granted successfully'
    });
  } catch (error) {
    console.error('[Admin] Grant trial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant trial'
    });
  }
});

/**
 * POST /api/admin/users/:userId/schedule-deletion - Schedule user account for deletion
 * Body: { reason: string, duration_days?: number }
 */
router.post('/users/:userId/schedule-deletion', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration_days } = req.body;

    // Validation
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    // Get user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already scheduled for deletion
    if (user.deletion_scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'User account is already scheduled for deletion'
      });
    }

    // Calculate deletion date (duration_days or default 30 days)
    const days = duration_days ? parseInt(duration_days, 10) : 30;
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + days);

    // Schedule deletion
    await sql.query(
      `UPDATE users
       SET deletion_scheduled_at = $1,
           deletion_reason = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [deletionDate, reason.trim(), userId]
    );

    // Log to audit table
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'deletion_scheduled_at',
        null,
        deletionDate.toISOString(),
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          duration_days: days,
          action: 'schedule_deletion'
        })
      ]
    );

    console.log(`[Admin] User ${userId} scheduled for deletion in ${days} days by admin ${req.user.id}. Reason: ${reason}`);

    // TODO: Send deletion scheduled email notification (if we create a specific template for admin-initiated deletion)

    // Return updated user
    const updatedUser = await User.findById(parseInt(userId, 10));

    res.json({
      success: true,
      data: updatedUser,
      message: `Account scheduled for deletion in ${days} days`
    });
  } catch (error) {
    console.error('[Admin] Schedule deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule account deletion'
    });
  }
});

/**
 * POST /api/admin/users/:userId/cancel-deletion - Cancel scheduled deletion
 * Body: { reason: string }
 */
router.post('/users/:userId/cancel-deletion', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validation
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required (minimum 5 characters)'
      });
    }

    // Get user
    const user = await User.findById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if scheduled for deletion
    if (!user.deletion_scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'User account is not scheduled for deletion'
      });
    }

    const oldDeletionDate = user.deletion_scheduled_at;

    // Cancel deletion
    await sql.query(
      `UPDATE users
       SET deletion_scheduled_at = NULL,
           deletion_reason = NULL,
           restore_token = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Log to audit table
    await sql.query(
      `INSERT INTO user_audit_log (user_id, user_email, field_name, old_value, new_value, change_type, changed_by, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        user.email,
        'deletion_scheduled_at',
        oldDeletionDate.toISOString(),
        null,
        'update',
        req.user.id,
        reason.trim(),
        JSON.stringify({
          admin_email: req.user.email,
          action: 'cancel_deletion'
        })
      ]
    );

    console.log(`[Admin] Deletion cancelled for user ${userId} by admin ${req.user.id}. Reason: ${reason}`);

    // Return updated user
    const updatedUser = await User.findById(parseInt(userId, 10));

    res.json({
      success: true,
      data: updatedUser,
      message: 'Deletion cancelled successfully'
    });
  } catch (error) {
    console.error('[Admin] Cancel deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel deletion'
    });
  }
});

export default router;
