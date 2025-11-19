/**
 * Integration tests for usage and tier API endpoints
 * Tests GET /api/user/usage, GET /api/user/tier-features, GET /api/tiers
 */

import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing routes
jest.mock('../../models/Usage.js');
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    // Mock auth middleware - requires req.user to be present
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    next();
  },
  optionalAuth: (req, res, next) => {
    // optionalAuth passes through regardless of auth state
    next();
  },
}));
jest.mock('../../middleware/tierGate.js', () => ({
  checkUsage: () => (req, res, next) => next(),
  incrementUsage: jest.fn(),
  requireFeature: () => (req, res, next) => next(),
}));
jest.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: (req, res, next) => next(),
  generationLimiter: (req, res, next) => next(),
}));
jest.mock('../../services/docGenerator.js', () => ({
  generateDocumentation: jest.fn(),
}));

// Import AFTER all mocks are set up
import apiRoutes from '../api.js';
import Usage from '../../models/Usage.js';

describe('Usage and Tier API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware - attach user to request
    app.use((req, res, next) => {
      if (req.headers.authorization === 'Bearer valid-token') {
        req.user = { id: 1, tier: 'free' };
      }
      next();
    });

    app.use('/api', apiRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/user/usage', () => {
    it('should return user usage statistics', async () => {
      const mockDate = new Date('2025-10-28T12:00:00Z');
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 2,
        monthlyGenerations: 8,
        resetDate: mockDate,
        periodStart: new Date('2025-10-01'),
      });

      const res = await request(app)
        .get('/api/user/usage')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body).toMatchObject({
        tier: 'free',
        daily: {
          used: 2,
          limit: 3,
          remaining: 1,
        },
        monthly: {
          used: 8,
          limit: 10,
          remaining: 2,
        },
      });
      expect(res.body.resetTimes).toHaveProperty('daily');
      expect(res.body.resetTimes).toHaveProperty('monthly');
      expect(Usage.getUserUsage).toHaveBeenCalledWith(1);
    });

    it('should support anonymous users (IP-based tracking)', async () => {
      const mockDate = new Date('2025-10-28T12:00:00Z');
      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 1,
        monthlyGenerations: 5,
        resetDate: mockDate,
        periodStart: new Date('2025-10-01'),
      });

      const res = await request(app)
        .get('/api/user/usage')
        .expect(200);

      expect(res.body).toMatchObject({
        tier: 'free',
        daily: {
          used: 1,
          limit: 3,
          remaining: 2,
        },
        monthly: {
          used: 5,
          limit: 10,
          remaining: 5,
        },
      });

      // Should be called with IP-based identifier (format: "ip:127.0.0.1")
      expect(Usage.getUserUsage).toHaveBeenCalled();
      const callArg = Usage.getUserUsage.mock.calls[0][0];
      expect(typeof callArg).toBe('string');
      expect(callArg).toMatch(/^ip:/);
    });

    it('should handle unlimited tier', async () => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        if (req.headers.authorization === 'Bearer enterprise-token') {
          req.user = { id: 2, tier: 'enterprise' };
        }
        next();
      });
      app.use('/api', apiRoutes);

      Usage.getUserUsage.mockResolvedValue({
        dailyGenerations: 100,
        monthlyGenerations: 500,
        resetDate: new Date(),
        periodStart: new Date('2025-10-01'),
      });

      const res = await request(app)
        .get('/api/user/usage')
        .set('Authorization', 'Bearer enterprise-token')
        .expect(200);

      expect(res.body.daily.remaining).toBe('unlimited');
      expect(res.body.monthly.remaining).toBe('unlimited');
    });
  });

  describe('GET /api/user/tier-features', () => {
    it('should return user tier and features', async () => {
      const res = await request(app)
        .get('/api/user/tier-features')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body).toMatchObject({
        tier: 'free',
        features: {
          basicDocs: true,
          streaming: true,
          qualityScoring: true,
          monacoEditor: true,
          fileUpload: true,
          mermaidDiagrams: true,
          batchProcessing: false,
          customTemplates: false,
          apiAccess: false,
          priorityQueue: false,
          teamWorkspace: false,
          sharedTemplates: false,
          exportMarkdown: true,
          exportHtml: false,
          exportPdf: false,
        },
        limits: {
          maxFileSize: 100000,
          dailyGenerations: 3,
          monthlyGenerations: 10,
          maxUsers: 1,
        },
        support: 'community',
        sla: null,
      });
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/user/tier-features')
        .expect(401);

      expect(res.body).toMatchObject({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should return pro tier features for pro users', async () => {
      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        if (req.headers.authorization === 'Bearer pro-token') {
          req.user = { id: 3, tier: 'pro' };
        }
        next();
      });
      app.use('/api', apiRoutes);

      const res = await request(app)
        .get('/api/user/tier-features')
        .set('Authorization', 'Bearer pro-token')
        .expect(200);

      expect(res.body.tier).toBe('pro');
      expect(res.body.features.batchProcessing).toBe(true);
      expect(res.body.features.customTemplates).toBe(true);
      expect(res.body.limits.dailyGenerations).toBe(50);
      expect(res.body.limits.monthlyGenerations).toBe(200);
    });
  });

  describe('GET /api/tiers', () => {
    it('should return all tier definitions (public endpoint)', async () => {
      const res = await request(app)
        .get('/api/tiers')
        .expect(200);

      expect(res.body).toHaveProperty('tiers');
      expect(Array.isArray(res.body.tiers)).toBe(true);
      expect(res.body.tiers.length).toBe(5); // free, starter, pro, team, enterprise

      // Check free tier structure
      const freeTier = res.body.tiers.find(t => t.id === 'free');
      expect(freeTier).toMatchObject({
        id: 'free',
        name: 'Free',
        price: 0,
        period: null,
        limits: {
          maxFileSize: 100000,
          dailyGenerations: 3,
          monthlyGenerations: 10,
        },
        features: {
          streaming: true,
          qualityScoring: true,
          batchProcessing: false,
        },
        support: 'community',
      });
    });

    it('should not require authentication', async () => {
      const res = await request(app)
        .get('/api/tiers')
        .expect(200);

      expect(res.body).toHaveProperty('tiers');
    });

    it('should include pricing information for paid tiers', async () => {
      const res = await request(app)
        .get('/api/tiers')
        .expect(200);

      const starterTier = res.body.tiers.find(t => t.id === 'starter');
      expect(starterTier.price).toBe(12);
      expect(starterTier.period).toBe('month');
      expect(starterTier.annual).toBe(120);

      const proTier = res.body.tiers.find(t => t.id === 'pro');
      expect(proTier.price).toBe(29);
      expect(proTier.period).toBe('month');
    });

    it('should include all tier features', async () => {
      const res = await request(app)
        .get('/api/tiers')
        .expect(200);

      const teamTier = res.body.tiers.find(t => t.id === 'team');
      expect(teamTier.features).toHaveProperty('teamWorkspace');
      expect(teamTier.features).toHaveProperty('sharedTemplates');
      expect(teamTier.features).toHaveProperty('apiAccess');
      expect(teamTier.features.apiAccess).toBe(true);
    });
  });
});
