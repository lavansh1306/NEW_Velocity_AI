/**
 * API configuration - uses local backend in development
 */

// Always use relative URLs — Vite proxy handles /api/* in dev, Vercel rewrites handle it in production
export const API_BASE_URL = '';

/**
 * Helper to build API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
