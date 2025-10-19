// API Configuration
// In production (Vercel), API is at same domain via /api rewrite in vercel.json
// In development, use localhost:3000
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');
