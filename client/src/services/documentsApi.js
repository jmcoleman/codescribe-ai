/**
 * Documents API Service
 *
 * Handles all API calls to the /api/documents endpoints for saving,
 * retrieving, and managing generated documentation in the database.
 *
 * All endpoints require authentication.
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage.js';

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
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
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
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save document');
  }

  return response.json();
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
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  const params = new URLSearchParams({
    limit: options.limit || 50,
    offset: options.offset || 0,
    sort: options.sort || 'generated_at:desc'
  });

  const response = await fetch(`${API_URL}/api/documents?${params.toString()}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch documents');
  }

  return response.json();
}

/**
 * Get a single document by ID
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - Document object
 */
export async function getDocument(documentId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch document');
  }

  return response.json();
}

/**
 * Soft delete a document (30-day recovery window)
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - { success, deletedAt }
 */
export async function deleteDocument(documentId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete document');
  }

  return response.json();
}

/**
 * Bulk delete multiple documents
 * @param {Array<string>} documentIds - Array of document UUIDs
 * @returns {Promise<Object>} - { success, deletedCount }
 */
export async function bulkDeleteDocuments(documentIds) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete documents');
  }

  return response.json();
}

/**
 * Restore a soft-deleted document (within 30-day window)
 * @param {string} documentId - Document UUID
 * @returns {Promise<Object>} - { success, restoredAt }
 */
export async function restoreDocument(documentId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents/${documentId}/restore`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to restore document');
  }

  return response.json();
}

/**
 * Delete all ephemeral documents for the current user (on logout)
 * @returns {Promise<Object>} - { success, deletedCount }
 */
export async function deleteEphemeralDocuments() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents/ephemeral`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete ephemeral documents');
  }

  return response.json();
}

/**
 * Get document statistics for the current user
 * @returns {Promise<Object>} - { totalDocuments, avgQualityScore, etc. }
 */
export async function getUserStats() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/documents/stats`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user stats');
  }

  return response.json();
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
