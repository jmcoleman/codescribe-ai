/**
 * useTableColumnSizing Hook
 *
 * Provides persistent column sizing state for TanStack Table.
 * Stores column widths in localStorage, keyed by table identifier.
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

import { useState, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '../constants/storage.js';

// Base key for table column sizing - append table ID
const COLUMN_SIZING_BASE_KEY = 'cs_ui_tbl_cols';

/**
 * Get storage key for a specific table
 * @param {string} tableId - Unique table identifier (e.g., 'history', 'admin_users')
 * @returns {string} Storage key
 */
const getTableSizingKey = (tableId) => `${COLUMN_SIZING_BASE_KEY}_${tableId}`;

/**
 * Hook for persistent table column sizing
 * @param {string} tableId - Unique identifier for the table
 * @returns {{ columnSizing: Object, onColumnSizingChange: Function }}
 */
export function useTableColumnSizing(tableId) {
  const storageKey = getTableSizingKey(tableId);

  // Initialize from localStorage
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

  // Handler that persists changes to localStorage
  const onColumnSizingChange = useCallback((updater) => {
    setColumnSizing(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setStorageItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  return {
    columnSizing,
    onColumnSizingChange
  };
}

export default useTableColumnSizing;
