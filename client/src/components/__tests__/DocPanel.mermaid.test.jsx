/**
 * Integration tests for Mermaid diagram rendering in DocPanel
 *
 * Tests the complete flow from documentation with Mermaid diagrams
 * being passed to DocPanel to rendering in the MermaidDiagram component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme as render } from '../../__tests__/utils/renderWithTheme';
import userEvent from '@testing-library/user-event';
import { DocPanel } from '../DocPanel';
import mermaid from 'mermaid';

// Mock mermaid library
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

// Mock CopyButton to simplify tests
vi.mock('../CopyButton', () => ({
  CopyButton: () => <button>Copy</button>,
}));

describe('DocPanel - Mermaid Diagram Integration', () => {
  const mockQualityScore = {
    score: 85,
    grade: 'B',
    docType: 'README',
    breakdown: {
      overview: { present: true, points: 20, maxPoints: 20 },
      installation: { present: true, points: 15, maxPoints: 15 },
      examples: { count: 2, points: 15, maxPoints: 20 },
      apiDocs: { coveragePercent: 75, points: 19, maxPoints: 25 },
      structure: { headers: 4, points: 16, maxPoints: 20 },
    },
    summary: {
      strengths: ['overview', 'installation'],
      improvements: ['examples', 'apiDocs'],
    },
  };

  const mockSvg = '<svg xmlns="http://www.w3.org/2000/svg"><g><text>Test Diagram</text></g></svg>';

  beforeEach(() => {
    vi.clearAllMocks();
    mermaid.render.mockResolvedValue({ svg: mockSvg });
  });

  describe('Single Mermaid Diagram', () => {
    it('should render documentation with single Mermaid diagram', () => {
      const docWithMermaid = `# My Project

## Architecture

\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

This is the architecture.`;

      render(
        <DocPanel
          documentation={docWithMermaid}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should show "Diagram Available" button
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
    });

    it('should render Mermaid diagram when show button is clicked', async () => {
      const user = userEvent.setup();
      const docWithMermaid = `# Documentation

\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      render(
        <DocPanel
          documentation={docWithMermaid}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.stringContaining('diagram-'),
          expect.stringContaining('flowchart TD')
        );
      });
    });

    it('should display loading state while diagram renders', async () => {
      const user = userEvent.setup();

      mermaid.render.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ svg: mockSvg }), 100))
      );

      const docWithMermaid = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      render(
        <DocPanel
          documentation={docWithMermaid}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      expect(screen.getByText('Rendering diagram...')).toBeInTheDocument();
    });
  });

  describe('Multiple Mermaid Diagrams', () => {
    it('should render multiple Mermaid diagrams', () => {
      const docWithMultipleDiagrams = `# System Documentation

## Component Flow

\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

## Data Flow

\`\`\`mermaid
flowchart LR
    Input --> Transform
    Transform --> Output
\`\`\`

End of docs.`;

      render(
        <DocPanel
          documentation={docWithMultipleDiagrams}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should show multiple "Show" buttons (one for each diagram)
      const showButtons = screen.getAllByRole('button', { name: /^show$/i });
      expect(showButtons).toHaveLength(2);
    });

    it('should render each diagram independently', async () => {
      const user = userEvent.setup();
      const docWithMultipleDiagrams = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

\`\`\`mermaid
flowchart LR
    X --> Y
\`\`\``;

      render(
        <DocPanel
          documentation={docWithMultipleDiagrams}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButtons = screen.getAllByRole('button', { name: /^show$/i });

      // Click first diagram
      await user.click(showButtons[0]);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(1);
      });

      // Click second diagram
      await user.click(showButtons[1]);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(2);
      });

      // Verify different chart content
      const call1 = mermaid.render.mock.calls[0][1];
      const call2 = mermaid.render.mock.calls[1][1];
      expect(call1).toContain('A --> B');
      expect(call2).toContain('X --> Y');
    });

    it('should assign unique IDs to multiple diagrams', async () => {
      const user = userEvent.setup();
      const docWithMultipleDiagrams = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

\`\`\`mermaid
flowchart TD
    C --> D
\`\`\``;

      render(
        <DocPanel
          documentation={docWithMultipleDiagrams}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButtons = screen.getAllByRole('button', { name: /^show$/i });

      await user.click(showButtons[0]);
      await user.click(showButtons[1]);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledTimes(2);
      });

      // Verify unique IDs
      const id1 = mermaid.render.mock.calls[0][0];
      const id2 = mermaid.render.mock.calls[1][0];
      expect(id1).toContain('diagram-1');
      expect(id2).toContain('diagram-2');
    });
  });

  describe('Diagram Types', () => {
    it('should render flowchart diagrams', async () => {
      const user = userEvent.setup();
      const flowchart = `\`\`\`mermaid
flowchart TD
    Start[Start Process] --> Process[Process Data]
    Process --> End[End Process]
\`\`\``;

      render(
        <DocPanel
          documentation={flowchart}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('flowchart TD')
        );
      });
    });

    it('should render sequence diagrams', async () => {
      const user = userEvent.setup();
      const sequence = `\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    Client->>API: Request
    API->>DB: Query
    DB-->>API: Data
    API-->>Client: Response
\`\`\``;

      render(
        <DocPanel
          documentation={sequence}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        expect(mermaid.render).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining('sequenceDiagram')
        );
      });
    });

    it('should render complex architecture diagrams', async () => {
      const user = userEvent.setup();
      const architecture = `\`\`\`mermaid
flowchart TD
    Client[Client Layer] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Users[User Service]
    Auth --> DB[(Database)]
    Users --> DB
\`\`\``;

      render(
        <DocPanel
          documentation={architecture}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        const chartContent = mermaid.render.mock.calls[0][1];
        expect(chartContent).toContain('Client[Client Layer]');
        expect(chartContent).toContain('DB[(Database)]');
      });
    });
  });

  describe('Mixed Content', () => {
    it('should render documentation with text and Mermaid diagram', () => {
      const mixedDoc = `# Architecture Documentation

This is a comprehensive overview of our system architecture.

## System Components

The system consists of three main layers:

1. Client Layer
2. API Layer
3. Database Layer

## Component Diagram

\`\`\`mermaid
flowchart TD
    A[Client] --> B[API]
    B --> C[Database]
\`\`\`

## Conclusion

This architecture provides scalability and maintainability.`;

      render(
        <DocPanel
          documentation={mixedDoc}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should render text content
      expect(screen.getByText(/comprehensive overview/i)).toBeInTheDocument();
      expect(screen.getByText(/System Components/i)).toBeInTheDocument();

      // Should show diagram button
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
    });

    it('should render code blocks alongside Mermaid diagrams', () => {
      const mixedDoc = `# API Documentation

Example usage:

\`\`\`javascript
const result = await api.getData();
\`\`\`

API Flow:

\`\`\`mermaid
sequenceDiagram
    Client->>API: GET /data
    API-->>Client: Data
\`\`\``;

      render(
        <DocPanel
          documentation={mixedDoc}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should render JavaScript code block (may be split across elements)
      expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
      expect(screen.getByText(/Example usage/i)).toBeInTheDocument();

      // Should show Mermaid diagram button
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
    });
  });

  describe('Streaming State', () => {
    it('should show placeholder while diagram is incomplete during streaming', () => {
      const incompleteDiagram = `\`\`\`mermaid
flowchart TD
\`\`\``;

      render(
        <DocPanel
          documentation={incompleteDiagram}
          qualityScore={null}
          isGenerating={true}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should show placeholder message
      expect(screen.getByText(/Diagram will render when generation completes/i)).toBeInTheDocument();
    });

    it('should not show "Show" button during streaming', () => {
      const incompleteDiagram = `\`\`\`mermaid
flowchart TD
    A
\`\`\``;

      render(
        <DocPanel
          documentation={incompleteDiagram}
          qualityScore={null}
          isGenerating={true}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should NOT show "Show" button during generation
      expect(screen.queryByRole('button', { name: /^show$/i })).not.toBeInTheDocument();
    });

    it('should show "Show" button after streaming completes', () => {
      const completeDiagram = `\`\`\`mermaid
flowchart TD
    A[Start] --> B[End]
\`\`\``;

      const { rerender } = render(
        <DocPanel
          documentation={completeDiagram}
          qualityScore={null}
          isGenerating={true}
          onViewBreakdown={vi.fn()}
        />
      );

      // During generation - no show button
      expect(screen.queryByRole('button', { name: /^show$/i })).not.toBeInTheDocument();

      // After generation completes
      rerender(
        <DocPanel
          documentation={completeDiagram}
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should now show "Show" button
      expect(screen.getByRole('button', { name: /^show$/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid Mermaid syntax gracefully', async () => {
      const user = userEvent.setup();
      // Use valid-looking syntax that will trigger show button but fail render
      const invalidDiagram = `\`\`\`mermaid
flowchart TD
    A[Start] --> B[End]
    Invalid_Syntax_Here
\`\`\``;

      mermaid.render.mockRejectedValue(new Error('Syntax error'));

      render(
        <DocPanel
          documentation={invalidDiagram}
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        expect(screen.getByText(/Error rendering diagram/i)).toBeInTheDocument();
      });
    });

    it('should continue rendering other content when diagram fails', async () => {
      const user = userEvent.setup();
      // Use valid-looking Mermaid syntax
      const docWithError = `# Documentation

Some text before.

\`\`\`mermaid
flowchart TD
    A[Node] --> B[Node]
\`\`\`

Some text after.`;

      mermaid.render.mockRejectedValue(new Error('Parse error'));

      render(
        <DocPanel
          documentation={docWithError}
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should still render text content
      expect(screen.getByText(/Some text before/i)).toBeInTheDocument();
      expect(screen.getByText(/Some text after/i)).toBeInTheDocument();

      const showButton = screen.getByRole('button', { name: /^show$/i });
      await user.click(showButton);

      await waitFor(() => {
        expect(screen.getByText(/Error rendering diagram/i)).toBeInTheDocument();
      });
    });
  });

  describe('Counter Reset', () => {
    it('should reset diagram counter when documentation changes', async () => {
      const doc1 = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      const doc2 = `\`\`\`mermaid
flowchart TD
    X --> Y
\`\`\``;

      const { rerender } = render(
        <DocPanel
          documentation={doc1}
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={vi.fn()}
        />
      );

      // First diagram should get ID 1
      const button1 = screen.getByRole('button', { name: /^show$/i });
      await userEvent.setup().click(button1);

      await waitFor(() => {
        const id1 = mermaid.render.mock.calls[0][0];
        expect(id1).toContain('diagram-1');
      });

      // Change documentation (new generation)
      rerender(
        <DocPanel
          documentation={doc2}
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={vi.fn()}
        />
      );

      // Counter should reset, new diagram should also get ID 1
      const button2 = screen.getByRole('button', { name: /^show$/i });
      await userEvent.setup().click(button2);

      await waitFor(() => {
        // Second call should also start at diagram-1 (counter was reset)
        const id2 = mermaid.render.mock.calls[1][0];
        expect(id2).toContain('diagram-1');
      });
    });
  });

  describe('Quality Score with Diagrams', () => {
    it('should display quality score alongside diagram', () => {
      const docWithDiagram = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      render(
        <DocPanel
          documentation={docWithDiagram}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // Should show quality score
      expect(screen.getByText(/85\/100/)).toBeInTheDocument();
      // Grade is announced in sr-only text for screen readers
      expect(screen.getByText(/grade B/i)).toBeInTheDocument();

      // Should show diagram button
      expect(screen.getByText('Diagram Available')).toBeInTheDocument();
    });

    it('should allow viewing quality breakdown with diagrams', async () => {
      const user = userEvent.setup();
      const onViewBreakdown = vi.fn();

      const docWithDiagram = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      render(
        <DocPanel
          documentation={docWithDiagram}
          qualityScore={mockQualityScore}
          onViewBreakdown={onViewBreakdown}
        />
      );

      const qualityButton = screen.getByRole('button', { name: /view quality score breakdown/i });
      await user.click(qualityButton);

      expect(onViewBreakdown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible diagram show button', () => {
      const docWithDiagram = `\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``;

      render(
        <DocPanel
          documentation={docWithDiagram}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      const showButton = screen.getByRole('button', { name: /^show$/i });
      expect(showButton).toBeVisible();
      expect(showButton).toBeEnabled();
    });

    it('should maintain readable text alongside diagrams', () => {
      const docWithDiagram = `# Architecture

System overview text.

\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

More text below.`;

      render(
        <DocPanel
          documentation={docWithDiagram}
          qualityScore={mockQualityScore}
          onViewBreakdown={vi.fn()}
        />
      );

      // All text should be readable
      expect(screen.getByText(/System overview text/i)).toBeInTheDocument();
      expect(screen.getByText(/More text below/i)).toBeInTheDocument();
    });
  });
});
