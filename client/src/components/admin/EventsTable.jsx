/**
 * EventsTable Component
 *
 * Displays raw analytics events with filtering, pagination, and CSV export.
 * Uses BaseTable for consistent styling and column resizing.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Filter,
  Download,
  Database,
  User,
  Globe,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Select } from '../Select';
import { formatDateTime } from '../../utils/formatters';
import { BaseTable } from '../BaseTable';
import { useTableColumnSizing } from '../../hooks/useTableColumnSizing';

const API_URL = import.meta.env.VITE_API_URL || '';

// Category options for filter
// Note: These align with EVENT_CATEGORIES in analyticsService.js
// - funnel: Usage funnel events (session_start, code_input, generation_*, doc_copied/downloaded)
// - business: Business conversion events (login, signup, tier_*, checkout, subscription)
// - usage: Usage pattern events (doc_generation, quality_score, file_upload, error, etc.)
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'funnel', label: 'Usage Funnel' },
  { value: 'business', label: 'Business Conversion' },
  { value: 'usage', label: 'Usage Patterns' },
];

// Category display labels (for badges)
const CATEGORY_LABELS = {
  funnel: 'Usage Funnel',
  business: 'Business',
  usage: 'Usage',
};

// Category badge component
function CategoryBadge({ category }) {
  const colorClasses = {
    funnel: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    business: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    usage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[category] || colorClasses.usage}`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}

// Session/User cell component - uses min-w-0 to allow truncation based on column width
function SessionUserCell({ event }) {
  return (
    <div className="text-sm min-w-0">
      {event.userEmail ? (
        <div className="flex items-center gap-1 text-slate-900 dark:text-slate-100 min-w-0">
          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate" title={event.userEmail}>
            {event.userEmail}
          </span>
        </div>
      ) : event.userId ? (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 min-w-0" title="User ID not found in database">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">User #{event.userId} (not found)</span>
        </div>
      ) : event.sessionId ? (
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-xs min-w-0" title={event.sessionId}>
          <span className="truncate">{event.sessionId}</span>
        </div>
      ) : (
        <span className="text-slate-400">—</span>
      )}
      {event.ipAddress && (
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 min-w-0">
          <Globe className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.ipAddress}</span>
        </div>
      )}
    </div>
  );
}

export function EventsTable({ startDate, endDate, excludeInternal = false }) {
  const { getToken } = useAuth();

  // Column sizing for resizable columns
  const { columnSizing, onColumnSizingChange } = useTableColumnSizing('analytics_events');

  // Data state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filter state
  const [eventNames, setEventNames] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEventNames, setFilterEventNames] = useState([]); // Array for multi-select

  // Pagination state
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const isInitialMount = useRef(true);

  // Define table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      size: 180,
      minSize: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {formatDateTime(row.original.createdAt)}
        </div>
      ),
    },
    {
      accessorKey: 'eventName',
      header: 'Event',
      size: 180,
      minSize: 100,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
          {row.original.eventName}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      size: 100,
      minSize: 80,
      cell: ({ row }) => <CategoryBadge category={row.original.category} />,
    },
    {
      accessorKey: 'sessionUser',
      header: 'Session / User',
      size: 220,
      minSize: 150,
      cell: ({ row }) => <SessionUserCell event={row.original} />,
    },
    {
      accessorKey: 'isInternal',
      header: 'Internal',
      size: 80,
      minSize: 60,
      cell: ({ row }) => (
        row.original.isInternal ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Yes
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
  ], []);

  // Render expanded row content
  const renderExpandedRow = useCallback((row) => {
    const event = row.original;
    return (
      <div className="px-4 py-4 bg-slate-50 dark:bg-slate-900/30">
        <div className="text-sm">
          <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">Event Data:</div>
          <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs font-mono text-slate-700 dark:text-slate-300">
            {JSON.stringify(event.eventData, null, 2)}
          </pre>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Event ID:</span> {event.id}
          </div>
        </div>
      </div>
    );
  }, []);

  // Fetch event names for dropdown
  const fetchEventNames = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/analytics/event-names`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEventNames(data.eventNames || []);
        }
      }
    } catch (err) {
      console.error('Error fetching event names:', err);
    }
  }, [getToken]);

  // Fetch events data
  const fetchData = useCallback(async (page = 1, isInitialLoad = false) => {
    if (!startDate || !endDate) return;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: page.toString(),
        limit: pagination.limit.toString(),
        excludeInternal: excludeInternal.toString(),
      });

      if (filterCategory) params.append('category', filterCategory);
      if (filterEventNames.length > 0) params.append('eventNames', filterEventNames.join(','));

      const response = await fetch(`${API_URL}/api/admin/analytics/events?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
        setPagination(prev => ({
          ...prev,
          page: data.page,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getToken, startDate, endDate, excludeInternal, filterCategory, filterEventNames, pagination.limit]);

  // Handle CSV export
  const handleExport = useCallback(async () => {
    if (!startDate || !endDate) return;

    setExporting(true);
    try {
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        excludeInternal: excludeInternal.toString(),
      });

      if (filterCategory) params.append('category', filterCategory);
      if (filterEventNames.length > 0) params.append('eventNames', filterEventNames.join(','));

      const response = await fetch(`${API_URL}/api/admin/analytics/events/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to export events');
      }

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-events-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting events:', err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }, [getToken, startDate, endDate, excludeInternal, filterCategory, filterEventNames]);

  // Initial load
  useEffect(() => {
    fetchEventNames();
  }, [fetchEventNames]);

  // Fetch data on mount and when filters/dates change
  useEffect(() => {
    if (isInitialMount.current) {
      fetchData(1, true);
      isInitialMount.current = false;
    } else {
      fetchData(1, false);
    }
  }, [startDate, endDate, excludeInternal, filterCategory, filterEventNames]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterEventNames([]);
  };

  // Build event name options with "All Events" at the top
  const eventNameOptions = [
    { value: '', label: 'All Events' },
    ...eventNames.map(name => ({ value: name, label: name }))
  ];

  // Handle event name filter changes - selecting "All Events" clears other selections
  const handleEventNameFilterChange = (newValue) => {
    // If "All Events" (empty string) was just selected, clear all selections
    if (newValue.includes('') && !filterEventNames.includes('')) {
      setFilterEventNames([]);
    } else {
      // Filter out empty string if user selected a specific event
      setFilterEventNames(newValue.filter(v => v !== ''));
    }
  };

  // Header/filters section (shown for all states)
  const HeaderSection = () => (
    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Raw Events</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {loading ? 'Loading...' : `${pagination.total} events found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing && (
            <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
          )}
          <button
            onClick={handleExport}
            disabled={exporting || pagination.total === 0 || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
        </div>
        <Select
          value={filterCategory}
          onChange={setFilterCategory}
          placeholder="All Categories"
          size="small"
          options={CATEGORY_OPTIONS}
          ariaLabel="Filter by category"
        />
        <Select
          value={filterEventNames}
          onChange={handleEventNameFilterChange}
          placeholder="All Events"
          size="small"
          options={eventNameOptions}
          ariaLabel="Filter by event name"
          multiple
        />
        {(filterCategory || filterEventNames.length > 0) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );

  // Error state
  if (error && !loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <HeaderSection />
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  // Empty state with no filters
  const hasFilters = filterCategory || filterEventNames.length > 0;
  const emptyStateProps = {
    icon: Database,
    title: 'No events found',
    description: hasFilters
      ? 'No events match your filters.'
      : 'No events in this date range.',
    action: hasFilters && (
      <button
        onClick={clearFilters}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
      >
        Clear filters
      </button>
    ),
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <HeaderSection />
      <BaseTable
        data={events}
        columns={columns}
        isLoading={loading}
        isRefreshing={isRefreshing}
        emptyState={emptyStateProps}
        // Column resizing
        enableColumnResizing={true}
        columnSizing={columnSizing}
        onColumnSizingChange={onColumnSizingChange}
        // Expandable rows
        renderExpandedRow={renderExpandedRow}
        getRowCanExpand={() => true}
        // Server-side pagination
        manualPagination={true}
        pagination={pagination}
        onPageChange={handlePageChange}
        // No sorting (server provides default order)
        manualSorting={true}
        // Remove the default wrapper styling since we have our own container
        className="!rounded-none !border-0 !shadow-none"
      />
    </div>
  );
}

export default EventsTable;
