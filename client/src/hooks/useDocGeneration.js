import { useState, useCallback, useRef } from 'react';

export function useDocGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [qualityScore, setQualityScore] = useState(null);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const eventSourceRef = useRef(null);

  const generate = useCallback(async (code, docType, language) => {
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

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Use fetch with POST to send data
      const response = await fetch(`${apiUrl}/api/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, docType, language })
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

      // Handle 429 specifically
      if (response.status === 429) {
        const errorData = await response.json();
        setRetryAfter(errorData.retryAfter || 60);
        throw new Error(errorData.message || 'Rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
              setDocumentation(prev => prev + data.content);
            } else if (data.type === 'complete') {
              setQualityScore(data.qualityScore);
              setIsGenerating(false);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
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
        // Map API error types to better names
        if (apiError.error === 'invalid_request_error') {
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
          errorMessage = 'Invalid request. Please check your code input and try again.';
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
    }
  }, []);

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
    qualityScore,
    error,
    rateLimitInfo,
    retryAfter
  };
}