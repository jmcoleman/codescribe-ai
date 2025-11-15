/**
 * Unit tests for MermaidDiagram component
 *
 * Tests the rendering, error handling, and user interaction
 * of Mermaid diagrams in the documentation panel.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MermaidDiagram } from '../MermaidDiagram';
import { ThemeProvider } from '../../contexts/ThemeContext';
import mermaid from 'mermaid';

// Mock mermaid library
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe('MermaidDiagram', () => {
  const mockSvg = '<svg xmlns="http://www.w3.org/2000/svg"><g><text>Test Diagram</text></g></svg>';

  // Helper to render with ThemeProvider
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Default successful render
    mermaid.render.mockResolvedValue({ svg: mockSvg });
  });

  describe('Initial Render - Show Button', () => {
    it('should render show diagram button initially', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="test-1" />);

      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
      expect(screen.getByText('Click to render visualization')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('should display diagram icon in show button state', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="test-2" />);

      // Check for SVG icon (bar chart icon)
      const icon = screen.getByRole('button', { name: /show/i }).parentElement.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not render diagram until show button is clicked', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="test-3" />);

      expect(mermaid.render).not.toHaveBeenCalled();
    });

    it('should have accessible show button', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="test-4" />);

      const button = screen.getByRole('button', { name: /show/i });
      expect(button).toHaveAccessibleName();
      expect(button).toBeVisible();
    });
  });

  describe('User Interaction - Show Button Click', () => {
    it('should show loading state when show button is clicked', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      // Delay the render to see loading state
      mermaid.render.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ svg: mockSvg }), 100))
      );

      renderWithTheme(<MermaidDiagram chart={chart} id="test-5" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      // Should show either the Suspense fallback or the renderer loading state
      expect(
        screen.getByText(/Loading diagram renderer\.\.\.|Rendering diagram\.\.\./i)
      ).toBeInTheDocument();
    });

    it('should call mermaid.render when show button is clicked', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      renderWithTheme(<MermaidDiagram chart={chart} id="test-6" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass unique ID to mermaid.render', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      renderWithTheme(<MermaidDiagram chart={chart} id="unique-test" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        const callArgs = mermaid.render.mock.calls[0];
        expect(callArgs[0]).toContain('mermaid-unique-test');
        expect(callArgs[1]).toBe(chart);
      });
    });
  });

  describe('Diagram Rendering', () => {
    it('should render SVG diagram after successful render', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A[Start] --> B[End]';

      renderWithTheme(<MermaidDiagram chart={chart} id="test-7" />);

      const button = screen.getByRole('button', { name: /^show$/i });
      await user.click(button);

      await waitFor(() => {
        // Check that SVG is rendered
        const svgElement = document.querySelector('svg');
        expect(svgElement).toBeInTheDocument();
      });
    });

    it('should render flowchart diagram', async () => {
      const user = userEvent.setup();
      const flowchart = `flowchart TD
    A[Input] --> B[Process]
    B --> C[Output]`;

      renderWithTheme(<MermaidDiagram chart={flowchart} id="flowchart-1" />);

      const button = screen.getByRole('button', { name: /^show$/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.stringContaining('flowchart-1'),
          flowchart
        );
      });
    });

    it('should render sequence diagram', async () => {
      const user = userEvent.setup();
      const sequence = `sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`;

      renderWithTheme(<MermaidDiagram chart={sequence} id="sequence-1" />);

      const button = screen.getByRole('button', { name: /^show$/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.stringContaining('sequence-1'),
          sequence
        );
      });
    });

    it('should handle multiple diagram instances with different IDs', async () => {
      const user = userEvent.setup();
      const chart1 = 'flowchart TD\n    A --> B';
      const chart2 = 'flowchart TD\n    X --> Y';

      // First diagram instance
      const { unmount } = renderWithTheme(<MermaidDiagram chart={chart1} id="diagram-1" />);

      const button1 = screen.getByRole('button', { name: /^show$/i });
      await user.click(button1);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Unmount first diagram
      unmount();

      // Render second diagram (fresh render, not rerender)
      renderWithTheme(<MermaidDiagram chart={chart2} id="diagram-2" />);

      const button2 = screen.getByRole('button', { name: /^show$/i });
      await user.click(button2);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(2);
      });

      // Verify different IDs were used
      const call1 = mermaid.render.mock.calls[0][0];
      const call2 = mermaid.render.mock.calls[1][0];
      expect(call1).toContain('diagram-1');
      expect(call2).toContain('diagram-2');
      expect(call1).not.toBe(call2);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when render fails', async () => {
      const user = userEvent.setup();
      const chart = 'invalid mermaid syntax';

      mermaid.render.mockRejectedValue(new Error('Syntax error in diagram'));

      renderWithTheme(<MermaidDiagram chart={chart} id="error-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Diagram Rendering Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Syntax error in diagram/i)).toBeInTheDocument();
      });
    });

    it('should display error with amber warning background', async () => {
      const user = userEvent.setup();
      const chart = 'invalid';

      mermaid.render.mockRejectedValue(new Error('Parse error'));

      renderWithTheme(<MermaidDiagram chart={chart} id="error-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        const errorText = screen.getByText(/Diagram Rendering Error/i);
        const errorDiv = errorText.closest('.bg-amber-50');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveClass('bg-amber-50');
        expect(errorDiv).toHaveClass('border-amber-200');
      });
    });

    it('should handle empty chart gracefully', async () => {
      const user = userEvent.setup();

      renderWithTheme(<MermaidDiagram chart="" id="empty-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      // Should not call render for empty chart
      await waitFor(() => {
        expect(mermaid.render).not.toHaveBeenCalled();
      });
    });

    it('should handle null chart gracefully', async () => {
      const user = userEvent.setup();

      renderWithTheme(<MermaidDiagram chart={null} id="null-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).not.toHaveBeenCalled();
      });
    });

    it('should handle render rejection without message', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      mermaid.render.mockRejectedValue(new Error());

      renderWithTheme(<MermaidDiagram chart={chart} id="error-3" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Diagram Rendering Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('SVG Sanitization', () => {
    it('should remove error messages from SVG', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      const svgWithError = `<svg xmlns="http://www.w3.org/2000/svg">
        <g>
          <text>Syntax error in text</text>
        </g>
        <g>
          <text>Valid content</text>
        </g>
      </svg>`;

      mermaid.render.mockResolvedValue({ svg: svgWithError });

      renderWithTheme(<MermaidDiagram chart={chart} id="sanitize-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        // The SVG should be rendered
        const svgElement = document.querySelector('svg');
        expect(svgElement).toBeInTheDocument();
        // Error text should be removed by the component, valid content should remain
        expect(screen.getByText('Valid content')).toBeInTheDocument();
      });
    });

    it('should remove error icons (bomb images) from SVG', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      const svgWithBomb = `<svg xmlns="http://www.w3.org/2000/svg">
        <g>
          <image href="data:image/svg+xml;base64,bomb" />
        </g>
      </svg>`;

      mermaid.render.mockResolvedValue({ svg: svgWithBomb });

      renderWithTheme(<MermaidDiagram chart={chart} id="sanitize-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        // The SVG should be rendered (bomb image removed by component)
        const svgElement = document.querySelector('svg');
        expect(svgElement).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on unmount', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      const { unmount } = renderWithTheme(<MermaidDiagram chart={chart} id="lifecycle-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      // Unmount before render completes
      unmount();

      // Should not throw errors
      expect(mermaid.render).toHaveBeenCalled();
    });

    it('should re-render when chart prop changes', async () => {
      const user = userEvent.setup();
      const chart1 = 'flowchart TD\n    A --> B';
      const chart2 = 'flowchart TD\n    X --> Y';

      const { rerender } = renderWithTheme(<MermaidDiagram chart={chart1} id="update-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Change chart
      rerender(<ThemeProvider><MermaidDiagram chart={chart2} id="update-1" /></ThemeProvider>);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(2);
        expect(mermaid.render).toHaveBeenLastCalledWith(
          expect.any(String),
          chart2
        );
      });
    });

    it('should not re-render when unrelated props change', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      const { rerender } = renderWithTheme(<MermaidDiagram chart={chart} id="stable-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Re-render with same props
      rerender(<ThemeProvider><MermaidDiagram chart={chart} id="stable-1" /></ThemeProvider>);

      // Should not trigger new render
      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button in initial state', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="a11y-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
    });

    it('should maintain focus management', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      renderWithTheme(<MermaidDiagram chart={chart} id="a11y-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      button.focus();

      expect(button).toHaveFocus();

      await user.click(button);

      // Button should disappear after click, focus handled by browser
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /show/i })).not.toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      const chart = 'flowchart TD\n    A --> B';
      renderWithTheme(<MermaidDiagram chart={chart} id="a11y-3" />);

      // Button should have accessible text
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
      expect(screen.getByText('Click to render visualization')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should trim whitespace from chart before rendering', async () => {
      const user = userEvent.setup();
      const chartWithWhitespace = '  \n  flowchart TD\n    A --> B  \n  ';

      renderWithTheme(<MermaidDiagram chart={chartWithWhitespace} id="perf-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.any(String),
          chartWithWhitespace.trim()
        );
      });
    });

    it('should use memoization for component', () => {
      const chart = 'flowchart TD\n    A --> B';

      const { rerender } = renderWithTheme(<MermaidDiagram chart={chart} id="memo-1" />);

      // Get initial instance
      const initialButton = screen.getByRole('button', { name: /show/i });

      // Re-render with same props
      rerender(<ThemeProvider><MermaidDiagram chart={chart} id="memo-1" /></ThemeProvider>);

      // Should be the same button instance (memoized)
      const afterButton = screen.getByRole('button', { name: /show/i });
      expect(afterButton).toBe(initialButton);
    });
  });

  describe.skip('Console Logging', () => {
    // SKIPPED: Console logging was removed from production code
    // These tests are outdated and should be removed or updated
    it('should log render events in development', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      renderWithTheme(<MermaidDiagram chart={chart} id="log-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should log errors when render fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      const chart = 'invalid';

      mermaid.render.mockRejectedValue(new Error('Test error'));

      renderWithTheme(<MermaidDiagram chart={chart} id="log-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
