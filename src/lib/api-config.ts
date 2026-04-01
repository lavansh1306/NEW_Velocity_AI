/**
 * api-config.ts
 * Centralized configuration for all external API endpoints and environment variables.
 * This prevents hardcoding and ensures consistent configuration across the application.
 */

// 1. Validate required environment variables (optional: add more rigorous checks here)
const getEnvVar = (key: string, defaultValue? : string): string => {
  const value = import.meta.env[key];
  if (!value && defaultValue === undefined) {
    console.warn(`[API Configuration] Warning: Missing environment variable: ${key}`);
    return '';
  }
  return value || defaultValue || '';
};

// 2. Export centralized constants
export const ML_ENGINE_URL = getEnvVar('VITE_LLM_URL').replace(/\/$/, '');
export const VOICE_AGENT_URL = getEnvVar('VITE_LLM_URL2').replace(/\/$/, '');
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL').replace(/\/$/, '');

// 3. Validation Summary for debugging (logged once in dev mode)
if (import.meta.env.DEV) {
  console.log('[API Configuration] Initialized:', {
    ML_ENGINE_URL: ML_ENGINE_URL || 'MISSING',
    VOICE_AGENT_URL: VOICE_AGENT_URL || 'MISSING',
    API_BASE_URL: API_BASE_URL || 'MISSING',
  });
}
