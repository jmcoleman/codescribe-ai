/**
 * Unit tests for trialService
 *
 * Tests trial operations including:
 * - Creating invite codes
 * - Validating invite codes
 * - Redeeming invite codes
 * - Getting active trial
 * - Checking trial status
 * - Ending and extending trials
 * - Processing expired trials
 * - Getting analytics
 *
 * Pattern 11: ES Modules vs CommonJS (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock models BEFORE importing trialService
jest.mock('../../models/InviteCode.js');
jest.mock('../../models/Trial.js');
jest.mock('../../models/User.js');
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn().mockResolvedValue({ rows: [] })
}));

import { trialService } from '../trialService.js';
import InviteCode from '../../models/InviteCode.js';
import Trial from '../../models/Trial.js';
import { sql } from '@vercel/postgres';

describe('TrialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set APP_URL for tests
    process.env.APP_URL = 'https://test.codescribeai.com';
  });

  // ============================================================================
  // INVITE CODE OPERATIONS
  // ============================================================================

  describe('createInviteCode', () => {
    it('should create an invite code with admin user ID', async () => {
      const mockCode = {
        id: 1,
        code: 'TEST-CODE-1234',
        trial_tier: 'pro',
        duration_days: 14,
        max_uses: 5
      };
      InviteCode.create.mockResolvedValue(mockCode);

      const options = {
        trialTier: 'pro',
        durationDays: 14,
        maxUses: 5
      };
      const result = await trialService.createInviteCode(options, 42);

      expect(InviteCode.create).toHaveBeenCalledWith({
        ...options,
        createdByUserId: 42
      });
      expect(result).toHaveProperty('inviteUrl');
      expect(result.inviteUrl).toBe('https://test.codescribeai.com/trial?code=TEST-CODE-1234');
    });

    it('should use default APP_URL when not set', async () => {
      delete process.env.APP_URL;
      const mockCode = { id: 1, code: 'ABCD-EFGH-IJKL' };
      InviteCode.create.mockResolvedValue(mockCode);

      const result = await trialService.createInviteCode({}, 1);

      expect(result.inviteUrl).toBe('https://codescribeai.com/trial?code=ABCD-EFGH-IJKL');
    });
  });

  describe('validateInviteCode', () => {
    it('should validate a valid invite code', async () => {
      const mockValidation = {
        valid: true,
        tier: 'pro',
        durationDays: 14,
        inviteCodeId: 1
      };
      InviteCode.validate.mockResolvedValue(mockValidation);

      const result = await trialService.validateInviteCode('TEST-CODE');

      expect(InviteCode.validate).toHaveBeenCalledWith('TEST-CODE');
      expect(result).toEqual(mockValidation);
    });

    it('should return invalid for expired code', async () => {
      InviteCode.validate.mockResolvedValue({
        valid: false,
        reason: 'This invite code has expired'
      });

      const result = await trialService.validateInviteCode('EXPIRED-CODE');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });
  });

  describe('redeemInviteCode', () => {
    it('should redeem a valid invite code and create trial', async () => {
      // Mock eligibility check
      Trial.checkEligibility.mockResolvedValue({ eligible: true, reason: null });

      // Mock code validation
      InviteCode.validate.mockResolvedValue({
        valid: true,
        tier: 'pro',
        durationDays: 14,
        inviteCodeId: 1
      });

      // Mock code redemption
      InviteCode.redeem.mockResolvedValue({
        id: 1,
        trial_tier: 'pro',
        duration_days: 14
      });

      // Mock trial creation
      const mockTrial = {
        id: 100,
        trial_tier: 'pro',
        duration_days: 14,
        started_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };
      Trial.create.mockResolvedValue(mockTrial);

      const result = await trialService.redeemInviteCode('TEST-CODE', 42);

      expect(Trial.checkEligibility).toHaveBeenCalledWith(42);
      expect(InviteCode.validate).toHaveBeenCalledWith('TEST-CODE');
      expect(InviteCode.redeem).toHaveBeenCalledWith('TEST-CODE');
      expect(Trial.create).toHaveBeenCalledWith({
        userId: 42,
        inviteCodeId: 1,
        trialTier: 'pro',
        durationDays: 14,
        source: 'invite'
      });
      expect(sql).toHaveBeenCalled(); // Update user's trial_used_at
      expect(result.trialId).toBe(100);
      expect(result.trialTier).toBe('pro');
    });

    it('should throw error if user not eligible', async () => {
      Trial.checkEligibility.mockResolvedValue({
        eligible: false,
        reason: 'You have already used a trial'
      });

      await expect(trialService.redeemInviteCode('CODE', 42))
        .rejects.toThrow('You have already used a trial');
    });

    it('should throw error if invite code invalid', async () => {
      Trial.checkEligibility.mockResolvedValue({ eligible: true });
      InviteCode.validate.mockResolvedValue({
        valid: false,
        reason: 'Invalid invite code'
      });

      await expect(trialService.redeemInviteCode('BAD-CODE', 42))
        .rejects.toThrow('Invalid invite code');
    });
  });

  // ============================================================================
  // TRIAL OPERATIONS
  // ============================================================================

  describe('getActiveTrial', () => {
    it('should return active trial for user', async () => {
      const mockTrial = {
        id: 1,
        user_id: 42,
        trial_tier: 'pro',
        status: 'active'
      };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);

      const result = await trialService.getActiveTrial(42);

      expect(Trial.findActiveByUserId).toHaveBeenCalledWith(42);
      expect(result).toEqual(mockTrial);
    });

    it('should return null if no active trial', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      const result = await trialService.getActiveTrial(42);

      expect(result).toBeNull();
    });
  });

  describe('isTrialActive', () => {
    it('should return true when user has active trial', async () => {
      Trial.findActiveByUserId.mockResolvedValue({ id: 1 });

      const result = await trialService.isTrialActive(42);

      expect(result).toBe(true);
    });

    it('should return false when user has no active trial', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      const result = await trialService.isTrialActive(42);

      expect(result).toBe(false);
    });
  });

  describe('getTrialStatus', () => {
    it('should return full status for user with active trial', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockTrial = {
        id: 1,
        trial_tier: 'pro',
        ends_at: futureDate.toISOString(),
        started_at: new Date().toISOString(),
        duration_days: 14,
        source: 'invite',
        extended_by_days: 0,
        original_ends_at: null
      };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.checkEligibility.mockResolvedValue({ eligible: false, reason: 'Has trial' });

      const result = await trialService.getTrialStatus(42);

      expect(result.hasActiveTrial).toBe(true);
      expect(result.trialTier).toBe('pro');
      expect(result.daysRemaining).toBe(7);
      expect(result.source).toBe('invite');
    });

    it('should return eligible status for user without trial', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);
      Trial.checkEligibility.mockResolvedValue({ eligible: true, reason: null });

      const result = await trialService.getTrialStatus(42);

      expect(result.hasActiveTrial).toBe(false);
      expect(result.isEligible).toBe(true);
      expect(result.trialTier).toBeNull();
    });

    it('should indicate trial was extended', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const mockTrial = {
        id: 1,
        trial_tier: 'pro',
        ends_at: futureDate.toISOString(),
        started_at: new Date().toISOString(),
        duration_days: 14,
        source: 'invite',
        extended_by_days: 7,
        original_ends_at: new Date().toISOString()
      };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.checkEligibility.mockResolvedValue({ eligible: false });

      const result = await trialService.getTrialStatus(42);

      expect(result.wasExtended).toBe(true);
      expect(result.originalEndsAt).toBeTruthy();
    });
  });

  describe('getTrialTier', () => {
    it('should return trial tier for active trial', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      Trial.findActiveByUserId.mockResolvedValue({
        trial_tier: 'team',
        ends_at: futureDate.toISOString()
      });

      const result = await trialService.getTrialTier(42);

      expect(result).toBe('team');
    });

    it('should return null for expired trial', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      Trial.findActiveByUserId.mockResolvedValue({
        trial_tier: 'pro',
        ends_at: pastDate.toISOString()
      });

      const result = await trialService.getTrialTier(42);

      expect(result).toBeNull();
    });

    it('should return null when no trial exists', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      const result = await trialService.getTrialTier(42);

      expect(result).toBeNull();
    });
  });

  describe('endTrial', () => {
    it('should cancel trial when reason is cancel', async () => {
      const mockTrial = { id: 1, status: 'active' };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.cancel.mockResolvedValue({ id: 1, status: 'cancelled' });

      const result = await trialService.endTrial(42, 'cancel');

      expect(Trial.cancel).toHaveBeenCalledWith(1);
      expect(result.status).toBe('cancelled');
    });

    it('should expire trial when reason is not cancel', async () => {
      const mockTrial = { id: 1, status: 'active' };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.expire.mockResolvedValue({ id: 1, status: 'expired' });

      const result = await trialService.endTrial(42, 'expire');

      expect(Trial.expire).toHaveBeenCalledWith(1);
      expect(result.status).toBe('expired');
    });

    it('should throw error if no active trial', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      await expect(trialService.endTrial(42))
        .rejects.toThrow('User does not have an active trial');
    });
  });

  describe('extendTrial', () => {
    it('should extend trial by additional days', async () => {
      const mockTrial = { id: 1, status: 'active' };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.extend.mockResolvedValue({
        id: 1,
        extended_by_days: 7,
        extension_reason: 'Customer request'
      });

      const result = await trialService.extendTrial(42, 7, 'Customer request');

      expect(Trial.extend).toHaveBeenCalledWith(1, 7, 'Customer request');
      expect(result.extended_by_days).toBe(7);
    });

    it('should throw error if no active trial to extend', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      await expect(trialService.extendTrial(42, 7, 'reason'))
        .rejects.toThrow('User does not have an active trial');
    });
  });

  // ============================================================================
  // CRON JOB SUPPORT
  // ============================================================================

  describe('processExpiredTrials', () => {
    it('should process all expired trials', async () => {
      const expiredTrials = [
        { id: 1, user_id: 10, first_name: 'John', last_name: 'Doe' },
        { id: 2, user_id: 20, first_name: null, last_name: null }
      ];
      Trial.getExpired.mockResolvedValue(expiredTrials);
      Trial.expire.mockResolvedValue({});
      InviteCode.updateExpiredCodes.mockResolvedValue(0);

      const result = await trialService.processExpiredTrials();

      expect(Trial.expire).toHaveBeenCalledTimes(2);
      expect(sql).toHaveBeenCalledTimes(2); // Update user eligibility
      expect(InviteCode.updateExpiredCodes).toHaveBeenCalled();
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      // Should include expiredTrials list with user_name
      expect(result.expiredTrials).toHaveLength(2);
      expect(result.expiredTrials[0].user_name).toBe('John Doe');
      expect(result.expiredTrials[1].user_name).toBe(null);
    });

    it('should track failed trial processing', async () => {
      const expiredTrials = [{ id: 1, user_id: 10 }];
      Trial.getExpired.mockResolvedValue(expiredTrials);
      Trial.expire.mockRejectedValue(new Error('DB error'));
      InviteCode.updateExpiredCodes.mockResolvedValue(0);

      const result = await trialService.processExpiredTrials();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toBe('DB error');
      expect(result.expiredTrials).toHaveLength(0);
    });

    it('should handle empty expired trials list', async () => {
      Trial.getExpired.mockResolvedValue([]);
      InviteCode.updateExpiredCodes.mockResolvedValue(0);

      const result = await trialService.processExpiredTrials();

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.expiredTrials).toHaveLength(0);
    });
  });

  describe('getExpiringTrials', () => {
    it('should get trials expiring within specified days', async () => {
      const expiringTrials = [{ id: 1, user_email: 'test@example.com' }];
      Trial.getExpiring.mockResolvedValue(expiringTrials);

      const result = await trialService.getExpiringTrials(3);

      expect(Trial.getExpiring).toHaveBeenCalledWith(3);
      // Should add user_name field from first_name/last_name
      expect(result).toEqual([{ id: 1, user_email: 'test@example.com', user_name: null }]);
    });

    it('should add user_name from first_name and last_name', async () => {
      const expiringTrials = [
        { id: 1, user_email: 'test@example.com', first_name: 'John', last_name: 'Doe' }
      ];
      Trial.getExpiring.mockResolvedValue(expiringTrials);

      const result = await trialService.getExpiringTrials(3);

      expect(result[0].user_name).toBe('John Doe');
    });

    it('should handle only first_name', async () => {
      const expiringTrials = [
        { id: 1, user_email: 'test@example.com', first_name: 'John', last_name: null }
      ];
      Trial.getExpiring.mockResolvedValue(expiringTrials);

      const result = await trialService.getExpiringTrials(3);

      expect(result[0].user_name).toBe('John');
    });
  });

  describe('convertTrial', () => {
    it('should convert active trial to subscription', async () => {
      const mockTrial = { id: 1, status: 'active' };
      Trial.findActiveByUserId.mockResolvedValue(mockTrial);
      Trial.convert.mockResolvedValue({
        id: 1,
        status: 'converted',
        converted_to_tier: 'pro'
      });

      const result = await trialService.convertTrial(42, 'pro', 123);

      expect(Trial.convert).toHaveBeenCalledWith(1, 'pro', 123);
      expect(result.status).toBe('converted');
    });

    it('should return null if no active trial to convert', async () => {
      Trial.findActiveByUserId.mockResolvedValue(null);

      const result = await trialService.convertTrial(42, 'pro');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  describe('getAnalytics', () => {
    it('should return combined trial and invite code stats', async () => {
      const trialStats = {
        total_count: 100,
        active_count: 20,
        converted_count: 50
      };
      const inviteStats = {
        total_codes: 25,
        active_codes: 10
      };

      Trial.getStats.mockResolvedValue(trialStats);
      InviteCode.getStats.mockResolvedValue(inviteStats);

      const result = await trialService.getAnalytics();

      expect(result.trials).toEqual(trialStats);
      expect(result.inviteCodes).toEqual(inviteStats);
    });
  });
});
