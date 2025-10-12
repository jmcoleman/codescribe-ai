import { useState, useCallback, useRef } from 'react';

export function useDocGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [qualityScore, setQualityScore] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const generate = useCallback(async (code, docType, language) => {
    // Reset state
    setIsGenerating(true);
    setError(null);
    setDocumentation('');
    setQualityScore(null);

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
      setError(err.message);
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

  return {
    generate,
    cancel,
    isGenerating,
    documentation,
    qualityScore,
    error
  };
}