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
