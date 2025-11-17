import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../constants/storage';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setThemeInternal] = useState(() => {
    // Priority: localStorage > default to 'auto'
    // User account preference will override this after auth loads
    const stored = getStorageItem(STORAGE_KEYS.THEME_PREFERENCE);
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored;
    }

    // Default to 'auto' (system preference)
    return 'auto';
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

  // Load theme from user account on login
  useEffect(() => {
    if (user && user.theme_preference && ['light', 'dark', 'auto'].includes(user.theme_preference)) {
      console.log('[ThemeContext] Loading theme from user account:', user.theme_preference);
      setThemeInternal(user.theme_preference);
    } else if (user) {
      console.log('[ThemeContext] User logged in but no theme_preference found in user object:', user);
    }
  }, [user]);

  // Wrapper for setTheme that saves to backend if user is logged in
  const setTheme = async (newTheme) => {
    console.log('[ThemeContext] setTheme called with:', newTheme);
    setThemeInternal(newTheme);

    // Save to localStorage (for non-authenticated users and as backup)
    const saved = setStorageItem(STORAGE_KEYS.THEME_PREFERENCE, newTheme);
    if (saved) {
      console.log('[ThemeContext] Saved to localStorage:', newTheme);
    } else {
      console.error('[ThemeContext] Failed to save to localStorage');
    }

    // Save to backend if user is authenticated
    if (user && user.id) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

        console.log('[ThemeContext] Saving to backend for user:', user.id);
        const response = await fetch(`${API_URL}/api/auth/preferences`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            theme_preference: newTheme
          })
        });

        const data = await response.json();
        console.log('[ThemeContext] Backend response:', data);
      } catch (error) {
        console.error('[ThemeContext] Failed to save theme preference to backend:', error);
        // Don't throw - the local change still works
      }
    } else {
      console.log('[ThemeContext] Not saving to backend - user not authenticated');
    }
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
        console.log('[ThemeContext] Resolving auto mode:', { matches, resolvedTheme });
      } catch (e) {
        console.error('[ThemeContext] Error checking system preference:', e);
        resolvedTheme = 'light';
      }
    }

    console.log('[ThemeContext] Applying theme to DOM:', { theme, resolvedTheme });

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
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light'; // auto -> light
    });
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
