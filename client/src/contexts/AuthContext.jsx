/**
 * AuthContext - Authentication State Management
 *
 * Provides authentication state and methods to the entire application.
 * Handles user login, signup, logout, and session persistence via JWT.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { STORAGE_KEYS } from '../constants/storage';

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
  clearError: () => {},
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

  /**
   * Initialize authentication state from stored token
   */
  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

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
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up a new user
   */
  const signup = async (email, password) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.success && data.token && data.user) {
        // Store token
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

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
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

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
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (token) {
        // Call logout endpoint to invalidate session
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local state and token
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
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
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
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
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
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
    clearError,
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
