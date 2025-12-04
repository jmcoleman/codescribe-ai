/**
 * Tests for FileActions Component
 *
 * Tests the dropdown menu for per-file actions including:
 * - Menu visibility and keyboard navigation
 * - Regenerate action (requires documentation AND content)
 * - Remove action
 *
 * Note: View History and Download actions were removed - history UI not built yet,
 * download available in DocPanel
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
    content: 'const test = true;',  // Required for Regenerate action
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

  // Note: View History tests removed - feature not yet built out

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

  // Note: Download action was removed - download is available in DocPanel instead

  describe('Remove Action', () => {
    it('should always show "Delete"', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /^Delete$/i })).toBeInTheDocument();
    });

    it('should call onRemove when clicked', async () => {
      const user = userEvent.setup();
      render(<FileActions file={mockFile} onRemove={mockOnRemove} />);

      const menuButton = screen.getByRole('button', { name: /File actions/i });
      await user.click(menuButton);

      const removeBtn = screen.getByRole('menuitem', { name: /^Delete$/i });
      await user.click(removeBtn);

      expect(mockOnRemove).toHaveBeenCalled();
    });
  });
});
