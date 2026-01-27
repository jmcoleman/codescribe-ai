/**
 * PHI Detection Routes
 * API endpoints for detecting Protected Health Information in code
 */

import express from 'express';
import { detectPHI } from '../services/phiDetector.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/phi/detect
 * Scan code for potential PHI
 *
 * Request body:
 * - code: string (required) - Code to scan
 *
 * Response:
 * - containsPHI: boolean
 * - confidence: string (none/low/medium/high)
 * - findings: object
 * - score: number (0-100)
 * - suggestions: array
 */
router.post('/detect', apiLimiter, (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Code is required and must be a string',
      });
    }

    if (code.length > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Code too large',
        message: 'Maximum code length is 100,000 characters',
      });
    }

    const result = detectPHI(code);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('PHI detection error:', error);
    res.status(500).json({
      success: false,
      error: 'PHI detection failed',
      message: error.message,
    });
  }
});

export default router;
