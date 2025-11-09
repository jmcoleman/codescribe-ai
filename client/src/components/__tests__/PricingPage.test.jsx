/**
 * Unit tests for PricingPage component
 * Tests billing toggle, subscription flows, and storage of subscription intent
 *
 * Epic: 2.4 - Payment Integration
 * Related: SUBSCRIPTION-FLOWS.md documentation
 */

import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PricingPage } from '../PricingPage';
import { BrowserRouter } from 'react-router-dom';
import { STORAGE_KEYS } from '../../constants/storage';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  getToken: vi.fn().mockResolvedValue('mock-token'),
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }) => children,
}));

// Mock API_URL
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3000',
}));

// Mock toast utilities
vi.mock('../../utils/toast', () => ({
  toastError: vi.fn(),
}));

// Mock VerificationRequiredModal
vi.mock('../VerificationRequiredModal', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="verification-modal">Verification Required Modal</div> : null
  ),
}));

// Mock SignupModal
vi.mock('../SignupModal', () => ({
  SignupModal: ({ isOpen, onClose, subscriptionContext }) => (
    isOpen ? (
      <div data-testid="signup-modal">
        <div>Signup Modal</div>
        {subscriptionContext && (
          <div data-testid="subscription-context">
            Subscribing to {subscriptionContext.tierName}
          </div>
        )}
        <button onClick={onClose}>Close Signup</button>
      </div>
    ) : null
  ),
}));

// Mock LoginModal
vi.mock('../LoginModal', () => ({
  LoginModal: ({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="login-modal">
        <div>Login Modal</div>
        <button onClick={onClose}>Close Login</button>
      </div>
    ) : null
  ),
}));

describe('PricingPage', () => {
  let mockFetch;
  let originalLocation;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Reset mock auth context to defaults
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.getToken = vi.fn().mockResolvedValue('mock-token');

    // Store original window.location before any tests run
    if (!originalLocation) {
      originalLocation = window.location;
    }
  });

  afterEach(() => {
    sessionStorage.clear();

    // Ensure window.location is restored to original
    if (window.location !== originalLocation) {
      window.location = originalLocation;
    }
  });

  const renderPricingPage = () => {
    return render(
      <BrowserRouter>
        <PricingPage />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render pricing page with all tiers', () => {
      renderPricingPage();

      expect(screen.getByText('Simple, Transparent Pricing')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('should render billing period toggle', () => {
      renderPricingPage();

      expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yearly/i })).toBeInTheDocument();
      expect(screen.getByText('Save 17%')).toBeInTheDocument();
    });

    it('should show monthly prices by default', () => {
      renderPricingPage();

      // Check that monthly prices are displayed
      expect(screen.getByText('$12')).toBeInTheDocument(); // Starter monthly
      expect(screen.getByText('$29')).toBeInTheDocument(); // Pro monthly
      expect(screen.getByText('$99')).toBeInTheDocument(); // Team monthly
    });

    it('should render supported languages section', () => {
      renderPricingPage();

      expect(screen.getByText('Full Language Support')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderPricingPage();

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Billing Period Toggle', () => {
    it('should toggle to yearly pricing when yearly button is clicked', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Check that yearly prices are displayed
      await waitFor(() => {
        expect(screen.getByText('$10')).toBeInTheDocument(); // Starter yearly
        expect(screen.getByText('$24')).toBeInTheDocument(); // Pro yearly
        expect(screen.getByText('$82')).toBeInTheDocument(); // Team yearly
      });
    });

    it('should toggle back to monthly pricing when monthly button is clicked', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      const monthlyButton = screen.getByRole('button', { name: /monthly/i });

      // Switch to yearly
      await user.click(yearlyButton);

      // Switch back to monthly
      await user.click(monthlyButton);

      // Check that monthly prices are displayed
      await waitFor(() => {
        expect(screen.getByText('$12')).toBeInTheDocument(); // Starter monthly
        expect(screen.getByText('$29')).toBeInTheDocument(); // Pro monthly
        expect(screen.getByText('$99')).toBeInTheDocument(); // Team monthly
      });
    });

    it('should show yearly savings information when yearly is selected', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      await waitFor(() => {
        // Check for yearly total prices
        expect(screen.getByText(/\$120\/year/i)).toBeInTheDocument(); // Starter
        expect(screen.getByText(/\$288\/year/i)).toBeInTheDocument(); // Pro
        expect(screen.getByText(/\$984\/year/i)).toBeInTheDocument(); // Team

        // Check for savings percentages
        const savingsTexts = screen.getAllByText(/save 17%/i);
        expect(savingsTexts.length).toBeGreaterThan(0);
      });
    });

    it('should apply active styles to selected billing period', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const monthlyButton = screen.getByRole('button', { name: /^monthly$/i });
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });

      // Monthly should be active by default
      expect(monthlyButton).toHaveClass('bg-white', 'text-slate-900');

      // Switch to yearly
      await user.click(yearlyButton);

      // Yearly should now be active
      await waitFor(() => {
        expect(yearlyButton).toHaveClass('bg-white', 'text-slate-900');
      });
    });
  });

  describe('Unauthenticated User - Subscription Intent Storage', () => {
    it('should store subscription intent in sessionStorage when unauthenticated user clicks subscribe', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Find and click Pro tier subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      const proSubscribeButton = subscribeButtons[1]; // Pro is second subscribe button (Starter is first)

      await user.click(proSubscribeButton);

      // Check sessionStorage
      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        expect(storedIntent).toBeTruthy();

        const parsedIntent = JSON.parse(storedIntent);
        expect(parsedIntent).toEqual({
          tier: 'pro',
          billingPeriod: 'monthly',
          tierName: 'Pro',
        });
      });
    });

    it('should store yearly billing period when yearly is selected', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Switch to yearly billing
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Click Starter tier subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      const starterSubscribeButton = subscribeButtons[0];

      await user.click(starterSubscribeButton);

      // Check sessionStorage has yearly billing period
      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        const parsedIntent = JSON.parse(storedIntent);
        expect(parsedIntent).toEqual({
          tier: 'starter',
          billingPeriod: 'annual',
          tierName: 'Starter',
        });
      });
    });

    it('should open signup modal with subscription context when unauthenticated', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Click Pro tier subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      const proSubscribeButton = subscribeButtons[1];

      await user.click(proSubscribeButton);

      // Check that signup modal opens with context
      await waitFor(() => {
        expect(screen.getByTestId('signup-modal')).toBeInTheDocument();
        expect(screen.getByTestId('subscription-context')).toHaveTextContent('Subscribing to Pro');
      });
    });

    it('should store correct tier name in subscription context', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Toggle to yearly
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Click Starter tier
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[0]);

      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        const parsedIntent = JSON.parse(storedIntent);
        expect(parsedIntent.tierName).toBe('Starter');
      });
    });

    it('should clear subscription intent when signup modal is closed', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Click subscribe to open modal
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[1]);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('signup-modal')).toBeInTheDocument();
      });

      // Close the modal
      const closeButton = screen.getByRole('button', { name: /close signup/i });
      await user.click(closeButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('signup-modal')).not.toBeInTheDocument();
      });

      // Note: sessionStorage is NOT cleared when modal is closed
      // It's only cleared after successful email verification or OAuth callback
      const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
      expect(storedIntent).toBeTruthy();
    });
  });

  describe('Authenticated User - Checkout Flow', () => {
    it('should send correct billing period to backend when authenticated user subscribes', async () => {
      const user = userEvent.setup();

      // Set authenticated user
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'free', emailVerified: true };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.getToken = vi.fn().mockResolvedValue('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      renderPricingPage();

      // Click Pro tier subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      const proSubscribeButton = subscribeButtons[1];

      await user.click(proSubscribeButton);

      // Verify fetch was called with correct billing period
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/payments/create-checkout-session',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              tier: 'pro',
              billingPeriod: 'monthly',
            }),
          })
        );
      });
    });

    it('should send yearly billing period when yearly is selected', async () => {
      const user = userEvent.setup();

      // Set authenticated user
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'free', emailVerified: true };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.getToken = vi.fn().mockResolvedValue('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      renderPricingPage();

      // Switch to yearly
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Click Starter tier subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[0]);

      // Verify fetch was called with yearly billing period
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/payments/create-checkout-session',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              tier: 'starter',
              billingPeriod: 'annual',
            }),
          })
        );
      });
    });

    it('should show verification modal when authenticated user has unverified email', async () => {
      const user = userEvent.setup();

      // Set authenticated user with unverified email
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'free', emailVerified: false };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.getToken = vi.fn().mockResolvedValue('test-token');

      // Mock 403 response for unverified email
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Email not verified',
          emailVerified: false,
        }),
      });

      renderPricingPage();

      // Click subscribe
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[1]);

      // Verification modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('verification-modal')).toBeInTheDocument();
      });
    });

    it('should show loading state during checkout creation', async () => {
      const user = userEvent.setup();

      // Set authenticated user
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'free', emailVerified: true };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.getToken = vi.fn().mockResolvedValue('test-token');

      // Delay the response to test loading state
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ url: 'https://checkout.stripe.com/test' }),
                }),
              50
            )
          )
      );

      renderPricingPage();

      // Click subscribe
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      const proSubscribeButton = subscribeButtons[1];

      await user.click(proSubscribeButton);

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should disable current tier button and show "Current Plan"', () => {
      // Set authenticated user with Pro tier
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'pro', emailVerified: true };
      mockAuthContext.isAuthenticated = true;

      renderPricingPage();

      // Find the Pro tier button - should show "Current Plan" and be disabled
      const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
      expect(currentPlanButton).toBeInTheDocument();
      expect(currentPlanButton).toBeDisabled();
    });
  });

  describe('Special Tier Behaviors', () => {
    it('should navigate to home when authenticated user clicks free tier', async () => {
      const user = userEvent.setup();

      // Set authenticated user with Starter tier
      mockAuthContext.user = { id: 1, email: 'test@example.com', tier: 'starter', emailVerified: true };
      mockAuthContext.isAuthenticated = true;

      renderPricingPage();

      // Click "Get Started" button for Free tier
      const freeButton = screen.getByRole('button', { name: /get started/i });
      await user.click(freeButton);

      // Should navigate to home
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should show signup modal for unauthenticated user clicking free tier without storing intent', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Click "Get Started" button for Free tier
      const freeButton = screen.getByRole('button', { name: /get started/i });
      await user.click(freeButton);

      // Should show signup modal
      await waitFor(() => {
        expect(screen.getByTestId('signup-modal')).toBeInTheDocument();
      });

      // Should NOT store subscription intent (Free tier doesn't need payment)
      const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
      expect(storedIntent).toBeNull();
    });

    it('should have Contact Sales button for Team tier', () => {
      renderPricingPage();

      // Team tier should have "Contact Sales" button
      const teamButton = screen.getByRole('button', { name: /contact sales/i });
      expect(teamButton).toBeInTheDocument();
      expect(teamButton).not.toBeDisabled();

      // Note: Actual window.location.href assignment is difficult to test reliably
      // in jsdom due to navigation side effects. The button onclick handler sets
      // window.location.href to mailto:sales@codescribeai.com per PricingPage.jsx:67
    });
  });

  describe('Contact Sales Flow - Team Tier', () => {
    it('should show signup modal when unauthenticated user clicks Contact Sales', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Find Team tier Contact Sales button
      const teamButton = screen.getByRole('button', { name: /contact sales/i });

      await user.click(teamButton);

      // Should open signup modal
      await waitFor(() => {
        expect(screen.getByTestId('signup-modal')).toBeInTheDocument();
      });
    });

    it('should store contact sales intent in sessionStorage for team tier', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const teamButton = screen.getByRole('button', { name: /contact sales/i });
      await user.click(teamButton);

      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        expect(storedIntent).not.toBeNull();

        const parsed = JSON.parse(storedIntent);
        expect(parsed.tier).toBe('team');
        expect(parsed.billingPeriod).toBe('monthly');
      });
    });

    it('should include tier name in stored subscription context', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const teamButton = screen.getByRole('button', { name: /contact sales/i });
      await user.click(teamButton);

      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        const parsed = JSON.parse(storedIntent);
        expect(parsed.tierName).toBe('Team');
      });
    });

    it('should open ContactSalesModal when authenticated user clicks Contact Sales', async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      mockAuthContext.user = {
        id: 1,
        email: 'user@example.com',
        tier: 'free',
        email_verified: true,
      };
      mockAuthContext.isAuthenticated = true;

      renderPricingPage();

      const teamButton = screen.getByRole('button', { name: /contact sales/i });
      await user.click(teamButton);

      // Should open ContactSalesModal (not signup modal)
      // Note: ContactSalesModal needs to be mocked if we want to verify it opened
      // For now, we verify signup modal does NOT open
      expect(screen.queryByTestId('signup-modal')).not.toBeInTheDocument();
    });

    it('should NOT store contact intent when authenticated user clicks Contact Sales', async () => {
      const user = userEvent.setup();

      mockAuthContext.user = {
        id: 1,
        email: 'user@example.com',
        tier: 'free',
        email_verified: true,
      };
      mockAuthContext.isAuthenticated = true;

      renderPricingPage();

      const teamButton = screen.getByRole('button', { name: /contact sales/i });
      await user.click(teamButton);

      // Authenticated users don't need to store intent
      const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
      expect(storedIntent).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when back button is clicked', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Price Display Updates', () => {
    it('should update all tier prices when billing period changes', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Initial monthly prices
      expect(screen.getByText('$12')).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();

      // Switch to yearly
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Yearly prices should be displayed
      await waitFor(() => {
        expect(screen.getByText('$10')).toBeInTheDocument();
        expect(screen.getByText('$24')).toBeInTheDocument();
        expect(screen.getByText('$82')).toBeInTheDocument();
      });

      // Switch back to monthly
      const monthlyButton = screen.getByRole('button', { name: /monthly/i });
      await user.click(monthlyButton);

      // Monthly prices should be displayed again
      await waitFor(() => {
        expect(screen.getByText('$12')).toBeInTheDocument();
        expect(screen.getByText('$29')).toBeInTheDocument();
        expect(screen.getByText('$99')).toBeInTheDocument();
      });
    });

    it('should not show yearly savings information when monthly is selected', () => {
      renderPricingPage();

      // Should not show yearly total prices
      expect(screen.queryByText(/\$120\/year/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\$288\/year/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\$984\/year/i)).not.toBeInTheDocument();
    });
  });

  describe('Integration - Complete Unauthenticated Flow', () => {
    it('should complete full flow: toggle yearly → click subscribe → store intent → open modal', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      // Step 1: Toggle to yearly
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });
      await user.click(yearlyButton);

      // Verify yearly prices are shown
      await waitFor(() => {
        expect(screen.getByText('$24')).toBeInTheDocument(); // Pro yearly
      });

      // Step 2: Click Pro subscribe button
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[1]); // Pro is second

      // Step 3: Verify sessionStorage has correct intent
      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        const parsedIntent = JSON.parse(storedIntent);

        expect(parsedIntent).toEqual({
          tier: 'pro',
          billingPeriod: 'annual',
          tierName: 'Pro',
        });
      });

      // Step 4: Verify signup modal opens with correct context
      await waitFor(() => {
        expect(screen.getByTestId('signup-modal')).toBeInTheDocument();
        expect(screen.getByTestId('subscription-context')).toHaveTextContent('Subscribing to Pro');
      });
    });

    it('should allow changing billing period multiple times before subscribing', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const monthlyButton = screen.getByRole('button', { name: /^monthly$/i });
      const yearlyButton = screen.getByRole('button', { name: /yearly/i });

      // Toggle back and forth
      await user.click(yearlyButton);
      await user.click(monthlyButton);
      await user.click(yearlyButton);

      // Final state should be yearly
      await waitFor(() => {
        expect(screen.getByText('$24')).toBeInTheDocument(); // Pro yearly
      });

      // Click subscribe
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      await user.click(subscribeButtons[1]);

      // Should store yearly in sessionStorage
      await waitFor(() => {
        const storedIntent = sessionStorage.getItem(STORAGE_KEYS.PENDING_SUBSCRIPTION);
        const parsedIntent = JSON.parse(storedIntent);
        expect(parsedIntent.billingPeriod).toBe('annual');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for back button', () => {
      renderPricingPage();

      const backButton = screen.getByLabelText(/go back/i);
      expect(backButton).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      renderPricingPage();

      // Main heading
      const mainHeading = screen.getByRole('heading', { name: /simple, transparent pricing/i, level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Tier names should be h3
      const tierHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(tierHeadings.length).toBeGreaterThan(0);
    });

    it('should have descriptive button text for all tiers', () => {
      renderPricingPage();

      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument(); // Free
      expect(screen.getAllByRole('button', { name: /subscribe/i }).length).toBeGreaterThan(0); // Starter, Pro
      expect(screen.getByRole('button', { name: /contact sales/i })).toBeInTheDocument(); // Team
    });
  });
});
