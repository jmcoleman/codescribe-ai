/**
 * Unit tests for tierGate middleware
 * Tests tier-based authorization and usage limit enforcement
 */

import {
  requireFeature,
  requireTier,
  checkUsage,
  addTierHeaders,
  incrementUsage,
  getTierInfoForClient,
} from '../tierGate.js';

// Mock dependencies
jest.mock('../../config/tiers.js');
jest.mock('../../models/Usage.js');

import * as tiers from '../../config/tiers.js';
import Usage from '../../models/Usage.js';

describe('tierGate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      ip: '192.168.1.1',
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireFeature', () => {
    it('should allow access if feature is available in user tier', () => {
      req.user = { tier: 'pro' };
      tiers.hasFeature.mockReturnValue(true);

      const middleware = requireFeature('batchProcessing');
      middleware(req, res, next);

      expect(tiers.hasFeature).toHaveBeenCalledWith('pro', 'batchProcessing');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access if feature is not available in user tier', () => {
      req.user = { tier: 'free' };
      tiers.hasFeature.mockReturnValue(false);
      tiers.getUpgradePath.mockReturnValue({
        availableIn: ['pro', 'team'],
        recommendedUpgrade: 'pro',
        pricing: { price: 29, period: 'month' },
      });

      const middleware = requireFeature('batchProcessing');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upgrade Required',
        message: 'Feature "batchProcessing" is not available in your current plan.',
        feature: 'batchProcessing',
        currentTier: 'free',
        availableIn: ['pro', 'team'],
        recommendedTier: 'pro',
        pricing: { price: 29, period: 'month' },
        upgradePath: '/pricing',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should default to free tier if user not authenticated', () => {
      tiers.hasFeature.mockReturnValue(true);

      const middleware = requireFeature('basicDocs');
      middleware(req, res, next);

      expect(tiers.hasFeature).toHaveBeenCalledWith('free', 'basicDocs');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('checkUsage', () => {
    it('should allow request if usage is within limits', async () => {
      req.user = { id: 1, tier: 'free' };
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 2,
        monthlyGenerations: 8,
        resetDate: new Date(),
      });
      tiers.checkUsageLimits.mockReturnValue({
        allowed: true,
        remaining: { daily: 1, monthly: 2 },
      });

      const middleware = checkUsage();
      await middleware(req, res, next);

      expect(Usage.getUserUsage).toHaveBeenCalledWith(1);
      expect(next).toHaveBeenCalled();
      expect(req.usage).toEqual({
        tier: 'free',
        remaining: { daily: 1, monthly: 2 },
      });
    });

    it('should deny request if daily limit exceeded', async () => {
      req.user = { id: 1, tier: 'free' };
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 3,
        monthlyGenerations: 9,
        resetDate: new Date('2025-10-29'),
      });
      tiers.checkUsageLimits.mockReturnValue({
        allowed: false,
        remaining: { daily: 0, monthly: 1 },
      });
      tiers.getTierFeatures.mockReturnValue({
        maxFileSize: 100000,
        dailyGenerations: 3,
        monthlyGenerations: 10,
      });
      tiers.getUpgradePath.mockReturnValue({
        recommendedUpgrade: 'pro',
        pricing: { price: 29, period: 'month' },
      });

      const middleware = checkUsage();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usage Limit Exceeded',
          message: 'You have reached your usage limit for this period.',
          currentTier: 'free',
          limits: {
            maxFileSize: 100000,
            dailyGenerations: 3,
            monthlyGenerations: 10,
          },
          usage: {
            dailyGenerations: 3,
            monthlyGenerations: 9,
          },
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should track anonymous users by IP address', async () => {
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 1,
        monthlyGenerations: 5,
        resetDate: new Date(),
      });
      tiers.checkUsageLimits.mockReturnValue({
        allowed: true,
        remaining: { daily: 2, monthly: 5 },
      });

      const middleware = checkUsage();
      await middleware(req, res, next);

      expect(Usage.getUserUsage).toHaveBeenCalledWith('ip:192.168.1.1');
      expect(next).toHaveBeenCalled();
    });

    it('should check file size from req.file', async () => {
      req.user = { id: 1, tier: 'free' };
      req.file = { size: 50000 };
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 0,
        monthlyGenerations: 0,
        resetDate: new Date(),
      });
      tiers.checkUsageLimits.mockReturnValue({
        allowed: true,
        remaining: { daily: 3, monthly: 10 },
      });

      const middleware = checkUsage();
      await middleware(req, res, next);

      expect(tiers.checkUsageLimits).toHaveBeenCalledWith(
        'free',
        expect.objectContaining({ fileSize: 50000 })
      );
    });

    it('should check file size from req.body.code', async () => {
      req.user = { id: 1, tier: 'free' };
      req.body.code = 'const x = 1;'; // 12 characters
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 0,
        monthlyGenerations: 0,
        resetDate: new Date(),
      });
      tiers.checkUsageLimits.mockReturnValue({
        allowed: true,
        remaining: { daily: 3, monthly: 10 },
      });

      const middleware = checkUsage();
      await middleware(req, res, next);

      expect(tiers.checkUsageLimits).toHaveBeenCalledWith(
        'free',
        expect.objectContaining({ fileSize: 12 })
      );
    });
  });

  describe('requireTier', () => {
    it('should allow access if user tier meets minimum requirement', () => {
      req.user = { tier: 'team' };

      const middleware = requireTier('pro');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access if user tier is below minimum', () => {
      req.user = { tier: 'free' };

      const middleware = requireTier('team');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upgrade Required',
        message: 'This endpoint requires team tier or higher.',
        currentTier: 'free',
        requiredTier: 'team',
        upgradePath: '/pricing',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user has exact minimum tier', () => {
      req.user = { tier: 'pro' };

      const middleware = requireTier('pro');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should default to free tier if user not authenticated', () => {
      const middleware = requireTier('pro');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ currentTier: 'free' })
      );
    });
  });

  describe('addTierHeaders', () => {
    it('should add tier info to response headers', async () => {
      req.user = { id: 1, tier: 'pro' };
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 10,
        monthlyGenerations: 50,
      });
      tiers.getTierFeatures.mockReturnValue({
        dailyGenerations: 50,
        monthlyGenerations: 200,
      });

      const middleware = addTierHeaders();
      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-CodeScribe-Tier': 'pro',
        'X-CodeScribe-Daily-Limit': 50,
        'X-CodeScribe-Daily-Remaining': 40,
        'X-CodeScribe-Monthly-Limit': 200,
        'X-CodeScribe-Monthly-Remaining': 150,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle unlimited tiers', async () => {
      req.user = { id: 1, tier: 'enterprise' };
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 100,
        monthlyGenerations: 500,
      });
      tiers.getTierFeatures.mockReturnValue({
        dailyGenerations: -1,
        monthlyGenerations: -1,
      });

      const middleware = addTierHeaders();
      await middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith({
        'X-CodeScribe-Tier': 'enterprise',
        'X-CodeScribe-Daily-Limit': -1,
        'X-CodeScribe-Daily-Remaining': 'unlimited',
        'X-CodeScribe-Monthly-Limit': -1,
        'X-CodeScribe-Monthly-Remaining': 'unlimited',
      });
    });

    it('should track anonymous users by IP', async () => {
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 1,
        monthlyGenerations: 5,
      });
      tiers.getTierFeatures.mockReturnValue({
        dailyGenerations: 3,
        monthlyGenerations: 10,
      });

      const middleware = addTierHeaders();
      await middleware(req, res, next);

      expect(Usage.getUserUsage).toHaveBeenCalledWith('ip:192.168.1.1');
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage for user ID', async () => {
      Usage.incrementUsage.mockResolvedValue({
        dailyGenerations: 3,
        monthlyGenerations: 8,
      });

      const result = await incrementUsage(123);

      expect(Usage.incrementUsage).toHaveBeenCalledWith(123, 1);
      expect(result).toEqual({
        dailyGenerations: 3,
        monthlyGenerations: 8,
      });
    });

    it('should increment usage by custom count', async () => {
      Usage.incrementUsage.mockResolvedValue({
        dailyGenerations: 5,
        monthlyGenerations: 15,
      });

      await incrementUsage(123, 5);

      expect(Usage.incrementUsage).toHaveBeenCalledWith(123, 5);
    });

    it('should increment usage for IP address', async () => {
      Usage.incrementUsage.mockResolvedValue({
        dailyGenerations: 2,
        monthlyGenerations: 6,
      });

      await incrementUsage('ip:192.168.1.1');

      expect(Usage.incrementUsage).toHaveBeenCalledWith('ip:192.168.1.1', 1);
    });
  });

  describe('getTierInfoForClient', () => {
    it('should return sanitized tier info', () => {
      tiers.getTierFeatures.mockReturnValue({
        maxFileSize: 100000,
        dailyGenerations: 3,
        monthlyGenerations: 10,
        documentTypes: ['README', 'JSDOC'],
        streaming: true,
        qualityScoring: true,
        batchProcessing: false,
        customTemplates: false,
        apiAccess: false,
        teamWorkspace: false,
        advancedParsing: false,
        slackIntegration: false,
        githubIntegration: false,
        cicdIntegration: false,
        ssoSaml: false,
        whiteLabel: false,
        support: 'community',
        sla: null,
      });

      const result = getTierInfoForClient('free');

      expect(tiers.getTierFeatures).toHaveBeenCalledWith('free');
      expect(result).toEqual({
        tier: 'free',
        features: {
          maxFileSize: 100000,
          dailyGenerations: 3,
          monthlyGenerations: 10,
          documentTypes: ['README', 'JSDOC'],
          streaming: true,
          qualityScoring: true,
          batchProcessing: false,
          customTemplates: false,
          apiAccess: false,
          teamWorkspace: false,
          advancedParsing: false,
          slackIntegration: false,
          githubIntegration: false,
          cicdIntegration: false,
          ssoSaml: false,
          whiteLabel: false,
        },
        support: 'community',
        sla: null,
      });
    });

    it('should default to free tier', () => {
      tiers.getTierFeatures.mockReturnValue({
        maxFileSize: 100000,
        dailyGenerations: 3,
        monthlyGenerations: 10,
        documentTypes: ['README'],
        streaming: true,
        qualityScoring: true,
        batchProcessing: false,
        customTemplates: false,
        apiAccess: false,
        teamWorkspace: false,
        advancedParsing: false,
        slackIntegration: false,
        githubIntegration: false,
        cicdIntegration: false,
        ssoSaml: false,
        whiteLabel: false,
        support: 'community',
        sla: null,
      });

      getTierInfoForClient();

      expect(tiers.getTierFeatures).toHaveBeenCalledWith('free');
    });
  });
});
