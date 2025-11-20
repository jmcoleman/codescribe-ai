import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { PROMPT_VERSION } from './version.js';

// Get prompts directory path
// Use relative path from project root to work in both Node.js and Jest
const promptsDir = resolve(process.cwd(), 'src/prompts');

/**
 * Load prompt from file
 * @param {string} type - 'system' or 'user'
 * @param {string} docType - Type of documentation (README, JSDOC, API, ARCHITECTURE, OPENAPI)
 * @returns {string} Prompt content
 */
function loadPrompt(type, docType) {
  const validTypes = ['system', 'user'];
  const validDocTypes = ['README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'];

  if (!validTypes.includes(type)) {
    throw new Error(`Invalid prompt type: ${type}. Must be 'system' or 'user'`);
  }

  if (!validDocTypes.includes(docType)) {
    throw new Error(`Invalid docType: ${docType}. Must be one of: ${validDocTypes.join(', ')}`);
  }

  const promptPath = join(promptsDir, type, `${docType}.txt`);

  try {
    return readFileSync(promptPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load ${type} prompt for ${docType}: ${error.message}`);
  }
}

/**
 * Load all system prompts (cacheable)
 * @returns {Object} System prompts for all doc types
 */
export function loadSystemPrompts() {
  return {
    README: loadPrompt('system', 'README'),
    JSDOC: loadPrompt('system', 'JSDOC'),
    API: loadPrompt('system', 'API'),
    ARCHITECTURE: loadPrompt('system', 'ARCHITECTURE'),
    OPENAPI: loadPrompt('system', 'OPENAPI')
  };
}

/**
 * Load all user message templates
 * @returns {Object} User message templates for all doc types
 */
export function loadUserMessageTemplates() {
  return {
    README: loadPrompt('user', 'README'),
    JSDOC: loadPrompt('user', 'JSDOC'),
    API: loadPrompt('user', 'API'),
    ARCHITECTURE: loadPrompt('user', 'ARCHITECTURE'),
    OPENAPI: loadPrompt('user', 'OPENAPI')
  };
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
