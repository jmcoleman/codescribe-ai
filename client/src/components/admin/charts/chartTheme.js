/**
 * Chart Theme Configuration
 * Provides consistent colors and styling for Recharts components
 * Supports both light and dark modes with WCAG AA contrast ratios
 */

export const chartTheme = {
  light: {
    background: '#ffffff',
    text: '#1e293b',        // slate-800
    textMuted: '#64748b',   // slate-500
    grid: '#e2e8f0',        // slate-200
    primary: '#9333ea',     // purple-600
    secondary: '#6366f1',   // indigo-500
    success: '#22c55e',     // green-500
    warning: '#f59e0b',     // amber-500
    danger: '#ef4444',      // red-500
    info: '#3b82f6',        // blue-500
  },
  dark: {
    background: '#1e293b',  // slate-800
    text: '#f1f5f9',        // slate-100
    textMuted: '#94a3b8',   // slate-400
    grid: '#334155',        // slate-700
    primary: '#a855f7',     // purple-500
    secondary: '#818cf8',   // indigo-400
    success: '#4ade80',     // green-400
    warning: '#fbbf24',     // amber-400
    danger: '#f87171',      // red-400
    info: '#60a5fa',        // blue-400
  },
};

/**
 * Funnel stage colors (for conversion funnel)
 */
export const funnelColors = {
  light: ['#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff'],
  dark: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'],
};

/**
 * Bar chart colors for multiple series
 */
export const barColors = {
  light: ['#9333ea', '#6366f1', '#22c55e', '#f59e0b', '#ef4444'],
  dark: ['#a855f7', '#818cf8', '#4ade80', '#fbbf24', '#f87171'],
};

/**
 * Get theme colors based on current mode
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {Object} Theme colors
 */
export const getThemeColors = (isDark) => {
  return isDark ? chartTheme.dark : chartTheme.light;
};

/**
 * Common tooltip style
 */
export const tooltipStyle = {
  light: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  dark: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
};

/**
 * Format large numbers (1234 -> 1.2K)
 * @param {number} value - Number to format
 * @returns {string} Formatted string
 */
export const formatNumber = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format latency in milliseconds to human-readable format
 * - < 1000ms: show as "XXX ms"
 * - >= 1000ms: show as "X.Xs" (seconds)
 * @param {number} ms - Latency in milliseconds
 * @returns {string} Formatted latency string
 */
export const formatLatency = (ms) => {
  if (ms == null || isNaN(ms)) return '-';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)} ms`;
};

/**
 * Format currency (1234 -> $12.34)
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (cents) => {
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};
