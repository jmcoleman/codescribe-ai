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
import { sendTrialExtendedEmail } from '../services/emailService.js';
import {
  validateOverrideRequest,
  createOverridePayload,
  hasActiveOverride,
  getOverrideDetails
} from '../utils/tierOverride.js';
import { analyticsService } from '../services/analyticsService.js';

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
        changed_by_id,
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
        changed_by_id,
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
 */
router.get('/analytics/usage', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, excludeInternal = 'true' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const patterns = await analyticsService.getUsagePatterns({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      excludeInternal: excludeInternal === 'true',
    });

    res.json({
      success: true,
      data: patterns,
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
 * GET /api/admin/analytics/timeseries
 * Get time series data for a specific metric
 *
 * Query params:
 * - metric: string (required) - sessions, generations, signups, revenue
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

    const validMetrics = ['sessions', 'generations', 'signups', 'revenue'];
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
 * Get raw analytics events with pagination and filtering
 *
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - category: funnel | business | usage (optional)
 * - eventName: string (optional)
 * - excludeInternal: boolean (optional, default false)
 * - page: number (optional, default 1)
 * - limit: number (optional, default 50, max 100)
 */
router.get('/analytics/events', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      eventName,
      excludeInternal,
      page = '1',
      limit = '50',
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

    const result = await analyticsService.getEvents({
      startDate: start,
      endDate: end,
      category: category || null,
      eventName: eventName || null,
      excludeInternal: excludeInternal === 'true',
      page: pageNum,
      limit: limitNum,
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
 * Get distinct event names for filter dropdown
 */
router.get('/analytics/event-names', requireAuth, requireAdmin, async (req, res) => {
  try {
    const eventNames = await analyticsService.getEventNames();
    res.json({
      success: true,
      eventNames,
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
 * Export analytics events as CSV
 *
 * Query params same as /events endpoint
 */
router.get('/analytics/events/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      eventName,
      excludeInternal,
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

    // Fetch all events (up to 10000 for export)
    const result = await analyticsService.getEvents({
      startDate: start,
      endDate: end,
      category: category || null,
      eventName: eventName || null,
      excludeInternal: excludeInternal === 'true',
      page: 1,
      limit: 10000,
    });

    // Build CSV
    const headers = ['Timestamp', 'Event Name', 'Category', 'Session ID', 'User ID', 'User Email', 'IP Address', 'Internal', 'Event Data'];
    const rows = result.events.map((event) => [
      event.createdAt.toISOString(),
      event.eventName,
      event.category,
      event.sessionId || '',
      event.userId || '',
      event.userEmail || '',
      event.ipAddress || '',
      event.isInternal ? 'Yes' : 'No',
      JSON.stringify(event.eventData),
    ]);

    // Escape CSV values
    const escapeCSV = (value) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Send as downloadable file
    const filename = `analytics-events-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('[Admin] Export analytics events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export events',
    });
  }
});

export default router;
