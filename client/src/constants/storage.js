/**
 * Storage Keys - localStorage and sessionStorage
 *
 * Centralized storage key constants using concise naming convention.
 * This prevents collisions with other apps and minimizes localStorage space usage.
 *
 * Naming Convention:
 * - Format: 'cs_{category}_{key}' or 'cs_{category}_{userId}' for user-scoped data
 * - cs = CodeScribe (app namespace)
 * - category: Short domain area (auth, ui, ed=editor, ws=workspace, toast, etc.)
 * - key: Specific data (snake_case)
 * - userId: User ID for user-scoped data (prevents multi-user conflicts)
 *
 * Storage Type Guidelines:
 * - localStorage: Data that persists across browser sessions (auth tokens, preferences, workspace)
 * - sessionStorage: Temporary data that clears on tab/window close (OAuth flow, banners)
 *
 * User-Scoped Keys:
 * - Workspace data MUST be user-scoped to prevent privacy leaks on shared computers
 * - Use getWorkspaceKey(userId) helper to generate user-scoped keys
 */

export const STORAGE_KEYS = {
  // Authentication (localStorage - persists across sessions)
  AUTH_TOKEN: 'cs_auth_token',

  // UI State (localStorage - user preferences)
  REPORT_EXPANDED: 'cs_ui_report_exp',
  SPLIT_PANEL_SIZES: 'cs_ui_split_sizes',
  SIDEBAR_MODE: 'cs_ui_sidebar',
  SIDEBAR_WIDTH: 'cs_ui_sidebar_width',
  THEME_PREFERENCE: 'cs_ui_theme',
  LAYOUT_MODE: 'cs_ui_layout', // 'split' | 'code' | 'doc'
  // Note: Table column sizes use cs_ui_tbl_cols_{tableId} via useTableColumnSizing hook
  PHI_TABLE_COLUMNS: 'cs_ui_tbl_cols_phi', // PHI detection table column widths
  HISTORY_COLUMN_VISIBILITY: 'cs_ui_hist_cols', // History table column visibility state
  VIEW_MODE_CODE: 'cs_ui_view_code', // 'raw' | 'rendered' for CodePanel markdown preview
  VIEW_MODE_FILE_PREVIEW: 'cs_ui_view_file', // 'raw' | 'rendered' for FilePreview markdown preview
  VIEW_MODE_DOC: 'cs_ui_view_doc', // 'raw' | 'rendered' for DocPanel markdown preview

  // Editor State (localStorage - persists code/docs across refreshes)
  // Privacy-sensitive: cs_ed_code, cs_ed_doc, cs_ed_score are user-scoped
  // Use getEditorKey(userId, 'code'|'doc'|'score') for user-scoped keys
  EDITOR_CODE: 'cs_ed_code',           // Base key, append _{userId} for user-scoped
  EDITOR_DOCUMENTATION: 'cs_ed_doc',   // Base key, append _{userId} for user-scoped
  EDITOR_QUALITY_SCORE: 'cs_ed_score', // Base key, append _{userId} for user-scoped

  // Non-sensitive preferences (global, not user-scoped)
  // Note: Language is derived from filename, not stored separately
  EDITOR_FILENAME: 'cs_ed_file',
  EDITOR_DOC_TYPE: 'cs_ed_doctype',
  EDITOR_CODE_ORIGIN: 'cs_ed_origin',       // 'upload' | 'github' | 'paste' | 'sample' | 'default'
  EDITOR_SOURCE_METADATA: 'cs_ed_src_meta', // GitHub/GitLab metadata for reload functionality

  // Toast History (localStorage - persists for debugging)
  TOAST_HISTORY: 'cs_toast_hist',

  // Workspace (localStorage - user-scoped to prevent privacy leaks)
  // NOTE: Use getWorkspaceKey(userId) instead of direct access
  WORKSPACE_CONTENTS: 'cs_ws', // Base key, append _{userId}

  // GitHub (localStorage - user-scoped to prevent privacy leaks)
  // NOTE: Use getGitHubRecentKey(userId) instead of direct access
  GITHUB_RECENT_FILES: 'cs_gh_recent', // Base key, append _{userId}

  // OAuth Flow (sessionStorage - temporary timing data)
  OAUTH_START_TIME: 'cs_oauth_start',
  OAUTH_CONTEXT: 'cs_oauth_ctx',

  // UI Banners (sessionStorage - dismissed state for current session)
  EMAIL_VERIFICATION_BANNER_DISMISSED: 'cs_banner_email',

  // Doc Panel State (localStorage - tracks if user intentionally cleared doc panel)
  // Note: Using localStorage so it survives refresh; cleared on logout or new generation
  DOC_PANEL_CLEARED: 'cs_ui_doc_cleared',

  // Subscription Flow (sessionStorage - temporary subscription intent before verification)
  PENDING_SUBSCRIPTION: 'cs_sub_pending',
  BILLING_PERIOD: 'cs_sub_period',

  // Admin Analytics Filters (sessionStorage - retain filters during session)
  ANALYTICS_EVENTS_FILTERS: 'cs_admin_events_filters',
  ANALYTICS_EXCLUDE_INTERNAL: 'cs_admin_exclude_internal',
  ANALYTICS_EXCLUDE_ANONYMOUS: 'cs_admin_exclude_anonymous',
  ANALYTICS_ACTIVE_TAB: 'cs_admin_active_tab',
  ANALYTICS_DATE_RANGE: 'cs_admin_date_range',

  // Admin Compliance Filters (sessionStorage - retain filters during session)
  COMPLIANCE_DATE_RANGE: 'cs_admin_compliance_date_range',
};

/**
 * Helper function to safely get item from localStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} defaultValue - Default value if key doesn't exist or error occurs
 * @returns {*} Stored value or default value
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to get storage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Helper function to safely set item in localStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set storage item "${key}":`, error);
    return false;
  }
};

/**
 * Helper function to safely remove item from localStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @returns {boolean} True if successful, false otherwise
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove storage item "${key}":`, error);
    return false;
  }
};

/**
 * Helper function to safely get item from sessionStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} defaultValue - Default value if key doesn't exist or error occurs
 * @returns {*} Stored value or default value
 */
export const getSessionItem = (key, defaultValue = null) => {
  try {
    const item = sessionStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to get session item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Helper function to safely set item in sessionStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @param {*} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
export const setSessionItem = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set session item "${key}":`, error);
    return false;
  }
};

/**
 * Helper function to safely remove item from sessionStorage
 * @param {string} key - Storage key from STORAGE_KEYS
 * @returns {boolean} True if successful, false otherwise
 */
export const removeSessionItem = (key) => {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove session item "${key}":`, error);
    return false;
  }
};

/**
 * Get user-scoped workspace key
 * @param {number|string} userId - User ID
 * @returns {string|null} User-scoped workspace key (e.g., 'cs_ws_123')
 */
export const getWorkspaceKey = (userId) => {
  if (!userId) {
    console.warn('[storage] getWorkspaceKey called without userId');
    return null;
  }
  return `${STORAGE_KEYS.WORKSPACE_CONTENTS}_${userId}`;
};

/**
 * Get user-scoped editor key for privacy-sensitive content
 * @param {number|string} userId - User ID
 * @param {'code'|'doc'|'score'} type - Type of editor content
 * @returns {string|null} User-scoped editor key (e.g., 'cs_ed_code_123')
 */
export const getEditorKey = (userId, type) => {
  if (!userId) {
    console.warn('[storage] getEditorKey called without userId');
    return null;
  }

  const baseKeys = {
    code: STORAGE_KEYS.EDITOR_CODE,
    doc: STORAGE_KEYS.EDITOR_DOCUMENTATION,
    score: STORAGE_KEYS.EDITOR_QUALITY_SCORE
  };

  const baseKey = baseKeys[type];
  if (!baseKey) {
    console.warn(`[storage] getEditorKey called with invalid type: ${type}`);
    return null;
  }

  return `${baseKey}_${userId}`;
};

/**
 * Get user-scoped GitHub recent files key
 * @param {number|string} userId - User ID
 * @returns {string|null} User-scoped GitHub recent files key (e.g., 'cs_gh_recent_123')
 */
export const getGitHubRecentKey = (userId) => {
  if (!userId) {
    console.warn('[storage] getGitHubRecentKey called without userId');
    return null;
  }
  return `${STORAGE_KEYS.GITHUB_RECENT_FILES}_${userId}`;
};

/**
 * Clear all CodeScribe AI storage items (both localStorage and sessionStorage)
 * Useful for logout or debugging
 * @param {number|string} userId - Optional user ID to clear user-specific data
 * @returns {Object} Object with counts of cleared items
 */
export const clearAppStorage = (userId = null) => {
  const result = { localStorage: 0, sessionStorage: 0 };

  try {
    // Clear all standard keys
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      // Skip user-scoped base keys (they're handled separately)
      if (name === 'WORKSPACE_CONTENTS' || name === 'GITHUB_RECENT_FILES') {
        return;
      }

      // sessionStorage keys (cs_oauth_, cs_banner_, cs_sub_)
      if (key.startsWith('cs_oauth_') || key.startsWith('cs_banner_') || key.startsWith('cs_sub_')) {
        if (sessionStorage.getItem(key) !== null) {
          sessionStorage.removeItem(key);
          result.sessionStorage++;
        }
      } else {
        // localStorage keys
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          result.localStorage++;
        }
      }
    });

    // Clear user-scoped data if userId provided
    if (userId) {
      // Clear workspace
      const workspaceKey = getWorkspaceKey(userId);
      if (workspaceKey && localStorage.getItem(workspaceKey) !== null) {
        localStorage.removeItem(workspaceKey);
        result.localStorage++;
      }

      // Clear editor content (code, doc, score)
      ['code', 'doc', 'score'].forEach(type => {
        const editorKey = getEditorKey(userId, type);
        if (editorKey && localStorage.getItem(editorKey) !== null) {
          localStorage.removeItem(editorKey);
          result.localStorage++;
        }
      });

      // Clear GitHub recent files
      const githubRecentKey = getGitHubRecentKey(userId);
      if (githubRecentKey && localStorage.getItem(githubRecentKey) !== null) {
        localStorage.removeItem(githubRecentKey);
        result.localStorage++;
      }
      // Note: selectedProjectId is stored inside workspace data (cs_ws_{userId})
      // and is cleared when workspace is cleared above
    }
  } catch (error) {
    console.warn('Failed to clear app storage:', error);
  }

  return result;
};
