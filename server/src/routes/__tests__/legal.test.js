/**
 * Tests for Legal Routes
 *
 * Three endpoints for legal document management:
 * - GET /api/legal/versions - Get current versions (public)
 * - GET /api/legal/status - Check if user needs to re-accept (auth required)
 * - POST /api/legal/accept - Record user's acceptance (auth required)
 *
 * Tests use standard Jest mocking (CommonJS-style mocks before imports)
 */

import request from 'supertest';
import express from 'express';

// Mock User model BEFORE importing routes
jest.mock('../../models/User.js');

// Mock auth middleware BEFORE importing routes
jest.mock('../../middleware/auth.js', () => ({
  requireAuth: jest.fn((req, res, next) => {
    // Default: simulate authenticated user
    if (!req.user) {
      req.user = { id: 123 };
    }
    next();
  }),
}));

// Import mocked modules
import User from '../../models/User.js';
import { requireAuth } from '../../middleware/auth.js';

// Import routes AFTER mocks
import legalRouter from '../legal.js';

// Import constants for testing
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '../../constants/legalVersions.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/legal', legalRouter);

describe('Legal Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset requireAuth to default behavior
    requireAuth.mockImplementation((req, res, next) => {
      if (!req.user) {
        req.user = { id: 123 };
      }
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/legal/versions', () => {
    it('should return current versions of legal documents', async () => {
      const response = await request(app).get('/api/legal/versions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        terms: {
          version: CURRENT_TERMS_VERSION,
          effective_date: CURRENT_TERMS_VERSION,
          url: '/terms',
        },
        privacy: {
          version: CURRENT_PRIVACY_VERSION,
          effective_date: CURRENT_PRIVACY_VERSION,
          url: '/privacy',
        },
      });
    });

    it('should be accessible without authentication', async () => {
      const response = await request(app).get('/api/legal/versions');

      expect(response.status).toBe(200);
      expect(response.body.terms).toBeDefined();
      expect(response.body.privacy).toBeDefined();
    });

    it('should return correct version format', async () => {
      const response = await request(app).get('/api/legal/versions');

      expect(response.status).toBe(200);
      expect(response.body.terms.version).toBe('2025-11-02');
      expect(response.body.privacy.version).toBe('2025-11-02');
    });

    it('should include URLs to legal pages', async () => {
      const response = await request(app).get('/api/legal/versions');

      expect(response.status).toBe(200);
      expect(response.body.terms.url).toBe('/terms');
      expect(response.body.privacy.url).toBe('/privacy');
    });
  });

  describe('GET /api/legal/status', () => {
    it('should require authentication', async () => {
      // Mock requireAuth to simulate unauthenticated user
      requireAuth.mockImplementation((req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(401);
    });

    it('should return status when user has accepted current versions', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.needs_reacceptance).toBe(false);
      expect(response.body.details.terms.needs_acceptance).toBe(false);
      expect(response.body.details.privacy.needs_acceptance).toBe(false);
    });

    it('should return needs_reacceptance: true when user needs to accept terms', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: null,
        privacy_accepted_at: new Date(),
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.needs_reacceptance).toBe(true);
      expect(response.body.details.terms.needs_acceptance).toBe(true);
      expect(response.body.details.privacy.needs_acceptance).toBe(false);
    });

    it('should return needs_reacceptance: true when user needs to accept privacy', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: null,
        terms_accepted_at: new Date(),
        privacy_accepted_at: null,
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.needs_reacceptance).toBe(true);
      expect(response.body.details.terms.needs_acceptance).toBe(false);
      expect(response.body.details.privacy.needs_acceptance).toBe(true);
    });

    it('should return needs_reacceptance: true when user needs to accept both', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
        terms_accepted_at: null,
        privacy_accepted_at: null,
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.needs_reacceptance).toBe(true);
      expect(response.body.details.terms.needs_acceptance).toBe(true);
      expect(response.body.details.privacy.needs_acceptance).toBe(true);
    });

    it('should return 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should include current versions in response', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: null,
        privacy_version_accepted: null,
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.details.terms.current_version).toBe(CURRENT_TERMS_VERSION);
      expect(response.body.details.privacy.current_version).toBe(CURRENT_PRIVACY_VERSION);
    });

    it('should include accepted versions in response', async () => {
      const mockUser = {
        id: 123,
        terms_version_accepted: '2025-01-01',
        privacy_version_accepted: '2025-01-01',
      };

      User.findById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(200);
      expect(response.body.details.terms.accepted_version).toBe('2025-01-01');
      expect(response.body.details.privacy.accepted_version).toBe('2025-01-01');
    });

    it('should handle database errors gracefully', async () => {
      User.findById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/legal/status');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to check legal status');
    });
  });

  describe('POST /api/legal/accept', () => {
    it('should require authentication', async () => {
      requireAuth.mockImplementation((req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });

      expect(response.status).toBe(401);
    });

    it('should accept legal documents successfully', async () => {
      const mockUpdatedUser = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
      };

      User.acceptLegalDocuments.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Legal documents accepted successfully');
      expect(response.body.acceptance.terms.version).toBe(CURRENT_TERMS_VERSION);
      expect(response.body.acceptance.privacy.version).toBe(CURRENT_PRIVACY_VERSION);
    });

    it('should call User.acceptLegalDocuments with correct parameters', async () => {
      const mockUpdatedUser = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
      };

      User.acceptLegalDocuments.mockResolvedValue(mockUpdatedUser);

      await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });

      expect(User.acceptLegalDocuments).toHaveBeenCalledWith(
        123,
        CURRENT_TERMS_VERSION,
        CURRENT_PRIVACY_VERSION
      );
    });

    it('should return 400 when accept_terms is false', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: false, accept_privacy: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both Terms of Service and Privacy Policy must be accepted');
    });

    it('should return 400 when accept_privacy is false', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: false });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both Terms of Service and Privacy Policy must be accepted');
    });

    it('should return 400 when both are false', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: false, accept_privacy: false });

      expect(response.status).toBe(400);
    });

    it('should return 400 when accept_terms is missing', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_privacy: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Both Terms of Service and Privacy Policy must be accepted');
    });

    it('should return 400 when accept_privacy is missing', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true });

      expect(response.status).toBe(400);
    });

    it('should return 400 when request body is empty', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should include required values in error response', async () => {
      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: false, accept_privacy: false });

      expect(response.status).toBe(400);
      expect(response.body.required).toEqual({
        accept_terms: true,
        accept_privacy: true,
      });
    });

    it('should handle database errors gracefully', async () => {
      User.acceptLegalDocuments.mockRejectedValue(new Error('Database write failed'));

      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to record legal acceptance');
    });

    it('should include accepted_at timestamps in response', async () => {
      const now = new Date();
      const mockUpdatedUser = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      };

      User.acceptLegalDocuments.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });

      expect(response.status).toBe(200);
      expect(response.body.acceptance.terms.accepted_at).toBeDefined();
      expect(response.body.acceptance.privacy.accepted_at).toBeDefined();
    });
  });

  describe('Integration - Full Workflow', () => {
    it('should complete full re-acceptance workflow', async () => {
      const mockUserNeedsAcceptance = {
        id: 123,
        terms_version_accepted: '2025-01-01',
        privacy_version_accepted: '2025-01-01',
      };

      const mockUserAfterAcceptance = {
        id: 123,
        terms_version_accepted: CURRENT_TERMS_VERSION,
        privacy_version_accepted: CURRENT_PRIVACY_VERSION,
        terms_accepted_at: new Date(),
        privacy_accepted_at: new Date(),
      };

      // Step 1: Check status (needs reacceptance)
      User.findById.mockResolvedValue(mockUserNeedsAcceptance);
      const statusResponse = await request(app).get('/api/legal/status');
      expect(statusResponse.body.needs_reacceptance).toBe(true);

      // Step 2: Accept current versions
      User.acceptLegalDocuments.mockResolvedValue(mockUserAfterAcceptance);
      const acceptResponse = await request(app)
        .post('/api/legal/accept')
        .send({ accept_terms: true, accept_privacy: true });
      expect(acceptResponse.body.success).toBe(true);

      // Step 3: Check status again (should not need reacceptance)
      User.findById.mockResolvedValue(mockUserAfterAcceptance);
      const statusResponse2 = await request(app).get('/api/legal/status');
      expect(statusResponse2.body.needs_reacceptance).toBe(false);
    });
  });
});
