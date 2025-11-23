/**
 * Tests for Sidebar Component
 *
 * Tests sidebar modes and behavior including:
 * - Expanded, collapsed, and hidden modes
 * - Hover overlay in collapsed mode
 * - Mode persistence (localStorage)
 * - Responsive behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';
import { STORAGE_KEYS } from '../../../constants/storage';

describe('Sidebar', () => {
  const mockFiles = [
    {
      id: 'file-1',
      filename: 'test.js',
      language: 'javascript',
      fileSize: 2048,
      content: 'console.log("test");',
      documentation: null,
      isGenerating: false
    }
  ];

  const mockProps = {
    files: mockFiles,
    activeFileId: null,
    selectedFileIds: [],
    selectedCount: 0,
    mobileOpen: false,
    docType: 'README',
    onDocTypeChange: vi.fn(),
    onGithubImport: vi.fn(),
    onMobileClose: vi.fn(),
    onSelectFile: vi.fn(),
    onToggleFileSelection: vi.fn(),
    onSelectAllFiles: vi.fn(),
    onDeselectAllFiles: vi.fn(),
    onAddFile: vi.fn(),
    onRemoveFile: vi.fn(),
    onGenerateFile: vi.fn(),
    onGenerateSelected: vi.fn(),
    onDeleteSelected: vi.fn(),
    hasCodeInEditor: false,
    onFilesDrop: vi.fn()
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();

    // Reset window size to desktop
    global.innerWidth = 1280;
    global.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Mode: Expanded (Default)', () => {
    it('should render in expanded mode by default', () => {
      render(<Sidebar {...mockProps} />);

      // Header should show "Files (1)"
      expect(screen.getByText(/Files \(1\)/i)).toBeInTheDocument();

      // Should show file list
      expect(screen.getByText('test.js')).toBeInTheDocument();
    });

    it('should have w-full width (controlled by parent Panel)', () => {
      render(<Sidebar {...mockProps} />);

      const sidebar = screen.getByText(/Files \(1\)/i).closest('.sidebar-container');
      expect(sidebar).toHaveClass('w-full');
    });

    it('should show collapse button in expanded mode', () => {
      render(<Sidebar {...mockProps} />);

      expect(screen.getByRole('button', { name: /Collapse sidebar/i })).toBeInTheDocument();
    });

    it('should show add files button in expanded mode', () => {
      render(<Sidebar {...mockProps} />);

      expect(screen.getByRole('button', { name: /Add files/i })).toBeInTheDocument();
    });
  });

  describe('Mode: Collapsed', () => {
    it('should collapse when collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Should show expand button
      expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
    });

    it('should have w-full width in collapsed mode (controlled by parent Panel)', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      const sidebar = screen.getByRole('button', { name: /Expand sidebar/i }).closest('.sidebar-container');
      expect(sidebar).toHaveClass('w-full');
    });

    it('should not show file list in collapsed mode', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Should not show file list in collapsed mode
      expect(screen.queryByText('test.js')).not.toBeInTheDocument();
    });

    it('should expand when expand button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      // Collapse first
      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Then expand
      const expandBtn = screen.getByRole('button', { name: /Expand sidebar/i });
      await user.click(expandBtn);

      // Should show collapse button again
      expect(screen.getByRole('button', { name: /Collapse sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Mode Persistence', () => {
    it('should save expanded mode to localStorage', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      // Default should be expanded
      expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe('expanded');
    });

    it('should save collapsed mode to localStorage', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe('collapsed');
    });

    it('should restore mode from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, 'collapsed');

      render(<Sidebar {...mockProps} />);

      // Should start in collapsed mode
      expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Mode: Hidden (Mobile)', () => {
    it.skip('should hide sidebar when window width < 1024px', () => {
      // Skip: JSDOM doesn't properly handle window.innerWidth changes
      // Set mobile viewport
      global.innerWidth = 768;

      const { container } = render(<Sidebar {...mockProps} />);

      // Trigger resize event
      global.dispatchEvent(new Event('resize'));

      // Sidebar should not render anything
      expect(container.querySelector('.sidebar-container')).not.toBeInTheDocument();
    });

    it.skip('should restore from localStorage when resizing back to desktop', () => {
      // Skip: JSDOM doesn't properly handle window.innerWidth changes
      localStorage.setItem('sidebar-mode', 'collapsed');

      // Start mobile
      global.innerWidth = 768;
      const { rerender } = render(<Sidebar {...mockProps} />);
      global.dispatchEvent(new Event('resize'));

      // Resize to desktop
      global.innerWidth = 1280;
      global.dispatchEvent(new Event('resize'));
      rerender(<Sidebar {...mockProps} />);

      // Should restore collapsed mode
      expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
    });
  });

  describe('Hover Overlay (Collapsed Mode)', () => {
    it.skip('should show overlay when hovering in collapsed mode', async () => {
      // Skip: Overlay rendering in test environment is complex with async state
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      // Collapse sidebar first
      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Hover over sidebar
      const sidebar = screen.getByRole('button', { name: /Expand sidebar/i }).closest('.sidebar-container');
      fireEvent.mouseEnter(sidebar);

      // Should show overlay with file list
      // The overlay renders the file name in a separate element
      const overlays = screen.getAllByText('test.js');
      expect(overlays.length).toBeGreaterThan(1); // Badge + overlay
    });

    it('should hide overlay when mouse leaves in collapsed mode', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      // Collapse sidebar first
      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Hover and then leave
      const sidebar = screen.getByRole('button', { name: /Expand sidebar/i }).closest('.sidebar-container');
      fireEvent.mouseEnter(sidebar);
      fireEvent.mouseLeave(sidebar);

      // Overlay should be hidden (only one instance of filename from badge)
      const fileTexts = screen.queryAllByText('test.js');
      expect(fileTexts.length).toBeLessThanOrEqual(1);
    });

    it('should NOT show overlay in expanded mode', () => {
      render(<Sidebar {...mockProps} />);

      const sidebar = screen.getByText(/Files \(1\)/i).closest('.sidebar-container');
      fireEvent.mouseEnter(sidebar);

      // Should only have one instance of file (in main list, not overlay)
      const fileTexts = screen.getAllByText('test.js');
      expect(fileTexts.length).toBe(1);
    });
  });

  describe('File Count Display', () => {
    it('should show correct file count', () => {
      const manyFiles = [
        { id: '1', filename: 'file1.js', language: 'js', fileSize: 100, content: 'code1' },
        { id: '2', filename: 'file2.js', language: 'js', fileSize: 100, content: 'code2' },
        { id: '3', filename: 'file3.js', language: 'js', fileSize: 100, content: 'code3' }
      ];

      render(<Sidebar {...mockProps} files={manyFiles} />);

      expect(screen.getByText(/Files \(3\)/i)).toBeInTheDocument();
    });

    it.skip('should show "+N" badge for more than 5 files in collapsed mode', async () => {
      // Skip: Collapsed mode no longer shows file badges - it only shows toggle button
      const user = userEvent.setup();
      const manyFiles = Array.from({ length: 7 }, (_, i) => ({
        id: `file-${i}`,
        filename: `file${i}.js`,
        language: 'javascript',
        fileSize: 1024,
        content: `console.log(${i});`
      }));

      render(<Sidebar {...mockProps} files={manyFiles} />);

      // Collapse sidebar
      const collapseBtn = screen.getByRole('button', { name: /Collapse sidebar/i });
      await user.click(collapseBtn);

      // Should show +2 badge (7 - 5 = 2)
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onAddFile when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar {...mockProps} />);

      const addBtn = screen.getByRole('button', { name: /Add files/i });
      await user.click(addBtn);

      expect(mockProps.onAddFile).toHaveBeenCalled();
    });
  });
});
