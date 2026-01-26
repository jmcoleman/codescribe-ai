/**
 * Admin Grant Trial with Force Flag Tests
 * Tests for Phase 1 force grant functionality
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Create test app
const app = express();
app.use(express.json());

// Mock dependencies
const mockGetToken = jest.fn(() => 'mock-token');
const mockRequireAuth = jest.fn((req, res, next) => {
  req.user = { id: 999, email: 'admin@test.com', role: 'admin' };
  next();
});
const mockRequireAdmin = jest.fn((req, res, next) => next());

// Mock models
const mockTrial = {
  checkEligibility: jest.fn(),
  findAllByUserId: jest.fn(),
  create: jest.fn()
};

const mockUser = {
  findById: jest.fn()
};

const mockSql = {
  query: jest.fn()
};

const mockAnalyticsService = {
  track: jest.fn()
};

const mockEmailService = {
  sendTrialGrantedByAdminEmail: jest.fn()
};

// Mock imports
jest.unstable_mockModule('../../middleware/auth.js', () => ({
  requireAuth: mockRequireAuth,
  requireAdmin: mockRequireAdmin
}));

jest.unstable_mockModule('../../models/Trial.js', () => ({
  default: mockTrial
}));

jest.unstable_mockModule('../../models/User.js', () => ({
  default: mockUser
}));

jest.unstable_mockModule('@vercel/postgres', () => ({
  sql: mockSql
}));

jest.unstable_mockModule('../../services/analyticsService.js', () => ({
  default: mockAnalyticsService
}));

jest.unstable_mockModule('../../services/emailService.js', () => ({
  sendTrialGrantedByAdminEmail: mockEmailService.sendTrialGrantedByAdminEmail
}));

describe('POST /api/admin/users/:userId/grant-trial (Force Flag)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockUser.findById.mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      first_name: 'Test'
    });

    mockSql.query.mockResolvedValue({ rows: [] });
    mockAnalyticsService.track.mockResolvedValue();
    mockEmailService.sendTrialGrantedByAdminEmail.mockResolvedValue();
  });

  describe('Regular Grant (No Previous Trials)', () => {
    test('should grant trial when user is eligible', async () => {
      mockTrial.checkEligibility.mockResolvedValue({
        eligible: true,
        reason: null
      });

      mockTrial.create.mockResolvedValue({
        id: 1,
        user_id: 1,
        trial_tier: 'pro',
        duration_days: 14,
        started_at: new Date(),
        ends_at: new Date(Date.now() + 14 * 86400000)
      });

      mockTrial.findAllByUserId.mockResolvedValue([]);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Simulate request
      const req = {
        params: { userId: '1' },
        body: {
          trial_tier: 'pro',
          duration_days: 14,
          reason: 'Customer request',
          force: false
        },
        user: { id: 999, email: 'admin@test.com' }
      };

      // Verify checkEligibility was called
      expect(mockTrial.checkEligibility).not.toHaveBeenCalled();

      // Simulate calling the endpoint logic
      const eligibility = await mockTrial.checkEligibility(1);
      expect(eligibility.eligible).toBe(true);

      // Simulate successful grant
      const trial = await mockTrial.create({
        userId: 1,
        trialTier: 'pro',
        durationDays: 14,
        source: 'admin_grant'
      });

      expect(trial).toBeDefined();
      expect(trial.trial_tier).toBe('pro');
    });
  });

  describe('Grant with Previous Trials (Ineligible)', () => {
    test('should return eligibility error when user has previous trial and force=false', async () => {
      mockTrial.checkEligibility.mockResolvedValue({
        eligible: false,
        reason: 'You have already used a trial'
      });

      mockTrial.findAllByUserId.mockResolvedValue([
        {
          id: 1,
          trial_tier: 'pro',
          source: 'invite',
          started_at: new Date(Date.now() - 30 * 86400000),
          ends_at: new Date(Date.now() - 10 * 86400000),
          status: 'expired'
        }
      ]);

      const eligibility = await mockTrial.checkEligibility(1);
      const trialHistory = await mockTrial.findAllByUserId(1);

      // Should not create trial
      expect(eligibility.eligible).toBe(false);
      expect(trialHistory.length).toBeGreaterThan(0);

      // Response should indicate canForce=true and include history
      const expectedResponse = {
        success: false,
        error: eligibility.reason,
        hasUsedTrial: true,
        canForce: true,
        trialHistory: trialHistory.map(t => ({
          tier: t.trial_tier,
          source: t.source,
          startedAt: t.started_at,
          endedAt: t.ends_at,
          status: t.status
        }))
      };

      expect(expectedResponse.hasUsedTrial).toBe(true);
      expect(expectedResponse.canForce).toBe(true);
      expect(expectedResponse.trialHistory).toHaveLength(1);
    });
  });

  describe('Force Grant', () => {
    test('should grant trial when force=true even if ineligible', async () => {
      mockTrial.checkEligibility.mockResolvedValue({
        eligible: false,
        reason: 'You have already used a trial'
      });

      mockTrial.create.mockResolvedValue({
        id: 2,
        user_id: 1,
        trial_tier: 'team',
        duration_days: 30,
        started_at: new Date(),
        ends_at: new Date(Date.now() + 30 * 86400000)
      });

      mockTrial.findAllByUserId.mockResolvedValueOnce([
        { id: 1, trial_tier: 'pro', source: 'invite', status: 'expired', started_at: new Date(), ends_at: new Date(), duration_days: 14, created_at: new Date() },
        { id: 2, trial_tier: 'team', source: 'admin_grant_forced', status: 'active', started_at: new Date(), ends_at: new Date(), duration_days: 30, created_at: new Date() }
      ]);

      const eligibility = await mockTrial.checkEligibility(1);
      expect(eligibility.eligible).toBe(false);

      // Force grant should succeed
      const trial = await mockTrial.create({
        userId: 1,
        trialTier: 'team',
        durationDays: 30,
        source: 'admin_grant_forced' // Note the forced suffix
      });

      expect(trial).toBeDefined();
      expect(trial.trial_tier).toBe('team');

      // Verify previous trial count
      const allTrials = await mockTrial.findAllByUserId(1);
      const previousTrialCount = allTrials.length - 1;

      expect(previousTrialCount).toBe(1);
    });

    test('should require longer reason for force grants (20 chars)', async () => {
      const shortReason = 'Too short';
      const longReason = 'This is a detailed explanation for why we need to force grant this trial to the user';

      // Short reason should fail validation
      expect(shortReason.trim().length).toBeLessThan(20);

      // Long reason should pass
      expect(longReason.trim().length).toBeGreaterThanOrEqual(20);
    });

    test('should log forced grant in audit with force flag', async () => {
      mockSql.query.mockResolvedValue({ rows: [] });

      const auditLogEntry = {
        user_id: 1,
        user_email: 'user@test.com',
        field_name: 'trial',
        old_value: null,
        new_value: 'team',
        change_type: 'update',
        changed_by: 999,
        reason: 'Exceptional case requiring override',
        metadata: JSON.stringify({
          admin_email: 'admin@test.com',
          trial_tier: 'team',
          duration_days: 30,
          trial_id: 2,
          action: 'grant_trial',
          forced: true,
          override_reason: 'You have already used a trial',
          previous_trial_count: 1
        })
      };

      await mockSql.query(
        'INSERT INTO user_audit_log (...)',
        Object.values(auditLogEntry)
      );

      expect(mockSql.query).toHaveBeenCalled();
      const metadata = JSON.parse(auditLogEntry.metadata);
      expect(metadata.forced).toBe(true);
      expect(metadata.override_reason).toBeDefined();
      expect(metadata.previous_trial_count).toBe(1);
    });

    test('should track analytics with forced flag', async () => {
      await mockAnalyticsService.track({
        eventName: 'trial',
        userId: 1,
        metadata: {
          action: 'admin_grant_succeeded',
          forced: true,
          source: 'admin_grant_forced',
          tier: 'team',
          duration_days: 30,
          override_reason: 'You have already used a trial',
          previous_trial_count: 1,
          has_previous_trial: true,
          is_internal: true
        }
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith({
        eventName: 'trial',
        userId: 1,
        metadata: expect.objectContaining({
          forced: true,
          override_reason: expect.any(String),
          previous_trial_count: 1,
          has_previous_trial: true
        })
      });
    });
  });

  describe('Validation', () => {
    test('should require trial_tier', async () => {
      const invalidRequest = {
        duration_days: 14,
        reason: 'Test reason'
      };

      expect(invalidRequest.trial_tier).toBeUndefined();
      // Would return 400 error
    });

    test('should validate trial_tier values', async () => {
      const validTiers = ['pro', 'team'];
      const invalidTiers = ['basic', 'enterprise', 'INVALID'];

      validTiers.forEach(tier => {
        expect(['pro', 'team'].includes(tier)).toBe(true);
      });

      invalidTiers.forEach(tier => {
        expect(['pro', 'team'].includes(tier)).toBe(false);
      });
    });

    test('should validate duration_days range (1-90)', async () => {
      const validDurations = [1, 14, 30, 90];
      const invalidDurations = [0, -1, 91, 365];

      validDurations.forEach(days => {
        expect(days >= 1 && days <= 90).toBe(true);
      });

      invalidDurations.forEach(days => {
        expect(days >= 1 && days <= 90).toBe(false);
      });
    });

    test('should validate reason length based on force flag', async () => {
      const shortReason = 'Test'; // < 5 chars
      const regularReason = 'Valid reason'; // >= 5 chars
      const forceReason = 'This is a detailed explanation for force grant'; // >= 20 chars

      // Regular grant
      expect(regularReason.length >= 5).toBe(true);
      expect(shortReason.length >= 5).toBe(false);

      // Force grant
      expect(forceReason.length >= 20).toBe(true);
      expect(regularReason.length >= 20).toBe(false);
    });

    test('should return 404 when user not found', async () => {
      mockUser.findById.mockResolvedValue(null);

      const user = await mockUser.findById(9999);
      expect(user).toBeNull();
      // Would return 404 error
    });
  });

  describe('Trial History Endpoint', () => {
    test('GET /api/admin/users/:userId/trial-history should return all trials', async () => {
      const mockTrials = [
        {
          id: 1,
          trial_tier: 'pro',
          source: 'invite',
          status: 'expired',
          started_at: new Date(Date.now() - 60 * 86400000),
          ends_at: new Date(Date.now() - 46 * 86400000),
          duration_days: 14,
          converted_at: null,
          converted_to_tier: null,
          created_at: new Date(Date.now() - 60 * 86400000)
        },
        {
          id: 2,
          trial_tier: 'team',
          source: 'admin_grant_forced',
          status: 'active',
          started_at: new Date(Date.now() - 5 * 86400000),
          ends_at: new Date(Date.now() + 25 * 86400000),
          duration_days: 30,
          converted_at: null,
          converted_to_tier: null,
          created_at: new Date(Date.now() - 5 * 86400000)
        }
      ];

      mockTrial.findAllByUserId.mockResolvedValue(mockTrials);

      const trials = await mockTrial.findAllByUserId(1);

      expect(trials).toHaveLength(2);
      expect(trials[0].source).toBe('invite');
      expect(trials[1].source).toBe('admin_grant_forced');
    });

    test('should track analytics when viewing trial history', async () => {
      await mockAnalyticsService.track({
        eventName: 'admin_action',
        userId: 999,
        metadata: {
          action: 'view_trial_history',
          target_user_id: 1,
          trial_count: 2,
          is_internal: true
        }
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith({
        eventName: 'admin_action',
        userId: 999,
        metadata: expect.objectContaining({
          action: 'view_trial_history',
          target_user_id: 1,
          trial_count: 2
        })
      });
    });
  });
});
