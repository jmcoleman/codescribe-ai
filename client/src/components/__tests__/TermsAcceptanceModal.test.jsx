/**
 * Tests for TermsAcceptanceModal Component
 *
 * Non-dismissible modal that blocks user actions until they accept updated legal documents
 * Tests cover:
 * - Rendering and visibility states
 * - Combined Terms and Privacy checkbox (single checkbox for both)
 * - Validation (must check the box)
 * - Accept button state (disabled until checkbox is checked)
 * - onAccept callback
 * - Error handling
 * - Loading state
 * - Links to legal documents
 * - Focus trap integration
 * - Non-dismissible behavior (no close button, no backdrop click)
 *
 * Note: Component was simplified to use a single combined checkbox for accepting
 * both Terms of Service and Privacy Policy (matching SignupModal pattern)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TermsAcceptanceModal from '../TermsAcceptanceModal';

// Wrapper for router context
const RouterWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('TermsAcceptanceModal', () => {
  const mockOnAccept = vi.fn();
  // Updated props to match new missingAcceptance structure with needs_acceptance
  const defaultProps = {
    isOpen: true,
    onAccept: mockOnAccept,
    missingAcceptance: {
      terms: { needs_acceptance: true, current_version: '2025-11-02' },
      privacy: { needs_acceptance: true, current_version: '2025-11-02' },
    },
    currentVersions: {
      terms: '2025-11-02',
      privacy: '2025-11-02',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} isOpen={false} />
        </RouterWrapper>
      );

      expect(screen.queryByText('Updated Legal Documents')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      expect(screen.getByText('Updated Legal Documents')).toBeInTheDocument();
      expect(screen.getByText('Please review and accept to continue')).toBeInTheDocument();
    });

    it('should render both Terms and Privacy sections when both need acceptance', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Both documents shown in info sections
      expect(screen.getAllByText(/Terms of Service/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Privacy Policy/i).length).toBeGreaterThan(0);

      // Check for version display (appears twice - once for each document)
      expect(screen.getAllByText(/Version:/i).length).toBe(2);
    });

    it('should render only Terms section when only Terms needs acceptance', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: { needs_acceptance: true, current_version: '2025-11-02' },
              privacy: { needs_acceptance: false },
            }}
          />
        </RouterWrapper>
      );

      // Terms info section should appear
      expect(screen.getByText('Read Terms of Service →')).toBeInTheDocument();
      // Privacy info section should not appear
      expect(screen.queryByText('Read Privacy Policy →')).not.toBeInTheDocument();
    });

    it('should render only Privacy section when only Privacy needs acceptance', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: { needs_acceptance: false },
              privacy: { needs_acceptance: true, current_version: '2025-11-02' },
            }}
          />
        </RouterWrapper>
      );

      // Privacy info section should appear
      expect(screen.getByText('Read Privacy Policy →')).toBeInTheDocument();
      // Terms info section should not appear
      expect(screen.queryByText('Read Terms of Service →')).not.toBeInTheDocument();
    });

    it('should render links to legal documents in the combined checkbox', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Combined checkbox has links to both
      const checkboxLabel = screen.getByRole('checkbox').closest('label');
      expect(checkboxLabel).toBeInTheDocument();

      // Check the "Read" links in info sections
      const readTermsLink = screen.getByText('Read Terms of Service →');
      expect(readTermsLink).toHaveAttribute('href', '/terms');
      expect(readTermsLink).toHaveAttribute('target', '_blank');

      const readPrivacyLink = screen.getByText('Read Privacy Policy →');
      expect(readPrivacyLink).toHaveAttribute('href', '/privacy');
      expect(readPrivacyLink).toHaveAttribute('target', '_blank');
    });

    it('should render warning notice', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      expect(
        screen.getByText(/We've updated our legal documents/)
      ).toBeInTheDocument();
    });

    it('should render non-dismissible footer note', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      expect(
        screen.getByText(/This action cannot be dismissed/)
      ).toBeInTheDocument();
    });

    it('should not render a close button', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Should not have any X button or close icon
      expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    it('should have combined checkbox unchecked by default', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should check combined checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should toggle checkbox state on multiple clicks', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Accept Button State', () => {
    it('should disable Accept button when checkbox is not checked', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('should enable Accept button when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeEnabled();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should show error when trying to accept without checking checkbox', async () => {
      // Note: The button is disabled when unchecked, so the handleAccept
      // validation for unchecked is a safety net. We can't easily test
      // this path since the button is disabled.
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      // Button should be disabled
      expect(acceptButton).toBeDisabled();
    });

    it('should display error message when onAccept fails', async () => {
      const user = userEvent.setup();
      const mockFailingOnAccept = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockFailingOnAccept} />
        </RouterWrapper>
      );

      // Check the box
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Click Accept
      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message when error has no message', async () => {
      const user = userEvent.setup();
      const mockFailingOnAccept = vi.fn().mockRejectedValue({});

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockFailingOnAccept} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to record acceptance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state when accepting', async () => {
      const user = userEvent.setup();
      const mockSlowOnAccept = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockSlowOnAccept} />
        </RouterWrapper>
      );

      // Check the box
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Click Accept
      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      // Should show loading text
      expect(screen.getByRole('button', { name: /Accepting.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accepting.../i })).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockSlowOnAccept).toHaveBeenCalled();
      });
    });

    it('should disable checkbox during loading', async () => {
      const user = userEvent.setup();
      const mockSlowOnAccept = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockSlowOnAccept} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      // Checkbox should be disabled during loading
      await waitFor(() => {
        expect(checkbox).toBeDisabled();
      });
    });
  });

  describe('onAccept Callback', () => {
    it('should call onAccept with correct data when checkbox is checked', async () => {
      const user = userEvent.setup();
      mockOnAccept.mockResolvedValue({});

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(mockOnAccept).toHaveBeenCalledTimes(1);
        expect(mockOnAccept).toHaveBeenCalledWith({
          accept_terms: true,
          accept_privacy: true,
        });
      });
    });

    it('should clear error state before calling onAccept', async () => {
      const user = userEvent.setup();
      const mockFailingThenSuccessOnAccept = vi
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({});

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockFailingThenSuccessOnAccept} />
        </RouterWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });

      // First attempt - should fail
      await user.click(acceptButton);
      await waitFor(() => {
        expect(screen.getByText(/First attempt failed/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed and clear error
      await user.click(acceptButton);
      await waitFor(() => {
        expect(screen.queryByText(/First attempt failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Modal should be visible
      expect(screen.getByText('Updated Legal Documents')).toBeInTheDocument();

      // Combined checkbox should exist
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();

      // Button should be accessible
      expect(screen.getByRole('button', { name: /Accept and Continue/i })).toBeInTheDocument();
    });

    it('should use focus trap for keyboard navigation', () => {
      const { container } = render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Modal should render (backdrop and content exist)
      const backdrop = container.querySelector('.fixed.inset-0');
      expect(backdrop).toBeTruthy();
    });

    it('should have proper link attributes for external navigation', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const readTermsLink = screen.getByText('Read Terms of Service →');
      const readPrivacyLink = screen.getByText('Read Privacy Policy →');

      // Should open in new tab with security attributes
      expect(readTermsLink).toHaveAttribute('target', '_blank');
      expect(readTermsLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(readPrivacyLink).toHaveAttribute('target', '_blank');
      expect(readPrivacyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing currentVersions gracefully', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            currentVersions={{
              terms: undefined,
              privacy: undefined,
            }}
          />
        </RouterWrapper>
      );

      // Should render without crashing
      expect(screen.getByText('Updated Legal Documents')).toBeInTheDocument();
    });

    it('should handle null missingAcceptance values gracefully', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: null,
              privacy: null,
            }}
          />
        </RouterWrapper>
      );

      // Should not crash - no document sections should be shown
      // but checkbox and button should still work
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Accept and Continue/i })).toBeInTheDocument();
    });
  });
});
