/**
 * Tests for PHI Editor Enhancer
 * Monaco integration for PHI detection and sanitization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PHIEditorEnhancer } from '../PHIEditorEnhancer';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock Monaco editor
const mockEditor = {
  deltaDecorations: vi.fn(() => []),
  getModel: vi.fn(() => ({
    uri: { toString: () => 'file://test.js' }
  })),
  revealLineInCenter: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
  addCommand: vi.fn(() => 'cmd-id')
};

const mockMonaco = {
  Range: class {
    constructor(startLine, startCol, endLine, endCol) {
      this.startLineNumber = startLine;
      this.startColumn = startCol;
      this.endLineNumber = endLine;
      this.endColumn = endCol;
    }
  },
  MarkerSeverity: {
    Warning: 4
  },
  editor: {
    setModelMarkers: vi.fn(),
    MinimapPosition: {
      Inline: 1
    }
  },
  languages: {
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCodeActionProvider: vi.fn(() => ({ dispose: vi.fn() }))
  }
};

const mockPhiDetection = {
  containsPHI: true,
  confidence: 'high',
  suggestions: [
    {
      title: 'Email Address',
      message: 'Email addresses are considered PHI',
      examples: ['john.doe@example.com']
    },
    {
      title: 'SSN',
      message: 'Social Security Numbers are PHI',
      examples: ['123-45-6789']
    }
  ]
};

const mockCode = `
const user = {
  email: 'john.doe@example.com',
  ssn: '123-45-6789'
};
`;

function renderWithTheme(ui) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

describe('PHIEditorEnhancer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PHI review panel when PHI detected', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(screen.getByText(/Protected Health Information Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });

  it('displays PHI items in table', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('SSN')).toBeInTheDocument();
  });

  it('applies decorations to editor', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(mockEditor.deltaDecorations).toHaveBeenCalled();
    expect(mockMonaco.editor.setModelMarkers).toHaveBeenCalled();
  });

  it('shows progress stats', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(screen.getByText(/0 Accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/0 Skipped/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Pending/i)).toBeInTheDocument();
  });

  it('collapses and expands panel', async () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    const toggleButton = screen.getByLabelText(/Collapse panel/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Expand panel/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Expand panel/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Collapse panel/i)).toBeInTheDocument();
    });
  });

  it('calls onPhiResolved when Apply All Changes clicked', async () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    const { container } = renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    // Accept first item
    const acceptButtons = container.querySelectorAll('.phi-btn-accept');
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1 Accepted/i)).toBeInTheDocument();
    });

    // Click Apply All Changes
    const applyButton = screen.getByText(/Apply All Changes/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onPhiResolved).toHaveBeenCalled();
    });
  });

  it('does not render when no PHI detected', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    const { container } = renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={{ containsPHI: false }}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('registers hover and code action providers', () => {
    const onCodeChange = vi.fn();
    const onPhiResolved = vi.fn();

    renderWithTheme(
      <PHIEditorEnhancer
        editorInstance={mockEditor}
        monacoInstance={mockMonaco}
        phiDetection={mockPhiDetection}
        code={mockCode}
        onCodeChange={onCodeChange}
        onPhiResolved={onPhiResolved}
        effectiveTheme="light"
      />
    );

    expect(mockMonaco.languages.registerHoverProvider).toHaveBeenCalled();
    expect(mockMonaco.languages.registerCodeActionProvider).toHaveBeenCalled();
  });
});
