/**
 * File validation utilities for client-side file upload validation
 */

// Maximum file size in bytes (500KB to match backend)
export const MAX_FILE_SIZE = 500 * 1024; // 500KB

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py',
  '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.go', '.rs', '.rb', '.php', '.txt'
];

// Allowed MIME types (for additional validation)
export const ALLOWED_MIME_TYPES = [
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'application/x-python',
  'text/x-java-source',
  'text/x-c',
  'text/x-c++',
  'text/x-csharp',
  'text/x-go',
  'text/x-rust',
  'text/x-ruby',
  'text/x-php',
  'text/plain',
  'application/octet-stream', // Some systems use this for code files
];

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate file extension
 * @param {string} filename - Name of the file
 * @returns {{ valid: boolean, extension: string, error?: string }}
 */
export function validateFileExtension(filename) {
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  if (!extension || extension === filename) {
    return {
      valid: false,
      extension: '',
      error: 'File has no extension'
    };
  }

  const valid = ALLOWED_EXTENSIONS.includes(extension);

  return {
    valid,
    extension,
    error: valid ? undefined : `File type "${extension}" is not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
  };
}

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {{ valid: boolean, size: number, sizeFormatted: string, error?: string }}
 */
export function validateFileSize(size) {
  const valid = size <= MAX_FILE_SIZE;

  return {
    valid,
    size,
    sizeFormatted: formatBytes(size),
    error: valid ? undefined : `File size (${formatBytes(size)}) exceeds maximum allowed size (${formatBytes(MAX_FILE_SIZE)})`
  };
}

/**
 * Validate file MIME type
 * @param {string} mimeType - File MIME type
 * @returns {{ valid: boolean, mimeType: string, error?: string }}
 */
export function validateFileMimeType(mimeType) {
  const valid = ALLOWED_MIME_TYPES.includes(mimeType);

  return {
    valid,
    mimeType,
    error: valid ? undefined : `File MIME type "${mimeType}" is not supported`
  };
}

/**
 * Comprehensive file validation
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, errors: string[], warnings: string[], file: { name: string, size: number, type: string, extension: string } }}
 */
export function validateFile(file) {
  if (!file) {
    return {
      valid: false,
      errors: ['No file provided'],
      warnings: [],
      file: null
    };
  }

  const errors = [];
  const warnings = [];

  // Validate file extension
  const extensionValidation = validateFileExtension(file.name);
  if (!extensionValidation.valid) {
    errors.push(extensionValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }

  // Validate MIME type (warning only, since some systems may report incorrect MIME types)
  const mimeValidation = validateFileMimeType(file.type);
  if (!mimeValidation.valid && file.type) {
    warnings.push(`Unexpected MIME type: ${file.type}. File will still be processed if extension is valid.`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    file: {
      name: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      type: file.type,
      extension: extensionValidation.extension
    }
  };
}

/**
 * Create a user-friendly error message from validation result
 * @param {{ valid: boolean, errors: string[], warnings: string[] }} validation - Validation result
 * @returns {string} User-friendly error message
 */
export function getValidationErrorMessage(validation) {
  if (validation.valid) {
    return null;
  }

  if (validation.errors.length === 1) {
    return validation.errors[0];
  }

  return `File validation failed:\n${validation.errors.map(err => `• ${err}`).join('\n')}`;
}

/**
 * Sanitize filename for cross-platform filesystem compatibility
 * Removes/replaces characters that are invalid on Windows, macOS, or Linux
 *
 * @param {string} filename - Original filename (may include extension)
 * @returns {string} Sanitized filename safe for all filesystems
 *
 * @example
 * sanitizeFilename('my:file*.js') // Returns: 'my_file_.js'
 * sanitizeFilename('code<>file.txt') // Returns: 'code__file.txt'
 * sanitizeFilename('  spaces.js  ') // Returns: 'spaces.js'
 */
export function sanitizeFilename(filename) {
  if (!filename) {
    return 'unnamed.txt';
  }

  // Trim leading/trailing whitespace first
  filename = filename.trim();

  if (!filename) {
    return 'unnamed.txt';
  }

  // Separate filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';

  // Handle files starting with a dot (like .gitignore, .js)
  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex); // Includes the dot
  } else if (lastDotIndex === 0 && filename.length > 1) {
    // File starts with dot (like .gitignore) - treat everything after dot as extension
    name = '';
    extension = filename;
  }

  // Replace filesystem-unsafe characters with underscore
  // Invalid characters: / \ : * ? " < > |
  name = name.replace(/[/\\:*?"<>|]/g, '_');

  // Remove control characters (ASCII 0-31)
  name = name.replace(/[\x00-\x1F]/g, '');

  // Trim leading/trailing whitespace and dots from name only
  name = name.trim().replace(/^\.+|\.+$/g, '');

  // Replace multiple consecutive underscores with single underscore
  name = name.replace(/_+/g, '_');

  // Trim trailing whitespace and dots from extension
  extension = extension.trimEnd().replace(/\.+$/g, '');
  // Ensure extension starts with a dot if it exists
  if (extension && !extension.startsWith('.')) {
    extension = '.' + extension;
  }

  // If name is empty or only underscores after sanitization, use default
  if (!name || name === '_') {
    name = 'unnamed';
  }

  // Reconstruct filename with extension
  return name + extension;
}
