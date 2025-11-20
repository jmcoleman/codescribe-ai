/**
 * Tests for SaveDocsConsentModal Component
 *
 * Tests the consent modal for saving generated documentation including:
 * - All 4 choice buttons trigger correct callbacks
 * - Modal visibility and accessibility
 * - Keyboard navigation (ESC to close)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveDocsConsentModal } from '../SaveDocsConsentModal';

describe('SaveDocsConsentModal', () => {
  const mockOnChoice = vi.fn();

  describe('Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<SaveDocsConsentModal isOpen={false} onChoice={mockOnChoice} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Save Generated Documentation?')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display privacy information', () => {
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      // Privacy note
      expect(screen.getByText(/Privacy Note/i)).toBeInTheDocument();
      expect(screen.getByText(/We never store your code/i)).toBeInTheDocument();

      // What we save
      expect(screen.getByText(/What we save:/i)).toBeInTheDocument();
      expect(screen.getByText(/Generated documentation text/i)).toBeInTheDocument();
      expect(screen.getByText(/Quality scores and feedback/i)).toBeInTheDocument();

      // What we don't save
      expect(screen.getByText(/What we DON'T save:/i)).toBeInTheDocument();
      expect(screen.getByText(/Your source code/i)).toBeInTheDocument();
    });
  });

  describe('User Choices', () => {
    it('should call onChoice with "always" when Always Save is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const alwaysSaveBtn = screen.getByRole('button', { name: /Always Save/i });
      await user.click(alwaysSaveBtn);

      expect(mockOnChoice).toHaveBeenCalledWith('always');
    });

    it('should call onChoice with "once" when Save This Time is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const saveOnceBtn = screen.getByRole('button', { name: /Save This Time/i });
      await user.click(saveOnceBtn);

      expect(mockOnChoice).toHaveBeenCalledWith('once');
    });

    it('should call onChoice with "never" when Never Save is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const neverSaveBtn = screen.getByRole('button', { name: /Never Save/i });
      await user.click(neverSaveBtn);

      expect(mockOnChoice).toHaveBeenCalledWith('never');
    });

    it('should call onChoice with "cancel" when Not Now is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const cancelBtn = screen.getByRole('button', { name: /Not Now/i });
      await user.click(cancelBtn);

      expect(mockOnChoice).toHaveBeenCalledWith('cancel');
    });

    it('should call onChoice with "cancel" when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const closeBtn = screen.getByRole('button', { name: /Close modal/i });
      await user.click(closeBtn);

      expect(mockOnChoice).toHaveBeenCalledWith('cancel');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onChoice with "cancel" when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      await user.keyboard('{Escape}');

      expect(mockOnChoice).toHaveBeenCalledWith('cancel');
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'save-docs-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'save-docs-modal-description');
    });

    it('should have all action buttons', () => {
      render(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      expect(screen.getByRole('button', { name: /Always Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save This Time/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Never Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Not Now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Close modal/i })).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should focus the first button when modal opens', () => {
      const { rerender } = render(<SaveDocsConsentModal isOpen={false} onChoice={mockOnChoice} />);

      rerender(<SaveDocsConsentModal isOpen={true} onChoice={mockOnChoice} />);

      const alwaysSaveBtn = screen.getByRole('button', { name: /Always Save/i });
      expect(alwaysSaveBtn).toHaveFocus();
    });
  });
});
