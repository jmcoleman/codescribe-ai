import { memo } from 'react';
import { Columns2, Code2, FileText } from 'lucide-react';
import { Tooltip } from './Tooltip';

/**
 * LayoutToggle Component
 *
 * VS Code-style layout toggle for switching between:
 * - split: Side-by-side code and doc panels
 * - code: Full-width code panel only
 * - doc: Full-width doc panel only
 *
 * Premium feature: Pro+ tier only
 */
export const LayoutToggle = memo(function LayoutToggle({ layout, onLayoutChange }) {
  const layouts = [
    {
      id: 'split',
      label: 'Side by Side',
      icon: (isActive) => (
        <Columns2
          className={`w-4 h-4 ${isActive
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-hidden="true"
        />
      )
    },
    {
      id: 'code',
      label: 'Code Only',
      icon: (isActive) => (
        <Code2
          className={`w-4 h-4 ${isActive
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-hidden="true"
        />
      )
    },
    {
      id: 'doc',
      label: 'Docs Only',
      icon: (isActive) => (
        <FileText
          className={`w-4 h-4 ${isActive
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-hidden="true"
        />
      )
    }
  ];

  return (
    <div
      role="group"
      aria-label="Layout options"
      className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 transition-colors"
    >
      {layouts.map((layoutOption) => {
        const isActive = layout === layoutOption.id;

        return (
          <Tooltip key={layoutOption.id} content={layoutOption.label}>
            <button
              type="button"
              onClick={() => onLayoutChange(layoutOption.id)}
              className={`
                p-1.5 rounded transition-all duration-200
                ${isActive
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'
                }
                focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-1
              `}
              aria-label={`Switch to ${layoutOption.label} layout`}
              aria-pressed={isActive}
            >
              {layoutOption.icon(isActive)}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
});
