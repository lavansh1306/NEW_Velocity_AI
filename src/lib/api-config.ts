/**
 * api-config.ts
 * Centralized configuration for all external API endpoints and environment variables.
 * Hard validation on startup for critical config — missing VITE_LLM_URL throws a visible error.
 */

// Critical vars — app cannot function without these
const CRITICAL_VARS = ['VITE_LLM_URL'];

// Optional vars — warn but don't block
const OPTIONAL_VARS = ['VITE_LLM_URL2', 'VITE_API_BASE_URL'];

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && defaultValue === undefined) {
    if (import.meta.env.DEV) console.warn(`[API Configuration] Warning: Missing environment variable: ${key}`);
    return '';
  }
  return value || defaultValue || '';
};

// Hard validation — throw immediately if critical vars are missing in production
if (import.meta.env.PROD) {
  const missing = CRITICAL_VARS.filter(key => !import.meta.env[key]);
  if (missing.length > 0) {
    const msg = `[API Configuration] FATAL: Missing critical environment variables: ${missing.join(', ')}. The AI planning flow will not work. Add these to your Vercel environment variables.`;
    console.error(msg);
    // Show visible error overlay in production
    document.addEventListener('DOMContentLoaded', () => {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#fee2e2;border-bottom:2px solid #ef4444;padding:12px 24px;font-family:monospace;font-size:13px;color:#991b1b;';
      div.innerHTML = `⚠️ Configuration Error: <strong>${missing.join(', ')}</strong> not set. AI features unavailable. Contact your administrator.`;
      document.body?.prepend(div);
    });
  }
}

// Export centralized constants
export const ML_ENGINE_URL = getEnvVar('VITE_LLM_URL').replace(/\/$/, '');
export const ML_ENGINE_URL_2 = getEnvVar('VITE_LLM_URL2').replace(/\/$/, '');
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL').replace(/\/$/, '');

// Validation summary for debugging
if (import.meta.env.DEV) {
  console.log('[API Configuration] Initialized:', {
    ML_ENGINE_URL: ML_ENGINE_URL || 'MISSING',
    ML_ENGINE_URL_2: ML_ENGINE_URL_2 || 'MISSING',
    API_BASE_URL: API_BASE_URL || 'MISSING',
  });
}
