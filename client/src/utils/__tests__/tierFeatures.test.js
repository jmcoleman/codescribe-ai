/**
 * Tests for Tier Feature Utilities (Client-side)
 *
 * Tests client-side tier feature checking with override support:
 * - getEffectiveTier (real vs override tier)
 * - hasFeature (feature access checking)
 * - getTierFeatures (feature configuration)
 * - hasActiveOverride (override status)
 * - getUpgradeTierForFeature (upgrade recommendations)
 */

import { describe, it, expect } from 'vitest';
import {
  getEffectiveTier,
  hasFeature,
  getTierFeatures,
  hasActiveOverride,
  getUpgradeTierForFeature,
  TIER_ORDER
} from '../tierFeatures';

describe('tierFeatures utilities', () => {
  describe('getEffectiveTier', () => {
    it('should return free tier when user is null', () => {
      expect(getEffectiveTier(null)).toBe('free');
    });

    it('should return real tier when user has no override', () => {
      const user = { id: 1, tier: 'pro', role: 'user' };
      expect(getEffectiveTier(user)).toBe('pro');
    });

    it('should return real tier when user role is not privileged', () => {
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
        viewing_as_tier: 'team',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('team');
    });

    it('should return override tier when super_admin has valid override', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'super_admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(getEffectiveTier(user)).toBe('pro');
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

    it('should default to free tier when tier is undefined', () => {
      const user = { id: 1, role: 'user' };
      expect(getEffectiveTier(user)).toBe('free');
    });
  });

  describe('hasFeature', () => {
    it('should return false when free tier user checks batchProcessing', () => {
      const user = { id: 1, tier: 'free', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });

    it('should return false when starter tier user checks batchProcessing', () => {
      const user = { id: 1, tier: 'starter', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });

    it('should return true when pro tier user checks batchProcessing', () => {
      const user = { id: 1, tier: 'pro', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should return true when team tier user checks batchProcessing', () => {
      const user = { id: 1, tier: 'team', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should return true when enterprise tier user checks batchProcessing', () => {
      const user = { id: 1, tier: 'enterprise', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should check feature against override tier', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should return false for non-existent feature', () => {
      const user = { id: 1, tier: 'enterprise', role: 'user' };
      expect(hasFeature(user, 'nonExistentFeature')).toBe(false);
    });

    it('should handle apiAccess feature correctly', () => {
      expect(hasFeature({ tier: 'free', role: 'user' }, 'apiAccess')).toBe(false);
      expect(hasFeature({ tier: 'starter', role: 'user' }, 'apiAccess')).toBe(false);
      expect(hasFeature({ tier: 'pro', role: 'user' }, 'apiAccess')).toBe(false);
      expect(hasFeature({ tier: 'team', role: 'user' }, 'apiAccess')).toBe(true);
      expect(hasFeature({ tier: 'enterprise', role: 'user' }, 'apiAccess')).toBe(true);
    });

    it('should handle customTemplates feature correctly', () => {
      expect(hasFeature({ tier: 'free', role: 'user' }, 'customTemplates')).toBe(false);
      expect(hasFeature({ tier: 'starter', role: 'user' }, 'customTemplates')).toBe(false);
      expect(hasFeature({ tier: 'pro', role: 'user' }, 'customTemplates')).toBe(true);
      expect(hasFeature({ tier: 'team', role: 'user' }, 'customTemplates')).toBe(true);
      expect(hasFeature({ tier: 'enterprise', role: 'user' }, 'customTemplates')).toBe(true);
    });
  });

  describe('getTierFeatures', () => {
    it('should return free tier features for null user', () => {
      const features = getTierFeatures(null);
      expect(features.batchProcessing).toBe(false);
      expect(features.customTemplates).toBe(false);
    });

    it('should return features for real tier', () => {
      const user = { id: 1, tier: 'pro', role: 'user' };
      const features = getTierFeatures(user);
      expect(features.batchProcessing).toBe(true);
      expect(features.customTemplates).toBe(true);
      expect(features.apiAccess).toBe(false);
    });

    it('should return features for override tier', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'enterprise',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      const features = getTierFeatures(user);
      expect(features.batchProcessing).toBe(true);
      expect(features.customTemplates).toBe(true);
      expect(features.apiAccess).toBe(true);
      expect(features.versionHistory).toBe(true);
    });

    it('should return all features for each tier correctly', () => {
      const tiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      tiers.forEach(tier => {
        const features = getTierFeatures({ id: 1, tier, role: 'user' });
        expect(features).toBeDefined();
        expect(typeof features).toBe('object');
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

    it('should return true even when override expires soon', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 1000).toISOString() // 1 second from now
      };
      expect(hasActiveOverride(user)).toBe(true);
    });
  });

  describe('getUpgradeTierForFeature', () => {
    it('should recommend pro for batchProcessing from free', () => {
      const upgradeTier = getUpgradeTierForFeature('free', 'batchProcessing');
      expect(upgradeTier).toBe('pro');
    });

    it('should recommend pro for batchProcessing from starter', () => {
      const upgradeTier = getUpgradeTierForFeature('starter', 'batchProcessing');
      expect(upgradeTier).toBe('pro');
    });

    it('should return null for batchProcessing from pro', () => {
      const upgradeTier = getUpgradeTierForFeature('pro', 'batchProcessing');
      expect(upgradeTier).toBeNull();
    });

    it('should recommend team for apiAccess from free', () => {
      const upgradeTier = getUpgradeTierForFeature('free', 'apiAccess');
      expect(upgradeTier).toBe('team');
    });

    it('should recommend team for apiAccess from pro', () => {
      const upgradeTier = getUpgradeTierForFeature('pro', 'apiAccess');
      expect(upgradeTier).toBe('team');
    });

    it('should return null when already at highest tier', () => {
      const upgradeTier = getUpgradeTierForFeature('enterprise', 'batchProcessing');
      expect(upgradeTier).toBeNull();
    });

    it('should return null for non-existent feature', () => {
      const upgradeTier = getUpgradeTierForFeature('free', 'nonExistentFeature');
      expect(upgradeTier).toBeNull();
    });

    it('should recommend pro for customTemplates from free', () => {
      const upgradeTier = getUpgradeTierForFeature('free', 'customTemplates');
      expect(upgradeTier).toBe('pro');
    });

    it('should return null for customTemplates from pro', () => {
      const upgradeTier = getUpgradeTierForFeature('pro', 'customTemplates');
      expect(upgradeTier).toBeNull();
    });
  });

  describe('TIER_ORDER constant', () => {
    it('should have correct tier order', () => {
      expect(TIER_ORDER).toEqual(['free', 'starter', 'pro', 'team', 'enterprise']);
    });

    it('should have 5 tiers', () => {
      expect(TIER_ORDER).toHaveLength(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle user with undefined tier', () => {
      const user = { id: 1, role: 'user' };
      expect(getEffectiveTier(user)).toBe('free');
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });

    it('should handle user with null tier', () => {
      const user = { id: 1, tier: null, role: 'user' };
      expect(getEffectiveTier(user)).toBe('free');
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });

    it('should handle malformed override expiry', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: 'invalid-date'
      };

      // Should return false for active override with invalid date
      expect(hasActiveOverride(user)).toBe(false);

      // Should fall back to real tier
      expect(getEffectiveTier(user)).toBe('free');
    });

    it('should handle missing override_expires_at with viewing_as_tier present', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro'
        // override_expires_at missing
      };

      expect(hasActiveOverride(user)).toBe(false);
      expect(getEffectiveTier(user)).toBe('free');
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly determine multi-file access for free user', () => {
      const user = { id: 1, tier: 'free', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });

    it('should correctly determine multi-file access for pro user', () => {
      const user = { id: 1, tier: 'pro', role: 'user' };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should correctly determine multi-file access for admin with override', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      expect(hasFeature(user, 'batchProcessing')).toBe(true);
    });

    it('should correctly determine multi-file access for admin with expired override', () => {
      const user = {
        id: 1,
        tier: 'free',
        role: 'admin',
        viewing_as_tier: 'pro',
        override_expires_at: new Date(Date.now() - 1000).toISOString()
      };
      expect(hasFeature(user, 'batchProcessing')).toBe(false);
    });
  });
});
