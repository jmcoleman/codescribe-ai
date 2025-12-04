import { Code2, FileText } from 'lucide-react';

/**
 * MobileTabBar Component
 *
 * Tab switcher for mobile view to toggle between Code and Documentation panels.
 * Only visible on screens < 1024px (lg breakpoint).
 *
 * @param {Object} props
 * @param {'code' | 'doc'} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Handler called with new tab value
 */
export function MobileTabBar({ activeTab, onTabChange }) {
  return (
    <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex">
        <button
          type="button"
          onClick={() => onTabChange('code')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Code</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('doc')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'doc'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documentation</span>
        </button>
      </div>
    </div>
  );
}
