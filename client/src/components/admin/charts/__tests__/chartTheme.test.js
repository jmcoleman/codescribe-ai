import { describe, it, expect } from 'vitest';
import {
  chartTheme,
  funnelColors,
  barColors,
  getThemeColors,
  tooltipStyle,
  formatNumber,
  formatLatency,
  formatCurrency,
  formatPercent,
} from '../chartTheme';

describe('chartTheme', () => {
  describe('theme objects', () => {
    it('should have light and dark themes', () => {
      expect(chartTheme).toHaveProperty('light');
      expect(chartTheme).toHaveProperty('dark');
    });

    it('should have required color properties in light theme', () => {
      expect(chartTheme.light).toHaveProperty('background');
      expect(chartTheme.light).toHaveProperty('text');
      expect(chartTheme.light).toHaveProperty('primary');
      expect(chartTheme.light).toHaveProperty('success');
      expect(chartTheme.light).toHaveProperty('danger');
    });

    it('should have required color properties in dark theme', () => {
      expect(chartTheme.dark).toHaveProperty('background');
      expect(chartTheme.dark).toHaveProperty('text');
      expect(chartTheme.dark).toHaveProperty('primary');
      expect(chartTheme.dark).toHaveProperty('success');
      expect(chartTheme.dark).toHaveProperty('danger');
    });
  });

  describe('funnelColors', () => {
    it('should have light and dark color arrays', () => {
      expect(Array.isArray(funnelColors.light)).toBe(true);
      expect(Array.isArray(funnelColors.dark)).toBe(true);
      expect(funnelColors.light.length).toBeGreaterThan(0);
      expect(funnelColors.dark.length).toBeGreaterThan(0);
    });
  });

  describe('barColors', () => {
    it('should have light and dark color arrays', () => {
      expect(Array.isArray(barColors.light)).toBe(true);
      expect(Array.isArray(barColors.dark)).toBe(true);
      expect(barColors.light.length).toBeGreaterThan(0);
      expect(barColors.dark.length).toBeGreaterThan(0);
    });
  });

  describe('getThemeColors', () => {
    it('should return dark theme when isDark is true', () => {
      const colors = getThemeColors(true);
      expect(colors).toBe(chartTheme.dark);
    });

    it('should return light theme when isDark is false', () => {
      const colors = getThemeColors(false);
      expect(colors).toBe(chartTheme.light);
    });
  });

  describe('tooltipStyle', () => {
    it('should have light and dark styles', () => {
      expect(tooltipStyle).toHaveProperty('light');
      expect(tooltipStyle).toHaveProperty('dark');
      expect(tooltipStyle.light).toHaveProperty('backgroundColor');
      expect(tooltipStyle.dark).toHaveProperty('backgroundColor');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers >= 1 million with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(10000000)).toBe('10.0M');
    });

    it('should format numbers >= 1000 with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(41500)).toBe('41.5K');
    });

    it('should format numbers < 1000 as-is', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('formatLatency', () => {
    it('should return "-" for null or undefined values', () => {
      expect(formatLatency(null)).toBe('-');
      expect(formatLatency(undefined)).toBe('-');
    });

    it('should return "-" for NaN values', () => {
      expect(formatLatency(NaN)).toBe('-');
    });

    it('should format values >= 1000ms as seconds', () => {
      expect(formatLatency(1000)).toBe('1.0s');
      expect(formatLatency(1500)).toBe('1.5s');
      expect(formatLatency(41500)).toBe('41.5s');
      expect(formatLatency(120000)).toBe('120.0s');
    });

    it('should format values < 1000ms with ms suffix', () => {
      expect(formatLatency(0)).toBe('0 ms');
      expect(formatLatency(100)).toBe('100 ms');
      expect(formatLatency(500)).toBe('500 ms');
      expect(formatLatency(999)).toBe('999 ms');
    });

    it('should round millisecond values', () => {
      expect(formatLatency(100.7)).toBe('101 ms');
      expect(formatLatency(100.3)).toBe('100 ms');
    });

    it('should format edge case of exactly 1000ms', () => {
      expect(formatLatency(1000)).toBe('1.0s');
    });
  });

  describe('formatCurrency', () => {
    it('should convert cents to dollars with $ prefix', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(100)).toBe('$1.00');
      expect(formatCurrency(1234)).toBe('$12.34');
      expect(formatCurrency(9999)).toBe('$99.99');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage with one decimal place', () => {
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(50)).toBe('50.0%');
      expect(formatPercent(99.9)).toBe('99.9%');
      expect(formatPercent(100)).toBe('100.0%');
    });

    it('should handle decimal percentages', () => {
      expect(formatPercent(33.333)).toBe('33.3%');
      expect(formatPercent(66.666)).toBe('66.7%');
    });
  });
});
