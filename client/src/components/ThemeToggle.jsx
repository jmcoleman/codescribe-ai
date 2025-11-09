import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg
        bg-slate-100 dark:bg-slate-800
        text-slate-700 dark:text-slate-300
        hover:bg-slate-200 dark:hover:bg-slate-700
        border border-slate-200 dark:border-slate-700
        transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-purple-600
        dark:focus-visible:ring-purple-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-white
        dark:focus-visible:ring-offset-slate-950
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Sun icon (shows in dark mode) */}
      <Sun
        className={`
          w-5 h-5 text-amber-400
          transition-all duration-300 ease-in-out
          ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          absolute inset-0 m-auto
        `}
        aria-hidden="true"
      />

      {/* Moon icon (shows in light mode) */}
      <Moon
        className={`
          w-5 h-5
          transition-all duration-300 ease-in-out
          ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}
