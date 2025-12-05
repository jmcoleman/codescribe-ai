/**
 * Date and Time Formatting Utilities
 *
 * Provides consistent date/time formatting across the application.
 *
 * Usage:
 *   import { formatRelativeTime, formatDateTime, formatDate } from '../utils/formatters';
 *
 *   formatRelativeTime(date)  // "5 minutes ago", "Yesterday", "Dec 4, 2024 at 3:45 PM"
 *   formatDateTime(date)      // "Dec 4, 2024 at 3:45 PM"
 *   formatDate(date)          // "Dec 4, 2024"
 *   formatTime(date)          // "3:45 PM"
 */

/**
 * Format a date as relative time for recent dates, absolute for older dates
 * - < 1 minute: "Just now"
 * - < 1 hour: "X minutes ago"
 * - < 24 hours: "X hours ago"
 * - Yesterday: "Yesterday at 3:45 PM"
 * - < 7 days: "Monday at 3:45 PM"
 * - Older: "Dec 4, 2024 at 3:45 PM"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted relative/absolute time
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (< 1 minute)
  if (diffMinutes < 1) {
    return 'Just now';
  }

  // Minutes ago (< 1 hour)
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Hours ago (< 24 hours, same day)
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return `Yesterday at ${formatTime(date)}`;
  }

  // Within last 7 days - show day name
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${formatTime(date)}`;
  }

  // Older - show full date and time
  return formatDateTime(date);
}

/**
 * Format a date with full date and time
 * Example: "Dec 4, 2024 at 3:45 PM"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeAt - Include "at" between date and time (default: true)
 * @returns {string} Formatted date and time
 */
export function formatDateTime(dateInput, { includeAt = true } = {}) {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timePart = formatTime(date);

  return includeAt ? `${datePart} at ${timePart}` : `${datePart} ${timePart}`;
}

/**
 * Format a date without time
 * Example: "Dec 4, 2024"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted date
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'N/A';

  return new Date(dateInput).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date with long month name (for formal contexts like reports)
 * Example: "December 4, 2024"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted date with long month name
 */
export function formatDateLong(dateInput) {
  if (!dateInput) return 'N/A';

  return new Date(dateInput).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format time only
 * Example: "3:45 PM"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted time
 */
export function formatTime(dateInput) {
  if (!dateInput) return 'N/A';

  return new Date(dateInput).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a date for display in a compact format (no year if current year)
 * Example: "Dec 4" or "Dec 4, 2023"
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted compact date
 */
export function formatDateCompact(dateInput) {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  const now = new Date();

  const options = {
    month: 'short',
    day: 'numeric'
  };

  // Include year if not current year
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date range
 * Example: "Dec 4 - Dec 18, 2024" or "Dec 4, 2024 - Jan 5, 2025"
 *
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'N/A';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameYear = start.getFullYear() === end.getFullYear();

  const startOptions = {
    month: 'short',
    day: 'numeric'
  };

  const endOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  // Include year on start date only if different years
  if (!sameYear) {
    startOptions.year = 'numeric';
  }

  const startStr = start.toLocaleDateString('en-US', startOptions);
  const endStr = end.toLocaleDateString('en-US', endOptions);

  return `${startStr} - ${endStr}`;
}
