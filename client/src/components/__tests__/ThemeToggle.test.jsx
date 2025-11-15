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

      const button = screen.getByRole('button', { name: /switch to (light|dark|auto) mode/i });
      expect(button).toBeInTheDocument();
    });

    it('shows sun icon in light mode', () => {
      // Explicitly set light mode
      localStorage.setItem('codescribeai:settings:theme', 'light');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Sun icon should be visible (opacity-100, scale-100)
      const button = screen.getByRole('button');
      const sunIcon = button.querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();

      const classValue = sunIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });

    it('shows moon icon in dark mode', () => {
      // Set dark mode in localStorage
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Moon icon should be visible
      const button = screen.getByRole('button');
      const moonIcon = button.querySelector('.lucide-moon');
      expect(moonIcon).toBeInTheDocument();

      const classValue = moonIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });

    it('shows monitor icon in auto mode', () => {
      // Set auto mode in localStorage
      localStorage.setItem('codescribeai:settings:theme', 'auto');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Monitor icon should be visible
      const button = screen.getByRole('button');
      const monitorIcon = button.querySelector('.lucide-monitor');
      expect(monitorIcon).toBeInTheDocument();

      const classValue = monitorIcon.getAttribute('class');
      expect(classValue).toContain('scale-100');
      expect(classValue).toContain('opacity-100');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label in light mode', () => {
      // Explicitly set light mode
      localStorage.setItem('codescribeai:settings:theme', 'light');

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

      expect(screen.getByRole('button', { name: /switch to auto mode/i })).toBeInTheDocument();
    });

    it('has correct aria-label in auto mode', () => {
      localStorage.setItem('codescribeai:settings:theme', 'auto');

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

      // Explicitly set light mode
      localStorage.setItem('codescribeai:settings:theme', 'light');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);

      // Should now show "switch to auto mode"
      expect(screen.getByRole('button', { name: /switch to auto mode/i })).toBeInTheDocument();

      // DOM should have dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // localStorage should be updated
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');
    });

    it('toggles from dark to auto on click', async () => {
      const user = userEvent.setup();
      localStorage.setItem('codescribeai:settings:theme', 'dark');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /switch to auto mode/i });
      await user.click(button);

      // Should now show "switch to light mode"
      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();

      // localStorage should be updated to auto
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('auto');
    });

    it('toggles from auto to light on click', async () => {
      const user = userEvent.setup();
      localStorage.setItem('codescribeai:settings:theme', 'auto');

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

    it('toggles multiple times correctly (full cycle)', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem('codescribeai:settings:theme', 'light');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      let button = screen.getByRole('button', { name: /switch to dark mode/i });

      // Click 1: light -> dark
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');

      // Click 2: dark -> auto
      button = screen.getByRole('button', { name: /switch to auto mode/i });
      await user.click(button);
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('auto');

      // Click 3: auto -> light
      button = screen.getByRole('button', { name: /switch to light mode/i });
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('light');

      // Click 4: light -> dark (cycle continues)
      button = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('codescribeai:settings:theme')).toBe('dark');
    });
  });

  describe('Icon Animation', () => {
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

    it('monitor icon has rotation and scale transitions', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const monitorIcon = button.querySelector('.lucide-monitor');

      const classValue = monitorIcon.getAttribute('class');
      expect(classValue).toContain('transition-all');
      expect(classValue).toContain('duration-300');
      expect(classValue).toContain('ease-in-out');
    });

    it('animates icon change on toggle (3-state cycle)', async () => {
      const user = userEvent.setup();

      // Explicitly set light mode to start
      localStorage.setItem('codescribeai:settings:theme', 'light');

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const sunIcon = button.querySelector('.lucide-sun');
      const moonIcon = button.querySelector('.lucide-moon');
      const monitorIcon = button.querySelector('.lucide-monitor');

      // Light mode: sun visible, others hidden
      let sunClass = sunIcon.getAttribute('class');
      let moonClass = moonIcon.getAttribute('class');
      let monitorClass = monitorIcon.getAttribute('class');

      expect(sunClass).toContain('rotate-0');
      expect(sunClass).toContain('scale-100');
      expect(moonClass).toContain('rotate-90');
      expect(moonClass).toContain('scale-0');
      expect(monitorClass).toContain('rotate-90');
      expect(monitorClass).toContain('scale-0');

      // Toggle to dark
      await user.click(button);

      // Re-query icons after state change
      const sunIconAfter = button.querySelector('.lucide-sun');
      const moonIconAfter = button.querySelector('.lucide-moon');
      const monitorIconAfter = button.querySelector('.lucide-monitor');

      // Dark mode: moon visible, others hidden
      sunClass = sunIconAfter.getAttribute('class');
      moonClass = moonIconAfter.getAttribute('class');
      monitorClass = monitorIconAfter.getAttribute('class');

      expect(sunClass).toContain('rotate-90');
      expect(sunClass).toContain('scale-0');
      expect(moonClass).toContain('rotate-0');
      expect(moonClass).toContain('scale-100');
      expect(monitorClass).toContain('rotate-90');
      expect(monitorClass).toContain('scale-0');

      // Toggle to auto
      await user.click(button);

      // Re-query icons
      const sunIconAuto = button.querySelector('.lucide-sun');
      const moonIconAuto = button.querySelector('.lucide-moon');
      const monitorIconAuto = button.querySelector('.lucide-monitor');

      // Auto mode: monitor visible, others hidden
      sunClass = sunIconAuto.getAttribute('class');
      moonClass = moonIconAuto.getAttribute('class');
      monitorClass = monitorIconAuto.getAttribute('class');

      expect(sunClass).toContain('rotate-90');
      expect(sunClass).toContain('scale-0');
      expect(moonClass).toContain('rotate-90');
      expect(moonClass).toContain('scale-0');
      expect(monitorClass).toContain('rotate-0');
      expect(monitorClass).toContain('scale-100');
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
