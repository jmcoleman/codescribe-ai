/**
 * Trial Routes
 * User-facing endpoints for trial management
 */

import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import trialService from '../services/trialService.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/trials/status
 * Get current trial status for authenticated user
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await trialService.getTrialStatus(req.user.id);

    res.json({
      success: true,
      data: {
        hasActiveTrial: status.hasActiveTrial,
        trialTier: status.trialTier,
        daysRemaining: status.daysRemaining,
        endsAt: status.endsAt,
        startedAt: status.startedAt,
        durationDays: status.durationDays,
        isEligible: status.isEligible,
        eligibilityReason: status.eligibilityReason,
        source: status.source,
        wasExtended: status.wasExtended,
        originalEndsAt: status.originalEndsAt
      }
    });
  } catch (error) {
    console.error('[Trials] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial status'
    });
  }
});

/**
 * POST /api/trials/redeem
 * Redeem an invite code to start a trial
 */
router.post('/redeem', requireAuth, apiLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Invite code is required'
      });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    const result = await trialService.redeemInviteCode(normalizedCode, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Trial activated successfully!',
      data: {
        trialId: result.trialId,
        tier: result.trialTier,
        durationDays: result.durationDays,
        startedAt: result.startedAt,
        endsAt: result.endsAt
      }
    });
  } catch (error) {
    console.error('[Trials] Redeem error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid') || error.message.includes('expired') ||
        error.message.includes('exhausted') || error.message.includes('paused')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('already')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to redeem invite code'
    });
  }
});

/**
 * GET /api/trials/validate/:code
 * Validate an invite code without redeeming
 * Can be called without authentication (for signup flow)
 */
router.get('/validate/:code', optionalAuth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Invite code is required'
      });
    }

    const validation = await trialService.validateInviteCode(code);

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        reason: validation.reason || null,
        tier: validation.tier || null,
        durationDays: validation.durationDays || null
      }
    });
  } catch (error) {
    console.error('[Trials] Validate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate invite code'
    });
  }
});

/**
 * GET /api/trials/eligibility
 * Check if user is eligible for a trial
 */
router.get('/eligibility', requireAuth, async (req, res) => {
  try {
    const status = await trialService.getTrialStatus(req.user.id);

    res.json({
      success: true,
      data: {
        isEligible: status.isEligible,
        reason: status.eligibilityReason,
        hasActiveTrial: status.hasActiveTrial
      }
    });
  } catch (error) {
    console.error('[Trials] Eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check trial eligibility'
    });
  }
});

export default router;
