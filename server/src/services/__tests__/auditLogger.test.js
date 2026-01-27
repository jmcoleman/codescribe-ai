/**
 * Audit Logger Service Tests
 * Tests for audit logging utilities and helper functions
 */

import { jest } from '@jest/globals';
import {
  hashInput,
  getClientIp,
  getUserAgent,
  sanitizeErrorMessage,
  exportToCSV,
} from '../auditLogger.js';

describe('Audit Logger Service', () => {
  describe('hashInput()', () => {
    it('should create SHA-256 hash of input', () => {
      const input = 'const foo = "bar";';
      const hash = hashInput(input);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(typeof hash).toBe('string');
    });

    it('should return null for empty input', () => {
      expect(hashInput('')).toBeNull();
      expect(hashInput(null)).toBeNull();
      expect(hashInput(undefined)).toBeNull();
    });

    it('should produce same hash for same input', () => {
      const input = 'const foo = "bar";';
      const hash1 = hashInput(input);
      const hash2 = hashInput(input);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = hashInput('const foo = "bar";');
      const hash2 = hashInput('const foo = "baz";');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getClientIp()', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1'); // First IP in list
    });

    it('should extract IP from X-Real-IP header', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      };

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should fallback to req.ip', () => {
      const req = {
        headers: {},
        ip: '192.168.1.1',
      };

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should fallback to connection.remoteAddress', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '192.168.1.1',
        },
      };

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return null if no IP found', () => {
      const req = {
        headers: {},
      };

      const ip = getClientIp(req);
      expect(ip).toBeNull();
    });

    it('should trim whitespace from X-Forwarded-For', () => {
      const req = {
        headers: {
          'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1 ',
        },
      };

      const ip = getClientIp(req);
      expect(ip).toBe('192.168.1.1');
    });
  });

  describe('getUserAgent()', () => {
    it('should extract user agent from headers', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      };

      const userAgent = getUserAgent(req);
      expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should return null if no user agent', () => {
      const req = {
        headers: {},
      };

      const userAgent = getUserAgent(req);
      expect(userAgent).toBeNull();
    });
  });

  describe('sanitizeErrorMessage()', () => {
    it('should redact SSN patterns', () => {
      const error = new Error('Failed to process SSN: 123-45-6789');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain('123-45-6789');
      expect(sanitized).toContain('[SSN-REDACTED]');
    });

    it('should redact email addresses', () => {
      const error = new Error('User email john.doe@example.com not found');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain('john.doe@example.com');
      expect(sanitized).toContain('[EMAIL-REDACTED]');
    });

    it('should redact phone numbers', () => {
      const error = new Error('Contact: 555-123-4567');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain('555-123-4567');
      expect(sanitized).toContain('[PHONE-REDACTED]');
    });

    it('should redact multiple phone formats', () => {
      const error = new Error('Phone: 555-123-4567 or 5551234567 or 555.123.4567');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain('555-123-4567');
      expect(sanitized).not.toContain('5551234567');
      expect(sanitized).not.toContain('555.123.4567');
      expect(sanitized).toContain('[PHONE-REDACTED]');
    });

    it('should redact date patterns', () => {
      const error = new Error('DOB: 01/15/1990');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).not.toContain('01/15/1990');
      expect(sanitized).toContain('[DATE-REDACTED]');
    });

    it('should handle Error objects', () => {
      const error = new Error('Database connection failed');
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).toBe('Database connection failed');
    });

    it('should handle string errors', () => {
      const error = 'Something went wrong';
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).toBe('Something went wrong');
    });

    it('should truncate long messages', () => {
      const longError = 'Error: ' + 'a'.repeat(600);
      const sanitized = sanitizeErrorMessage(longError);

      expect(sanitized.length).toBeLessThanOrEqual(500);
      expect(sanitized).toContain('...');
    });

    it('should redact multiple PHI patterns in one message', () => {
      const error = new Error(
        'Patient SSN: 123-45-6789, DOB: 01/15/1990, Email: patient@example.com'
      );
      const sanitized = sanitizeErrorMessage(error);

      expect(sanitized).toContain('[SSN-REDACTED]');
      expect(sanitized).toContain('[DATE-REDACTED]');
      expect(sanitized).toContain('[EMAIL-REDACTED]');
      expect(sanitized).not.toContain('123-45-6789');
      expect(sanitized).not.toContain('01/15/1990');
      expect(sanitized).not.toContain('patient@example.com');
    });
  });

  describe('exportToCSV()', () => {
    it('should export logs to CSV format', () => {
      const logs = [
        {
          id: 1,
          user_email: 'test@example.com',
          action: 'code_generation',
          resource_type: 'documentation',
          resource_id: 'doc-123',
          input_hash: 'abc123',
          contains_potential_phi: false,
          phi_score: 0,
          success: true,
          error_message: null,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          duration_ms: 1250,
          created_at: '2026-01-27T00:00:00Z',
        },
      ];

      const csv = exportToCSV(logs);

      expect(csv).toContain('ID,User Email,Action');
      expect(csv).toContain('test@example.com');
      expect(csv).toContain('code_generation');
      expect(csv).toContain('192.168.1.1');
    });

    it('should handle empty logs array', () => {
      const csv = exportToCSV([]);
      expect(csv).toBe('No data to export');
    });

    it('should escape CSV special characters', () => {
      const logs = [
        {
          id: 1,
          user_email: 'test@example.com',
          action: 'code_generation',
          resource_type: 'documentation',
          error_message: 'Error: Failed, try again',
          phi_score: 0,
          success: false,
          created_at: '2026-01-27T00:00:00Z',
        },
      ];

      const csv = exportToCSV(logs);

      // Error message with comma should be quoted
      expect(csv).toContain('"Error: Failed, try again"');
    });

    it('should handle null values', () => {
      const logs = [
        {
          id: 1,
          user_email: null,
          action: 'code_generation',
          resource_type: null,
          resource_id: null,
          input_hash: null,
          contains_potential_phi: false,
          phi_score: 0,
          success: true,
          error_message: null,
          ip_address: null,
          user_agent: null,
          duration_ms: null,
          created_at: '2026-01-27T00:00:00Z',
        },
      ];

      const csv = exportToCSV(logs);

      expect(csv).toContain('N/A');
    });

    it('should assign correct risk levels', () => {
      const logs = [
        { id: 1, phi_score: 0, action: 'test', success: true, created_at: '2026-01-27' },
        { id: 2, phi_score: 3, action: 'test', success: true, created_at: '2026-01-27' },
        { id: 3, phi_score: 10, action: 'test', success: true, created_at: '2026-01-27' },
        { id: 4, phi_score: 20, action: 'test', success: true, created_at: '2026-01-27' },
      ];

      const csv = exportToCSV(logs);

      expect(csv).toContain('None'); // phi_score = 0
      expect(csv).toContain('Low'); // phi_score = 3
      expect(csv).toContain('Medium'); // phi_score = 10
      expect(csv).toContain('High'); // phi_score = 20
    });

    it('should handle newlines in fields', () => {
      const logs = [
        {
          id: 1,
          action: 'test',
          error_message: 'Line 1\nLine 2',
          phi_score: 0,
          success: false,
          created_at: '2026-01-27',
        },
      ];

      const csv = exportToCSV(logs);

      // Newline in field should be quoted
      expect(csv).toContain('"Line 1\nLine 2"');
    });

    it('should handle quotes in fields', () => {
      const logs = [
        {
          id: 1,
          action: 'test',
          error_message: 'Error: "Invalid input"',
          phi_score: 0,
          success: false,
          created_at: '2026-01-27',
        },
      ];

      const csv = exportToCSV(logs);

      // Quotes should be escaped
      expect(csv).toContain('""Invalid input""');
    });
  });
});
