import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PreferencesContext from './PreferencesContext';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

const ThemeContext = createContext();

/**
 * Safe hook to get preferences - returns null values if PreferencesContext is not available.
 * This allows ThemeProvider to work in tests without PreferencesProvider.
 */
function useSafePreferences() {
  const context = useContext(PreferencesContext);
  // Return null values if context is not available (for tests/backwards compatibility)
  if (!context) {
    return { theme: null, setTheme: () => {} };
  }
  return { theme: context.theme, setTheme: context.setTheme };
}

export function ThemeProvider({ children }) {
  // Get theme from PreferencesContext (which handles DB sync)
  // Falls back gracefully if PreferencesContext is not available (e.g., in tests)
  const { theme: prefsTheme, setTheme: setPrefsTheme } = useSafePreferences();

  // Use preferences theme, or fall back to localStorage for initial render
  const [theme, setThemeInternal] = useState(() => {
    // Priority: localStorage > default to 'light'
    // PreferencesContext will update this after loading
    const stored = getStorageItem(STORAGE_KEYS.THEME_PREFERENCE);

    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored;
    }

    // Default to 'light' (consistent with index.html)
    return 'light';
  });

  // Track the effective theme (resolved from 'auto' to 'light' or 'dark')
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (theme === 'auto') {
      try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      } catch (e) {
        // matchMedia not available
      }
      return 'light';
    }
    return theme;
  });

  // Ensure theme is persisted to localStorage on mount
  useEffect(() => {
    // Only save if not already in localStorage
    const existing = getStorageItem(STORAGE_KEYS.THEME_PREFERENCE);
    if (!existing && theme) {
      setStorageItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
    }
  }, []); // Run once on mount

  // Sync theme from PreferencesContext when it loads from API
  useEffect(() => {
    if (prefsTheme && ['light', 'dark', 'auto'].includes(prefsTheme)) {
      setThemeInternal(prefsTheme);
      // CRITICAL: Sync to localStorage to prevent flash on next reload
      setStorageItem(STORAGE_KEYS.THEME_PREFERENCE, prefsTheme);
    }
  }, [prefsTheme]);

  // Wrapper for setTheme that saves to PreferencesContext (which handles DB sync)
  const setTheme = (newTheme) => {
    setThemeInternal(newTheme);

    // Save to localStorage (for non-authenticated users and as backup)
    setStorageItem(STORAGE_KEYS.THEME_PREFERENCE, newTheme);

    // Save to PreferencesContext (which handles debounced API sync)
    setPrefsTheme(newTheme);
  };

  useEffect(() => {
    // Update DOM and effective theme state based on current theme
    const root = document.documentElement;
    let resolvedTheme = theme;

    // Resolve 'auto' to actual system preference
    if (theme === 'auto') {
      try {
        const matches = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = matches ? 'dark' : 'light';
      } catch (e) {
        resolvedTheme = 'light';
      }
    }

    // Update effective theme state
    setEffectiveTheme(resolvedTheme);

    // Update DOM
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system preference changes (only when in 'auto' mode)
  useEffect(() => {
    if (theme !== 'auto') return;
    if (!window.matchMedia) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (!mediaQuery || !mediaQuery.addEventListener) return;

      const handleChange = () => {
        // Force re-render to update effective theme
        setTheme('auto');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // matchMedia not properly supported
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const cycleTheme = () => {
    let newTheme;
    if (theme === 'light') newTheme = 'dark';
    else if (theme === 'dark') newTheme = 'auto';
    else newTheme = 'light'; // auto -> light
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, cycleTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
