import { X, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function AppearanceModal({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor, description: 'Match system' },
  ];

  const handleThemeSelect = (value) => {
    setTheme(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4 sm:pr-6 lg:pr-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Appearance
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Close appearance settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Options */}
        <div className="p-2">
          {themeOptions.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              onClick={() => handleThemeSelect(value)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                transition-colors
                ${
                  theme === value
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                {description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {description}
                  </div>
                )}
              </div>
              {theme === value && (
                <Check className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
