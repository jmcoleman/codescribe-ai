/**
 * Trial Eligibility Tests
 * Tests for checkEligibilityForProgram() method
 * Covers Phase 1 & 2 eligibility logic
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import Trial from '../Trial.js';
import { sql } from '@vercel/postgres';

// Mock @vercel/postgres
jest.mock('@vercel/postgres');

describe('Trial.checkEligibilityForProgram()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Scenario 1: New User (No Previous Trials)', () => {
    test('should return eligible with NEW_USER code', async () => {
      // Mock: User has no trials
      sql.mockResolvedValueOnce({ rows: [] }); // findActiveByUserId
      sql.mockResolvedValueOnce({ rows: [] }); // findAllByUserId

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: false,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('NEW_USER');
      expect(result.reason).toBeNull();
    });

    test('should be eligible regardless of campaign settings', async () => {
      sql.mockResolvedValueOnce({ rows: [] }); // findActiveByUserId
      sql.mockResolvedValueOnce({ rows: [] }); // findAllByUserId

      // Test with strictest settings
      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: false,
        cooldownDays: 365,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('NEW_USER');
    });
  });

  describe('Scenario 2: Active Trial Exists', () => {
    test('should block with ACTIVE_TRIAL_EXISTS code', async () => {
      // Mock: User has active trial
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          ends_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: 'active'
        }]
      }); // findActiveByUserId

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('ACTIVE_TRIAL_EXISTS');
      expect(result.reason).toBe('You already have an active trial');
      expect(result.activeTrial).toBeDefined();
      expect(result.activeTrial.tier).toBe('pro');
    });

    test('should block even with permissive campaign settings', async () => {
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'team',
          ends_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active'
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('ACTIVE_TRIAL_EXISTS');
    });
  });

  describe('Scenario 3: New Users Only Trial Program', () => {
    test('should block user with expired trial when allowPreviousTrialUsers=false', async () => {
      sql.mockResolvedValueOnce({ rows: [] }); // No active trial
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          started_at: new Date(Date.now() - 30 * 86400000).toISOString(), // 30 days ago
          ends_at: new Date(Date.now() - 10 * 86400000).toISOString(), // Ended 10 days ago
          status: 'expired',
          duration_days: 14,
          source: 'invite',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString()
        }]
      }); // findAllByUserId

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: false,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('NEW_USERS_ONLY');
      expect(result.reason).toBe('This campaign is only available to new trial users');
      expect(result.trialCount).toBe(1);
      expect(result.lastTrialEndedAt).toBeDefined();
    });
  });

  describe('Scenario 4: Cooldown Period Active', () => {
    test('should block when within cooldown period', async () => {
      const now = new Date();
      const lastTrialEnd = new Date(now.getTime() - 30 * 86400000); // 30 days ago

      sql.mockResolvedValueOnce({ rows: [] }); // No active trial
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          ends_at: lastTrialEnd.toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'campaign',
          started_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString(),
          created_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString()
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 90, // Require 90 days, but only 30 have passed
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('COOLDOWN_PERIOD');
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(60);
      expect(result.daysSinceLastTrial).toBe(30);
      expect(result.reason).toMatch(/Trial available again in \d+ day/);
    });

    test('should allow when cooldown period has passed', async () => {
      const now = new Date();
      const lastTrialEnd = new Date(now.getTime() - 100 * 86400000); // 100 days ago

      sql.mockResolvedValueOnce({ rows: [] }); // No active trial
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          ends_at: lastTrialEnd.toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'invite',
          started_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString(),
          created_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString()
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 90,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('ELIGIBLE_RETURNING_USER');
      expect(result.daysSinceLastTrial).toBeGreaterThanOrEqual(100);
      expect(result.trialCount).toBe(1);
    });

    test('should calculate daysRemaining correctly', async () => {
      const now = new Date();
      const lastTrialEnd = new Date(now.getTime() - 45 * 86400000); // 45 days ago

      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          ends_at: lastTrialEnd.toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'invite',
          started_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString(),
          created_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString()
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 90,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('COOLDOWN_PERIOD');
      expect(result.daysRemaining).toBe(45); // 90 - 45 = 45 days remaining
      expect(result.daysSinceLastTrial).toBe(45);
    });
  });

  describe('Scenario 5: Max Trials Limit Reached', () => {
    test('should block when user has reached lifetime trial limit', async () => {
      sql.mockResolvedValueOnce({ rows: [] }); // No active trial
      sql.mockResolvedValueOnce({
        rows: [
          { id: 1, trial_tier: 'pro', ends_at: new Date(Date.now() - 100 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'invite', started_at: new Date(), created_at: new Date() },
          { id: 2, trial_tier: 'team', ends_at: new Date(Date.now() - 50 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'campaign', started_at: new Date(), created_at: new Date() },
          { id: 3, trial_tier: 'pro', ends_at: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'admin_grant', started_at: new Date(), created_at: new Date() }
        ]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('MAX_TRIALS_REACHED');
      expect(result.reason).toMatch(/Maximum trial limit reached \(3 trials per user\)/);
      expect(result.trialCount).toBe(3);
    });

    test('should allow when under the limit', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: [
          { id: 1, trial_tier: 'pro', ends_at: new Date(Date.now() - 100 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'invite', started_at: new Date(), created_at: new Date() },
          { id: 2, trial_tier: 'team', ends_at: new Date(Date.now() - 50 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'campaign', started_at: new Date(), created_at: new Date() }
        ]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('ELIGIBLE_RETURNING_USER');
      expect(result.trialCount).toBe(2);
    });

    test('should allow user under system-wide trial limit (1 < 3)', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: [
          { id: 1, trial_tier: 'pro', ends_at: new Date(Date.now() - 100 * 86400000).toISOString(), status: 'expired', duration_days: 14, source: 'invite', started_at: new Date(), created_at: new Date() }
        ]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('ELIGIBLE_RETURNING_USER');
      expect(result.trialCount).toBe(1);
    });
  });

  describe('Scenario 6: Eligible Returning User', () => {
    test('should allow user with expired trial when all conditions met', async () => {
      const now = new Date();
      const lastTrialEnd = new Date(now.getTime() - 100 * 86400000); // 100 days ago

      sql.mockResolvedValueOnce({ rows: [] }); // No active trial
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          user_id: 1,
          trial_tier: 'pro',
          ends_at: lastTrialEnd.toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'invite',
          started_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString(),
          created_at: new Date(lastTrialEnd.getTime() - 14 * 86400000).toISOString()
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 90,
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('ELIGIBLE_RETURNING_USER');
      expect(result.reason).toBeNull();
      expect(result.trialCount).toBe(1);
      expect(result.daysSinceLastTrial).toBeGreaterThanOrEqual(100);
      expect(result.lastTrialEndedAt).toBe(lastTrialEnd.toISOString());
    });

    test('should include all metadata in response', async () => {
      const now = new Date();
      const lastTrialEnd = new Date(now.getTime() - 120 * 86400000);

      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: [
          { id: 1, trial_tier: 'pro', ends_at: lastTrialEnd.toISOString(), status: 'expired', duration_days: 14, source: 'campaign', started_at: new Date(), created_at: new Date() }
        ]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 60,
      });

      expect(result).toMatchObject({
        eligible: true,
        code: 'ELIGIBLE_RETURNING_USER',
        reason: null,
        trialCount: 1,
        daysSinceLastTrial: expect.any(Number),
        lastTrialEndedAt: expect.any(String)
      });
    });
  });

  describe('Edge Cases & Default Values', () => {
    test('should handle missing campaign settings with defaults', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({ rows: [] });

      const result = await Trial.checkEligibilityForProgram(1, {});

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('NEW_USER');
    });

    test('should handle cooldownDays=0 (no cooldown required)', async () => {
      const yesterday = new Date(Date.now() - 86400000);

      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          trial_tier: 'pro',
          ends_at: yesterday.toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'invite',
          started_at: new Date(),
          created_at: new Date()
        }]
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0, // No cooldown
      });

      expect(result.eligible).toBe(true);
      expect(result.code).toBe('ELIGIBLE_RETURNING_USER');
    });

    test('should block user over system-wide trial limit (5 > 3)', async () => {
      sql.mockResolvedValueOnce({ rows: [] });
      sql.mockResolvedValueOnce({
        rows: new Array(5).fill(null).map((_, i) => ({
          id: i + 1,
          trial_tier: 'pro',
          ends_at: new Date(Date.now() - (100 + i * 10) * 86400000).toISOString(),
          status: 'expired',
          duration_days: 14,
          source: 'campaign',
          started_at: new Date(),
          created_at: new Date()
        }))
      });

      const result = await Trial.checkEligibilityForProgram(1, {
        allowPreviousTrialUsers: true,
        cooldownDays: 0,
      });

      expect(result.eligible).toBe(false);
      expect(result.code).toBe('MAX_TRIALS_REACHED');
      expect(result.reason).toMatch(/Maximum trial limit reached \(3 trials per user\)/);
      expect(result.trialCount).toBe(5);
    });
  });
});
