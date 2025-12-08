/**
 * Batches API Service
 *
 * Handles all API calls to the /api/batches endpoints for creating,
 * retrieving, and exporting generation batches.
 *
 * All endpoints require authentication.
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage.js';

/**
 * Create a new generation batch
 * @param {Object} batchData - Batch data
 * @param {string} batchData.batchType - 'batch' or 'single'
 * @param {number} batchData.totalFiles - Total files in batch
 * @param {number} batchData.successCount - Successfully generated count
 * @param {number} batchData.failCount - Failed generation count
 * @param {number} [batchData.avgQualityScore] - Average quality score (0-100)
 * @param {string} [batchData.avgGrade] - Average grade (A-F)
 * @param {string} [batchData.summaryMarkdown] - Batch summary markdown
 * @param {Array} [batchData.errorDetails] - Array of error objects
 * @param {Array} [batchData.docTypes] - Array of doc types used
 * @param {number} [batchData.projectId] - Optional project ID to associate with batch
 * @returns {Promise<Object>} - { batchId, createdAt, projectId }
 */
export async function createBatch(batchData) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      batchType: batchData.batchType,
      totalFiles: batchData.totalFiles,
      successCount: batchData.successCount,
      failCount: batchData.failCount,
      avgQualityScore: batchData.avgQualityScore || null,
      avgGrade: batchData.avgGrade || null,
      summaryMarkdown: batchData.summaryMarkdown || null,
      errorDetails: batchData.errorDetails || null,
      docTypes: batchData.docTypes || null,
      projectId: batchData.projectId || null
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create batch');
  }

  return response.json();
}

/**
 * Link documents to a batch
 * @param {string} batchId - Batch UUID
 * @param {Array<string>} documentIds - Array of document UUIDs to link
 * @returns {Promise<Object>} - { success, linkedCount }
 */
export async function linkDocumentsToBatch(batchId, documentIds) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/${batchId}/link`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to link documents to batch');
  }

  return response.json();
}

/**
 * Get user's batches with pagination
 * @param {Object} options - Query options
 * @param {number} [options.limit=50] - Number of batches to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {string} [options.batchType] - Filter by 'batch' or 'single'
 * @param {number} [options.projectId] - Filter by project ID
 * @returns {Promise<Object>} - { batches, total, hasMore }
 */
export async function getUserBatches(options = {}) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  const params = new URLSearchParams();

  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);
  if (options.batchType) params.append('batchType', options.batchType);
  if (options.projectId) params.append('projectId', options.projectId);

  const response = await fetch(`${API_URL}/api/batches?${params.toString()}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batches');
  }

  return response.json();
}

/**
 * Get a single batch by ID
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Object>} - Batch object
 */
export async function getBatch(batchId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batch');
  }

  return response.json();
}

/**
 * Get a batch with all its documents
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Object>} - { batch, documents }
 */
export async function getBatchWithDocuments(batchId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/${batchId}/documents`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batch with documents');
  }

  return response.json();
}

/**
 * Delete a batch (documents remain, just unlinked)
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Object>} - { success }
 */
export async function deleteBatch(batchId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete batch');
  }

  return response.json();
}

/**
 * Get batch statistics for the current user
 * @returns {Promise<Object>} - Statistics object
 */
export async function getBatchStats() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/stats`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batch stats');
  }

  return response.json();
}

/**
 * Export a batch as ZIP (initiates download)
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Blob>} - ZIP file blob
 */
export async function exportBatchZip(batchId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/${batchId}/export`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });

  if (!response.ok) {
    // Try to get JSON error message
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export batch');
    } catch {
      throw new Error('Failed to export batch');
    }
  }

  // Get the filename from Content-Disposition header
  const disposition = response.headers.get('Content-Disposition');
  let filename = 'codescribe-export.zip';
  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

/**
 * Export selected documents as ZIP (initiates download)
 * @param {Array<string>} documentIds - Array of document UUIDs
 * @returns {Promise<Object>} - { blob, filename }
 */
export async function exportDocumentsZip(documentIds) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/batches/export`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentIds })
  });

  if (!response.ok) {
    // Try to get JSON error message
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export documents');
    } catch {
      throw new Error('Failed to export documents');
    }
  }

  // Get the filename from Content-Disposition header
  const disposition = response.headers.get('Content-Disposition');
  let filename = 'codescribe-export.zip';
  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  return { blob, filename };
}

/**
 * Helper function to trigger a download from a blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename for download
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  createBatch,
  linkDocumentsToBatch,
  getUserBatches,
  getBatch,
  getBatchWithDocuments,
  deleteBatch,
  getBatchStats,
  exportBatchZip,
  exportDocumentsZip,
  downloadBlob
};
