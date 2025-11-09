import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Priority: localStorage > system preference > default
    try {
      const stored = localStorage.getItem('codescribeai:settings:theme');
      if (stored) return stored;
    } catch (e) {
      // localStorage not available
    }

    // Check system preference
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // matchMedia not available
    }

    return 'light';
  });

  useEffect(() => {
    // Update DOM
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist
    try {
      localStorage.setItem('codescribeai:settings:theme', theme);
    } catch (e) {
      // localStorage not available or full
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!window.matchMedia) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (!mediaQuery || !mediaQuery.addEventListener) return;

      const handleChange = (e) => {
        // Only auto-switch if user hasn't manually set preference
        try {
          if (!localStorage.getItem('codescribeai:settings:theme')) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        } catch (err) {
          // localStorage not available
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // matchMedia not properly supported
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
