/**
 * useDateRange - Shared hook for date range state management
 *
 * Provides consistent initialization, sessionStorage persistence,
 * and API-ready serialization across all admin dashboards.
 *
 * @param {string} storageKey - sessionStorage key (from STORAGE_KEYS)
 * @returns {{ dateRange, setDateRange, dateParams }}
 *   - dateRange: { startDate: Date, endDate: Date }
 *   - setDateRange: setter (compatible with DateRangePicker onChange)
 *   - dateParams: { startDate: string, endDate: string } ISO strings ready for API calls
 */

import { useState, useMemo, useEffect } from 'react';
import { getSessionItem, setSessionItem } from '../constants/storage';

/**
 * Build the default "last 30 days" range.
 * End date is tomorrow so today's events are included.
 */
const getDefaultRange = () => {
  const end = new Date();
  end.setDate(end.getDate() + 1);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: start, endDate: end };
};

export function useDateRange(storageKey) {
  const [dateRange, setDateRange] = useState(() => {
    const saved = getSessionItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.startDate && parsed.endDate) {
          return {
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate),
          };
        }
      } catch {
        // Fall through to default
      }
    }
    return getDefaultRange();
  });

  // Persist to sessionStorage whenever range changes
  useEffect(() => {
    setSessionItem(storageKey, JSON.stringify({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    }));
  }, [dateRange, storageKey]);

  // Pre-serialized ISO strings for API query params
  const dateParams = useMemo(() => ({
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
  }), [dateRange]);

  return { dateRange, setDateRange, dateParams };
}
