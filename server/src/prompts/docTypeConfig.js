/**
 * Doc Type Configuration
 *
 * Specifies which LLM provider and model to use for each documentation type.
 * This allows different doc types to use different models based on their needs.
 *
 * Configuration options per doc type:
 * - label: Display name for UI
 * - active: Whether this doc type is available (set to false to disable)
 * - provider: 'claude' | 'openai' | 'gemini' | null (null = use LLM_PROVIDER env variable)
 * - model: Specific model identifier (or null to use provider's default)
 * - temperature: (optional) 0.0-1.0, controls randomness
 * - maxTokens: (optional) Maximum tokens in response
 *
 * Provider Defaults (when provider is null):
 * - Uses LLM_PROVIDER environment variable
 * - Falls back to 'claude' if not set
 *
 * OpenAI Model Notes:
 * - GPT-5+ models use 'max_completion_tokens' parameter
 * - GPT-4 and earlier use 'max_tokens' parameter
 * - The OpenAI provider automatically handles this based on model name
 * - To use GPT-4: Set model to 'gpt-4-turbo', 'gpt-4', or 'gpt-3.5-turbo'
 * - To use GPT-5: Set model to 'gpt-5.1' or newer
 */

export const DOC_TYPE_CONFIG = {
  README: {
    label: 'README',
    active: true,
    provider: null, // Use LLM_PROVIDER env variable (claude, openai, or gemini)
    model: null,    // Use provider's default model
    temperature: 0.7,
    // Reason: Requires creativity for descriptions and examples
  },

  JSDOC: {
    label: 'JSDoc Comments',
    active: true,
    provider: 'openai',
    model: 'gpt-5.1',
    temperature: 0.3,
    // Reason: Structured output API perfect for JSDoc format, 39% cost savings vs Claude
  },

  API: {
    label: 'API Docs',
    active: true,
    provider: null, // Use LLM_PROVIDER env variable
    model: null,    // Use provider's default model
    temperature: 0.5,
    // Reason: Balance between structure and helpful examples
  },

  ARCHITECTURE: {
    label: 'Architecture Docs',
    active: true,
    provider: null, // Use LLM_PROVIDER env variable
    model: null,    // Use provider's default model
    temperature: 0.7,
    // Reason: Benefits from creative system design insights
  },

  OPENAPI: {
    label: 'OpenAPI (YAML)',
    active: true,
    provider: 'openai',
    model: 'gpt-5.1',
    temperature: 0.3,
    // Reason: Highly structured spec format, benefits from GPT's precision with schemas
  },

  // Example of future doc types using OpenAI:
  // CHANGELOG: {
  //   provider: 'openai',
  //   model: 'gpt-5.1',
  //   temperature: 0.2,
  //   // Reason: Highly structured format, benefits from GPT's conciseness
  // },
  //
  // TESTS: {
  //   provider: 'openai',
  //   model: 'gpt-5.1',
  //   temperature: 0.1,
  //   // Reason: Very structured, deterministic output preferred
  // },
  //
  // INLINE_COMMENTS: {
  //   provider: 'openai',
  //   model: 'gpt-5.1-mini', // Cheaper for simple tasks
  //   temperature: 0.3,
  //   maxTokens: 500,
  //   // Reason: Short, focused comments; cost-effective with mini model
  // },
};

/**
 * Get configuration for a specific doc type
 * Falls back to default provider if doc type not configured
 * @param {string} docType - Type of documentation
 * @returns {Object} Configuration with provider, model, and options
 */
export function getDocTypeConfig(docType) {
  const config = DOC_TYPE_CONFIG[docType];

  if (!config) {
    console.warn(`No config found for docType: ${docType}, using default provider`);
    return {
      provider: null,
      model: null,
      temperature: 0.7,
    };
  }

  // If provider is null, it will be resolved by docGenerator from LLM_PROVIDER env
  // If model is null, it will be resolved by llmService from provider defaults
  return {
    ...config,
    // Explicitly preserve null values - they signal "use defaults"
    provider: config.provider,
    model: config.model,
  };
}

/**
 * Get all supported doc types (including inactive ones)
 * @returns {string[]} Array of doc type names
 */
export function getSupportedDocTypes() {
  return Object.keys(DOC_TYPE_CONFIG);
}

/**
 * Get only active doc types
 * @returns {string[]} Array of active doc type names
 */
export function getActiveDocTypes() {
  return Object.keys(DOC_TYPE_CONFIG).filter(
    docType => DOC_TYPE_CONFIG[docType].active
  );
}

/**
 * Get doc types formatted for frontend (with labels, sorted alphabetically)
 * @param {boolean} activeOnly - If true, only return active doc types
 * @returns {Array<{value: string, label: string}>} Array of doc type options
 */
export function getDocTypeOptions(activeOnly = true) {
  const docTypes = activeOnly ? getActiveDocTypes() : getSupportedDocTypes();

  return docTypes
    .map(docType => ({
      value: docType,
      label: DOC_TYPE_CONFIG[docType].label
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
