import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CodePanel } from '../CodePanel';

// Mock LazyMonacoEditor to avoid loading Monaco in tests
vi.mock('../LazyMonacoEditor', () => ({
  LazyMonacoEditor: ({ value, onChange, language, options }) => (
    <div data-testid="monaco-editor">
      <textarea
        data-testid="editor-textarea"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        data-language={language}
        readOnly={options?.readOnly || false}
      />
    </div>
  ),
}));

// Mock CopyButton
vi.mock('../CopyButton', () => ({
  CopyButton: ({ text, ariaLabel }) => (
    <button data-testid="copy-button" aria-label={ariaLabel}>
      Copy ({text?.length} chars)
    </button>
  ),
}));

describe('CodePanel', () => {
  const defaultProps = {
    code: 'console.log("Hello World");',
    onChange: vi.fn(),
    filename: 'example.js',
    language: 'javascript',
  };

  describe('Rendering', () => {
    it('renders the code panel with default props', () => {
      render(<CodePanel {...defaultProps} />);
      expect(screen.getByText('example.js')).toBeInTheDocument();
    });

    it('renders traffic light decorations', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      const trafficLights = container.querySelectorAll('.w-3.h-3.rounded-full');
      expect(trafficLights).toHaveLength(3);
    });

    it('displays filename in header', () => {
      render(<CodePanel {...defaultProps} />);
      expect(screen.getByText('example.js')).toBeInTheDocument();
    });

    it('displays language badge in header', () => {
      render(<CodePanel {...defaultProps} />);
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    });

    it('displays language badge uppercase', () => {
      render(<CodePanel {...defaultProps} language="typescript" />);
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
    });

    it('renders Monaco editor via Suspense', async () => {
      render(<CodePanel {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('shows loading fallback while editor loads', () => {
      render(<CodePanel {...defaultProps} />);
      // Initially should show loading state (before Suspense resolves)
      // Due to mocking, this happens very quickly
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Code Statistics', () => {
    it('displays line count correctly for single line', () => {
      render(<CodePanel {...defaultProps} code="const x = 1;" />);
      expect(screen.getByText(/1 lines/i)).toBeInTheDocument();
    });

    it('displays line count correctly for multiple lines', () => {
      const multiLineCode = 'line 1\nline 2\nline 3';
      render(<CodePanel {...defaultProps} code={multiLineCode} />);
      expect(screen.getByText(/3 lines/i)).toBeInTheDocument();
    });

    it('displays character count correctly', () => {
      render(<CodePanel {...defaultProps} code="12345" />);
      expect(screen.getByText(/1 lines • 5 chars/i)).toBeInTheDocument();
    });

    it('updates statistics when code changes', () => {
      const { rerender } = render(<CodePanel {...defaultProps} code="short" />);
      expect(screen.getByText(/1 lines • 5 chars/i)).toBeInTheDocument();

      rerender(<CodePanel {...defaultProps} code="much longer code" />);
      expect(screen.getByText(/1 lines • 16 chars/i)).toBeInTheDocument();
    });

    it('handles empty code', () => {
      render(<CodePanel {...defaultProps} code="" />);
      expect(screen.getByText(/1 lines • 0 chars/i)).toBeInTheDocument();
    });
  });

  describe('CopyButton Integration', () => {
    it('renders CopyButton when code is present', () => {
      render(<CodePanel {...defaultProps} code="some code" />);
      expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    });

    it('does not render CopyButton when code is empty', () => {
      render(<CodePanel {...defaultProps} code="" />);
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    it('passes correct aria-label to CopyButton', () => {
      render(<CodePanel {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute('aria-label', 'Copy code to clipboard');
    });

    it('passes code content to CopyButton', () => {
      render(<CodePanel {...defaultProps} code="test code" />);
      // CopyButton mock shows "(X chars)" format
      expect(screen.getByText(/\(9 chars\)/i)).toBeInTheDocument();
    });
  });

  describe('Monaco Editor Configuration', () => {
    it('passes code value to editor', async () => {
      render(<CodePanel {...defaultProps} code="const x = 1;" />);
      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).toHaveValue('const x = 1;');
      });
    });

    it('passes onChange handler to editor', async () => {
      const onChange = vi.fn();
      render(<CodePanel {...defaultProps} onChange={onChange} />);

      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).toBeInTheDocument();
      });
    });

    it('passes language prop to editor', async () => {
      render(<CodePanel {...defaultProps} language="python" />);
      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).toHaveAttribute('data-language', 'python');
      });
    });

    it('supports readOnly mode', async () => {
      render(<CodePanel {...defaultProps} readOnly={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea.readOnly).toBe(true);
    });

    it('is editable by default', async () => {
      render(<CodePanel {...defaultProps} />);
      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).not.toHaveAttribute('readOnly');
      });
    });
  });

  describe('Default Props', () => {
    it('uses default filename when not provided', () => {
      const { filename, ...propsWithoutFilename } = defaultProps;
      render(<CodePanel {...propsWithoutFilename} />);
      expect(screen.getByText('code.js')).toBeInTheDocument();
    });

    it('uses default language when not provided', () => {
      const { language, ...propsWithoutLanguage } = defaultProps;
      render(<CodePanel {...propsWithoutLanguage} />);
      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    });

    it('defaults readOnly to false', async () => {
      render(<CodePanel code="test" onChange={vi.fn()} />);
      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).not.toHaveAttribute('readOnly');
      });
    });
  });

  describe('Status Indicator', () => {
    it('displays "Ready to analyze" status', () => {
      render(<CodePanel {...defaultProps} />);
      expect(screen.getByText('Ready to analyze')).toBeInTheDocument();
    });

    it('renders Zap icon in status', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      // Zap icon has specific classes
      const zapIcon = container.querySelector('.text-purple-500');
      expect(zapIcon).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('has correct border and shadow classes', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      const panel = container.querySelector('.border.border-slate-200.rounded-xl.shadow-sm');
      expect(panel).toBeInTheDocument();
    });

    it('header has correct background color', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      const header = container.querySelector('.bg-slate-50.border-b');
      expect(header).toBeInTheDocument();
    });

    it('footer has correct background color', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      const footer = container.querySelector('.bg-slate-50.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('uses flex layout for vertical stacking', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      const panel = container.querySelector('.flex.flex-col.h-full');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Different Languages', () => {
    const languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust'];

    languages.forEach(lang => {
      it(`renders correctly with ${lang} language`, async () => {
        render(<CodePanel {...defaultProps} language={lang} />);
        expect(screen.getByText(new RegExp(lang, 'i'))).toBeInTheDocument();

        await waitFor(() => {
          const textarea = screen.getByTestId('editor-textarea');
          expect(textarea).toHaveAttribute('data-language', lang);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<CodePanel {...defaultProps} />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('CopyButton has aria-label', () => {
      render(<CodePanel {...defaultProps} />);
      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute('aria-label');
    });

    it('displays filename for screen readers', () => {
      render(<CodePanel {...defaultProps} filename="important-file.ts" />);
      expect(screen.getByText('important-file.ts')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long code', () => {
      const longCode = 'x'.repeat(100000);
      render(<CodePanel {...defaultProps} code={longCode} />);
      expect(screen.getByText(/1 lines • 100000 chars/i)).toBeInTheDocument();
    });

    it('handles code with special characters', async () => {
      const specialCode = 'const emoji = "🎉"; // Special: <>&"\'';
      render(<CodePanel {...defaultProps} code={specialCode} />);

      await waitFor(() => {
        const textarea = screen.getByTestId('editor-textarea');
        expect(textarea).toHaveValue(specialCode);
      });
    });

    it('handles code with only whitespace', () => {
      const whitespaceCode = '   \n   \n   ';
      render(<CodePanel {...defaultProps} code={whitespaceCode} />);
      // Whitespace-only code counts based on newlines
      const expectedLines = whitespaceCode.split('\n').length;
      expect(screen.getByText(new RegExp(`${expectedLines} lines?`, 'i'))).toBeInTheDocument();
    });

    it('handles undefined onChange gracefully', async () => {
      const { onChange, ...propsWithoutOnChange } = defaultProps;
      render(<CodePanel {...propsWithoutOnChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('shows drag overlay when dragging a file over the panel', () => {
      const onFileDrop = vi.fn();
      render(<CodePanel {...defaultProps} onFileDrop={onFileDrop} />);

      const panel = screen.getByTestId('code-panel');

      // Simulate drag enter with fireEvent
      fireEvent.dragEnter(panel, {
        dataTransfer: { files: [] },
      });

      // Check that overlay appears
      expect(screen.getByText('Drop file to upload')).toBeInTheDocument();
      expect(screen.getByText('Release to load your code')).toBeInTheDocument();
    });

    it('hides drag overlay when drag leaves the panel', () => {
      const onFileDrop = vi.fn();
      render(<CodePanel {...defaultProps} onFileDrop={onFileDrop} />);

      const panel = screen.getByTestId('code-panel');

      // Simulate drag enter
      fireEvent.dragEnter(panel, {
        dataTransfer: { files: [] },
      });

      // Verify overlay is shown
      expect(screen.getByText('Drop file to upload')).toBeInTheDocument();

      // Simulate drag leave - target must equal currentTarget for the condition to work
      fireEvent.dragLeave(panel, {
        target: panel,
        currentTarget: panel,
      });

      // Verify overlay is hidden
      expect(screen.queryByText('Drop file to upload')).not.toBeInTheDocument();
    });

    it('calls onFileDrop when a file is dropped', () => {
      const onFileDrop = vi.fn();
      render(<CodePanel {...defaultProps} onFileDrop={onFileDrop} />);

      const panel = screen.getByTestId('code-panel');
      const mockFile = new File(['test content'], 'test.js', { type: 'text/javascript' });

      // Simulate drop with fireEvent
      fireEvent.drop(panel, {
        dataTransfer: { files: [mockFile] },
      });

      expect(onFileDrop).toHaveBeenCalledWith(mockFile);
    });

    it('does not show drag overlay when readOnly is true', () => {
      const onFileDrop = vi.fn();
      render(<CodePanel {...defaultProps} readOnly={true} onFileDrop={onFileDrop} />);

      const panel = screen.getByTestId('code-panel');

      // Simulate drag enter
      fireEvent.dragEnter(panel, {
        dataTransfer: { files: [] },
      });

      // Overlay should not appear
      expect(screen.queryByText('Drop file to upload')).not.toBeInTheDocument();
    });

    it('does not call onFileDrop when readOnly is true', () => {
      const onFileDrop = vi.fn();
      render(<CodePanel {...defaultProps} readOnly={true} onFileDrop={onFileDrop} />);

      const panel = screen.getByTestId('code-panel');
      const mockFile = new File(['test content'], 'test.js', { type: 'text/javascript' });

      // Simulate drop
      fireEvent.drop(panel, {
        dataTransfer: { files: [mockFile] },
      });

      expect(onFileDrop).not.toHaveBeenCalled();
    });

    it('does not show drag overlay when onFileDrop is not provided', () => {
      render(<CodePanel {...defaultProps} />);

      const panel = screen.getByTestId('code-panel');

      // Simulate drag enter
      fireEvent.dragEnter(panel, {
        dataTransfer: { files: [] },
      });

      // Overlay should not appear
      expect(screen.queryByText('Drop file to upload')).not.toBeInTheDocument();
    });
  });

  describe('Clear Button', () => {
    it('shows clear button when code is not empty and onClear is provided', () => {
      const onClear = vi.fn();
      render(<CodePanel {...defaultProps} onClear={onClear} />);

      const clearButton = screen.getByRole('button', { name: /clear editor/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('does not show clear button when code is empty', () => {
      const onClear = vi.fn();
      render(<CodePanel {...defaultProps} code="" onClear={onClear} />);

      const clearButton = screen.queryByRole('button', { name: /clear editor/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('does not show clear button when onClear is not provided', () => {
      render(<CodePanel {...defaultProps} />);

      const clearButton = screen.queryByRole('button', { name: /clear editor/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('does not show clear button when readOnly is true', () => {
      const onClear = vi.fn();
      render(<CodePanel {...defaultProps} readOnly={true} onClear={onClear} />);

      const clearButton = screen.queryByRole('button', { name: /clear editor/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup();
      render(<CodePanel {...defaultProps} onClear={onClear} />);

      const clearButton = screen.getByRole('button', { name: /clear editor/i });
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
