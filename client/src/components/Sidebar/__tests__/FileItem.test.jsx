/**
 * Tests for FileItem Component
 *
 * Tests file card display including:
 * - File states (uploaded, generating, generated, error)
 * - Active state highlighting
 * - File metadata display
 * - Click interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileItem } from '../FileItem';

describe('FileItem', () => {
  const mockFile = {
    id: 'file-1',
    filename: 'test.js',
    language: 'javascript',
    fileSize: 2048,
    documentation: null,
    qualityScore: null,
    isGenerating: false,
    error: null,
    documentId: null
  };

  const mockOnSelect = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render filename', () => {
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('test.js')).toBeInTheDocument();
    });

    it('should render file size', () => {
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('should render language', () => {
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('javascript')).toBeInTheDocument();
    });
  });

  describe('File States', () => {
    it('should show uploaded state (no icon text)', () => {
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js - Not generated/i });
      expect(fileItem).toBeInTheDocument();
    });

    it('should show generating state', () => {
      const generatingFile = { ...mockFile, isGenerating: true };
      render(<FileItem file={generatingFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /test\.js - Generating/i })).toBeInTheDocument();
    });

    it('should show generated state with quality score', () => {
      const generatedFile = {
        ...mockFile,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' }
      };
      render(<FileItem file={generatedFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText(/B 85/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /test\.js - Generated/i })).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorFile = { ...mockFile, error: 'Generation failed' };
      render(<FileItem file={errorFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });

    it('should show saved to database indicator', () => {
      const savedFile = { ...mockFile, documentation: '# Test', documentId: 'doc-123' };
      render(<FileItem file={savedFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('Saved to database')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight when active', () => {
      render(<FileItem file={mockFile} isActive={true} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem).toHaveClass('bg-purple-50');
    });

    it('should show star icon when active', () => {
      render(<FileItem file={mockFile} isActive={true} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      // Star icon is rendered but might not have accessible text, check by class or parent
      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem.querySelector('svg[fill="currentColor"]')).toBeInTheDocument();
    });

    it('should not highlight when inactive', () => {
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem).not.toHaveClass('bg-purple-50');
    });
  });

  describe('Quality Grades', () => {
    it('should render grade A with green color', () => {
      const fileA = {
        ...mockFile,
        documentation: '# Test',
        qualityScore: { score: 95, grade: 'A' }
      };
      render(<FileItem file={fileA} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const gradeBadge = screen.getByText(/A 95/i);
      expect(gradeBadge).toHaveClass('text-green-700');
    });

    it('should render grade B with blue color', () => {
      const fileB = {
        ...mockFile,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' }
      };
      render(<FileItem file={fileB} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const gradeBadge = screen.getByText(/B 85/i);
      expect(gradeBadge).toHaveClass('text-blue-700');
    });

    it('should render grade F with red color', () => {
      const fileF = {
        ...mockFile,
        documentation: '# Test',
        qualityScore: { score: 45, grade: 'F' }
      };
      render(<FileItem file={fileF} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const gradeBadge = screen.getByText(/F 45/i);
      expect(gradeBadge).toHaveClass('text-red-700');
    });
  });

  describe('Interactions', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      await user.click(fileItem);

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should call onSelect when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      fileItem.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should call onSelect when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<FileItem file={mockFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      fileItem.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes', () => {
      const tinyFile = { ...mockFile, fileSize: 500 };
      render(<FileItem file={tinyFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format kilobytes', () => {
      const kbFile = { ...mockFile, fileSize: 5120 };
      render(<FileItem file={kbFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    it('should format megabytes', () => {
      const mbFile = { ...mockFile, fileSize: 2097152 };
      render(<FileItem file={mbFile} isActive={false} onSelect={mockOnSelect} onRemove={mockOnRemove} />);

      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });
});
