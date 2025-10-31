/**
 * Webhook Handler Tests
 *
 * Tests for Stripe webhook event processing.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { sql } from '@vercel/postgres';

// Mock the stripe config module BEFORE importing routes
jest.mock('../../config/stripe.js');

// Now import routes, models, and the mocked stripe
import webhookRoutes from '../webhooks.js';
import User from '../../models/User.js';
import Subscription from '../../models/Subscription.js';
import stripe from '../../config/stripe.js';

describe('Webhook Handler', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    app = express();
    // Webhook route needs raw body
    app.use('/api/webhooks', webhookRoutes);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: `test-webhook-${Date.now()}@example.com`,
      password: 'test-password-123',
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up
    await sql`DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-webhook-%')`;
    await sql`DELETE FROM users WHERE email LIKE 'test-webhook-%'`;
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should reject webhook with invalid signature', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid_sig')
        .send(Buffer.from(JSON.stringify({ type: 'test.event' })));

      expect(response.status).toBe(400);
      expect(response.text).toContain('Webhook Error');
    });

    describe('checkout.session.completed', () => {
      it('should create subscription and update user tier', async () => {
        const sessionEvent = {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              subscription: 'sub_test_123',
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(sessionEvent);

        stripe.subscriptions.retrieve.mockResolvedValue({
          id: 'sub_test_123',
          status: 'active',
          items: {
            data: [{ price: { id: 'price_pro_monthly_test' } }],
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          metadata: {
            userId: testUser.id.toString(),
          },
        });

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(sessionEvent));

        expect(response.status).toBe(200);
        expect(response.body.received).toBe(true);

        // Verify subscription was created
        const subscription = await Subscription.findByStripeId('sub_test_123');
        expect(subscription).toBeDefined();
        expect(subscription.tier).toBe('pro');
        expect(subscription.status).toBe('active');

        // Verify user tier was updated
        const user = await User.findById(testUser.id);
        expect(user.tier).toBe('pro');
      });
    });

    describe('customer.subscription.updated', () => {
      it('should update existing subscription', async () => {
        // Create initial subscription
        await Subscription.create({
          userId: testUser.id,
          stripeSubscriptionId: 'sub_update_test',
          stripePriceId: 'price_starter_monthly_test',
          tier: 'starter',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        const updateEvent = {
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_update_test',
              status: 'active',
              items: {
                data: [{ price: { id: 'price_pro_monthly_test' } }],
              },
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              cancel_at_period_end: false,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(updateEvent);

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(updateEvent));

        expect(response.status).toBe(200);

        // Verify subscription was updated to pro
        const subscription = await Subscription.findByStripeId('sub_update_test');
        expect(subscription.tier).toBe('pro');

        // Verify user tier was updated
        const user = await User.findById(testUser.id);
        expect(user.tier).toBe('pro');
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should downgrade user to free tier', async () => {
        // Create active subscription
        await Subscription.create({
          userId: testUser.id,
          stripeSubscriptionId: 'sub_delete_test',
          stripePriceId: 'price_pro_monthly_test',
          tier: 'pro',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // Update user to pro tier
        await User.updateTier(testUser.id, 'pro');

        const deleteEvent = {
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_delete_test',
              status: 'canceled',
              ended_at: Math.floor(Date.now() / 1000),
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(deleteEvent);

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(deleteEvent));

        expect(response.status).toBe(200);

        // Verify subscription was canceled
        const subscription = await Subscription.findByStripeId('sub_delete_test');
        expect(subscription.status).toBe('canceled');

        // Verify user was downgraded to free
        const user = await User.findById(testUser.id);
        expect(user.tier).toBe('free');
      });
    });

    describe('invoice.payment_succeeded', () => {
      it('should update subscription on successful payment', async () => {
        const paymentEvent = {
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test_123',
              subscription: 'sub_payment_test',
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(paymentEvent);

        stripe.subscriptions.retrieve.mockResolvedValue({
          id: 'sub_payment_test',
          status: 'active',
          items: {
            data: [{ price: { id: 'price_pro_monthly_test' } }],
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          metadata: {
            userId: testUser.id.toString(),
          },
        });

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(paymentEvent));

        expect(response.status).toBe(200);
        expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_payment_test');
      });
    });

    describe('invoice.payment_failed', () => {
      it('should mark subscription as past_due', async () => {
        // Create active subscription
        await Subscription.create({
          userId: testUser.id,
          stripeSubscriptionId: 'sub_failed_payment',
          stripePriceId: 'price_pro_monthly_test',
          tier: 'pro',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        const failedEvent = {
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_failed_123',
              subscription: 'sub_failed_payment',
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(failedEvent);

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(failedEvent));

        expect(response.status).toBe(200);

        // Verify subscription status updated
        const subscription = await Subscription.findByStripeId('sub_failed_payment');
        expect(subscription.status).toBe('past_due');
      });
    });

    it('should handle unrecognized event types gracefully', async () => {
      const unknownEvent = {
        type: 'unknown.event.type',
        data: { object: {} },
      };

      stripe.webhooks.constructEvent.mockReturnValue(unknownEvent);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(unknownEvent));

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle processing errors gracefully', async () => {
      const errorEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_error_test',
            subscription: 'sub_error_test',
            metadata: {
              userId: 'invalid',  // Will cause parseInt to fail (NaN)
            },
          },
        },
      };

      stripe.webhooks.constructEvent.mockReturnValue(errorEvent);

      stripe.subscriptions.retrieve.mockRejectedValue(
        new Error('Subscription not found')
      );

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid_sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(errorEvent));

      // Webhooks should return 200 even for events we can't process
      // This prevents Stripe from retrying endlessly
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    describe('customer.updated - Name Sync (Migration 008)', () => {
      beforeEach(async () => {
        // Clear any existing customer ID with this value (from previous tests)
        await sql`
          UPDATE users
          SET stripe_customer_id = NULL
          WHERE stripe_customer_id = 'cus_test_name_sync'
        `;

        // Give test user a Stripe customer ID
        await User.updateStripeCustomerId(testUser.id, 'cus_test_name_sync');
      });

      it('should sync name from Stripe to database when name changes', async () => {
        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: 'Jane Smith',
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        const response = await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        expect(response.status).toBe(200);

        // Verify name was synced to database
        const updatedUser = await User.findById(testUser.id);
        expect(updatedUser.first_name).toBe('Jane');
        expect(updatedUser.last_name).toBe('Smith');
      });

      it('should handle multi-part surnames when syncing from Stripe', async () => {
        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: 'Maria Garcia Lopez',
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        // Verify name split correctly: first word = first_name, rest = last_name
        const updatedUser = await User.findById(testUser.id);
        expect(updatedUser.first_name).toBe('Maria');
        expect(updatedUser.last_name).toBe('Garcia Lopez');
      });

      it('should handle single-word names (fallback to first name)', async () => {
        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: 'Madonna',
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        // Verify single name handled: both first_name and last_name get the same value
        const updatedUser = await User.findById(testUser.id);
        expect(updatedUser.first_name).toBe('Madonna');
        expect(updatedUser.last_name).toBe('Madonna');
      });

      it('should NOT update name if Stripe name matches database', async () => {
        // Pre-set name in database
        await sql`
          UPDATE users
          SET first_name = 'John',
              last_name = 'Doe'
          WHERE id = ${testUser.id}
        `;

        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: 'John Doe',  // Same as database
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        // Verify name unchanged (still John Doe)
        const user = await User.findById(testUser.id);
        expect(user.first_name).toBe('John');
        expect(user.last_name).toBe('Doe');
      });

      it('should handle name updates with extra whitespace', async () => {
        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: '  Alice   Marie   Johnson  ',  // Extra whitespace
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        // Verify name normalized: "Alice" + "Marie Johnson"
        const updatedUser = await User.findById(testUser.id);
        expect(updatedUser.first_name).toBe('Alice');
        expect(updatedUser.last_name).toBe('Marie Johnson');
      });

      it('should skip name update if Stripe name is empty', async () => {
        // Pre-set name
        await sql`
          UPDATE users
          SET first_name = 'Existing',
              last_name = 'Name'
          WHERE id = ${testUser.id}
        `;

        const customerUpdatedEvent = {
          type: 'customer.updated',
          data: {
            object: {
              id: 'cus_test_name_sync',
              name: null,  // No name in Stripe
              email: testUser.email,
              metadata: {
                userId: testUser.id.toString(),
              },
            },
          },
        };

        stripe.webhooks.constructEvent.mockReturnValue(customerUpdatedEvent);

        await request(app)
          .post('/api/webhooks/stripe')
          .set('stripe-signature', 'valid_sig')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(customerUpdatedEvent));

        // Verify name unchanged
        const user = await User.findById(testUser.id);
        expect(user.first_name).toBe('Existing');
        expect(user.last_name).toBe('Name');
      });
    });
  });
});
