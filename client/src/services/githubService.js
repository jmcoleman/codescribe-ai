/**
 * GitHub Service - Frontend
 * Handles GitHub API calls for loading files and repository trees
 * Supports private repositories when user is authenticated with GitHub OAuth
 */

import { API_URL } from '../config/api.js';
import { getGitHubRecentKey, STORAGE_KEYS } from '../constants/storage.js';

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with Authorization if user is logged in
 */
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Parse GitHub URL
 * @param {string} url - GitHub URL or owner/repo shorthand
 * @returns {Promise<Object>} Parsed URL components
 */
export async function parseGitHubUrl(url) {
  const response = await fetch(`${API_URL}/api/github/parse-url`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to parse GitHub URL';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch file from GitHub
 * Supports private repositories when user is authenticated with GitHub OAuth
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} ref - Branch/tag/commit (optional)
 * @returns {Promise<Object>} File content and metadata
 */
export async function fetchFile(owner, repo, path, ref = null) {
  const body = { owner, repo, path };
  if (ref) body.ref = ref;

  const response = await fetch(`${API_URL}/api/github/file`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch file from GitHub';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.file;
}

/**
 * Fetch repository tree
 * Supports private repositories when user is authenticated with GitHub OAuth
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} ref - Branch/tag/commit (optional)
 * @returns {Promise<Object>} Repository tree structure
 */
export async function fetchTree(owner, repo, ref = null) {
  const body = { owner, repo };
  if (ref) body.ref = ref;

  const response = await fetch(`${API_URL}/api/github/tree`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch repository tree from GitHub';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.repository;
}

/**
 * Fetch repository branches
 * Supports private repositories when user is authenticated with GitHub OAuth
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>} List of branches
 */
export async function fetchBranches(owner, repo) {
  const response = await fetch(`${API_URL}/api/github/branches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ owner, repo })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch branches from GitHub';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.branches;
}

/**
 * Validate GitHub URL client-side (basic check)
 * @param {string} input - URL to validate
 * @returns {boolean} True if valid format
 */
export function validateGitHubUrl(input) {
  if (!input || typeof input !== 'string') return false;

  const trimmed = input.trim();

  // Check for basic patterns
  const patterns = [
    /^[\w-]+\/[\w.-]+\/.+(@[\w.-]+)?$/, // owner/repo/path[@ref]
    /^[\w-]+\/[\w.-]+(@[\w.-]+)?$/, // owner/repo[@ref]
    /github\.com\/[\w-]+\/[\w.-]+/, // github.com URLs
    /raw\.githubusercontent\.com/ // raw.githubusercontent.com URLs
  ];

  return patterns.some(pattern => pattern.test(trimmed));
}

/**
 * Get recent GitHub files from localStorage (user-scoped)
 * @param {number|string} userId - User ID for scoping (optional, falls back to legacy key)
 * @returns {Array} Recent files
 */
export function getRecentFiles(userId = null) {
  try {
    console.log('[getRecentFiles] Called with userId:', userId);

    // Try user-scoped key first
    if (userId) {
      const key = getGitHubRecentKey(userId);
      console.log('[getRecentFiles] User-scoped key:', key);
      if (key) {
        const recent = localStorage.getItem(key);
        console.log('[getRecentFiles] User-scoped data:', recent);
        if (recent) {
          const parsed = JSON.parse(recent);
          console.log('[getRecentFiles] Returning user-scoped files:', parsed);
          return parsed;
        }
      }
    }

    // Fallback to legacy key for backwards compatibility
    const legacyRecent = localStorage.getItem('github_recent_files');
    console.log('[getRecentFiles] Legacy data:', legacyRecent);
    const result = legacyRecent ? JSON.parse(legacyRecent) : [];
    console.log('[getRecentFiles] Returning:', result);
    return result;
  } catch (error) {
    console.error('Failed to get recent files:', error);
    return [];
  }
}

/**
 * Add file to recent files list (user-scoped)
 * @param {Object} file - File metadata
 * @param {number|string} userId - User ID for scoping (optional, falls back to legacy key)
 */
export function addRecentFile(file, userId = null) {
  try {
    console.log('[addRecentFile] Called with file:', file, 'userId:', userId);
    const recent = getRecentFiles(userId);

    // For repo entries (isRepo: true), check if this repo already exists
    // If it does, don't add a duplicate - just keep the existing entry
    if (file.isRepo) {
      const existingRepoIndex = recent.findIndex(f => f.isRepo && f.owner === file.owner && f.repo === file.repo);
      if (existingRepoIndex !== -1) {
        console.log('[addRecentFile] Repo already exists in recent, skipping:', `${file.owner}/${file.repo}`);
        return; // Skip adding duplicate repo
      }
    }

    // Remove duplicates (for file entries, match on path + owner + repo)
    const filtered = recent.filter(f => f.path !== file.path || f.owner !== file.owner || f.repo !== file.repo);

    // Add to beginning, preserving all properties
    const newEntry = {
      owner: file.owner,
      repo: file.repo,
      path: file.path,
      name: file.name,
      language: file.language,
      timestamp: new Date().toISOString()
    };

    // Include repo-specific properties if present
    if (file.isRepo) {
      newEntry.isRepo = true;
      if (file.fileCount) {
        newEntry.fileCount = file.fileCount;
      }
    }

    // Include private repo flag if present
    if (file.isPrivate !== undefined) {
      newEntry.isPrivate = file.isPrivate;
    }

    filtered.unshift(newEntry);

    // Keep only last 5
    const limited = filtered.slice(0, 5);
    console.log('[addRecentFile] Saving limited list:', limited);

    // Save to user-scoped key or fallback to legacy
    if (userId) {
      const key = getGitHubRecentKey(userId);
      console.log('[addRecentFile] Saving to user-scoped key:', key);
      if (key) {
        localStorage.setItem(key, JSON.stringify(limited));
        console.log('[addRecentFile] Saved successfully');
      }
    } else {
      console.log('[addRecentFile] Saving to legacy key');
      localStorage.setItem('github_recent_files', JSON.stringify(limited));
    }
  } catch (error) {
    console.error('Failed to save recent file:', error);
  }
}

/**
 * Check if a file is a binary file that can't be previewed
 * @param {string} filename - File name with extension
 * @returns {boolean} True if binary
 */
export function isBinaryFile(filename) {
  if (!filename) return false;

  const extension = filename.split('.').pop()?.toLowerCase();

  const binaryExtensions = [
    // Images (excluding SVG which is text-based XML)
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'psd', 'heic',
    // Archives
    'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz',
    // Executables
    'exe', 'dll', 'so', 'dylib', 'bin',
    // Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    // Media
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'wav', 'ogg',
    // Fonts
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    // Other binary
    'db', 'sqlite', 'pyc', 'class', 'jar', 'war'
  ];

  return binaryExtensions.includes(extension);
}

/**
 * Code-only extensions that can have documentation generated
 * Excludes: markdown, config files, plain text, styles, markup
 */
const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  // Python
  'py', 'pyw',
  // Java
  'java',
  // C/C++
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
  // C#
  'cs',
  // Go
  'go',
  // Rust
  'rs',
  // Ruby
  'rb',
  // PHP
  'php',
  // Swift
  'swift',
  // Kotlin
  'kt', 'kts',
  // Scala
  'scala',
  // Shell
  'sh', 'bash', 'zsh',
  // SQL
  'sql',
  // Frameworks
  'vue', 'svelte',
  // Other languages
  'r', 'm', 'dart', 'lua', 'perl', 'pl'
];

/**
 * Check if a file is a code file that can have documentation generated
 * More restrictive than isFileSupported - excludes markdown, configs, styles, etc.
 * @param {string} filename - File name with extension
 * @returns {boolean} true if file is a code file suitable for doc generation
 */
export function isCodeFile(filename) {
  if (!filename) return false;

  const extension = filename.split('.').pop()?.toLowerCase();
  const name = filename.toLowerCase();

  // Binary files are not code
  if (isBinaryFile(filename)) return false;

  // Special case: Dockerfile, Makefile are code-like
  const codeNoExtension = ['dockerfile', 'makefile', 'gemfile', 'rakefile'];
  if (!extension || extension === name) {
    return codeNoExtension.includes(name);
  }

  return CODE_EXTENSIONS.includes(extension);
}

/**
 * Check if a file type is supported for code editing
 * @param {string} filename - File name with extension
 * @returns {Object} { isSupported, reason, isBinary }
 */
export function isFileSupported(filename) {
  if (!filename) {
    return { isSupported: false, reason: 'No filename provided', isBinary: false };
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  const name = filename.toLowerCase();

  // Check if it's a binary file
  const isBinary = isBinaryFile(filename);
  if (isBinary) {
    return { isSupported: false, reason: 'Binary files cannot be edited', isBinary: true };
  }

  // Supported text-based file extensions (Monaco Editor support)
  const supportedExtensions = [
    // JavaScript/TypeScript
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
    // Python
    'py', 'pyw',
    // Java
    'java',
    // C/C++
    'c', 'cpp', 'cc', 'cxx', 'h', 'hpp',
    // C#
    'cs',
    // Go
    'go',
    // Rust
    'rs',
    // Ruby
    'rb',
    // PHP
    'php',
    // Swift
    'swift',
    // Kotlin
    'kt', 'kts',
    // Scala
    'scala',
    // Shell
    'sh', 'bash', 'zsh',
    // SQL
    'sql',
    // HTML/CSS
    'html', 'htm', 'css', 'scss', 'sass', 'less',
    // Markup/Config
    'md', 'markdown', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
    // Frameworks
    'vue', 'svelte',
    // Other
    'r', 'm', 'dart', 'lua', 'perl', 'pl',
    // Plain text
    'txt', 'text', 'log'
  ];

  // Special case: Files without extensions (README, LICENSE, Dockerfile, etc.)
  const allowedNoExtension = ['readme', 'license', 'dockerfile', 'makefile', 'gemfile', 'rakefile'];
  if (!extension || extension === name) {
    if (allowedNoExtension.includes(name)) {
      return { isSupported: true, reason: null, isBinary: false };
    }
    // Allow other no-extension text files
    return { isSupported: true, reason: null, isBinary: false };
  }

  // Check if extension is supported
  if (supportedExtensions.includes(extension)) {
    return { isSupported: true, reason: null, isBinary: false };
  }

  // Unknown extension - could be text, could be binary
  // Be conservative and mark as unsupported
  return { isSupported: false, reason: `Files with .${extension} extension are not supported`, isBinary: false };
}

/**
 * Clear recent files
 */
export function clearRecentFiles(userId = null) {
  try {
    if (userId) {
      const key = getGitHubRecentKey(userId);
      if (key) {
        localStorage.removeItem(key);
      }
    } else {
      // Fallback to legacy key
      localStorage.removeItem('github_recent_files');
    }
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}
