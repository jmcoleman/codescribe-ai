import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Columns3, Check } from 'lucide-react';

/**
 * Column Visibility Dropdown
 *
 * Allows users to show/hide columns in a table.
 * Uses Headless UI Popover for accessible dropdown behavior.
 *
 * @param {Object} props
 * @param {Object} props.table - TanStack Table instance
 * @param {string[]} props.excludeColumns - Column IDs to exclude from the list (e.g., 'actions')
 * @param {Object} props.columnLabels - Optional mapping of column IDs to display labels
 */
export function ColumnVisibilityDropdown({
  table,
  excludeColumns = ['actions'],
  columnLabels = {}
}) {
  const allColumns = table.getAllColumns().filter(
    column => column.getCanHide() && !excludeColumns.includes(column.id)
  );

  // Get default label from column header or use columnLabels override
  const getColumnLabel = (column) => {
    if (columnLabels[column.id]) {
      return columnLabels[column.id];
    }
    // Try to get from column definition header
    const header = column.columnDef.header;
    if (typeof header === 'string') {
      return header;
    }
    // Fallback to formatted column ID
    return column.id
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const visibleCount = allColumns.filter(col => col.getIsVisible()).length;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`
              inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
              ${open
                ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }
            `}
            aria-label="Toggle column visibility"
          >
            <Columns3 className="w-4 h-4" aria-hidden="true" />
            <span>Columns</span>
            <span className="text-slate-500 dark:text-slate-400">
              ({visibleCount}/{allColumns.length})
            </span>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-56 origin-top-right">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Toggle Columns
                  </p>
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {allColumns.map(column => (
                    <label
                      key={column.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="sr-only peer"
                          aria-label={`Show ${getColumnLabel(column)} column`}
                        />
                        <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 peer-checked:bg-slate-800 dark:peer-checked:bg-slate-200 peer-checked:border-slate-800 dark:peer-checked:border-slate-200 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-500 peer-focus-visible:ring-offset-2 transition-colors">
                          {column.getIsVisible() && (
                            <Check className="w-3 h-3 text-white dark:text-slate-800 absolute top-0.5 left-0.5" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {getColumnLabel(column)}
                      </span>
                    </label>
                  ))}
                </div>
                {allColumns.length > 3 && (
                  <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <button
                      onClick={() => allColumns.forEach(col => col.toggleVisibility(true))}
                      className="flex-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      Show All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      onClick={() => allColumns.forEach(col => col.toggleVisibility(false))}
                      className="flex-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      Hide All
                    </button>
                  </div>
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

export default ColumnVisibilityDropdown;
