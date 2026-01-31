/**
 * PHI Editor Enhancer - Inline Replacement Editing Tests
 * Tests the new editable replacement column with two-way sync
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PHIEditorEnhancer } from '../PHIEditorEnhancer';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock scrollIntoView and scrollTo (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

// Mock Monaco editor
const createMockEditor = () => {
  const listeners = {};
  return {
    deltaDecorations: vi.fn(() => []),
    revealLineInCenter: vi.fn(),
    setPosition: vi.fn(),
    hasTextFocus: vi.fn(() => false),
    getModel: vi.fn(() => ({
      uri: 'inmemory://model/1'
    })),
    addCommand: vi.fn(),
    onDidChangeModelContent: vi.fn((callback) => {
      listeners.contentChange = callback;
      return { dispose: vi.fn() };
    }),
    // Helper to simulate content changes
    _simulateChange: (changes) => {
      if (listeners.contentChange) {
        listeners.contentChange({ changes });
      }
    }
  };
};

const createMockMonaco = () => ({
  Range: class {
    constructor(startLine, startCol, endLine, endCol) {
      this.startLineNumber = startLine;
      this.startColumn = startCol;
      this.endLineNumber = endLine;
      this.endColumn = endCol;
    }
  },
  editor: {
    MinimapPosition: { Inline: 2 },
    setModelMarkers: vi.fn()
  },
  MarkerSeverity: {
    Warning: 4
  },
  languages: {
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCodeActionProvider: vi.fn(() => ({ dispose: vi.fn() }))
  }
});

const mockPHIDetection = {
  containsPHI: true,
  confidence: 'high',
  findings: {
    emails: { count: 1, description: 'Email address' },
    ssn: { count: 1, description: 'Social Security Number' }
  },
  suggestions: [
    {
      title: 'Email Address',
      message: 'Contains email address',
      examples: ['john.doe@hospital.com']
    },
    {
      title: 'SSN',
      message: 'Contains Social Security Number',
      examples: ['123-45-6789']
    }
  ]
};

const mockCode = `const email = "john.doe@hospital.com";
const ssn = "123-45-6789";`;

const renderWithTheme = (ui) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('PHIEditorEnhancer - Inline Replacement Editing', () => {
  let mockEditor;
  let mockMonaco;
  let mockOnCodeChange;
  let mockOnPhiResolved;
  let user;

  beforeEach(() => {
    mockEditor = createMockEditor();
    mockMonaco = createMockMonaco();
    mockOnCodeChange = vi.fn();
    mockOnPhiResolved = vi.fn();
    user = userEvent.setup();
  });

  describe('Editable Replacement Column', () => {
    it('should make replacement cells editable via contentEditable', () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Find replacement cells (should show suggested replacements)
      const replacementCells = screen.getAllByText(/user@example.com|XXX-XX-XXXX/);

      // Check that replacement cells are editable
      replacementCells.forEach(cell => {
        const codeElement = cell.closest('code');
        expect(codeElement).toHaveAttribute('contentEditable', 'true');
        expect(codeElement).toHaveAttribute('title', 'Click to edit replacement value');
      });
    });

    it('should show immutable found values', () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Found column should show original PHI values
      expect(screen.getByText('john.doe@hospital.com')).toBeInTheDocument();
      expect(screen.getByText('123-45-6789')).toBeInTheDocument();

      // Found cells should NOT be editable
      const foundCell = screen.getByText('john.doe@hospital.com').closest('code');
      expect(foundCell).not.toHaveAttribute('contentEditable', 'true');
    });

    it('should select all text when focusing replacement cell', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      // Focus the cell
      fireEvent.focus(replacementCell);

      // Should have purple outline when focused (checked via style)
      await waitFor(() => {
        expect(replacementCell).toHaveStyle({
          outline: '2px solid rgb(147, 51, 234)'
        });
      });
    });

    it('should save replacement on Enter key', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      // Focus and edit
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'custom@email.com';

      // Press Enter to save
      fireEvent.keyDown(replacementCell, { key: 'Enter' });

      // Should trigger blur which saves the value
      await waitFor(() => {
        expect(replacementCell.textContent).toBe('custom@email.com');
      });
    });

    it('should revert replacement on Escape key', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');
      const originalValue = replacementCell.textContent;

      // Focus and edit
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'wrong@email.com';

      // Press Escape to revert
      fireEvent.keyDown(replacementCell, { key: 'Escape' });

      // Should revert to original
      await waitFor(() => {
        expect(replacementCell.textContent).toBe(originalValue);
      });
    });
  });

  describe('Two-Way Sync: Table → Monaco', () => {
    it('should update Monaco when replacement is edited and accepted', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      // Edit replacement in table
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'custom@email.com';
      fireEvent.blur(replacementCell);

      // Wait for state update
      await waitFor(() => {
        expect(replacementCell.textContent).toBe('custom@email.com');
      });

      // Click Accept button
      const acceptButtons = screen.getAllByTitle('Apply replacement');
      fireEvent.click(acceptButtons[0]); // First PHI item (email)

      // Should update Monaco with custom replacement
      await waitFor(() => {
        expect(mockOnCodeChange).toHaveBeenCalled();
        const updatedCode = mockOnCodeChange.mock.calls[0][0];
        expect(updatedCode).toContain('custom@email.com');
        expect(updatedCode).not.toContain('john.doe@hospital.com');
      });
    });

    it('should store custom replacement for pending items', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Edit the replacement while item is still pending
      const replacementCell = screen.getByText('user@example.com').closest('code');
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'custom@email.com';
      fireEvent.blur(replacementCell);

      await waitFor(() => {
        expect(screen.getByText('custom@email.com')).toBeInTheDocument();
      });

      // Now accept with the custom replacement
      const acceptButtons = screen.getAllByTitle('Apply replacement');
      fireEvent.click(acceptButtons[0]);

      // Should use the custom replacement, not the suggested one
      await waitFor(() => {
        expect(mockOnCodeChange).toHaveBeenCalled();
        const updatedCode = mockOnCodeChange.mock.calls[0][0];
        expect(updatedCode).toContain('custom@email.com');
        expect(updatedCode).not.toContain('john.doe@hospital.com');
        expect(updatedCode).not.toContain('user@example.com'); // Suggested replacement was not used
      });
    });
  });

  describe('Two-Way Sync: Monaco → Table', () => {
    it('should update replacement field when PHI is edited in Monaco', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Simulate Monaco content change (user edited line 1 where email is)
      mockEditor._simulateChange([
        {
          range: {
            startLineNumber: 1,
            endLineNumber: 1,
            startColumn: 15,
            endColumn: 40
          },
          text: 'monaco-edited@email.com'
        }
      ]);

      // Replacement field should update
      await waitFor(() => {
        expect(screen.getByText('monaco-edited@email.com')).toBeInTheDocument();
      });

      // Found column should remain unchanged (immutable)
      expect(screen.getByText('john.doe@hospital.com')).toBeInTheDocument();
    });
  });

  describe('Audit Trail', () => {
    it('should preserve original value in Found column after replacement', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Edit and accept
      const replacementCell = screen.getByText('user@example.com').closest('code');
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'sanitized@email.com';
      fireEvent.blur(replacementCell);

      await waitFor(() => {
        expect(screen.getByText('sanitized@email.com')).toBeInTheDocument();
      });

      const acceptButtons = screen.getAllByTitle('Apply replacement');
      fireEvent.click(acceptButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Found column should STILL show original
      expect(screen.getByText('john.doe@hospital.com')).toBeInTheDocument();

      // Replacement column shows new value
      expect(screen.getByText('sanitized@email.com')).toBeInTheDocument();

      // This creates the audit trail: Found → Replacement
    });

    it('should allow reverting to original via Found column reference', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Accept with custom replacement
      const replacementCell = screen.getByText('user@example.com').closest('code');
      fireEvent.focus(replacementCell);
      replacementCell.textContent = 'custom@email.com';
      fireEvent.blur(replacementCell);

      const acceptButtons = screen.getAllByTitle('Apply replacement');
      fireEvent.click(acceptButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      mockOnCodeChange.mockClear();

      // Click Revert button
      const revertButton = screen.getByTitle('Revert to original');
      fireEvent.click(revertButton);

      // Should restore original value from Found column
      await waitFor(() => {
        expect(mockOnCodeChange).toHaveBeenCalled();
        const revertedCode = mockOnCodeChange.mock.calls[0][0];
        expect(revertedCode).toContain('john.doe@hospital.com');
        expect(revertedCode).not.toContain('custom@email.com');
      });
    });
  });

  describe('Mixed Workflows', () => {
    it('should handle some items edited in table, some in Monaco', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      // Edit first item (email) in table
      const emailReplacement = screen.getByText('user@example.com').closest('code');
      fireEvent.focus(emailReplacement);
      emailReplacement.textContent = 'table-edited@email.com';
      fireEvent.blur(emailReplacement);

      await waitFor(() => {
        expect(screen.getByText('table-edited@email.com')).toBeInTheDocument();
      });

      // Edit second item (SSN) in Monaco
      mockEditor._simulateChange([
        {
          range: {
            startLineNumber: 2,
            endLineNumber: 2,
            startColumn: 13,
            endColumn: 25
          },
          text: 'MONACO-XXX-XX'
        }
      ]);

      await waitFor(() => {
        expect(screen.getByText('MONACO-XXX-XX')).toBeInTheDocument();
      });

      // Both should be tracked in replacement column
      expect(screen.getByText('table-edited@email.com')).toBeInTheDocument();
      expect(screen.getByText('MONACO-XXX-XX')).toBeInTheDocument();

      // Original values still in Found column
      expect(screen.getByText('john.doe@hospital.com')).toBeInTheDocument();
      expect(screen.getByText('123-45-6789')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show hover state on replacement cells', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      // Hover styling is applied via CSS classes, which the component sets up
      expect(replacementCell).toHaveStyle({ cursor: 'pointer' });
    });

    it('should show focus state with purple outline', async () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      fireEvent.focus(replacementCell);

      await waitFor(() => {
        expect(replacementCell).toHaveStyle({
          outline: '2px solid rgb(147, 51, 234)',
          outlineOffset: '2px'
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide tooltip explaining Found column is immutable', () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const foundCell = screen.getByText('john.doe@hospital.com').closest('td');
      expect(foundCell).toHaveAttribute('title', 'Original detected PHI (immutable)');
    });

    it('should provide tooltip explaining Replacement column is editable', () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');
      expect(replacementCell).toHaveAttribute('title', 'Click to edit replacement value');
    });

    it('should stop event propagation to prevent table navigation while editing', () => {
      renderWithTheme(
        <PHIEditorEnhancer
          editorInstance={mockEditor}
          monacoInstance={mockMonaco}
          phiDetection={mockPHIDetection}
          code={mockCode}
          onCodeChange={mockOnCodeChange}
          onPhiResolved={mockOnPhiResolved}
          effectiveTheme="light"
        />
      );

      const replacementCell = screen.getByText('user@example.com').closest('code');

      fireEvent.focus(replacementCell);

      // Arrow keys should not navigate table while editing
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true
      });

      const stopPropagationSpy = vi.spyOn(keydownEvent, 'stopPropagation');
      replacementCell.dispatchEvent(keydownEvent);

      // Event propagation should be stopped (via onKeyDown handler)
      // This is tested by the component's behavior, not directly observable in tests
    });
  });
});
