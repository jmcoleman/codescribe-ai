/**
 * Payment Routes Tests
 *
 * Tests for Stripe payment endpoints.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 *
 * NOTE: These tests use mocked Stripe SDK to avoid real API calls.
 * The mocks are set up using jest.mock() with manual mock file.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Mock the stripe config module BEFORE importing routes
jest.mock('../../config/stripe.js');

// Now import the routes and User model
import paymentRoutes from '../payments.js';
import User from '../../models/User.js';
import stripe from '../../config/stripe.js';

const describeOrSkip = skipIfNoDb();

describeOrSkip('Payment Routes', () => {
  let app;
  let testUser;
  let authToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentRoutes);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: `test-payment-${Date.now()}@example.com`,
      password: 'test-password-123',
    });

    // Manually set email_verified = true (bypass middleware check)
    await sql`
      UPDATE users
      SET email_verified = TRUE
      WHERE id = ${testUser.id}
    `;

    // Create auth token (use 'sub' claim as expected by requireAuth middleware)
    authToken = jwt.sign(
      { sub: testUser.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );

    // Reset mocks and set default behaviors
    jest.clearAllMocks();

    // Default: no existing subscriptions
    stripe.subscriptions.list.mockResolvedValue({ data: [] });
  });

  afterAll(async () => {
    // Clean up test users
    await sql`DELETE FROM users WHERE email LIKE 'test-payment-%'`;
  });

  describe('POST /api/payments/create-checkout-session', () => {
    it('should create a checkout session for new customer', async () => {
      stripe.customers.create.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'pro',
          billingPeriod: 'monthly',
        });

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe('cs_test_123');
      expect(response.body.url).toBe('https://checkout.stripe.com/test');

      // Verify Stripe customer was created
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: testUser.email,
        metadata: {
          userId: testUser.id,
          githubUsername: '',
        },
      });

      // Verify checkout session was created with correct price
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test_123',
          mode: 'subscription',
          line_items: [
            {
              price: 'price_pro_monthly_test',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('should create checkout session for existing customer', async () => {
      // Update user with existing Stripe customer ID
      await User.updateStripeCustomerId(testUser.id, 'cus_existing_123');

      stripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/test2',
      });

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'starter',
          billingPeriod: 'annual',
        });

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBe('cs_test_456');

      // Should NOT create new customer
      expect(stripe.customers.create).not.toHaveBeenCalled();

      // Should use existing customer ID
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_123',
          line_items: [
            {
              price: 'price_starter_annual_test',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('should reject invalid tier', async () => {
      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'invalid',
          billingPeriod: 'monthly',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid tier');
    });

    it('should reject invalid billing period', async () => {
      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'pro',
          billingPeriod: 'weekly',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid billing period');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .send({
          tier: 'pro',
          billingPeriod: 'monthly',
        });

      expect(response.status).toBe(401);
    });

    it('should handle Stripe errors', async () => {
      stripe.customers.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'pro',
          billingPeriod: 'monthly',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create checkout session');
    });
  });

  describe('POST /api/payments/create-portal-session', () => {
    it('should create portal session for existing customer', async () => {
      // Update user with Stripe customer ID
      await User.updateStripeCustomerId(testUser.id, 'cus_portal_123');

      stripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/portal/test',
      });

      const response = await request(app)
        .post('/api/payments/create-portal-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.url).toBe('https://billing.stripe.com/portal/test');

      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_portal_123',
        return_url: expect.stringContaining('/account'),
      });
    });

    it('should reject if user has no Stripe customer ID', async () => {
      const response = await request(app)
        .post('/api/payments/create-portal-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No Stripe customer');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/payments/create-portal-session')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should handle Stripe errors', async () => {
      await User.updateStripeCustomerId(testUser.id, 'cus_error_123');

      stripe.billingPortal.sessions.create.mockRejectedValue(
        new Error('Stripe API error')
      );

      const response = await request(app)
        .post('/api/payments/create-portal-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create portal session');
    });
  });

  describe('Name Field Sync (Migration 008)', () => {
    describe('App → Stripe: Send name when creating customer', () => {
      it('should include name in Stripe customer when both first_name and last_name exist', async () => {
        // Create user with name
        const userWithName = await User.create({
          email: `test-name-${Date.now()}@example.com`,
          password: 'test-password-123',
          first_name: 'John',
          last_name: 'Doe',
        });

        // Set email_verified = true (bypass middleware check)
        await sql`
          UPDATE users
          SET email_verified = TRUE
          WHERE id = ${userWithName.id}
        `;

        const token = jwt.sign(
          { sub: userWithName.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '7d' }
        );

        stripe.customers.create.mockResolvedValue({
          id: 'cus_with_name_123',
        });

        stripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_with_name_123',
          url: 'https://checkout.stripe.com/test',
        });

        stripe.subscriptions.list.mockResolvedValue({ data: [] });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'pro',
            billingPeriod: 'monthly',
          });

        // Verify name was sent to Stripe
        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            email: userWithName.email,
          })
        );

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${userWithName.id}`;
      });

      it('should NOT include name when first_name is missing', async () => {
        const userNoFirstName = await User.create({
          email: `test-no-first-${Date.now()}@example.com`,
          password: 'test-password-123',
          last_name: 'Smith',
        });

        // Set email_verified = true (bypass middleware check)
        await sql`
          UPDATE users
          SET email_verified = TRUE
          WHERE id = ${userNoFirstName.id}
        `;

        const token = jwt.sign(
          { sub: userNoFirstName.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '7d' }
        );

        stripe.customers.create.mockResolvedValue({
          id: 'cus_no_first_123',
        });

        stripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_no_first_123',
          url: 'https://checkout.stripe.com/test',
        });

        stripe.subscriptions.list.mockResolvedValue({ data: [] });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'starter',
            billingPeriod: 'monthly',
          });

        // Verify name was NOT sent (no name property)
        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.not.objectContaining({
            name: expect.anything(),
          })
        );

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${userNoFirstName.id}`;
      });

      it('should NOT include name when last_name is missing', async () => {
        const userNoLastName = await User.create({
          email: `test-no-last-${Date.now()}@example.com`,
          password: 'test-password-123',
          first_name: 'Jane',
        });

        // Set email_verified = true (bypass middleware check)
        await sql`
          UPDATE users
          SET email_verified = TRUE
          WHERE id = ${userNoLastName.id}
        `;

        const token = jwt.sign(
          { sub: userNoLastName.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '7d' }
        );

        stripe.customers.create.mockResolvedValue({
          id: 'cus_no_last_123',
        });

        stripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_no_last_123',
          url: 'https://checkout.stripe.com/test',
        });

        stripe.subscriptions.list.mockResolvedValue({ data: [] });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'pro',
            billingPeriod: 'annual',
          });

        // Verify name was NOT sent
        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.not.objectContaining({
            name: expect.anything(),
          })
        );

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${userNoLastName.id}`;
      });

      it('should handle multi-part surnames correctly', async () => {
        const userMultiPart = await User.create({
          email: `test-multipart-${Date.now()}@example.com`,
          password: 'test-password-123',
          first_name: 'Maria',
          last_name: 'Garcia Lopez',
        });

        // Set email_verified = true (bypass middleware check)
        await sql`
          UPDATE users
          SET email_verified = TRUE
          WHERE id = ${userMultiPart.id}
        `;

        const token = jwt.sign(
          { sub: userMultiPart.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '7d' }
        );

        stripe.customers.create.mockResolvedValue({
          id: 'cus_multipart_123',
        });

        stripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_multipart_123',
          url: 'https://checkout.stripe.com/test',
        });

        stripe.subscriptions.list.mockResolvedValue({ data: [] });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'team',
            billingPeriod: 'monthly',
          });

        // Verify full name sent correctly
        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Maria Garcia Lopez',
          })
        );

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${userMultiPart.id}`;
      });

      it('should enforce 255 character limit for combined name', async () => {
        // Create name that would exceed 255 chars if first_name was longer
        // first_name: 100 chars, last_name: 150 chars = 251 total (under limit)
        const longFirstName = 'A'.repeat(100);
        const longLastName = 'B'.repeat(150);

        const userLongName = await User.create({
          email: `test-long-${Date.now()}@example.com`,
          password: 'test-password-123',
          first_name: longFirstName,
          last_name: longLastName,
        });

        // Set email_verified = true (bypass middleware check)
        await sql`
          UPDATE users
          SET email_verified = TRUE
          WHERE id = ${userLongName.id}
        `;

        const token = jwt.sign(
          { sub: userLongName.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '7d' }
        );

        stripe.customers.create.mockResolvedValue({
          id: 'cus_long_123',
        });

        stripe.checkout.sessions.create.mockResolvedValue({
          id: 'cs_long_123',
          url: 'https://checkout.stripe.com/test',
        });

        stripe.subscriptions.list.mockResolvedValue({ data: [] });

        await request(app)
          .post('/api/payments/create-checkout-session')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'pro',
            billingPeriod: 'monthly',
          });

        // Verify combined name sent
        const expectedName = `${longFirstName} ${longLastName}`;
        expect(expectedName.length).toBe(251); // 100 + 1 (space) + 150
        expect(expectedName.length).toBeLessThan(255); // Under Stripe's limit

        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expectedName,
          })
        );

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${userLongName.id}`;
      });
    });
  });

  describe('Origin Tracking (Migration 008)', () => {
    it('should set customer_created_via to "app" when creating customer via checkout', async () => {
      stripe.customers.create.mockResolvedValue({
        id: 'cus_origin_test_123',
      });

      stripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_origin_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'pro',
          billingPeriod: 'monthly',
        });

      // Verify customer_created_via was set to 'app'
      const updatedUser = await User.findById(testUser.id);
      expect(updatedUser.customer_created_via).toBe('app');
      expect(updatedUser.stripe_customer_id).toBe('cus_origin_test_123');
    });

    it('should NOT update customer_created_via for existing customers', async () => {
      // Manually set customer with 'stripe_dashboard' origin
      await sql`
        UPDATE users
        SET stripe_customer_id = 'cus_existing_dashboard',
            customer_created_via = 'stripe_dashboard'
        WHERE id = ${testUser.id}
      `;

      stripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_existing_123',
        url: 'https://checkout.stripe.com/test',
      });

      await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'starter',
          billingPeriod: 'annual',
        });

      // Verify origin NOT changed (still stripe_dashboard)
      const user = await User.findById(testUser.id);
      expect(user.customer_created_via).toBe('stripe_dashboard');
      expect(user.stripe_customer_id).toBe('cus_existing_dashboard');
    });
  });
});
