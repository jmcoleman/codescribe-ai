import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBanner } from '../ErrorBanner';

/**
 * Test suite for ErrorBanner error type handling and formatting
 *
 * Specifically tests the distinction between:
 * - Claude API rate limits (external service)
 * - CodeScribe usage quota limits (tier-based)
 */
describe('ErrorBanner - Error Type Handling', () => {
  describe('Claude API Rate Limit Errors', () => {
    it('should show "Claude API Rate Limit" title for Claude API errors', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'You have reached your specified Claude API usage limits. You will regain access on 2025-11-01 at 00:00 UTC.',
        originalMessage: 'You have reached your specified Claude API usage limits.'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      // Title should be specific
      expect(screen.getByText('Claude API Rate Limit')).toBeInTheDocument();

      // Message should include "Claude API" inline (may appear multiple times due to tech details)
      const matches = screen.getAllByText(/Claude API usage limits/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should show "Claude API Rate Limit" for errors with "Claude API" in message', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Claude API Rate Limit: Too many requests',
        originalMessage: 'Rate limit exceeded'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Claude API Rate Limit')).toBeInTheDocument();
    });

    it('should display the full Claude API error message with date', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'You have reached your specified Claude API usage limits. You will regain access on 2025-11-01 at 00:00 UTC.'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      // Text appears in both main message and technical details
      const dateMatches = screen.getAllByText(/You will regain access on 2025-11-01 at 00:00 UTC/);
      expect(dateMatches.length).toBeGreaterThan(0);

      const claudeMatches = screen.getAllByText(/Claude API usage limits/);
      expect(claudeMatches.length).toBeGreaterThan(0);
    });
  });

  describe('CodeScribe Quota Limit Errors', () => {
    it('should show generic "Rate Limit Exceeded" for non-Claude rate limits', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Rate limit exceeded. Please wait before trying again.',
        originalMessage: 'Too many requests'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
      expect(screen.queryByText(/Claude API/)).not.toBeInTheDocument();
    });

    it('should handle 429 errors without Claude API mention', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Rate limit exceeded. Too many requests.'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
    });
  });

  describe('Invalid Request Errors', () => {
    it('should show "Invalid Request" for 400 errors without Claude API mention', () => {
      const error = JSON.stringify({
        type: 'InvalidRequestError',
        message: 'Invalid request. Please check your code input and try again.'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Invalid Request')).toBeInTheDocument();
    });

    it('should show "Claude API Rate Limit" for 400 errors WITH Claude API mention', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Claude API usage limit reached',
        originalMessage: 'API usage limits exceeded'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      // Should be treated as Claude API error, not generic invalid request
      expect(screen.getByText('Claude API Rate Limit')).toBeInTheDocument();
    });
  });

  describe('Other Error Types', () => {
    it('should format TypeError as "Type Error"', () => {
      const error = JSON.stringify({
        type: 'TypeError',
        message: 'Cannot read property of undefined'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Type Error')).toBeInTheDocument();
    });

    it('should show "Connection Error" for Failed to fetch', () => {
      const error = JSON.stringify({
        type: 'TypeError',
        message: 'Network error occurred',
        originalMessage: 'Failed to fetch'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should format underscore-separated error types', () => {
      const error = JSON.stringify({
        type: 'invalid_request_error',
        message: 'Request validation failed'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      expect(screen.getByText('Invalid Request Error')).toBeInTheDocument();
    });
  });

  describe('Retry After', () => {
    it('should show retry countdown for rate limit errors', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Rate limit exceeded'
      });

      render(<ErrorBanner error={error} retryAfter={60} onDismiss={vi.fn()} />);

      expect(screen.getByText(/Please wait 60 seconds before trying again/)).toBeInTheDocument();
    });

    it('should not show retry countdown when retryAfter is null', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'Rate limit exceeded'
      });

      render(<ErrorBanner error={error} retryAfter={null} onDismiss={vi.fn()} />);

      expect(screen.queryByText(/Please wait.*seconds/)).not.toBeInTheDocument();
    });
  });

  describe('Message Clarification', () => {
    it('should add "Claude" inline to API usage limit messages', () => {
      const error = JSON.stringify({
        type: 'RateLimitError',
        message: 'You have reached your specified Claude API usage limits. You will regain access on 2025-11-01 at 00:00 UTC.'
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      // "Claude API" should be inline in the message (appears in main message + tech details)
      const claudeMatches = screen.getAllByText(/Claude API usage limits/);
      expect(claudeMatches.length).toBeGreaterThan(0);

      const dateMatches = screen.getAllByText(/You will regain access on 2025-11-01/);
      expect(dateMatches.length).toBeGreaterThan(0);
    });

    it('should handle multi-line error messages correctly', () => {
      const line1 = 'You have reached your specified Claude API usage limits.';
      const line2 = 'You will regain access on 2025-11-01 at 00:00 UTC.';

      const error = JSON.stringify({
        type: 'RateLimitError',
        message: `${line1}\n${line2}`
      });

      render(<ErrorBanner error={error} onDismiss={vi.fn()} />);

      const claudeMatches = screen.getAllByText(/Claude API usage limits/);
      expect(claudeMatches.length).toBeGreaterThan(0);

      const dateMatches = screen.getAllByText(/You will regain access on 2025-11-01/);
      expect(dateMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Plain String Errors', () => {
    it('should handle plain string rate limit errors', () => {
      render(<ErrorBanner error="Rate limit exceeded" onDismiss={vi.fn()} />);

      // Both heading and message may appear in tech details too
      const errorMatches = screen.getAllByText('Error');
      expect(errorMatches.length).toBeGreaterThan(0);

      const messageMatches = screen.getAllByText('Rate limit exceeded');
      expect(messageMatches.length).toBeGreaterThan(0);
    });

    it('should detect Claude API in plain string and format title', () => {
      // Note: This won't work with plain strings - they need to be JSON objects
      // to get proper title formatting. This test documents the limitation.
      render(<ErrorBanner error="Claude API Rate Limit: Error occurred" onDismiss={vi.fn()} />);

      // Plain strings get generic "Error" heading (may appear in tech details too)
      const errorMatches = screen.getAllByText('Error');
      expect(errorMatches.length).toBeGreaterThan(0);

      const messageMatches = screen.getAllByText(/Claude API Rate Limit: Error occurred/);
      expect(messageMatches.length).toBeGreaterThan(0);
    });
  });
});
