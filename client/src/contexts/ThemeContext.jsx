import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority: localStorage > default to 'auto'
    try {
      const stored = localStorage.getItem('codescribeai:settings:theme');
      if (stored && ['light', 'dark', 'auto'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      // localStorage not available
    }

    // Default to 'auto' (system preference)
    return 'auto';
  });

  // Get the effective theme (resolves 'auto' to 'light' or 'dark')
  const getEffectiveTheme = () => {
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
  };

  useEffect(() => {
    // Update DOM based on effective theme
    const root = document.documentElement;
    const effectiveTheme = getEffectiveTheme();

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist user's choice (including 'auto')
    try {
      localStorage.setItem('codescribeai:settings:theme', theme);
    } catch (e) {
      // localStorage not available or full
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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light'; // auto -> light
    });
  };

  const effectiveTheme = getEffectiveTheme();

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
