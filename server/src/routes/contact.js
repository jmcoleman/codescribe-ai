/**
 * Contact Routes
 *
 * Handles contact form submissions (sales inquiries, support, etc.)
 */

import express from 'express';
import multer from 'multer';
import { requireAuth, validateBody } from '../middleware/auth.js';
import { sendContactSalesEmail, sendSupportEmail } from '../services/emailService.js';
import User from '../models/User.js';

const router = express.Router();

// Configure multer for file attachments (support requests only)
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for support attachments
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'text/plain',
      'text/csv',
      // Archives (for logs, etc.)
      'application/zip',
      'application/x-zip-compressed',
      // Code files
      'text/javascript',
      'application/json',
      'text/html',
      'text/css'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: images, PDF, text, JSON, ZIP`), false);
    }
  }
});

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
    subject: { required: false, type: 'string' },
    message: { required: false, type: 'string' },
    firstName: { required: false, type: 'string' },
    lastName: { required: false, type: 'string' }
  }),
  async (req, res) => {
    try {
      const { tier, subject, message, firstName, lastName } = req.body;

      // Fetch full user object from database
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

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
        // Use existing name from database (trim each part to handle extra whitespace)
        userName = `${user.first_name.trim()} ${user.last_name.trim()}`;
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
        subject: subject || '',
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

/**
 * POST /api/contact/support - Send support request email
 *
 * Requires authentication to prevent spam and to know who is contacting
 * Supports file attachments (images, PDFs, text files, etc.)
 */
router.post(
  '/support',
  requireAuth,
  attachmentUpload.array('attachments', 5), // Accept up to 5 files
  validateBody({
    contactType: { required: true, type: 'string' },
    subjectText: { required: false, type: 'string' },
    message: { required: true, type: 'string' }
  }),
  async (req, res) => {
    console.log('\n[Contact Support] New request received');
    console.log('[Contact Support] User ID:', req.user?.id);
    console.log('[Contact Support] Body:', req.body);
    console.log('[Contact Support] Files:', req.files?.length || 0);

    try {
      const { contactType, subjectText, message } = req.body;

      // Fetch full user object from database
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      console.log('[Contact Support] User:', user.email);
      console.log('[Contact Support] Parsed - Type:', contactType, 'Message length:', message?.length);

      // Validate contact type
      const validContactTypes = ['general', 'bug', 'feature', 'account', 'billing', 'other'];
      if (!validContactTypes.includes(contactType.toLowerCase())) {
        console.log('[Contact Support] Invalid contact type:', contactType);
        return res.status(400).json({
          success: false,
          error: 'Invalid contact type.'
        });
      }

      // Build user information from authenticated user
      const userName = user.first_name && user.last_name
        ? `${user.first_name.trim()} ${user.last_name.trim()}`
        : user.first_name || user.last_name || '';
      const userEmail = user.email;
      const userId = user.id;
      const currentTier = user.tier || 'free';

      // Process attachments if any
      // Note: Resend expects 'content_type' (snake_case), not 'contentType'
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        content_type: file.mimetype
      })) : [];

      // Send email via Resend
      await sendSupportEmail({
        userName,
        userEmail,
        userId,
        currentTier,
        contactType: contactType.toLowerCase(),
        subjectText: subjectText || '',
        message,
        attachments
      });

      console.log(`[Contact Support] Request sent from ${userEmail} - Type: ${contactType}${subjectText ? ` - "${subjectText}"` : ''}${attachments.length > 0 ? ` - ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}` : ''}`);

      res.json({
        success: true,
        message: 'Your support request has been sent. We\'ll get back to you as soon as possible!'
      });
    } catch (error) {
      console.error('Contact support error:', error);

      // Handle multer errors (file too large, wrong type, etc.)
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum size is 10MB per file.'
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files. Maximum 5 files allowed.'
          });
        }
        return res.status(400).json({
          success: false,
          error: `File upload error: ${error.message}`
        });
      }

      // Handle file type errors
      if (error.message && error.message.includes('File type not allowed')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Handle Resend rate limiting
      if (error.code === 'RESEND_RATE_LIMIT') {
        return res.status(503).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to send support request. Please try again or email support@codescribeai.com directly.'
      });
    }
  }
);

export default router;
