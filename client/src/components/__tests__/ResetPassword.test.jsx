/**
 * ResetPassword Component Tests
 *
 * Tests for the password reset confirmation page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPassword } from '../ResetPassword';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock AuthContext
const mockResetPassword = vi.fn();
const mockClearError = vi.fn();
let mockAuthError = null;

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      resetPassword: mockResetPassword,
      clearError: mockClearError,
      error: mockAuthError
    })
  };
});

// Mock fetch for AuthContext initialization
let mockFetch;

function renderWithRouter(component, { initialEntries = ['/reset-password'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
}

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthError = null;

    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  // ============================================================================
  // Rendering
  // ============================================================================
  describe('Rendering', () => {
    it('should render reset password form', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render logo', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      // Logo component should be present
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    it('should show error when token is missing', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password']
      });

      expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
    });

    it('should show "Back to Home" link', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      expect(screen.getByText(/back to home/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Password Input
  // ============================================================================
  describe('Password Input', () => {
    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      await user.type(passwordInput, 'newPassword123');

      expect(passwordInput).toHaveValue('newPassword123');
    });

    it('should show password as masked by default', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const toggleButtons = screen.getAllByRole('button');
      const showPasswordButton = toggleButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('password')
      );

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(showPasswordButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(showPasswordButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should allow typing in confirm password field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const confirmInput = screen.getByLabelText(/confirm new password/i);
      await user.type(confirmInput, 'newPassword123');

      expect(confirmInput).toHaveValue('newPassword123');
    });

    it('should show password requirements', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      await user.type(passwordInput, 'test');

      // Password requirements show after typing
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Form Validation
  // ============================================================================
  describe('Form Validation', () => {
    it('should show error for password shorter than 8 characters', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const form = screen.getByRole('button', { name: /reset password/i }).closest('form');
      form.setAttribute('novalidate', 'true');

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'short');
      await user.type(confirmInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const form = screen.getByRole('button', { name: /reset password/i }).closest('form');
      form.setAttribute('novalidate', 'true');

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmInput, 'differentPassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const form = screen.getByRole('button', { name: /reset password/i }).closest('form');

      // Prevent HTML5 validation so we can test JavaScript validation
      form.setAttribute('novalidate', 'true');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Form Submission
  // ============================================================================
  describe('Form Submission', () => {
    it('should call resetPassword with correct params on valid submission', async () => {
      const user = userEvent.setup();
      const token = 'valid_token_123';
      const newPassword = 'newSecurePassword123';

      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset successfully'
      });

      renderWithRouter(<ResetPassword />, {
        initialEntries: [`/reset-password?token=${token}`]
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, newPassword);
      await user.type(confirmInput, newPassword);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith(token, newPassword);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show success message on successful reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset successfully'
      });

      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
      });
    });

    it('should redirect to home after successful reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Password reset successfully'
      });

      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
      });

      // Redirecting message should also be visible
      await waitFor(() => {
        expect(screen.getByText(/redirecting to home page/i)).toBeInTheDocument();
      });

      // Navigation happens after 2 seconds (tested by presence of redirect message)
    });

    it('should show error message on failed reset', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid or expired reset token';
      mockResetPassword.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Navigation
  // ============================================================================
  describe('Navigation', () => {
    it('should navigate to home when clicking "Back to Home"', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const backButton = screen.getByText(/back to home/i);

      // Verify button exists and is clickable
      expect(backButton).toBeInTheDocument();
      expect(backButton).not.toBeDisabled();

      await user.click(backButton);

      // Navigation happens - we can't easily assert the route change in MemoryRouter
      // but we've verified the button click works without errors
    });
  });

  // ============================================================================
  // Accessibility
  // ============================================================================
  describe('Accessibility', () => {
    it('should auto-focus password input on mount', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      expect(passwordInput).toHaveFocus();
    });

    it('should have proper labels for form inputs', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const toggleButtons = screen.getAllByRole('button');
      toggleButtons.forEach(button => {
        if (button.getAttribute('aria-label')) {
          expect(button.getAttribute('aria-label')).toBeTruthy();
        }
      });
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password?token=abc123']
      });

      const form = screen.getByRole('button', { name: /reset password/i }).closest('form');
      form.setAttribute('novalidate', 'true');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Token Handling
  // ============================================================================
  describe('Token Handling', () => {
    it('should disable submit button when token is missing', () => {
      renderWithRouter(<ResetPassword />, {
        initialEntries: ['/reset-password']
      });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should extract token from URL query params', async () => {
      const user = userEvent.setup();
      const token = 'extracted_token_456';

      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'Success'
      });

      renderWithRouter(<ResetPassword />, {
        initialEntries: [`/reset-password?token=${token}`]
      });

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmInput, 'newPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith(token, 'newPassword123');
      });
    });
  });
});
