import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { PROMPT_VERSION } from './version.js';

// Get prompts directory path
// Vercel uses /var/task as cwd, local/test uses project root
// Check if we're in Vercel serverless environment
const isVercel = process.cwd().includes('/var/task');
const promptsDir = isVercel
  ? resolve(process.cwd(), 'server/src/prompts')  // Vercel: /var/task/server/src/prompts
  : resolve(process.cwd(), 'src/prompts');        // Local/Test: <project>/src/prompts

// Valid prompt types and doc types
const VALID_TYPES = ['system', 'user'];
const VALID_DOC_TYPES = ['README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'];

// Cache for loaded prompts (loaded once at startup)
let commonPromptCache = null;
let systemPromptsCache = null;
let userTemplatesCache = null;

/**
 * Load common/shared prompt content (appended to all system prompts)
 * @returns {Promise<string>} Common prompt content or empty string if not found
 */
async function loadCommonPrompt() {
  const commonPath = join(promptsDir, 'system', 'COMMON.txt');
  try {
    return await readFile(commonPath, 'utf8');
  } catch (error) {
    // Common prompt is optional - return empty if not found
    return '';
  }
}

/**
 * Get common prompt content (cached)
 * @returns {Promise<string>} Common prompt content
 */
async function getCommonPrompt() {
  if (commonPromptCache === null) {
    commonPromptCache = await loadCommonPrompt();
  }
  return commonPromptCache;
}

/**
 * Load a single prompt from file
 * @param {string} type - 'system' or 'user'
 * @param {string} docType - Type of documentation (README, JSDOC, API, ARCHITECTURE, OPENAPI)
 * @returns {Promise<string>} Prompt content
 */
async function loadPrompt(type, docType) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid prompt type: ${type}. Must be 'system' or 'user'`);
  }

  if (!VALID_DOC_TYPES.includes(docType)) {
    throw new Error(`Invalid docType: ${docType}. Must be one of: ${VALID_DOC_TYPES.join(', ')}`);
  }

  const promptPath = join(promptsDir, type, `${docType}.txt`);

  try {
    const promptContent = await readFile(promptPath, 'utf8');

    // For system prompts, append the common prompt content
    if (type === 'system') {
      const commonPrompt = await getCommonPrompt();
      if (commonPrompt) {
        return promptContent + '\n\n' + commonPrompt;
      }
    }

    return promptContent;
  } catch (error) {
    throw new Error(`Failed to load ${type} prompt for ${docType}: ${error.message}`);
  }
}

/**
 * Load all system prompts in parallel (cacheable)
 * @returns {Promise<Object>} System prompts for all doc types
 */
export async function loadSystemPrompts() {
  // Return cached prompts if available
  if (systemPromptsCache !== null) {
    return systemPromptsCache;
  }

  // Load all system prompts in parallel
  const [readme, jsdoc, api, architecture, openapi] = await Promise.all([
    loadPrompt('system', 'README'),
    loadPrompt('system', 'JSDOC'),
    loadPrompt('system', 'API'),
    loadPrompt('system', 'ARCHITECTURE'),
    loadPrompt('system', 'OPENAPI')
  ]);

  systemPromptsCache = {
    README: readme,
    JSDOC: jsdoc,
    API: api,
    ARCHITECTURE: architecture,
    OPENAPI: openapi
  };

  return systemPromptsCache;
}

/**
 * Load all user message templates in parallel (cacheable)
 * @returns {Promise<Object>} User message templates for all doc types
 */
export async function loadUserMessageTemplates() {
  // Return cached templates if available
  if (userTemplatesCache !== null) {
    return userTemplatesCache;
  }

  // Load all user templates in parallel
  const [readme, jsdoc, api, architecture, openapi] = await Promise.all([
    loadPrompt('user', 'README'),
    loadPrompt('user', 'JSDOC'),
    loadPrompt('user', 'API'),
    loadPrompt('user', 'ARCHITECTURE'),
    loadPrompt('user', 'OPENAPI')
  ]);

  userTemplatesCache = {
    README: readme,
    JSDOC: jsdoc,
    API: api,
    ARCHITECTURE: architecture,
    OPENAPI: openapi
  };

  return userTemplatesCache;
}

/**
 * Replace template variables in user message
 * @param {string} template - User message template
 * @param {Object} variables - Variables to replace
 * @returns {string} Processed user message
 */
export function processTemplate(template, variables) {
  let processed = template;

  // Replace all template variables: {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, value);
  }

  return processed;
}

/**
 * Get prompt version for metadata
 * @returns {string} Current prompt version
 */
export function getPromptVersion() {
  return PROMPT_VERSION;
}
