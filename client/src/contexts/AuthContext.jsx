/**
 * AuthContext - Authentication State Management
 *
 * Provides authentication state and methods to the entire application.
 * Handles user login, signup, logout, and session persistence via JWT.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { STORAGE_KEYS, getStorageItem, setStorageItem, removeStorageItem, clearAppStorage } from '../constants/storage';
import { clearWorkspaceLocalStorage } from '../hooks/useWorkspacePersistence';
import { clearBatchSessionStorage } from '../hooks/useBatchGeneration';
import { setAnalyticsOptOut, setAnalyticsUserStatus } from '../utils/analytics';

const AuthContext = createContext(null);

// Feature flag for authentication
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

// Dummy auth context for when auth is disabled
const dummyAuthContext = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  signup: async () => { throw new Error('Authentication is disabled'); },
  login: async () => { throw new Error('Authentication is disabled'); },
  logout: async () => {},
  forgotPassword: async () => { throw new Error('Authentication is disabled'); },
  resetPassword: async () => { throw new Error('Authentication is disabled'); },
  getToken: () => null,
  refreshUser: async () => {},
  updateProfile: async () => { throw new Error('Authentication is disabled'); },
  clearError: () => {},
  acceptLegalDocuments: async () => { throw new Error('Authentication is disabled'); },
  checkLegalStatus: async () => ({ needs_reacceptance: false }),
};

export function AuthProvider({ children }) {
  // If auth is disabled, skip all auth logic
  if (!ENABLE_AUTH) {
    return <AuthContext.Provider value={dummyAuthContext}>{children}</AuthContext.Provider>;
  }

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Sync analytics opt-out state when user changes
  useEffect(() => {
    // When user is logged in, respect their analytics preference
    // analytics_enabled: true = tracking allowed, false = opted out
    // setAnalyticsOptOut: true = opted out, false = tracking allowed
    if (user) {
      setAnalyticsOptOut(user.analytics_enabled === false);

      // Sync admin/override status for analytics filtering
      // Events from admin users or users with tier overrides should be excluded from business metrics
      const isAdmin = ['admin', 'support', 'super_admin'].includes(user.role);
      const hasTierOverride = !!user.viewing_as_tier;
      setAnalyticsUserStatus({ isAdmin, hasTierOverride });
    } else {
      // When logged out, reset to default (tracking allowed for anonymous)
      setAnalyticsOptOut(false);
      setAnalyticsUserStatus({ isAdmin: false, hasTierOverride: false });
    }
  }, [user]);

  /**
   * Initialize authentication state from stored token
   */
  const initializeAuth = async () => {
    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token and fetch user data
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid or expired
        removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Optional parameters
   * @param {string} options.trialCode - Trial invite code to embed in verification email
   * @param {string} options.subscriptionTier - Subscription tier to embed in verification email
   * @param {string} options.subscriptionBillingPeriod - Billing period (monthly/yearly)
   * @param {string} options.subscriptionTierName - Display name for the tier
   * @param {boolean} options.acceptTerms - Whether user accepted Terms and Privacy Policy
   */
  const signup = async (email, password, options = {}) => {
    try {
      setError(null);

      const body = { email, password };
      if (options.trialCode) {
        body.trialCode = options.trialCode;
      }
      if (options.subscriptionTier) {
        body.subscriptionTier = options.subscriptionTier;
        body.subscriptionBillingPeriod = options.subscriptionBillingPeriod;
        body.subscriptionTierName = options.subscriptionTierName;
      }
      if (options.acceptTerms) {
        body.acceptTerms = true;
      }

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.success && data.token && data.user) {
        // Store token
        setStorageItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

        // Update user state
        setUser(data.user);

        return { success: true };
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Log in an existing user
   */
  const login = async (email, password) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.token && data.user) {
        // Store token
        setStorageItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

        // Update user state
        setUser(data.user);

        return { success: true };
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      const errorMessage = err.message || 'Failed to log in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      const currentUserId = user?.id; // Capture user ID before clearing state

      if (token) {
        // Call logout endpoint to invalidate session
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      // Clear user-scoped localStorage data (code, docs, scores, workspace)
      if (currentUserId) {
        clearWorkspaceLocalStorage(currentUserId);
        clearAppStorage(currentUserId);
      }

      // Clear batch state from sessionStorage (prevents stale batch content on re-login)
      clearBatchSessionStorage();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local state and token
      removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      setUser(null);
      setError(null);
    }
  };

  /**
   * Request password reset email
   */
  const forgotPassword = async (email) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err.message || 'Failed to send reset email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token, password) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // If backend returns token and user, automatically log the user in
      if (data.token && data.user) {
        setStorageItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        setUser(data.user);
      }

      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Get current auth token
   */
  const getToken = () => {
    return getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  };

  /**
   * Refresh user data from server
   * Useful after email verification or profile updates
   */
  const refreshUser = async () => {
    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  /**
   * Update token and refresh user state
   * Used when a new JWT is received (e.g., after tier override)
   */
  const updateToken = async (newToken) => {
    try {
      console.log('[AuthContext] updateToken called');
      // Token should already be in localStorage, just refresh user from /me endpoint
      await refreshUser();
    } catch (err) {
      console.error('[AuthContext] Error updating token:', err);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);

      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user state with new data
      if (data.user) {
        setUser(data.user);
      }

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Accept current Terms of Service and Privacy Policy
   * @param {Object} acceptance - Object with accept_terms and accept_privacy booleans
   * @returns {Promise<Object>} Success result or error
   */
  const acceptLegalDocuments = async (acceptance) => {
    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/legal/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(acceptance),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record legal acceptance');
      }

      // Refresh user data to get updated legal acceptance fields
      await refreshUser();

      return { success: true, data };
    } catch (err) {
      console.error('Legal acceptance error:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Check if user needs to re-accept legal documents
   * @returns {Promise<Object>} Status object with needs_reacceptance flag
   */
  const checkLegalStatus = async () => {
    try {
      const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        return { needs_reacceptance: false };
      }

      const response = await fetch(`${API_URL}/api/legal/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check legal status');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error checking legal status:', err);
      return { needs_reacceptance: false };
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    getToken,
    refreshUser,
    updateToken,
    updateProfile,
    clearError,
    acceptLegalDocuments,
    checkLegalStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
