import { useState, useCallback, useRef } from 'react';
import { API_URL } from '../config/api.js';
import { trackDocGeneration, trackQualityScore, trackError, trackPerformance } from '../utils/analytics.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useDocGeneration(onUsageUpdate) {
  const { getToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [qualityScore, setQualityScore] = useState(null);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const eventSourceRef = useRef(null);

  const generate = useCallback(async (code, docType, language, isDefaultCode = false, filename = 'untitled') => {
    // Reset state
    setIsGenerating(true);
    setError(null);
    setDocumentation('');
    setQualityScore(null);
    setRetryAfter(null);

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Track start time for performance metrics
    const startTime = performance.now();

    // Track generated documentation for return value
    let generatedDoc = '';
    let generatedScore = null;
    let generatedMetadata = null;

    try {
      // Get auth token if available
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use fetch with POST to send data
      const response = await fetch(`${API_URL}/api/generate-stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code,
          docType,
          language,
          isDefaultCode, // Enable prompt caching for default/example code
          filename // Pass filename for title formatting
        })
      });

      // Extract rate limit headers from response
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      const reset = response.headers.get('X-RateLimit-Reset');

      if (remaining && limit) {
        setRateLimitInfo({
          remaining: parseInt(remaining),
          limit: parseInt(limit),
          reset: parseInt(reset)
        });
      }

      // Handle error responses (400, 429, 500, etc.)
      if (!response.ok) {
        // Try to parse error response body
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response body isn't JSON, use generic error
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle 429 (rate limit) specifically
        if (response.status === 429) {
          setRetryAfter(errorData.retryAfter || 60);
          throw new Error(errorData.message || 'Rate limit exceeded');
        }

        // For other errors (400, 500, etc.), throw with the backend's message
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              generatedDoc += data.content; // Track locally for return value
              setDocumentation(prev => prev + data.content);
            } else if (data.type === 'attribution') {
              // Handle attribution separately to ensure it's outside any code blocks
              // Check if current content ends with an unclosed code block
              const fenceCount = (generatedDoc.match(/```/g) || []).length;
              const hasUnclosedCodeBlock = fenceCount % 2 === 1;

              let attributionContent = data.content;
              if (hasUnclosedCodeBlock) {
                // Close the code block before adding attribution
                attributionContent = '\n```' + data.content;
              }

              generatedDoc += attributionContent;
              setDocumentation(prev => {
                const prevFenceCount = (prev.match(/```/g) || []).length;
                const prevHasUnclosed = prevFenceCount % 2 === 1;
                if (prevHasUnclosed) {
                  return prev + '\n```' + data.content;
                }
                return prev + data.content;
              });
            } else if (data.type === 'complete') {
              generatedScore = data.qualityScore; // Track locally for return value
              generatedMetadata = data.metadata; // Track metadata for return value
              console.log('[useDocGeneration] Received metadata:', data.metadata);
              setQualityScore(data.qualityScore);
              setIsGenerating(false);

              // Track successful generation
              const duration = performance.now() - startTime;
              trackDocGeneration({
                docType,
                success: true,
                duration,
                codeSize: code.length,
                language: language || 'unknown',
              });

              // Track quality score
              if (data.qualityScore) {
                trackQualityScore({
                  score: data.qualityScore.score,
                  grade: data.qualityScore.grade,
                  docType,
                });
              }

              // Track performance
              trackPerformance({
                parseTime: 0, // Not tracked separately in current implementation
                generateTime: duration,
                totalTime: duration,
              });

              // Notify parent to refresh usage data
              if (onUsageUpdate) {
                onUsageUpdate();
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }

      // Return the generated content with metadata
      return {
        documentation: generatedDoc,
        qualityScore: generatedScore,
        metadata: generatedMetadata
      };
    } catch (err) {
      console.error('Generation error:', err);

      // Check if the error message is a JSON string from the API
      let apiError = null;
      try {
        if (typeof err.message === 'string' && err.message.startsWith('{')) {
          apiError = JSON.parse(err.message);
        }
      } catch (parseError) {
        // Not JSON, continue with normal error handling
      }

      // Provide more helpful error messages based on error type
      let errorMessage = 'Failed to generate documentation';
      let errorType = err.name || 'Error';

      // If we have a parsed API error, use it
      if (apiError) {
        // Use the API's message directly (it's already user-friendly)
        errorMessage = apiError.message || errorMessage;

        // Add "Claude" clarification for API usage limit errors
        // Also treat these as rate limit errors for proper title formatting
        if (errorMessage && errorMessage.includes('API usage limits')) {
          errorMessage = errorMessage.replace('API usage limits', 'Claude API usage limits');
          errorType = 'RateLimitError'; // Override error type so title shows "Claude API Rate Limit"
          // Don't set retryAfter - Claude's error message already includes the specific reset time
        }
        // Map API error types to better names
        else if (apiError.error === 'invalid_request_error') {
          errorType = 'InvalidRequestError';
        } else if (apiError.error === 'authentication_error') {
          errorType = 'AuthenticationError';
        } else if (apiError.error === 'rate_limit_error') {
          errorType = 'RateLimitError';
          setRetryAfter(60);
        } else {
          errorType = apiError.error || errorType;
        }
      }
      // Check if it's a rate limit error
      else if (err.name === 'RateLimitError' || err.message.includes('Rate limit')) {
        errorMessage = err.message || 'Rate limit exceeded. Please wait before trying again.';
        errorType = 'RateLimitError';
        setRetryAfter(err.retryAfter || 60);
      } else if (err.message.includes('429')) {
        // Handle 429 status in error message
        errorMessage = 'Rate limit exceeded. Too many requests.';
        errorType = 'RateLimitError';
        setRetryAfter(60);
      } else if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        // Network connectivity issues
        errorMessage = 'Unable to connect to the server. Please check your internet connection and ensure the backend server is running.';
        setRetryAfter(null);
      } else if (err.message.includes('HTTP error')) {
        // Extract status code for better context
        const statusMatch = err.message.match(/status: (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';

        if (status === '500') {
          errorMessage = 'Server error occurred while generating documentation. Please try again.';
        } else if (status === '503') {
          errorMessage = 'Service temporarily unavailable. The server may be overloaded or down for maintenance.';
        } else if (status === '400') {
          // Use the original error message from the API (it already contains the specific error)
          errorMessage = apiError?.message || 'Invalid request. Please check your code input and try again.';
        } else if (status === '401' || status === '403') {
          errorMessage = 'Authentication error. Please check API configuration.';
        } else {
          errorMessage = `Server returned error (${status}). Please try again.`;
        }
        setRetryAfter(null);
      } else if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
        // JSON parsing errors
        errorMessage = 'Invalid response from server. Please try again or contact support if the issue persists.';
        setRetryAfter(null);
      } else {
        // Use the original error message if it's descriptive, otherwise use generic message
        errorMessage = err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'An unexpected error occurred. Please try again.';
        setRetryAfter(null);
      }

      // Create a structured error object with full details for dev mode
      const errorObject = {
        message: errorMessage,                    // User-friendly message
        type: errorType,                         // Error type (mapped from API or detected)
        originalMessage: apiError ? JSON.stringify(apiError) : err.message, // Original error (API JSON or error message)
        stack: err.stack || new Error().stack,   // Stack trace (generate if not available)
        timestamp: new Date().toISOString(),     // ISO timestamp
        statusCode: err.status || err.statusCode, // HTTP status if available
        url: err.url,                            // Request URL if available
      };

      setError(JSON.stringify(errorObject));
      setIsGenerating(false);

      // Track failed generation
      const duration = performance.now() - startTime;
      trackDocGeneration({
        docType,
        success: false,
        duration,
        codeSize: code.length,
        language: language || 'unknown',
      });

      // Track error
      trackError({
        errorType,
        errorMessage,
        context: 'doc_generation',
      });

      // Re-throw the error so batch generation can handle it
      throw err;
    }
  }, [onUsageUpdate, getToken]);

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setDocumentation('');
    setQualityScore(null);
    setError(null);
    setRetryAfter(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryAfter(null);
  }, []);

  return {
    generate,
    cancel,
    reset,
    clearError,
    isGenerating,
    documentation,
    setDocumentation, // Exposed for testing
    qualityScore,
    setQualityScore, // Exposed for testing
    error,
    rateLimitInfo,
    retryAfter
  };
}