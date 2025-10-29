import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '../config/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Hook for tracking and monitoring user quota usage
 *
 * Fetches usage data from /api/user/usage endpoint and provides
 * helpers for checking thresholds (80%, 100%) and quota status.
 *
 * Usage:
 *   const { usage, isLoading, error, refetch, checkThreshold } = useUsageTracking();
 *
 *   if (checkThreshold(80)) {
 *     // Show 80% warning banner
 *   }
 *
 * @returns {Object} Usage tracking state and helpers
 */
export function useUsageTracking() {
  const { getToken, user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch usage data from API
   */
  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const headers = {};

      // Add Authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/user/usage`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend response format to component-friendly format
      // Backend format: { tier, daily: { used, limit, remaining }, monthly: { ... }, resetTimes: { ... } }
      const transformed = {
        // Current usage
        daily: data.daily?.used || 0,
        monthly: data.monthly?.used || 0,

        // Limits
        dailyLimit: data.daily?.limit || 0,
        monthlyLimit: data.monthly?.limit || 0,

        // Remaining
        dailyRemaining: typeof data.daily?.remaining === 'string' ? 999999 : (data.daily?.remaining || 0),
        monthlyRemaining: typeof data.monthly?.remaining === 'string' ? 999999 : (data.monthly?.remaining || 0),

        // Percentages
        dailyPercentage: data.daily?.limit > 0
          ? Math.round((data.daily.used / data.daily.limit) * 100)
          : 0,
        monthlyPercentage: data.monthly?.limit > 0
          ? Math.round((data.monthly.used / data.monthly.limit) * 100)
          : 0,

        // Reset dates
        dailyResetDate: data.resetTimes?.daily,
        monthlyResetDate: data.resetTimes?.monthly,

        // Tier info
        tier: data.tier || 'free',
        allowed: true, // User can generate if endpoint returns successfully
      };

      setUsage(transformed);
      return transformed;
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  /**
   * Check if usage has reached a specific threshold
   *
   * @param {number} threshold - Percentage threshold (e.g., 80, 100)
   * @param {'daily'|'monthly'} period - Which period to check
   * @returns {boolean} True if threshold reached
   */
  const checkThreshold = useCallback((threshold, period = 'monthly') => {
    if (!usage) return false;

    // Don't show warnings if endpoint not implemented (limits = 0)
    if (usage.dailyLimit === 0 && usage.monthlyLimit === 0) return false;

    const percentage = period === 'daily'
      ? usage.dailyPercentage
      : usage.monthlyPercentage;

    return percentage >= threshold;
  }, [usage]);

  /**
   * Check if user can generate (not at 100% limit)
   *
   * @returns {boolean} True if user can generate
   */
  const canGenerate = useCallback(() => {
    // IMPORTANT: Allow generation if usage data not loaded
    // This handles cases where:
    // 1. Usage endpoint doesn't exist yet (future feature)
    // 2. API error occurred
    // 3. User is not authenticated
    if (!usage) return true;

    // IMPORTANT: If limits are 0, assume endpoint not implemented yet
    // Real tier limits should never be 0 (minimum is 1)
    if (usage.dailyLimit === 0 && usage.monthlyLimit === 0) return true;

    // Check both daily and monthly limits
    return usage.dailyRemaining > 0 && usage.monthlyRemaining > 0;
  }, [usage]);

  /**
   * Get usage data for a specific period (for components)
   *
   * @param {'daily'|'monthly'} period - Which period to get
   * @returns {Object} Usage data formatted for components
   */
  const getUsageForPeriod = useCallback((period = 'monthly') => {
    if (!usage) return null;

    const isDaily = period === 'daily';

    return {
      percentage: isDaily ? usage.dailyPercentage : usage.monthlyPercentage,
      remaining: isDaily ? usage.dailyRemaining : usage.monthlyRemaining,
      limit: isDaily ? usage.dailyLimit : usage.monthlyLimit,
      period,
      resetDate: isDaily ? usage.dailyResetDate : usage.monthlyResetDate,
    };
  }, [usage]);

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage, user?.id]);

  return {
    usage,
    isLoading,
    error,
    refetch: fetchUsage,
    checkThreshold,
    canGenerate,
    getUsageForPeriod,
  };
}
