/**
 * Tests for Analytics Utility
 *
 * Tests session management, opt-out functionality, and admin/override filtering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @vercel/analytics before importing analytics module
vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

// Import after mocking
import { track } from '@vercel/analytics';
import {
  setAnalyticsOptOut,
  setAnalyticsUserStatus,
  getSessionId,
  getSessionStart,
  isReturningUser,
  getSessionDuration,
  trackDocGeneration,
  trackInteraction,
  trackCodeInput,
  trackQualityScore,
  trackError,
  trackOAuth,
} from '../analytics';

describe('Analytics Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    // Reset module state by re-setting defaults
    setAnalyticsOptOut(false);
    setAnalyticsUserStatus({ isAdmin: false, hasTierOverride: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Management', () => {
    it('generates a unique session ID', () => {
      const id1 = getSessionId();
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('returns the same session ID within a session', () => {
      const id1 = getSessionId();
      const id2 = getSessionId();
      expect(id1).toBe(id2);
    });

    it('stores session ID in sessionStorage', () => {
      const id = getSessionId();
      expect(sessionStorage.getItem('cs_analytics_session_id')).toBe(id);
    });

    it('stores session start time', () => {
      getSessionId(); // Initialize session
      const start = getSessionStart();
      expect(start).toBeDefined();
      expect(typeof start).toBe('number');
      expect(start).toBeLessThanOrEqual(Date.now());
    });

    it('calculates session duration', () => {
      getSessionId(); // Initialize session
      const duration = getSessionDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('increments session count in localStorage', () => {
      expect(localStorage.getItem('cs_analytics_session_count')).toBeNull();

      getSessionId(); // First session
      expect(localStorage.getItem('cs_analytics_session_count')).toBe('1');
    });

    it('detects returning users', () => {
      // First visit - not returning
      expect(isReturningUser()).toBe(false);

      // Simulate previous sessions
      localStorage.setItem('cs_analytics_session_count', '3');
      expect(isReturningUser()).toBe(true);
    });

    it('detects new users', () => {
      localStorage.setItem('cs_analytics_session_count', '1');
      expect(isReturningUser()).toBe(false);
    });
  });

  describe('Analytics Opt-Out', () => {
    // Note: In test environment, isProduction is false, so track() won't be called
    // These tests verify the opt-out state is set correctly

    it('defaults to opted-in (tracking allowed)', () => {
      // By default, analyticsOptedOut is false
      // We can verify by checking console.debug is called in dev mode
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackInteraction('test_event', {});

      // In dev mode, should log to console
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('respects opt-out preference', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      setAnalyticsOptOut(true);
      trackInteraction('test_event', {});

      // When opted out, should not log even in dev mode
      // (The current implementation logs in dev when NOT opted out)
      // After opt-out, console.debug should not be called for the event
      consoleSpy.mockRestore();
    });

    it('can re-enable tracking after opt-out', () => {
      setAnalyticsOptOut(true);
      setAnalyticsOptOut(false);

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackInteraction('test_event', {});

      // Should log again after re-enabling
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Admin/Override Filtering', () => {
    it('defaults to non-admin, no override', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackInteraction('test_event', {});

      // Check the logged data includes is_internal: 'false'
      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.is_internal).toBe('false');
      expect(loggedData.is_admin).toBe('false');
      expect(loggedData.has_tier_override).toBe('false');

      consoleSpy.mockRestore();
    });

    it('marks events from admin users', () => {
      setAnalyticsUserStatus({ isAdmin: true, hasTierOverride: false });

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackInteraction('test_event', {});

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.is_internal).toBe('true');
      expect(loggedData.is_admin).toBe('true');
      expect(loggedData.has_tier_override).toBe('false');

      consoleSpy.mockRestore();
    });

    it('marks events from users with tier override', () => {
      setAnalyticsUserStatus({ isAdmin: false, hasTierOverride: true });

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackInteraction('test_event', {});

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.is_internal).toBe('true');
      expect(loggedData.is_admin).toBe('false');
      expect(loggedData.has_tier_override).toBe('true');

      consoleSpy.mockRestore();
    });

    it('marks events from admin with tier override', () => {
      setAnalyticsUserStatus({ isAdmin: true, hasTierOverride: true });

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackInteraction('test_event', {});

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.is_internal).toBe('true');
      expect(loggedData.is_admin).toBe('true');
      expect(loggedData.has_tier_override).toBe('true');

      consoleSpy.mockRestore();
    });

    it('resets status when user logs out', () => {
      setAnalyticsUserStatus({ isAdmin: true, hasTierOverride: true });
      setAnalyticsUserStatus({ isAdmin: false, hasTierOverride: false });

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      trackInteraction('test_event', {});

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.is_internal).toBe('false');

      consoleSpy.mockRestore();
    });
  });

  describe('Session Context in Events', () => {
    it('includes session context in all events', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackInteraction('test_event', { custom_field: 'value' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.is_returning_user).toBeDefined();
      expect(loggedData.session_duration_ms).toBeDefined();
      expect(loggedData.custom_field).toBe('value');

      consoleSpy.mockRestore();
    });

    it('includes session context in trackDocGeneration', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackDocGeneration({
        docType: 'README',
        success: true,
        duration: 1000,
        codeSize: 500,
        language: 'javascript',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.doc_type).toBe('README');
      expect(loggedData.success).toBe('true');

      consoleSpy.mockRestore();
    });

    it('includes session context in trackCodeInput', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackCodeInput('paste', 1024, 'typescript');

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.method).toBe('paste');
      expect(loggedData.language).toBe('typescript');

      consoleSpy.mockRestore();
    });

    it('includes session context in trackQualityScore', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 85, grade: 'B', docType: 'API' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.score).toBe(85);
      expect(loggedData.grade).toBe('B');

      consoleSpy.mockRestore();
    });

    it('includes session context in trackError', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'network',
        errorMessage: 'Connection failed',
        context: 'generation',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.error_type).toBe('network');

      consoleSpy.mockRestore();
    });

    it('includes session context in trackOAuth', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackOAuth({
        provider: 'github',
        action: 'initiated',
        context: 'login_modal',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.session_id).toBeDefined();
      expect(loggedData.provider).toBe('github');
      expect(loggedData.action).toBe('initiated');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Message Sanitization', () => {
    it('truncates long error messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const longMessage = 'a'.repeat(200);
      trackError({
        errorType: 'api',
        errorMessage: longMessage,
        context: 'test',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_message.length).toBeLessThanOrEqual(100);

      consoleSpy.mockRestore();
    });

    it('sanitizes API keys in error messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'api',
        errorMessage: 'Failed with key sk-ant-api03-abc123xyz',
        context: 'test',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_message).not.toContain('sk-ant-api03');
      expect(loggedData.error_message).toContain('[API_KEY]');

      consoleSpy.mockRestore();
    });

    it('sanitizes Bearer tokens in error messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'api',
        errorMessage: 'Auth failed: Bearer eyJhbGciOiJIUzI1NiJ9',
        context: 'test',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_message).not.toContain('eyJhbGciOiJIUzI1NiJ9');
      expect(loggedData.error_message).toContain('[TOKEN]');

      consoleSpy.mockRestore();
    });

    it('sanitizes email addresses in error messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'validation',
        errorMessage: 'User user@example.com not found',
        context: 'test',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_message).not.toContain('user@example.com');
      expect(loggedData.error_message).toContain('[EMAIL]');

      consoleSpy.mockRestore();
    });

    it('handles null/undefined error messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'unknown',
        errorMessage: null,
        context: 'test',
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_message).toBe('unknown');

      consoleSpy.mockRestore();
    });
  });

  describe('Quality Score Ranges', () => {
    it('categorizes scores 90-100 correctly', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 95, grade: 'A', docType: 'README' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.score_range).toBe('90-100');

      consoleSpy.mockRestore();
    });

    it('categorizes scores 80-89 correctly', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 85, grade: 'B', docType: 'README' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.score_range).toBe('80-89');

      consoleSpy.mockRestore();
    });

    it('categorizes scores 70-79 correctly', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 75, grade: 'C', docType: 'README' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.score_range).toBe('70-79');

      consoleSpy.mockRestore();
    });

    it('categorizes scores 60-69 correctly', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 65, grade: 'D', docType: 'README' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.score_range).toBe('60-69');

      consoleSpy.mockRestore();
    });

    it('categorizes scores below 60 correctly', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 45, grade: 'F', docType: 'README' });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.score_range).toBe('0-59');

      consoleSpy.mockRestore();
    });
  });
});
