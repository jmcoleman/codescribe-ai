import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" aria-hidden="true" />
            Theme
          </h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Choose how CodeScribe AI looks to you. Select a theme or sync with your system.
          </p>
        </div>

        {/* Theme Options */}
        <div className="space-y-3">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`
              w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
              ${theme === 'light'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${theme === 'light' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
            `}>
              <Sun className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-slate-900 dark:text-white">Light</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Bright and clean interface</div>
            </div>
            {theme === 'light' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
            )}
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`
              w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
              ${theme === 'dark'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
            `}>
              <Moon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-slate-900 dark:text-white">Dark</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Easy on the eyes in low light</div>
            </div>
            {theme === 'dark' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
            )}
          </button>

          {/* Auto Theme */}
          <button
            type="button"
            onClick={() => setTheme('auto')}
            className={`
              w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
              ${theme === 'auto'
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${theme === 'auto' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
            `}>
              <Monitor className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-slate-900 dark:text-white">Automatic</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Matches your system preferences</div>
            </div>
            {theme === 'auto' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
