/**
 * Admin Routes
 * Protected endpoints for administrative access
 *
 * Security: All routes require authentication and admin privileges
 */

import express from 'express';
import { sql } from '@vercel/postgres';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Middleware to check if user is an admin
 * Add your email to the ADMIN_EMAILS list to grant admin access
 */
const requireAdmin = async (req, res, next) => {
  // List of admin emails (add your email here)
  const ADMIN_EMAILS = [
    //'your-email@example.com', // Replace with your actual email
    'jenni.m.coleman@gmail.com'
  ];

  try {
    // requireAuth only sets req.user.id, we need to fetch the full user object
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Fetch user from database to get email
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user's email is in admin list
    if (!ADMIN_EMAILS.includes(user.email)) {
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

    // 4. Get recent activity (last 50 records) - both anonymous and authenticated
    const [recentAnonymous, recentAuthenticated] = await Promise.all([
      sql`
        SELECT
          ip_address,
          daily_count,
          monthly_count,
          last_reset_date,
          period_start_date,
          created_at
        FROM anonymous_quotas
        WHERE period_start_date = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY last_reset_date DESC
        LIMIT 50
      `,
      sql`
        SELECT
          u.id as user_id,
          u.email,
          u.tier,
          COALESCE(uq.daily_count, 0) as daily_count,
          COALESCE(uq.monthly_count, 0) as monthly_count,
          COALESCE(uq.updated_at, u.created_at) as updated_at,
          uq.period_start_date,
          COALESCE(uq.created_at, u.created_at) as created_at
        FROM users u
        LEFT JOIN user_quotas uq ON u.id = uq.user_id
          AND uq.period_start_date = DATE_TRUNC('month', CURRENT_DATE)
        WHERE u.deleted_at IS NULL
          AND u.email NOT LIKE 'test-%'
          AND u.email NOT LIKE '%@example.com'
        ORDER BY COALESCE(uq.updated_at, u.created_at) DESC
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
      recentAnonymous: recentAnonymous.rows.map(row => ({
        ipAddress: row.ip_address,
        dailyCount: parseInt(row.daily_count),
        monthlyCount: parseInt(row.monthly_count),
        lastActivity: row.last_reset_date,
        periodStart: row.period_start_date,
        firstSeen: row.created_at
      })),
      recentAuthenticated: recentAuthenticated.rows.map(row => ({
        userId: row.user_id,
        email: row.email,
        tier: row.tier,
        dailyCount: parseInt(row.daily_count),
        monthlyCount: parseInt(row.monthly_count),
        lastActivity: row.updated_at,
        periodStart: row.period_start_date,
        firstSeen: row.created_at
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

export default router;
