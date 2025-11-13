/**
 * Language display name mappings
 * Maps language identifiers to user-friendly display names
 *
 * NOTE: Language identifiers (keys) are filesystem-safe and should be used in filenames.
 * Display names (values) may contain special characters and should ONLY be used in UI.
 */

export const LANGUAGE_DISPLAY_NAMES = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',         // Display: "C++", Filename: "cpp"
  c: 'C',
  csharp: 'C#',       // Display: "C#", Filename: "csharp"
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
};

/**
 * Get display name for a language identifier (for UI display only)
 * @param {string} language - Language identifier (e.g., 'csharp', 'cpp')
 * @returns {string} Display name (e.g., 'C#', 'C++')
 *
 * WARNING: Do NOT use this for filenames. Use the raw language identifier instead.
 */
export function getLanguageDisplayName(language) {
  return LANGUAGE_DISPLAY_NAMES[language] || language.toUpperCase();
}

/**
 * Get filesystem-safe language name for use in filenames
 * @param {string} language - Language identifier (e.g., 'csharp', 'cpp')
 * @returns {string} Filesystem-safe name (e.g., 'csharp', 'cpp')
 *
 * This function returns the language identifier as-is, which is guaranteed to be
 * filesystem-safe (no special characters like #, +, /, etc.)
 */
export function getLanguageFilename(language) {
  // Language identifiers are already filesystem-safe
  // Examples: 'csharp' (not 'C#'), 'cpp' (not 'C++')
  return language?.toLowerCase() || 'txt';
}
