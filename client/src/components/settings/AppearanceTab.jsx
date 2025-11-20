import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';

const THEME_OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and clean interface',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes in low light',
    icon: Moon,
  },
  {
    value: 'auto',
    label: 'Automatic',
    description: 'Matches your system preferences',
    icon: Monitor,
  },
];

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5" aria-hidden="true" />
          Theme
        </h2>

        <div className="space-y-2.5">
          {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => {
            const isSelected = theme === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                `}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-slate-900 dark:text-white">{label}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{description}</div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
