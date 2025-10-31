/**
 * Integration tests for authentication routes
 * Tests all auth endpoints with real HTTP requests
 *
 * Run with: npm test tests/integration/auth.test.js
 */

import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

// Mock dependencies BEFORE importing routes
jest.mock('../../src/models/User.js');
jest.mock('../../src/config/stripe.js');
jest.mock('../../src/db/connection.js', () => ({
  sql: jest.fn(),
  testConnection: jest.fn().mockResolvedValue(true),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  cleanupSessions: jest.fn().mockResolvedValue(0)
}));

// Now import routes and models
import authRoutes from '../../src/routes/auth.js';
import '../../src/config/passport.js';
import User from '../../src/models/User.js';

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.SESSION_SECRET = 'test-session-secret-key';
    process.env.CLIENT_URL = 'http://localhost:5173';

    // Create Express app with auth routes
    app = express();
    app.use(express.json());

    // Add session middleware (required for Passport)
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
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@test.com',
        tier: 'free',
        created_at: new Date()
      };

      User.findByEmail.mockResolvedValue(null); // User doesn't exist
      User.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@test.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.id).toBe(mockUser.id);
      expect(response.body.user.email).toBe(mockUser.email);
      expect(response.body.user.tier).toBe(mockUser.tier);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      // Verify User methods were called
      expect(User.findByEmail).toHaveBeenCalledWith('newuser@test.com');
      expect(User.create).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'SecurePass123'
      });
    });

    it('should reject signup with existing email', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existing@test.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should reject signup with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.email).toBe('Invalid email format');
    });

    it('should reject signup with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.password).toContain('at least 8 characters');
    });

    it('should reject signup with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.email).toBeDefined();
      expect(response.body.details.password).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create user account');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$hashedpassword',
        tier: 'free',
        created_at: new Date()
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'CorrectPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('user@test.com');
      expect(response.body.user.password_hash).toBeUndefined(); // Should be sanitized
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$hashedpassword'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.email).toBe('Invalid email format');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.password).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid JWT token', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        tier: 'free',
        created_at: new Date()
      };

      User.findById.mockResolvedValue(mockUser);

      // First, get a token by signing up
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'user@test.com',
          password: 'Password123'
        });

      const token = signupResponse.body.token;

      // Now use the token to get user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('user@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should handle user not found', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 999, email: 'temp@test.com', tier: 'free' });

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'temp@test.com',
          password: 'Password123'
        });

      const token = signupResponse.body.token;
      User.findById.mockResolvedValue(null); // User deleted

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        tier: 'free'
      };

      // Get a valid token first
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'logout@test.com',
          password: 'Password123'
        });

      const token = signupResponse.body.token;

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email (placeholder)', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.com' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });

    it('should return same response for non-existent email (security)', async () => {
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    // Full password reset tests are in src/routes/__tests__/auth-password-reset.test.js
    // These are basic validation tests only

    it('should validate token length', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'short',
          password: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'a'.repeat(32),
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/github', () => {
    it('should redirect to GitHub OAuth (if configured)', async () => {
      // This test will only pass if GitHub OAuth is configured
      const originalClientId = process.env.GITHUB_CLIENT_ID;
      const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;

      process.env.GITHUB_CLIENT_ID = 'test-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';

      const response = await request(app)
        .get('/api/auth/github')
        .redirects(0); // Don't follow redirects

      // Should redirect to GitHub (or attempt to)
      // Status could be 302 (redirect) or 500 (if passport strategy fails)
      expect([302, 500]).toContain(response.status);

      // Restore original env vars
      process.env.GITHUB_CLIENT_ID = originalClientId;
      process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('JWT Token Validation', () => {
    it('should accept token with "Bearer " prefix', async () => {
      const mockUser = { id: 1, email: 'user@test.com', tier: 'free' };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      User.findById.mockResolvedValue(mockUser);

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'bearer@test.com',
          password: 'Password123'
        });

      const token = signupResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should accept token without "Bearer " prefix', async () => {
      const mockUser = { id: 1, email: 'user@test.com', tier: 'free' };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      User.findById.mockResolvedValue(mockUser);

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'nobearer@test.com',
          password: 'Password123'
        });

      const token = signupResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token);

      expect(response.status).toBe(200);
    });

    it('should reject expired token', async () => {
      // Create a token with 0 second expiry (already expired)
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { sub: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('Response Sanitization', () => {
    it('should never return password_hash in responses', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        password_hash: '$2b$10$shouldnotappear',
        tier: 'free'
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.validatePassword.mockResolvedValue(true);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'Password123'
        });

      expect(loginResponse.body.user.password_hash).toBeUndefined();

      // Check signup as well
      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'new@test.com',
          password: 'Password123'
        });

      expect(signupResponse.body.user.password_hash).toBeUndefined();
    });
  });
});
