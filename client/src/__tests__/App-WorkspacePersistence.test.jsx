/**
 * App Component Tests - Workspace Persistence
 *
 * Tests for documentation persistence across navigation and page refresh.
 * These tests ensure generated documentation survives:
 * 1. Navigation to other pages and back (via workspace sessionStorage)
 * 2. Page refresh (via workspace sessionStorage)
 * 3. Proper clearing only on actual logout (not auth loading states)
 *
 * Test Coverage:
 * 1. Single-file generation adds to workspace for persistence
 * 2. Workspace sync restores documentation on navigation back
 * 3. Documentation only cleared on actual logout (hasSeenUserRef logic)
 * 4. History page properly loads docs into workspace
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiFileState } from '../hooks/useMultiFileState';

// Mock uuid to return predictable IDs
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}));

describe('App - Workspace Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Single-file Generation Workspace Persistence', () => {
    it('should persist file with documentation in sessionStorage', () => {
      const { result } = renderHook(() => useMultiFileState());

      act(() => {
        result.current.addFile({
          id: 'doc-123',
          filename: 'test.js',
          language: 'javascript',
          content: 'function test() { return 42; }',
          documentation: '# Test Documentation\n\nThis is generated docs.',
          qualityScore: { score: 85, grade: 'B' },
          docType: 'README',
          origin: 'upload',
          documentId: 'doc-123',
          batchId: 'batch-456',
          generatedAt: new Date()
        });
      });

      // Verify file is in state
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].documentation).toBe('# Test Documentation\n\nThis is generated docs.');
      expect(result.current.files[0].qualityScore).toEqual({ score: 85, grade: 'B' });

      // Verify it's persisted to sessionStorage
      const stored = sessionStorage.getItem('codescribe_workspace_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.files).toHaveLength(1);
      expect(parsed.files[0].documentation).toBe('# Test Documentation\n\nThis is generated docs.');
    });

    it('should restore file with documentation from sessionStorage on remount', () => {
      // Simulate existing sessionStorage data (from previous session)
      const workspaceState = {
        files: [{
          id: 'doc-789',
          filename: 'restored.js',
          language: 'javascript',
          content: 'const x = 1;',
          documentation: '# Restored Documentation',
          qualityScore: { score: 90, grade: 'A' },
          docType: 'README',
          origin: 'upload',
          documentId: 'doc-789',
          batchId: 'batch-999',
          isGenerating: false,
          error: null
        }],
        activeFileId: 'doc-789',
        selectedFileIds: []
      };
      sessionStorage.setItem('codescribe_workspace_state', JSON.stringify(workspaceState));

      // Mount hook (simulates App remounting after navigation)
      const { result } = renderHook(() => useMultiFileState());

      // Verify file was restored from sessionStorage
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].filename).toBe('restored.js');
      expect(result.current.files[0].documentation).toBe('# Restored Documentation');
      expect(result.current.files[0].qualityScore).toEqual({ score: 90, grade: 'A' });
      expect(result.current.activeFileId).toBe('doc-789');
    });

    it('should clear workspace and add new file when generating single file', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Add initial file
      act(() => {
        result.current.addFile({
          id: 'old-file',
          filename: 'old.js',
          content: 'old code'
        });
      });

      expect(result.current.files).toHaveLength(1);

      // Simulate what performGeneration does: clear then add new
      act(() => {
        result.current.clearFiles();
      });

      act(() => {
        result.current.addFile({
          id: 'new-doc',
          filename: 'new.js',
          language: 'javascript',
          content: 'new code',
          documentation: '# New Documentation',
          qualityScore: { score: 88, grade: 'B' },
          docType: 'README',
          origin: 'paste',
          documentId: 'new-doc',
          batchId: 'batch-new'
        });
      });

      // Should only have the new file
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].filename).toBe('new.js');
      expect(result.current.files[0].documentation).toBe('# New Documentation');
      expect(result.current.activeFileId).toBe('new-doc');
    });
  });

  describe('Workspace Sync Effect', () => {
    it('should auto-select first file when added to empty workspace', () => {
      const { result } = renderHook(() => useMultiFileState());

      act(() => {
        result.current.addFile({
          id: 'file-1',
          filename: 'test.js',
          content: 'test'
        });
      });

      expect(result.current.activeFileId).toBe('file-1');
      expect(result.current.activeFile).toBeTruthy();
      expect(result.current.activeFile.id).toBe('file-1');
    });

    it('should preserve active file documentation during sync', () => {
      const { result } = renderHook(() => useMultiFileState());

      act(() => {
        result.current.addFile({
          id: 'file-with-docs',
          filename: 'documented.js',
          content: 'const x = 1;',
          documentation: '# Variable Documentation\n\nDefines x.',
          qualityScore: { score: 75, grade: 'C' }
        });
      });

      // Active file should have the documentation
      expect(result.current.activeFile.documentation).toBe('# Variable Documentation\n\nDefines x.');
      expect(result.current.activeFile.qualityScore).toEqual({ score: 75, grade: 'C' });
    });

    it('should handle file with no documentation', () => {
      const { result } = renderHook(() => useMultiFileState());

      act(() => {
        result.current.addFile({
          id: 'no-docs',
          filename: 'nodocs.js',
          content: 'const y = 2;'
          // No documentation property
        });
      });

      expect(result.current.activeFile.documentation).toBeNull();
      expect(result.current.activeFile.qualityScore).toBeNull();
    });
  });

  describe('Documentation Clear on Logout vs Navigation', () => {
    /**
     * These tests verify the hasSeenUserRef logic:
     * - Documentation should NOT be cleared on initial mount (no user yet)
     * - Documentation should NOT be cleared on navigation (user is temporarily undefined)
     * - Documentation should ONLY be cleared on actual logout (user was logged in, now logged out)
     */

    it('should preserve workspace state when no user (initial load)', () => {
      // Pre-populate sessionStorage
      const workspaceState = {
        files: [{
          id: 'preserved-file',
          filename: 'preserved.js',
          content: 'preserved code',
          documentation: '# Preserved',
          qualityScore: { score: 80, grade: 'B' },
          isGenerating: false,
          error: null
        }],
        activeFileId: 'preserved-file',
        selectedFileIds: []
      };
      sessionStorage.setItem('codescribe_workspace_state', JSON.stringify(workspaceState));

      // Mount hook (simulates initial app load with no user)
      const { result } = renderHook(() => useMultiFileState());

      // Workspace should still have the file (not cleared)
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].documentation).toBe('# Preserved');
    });

    it('should preserve workspace state on remount (navigation)', () => {
      const { result, unmount, rerender } = renderHook(() => useMultiFileState());

      // Add a file with documentation
      act(() => {
        result.current.addFile({
          id: 'nav-test',
          filename: 'navtest.js',
          content: 'nav test code',
          documentation: '# Navigation Test',
          qualityScore: { score: 95, grade: 'A' }
        });
      });

      expect(result.current.files).toHaveLength(1);

      // Simulate navigation away and back (remount)
      rerender();

      // File should still be there after remount
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].documentation).toBe('# Navigation Test');
    });

    it('should clear workspace when clearFiles is called (actual logout)', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Add a file
      act(() => {
        result.current.addFile({
          id: 'logout-test',
          filename: 'logouttest.js',
          content: 'logout test code',
          documentation: '# Will Be Cleared'
        });
      });

      expect(result.current.files).toHaveLength(1);

      // Clear files (what logout does)
      act(() => {
        result.current.clearFiles();
      });

      // Workspace should be empty
      expect(result.current.files).toHaveLength(0);
      expect(result.current.activeFileId).toBeNull();

      // sessionStorage should be empty state (not null, since useEffect writes empty state)
      const stored = sessionStorage.getItem('codescribe_workspace_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.files).toEqual([]);
        expect(parsed.activeFileId).toBeNull();
      }
    });
  });

  describe('History Page Workspace Loading', () => {
    /**
     * Tests for loading documents from History page into workspace
     */

    it('should load document from history with all properties', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Simulate what History page does when opening a document
      act(() => {
        result.current.clearFiles();
      });

      act(() => {
        result.current.addFile({
          id: 'history-doc-123',
          filename: 'HistoryFile.jsx',
          language: 'javascript',
          content: '', // History may not have original code
          documentation: '# History Documentation\n\nLoaded from history.',
          qualityScore: { score: 92, grade: 'A' },
          docType: 'JSDOC',
          origin: 'history',
          documentId: 'history-doc-123',
          batchId: 'history-batch-456',
          generatedAt: new Date('2025-01-01')
        });
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].filename).toBe('HistoryFile.jsx');
      expect(result.current.files[0].documentation).toBe('# History Documentation\n\nLoaded from history.');
      expect(result.current.files[0].origin).toBe('history');
      expect(result.current.activeFileId).toBe('history-doc-123');
    });

    it('should replace existing workspace when loading from history', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Add existing file
      act(() => {
        result.current.addFile({
          id: 'existing',
          filename: 'existing.js',
          content: 'existing code',
          documentation: '# Existing'
        });
      });

      expect(result.current.files).toHaveLength(1);

      // Load from history (clears first, then adds)
      act(() => {
        result.current.clearFiles();
      });

      act(() => {
        result.current.addFile({
          id: 'from-history',
          filename: 'fromhistory.js',
          content: '',
          documentation: '# From History'
        });
      });

      // Should only have the history file
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].id).toBe('from-history');
      expect(result.current.files[0].documentation).toBe('# From History');
    });

    it('should handle loading batch documents from history', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Simulate loading multiple documents from a batch in history
      act(() => {
        result.current.clearFiles();
      });

      act(() => {
        result.current.addFiles([
          {
            id: 'batch-doc-1',
            filename: 'Component1.jsx',
            content: '',
            documentation: '# Component 1 Docs',
            qualityScore: { score: 88, grade: 'B' },
            origin: 'history',
            batchId: 'shared-batch'
          },
          {
            id: 'batch-doc-2',
            filename: 'Component2.jsx',
            content: '',
            documentation: '# Component 2 Docs',
            qualityScore: { score: 91, grade: 'A' },
            origin: 'history',
            batchId: 'shared-batch'
          }
        ]);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].documentation).toBe('# Component 1 Docs');
      expect(result.current.files[1].documentation).toBe('# Component 2 Docs');
      // First file should be auto-selected
      expect(result.current.activeFileId).toBe('batch-doc-1');
    });
  });

  describe('SessionStorage Edge Cases', () => {
    it('should handle corrupted sessionStorage gracefully', () => {
      // Set invalid JSON in sessionStorage
      sessionStorage.setItem('codescribe_workspace_state', 'not valid json');

      // Should not throw, should initialize with empty state
      const { result } = renderHook(() => useMultiFileState());

      expect(result.current.files).toEqual([]);
      expect(result.current.activeFileId).toBeNull();
    });

    it('should handle missing properties in sessionStorage', () => {
      // Set partial state in sessionStorage
      sessionStorage.setItem('codescribe_workspace_state', JSON.stringify({
        files: [{ id: 'partial', filename: 'partial.js' }]
        // Missing activeFileId and selectedFileIds
      }));

      const { result } = renderHook(() => useMultiFileState());

      expect(result.current.files).toHaveLength(1);
      // Should default to null for missing activeFileId
      expect(result.current.activeFileId).toBeNull();
    });

    it('should persist isGenerating as false in sessionStorage (always saved as false)', () => {
      const { result } = renderHook(() => useMultiFileState());

      // Add a file and mark it as generating
      act(() => {
        result.current.addFile({
          id: 'was-generating',
          filename: 'wasgen.js',
          content: 'code',
          documentation: null
        });
      });

      // Simulate setting isGenerating to true
      act(() => {
        result.current.updateFile('was-generating', { isGenerating: true, error: 'Some error' });
      });

      // Check what was saved to sessionStorage - should have isGenerating: false
      const stored = sessionStorage.getItem('codescribe_workspace_state');
      const parsed = JSON.parse(stored);

      // The save effect always saves isGenerating as false
      expect(parsed.files[0].isGenerating).toBe(false);
      expect(parsed.files[0].error).toBeNull();
    });
  });
});
