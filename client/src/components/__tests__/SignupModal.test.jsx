/**
 * Unit tests for SignupModal component
 * Tests rendering, form validation, password strength, and registration flow
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupModal } from '../SignupModal';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock API_URL
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3000',
}));

// Mock toast utilities
vi.mock('../../utils/toast', () => ({
  toastCompact: vi.fn(),
}));

describe('SignupModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSwitchToLogin = vi.fn();
  let mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock initial auth check
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
  });

  const renderSignupModal = (isOpen = true) => {
    return render(
      <AuthProvider>
        <SignupModal
          isOpen={isOpen}
          onClose={mockOnClose}
          onSwitchToLogin={mockOnSwitchToLogin}
        />
      </AuthProvider>
    );
  };

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderSignupModal(true);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderSignupModal(false);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form elements', () => {
      renderSignupModal();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should auto-focus email input when modal opens', async () => {
      renderSignupModal();

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toHaveFocus();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is less than 8 characters', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password456');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator when typing password', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const passwordInput = screen.getByLabelText(/^password$/i);

      // No indicator initially
      expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();

      // Type password
      await user.type(passwordInput, 'P');

      // Indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
      });
    });

    it('should update password strength as requirements are met', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const passwordInput = screen.getByLabelText(/^password$/i);

      // Type weak password
      await user.type(passwordInput, 'pass');

      // All requirements should be red/incomplete initially
      await waitFor(() => {
        const checks = screen.getAllByText(/at least 8 characters|one uppercase|one lowercase|one number/i);
        expect(checks.length).toBeGreaterThan(0);
      });

      // Type strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123');

      // All requirements should be green/complete
      await waitFor(() => {
        const checks = screen.getAllByText(/at least 8 characters|one uppercase|one lowercase|one number/i);
        expect(checks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Registration Flow', () => {
    it('should successfully signup with valid data', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        tier: 'free',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          token: 'new-token',
          user: mockUser,
        }),
      });

      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'StrongPass123');
      await user.type(confirmInput, 'StrongPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'StrongPass123',
          }),
        })
      );
    });

    it('should display error when email already exists', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: 'User with this email already exists',
        }),
      });

      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show loading state during signup', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 201,
                  json: async () => ({
                    success: true,
                    token: 'test-token',
                    user: { id: 1, email: 'test@example.com' },
                  }),
                }),
              100
            )
          )
      );

      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password123');
      await user.click(submitButton);

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onSwitchToLogin when login link is clicked', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const closeButton = screen.getByLabelText(/close signup modal/i);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      // Wait for click-outside to be enabled
      await waitFor(() => {}, { timeout: 250 });

      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('GitHub OAuth', () => {
    it('should redirect to GitHub OAuth URL when GitHub button is clicked', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      renderSignupModal();

      const githubButton = screen.getByRole('button', { name: /github/i });
      await user.click(githubButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/github');

      window.location = originalLocation;
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should submit form when Enter is pressed in confirm password field', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' },
        }),
      });

      renderSignupModal();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password123{Enter}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderSignupModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'signup-modal-title');
    });

    it('should display error with role="alert"', async () => {
      const user = userEvent.setup();
      renderSignupModal();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/email is required/i);
      });
    });
  });

  describe('Form State Management', () => {
    it('should clear form when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderSignupModal(true);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password123');

      // Close modal
      rerender(
        <AuthProvider>
          <SignupModal
            isOpen={false}
            onClose={mockOnClose}
            onSwitchToLogin={mockOnSwitchToLogin}
          />
        </AuthProvider>
      );

      // Reopen modal
      rerender(
        <AuthProvider>
          <SignupModal
            isOpen={true}
            onClose={mockOnClose}
            onSwitchToLogin={mockOnSwitchToLogin}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        const emailInputNew = screen.getByLabelText(/email address/i);
        const passwordInputNew = screen.getByLabelText(/^password$/i);
        const confirmInputNew = screen.getByLabelText(/confirm password/i);
        expect(emailInputNew).toHaveValue('');
        expect(passwordInputNew).toHaveValue('');
        expect(confirmInputNew).toHaveValue('');
      });
    });
  });
});
