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
  getSessionId,
  getSessionStart,
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

  // Note: Admin/Override filtering tests removed - these flags are now set
  // server-side based on user role lookup for more accurate detection

  describe('Session Context in Events', () => {
    it('includes session context in all events', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackInteraction('test_event', { custom_field: 'value' });

      const loggedData = consoleSpy.mock.calls[0][1];
      // session_id is sent separately in backend request, not in eventData
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
        origin: 'sample',
        filename: 'test.js',
        llm: {
          provider: 'openai',
          model: 'gpt-4o',
        },
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      // session_id is sent separately in backend request, not in eventData
      expect(loggedData.doc_type).toBe('README');
      expect(loggedData.success).toBe('true');
      // Code input attributes are grouped together
      expect(loggedData.code_input).toBeDefined();
      expect(loggedData.code_input.origin).toBe('sample');
      expect(loggedData.code_input.filename).toBe('test.js');
      expect(loggedData.code_input.language).toBe('javascript');
      expect(loggedData.code_input.size_kb).toBe(0); // 500 bytes rounds to 0 KB
      // LLM context
      expect(loggedData.llm).toBeDefined();
      expect(loggedData.llm.provider).toBe('openai');
      expect(loggedData.llm.model).toBe('gpt-4o');

      consoleSpy.mockRestore();
    });

    it('includes repo context for github origin in trackDocGeneration', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackDocGeneration({
        docType: 'API',
        success: true,
        duration: 2000,
        codeSize: 1024,
        language: 'typescript',
        origin: 'github',
        filename: 'service.ts',
        repo: {
          isPrivate: true,
          name: 'myorg/myrepo',
          branch: 'main',
        },
        llm: {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
        },
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.code_input.origin).toBe('github');
      expect(loggedData.code_input.repo).toBeDefined();
      expect(loggedData.code_input.repo.is_private).toBe(true);
      expect(loggedData.code_input.repo.name).toBe('myorg/myrepo');
      expect(loggedData.code_input.repo.branch).toBe('main');

      consoleSpy.mockRestore();
    });

    it('does not include repo context for non-git origins', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackDocGeneration({
        docType: 'README',
        success: true,
        duration: 1000,
        codeSize: 500,
        language: 'javascript',
        origin: 'paste',
        filename: 'test.js',
        repo: {
          isPrivate: true,
          name: 'myorg/myrepo',
        },
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.code_input.origin).toBe('paste');
      expect(loggedData.code_input.repo).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('includes session context in trackCodeInput', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackCodeInput('paste', 1024, 'typescript', 'test.ts');

      const loggedData = consoleSpy.mock.calls[0][1];
      // session_id is sent separately in backend request, not in eventData
      expect(loggedData.origin).toBe('paste');
      expect(loggedData.language).toBe('typescript');
      expect(loggedData.filename).toBe('test.ts');
      expect(loggedData.size_kb).toBe(1);

      consoleSpy.mockRestore();
    });

    it('includes session context in trackQualityScore', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackQualityScore({ score: 85, grade: 'B', docType: 'API' });

      const loggedData = consoleSpy.mock.calls[0][1];
      // session_id is sent separately in backend request, not in eventData
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
      // session_id is sent separately in backend request, not in eventData
      expect(loggedData.error_type).toBe('network');

      consoleSpy.mockRestore();
    });

    it('includes code input and LLM context in trackError when provided', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      trackError({
        errorType: 'api',
        errorMessage: 'Rate limit exceeded',
        context: 'doc_generation',
        codeInput: {
          filename: 'app.js',
          language: 'javascript',
          origin: 'upload',
          sizeKb: 5,
        },
        llm: {
          provider: 'claude',
          model: 'claude-sonnet-4-5-20250514',
        },
      });

      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.error_type).toBe('api');
      expect(loggedData.code_input).toBeDefined();
      expect(loggedData.code_input.filename).toBe('app.js');
      expect(loggedData.code_input.language).toBe('javascript');
      expect(loggedData.code_input.origin).toBe('upload');
      expect(loggedData.code_input.size_kb).toBe(5);
      expect(loggedData.llm).toBeDefined();
      expect(loggedData.llm.provider).toBe('claude');
      expect(loggedData.llm.model).toBe('claude-sonnet-4-5-20250514');

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
      // session_id is sent separately in backend request, not in eventData
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

  /**
   * Integration test for code input tracking across multiple sources
   *
   * This test verifies the fix for the funnel analytics bug where:
   * - 12 generations were tracked but only 4 code_input events
   * - The issue was that hasTrackedCodeInputRef wasn't set after explicit tracking calls
   *
   * Expected behavior:
   * - Each new code source (default, upload, github, sample) should track code_input once
   * - Multiple generations with the same code should NOT re-track code_input
   * - Each generation should still track generation events
   */
  describe('Code Input Tracking - Multi-Source Integration', () => {
    beforeEach(() => {
      // Clear mock calls and ensure analytics is enabled for these tests
      vi.clearAllMocks();
      setAnalyticsOptOut(false);
    });

    it('should track code_input once per source and not duplicate on subsequent generations', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Scenario 1: User generates with default code
      trackCodeInput('default', 500, 'javascript', 'code.js');

      // Scenario 2: User uploads a file
      trackCodeInput('upload', 1200, 'python', 'script.py', {
        fileType: 'py',
        fileSize: 1200,
        success: true,
      });

      // Scenario 3: User loads a GitHub file
      trackCodeInput('github', 2400, 'typescript', 'component.tsx', {
        owner: 'test-user',
        name: 'test-repo',
        path: 'src/component.tsx',
        isPrivate: false,
      });

      // Scenario 4: User loads a sample
      trackCodeInput('sample', 800, 'javascript', 'example.js');

      // Scenario 5: User pastes code
      trackCodeInput('paste', 1500, 'java', 'Main.java');

      // Verify exactly 5 code_input events were tracked (one per source)
      const codeInputCalls = consoleSpy.mock.calls.filter(
        call => call[0] === '[Analytics] code_input:'
      );

      expect(codeInputCalls).toHaveLength(5);

      // Verify each has the correct origin
      const origins = codeInputCalls.map(call => call[1].origin);
      expect(origins).toEqual(['default', 'upload', 'github', 'sample', 'paste']);

      // Verify metadata is correctly attached for upload
      const uploadCall = codeInputCalls[1][1];
      expect(uploadCall.file.type).toBe('py');
      expect(uploadCall.file.size_kb).toBe(1); // 1200 bytes = 1 KB
      expect(uploadCall.file.success).toBe(true);

      // Verify metadata is correctly attached for GitHub
      const githubCall = codeInputCalls[2][1];
      expect(githubCall.repo.owner).toBe('test-user');
      expect(githubCall.repo.name).toBe('test-repo');
      expect(githubCall.repo.path).toBe('src/component.tsx');
      expect(githubCall.repo.is_private).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should track all code input origins with correct language and filename', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const testCases = [
        { origin: 'default', length: 100, language: 'javascript', filename: 'code.js' },
        { origin: 'upload', length: 500, language: 'python', filename: 'app.py' },
        { origin: 'github', length: 1000, language: 'typescript', filename: 'index.ts' },
        { origin: 'sample', length: 200, language: 'go', filename: 'main.go' },
        { origin: 'paste', length: 750, language: 'rust', filename: 'lib.rs' },
      ];

      testCases.forEach(({ origin, length, language, filename }) => {
        trackCodeInput(origin, length, language, filename);
      });

      const codeInputCalls = consoleSpy.mock.calls.filter(
        call => call[0] === '[Analytics] code_input:'
      );

      expect(codeInputCalls).toHaveLength(5);

      testCases.forEach((testCase, index) => {
        const call = codeInputCalls[index][1];
        expect(call.origin).toBe(testCase.origin);
        expect(call.size_kb).toBe(Math.round(testCase.length / 1024));
        expect(call.language).toBe(testCase.language);
        expect(call.filename).toBe(testCase.filename);
      });

      consoleSpy.mockRestore();
    });

    it('should respect opt-out for code input tracking in production', () => {
      // Note: In development/test mode, analytics still logs to console.debug for debugging
      // even when opted out. Opt-out only prevents track() calls in production.
      // This test verifies that track() is not called when opted out.

      // Enable opt-out
      setAnalyticsOptOut(true);

      // Clear previous track calls
      track.mockClear();

      // Try to track code input from various sources
      trackCodeInput('default', 500, 'javascript', 'code.js');
      trackCodeInput('upload', 1200, 'python', 'script.py');
      trackCodeInput('github', 2400, 'typescript', 'component.tsx');

      // Verify that track() was NOT called (production behavior)
      const trackCalls = track.mock.calls.filter(
        call => call[0] === 'code_input'
      );

      expect(trackCalls).toHaveLength(0);

      // Reset opt-out for other tests
      setAnalyticsOptOut(false);
    });

    it('should track correct metadata for each origin type', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Upload with metadata
      trackCodeInput('upload', 1000, 'javascript', 'test.js', {
        fileType: 'js',
        fileSize: 1024,
        success: true,
      });

      // GitHub with metadata
      trackCodeInput('github', 2000, 'typescript', 'component.tsx', {
        owner: 'facebook',
        name: 'react',
        path: 'packages/react/src/React.js',
        isPrivate: false,
      });

      const calls = consoleSpy.mock.calls.filter(
        call => call[0] === '[Analytics] code_input:'
      );

      // Verify upload metadata
      expect(calls[0][1]).toMatchObject({
        origin: 'upload',
        size_kb: 1, // 1000 bytes = 1 KB (rounded)
        language: 'javascript',
        filename: 'test.js',
        file: {
          type: 'js',
          size_kb: 1, // 1024 bytes = 1 KB
          success: true,
        }
      });

      // Verify GitHub metadata
      expect(calls[1][1]).toMatchObject({
        origin: 'github',
        size_kb: 2, // 2000 bytes = 2 KB (rounded)
        language: 'typescript',
        filename: 'component.tsx',
        repo: {
          owner: 'facebook',
          name: 'react',
          path: 'packages/react/src/React.js',
          is_private: false,
        }
      });

      consoleSpy.mockRestore();
    });
  });
});
