import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset DOM class
    document.documentElement.classList.remove('dark');
  });

  describe('Rendering', () => {
    it('renders theme toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
      expect(button).toBeInTheDocument();
    });

    it('shows moon icon in light mode', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Moon icon should be visible (opacity-100, scale-100)
      const button = screen.getByRole('button');
      const moonIcon = button.querySelector('.lucide-moon');
      expect(moonIcon).toBeInTheDocument();

      const classValue = moonIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });

    it('shows sun icon in dark mode', () => {
      // Set dark mode in localStorage
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Sun icon should be visible
      const button = screen.getByRole('button');
      const sunIcon = button.querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();

      const classValue = sunIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label in light mode', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });

    it('has correct aria-label in dark mode', () => {
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
    });

    it('has type="button" to prevent form submission', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('icons have aria-hidden="true"', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const icons = button.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('has focus-visible styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:ring-2');
      expect(button.className).toContain('focus-visible:ring-purple-600');
    });
  });

  describe('Theme Toggle Interaction', () => {
    it('toggles from light to dark on click', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);

      // Should now show "switch to light mode"
      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();

      // DOM should have dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // localStorage should be updated
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');
    });

    it('toggles from dark to light on click', async () => {
      const user = userEvent.setup();
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      await user.click(button);

      // Should now show "switch to dark mode"
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();

      // DOM should not have dark class
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // localStorage should be updated
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('light');
    });

    it('toggles multiple times correctly', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      let button = screen.getByRole('button', { name: /switch to dark mode/i });

      // Click 1: light -> dark
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Click 2: dark -> light
      button = screen.getByRole('button', { name: /switch to light mode/i });
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Click 3: light -> dark
      button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Icon Animation', () => {
    it('moon icon has rotation and scale transitions', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const moonIcon = button.querySelector('.lucide-moon');

      // Check className property or class attribute
      const classValue = moonIcon.getAttribute('class');
      expect(classValue).toContain('transition-all');
      expect(classValue).toContain('duration-300');
      expect(classValue).toContain('ease-in-out');
    });

    it('sun icon has rotation and scale transitions', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const sunIcon = button.querySelector('.lucide-sun');

      const classValue = sunIcon.getAttribute('class');
      expect(classValue).toContain('transition-all');
      expect(classValue).toContain('duration-300');
      expect(classValue).toContain('ease-in-out');
    });

    it('animates icon change on toggle', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const moonIcon = button.querySelector('.lucide-moon');
      const sunIcon = button.querySelector('.lucide-sun');

      // Light mode: moon visible, sun hidden
      let moonClass = moonIcon.getAttribute('class');
      let sunClass = sunIcon.getAttribute('class');

      expect(moonClass).toContain('rotate-0');
      expect(moonClass).toContain('scale-100');
      expect(sunClass).toContain('rotate-90');
      expect(sunClass).toContain('scale-0');

      // Toggle to dark
      await user.click(button);

      // Re-query icons after state change
      const moonIconAfter = button.querySelector('.lucide-moon');
      const sunIconAfter = button.querySelector('.lucide-sun');

      // Dark mode: sun visible, moon hidden
      moonClass = moonIconAfter.getAttribute('class');
      sunClass = sunIconAfter.getAttribute('class');

      expect(moonClass).toContain('rotate-90');
      expect(moonClass).toContain('scale-0');
      expect(sunClass).toContain('rotate-0');
      expect(sunClass).toContain('scale-100');
    });
  });

  describe('Styling', () => {
    it('has dark mode background styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-slate-100');
      expect(button.className).toContain('dark:bg-slate-800');
    });

    it('has dark mode text styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-slate-700');
      expect(button.className).toContain('dark:text-slate-300');
    });

    it('has dark mode hover styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-slate-200');
      expect(button.className).toContain('dark:hover:bg-slate-700');
    });

    it('has dark mode border styles', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('border-slate-200');
      expect(button.className).toContain('dark:border-slate-700');
    });
  });
});
