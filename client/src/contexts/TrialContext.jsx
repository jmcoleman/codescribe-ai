/**
 * TrialContext - Trial State Management
 *
 * Provides trial-related state and operations to the application.
 * Works with AuthContext to derive trial status from user data.
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage';

const TrialContext = createContext(null);

export function TrialProvider({ children }) {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);

  /**
   * Derive trial status from user object
   * The auth middleware attaches trial info to the user
   */
  const trialStatus = useMemo(() => {
    if (!user) {
      return {
        isOnTrial: false,
        trialTier: null,
        trialEndsAt: null,
        daysRemaining: null,
        effectiveTier: 'free'
      };
    }

    const isOnTrial = user.isOnTrial || false;
    const trialEndsAt = user.trialEndsAt || null;
    const trialTier = user.trialTier || null;
    const effectiveTier = user.effectiveTier || user.tier || 'free';

    // Calculate days remaining
    let daysRemaining = null;
    if (trialEndsAt) {
      const now = new Date();
      const endsAt = new Date(trialEndsAt);
      const diffMs = endsAt - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      isOnTrial,
      trialTier,
      trialEndsAt,
      daysRemaining,
      effectiveTier
    };
  }, [user]);

  /**
   * Validate an invite code without redeeming
   * Can be called without authentication
   * @param {string} code - Invite code to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateCode = useCallback(async (code) => {
    try {
      const normalizedCode = code.toUpperCase().trim();
      const response = await fetch(`${API_URL}/api/trials/validate/${normalizedCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate code');
      }

      return data.data;
    } catch (error) {
      console.error('[TrialContext] Validate code error:', error);
      throw error;
    }
  }, []);

  /**
   * Redeem an invite code to start a trial
   * Requires authentication
   * @param {string} code - Invite code to redeem
   * @returns {Promise<Object>} Redemption result
   */
  const redeemCode = useCallback(async (code) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to redeem an invite code');
    }

    setIsRedeeming(true);
    setRedeemError(null);
    setEligibilityError(null);

    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_URL}/api/trials/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is an eligibility error with structured data
        if (data.code && data.details) {
          setEligibilityError({
            errorCode: data.code,
            error: data.error || 'Eligibility check failed',
            details: data.details
          });
        }

        const error = new Error(data.error || 'Failed to redeem code');
        error.code = data.code;
        error.details = data.details;
        throw error;
      }

      // Refresh user data to get updated trial info
      await refreshUser();

      return data;
    } catch (error) {
      console.error('[TrialContext] Redeem code error:', error);
      setRedeemError(error.message);
      throw error;
    } finally {
      setIsRedeeming(false);
    }
  }, [isAuthenticated, refreshUser]);

  /**
   * Fetch full trial status from API
   * Useful for getting detailed status like eligibility
   * @returns {Promise<Object>} Full trial status
   */
  const fetchTrialStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_URL}/api/trials/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trial status');
      }

      return data.data;
    } catch (error) {
      console.error('[TrialContext] Fetch status error:', error);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Clear redeem error
   */
  const clearRedeemError = useCallback(() => {
    setRedeemError(null);
    setEligibilityError(null);
  }, []);

  const value = useMemo(() => ({
    // Trial status (derived from user)
    isOnTrial: trialStatus.isOnTrial,
    trialTier: trialStatus.trialTier,
    trialEndsAt: trialStatus.trialEndsAt,
    daysRemaining: trialStatus.daysRemaining,
    effectiveTier: trialStatus.effectiveTier,

    // Operations
    validateCode,
    redeemCode,
    fetchTrialStatus,

    // UI state
    isRedeeming,
    redeemError,
    eligibilityError,
    clearRedeemError
  }), [
    trialStatus,
    validateCode,
    redeemCode,
    fetchTrialStatus,
    isRedeeming,
    redeemError,
    eligibilityError,
    clearRedeemError
  ]);

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>;
}

/**
 * Hook to access trial context
 */
export function useTrial() {
  const context = useContext(TrialContext);

  if (!context) {
    throw new Error('useTrial must be used within a TrialProvider');
  }

  return context;
}
