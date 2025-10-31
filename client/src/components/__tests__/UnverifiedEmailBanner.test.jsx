/**
 * Tests for UnverifiedEmailBanner component
 * Tests banner display, dismiss, and resend functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UnverifiedEmailBanner from '../UnverifiedEmailBanner';
import { toastSuccess, toastError } from '../../utils/toast';

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

  describe('Visibility Conditions', () => {
    it('should render for unverified user', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });

    it('should not render for verified user', () => {
      const { container } = render(<UnverifiedEmailBanner user={verifiedUser} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when user is null', () => {
      const { container } = render(<UnverifiedEmailBanner user={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when user is undefined', () => {
      const { container } = render(<UnverifiedEmailBanner user={undefined} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render after dismissal', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

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
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      expect(screen.getByText(/check your inbox and click the verification link/i)).toBeInTheDocument();
    });

    it('should display resend button', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      expect(resendButton).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have brand gradient styling (indigo to purple)', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-gradient-to-r', 'from-indigo-50', 'to-purple-50');
    });
  });

  describe('Resend Email Functionality', () => {
    it('should resend verification email successfully', async () => {
      localStorage.setItem('token', 'valid-jwt-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Verification email sent',
        }),
      });

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
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
        expect(resendButton).toHaveTextContent(/resend email/i);
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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      // Should not show success toast
      await waitFor(() => {
        expect(toastSuccess).not.toHaveBeenCalled();
      });

      // Button should return to normal state
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend email/i);
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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/sending/i);
        expect(resendButton).toBeDisabled();
      });
    });

    it('should disable button during resend', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toBeDisabled();
      });
    });

    it('should handle network errors', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      // Should not crash and button should return to normal
      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend email/i);
        expect(resendButton).not.toBeDisabled();
      });
    });

    it('should use token from localStorage', async () => {
      const testToken = 'my-test-jwt-token';
      localStorage.setItem('token', testToken);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });

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
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

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
      render(<UnverifiedEmailBanner user={unverifiedUser} onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should work without onDismiss callback', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      fireEvent.click(dismissButton);

      // Should still hide banner
      expect(container.firstChild).toBeNull();
    });

    it('should have accessible dismiss button', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for banner', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      const dismissButton = screen.getByLabelText(/dismiss/i);

      expect(resendButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have keyboard accessible buttons', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      const dismissButton = screen.getByLabelText(/dismiss/i);

      expect(resendButton).not.toHaveAttribute('tabindex', '-1');
      expect(dismissButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should indicate loading state to screen readers', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockImplementationOnce(() => new Promise(() => {}));

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toHaveAttribute('disabled');
      });
    });
  });

  describe('UI and Styling', () => {
    it('should have brand gradient color scheme', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-gradient-to-r', 'from-indigo-50', 'to-purple-50');
    });

    it('should display mail icon', () => {
      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const icon = screen.getByLabelText(/email verification/i);
      expect(icon).toBeInTheDocument();
    });

    it('should have proper spacing and layout', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('border-b');
    });

    it('should be responsive', () => {
      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const banner = container.firstChild;
      // Should have max-width container for responsive layout
      const innerContainer = banner.querySelector('.max-w-7xl');
      expect(innerContainer).toBeInTheDocument();
      // Should have responsive padding
      expect(innerContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with null email', () => {
      const userWithNullEmail = { ...unverifiedUser, email: null };
      const { container } = render(<UnverifiedEmailBanner user={userWithNullEmail} />);

      // Should still render if email_verified is false
      expect(container.firstChild).not.toBeNull();
    });

    it('should handle user with missing name fields', () => {
      const userWithoutName = {
        id: 1,
        email: 'test@example.com',
        email_verified: false,
      };

      const { container } = render(<UnverifiedEmailBanner user={userWithoutName} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('should handle rapid dismiss clicks', () => {
      const onDismiss = vi.fn();
      const { container } = render(
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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
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

      const { unmount } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
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

      const { container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Step 1: Banner is visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // Step 2: Resend email
      const resendButton = screen.getByRole('button', { name: /resend email/i });
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
      const { rerender, container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // User verifies email (external action)
      rerender(<UnverifiedEmailBanner user={verifiedUser} />);

      // Banner should disappear
      expect(container.firstChild).toBeNull();
    });

    it('should handle user logging out', () => {
      const { rerender, container } = render(<UnverifiedEmailBanner user={unverifiedUser} />);

      // Initially visible
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // User logs out
      rerender(<UnverifiedEmailBanner user={null} />);

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

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(toastSuccess).toHaveBeenCalledWith(
          expect.stringMatching(/verification email sent/i)
        );
      });
    });

    it('should not show toast on failure', async () => {
      localStorage.setItem('token', 'token');

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      render(<UnverifiedEmailBanner user={unverifiedUser} />);

      const resendButton = screen.getByRole('button', { name: /resend email/i });
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend email/i);
      });

      expect(toastSuccess).not.toHaveBeenCalled();
    });
  });
});
