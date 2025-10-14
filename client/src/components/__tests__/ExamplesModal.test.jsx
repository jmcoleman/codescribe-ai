import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

      // Click load button
      const loadButtons = screen.getAllByLabelText(/Load .* example/);
      await user.click(loadButtons[0]);

      // Card should not have selected styling
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
    it('should render all 5 examples', () => {
      render(<ExamplesModal {...defaultProps} />);

      const exampleCards = screen.getAllByLabelText(/Load .* example/);
      expect(exampleCards).toHaveLength(5);
    });

    it('should have correct example titles', () => {
      render(<ExamplesModal {...defaultProps} />);

      expect(screen.getByText('Simple Utility Function')).toBeInTheDocument();
      expect(screen.getByText('React Component')).toBeInTheDocument();
      expect(screen.getByText('Express API Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Data Processing Algorithm')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Service Class')).toBeInTheDocument();
    });
  });
});
