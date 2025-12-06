/**
 * Batches API Client
 *
 * Handles API calls for generation history (batches and documents)
 * Pro+ tier feature for viewing past generations
 */

import { API_URL } from '../config/api';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Get auth headers for API requests
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

/**
 * Fetch user's generation batches
 * @param {Object} options - Query options
 * @param {number} options.limit - Max results (default: 50)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.batchType - Filter by 'batch' or 'single' (optional)
 * @returns {Promise<Object>} { batches, total, hasMore }
 */
export async function fetchBatches(options = {}) {
  const { limit = 50, offset = 0, batchType = null } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });

  if (batchType) {
    params.append('batchType', batchType);
  }

  const response = await fetch(`${API_URL}/api/batches?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch history' }));
    throw new Error(error.error || 'Failed to fetch history');
  }

  return response.json();
}

/**
 * Fetch a single batch with all its documents
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Object>} { batch, documents }
 */
export async function fetchBatchWithDocuments(batchId) {
  const response = await fetch(`${API_URL}/api/batches/${batchId}/documents`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch batch' }));
    throw new Error(error.error || 'Failed to fetch batch');
  }

  return response.json();
}

/**
 * Fetch user's batch statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function fetchBatchStats() {
  const response = await fetch(`${API_URL}/api/batches/stats`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
    throw new Error(error.error || 'Failed to fetch stats');
  }

  return response.json();
}

/**
 * Delete a batch
 * @param {string} batchId - Batch UUID
 * @returns {Promise<Object>} { success: true }
 */
export async function deleteBatch(batchId) {
  const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete batch' }));
    throw new Error(error.error || 'Failed to delete batch');
  }

  return response.json();
}
