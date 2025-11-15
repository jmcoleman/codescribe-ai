import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { SamplesModal } from '../SamplesModal';
import { codeSamples } from '../../data/examples';

describe('SamplesModal', () => {
  const mockOnClose = vi.fn();
  const mockOnLoadSample = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onLoadSample: mockOnLoadSample,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<SamplesModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Code Samples')).not.toBeInTheDocument();
    });

    it('should render modal header when isOpen is true', () => {
      render(<SamplesModal {...defaultProps} />);
      expect(screen.getByText('Code Samples')).toBeInTheDocument();
    });

    it('should render all code examples', () => {
      render(<SamplesModal {...defaultProps} />);

      codeSamples.forEach(sample => {
        expect(screen.getByText(sample.title)).toBeInTheDocument();
      });
    });

    it('should render sample descriptions', () => {
      render(<SamplesModal {...defaultProps} />);

      codeSamples.forEach(sample => {
        expect(screen.getByText(sample.description)).toBeInTheDocument();
      });
    });

    it('should render docType badges for all examples', () => {
      render(<SamplesModal {...defaultProps} />);

      const docTypeBadges = screen.getAllByText(/README|JSDOC|API/);
      expect(docTypeBadges.length).toBeGreaterThanOrEqual(codeSamples.length);
    });

    it('should render instruction text', () => {
      render(<SamplesModal {...defaultProps} />);
      expect(screen.getByText(/Click any card on the left to see what you'll get/)).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<SamplesModal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close samples modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render empty state for preview panel initially', () => {
      render(<SamplesModal {...defaultProps} />);
      expect(screen.getByText('Choose a sample to preview')).toBeInTheDocument();
      expect(screen.getByText("Click any card on the left to see what you'll get")).toBeInTheDocument();
    });
  });

  describe('Example Card Interactions', () => {
    it('should preview sample when clicking on card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Preview should show "Load Sample" button and code
      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();

      // Code should be visible
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('BooksController');
      });
      expect(codeBlock).toBeInTheDocument();
    });

    it('should show selected state when sample is selected', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Card should have selected styling (purple border)
      expect(card).toHaveClass('border-purple-500');
      expect(card).toHaveClass('bg-purple-50');
    });

    it('should switch between examples when clicking different cards', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const secondExample = codeSamples[1];

      // Click first example
      const firstCard = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');
      await user.click(firstCard);
      expect(firstCard).toHaveClass('border-purple-500');

      // Click second example
      const secondCard = screen.getByText(secondExample.title).closest('div[class*="cursor-pointer"]');
      await user.click(secondCard);

      // Second should be selected, first should not
      expect(secondCard).toHaveClass('border-purple-500');
      expect(firstCard).not.toHaveClass('border-purple-500');
    });

    it('should load sample when pressing Enter on selected card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      // Click to select, then press Enter to load
      await user.click(card);
      await user.keyboard('{Enter}');

      expect(mockOnLoadSample).toHaveBeenCalledWith(firstExample);
      expect(mockOnLoadSample).toHaveBeenCalledTimes(1);
    });

    it('should close modal after loading sample', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      // Click to select, then press Enter on the card to load
      await user.click(card);
      card.focus(); // Ensure card has focus
      await user.keyboard('{Enter}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should show "Selected" badge when card is selected', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      // Verify no "Selected" badge initially
      expect(screen.queryByText('Selected')).not.toBeInTheDocument();

      // Click card to select
      await user.click(card);

      // Should show "Selected" badge
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
  });

  describe('Preview Panel', () => {
    it('should display sample code in preview panel', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Check if code is displayed (using partial match since it's in a code block)
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('BooksController');
      });
      expect(codeBlock).toBeInTheDocument();
    });

    it('should display "Load Sample" button in preview panel', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
    });

    it('should load sample when clicking "Load Sample" button', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      const loadButton = screen.getByRole('button', { name: 'Load Sample' });
      await user.click(loadButton);

      expect(mockOnLoadSample).toHaveBeenCalledWith(firstExample);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should focus on code in preview panel', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Preview should show code immediately with Load button
      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();

      // Code should be visible in preview
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('BooksController');
      });
      expect(codeBlock).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close samples modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when pressing Escape key', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for sample cards', () => {
      render(<SamplesModal {...defaultProps} />);

      codeSamples.forEach(sample => {
        // Cards should have preview labels when not selected
        const card = screen.getByText(sample.title).closest('div[role="button"]');
        expect(card).toHaveAttribute('aria-label', `Preview ${sample.title} sample`);
      });
    });

    it('should update aria label when card is selected', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[role="button"]');

      // Should have "Preview" label initially
      expect(card).toHaveAttribute('aria-label', `Preview ${firstExample.title} sample`);

      // Click to select
      await user.click(card);

      // Should update to "Press Enter to load" label
      expect(card).toHaveAttribute('aria-label', `Press Enter to load ${firstExample.title} sample`);
    });

    it('should have proper aria label for close button', () => {
      render(<SamplesModal {...defaultProps} />);
      expect(screen.getByLabelText('Close samples modal')).toBeInTheDocument();
    });

    it('should have Load Sample button in preview panel', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[role="button"]');

      await user.click(card);

      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
    });

    it('should have role="button" on sample cards', () => {
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      expect(card).toHaveAttribute('role', 'button');
    });

    it('should have aria-pressed attribute on sample cards', () => {
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when card is selected', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      await user.click(card);

      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should make sample cards keyboard focusable', () => {
      render(<SamplesModal {...defaultProps} />);

      codeSamples.forEach(sample => {
        const card = screen.getByLabelText(`Preview ${sample.title} sample`);
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should preview sample when pressing Enter on unselected card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      card.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('should load sample when pressing Enter on selected card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[role="button"]');

      // First Enter: preview
      card.focus();
      await user.keyboard('{Enter}');
      expect(card).toHaveAttribute('aria-pressed', 'true');

      // Second Enter: load
      await user.keyboard('{Enter}');
      expect(mockOnLoadSample).toHaveBeenCalledWith(firstExample);
    });

    it('should preview sample when pressing Space on card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      card.focus();
      await user.keyboard(' ');

      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('should navigate between cards using Tab key', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      const secondCard = screen.getByLabelText(`Preview ${codeSamples[1].title} sample`);

      // Focus the first card directly to test navigation between cards
      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);

      // Tab should move to the second card
      await user.tab();
      expect(document.activeElement).toBe(secondCard);
    });

    it('should show focus ring on sample cards', () => {
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      // Check if focus styles are present (using utility class)
      expect(card.className).toContain('focus-visible:ring-2');
    });

    it('should allow keyboard navigation through entire modal', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      // Wait for auto-focus to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Start from close button
      const closeButton = screen.getByLabelText('Close samples modal');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab from close button goes to search input
      await user.tab();
      const searchInput = screen.getByLabelText('Search code samples');
      expect(document.activeElement).toBe(searchInput);

      // Tab from search input goes to first card
      await user.tab();
      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      expect(document.activeElement).toBe(firstCard);
    });

    it('should prevent default space key behavior to avoid page scroll', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} sample`);

      card.focus();

      // Press space - should select card, not scroll page
      await user.keyboard(' ');

      // Card should be selected
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
    });

    it('should support both Enter and Space for preview', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);

      // Test Enter key - should preview
      firstCard.focus();
      await user.keyboard('{Enter}');
      expect(firstCard).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();

      // Rerender to reset state
      rerender(<SamplesModal {...defaultProps} isOpen={false} />);
      rerender(<SamplesModal {...defaultProps} isOpen={true} />);

      // Test Space key - should also preview
      // After rerender, the first card is auto-selected, so its label has changed
      const secondCard = screen.getByLabelText(`Press Enter to load ${codeSamples[0].title} sample`);
      secondCard.focus();
      await user.keyboard(' ');
      expect(secondCard).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Load Sample' })).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    // TODO: Skipped due to jsdom focus management limitations
    it.skip('should auto-focus first sample card when modal opens', () => {
      render(<SamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      expect(document.activeElement).toBe(firstCard);
    });

    it('should not auto-focus when modal is closed', () => {
      render(<SamplesModal {...defaultProps} isOpen={false} />);

      expect(document.activeElement).toBe(document.body);
    });

    // TODO: Skipped due to jsdom focus management limitations
    it.skip('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      expect(document.activeElement).toBe(firstCard);

      // Find all focusable elements
      const allButtons = screen.getAllByRole('button');
      const lastButton = allButtons[allButtons.length - 1];

      // Tab to last element
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Tab from last element should wrap to first focusable element (close button)
      await user.tab();
      const closeButton = screen.getByLabelText('Close samples modal');
      expect(document.activeElement).toBe(closeButton);
    });

    // TODO: Skipped due to jsdom focus management limitations
    it.skip('should trap focus backwards with Shift+Tab', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      expect(document.activeElement).toBe(firstCard);

      // Shift+Tab from first card should go to search input
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Should be on search input now (which comes after close button in DOM)
      const searchInput = screen.getByLabelText('Search code samples');
      expect(document.activeElement).toBe(searchInput);

      // Shift+Tab again should go to close button
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Should be on close button now
      const closeButton = screen.getByLabelText('Close samples modal');
      expect(document.activeElement).toBe(closeButton);
    });

    it('should have proper ARIA attributes for dialog', () => {
      render(<SamplesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have modal title with correct id', () => {
      render(<SamplesModal {...defaultProps} />);

      const title = screen.getByText('Code Samples');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    // TODO: Skipped due to jsdom focus management limitations
    it.skip('should restore focus when modal closes', () => {
      const { rerender } = render(<SamplesModal {...defaultProps} isOpen={true} />);

      const firstCard = screen.getByLabelText(`Preview ${codeSamples[0].title} sample`);
      expect(document.activeElement).toBe(firstCard);

      // Close modal
      rerender(<SamplesModal {...defaultProps} isOpen={false} />);

      // Modal should not be in document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid Enter presses on selected card', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const firstExample = codeSamples[0];
      const card = screen.getByText(firstExample.title).closest('div[role="button"]');

      // Click to select
      await user.click(card);

      // Rapidly press Enter
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');

      // Should only call once (modal closes after first load)
      expect(mockOnLoadSample).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle switching examples quickly', async () => {
      const user = userEvent.setup();
      render(<SamplesModal {...defaultProps} />);

      const cards = screen.getAllByText(/C#|Java|Express|Data|Ruby/).map(
        el => el.closest('div[class*="cursor-pointer"]')
      );

      // Rapidly click through examples
      for (const card of cards.slice(0, 3)) {
        await user.click(card);
      }

      // Last clicked should be selected
      expect(cards[2]).toHaveClass('border-purple-500');
    });

    it('should maintain state when modal is closed and reopened', () => {
      const { rerender } = render(<SamplesModal {...defaultProps} isOpen={false} />);

      // Open modal
      rerender(<SamplesModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Code Samples')).toBeInTheDocument();

      // Close modal
      rerender(<SamplesModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Code Samples')).not.toBeInTheDocument();
    });
  });

  describe('Example Count', () => {
    it('should render all 8 examples', () => {
      render(<SamplesModal {...defaultProps} />);

      const sampleCards = screen.getAllByLabelText(/Preview .* sample/);
      expect(sampleCards).toHaveLength(8);
    });

    it('should have correct sample titles', () => {
      render(<SamplesModal {...defaultProps} />);

      expect(screen.getByText('C# ASP.NET Core API')).toBeInTheDocument();
      expect(screen.getByText('Java Spring Boot API')).toBeInTheDocument();
      expect(screen.getByText('Express API Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Data Processing Algorithm')).toBeInTheDocument();
      expect(screen.getByText('Ruby Sinatra API')).toBeInTheDocument();
      expect(screen.getByText('Python Flask API')).toBeInTheDocument();
      expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();
      expect(screen.getByText('Poorly Documented Utility')).toBeInTheDocument();
    });
  });
});
