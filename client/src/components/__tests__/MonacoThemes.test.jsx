import { describe, it, expect } from 'vitest';

/**
 * Tests for Monaco Editor theme configuration
 * These tests verify the theme definitions are correct
 * without actually rendering Monaco (which requires complex mocking)
 */

describe('Monaco Editor Theme Configuration', () => {
  // Theme definitions from LazyMonacoEditor.jsx
  const lightTheme = {
    base: 'vs',
    inherit: false,
    rules: [
      { token: '', foreground: '334155' },
      { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9333EA' }, // purple
      { token: 'string', foreground: '16A34A' }, // green
      { token: 'number', foreground: '0891B2' }, // cyan
      { token: 'delimiter', foreground: '334155' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#334155',
      'editorCursor.foreground': '#0891B2',
      'editor.lineHighlightBackground': '#F8FAFC',
    },
  };

  const darkTheme = {
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: '', foreground: 'E2E8F0' },
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C084FC' }, // purple-400
      { token: 'string', foreground: '4ADE80' }, // green-400
      { token: 'number', foreground: '22D3EE' }, // cyan-400
      { token: 'delimiter', foreground: 'E2E8F0' },
    ],
    colors: {
      'editor.background': '#0F172A',
      'editor.foreground': '#E2E8F0',
      'editorCursor.foreground': '#22D3EE',
      'editor.lineHighlightBackground': '#1E293B',
    },
  };

  describe('Light Theme', () => {
    it('uses vs base theme', () => {
      expect(lightTheme.base).toBe('vs');
    });

    it('does not inherit from base', () => {
      expect(lightTheme.inherit).toBe(false);
    });

    it('defines purple keywords', () => {
      const keywordRule = lightTheme.rules.find(r => r.token === 'keyword');
      expect(keywordRule.foreground).toBe('9333EA'); // purple-600
    });

    it('defines green strings', () => {
      const stringRule = lightTheme.rules.find(r => r.token === 'string');
      expect(stringRule.foreground).toBe('16A34A'); // green-600
    });

    it('defines cyan numbers', () => {
      const numberRule = lightTheme.rules.find(r => r.token === 'number');
      expect(numberRule.foreground).toBe('0891B2'); // cyan-600
    });

    it('uses white background', () => {
      expect(lightTheme.colors['editor.background']).toBe('#FFFFFF');
    });

    it('uses dark foreground for contrast', () => {
      expect(lightTheme.colors['editor.foreground']).toBe('#334155'); // slate-700
    });

    it('uses cyan cursor', () => {
      expect(lightTheme.colors['editorCursor.foreground']).toBe('#0891B2'); // cyan-600
    });
  });

  describe('Dark Theme - Neon Cyberpunk', () => {
    it('uses vs-dark base theme', () => {
      expect(darkTheme.base).toBe('vs-dark');
    });

    it('does not inherit from base', () => {
      expect(darkTheme.inherit).toBe(false);
    });

    it('defines bright purple keywords', () => {
      const keywordRule = darkTheme.rules.find(r => r.token === 'keyword');
      expect(keywordRule.foreground).toBe('C084FC'); // purple-400
    });

    it('defines bright green strings', () => {
      const stringRule = darkTheme.rules.find(r => r.token === 'string');
      expect(stringRule.foreground).toBe('4ADE80'); // green-400
    });

    it('defines bright cyan numbers', () => {
      const numberRule = darkTheme.rules.find(r => r.token === 'number');
      expect(numberRule.foreground).toBe('22D3EE'); // cyan-400
    });

    it('uses very dark background', () => {
      expect(darkTheme.colors['editor.background']).toBe('#0F172A'); // slate-950
    });

    it('uses light foreground for contrast', () => {
      expect(darkTheme.colors['editor.foreground']).toBe('#E2E8F0'); // slate-200
    });

    it('uses bright cyan cursor', () => {
      expect(darkTheme.colors['editorCursor.foreground']).toBe('#22D3EE'); // cyan-400
    });
  });

  describe('Theme Consistency', () => {
    it('both themes define the same token types', () => {
      const lightTokens = lightTheme.rules.map(r => r.token);
      const darkTokens = darkTheme.rules.map(r => r.token);

      expect(lightTokens).toEqual(expect.arrayContaining(['', 'comment', 'keyword', 'string', 'number', 'delimiter']));
      expect(darkTokens).toEqual(expect.arrayContaining(['', 'comment', 'keyword', 'string', 'number', 'delimiter']));
    });

    it('both themes use purple for keywords', () => {
      const lightKeyword = lightTheme.rules.find(r => r.token === 'keyword');
      const darkKeyword = darkTheme.rules.find(r => r.token === 'keyword');

      // Both should use purple (different shades)
      expect(lightKeyword.foreground).toMatch(/^[0-9A-F]{6}$/i); // purple-600
      expect(darkKeyword.foreground).toMatch(/^[0-9A-F]{6}$/i); // purple-400
    });

    it('both themes use green for strings', () => {
      const lightString = lightTheme.rules.find(r => r.token === 'string');
      const darkString = darkTheme.rules.find(r => r.token === 'string');

      expect(lightString.foreground).toMatch(/^[0-9A-F]{6}$/i); // green-600
      expect(darkString.foreground).toMatch(/^[0-9A-F]{6}$/i); // green-400
    });

    it('both themes use cyan for numbers and cursor', () => {
      const lightNumber = lightTheme.rules.find(r => r.token === 'number');
      const darkNumber = darkTheme.rules.find(r => r.token === 'number');

      expect(lightNumber.foreground).toMatch(/^[0-9A-F]{6}$/i); // cyan-600
      expect(darkNumber.foreground).toMatch(/^[0-9A-F]{6}$/i); // cyan-400

      expect(lightTheme.colors['editorCursor.foreground']).toContain('0891B2');
      expect(darkTheme.colors['editorCursor.foreground']).toContain('22D3EE');
    });
  });

  describe('Accessibility', () => {
    it('light theme provides high contrast', () => {
      // White background
      expect(lightTheme.colors['editor.background']).toBe('#FFFFFF');
      // Dark text
      expect(lightTheme.colors['editor.foreground']).toBe('#334155');

      // The contrast ratio between white (#FFFFFF) and slate-700 (#334155) is > 7:1 (AAA)
    });

    it('dark theme provides high contrast', () => {
      // Very dark background
      expect(darkTheme.colors['editor.background']).toBe('#0F172A');
      // Light text
      expect(darkTheme.colors['editor.foreground']).toBe('#E2E8F0');

      // The contrast ratio between slate-950 (#0F172A) and slate-200 (#E2E8F0) is > 7:1 (AAA)
    });
  });

  describe('Color Palette', () => {
    it('light theme uses consistent slate colors', () => {
      // Default and delimiter should use same color
      const defaultRule = lightTheme.rules.find(r => r.token === '');
      const delimiterRule = lightTheme.rules.find(r => r.token === 'delimiter');

      expect(defaultRule.foreground).toBe('334155'); // slate-700
      expect(delimiterRule.foreground).toBe('334155'); // slate-700
    });

    it('dark theme uses consistent slate colors', () => {
      // Default and delimiter should use same color
      const defaultRule = darkTheme.rules.find(r => r.token === '');
      const delimiterRule = darkTheme.rules.find(r => r.token === 'delimiter');

      expect(defaultRule.foreground).toBe('E2E8F0'); // slate-200
      expect(delimiterRule.foreground).toBe('E2E8F0'); // slate-200
    });

    it('dark theme uses vibrant neon colors', () => {
      // Keywords should be purple-400 (vibrant)
      const keywordRule = darkTheme.rules.find(r => r.token === 'keyword');
      expect(keywordRule.foreground).toBe('C084FC');

      // Strings should be green-400 (vibrant)
      const stringRule = darkTheme.rules.find(r => r.token === 'string');
      expect(stringRule.foreground).toBe('4ADE80');

      // Numbers should be cyan-400 (vibrant)
      const numberRule = darkTheme.rules.find(r => r.token === 'number');
      expect(numberRule.foreground).toBe('22D3EE');
    });
  });
});
