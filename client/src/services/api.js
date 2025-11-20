import { API_URL } from '../config/api.js';

class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.status = 429;
  }
}

export async function generateDocumentation(code, docType, language, token = null) {
  const headers = { 'Content-Type': 'application/json' };

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers,
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

/**
 * Fetch available documentation types from the backend
 * @returns {Promise<Array<{value: string, label: string}>>} Array of doc type options
 */
export async function fetchDocTypes() {
  try {
    const response = await fetch(`${API_URL}/api/doc-types`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch doc types');
    }

    const data = await response.json();
    return data.docTypes || [];
  } catch (error) {
    console.error('Error fetching doc types:', error);
    // Return fallback doc types if API fails (Claude-only types)
    return [
      { value: 'API', label: 'API Documentation' },
      { value: 'ARCHITECTURE', label: 'Architecture Docs' },
      { value: 'JSDOC', label: 'JSDoc Comments' },
      { value: 'README', label: 'README.md' }
    ];
  }
}