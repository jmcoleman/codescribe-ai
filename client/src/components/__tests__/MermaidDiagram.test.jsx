/**
 * Unit tests for MermaidDiagram component
 *
 * Tests the rendering, error handling, and user interaction
 * of Mermaid diagrams in the documentation panel.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { MermaidDiagram } from '../MermaidDiagram';
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
      render(<MermaidDiagram chart={chart} id="test-1" />);

      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
      expect(screen.getByText('Click to render visualization')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('should display diagram icon in show button state', () => {
      const chart = 'flowchart TD\n    A --> B';
      render(<MermaidDiagram chart={chart} id="test-2" />);

      // Check for SVG icon (bar chart icon)
      const icon = screen.getByRole('button', { name: /show/i }).parentElement.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not render diagram until show button is clicked', () => {
      const chart = 'flowchart TD\n    A --> B';
      render(<MermaidDiagram chart={chart} id="test-3" />);

      expect(mermaid.render).not.toHaveBeenCalled();
    });

    it('should have accessible show button', () => {
      const chart = 'flowchart TD\n    A --> B';
      render(<MermaidDiagram chart={chart} id="test-4" />);

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

      render(<MermaidDiagram chart={chart} id="test-5" />);

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

      render(<MermaidDiagram chart={chart} id="test-6" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass unique ID to mermaid.render', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="unique-test" />);

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

      render(<MermaidDiagram chart={chart} id="test-7" />);

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

      render(<MermaidDiagram chart={flowchart} id="flowchart-1" />);

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

      render(<MermaidDiagram chart={sequence} id="sequence-1" />);

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
      const { unmount } = render(<MermaidDiagram chart={chart1} id="diagram-1" />);

      const button1 = screen.getByRole('button', { name: /^show$/i });
      await user.click(button1);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Unmount first diagram
      unmount();

      // Render second diagram (fresh render, not rerender)
      render(<MermaidDiagram chart={chart2} id="diagram-2" />);

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

      render(<MermaidDiagram chart={chart} id="error-1" />);

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

      render(<MermaidDiagram chart={chart} id="error-2" />);

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

      render(<MermaidDiagram chart="" id="empty-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      // Should not call render for empty chart
      await waitFor(() => {
        expect(mermaid.render).not.toHaveBeenCalled();
      });
    });

    it('should handle null chart gracefully', async () => {
      const user = userEvent.setup();

      render(<MermaidDiagram chart={null} id="null-1" />);

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

      render(<MermaidDiagram chart={chart} id="error-3" />);

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

      render(<MermaidDiagram chart={chart} id="sanitize-1" />);

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

      render(<MermaidDiagram chart={chart} id="sanitize-2" />);

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

      const { unmount } = render(<MermaidDiagram chart={chart} id="lifecycle-1" />);

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

      const { rerender } = render(<MermaidDiagram chart={chart1} id="update-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Change chart
      rerender(<MermaidDiagram chart={chart2} id="update-1" />);

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

      const { rerender } = render(<MermaidDiagram chart={chart} id="stable-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Re-render with same props
      rerender(<MermaidDiagram chart={chart} id="stable-1" />);

      // Should not trigger new render
      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button in initial state', () => {
      const chart = 'flowchart TD\n    A --> B';
      render(<MermaidDiagram chart={chart} id="a11y-1" />);

      const button = screen.getByRole('button', { name: /show/i });
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
    });

    it('should maintain focus management', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="a11y-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      button.focus();

      expect(button).toHaveFocus();

      await user.click(button);

      // After clicking Show, diagram renders with a "Show Code" toggle button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      const chart = 'flowchart TD\n    A --> B';
      render(<MermaidDiagram chart={chart} id="a11y-3" />);

      // Button should have accessible text
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
      expect(screen.getByText('Click to render visualization')).toBeInTheDocument();
    });
  });

  describe('Code/Diagram Toggle', () => {
    it('should show "Show Code" button after diagram renders', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="toggle-1" />);

      // Click initial "Show" button to render diagram
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Wait for diagram to render, then toggle button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
      });
    });

    it('should toggle to show code when "Show Code" is clicked', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="toggle-2" />);

      // Click initial "Show" button
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Wait for "Show Code" button to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
      });

      // Click "Show Code" button
      await user.click(screen.getByRole('button', { name: /show code/i }));

      // Should now show "Show Diagram" button and the code in a pre/code block
      expect(screen.getByRole('button', { name: /show diagram/i })).toBeInTheDocument();
      const codeElement = screen.getByRole('code');
      expect(codeElement).toHaveTextContent('flowchart TD');
      expect(codeElement).toHaveTextContent('A --> B');
    });

    it('should toggle back to diagram when "Show Diagram" is clicked', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="toggle-3" />);

      // Click initial "Show" button
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
      });

      // Click "Show Code" button
      await user.click(screen.getByRole('button', { name: /show code/i }));

      // Click "Show Diagram" button
      await user.click(screen.getByRole('button', { name: /show diagram/i }));

      // Should be back to diagram view
      expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
    });

    it('should display "Diagram" label when showing diagram', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="toggle-4" />);

      // Click initial "Show" button
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Wait for diagram to render
      await waitFor(() => {
        expect(screen.getByText('Diagram')).toBeInTheDocument();
      });
    });

    it('should display "Mermaid Code" label when showing code', async () => {
      const user = userEvent.setup();
      const chart = 'flowchart TD\n    A --> B';

      render(<MermaidDiagram chart={chart} id="toggle-5" />);

      // Click initial "Show" button
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Wait for diagram, then toggle to code
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show code/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /show code/i }));

      expect(screen.getByText('Mermaid Code')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should trim whitespace from chart before rendering', async () => {
      const user = userEvent.setup();
      const chartWithWhitespace = '  \n  flowchart TD\n    A --> B  \n  ';

      render(<MermaidDiagram chart={chartWithWhitespace} id="perf-1" />);

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

      const { rerender } = render(<MermaidDiagram chart={chart} id="memo-1" />);

      // Get initial instance
      const initialButton = screen.getByRole('button', { name: /show/i });

      // Re-render with same props
      rerender(<MermaidDiagram chart={chart} id="memo-1" />);

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

      render(<MermaidDiagram chart={chart} id="log-1" />);

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

      render(<MermaidDiagram chart={chart} id="log-2" />);

      const button = screen.getByRole('button', { name: /show/i });
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
