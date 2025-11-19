/**
 * Tests for FileList Component
 *
 * Tests file list display and bulk actions including:
 * - Empty state
 * - File list rendering
 * - Bulk action buttons (Generate All, Clear All)
 * - Progress indicators
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileList } from '../FileList';

describe('FileList', () => {
  const mockFiles = [
    {
      id: 'file-1',
      filename: 'test1.js',
      language: 'javascript',
      fileSize: 2048,
      documentation: '# Test 1',
      qualityScore: { score: 85, grade: 'B' },
      isGenerating: false,
      error: null,
      documentId: null
    },
    {
      id: 'file-2',
      filename: 'test2.ts',
      language: 'typescript',
      fileSize: 3072,
      documentation: null,
      qualityScore: null,
      isGenerating: false,
      error: null,
      documentId: null
    },
    {
      id: 'file-3',
      filename: 'test3.py',
      language: 'python',
      fileSize: 1024,
      documentation: null,
      qualityScore: null,
      isGenerating: true,
      error: null,
      documentId: null
    }
  ];

  const mockOnSelectFile = vi.fn();
  const mockOnToggleFileSelection = vi.fn();
  const mockOnSelectAllFiles = vi.fn();
  const mockOnDeselectAllFiles = vi.fn();
  const mockOnRemoveFile = vi.fn();
  const mockOnAddFile = vi.fn();
  const mockOnGenerateFile = vi.fn();
  const mockOnGenerateSelected = vi.fn();
  const mockOnDeleteSelected = vi.fn();
  const mockOnToggleSidebar = vi.fn();
  const mockOnDocTypeChange = vi.fn();
  const mockOnGithubImport = vi.fn();
  const mockOnFilesDrop = vi.fn();

  const defaultProps = {
    activeFileId: null,
    selectedFileIds: [],
    selectedCount: 0,
    docType: 'README',
    hasCodeInEditor: false,
    onSelectFile: mockOnSelectFile,
    onToggleFileSelection: mockOnToggleFileSelection,
    onSelectAllFiles: mockOnSelectAllFiles,
    onDeselectAllFiles: mockOnDeselectAllFiles,
    onRemoveFile: mockOnRemoveFile,
    onAddFile: mockOnAddFile,
    onGenerateFile: mockOnGenerateFile,
    onGenerateSelected: mockOnGenerateSelected,
    onDeleteSelected: mockOnDeleteSelected,
    onToggleSidebar: mockOnToggleSidebar,
    onDocTypeChange: mockOnDocTypeChange,
    onGithubImport: mockOnGithubImport,
    onFilesDrop: mockOnFilesDrop
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state when no files', () => {
      render(
        <FileList
          {...defaultProps}
          files={[]}
        />
      );

      expect(screen.getByText('No files yet')).toBeInTheDocument();
      expect(screen.getByText(/Click the \+ button above to add files/i)).toBeInTheDocument();
    });

    it('should NOT show selection controls when no files', () => {
      render(
        <FileList
          {...defaultProps}
          files={[]}
        />
      );

      expect(screen.queryByRole('button', { name: /Select All/i })).not.toBeInTheDocument();
      // Generate button is always visible in new API, but should be disabled when no code
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    });
  });

  describe('File List Rendering', () => {
    it('should render all files', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
        />
      );

      expect(screen.getByText('test1.js')).toBeInTheDocument();
      expect(screen.getByText('test2.ts')).toBeInTheDocument();
      expect(screen.getByText('test3.py')).toBeInTheDocument();
    });

    it('should show correct generation progress', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
        />
      );

      expect(screen.getByText('1 / 3 generated')).toBeInTheDocument();
    });

    it('should show "Generating..." indicator when files are generating', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
        />
      );

      expect(screen.getAllByText('Generating...').length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Actions', () => {
    it('should show Generate button when files exist', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
        />
      );

      // New API uses "Generate" not "Generate All" - multiple buttons exist (one per file + bulk action)
      const generateButtons = screen.getAllByRole('button', { name: /Generate/i });
      expect(generateButtons.length).toBeGreaterThan(0);
    });

    it('should disable Generate when no files selected and no code in editor', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
          selectedCount={0}
          hasCodeInEditor={false}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /^Gen/ });
      expect(generateBtn).toBeDisabled();
    });

    it('should enable Generate when code exists in editor', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
          selectedCount={0}
          hasCodeInEditor={true}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /^Gen/ });
      expect(generateBtn).not.toBeDisabled();
    });

    it('should call onGenerateSelected when Generate is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
          hasCodeInEditor={true}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /^Gen/ });
      await user.click(generateBtn);

      expect(mockOnGenerateSelected).toHaveBeenCalled();
    });

    it('should call onDeleteSelected when Delete is clicked', async () => {
      const user = userEvent.setup();
      const filesWithSelection = mockFiles.map(f => ({ ...f, content: 'test code' }));
      render(
        <FileList
          {...defaultProps}
          files={filesWithSelection}
          selectedFileIds={['file-1']}
          selectedCount={1}
        />
      );

      const deleteBtn = screen.getByRole('button', { name: /Del/ });
      await user.click(deleteBtn);

      expect(mockOnDeleteSelected).toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('should pass activeFileId to FileItem', () => {
      render(
        <FileList
          {...defaultProps}
          files={mockFiles}
          activeFileId="file-1"
        />
      );

      // FileItem with activeFileId should have purple highlight
      const file1 = screen.getByRole('button', { name: /test1\.js/i });
      expect(file1).toHaveClass('bg-purple-50');
    });
  });
});
