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
      // All action buttons (Apply, Delete, Generate) are always visible but disabled when nothing selected
      expect(screen.getByRole('button', { name: /Apply/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
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

    it('should call onDeleteSelected when Delete is clicked and confirmed', async () => {
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

      // Click Delete button to open confirmation modal
      const deleteBtn = screen.getByRole('button', { name: /Delete 1 selected file/i });
      await user.click(deleteBtn);

      // Confirm deletion in modal
      const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
      await user.click(confirmBtn);

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

  describe('Local File Re-upload', () => {
    const localFiles = [
      {
        id: 'local-1',
        filename: 'component.jsx',
        language: 'javascript',
        fileSize: 2048,
        content: 'old content',
        origin: 'upload', // Local files use 'upload' origin
        documentation: null,
        qualityScore: null,
        isGenerating: false,
        error: null,
        documentId: null
      },
      {
        id: 'local-2',
        filename: 'utils.js',
        language: 'javascript',
        fileSize: 1024,
        content: 'old utils',
        origin: 'paste', // Or 'paste' for pasted content
        documentation: null,
        qualityScore: null,
        isGenerating: false,
        error: null,
        documentId: null
      }
    ];

    it('should show re-upload button when local files exist', () => {
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
        />
      );

      const reuploadBtn = screen.getByRole('button', { name: /Re-upload 2 local files/i });
      expect(reuploadBtn).toBeInTheDocument();
      expect(reuploadBtn).not.toBeDisabled();
    });

    it('should NOT show re-upload button when no local files exist', () => {
      const githubFiles = [
        {
          id: 'github-1',
          filename: 'app.js',
          language: 'javascript',
          fileSize: 2048,
          content: 'github content',
          origin: 'github',
          github: { repo: 'owner/repo', path: 'src/app.js', branch: 'main' },
          documentation: null,
          qualityScore: null,
          isGenerating: false,
          error: null,
          documentId: null
        }
      ];

      render(
        <FileList
          {...defaultProps}
          files={githubFiles}
        />
      );

      // Re-upload button should be disabled since no local files
      const reuploadBtn = screen.getByRole('button', { name: /Re-upload 0 local files/i });
      expect(reuploadBtn).toBeDisabled();
    });

    it('should have hidden file input for re-upload', () => {
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
        />
      );

      const fileInput = document.querySelector('input[type="file"][multiple]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('should trigger file input click when re-upload button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
        />
      );

      const fileInput = document.querySelector('input[type="file"][multiple]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const reuploadBtn = screen.getByRole('button', { name: /Re-upload 2 local files/i });
      await user.click(reuploadBtn);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should count files with upload origin as local files', () => {
      const mixedFiles = [
        {
          id: 'upload-file-1',
          filename: 'uploaded.js',
          language: 'javascript',
          fileSize: 1024,
          content: 'content',
          origin: 'upload', // Files with upload origin are counted as local
          documentation: null,
          qualityScore: null,
          isGenerating: false,
          error: null,
          documentId: null
        }
      ];

      render(
        <FileList
          {...defaultProps}
          files={mixedFiles}
        />
      );

      const reuploadBtn = screen.getByRole('button', { name: /Re-upload 1 local file/i });
      expect(reuploadBtn).toBeInTheDocument();
      expect(reuploadBtn).not.toBeDisabled();
    });

    it('should call onUpdateFile when files are re-uploaded and matched', async () => {
      const mockOnUpdateFile = vi.fn();
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
          onUpdateFile={mockOnUpdateFile}
        />
      );

      const fileInput = document.querySelector('input[type="file"][multiple]');

      // Create a mock file that matches an existing local file
      const mockFile = new File(['new content'], 'component.jsx', { type: 'text/javascript' });

      // Simulate file selection
      await userEvent.upload(fileInput, mockFile);

      // Wait for async file reading
      await vi.waitFor(() => {
        expect(mockOnUpdateFile).toHaveBeenCalledWith('local-1', {
          content: 'new content',
          fileSize: 11 // 'new content'.length
        });
      });
    });

    it('should NOT call onUpdateFile for non-matching files', async () => {
      const mockOnUpdateFile = vi.fn();
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
          onUpdateFile={mockOnUpdateFile}
        />
      );

      const fileInput = document.querySelector('input[type="file"][multiple]');

      // Create a mock file that does NOT match any existing file
      const mockFile = new File(['content'], 'nonexistent.js', { type: 'text/javascript' });

      await userEvent.upload(fileInput, mockFile);

      // Wait a bit to ensure no call is made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOnUpdateFile).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Re-upload Button', () => {
    const localFiles = [
      {
        id: 'local-1',
        filename: 'mobile.js',
        language: 'javascript',
        fileSize: 1024,
        content: 'content',
        origin: 'upload', // Local files use 'upload' origin
        documentation: null,
        qualityScore: null,
        isGenerating: false,
        error: null,
        documentId: null
      }
    ];

    it('should show mobile re-upload button with correct label', () => {
      render(
        <FileList
          {...defaultProps}
          files={localFiles}
          isMobile={true}
        />
      );

      // Mobile shows "Local (1)" format
      expect(screen.getByText(/Local \(1\)/)).toBeInTheDocument();
    });
  });
});
