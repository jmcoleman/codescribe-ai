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
import { getWorkspaceKey } from '../constants/storage';

/**
 * Get all workspace contents from localStorage for a specific user
 * @param {number|string} userId - User ID
 * @returns {Object} Workspace contents { fileId: content, ... }
 */
function getWorkspaceContents(userId) {
  if (!userId) return {};

  try {
    const key = getWorkspaceKey(userId);
    if (!key) return {};

    const contents = localStorage.getItem(key);
    return contents ? JSON.parse(contents) : {};
  } catch (error) {
    console.error('[useWorkspacePersistence] Failed to parse workspace contents:', error);
    return {};
  }
}

/**
 * Save all workspace contents to localStorage for a specific user
 * @param {number|string} userId - User ID
 * @param {Object} contents - Workspace contents { fileId: content, ... }
 */
function saveWorkspaceContents(userId, contents) {
  if (!userId) {
    console.warn('[useWorkspacePersistence] Cannot save workspace without userId');
    return;
  }

  try {
    const key = getWorkspaceKey(userId);
    if (!key) return;

    localStorage.setItem(key, JSON.stringify(contents));
  } catch (error) {
    console.error('[useWorkspacePersistence] Failed to save workspace contents:', error);
    // QuotaExceededError handling
    if (error.name === 'QuotaExceededError') {
      console.warn('[useWorkspacePersistence] localStorage quota exceeded. Consider clearing old files.');
    }
  }
}

/**
 * Clear workspace file content from localStorage for a specific user
 * Exported for use in logout/cleanup flows
 * @param {number|string} userId - User ID
 */
export function clearWorkspaceLocalStorage(userId) {
  if (!userId) {
    console.warn('[useWorkspacePersistence] Cannot clear workspace without userId');
    return;
  }

  const key = getWorkspaceKey(userId);
  if (key) {
    localStorage.removeItem(key);
  }
}

export function useWorkspacePersistence() {
  const { isAuthenticated, user } = useAuth();
  const hasMultiFileAccess = user && hasFeature(user, 'batchProcessing');
  const multiFileState = useMultiFileState();
  const { addFile, addFiles, removeFile, removeFiles, updateFile, clearFiles } = multiFileState;

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
          // Load all contents from localStorage once
          const allContents = getWorkspaceContents(user.id);

          // Convert DB files to client file format
          const clientFiles = result.files.map(dbFile => {
            const clientId = dbFile.id; // Use DB ID as client ID for simplicity

            // Store mapping
            workspaceIdMap.current.set(dbFile.id, clientId);
            clientIdMap.current.set(clientId, dbFile.id);

            // Load code content from localStorage object
            const savedContent = allContents[dbFile.id] || '';

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
  }, [isAuthenticated, hasMultiFileAccess, addFiles, user]);

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

          // Save code content to localStorage object
          if (fileData.content) {
            const allContents = getWorkspaceContents(user.id);
            allContents[dbFileId] = fileData.content;
            saveWorkspaceContents(user.id, allContents);
          }
        }
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to save file to workspace:', error);
        // Don't throw - file is still in local state
      }
    }

    return clientFileId;
  }, [addFile, isAuthenticated, hasMultiFileAccess, user]);

  /**
   * Enhanced addFiles with DB persistence
   */
  const addFilesWithPersistence = useCallback(async (filesData) => {
    // Add to local state first (optimistic update)
    const clientFileIds = addFiles(filesData);

    // Sync to DB if authenticated (batch)
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      try {
        // Load current contents once
        const allContents = getWorkspaceContents(user.id);

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

                // Add code content to the object
                if (fileData.content) {
                  allContents[dbFileId] = fileData.content;
                }
              }
            } catch (error) {
              console.error('[useWorkspacePersistence] Failed to save file:', error);
              // Continue with other files
            }
          })
        );

        // Save all contents at once
        saveWorkspaceContents(user.id, allContents);
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to save files to workspace:', error);
      }
    }

    return clientFileIds;
  }, [addFiles, isAuthenticated, hasMultiFileAccess, user]);

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

          // Remove from localStorage object
          const allContents = getWorkspaceContents(user.id);
          delete allContents[dbFileId];
          saveWorkspaceContents(user.id, allContents);

          // Clean up mappings
          workspaceIdMap.current.delete(dbFileId);
          clientIdMap.current.delete(fileId);
        } catch (error) {
          console.error('[useWorkspacePersistence] Failed to delete file from workspace:', error);
          // Don't throw - file is already removed from local state
        }
      }
    }
  }, [removeFile, isAuthenticated, hasMultiFileAccess, user]);

  /**
   * Enhanced removeFiles (batch) with DB deletion
   */
  const removeFilesWithPersistence = useCallback(async (fileIds) => {
    // Remove from local state first (optimistic update)
    removeFiles(fileIds);

    // Delete from DB if authenticated
    if (isAuthenticated && hasMultiFileAccess && !isSyncing.current) {
      // Get DB file IDs for all files being deleted
      const dbFileIds = fileIds
        .map(clientId => clientIdMap.current.get(clientId))
        .filter(dbId => dbId !== undefined);

      if (dbFileIds.length > 0) {
        try {
          // Delete all files from workspace_files table
          await Promise.all(
            dbFileIds.map(dbFileId => workspaceApi.deleteWorkspaceFile(dbFileId))
          );

          // Remove from localStorage object
          const allContents = getWorkspaceContents(user.id);
          dbFileIds.forEach(dbFileId => {
            delete allContents[dbFileId];
          });
          saveWorkspaceContents(user.id, allContents);

          // Clean up mappings
          fileIds.forEach(clientId => {
            const dbFileId = clientIdMap.current.get(clientId);
            if (dbFileId) {
              workspaceIdMap.current.delete(dbFileId);
              clientIdMap.current.delete(clientId);
            }
          });
        } catch (error) {
          console.error('[useWorkspacePersistence] Failed to delete files from workspace:', error);
          // Don't throw - files are already removed from local state
        }
      }
    }
  }, [removeFiles, isAuthenticated, hasMultiFileAccess, user]);

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

        // Clear all localStorage content for workspace files (single object)
        clearWorkspaceLocalStorage(user.id);

        // Clear mappings
        workspaceIdMap.current.clear();
        clientIdMap.current.clear();
      } catch (error) {
        console.error('[useWorkspacePersistence] Failed to clear workspace:', error);
      }
    }
  }, [clearFiles, isAuthenticated, hasMultiFileAccess, user]);

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
  }, [updateFile, isAuthenticated, hasMultiFileAccess, user]);

  /**
   * Manually reload workspace from database
   * Useful when external operations add files to database (e.g., GitHub batch import)
   */
  const reloadWorkspace = useCallback(async () => {
    if (!isAuthenticated || !hasMultiFileAccess || isSyncing.current) {
      return;
    }

    try {
      isSyncing.current = true;
      const result = await workspaceApi.getWorkspace();

      if (result.success && result.files.length > 0) {
        // Load all contents from localStorage once
        const allContents = getWorkspaceContents(user.id);

        // Convert DB files to client file format
        const clientFiles = result.files.map(dbFile => {
          const clientId = dbFile.id;

          // Store mapping
          workspaceIdMap.current.set(dbFile.id, clientId);
          clientIdMap.current.set(clientId, dbFile.id);

          // Load code content from localStorage object
          const savedContent = allContents[dbFile.id] || '';

          return {
            id: clientId,
            filename: dbFile.filename,
            language: dbFile.language,
            content: savedContent,
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

        // Replace all files with loaded workspace
        clearFiles();
        addFiles(clientFiles);
      }
    } catch (error) {
      console.error('[useWorkspacePersistence] Failed to reload workspace:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [isAuthenticated, hasMultiFileAccess, user, clearFiles, addFiles]);

  /**
   * Clear workspace files on logout
   */
  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out - clear all workspace files from state
      clearFiles();
    }
  }, [isAuthenticated, clearFiles]);

  return {
    ...multiFileState,
    // Override operations with persistence
    addFile: addFileWithPersistence,
    addFiles: addFilesWithPersistence,
    removeFile: removeFileWithPersistence,
    removeFiles: removeFilesWithPersistence,
    updateFile: updateFileWithPersistence,
    clearFiles: clearFilesWithPersistence,
    reloadWorkspace
  };
}
