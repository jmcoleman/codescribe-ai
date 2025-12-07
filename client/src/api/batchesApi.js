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
 * Fetch user's generation batches with sorting and filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Max results (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.batchType - Filter by 'batch' or 'single' (optional)
 * @param {string} options.sortBy - Column to sort by: 'created_at', 'avg_grade', 'total_files' (default: 'created_at')
 * @param {string} options.sortOrder - Sort direction: 'asc' or 'desc' (default: 'desc')
 * @param {string} options.gradeFilter - Filter by grade: 'A', 'B', 'C', 'D', 'F' (optional)
 * @param {string} options.docTypeFilter - Filter by doc type: 'README', 'JSDOC', 'API', etc. (optional)
 * @param {string} options.filenameSearch - Search by filename (partial match, optional)
 * @returns {Promise<Object>} { batches, total, hasMore, page, limit, totalPages }
 */
export async function fetchBatches(options = {}) {
  const {
    limit = 20,
    offset = 0,
    batchType = null,
    sortBy = 'created_at',
    sortOrder = 'desc',
    gradeFilter = null,
    docTypeFilter = null,
    filenameSearch = null
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    sortBy,
    sortOrder
  });

  if (batchType) {
    params.append('batchType', batchType);
  }

  if (gradeFilter) {
    params.append('gradeFilter', gradeFilter);
  }

  if (docTypeFilter) {
    params.append('docTypeFilter', docTypeFilter);
  }

  if (filenameSearch) {
    params.append('filenameSearch', filenameSearch);
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
 * Fetch a single batch with its documents (optionally filtered)
 * @param {string} batchId - Batch UUID
 * @param {Object} filters - Optional filters
 * @param {string} filters.filenameSearch - Filter by filename (partial match)
 * @param {string} filters.gradeFilter - Filter by grade: 'A', 'B', 'C', 'D', 'F'
 * @param {string} filters.docTypeFilter - Filter by doc type
 * @returns {Promise<Object>} { batch, documents }
 */
export async function fetchBatchWithDocuments(batchId, filters = {}) {
  const { filenameSearch, gradeFilter, docTypeFilter } = filters;

  const params = new URLSearchParams();
  if (filenameSearch) {
    params.append('filenameSearch', filenameSearch);
  }
  if (gradeFilter) {
    params.append('gradeFilter', gradeFilter);
  }
  if (docTypeFilter) {
    params.append('docTypeFilter', docTypeFilter);
  }

  const queryString = params.toString();
  const url = `${API_URL}/api/batches/${batchId}/documents${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
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
