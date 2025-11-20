/**
 * LLM Provider Configuration
 * Supports Claude (Anthropic) and OpenAI
 *
 * To switch providers, change LLM_PROVIDER environment variable:
 * - claude (default)
 * - openai
 */

const LLM_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai'
}

const config = {
  // ============================================================================
  // PROVIDER SELECTION
  // ============================================================================
  provider: process.env.LLM_PROVIDER || LLM_PROVIDERS.CLAUDE,

  // ============================================================================
  // COMMON SETTINGS (apply to all providers)
  // ============================================================================
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000', 10),
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
  timeout: parseInt(process.env.LLM_TIMEOUT || '60000', 10),
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  // Note: topP commented out by default - Claude API doesn't allow both temperature and topP
  // topP: parseFloat(process.env.LLM_TOP_P || '1.0'),
  enableCaching: process.env.LLM_ENABLE_CACHING !== 'false',

  // ============================================================================
  // PROVIDER-SPECIFIC SETTINGS
  // ============================================================================
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || process.env.LLM_API_KEY,
    model: process.env.CLAUDE_MODEL || process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929',
    supportsCaching: true,
    supportsStreaming: true
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
    model: process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-5.1',
    supportsCaching: false,
    supportsStreaming: true
  }
}

/**
 * Get current provider configuration
 * @returns {Object} Provider config with common settings
 * @throws {Error} If provider is unknown or API key is missing
 */
function getLLMConfig() {
  const provider = config.provider.toLowerCase()
  const providerConfig = config[provider]

  if (!providerConfig) {
    throw new Error(
      `Unknown LLM provider: "${provider}". ` +
      `Available providers: ${Object.values(LLM_PROVIDERS).join(', ')}`
    )
  }

  if (!providerConfig.apiKey) {
    throw new Error(
      `API key required for provider "${provider}". ` +
      `Set ${provider.toUpperCase()}_API_KEY or LLM_API_KEY environment variable.`
    )
  }

  const result = {
    provider,
    apiKey: providerConfig.apiKey,
    model: providerConfig.model,
    maxTokens: config.maxTokens,
    maxRetries: config.maxRetries,
    timeout: config.timeout,
    temperature: config.temperature,
    enableCaching: config.enableCaching,
    supportsCaching: providerConfig.supportsCaching,
    supportsStreaming: providerConfig.supportsStreaming,
    // Include all provider configs for runtime switching
    claude: config.claude,
    openai: config.openai
  }

  // Only add topP if explicitly configured (not used by default to avoid conflicts with temperature)
  if (config.topP !== undefined) {
    result.topP = config.topP
  }

  return result
}

/**
 * Get provider capabilities
 * @param {string} [providerName] - Provider name (defaults to current provider)
 * @returns {Object} Capabilities object
 */
function getProviderCapabilities(providerName = null) {
  const provider = (providerName || config.provider).toLowerCase()
  const providerConfig = config[provider]

  if (!providerConfig) {
    return {
      supportsCaching: false,
      supportsStreaming: false
    }
  }

  return {
    supportsCaching: providerConfig.supportsCaching,
    supportsStreaming: providerConfig.supportsStreaming
  }
}

/**
 * Log current configuration (sanitized - hides API keys)
 */
function logConfig() {
  // Configuration logging disabled in production
  // To enable for debugging:
  // const currentConfig = getLLMConfig()
  // const sanitized = { ...currentConfig, apiKey: `${currentConfig.apiKey.substring(0, 8)}...` }
  // console.log('[LLMConfig] Configuration:', JSON.stringify(sanitized, null, 2))
}

export {
  LLM_PROVIDERS,
  getLLMConfig,
  getProviderCapabilities,
  logConfig
}
