/**
 * Tests for FileActions Component
 *
 * Tests the dropdown menu for per-file actions including:
 * - Menu visibility and keyboard navigation
 * - View in History action (NEW - only if documentId exists)
 * - Regenerate, Download, Remove actions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileActions } from '../FileActions';

describe('FileActions', () => {
  const mockFile = {
    id: 'file-1',
    filename: 'test.js',
    documentation: '# Test Documentation',
    documentId: null
  };

  const mockOnRemove = vi.fn();

  describe('Menu Visibility', () => {
    it('should render menu button', () => {
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      expect(screen.getByRole('button', { name: /File actions/i })).toBeInTheDocument();
    });

    it('should open menu when button is clicked', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should close menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      // Click outside (document body)
      await user.click(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should close menu when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('View in History Action (NEW)', () => {
    it('should NOT show "View in History" if documentId is null', async () => {
      const user = userEvent.setup();
      const fileWithoutDocId = { ...mockFile, documentId: null };

      render(<FileActions file={fileWithoutDocId} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.queryByRole('menuitem', { name: /View in History/i })).not.toBeInTheDocument();
    });

    it('should show "View in History" if documentId exists', async () => {
      const user = userEvent.setup();
      const fileWithDocId = { ...mockFile, documentId: 'doc-123' };

      render(<FileActions file={fileWithDocId} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /View in History/i })).toBeInTheDocument();
    });

    it('should navigate to dashboard when "View in History" is clicked', async () => {
      const user = userEvent.setup();
      const fileWithDocId = { ...mockFile, documentId: 'doc-123' };

      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      render(<FileActions file={fileWithDocId} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      const viewHistoryBtn = screen.getByRole('menuitem', { name: /View in History/i });
      await user.click(viewHistoryBtn);

      expect(window.location.href).toBe('/dashboard?doc=doc-123');
    });
  });

  describe('Regenerate Action', () => {
    it('should show "Regenerate" if documentation exists', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /Regenerate/i })).toBeInTheDocument();
    });

    it('should NOT show "Regenerate" if no documentation', async () => {
      const user = userEvent.setup();
      const fileWithoutDocs = { ...mockFile, documentation: null };

      render(<FileActions file={fileWithoutDocs} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.queryByRole('menuitem', { name: /Regenerate/i })).not.toBeInTheDocument();
    });
  });

  describe('Download Action', () => {
    it('should show "Download Docs" if documentation exists', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /Download Docs/i })).toBeInTheDocument();
    });

    it('should NOT show "Download Docs" if no documentation', async () => {
      const user = userEvent.setup();
      const fileWithoutDocs = { ...mockFile, documentation: null };

      render(<FileActions file={fileWithoutDocs} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.queryByRole('menuitem', { name: /Download Docs/i })).not.toBeInTheDocument();
    });

    it.skip('should trigger download when clicked', async () => {
      const user = userEvent.setup();

      // Mock createElement, appendChild, removeChild, and URL methods
      const mockAnchor = document.createElement('a');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      mockAnchor.click = vi.fn();

      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      const downloadBtn = screen.getByRole('menuitem', { name: /Download Docs/i });
      await user.click(downloadBtn);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test.js.md');
      expect(mockAnchor.click).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Remove Action', () => {
    it('should always show "Delete"', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /^Delete$/i })).toBeInTheDocument();
    });

    it('should call onRemove when clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      const removeBtn = screen.getByRole('menuitem', { name: /^Delete$/i });
      await user.click(removeBtn);

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });
});
