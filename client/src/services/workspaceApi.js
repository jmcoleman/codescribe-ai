/**
 * Workspace API Service
 *
 * Client-side API wrapper for workspace file management.
 * Handles CRUD operations for user's current workspace (multi-file feature).
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS } from '../constants/storage.js';

/**
 * Get user's current workspace files
 * @returns {Promise<{ success: boolean, files: Array, count: number }>}
 */
export async function getWorkspace() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/workspace`, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch workspace' }));
    throw new Error(error.error || 'Failed to fetch workspace');
  }

  return response.json();
}

/**
 * Add file to workspace
 * @param {Object} fileData - File metadata
 * @param {string} fileData.filename - File name
 * @param {string} fileData.language - Programming language
 * @param {number} fileData.fileSizeBytes - File size in bytes
 * @param {string} [fileData.docType] - Documentation type (README, JSDOC, API, ARCHITECTURE)
 * @param {string} [fileData.origin] - File origin (upload, github, paste, sample)
 * @param {Object} [fileData.github] - GitHub metadata
 * @returns {Promise<{ success: boolean, file: Object }>}
 */
export async function addWorkspaceFile(fileData) {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/workspace`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fileData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add file to workspace' }));
    throw new Error(error.error || 'Failed to add file to workspace');
  }

  return response.json();
}

/**
 * Update workspace file
 * @param {string} fileId - File ID (UUID)
 * @param {Object} updates - Fields to update
 * @param {string} [updates.documentId] - Link to generated document (UUID)
 * @param {string} [updates.docType] - Documentation type
 * @returns {Promise<{ success: boolean, file: Object }>}
 */
export async function updateWorkspaceFile(fileId, updates) {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/workspace/${fileId}`, {
    method: 'PUT',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update workspace file' }));
    throw new Error(error.error || 'Failed to update workspace file');
  }

  return response.json();
}

/**
 * Remove file from workspace
 * @param {string} fileId - File ID (UUID)
 * @returns {Promise<{ success: boolean, deleted: string }>}
 */
export async function deleteWorkspaceFile(fileId) {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/workspace/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete workspace file' }));
    throw new Error(error.error || 'Failed to delete workspace file');
  }

  return response.json();
}

/**
 * Clear entire workspace (delete all files)
 * @returns {Promise<{ success: boolean, deletedCount: number }>}
 */
export async function clearWorkspace() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/workspace`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to clear workspace' }));
    throw new Error(error.error || 'Failed to clear workspace');
  }

  return response.json();
}

export default {
  getWorkspace,
  addWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
  clearWorkspace,
};
