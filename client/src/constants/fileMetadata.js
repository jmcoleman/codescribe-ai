/**
 * File Metadata Configuration
 *
 * Defines available metadata fields for file cards and detail panel.
 * Future: User can configure which fields show on cards, in what order.
 */

import { formatTime, formatDateCompact } from '../utils/formatters';

/**
 * Available metadata fields for file cards
 * Each field has an id, label, visibility rules, and format function
 */
export const AVAILABLE_METADATA_FIELDS = [
  {
    id: 'docType',
    label: 'Doc Type',
    alwaysVisible: true, // Cannot be hidden (Requirement #4)
    format: (file) => file.docType || 'README'
  },
  {
    id: 'qualityGrade',
    label: 'Quality',
    alwaysVisible: false,
    format: (file) => file.qualityScore
      ? `${file.qualityScore.grade} ${file.qualityScore.score}`
      : null
  },
  {
    id: 'language',
    label: 'Language',
    alwaysVisible: false,
    format: (file) => file.language || 'Unknown'
  },
  {
    id: 'fileSize',
    label: 'Size',
    alwaysVisible: false,
    format: (file) => {
      const bytes = file.fileSize;
      if (!bytes) return '0 B';
      const kb = bytes / 1024;
      if (kb < 1) return `${bytes} B`;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    }
  },
  {
    id: 'origin',
    label: 'Origin',
    alwaysVisible: false,
    format: (file) => {
      const labels = {
        upload: 'Upload',
        github: 'GitHub',
        paste: 'Pasted',
        sample: 'Sample'
      };
      return labels[file.origin] || file.origin || 'Unknown';
    }
  },
  {
    id: 'linesOfCode',
    label: 'Lines',
    alwaysVisible: false,
    format: (file) => file.content?.split('\n').length || 0
  }
];

/**
 * Default metadata shown on file cards
 * Current: hardcoded in FileItem.jsx (lines 191-209)
 * Future: User configurable via settings
 */
export const DEFAULT_CARD_METADATA = [
  'docType',      // Always visible (Requirement #4)
  'qualityGrade', // If available
  'language',
  'fileSize'
];

/**
 * Get formatted metadata value for a field
 * @param {string} fieldId - Field identifier
 * @param {object} file - File object
 * @returns {string|null} Formatted value or null if not available
 */
export function getMetadataValue(fieldId, file) {
  const field = AVAILABLE_METADATA_FIELDS.find(f => f.id === fieldId);
  if (!field) return null;

  try {
    return field.format(file);
  } catch (error) {
    console.error(`Error formatting field ${fieldId}:`, error);
    return null;
  }
}

/**
 * Format file origin for display
 * @param {string} origin - Origin value (upload, github, paste, sample)
 * @returns {string} Human-readable origin
 */
export function formatOrigin(origin) {
  const labels = {
    upload: 'Upload',
    github: 'GitHub Import',
    paste: 'Code Panel',
    sample: 'Sample'
  };
  return labels[origin] || origin || 'Unknown';
}

/**
 * Format file type based on extension
 * @param {string} filename - Filename with extension
 * @returns {string} Human-readable file type
 */
export function formatFileType(filename) {
  if (!filename) return 'Unknown File';

  const ext = filename.split('.').pop()?.toLowerCase();

  const typeMap = {
    js: 'JavaScript File',
    jsx: 'React Component',
    ts: 'TypeScript File',
    tsx: 'TypeScript React Component',
    py: 'Python File',
    java: 'Java File',
    cpp: 'C++ File',
    c: 'C File',
    h: 'Header File',
    cs: 'C# File',
    rb: 'Ruby File',
    php: 'PHP File',
    go: 'Go File',
    rs: 'Rust File',
    swift: 'Swift File',
    kt: 'Kotlin File',
    scala: 'Scala File',
    r: 'R File',
    m: 'Objective-C File',
    sql: 'SQL File',
    sh: 'Shell Script',
    bash: 'Bash Script',
    json: 'JSON File',
    xml: 'XML File',
    yaml: 'YAML File',
    yml: 'YAML File',
    md: 'Markdown File',
    html: 'HTML File',
    css: 'CSS File',
    scss: 'SCSS File',
    sass: 'Sass File',
    less: 'Less File',
    vue: 'Vue Component',
    svelte: 'Svelte Component'
  };

  return typeMap[ext] || `${ext?.toUpperCase() || 'Unknown'} File`;
}

/**
 * Format timestamp for display
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp (e.g., "Today at 2:34 PM" or "Nov 19 at 2:34 PM")
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = formatTime(date);

    if (isToday) {
      return `Today at ${timeStr}`;
    }

    const dateStr = formatDateCompact(date);
    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid Date';
  }
}

/**
 * Get documentation status label
 * @param {object} file - File object
 * @returns {string} Status label
 */
export function getDocumentationStatus(file) {
  if (file.isGenerating) return 'Generating...';
  if (file.error) return 'Error';
  if (file.documentation) return 'Generated';
  return 'Not generated';
}
