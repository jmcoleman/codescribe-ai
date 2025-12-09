/**
 * useTableColumnSizing Hook
 *
 * Provides persistent column sizing state for TanStack Table.
 * Features:
 * - localStorage cache for instant loading
 * - API sync for cross-device persistence (when authenticated)
 * - Debounced API updates to minimize network requests
 *
 * @example
 * const { columnSizing, onColumnSizingChange } = useTableColumnSizing('history');
 *
 * <BaseTable
 *   columnSizing={columnSizing}
 *   onColumnSizingChange={onColumnSizingChange}
 *   enableColumnResizing={true}
 *   ...
 * />
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getStorageItem, setStorageItem } from '../constants/storage.js';
import { getTablePreferences, updateTablePreferences } from '../services/preferencesApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Base key for table column sizing - append table ID
const COLUMN_SIZING_BASE_KEY = 'cs_ui_tbl_cols';

// Debounce delay for API sync (ms)
const SYNC_DEBOUNCE_MS = 500;

/**
 * Get storage key for a specific table
 * @param {string} tableId - Unique table identifier (e.g., 'history', 'admin_users')
 * @returns {string} Storage key
 */
const getTableSizingKey = (tableId) => `${COLUMN_SIZING_BASE_KEY}_${tableId}`;

/**
 * Safe hook to get auth state - returns default values if useAuth throws.
 * This allows the hook to work in tests without AuthProvider.
 */
function useSafeAuth() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    return { isAuthenticated: auth?.isAuthenticated ?? false, isLoading: auth?.isLoading ?? false };
  } catch {
    return { isAuthenticated: false, isLoading: false };
  }
}

/**
 * Hook for persistent table column sizing with API sync
 * @param {string} tableId - Unique identifier for the table
 * @returns {{ columnSizing: Object, onColumnSizingChange: Function, isLoading: boolean }}
 */
export function useTableColumnSizing(tableId) {
  const storageKey = getTableSizingKey(tableId);
  const { isAuthenticated, isLoading: authLoading } = useSafeAuth();

  // Initialize from localStorage for instant rendering
  const [columnSizing, setColumnSizing] = useState(() => {
    const saved = getStorageItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [isLoading, setIsLoading] = useState(false);

  // Track if we've loaded from API for this table in this session
  const hasLoadedFromApiRef = useRef(false);

  // Pending updates for debounced sync
  const pendingUpdatesRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Load from API when authenticated
  useEffect(() => {
    async function loadFromApi() {
      if (!isAuthenticated || authLoading) {
        return;
      }

      // Don't reload if we already loaded in this session
      if (hasLoadedFromApiRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await getTablePreferences(tableId);
        if (response.success && response.columnSizing) {
          const apiSizing = response.columnSizing;
          setColumnSizing(apiSizing);
          setStorageItem(storageKey, JSON.stringify(apiSizing));
          hasLoadedFromApiRef.current = true;
        }
      } catch (err) {
        console.warn(`[useTableColumnSizing] Failed to load ${tableId} from API:`, err);
        // Keep using localStorage value on error
      } finally {
        setIsLoading(false);
      }
    }

    loadFromApi();
  }, [isAuthenticated, authLoading, tableId, storageKey]);

  // Sync to API (debounced)
  const syncToApi = useCallback(async () => {
    if (!isAuthenticated) return;

    const updates = pendingUpdatesRef.current;
    if (!updates) return;

    // Clear pending updates
    pendingUpdatesRef.current = null;

    try {
      await updateTablePreferences(tableId, { columnSizing: updates });
    } catch (err) {
      console.warn(`[useTableColumnSizing] Failed to sync ${tableId} to API:`, err);
      // Don't throw - local changes still work
    }
  }, [isAuthenticated, tableId]);

  // Handler that persists changes to localStorage and syncs to API
  const onColumnSizingChange = useCallback((updater) => {
    setColumnSizing(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      // Save to localStorage immediately
      setStorageItem(storageKey, JSON.stringify(next));

      // Queue for API sync (debounced)
      pendingUpdatesRef.current = next;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToApi();
      }, SYNC_DEBOUNCE_MS);

      return next;
    });
  }, [storageKey, syncToApi]);

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

  // Reset API load flag when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      hasLoadedFromApiRef.current = false;
    }
  }, [isAuthenticated, authLoading]);

  return {
    columnSizing,
    onColumnSizingChange,
    isLoading
  };
}

export default useTableColumnSizing;
