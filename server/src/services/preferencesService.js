/**
 * Preferences Service - User Preferences Management
 *
 * Manages user UI preferences for cross-device sync.
 * - Core preferences: theme, layout, sidebar, selected project
 * - Table preferences: per-table column sizing, etc.
 *
 * Part of: User Preferences Consolidation (v3.3.0)
 */

import { sql } from '@vercel/postgres';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * @typedef {Object} UserPreferences
 * @property {number} userId - User ID
 * @property {'light'|'dark'|'auto'} theme - Appearance theme
 * @property {'split'|'code'|'doc'} layoutMode - Panel layout
 * @property {boolean} sidebarCollapsed - Whether sidebar is collapsed
 * @property {number} sidebarWidth - Sidebar width percentage (10-50)
 * @property {number|null} selectedProjectId - Currently selected project
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} TablePreferences
 * @property {number} userId - User ID
 * @property {string} tableId - Table identifier
 * @property {Object} columnSizing - Column width settings
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} UpdatePreferencesInput
 * @property {'light'|'dark'|'auto'} [theme] - Appearance theme
 * @property {'split'|'code'|'doc'} [layoutMode] - Panel layout
 * @property {boolean} [sidebarCollapsed] - Whether sidebar is collapsed
 * @property {number} [sidebarWidth] - Sidebar width percentage
 * @property {number|null} [selectedProjectId] - Currently selected project
 */

// ============================================================================
// Validation Constants
// ============================================================================

const VALID_THEMES = ['light', 'dark', 'auto'];
const VALID_LAYOUTS = ['split', 'code', 'doc'];
const SIDEBAR_WIDTH_MIN = 10;
const SIDEBAR_WIDTH_MAX = 50;

// ============================================================================
// Core Preferences Functions
// ============================================================================

/**
 * Get user preferences, creating defaults if none exist
 *
 * @param {number} userId - User ID
 * @returns {Promise<UserPreferences>} User preferences
 * @throws {Error} If userId is invalid
 */
export async function getPreferences(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Try to get existing preferences
  const result = await sql`
    SELECT
      user_id,
      theme,
      layout_mode,
      sidebar_collapsed,
      sidebar_width,
      selected_project_id,
      created_at,
      updated_at
    FROM user_preferences
    WHERE user_id = ${userId}
  `;

  if (result.rows.length > 0) {
    return formatPreferences(result.rows[0]);
  }

  // Create default preferences if none exist
  const defaultResult = await sql`
    INSERT INTO user_preferences (user_id)
    VALUES (${userId})
    RETURNING
      user_id,
      theme,
      layout_mode,
      sidebar_collapsed,
      sidebar_width,
      selected_project_id,
      created_at,
      updated_at
  `;

  return formatPreferences(defaultResult.rows[0]);
}

/**
 * Update user preferences (partial update)
 *
 * @param {number} userId - User ID
 * @param {UpdatePreferencesInput} updates - Fields to update
 * @returns {Promise<UserPreferences>} Updated preferences
 * @throws {Error} If validation fails
 */
export async function updatePreferences(userId, updates) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Validate updates
  if (updates.theme !== undefined && !VALID_THEMES.includes(updates.theme)) {
    throw new Error(`Invalid theme: ${updates.theme}. Must be one of: ${VALID_THEMES.join(', ')}`);
  }

  if (updates.layoutMode !== undefined && !VALID_LAYOUTS.includes(updates.layoutMode)) {
    throw new Error(`Invalid layout mode: ${updates.layoutMode}. Must be one of: ${VALID_LAYOUTS.join(', ')}`);
  }

  if (updates.sidebarWidth !== undefined) {
    const width = Number(updates.sidebarWidth);
    if (isNaN(width) || width < SIDEBAR_WIDTH_MIN || width > SIDEBAR_WIDTH_MAX) {
      throw new Error(`Invalid sidebar width: ${updates.sidebarWidth}. Must be between ${SIDEBAR_WIDTH_MIN} and ${SIDEBAR_WIDTH_MAX}`);
    }
  }

  // Ensure preferences row exists
  const existing = await getPreferences(userId);

  // Build update values with fallback to existing
  const theme = updates.theme ?? existing.theme;
  const layoutMode = updates.layoutMode ?? existing.layoutMode;
  const sidebarCollapsed = updates.sidebarCollapsed ?? existing.sidebarCollapsed;
  const sidebarWidth = updates.sidebarWidth ?? existing.sidebarWidth;
  // Handle selectedProjectId: null means clear, undefined means keep existing
  const selectedProjectId = updates.selectedProjectId === null
    ? null
    : (updates.selectedProjectId ?? existing.selectedProjectId);

  const result = await sql`
    UPDATE user_preferences
    SET
      theme = ${theme},
      layout_mode = ${layoutMode},
      sidebar_collapsed = ${sidebarCollapsed},
      sidebar_width = ${sidebarWidth},
      selected_project_id = ${selectedProjectId},
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING
      user_id,
      theme,
      layout_mode,
      sidebar_collapsed,
      sidebar_width,
      selected_project_id,
      created_at,
      updated_at
  `;

  return formatPreferences(result.rows[0]);
}

/**
 * Delete user preferences (called on account deletion)
 * Cascades automatically via ON DELETE CASCADE
 *
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deletePreferences(userId) {
  if (!userId) {
    return false;
  }

  const result = await sql`
    DELETE FROM user_preferences
    WHERE user_id = ${userId}
    RETURNING user_id
  `;

  return result.rowCount > 0;
}

// ============================================================================
// Table Preferences Functions
// ============================================================================

/**
 * Get preferences for a specific table
 *
 * @param {number} userId - User ID
 * @param {string} tableId - Table identifier
 * @returns {Promise<TablePreferences|null>} Table preferences or null
 */
export async function getTablePreferences(userId, tableId) {
  if (!userId || !tableId) {
    return null;
  }

  const result = await sql`
    SELECT
      user_id,
      table_id,
      column_sizing,
      updated_at
    FROM user_table_preferences
    WHERE user_id = ${userId} AND table_id = ${tableId}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return formatTablePreferences(result.rows[0]);
}

/**
 * Update preferences for a specific table (upsert)
 *
 * @param {number} userId - User ID
 * @param {string} tableId - Table identifier
 * @param {Object} updates - Table preferences to update
 * @param {Object} [updates.columnSizing] - Column sizing object
 * @returns {Promise<TablePreferences>} Updated table preferences
 * @throws {Error} If validation fails
 */
export async function updateTablePreferences(userId, tableId, updates) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!tableId || typeof tableId !== 'string' || tableId.length > 50) {
    throw new Error('Valid table ID is required (max 50 characters)');
  }

  // Validate column sizing is an object if provided
  if (updates.columnSizing !== undefined && (typeof updates.columnSizing !== 'object' || Array.isArray(updates.columnSizing))) {
    throw new Error('Column sizing must be an object');
  }

  const columnSizing = updates.columnSizing || {};

  // Upsert the table preferences
  const result = await sql`
    INSERT INTO user_table_preferences (user_id, table_id, column_sizing, updated_at)
    VALUES (${userId}, ${tableId}, ${JSON.stringify(columnSizing)}, NOW())
    ON CONFLICT (user_id, table_id)
    DO UPDATE SET
      column_sizing = ${JSON.stringify(columnSizing)},
      updated_at = NOW()
    RETURNING
      user_id,
      table_id,
      column_sizing,
      updated_at
  `;

  return formatTablePreferences(result.rows[0]);
}

/**
 * Get all table preferences for a user
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object<string, TablePreferences>>} Map of tableId to preferences
 */
export async function getAllTablePreferences(userId) {
  if (!userId) {
    return {};
  }

  const result = await sql`
    SELECT
      user_id,
      table_id,
      column_sizing,
      updated_at
    FROM user_table_preferences
    WHERE user_id = ${userId}
    ORDER BY table_id
  `;

  // Return as a map for easier frontend consumption
  const tables = {};
  for (const row of result.rows) {
    const formatted = formatTablePreferences(row);
    tables[formatted.tableId] = {
      columnSizing: formatted.columnSizing,
      updatedAt: formatted.updatedAt
    };
  }

  return tables;
}

/**
 * Delete all table preferences for a user
 * Called on account deletion (cascades automatically)
 *
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of deleted entries
 */
export async function deleteAllTablePreferences(userId) {
  if (!userId) {
    return 0;
  }

  const result = await sql`
    DELETE FROM user_table_preferences
    WHERE user_id = ${userId}
  `;

  return result.rowCount;
}

/**
 * Delete preferences for a specific table
 *
 * @param {number} userId - User ID
 * @param {string} tableId - Table identifier
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteTablePreferences(userId, tableId) {
  if (!userId || !tableId) {
    return false;
  }

  const result = await sql`
    DELETE FROM user_table_preferences
    WHERE user_id = ${userId} AND table_id = ${tableId}
    RETURNING user_id
  `;

  return result.rowCount > 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format database row to UserPreferences object
 * @param {Object} row - Database row
 * @returns {UserPreferences}
 */
function formatPreferences(row) {
  return {
    userId: row.user_id,
    theme: row.theme,
    layoutMode: row.layout_mode,
    sidebarCollapsed: row.sidebar_collapsed,
    sidebarWidth: row.sidebar_width,
    selectedProjectId: row.selected_project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Format database row to TablePreferences object
 * @param {Object} row - Database row
 * @returns {TablePreferences}
 */
function formatTablePreferences(row) {
  return {
    userId: row.user_id,
    tableId: row.table_id,
    columnSizing: typeof row.column_sizing === 'string'
      ? JSON.parse(row.column_sizing)
      : row.column_sizing || {},
    updatedAt: row.updated_at
  };
}

export default {
  // Core preferences
  getPreferences,
  updatePreferences,
  deletePreferences,
  // Table preferences
  getTablePreferences,
  updateTablePreferences,
  getAllTablePreferences,
  deleteAllTablePreferences,
  deleteTablePreferences
};
