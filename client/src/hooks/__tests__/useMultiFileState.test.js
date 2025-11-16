/**
 * Tests for useMultiFileState Hook
 *
 * Tests multi-file state management including:
 * - Adding/removing files
 * - Updating file properties
 * - Active file selection
 * - File retrieval operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiFileState } from '../useMultiFileState';

describe('useMultiFileState', () => {
  let hook;

  beforeEach(() => {
    const { result } = renderHook(() => useMultiFileState());
    hook = result;
  });

  describe('Initial State', () => {
    it('should initialize with empty file list', () => {
      expect(hook.current.files).toEqual([]);
      expect(hook.current.fileCount).toBe(0);
      expect(hook.current.hasFiles).toBe(false);
    });

    it('should initialize with no active file', () => {
      expect(hook.current.activeFileId).toBeNull();
      expect(hook.current.activeFile).toBeNull();
    });
  });

  describe('addFile', () => {
    it('should add a file with all properties', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          language: 'javascript',
          content: 'console.log("test");',
          docType: 'README',
          origin: 'upload'
        });
      });

      expect(hook.current.files).toHaveLength(1);
      expect(hook.current.fileCount).toBe(1);
      expect(hook.current.hasFiles).toBe(true);

      const file = hook.current.files[0];
      expect(file.id).toBe(fileId);
      expect(file.filename).toBe('test.js');
      expect(file.language).toBe('javascript');
      expect(file.content).toBe('console.log("test");');
      expect(file.docType).toBe('README');
      expect(file.origin).toBe('upload');
      expect(file.documentation).toBeNull();
      expect(file.qualityScore).toBeNull();
      expect(file.isGenerating).toBe(false);
      expect(file.error).toBeNull();
      expect(file.documentId).toBeNull();
    });

    it('should auto-select first file as active', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          content: 'test'
        });
      });

      expect(hook.current.activeFileId).toBe(fileId);
      expect(hook.current.activeFile).toBeTruthy();
      expect(hook.current.activeFile.id).toBe(fileId);
    });

    it('should not change active file when adding second file', () => {
      let firstId, secondId;
      act(() => {
        firstId = hook.current.addFile({ filename: 'first.js', content: 'first' });
      });
      act(() => {
        secondId = hook.current.addFile({ filename: 'second.js', content: 'second' });
      });

      expect(hook.current.files).toHaveLength(2);
      expect(hook.current.activeFileId).toBe(firstId);
      expect(hook.current.activeFile.filename).toBe('first.js');
    });

    it('should use default values for missing properties', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({});
      });

      const file = hook.current.files[0];
      expect(file.filename).toBe('untitled.js');
      expect(file.language).toBe('javascript');
      expect(file.content).toBe('');
      expect(file.docType).toBe('README');
      expect(file.origin).toBe('upload');
      expect(file.fileSize).toBe(0);
    });

    it('should calculate file size from content', () => {
      act(() => {
        hook.current.addFile({
          filename: 'test.js',
          content: 'test content'
        });
      });

      expect(hook.current.files[0].fileSize).toBe('test content'.length);
    });
  });

  describe('addFiles', () => {
    it('should add multiple files at once', () => {
      let fileIds;
      act(() => {
        fileIds = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' },
          { filename: 'third.js', content: 'third' }
        ]);
      });

      expect(hook.current.files).toHaveLength(3);
      expect(fileIds).toHaveLength(3);
      expect(hook.current.files[0].filename).toBe('first.js');
      expect(hook.current.files[1].filename).toBe('second.js');
      expect(hook.current.files[2].filename).toBe('third.js');
    });

    it('should auto-select first file when adding multiple', () => {
      let fileIds;
      act(() => {
        fileIds = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' }
        ]);
      });

      expect(hook.current.activeFileId).toBe(fileIds[0]);
    });

    it('should return empty array when given empty array', () => {
      let fileIds;
      act(() => {
        fileIds = hook.current.addFiles([]);
      });

      expect(fileIds).toEqual([]);
      expect(hook.current.files).toHaveLength(0);
    });
  });

  describe('removeFile', () => {
    it('should remove a file by ID', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({ filename: 'test.js', content: 'test' });
      });
      act(() => {
        hook.current.removeFile(fileId);
      });

      expect(hook.current.files).toHaveLength(0);
      expect(hook.current.activeFileId).toBeNull();
    });

    it('should select next file when removing active file', () => {
      let ids;
      act(() => {
        ids = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' },
          { filename: 'third.js', content: 'third' }
        ]);
      });

      // Remove first file (which is active)
      act(() => {
        hook.current.removeFile(ids[0]);
      });

      expect(hook.current.files).toHaveLength(2);
      expect(hook.current.activeFileId).toBe(ids[1]);
      expect(hook.current.activeFile.filename).toBe('second.js');
    });

    it('should select previous file when removing last active file', () => {
      let ids;
      act(() => {
        ids = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' },
          { filename: 'third.js', content: 'third' }
        ]);
      });

      // Set third file as active
      act(() => {
        hook.current.setActiveFile(ids[2]);
      });

      // Remove third file
      act(() => {
        hook.current.removeFile(ids[2]);
      });

      expect(hook.current.files).toHaveLength(2);
      expect(hook.current.activeFileId).toBe(ids[1]);
      expect(hook.current.activeFile.filename).toBe('second.js');
    });

    it('should not change active file when removing non-active file', () => {
      let ids;
      act(() => {
        ids = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' }
        ]);
      });

      // Remove second file (non-active)
      act(() => {
        hook.current.removeFile(ids[1]);
      });

      expect(hook.current.files).toHaveLength(1);
      expect(hook.current.activeFileId).toBe(ids[0]);
    });
  });

  describe('updateFile', () => {
    it('should update file properties', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          content: 'original'
        });
      });

      act(() => {
        hook.current.updateFile(fileId, {
          content: 'updated',
          documentation: '# Updated Docs',
          qualityScore: { score: 85, grade: 'B' }
        });
      });

      const file = hook.current.files[0];
      expect(file.content).toBe('updated');
      expect(file.documentation).toBe('# Updated Docs');
      expect(file.qualityScore).toEqual({ score: 85, grade: 'B' });
    });

    it('should only update specified properties', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          content: 'original',
          language: 'javascript'
        });
      });

      act(() => {
        hook.current.updateFile(fileId, {
          content: 'updated'
        });
      });

      const file = hook.current.files[0];
      expect(file.content).toBe('updated');
      expect(file.filename).toBe('test.js');
      expect(file.language).toBe('javascript');
    });

    it('should not affect other files', () => {
      let ids;
      act(() => {
        ids = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' }
        ]);
      });

      act(() => {
        hook.current.updateFile(ids[0], { content: 'updated' });
      });

      expect(hook.current.files[0].content).toBe('updated');
      expect(hook.current.files[1].content).toBe('second');
    });
  });

  describe('clearFiles', () => {
    it('should remove all files', () => {
      act(() => {
        hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' }
        ]);
      });

      act(() => {
        hook.current.clearFiles();
      });

      expect(hook.current.files).toHaveLength(0);
      expect(hook.current.activeFileId).toBeNull();
      expect(hook.current.fileCount).toBe(0);
      expect(hook.current.hasFiles).toBe(false);
    });
  });

  describe('setActiveFile', () => {
    it('should set active file by ID', () => {
      let ids;
      act(() => {
        ids = hook.current.addFiles([
          { filename: 'first.js', content: 'first' },
          { filename: 'second.js', content: 'second' }
        ]);
      });

      act(() => {
        hook.current.setActiveFile(ids[1]);
      });

      expect(hook.current.activeFileId).toBe(ids[1]);
      expect(hook.current.activeFile.filename).toBe('second.js');
    });

    it('should not set active file for non-existent ID', () => {
      let id;
      act(() => {
        id = hook.current.addFile({ filename: 'test.js', content: 'test' });
      });

      act(() => {
        hook.current.setActiveFile('non-existent-id');
      });

      expect(hook.current.activeFileId).toBe(id); // Should remain unchanged
    });
  });

  describe('getFileById', () => {
    it('should return file by ID', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          content: 'test'
        });
      });

      const file = hook.current.getFileById(fileId);
      expect(file).toBeTruthy();
      expect(file.id).toBe(fileId);
      expect(file.filename).toBe('test.js');
    });

    it('should return null for non-existent ID', () => {
      const file = hook.current.getFileById('non-existent');
      expect(file).toBeNull();
    });
  });

  describe('activeFile (computed)', () => {
    it('should return active file object', () => {
      let fileId;
      act(() => {
        fileId = hook.current.addFile({
          filename: 'test.js',
          content: 'test'
        });
      });

      expect(hook.current.activeFile).toBeTruthy();
      expect(hook.current.activeFile.id).toBe(fileId);
      expect(hook.current.activeFile.filename).toBe('test.js');
    });

    it('should return null when no active file', () => {
      expect(hook.current.activeFile).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('should update fileCount', () => {
      expect(hook.current.fileCount).toBe(0);

      act(() => {
        hook.current.addFile({ filename: 'test.js', content: 'test' });
      });
      expect(hook.current.fileCount).toBe(1);

      act(() => {
        hook.current.addFile({ filename: 'test2.js', content: 'test2' });
      });
      expect(hook.current.fileCount).toBe(2);
    });

    it('should update hasFiles', () => {
      expect(hook.current.hasFiles).toBe(false);

      act(() => {
        hook.current.addFile({ filename: 'test.js', content: 'test' });
      });
      expect(hook.current.hasFiles).toBe(true);

      act(() => {
        hook.current.clearFiles();
      });
      expect(hook.current.hasFiles).toBe(false);
    });
  });
});
