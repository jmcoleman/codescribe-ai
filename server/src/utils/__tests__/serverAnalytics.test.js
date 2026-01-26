/**
 * Tests for serverAnalytics utility
 * Tests server-side analytics tracking with database persistence
 *
 * Pattern 11: ES Modules - mock BEFORE importing (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock analyticsService BEFORE importing serverAnalytics
jest.mock('../../services/analyticsService.js', () => ({
  analyticsService: {
    recordEvent: jest.fn().mockResolvedValue({}),
    trackTierChange: jest.fn().mockResolvedValue({}),
    isValidEvent: jest.fn().mockReturnValue(true),
  },
}));

import { trackServerEvent, trackCheckoutCompleted, trackTierChange, trackSignup } from '../serverAnalytics.js';
import { analyticsService } from '../../services/analyticsService.js';

describe('serverAnalytics', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Reset mock return values
    analyticsService.isValidEvent.mockReturnValue(true);
    analyticsService.recordEvent.mockResolvedValue({});
    analyticsService.trackTierChange.mockResolvedValue({});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('trackServerEvent', () => {
    it('should log JSON in production mode', async () => {
      process.env.NODE_ENV = 'production';

      await trackServerEvent('test_event', { foo: 'bar' }, { userId: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"analytics_event"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"test_event"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"foo":"bar"')
      );
    });

    it('should log human-readable format in development mode', async () => {
      process.env.NODE_ENV = 'development';

      await trackServerEvent('test_event', { foo: 'bar' }, { userId: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] test_event:',
        { foo: 'bar' }
      );
    });

    it('should persist valid events to database', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackServerEvent('test_event', { foo: 'bar' }, { userId: 1, isInternal: false });

      expect(analyticsService.isValidEvent).toHaveBeenCalledWith('test_event');
      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'test_event',
        { foo: 'bar' },
        { userId: 1, isInternal: false }
      );
    });

    it('should not persist invalid events to database', async () => {
      analyticsService.isValidEvent.mockReturnValue(false);

      await trackServerEvent('invalid_event', { foo: 'bar' }, { userId: 1 });

      expect(analyticsService.isValidEvent).toHaveBeenCalledWith('invalid_event');
      expect(analyticsService.recordEvent).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);
      analyticsService.recordEvent.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await trackServerEvent('test_event', { foo: 'bar' }, { userId: 1 });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"analytics_error"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"test_event"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error')
      );
    });

    it('should use user_id from data if context.userId not provided', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackServerEvent('test_event', { user_id: 123 }, {});

      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'test_event',
        { user_id: 123 },
        { userId: 123, isInternal: false }
      );
    });

    it('should default isInternal to false if not provided', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackServerEvent('test_event', {}, { userId: 1 });

      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'test_event',
        {},
        { userId: 1, isInternal: false }
      );
    });
  });

  describe('trackCheckoutCompleted', () => {
    it('should track checkout completion with correct data', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackCheckoutCompleted({
        userId: '123',
        tier: 'pro',
        amount: 2900,
        billingPeriod: 'monthly',
      });

      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'checkout_completed',
        {
          user_id: '123',
          tier: 'pro',
          amount_cents: 2900,
          billing_period: 'monthly',
        },
        { userId: '123', isInternal: false }
      );
    });
  });

  describe('trackTierChange', () => {
    it('should track tier change with analyticsService', async () => {
      await trackTierChange({
        action: 'upgrade',
        userId: '123',
        previousTier: 'free',
        newTier: 'pro',
        source: 'stripe_checkout',
      });

      expect(analyticsService.trackTierChange).toHaveBeenCalledWith({
        action: 'upgrade',
        userId: '123',
        previousTier: 'free',
        newTier: 'pro',
        source: 'stripe_checkout',
        reason: undefined,
      });
    });

    it('should use default source if not provided', async () => {
      await trackTierChange({
        action: 'downgrade',
        userId: '123',
        previousTier: 'pro',
        newTier: 'free',
      });

      expect(analyticsService.trackTierChange).toHaveBeenCalledWith({
        action: 'downgrade',
        userId: '123',
        previousTier: 'pro',
        newTier: 'free',
        source: 'stripe_webhook',
        reason: undefined,
      });
    });

    it('should include cancellation reason when provided', async () => {
      await trackTierChange({
        action: 'cancel',
        userId: '123',
        previousTier: 'pro',
        newTier: null,
        reason: 'too_expensive',
      });

      expect(analyticsService.trackTierChange).toHaveBeenCalledWith({
        action: 'cancel',
        userId: '123',
        previousTier: 'pro',
        newTier: null,
        source: 'stripe_webhook',
        reason: 'too_expensive',
      });
    });

    it('should handle errors gracefully', async () => {
      analyticsService.trackTierChange.mockRejectedValue(new Error('Tracking error'));

      // Should not throw
      await trackTierChange({
        action: 'upgrade',
        userId: '123',
        previousTier: 'free',
        newTier: 'pro',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"analytics_error"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"tier_change"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tracking error')
      );
    });
  });

  describe('trackSignup', () => {
    it('should track signup with email method by default', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackSignup({ userId: 123 });

      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'signup',
        {
          user_id: 123,
          method: 'email',
        },
        { userId: 123, isInternal: false }
      );
    });

    it('should track signup with specified method', async () => {
      analyticsService.isValidEvent.mockReturnValue(true);

      await trackSignup({ userId: 123, method: 'github' });

      expect(analyticsService.recordEvent).toHaveBeenCalledWith(
        'signup',
        {
          user_id: 123,
          method: 'github',
        },
        { userId: 123, isInternal: false }
      );
    });
  });
});
