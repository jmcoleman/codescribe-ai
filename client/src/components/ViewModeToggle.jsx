import { Eye, Code } from 'lucide-react';
import { Tooltip } from './Tooltip';

/**
 * View Mode Toggle Component
 * Switches between rendered and raw markdown views
 *
 * @param {Object} props
 * @param {string} props.viewMode - Current view mode ('rendered' or 'raw')
 * @param {Function} props.onViewModeChange - Callback when view mode changes
 */
export function ViewModeToggle({ viewMode, onViewModeChange }) {
  return (
    <div className="flex items-center justify-end px-4 pt-2 pb-2 bg-white dark:bg-slate-900 transition-colors">
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-w-fit">
        <Tooltip content="View rendered markdown">
          <button
            type="button"
            onClick={() => onViewModeChange('rendered')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-l-lg transition-colors ${
              viewMode === 'rendered'
                ? 'text-slate-900 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-label="View rendered markdown"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </Tooltip>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600" aria-hidden="true" />
        <Tooltip content="View raw markdown">
          <button
            type="button"
            onClick={() => onViewModeChange('raw')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-r-lg transition-colors ${
              viewMode === 'raw'
                ? 'text-slate-900 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-label="View raw markdown"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
