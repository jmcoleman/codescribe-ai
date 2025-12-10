/**
 * Preferences Context
 *
 * Provides centralized access to user UI preferences with cross-device sync.
 * Features:
 * - Loads preferences from API on login
 * - Caches in localStorage for fast access
 * - Debounced sync to API on changes
 * - Graceful fallback if API unavailable
 *
 * Part of: User Preferences Consolidation (v3.3.0)
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getPreferences, updatePreferences as updatePreferencesApi } from '../services/preferencesApi';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem
} from '../constants/storage';

const PreferencesContext = createContext();

// LocalStorage keys for preferences cache
const PREFS_CACHE_KEY = 'cs_prefs_cache';

// Debounce delay for API sync (ms)
const SYNC_DEBOUNCE_MS = 300;

// Default preferences
const DEFAULT_PREFERENCES = {
  theme: 'auto',
  layoutMode: 'split',
  sidebarCollapsed: false,
  sidebarWidth: 20,
  selectedProjectId: null
};

/**
 * Load cached preferences from localStorage
 */
function loadCachedPreferences() {
  try {
    const cached = getStorageItem(PREFS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (e) {
    console.warn('[PreferencesContext] Failed to load cached preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save preferences to localStorage cache
 */
function saveCachedPreferences(prefs) {
  try {
    setStorageItem(PREFS_CACHE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[PreferencesContext] Failed to cache preferences:', e);
  }
}

export function PreferencesProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Initialize from localStorage cache for instant loading
  const [preferences, setPreferencesInternal] = useState(loadCachedPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track pending API updates for debouncing
  const pendingUpdatesRef = useRef({});
  const syncTimeoutRef = useRef(null);

  // Track if we've loaded from API in this session
  const hasLoadedFromApiRef = useRef(false);

  // Load preferences from API when user authenticates
  useEffect(() => {
    async function loadFromApi() {
      if (!isAuthenticated || authLoading) {
        setIsLoading(false);
        return;
      }

      // Don't reload if we already loaded in this session
      if (hasLoadedFromApiRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await getPreferences();
        if (response.success && response.preferences) {
          const apiPrefs = response.preferences;
          setPreferencesInternal(apiPrefs);
          saveCachedPreferences(apiPrefs);
          hasLoadedFromApiRef.current = true;
        }
      } catch (err) {
        console.error('[PreferencesContext] Failed to load preferences from API:', err);
        setError(err.message);
        // Keep using cached preferences on error
      } finally {
        setIsLoading(false);
      }
    }

    loadFromApi();
  }, [isAuthenticated, authLoading]);

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      // User logged out - keep preferences in localStorage but reset API load flag
      hasLoadedFromApiRef.current = false;

      // Clear project-related preferences since they require authentication
      // This prevents API calls for projects when user is not logged in
      setPreferencesInternal(prev => {
        const newPrefs = { ...prev, selectedProjectId: null };
        saveCachedPreferences(newPrefs);
        return newPrefs;
      });
    }
  }, [isAuthenticated, authLoading]);

  /**
   * Sync pending updates to API (debounced)
   */
  const syncToApi = useCallback(async () => {
    if (!isAuthenticated) return;

    const updates = { ...pendingUpdatesRef.current };
    if (Object.keys(updates).length === 0) return;

    // Clear pending updates
    pendingUpdatesRef.current = {};

    try {
      await updatePreferencesApi(updates);
    } catch (err) {
      console.error('[PreferencesContext] Failed to sync preferences to API:', err);
      // Don't throw - local changes still work
    }
  }, [isAuthenticated]);

  /**
   * Update preferences with debounced API sync
   */
  const updatePreferences = useCallback((updates) => {
    // Update local state immediately
    setPreferencesInternal(prev => {
      const newPrefs = { ...prev, ...updates };
      saveCachedPreferences(newPrefs);
      return newPrefs;
    });

    // Accumulate updates for batch sync
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Debounce API sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncToApi();
    }, SYNC_DEBOUNCE_MS);
  }, [syncToApi]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        // Flush any pending updates on unmount
        syncToApi();
      }
    };
  }, [syncToApi]);

  // Convenience setters for individual preferences
  const setTheme = useCallback((theme) => {
    updatePreferences({ theme });
  }, [updatePreferences]);

  const setLayoutMode = useCallback((layoutMode) => {
    updatePreferences({ layoutMode });
  }, [updatePreferences]);

  const setSidebarCollapsed = useCallback((sidebarCollapsed) => {
    updatePreferences({ sidebarCollapsed });
  }, [updatePreferences]);

  const setSidebarWidth = useCallback((sidebarWidth) => {
    updatePreferences({ sidebarWidth });
  }, [updatePreferences]);

  const setSelectedProjectId = useCallback((selectedProjectId) => {
    updatePreferences({ selectedProjectId });
  }, [updatePreferences]);

  const value = {
    // Current preferences
    preferences,
    isLoading,
    error,

    // Individual preference values (convenience accessors)
    theme: preferences.theme,
    layoutMode: preferences.layoutMode,
    sidebarCollapsed: preferences.sidebarCollapsed,
    sidebarWidth: preferences.sidebarWidth,
    selectedProjectId: preferences.selectedProjectId,

    // Update functions
    updatePreferences,
    setTheme,
    setLayoutMode,
    setSidebarCollapsed,
    setSidebarWidth,
    setSelectedProjectId
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// Default values for when PreferencesContext is not available (e.g., in tests)
const DEFAULT_PREFERENCES_CONTEXT = {
  preferences: {
    theme: 'light',
    layoutMode: 'split',
    sidebarCollapsed: false,
    sidebarWidth: 20,
    selectedProjectId: null
  },
  isLoading: false,
  error: null,
  theme: 'light',
  layoutMode: 'split',
  sidebarCollapsed: false,
  sidebarWidth: 20,
  selectedProjectId: null,
  updatePreferences: () => {},
  setTheme: () => {},
  setLayoutMode: () => {},
  setSidebarCollapsed: () => {},
  setSidebarWidth: () => {},
  setSelectedProjectId: () => {}
};

export function usePreferences() {
  const context = useContext(PreferencesContext);
  // Return defaults if context is not available (for tests/backwards compatibility)
  if (!context) {
    return DEFAULT_PREFERENCES_CONTEXT;
  }
  return context;
}

export default PreferencesContext;
