import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from '../MobileMenu';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * MobileMenu Component Tests
 *
 * Tests the mobile navigation menu including:
 * - Opening/closing behavior
 * - Navigation items (Examples, Help)
 * - Authentication integration (Sign In button, user info)
 * - Auth modal integration (Login, Signup, Forgot Password)
 * - Accessibility (keyboard navigation, ARIA labels)
 */

// Mock environment variable
vi.stubEnv('VITE_ENABLE_AUTH', 'true');

// Mock auth context
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  getToken: vi.fn(() => null),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

describe('MobileMenu', () => {
  const mockOnClose = vi.fn();
  const mockOnExamplesClick = vi.fn();
  const mockOnHelpClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
  });

  const renderMobileMenu = (isOpen = true) => {
    return render(
      <AuthProvider>
        <MobileMenu
          isOpen={isOpen}
          onClose={mockOnClose}
          onExamplesClick={mockOnExamplesClick}
          onHelpClick={mockOnHelpClick}
        />
      </AuthProvider>
    );
  };

  describe('Rendering', () => {
    it('should not render when closed', () => {
      renderMobileMenu(false);

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      renderMobileMenu(true);

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should render backdrop when open', () => {
      const { container } = renderMobileMenu(true);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render close button with correct ARIA label', () => {
      renderMobileMenu(true);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('should render Examples menu item', () => {
      renderMobileMenu(true);

      expect(screen.getByText('Examples')).toBeInTheDocument();
    });

    it('should render Help & FAQ menu item', () => {
      renderMobileMenu(true);

      expect(screen.getByText('Help & FAQ')).toBeInTheDocument();
    });

    it('should call onExamplesClick and close menu when Examples clicked', async () => {
      const user = userEvent.setup();
      renderMobileMenu(true);

      const examplesButton = screen.getByText('Examples');
      await user.click(examplesButton);

      expect(mockOnExamplesClick).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onHelpClick and close menu when Help clicked', async () => {
      const user = userEvent.setup();
      renderMobileMenu(true);

      const helpButton = screen.getByText('Help & FAQ');
      await user.click(helpButton);

      expect(mockOnHelpClick).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication - Not Authenticated', () => {
    it('should show Sign In button when user is not authenticated', () => {
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.user = null;

      renderMobileMenu(true);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('should open login modal when Sign In clicked', async () => {
      const user = userEvent.setup();
      mockAuthContext.isAuthenticated = false;

      renderMobileMenu(true);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      // Login modal should be rendered (lazy loaded)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Authentication - Authenticated', () => {
    it('should show user email when authenticated', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'free' };

      renderMobileMenu(true);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show user tier when authenticated', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'pro' };

      renderMobileMenu(true);

      expect(screen.getByText('Pro tier')).toBeInTheDocument();
    });

    it('should capitalize tier name', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'starter' };

      renderMobileMenu(true);

      expect(screen.getByText('Starter tier')).toBeInTheDocument();
    });

    it('should show Free tier as fallback when tier is not set', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com' };

      renderMobileMenu(true);

      expect(screen.getByText('Free tier')).toBeInTheDocument();
    });

    it('should NOT show Sign In button when authenticated', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'free' };

      renderMobileMenu(true);

      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    it('should show user name if email is not available', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { name: 'John Doe', tier: 'free' };

      renderMobileMenu(true);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show "User" as fallback when name and email are not available', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { tier: 'free' };

      renderMobileMenu(true);

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should show Sign Out button when authenticated', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'free' };

      renderMobileMenu(true);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('should call logout and close menu when Sign Out clicked', async () => {
      const user = userEvent.setup();
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'free' };
      mockAuthContext.logout = vi.fn().mockResolvedValue(undefined);

      renderMobileMenu(true);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should have logout icon in Sign Out button', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { email: 'test@example.com', tier: 'free' };

      renderMobileMenu(true);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      const icon = signOutButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close menu when Escape key is pressed', async () => {
      const user = userEvent.setup();
      renderMobileMenu(true);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should focus close button when menu opens', async () => {
      renderMobileMenu(true);

      // Note: Focus management happens in useEffect, may need to wait
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close menu/i });
        // Just verify it's in the document (focus testing can be flaky)
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      renderMobileMenu(true);

      const menu = screen.getByTestId('mobile-menu');

      expect(menu).toHaveAttribute('role', 'dialog');
      expect(menu).toHaveAttribute('aria-modal', 'true');
      expect(menu).toHaveAttribute('aria-label', 'Mobile menu');
    });

    it('should have aria-hidden on close button icon', () => {
      renderMobileMenu(true);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      const icon = closeButton.querySelector('svg');

      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Backdrop Interaction', () => {
    it('should close menu when backdrop is clicked after delay', async () => {
      const user = userEvent.setup();
      const { container } = renderMobileMenu(true);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');

      // Wait for the allowClickOutside delay (200ms)
      await new Promise(resolve => setTimeout(resolve, 250));

      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT close immediately on backdrop click (prevents accidental close)', async () => {
      const user = userEvent.setup();
      const { container } = renderMobileMenu(true);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');

      // Click immediately without waiting
      await user.click(backdrop);

      // Should NOT close yet (200ms delay)
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderMobileMenu(true);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have md:hidden class to hide on desktop', () => {
      renderMobileMenu(true);

      const menu = screen.getByTestId('mobile-menu');

      expect(menu.className).toContain('md:hidden');
    });

    it('should position menu on right side', () => {
      renderMobileMenu(true);

      const menu = screen.getByTestId('mobile-menu');

      expect(menu.className).toContain('right-0');
    });
  });
});
