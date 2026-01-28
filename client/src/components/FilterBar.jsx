/**
 * FilterBarContent Component
 *
 * Inner content of filter bar (without container styling).
 * Use this when embedding filters in an existing container.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Filter components (Select, input, etc.)
 * @param {boolean} props.hasActiveFilters - Whether any filters are currently active
 * @param {Function} props.onClearFilters - Callback when "Clear filters" is clicked
 */
export function FilterBarContent({ children, hasActiveFilters, onClearFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filters:</span>

      {children}

      {/* Clear filters button */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/**
 * FilterBar Component
 *
 * Provides consistent filter UI across admin tables with container styling.
 * Use this for standalone filter sections above tables.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Filter components (Select, input, etc.)
 * @param {boolean} props.hasActiveFilters - Whether any filters are currently active
 * @param {Function} props.onClearFilters - Callback when "Clear filters" is clicked
 */
export function FilterBar({ children, hasActiveFilters, onClearFilters }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
      <FilterBarContent hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters}>
        {children}
      </FilterBarContent>
    </div>
  );
}
