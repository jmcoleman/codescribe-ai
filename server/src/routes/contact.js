/**
 * Contact Routes
 *
 * Handles contact form submissions (sales inquiries, support, etc.)
 */

import express from 'express';
import { requireAuth, validateBody } from '../middleware/auth.js';
import { sendContactSalesEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/contact/sales - Send sales inquiry email
 *
 * Requires authentication to prevent spam and to know who is contacting
 */
router.post(
  '/sales',
  requireAuth,
  validateBody({
    tier: { required: true, type: 'string' },
    message: { required: false, type: 'string' },
    firstName: { required: false, type: 'string' },
    lastName: { required: false, type: 'string' }
  }),
  async (req, res) => {
    try {
      const { tier, message, firstName, lastName } = req.body;
      const user = req.user;

      // Validate tier is enterprise or team
      if (!['enterprise', 'team'].includes(tier.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier. Must be "enterprise" or "team".'
        });
      }

      // Get user's full name (prefer provided name if user doesn't have one)
      let userName = '';
      if (user.first_name && user.last_name) {
        // Use existing name from database
        userName = `${user.first_name} ${user.last_name}`.trim();
      } else if (firstName && lastName) {
        // Use name provided in form
        userName = `${firstName.trim()} ${lastName.trim()}`;
      } else {
        // Fallback to partial name or empty
        userName = user.first_name || user.last_name || '';
      }

      // Send email via Resend
      await sendContactSalesEmail({
        userName,
        userEmail: user.email,
        userId: user.id,
        currentTier: user.tier || 'free',
        interestedTier: tier.toLowerCase(),
        message: message || ''
      });

      console.log(`[Contact Sales] Inquiry sent from ${user.email} for ${tier} plan`);

      res.json({
        success: true,
        message: 'Your inquiry has been sent to our sales team. We\'ll be in touch soon!'
      });
    } catch (error) {
      console.error('Contact sales error:', error);

      // Handle Resend rate limiting
      if (error.code === 'RESEND_RATE_LIMIT') {
        return res.status(503).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to send inquiry. Please try again or email sales@codescribeai.com directly.'
      });
    }
  }
);

export default router;
