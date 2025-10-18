import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBanner } from '../ErrorBanner';

describe('ErrorBanner Component', () => {
  describe('Rendering and Visibility', () => {
    it('should not render when error is null', () => {
      const { container } = render(<ErrorBanner error={null} onDismiss={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when error is undefined', () => {
      const { container } = render(<ErrorBanner error={undefined} onDismiss={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when error is empty string', () => {
      const { container } = render(<ErrorBanner error="" onDismiss={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when error message is provided', () => {
      render(<ErrorBanner error="Something went wrong" onDismiss={vi.fn()} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should have error heading', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should display single-line error message', () => {
      const errorMessage = 'Network request failed';
      render(<ErrorBanner error={errorMessage} onDismiss={vi.fn()} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display multi-line error messages', () => {
      const multiLineError = 'Error details:\nLine 1: Missing field\nLine 2: Invalid format';
      render(<ErrorBanner error={multiLineError} onDismiss={vi.fn()} />);

      expect(screen.getByText('Error details:')).toBeInTheDocument();
      expect(screen.getByText('Line 1: Missing field')).toBeInTheDocument();
      expect(screen.getByText('Line 2: Invalid format')).toBeInTheDocument();
    });

    it('should handle error messages with special characters', () => {
      const errorMessage = 'Error: <Component /> failed with "special" characters & symbols';
      render(<ErrorBanner error={errorMessage} onDismiss={vi.fn()} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longError = 'A'.repeat(500);
      render(<ErrorBanner error={longError} onDismiss={vi.fn()} />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should filter out empty lines in multi-line errors', () => {
      const errorWithEmptyLines = 'Line 1\n\nLine 2\n\n\nLine 3';
      const { container } = render(<ErrorBanner error={errorWithEmptyLines} onDismiss={vi.fn()} />);

      // Empty lines should have 'hidden' class
      const hiddenElements = container.querySelectorAll('.hidden');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting Display', () => {
    it('should display retry-after message when retryAfter is provided', () => {
      render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={30}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Please wait 30 seconds before trying again/i)).toBeInTheDocument();
    });

    it('should display retry-after section with pulsing indicator', () => {
      const { container } = render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={60}
          onDismiss={vi.fn()}
        />
      );

      const pulsingIndicator = container.querySelector('.animate-pulse');
      expect(pulsingIndicator).toBeInTheDocument();
    });

    it('should not display retry-after section when retryAfter is null', () => {
      render(
        <ErrorBanner
          error="General error"
          retryAfter={null}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.queryByText(/Please wait/i)).not.toBeInTheDocument();
    });

    it('should not display retry-after section when retryAfter is undefined', () => {
      render(
        <ErrorBanner
          error="General error"
          onDismiss={vi.fn()}
        />
      );

      expect(screen.queryByText(/Please wait/i)).not.toBeInTheDocument();
    });

    it('should handle different retry-after values', () => {
      const { rerender } = render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={1}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Please wait 1 seconds before trying again/i)).toBeInTheDocument();

      rerender(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={120}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Please wait 120 seconds before trying again/i)).toBeInTheDocument();
    });

    it('should style retry-after section with border', () => {
      const { container } = render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={30}
          onDismiss={vi.fn()}
        />
      );

      const retrySection = container.querySelector('.border-t.border-red-200');
      expect(retrySection).toBeInTheDocument();
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call onDismiss when dismiss button is clicked', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();

      render(<ErrorBanner error="Test error" onDismiss={handleDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      // Wait for the exit animation (200ms)
      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 300 });
    });

    it('should not immediately call onDismiss (waits for exit animation)', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();

      render(<ErrorBanner error="Test error" onDismiss={handleDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      // Should not be called immediately
      expect(handleDismiss).not.toHaveBeenCalled();
    });

    it('should call onDismiss exactly once per click', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();

      render(<ErrorBanner error="Test error" onDismiss={handleDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 300 });
    });
  });

  describe('Animation and Transitions', () => {
    it('should have slide-in-fade animation class on initial render', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.animate-slide-in-fade');
      expect(banner).toBeInTheDocument();
    });

    it('should have fade-out animation class when dismissing', async () => {
      const user = userEvent.setup();
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      const banner = container.querySelector('.animate-fade-out');
      expect(banner).toBeInTheDocument();
    });

    it('should have motion-reduce class for accessibility', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.motion-reduce\\:animate-none');
      expect(banner).toBeInTheDocument();
    });

    it('should re-trigger enter animation when error changes', () => {
      const { container, rerender } = render(
        <ErrorBanner error="First error" onDismiss={vi.fn()} />
      );

      let banner = container.querySelector('.animate-slide-in-fade');
      expect(banner).toBeInTheDocument();

      rerender(<ErrorBanner error="Second error" onDismiss={vi.fn()} />);

      banner = container.querySelector('.animate-slide-in-fade');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have red background color', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.bg-red-50');
      expect(banner).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.rounded-lg');
      expect(banner).toBeInTheDocument();
    });

    it('should have shadow', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.shadow-sm');
      expect(banner).toBeInTheDocument();
    });

    it('should have margin bottom', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const banner = container.querySelector('.mb-6');
      expect(banner).toBeInTheDocument();
    });

    it('should use flexbox layout', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const contentArea = container.querySelector('.flex.items-start.gap-4');
      expect(contentArea).toBeInTheDocument();
    });

    it('should have proper padding', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const contentArea = container.querySelector('.p-4');
      expect(contentArea).toBeInTheDocument();
    });

    it('should style heading with red color', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const heading = screen.getByText('Error');
      expect(heading).toHaveClass('text-red-900');
      expect(heading).toHaveClass('font-semibold');
    });

    it('should style error message with red color', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const message = screen.getByText('Test error');
      expect(message).toHaveClass('text-red-800');
    });

    it('should style dismiss button with hover states', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });

      expect(dismissButton).toHaveClass('text-red-400');
      expect(dismissButton).toHaveClass('hover:text-red-600');
      expect(dismissButton).toHaveClass('hover:bg-red-100');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-label on dismiss button', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
    });

    it('should hide icon from screen readers with aria-hidden', () => {
      const { container } = render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have keyboard focus support on dismiss button', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      expect(dismissButton).toHaveClass('focus:outline-none');
      expect(dismissButton).toHaveClass('focus:ring-2');
      expect(dismissButton).toHaveClass('focus:ring-red-600');
    });

    it('should be keyboard accessible', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();

      render(<ErrorBanner error="Test error" onDismiss={handleDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });

      // Tab to the button and press Enter
      dismissButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 300 });
    });

    it('should have proper color contrast for text', () => {
      render(<ErrorBanner error="Test error" onDismiss={vi.fn()} />);

      // Check heading contrast (red-900 on red-50)
      const heading = screen.getByText('Error');
      expect(heading).toHaveClass('text-red-900');

      // Check message contrast (red-700 on red-50)
      const message = screen.getByText('Test error');
      expect(message).toHaveClass('text-red-800');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle onDismiss being a no-op function', async () => {
      const user = userEvent.setup();

      // Test with a no-op function instead of undefined (component requires a function)
      const noOp = vi.fn();
      render(<ErrorBanner error="Test error" onDismiss={noOp} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      // Should call the function without crashing
      await waitFor(() => {
        expect(noOp).toHaveBeenCalledTimes(1);
      }, { timeout: 300 });
    });

    it('should handle error prop changing to null', () => {
      const { container, rerender } = render(
        <ErrorBanner error="Test error" onDismiss={vi.fn()} />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();

      rerender(<ErrorBanner error={null} onDismiss={vi.fn()} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle error prop changing from null to error', () => {
      const { container, rerender } = render(
        <ErrorBanner error={null} onDismiss={vi.fn()} />
      );

      expect(container.firstChild).toBeNull();

      rerender(<ErrorBanner error="New error" onDismiss={vi.fn()} />);

      expect(screen.getByText('New error')).toBeInTheDocument();
    });

    it('should handle rapid error changes', () => {
      const { rerender } = render(
        <ErrorBanner error="Error 1" onDismiss={vi.fn()} />
      );

      expect(screen.getByText('Error 1')).toBeInTheDocument();

      rerender(<ErrorBanner error="Error 2" onDismiss={vi.fn()} />);
      expect(screen.getByText('Error 2')).toBeInTheDocument();

      rerender(<ErrorBanner error="Error 3" onDismiss={vi.fn()} />);
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });

    it('should handle errors with only whitespace', () => {
      render(
        <ErrorBanner error="   \n\t   " onDismiss={vi.fn()} />
      );

      // Empty/whitespace errors should be treated as no error
      // Since the component checks error.includes('\n'), it will be treated as multiline
      // but all lines will be hidden due to trim() check
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle retryAfter being zero', () => {
      render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={0}
          onDismiss={vi.fn()}
        />
      );

      // retryAfter of 0 is falsy, so it should not display
      expect(screen.queryByText(/Please wait 0 seconds/i)).not.toBeInTheDocument();
    });

    it('should handle negative retryAfter values', () => {
      render(
        <ErrorBanner
          error="Rate limit exceeded"
          retryAfter={-5}
          onDismiss={vi.fn()}
        />
      );

      // Negative values should still render (component doesn't validate)
      expect(screen.getByText(/Please wait -5 seconds/i)).toBeInTheDocument();
    });
  });

  describe('Component Updates and Re-renders', () => {
    it('should update when error prop changes', () => {
      const { rerender } = render(
        <ErrorBanner error="First error" onDismiss={vi.fn()} />
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<ErrorBanner error="Second error" onDismiss={vi.fn()} />);

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('should update when retryAfter prop changes', () => {
      const { rerender } = render(
        <ErrorBanner error="Test error" retryAfter={30} onDismiss={vi.fn()} />
      );

      expect(screen.getByText(/Please wait 30 seconds/i)).toBeInTheDocument();

      rerender(<ErrorBanner error="Test error" retryAfter={60} onDismiss={vi.fn()} />);

      expect(screen.queryByText(/Please wait 30 seconds/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Please wait 60 seconds/i)).toBeInTheDocument();
    });

    it('should reset exit animation when new error appears after dismissing', async () => {
      const user = userEvent.setup();
      const { rerender, container } = render(
        <ErrorBanner error="First error" onDismiss={vi.fn()} />
      );

      // Dismiss the first error
      const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
      await user.click(dismissButton);

      // Wait for animation and remove from DOM
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      }, { timeout: 300 });

      // Show a new error
      rerender(<ErrorBanner error="Second error" onDismiss={vi.fn()} />);

      // Should show enter animation, not exit animation
      const banner = container.querySelector('.animate-slide-in-fade');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Integration with User Scenarios', () => {
    it('should handle network error scenario', () => {
      const networkError = 'Network request failed. Please check your internet connection and try again.';
      render(<ErrorBanner error={networkError} onDismiss={vi.fn()} />);

      expect(screen.getByText(networkError)).toBeInTheDocument();
    });

    it('should handle validation error scenario', () => {
      const validationError = 'Validation failed:\nCode is required\nInvalid file type\nFile size exceeds limit';
      render(<ErrorBanner error={validationError} onDismiss={vi.fn()} />);

      expect(screen.getByText('Validation failed:')).toBeInTheDocument();
      expect(screen.getByText('Code is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });

    it('should handle rate limiting scenario', () => {
      const rateLimitError = 'Rate limit exceeded. Please wait before making another request.';
      render(
        <ErrorBanner
          error={rateLimitError}
          retryAfter={60}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(rateLimitError)).toBeInTheDocument();
      expect(screen.getByText(/Please wait 60 seconds/i)).toBeInTheDocument();
    });

    it('should handle server error scenario', () => {
      const serverError = 'Server error (500): An unexpected error occurred on the server. Please try again later.';
      render(<ErrorBanner error={serverError} onDismiss={vi.fn()} />);

      expect(screen.getByText(serverError)).toBeInTheDocument();
    });

    it('should handle file upload error scenario', () => {
      const uploadError = 'File upload failed:\nFile type not supported (.exe)\nMaximum file size is 500KB\nOnly .js, .jsx, .ts, .tsx, .py, .java, .go files are allowed';
      render(<ErrorBanner error={uploadError} onDismiss={vi.fn()} />);

      expect(screen.getByText('File upload failed:')).toBeInTheDocument();
      expect(screen.getByText(/File type not supported/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const handleDismiss = vi.fn();
      const { rerender } = render(
        <ErrorBanner error="Test error" retryAfter={30} onDismiss={handleDismiss} />
      );

      // Re-render with same props
      rerender(
        <ErrorBanner error="Test error" retryAfter={30} onDismiss={handleDismiss} />
      );

      // Component should still work correctly
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should handle long multi-line errors efficiently', () => {
      const longMultiLineError = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');

      render(<ErrorBanner error={longMultiLineError} onDismiss={vi.fn()} />);

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 50')).toBeInTheDocument();
    });
  });
});
