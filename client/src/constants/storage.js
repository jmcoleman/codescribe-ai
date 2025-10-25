/**
 * Local Storage Keys
 *
 * Centralized storage key constants using namespaced colon convention.
 * This prevents collisions with other apps and makes debugging easier.
 *
 * Convention: 'codescribeai:category:key'
 */

export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'codescribeai:auth:token',

  // UI State
  REPORT_EXPANDED: 'codescribeai:ui:report-expanded',

  // Toast History
  TOAST_HISTORY: 'codescribeai:toast:history',
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
 * Clear all CodeScribe AI storage items
 * Useful for logout or debugging
 * @returns {number} Number of items cleared
 */
export const clearAppStorage = () => {
  let cleared = 0;
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
  } catch (error) {
    console.warn('Failed to clear app storage:', error);
  }
  return cleared;
};
