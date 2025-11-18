/**
 * useWorkspacePersistence Hook
 *
 * Wraps useMultiFileState and adds database persistence for workspace files.
 * Automatically syncs file metadata (NOT code content) to database.
 *
 * Features:
 * - Load workspace on mount
 * - Auto-save file metadata when added
 * - Auto-delete from DB when removed
 * - Link to generated_documents when docs are created
 *
 * Privacy:
 * - Code content stays in-memory only (never persisted)
 * - Only file metadata synced to DB
 *
 * @returns {Object} Multi-file state with DB persistence
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature } from '../utils/tierFeatures';
import workspaceApi from '../services/workspaceApi';
import { useMultiFileState } from './useMultiFileState';

// localStorage key prefix for workspace file content
// Format: codescribeai:local:workspace:content-{fileId}
const WORKSPACE_CONTENT_PREFIX = 'codescribeai:local:workspace:content-';

/**
 * Clear all workspace file content from localStorage
 * Exported for use in logout/cleanup flows
 */
export function clearWorkspaceLocalStorage() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(WORKSPACE_CONTENT_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function useWorkspacePersistence() {
  const { isAuthenticated, user } = useAuth();
  const hasMultiFileAccess = user && hasFeature(user, 'batchProcessing');
  const multiFileState = useMultiFileState();
  const { addFile, addFiles, removeFile, updateFile, clearFiles } = multiFileState;

  // Track workspace file ID -> client file ID mapping
  const workspaceIdMap = useRef(new Map()); // workspace DB ID -> client file ID
  const clientIdMap = useRef(new Map());    // client file ID -> workspace DB ID
  const isSyncing = useRef(false);

  /**
   * Load workspace from database on mount OR when files become empty
   * (handles navigation back to app)
   */
  useEffect(() => {
    // Only load if:
    // 1. User is authenticated
    // 2. User has multi-file access
    // 3. Current file list is empty (nothing loaded yet OR user cleared it)
    // 4. Not currently syncing
    if (!isAuthenticated || !hasMultiFileAccess || multiFileState.files.length > 0 || isSyncing.current) {
      return;
    }

    const loadWorkspace = async () => {
      try {
        isSyncing.current = true;
        const result = await workspaceApi.getWorkspace();

        if (result.success && result.files.length > 0) {
          // Convert DB files to client file format
          const clientFiles = result.files.map(dbFile => {
            const clientId = dbFile.id; // Use DB ID as client ID for simplicity

            // Store mapping
            workspaceIdMap.current.set(dbFile.id, clientId);
            clientIdMap.current.set(clientId, dbFile.id);

            // Load code content from localStorage
            const contentKey = `${WORKSPACE_CONTENT_PREFIX}${dbFile.id}`;
            const savedContent = localStorage.getItem(contentKey) || '';

            return {
              id: clientId,
              filename: dbFile.filename,
              language: dbFile.language,
              content: savedContent, // Load from localStorage
              documentation: dbFile.documentation || null,
              qualityScore: dbFile.quality_score || null,
              docType: dbFile.doc_type,
              origin: dbFile.origin,
              fileSize: dbFile.file_size_bytes,
              isGenerating: false,
              error: null,
              documentId: dbFile.document_id,
              github: dbFile.github_repo ? {
                repo: dbFile.github_repo,
                path: dbFile.github_path,
                sha: dbFile.github_sha,
                branch: dbFile.github_branch
              } : null
            };
          });

          // Load files into state
          addFiles(clientFiles);
        }
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to load workspace:', error);
        // Don't throw - allow app to continue with empty workspace
      } finally {
        isSyncing.current = false;
      }
    };

    loadWorkspace();
  }, [isAuthenticated, hasMultiFileAccess, addFiles]);

  /**
   * Enhanced addFile with DB persistence
   */
  const addFileWithPersistence = useCallback(async (fileData) => {
    // Add to local state first (optimistic update)
    const clientFileId = addFile(fileData);

    // Sync to DB if authenticated
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      try {
        const result = await workspaceApi.addWorkspaceFile({
          filename: fileData.filename,
          language: fileData.language,
          fileSizeBytes: fileData.content?.length || fileData.fileSize || 0,
          docType: fileData.docType || 'README',
          origin: fileData.origin || 'upload',
          github: fileData.github
        });

        if (result.success) {
          // Store mapping
          const dbFileId = result.file.id;
          workspaceIdMap.current.set(dbFileId, clientFileId);
          clientIdMap.current.set(clientFileId, dbFileId);

          // Save code content to localStorage
          if (fileData.content) {
            const contentKey = `${WORKSPACE_CONTENT_PREFIX}${dbFileId}`;
            localStorage.setItem(contentKey, fileData.content);
          }
        }
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to save file to workspace:', error);
        // Don't throw - file is still in local state
      }
    }

    return clientFileId;
  }, [addFile, isAuthenticated, hasMultiFileAccess]);

  /**
   * Enhanced addFiles with DB persistence
   */
  const addFilesWithPersistence = useCallback(async (filesData) => {
    // Add to local state first (optimistic update)
    const clientFileIds = addFiles(filesData);

    // Sync to DB if authenticated (batch)
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      try {
        // Save each file (could be batched in future)
        await Promise.all(
          filesData.map(async (fileData, index) => {
            try {
              const result = await workspaceApi.addWorkspaceFile({
                filename: fileData.filename,
                language: fileData.language,
                fileSizeBytes: fileData.content?.length || fileData.fileSize || 0,
                docType: fileData.docType || 'README',
                origin: fileData.origin || 'upload',
                github: fileData.github
              });

              if (result.success) {
                const clientFileId = clientFileIds[index];
                const dbFileId = result.file.id;
                workspaceIdMap.current.set(dbFileId, clientFileId);
                clientIdMap.current.set(clientFileId, dbFileId);

                // Save code content to localStorage
                if (fileData.content) {
                  const contentKey = `${WORKSPACE_CONTENT_PREFIX}${dbFileId}`;
                  localStorage.setItem(contentKey, fileData.content);
                }
              }
            } catch (error) {
              console.error('[useWorkspacePersistence] Failed to save file:', error);
              // Continue with other files
            }
          })
        );
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to save files to workspace:', error);
      }
    }

    return clientFileIds;
  }, [addFiles, isAuthenticated, hasMultiFileAccess]);

  /**
   * Enhanced removeFile with DB deletion
   */
  const removeFileWithPersistence = useCallback(async (fileId) => {
    // Remove from local state first (optimistic update)
    removeFile(fileId);

    // Delete from DB if authenticated
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      const dbFileId = clientIdMap.current.get(fileId);
      if (dbFileId) {
        try {
          await workspaceApi.deleteWorkspaceFile(dbFileId);

          // Clean up localStorage content
          const contentKey = `${WORKSPACE_CONTENT_PREFIX}${dbFileId}`;
          localStorage.removeItem(contentKey);

          // Clean up mappings
          workspaceIdMap.current.delete(dbFileId);
          clientIdMap.current.delete(fileId);
        } catch (error) {
          console.error('[useWorkspacePersistence] Failed to delete file from workspace:', error);
          // Don't throw - file is already removed from local state
        }
      }
    }
  }, [removeFile, isAuthenticated, hasMultiFileAccess]);

  /**
   * Enhanced clearFiles with DB clear
   */
  const clearFilesWithPersistence = useCallback(async () => {
    // Clear local state first
    clearFiles();

    // Clear DB if authenticated
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      try {
        await workspaceApi.clearWorkspace();

        // Clear all localStorage content for workspace files
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(WORKSPACE_CONTENT_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear mappings
        workspaceIdMap.current.clear();
        clientIdMap.current.clear();
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to clear workspace:', error);
      }
    }
  }, [clearFiles, isAuthenticated, hasMultiFileAccess]);

  /**
   * Enhanced updateFile with DB sync (for linking generated docs)
   */
  const updateFileWithPersistence = useCallback(async (fileId, updates) => {
    // Update local state first
    updateFile(fileId, updates);

    // Sync to DB if authenticated and if documentId changed
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current && updates.documentId !== undefined) {
      const dbFileId = clientIdMap.current.get(fileId);
      if (dbFileId) {
        try {
          await workspaceApi.updateWorkspaceFile(dbFileId, {
            documentId: updates.documentId
          });
        } catch (error) {
          console.error('[useWorkspacePersistence] Failed to update workspace file:', error);
        }
      }
    }
  }, [updateFile, isAuthenticated, hasMultiFileAccess]);

  return {
    ...multiFileState,
    // Override operations with persistence
    addFile: addFileWithPersistence,
    addFiles: addFilesWithPersistence,
    removeFile: removeFileWithPersistence,
    updateFile: updateFileWithPersistence,
    clearFiles: clearFilesWithPersistence
  };
}
