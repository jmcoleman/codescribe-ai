/**
 * Language display name mappings
 * Maps language identifiers to user-friendly display names
 */

export const LANGUAGE_DISPLAY_NAMES = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
};

/**
 * Get display name for a language identifier
 * @param {string} language - Language identifier (e.g., 'csharp', 'cpp')
 * @returns {string} Display name (e.g., 'C#', 'C++')
 */
export function getLanguageDisplayName(language) {
  return LANGUAGE_DISPLAY_NAMES[language] || language.toUpperCase();
}
