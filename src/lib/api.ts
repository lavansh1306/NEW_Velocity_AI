/**
 * API configuration - always uses Render backend
 */

export const API_BASE_URL = 'https://new-velocity-ai.onrender.com';

/**
 * Helper to build API URLs
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
