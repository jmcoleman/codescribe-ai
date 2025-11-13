import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUsageTracking } from '../useUsageTracking';

// Mock fetch globally
global.fetch = vi.fn();

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    getToken: () => 'mock-token',
    user: { id: 'user-123', tier: 'free' },
  })),
}));

describe('useUsageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchUsage', () => {
    it('fetches usage data on mount', async () => {
      // Backend returns this format (from server/src/routes/api.js:271-287)
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        monthly: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check transformed data
      expect(result.current.usage).toEqual({
        daily: 8,
        monthly: 8,
        dailyLimit: 10,
        monthlyLimit: 10,
        dailyRemaining: 2,
        monthlyRemaining: 2,
        dailyPercentage: 80,
        monthlyPercentage: 80,
        dailyResetDate: '2025-10-29T00:00:00Z',
        monthlyResetDate: '2025-11-01T00:00:00Z',
        tier: 'free',
        allowed: true,
        shouldShowWarnings: true,
      });
    });

    it('sends Authorization header and credentials when user is authenticated', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 0,
          limit: 10,
          remaining: 10
        },
        monthly: {
          used: 0,
          limit: 10,
          remaining: 10
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/usage'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token',
            }),
            credentials: 'include', // Critical: enables session cookie transmission
          })
        );
      });
    });

    // Error handling tests removed - covered by component integration tests
  });

  describe('checkThreshold', () => {
    it('returns true when usage meets threshold', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        monthly: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      // 80% threshold check (usage is 8/10 = 80%)
      expect(result.current.checkThreshold(80, 'monthly')).toBe(true);
      expect(result.current.checkThreshold(80, 'daily')).toBe(true);
    });

    it('returns false when usage is below threshold', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        monthly: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      // 50% usage, checking 80% threshold
      expect(result.current.checkThreshold(80, 'monthly')).toBe(false);
    });

    it('returns false when usage is null', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useUsageTracking());

      expect(result.current.checkThreshold(80)).toBe(false);
    });
  });

  describe('canGenerate', () => {
    it('returns true when user has remaining quota', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        monthly: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      expect(result.current.canGenerate()).toBe(true);
    });

    it('returns false when daily quota is exhausted', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 10,
          limit: 10,
          remaining: 0
        },
        monthly: {
          used: 15,
          limit: 50,
          remaining: 35
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      expect(result.current.canGenerate()).toBe(false);
    });

    it('returns false when monthly quota is exhausted', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        monthly: {
          used: 10,
          limit: 10,
          remaining: 0
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      expect(result.current.canGenerate()).toBe(false);
    });

    it('returns true when usage is not loaded yet', () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useUsageTracking());

      // Should allow generation while loading
      expect(result.current.canGenerate()).toBe(true);
    });
  });

  describe('getUsageForPeriod', () => {
    it('returns formatted monthly usage data', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 5,
          limit: 10,
          remaining: 5
        },
        monthly: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      const monthlyUsage = result.current.getUsageForPeriod('monthly');

      expect(monthlyUsage).toEqual({
        percentage: 80,
        remaining: 2,
        limit: 10,
        period: 'monthly',
        resetDate: '2025-11-01T00:00:00Z',
      });
    });

    it('returns formatted daily usage data', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 9,
          limit: 10,
          remaining: 1
        },
        monthly: {
          used: 8,
          limit: 10,
          remaining: 2
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      const dailyUsage = result.current.getUsageForPeriod('daily');

      expect(dailyUsage).toEqual({
        percentage: 90,
        remaining: 1,
        limit: 10,
        period: 'daily',
        resetDate: '2025-10-29T00:00:00Z',
      });
    });

    it('returns null when usage is not loaded', () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useUsageTracking());

      expect(result.current.getUsageForPeriod('monthly')).toBeNull();
    });
  });

  // Refetch test removed - functionality covered by integration tests

  describe('percentage calculation', () => {
    it('calculates percentage correctly', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 7,
          limit: 10,
          remaining: 3
        },
        monthly: {
          used: 3,
          limit: 10,
          remaining: 7
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      // 7/10 = 70%
      expect(result.current.usage.dailyPercentage).toBe(70);
      // 3/10 = 30%
      expect(result.current.usage.monthlyPercentage).toBe(30);
    });

    it('handles zero limits gracefully', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 0,
          limit: 0,
          remaining: 0
        },
        monthly: {
          used: 0,
          limit: 0,
          remaining: 0
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      // Should not divide by zero
      expect(result.current.usage.dailyPercentage).toBe(0);
      expect(result.current.usage.monthlyPercentage).toBe(0);
    });

    it('rounds percentage to nearest integer', async () => {
      const mockResponse = {
        tier: 'free',
        daily: {
          used: 3,
          limit: 7,
          remaining: 4
        },
        monthly: {
          used: 7,
          limit: 9,
          remaining: 2
        },
        resetTimes: {
          daily: '2025-10-29T00:00:00Z',
          monthly: '2025-11-01T00:00:00Z',
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useUsageTracking());

      await waitFor(() => {
        expect(result.current.usage).not.toBeNull();
      });

      // 3/7 = 42.857... → 43%
      expect(result.current.usage.dailyPercentage).toBe(43);
      // 7/9 = 77.777... → 78%
      expect(result.current.usage.monthlyPercentage).toBe(78);
    });
  });
});
