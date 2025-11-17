/**
 * Tests for useTierOverride Hook
 *
 * Tests the tier override management hook:
 * - Override status parsing from JWT
 * - Apply override with new JWT
 * - Clear override and restore real tier
 * - Auto-update when user changes
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTierOverride } from '../useTierOverride';
import * as AuthContext from '../../contexts/AuthContext';

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('useTierOverride', () => {
  let mockUpdateToken;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateToken = vi.fn();

    // Default mock auth context
    AuthContext.useAuth.mockReturnValue({
      user: null,
      updateToken: mockUpdateToken
    });

    // Mock localStorage
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canUseOverride', () => {
    it('should return false when user is null', () => {
      const { result } = renderHook(() => useTierOverride());
      expect(result.current.canUseOverride).toBe(false);
    });

    it('should return false when user role is user', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'user', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.canUseOverride).toBe(false);
    });

    it('should return true when user role is admin', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.canUseOverride).toBe(true);
    });

    it('should return true when user role is support', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'support', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.canUseOverride).toBe(true);
    });

    it('should return true when user role is super_admin', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'super_admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.canUseOverride).toBe(true);
    });
  });

  describe('parseOverrideFromUser', () => {
    it('should return null when user has no override', () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.override).toBeNull();
    });

    it('should parse active override from user', () => {
      const expiryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const appliedTime = new Date();

      AuthContext.useAuth.mockReturnValue({
        user: {
          id: 1,
          role: 'admin',
          tier: 'free',
          tierOverride: 'pro',
          overrideExpiry: expiryTime.toISOString(),
          overrideReason: 'Testing pro features',
          overrideAppliedAt: appliedTime.toISOString()
        },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());

      expect(result.current.override).not.toBeNull();
      expect(result.current.override.active).toBe(true);
      expect(result.current.override.tier).toBe('pro');
      expect(result.current.override.reason).toBe('Testing pro features');
      expect(result.current.override.remainingTime.hours).toBe(2);
    });

    it('should return null when override has expired', () => {
      const expiryTime = new Date(Date.now() - 1000); // 1 second ago

      AuthContext.useAuth.mockReturnValue({
        user: {
          id: 1,
          role: 'admin',
          tier: 'free',
          tierOverride: 'pro',
          overrideExpiry: expiryTime.toISOString(),
          overrideReason: 'Testing',
          overrideAppliedAt: new Date().toISOString()
        },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());
      expect(result.current.override).toBeNull();
    });

    it('should calculate remaining time correctly', () => {
      const expiryTime = new Date(Date.now() + 90 * 60 * 1000); // 90 minutes from now

      AuthContext.useAuth.mockReturnValue({
        user: {
          id: 1,
          role: 'admin',
          tier: 'free',
          tierOverride: 'pro',
          overrideExpiry: expiryTime.toISOString(),
          overrideReason: 'Testing',
          overrideAppliedAt: new Date().toISOString()
        },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());

      expect(result.current.override.remainingTime.hours).toBe(1);
      expect(result.current.override.remainingTime.minutes).toBeGreaterThanOrEqual(29);
      expect(result.current.override.remainingTime.minutes).toBeLessThanOrEqual(30);
    });
  });

  describe('applyOverride', () => {
    it('should throw error when user cannot use override', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'user', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());

      await expect(
        result.current.applyOverride({
          targetTier: 'pro',
          reason: 'Testing pro features',
          hoursValid: 4
        })
      ).rejects.toThrow('Only admin/support users can apply tier overrides');
    });

    it('should apply override successfully', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const mockResponse = {
        success: true,
        data: {
          token: 'new-mock-token',
          override: {
            tier: 'pro',
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            reason: 'Testing pro features'
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useTierOverride());

      await act(async () => {
        await result.current.applyOverride({
          targetTier: 'pro',
          reason: 'Testing pro features',
          hoursValid: 4
        });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/tier-override', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetTier: 'pro',
          reason: 'Testing pro features',
          hoursValid: 4
        })
      });

      expect(mockUpdateToken).toHaveBeenCalledWith('new-mock-token');
      expect(result.current.override).toMatchObject({
        active: true,
        tier: 'pro'
      });
    });

    it('should handle API error', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Invalid tier'
        })
      });

      const { result } = renderHook(() => useTierOverride());

      await expect(
        result.current.applyOverride({
          targetTier: 'invalid',
          reason: 'Testing invalid tier',
          hoursValid: 4
        })
      ).rejects.toThrow('Invalid tier');
    });

    it('should set loading state during apply', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      let resolvePromise;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useTierOverride());

      const applyPromise = act(async () => {
        return result.current.applyOverride({
          targetTier: 'pro',
          reason: 'Testing loading state',
          hoursValid: 4
        });
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve fetch
      resolvePromise({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            token: 'new-token',
            override: {
              tier: 'pro',
              expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              reason: 'Testing loading state'
            }
          }
        })
      });

      await applyPromise;

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearOverride', () => {
    it('should throw error when user cannot use override', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'user', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());

      await expect(result.current.clearOverride()).rejects.toThrow(
        'Only admin/support users can clear tier overrides'
      );
    });

    it('should clear override successfully', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: {
          id: 1,
          role: 'admin',
          tier: 'free',
          tierOverride: 'pro',
          overrideExpiry: new Date(Date.now() + 3600000).toISOString()
        },
        updateToken: mockUpdateToken
      });

      const mockResponse = {
        success: true,
        data: {
          token: 'new-mock-token',
          tier: 'free'
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useTierOverride());

      await act(async () => {
        await result.current.clearOverride();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/tier-override/clear', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(mockUpdateToken).toHaveBeenCalledWith('new-mock-token');
      expect(result.current.override).toBeNull();
    });

    it('should handle API error', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: {
          id: 1,
          role: 'admin',
          tier: 'free',
          tierOverride: 'pro',
          overrideExpiry: new Date(Date.now() + 3600000).toISOString()
        },
        updateToken: mockUpdateToken
      });

      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'No active override to clear'
        })
      });

      const { result } = renderHook(() => useTierOverride());

      await expect(result.current.clearOverride()).rejects.toThrow(
        'No active override to clear'
      );
    });
  });

  describe('fetchStatus', () => {
    it('should not fetch when user cannot use override', async () => {
      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'user', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const { result } = renderHook(() => useTierOverride());

      await act(async () => {
        await result.current.fetchStatus();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch override status', async () => {
      Storage.prototype.getItem.mockReturnValue('mock-token');

      AuthContext.useAuth.mockReturnValue({
        user: { id: 1, role: 'admin', tier: 'free' },
        updateToken: mockUpdateToken
      });

      const mockResponse = {
        success: true,
        data: {
          active: true,
          override: {
            tier: 'pro',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            reason: 'Testing',
            remainingTime: { hours: 1, minutes: 0 }
          }
        }
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { result } = renderHook(() => useTierOverride());

      await act(async () => {
        await result.current.fetchStatus();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/tier-override/status', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      expect(result.current.override).toMatchObject({
        tier: 'pro',
        reason: 'Testing'
      });
    });
  });
});
