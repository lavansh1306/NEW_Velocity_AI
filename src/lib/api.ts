/**
 * API configuration - uses local backend in development
 */

// In development, API is on localhost:4000. In production, use relative URLs (same domain via proxy)
export const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000' 
  : ''; // Empty string = use relative URLs (same domain via Vercel rewrites)

/**
 * Helper to build API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
