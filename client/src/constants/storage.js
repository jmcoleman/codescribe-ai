/**
 * Storage Keys - localStorage and sessionStorage
 *
 * Centralized storage key constants using namespaced colon convention.
 * This prevents collisions with other apps and makes debugging easier.
 *
 * Naming Conventions:
 * - Format: 'codescribeai:storage_type:category:key'
 * - storage_type: 'local' for localStorage, 'session' for sessionStorage
 * - category: Domain area (auth, ui, analytics, etc.)
 * - key: Specific data being stored (kebab-case)
 *
 * Storage Type Guidelines:
 * - localStorage: Data that persists across browser sessions (auth tokens, preferences)
 * - sessionStorage: Temporary data that clears on tab/window close (in-flight operations, timing)
 */

export const STORAGE_KEYS = {
  // Authentication (localStorage - persists across sessions)
  AUTH_TOKEN: 'codescribeai:local:auth:token',

  // UI State (localStorage - user preferences)
  REPORT_EXPANDED: 'codescribeai:local:ui:report-expanded',
  SPLIT_PANEL_SIZES: 'codescribeai:local:ui:split-panel-sizes',
  THEME_PREFERENCE: 'codescribeai:local:ui:theme-preference',

  // Editor State (localStorage - persists code/docs across refreshes)
  EDITOR_CODE: 'codescribeai:local:editor:code',
  EDITOR_LANGUAGE: 'codescribeai:local:editor:language',
  EDITOR_FILENAME: 'codescribeai:local:editor:filename',
  EDITOR_DOC_TYPE: 'codescribeai:local:editor:doc-type',
  EDITOR_DOCUMENTATION: 'codescribeai:local:editor:documentation',
  EDITOR_QUALITY_SCORE: 'codescribeai:local:editor:quality-score',

  // Toast History (localStorage - persists for debugging)
  TOAST_HISTORY: 'codescribeai:local:toast:history',

  // OAuth Flow (sessionStorage - temporary timing data)
  OAUTH_START_TIME: 'codescribeai:session:oauth:start-time',
  OAUTH_CONTEXT: 'codescribeai:session:oauth:context',

  // UI Banners (sessionStorage - dismissed state for current session)
  EMAIL_VERIFICATION_BANNER_DISMISSED: 'codescribeai:session:ui:email-verification-banner-dismissed',

  // Subscription Flow (sessionStorage - temporary subscription intent before verification)
  PENDING_SUBSCRIPTION: 'codescribeai:session:subscription:pending-intent',
  BILLING_PERIOD: 'codescribeai:session:subscription:billing-period',
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
 * Clear all CodeScribe AI storage items (both localStorage and sessionStorage)
 * Useful for logout or debugging
 * @returns {Object} Object with counts of cleared items
 */
export const clearAppStorage = () => {
  const result = { localStorage: 0, sessionStorage: 0 };

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      // Determine storage type from key prefix
      if (key.includes(':local:')) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          result.localStorage++;
        }
      } else if (key.includes(':session:')) {
        if (sessionStorage.getItem(key) !== null) {
          sessionStorage.removeItem(key);
          result.sessionStorage++;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear app storage:', error);
  }

  return result;
};
