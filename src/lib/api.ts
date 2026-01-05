/**
 * API configuration - uses Render backend in production, localhost in development
 */

const isDev = import.meta.env.DEV;

export const API_BASE_URL = isDev 
  ? '' // In dev, Vite proxy handles /api routes to localhost:4000
  : 'https://new-velocity-ai.onrender.com';

/**
 * Helper to build API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
