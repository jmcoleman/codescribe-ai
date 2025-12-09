/**
 * BaseTable Component
 *
 * Reusable table component built on TanStack Table with CSS Grid layout.
 * Provides consistent styling, sorting, pagination, filtering, and row expansion.
 *
 * Features:
 * - Server-side or client-side sorting
 * - Server-side or client-side pagination
 * - Expandable rows with smooth animations (250ms enter, 200ms exit)
 * - Loading and empty states
 * - Refresh indicator
 * - Consistent dark/light mode styling
 * - ARIA roles for accessibility
 *
 * @example
 * const columns = [
 *   { accessorKey: 'email', header: 'Email', enableSorting: true },
 *   { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
 * ];
 *
 * <BaseTable
 *   data={users}
 *   columns={columns}
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 *   pagination={pagination}
 *   onPageChange={handlePageChange}
 *   isLoading={loading}
 *   isRefreshing={refreshing}
 *   emptyState={{ icon: Users, title: 'No users', description: 'No users found.' }}
 * />
 */

import React, { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

/**
 * Sortable Header Component
 */
function SortableHeader({ column, children }) {
  const isSorted = column.getIsSorted();
  const canSort = column.getCanSort();

  if (!canSort) {
    return <span>{children}</span>;
  }

  return (
    <button
      onClick={column.getToggleSortingHandler()}
      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 select-none"
    >
      {children}
      {isSorted === 'asc' ? (
        <ArrowUp className="w-3 h-3" />
      ) : isSorted === 'desc' ? (
        <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}

/**
 * Pagination Component
 */
function Pagination({ pagination, onPageChange, totalItems }) {
  const { page, limit, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {startItem} to {endItem} of {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === pageNum
                  ? 'bg-purple-600 dark:bg-purple-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="p-8 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
    </div>
  );
}

/**
 * BaseTable Component - CSS Grid Layout with smooth expand/collapse animations
 */
export function BaseTable({
  // Data
  data = [],
  columns = [],

  // Sorting (server-side)
  sorting = [],
  onSortingChange,
  manualSorting = true,

  // Pagination (server-side)
  pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
  onPageChange,
  manualPagination = true,

  // Expansion
  renderExpandedRow,
  getRowCanExpand,
  onRowExpandToggle, // Callback when row expansion is toggled: (row, isExpanding) => void

  // Column resizing
  enableColumnResizing = false,
  columnSizing: externalColumnSizing,
  onColumnSizingChange: externalOnColumnSizingChange,

  // Column visibility
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,

  // Table instance callback (for external access to table instance)
  onTableReady,

  // States
  isLoading = false,
  isRefreshing = false,
  emptyState = { title: 'No data', description: 'No items to display.' },

  // Styling
  className = '',
}) {
  // Internal expansion state
  const [expanded, setExpanded] = useState({});

  // Column sizing state for resizing - use external state if provided, otherwise internal
  const [internalColumnSizing, setInternalColumnSizing] = useState({});
  const columnSizing = externalColumnSizing ?? internalColumnSizing;
  const setColumnSizing = externalOnColumnSizingChange ?? setInternalColumnSizing;

  // Column visibility state - use external state if provided, otherwise internal
  const [internalColumnVisibility, setInternalColumnVisibility] = useState({});
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = externalOnColumnVisibilityChange ?? setInternalColumnVisibility;

  // Build grid template columns dynamically based on column sizes
  const buildGridTemplateColumns = useCallback((table) => {
    const cols = table.getAllColumns().filter(col => col.getIsVisible());
    const expandPrefix = renderExpandedRow ? '40px ' : '';

    const colSizes = cols.map(col => {
      const size = col.getSize();
      // Use the actual size from TanStack (which includes resizing)
      return `${size}px`;
    }).join(' ');

    return expandPrefix + colSizes;
  }, [renderExpandedRow]);

  // Configure table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      expanded,
      columnSizing,
      columnVisibility,
    },
    onSortingChange,
    onExpandedChange: setExpanded,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getExpandedRowModel: renderExpandedRow ? getExpandedRowModel() : undefined,
    getRowCanExpand: getRowCanExpand || (() => !!renderExpandedRow),
    manualSorting,
    manualPagination,
    enableColumnResizing,
    columnResizeMode: 'onChange',
  });

  // Call onTableReady callback if provided (for external access to table instance)
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // Get current grid template columns
  const gridTemplateColumns = buildGridTemplateColumns(table);

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
        <LoadingState />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
        <EmptyState {...emptyState} />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <div className={`overflow-x-auto transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : ''}`}>
        {/* Grid-based table */}
        <div role="table" aria-label="Data table" className="w-full min-w-full">
          {/* Header */}
          <div
            role="rowgroup"
            className="bg-slate-50 dark:bg-slate-700/50"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                key={headerGroup.id}
                role="row"
                className="grid items-center"
                style={{ gridTemplateColumns }}
              >
                {/* Expand column header */}
                {renderExpandedRow && (
                  <div role="columnheader" className="px-2 py-3"></div>
                )}
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    role="columnheader"
                    className={`group relative px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400 ${
                      header.column.getCanSort() ? 'cursor-pointer' : ''
                    }`}
                  >
                    {header.isPlaceholder ? null : (
                      <SortableHeader column={header.column}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </SortableHeader>
                    )}
                    {/* Column resize handle */}
                    {enableColumnResizing && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-[3px] cursor-col-resize select-none touch-none rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50"
                        style={{ userSelect: 'none' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Body */}
          <div role="rowgroup" className="divide-y divide-slate-200 dark:divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <div key={row.id}>
                {/* Main row */}
                <div
                  role="row"
                  className="grid items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  style={{ gridTemplateColumns }}
                >
                  {/* Expand button */}
                  {renderExpandedRow && (
                    <div role="cell" className="px-2 py-3">
                      {row.getCanExpand() && (
                        <button
                          onClick={() => {
                            const isExpanding = !row.getIsExpanded();
                            row.getToggleExpandedHandler()();
                            // Call external callback if provided
                            if (onRowExpandToggle) {
                              onRowExpandToggle(row, isExpanding);
                            }
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                          aria-expanded={row.getIsExpanded()}
                        >
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                              row.getIsExpanded() ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} role="cell" className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>

                {/* Expanded row content with smooth animation */}
                {renderExpandedRow && (
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      row.getIsExpanded()
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                    aria-hidden={!row.getIsExpanded()}
                  >
                    <div className="overflow-hidden">
                      {renderExpandedRow(row, gridTemplateColumns)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {manualPagination && onPageChange && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          totalItems={pagination.total}
        />
      )}
    </div>
  );
}

// Backward compatibility alias
export const AdminTable = BaseTable;

export default BaseTable;
