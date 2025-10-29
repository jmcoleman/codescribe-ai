import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsageWarningBanner } from '../UsageWarningBanner';

describe('UsageWarningBanner', () => {
  const mockUsage = {
    percentage: 85,
    remaining: 2,
    limit: 10,
    period: 'monthly',
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  it('renders with usage data', () => {
    const onDismiss = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageWarningBanner
        usage={mockUsage}
        currentTier="free"
        onDismiss={onDismiss}
        onUpgrade={onUpgrade}
      />
    );

    // Check warning text
    expect(screen.getByText(/Usage Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/You've used/i)).toBeInTheDocument();
    expect(screen.getByText(/2 remaining/i)).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageWarningBanner
        usage={mockUsage}
        currentTier="free"
        onDismiss={onDismiss}
        onUpgrade={onUpgrade}
      />
    );

    const dismissButton = screen.getByLabelText(/dismiss usage warning/i);
    fireEvent.click(dismissButton);

    // Should call after exit animation (200ms)
    expect(onDismiss).not.toHaveBeenCalled();

    // Fast forward through animation
    setTimeout(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, 250);
  });

  it('calls onUpgrade when upgrade button clicked', () => {
    const onDismiss = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageWarningBanner
        usage={mockUsage}
        currentTier="free"
        onDismiss={onDismiss}
        onUpgrade={onUpgrade}
      />
    );

    const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
    fireEvent.click(upgradeButton);

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('displays correct tier upgrade information', () => {
    const onDismiss = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageWarningBanner
        usage={mockUsage}
        currentTier="free"
        onDismiss={onDismiss}
        onUpgrade={onUpgrade}
      />
    );

    expect(screen.getByText(/Get.*more with Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Just \$12\/month/i)).toBeInTheDocument();
  });

  it('does not render when usage is null', () => {
    const onDismiss = vi.fn();
    const onUpgrade = vi.fn();

    const { container } = render(
      <UsageWarningBanner
        usage={null}
        currentTier="free"
        onDismiss={onDismiss}
        onUpgrade={onUpgrade}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  // Tier-specific tests
  describe('Free tier (10 docs/month)', () => {
    const freeUsage = {
      percentage: 85,
      remaining: 2,
      limit: 10,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Starter with 5x multiplier', () => {
      const onDismiss = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageWarningBanner
          usage={freeUsage}
          currentTier="free"
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/Get 5x more with Starter/i)).toBeInTheDocument();
      expect(screen.getByText(/Just \$12\/month/i)).toBeInTheDocument();
    });
  });

  describe('Starter tier (50 docs/month)', () => {
    const starterUsage = {
      percentage: 85,
      remaining: 8,
      limit: 50,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Pro with 4x multiplier', () => {
      const onDismiss = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageWarningBanner
          usage={starterUsage}
          currentTier="starter"
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/Get 4x more with Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Just \$29\/month/i)).toBeInTheDocument();
    });

    it('displays correct usage of 42/50 documents', () => {
      const onDismiss = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageWarningBanner
          usage={starterUsage}
          currentTier="starter"
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/42 of 50/i)).toBeInTheDocument();
      expect(screen.getByText(/8 remaining/i)).toBeInTheDocument();
    });
  });

  describe('Pro tier (200 docs/month)', () => {
    const proUsage = {
      percentage: 90,
      remaining: 20,
      limit: 200,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Team with 5x multiplier', () => {
      const onDismiss = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageWarningBanner
          usage={proUsage}
          currentTier="pro"
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/Get 5x more with Team/i)).toBeInTheDocument();
      expect(screen.getByText(/Just \$99\/month/i)).toBeInTheDocument();
    });

    it('displays correct usage of 180/200 documents', () => {
      const onDismiss = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageWarningBanner
          usage={proUsage}
          currentTier="pro"
          onDismiss={onDismiss}
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/180 of 200/i)).toBeInTheDocument();
      expect(screen.getByText(/20 remaining/i)).toBeInTheDocument();
    });
  });
});
