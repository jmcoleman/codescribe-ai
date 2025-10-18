import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Confirmation',
    message: 'Are you sure?'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationModal {...defaultProps} />);
      expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Test Confirmation')).not.toBeInTheDocument();
    });

    it('should render with custom button labels', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          confirmLabel="Yes, proceed"
          cancelLabel="No, go back"
        />
      );
      expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
      expect(screen.getByText('No, go back')).toBeInTheDocument();
    });

    it('should render with default button labels', () => {
      render(<ConfirmationModal {...defaultProps} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render with JSX message content', () => {
      const message = (
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      );
      render(<ConfirmationModal {...defaultProps} message={message} />);
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render warning variant by default', () => {
      render(<ConfirmationModal {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-purple-600');
    });

    it('should render danger variant', () => {
      render(
        <ConfirmationModal {...defaultProps} variant="danger" />
      );
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('should render info variant', () => {
      render(
        <ConfirmationModal {...defaultProps} variant="info" />
      );
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-indigo-600');
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm and onClose when confirm button is clicked', async () => {
      render(<ConfirmationModal {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close confirmation modal');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} />);
      const backdrop = container.querySelector('[role="dialog"]');
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should not call onClose when modal content is clicked', () => {
      render(<ConfirmationModal {...defaultProps} />);
      const title = screen.getByText('Test Confirmation');
      fireEvent.click(title);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<ConfirmationModal {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConfirmationModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirmation-modal-description');
    });

    it('should focus cancel button on open', async () => {
      render(<ConfirmationModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');

      await waitFor(() => {
        expect(cancelButton).toHaveFocus();
      });
    });

    it('should have accessible button labels', () => {
      render(<ConfirmationModal {...defaultProps} />);
      expect(screen.getByLabelText('Close confirmation modal')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should focus cancel button on open', async () => {
      render(<ConfirmationModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');

      // Focus should be on cancel button initially
      await waitFor(() => {
        expect(cancelButton).toHaveFocus();
      });
    });

    it('should have focusable elements in the modal', () => {
      render(<ConfirmationModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm');
      const closeButton = screen.getByLabelText('Close confirmation modal');

      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<ConfirmationModal {...defaultProps} message="" />);
      expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(<ConfirmationModal {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
      const confirmButton = screen.getByText('Confirm');

      // Click button twice rapidly (before modal has chance to close)
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      // Both clicks register because React batches updates
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should clean up event listeners when closed', () => {
      const { rerender } = render(<ConfirmationModal {...defaultProps} />);

      // Close the modal
      rerender(<ConfirmationModal {...defaultProps} isOpen={false} />);

      // Escape key should not trigger anything
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});
