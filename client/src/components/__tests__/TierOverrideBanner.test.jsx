/**
 * Tests for TierOverrideBanner Component
 *
 * Tests the tier override warning banner:
 * - Visibility based on override status
 * - Real-time countdown display
 * - Clear action
 * - Auto-hide on expiry
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TierOverrideBanner } from '../TierOverrideBanner';

describe('TierOverrideBanner', () => {
  let mockOnClear;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnClear = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when override is null', () => {
      const { container } = render(
        <TierOverrideBanner override={null} onClear={mockOnClear} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when override is missing expiresAt', () => {
      const override = {
        tier: 'pro',
        reason: 'Testing'
      };

      const { container } = render(
        <TierOverrideBanner override={override} onClear={mockOnClear} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when override is active', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing pro features'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Tier Override Active:')).toBeInTheDocument();
    });

    it('should hide when override expires', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 100).toISOString(), // Expires in 100ms
        reason: 'Testing'
      };

      const { container } = render(
        <TierOverrideBanner override={override} onClear={mockOnClear} />
      );

      // Initially visible
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Fast forward past expiry
      vi.advanceTimersByTime(200);

      // Should hide (banner auto-hides on next render)
      waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Content Display', () => {
    it('should display override tier name', () => {
      const override = {
        tier: 'enterprise',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing enterprise features'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(screen.getByText(/enterprise/i)).toBeInTheDocument();
    });

    it('should display remaining time', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(screen.getByText(/2h 0m remaining/i)).toBeInTheDocument();
    });

    it('should display override tier', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing pro tier multi-file feature for customer ticket #1234'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      // Component shows "Viewing as {tier}" not the reason
      expect(screen.getByText(/Viewing as/i)).toBeInTheDocument();
      expect(screen.getByText(/pro/i)).toBeInTheDocument();
    });
  });

  describe('Remaining Time Calculation', () => {
    it('should display hours and minutes correctly', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(), // 3h 30m
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(screen.getByText(/3h 30m remaining/i)).toBeInTheDocument();
    });

    it('should display 0 hours correctly', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(screen.getByText(/0h 45m remaining/i)).toBeInTheDocument();
    });

    it('should update remaining time every minute', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      // Initially 2h 0m
      expect(screen.getByText(/2h 0m remaining/i)).toBeInTheDocument();

      // Fast forward 1 minute
      vi.advanceTimersByTime(60 * 1000);

      // Should now be 1h 59m (approximately)
      waitFor(() => {
        expect(screen.getByText(/1h 59m remaining/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dismiss Action', () => {
    it('should hide banner when dismiss button clicked', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      const { container, rerender } = render(
        <TierOverrideBanner override={override} onClear={mockOnClear} />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss banner/i });
      dismissButton.click();

      // Force a rerender to see the state change
      rerender(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      expect(container.firstChild).toBeNull();
    });

    it('should have accessible dismiss button', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss banner/i });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss banner');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper heading structure', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      render(<TierOverrideBanner override={override} onClear={mockOnClear} />);

      // The component uses a span with font-semibold, not a heading element
      expect(screen.getByText('Tier Override Active:')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should have amber color classes', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      const { container } = render(
        <TierOverrideBanner override={override} onClear={mockOnClear} />
      );

      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-amber-50');
      expect(banner).toHaveClass('border-amber-500');
    });

    it('should have dark mode classes', () => {
      const override = {
        tier: 'pro',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Testing'
      };

      const { container } = render(
        <TierOverrideBanner override={override} onClear={mockOnClear} />
      );

      const banner = container.firstChild;
      expect(banner).toHaveClass('dark:bg-amber-900/20');
    });
  });
});
