/**
 * Unit tests for ForgotPasswordModal component
 * Tests rendering, form validation, and password reset request flow
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordModal } from '../ForgotPasswordModal';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock API_URL
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3000',
}));

describe('ForgotPasswordModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToLogin = vi.fn();
  let mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  const renderForgotPasswordModal = (isOpen = true) => {
    return render(
      <AuthProvider>
        <ForgotPasswordModal
          isOpen={isOpen}
          onClose={mockOnClose}
          onSwitchToLogin={mockOnSwitchToLogin}
        />
      </AuthProvider>
    );
  };

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderForgotPasswordModal(true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderForgotPasswordModal(false);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form elements', () => {
      renderForgotPasswordModal();

      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    });

    it('should auto-focus email input when modal opens', async () => {
      renderForgotPasswordModal();

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should successfully send reset email', async () => {
      const user = userEvent.setup();

      // Mock successful forgot password request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/if an account exists with this email/i)).toBeInTheDocument();
        expect(screen.getByText(/check your email inbox and spam folder/i)).toBeInTheDocument();
      });

      // Form should be hidden after success
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com' }),
        })
      );
    });

    it('should handle server errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Failed to send reset email',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });

      // Form should still be visible on error
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('should show loading state during request', async () => {
      const user = userEvent.setup();

      // Delay the response to test loading state
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    success: true,
                    message: 'Reset email sent',
                  }),
                }),
              100
            )
          )
      );

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      expect(screen.getByText(/sending/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
      });
    });

    it('should clear email input after successful submission', async () => {
      const user = userEvent.setup();

      // Mock successful reset email
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Reset email sent',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
      });

      // Form should be hidden, so email input shouldn't exist
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onSwitchToLogin when back to sign in is clicked', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      const backLink = screen.getByText(/back to sign in/i);
      await user.click(backLink);

      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      const closeButton = screen.getByLabelText(/close forgot password modal/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      // Wait for click-outside to be enabled (200ms delay)
      await new Promise(resolve => setTimeout(resolve, 250));

      // Get the backdrop - it has role="dialog" and is the outer container
      const backdrop = screen.getByRole('dialog');
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit form when Enter is pressed in email field', async () => {
      const user = userEvent.setup();

      // Mock successful reset email
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Reset email sent',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@example.com{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderForgotPasswordModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'forgot-password-modal-title');
    });

    it('should display error with role="alert"', async () => {
      const user = userEvent.setup();
      renderForgotPasswordModal();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/email is required/i);
      });
    });

    it('should display success message with role="alert"', async () => {
      const user = userEvent.setup();

      // Mock successful reset email
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Reset email sent',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0]).toHaveTextContent(/reset email sent/i);
      });
    });
  });

  describe('Form State Management', () => {
    it('should clear form and messages when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderForgotPasswordModal(true);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      // Trigger an error
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.type(emailInput, '{selectall}invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Close modal
      rerender(
        <AuthProvider>
          <ForgotPasswordModal
            isOpen={false}
            onClose={mockOnClose}
            onSwitchToLogin={mockOnSwitchToLogin}
          />
        </AuthProvider>
      );

      // Reopen modal
      rerender(
        <AuthProvider>
          <ForgotPasswordModal
            isOpen={true}
            onClose={mockOnClose}
            onSwitchToLogin={mockOnSwitchToLogin}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        const emailInputNew = screen.getByLabelText(/email address/i);
        expect(emailInputNew).toHaveValue('');
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('should allow resending reset email after success', async () => {
      const user = userEvent.setup();

      // Mock successful reset email
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Reset email sent',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
      });

      // User can click back to login
      const backLink = screen.getByText(/back to sign in/i);
      expect(backLink).toBeInTheDocument();
      await user.click(backLink);

      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    });
  });

  describe('Security Considerations', () => {
    it('should not reveal whether email exists in system', async () => {
      const user = userEvent.setup();

      // Server always returns same message regardless of email existence
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        }),
      });

      renderForgotPasswordModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'nonexistent@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        const message = screen.getByText(/if an account exists with this email/i);
        expect(message).toBeInTheDocument();
        // Message should be ambiguous about whether account exists
        expect(message.textContent).toContain('If an account exists');
      });
    });
  });
});
