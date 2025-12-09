/**
 * useMultiFileState Hook
 *
 * Manages multi-file state for the file list sidebar.
 * Handles adding, removing, updating files, and tracking the active file.
 *
 * Storage Strategy:
 * - Code content: React state + localStorage (persist across navigation)
 * - Generated docs: React state + localStorage (persist across navigation) + Database (long-term)
 * - UI state: localStorage (sidebar expanded, panel sizes)
 *
 * @returns {Object} Multi-file state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// sessionStorage key for workspace state (clears on browser close)
const WORKSPACE_STATE_KEY = 'codescribe_workspace_state';

/**
 * File object structure:
 * {
 *   id: string,              // UUID for client-side tracking
 *   filename: string,         // Original filename
 *   language: string,         // Programming language
 *   content: string,          // Source code (persisted to sessionStorage)
 *   documentation: string,    // Generated docs (cached from DB)
 *   qualityScore: object,     // Quality score (cached from DB)
 *   docType: string,          // README | JSDOC | API | ARCHITECTURE
 *   origin: string,           // upload | github | paste | sample
 *   fileSize: number,         // Size in bytes
 *   isGenerating: boolean,    // Is currently generating
 *   error: string | null,     // Generation error if any
 *   documentId: string | null,// UUID from database (null if not saved)
 *   generatedAt: Date | null, // When documentation was generated (from DB)
 *   batchId: string | null,   // UUID of the batch this doc belongs to (from DB)
 *   graphId: string | null,   // Graph ID used for generation (32-char hash)
 *   projectName: string | null, // Project name from graph if applicable
 *   dateAdded: Date,          // When file was added to workspace
 *   dateModified: Date        // When file content was last modified
 * }
 */

export function useMultiFileState() {
  // Load initial state from sessionStorage (persists across refresh, clears on browser close)
  const loadInitialState = () => {
    try {
      const saved = sessionStorage.getItem(WORKSPACE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          files: parsed.files || [],
          activeFileId: parsed.activeFileId || null,
          selectedFileIds: parsed.selectedFileIds || []
        };
      }
    } catch (error) {
      console.error('[useMultiFileState] Error loading workspace from sessionStorage:', error);
    }
    return { files: [], activeFileId: null, selectedFileIds: [] };
  };

  const initialState = loadInitialState();
  const [files, setFiles] = useState(initialState.files);
  const [activeFileId, setActiveFileId] = useState(initialState.activeFileId);
  const [selectedFileIds, setSelectedFileIds] = useState(initialState.selectedFileIds);

  // Clear any old localStorage data on mount (migration cleanup)
  useEffect(() => {
    try {
      localStorage.removeItem(WORKSPACE_STATE_KEY);
    } catch (error) {
      // Ignore errors
    }
  }, []); // Only run once on mount

  // Save to sessionStorage whenever state changes (persists across refresh, clears on browser close)
  useEffect(() => {
    try {
      const state = {
        files: files.map(f => ({
          ...f,
          // Always persist content to sessionStorage (clears on browser close for privacy)
          // Don't persist transient state
          isGenerating: false, // Always reset generating state
          error: null // Clear errors on reload
        })),
        activeFileId,
        selectedFileIds
      };
      sessionStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[useMultiFileState] Error saving workspace to sessionStorage:', error);
    }
  }, [files, activeFileId, selectedFileIds]);

  /**
   * Add a new file to the list
   * @param {Object} fileData - File data
   * @returns {string} - File ID
   */
  const addFile = useCallback((fileData) => {
    // Use provided ID if available (e.g., from database), otherwise generate new UUID
    const fileId = fileData.id || uuidv4();
    const now = new Date();
    const newFile = {
      id: fileId,
      filename: fileData.filename || 'untitled.js',
      language: fileData.language || 'javascript',
      content: fileData.content || '',
      documentation: fileData.documentation || null,
      qualityScore: fileData.qualityScore || null,
      docType: fileData.docType || 'README',
      origin: fileData.origin || 'upload',
      fileSize: fileData.content?.length || fileData.fileSize || 0,
      isGenerating: false,
      error: null,
      documentId: fileData.documentId || null,
      generatedAt: fileData.generatedAt || null,
      batchId: fileData.batchId || null,
      graphId: fileData.graphId || null,
      projectName: fileData.projectName || null,
      dateAdded: fileData.dateAdded || now,
      dateModified: fileData.dateModified || now,
      github: fileData.github || null
    };

    setFiles(prev => [...prev, newFile]);

    // Auto-select if first file
    setActiveFileId(prevActive => prevActive || fileId);

    return fileId;
  }, []);

  /**
   * Add multiple files at once
   * @param {Array<Object>} filesData - Array of file data objects
   * @returns {Array<string>} - Array of file IDs
   */
  const addFiles = useCallback((filesData) => {
    const now = new Date();
    const newFiles = filesData.map(fileData => {
      // Use provided ID if available (e.g., from database), otherwise generate new UUID
      const fileId = fileData.id || uuidv4();
      return {
        id: fileId,
        filename: fileData.filename || 'untitled.js',
        language: fileData.language || 'javascript',
        content: fileData.content || '',
        documentation: fileData.documentation || null,
        qualityScore: fileData.qualityScore || null,
        docType: fileData.docType || 'README',
        origin: fileData.origin || 'upload',
        fileSize: fileData.content?.length || fileData.fileSize || 0,
        isGenerating: false,
        error: null,
        documentId: fileData.documentId || null,
        generatedAt: fileData.generatedAt || null,
        batchId: fileData.batchId || null,
        graphId: fileData.graphId || null,
        projectName: fileData.projectName || null,
        dateAdded: fileData.dateAdded || now,
        dateModified: fileData.dateModified || now,
        github: fileData.github || null
      };
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Auto-select first file if none selected
    if (newFiles.length > 0) {
      setActiveFileId(prevActive => prevActive || newFiles[0].id);
    }

    return newFiles.map(f => f.id);
  }, []);

  /**
   * Remove a file from the list
   * @param {string} fileId - File ID to remove
   */
  const removeFile = useCallback((fileId) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);

      // Immediately update sessionStorage synchronously to prevent race conditions
      try {
        const newActiveFileId = fileId === activeFileId ? null : activeFileId;

        const state = {
          files: filtered.map(f => ({
            ...f,
            isGenerating: false,
            error: null
          })),
          activeFileId: newActiveFileId,
          selectedFileIds
        };
        sessionStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('[useMultiFileState] Error immediately saving to sessionStorage:', error);
      }

      return filtered;
    });

    // If removing active file, clear the panels (don't auto-select another file)
    if (fileId === activeFileId) {
      setActiveFileId(null);
    }
  }, [activeFileId, selectedFileIds]);

  /**
   * Remove multiple files from the list (batch delete)
   * @param {string[]} fileIds - Array of file IDs to remove
   */
  const removeFiles = useCallback((fileIds) => {
    const fileIdsSet = new Set(fileIds);

    setFiles(prev => {
      const filtered = prev.filter(f => !fileIdsSet.has(f.id));

      // Immediately update sessionStorage synchronously to prevent race conditions
      try {
        const newActiveFileId = activeFileId && fileIdsSet.has(activeFileId) ? null : activeFileId;
        const newSelectedFileIds = selectedFileIds.filter(id => !fileIdsSet.has(id));

        const state = {
          files: filtered.map(f => ({
            ...f,
            isGenerating: false,
            error: null
          })),
          activeFileId: newActiveFileId,
          selectedFileIds: newSelectedFileIds
        };
        sessionStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('[useMultiFileState] Error immediately saving to sessionStorage:', error);
      }

      return filtered;
    });

    // If removing active file, clear the panels
    if (activeFileId && fileIdsSet.has(activeFileId)) {
      setActiveFileId(null);
    }

    // Clear selections
    setSelectedFileIds(prev => prev.filter(id => !fileIdsSet.has(id)));
  }, [activeFileId, selectedFileIds]);

  /**
   * Update a file's properties
   * @param {string} fileId - File ID to update
   * @param {Object} updates - Properties to update
   */
  const updateFile = useCallback((fileId, updates) => {
    setFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;

      // If content is being updated, update dateModified
      const shouldUpdateTimestamp = updates.content !== undefined && updates.content !== file.content;

      return {
        ...file,
        ...updates,
        ...(shouldUpdateTimestamp ? { dateModified: new Date() } : {})
      };
    }));
  }, []);

  /**
   * Clear all files and workspace sessionStorage
   */
  const clearFiles = useCallback(() => {
    // Immediately clear sessionStorage synchronously BEFORE updating state
    try {
      sessionStorage.removeItem(WORKSPACE_STATE_KEY);
    } catch (error) {
      console.error('[useMultiFileState] Error clearing workspace from sessionStorage:', error);
    }

    // Also clear any old localStorage entries from before migration to sessionStorage
    try {
      localStorage.removeItem(WORKSPACE_STATE_KEY);
    } catch (error) {
      // Ignore - old localStorage may not exist
    }

    // Now update state
    setFiles([]);
    setActiveFileId(null);
    setSelectedFileIds([]);
  }, []);

  /**
   * Get active file object
   * @returns {Object | null} Active file or null
   */
  const getActiveFile = useCallback(() => {
    return files.find(f => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  /**
   * Get file by ID
   * @param {string} fileId - File ID
   * @returns {Object | null} File object or null
   */
  const getFileById = useCallback((fileId) => {
    return files.find(f => f.id === fileId) || null;
  }, [files]);

  /**
   * Set active file
   * @param {string|null} fileId - File ID to make active, or null to clear
   */
  const setActiveFile = useCallback((fileId) => {
    // Allow null to clear active file
    if (fileId === null || files.some(f => f.id === fileId)) {
      setActiveFileId(fileId);
    }
  }, [files]);

  /**
   * Toggle file selection
   * @param {string} fileId - File ID to toggle
   */
  const toggleFileSelection = useCallback((fileId) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  /**
   * Select all files
   */
  const selectAllFiles = useCallback(() => {
    setSelectedFileIds(files.map(f => f.id));
  }, [files]);

  /**
   * Deselect all files
   */
  const deselectAllFiles = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  /**
   * Select multiple files by IDs
   * @param {Array<string>} fileIds - Array of file IDs to select
   */
  const selectFiles = useCallback((fileIds) => {
    setSelectedFileIds(fileIds);
  }, []);

  /**
   * Check if a file is selected
   * @param {string} fileId - File ID to check
   * @returns {boolean}
   */
  const isFileSelected = useCallback((fileId) => {
    return selectedFileIds.includes(fileId);
  }, [selectedFileIds]);

  /**
   * Get selected files
   * @returns {Array} Array of selected file objects
   */
  const getSelectedFiles = useCallback(() => {
    return files.filter(f => selectedFileIds.includes(f.id));
  }, [files, selectedFileIds]);

  return {
    // State
    files,
    activeFileId,
    activeFile: getActiveFile(),
    selectedFileIds,
    selectedFiles: getSelectedFiles(),

    // Operations
    addFile,
    addFiles,
    removeFile,
    removeFiles,
    updateFile,
    clearFiles,
    setActiveFile,
    getFileById,

    // Selection operations
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    selectFiles,
    isFileSelected,
    getSelectedFiles,

    // Computed
    fileCount: files.length,
    hasFiles: files.length > 0,
    selectedCount: selectedFileIds.length,
    hasSelection: selectedFileIds.length > 0
  };
}
