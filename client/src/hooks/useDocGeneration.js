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

      // Check if it's a rate limit error
      if (err.name === 'RateLimitError' || err.message.includes('Rate limit')) {
        setError(err.message || 'Rate limit exceeded. Please wait before trying again.');
        setRetryAfter(err.retryAfter || 60); // Set retry countdown
      } else if (err.message.includes('429')) {
        // Handle 429 status in error message
        setError('Rate limit exceeded. Too many requests.');
        setRetryAfter(60);
      } else {
        // Regular error handling
        setError(err.message || 'Failed to generate documentation');
        setRetryAfter(null); // Reset retry countdown for non-rate-limit errors
      }

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