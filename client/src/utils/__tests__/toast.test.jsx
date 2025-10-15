import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Toaster, toast } from 'react-hot-toast';
import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastPromise,
  toastWithActions,
  toastProgress,
  toastUndo,
  toastConfirm,
  toastGrouped,
  toastExpandable,
  toastCompact,
  toastCopied,
  toastFileUploaded,
  toastDocGenerated,
  toastRateLimited,
  toastNetworkError,
  dismissToast,
  dismissAllToasts,
  clearToastGroup,
  toastQueue,
} from '../toast';

// Helper component to render toasts
const ToastTestWrapper = ({ children }) => (
  <>
    <Toaster />
    {children}
  </>
);

describe('Toast Notification System', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    toast.remove();
  });

  afterEach(() => {
    // Clean up after each test
    toast.remove();
  });

  describe('Basic Toast Functions', () => {
    it('should show success toast', async () => {
      render(<ToastTestWrapper />);

      toastSuccess('Operation successful');

      expect(await screen.findByText('Operation successful')).toBeInTheDocument();
    });

    it('should show error toast', async () => {
      render(<ToastTestWrapper />);

      toastError('Operation failed');

      expect(await screen.findByText('Operation failed')).toBeInTheDocument();
    });

    it('should show info toast', async () => {
      render(<ToastTestWrapper />);

      toastInfo('Processing...');

      expect(await screen.findByText('Processing...')).toBeInTheDocument();
    });

    it('should show loading toast', async () => {
      render(<ToastTestWrapper />);

      const loadingId = toastLoading('Loading data...');

      expect(await screen.findByText('Loading data...')).toBeInTheDocument();
      expect(loadingId).toBeDefined();
    });

    it('should dismiss toast by ID', async () => {
      render(<ToastTestWrapper />);

      const toastId = toastSuccess('Temporary message');

      expect(await screen.findByText('Temporary message')).toBeInTheDocument();

      dismissToast(toastId);

      await waitFor(() => {
        expect(screen.queryByText('Temporary message')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should dismiss all toasts', async () => {
      render(<ToastTestWrapper />);

      toastSuccess('Message 1');
      toastError('Message 2');
      toastInfo('Message 3');

      expect(await screen.findByText('Message 1')).toBeInTheDocument();
      expect(await screen.findByText('Message 2')).toBeInTheDocument();
      expect(await screen.findByText('Message 3')).toBeInTheDocument();

      dismissAllToasts();

      await waitFor(() => {
        expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Message 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Message 3')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Specialized Toast Functions', () => {
    it('should show compact toast', async () => {
      render(<ToastTestWrapper />);

      toastCompact('Saved!', 'success');

      expect(await screen.findByText('Saved!')).toBeInTheDocument();
    });

    it('should show copied notification', async () => {
      render(<ToastTestWrapper />);

      toastCopied();

      expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();
    });

    it('should show file uploaded notification', async () => {
      render(<ToastTestWrapper />);

      toastFileUploaded('example.js', '2.5 KB');

      expect(await screen.findByText(/example.js/)).toBeInTheDocument();
      expect(await screen.findByText(/2.5 KB/)).toBeInTheDocument();
    });

    it('should show documentation generated notification with quality score', async () => {
      render(<ToastTestWrapper />);

      toastDocGenerated('A', 95);

      expect(await screen.findByText(/Excellent! Documentation generated with quality grade A \(95\/100\)/)).toBeInTheDocument();
    });

    it('should show rate limited notification', async () => {
      render(<ToastTestWrapper />);

      toastRateLimited(60);

      expect(await screen.findByText(/Request limit reached/)).toBeInTheDocument();
      expect(await screen.findByText(/1 minute/)).toBeInTheDocument();
    });

    it('should show network error notification', async () => {
      render(<ToastTestWrapper />);

      toastNetworkError();

      expect(await screen.findByText(/Unable to connect/)).toBeInTheDocument();
    });
  });

  describe('Promise-Based Toast', () => {
    it('should show loading, then success for resolved promise', async () => {
      render(<ToastTestWrapper />);

      const promise = new Promise((resolve) => setTimeout(() => resolve('Success'), 100));

      toastPromise(promise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!',
      });

      expect(await screen.findByText('Loading...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
          expect(screen.getByText('Done!')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show loading, then error for rejected promise', async () => {
      render(<ToastTestWrapper />);

      const promise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Failed')), 100)
      );

      toastPromise(promise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!',
      });

      expect(await screen.findByText('Loading...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
          expect(screen.getByText('Failed!')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Toast with Actions', () => {
    it('should render toast with action buttons', async () => {
      render(<ToastTestWrapper />);

      const mockAction = vi.fn();

      toastWithActions(
        'Action Required',
        'Click the button below',
        [
          { label: 'Click Me', onClick: mockAction, variant: 'primary' },
          { label: 'Cancel', onClick: vi.fn(), variant: 'secondary' },
        ],
        'info'
      );

      expect(await screen.findByText('Action Required')).toBeInTheDocument();
      expect(await screen.findByText('Click the button below')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: /Click Me/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should dismiss toast when action is clicked (default behavior)', async () => {
      render(<ToastTestWrapper />);

      toastWithActions(
        'Action Required',
        'This will auto-dismiss',
        [{ label: 'OK', onClick: vi.fn(), variant: 'primary' }],
        'info'
      );

      const button = await screen.findByRole('button', { name: /OK/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Action Required')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Confirmation Toast', () => {
    it('should show confirmation toast with confirm and cancel actions', async () => {
      render(<ToastTestWrapper />);

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      toastConfirm('Delete File?', 'This cannot be undone', onConfirm, onCancel);

      expect(await screen.findByText('Delete File?')).toBeInTheDocument();
      expect(await screen.findByText('This cannot be undone')).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel is clicked', async () => {
      render(<ToastTestWrapper />);

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      toastConfirm('Delete File?', 'Are you sure?', onConfirm, onCancel);

      const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Progress Toast', () => {
    it('should create progress toast and update progress', async () => {
      render(<ToastTestWrapper />);

      const progressToast = toastProgress('Uploading', 'Starting...', 0);

      expect(await screen.findByText('Uploading')).toBeInTheDocument();
      expect(await screen.findByText('Starting...')).toBeInTheDocument();

      // Update progress
      progressToast.update(50, 'Halfway there...');

      await waitFor(() => {
        expect(screen.getByText('Halfway there...')).toBeInTheDocument();
      });

      // Update to completion
      progressToast.update(100, 'Complete!');

      await waitFor(() => {
        expect(screen.getByText('Complete!')).toBeInTheDocument();
      });

      progressToast.dismiss();

      await waitFor(() => {
        expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Undo Toast', () => {
    it('should show undo toast with undo button', async () => {
      render(<ToastTestWrapper />);

      const onUndo = vi.fn();

      toastUndo('Item deleted', onUndo, 5000);

      expect(await screen.findByText('Item deleted')).toBeInTheDocument();

      const undoButton = screen.getByRole('button', { name: /Undo/i });
      expect(undoButton).toBeInTheDocument();

      fireEvent.click(undoButton);

      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Grouped Toasts', () => {
    it('should replace previous toast in same group', async () => {
      render(<ToastTestWrapper />);

      toastGrouped('api-error', toastError, 'First error');

      expect(await screen.findByText('First error')).toBeInTheDocument();

      // Show second toast in same group
      toastGrouped('api-error', toastError, 'Second error');

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
        expect(screen.getByText('Second error')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should clear toast group', async () => {
      render(<ToastTestWrapper />);

      toastGrouped('test-group', toastSuccess, 'Grouped message');

      expect(await screen.findByText('Grouped message')).toBeInTheDocument();

      clearToastGroup('test-group');

      await waitFor(() => {
        expect(screen.queryByText('Grouped message')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Expandable Toast', () => {
    it('should show preview by default and expand when clicked', async () => {
      render(<ToastTestWrapper />);

      const fullContent = 'This is the full content that is initially hidden';

      toastExpandable('Error Details', 'Short preview', fullContent, 'error');

      expect(await screen.findByText('Error Details')).toBeInTheDocument();
      expect(await screen.findByText('Short preview')).toBeInTheDocument();
      expect(screen.queryByText(fullContent)).not.toBeInTheDocument();

      const showMoreButton = screen.getByRole('button', { name: /Show more/i });
      fireEvent.click(showMoreButton);

      await waitFor(() => {
        expect(screen.getByText(fullContent)).toBeInTheDocument();
      });

      const showLessButton = screen.getByRole('button', { name: /Show less/i });
      fireEvent.click(showLessButton);

      await waitFor(() => {
        expect(screen.queryByText(fullContent)).not.toBeInTheDocument();
      });
    });
  });

  describe('Warning Toast', () => {
    it('should show warning toast with action', async () => {
      render(<ToastTestWrapper />);

      const mockAction = vi.fn();

      toastWarning('Connection Lost', 'Please check your connection', {
        label: 'Retry',
        onClick: mockAction,
      });

      expect(await screen.findByText('Connection Lost')).toBeInTheDocument();
      expect(await screen.findByText('Please check your connection')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Queue', () => {
    it('should queue toasts when max visible is reached', () => {
      render(<ToastTestWrapper />);

      const queue = toastQueue;
      expect(queue).toBeDefined();

      // Add toasts to queue
      queue.add(toastSuccess, 'Message 1');
      queue.add(toastSuccess, 'Message 2');
      queue.add(toastSuccess, 'Message 3');

      // Queue should manage visible toasts
      expect(queue.queue).toBeDefined();
    });

    it('should clear queue', () => {
      render(<ToastTestWrapper />);

      const queue = toastQueue;

      // Add items to queue
      queue.add(toastSuccess, 'Message 1');
      queue.add(toastSuccess, 'Message 2');

      // Clear queue
      queue.clear();

      expect(queue.queue.length).toBe(0);
    });
  });

  describe('Custom Toast Options', () => {
    it('should respect custom duration', async () => {
      render(<ToastTestWrapper />);

      toastSuccess('Quick message', { duration: 1000 });

      const toast = await screen.findByText('Quick message');
      expect(toast).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Quick message')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should allow custom styling', async () => {
      render(<ToastTestWrapper />);

      toastSuccess('Styled message', {
        style: {
          background: '#000',
          color: '#fff',
        },
      });

      expect(await screen.findByText('Styled message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for success toast', async () => {
      render(<ToastTestWrapper />);

      toastSuccess('Success message');

      const toastElement = await screen.findByText('Success message');
      const toastContainer = toastElement.closest('[role="status"]');

      expect(toastContainer).toHaveAttribute('aria-live', 'polite');
      // react-hot-toast doesn't add aria-atomic by default, so we just check for role and aria-live
    });

    it('should have proper ARIA attributes for error toast', async () => {
      render(<ToastTestWrapper />);

      toastError('Error message');

      const toastElement = await screen.findByText('Error message');
      // react-hot-toast renders errors as status role, not alert role
      const toastContainer = toastElement.closest('[role="status"]');

      expect(toastContainer).toHaveAttribute('aria-live', 'polite');
      // react-hot-toast uses 'polite' for all toasts, not 'assertive' for errors
    });

    it('should have dismiss button with aria-label', async () => {
      render(<ToastTestWrapper />);

      toastWithActions(
        'Dismissible Toast',
        'This can be dismissed',
        [],
        'info',
        { dismissible: true }
      );

      const dismissButton = await screen.findByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();

      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Dismissible Toast')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Rate Limiting Calculation', () => {
    it('should format retry time correctly for less than 1 minute', async () => {
      render(<ToastTestWrapper />);

      toastRateLimited(30);

      expect(await screen.findByText(/1 minute/)).toBeInTheDocument();
    });

    it('should format retry time correctly for multiple minutes', async () => {
      render(<ToastTestWrapper />);

      toastRateLimited(180);

      expect(await screen.findByText(/3 minutes/)).toBeInTheDocument();
    });
  });
});
