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
    content: 'const test = "hello";',
    documentation: null,
    qualityScore: null,
    isGenerating: false,
    error: null,
    documentId: null
  };

  const mockOnSelect = vi.fn();
  const mockOnToggleSelection = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnGenerate = vi.fn();
  const mockOnViewDetails = vi.fn();

  // Default props for easier rendering
  const defaultProps = {
    file: mockFile,
    isActive: false,
    isSelected: false,
    onSelect: mockOnSelect,
    onToggleSelection: mockOnToggleSelection,
    onRemove: mockOnRemove,
    onGenerate: mockOnGenerate,
    onViewDetails: mockOnViewDetails
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render filename', () => {
      render(<FileItem {...defaultProps} />);

      expect(screen.getByText('test.js')).toBeInTheDocument();
    });

    it('should render file size', () => {
      render(<FileItem {...defaultProps} />);

      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('should render language', () => {
      render(<FileItem {...defaultProps} />);

      expect(screen.getByText('javascript')).toBeInTheDocument();
    });
  });

  describe('File States', () => {
    it('should show uploaded state (no icon text)', () => {
      render(<FileItem {...defaultProps} />);

      const fileItem = screen.getByRole('button', { name: /test\.js - Not generated/i });
      expect(fileItem).toBeInTheDocument();
    });

    it('should show generating state', () => {
      const generatingFile = { ...mockFile, isGenerating: true };
      render(<FileItem {...defaultProps} file={generatingFile} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /test\.js - Generating/i })).toBeInTheDocument();
    });

    it('should show generated state', () => {
      const generatedFile = {
        ...mockFile,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' }
      };
      render(<FileItem {...defaultProps} file={generatedFile} />);

      // Quality score is no longer shown in FileItem - only checkmark icon indicates generated state
      expect(screen.getByRole('button', { name: /test\.js - Generated/i })).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorFile = { ...mockFile, error: 'Generation failed' };
      render(<FileItem {...defaultProps} file={errorFile} />);

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });

    // Note: generatedDocType indicator was removed - checkmark icon shows generation status instead
  });

  describe('Active State', () => {
    it('should highlight when active', () => {
      render(<FileItem {...defaultProps} isActive={true} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem).toHaveClass('bg-purple-50');
    });

    it('should show star icon when active', () => {
      render(<FileItem {...defaultProps} isActive={true} />);

      // Star icon is rendered but might not have accessible text, check by class or parent
      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem.querySelector('svg[fill="currentColor"]')).toBeInTheDocument();
    });

    it('should not highlight when inactive', () => {
      render(<FileItem {...defaultProps} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      expect(fileItem).not.toHaveClass('bg-purple-50');
    });
  });

  // Note: Quality grades are no longer displayed in FileItem - they're shown in batch summary and DocPanel

  describe('Interactions', () => {
    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      render(<FileItem {...defaultProps} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      await user.click(fileItem);

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should call onSelect when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<FileItem {...defaultProps} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      fileItem.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should call onSelect when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<FileItem {...defaultProps} />);

      const fileItem = screen.getByRole('button', { name: /test\.js/i });
      fileItem.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes', () => {
      const tinyFile = { ...mockFile, fileSize: 500 };
      render(<FileItem {...defaultProps} file={tinyFile} />);

      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format kilobytes', () => {
      const kbFile = { ...mockFile, fileSize: 5120 };
      render(<FileItem {...defaultProps} file={kbFile} />);

      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    it('should format megabytes', () => {
      const mbFile = { ...mockFile, fileSize: 2097152 };
      render(<FileItem {...defaultProps} file={mbFile} />);

      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });
});
