import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

/**
 * Shared Pagination Component
 *
 * Renders prev/next navigation and numbered page buttons with ellipsis for gaps.
 * Used by BaseTable (admin tables) and GitHubLoadModal (repo list).
 *
 * @param {object} props
 * @param {number} props.currentPage   - 1-based current page number
 * @param {number} props.totalPages    - Total number of pages
 * @param {function} props.onPageChange - Callback receiving the new page number
 * @param {number} [props.totalItems]  - If provided, shows "Showing X to Y of Z"
 * @param {number} [props.limit]       - Items per page (required when totalItems is set)
 */
export function Pagination({ currentPage, totalPages, onPageChange, totalItems, limit }) {
  // Always show pagination footer when totalItems is provided (even for single page)
  // Hide when no totalItems and only 1 page
  if (totalPages <= 1 && totalItems == null) return null;

  // Build visible page numbers: first, last, current, and ±1 adjacent
  const getVisiblePages = () => {
    const pages = new Set();
    pages.add(1);
    pages.add(totalPages);
    pages.add(currentPage);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);
    return [...pages].sort((a, b) => a - b);
  };

  const visiblePages = getVisiblePages();
  const showNavigation = totalPages > 1;

  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
      {totalItems != null && limit != null ? (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems}
        </div>
      ) : (
        <div />
      )}

      {showNavigation && (
        <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((page, idx) => (
            <React.Fragment key={page}>
              {idx > 0 && page > visiblePages[idx - 1] + 1 && (
                <span className="px-1 text-slate-400 text-sm">...</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-purple-600 dark:bg-purple-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
      )}
    </div>
  );
}

export default Pagination;
