import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocPanel } from '../DocPanel';

describe('DocPanel Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test to reset expanded state
    localStorage.clear();
  });
  describe('Empty State', () => {
    it('should render empty state when no documentation provided', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={false} />);

      expect(screen.getByText(/Your generated documentation will appear here/i)).toBeInTheDocument();
      // SVG icons are rendered with aria-hidden, so we can't use getByRole('img')
      // Instead, verify the container is present
      const emptyStateContainer = screen.getByText(/Your generated documentation will appear here/i).parentElement;
      expect(emptyStateContainer).toHaveClass('flex', 'flex-col', 'items-center');
    });

    it('should not show quality score in empty state', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={false} />);

      expect(screen.queryByText(/Quality:/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading state when generating', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={true} />);

      expect(screen.getByText(/Generating documentation.../i)).toBeInTheDocument();
    });

    it('should show animated sparkles icon during generation', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={true} />);

      // Verify the loading message text is present (sparkles icon is aria-hidden)
      const loadingText = screen.getByText(/Generating documentation.../i);
      expect(loadingText).toBeInTheDocument();
    });

    it('should not show empty state message when generating', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={true} />);

      expect(screen.queryByText(/Your generated documentation will appear here/i)).not.toBeInTheDocument();
    });
  });

  describe('Documentation Rendering', () => {
    it('should render documentation when provided', () => {
      const doc = '# Test Documentation\n\nThis is a test.';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText('Test Documentation')).toBeInTheDocument();
      expect(screen.getByText('This is a test.')).toBeInTheDocument();
    });

    it('should render markdown headings correctly', () => {
      const doc = '# H1\n## H2\n### H3';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toHaveTextContent('H1');
      expect(h2).toHaveTextContent('H2');
      expect(h3).toHaveTextContent('H3');
    });

    it('should render markdown lists correctly', () => {
      const doc = '- Item 1\n- Item 2\n- Item 3';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toHaveTextContent('Item 1');
      expect(listItems[1]).toHaveTextContent('Item 2');
      expect(listItems[2]).toHaveTextContent('Item 3');
    });

    it('should render markdown links correctly', () => {
      const doc = '[Click here](https://example.com)';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const link = screen.getByRole('link', { name: /Click here/i });
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should render markdown bold and italic correctly', () => {
      const doc = '**bold text** and *italic text*';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText('bold text')).toBeInTheDocument();
      expect(screen.getByText('italic text')).toBeInTheDocument();
    });
  });

  describe('GitHub Flavored Markdown (GFM)', () => {
    it('should render tables correctly', () => {
      const doc = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
      `;
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });

    it('should render strikethrough text', () => {
      const doc = '~~strikethrough~~';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const strikethrough = screen.getByText('strikethrough');
      expect(strikethrough.tagName).toBe('DEL');
    });

    it('should render task lists', () => {
      const doc = '- [x] Completed task\n- [ ] Incomplete task';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe('Syntax Highlighting - Code Blocks', () => {
    it('should render inline code with proper styling', () => {
      const doc = 'Here is `inline code` in text.';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const codeElement = screen.getByText('inline code');
      expect(codeElement.tagName).toBe('CODE');
      expect(codeElement).toHaveClass('bg-slate-100', 'rounded');
    });

    it('should render JavaScript code blocks with syntax highlighting', async () => {
      const doc = '```javascript\nconst x = 1;\nconsole.log(x);\n```';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/const/)).toBeInTheDocument();
        expect(screen.getByText(/console/)).toBeInTheDocument();
      });
    });

    it('should render Python code blocks with syntax highlighting', async () => {
      const doc = '```python\ndef hello():\n    print("Hello")\n```';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/def/)).toBeInTheDocument();
        expect(screen.getByText(/print/)).toBeInTheDocument();
      });
    });

    it('should render TypeScript code blocks', async () => {
      const doc = '```typescript\ninterface User {\n  name: string;\n}\n```';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/interface/)).toBeInTheDocument();
        expect(screen.getByText(/string/)).toBeInTheDocument();
      });
    });

    it('should render code blocks with multiple languages in same document', async () => {
      const doc = `
# Multi-language Example

JavaScript:
\`\`\`javascript
const x = 1;
\`\`\`

Python:
\`\`\`python
x = 1
\`\`\`
      `;
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/const/)).toBeInTheDocument();
      });
      expect(screen.getByText('JavaScript:')).toBeInTheDocument();
      expect(screen.getByText('Python:')).toBeInTheDocument();
    });

    it('should handle code blocks without language identifier', async () => {
      const doc = '```\nplain code\n```';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/plain code/)).toBeInTheDocument();
      });
    });

    it('should properly escape special characters in code blocks', async () => {
      const doc = '```javascript\nconst regex = /\\d+/;\nconst template = `${name}`;\n```';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      await waitFor(() => {
        expect(screen.getByText(/regex/)).toBeInTheDocument();
      });
    });
  });

  describe('Quality Score Display', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, feedback: 'Excellent' },
        installation: { score: 12, maxScore: 15, feedback: 'Good' },
        usage: { score: 18, maxScore: 20, feedback: 'Excellent' },
        api: { score: 20, maxScore: 25, feedback: 'Good' },
        structure: { score: 15, maxScore: 20, feedback: 'Good' }
      },
      summary: {
        strengths: ['overview', 'usage'],
        improvements: ['installation', 'api', 'structure']
      }
    };

    it('should display quality score badge when provided', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      expect(screen.getByText('Quality:')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should not display quality score when null', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={null}
          isGenerating={false}
        />
      );

      expect(screen.queryByText('Quality:')).not.toBeInTheDocument();
    });

    it('should render correct grade color for A grade', () => {
      const scoreA = { ...mockQualityScore, score: 95, grade: 'A' };
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={scoreA}
          isGenerating={false}
        />
      );

      const gradeElement = screen.getByText('A');
      expect(gradeElement).toHaveClass('text-success');
    });

    it('should render correct grade color for B grade', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const gradeElement = screen.getByText('B');
      expect(gradeElement).toHaveClass('text-blue-600');
    });

    it('should render correct grade color for C grade', () => {
      const scoreC = { ...mockQualityScore, score: 75, grade: 'C' };
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={scoreC}
          isGenerating={false}
        />
      );

      const gradeElement = screen.getByText('C');
      expect(gradeElement).toHaveClass('text-warning');
    });

    it('should render correct grade color for D grade', () => {
      const scoreD = { ...mockQualityScore, score: 65, grade: 'D' };
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={scoreD}
          isGenerating={false}
        />
      );

      const gradeElement = screen.getByText('D');
      expect(gradeElement).toHaveClass('text-error');
    });

    it('should render correct grade color for F grade', () => {
      const scoreF = { ...mockQualityScore, score: 45, grade: 'F' };
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={scoreF}
          isGenerating={false}
        />
      );

      const gradeElement = screen.getByText('F');
      expect(gradeElement).toHaveClass('text-error');
    });

    it('should call onViewBreakdown when quality badge clicked', async () => {
      const user = userEvent.setup();
      const onViewBreakdown = vi.fn();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={onViewBreakdown}
        />
      );

      const button = screen.getByRole('button', { name: /View quality score breakdown/i });
      await user.click(button);

      expect(onViewBreakdown).toHaveBeenCalledTimes(1);
    });

    it('should show strengths count in footer', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      expect(screen.getByText('2 criteria met')).toBeInTheDocument();
    });

    it('should show improvements count in footer', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      expect(screen.getByText('3 areas to improve')).toBeInTheDocument();
    });

    it('should not show improvements section when no improvements needed', () => {
      const perfectScore = {
        ...mockQualityScore,
        summary: {
          strengths: ['overview', 'installation', 'usage', 'api', 'structure'],
          improvements: []
        }
      };

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={perfectScore}
          isGenerating={false}
        />
      );

      expect(screen.queryByText(/areas to improve/i)).not.toBeInTheDocument();
      expect(screen.getByText('5 criteria met')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from empty to loading state', () => {
      const { rerender } = render(
        <DocPanel documentation="" qualityScore={null} isGenerating={false} />
      );

      expect(screen.getByText(/Your generated documentation will appear here/i)).toBeInTheDocument();

      rerender(<DocPanel documentation="" qualityScore={null} isGenerating={true} />);

      expect(screen.getByText(/Generating documentation.../i)).toBeInTheDocument();
      expect(screen.queryByText(/Your generated documentation will appear here/i)).not.toBeInTheDocument();
    });

    it('should transition from loading to documentation state', () => {
      const { rerender } = render(
        <DocPanel documentation="" qualityScore={null} isGenerating={true} />
      );

      expect(screen.getByText(/Generating documentation.../i)).toBeInTheDocument();

      const doc = '# Completed Documentation';
      rerender(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.queryByText(/Generating documentation.../i)).not.toBeInTheDocument();
      expect(screen.getByText('Completed Documentation')).toBeInTheDocument();
    });

    it('should show documentation even while generating (streaming)', () => {
      const doc = '# Partial Documentation\n\nGenerating...';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={true} />);

      expect(screen.getByText('Partial Documentation')).toBeInTheDocument();
      expect(screen.queryByText(/Generating documentation.../i)).not.toBeInTheDocument();
    });
  });

  describe('Complex Documentation Examples', () => {
    it('should render complete README-style documentation', async () => {
      const doc = `
# My Project

A comprehensive project description.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install my-project
\`\`\`

## Usage

\`\`\`javascript
import { myFunction } from 'my-project';

myFunction('hello');
\`\`\`

## API

### \`myFunction(param)\`

**Parameters:**
- \`param\` (string): The input parameter

**Returns:** string
      `;

      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByRole('heading', { name: 'My Project' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Features' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Installation' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'API' })).toBeInTheDocument();

      // Code blocks are tokenized by syntax highlighter, check for individual tokens
      await waitFor(() => {
        expect(screen.getByText('npm')).toBeInTheDocument();
        expect(screen.getByText('install')).toBeInTheDocument();
      });
    });

    it('should render JSDoc-style documentation', async () => {
      const doc = `
# Functions

## \`capitalize(str)\`

Capitalizes the first letter of a string.

**Parameters:**
- \`str\` (string): The input string

**Returns:** string - The capitalized string

**Example:**
\`\`\`javascript
capitalize('hello'); // 'Hello'
\`\`\`
      `;

      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText('Functions')).toBeInTheDocument();
      expect(screen.getByText(/capitalize\(str\)/)).toBeInTheDocument();

      // The code block will be tokenized by syntax highlighter, so check for parts
      // Note: "capitalize" appears multiple times (heading, text, code)
      await waitFor(() => {
        const capitalizeElements = screen.getAllByText(/capitalize/);
        expect(capitalizeElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/'hello'/)).toBeInTheDocument();
      });
    });

    it('should render API documentation with endpoints', async () => {
      const doc = `
# API Endpoints

## GET /api/users

Retrieve all users.

**Query Parameters:**
- \`page\` (number, optional): Page number
- \`limit\` (number, optional): Items per page

**Response:**
\`\`\`json
{
  "data": [],
  "pagination": {
    "page": 1,
    "total": 100
  }
}
\`\`\`

**Status Codes:**
- 200: Success
- 500: Server Error
      `;

      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText(/API Endpoints/)).toBeInTheDocument();
      expect(screen.getByText(/GET \/api\/users/)).toBeInTheDocument();

      // JSON code blocks are tokenized, check for key components
      await waitFor(() => {
        expect(screen.getByText('"data"')).toBeInTheDocument();
        expect(screen.getByText('"pagination"')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const doc = '# H1\n## H2\n### H3\n#### H4';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('should have accessible buttons for quality score and expandable report', () => {
      const mockQualityScore = {
        score: 85,
        grade: 'B',
        breakdown: {},
        summary: { strengths: [], improvements: [] }
      };
      const onViewBreakdown = vi.fn();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
          onViewBreakdown={onViewBreakdown}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // Copy button + Quality score button + Expand button

      // Copy button
      const copyButton = screen.getByRole('button', { name: /Copy documentation to clipboard/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toBeEnabled();

      // Quality score button
      const qualityButton = screen.getByRole('button', { name: /View quality score breakdown/i });
      expect(qualityButton).toBeInTheDocument();
      expect(qualityButton).toBeEnabled();

      // View full report button (now has aria-label)
      const reportButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(reportButton).toBeInTheDocument();
      expect(reportButton).toBeEnabled();
      expect(reportButton).toHaveAttribute('aria-expanded', 'false');
      expect(reportButton).toHaveAttribute('aria-controls', 'quality-report-details');
    });

    it('should render links with proper attributes', () => {
      const doc = '[External Link](https://example.com)';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('Expandable Full Report', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, suggestion: 'Comprehensive overview provided' },
        installation: { score: 10, maxScore: 15, suggestion: 'Add more installation steps' },
        examples: { score: 18, maxScore: 20, suggestion: 'Excellent examples' },
        apiDocs: { score: 18, maxScore: 25, suggestion: 'Add more API details' },
        structure: { score: 19, maxScore: 20, suggestion: 'Well structured' }
      },
      summary: {
        strengths: ['overview', 'examples', 'structure'],
        improvements: ['installation', 'apiDocs']
      }
    };

    it('should show "View full report" button when quality score is present', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      expect(screen.getByText('View full report')).toBeInTheDocument();
    });

    it('should not show "View full report" button when quality score is null', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={null}
          isGenerating={false}
        />
      );

      expect(screen.queryByText('View full report')).not.toBeInTheDocument();
    });

    it('should initially hide the expandable report section with CSS', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      // Content is rendered but hidden via CSS (max-h-0 opacity-0)
      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      expect(reportDetails).toHaveClass('max-h-0', 'opacity-0');
      expect(reportDetails).not.toHaveClass('max-h-96', 'opacity-100');
    });

    it('should expand report section when "View full report" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      await user.click(expandButton);

      // Now the suggestions should be visible
      expect(screen.getByText('Comprehensive overview provided')).toBeInTheDocument();
      expect(screen.getByText('Add more installation steps')).toBeInTheDocument();
    });

    it('should show ChevronDown icon when collapsed', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      // ChevronDown should be rendered (has lucide-chevron-down class)
      const chevronDown = expandButton.querySelector('svg.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('should show ChevronUp icon when expanded', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      await user.click(expandButton);

      // ChevronUp should be rendered after expanding
      const chevronUp = expandButton.querySelector('svg.lucide-chevron-up');
      expect(chevronUp).toBeInTheDocument();
    });

    it('should toggle report visibility on multiple clicks', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      const reportDetails = screen.getByRole('region', { name: /quality report details/i });

      // Initially hidden (collapsed via CSS)
      expect(reportDetails).toHaveClass('max-h-0', 'opacity-0');

      // Click to expand
      await user.click(expandButton);
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      await user.click(expandButton);
      expect(reportDetails).toHaveClass('max-h-0', 'opacity-0');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand again
      await user.click(expandButton);
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display "Strengths" section header when expanded', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      expect(screen.getByText('Strengths')).toBeInTheDocument();
    });

    it('should display "Areas to Improve" section header when expanded', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
    });

    it('should display all strength criteria with formatted names', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      // Check formatted criteria names appear
      expect(screen.getByText('Overview:')).toBeInTheDocument();
      expect(screen.getByText('Usage Examples:')).toBeInTheDocument();
      expect(screen.getByText('Structure & Formatting:')).toBeInTheDocument();
    });

    it('should display all improvement criteria with formatted names', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      // Check formatted criteria names appear
      expect(screen.getByText('Installation:')).toBeInTheDocument();
      expect(screen.getByText('API Documentation:')).toBeInTheDocument();
    });

    it('should display suggestions for each criteria', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      // Check all suggestions are displayed
      expect(screen.getByText(/Comprehensive overview provided/)).toBeInTheDocument();
      expect(screen.getByText(/Excellent examples/)).toBeInTheDocument();
      expect(screen.getByText(/Well structured/)).toBeInTheDocument();
      expect(screen.getByText(/Add more installation steps/)).toBeInTheDocument();
      expect(screen.getByText(/Add more API details/)).toBeInTheDocument();
    });

    it('should not show "Areas to Improve" when no improvements needed', async () => {
      const user = userEvent.setup();
      const perfectScore = {
        ...mockQualityScore,
        summary: {
          strengths: ['overview', 'installation', 'examples', 'apiDocs', 'structure'],
          improvements: []
        }
      };

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={perfectScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.queryByText('Areas to Improve')).not.toBeInTheDocument();
    });

    it('should not show "Strengths" when no strengths identified', async () => {
      const user = userEvent.setup();
      const lowScore = {
        ...mockQualityScore,
        summary: {
          strengths: [],
          improvements: ['overview', 'installation', 'examples', 'apiDocs', 'structure']
        }
      };

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={lowScore}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
      expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
    });

    it('should handle missing suggestion gracefully with fallback text', async () => {
      const user = userEvent.setup();
      const scoreWithMissingSuggestion = {
        ...mockQualityScore,
        breakdown: {
          overview: { score: 20, maxScore: 20 }, // No suggestion property
          installation: { score: 10, maxScore: 15, suggestion: null }, // Null suggestion
        },
        summary: {
          strengths: ['overview'],
          improvements: ['installation']
        }
      };

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={scoreWithMissingSuggestion}
          isGenerating={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /full quality report/i }));

      // Should show fallback text
      expect(screen.getByText(/Well done!/)).toBeInTheDocument();
      expect(screen.getByText(/Consider improving this section/)).toBeInTheDocument();
    });
  });

  describe('Enhancement: Smooth Animations', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, suggestion: 'Great overview' }
      },
      summary: {
        strengths: ['overview'],
        improvements: []
      }
    };

    it('should have transition classes for smooth animations', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      expect(reportDetails).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('should animate from collapsed to expanded state', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });

      // Start collapsed
      expect(reportDetails).toHaveClass('max-h-0', 'opacity-0');

      // Click to expand
      await user.click(expandButton);

      // Should now be expanded
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
    });
  });

  describe('Enhancement: Keyboard Navigation', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, suggestion: 'Great overview' }
      },
      summary: {
        strengths: ['overview'],
        improvements: []
      }
    };

    it('should toggle on Enter key press', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      const reportDetails = screen.getByRole('region', { name: /quality report details/i });

      // Focus and press Enter
      expandButton.focus();
      await user.keyboard('{Enter}');

      // Should expand
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should toggle on Space key press', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      const reportDetails = screen.getByRole('region', { name: /quality report details/i });

      // Focus and press Space
      expandButton.focus();
      await user.keyboard(' ');

      // Should expand
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have focus styles for keyboard navigation', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(expandButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-indigo-500');
    });
  });

  describe('Enhancement: ARIA Attributes', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, suggestion: 'Great overview' }
      },
      summary: {
        strengths: ['overview'],
        improvements: []
      }
    };

    it('should have proper aria-expanded attribute when collapsed', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper aria-expanded attribute when expanded', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      await user.click(expandButton);

      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls pointing to the expandable region', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(expandButton).toHaveAttribute('aria-controls', 'quality-report-details');

      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      expect(reportDetails).toHaveAttribute('id', 'quality-report-details');
    });

    it('should have proper aria-label that changes based on state', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(expandButton).toHaveAttribute('aria-label', 'Show full quality report');

      await user.click(expandButton);

      expect(expandButton).toHaveAttribute('aria-label', 'Hide full quality report');
    });

    it('should have role="region" on expandable content', () => {
      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      expect(reportDetails).toHaveAttribute('role', 'region');
      expect(reportDetails).toHaveAttribute('aria-label', 'Quality report details');
    });
  });

  describe('Enhancement: LocalStorage Persistence', () => {
    const mockQualityScore = {
      score: 85,
      grade: 'B',
      breakdown: {
        overview: { score: 20, maxScore: 20, suggestion: 'Great overview' }
      },
      summary: {
        strengths: ['overview'],
        improvements: []
      }
    };

    it('should save expanded state to localStorage when toggled', async () => {
      const user = userEvent.setup();

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });

      // Initially should be false
      expect(localStorage.getItem('codescribe-report-expanded')).toBe('false');

      // Click to expand
      await user.click(expandButton);

      // Should save to localStorage
      expect(localStorage.getItem('codescribe-report-expanded')).toBe('true');

      // Click to collapse
      await user.click(expandButton);

      // Should update localStorage
      expect(localStorage.getItem('codescribe-report-expanded')).toBe('false');
    });

    it('should load expanded state from localStorage on mount', () => {
      // Set localStorage to expanded
      localStorage.setItem('codescribe-report-expanded', 'true');

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      const expandButton = screen.getByRole('button', { name: /Hide full quality report/i });

      // Should start expanded
      expect(reportDetails).toHaveClass('max-h-96', 'opacity-100');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage is full');
      });

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      // Should still render without crashing
      const expandButton = screen.getByRole('button', { name: /Show full quality report/i });
      expect(expandButton).toBeInTheDocument();

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage is not available');
      });

      render(
        <DocPanel
          documentation="# Test"
          qualityScore={mockQualityScore}
          isGenerating={false}
        />
      );

      // Should render with default state (collapsed)
      const reportDetails = screen.getByRole('region', { name: /quality report details/i });
      expect(reportDetails).toHaveClass('max-h-0', 'opacity-0');

      // Restore original getItem
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string documentation', () => {
      render(<DocPanel documentation="" qualityScore={null} isGenerating={false} />);

      expect(screen.getByText(/Your generated documentation will appear here/i)).toBeInTheDocument();
    });

    it('should handle very long documentation', () => {
      const longDoc = '# Title\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(1000);
      render(<DocPanel documentation={longDoc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should handle documentation with special markdown characters', () => {
      const doc = 'Text with **bold**, *italic*, `code`, and [link](url)';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
      expect(screen.getByText('code')).toBeInTheDocument();
    });

    it('should handle malformed markdown gracefully', () => {
      const doc = '# Heading\n\n**unclosed bold\n\n`unclosed code';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      // Should still render without crashing
      expect(screen.getByText('Heading')).toBeInTheDocument();
    });

    it('should handle documentation with HTML entities', () => {
      const doc = 'Text with &lt;tag&gt; and &amp; symbol';
      render(<DocPanel documentation={doc} qualityScore={null} isGenerating={false} />);

      expect(screen.getByText(/Text with/)).toBeInTheDocument();
    });
  });
});
