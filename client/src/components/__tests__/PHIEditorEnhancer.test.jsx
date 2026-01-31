/**
 * Tests for PHI Editor Enhancer
 * Monaco integration for PHI detection and sanitization
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PHIEditorEnhancer } from '../PHIEditorEnhancer';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock scrollTo (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

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

    expect(screen.getByText(/PHI Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/2 unique, 2 total/i)).toBeInTheDocument();
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

    // Stats without icons
    expect(screen.getByText('0 Accepted')).toBeInTheDocument();
    expect(screen.getByText('0 Skipped')).toBeInTheDocument();
    expect(screen.getByText('2 Pending')).toBeInTheDocument();
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

    const toggleButton = screen.getByLabelText(/Collapse PHI review panel/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Expand PHI review panel/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/Expand PHI review panel/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Collapse PHI review panel/i)).toBeInTheDocument();
    });
  });

  it('calls onPhiResolved when Apply button clicked', async () => {
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

    // Apply first item using the correct button class
    const applyButtons = container.querySelectorAll('.phi-btn-apply-item');
    fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('1 Accepted')).toBeInTheDocument();
    });

    // Click Apply All button (pendingCount = 1 since we applied one of two items)
    const applyAllButton = screen.getByText(/Apply \(1\)/i);
    fireEvent.click(applyAllButton);

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
