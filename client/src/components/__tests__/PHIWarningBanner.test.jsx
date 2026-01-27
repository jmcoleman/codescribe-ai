/**
 * PHI Warning Banner Component Tests
 * Tests for Protected Health Information warning display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PHIWarningBanner } from '../PHIWarningBanner';

describe('PHIWarningBanner', () => {
  const mockOnDismiss = vi.fn();
  const mockOnProceed = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
    mockOnProceed.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when containsPHI is false', () => {
      const phiDetection = {
        containsPHI: false,
        confidence: 'none',
        findings: {},
        score: 0,
        suggestions: [],
      };

      const { container } = render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when phiDetection is null', () => {
      const { container } = render(
        <PHIWarningBanner
          phiDetection={null}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render with high confidence PHI detection', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: {
            count: 1,
            description: 'Social Security Number',
            samples: ['123-45-6789'],
          },
        },
        score: 18,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Potential PHI Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/HIGH confidence/i)).toBeInTheDocument();
    });

    it('should render with medium confidence PHI detection', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'medium',
        findings: {
          mrn: {
            count: 1,
            description: 'Medical Record Number',
            samples: ['MRN: ABC123'],
          },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Potential PHI Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/MEDIUM confidence/i)).toBeInTheDocument();
    });

    it('should render with low confidence PHI detection', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'low',
        findings: {
          phone: {
            count: 1,
            description: 'Phone Number',
            samples: ['555-123-4567'],
          },
        },
        score: 3,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Potential PHI Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/LOW confidence/i)).toBeInTheDocument();
    });
  });

  describe('Findings Display', () => {
    it('should display single finding', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: {
            count: 1,
            description: 'Social Security Number',
            samples: ['123-45-6789'],
          },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/1 Social Security Number/i)).toBeInTheDocument();
    });

    it('should display multiple findings', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: {
            count: 2,
            description: 'Social Security Number',
            samples: ['123-45-6789', '987-65-4321'],
          },
          phone: {
            count: 1,
            description: 'Phone Number',
            samples: ['555-123-4567'],
          },
        },
        score: 16,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/2 Social Security Numbers/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Phone Number/i)).toBeInTheDocument();
    });

    it('should exclude healthKeywords from findings display', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'low',
        findings: {
          healthKeywords: {
            count: 5,
            description: 'Healthcare-related keywords',
          },
          ssn: {
            count: 1,
            description: 'Social Security Number',
          },
        },
        score: 12,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/1 Social Security Number/i)).toBeInTheDocument();
      expect(screen.queryByText(/keyword/i)).not.toBeInTheDocument();
    });
  });

  describe('Suggestions', () => {
    it('should show suggestions button when suggestions exist', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN', samples: ['123-45-6789'] },
        },
        score: 10,
        suggestions: [
          {
            type: 'ssn',
            title: 'Social Security Numbers',
            message: 'Replace with XXX-XX-XXXX',
            priority: 'high',
            examples: ['123-45-6789'],
          },
        ],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/View sanitization suggestions/i)).toBeInTheDocument();
    });

    it('should toggle suggestions on click', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN', samples: ['123-45-6789'] },
        },
        score: 10,
        suggestions: [
          {
            type: 'ssn',
            title: 'Social Security Numbers',
            message: 'Replace with XXX-XX-XXXX',
            priority: 'high',
            examples: ['123-45-6789'],
          },
        ],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const toggleButton = screen.getByText(/View sanitization suggestions/i);

      // Initially collapsed
      expect(screen.queryByText(/Replace with XXX-XX-XXXX/i)).not.toBeInTheDocument();

      // Click to expand
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText(/Replace with XXX-XX-XXXX/i)).toBeInTheDocument();
      });

      // Click to collapse
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText(/Replace with XXX-XX-XXXX/i)).not.toBeInTheDocument();
      });
    });

    it('should display suggestion examples', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 2, description: 'SSN', samples: ['123-45-6789', '987-65-4321'] },
        },
        score: 20,
        suggestions: [
          {
            type: 'ssn',
            title: 'Social Security Numbers',
            message: 'Replace with XXX-XX-XXXX',
            priority: 'high',
            examples: ['123-45-6789', '987-65-4321'],
          },
        ],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const toggleButton = screen.getByText(/View sanitization suggestions/i);
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Examples found:/i)).toBeInTheDocument();
        expect(screen.getByText(/123-45-6789, 987-65-4321/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when Sanitize Code First button is clicked', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const dismissButton = screen.getByText(/Sanitize Code First/i);
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when close button is clicked', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const closeButton = screen.getByLabelText(/Dismiss PHI warning/i);
      await user.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should enable Proceed button only after confirmation checkbox is checked', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const proceedButton = screen.getByText(/Proceed Anyway/i);
      const confirmCheckbox = screen.getByRole('checkbox');

      // Initially disabled
      expect(proceedButton).toBeDisabled();

      // Check checkbox
      await user.click(confirmCheckbox);
      expect(proceedButton).not.toBeDisabled();

      // Uncheck checkbox
      await user.click(confirmCheckbox);
      expect(proceedButton).toBeDisabled();
    });

    it('should call onProceed when Proceed button is clicked after confirmation', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const proceedButton = screen.getByText(/Proceed Anyway/i);
      const confirmCheckbox = screen.getByRole('checkbox');

      // Check checkbox and click proceed
      await user.click(confirmCheckbox);
      await user.click(proceedButton);

      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should not call onProceed when Proceed button is clicked without confirmation', async () => {
      const user = userEvent.setup();
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const proceedButton = screen.getByText(/Proceed Anyway/i);

      // Button should be disabled, but try to click anyway
      expect(proceedButton).toBeDisabled();
      expect(mockOnProceed).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const banner = screen.getByRole('alert');
      expect(banner).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper button labels', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByLabelText(/Dismiss PHI warning/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Proceed with generation after confirming no real PHI/i)).toBeInTheDocument();
    });

    it('should have proper checkbox labeling', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 10,
        suggestions: [],
      };

      render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'phi-confirmation');
      expect(checkbox).toHaveAttribute('aria-describedby', 'phi-confirmation-label');
    });
  });

  describe('Color Coding', () => {
    it('should use red colors for high confidence', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'high',
        findings: {
          ssn: { count: 1, description: 'SSN' },
        },
        score: 18,
        suggestions: [],
      };

      const { container } = render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const banner = container.firstChild;
      expect(banner).toHaveClass('border-red-500');
    });

    it('should use amber colors for medium confidence', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'medium',
        findings: {
          mrn: { count: 1, description: 'MRN' },
        },
        score: 10,
        suggestions: [],
      };

      const { container } = render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const banner = container.firstChild;
      expect(banner).toHaveClass('border-amber-500');
    });

    it('should use yellow colors for low confidence', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'low',
        findings: {
          phone: { count: 1, description: 'Phone' },
        },
        score: 3,
        suggestions: [],
      };

      const { container } = render(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const banner = container.firstChild;
      expect(banner).toHaveClass('border-yellow-500');
    });
  });
});
