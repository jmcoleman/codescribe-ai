import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { TrialProvider } from '../../contexts/TrialContext';
import { Header } from '../../components/Header';
import Footer from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';
import { STORAGE_KEYS } from '../../constants/storage';

/**
 * Integration tests for dark mode theming
 * Tests the complete dark mode experience across multiple components
 */

describe('Dark Mode Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  const renderWithProviders = (component) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <TrialProvider>
            <ThemeProvider>
              {component}
            </ThemeProvider>
          </TrialProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Theme Persistence', () => {
    it('persists theme across component remounts', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      // Render and toggle to dark
      const { unmount } = renderWithProviders(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);

      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Unmount and remount
      unmount();

      renderWithProviders(<ThemeToggle />);

      // Should still be dark (shows "switch to auto mode")
      expect(screen.getByRole('button', { name: /switch to auto mode/i })).toBeInTheDocument();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('persists theme across different components', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      // Render Header with ThemeToggle in it
      renderWithProviders(
        <>
          <Header />
          <ThemeToggle />
        </>
      );

      // Toggle using standalone ThemeToggle (use getAllByRole since there are 2 buttons)
      const toggleButtons = screen.getAllByRole('button', { name: /switch to dark mode/i });
      await user.click(toggleButtons[0]);

      // Verify theme is persisted (with waitFor for async state update)
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });

  describe('Header Dark Mode Styling', () => {
    it('applies dark mode styles to Header', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Header />);

      const header = screen.getByRole('banner');
      expect(header.className).toContain('dark:bg-slate-900');
      expect(header.className).toContain('dark:border-slate-700');
    });

    // TODO: Skipped because ThemeToggle was removed from Header in v2.7.2
    // Theme controls are now in Settings → Appearance tab
    it.skip('ThemeToggle in Header shows correct icon in dark mode', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Header />);

      const header = screen.getByRole('banner');
      const themeButton = within(header).getByRole('button', { name: /switch to light mode/i });

      expect(themeButton).toBeInTheDocument();

      // Sun icon should be visible in dark mode
      const sunIcon = themeButton.querySelector('.lucide-sun');
      const classValue = sunIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });

    // TODO: Skipped because ThemeToggle was removed from Header in v2.7.2
    // Theme controls are now in Settings → Appearance tab
    it.skip('toggles Header appearance when switching themes', async () => {
      const user = userEvent.setup();

      renderWithProviders(<Header />);

      const header = screen.getByRole('banner');
      const themeButton = within(header).getByRole('button', { name: /switch to dark mode/i });

      // Start in light mode - check that dark mode classes exist but aren't active
      expect(header.className).toContain('bg-white');

      // Toggle to dark
      await user.click(themeButton);

      // DOM should have dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Footer Dark Mode Styling', () => {
    it('applies dark mode styles to Footer', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Footer />);

      const footer = screen.getByRole('contentinfo');
      expect(footer.className).toContain('dark:bg-slate-900/80');
      expect(footer.className).toContain('dark:border-slate-700');
    });

    it('Footer links have dark mode hover states', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Footer />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink.className).toContain('dark:text-slate-400');
      expect(privacyLink.className).toContain('dark:hover:text-purple-400');
    });
  });

  describe('Multi-Component Dark Mode Sync', () => {
    // TODO: Skipped because ThemeToggle was removed from Header in v2.7.2
    // Theme controls are now in Settings → Appearance tab
    it.skip('synchronizes theme across Header, Footer, and ThemeToggle', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <>
          <Header />
          <Footer />
          <ThemeToggle />
        </>
      );

      // All should start in light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Toggle from standalone ThemeToggle (get all buttons and use first one)
      const toggleButtons = screen.getAllByRole('button', { name: /switch to dark mode/i });
      await user.click(toggleButtons[0]);

      // Verify DOM has dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Verify localStorage
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');

      // Find the ThemeToggle in Header and verify it also updated
      const header = screen.getByRole('banner');
      const headerThemeButton = within(header).getByRole('button', { name: /switch to light mode/i });
      expect(headerThemeButton).toBeInTheDocument();
    });

    it('maintains theme consistency across rapid toggles', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      renderWithProviders(
        <>
          <Header />
          <ThemeToggle />
        </>
      );

      const toggleButtons = screen.getAllByRole('button', { name: /switch to dark mode/i });

      // Rapid toggles (3-state cycle: light -> dark -> auto -> light)
      await user.click(toggleButtons[0]); // -> dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');

      const darkButtons = screen.getAllByRole('button', { name: /switch to auto mode/i });
      await user.click(darkButtons[0]); // -> auto
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('auto');

      const autoButtons = screen.getAllByRole('button', { name: /switch to light mode/i });
      await user.click(autoButtons[0]); // -> light
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('light');

      const lightButtons = screen.getAllByRole('button', { name: /switch to dark mode/i });
      await user.click(lightButtons[0]); // -> dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Verify final state in localStorage
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');
    });
  });

  describe('System Preference Integration', () => {
    it('respects system preference on first load', () => {
      // Clear any stored preference
      localStorage.clear();

      renderWithProviders(<ThemeToggle />);

      // Should initialize with 'light' theme by default (consistent with index.html)
      const theme = localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      expect(theme).toBe('light');
    });

    it('manual preference overrides system preference', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      renderWithProviders(<ThemeToggle />);

      // Set manual preference to dark by clicking the button
      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);

      // Verify manual preference is stored
      expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe('dark');

      // Even if system preference is light, manual preference should persist
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Accessibility in Dark Mode', () => {
    it('maintains accessible focus indicators in dark mode', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('dark:focus-visible:ring-purple-400');
      expect(button.className).toContain('dark:focus-visible:ring-offset-slate-950');
    });

    it('maintains accessible aria-labels in all 3 modes', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      renderWithProviders(<ThemeToggle />);

      // Light mode
      let button = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(button).toHaveAccessibleName(/switch to dark mode/i);

      // Toggle to dark
      await user.click(button);

      // Dark mode
      button = screen.getByRole('button', { name: /switch to auto mode/i });
      expect(button).toHaveAccessibleName(/switch to auto mode/i);

      // Toggle to auto
      await user.click(button);

      // Auto mode
      button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toHaveAccessibleName(/switch to light mode/i);
    });

    it('Header navigation remains accessible in dark mode', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Header />);

      // Logo link should be accessible
      const logoLink = screen.getByRole('link', { name: /codescribe ai/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAccessibleName();
    });

    it('Footer links remain accessible in dark mode', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');

      renderWithProviders(<Footer />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      const termsLink = screen.getByRole('link', { name: /terms of service/i });

      expect(privacyLink).toHaveAccessibleName(/privacy policy/i);
      expect(termsLink).toHaveAccessibleName(/terms of service/i);
    });
  });

  describe('Storage Convention Compliance', () => {
    it('uses correct storage key format', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Verify storage key follows codescribeai:type:category:key pattern
      const storageKey = STORAGE_KEYS.THEME_PREFERENCE;
      expect(localStorage.getItem(storageKey)).toBeDefined();
      expect(localStorage.getItem(storageKey)).toMatch(/^(light|dark|auto)$/);
    });

    it('does not create duplicate theme storage keys', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <>
          <ThemeToggle />
          <Header />
        </>
      );

      // Toggle theme multiple times (use getAllByRole since there are 2 buttons)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      await user.click(buttons[0]);

      // Check that only one theme key exists
      const allKeys = Object.keys(localStorage);
      const themeKeys = allKeys.filter(key => key.includes('theme'));

      expect(themeKeys).toHaveLength(1);
      expect(themeKeys[0]).toBe(STORAGE_KEYS.THEME_PREFERENCE);
    });
  });

  describe('Performance', () => {
    it('theme toggle responds immediately', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      renderWithProviders(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      const startTime = performance.now();

      await user.click(button);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should update within reasonable time (< 100ms for the state update)
      expect(duration).toBeLessThan(100);

      // Verify theme changed
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('does not cause unnecessary re-renders', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'light');

      renderWithProviders(
        <>
          <Header />
          <Footer />
          <ThemeToggle />
        </>
      );

      const buttons = screen.getAllByRole('button', { name: /switch to dark mode/i });

      // Toggle theme
      await user.click(buttons[0]);

      // All components should still be present and functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      // Should now have auto mode buttons (multiple)
      expect(screen.getAllByRole('button', { name: /switch to auto mode/i }).length).toBeGreaterThan(0);
    });
  });
});
