/**
 * Integration tests for Contact Sales API endpoint
 * Tests authentication, validation, name resolution, and email sending
 *
 * Epic: 2.4 - Payment Integration (Contact Sales Feature)
 * Related: SUBSCRIPTION-FLOWS.md, ContactSalesModal.jsx
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Track what schemas validateBody was called with (use object to avoid TDZ)
// Since we have multiple routes (/sales and /support), we need to track all schemas
const capturedState = { schemas: [] };

// Mock dependencies BEFORE importing routes
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: jest.fn((req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()), // Added for /support endpoint
  validateBody: jest.fn((schema) => {
    capturedState.schemas.push(schema); // Capture all schemas for test assertions
    return (req, res, next) => next();
  }),
}));

jest.mock('../../services/emailService.js', () => ({
  sendContactSalesEmail: jest.fn().mockResolvedValue({ success: true }),
  sendSupportEmail: jest.fn().mockResolvedValue({ success: true }), // Added for /support endpoint
}));

// Now import routes and mocked modules
import contactRouter from '../contact.js';
import { requireAuth, validateBody } from '../../middleware/auth.js';
import { sendContactSalesEmail } from '../../services/emailService.js';

describe('Contact Sales Routes', () => {
  let app;
  let mockUser;

  beforeEach(() => {
    // Create Express app with contact routes
    app = express();
    app.use(express.json());
    app.use('/api/contact', contactRouter);

    // Reset mocks
    jest.clearAllMocks();

    // Default mock user (no name)
    mockUser = {
      id: 1,
      email: 'user@example.com',
      tier: 'free',
    };

    // Mock requireAuth to add user to request
    requireAuth.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Mock validateBody to pass through
    validateBody.mockImplementation(() => (req, res, next) => next());

    // Mock email service
    sendContactSalesEmail.mockResolvedValue({ success: true });
  });

  describe('POST /api/contact/sales', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise', message: 'Test' });

        expect(requireAuth).toHaveBeenCalled();
      });
    });

    describe('Tier Validation', () => {
      it('should accept enterprise tier', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise', message: 'Interested in enterprise plan' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should accept team tier', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'team', message: 'Interested in team plan' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject invalid tier (pro)', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'pro', message: 'Test' });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid tier/i);
      });

      it('should reject invalid tier (free)', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'free', message: 'Test' });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid tier/i);
      });

      it('should handle case-insensitive tier names', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'ENTERPRISE', message: 'Test' });

        expect(response.status).toBe(200);
        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            interestedTier: 'enterprise', // Lowercased
          })
        );
      });
    });

    describe('Name Resolution - User Has Name', () => {
      beforeEach(() => {
        mockUser = {
          id: 1,
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          tier: 'free',
        };
        requireAuth.mockImplementation((req, res, next) => {
          req.user = mockUser;
          next();
        });
      });

      it('should use database name when user has full name', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Interested in enterprise plan',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith({
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userId: 1,
          currentTier: 'free',
          interestedTier: 'enterprise',
          message: 'Interested in enterprise plan',
        });
      });

      it('should use database name even if form name provided', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'team',
            message: 'Test',
            firstName: 'Jane',
            lastName: 'Smith',
          });

        // Should use John Doe from database, not Jane Smith from form
        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'John Doe',
          })
        );
      });

      it('should trim whitespace from database name', async () => {
        mockUser.first_name = '  John  ';
        mockUser.last_name = '  Doe  ';

        await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise', message: 'Test' });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'John Doe', // Each part trimmed individually
          })
        );
      });
    });

    describe('Name Resolution - User Missing Name', () => {
      beforeEach(() => {
        mockUser = {
          id: 1,
          email: 'user@example.com',
          tier: 'free',
        };
        requireAuth.mockImplementation((req, res, next) => {
          req.user = mockUser;
          next();
        });
      });

      it('should use form name when user has no name', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
            firstName: 'Jane',
            lastName: 'Smith',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'Jane Smith',
          })
        );
      });

      it('should trim whitespace from form name', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'team',
            message: 'Test',
            firstName: '  Jane  ',
            lastName: '  Smith  ',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'Jane Smith',
          })
        );
      });

      it('should handle empty string when no name provided', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: '',
          })
        );
      });

      it('should use partial name from database if available', async () => {
        mockUser.first_name = 'John';
        // No last name

        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'John',
          })
        );
      });

      it('should use last name only if first name missing', async () => {
        mockUser.last_name = 'Doe';
        // No first name

        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'Doe',
          })
        );
      });
    });

    describe('Email Sending', () => {
      beforeEach(() => {
        mockUser = {
          id: 1,
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          tier: 'free',
        };
        requireAuth.mockImplementation((req, res, next) => {
          req.user = mockUser;
          next();
        });
      });

      it('should send email with all user details', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Looking for custom plan for 50 users',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith({
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userId: 1,
          currentTier: 'free',
          interestedTier: 'enterprise',
          message: 'Looking for custom plan for 50 users',
        });
      });

      it('should include empty message if not provided', async () => {
        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'team',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '',
          })
        );
      });

      it('should use "free" as default tier if user has no tier', async () => {
        mockUser.tier = undefined;

        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(sendContactSalesEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            currentTier: 'free',
          })
        );
      });

      it('should return success message after sending email', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/inquiry has been sent/i);
      });

      it('should log inquiry to console', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Contact Sales]')
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockUser = {
          id: 1,
          email: 'user@example.com',
          tier: 'free',
        };
        requireAuth.mockImplementation((req, res, next) => {
          req.user = mockUser;
          next();
        });
      });

      it('should handle Resend rate limit errors', async () => {
        const rateLimitError = new Error('Rate limit exceeded');
        rateLimitError.code = 'RESEND_RATE_LIMIT';
        sendContactSalesEmail.mockRejectedValueOnce(rateLimitError);

        const response = await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(response.status).toBe(503);
        expect(response.body.error).toBe('Rate limit exceeded');
      });

      it('should return 500 for general email sending errors', async () => {
        sendContactSalesEmail.mockRejectedValueOnce(new Error('Email service down'));

        const response = await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toMatch(/failed to send inquiry/i);
      });

      it('should suggest direct email contact on error', async () => {
        sendContactSalesEmail.mockRejectedValueOnce(new Error('Service error'));

        const response = await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(response.body.error).toMatch(/sales@codescribeai\.com/);
      });

      it('should log errors to console', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        sendContactSalesEmail.mockRejectedValueOnce(new Error('Test error'));

        await request(app)
          .post('/api/contact/sales')
          .send({
            tier: 'enterprise',
            message: 'Test',
          });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Contact sales error:',
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Request Body Validation', () => {
      it('should validate tier is required', async () => {
        // Check the schema that was captured when route was loaded
        // schemas[0] is /sales route, schemas[1] is /support route
        expect(capturedState.schemas[0]).toMatchObject({
          tier: { required: true, type: 'string' },
        });
      });

      it('should validate tier is string type', async () => {
        // Check the schema that was captured when route was loaded
        // schemas[0] is /sales route, schemas[1] is /support route
        expect(capturedState.schemas[0]).toMatchObject({
          tier: { required: true, type: 'string' },
        });
      });

      it('should allow optional message field', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise' });

        expect(response.status).toBe(200);
      });

      it('should allow optional firstName field', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise', firstName: 'John' });

        expect(response.status).toBe(200);
      });

      it('should allow optional lastName field', async () => {
        const response = await request(app)
          .post('/api/contact/sales')
          .send({ tier: 'enterprise', lastName: 'Doe' });

        expect(response.status).toBe(200);
      });
    });
  });
});
