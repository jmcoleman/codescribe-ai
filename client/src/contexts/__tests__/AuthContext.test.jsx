/**
 * Unit tests for AuthContext
 * Tests authentication state management, API calls, and token handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { STORAGE_KEYS } from '../../constants/storage';

// Mock API_URL
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3000',
}));

describe('AuthContext', () => {
  let mockFetch;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with no user when no token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should initialize with user when valid token exists', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        tier: 'free',
      };

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'valid-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/me',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid-token',
          },
        })
      );
    });

    it('should clear invalid token on initialization', async () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'invalid-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe(null);
    });
  });

  describe('signup', () => {
    it('should signup successfully and store token', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        tier: 'free',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          token: 'new-token',
          user: mockUser,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signup('newuser@example.com', 'password123');

      expect(response.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('new-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('should handle signup failure with existing email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'User with this email already exists',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signup('existing@example.com', 'password123');

      expect(response.success).toBe(false);
      expect(response.error).toBe('User with this email already exists');
      expect(result.current.user).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe(null);
    });

    it('should handle network errors during signup', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.signup('test@example.com', 'password123');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Network error');
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        tier: 'free',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          token: 'login-token',
          user: mockUser,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.login('user@example.com', 'password123');

      expect(response.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('login-token');
    });

    it('should handle invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Invalid email or password',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.login('wrong@example.com', 'wrongpass');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid email or password');
      expect(result.current.user).toBe(null);
    });
  });

  describe('logout', () => {
    it('should logout and clear user state and token', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        tier: 'free',
      };

      // Setup: login first
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Mock logout endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      });

      // Logout
      await result.current.logout();

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe(null);
    });

    it('should clear state even if logout endpoint fails', async () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'token');

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.logout();

      expect(result.current.user).toBe(null);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe(null);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.forgotPassword('user@example.com');

      expect(response.success).toBe(true);
      expect(response.message).toContain('password reset link has been sent');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
    });

    it('should handle forgot password errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const response = await result.current.forgotPassword('user@example.com');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Server error');
    });
  });

  describe('getToken', () => {
    it('should return stored token', async () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getToken()).toBe('stored-token');
    });

    it('should return null when no token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getToken()).toBe(null);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an error
      await result.current.login('wrong@example.com', 'wrongpass');

      expect(result.current.error).toBe('Invalid credentials');

      // Clear error
      result.current.clearError();

      expect(result.current.error).toBe(null);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
