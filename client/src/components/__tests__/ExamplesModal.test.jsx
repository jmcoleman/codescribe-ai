import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { ExamplesModal } from '../ExamplesModal';
import { codeExamples } from '../../data/examples';

describe('ExamplesModal', () => {
  const mockOnClose = vi.fn();
  const mockOnLoadExample = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onLoadExample: mockOnLoadExample,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ExamplesModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Code Examples')).not.toBeInTheDocument();
    });

    it('should render modal header when isOpen is true', () => {
      render(<ExamplesModal {...defaultProps} />);
      expect(screen.getByText('Code Examples')).toBeInTheDocument();
    });

    it('should render all code examples', () => {
      render(<ExamplesModal {...defaultProps} />);

      codeExamples.forEach(example => {
        expect(screen.getByText(example.title)).toBeInTheDocument();
      });
    });

    it('should render example descriptions', () => {
      render(<ExamplesModal {...defaultProps} />);

      codeExamples.forEach(example => {
        expect(screen.getByText(example.description)).toBeInTheDocument();
      });
    });

    it('should render docType badges for all examples', () => {
      render(<ExamplesModal {...defaultProps} />);

      const docTypeBadges = screen.getAllByText(/README|JSDOC|API/);
      expect(docTypeBadges.length).toBeGreaterThanOrEqual(codeExamples.length);
    });

    it('should render instruction text', () => {
      render(<ExamplesModal {...defaultProps} />);
      expect(screen.getByText(/Click a card to preview/)).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ExamplesModal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close examples modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render empty state for preview panel initially', () => {
      render(<ExamplesModal {...defaultProps} />);
      expect(screen.getByText('Select an example to preview')).toBeInTheDocument();
    });
  });

  describe('Example Card Interactions', () => {
    it('should preview example when clicking on card', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Preview should show "Load This Example" button and code
      expect(screen.getByText('Load This Example')).toBeInTheDocument();

      // Code should be visible
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('calculateDiscount');
      });
      expect(codeBlock).toBeInTheDocument();
    });

    it('should show selected state when example is selected', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Card should have selected styling (purple border)
      expect(card).toHaveClass('border-purple-500');
      expect(card).toHaveClass('bg-purple-50');
    });

    it('should switch between examples when clicking different cards', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const secondExample = codeExamples[1];

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

    it('should load example when clicking load button (chevron)', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];

      // Find the load button (ChevronRight) for the first example
      const loadButtons = screen.getAllByLabelText(/Load .* example/);
      await user.click(loadButtons[0]);

      expect(mockOnLoadExample).toHaveBeenCalledWith(firstExample);
      expect(mockOnLoadExample).toHaveBeenCalledTimes(1);
    });

    it('should close modal after loading example', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const loadButtons = screen.getAllByLabelText(/Load .* example/);
      await user.click(loadButtons[0]);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not trigger preview when clicking load button', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      // Verify card is not selected initially (no preview loaded)
      expect(card).not.toHaveClass('border-purple-500');
      expect(card).not.toHaveClass('bg-purple-50');

      // Click load button
      const loadButtons = screen.getAllByLabelText(/Load .* example/);
      await user.click(loadButtons[0]);

      // Card should still not have selected styling (load button was clicked directly, not preview)
      expect(card).not.toHaveClass('border-purple-500');
    });
  });

  describe('Preview Panel', () => {
    it('should display example code in preview panel', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Check if code is displayed (using partial match since it's in a code block)
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('calculateDiscount');
      });
      expect(codeBlock).toBeInTheDocument();
    });

    it('should display "Load This Example" button in preview panel', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      expect(screen.getByText('Load This Example')).toBeInTheDocument();
    });

    it('should load example when clicking "Load This Example" button', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      const loadButton = screen.getByText('Load This Example');
      await user.click(loadButton);

      expect(mockOnLoadExample).toHaveBeenCalledWith(firstExample);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should focus on code in preview panel', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByText(firstExample.title).closest('div[class*="cursor-pointer"]');

      await user.click(card);

      // Preview should show code immediately with Load button
      expect(screen.getByText('Load This Example')).toBeInTheDocument();

      // Code should be visible in preview
      const codeBlock = screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'code' && content.includes('calculateDiscount');
      });
      expect(codeBlock).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close examples modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when pressing Escape key', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for load buttons', () => {
      render(<ExamplesModal {...defaultProps} />);

      codeExamples.forEach(example => {
        expect(screen.getByLabelText(`Load ${example.title} example`)).toBeInTheDocument();
      });
    });

    it('should have proper aria label for close button', () => {
      render(<ExamplesModal {...defaultProps} />);
      expect(screen.getByLabelText('Close examples modal')).toBeInTheDocument();
    });

    it('should have title attributes for button tooltips', () => {
      render(<ExamplesModal {...defaultProps} />);

      const loadButtons = screen.getAllByTitle('Load into editor');
      expect(loadButtons.length).toBe(codeExamples.length);
    });

    it('should have proper aria labels for example cards', () => {
      render(<ExamplesModal {...defaultProps} />);

      codeExamples.forEach(example => {
        expect(screen.getByLabelText(`Preview ${example.title} example`)).toBeInTheDocument();
      });
    });

    it('should have role="button" on example cards', () => {
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      expect(card).toHaveAttribute('role', 'button');
    });

    it('should have aria-pressed attribute on example cards', () => {
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      expect(card).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed when card is selected', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      await user.click(card);

      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should make example cards keyboard focusable', () => {
      render(<ExamplesModal {...defaultProps} />);

      codeExamples.forEach(example => {
        const card = screen.getByLabelText(`Preview ${example.title} example`);
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should preview example when pressing Enter on card', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      card.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Load This Example')).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('should preview example when pressing Space on card', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      card.focus();
      await user.keyboard(' ');

      expect(screen.getByText('Load This Example')).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('should navigate between cards using Tab key', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      const secondCard = screen.getByLabelText(`Preview ${codeExamples[1].title} example`);

      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);

      // Tab to next element (should be the load button for first card, then second card)
      await user.tab();
      await user.tab();

      expect(document.activeElement).toBe(secondCard);
    });

    it('should show focus ring on example cards', () => {
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      // Check if focus styles are present
      expect(card.className).toContain('focus:outline-none');
      expect(card.className).toContain('focus:ring-2');
      expect(card.className).toContain('focus:ring-purple-600');
    });

    it('should allow keyboard navigation through entire modal', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      // Start from close button
      const closeButton = screen.getByLabelText('Close examples modal');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab through cards
      await user.tab();
      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      expect(document.activeElement).toBe(firstCard);
    });

    it('should prevent default space key behavior to avoid page scroll', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstExample = codeExamples[0];
      const card = screen.getByLabelText(`Preview ${firstExample.title} example`);

      card.focus();

      // Press space - should select card, not scroll page
      await user.keyboard(' ');

      // Card should be selected
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Load This Example')).toBeInTheDocument();
    });

    it('should support both Enter and Space consistently', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ExamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);

      // Test Enter key
      firstCard.focus();
      await user.keyboard('{Enter}');
      expect(firstCard).toHaveAttribute('aria-pressed', 'true');

      // Rerender to reset state
      rerender(<ExamplesModal {...defaultProps} isOpen={false} />);
      rerender(<ExamplesModal {...defaultProps} isOpen={true} />);

      // Test Space key
      const secondCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      secondCard.focus();
      await user.keyboard(' ');
      expect(secondCard).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Focus Management', () => {
    it('should auto-focus first example card when modal opens', () => {
      render(<ExamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      expect(document.activeElement).toBe(firstCard);
    });

    it('should not auto-focus when modal is closed', () => {
      render(<ExamplesModal {...defaultProps} isOpen={false} />);

      expect(document.activeElement).toBe(document.body);
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      expect(document.activeElement).toBe(firstCard);

      // Find all focusable elements
      const allButtons = screen.getAllByRole('button');
      const lastButton = allButtons[allButtons.length - 1];

      // Tab to last element
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Tab from last element should wrap to first focusable (close button)
      await user.tab();
      const closeButton = screen.getByLabelText('Close examples modal');
      expect(document.activeElement).toBe(closeButton);
    });

    it('should trap focus backwards with Shift+Tab', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      expect(document.activeElement).toBe(firstCard);

      // Shift+Tab from first card should go to close button
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Should be on close button now
      const closeButton = screen.getByLabelText('Close examples modal');
      expect(document.activeElement).toBe(closeButton);

      // Shift+Tab again should wrap to last focusable element
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Should be on the last focusable element now
      const allButtons = screen.getAllByRole('button');
      const lastButton = allButtons[allButtons.length - 1];
      expect(document.activeElement).toBe(lastButton);
    });

    it('should have proper ARIA attributes for dialog', () => {
      render(<ExamplesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have modal title with correct id', () => {
      render(<ExamplesModal {...defaultProps} />);

      const title = screen.getByText('Code Examples');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should restore focus when modal closes', () => {
      const { rerender } = render(<ExamplesModal {...defaultProps} isOpen={true} />);

      const firstCard = screen.getByLabelText(`Preview ${codeExamples[0].title} example`);
      expect(document.activeElement).toBe(firstCard);

      // Close modal
      rerender(<ExamplesModal {...defaultProps} isOpen={false} />);

      // Modal should not be in document
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking on load buttons', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const loadButtons = screen.getAllByLabelText(/Load .* example/);

      // Click multiple times rapidly
      await user.click(loadButtons[0]);
      await user.click(loadButtons[0]);
      await user.click(loadButtons[0]);

      // Should only call once (or handle multiple calls gracefully)
      expect(mockOnLoadExample).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle switching examples quickly', async () => {
      const user = userEvent.setup();
      render(<ExamplesModal {...defaultProps} />);

      const cards = screen.getAllByText(/Simple|React|Express|Data|TypeScript/).map(
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
      const { rerender } = render(<ExamplesModal {...defaultProps} isOpen={false} />);

      // Open modal
      rerender(<ExamplesModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Code Examples')).toBeInTheDocument();

      // Close modal
      rerender(<ExamplesModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Code Examples')).not.toBeInTheDocument();
    });
  });

  describe('Example Count', () => {
    it('should render all 7 examples', () => {
      render(<ExamplesModal {...defaultProps} />);

      const exampleCards = screen.getAllByLabelText(/Load .* example/);
      expect(exampleCards).toHaveLength(7);
    });

    it('should have correct example titles', () => {
      render(<ExamplesModal {...defaultProps} />);

      expect(screen.getByText('Simple Utility Function')).toBeInTheDocument();
      expect(screen.getByText('React Component')).toBeInTheDocument();
      expect(screen.getByText('Express API Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Data Processing Algorithm')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Service Class')).toBeInTheDocument();
      expect(screen.getByText('Python Flask API')).toBeInTheDocument();
      expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();
    });
  });
});
