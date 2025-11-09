import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import { UsageLimitModal } from '../UsageLimitModal';

describe('UsageLimitModal', () => {
  const mockUsage = {
    limit: 10,
    period: 'monthly',
    resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  it('renders when open', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    expect(screen.getByText(/Monthly Limit Reached/i)).toBeInTheDocument();
    expect(screen.getByText(/You've reached your limit of/i)).toBeInTheDocument();
    expect(screen.getAllByText(/10 documents/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/this month/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    const { container } = render(
      <UsageLimitModal
        isOpen={false}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    const closeButton = screen.getByLabelText(/close usage limit modal/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onUpgrade when upgrade button clicked', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeButton = screen.getByRole('button', { name: /Upgrade Now/i });
    fireEvent.click(upgradeButton);

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('displays correct tier upgrade information', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    expect(screen.getByText(/Upgrade for More Generations/i)).toBeInTheDocument();
    expect(screen.getByText(/Starting at/i)).toBeInTheDocument();
    expect(screen.getByText(/\$12/)).toBeInTheDocument();
  });

  it('shows 100% progress bar', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('closes modal when Escape key pressed', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA attributes', () => {
    const onClose = vi.fn();
    const onUpgrade = vi.fn();

    render(
      <UsageLimitModal
        isOpen={true}
        onClose={onClose}
        usage={mockUsage}
        currentTier="free"
        onUpgrade={onUpgrade}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'usage-limit-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'usage-limit-modal-description');
  });

  // Tier-specific tests
  describe('Free tier (10 docs/month)', () => {
    const freeUsage = {
      limit: 10,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Starter with 5x multiplier', () => {
      const onClose = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageLimitModal
          isOpen={true}
          onClose={onClose}
          usage={freeUsage}
          currentTier="free"
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/50 generations per month \(5x more\)/i)).toBeInTheDocument();
      expect(screen.getByText(/10 generations per day/i)).toBeInTheDocument();
      expect(screen.getByText(/\$12/)).toBeInTheDocument();
    });
  });

  describe('Starter tier (50 docs/month)', () => {
    const starterUsage = {
      limit: 50,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Pro with 4x multiplier', () => {
      const onClose = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageLimitModal
          isOpen={true}
          onClose={onClose}
          usage={starterUsage}
          currentTier="starter"
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/200 generations per month \(4x more\)/i)).toBeInTheDocument();
      expect(screen.getByText(/50 generations per day/i)).toBeInTheDocument();
      expect(screen.getByText(/\$29/)).toBeInTheDocument();
    });

    it('displays correct limit of 50 documents', () => {
      const onClose = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageLimitModal
          isOpen={true}
          onClose={onClose}
          usage={starterUsage}
          currentTier="starter"
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/You've reached your limit of/i)).toBeInTheDocument();
      expect(screen.getAllByText(/50 documents/i)[0]).toBeInTheDocument();
    });
  });

  describe('Pro tier (200 docs/month)', () => {
    const proUsage = {
      limit: 200,
      period: 'monthly',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    it('shows upgrade to Team with 5x multiplier', () => {
      const onClose = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageLimitModal
          isOpen={true}
          onClose={onClose}
          usage={proUsage}
          currentTier="pro"
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/1,000 generations per month \(5x more\)/i)).toBeInTheDocument();
      expect(screen.getByText(/250 generations per day/i)).toBeInTheDocument();
      expect(screen.getByText(/\$99/)).toBeInTheDocument();
    });

    it('displays correct limit of 200 documents', () => {
      const onClose = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <UsageLimitModal
          isOpen={true}
          onClose={onClose}
          usage={proUsage}
          currentTier="pro"
          onUpgrade={onUpgrade}
        />
      );

      expect(screen.getByText(/You've reached your limit of/i)).toBeInTheDocument();
      expect(screen.getAllByText(/200 documents/i)[0]).toBeInTheDocument();
    });
  });
});
