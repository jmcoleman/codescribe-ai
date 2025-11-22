/**
 * Shared utilities for LLM providers
 * - Retry logic with exponential backoff
 * - Error standardization
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 *
 * @param {Function} fn - Async function to execute
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {string} [operation='LLM request'] - Operation name for logging
 * @returns {Promise<any>} Result from successful execution
 * @throws {Error} If all retries are exhausted
 */
async function retryWithBackoff(fn, maxRetries = 3, operation = 'LLM request') {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Special handling for rate limits (429)
      if (error.status === 429 && attempt < maxRetries) {
        // Read retry-after header (in seconds)
        const retryAfter = error.headers?.['retry-after']
          ? parseInt(error.headers['retry-after'], 10)
          : 60;

        console.log(
          `[LLM] Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `waiting ${retryAfter}s before retry...`
        );

        await sleep(retryAfter * 1000);
        continue; // Skip regular backoff, retry immediately after wait
      }

      // Don't retry on non-retryable errors
      if (shouldNotRetry(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate backoff delay: 2^attempt * 1000ms (1s, 2s, 4s, ...)
      const delayMs = Math.pow(2, attempt) * 1000

      console.log(
        `[LLM] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
        `retrying in ${delayMs}ms... Error: ${error.message}`
      )

      await sleep(delayMs)
    }
  }

  // All retries exhausted
  console.error(`[LLM] ${operation} failed after ${maxRetries + 1} attempts`)
  throw lastError
}

/**
 * Determine if an error should not be retried
 * Don't retry on:
 * - 401 Unauthorized (invalid API key)
 * - 400 Bad Request (invalid parameters)
 * - 403 Forbidden (permissions issue)
 *
 * @param {Error} error - Error to check
 * @returns {boolean} True if should NOT retry
 */
function shouldNotRetry(error) {
  const nonRetryableStatuses = [400, 401, 403]

  if (error.status && nonRetryableStatuses.includes(error.status)) {
    return true
  }

  // Check for Anthropic SDK error structure
  if (error.error?.type === 'invalid_request_error') {
    return true
  }

  return false
}

/**
 * Standardize errors from different providers into a common format
 *
 * @param {Error} error - Original error from provider SDK
 * @param {string} provider - Provider name ('claude', 'openai')
 * @param {string} operation - Operation that failed ('generate', 'stream')
 * @returns {Error} Standardized error with additional properties
 */
function standardizeError(error, provider, operation) {
  let message = `Error in ${provider} ${operation}`
  let statusCode = error.status || 500
  let errorType = 'UNKNOWN'

  // Determine error type and message based on status code
  if (statusCode === 401) {
    errorType = 'AUTH'
    message = `Invalid ${provider} API key`
  } else if (statusCode === 429) {
    errorType = 'RATE_LIMIT'
    message = `${provider} rate limit exceeded`
  } else if (statusCode === 400) {
    errorType = 'VALIDATION'
    message = `Invalid request to ${provider}`
  } else if (statusCode >= 500) {
    errorType = 'SERVER_ERROR'
    message = `${provider} server error`
  }

  // Try to extract more specific message from error
  if (error.message) {
    // For Anthropic errors with JSON in message
    const jsonMatch = error.message.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.error?.message) {
          message = parsed.error.message
        }
      } catch (e) {
        // If JSON parsing fails, use the original message
        message = error.message
      }
    } else {
      message = error.message
    }
  }

  // For nested error structures
  if (error.error?.message) {
    message = error.error.message
  }

  // Create standardized error
  const standardError = new Error(message)
  standardError.provider = provider
  standardError.operation = operation
  standardError.statusCode = statusCode
  standardError.errorType = errorType
  standardError.originalError = error

  // Add retry-after header if available (for rate limits)
  if (error.headers && error.headers['retry-after']) {
    standardError.retryAfter = parseInt(error.headers['retry-after'], 10)
  }

  return standardError
}

/**
 * Estimate token count for text (rough approximation)
 * Uses the common heuristic: ~4 characters per token
 *
 * @param {string} text - Text to estimate
 * @returns {number} Approximate token count
 */
function estimateTokens(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export {
  sleep,
  retryWithBackoff,
  shouldNotRetry,
  standardizeError,
  estimateTokens
}
