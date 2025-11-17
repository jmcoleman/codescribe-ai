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

export function useTierOverride() {
  const { user, updateToken } = useAuth();
  const [override, setOverride] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user can use tier override
  const canUseOverride = user && ['admin', 'support', 'super_admin'].includes(user.role);

  // Parse override from current JWT
  const parseOverrideFromUser = useCallback(() => {
    if (!user || !user.tierOverride) {
      return null;
    }

    const now = new Date();
    const expiry = new Date(user.overrideExpiry);

    // Check if expired
    if (now > expiry) {
      return null;
    }

    const remainingMs = expiry.getTime() - now.getTime();
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      active: true,
      tier: user.tierOverride,
      reason: user.overrideReason,
      expiresAt: user.overrideExpiry,
      appliedAt: user.overrideAppliedAt,
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tier-override/status', {
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tier-override', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply tier override');
      }

      const data = await response.json();

      // Update token in localStorage and auth context
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
        if (updateToken) {
          await updateToken(data.data.token);
        }
      }

      // Update override state
      setOverride({
        active: true,
        ...data.data.override
      });

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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tier-override/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear tier override');
      }

      const data = await response.json();

      // Update token in localStorage and auth context
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
        if (updateToken) {
          await updateToken(data.data.token);
        }
      }

      // Clear override state
      setOverride(null);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canUseOverride, updateToken]);

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
