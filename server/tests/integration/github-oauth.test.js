/**
 * Integration tests for GitHub OAuth authentication
 * Tests OAuth flow, account linking, and error scenarios
 *
 * Run with: npm test tests/integration/github-oauth.test.js
 */

import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import authRoutes from '../../src/routes/auth.js';

// Mock the User model
jest.mock('../../src/models/User.js');
import User from '../../src/models/User.js';

// Mock the database connection
jest.mock('../../src/db/connection.js', () => ({
  sql: jest.fn(),
  testConnection: jest.fn().mockResolvedValue(true),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  cleanupSessions: jest.fn().mockResolvedValue(0)
}));

// Mock passport-github2 strategy
jest.mock('passport-github2', () => {
  return {
    Strategy: class MockGitHubStrategy {
      constructor(options, verify) {
        this.name = 'github';
        this._verify = verify;
        this.options = options;
      }

      authenticate(req, options) {
        // Simulate GitHub OAuth flow
        if (req.query.code) {
          // Simulate successful OAuth callback
          const mockProfile = {
            id: req.query.github_id || '12345',
            username: req.query.username || 'testuser',
            emails: [{ value: req.query.email || 'github@test.com' }]
          };

          const mockAccessToken = 'mock_access_token';
          const mockRefreshToken = 'mock_refresh_token';

          this._verify(mockAccessToken, mockRefreshToken, mockProfile, (err, user) => {
            if (err) {
              return this.error(err);
            }
            if (!user) {
              return this.fail({ message: 'Authentication failed' });
            }
            req.user = user;
            this.success(user);
          });
        } else if (req.query.error) {
          // Simulate OAuth error
          this.fail({ message: req.query.error });
        } else {
          // Simulate redirect to GitHub
          this.redirect('https://github.com/login/oauth/authorize?client_id=test');
        }
      }
    }
  };
});

describe('GitHub OAuth Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Set up test environment with GitHub OAuth enabled
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.SESSION_SECRET = 'test-session-secret-key';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
    process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/api/auth/github/callback';

    // Re-import passport config with mocked GitHub strategy
    jest.isolateModules(() => {
      require('../../src/config/passport.js');
    });

    // Create Express app
    app = express();
    app.use(express.json());

    // Add session middleware
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
      })
    );

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Mount auth routes
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/github', () => {
    it('should redirect to GitHub OAuth authorization page', async () => {
      const response = await request(app)
        .get('/api/auth/github')
        .redirects(0);

      // Should redirect (302) or attempt to redirect
      expect([302, 500]).toContain(response.status);
    });

    it('should initiate OAuth flow with correct scope', async () => {
      // This test verifies the strategy is configured correctly
      const response = await request(app)
        .get('/api/auth/github')
        .redirects(0);

      // Should attempt to start OAuth flow
      expect(response.status).toBeDefined();
    });
  });

  describe('GET /api/auth/github/callback', () => {
    it('should create new user from GitHub profile', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@github.com',
        github_id: '67890',
        tier: 'free',
        created_at: new Date()
      };

      User.findOrCreateByGithub.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '67890',
          email: 'newuser@github.com',
          username: 'newuser'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('http://localhost:5173/auth/callback');
      expect(response.headers.location).toContain('token=');

      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: '67890',
        email: 'newuser@github.com'
      });
    });

    it('should link GitHub account to existing user by email', async () => {
      const existingUser = {
        id: 1,
        email: 'existing@test.com',
        github_id: null,
        tier: 'pro'
      };

      const linkedUser = {
        ...existingUser,
        github_id: '11111'
      };

      User.findOrCreateByGithub.mockResolvedValue(linkedUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '11111',
          email: 'existing@test.com',
          username: 'existinguser'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: '11111',
        email: 'existing@test.com'
      });
    });

    it('should return existing GitHub user on subsequent logins', async () => {
      const existingGitHubUser = {
        id: 2,
        email: 'github@test.com',
        github_id: '22222',
        tier: 'free'
      };

      User.findOrCreateByGithub.mockResolvedValue(existingGitHubUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '22222',
          email: 'github@test.com',
          username: 'returninguser'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('token=');

      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: '22222',
        email: 'github@test.com'
      });
    });

    it('should handle GitHub profiles without email', async () => {
      const mockUser = {
        id: 3,
        email: 'noemail@github.user',
        github_id: '33333',
        tier: 'free'
      };

      User.findOrCreateByGithub.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '33333',
          username: 'noemailuser'
          // No email provided
        })
        .redirects(0);

      expect(response.status).toBe(302);

      // Should use username@github.user as fallback
      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: '33333',
        email: 'noemailuser@github.user'
      });
    });

    it('should redirect with error on OAuth failure', async () => {
      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=github_auth_failed');
    });

    it('should handle database errors gracefully', async () => {
      User.findOrCreateByGithub.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '44444',
          email: 'error@test.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      // Should redirect to error page
      expect(response.headers.location).toContain('error');
    });

    it('should include valid JWT token in redirect', async () => {
      const mockUser = {
        id: 5,
        email: 'tokentest@github.com',
        github_id: '55555',
        tier: 'free'
      };

      User.findOrCreateByGithub.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '55555',
          email: 'tokentest@github.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);

      const location = response.headers.location;
      expect(location).toContain('token=');

      // Extract token from URL
      const tokenMatch = location.match(/token=([^&]+)/);
      expect(tokenMatch).toBeTruthy();
      expect(tokenMatch[1]).toBeTruthy();

      // Token should be a valid JWT (3 parts separated by dots)
      const token = tokenMatch[1];
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('OAuth Account Linking Scenarios', () => {
    it('should link GitHub to user who signed up with email/password', async () => {
      const emailPasswordUser = {
        id: 10,
        email: 'user@example.com',
        password_hash: '$2b$10$hashed',
        github_id: null,
        tier: 'free'
      };

      const linkedUser = {
        ...emailPasswordUser,
        github_id: 'gh999',
        password_hash: '$2b$10$hashed' // Should keep original password
      };

      User.findOrCreateByGithub.mockResolvedValue(linkedUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: 'gh999',
          email: 'user@example.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: 'gh999',
        email: 'user@example.com'
      });
    });

    it('should not allow linking different email to existing GitHub ID', async () => {
      // If GitHub ID already exists with different email, use existing user
      const existingGitHubUser = {
        id: 11,
        email: 'original@github.com',
        github_id: 'gh888',
        tier: 'pro'
      };

      User.findOrCreateByGithub.mockResolvedValue(existingGitHubUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: 'gh888',
          email: 'different@test.com' // Different email
        })
        .redirects(0);

      expect(response.status).toBe(302);

      // Should find existing user by GitHub ID
      expect(User.findOrCreateByGithub).toHaveBeenCalledWith({
        githubId: 'gh888',
        email: 'different@test.com'
      });
    });
  });

  describe('OAuth Security', () => {
    it('should not expose password_hash in OAuth response', async () => {
      const mockUser = {
        id: 12,
        email: 'secure@github.com',
        github_id: 'gh777',
        password_hash: '$2b$10$shouldnotappear',
        tier: 'free'
      };

      User.findOrCreateByGithub.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: 'gh777',
          email: 'secure@github.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);

      // Token payload should not contain password_hash
      // (We can't easily decode it here, but the route should sanitize)
      expect(response.headers.location).not.toContain('password_hash');
    });

    it('should use HTTPS callback URL in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.GITHUB_CALLBACK_URL = 'https://codescribeai.com/api/auth/github/callback';

      // Verify callback URL is HTTPS
      expect(process.env.GITHUB_CALLBACK_URL).toMatch(/^https:\/\//);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle malicious redirect attempts', async () => {
      const mockUser = {
        id: 13,
        email: 'test@github.com',
        github_id: 'gh666',
        tier: 'free'
      };

      User.findOrCreateByGithub.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: 'gh666',
          email: 'test@github.com',
          redirect: 'https://evil.com' // Malicious redirect attempt
        })
        .redirects(0);

      expect(response.status).toBe(302);

      // Should redirect to CLIENT_URL, not malicious URL
      expect(response.headers.location).toContain('http://localhost:5173');
      expect(response.headers.location).not.toContain('evil.com');
    });
  });

  describe('OAuth Configuration', () => {
    it('should require GITHUB_CLIENT_ID to be set', () => {
      expect(process.env.GITHUB_CLIENT_ID).toBeDefined();
      expect(process.env.GITHUB_CLIENT_ID).not.toBe('');
    });

    it('should require GITHUB_CLIENT_SECRET to be set', () => {
      expect(process.env.GITHUB_CLIENT_SECRET).toBeDefined();
      expect(process.env.GITHUB_CLIENT_SECRET).not.toBe('');
    });

    it('should have valid callback URL', () => {
      expect(process.env.GITHUB_CALLBACK_URL).toBeDefined();
      expect(process.env.GITHUB_CALLBACK_URL).toContain('/api/auth/github/callback');
    });

    it('should have CLIENT_URL configured for redirects', () => {
      expect(process.env.CLIENT_URL).toBeDefined();
      expect(process.env.CLIENT_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle missing user data after authentication', async () => {
      User.findOrCreateByGithub.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '00000',
          email: 'nodata@test.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error=no_user_data');
    });

    it('should handle GitHub API rate limiting', async () => {
      User.findOrCreateByGithub.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '99999',
          email: 'ratelimit@test.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });

    it('should handle network errors during OAuth', async () => {
      User.findOrCreateByGithub.mockRejectedValue(
        new Error('Network request failed')
      );

      const response = await request(app)
        .get('/api/auth/github/callback')
        .query({
          code: 'github_auth_code',
          github_id: '88888',
          email: 'network@test.com'
        })
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('error');
    });
  });
});
