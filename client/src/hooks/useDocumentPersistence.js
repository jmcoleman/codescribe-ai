/**
 * useDocumentPersistence Hook
 *
 * Manages document persistence to the database with user consent.
 * Handles save/load operations and respects user preferences.
 *
 * User Consent Model:
 * - 'always': Auto-save all documents
 * - 'never': Don't save (mark as ephemeral, delete on logout)
 * - 'ask': Prompt user each time
 *
 * @returns {Object} Document persistence operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import documentsApi from '../services/documentsApi';

export function useDocumentPersistence() {
  const { user, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /**
   * Get user's save preference
   * @returns {string} - 'always' | 'never'
   */
  const getSavePreference = useCallback(() => {
    // Default to 'always' - we only store generated docs (our output), not user code
    return user?.save_docs_preference || 'always';
  }, [user]);

  /**
   * Check if document should be saved based on user preference
   * @param {string} userChoice - User's choice for this specific doc ('save' | 'dont-save' | null)
   * @returns {Object} - { shouldSave: boolean, isEphemeral: boolean }
   *
   * Note: Default preference is 'always' since we only store generated docs (our output),
   * never user's code. Users can opt-out via Settings.
   */
  const shouldSaveDocument = useCallback((userChoice = null) => {
    if (!isAuthenticated) {
      return { shouldSave: false, isEphemeral: false };
    }

    const preference = getSavePreference();

    // If user made an explicit choice for this doc, use it
    if (userChoice === 'save') {
      return { shouldSave: true, isEphemeral: false };
    }
    if (userChoice === 'dont-save') {
      return { shouldSave: true, isEphemeral: true }; // Save but mark ephemeral
    }

    // Otherwise use preference (default is 'always')
    switch (preference) {
      case 'never':
        return { shouldSave: true, isEphemeral: true }; // Save but mark ephemeral
      case 'always':
      default:
        // Default to saving - we only store generated docs, not user code
        return { shouldSave: true, isEphemeral: false };
    }
  }, [isAuthenticated, getSavePreference]);

  /**
   * Save a document to the database
   * @param {Object} docData - Document data (from file object)
   * @param {string} [userChoice] - User's explicit choice ('save' | 'dont-save' | null)
   * @returns {Promise<Object>} - { documentId, savedAt } or null if not saved
   */
  const saveDocument = useCallback(async (docData, userChoice = null) => {
    if (!isAuthenticated) {
      console.warn('[useDocumentPersistence] Cannot save document: user not authenticated');
      return null;
    }

    const { shouldSave, isEphemeral } = shouldSaveDocument(userChoice);

    if (!shouldSave) {
      console.log('[useDocumentPersistence] Document not saved (waiting for user consent)');
      return null;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Map 'default' origin to 'sample' for database constraint compliance
      // Valid origins: 'upload', 'github', 'paste', 'sample'
      const normalizedOrigin = docData.origin === 'default' ? 'sample' : (docData.origin || 'upload');

      const result = await documentsApi.saveDocument({
        filename: docData.filename,
        language: docData.language,
        fileSize: docData.fileSize,
        documentation: docData.documentation,
        qualityScore: docData.qualityScore,
        docType: docData.docType,
        origin: normalizedOrigin,
        provider: docData.provider || 'claude',
        model: docData.model || 'claude-sonnet-4-5-20250929',
        github: docData.github || null,
        llm: docData.llm || null,
        isEphemeral,
        graphId: docData.graphId || null  // Store graph reference for cross-file context
      });

      console.log('[useDocumentPersistence] Document saved successfully:', result.documentId);
      return result;
    } catch (error) {
      console.error('[useDocumentPersistence] Error saving document:', error);
      setSaveError(error.message || 'Failed to save document');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, shouldSaveDocument]);

  /**
   * Load user's documents from database
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { documents, total, hasMore }
   */
  const loadDocuments = useCallback(async (options = {}) => {
    if (!isAuthenticated) {
      console.warn('[useDocumentPersistence] Cannot load documents: user not authenticated');
      return { documents: [], total: 0, hasMore: false };
    }

    try {
      const result = await documentsApi.getUserDocuments(options);
      return result;
    } catch (error) {
      console.error('[useDocumentPersistence] Error loading documents:', error);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Delete a document (soft delete with 30-day recovery)
   * @param {string} documentId - Document UUID
   * @returns {Promise<Object>} - { success, deletedAt }
   */
  const deleteDocument = useCallback(async (documentId) => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to delete documents');
    }

    try {
      const result = await documentsApi.deleteDocument(documentId);
      return result;
    } catch (error) {
      console.error('[useDocumentPersistence] Error deleting document:', error);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Clean up ephemeral documents on logout
   * Called automatically when user logs out
   */
  const cleanupEphemeralDocs = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const result = await documentsApi.deleteEphemeralDocuments();
      console.log('[useDocumentPersistence] Cleaned up ephemeral documents:', result.deletedCount);
      return result;
    } catch (error) {
      console.error('[useDocumentPersistence] Error cleaning up ephemeral documents:', error);
      // Don't throw - this is cleanup, shouldn't block logout
    }
  }, [isAuthenticated]);

  // Auto-cleanup ephemeral docs on unmount (logout)
  useEffect(() => {
    return () => {
      if (isAuthenticated && getSavePreference() === 'never') {
        // Cleanup ephemeral docs on component unmount
        cleanupEphemeralDocs();
      }
    };
  }, [isAuthenticated, getSavePreference, cleanupEphemeralDocs]);

  return {
    // State
    isSaving,
    saveError,
    canSave: isAuthenticated,
    savePreference: getSavePreference(),

    // Operations
    saveDocument,
    loadDocuments,
    deleteDocument,
    cleanupEphemeralDocs,
    shouldSaveDocument,

    // Helpers (needsConsent deprecated - default is now 'always')
    needsConsent: false
  };
}
