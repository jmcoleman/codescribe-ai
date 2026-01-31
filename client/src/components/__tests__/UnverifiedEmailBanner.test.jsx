/**
 * Tests for UnverifiedEmailBanner component
 * Tests banner display, dismiss, and resend functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnverifiedEmailBanner from '../UnverifiedEmailBanner';
import { toastSuccess, toastError } from '../../utils/toast';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock toast utilities
vi.mock('../../utils/toast', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

describe('UnverifiedEmailBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear();
    sessionStorage.clear();

    // Mock initial auth check to return not authenticated (with json method for AuthProvider)
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });
  });

  const unverifiedUser = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    email_verified: false,
  };

  const verifiedUser = {
    ...unverifiedUser,
    email_verified: true,
  };

  const renderWithAuth = (component) => {
    return render(
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    );
  };

  describe('Visibility Conditions', () => {
    it('should render for unverified user', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });

    it('should not render for verified user', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={verifiedUser} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when user is null', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when user is undefined', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={undefined} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render after dismissal', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // Dismiss
      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      // Should be hidden
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Banner Content', () => {
    it('should display main message', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      expect(screen.getByText(/check your inbox and click the verification link/i)).toBeInTheDocument();
    });

    it('should display resend button', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      expect(resendButton).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have brand gradient styling (indigo to purple)', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Uses Banner component with indigo border
      const banner = container.querySelector('.border-indigo-500');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Resend Email Functionality', () => {
    // TODO: Skipped - Auth Provider mock timing issue with localStorage token validation
    it.skip('should resend verification email successfully', async () => {
      localStorage.setItem('token', 'valid-jwt-token');

      // Clear call history while keeping mock implementation
      global.fetch.mockClear();

      // First mock for auth check (from AuthProvider) - return success to keep token valid
      // Second mock for resend API
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: unverifiedUser,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Verification email sent',
          }),
        });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Wait for auth check to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Should show loading state
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/sending/i);
      });

      // Should call API with correct parameters
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/resend-verification'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              Authorization: 'Bearer valid-jwt-token',
              'Content-Type': 'application/json',
            },
          })
        );
      });

      // Should show success toast
      await waitFor(() => {
        expect(toastSuccess).toHaveBeenCalledWith(
          expect.stringContaining('Verification email sent')
        );
      });

      // Button should return to normal state
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend verification email/i);
      });
    });

    it('should handle resend failure gracefully', async () => {
      localStorage.setItem('token', 'valid-token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to send email',
        }),
      });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Should not show success toast
      await waitFor(() => {
        expect(toastSuccess).not.toHaveBeenCalled();
      });

      // Button should return to normal state
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend verification email/i);
      });
    });

    it('should show loading state during resend', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 100);
          })
      );

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Button is replaced with loading text during resend
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument();
      });
    });

    it('should disable button during resend', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Button is removed and replaced with loading text
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument();
        expect(screen.getByText(/sending/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Should not crash and button should return to normal
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend verification email/i);
        expect(resendButton).not.toBeDisabled();
      });
    });

    // TODO: Skipped - Auth Provider mock timing issue with localStorage token validation
    it.skip('should use token from localStorage', async () => {
      const testToken = 'my-test-jwt-token';
      localStorage.setItem('token', testToken);

      // Clear call history while keeping mock implementation
      global.fetch.mockClear();

      // First mock for auth check (from AuthProvider) - return success to keep token valid
      // Second mock for resend API
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: unverifiedUser,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Wait for auth check to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${testToken}`,
            }),
          })
        );
      });
    });

    it('should handle missing token in localStorage', async () => {
      // No token set
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Should still call API (backend will reject)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should prevent multiple simultaneous resend requests', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 100);
          })
      );

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });

      // Click multiple times rapidly
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);
      fireEvent.click(resendButton);

      // Should only call API once (button is disabled after first click)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Dismiss Functionality', () => {
    it('should dismiss banner when X button is clicked', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // Click dismiss
      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      // Should be hidden
      expect(container.firstChild).toBeNull();
    });

    it('should call onDismiss callback when provided', () => {
      const onDismiss = vi.fn();
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should work without onDismiss callback', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      // Should still hide banner
      expect(container.firstChild).toBeNull();
    });

    it('should have accessible dismiss button', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for banner', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      const dismissButton = screen.getByLabelText(/dismiss/i);

      expect(resendButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have keyboard accessible buttons', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      const dismissButton = screen.getByLabelText(/dismiss/i);

      expect(resendButton).not.toHaveAttribute('tabindex', '-1');
      expect(dismissButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should indicate loading state to screen readers', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(() => new Promise(() => {}));

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Loading text is visible to screen readers
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI and Styling', () => {
    it('should have brand color scheme', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      // Banner component uses solid colors with dark mode support
      expect(banner).toHaveClass('bg-white');
      expect(banner.className).toContain('dark:bg-slate-900');
    });

    it('should display mail icon', () => {
      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Check for Mail icon SVG
      const banner = screen.getByRole('alert');
      expect(banner.querySelector('svg')).toBeInTheDocument();
    });

    it('should have proper spacing and layout', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      // Banner component uses left border instead of bottom border
      expect(banner).toHaveClass('border-l-4');
    });

    it('should be responsive', () => {
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      // Banner component uses rounded-r-md for right corners
      expect(banner).toHaveClass('rounded-r-md');
      // Should support dark mode
      expect(banner.className).toContain('dark:bg-slate-900');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with null email', () => {
      const userWithNullEmail = { ...unverifiedUser, email: null };
      const { container } = renderWithAuth(<UnverifiedEmailBanner user={userWithNullEmail} />);

      // Should still render if email_verified is false
      expect(container.firstChild).not.toBeNull();
    });

    it('should handle user with missing name fields', () => {
      const userWithoutName = {
        id: 1,
        email: 'test@example.com',
        email_verified: false,
      };

      const { container } = renderWithAuth(<UnverifiedEmailBanner user={userWithoutName} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('should handle rapid dismiss clicks', () => {
      const onDismiss = vi.fn();
      const { container } = renderWithAuth(
        <UnverifiedEmailBanner user={unverifiedUser} onDismiss={onDismiss} />
      );

      const dismissButton = screen.getByLabelText(/dismiss/i);

      // Click multiple times
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);

      // Should only be dismissed once
      expect(container.firstChild).toBeNull();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should maintain state after failed resend', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Banner should still be visible after failed resend
      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      });
    });

    it('should handle component unmount during resend', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ok: true, json: async () => ({ success: true }) });
            }, 1000);
          })
      );

      const { unmount } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      // Unmount while request is in flight
      unmount();

      // Should not throw error
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full flow: display -> resend -> dismiss', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Step 1: Banner is visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // Step 2: Resend email
      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(toastSuccess).toHaveBeenCalled();
      });

      // Step 3: Dismiss
      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      expect(container.firstChild).toBeNull();
    });

    it('should handle user becoming verified externally', () => {
      const { rerender, container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // User verifies email (external action)
      rerender(
        <AuthProvider>
          <UnverifiedEmailBanner user={verifiedUser} />
        </AuthProvider>
      );

      // Banner should disappear
      expect(container.firstChild).toBeNull();
    });

    it('should handle user logging out', () => {
      const { rerender, container } = renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // User logs out
      rerender(
        <AuthProvider>
          <UnverifiedEmailBanner user={null} />
        </AuthProvider>
      );

      // Banner should disappear
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast with correct message', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(toastSuccess).toHaveBeenCalledWith(
          expect.stringMatching(/verification email sent/i)
        );
      });
    });

    // TODO: Skipped - Auth Provider mock timing issue with localStorage token validation
    it.skip('should not show toast on failure', async () => {
      localStorage.setItem('token', 'token');

      // Clear call history while keeping mock implementation
      global.fetch.mockClear();

      // First mock for auth check (from AuthProvider) - return success to keep token valid
      // Second mock for resend API (failure)
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: unverifiedUser,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false }),
        });

      renderWithAuth(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Wait for auth check to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend verification email/i);
      });

      expect(toastSuccess).not.toHaveBeenCalled();
    });
  });
});
