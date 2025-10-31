/**
 * Subscription Model Tests
 *
 * Tests for subscription CRUD operations and business logic.
 *
 * Epic: 2.4 - Payment Integration
 * Date: October 29, 2025
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Subscription from '../Subscription.js';
import User from '../User.js';
import { sql } from '@vercel/postgres';

const describeOrSkip = skipIfNoDb();

describeOrSkip('Subscription Model', () => {
  let testUser;
  let testRunId;

  beforeEach(async () => {
    // Generate unique test run ID to prevent duplicate subscription IDs across test runs
    testRunId = Date.now();

    // Create a test user
    testUser = await User.create({
      email: `test-sub-${testRunId}@example.com`,
      password: 'test-password-123',
    });
  });

  afterEach(async () => {
    // Clean up subscriptions and users (only if testUser was created)
    if (testUser?.id) {
      await sql`DELETE FROM subscriptions WHERE user_id = ${testUser.id}`;
      await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    }
  });

  describe('create', () => {
    it('should create a new subscription', async () => {
      const subscriptionData = {
        userId: testUser.id,
        stripeSubscriptionId: `sub_test_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
      };

      const subscription = await Subscription.create(subscriptionData);

      expect(subscription).toBeDefined();
      expect(subscription.user_id).toBe(testUser.id);
      expect(subscription.stripe_subscription_id).toBe(`sub_test_${testRunId}`);
      expect(subscription.tier).toBe('pro');
      expect(subscription.status).toBe('active');
    });

    it('should create subscription with trial dates', async () => {
      const trialStart = new Date();
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

      const subscription = await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_trial_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'starter',
        status: 'trialing',
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        trialStart,
        trialEnd,
      });

      expect(subscription.status).toBe('trialing');
      expect(subscription.trial_start).toBeDefined();
      expect(subscription.trial_end).toBeDefined();
    });

    it('should enforce unique stripe_subscription_id', async () => {
      const subscriptionData = {
        userId: testUser.id,
        stripeSubscriptionId: `sub_unique_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await Subscription.create(subscriptionData);

      // Try to create duplicate
      await expect(
        Subscription.create(subscriptionData)
      ).rejects.toThrow();
    });

    it('should validate tier values', async () => {
      const subscriptionData = {
        userId: testUser.id,
        stripeSubscriptionId: `sub_invalid_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'invalid_tier', // Invalid tier
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await expect(
        Subscription.create(subscriptionData)
      ).rejects.toThrow();
    });
  });

  describe('findByStripeId', () => {
    it('should find subscription by Stripe ID', async () => {
      const created = await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_find_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const found = await Subscription.findByStripeId(`sub_find_${testRunId}`);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.stripe_subscription_id).toBe(`sub_find_${testRunId}`);
    });

    it('should return null if subscription not found', async () => {
      const found = await Subscription.findByStripeId('sub_nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription for user', async () => {
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_active_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const active = await Subscription.getActiveSubscription(testUser.id);

      expect(active).toBeDefined();
      expect(active.status).toBe('active');
      expect(active.user_id).toBe(testUser.id);
    });

    it('should return trialing subscription as active', async () => {
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_trial_active_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'starter',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      const active = await Subscription.getActiveSubscription(testUser.id);

      expect(active).toBeDefined();
      expect(active.status).toBe('trialing');
    });

    it('should return null if no active subscription', async () => {
      const active = await Subscription.getActiveSubscription(testUser.id);
      expect(active).toBeNull();
    });

    it('should return most recent active subscription', async () => {
      // Create older subscription
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_old_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'starter',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create newer subscription
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_new_${testRunId}`,
        stripePriceId: 'price_test_456',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const active = await Subscription.getActiveSubscription(testUser.id);

      expect(active.stripe_subscription_id).toBe(`sub_new_${testRunId}`);
      expect(active.tier).toBe('pro');
    });
  });

  describe('update', () => {
    it('should update subscription status', async () => {
      const subscription = await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_update_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const updated = await Subscription.update(`sub_update_${testRunId}`, {
        status: 'canceled',
      });

      expect(updated.status).toBe('canceled');
      expect(updated.id).toBe(subscription.id);
    });

    it('should update multiple fields', async () => {
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_multi_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'starter',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const newPeriodEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const updated = await Subscription.update(`sub_multi_${testRunId}`, {
        tier: 'pro',
        stripePriceId: 'price_test_456',
        currentPeriodEnd: newPeriodEnd,
      });

      expect(updated.tier).toBe('pro');
      expect(updated.stripe_price_id).toBe('price_test_456');
    });

    it('should return null if subscription not found', async () => {
      const updated = await Subscription.update('sub_nonexistent', {
        status: 'canceled',
      });

      expect(updated).toBeNull();
    });
  });

  describe('cancel', () => {
    it('should cancel subscription at period end', async () => {
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_cancel_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const canceled = await Subscription.cancel(`sub_cancel_${testRunId}`, true);

      expect(canceled.status).toBe('active'); // Still active until period end
      expect(canceled.cancel_at_period_end).toBe(true);
      expect(canceled.canceled_at).toBeDefined();
      expect(canceled.ended_at).toBeNull();
    });

    it('should cancel subscription immediately', async () => {
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_cancel_imm_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const canceled = await Subscription.cancel(`sub_cancel_imm_${testRunId}`, false);

      expect(canceled.status).toBe('canceled');
      expect(canceled.cancel_at_period_end).toBe(false);
      expect(canceled.canceled_at).toBeDefined();
      expect(canceled.ended_at).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return subscription statistics', async () => {
      // Create various subscriptions
      await Subscription.create({
        userId: testUser.id,
        stripeSubscriptionId: `sub_stats_${testRunId}`,
        stripePriceId: 'price_test_123',
        tier: 'starter',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const stats = await Subscription.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.active_count).toBe('string'); // PostgreSQL COUNT returns string
      expect(typeof stats.starter_count).toBe('string');
    });
  });
});
