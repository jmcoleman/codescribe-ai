import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UsageDashboard } from '../UsageDashboard';

// Mock the useUsageTracking hook
vi.mock('../../hooks/useUsageTracking', () => ({
  useUsageTracking: vi.fn()
}));

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn()
  };
});

// Import mocked modules
import { useUsageTracking } from '../../hooks/useUsageTracking';
import { useAuth } from '../../contexts/AuthContext';

describe('UsageDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsageData = {
    usage: {
      daily: 5,
      monthly: 25,
      dailyLimit: 10,
      monthlyLimit: 50,
      dailyRemaining: 5,
      monthlyRemaining: 25,
      dailyPercentage: 50,
      monthlyPercentage: 50,
      dailyResetDate: '2025-11-08T05:00:00.000Z',
      monthlyResetDate: '2025-12-01T05:00:00.000Z',
      tier: 'starter'
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    getUsageForPeriod: vi.fn((period) => ({
      percentage: period === 'daily' ? 50 : 50,
      remaining: period === 'daily' ? 5 : 25,
      limit: period === 'daily' ? 10 : 50,
      period,
      resetDate: period === 'daily' ? '2025-11-08T05:00:00.000Z' : '2025-12-01T05:00:00.000Z'
    }))
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    tier: 'starter',
    email_verified: true
  };

  const renderWithRouter = (component, initialRoute = '/usage') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/usage" element={component} />
          <Route path="/pricing" element={<div>Pricing Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Authentication', () => {
    it('redirects to home if user is not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      // Component should not render main content
      expect(screen.queryByText('Usage Dashboard')).not.toBeInTheDocument();
    });

    it('renders dashboard for authenticated users', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Usage Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor your document generation usage and quota limits')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when data is loading', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        usage: null,
        isLoading: true
      });

      renderWithRouter(<UsageDashboard />);

      // Should show loading skeleton (animated pulse elements)
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('shows dashboard content when data is loaded', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Daily Usage')).toBeInTheDocument();
      expect(screen.getByText('Monthly Usage')).toBeInTheDocument();
    });
  });

  describe('Tier Badge Display', () => {
    it('displays current tier badge for starter plan', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, tier: 'starter' },
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Starter Plan')).toBeInTheDocument();
    });

    it('displays current tier badge for pro plan', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, tier: 'pro' },
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        usage: { ...mockUsageData.usage, tier: 'pro' }
      });

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    it('displays free plan for users without tier', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, tier: null },
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });
  });

  describe('Usage Cards', () => {
    it('displays daily usage card with correct data', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      // Check for the heading first
      expect(screen.getByText('Daily Usage')).toBeInTheDocument();

      // Check for the remaining text
      expect(screen.getByText('5 remaining')).toBeInTheDocument();
    });

    it('displays monthly usage card with correct data', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      // Check for the heading first
      expect(screen.getByText('Monthly Usage')).toBeInTheDocument();

      // Check for the remaining text
      expect(screen.getByText('25 remaining')).toBeInTheDocument();
    });

    it('shows correct status badge for healthy usage (< 60%)', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const badges = screen.getAllByText('Normal');
      expect(badges.length).toBe(2); // One for each card
    });

    it('shows correct status badge for caution usage (60-79%)', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 65,
          remaining: 17,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const badges = screen.getAllByText('High Usage');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows correct status badge for warning usage (80-99%)', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 85,
          remaining: 7,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const badges = screen.getAllByText('High Usage');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('shows correct status badge for critical usage (100%)', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 100,
          remaining: 0,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const badges = screen.getAllByText('At Limit');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Bars', () => {
    it('displays progress bar with correct percentage', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(2); // Daily and monthly

      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '50');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '50');
    });

    it('shows 50% label on progress bars', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const percentageLabels = screen.getAllByText('50%');
      expect(percentageLabels.length).toBe(2); // One for each card
    });
  });

  describe('Upgrade Prompt', () => {
    it('shows upgrade prompt when usage is above 60%', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 70,
          remaining: 15,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('Ready for more?')).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to/)).toBeInTheDocument();
    });

    it('does not show upgrade prompt when usage is below 60%', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 40,
          remaining: 30,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      expect(screen.queryByText('Ready for more?')).not.toBeInTheDocument();
    });

    it('navigates to pricing page when upgrade button is clicked', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 70,
          remaining: 15,
          limit: 50,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const upgradeButton = screen.getByRole('button', { name: /^Upgrade$/i });
      await user.click(upgradeButton);

      // Should navigate to pricing page
      await waitFor(() => {
        expect(screen.getByText('Pricing Page')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('displays all quick action cards', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByText('View Pricing')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('navigates to pricing page when View Pricing is clicked', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const pricingButton = screen.getByRole('button', { name: /View Pricing/i });
      await user.click(pricingButton);

      await waitFor(() => {
        expect(screen.getByText('Pricing Page')).toBeInTheDocument();
      });
    });

    it('navigates to settings page when Settings is clicked', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const settingsButton = screen.getByRole('button', { name: /Settings/i });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Settings Page')).toBeInTheDocument();
      });
    });

    it('disables documentation button (coming soon)', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const docButton = screen.getByRole('button', { name: /Documentation/i });
      expect(docButton).toBeDisabled();
      expect(screen.getByText('(Coming soon)')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefetch = vi.fn();

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        refetch: mockRefetch
      });

      renderWithRouter(<UsageDashboard />);

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('shows refreshing state when refresh is in progress', async () => {
      const user = userEvent.setup();

      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      await user.click(refreshButton);

      // Button should show "Refreshing..." temporarily
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Unlimited Usage (Enterprise)', () => {
    it('displays infinity symbol for unlimited usage', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, tier: 'enterprise' },
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 0,
          remaining: 999999,
          limit: 'unlimited',
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const infinitySymbols = screen.getAllByText('∞');
      expect(infinitySymbols.length).toBeGreaterThan(0);
    });

    it('shows "Unlimited generations" text for enterprise tier', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, tier: 'enterprise' },
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue({
        ...mockUsageData,
        getUsageForPeriod: vi.fn((period) => ({
          percentage: 0,
          remaining: 999999,
          limit: 999999,
          period,
          resetDate: '2025-12-01T05:00:00.000Z'
        }))
      });

      renderWithRouter(<UsageDashboard />);

      const unlimitedTexts = screen.getAllByText('Unlimited generations');
      expect(unlimitedTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has accessible role attributes', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBe(2);

      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('has proper button labels', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      });

      useUsageTracking.mockReturnValue(mockUsageData);

      renderWithRouter(<UsageDashboard />);

      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });
});
