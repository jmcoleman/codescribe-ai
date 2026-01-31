/**
 * PHI Warning Banner Component Tests
 * Tests for simplified PHI warning display (works with PHIEditorEnhancer drawer)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PHIWarningBanner } from '../PHIWarningBanner';
import { ThemeProvider } from '../../contexts/ThemeContext';

function renderWithTheme(ui) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

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

      const { container } = renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when phiDetection is null', () => {
      const { container } = renderWithTheme(
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Protected Health Information Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/High/i)).toBeInTheDocument();
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Protected Health Information Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/Possible Protected Health Information Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
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

      renderWithTheme(
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
          email: {
            count: 1,
            description: 'Email Address',
            samples: ['test@example.com'],
          },
        },
        score: 25,
        suggestions: [],
      };

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/2 Social Security Numbers/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Email Address/i)).toBeInTheDocument();
    });

    it('should exclude healthKeywords from findings display', () => {
      const phiDetection = {
        containsPHI: true,
        confidence: 'medium',
        findings: {
          ssn: {
            count: 1,
            description: 'Social Security Number',
            samples: ['123-45-6789'],
          },
          healthKeywords: {
            count: 5,
            description: 'Healthcare Keywords',
            samples: ['patient', 'diagnosis', 'prescription', 'medical', 'health'],
          },
        },
        score: 15,
        suggestions: [],
      };

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/1 Social Security Number/i)).toBeInTheDocument();
      expect(screen.queryByText(/Healthcare Keywords/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDismiss when close button is clicked', async () => {
      const user = userEvent.setup();
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const closeButton = screen.getByLabelText(/dismiss/i);
      await user.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      // Banner should have assertive live region (via Banner component)
      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      const closeButton = screen.getByLabelText(/dismiss/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should show HIPAA compliance message', () => {
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/HIPAA Compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/PHI must be removed before documentation generation/i)).toBeInTheDocument();
    });

    it('should mention review panel in instructions', () => {
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

      renderWithTheme(
        <PHIWarningBanner
          phiDetection={phiDetection}
          onDismiss={mockOnDismiss}
          onProceed={mockOnProceed}
        />
      );

      expect(screen.getByText(/review panel below/i)).toBeInTheDocument();
      expect(screen.getByText(/wavy underlines/i)).toBeInTheDocument();
    });
  });
});
