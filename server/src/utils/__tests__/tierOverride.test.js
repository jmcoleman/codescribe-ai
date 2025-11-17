/**
 * Tests for Tier Override Utilities
 *
 * Tests the core utility functions for tier override system (database-based):
 * - getEffectiveTier (real vs override tier from database)
 * - validateOverrideRequest (role, tier, reason validation)
 * - hasActiveOverride (expiry checking)
 * - getOverrideDetails (remaining time calculation)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getEffectiveTier,
  validateOverrideRequest,
  hasActiveOverride,
  getOverrideDetails,
  hasFeatureWithOverride,
  getEffectiveTierFeatures
} from '../tierOverride.js';

describe('tierOverride utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEffectiveTier', () => {
    it('should return free tier when user is null', () => {
      expect(getEffectiveTier(null)).toBe('free');
    });

    it('should return real tier when user has no override', () => {
      const user = { id: 1, tier: 'pro', role: 'user' };
      expect(getEffectiveTier(user)).toBe('pro');
    });

    it('should return real tier when user role is not admin/support', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'user',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('free');
    });

    it('should return override tier when admin has valid override', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('enterprise');
    });

    it('should return override tier when support has valid override', () => {
      const user = {
        id: 1,
        tier: 'starter',
        role: 'support',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('pro');
    });

    it('should return override tier when super_admin has valid override', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'super_admin',
        viewing_as_tier: 'team',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('team');
    });

    it('should return real tier when override has expired', () => {
      const user = {
        id: 1,
        tier: 'pro',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
      expect(getEffectiveTier(user)).toBe('pro');
    });

    it('should return real tier when override fields are missing', () => {
      const user = {
        id: 1,
        tier: 'pro',
        role: 'admin',
        viewing_as_tier: 'enterprise'
        // override_expires_at missing
      };
      expect(getEffectiveTier(user)).toBe('pro');
    });

    it('should default to free tier when tier is null', () => {
      const user = { id: 1, role: 'user' };
      expect(getEffectiveTier(user)).toBe('free');
    });
  });

  describe('validateOverrideRequest', () => {
    it('should throw error when user role is not admin/support/super_admin', () => {
      const user = { id: 1, tier: 'free', role: 'user' };
      expect(() => {
        validateOverrideRequest(user, 'pro', 'Testing pro tier features');
      }).toThrow('Only admin/support roles can apply tier overrides');
    });

    it('should throw error when tier is invalid', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(() => {
        validateOverrideRequest(user, 'invalid_tier', 'Testing features');
      }).toThrow('Invalid tier: invalid_tier');
    });

    it('should throw error when reason is missing', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(() => {
        validateOverrideRequest(user, 'pro', '');
      }).toThrow('Override reason is required');
    });

    it('should throw error when reason is not a string', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(() => {
        validateOverrideRequest(user, 'pro', null);
      }).toThrow('Override reason is required');
    });

    it('should throw error when reason is less than 10 characters', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(() => {
        validateOverrideRequest(user, 'pro', 'short');
      }).toThrow('Override reason must be at least 10 characters');
    });

    it('should return true for valid admin request', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(
        validateOverrideRequest(user, 'pro', 'Testing pro tier multi-file feature')
      ).toBe(true);
    });

    it('should return true for valid support request', () => {
      const user = { id: 1, tier: 'free', role: 'support' };
      expect(
        validateOverrideRequest(user, 'enterprise', 'Reproducing customer ticket #1234')
      ).toBe(true);
    });

    it('should return true for valid super_admin request', () => {
      const user = { id: 1, tier: 'free', role: 'super_admin' };
      expect(
        validateOverrideRequest(user, 'team', 'Testing team collaboration features')
      ).toBe(true);
    });

    it('should accept all valid tier values', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      validTiers.forEach(tier => {
        expect(
          validateOverrideRequest(user, tier, 'Testing tier features for support')
        ).toBe(true);
      });
    });
  });

  describe('hasActiveOverride', () => {
    it('should return false when user is null', () => {
      expect(hasActiveOverride(null)).toBe(false);
    });

    it('should return false when override fields are missing', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(hasActiveOverride(user)).toBe(false);
    });

    it('should return false when override has expired', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() - 3600000).toISOString()
      };
      expect(hasActiveOverride(user)).toBe(false);
    });

    it('should return true when override is active', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(hasActiveOverride(user)).toBe(true);
    });

    it('should return true when override expires in the future', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds from now
      };
      expect(hasActiveOverride(user)).toBe(true);
    });
  });

  describe('getOverrideDetails', () => {
    it('should return null when user has no active override', () => {
      const user = { id: 1, tier: 'free', role: 'admin' };
      expect(getOverrideDetails(user)).toBeNull();
    });

    it('should return null when override has expired', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() - 3600000).toISOString()
      };
      expect(getOverrideDetails(user)).toBeNull();
    });

    it('should return override details with remaining time', () => {
      const expiryTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000); // 2.5 hours from now
      const appliedTime = new Date();
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: expiryTime.toISOString(),
        override_reason: 'Testing pro features',
        override_applied_at: appliedTime.toISOString()
      };

      const details = getOverrideDetails(user);

      expect(details).toHaveProperty('tier', 'pro');
      expect(details).toHaveProperty('reason', 'Testing pro features');
      expect(details).toHaveProperty('expiresAt', expiryTime.toISOString());
      expect(details).toHaveProperty('remainingTime');
      expect(details.remainingTime.hours).toBe(2);
      expect(details.remainingTime.minutes).toBeGreaterThanOrEqual(29);
      expect(details.remainingTime.minutes).toBeLessThanOrEqual(30);
    });

    it('should calculate remaining time correctly for 30 minutes', () => {
      const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: expiryTime.toISOString(),
        override_reason: 'Testing',
        override_applied_at: new Date().toISOString()
      };

      const details = getOverrideDetails(user);

      expect(details.remainingTime.hours).toBe(0);
      expect(details.remainingTime.minutes).toBeGreaterThanOrEqual(29);
      expect(details.remainingTime.minutes).toBeLessThanOrEqual(30);
    });

    it('should calculate remaining time correctly for 1 minute', () => {
      const expiryTime = new Date(Date.now() + 60 * 1000); // 1 minute
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: expiryTime.toISOString(),
        override_reason: 'Testing',
        override_applied_at: new Date().toISOString()
      };

      const details = getOverrideDetails(user);

      expect(details.remainingTime.hours).toBe(0);
      expect(details.remainingTime.minutes).toBeGreaterThanOrEqual(0);
      expect(details.remainingTime.minutes).toBeLessThanOrEqual(1);
    });
  });

  describe('hasFeatureWithOverride', () => {
    it('should check feature against effective tier', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      // Pro tier has batchProcessing
      expect(hasFeatureWithOverride(user, 'batchProcessing')).toBe(true);
    });

    it('should return false for feature not in override tier', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'starter',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      // Starter tier does not have batchProcessing
      expect(hasFeatureWithOverride(user, 'batchProcessing')).toBe(false);
    });
  });

  describe('getEffectiveTierFeatures', () => {
    it('should return features for override tier', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      const features = getEffectiveTierFeatures(user);
      expect(features.batchProcessing).toBe(true);
    });

    it('should return features for real tier when no override', () => {
      const user = {
        id: 1,
        tier: 'pro',
        role: 'user'
      };

      const features = getEffectiveTierFeatures(user);
      expect(features.batchProcessing).toBe(true);
    });
  });
});
