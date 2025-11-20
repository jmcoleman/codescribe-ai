/**
 * useTierOverride Hook
 *
 * Manages tier override state for admin/support users.
 * Provides methods to apply, clear, and check override status.
 *
 * Features:
 * - Auto-fetch override status on mount
 * - Apply override with new JWT
 * - Clear override and restore real tier
 * - Parse override details from current JWT
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

export function useTierOverride() {
  const { user, updateToken } = useAuth();
  const [override, setOverride] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can use tier override
  const canUseOverride = user && ['admin', 'support', 'super_admin'].includes(user.role);

  // Parse override from current user (database fields)
  const parseOverrideFromUser = useCallback(() => {
    if (!user || !user.viewing_as_tier) {
      return null;
    }

    const now = new Date();
    const expiry = new Date(user.override_expires_at);

    // Check if expired
    if (now > expiry) {
      return null;
    }

    const remainingMs = expiry.getTime() - now.getTime();
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      active: true,
      tier: user.viewing_as_tier,
      reason: user.override_reason,
      expiresAt: user.override_expires_at,
      appliedAt: user.override_applied_at,
      remainingTime: {
        hours,
        minutes,
        totalMs: remainingMs
      }
    };
  }, [user]);

  // Update override state when user changes
  useEffect(() => {
    if (canUseOverride) {
      const currentOverride = parseOverrideFromUser();
      setOverride(currentOverride);
    } else {
      setOverride(null);
    }
  }, [canUseOverride, parseOverrideFromUser]);

  // Fetch override status from API
  const fetchStatus = useCallback(async () => {
    if (!canUseOverride) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_URL}/api/admin/tier-override/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch override status');
      }

      const data = await response.json();

      if (data.success && data.data.active) {
        setOverride(data.data.override);
      } else {
        setOverride(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tier override status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [canUseOverride]);

  // Apply tier override
  const applyOverride = useCallback(async ({ targetTier, reason, hoursValid = 4 }) => {
    if (!canUseOverride) {
      throw new Error('Only admin/support users can apply tier overrides');
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('[useTierOverride] Applying override:', { targetTier, reason, hoursValid });
      console.log('[useTierOverride] Token exists:', !!token);

      const response = await fetch(`${API_URL}/api/admin/tier-override`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetTier,
          reason,
          hoursValid
        })
      });

      console.log('[useTierOverride] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useTierOverride] Error response:', errorData);
        throw new Error(errorData.message || 'Failed to apply tier override');
      }

      const data = await response.json();
      console.log('[useTierOverride] Success response:', data);

      // Refresh user from /api/auth/me to get updated override fields
      if (updateToken) {
        await updateToken();
        console.log('[useTierOverride] User refreshed from /api/auth/me');
      }

      // Update override state
      setOverride({
        active: true,
        ...data.data.override
      });

      console.log('[useTierOverride] Override applied successfully');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canUseOverride, updateToken]);

  // Clear tier override
  const clearOverride = useCallback(async () => {
    if (!canUseOverride) {
      throw new Error('Only admin/support users can clear tier overrides');
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('[useTierOverride] Clearing override, token exists:', !!token);
      console.log('[useTierOverride] Current user state:', user);

      const response = await fetch(`${API_URL}/api/admin/tier-override/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[useTierOverride] Clear response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useTierOverride] Clear error response:', errorData);
        throw new Error(errorData.message || 'Failed to clear tier override');
      }

      const data = await response.json();
      console.log('[useTierOverride] Clear success response:', data);

      // Refresh user from /api/auth/me to get updated state (override cleared)
      if (updateToken) {
        await updateToken();
        console.log('[useTierOverride] User refreshed from /api/auth/me after clear');
      }

      // Clear override state
      setOverride(null);
      console.log('[useTierOverride] Override cleared successfully');

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canUseOverride, updateToken, user]);

  return {
    override,
    canUseOverride,
    isLoading,
    error,
    applyOverride,
    clearOverride,
    fetchStatus
  };
}
