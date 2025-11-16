/**
 * Documents API Service
 *
 * Handles all API calls to the /api/documents endpoints for saving,
 * retrieving, and managing generated documentation in the database.
 *
 * All endpoints require authentication.
 */

import api from './api';

/**
 * Save a generated document to the database
 * @param {Object} docData - Document data
 * @param {string} docData.filename - File name
 * @param {string} docData.language - Programming language
 * @param {number} docData.fileSize - File size in bytes
 * @param {string} docData.documentation - Generated markdown documentation
 * @param {Object} docData.qualityScore - Quality score object
 * @param {string} docData.docType - Document type (README, JSDOC, API, ARCHITECTURE)
 * @param {string} docData.origin - Origin (upload, github, paste, sample)
 * @param {string} docData.provider - LLM provider (claude, openai)
 * @param {string} docData.model - Model name
 * @param {Object} [docData.github] - Optional GitHub metadata
 * @param {Object} [docData.llm] - Optional LLM metadata
 * @param {boolean} [docData.isEphemeral] - Whether to auto-delete on logout
 * @returns {Promise<Object>} - { documentId, savedAt }
 */
export async function saveDocument(docData) {
  const response = await api.post('/documents', {
    filename: docData.filename,
    language: docData.language,
    fileSize: docData.fileSize,
    documentation: docData.documentation,
    qualityScore: docData.qualityScore,
    docType: docData.docType,
    origin: docData.origin || 'upload',

    // GitHub metadata (optional)
    githubRepo: docData.github?.repo || null,
    githubPath: docData.github?.path || null,
    githubSha: docData.github?.sha || null,
    githubBranch: docData.github?.branch || null,

    // LLM metadata
    provider: docData.provider,
    model: docData.model,
    inputTokens: docData.llm?.inputTokens || null,
    outputTokens: docData.llm?.outputTokens || null,
    wasCached: docData.llm?.wasCached || false,
    latencyMs: docData.llm?.latencyMs || null,

    // Ephemeral flag
    isEphemeral: docData.isEphemeral || false
  });

  return response.data;
}

/**
 * Get user's documents with pagination
 * @param {Object} options - Query options
 * @param {number} [options.limit=50] - Number of documents to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {string} [options.sort='generated_at:desc'] - Sort field and direction
 * @returns {Promise<Object>} - { documents, total, hasMore }
 */
export async function getUserDocuments(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 50,
    offset: options.offset || 0,
    sort: options.sort || 'generated_at:desc'
  });

  const response = await api.get(`/documents?${params.toString()}`);
  return response.data;
}

/**
 * Get a single document by ID
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - Document object
 */
export async function getDocument(documentId) {
  const response = await api.get(`/documents/${documentId}`);
  return response.data;
}

/**
 * Soft delete a document (30-day recovery window)
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - { success, deletedAt }
 */
export async function deleteDocument(documentId) {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
}

/**
 * Bulk delete multiple documents
 * @param {Array<string>} documentIds - Array of document UUIDs
 * @returns {Promise<Object>} - { success, deletedCount }
 */
export async function bulkDeleteDocuments(documentIds) {
  const response = await api.delete('/documents', {
    data: { documentIds }
  });
  return response.data;
}

/**
 * Restore a soft-deleted document (within 30-day window)
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - { success, restoredAt }
 */
export async function restoreDocument(documentId) {
  const response = await api.post(`/documents/${documentId}/restore`);
  return response.data;
}

/**
 * Delete all ephemeral documents for the current user (on logout)
 * @returns {Promise<Object>} - { success, deletedCount }
 */
export async function deleteEphemeralDocuments() {
  const response = await api.delete('/documents/ephemeral');
  return response.data;
}

/**
 * Get document statistics for the current user
 * @returns {Promise<Object>} - { totalDocuments, avgQualityScore, etc. }
 */
export async function getUserStats() {
  const response = await api.get('/documents/stats');
  return response.data;
}

export default {
  saveDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  bulkDeleteDocuments,
  restoreDocument,
  deleteEphemeralDocuments,
  getUserStats
};
