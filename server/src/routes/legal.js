/**
 * Legal Routes
 * Endpoints for Terms of Service and Privacy Policy acceptance
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  needsLegalReacceptance,
} from '../constants/legalVersions.js';

const router = express.Router();

/**
 * GET /api/legal/versions
 * Get current versions of legal documents
 * Public endpoint - no authentication required
 */
router.get('/versions', (_req, res) => {
  res.json({
    terms: {
      version: CURRENT_TERMS_VERSION,
      effective_date: CURRENT_TERMS_VERSION, // ISO date format
      url: '/terms',
    },
    privacy: {
      version: CURRENT_PRIVACY_VERSION,
      effective_date: CURRENT_PRIVACY_VERSION, // ISO date format
      url: '/privacy',
    },
  });
});

/**
 * GET /api/legal/status
 * Check if current user needs to re-accept legal documents
 * Requires authentication
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    // Prevent caching of user-specific data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Fetch full user record from database (req.user from JWT only has id)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const reacceptance = needsLegalReacceptance(user);

    res.json({
      needs_reacceptance: reacceptance.needsAny,
      details: {
        terms: {
          needs_acceptance: reacceptance.needsTerms,
          current_version: CURRENT_TERMS_VERSION,
          accepted_version: user.terms_version_accepted || null,
          accepted_at: user.terms_accepted_at || null,
        },
        privacy: {
          needs_acceptance: reacceptance.needsPrivacy,
          current_version: CURRENT_PRIVACY_VERSION,
          accepted_version: user.privacy_version_accepted || null,
          accepted_at: user.privacy_accepted_at || null,
        },
      },
    });
  } catch (error) {
    console.error('Error checking legal status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check legal status',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while processing your request'
        : error.message,
    });
  }
});

/**
 * POST /api/legal/accept
 * Record user's acceptance of current legal documents
 * Requires authentication
 *
 * Body: {
 *   accept_terms: true,      // Must be true
 *   accept_privacy: true     // Must be true
 * }
 */
router.post('/accept', requireAuth, async (req, res) => {
  try {
    const { accept_terms, accept_privacy } = req.body;

    // Validate that user explicitly accepted both
    if (!accept_terms || !accept_privacy) {
      return res.status(400).json({
        error: 'Both Terms of Service and Privacy Policy must be accepted',
        required: {
          accept_terms: true,
          accept_privacy: true,
        },
      });
    }

    // Record acceptance in database
    const updatedUser = await User.acceptLegalDocuments(
      req.user.id,
      CURRENT_TERMS_VERSION,
      CURRENT_PRIVACY_VERSION
    );

    res.json({
      success: true,
      message: 'Legal documents accepted successfully',
      acceptance: {
        terms: {
          version: updatedUser.terms_version_accepted,
          accepted_at: updatedUser.terms_accepted_at,
        },
        privacy: {
          version: updatedUser.privacy_version_accepted,
          accepted_at: updatedUser.privacy_accepted_at,
        },
      },
    });
  } catch (error) {
    console.error('Error accepting legal documents:', error);
    res.status(500).json({
      error: 'Failed to record legal acceptance',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred while processing your request'
        : error.message,
    });
  }
});

export default router;
