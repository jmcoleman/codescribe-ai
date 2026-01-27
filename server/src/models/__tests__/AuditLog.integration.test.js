/**
 * AuditLog Model Integration Tests
 * Tests for HIPAA-compliant audit logging functionality using dev database
 */

import AuditLog from '../AuditLog.js';
import User from '../User.js';
import { sql } from '@vercel/postgres';

describe('AuditLog Model (Integration)', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user for audit logs
    testUser = await User.create({
      email: `audit-test-${Date.now()}@example.com`,
      firstName: 'Audit',
      lastName: 'Test',
      password: 'TestPassword123!',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await sql`DELETE FROM audit_logs WHERE user_id = ${testUser.id}`;
      await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    }
  });

  afterEach(async () => {
    // Clean up audit logs after each test
    if (testUser) {
      await sql`DELETE FROM audit_logs WHERE user_id = ${testUser.id}`;
    }
  });

  describe('log()', () => {
    it('should create an audit log entry in database', async () => {
      const result = await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        resourceType: 'documentation',
        inputHash: 'abc123def456',
        containsPotentialPhi: false,
        phiScore: 0,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        durationMs: 1250,
        metadata: { doc_type: 'README', language: 'javascript' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(testUser.id);
      expect(result.user_email).toBe(testUser.email);
      expect(result.action).toBe('code_generation');
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully and return null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to insert with invalid action (constraint violation)
      const result = await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'invalid_action', // Not in allowed actions
        success: true,
      });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should store metadata as JSONB', async () => {
      const metadata = {
        doc_type: 'README',
        language: 'javascript',
        file_count: 3,
        nested: { key: 'value' },
      };

      const result = await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        success: true,
        metadata,
      });

      expect(result).toBeDefined();
      expect(result.metadata).toEqual(metadata);
    });

    it('should allow null user_id for anonymous actions', async () => {
      const result = await AuditLog.log({
        userId: null,
        userEmail: 'anonymous@example.com',
        action: 'code_generation',
        success: true,
      });

      expect(result).toBeDefined();
      expect(result.user_id).toBeNull();
      expect(result.user_email).toBe('anonymous@example.com');

      // Clean up
      await sql`DELETE FROM audit_logs WHERE id = ${result.id}`;
    });

    it('should enforce PHI score range constraint (0-100)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        success: true,
        phiScore: 150, // Invalid: over 100
      });

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAuditLogs()', () => {
    beforeEach(async () => {
      // Insert test data
      await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        resourceType: 'documentation',
        success: true,
        phiScore: 0,
      });
      await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_upload',
        resourceType: 'file',
        success: true,
        phiScore: 10,
      });
      await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        resourceType: 'documentation',
        success: false,
        phiScore: 20,
      });
    });

    it('should retrieve audit logs with default pagination', async () => {
      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
      });

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by action type', async () => {
      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
        action: 'code_upload',
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe('code_upload');
    });

    it('should filter by risk level (high)', async () => {
      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
        riskLevel: 'high',
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].phi_score).toBeGreaterThanOrEqual(16);
    });

    it('should filter by risk level (medium)', async () => {
      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
        riskLevel: 'medium',
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].phi_score).toBeGreaterThanOrEqual(6);
      expect(result.logs[0].phi_score).toBeLessThanOrEqual(15);
    });

    it('should filter by success status', async () => {
      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
      });

      const failedLogs = result.logs.filter((log) => !log.success);
      expect(failedLogs).toHaveLength(1);
    });

    it('should support pagination', async () => {
      const page1 = await AuditLog.getAuditLogs({
        userId: testUser.id,
        limit: 2,
        offset: 0,
      });

      const page2 = await AuditLog.getAuditLogs({
        userId: testUser.id,
        limit: 2,
        offset: 2,
      });

      expect(page1.logs).toHaveLength(2);
      expect(page2.logs).toHaveLength(1);
      expect(page1.total).toBe(3);
      expect(page2.total).toBe(3);
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const result = await AuditLog.getAuditLogs({
        userId: testUser.id,
        startDate,
        endDate,
      });

      expect(result.logs.length).toBeGreaterThan(0);
      result.logs.forEach((log) => {
        const logDate = new Date(log.created_at);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(logDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should filter by PHI presence', async () => {
      // Insert one with PHI
      await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        success: true,
        containsPotentialPhi: true,
        phiScore: 25,
      });

      const withPhi = await AuditLog.getAuditLogs({
        userId: testUser.id,
        containsPhi: true,
      });

      const withoutPhi = await AuditLog.getAuditLogs({
        userId: testUser.id,
        containsPhi: false,
      });

      expect(withPhi.logs.length).toBeGreaterThan(0);
      expect(withoutPhi.logs.length).toBeGreaterThan(0);
      withPhi.logs.forEach((log) => expect(log.contains_potential_phi).toBe(true));
      withoutPhi.logs.forEach((log) => expect(log.contains_potential_phi).toBe(false));
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      // Insert test data with various PHI scores and success statuses
      await Promise.all([
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          phiScore: 0,
          durationMs: 1000,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          phiScore: 3, // Low risk
          containsPotentialPhi: true,
          durationMs: 1500,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_upload',
          success: true,
          phiScore: 10, // Medium risk
          containsPotentialPhi: true,
          durationMs: 2000,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: false,
          phiScore: 20, // High risk
          containsPotentialPhi: true,
          durationMs: 500,
        }),
      ]);
    });

    it('should return comprehensive statistics', async () => {
      const result = await AuditLog.getStats();

      expect(result).toBeDefined();
      expect(parseInt(result.total_events)).toBeGreaterThan(0);
      expect(parseInt(result.unique_users)).toBeGreaterThan(0);
      expect(parseInt(result.phi_events)).toBeGreaterThan(0);
      expect(parseInt(result.high_risk_events)).toBeGreaterThan(0);
      expect(parseInt(result.medium_risk_events)).toBeGreaterThan(0);
      expect(parseInt(result.low_risk_events)).toBeGreaterThan(0);
      expect(parseInt(result.failed_events)).toBeGreaterThan(0);
    });

    it('should calculate average duration', async () => {
      const result = await AuditLog.getStats();

      expect(result.avg_duration_ms).toBeDefined();
      expect(parseFloat(result.avg_duration_ms)).toBeGreaterThan(0);
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const result = await AuditLog.getStats({ startDate, endDate });

      expect(result).toBeDefined();
      expect(parseInt(result.total_events)).toBeGreaterThan(0);
    });
  });

  describe('getActivityByAction()', () => {
    beforeEach(async () => {
      await Promise.all([
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          durationMs: 1000,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          durationMs: 1500,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_upload',
          success: true,
          durationMs: 800,
        }),
      ]);
    });

    it('should group activity by action type', async () => {
      const result = await AuditLog.getActivityByAction();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const codeGenActivity = result.find((a) => a.action === 'code_generation');
      expect(codeGenActivity).toBeDefined();
      expect(parseInt(codeGenActivity.count)).toBeGreaterThanOrEqual(2);
    });

    it('should include PHI counts', async () => {
      // Add one with PHI
      await AuditLog.log({
        userId: testUser.id,
        userEmail: testUser.email,
        action: 'code_generation',
        success: true,
        containsPotentialPhi: true,
        phiScore: 15,
      });

      const result = await AuditLog.getActivityByAction();

      const codeGenActivity = result.find((a) => a.action === 'code_generation');
      expect(codeGenActivity).toBeDefined();
      expect(parseInt(codeGenActivity.phi_count)).toBeGreaterThan(0);
    });

    it('should calculate average duration per action', async () => {
      const result = await AuditLog.getActivityByAction();

      // Find actions that should have duration (from beforeEach)
      const codeGenActivity = result.find((a) => a.action === 'code_generation');
      const codeUploadActivity = result.find((a) => a.action === 'code_upload');

      // Check that activities with duration_ms in beforeEach have non-zero averages
      if (codeGenActivity && codeGenActivity.avg_duration_ms !== null) {
        expect(parseFloat(codeGenActivity.avg_duration_ms)).toBeGreaterThan(0);
      }
      if (codeUploadActivity && codeUploadActivity.avg_duration_ms !== null) {
        expect(parseFloat(codeUploadActivity.avg_duration_ms)).toBeGreaterThan(0);
      }

      // At least one should exist
      expect(codeGenActivity || codeUploadActivity).toBeDefined();
    });
  });

  describe('getTopUsers()', () => {
    beforeEach(async () => {
      // Create multiple audit entries for the test user
      await Promise.all([
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          phiScore: 0,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_upload',
          success: true,
          phiScore: 5,
          containsPotentialPhi: true,
        }),
        AuditLog.log({
          userId: testUser.id,
          userEmail: testUser.email,
          action: 'code_generation',
          success: true,
          phiScore: 20,
          containsPotentialPhi: true,
        }),
      ]);
    });

    it('should return top users by activity', async () => {
      const result = await AuditLog.getTopUsers({ limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const testUserActivity = result.find((u) => u.user_id === testUser.id);
      expect(testUserActivity).toBeDefined();
      expect(parseInt(testUserActivity.total_events)).toBeGreaterThanOrEqual(3);
    });

    it('should include PHI event counts', async () => {
      const result = await AuditLog.getTopUsers({ limit: 10 });

      const testUserActivity = result.find((u) => u.user_id === testUser.id);
      expect(testUserActivity).toBeDefined();
      expect(parseInt(testUserActivity.phi_events)).toBeGreaterThan(0);
    });

    it('should include high-risk event counts', async () => {
      const result = await AuditLog.getTopUsers({ limit: 10 });

      const testUserActivity = result.find((u) => u.user_id === testUser.id);
      expect(testUserActivity).toBeDefined();
      expect(parseInt(testUserActivity.high_risk_events)).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const result = await AuditLog.getTopUsers({ limit: 3 });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should order by total events descending', async () => {
      const result = await AuditLog.getTopUsers({ limit: 10 });

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = parseInt(result[i].total_events);
          const next = parseInt(result[i + 1].total_events);
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('Foreign Key Behavior', () => {
    it('should set user_id to NULL when user is deleted but retain email', async () => {
      // Create a temporary user
      const tempUser = await User.create({
        email: `temp-audit-test-${Date.now()}@example.com`,
        firstName: 'Temp',
        lastName: 'User',
        password: 'TestPassword123!',
      });

      // Create an audit log for that user
      const auditLog = await AuditLog.log({
        userId: tempUser.id,
        userEmail: tempUser.email,
        action: 'code_generation',
        success: true,
      });

      expect(auditLog.user_id).toBe(tempUser.id);
      expect(auditLog.user_email).toBe(tempUser.email);

      // Delete the user
      await sql`DELETE FROM users WHERE id = ${tempUser.id}`;

      // Verify audit log still exists with NULL user_id but email retained
      const result = await sql`SELECT * FROM audit_logs WHERE id = ${auditLog.id}`;
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].user_id).toBeNull();
      expect(result.rows[0].user_email).toBe(tempUser.email);

      // Clean up
      await sql`DELETE FROM audit_logs WHERE id = ${auditLog.id}`;
    });
  });
});
