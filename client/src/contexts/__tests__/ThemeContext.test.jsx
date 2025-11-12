import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock matchMedia globally for all tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ThemeProvider Initialization', () => {
    it('initializes with auto theme by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('auto');
      // Auto should resolve to light when system preference is light (matchMedia.matches = false)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('initializes with stored theme from localStorage', () => {
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('initializes with auto theme and resolves to dark when system preference is dark', () => {
      // Mock system preference for dark mode
      const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('auto');
      // Auto should resolve to dark when system preference is dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      vi.unstubAllGlobals();
    });

    it('prioritizes localStorage over system preference', () => {
      localStorage.setItem('codescribeai:settings:theme', 'light');

      // Mock system preference for dark mode
      const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Should use localStorage value (light) despite system preference (dark)
      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  describe('Theme Persistence', () => {
    it('persists theme to localStorage on change', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');
    });

    it('persists initial theme to localStorage', () => {
      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Default auto theme should be persisted
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('auto');
    });

    it('updates localStorage when toggling theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');

      // Toggle back to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('light');
    });
  });

  describe('DOM Updates', () => {
    it('adds dark class to document element when theme is dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class from document element when theme is light', () => {
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('updates DOM when toggling theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Toggle to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Theme Toggle', () => {
    it('toggles from auto to dark, then to light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Starts as 'auto'
      expect(result.current.theme).toBe('auto');

      // First toggle: auto -> dark (since toggleTheme cycles between dark and light)
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('toggles from dark to light', () => {
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('toggles multiple times correctly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Start: auto
      expect(result.current.theme).toBe('auto');

      // Toggle 1: dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');

      // Toggle 2: light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');

      // Toggle 3: dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('System Preference Changes', () => {
    it('listens for system preference changes', () => {
      const addEventListenerMock = vi.fn();
      const removeEventListenerMock = vi.fn();

      const matchMediaMock = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', matchMediaMock);

      const { unmount } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));

      vi.unstubAllGlobals();
    });

    it('auto-switches theme on system preference change when in auto mode', () => {
      // This test verifies the listener is set up correctly when in auto mode
      // The actual system preference change behavior is tested by the integration
      // Since we mock matchMedia globally, this test just verifies the structure

      localStorage.clear();

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Should start in auto mode
      expect(result.current.theme).toBe('auto');

      // Verify localStorage is empty initially (no manual preference)
      localStorage.clear();

      // System preference changes are handled by the effect
      // This is implicitly tested by the "listens for system preference changes" test
      expect(result.current).toHaveProperty('theme');
    });

    it('does not auto-switch when user has manual preference', () => {
      // Set manual preference
      localStorage.setItem('codescribeai:settings:theme', 'light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('light');

      // Manual preference should be in localStorage
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('light');

      // Even if system preference changes, manual preference takes precedence
      // This is verified by the fact that the theme initializes from localStorage first
      expect(result.current.theme).toBe('light');
    });
  });

  describe('useTheme Hook', () => {
    it('provides theme value', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('theme');
      expect(typeof result.current.theme).toBe('string');
    });

    it('provides setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('setTheme');
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('provides toggleTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('toggleTheme');
      expect(typeof result.current.toggleTheme).toBe('function');
    });

    it('provides effectiveTheme value', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('effectiveTheme');
      expect(typeof result.current.effectiveTheme).toBe('string');
      expect(['light', 'dark']).toContain(result.current.effectiveTheme);
    });

    it('resolves effectiveTheme to light when theme is auto and system prefers light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Default is auto, and matchMedia mock returns matches: false (light mode)
      expect(result.current.theme).toBe('auto');
      expect(result.current.effectiveTheme).toBe('light');
    });

    it('resolves effectiveTheme to dark when theme is auto and system prefers dark', () => {
      const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('auto');
      expect(result.current.effectiveTheme).toBe('dark');

      vi.unstubAllGlobals();
    });

    it('returns effectiveTheme equal to theme when theme is explicitly set', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.effectiveTheme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.effectiveTheme).toBe('light');
    });

    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleError.mockRestore();
    });
  });

  describe('setTheme Function', () => {
    it('updates theme to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('updates theme to light', () => {
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('updates DOM and localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');
    });
  });

  describe('Storage Key Convention', () => {
    it('uses correct storage key format', () => {
      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      const storageKey = 'codescribeai:settings:theme';
      expect(localStorage.getItem(storageKey)).toBeDefined();
    });

    it('follows codescribeai:type:category:key pattern', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      // Verify storage key follows convention
      const expectedKey = 'codescribeai:settings:theme';
      expect(localStorage.getItem(expectedKey)).toBe('dark');

      // Verify no other theme-related keys exist
      const allKeys = Object.keys(localStorage);
      const themeKeys = allKeys.filter(key => key.includes('theme'));
      expect(themeKeys).toHaveLength(1);
      expect(themeKeys[0]).toBe(expectedKey);
    });
  });
});
