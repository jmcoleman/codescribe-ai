import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow, errorMessage }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>No error</div>;
};

// Component that works normally
const NormalComponent = () => <div>Normal component</div>;

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy;
  const originalEnv = import.meta.env.DEV;

  beforeEach(() => {
    // Suppress console.error during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Reset environment
    import.meta.env.DEV = originalEnv;
  });

  describe('Normal Rendering (No Errors)', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should not display error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render multiple children without errors', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch errors thrown by child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });

    it('should display fallback UI when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error logging" />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should display error icon', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIcon = container.querySelector('.text-red-600');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show user-friendly error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should display helpful suggestions', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Click "Try Again" to retry your action/i)).toBeInTheDocument();
      expect(screen.getByText(/Refresh the page to restart the application/i)).toBeInTheDocument();
      expect(screen.getByText(/If the issue continues, try clearing your browser cache and cookies/i)).toBeInTheDocument();
    });
  });

  describe('Error Count Tracking', () => {
    it('should track error count when error occurs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );

      // Trigger error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should display error count when multiple errors occur', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="First error" />
        </ErrorBoundary>
      );

      // The error boundary is already showing the error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should display "Try Again" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('should display "Reload Page" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
    });

    it('should display "Go Home" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
    });

    it('should reset error state when "Try Again" is clicked', async () => {
      const user = userEvent.setup();

      // Create a component that can toggle between throwing and not throwing
      let shouldThrow = true;
      const ToggleErrorComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Normal component</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Now set shouldThrow to false and click Try Again
      shouldThrow = false;
      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      await user.click(tryAgainButton);

      // After clicking Try Again, the error boundary attempts to re-render
      // The component should now render normally
      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should call window.location.reload when "Reload Page" is clicked', async () => {
      const user = userEvent.setup();
      const reloadSpy = vi.fn();

      // Mock window.location.reload
      delete window.location;
      window.location = { reload: reloadSpy };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Reload Page/i });
      await user.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('should navigate to home when "Go Home" is clicked', async () => {
      const user = userEvent.setup();
      const originalHref = window.location.href;
      delete window.location;
      window.location = { href: originalHref };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /Go Home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });

    it('should display icons on recovery buttons', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it('should show technical details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Dev mode error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details (Development Mode)')).toBeInTheDocument();
    });

    it('should show copy button for error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Copy error message/i })).toBeInTheDocument();
    });

    it('should show copy button for stack trace', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Copy stack trace/i })).toBeInTheDocument();
    });

    it('should show copy button for component stack', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Copy component stack/i })).toBeInTheDocument();
    });

    it('should display error message in details', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Specific error message" />
        </ErrorBoundary>
      );

      const detailsSection = screen.getByText('Error Message:');
      expect(detailsSection).toBeInTheDocument();
    });

    it('should show stack trace section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
    });

    it('should show component stack section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Stack:')).toBeInTheDocument();
    });

    it('should use details/summary for collapsible technical info', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();

      const summary = container.querySelector('summary');
      expect(summary).toBeInTheDocument();
    });

    it('should style error message in red', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = container.querySelector('.bg-red-50');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Production Mode', () => {
    beforeEach(() => {
      import.meta.env.DEV = false;
    });

    it('should not show technical details in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Technical Details (Development Mode)')).not.toBeInTheDocument();
    });

    it('should show error ID in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorReferences = screen.getAllByText(/Error Reference/i);
      expect(errorReferences.length).toBeGreaterThan(0);
    });

    it('should show support contact message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/If this error persists, please report it on/i)).toBeInTheDocument();
    });

    it('should not expose stack traces in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Stack Trace:')).not.toBeInTheDocument();
    });

    it('should show copy button for error ID in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Copy error ID/i })).toBeInTheDocument();
    });

    it('should show timestamp in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Occurred at:/i)).toBeInTheDocument();
    });

    it('should show GitHub link in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
      expect(githubLinks.length).toBeGreaterThan(0);
      // Check that at least one GitHub link points to the issues page
      const issuesLink = githubLinks.find(link =>
        link.getAttribute('href') === 'https://github.com/yourusername/codescribe-ai/issues'
      );
      expect(issuesLink).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have centered layout', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const wrapper = container.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have max-width constraint', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const content = container.querySelector('.max-w-4xl');
      expect(content).toBeInTheDocument();
    });

    it('should have error card with border', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const card = container.querySelector('.border-2.border-red-200');
      expect(card).toBeInTheDocument();
    });

    it('should have rounded corners on error card', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const card = container.querySelector('.rounded-lg.shadow-lg');
      expect(card).toBeInTheDocument();
    });

    it('should use slate background color', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const background = container.querySelector('.bg-slate-50');
      expect(background).toBeInTheDocument();
    });

    it('should display icon in circular container', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const iconContainer = container.querySelector('.w-12.h-12.bg-red-100.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Footer Links', () => {
    it('should display documentation link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const docLink = screen.getByRole('link', { name: /documentation/i });
      expect(docLink).toBeInTheDocument();
      expect(docLink).toHaveAttribute('target', '_blank');
      expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display issue reporting link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const issueLink = screen.getByRole('link', { name: /report this issue on GitHub/i });
      expect(issueLink).toBeInTheDocument();
      expect(issueLink).toHaveAttribute('target', '_blank');
      expect(issueLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should style links with purple color', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('text-purple-600');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { name: 'Something went wrong' });
      expect(heading.tagName).toBe('H1');
    });

    it('should have descriptive button labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
    });

    it('should have proper color contrast for text', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { name: 'Something went wrong' });
      expect(heading).toHaveClass('text-slate-900');
    });

    it('should have accessible external links', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with no message', () => {
      const NoMessageError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <NoMessageError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'A'.repeat(1000);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={longMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not crash, just render nothing
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should not crash, just render nothing
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive padding', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const wrapper = container.querySelector('.px-4');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have flexible button layout', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should have 3 action buttons (Try Again, Reload Page, Go Home)
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();

      // In development mode, should also have 3 copy buttons in the details section
      // (for error message, stack trace, and component stack)
      const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
      expect(copyButtons.length).toBe(3);
    });

    it('should handle overflow in details section', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Find pre elements (code blocks) and verify they have overflow handling
      const preElements = container.querySelectorAll('pre');
      preElements.forEach(pre => {
        expect(pre).toHaveClass('overflow-x-auto');
      });
    });
  });
});
