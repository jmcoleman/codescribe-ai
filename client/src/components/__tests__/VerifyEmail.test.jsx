/**
 * Tests for VerifyEmail component
 * Tests email verification page with token validation
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, useSearchParams, useNavigate } from 'react-router-dom';
import VerifyEmail from '../VerifyEmail';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

describe('VerifyEmail', () => {
  let mockNavigate;
  let mockSearchParams;

  beforeEach(() => {
    mockNavigate = vi.fn();
    mockSearchParams = new URLSearchParams();
    useNavigate.mockReturnValue(mockNavigate);
    useSearchParams.mockReturnValue([mockSearchParams]);
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Mock initial auth check to return not authenticated
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
  });

  const renderComponent = () => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <VerifyEmail />
        </BrowserRouter>
      </AuthProvider>
    );
  };

  describe('Successful Verification', () => {
    it('should verify email with valid token', async () => {
      mockSearchParams.set('token', 'valid-token-123');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Email verified successfully',
          user: {
            id: 1,
            email: 'test@example.com',
            email_verified: true,
          },
        }),
      });

      renderComponent();

      // Should show loading state initially
      expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText(/your email has been verified successfully/i)).toBeInTheDocument();
      });

      // Should show success icon
      const successIcon = screen.getByLabelText(/success/i);
      expect(successIcon).toBeInTheDocument();

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/verify-email'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token-123' }),
        })
      );

      // Should redirect after 3 seconds
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/');
        },
        { timeout: 3500 }
      );
    });

    it('should display success checkmark icon', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Email verified successfully' }),
      });

      renderComponent();

      await waitFor(() => {
        const successIcon = screen.getByLabelText(/success/i);
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('should redirect to homepage after success', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/');
        },
        { timeout: 3500 }
      );
    });
  });

  describe('Error States', () => {
    it('should show error for missing token', async () => {
      // No token in URL
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
      });

      // Should show error icon
      const errorIcon = screen.getByLabelText(/error/i);
      expect(errorIcon).toBeInTheDocument();

      // Should not call API
      expect(global.fetch).not.toHaveBeenCalled();

      // Should not redirect
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show error for invalid token', async () => {
      mockSearchParams.set('token', 'invalid-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid or expired verification token',
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired verification token/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show error for expired token', async () => {
      mockSearchParams.set('token', 'expired-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid or expired verification token',
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired verification token/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors (500)', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error',
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });

    it('should display error icon for failed verification', async () => {
      mockSearchParams.set('token', 'invalid-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid token' }),
      });

      renderComponent();

      await waitFor(() => {
        const errorIcon = screen.getByLabelText(/error/i);
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while verifying', () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              });
            }, 100);
          })
      );

      renderComponent();

      // Should show loading state
      expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner has status role
    });

    it('should show animated spinner', () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      renderComponent();

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('UI and Accessibility', () => {
    it('should have accessible heading', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper ARIA labels for icons', async () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        const successIcon = screen.getByLabelText(/success/i);
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('should use semantic HTML structure', () => {
      mockSearchParams.set('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { container } = renderComponent();

      // Should have proper container structure
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    it('should display helpful message for each state', async () => {
      // Loading state
      mockSearchParams.set('token', 'token1');
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));

      const { unmount } = renderComponent();
      expect(screen.getByText(/verifying/i)).toBeInTheDocument();
      unmount();

      // Success state
      mockSearchParams.set('token', 'token2');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { unmount: unmount2 } = renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/verified successfully/i)).toBeInTheDocument();
      });
      unmount2();

      // Error state
      mockSearchParams.set('token', 'token3');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid token' }),
      });

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should use correct API endpoint', async () => {
      mockSearchParams.set('token', 'test-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/verify-email'),
          expect.any(Object)
        );
      });
    });

    it('should send POST request with correct body', async () => {
      mockSearchParams.set('token', 'my-token-123');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token: 'my-token-123' }),
          })
        );
      });
    });

    it('should include Content-Type header', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should handle malformed JSON responses', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token parameter', async () => {
      mockSearchParams.set('token', '');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000);
      mockSearchParams.set('token', longToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ token: longToken }),
          })
        );
      });
    });

    it('should handle tokens with special characters', async () => {
      const specialToken = 'token-with-special_chars.123';
      mockSearchParams.set('token', specialToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ token: specialToken }),
          })
        );
      });
    });

    it('should only call API once on mount', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle component unmount during verification', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 1000);
          })
      );

      const { unmount } = renderComponent();

      // Unmount before API call completes
      unmount();

      // Should not throw error
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should display fallback error message when error message is missing', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }), // No error message
      });

      renderComponent();

      await waitFor(() => {
        // Should show title
        expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
        // Should show fallback message
        expect(screen.getByText(/the link may have expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect after success', async () => {
      mockSearchParams.set('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderComponent();

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/');
        },
        { timeout: 3500 }
      );
    });

    it('should not redirect on error', async () => {
      mockSearchParams.set('token', 'invalid');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid token' }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
      });

      // Wait a bit to ensure no redirect happens
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
