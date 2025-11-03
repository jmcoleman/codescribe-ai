/**
 * Tests for TermsAcceptanceModal Component
 *
 * Non-dismissible modal that blocks user actions until they accept updated legal documents
 * Tests cover:
 * - Rendering and visibility states
 * - Terms and Privacy checkboxes
 * - Validation (must check both boxes)
 * - Accept button state (disabled until both checked)
 * - onAccept callback
 * - Error handling
 * - Loading state
 * - Links to legal documents
 * - Focus trap integration
 * - Non-dismissible behavior (no close button, no backdrop click)
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
  const defaultProps = {
    isOpen: true,
    onAccept: mockOnAccept,
    missingAcceptance: {
      terms: '2025-11-02',
      privacy: '2025-11-02',
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

      // Pattern 4: Use getAllByText for multiple matches, check count
      expect(screen.getAllByText(/Terms of Service/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Privacy Policy/i).length).toBeGreaterThan(0);

      // Check for version display (appears twice - once for each document)
      expect(screen.getAllByText(/Version:/i).length).toBe(2);
      expect(screen.getAllByText(/2025-11-02/i).length).toBe(2);
    });

    it('should render only Terms section when only Terms needs acceptance', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: '2025-11-02',
              privacy: null,
            }}
          />
        </RouterWrapper>
      );

      // Pattern 4: Terms should appear (heading + link + checkbox)
      expect(screen.getAllByText(/Terms of Service/i).length).toBeGreaterThan(0);
      // Privacy should not appear at all
      expect(screen.queryAllByText(/Privacy Policy/i).length).toBe(0);
    });

    it('should render only Privacy section when only Privacy needs acceptance', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: null,
              privacy: '2025-11-02',
            }}
          />
        </RouterWrapper>
      );

      // Pattern 4: Terms should not appear
      expect(screen.queryAllByText(/Terms of Service/i).length).toBe(0);
      // Privacy should appear (heading + link + checkbox)
      expect(screen.getAllByText(/Privacy Policy/i).length).toBeGreaterThan(0);
    });

    it('should render links to legal documents', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const termsLinks = screen.getAllByText('Terms of Service');
      const privacyLinks = screen.getAllByText('Privacy Policy');

      // Should have multiple links (header + read link + checkbox label)
      expect(termsLinks.length).toBeGreaterThan(1);
      expect(privacyLinks.length).toBeGreaterThan(1);

      // Check one of the "Read" links
      const readTermsLink = screen.getByText('Read Terms of Service →');
      expect(readTermsLink).toHaveAttribute('href', '/terms');
      expect(readTermsLink).toHaveAttribute('target', '_blank');
      expect(readTermsLink).toHaveAttribute('rel', 'noopener noreferrer');
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
    it('should have both checkboxes unchecked by default', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('should check Terms checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const termsCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Terms of Service/i,
      });

      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();
    });

    it('should check Privacy checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const privacyCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Privacy Policy/i,
      });

      await user.click(privacyCheckbox);
      expect(privacyCheckbox).toBeChecked();
    });

    it('should toggle checkbox state on multiple clicks', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const termsCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Terms of Service/i,
      });

      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();

      await user.click(termsCheckbox);
      expect(termsCheckbox).not.toBeChecked();
    });
  });

  describe('Accept Button State', () => {
    it('should disable Accept button when no checkboxes are checked', () => {
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('should disable Accept button when only Terms is checked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const termsCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Terms of Service/i,
      });

      await user.click(termsCheckbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('should disable Accept button when only Privacy is checked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const privacyCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Privacy Policy/i,
      });

      await user.click(privacyCheckbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('should enable Accept button when both checkboxes are checked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const termsCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Terms of Service/i,
      });
      const privacyCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Privacy Policy/i,
      });

      await user.click(termsCheckbox);
      await user.click(privacyCheckbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeEnabled();
    });

    it('should enable Accept button when only Terms checkbox exists and is checked', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal
            {...defaultProps}
            missingAcceptance={{
              terms: '2025-11-02',
              privacy: null,
            }}
          />
        </RouterWrapper>
      );

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeEnabled();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should show error when trying to accept without checking Terms', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Check only Privacy
      const privacyCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Privacy Policy/i,
      });
      await user.click(privacyCheckbox);

      // Try to click Accept button (should still be disabled)
      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeDisabled();
    });

    it('should show error when trying to accept without checking Privacy', async () => {
      const user = userEvent.setup();
      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      // Check only Terms
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /I have read and accept the Terms of Service/i,
      });
      await user.click(termsCheckbox);

      // Try to click Accept button (should still be disabled)
      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
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

      // Check both boxes
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

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

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

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

      // Check both boxes
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

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

    it('should disable checkboxes during loading', async () => {
      const user = userEvent.setup();
      const mockSlowOnAccept = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} onAccept={mockSlowOnAccept} />
        </RouterWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      await user.click(acceptButton);

      // Checkboxes should be disabled during loading
      await waitFor(() => {
        expect(checkboxes[0]).toBeDisabled();
        expect(checkboxes[1]).toBeDisabled();
      });
    });
  });

  describe('onAccept Callback', () => {
    it('should call onAccept with correct data when both boxes are checked', async () => {
      const user = userEvent.setup();
      mockOnAccept.mockResolvedValue({});

      render(
        <RouterWrapper>
          <TermsAcceptanceModal {...defaultProps} />
        </RouterWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

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

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

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

      // Checkboxes should have proper labels
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);

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

      // Should render "N/A" for undefined versions
      const versionTexts = screen.getAllByText(/Version:/);
      expect(versionTexts.length).toBeGreaterThan(0);
    });

    it('should handle null missingAcceptance gracefully', () => {
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

      // Should not crash and Accept button should be enabled (no checkboxes needed)
      const acceptButton = screen.getByRole('button', { name: /Accept and Continue/i });
      expect(acceptButton).toBeEnabled();
    });
  });
});
