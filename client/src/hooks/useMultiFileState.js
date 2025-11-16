/**
 * useMultiFileState Hook
 *
 * Manages multi-file state for the file list sidebar.
 * Handles adding, removing, updating files, and tracking the active file.
 *
 * Storage Strategy:
 * - Code content: React state only (in-memory, ephemeral)
 * - Generated docs: Database via useDocumentPersistence hook
 * - UI state: localStorage (sidebar expanded, panel sizes)
 *
 * @returns {Object} Multi-file state and operations
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * File object structure:
 * {
 *   id: string,              // UUID for client-side tracking
 *   filename: string,         // Original filename
 *   language: string,         // Programming language
 *   content: string,          // Source code (in-memory only)
 *   documentation: string,    // Generated docs (cached from DB)
 *   qualityScore: object,     // Quality score (cached from DB)
 *   docType: string,          // README | JSDOC | API | ARCHITECTURE
 *   origin: string,           // upload | github | paste | sample
 *   fileSize: number,         // Size in bytes
 *   isGenerating: boolean,    // Is currently generating
 *   error: string | null,     // Generation error if any
 *   documentId: string | null // UUID from database (null if not saved)
 * }
 */

export function useMultiFileState() {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  /**
   * Add a new file to the list
   * @param {Object} fileData - File data
   * @returns {string} - File ID
   */
  const addFile = useCallback((fileData) => {
    const fileId = uuidv4();
    const newFile = {
      id: fileId,
      filename: fileData.filename || 'untitled.js',
      language: fileData.language || 'javascript',
      content: fileData.content || '',
      documentation: null,
      qualityScore: null,
      docType: fileData.docType || 'README',
      origin: fileData.origin || 'upload',
      fileSize: fileData.content?.length || 0,
      isGenerating: false,
      error: null,
      documentId: null,
      ...fileData
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
    const newFiles = filesData.map(fileData => {
      const fileId = uuidv4();
      return {
        id: fileId,
        filename: fileData.filename || 'untitled.js',
        language: fileData.language || 'javascript',
        content: fileData.content || '',
        documentation: null,
        qualityScore: null,
        docType: fileData.docType || 'README',
        origin: fileData.origin || 'upload',
        fileSize: fileData.content?.length || 0,
        isGenerating: false,
        error: null,
        documentId: null,
        ...fileData
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

      // If removing active file, select another
      if (fileId === activeFileId) {
        const currentIndex = prev.findIndex(f => f.id === fileId);
        if (filtered.length > 0) {
          // Select next file, or previous if at end
          const nextIndex = currentIndex < filtered.length ? currentIndex : currentIndex - 1;
          setActiveFileId(filtered[nextIndex]?.id || null);
        } else {
          setActiveFileId(null);
        }
      }

      return filtered;
    });
  }, [activeFileId]);

  /**
   * Update a file's properties
   * @param {string} fileId - File ID to update
   * @param {Object} updates - Properties to update
   */
  const updateFile = useCallback((fileId, updates) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, ...updates }
        : file
    ));
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setActiveFileId(null);
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
   * @param {string} fileId - File ID to make active
   */
  const setActiveFile = useCallback((fileId) => {
    if (files.some(f => f.id === fileId)) {
      setActiveFileId(fileId);
    }
  }, [files]);

  return {
    // State
    files,
    activeFileId,
    activeFile: getActiveFile(),

    // Operations
    addFile,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
    setActiveFile,
    getFileById,

    // Computed
    fileCount: files.length,
    hasFiles: files.length > 0
  };
}
