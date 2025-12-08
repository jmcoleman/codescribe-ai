/**
 * Preferences API Service
 *
 * Handles all API calls to the /api/preferences endpoints for
 * cross-device sync of user UI preferences.
 *
 * All endpoints require authentication (no tier gating).
 * Part of: User Preferences Consolidation (v3.3.0)
 */

import { API_URL } from '../config/api.js';
import { STORAGE_KEYS, getStorageItem } from '../constants/storage.js';

// ============================================================================
// Core Preferences API
// ============================================================================

/**
 * Get user's core preferences
 * Creates default preferences if none exist
 * @returns {Promise<Object>} - { success, preferences }
 */
export async function getPreferences() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/preferences`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch preferences');
  }

  return response.json();
}

/**
 * Update user's core preferences (partial update)
 * @param {Object} updates - Fields to update
 * @param {'light'|'dark'|'auto'} [updates.theme] - Appearance theme
 * @param {'split'|'code'|'doc'} [updates.layoutMode] - Panel layout
 * @param {boolean} [updates.sidebarCollapsed] - Sidebar state
 * @param {number} [updates.sidebarWidth] - Sidebar width (10-50)
 * @param {number|null} [updates.selectedProjectId] - Selected project ID (null to clear)
 * @returns {Promise<Object>} - { success, preferences }
 */
export async function updatePreferences(updates) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/preferences`, {
    method: 'PATCH',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update preferences');
  }

  return response.json();
}

// ============================================================================
// Table Preferences API
// ============================================================================

/**
 * Get all table preferences for the user
 * @returns {Promise<Object>} - { success, tables: { [tableId]: { columnSizing } } }
 */
export async function getAllTablePreferences() {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/preferences/tables`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch table preferences');
  }

  return response.json();
}

/**
 * Get preferences for a specific table
 * @param {string} tableId - Table identifier (e.g., 'history', 'admin_users')
 * @returns {Promise<Object>} - { success, tableId, preferences: { columnSizing } }
 */
export async function getTablePreferences(tableId) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/preferences/tables/${encodeURIComponent(tableId)}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch table preferences');
  }

  return response.json();
}

/**
 * Update preferences for a specific table
 * @param {string} tableId - Table identifier (e.g., 'history', 'admin_users')
 * @param {Object} updates - Table preferences to update
 * @param {Object} [updates.columnSizing] - Column width settings
 * @returns {Promise<Object>} - { success, tableId, preferences }
 */
export async function updateTablePreferences(tableId, updates) {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  const response = await fetch(`${API_URL}/api/preferences/tables/${encodeURIComponent(tableId)}`, {
    method: 'PATCH',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update table preferences');
  }

  return response.json();
}

export default {
  // Core preferences
  getPreferences,
  updatePreferences,
  // Table preferences
  getAllTablePreferences,
  getTablePreferences,
  updateTablePreferences
};
