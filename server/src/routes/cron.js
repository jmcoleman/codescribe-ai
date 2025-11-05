/**
 * Cron Job Endpoints
 *
 * Provides HTTP endpoints for Vercel Cron Jobs to trigger scheduled tasks.
 * Secured with Bearer token authentication.
 *
 * Endpoints:
 * - POST /permanent-deletions - Triggers permanent user deletion job
 */

import express from 'express';
import { processPermanentDeletions } from '../jobs/permanentDeletionJob.js';

const router = express.Router();

/**
 * Vercel Cron authentication middleware
 * Verifies that the request comes from Vercel Cron using CRON_SECRET
 */
function verifyCronAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET environment variable not configured');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error'
    });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized cron request attempt');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  next();
}

/**
 * POST /permanent-deletions
 * Triggers the permanent deletion job for expired user accounts
 *
 * Called by Vercel Cron daily at 2:00 AM UTC
 *
 * @returns {Object} Job results with counts and errors
 */
router.post('/permanent-deletions', verifyCronAuth, async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('[Cron] Starting permanent deletion job via Vercel Cron');

    const results = await processPermanentDeletions();

    const duration = Date.now() - startTime;

    console.log(`[Cron] Permanent deletion job completed in ${duration}ms:`, results);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      results
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`[Cron] Permanent deletion job failed after ${duration}ms:`, error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration
    });
  }
});

export default router;
