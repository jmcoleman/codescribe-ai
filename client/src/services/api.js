const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.status = 429;
  }
}

export async function generateDocumentation(code, docType, language) {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, docType, language })
  });

  // Check rate limit headers
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (response.status === 429) {
    const data = await response.json();
    throw new RateLimitError(
      data.message || 'Rate limit exceeded',
      data.retryAfter || 60
    );
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Generation failed');
  }

  return {
    data: await response.json(),
    rateLimitInfo: { remaining, limit, reset }
  };
}