const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function generateDocumentation(code, docType, language) {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, docType, language })
  });

  if (!response.ok) {
    throw new Error('Generation failed');
  }

  return response.json();
}