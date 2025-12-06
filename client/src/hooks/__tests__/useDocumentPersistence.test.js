/**
 * Tests for useDocumentPersistence Hook
 *
 * Tests document persistence with user consent model including:
 * - Consent decision logic (always/never/ask)
 * - Save operations with auth
 * - Ephemeral cleanup
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentPersistence } from '../useDocumentPersistence';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock documentsApi
vi.mock('../../services/documentsApi', () => ({
  default: {
    saveDocument: vi.fn(),
    getUserDocuments: vi.fn(),
    deleteDocument: vi.fn(),
    deleteEphemeralDocuments: vi.fn()
  }
}));

import { useAuth } from '../../contexts/AuthContext';
import documentsApi from '../../services/documentsApi';

describe('useDocumentPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });
    });

    it('should initialize with canSave=false when not authenticated', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      expect(result.current.canSave).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.saveError).toBeNull();
    });

    it('should return null when trying to save without auth', async () => {
      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README'
      };

      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveDocument(docData);
      });

      expect(saveResult).toBeNull();
      expect(documentsApi.saveDocument).not.toHaveBeenCalled();
    });

    it('should return empty documents when loading without auth', async () => {
      const { result } = renderHook(() => useDocumentPersistence());

      let loadResult;
      await act(async () => {
        loadResult = await result.current.loadDocuments();
      });

      expect(loadResult).toEqual({
        documents: [],
        total: 0,
        hasMore: false
      });
      expect(documentsApi.getUserDocuments).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated State - Preference: always', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'always'
        },
        isAuthenticated: true
      });
    });

    it('should have canSave=true and savePreference=always', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      expect(result.current.canSave).toBe(true);
      expect(result.current.savePreference).toBe('always');
      expect(result.current.needsConsent).toBe(false);
    });

    it('should auto-save documents without user choice', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.saveDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveDocument(docData);
      });

      expect(documentsApi.saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'test.js',
          isEphemeral: false
        })
      );
      expect(saveResult).toEqual(mockResponse);
    });

    it('should return shouldSave=true, isEphemeral=false', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      const decision = result.current.shouldSaveDocument();

      expect(decision).toEqual({
        shouldSave: true,
        isEphemeral: false
      });
    });
  });

  describe('Authenticated State - Preference: never', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'never'
        },
        isAuthenticated: true
      });
    });

    it('should have savePreference=never', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      expect(result.current.savePreference).toBe('never');
      expect(result.current.needsConsent).toBe(false);
    });

    it('should save as ephemeral when preference is never', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.saveDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      await act(async () => {
        await result.current.saveDocument(docData);
      });

      expect(documentsApi.saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          isEphemeral: true
        })
      );
    });

    it('should return shouldSave=true, isEphemeral=true', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      const decision = result.current.shouldSaveDocument();

      expect(decision).toEqual({
        shouldSave: true,
        isEphemeral: true
      });
    });
  });

  describe('Authenticated State - Preference: ask (legacy - now acts like always)', () => {
    // Note: 'ask' is a legacy preference value that now acts like 'always'
    // The simplification removes the 'ask' flow - docs are always saved
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'ask'
        },
        isAuthenticated: true
      });
    });

    it('should have savePreference=ask but needsConsent=false (acts like always)', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      // 'ask' preference is stored but behavior is like 'always'
      expect(result.current.savePreference).toBe('ask');
      // Since 'ask' now acts like 'always', no consent is needed
      expect(result.current.needsConsent).toBe(false);
    });

    it('should auto-save even without user choice (ask now acts like always)', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.saveDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README'
      };

      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveDocument(docData);
      });

      // Now auto-saves since 'ask' acts like 'always'
      expect(documentsApi.saveDocument).toHaveBeenCalled();
      expect(saveResult).toEqual(mockResponse);
    });

    it('should save when user chooses "save"', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.saveDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      await act(async () => {
        await result.current.saveDocument(docData, 'save');
      });

      expect(documentsApi.saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          isEphemeral: false
        })
      );
    });

    it('should save as ephemeral when user chooses "dont-save"', async () => {
      const mockResponse = {
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.saveDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      await act(async () => {
        await result.current.saveDocument(docData, 'dont-save');
      });

      expect(documentsApi.saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          isEphemeral: true
        })
      );
    });

    it('should return shouldSave=true when no user choice (default is always)', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      const decision = result.current.shouldSaveDocument(null);

      // Default preference is 'always' - we only store generated docs, not user code
      expect(decision).toEqual({
        shouldSave: true,
        isEphemeral: false
      });
    });

    it('should respect explicit user choice over preference', () => {
      const { result } = renderHook(() => useDocumentPersistence());

      const saveDecision = result.current.shouldSaveDocument('save');
      expect(saveDecision).toEqual({
        shouldSave: true,
        isEphemeral: false
      });

      const dontSaveDecision = result.current.shouldSaveDocument('dont-save');
      expect(dontSaveDecision).toEqual({
        shouldSave: true,
        isEphemeral: true
      });
    });
  });

  describe('Save Operation States', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'always'
        },
        isAuthenticated: true
      });
    });

    it('should set isSaving=true during save operation', async () => {
      let resolveSave;
      const savePromise = new Promise(resolve => {
        resolveSave = resolve;
      });
      documentsApi.saveDocument.mockReturnValue(savePromise);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      let savePromiseResult;
      act(() => {
        savePromiseResult = result.current.saveDocument(docData);
      });

      // Should be saving
      expect(result.current.isSaving).toBe(true);

      // Resolve the save
      await act(async () => {
        resolveSave({ documentId: 'doc-123', savedAt: '2025-11-15T12:00:00Z' });
        await savePromiseResult;
      });

      // Should no longer be saving
      expect(result.current.isSaving).toBe(false);
    });

    it('should set saveError on failure', async () => {
      const error = new Error('Network error');
      documentsApi.saveDocument.mockRejectedValue(error);

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      await act(async () => {
        try {
          await result.current.saveDocument(docData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.saveError).toBe('Network error');
      expect(result.current.isSaving).toBe(false);
    });

    it('should clear saveError on successful save after previous error', async () => {
      // First call fails
      documentsApi.saveDocument.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      // First save fails
      await act(async () => {
        try {
          await result.current.saveDocument(docData);
        } catch (e) {
          // Expected
        }
      });
      expect(result.current.saveError).toBe('First error');

      // Second call succeeds
      documentsApi.saveDocument.mockResolvedValueOnce({
        documentId: 'doc-123',
        savedAt: '2025-11-15T12:00:00Z'
      });

      await act(async () => {
        await result.current.saveDocument(docData);
      });

      expect(result.current.saveError).toBeNull();
    });
  });

  describe('Load Operations', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'always'
        },
        isAuthenticated: true
      });
    });

    it('should load documents with default options', async () => {
      const mockResponse = {
        documents: [{ id: 'doc-1', filename: 'test.js' }],
        total: 1,
        hasMore: false
      };
      documentsApi.getUserDocuments.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      let loadResult;
      await act(async () => {
        loadResult = await result.current.loadDocuments();
      });

      expect(documentsApi.getUserDocuments).toHaveBeenCalledWith({});
      expect(loadResult).toEqual(mockResponse);
    });

    it('should load documents with custom options', async () => {
      const mockResponse = {
        documents: [],
        total: 0,
        hasMore: false
      };
      documentsApi.getUserDocuments.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      const options = {
        limit: 25,
        offset: 50,
        sort: 'filename:asc'
      };

      await act(async () => {
        await result.current.loadDocuments(options);
      });

      expect(documentsApi.getUserDocuments).toHaveBeenCalledWith(options);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'always'
        },
        isAuthenticated: true
      });
    });

    it('should delete a document', async () => {
      const mockResponse = {
        success: true,
        deletedAt: '2025-11-15T12:00:00Z'
      };
      documentsApi.deleteDocument.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteDocument('doc-123');
      });

      expect(documentsApi.deleteDocument).toHaveBeenCalledWith('doc-123');
      expect(deleteResult).toEqual(mockResponse);
    });

    it('should throw error when deleting without auth', async () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      const { result } = renderHook(() => useDocumentPersistence());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteDocument('doc-123');
        });
      }).rejects.toThrow('Must be authenticated to delete documents');
    });
  });

  describe('Ephemeral Cleanup', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'never'
        },
        isAuthenticated: true
      });
    });

    it('should cleanup ephemeral documents', async () => {
      const mockResponse = {
        success: true,
        deletedCount: 5
      };
      documentsApi.deleteEphemeralDocuments.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDocumentPersistence());

      let cleanupResult;
      await act(async () => {
        cleanupResult = await result.current.cleanupEphemeralDocs();
      });

      expect(documentsApi.deleteEphemeralDocuments).toHaveBeenCalled();
      expect(cleanupResult).toEqual(mockResponse);
    });

    it('should not throw on cleanup error', async () => {
      documentsApi.deleteEphemeralDocuments.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDocumentPersistence());

      await act(async () => {
        // Should not throw
        await result.current.cleanupEphemeralDocs();
      });

      expect(documentsApi.deleteEphemeralDocuments).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user preference gracefully', () => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com'
          // save_docs_preference missing
        },
        isAuthenticated: true
      });

      const { result } = renderHook(() => useDocumentPersistence());

      // Default to 'always' - we only store generated docs, not user code
      expect(result.current.savePreference).toBe('always');
    });

    it('should handle API errors gracefully', async () => {
      useAuth.mockReturnValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          save_docs_preference: 'always'
        },
        isAuthenticated: true
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      documentsApi.saveDocument.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useDocumentPersistence());

      const docData = {
        filename: 'test.js',
        language: 'javascript',
        fileSize: 1024,
        documentation: '# Test',
        qualityScore: { score: 85, grade: 'B' },
        docType: 'README',
        provider: 'claude',
        model: 'claude-sonnet-4-5-20250929'
      };

      await expect(async () => {
        await act(async () => {
          await result.current.saveDocument(docData);
        });
      }).rejects.toThrow('Database error');

      consoleErrorSpy.mockRestore();
    });
  });
});
