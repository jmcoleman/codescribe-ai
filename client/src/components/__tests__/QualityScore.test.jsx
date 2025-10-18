import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QualityScoreModal } from '../QualityScore';

// Mock CopyButton components to avoid clipboard API issues in tests
vi.mock('../CopyButton', () => ({
  CopyButtonWithText: ({ label }) => (
    <button type="button" aria-label={`Copy ${label}`}>{label}</button>
  )
}));

// Mock FocusTrap to avoid focus-trap errors in tests
vi.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }) => <div>{children}</div>
}));

describe('QualityScoreModal Component', () => {
  const mockQualityScore = {
    score: 85,
    grade: 'B',
    docType: 'README',
    breakdown: {
      overview: {
        points: 20,
        maxPoints: 20,
        status: 'complete',
        suggestion: 'Excellent overview provided'
      },
      installation: {
        points: 12,
        maxPoints: 15,
        status: 'partial',
        suggestion: 'Add more detailed installation steps'
      },
      examples: {
        points: 18,
        maxPoints: 20,
        status: 'complete',
        suggestion: 'Great usage examples'
      },
      apiDocs: {
        points: 15,
        maxPoints: 25,
        status: 'partial',
        suggestion: 'Include more API endpoint details'
      },
      structure: {
        points: 15,
        maxPoints: 20,
        status: 'partial',
        suggestion: 'Improve markdown formatting'
      }
    },
    summary: {
      topSuggestion: 'Consider adding more API documentation details',
      strengths: ['overview', 'examples'],
      improvements: ['installation', 'apiDocs', 'structure']
    }
  };

  describe('Rendering', () => {
    it('should render modal when qualityScore is provided', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByText('Quality Breakdown')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('Grade: B')).toBeInTheDocument();
    });

    it('should return null when qualityScore is null', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={null} onClose={onClose} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render modal header with title', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByRole('heading', { name: 'Quality Breakdown' })).toBeInTheDocument();
    });

    it('should render close button', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close quality breakdown modal/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Overall Score Display', () => {
    it('should display correct score', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByText('85/100')).toBeInTheDocument();
    });

    it('should display correct grade', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByText('Grade: B')).toBeInTheDocument();
    });


    it('should apply correct color for A grade', () => {
      const onClose = vi.fn();
      const scoreA = { ...mockQualityScore, score: 95, grade: 'A' };
      render(<QualityScoreModal qualityScore={scoreA} onClose={onClose} />);

      const gradeText = screen.getByText('Grade: A');
      expect(gradeText).toHaveClass('text-purple-600');
    });

    it('should apply correct color for B grade', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const gradeText = screen.getByText('Grade: B');
      expect(gradeText).toHaveClass('text-indigo-600');
    });

    it('should apply correct color for C grade', () => {
      const onClose = vi.fn();
      const scoreC = { ...mockQualityScore, score: 75, grade: 'C' };
      render(<QualityScoreModal qualityScore={scoreC} onClose={onClose} />);

      const gradeText = screen.getByText('Grade: C');
      expect(gradeText).toHaveClass('text-slate-600');
    });

    it('should apply correct color for D grade', () => {
      const onClose = vi.fn();
      const scoreD = { ...mockQualityScore, score: 65, grade: 'D' };
      render(<QualityScoreModal qualityScore={scoreD} onClose={onClose} />);

      const gradeText = screen.getByText('Grade: D');
      expect(gradeText).toHaveClass('text-slate-500');
    });

    it('should apply correct color for F grade', () => {
      const onClose = vi.fn();
      const scoreF = { ...mockQualityScore, score: 45, grade: 'F' };
      render(<QualityScoreModal qualityScore={scoreF} onClose={onClose} />);

      const gradeText = screen.getByText('Grade: F');
      expect(gradeText).toHaveClass('text-slate-500');
    });
  });

  describe('Criteria Breakdown', () => {
    it('should render all criteria items', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
      expect(screen.getByText('Usage Examples')).toBeInTheDocument();
      expect(screen.getByText('Code Documentation')).toBeInTheDocument();
      expect(screen.getByText('Structure & Formatting')).toBeInTheDocument();
    });

    it('should display points for each criterion', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      // Display points out of maxPoints
      expect(screen.getByText('20/20')).toBeInTheDocument();
      expect(screen.getByText('12/15')).toBeInTheDocument();
      expect(screen.getByText('18/20')).toBeInTheDocument();
      expect(screen.getByText('15/25')).toBeInTheDocument();
      expect(screen.getByText('15/20')).toBeInTheDocument();
    });

    it('should display suggestions for each criterion', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      expect(screen.getByText('Excellent overview provided')).toBeInTheDocument();
      expect(screen.getByText('Add more detailed installation steps')).toBeInTheDocument();
      expect(screen.getByText('Great usage examples')).toBeInTheDocument();
      expect(screen.getByText('Include more API endpoint details')).toBeInTheDocument();
      expect(screen.getByText('Improve markdown formatting')).toBeInTheDocument();
    });

    it('should show complete status icon for complete criteria', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      // Find the overview criterion card (complete status)
      const overviewCard = screen.getByText('Overview').closest('.p-3');
      const svgIcon = overviewCard.querySelector('svg.text-purple-400');
      expect(svgIcon).toBeInTheDocument();
    });

    it('should show partial status icon for partial criteria', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      // Find the installation criterion card (partial status)
      const installationCard = screen.getByText('Installation').closest('.p-3');
      const svgIcon = installationCard.querySelector('svg.text-amber-400');
      expect(svgIcon).toBeInTheDocument();
    });

    it('should render progress bars for each criterion', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const progressBars = container.querySelectorAll('.bg-slate-100.rounded-full');
      expect(progressBars.length).toBe(5); // One for each criterion
    });

    it('should calculate correct progress bar width', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const progressBars = container.querySelectorAll('.h-full.transition-all');
      // Check that progress bars exist and have width set
      expect(progressBars.length).toBe(5);
      // Check calculated percentages based on points/maxPoints
      expect(progressBars[0].style.width).toBe('100%'); // overview: 20/20
      expect(progressBars[1].style.width).toBe('80%');  // installation: 12/15
      expect(progressBars[2].style.width).toBe('90%');  // examples: 18/20
      expect(progressBars[3].style.width).toBe('60%');  // apiDocs: 15/25
      expect(progressBars[4].style.width).toBe('75%');  // structure: 15/20
    });

    it('should apply correct progress bar color for complete status', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const progressBars = container.querySelectorAll('.h-full.transition-all');
      // Overview is complete
      expect(progressBars[0]).toHaveClass('bg-purple-500');
    });

    it('should apply correct progress bar color for partial status', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const progressBars = container.querySelectorAll('.h-full.transition-all');
      // Installation is partial
      expect(progressBars[1]).toHaveClass('bg-indigo-400');
    });

    it('should apply correct progress bar color for missing status', () => {
      const onClose = vi.fn();
      const scoreWithMissing = {
        ...mockQualityScore,
        breakdown: {
          ...mockQualityScore.breakdown,
          overview: {
            points: 0,
            maxPoints: 20,
            status: 'missing',
            suggestion: 'Add an overview'
          }
        }
      };
      const { container } = render(<QualityScoreModal qualityScore={scoreWithMissing} onClose={onClose} />);

      const progressBars = container.querySelectorAll('.h-full.transition-all');
      // Overview is missing
      expect(progressBars[0]).toHaveClass('bg-slate-300');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close quality breakdown modal/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have accessible close button', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close quality breakdown modal/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.querySelector('svg')).toBeInTheDocument(); // X icon
    });

    it('should have aria-label on close button', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have hover effect on close button', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close quality breakdown modal/i });
      expect(closeButton).toHaveClass('hover:bg-purple-50');
    });
  });

  describe('Modal Styling', () => {
    it('should have modal overlay with correct styling', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toHaveClass('bg-black/50', 'flex', 'items-center', 'justify-center', 'z-50');
    });

    it('should have modal content with correct styling', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const modal = container.querySelector('.bg-white.rounded-xl');
      expect(modal).toHaveClass('shadow-2xl', 'max-w-md', 'w-full', 'max-h-[90vh]', 'flex', 'flex-col');
    });

    it('should have scrollable criteria section', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const criteriaSection = container.querySelector('.overflow-y-auto.flex-1');
      expect(criteriaSection).toBeInTheDocument();
    });

    it('should have gradient background for score section', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const scoreSection = container.querySelector('.bg-gradient-to-br.from-purple-50');
      expect(scoreSection).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing suggestion field gracefully', () => {
      const onClose = vi.fn();
      const scoreWithoutSuggestions = {
        ...mockQualityScore,
        breakdown: {
          overview: {
            points: 20,
            status: 'complete'
            // No suggestion field
          }
        }
      };

      render(<QualityScoreModal qualityScore={scoreWithoutSuggestions} onClose={onClose} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('20/20')).toBeInTheDocument();
    });

    it('should handle missing summary fields gracefully', () => {
      const onClose = vi.fn();
      const scoreWithoutSummary = {
        ...mockQualityScore,
        summary: {
          improvements: []
        }
      };

      expect(() => {
        render(<QualityScoreModal qualityScore={scoreWithoutSummary} onClose={onClose} />);
      }).not.toThrow();
    });

    it('should handle zero score', () => {
      const onClose = vi.fn();
      const zeroScore = {
        ...mockQualityScore,
        score: 0,
        grade: 'F'
      };
      render(<QualityScoreModal qualityScore={zeroScore} onClose={onClose} />);

      expect(screen.getByText('0/100')).toBeInTheDocument();
      expect(screen.getByText('Grade: F')).toBeInTheDocument();
    });

    it('should handle perfect score', () => {
      const onClose = vi.fn();
      const perfectScore = {
        score: 100,
        grade: 'A',
        breakdown: {
          overview: { points: 20, maxPoints: 20, status: 'complete' }
        },
        summary: {
          topSuggestion: 'Perfect documentation!',
          strengths: ['overview'],
          improvements: []
        }
      };
      render(<QualityScoreModal qualityScore={perfectScore} onClose={onClose} />);

      expect(screen.getByText('100/100')).toBeInTheDocument();
      expect(screen.getByText('Grade: A')).toBeInTheDocument();
    });

    it('should handle empty breakdown object', () => {
      const onClose = vi.fn();
      const emptyBreakdown = {
        ...mockQualityScore,
        breakdown: {}
      };

      render(<QualityScoreModal qualityScore={emptyBreakdown} onClose={onClose} />);

      // Should still render the modal
      expect(screen.getByText('Quality Breakdown')).toBeInTheDocument();
    });

    it('should handle unknown criteria names', () => {
      const onClose = vi.fn();
      const unknownCriteria = {
        ...mockQualityScore,
        breakdown: {
          unknownField: {
            points: 10,
            maxPoints: 20,
            status: 'partial',
            suggestion: 'Test suggestion'
          }
        }
      };

      render(<QualityScoreModal qualityScore={unknownCriteria} onClose={onClose} />);

      // Should render the unknown field as-is
      expect(screen.getByText('unknownField')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const heading = screen.getByRole('heading', { name: 'Quality Breakdown' });
      expect(heading.tagName).toBe('H2');
    });

    it('should have accessible close button', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close quality breakdown modal/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should display icons with proper styling', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper color contrast for text', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      // Check that text colors are defined
      expect(screen.getByText('Quality Breakdown')).toHaveClass('text-slate-900');
      expect(screen.getByText('85/100')).toHaveClass('text-purple-600');
    });

    it('should have proper ARIA attributes for dialog', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'quality-modal-title');
    });

    it('should have modal title with correct id', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const title = screen.getByText('Quality Breakdown');
      expect(title).toHaveAttribute('id', 'quality-modal-title');
    });
  });

  describe('Focus Management', () => {
    // Note: These tests are skipped because we mock FocusTrap to avoid test setup issues
    // FocusTrap functionality is tested in E2E tests
    it.skip('should auto-focus close button when modal opens', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      expect(document.activeElement).toBe(closeButton);
    });

    it('should not auto-focus when modal is closed', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={null} onClose={onClose} />);

      expect(document.activeElement).toBe(document.body);
    });

    it.skip('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      const copyButton = screen.getByLabelText(/copy.*to clipboard/i);
      expect(document.activeElement).toBe(closeButton);

      // Tab should move to copy button (second focusable element)
      await user.tab();
      expect(document.activeElement).toBe(copyButton);

      // Tab again should wrap back to close button (focus trap)
      await user.tab();
      expect(document.activeElement).toBe(closeButton);
    });

    it.skip('should trap focus backwards with Shift+Tab', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      const copyButton = screen.getByLabelText(/copy.*to clipboard/i);
      expect(document.activeElement).toBe(closeButton);

      // Shift+Tab from first element should wrap to last element (copy button)
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(document.activeElement).toBe(copyButton);
    });

    it.skip('should maintain focus when modal is open', () => {
      const onClose = vi.fn();
      render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      expect(document.activeElement).toBe(closeButton);

      // Try to focus body (should not be possible due to focus trap)
      document.body.focus();

      // Focus should still be managed within modal
      expect(document.activeElement).not.toBe(document.body);
    });

    it.skip('should restore focus when modal closes', () => {
      const onClose = vi.fn();
      const { rerender } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close quality breakdown modal');
      expect(document.activeElement).toBe(closeButton);

      // Close modal
      rerender(<QualityScoreModal qualityScore={null} onClose={onClose} />);

      // Modal should not be in document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive modal width', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const modal = container.querySelector('.max-w-md.w-full');
      expect(modal).toBeInTheDocument();
    });

    it('should have responsive padding', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const overlay = container.querySelector('.p-4');
      expect(overlay).toBeInTheDocument();
    });

    it('should have max height constraint', () => {
      const onClose = vi.fn();
      const { container } = render(<QualityScoreModal qualityScore={mockQualityScore} onClose={onClose} />);

      const modal = container.querySelector('.max-h-\\[90vh\\]');
      expect(modal).toBeInTheDocument();
    });
  });
});
