/**
 * Unit tests for LLM utilities
 */

import {
  sleep,
  retryWithBackoff,
  shouldNotRetry,
  standardizeError,
  estimateTokens
} from '../llm/utils.js';

describe('LLM Utilities', () => {
  describe('sleep()', () => {
    it('should pause execution for specified milliseconds', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should be around 100ms (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('retryWithBackoff()', () => {
    it('should return result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, 3);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should throw error after max retries exhausted', async () => {
      const error = new Error('Persistent failure');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 2)).rejects.toThrow('Persistent failure');

      // Called: initial + 2 retries = 3 times
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 401 error (invalid API key)', async () => {
      const error = new Error('Invalid API key');
      error.status = 401;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3)).rejects.toThrow('Invalid API key');

      // Should only be called once (no retries)
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400 error (bad request)', async () => {
      const error = new Error('Bad request');
      error.status = 400;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3)).rejects.toThrow('Bad request');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 403 error (forbidden)', async () => {
      const error = new Error('Forbidden');
      error.status = 403;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3)).rejects.toThrow('Forbidden');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on invalid_request_error from Anthropic', async () => {
      const error = new Error('Invalid request');
      error.error = { type: 'invalid_request_error' };
      const fn = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(fn, 3)).rejects.toThrow('Invalid request');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use custom operation name in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const error = new Error('Temporary error');
      error.status = 500; // Retryable error
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      await retryWithBackoff(fn, 3, 'Custom operation');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom operation failed')
      );

      consoleSpy.mockRestore();
    });

    it('should implement exponential backoff (1s, 2s, 4s)', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retryWithBackoff(fn, 3);
      const elapsed = Date.now() - startTime;

      // Should wait at least 1s + 2s = 3s
      expect(elapsed).toBeGreaterThanOrEqual(3000);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should log error after all retries exhausted', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const fn = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(retryWithBackoff(fn, 2)).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('failed after 3 attempts')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('shouldNotRetry()', () => {
    it('should return true for 400 error', () => {
      const error = new Error('Bad request');
      error.status = 400;
      expect(shouldNotRetry(error)).toBe(true);
    });

    it('should return true for 401 error', () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      expect(shouldNotRetry(error)).toBe(true);
    });

    it('should return true for 403 error', () => {
      const error = new Error('Forbidden');
      error.status = 403;
      expect(shouldNotRetry(error)).toBe(true);
    });

    it('should return true for invalid_request_error', () => {
      const error = new Error('Invalid');
      error.error = { type: 'invalid_request_error' };
      expect(shouldNotRetry(error)).toBe(true);
    });

    it('should return false for 429 error (rate limit)', () => {
      const error = new Error('Rate limited');
      error.status = 429;
      expect(shouldNotRetry(error)).toBe(false);
    });

    it('should return false for 500 error (server error)', () => {
      const error = new Error('Server error');
      error.status = 500;
      expect(shouldNotRetry(error)).toBe(false);
    });

    it('should return false for 503 error (service unavailable)', () => {
      const error = new Error('Unavailable');
      error.status = 503;
      expect(shouldNotRetry(error)).toBe(false);
    });

    it('should return false for errors without status', () => {
      const error = new Error('Generic error');
      expect(shouldNotRetry(error)).toBe(false);
    });
  });

  describe('standardizeError()', () => {
    it('should standardize 401 auth error', () => {
      const originalError = new Error('Unauthorized');
      originalError.status = 401;

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.message).toBe('Unauthorized'); // Preserves original message
      expect(standardError.provider).toBe('claude');
      expect(standardError.operation).toBe('generate');
      expect(standardError.statusCode).toBe(401);
      expect(standardError.errorType).toBe('AUTH');
      expect(standardError.originalError).toBe(originalError);
    });

    it('should standardize 429 rate limit error', () => {
      const originalError = new Error('Rate limited');
      originalError.status = 429;

      const standardError = standardizeError(originalError, 'openai', 'stream');

      expect(standardError.message).toContain('Rate limited');
      expect(standardError.statusCode).toBe(429);
      expect(standardError.errorType).toBe('RATE_LIMIT');
    });

    it('should standardize 400 validation error', () => {
      const originalError = new Error('Invalid parameters');
      originalError.status = 400;

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.message).toContain('Invalid parameters');
      expect(standardError.statusCode).toBe(400);
      expect(standardError.errorType).toBe('VALIDATION');
    });

    it('should standardize 500 server error', () => {
      const originalError = new Error('Internal server error');
      originalError.status = 500;

      const standardError = standardizeError(originalError, 'openai', 'generate');

      expect(standardError.message).toContain('Internal server error');
      expect(standardError.statusCode).toBe(500);
      expect(standardError.errorType).toBe('SERVER_ERROR');
    });

    it('should extract message from nested error.error.message', () => {
      const originalError = new Error('Outer message');
      originalError.error = { message: 'Inner message' };
      originalError.status = 400;

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.message).toBe('Inner message');
    });

    it('should parse JSON error message from Anthropic', () => {
      const errorJson = {
        error: {
          message: 'Detailed error from API',
          type: 'invalid_request_error'
        }
      };
      const originalError = new Error(`API Error: ${JSON.stringify(errorJson)}`);
      originalError.status = 400;

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.message).toBe('Detailed error from API');
    });

    it('should use original message if JSON parsing fails', () => {
      const originalError = new Error('Error with { malformed JSON');
      originalError.status = 500;

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.message).toContain('malformed JSON');
    });

    it('should add retryAfter from headers', () => {
      const originalError = new Error('Rate limited');
      originalError.status = 429;
      originalError.headers = { 'retry-after': '60' };

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.retryAfter).toBe(60);
    });

    it('should default to status 500 if not provided', () => {
      const originalError = new Error('Unknown error');

      const standardError = standardizeError(originalError, 'claude', 'generate');

      expect(standardError.statusCode).toBe(500);
      expect(standardError.errorType).toBe('SERVER_ERROR');
    });

    it('should handle errors without message property', () => {
      const originalError = new Error();
      originalError.status = 500;

      const standardError = standardizeError(originalError, 'openai', 'stream');

      expect(standardError.message).toBe('openai server error');
    });
  });

  describe('estimateTokens()', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'This is a test string with approximately 40 chars';
      const tokens = estimateTokens(text);

      // ~50 chars / 4 = ~12.5 tokens, rounded up = 13
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20);
    });

    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(estimateTokens(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(estimateTokens(undefined)).toBe(0);
    });

    it('should round up fractional tokens', () => {
      // 5 characters / 4 = 1.25 tokens, should round up to 2
      expect(estimateTokens('12345')).toBe(2);
    });

    it('should handle large texts', () => {
      const largeText = 'a'.repeat(4000);
      const tokens = estimateTokens(largeText);

      // 4000 chars / 4 = 1000 tokens
      expect(tokens).toBe(1000);
    });
  });
});
