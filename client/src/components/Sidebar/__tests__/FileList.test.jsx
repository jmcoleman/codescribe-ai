/**
 * Tests for FileList Component
 *
 * Tests file list display and bulk actions including:
 * - Empty state
 * - File list rendering
 * - Bulk action buttons (Generate All, Clear All)
 * - Progress indicators
 */

import { describe, it, expect, vi } from 'vitest';
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
  const mockOnRemoveFile = vi.fn();
  const mockOnGenerateAll = vi.fn();
  const mockOnClearAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state when no files', () => {
      render(
        <FileList
          files={[]}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
      expect(screen.getByText('Upload files to get started')).toBeInTheDocument();
    });

    it('should NOT show bulk actions when no files', () => {
      render(
        <FileList
          files={[]}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.queryByRole('button', { name: /Generate All/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Clear All/i })).not.toBeInTheDocument();
    });
  });

  describe('File List Rendering', () => {
    it('should render all files', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.getByText('test1.js')).toBeInTheDocument();
      expect(screen.getByText('test2.ts')).toBeInTheDocument();
      expect(screen.getByText('test3.py')).toBeInTheDocument();
    });

    it('should show correct generation progress', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.getByText('1 / 3 generated')).toBeInTheDocument();
    });

    it('should show "Generating..." indicator when files are generating', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.getAllByText('Generating...').length).toBeGreaterThan(0);
    });
  });

  describe('Bulk Actions', () => {
    it('should show Generate All button when files exist', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      expect(screen.getByRole('button', { name: /Generate All/i })).toBeInTheDocument();
    });

    it('should enable Generate All when some files need generation', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /Generate All/i });
      expect(generateBtn).not.toBeDisabled();
    });

    it('should disable Generate All when all files are generated or generating', () => {
      const allGeneratedFiles = mockFiles.map(f => ({
        ...f,
        documentation: '# Test',
        isGenerating: false
      }));

      render(
        <FileList
          files={allGeneratedFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /Generate All/i });
      expect(generateBtn).toBeDisabled();
    });

    it('should call onGenerateAll when Generate All is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /Generate All/i });
      await user.click(generateBtn);

      expect(mockOnGenerateAll).toHaveBeenCalled();
    });

    it('should call onClearAll when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FileList
          files={mockFiles}
          activeFileId={null}
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      const clearBtn = screen.getByRole('button', { name: /Clear All/i });
      await user.click(clearBtn);

      expect(mockOnClearAll).toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('should pass activeFileId to FileItem', () => {
      render(
        <FileList
          files={mockFiles}
          activeFileId="file-1"
          onSelectFile={mockOnSelectFile}
          onRemoveFile={mockOnRemoveFile}
          onGenerateAll={mockOnGenerateAll}
          onClearAll={mockOnClearAll}
        />
      );

      // FileItem with activeFileId should have purple highlight
      const file1 = screen.getByRole('button', { name: /test1\.js/i });
      expect(file1).toHaveClass('bg-purple-50');
    });
  });
});
