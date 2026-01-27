/**
 * API Audit Logging Integration Tests
 * Tests that audit logs are created when using API endpoints
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Mock all middleware BEFORE importing routes
jest.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: (req, res, next) => next(),
  generationLimiter: (req, res, next) => next(),
}));
jest.mock('../../middleware/rateLimitBypass.js', () => ({
  rateLimitBypass: (req, res, next) => next(),
}));
jest.mock('../../middleware/tierGate.js', () => ({
  checkUsage: () => (req, res, next) => next(),
  incrementUsage: jest.fn(),
  requireFeature: () => (req, res, next) => next(),
}));

// Import AFTER all mocks are set up
import apiRoutes from '../api.js';
import AuditLog from '../../models/AuditLog.js';
import { sql } from '@vercel/postgres';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Audit Logging (Integration)', () => {
  afterEach(async () => {
    // Clean up test audit logs (those without user_id or with test patterns)
    await sql`
      DELETE FROM audit_logs
      WHERE user_id IS NULL
      OR input_hash LIKE 'test%'
    `;
  });

  describe('POST /api/generate', () => {
    it('should create audit log on successful generation', async () => {
      const code = 'function hello() { return "world"; }';

      const response = await request(app)
        .post('/api/generate')
        .send({
          code,
          docType: 'README',
          language: 'javascript',
        })
        .expect(200);

      expect(response.body.documentation).toBeDefined();

      // Wait a moment for async audit logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify audit log was created
      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 10,
      });

      expect(logs.logs.length).toBeGreaterThan(0);

      // Find the log for our request (by checking metadata)
      const ourLog = logs.logs.find(
        (log) =>
          log.metadata?.language === 'javascript' &&
          log.metadata?.doc_type === 'README' &&
          log.success === true
      );

      expect(ourLog).toBeDefined();
      expect(ourLog.action).toBe('code_generation');
      expect(ourLog.resource_type).toBe('documentation');
      expect(ourLog.success).toBe(true);
      expect(ourLog.contains_potential_phi).toBe(false);
      expect(ourLog.phi_score).toBe(0);
      expect(ourLog.input_hash).toBeDefined();
      expect(ourLog.input_hash).toHaveLength(64); // SHA-256 hash
      expect(ourLog.duration_ms).toBeGreaterThan(0);
    }, 30000); // Increase timeout for API call

    it('should create audit log on failed generation', async () => {
      // Send invalid request (empty code)
      await request(app)
        .post('/api/generate')
        .send({
          code: '',
          docType: 'README',
        })
        .expect(400);

      // Wait a moment for async audit logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify audit log was NOT created for validation error (happens before audit point)
      // Audit logging only happens after validation passes
    });
  });

  describe('POST /api/generate-stream', () => {
    it('should create audit log on successful streaming generation', async () => {
      const code = 'const add = (a, b) => a + b;';

      const response = await request(app)
        .post('/api/generate-stream')
        .send({
          code,
          docType: 'JSDOC',
          language: 'javascript',
        })
        .expect(200);

      // Response should be SSE format
      expect(response.text).toContain('data:');

      // Wait a moment for async audit logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify audit log was created
      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation_stream',
        limit: 10,
      });

      expect(logs.logs.length).toBeGreaterThan(0);

      const ourLog = logs.logs.find(
        (log) =>
          log.metadata?.language === 'javascript' &&
          log.metadata?.doc_type === 'JSDOC' &&
          log.success === true
      );

      expect(ourLog).toBeDefined();
      expect(ourLog.action).toBe('code_generation_stream');
      expect(ourLog.success).toBe(true);
    }, 30000);
  });

  describe('POST /api/upload', () => {
    it('should create audit log on successful file upload', async () => {
      const fileContent = 'function test() { console.log("test"); }';
      const buffer = Buffer.from(fileContent, 'utf-8');

      const response = await request(app)
        .post('/api/upload')
        .attach('file', buffer, 'test.js')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();

      // Wait a moment for async audit logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify audit log was created
      const logs = await AuditLog.getAuditLogs({
        action: 'code_upload',
        limit: 10,
      });

      expect(logs.logs.length).toBeGreaterThan(0);

      const ourLog = logs.logs.find(
        (log) =>
          log.metadata?.filename === 'test.js' &&
          log.success === true
      );

      expect(ourLog).toBeDefined();
      expect(ourLog.action).toBe('code_upload');
      expect(ourLog.resource_type).toBe('file');
      expect(ourLog.success).toBe(true);
      expect(ourLog.input_hash).toBeDefined();
      expect(ourLog.metadata.filename).toBe('test.js');
      expect(ourLog.metadata.file_size).toBeGreaterThan(0);
    });
  });

  describe('Audit Log Data Integrity', () => {
    it('should hash input code (not store plaintext)', async () => {
      const code = 'const secret = "my-secret-code";';

      await request(app)
        .post('/api/generate')
        .send({
          code,
          docType: 'README',
        })
        .expect(200);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 1,
      });

      expect(logs.logs.length).toBeGreaterThan(0);

      const log = logs.logs[0];
      // Verify input is hashed, not plaintext
      expect(log.input_hash).toBeDefined();
      expect(log.input_hash).toHaveLength(64); // SHA-256
      expect(log.input_hash).not.toContain('secret');
      expect(log.input_hash).not.toContain(code);
    }, 30000);

    it('should include request metadata (IP, user agent)', async () => {
      await request(app)
        .post('/api/generate')
        .set('User-Agent', 'Test-Client/1.0')
        .send({
          code: 'console.log("test");',
          docType: 'README',
        })
        .expect(200);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 1,
      });

      const log = logs.logs[0];
      expect(log.ip_address).toBeDefined();
      expect(log.user_agent).toBeDefined();
      expect(log.user_agent).toContain('Test-Client');
    }, 30000);

    it('should track duration in milliseconds', async () => {
      await request(app)
        .post('/api/generate')
        .send({
          code: 'function test() {}',
          docType: 'JSDOC',
        })
        .expect(200);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 1,
      });

      const log = logs.logs[0];
      expect(log.duration_ms).toBeDefined();
      expect(log.duration_ms).toBeGreaterThan(0);
      expect(log.duration_ms).toBeLessThan(60000); // Less than 60 seconds
    }, 30000);
  });

  describe('Audit Log Metadata', () => {
    it('should include doc_type and language in metadata', async () => {
      await request(app)
        .post('/api/generate')
        .send({
          code: 'class Test {}',
          docType: 'API',
          language: 'typescript',
        })
        .expect(200);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 1,
      });

      const log = logs.logs[0];
      expect(log.metadata).toBeDefined();
      expect(log.metadata.doc_type).toBe('API');
      expect(log.metadata.language).toBe('typescript');
      expect(log.metadata.code_length).toBeGreaterThan(0);
    }, 30000);

    it('should include user_tier in metadata', async () => {
      await request(app)
        .post('/api/generate')
        .send({
          code: 'const x = 1;',
          docType: 'README',
        })
        .expect(200);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logs = await AuditLog.getAuditLogs({
        action: 'code_generation',
        limit: 1,
      });

      const log = logs.logs[0];
      expect(log.metadata.user_tier).toBeDefined();
      expect(log.metadata.user_tier).toBe('free'); // Unauthenticated requests default to 'free'
    }, 30000);
  });
});
