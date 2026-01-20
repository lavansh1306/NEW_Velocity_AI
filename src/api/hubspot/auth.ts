// src/api/hubspot/auth.ts
// Implements OAuth2 Authorization Code flow for HubSpot
// Production-grade implementation for serverless environments
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as crypto from 'crypto';
import express, { Request, Response } from 'express';
import session from 'express-session';
import { sessionStore } from './session-store.js';
import { OAuthErrors } from './oauth-errors.js';

// Extend express-session SessionData to include HubSpot properties
declare module 'express-session' {
  interface SessionData {
    hubspotUserId?: string;
    hubspotPortalId?: string;
    hubspotStoreKey?: string;
    codeVerifier?: string;
  }
}

// Environment variables (accessed at runtime)
const getClientId = () => process.env.HUBSPOT_CLIENT_ID || '';
const getClientSecret = () => process.env.HUBSPOT_CLIENT_SECRET || '';
const getRedirectUri = () => process.env.HUBSPOT_REDIRECT_URI || 'https://www.joinvelocity.co/oauth/hubspot/callback';
const AUTHORIZE_URL: string = 'https://app.hubspot.com/oauth/authorize';
const TOKEN_URL: string = 'https://api.hubapi.com/oauth/v1/token';

// Debug: log if credentials are loaded (deferred)
setTimeout(() => {
  console.log('[HubSpot Auth] CLIENT_ID loaded:', getClientId() ? 'YES' : 'NO');
  console.log('[HubSpot Auth] CLIENT_SECRET loaded:', getClientSecret() ? 'YES' : 'NO');
  console.log('[HubSpot Auth] REDIRECT_URI:', getRedirectUri());
}, 100);

// Scopes requested
const SCOPES: string = [
  'crm.objects.companies.read',
  'crm.objects.contacts.read',
  'crm.objects.deals.read',
  'crm.schemas.companies.read',
  'crm.schemas.contacts.read',
  'crm.schemas.deals.read',
  'marketing.campaigns.read',
  'marketing.campaigns.revenue.read',
  'oauth',
  'tickets'
].join(' ');

// Type definitions
interface PKCE {
  codeVerifier: string;
  codeChallenge: string;
}

interface TokenStore {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  portalId: string | null;
  userId: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Generate PKCE parameters
function generatePKCE(): PKCE {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// In-memory token store (for simplicity; use DB in production)
const hubspotTokens: Map<string, TokenStore> = new Map();

async function login(req: Request, res: Response): Promise<void> {
  try {
    // Generate PKCE parameters
    const { codeVerifier, codeChallenge } = generatePKCE();
    
    // Generate unique state for this OAuth flow
    const state = crypto.randomBytes(32).toString('hex');
    
    console.log('[HubSpot Login] Starting OAuth flow:', {
      sessionID: req.sessionID,
      state,
      timestamp: new Date().toISOString()
    });

    // CRITICAL: WAIT for PKCE data to be saved BEFORE redirecting
    console.log('[HubSpot Login] Saving PKCE data...');
    await sessionStore.set(state, {
      codeVerifier,
      createdAt: Date.now()
    });
    console.log('[HubSpot Login] PKCE data saved successfully');

    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state, // Pass state parameter for retrieval
    });

    const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;
    
    console.log('[HubSpot Login] Redirecting to HubSpot:', authUrl.substring(0, 100) + '...');
    res.redirect(authUrl);
  } catch (err) {
    console.error('[HubSpot Login] Error:', err);
    const error = OAuthErrors.INIT_FAILED(err instanceof Error ? err.message : 'Unknown error');
    res.status(error.statusCode).json(error.toJSON());
  }
}

async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
  });

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to refresh HubSpot token: ${resp.status} ${text}`);
  }

  return (await resp.json()) as TokenResponse;
}

async function callback(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  
  try {
    const { code, state } = req.query;
    
    console.log('[HubSpot Callback] Received OAuth callback:', {
      code: !!code,
      state,
      sessionID: req.sessionID,
      timestamp: new Date().toISOString()
    });

    // Validate required parameters
    if (!code) {
      console.error('[HubSpot Callback] Missing authorization code');
      const error = OAuthErrors.MISSING_CODE('OAuth provider did not return authorization code');
      return res.status(error.statusCode).json(error.toJSON());
    }

    if (!state) {
      console.error('[HubSpot Callback] Missing state parameter');
      const error = OAuthErrors.MISSING_STATE('OAuth provider did not return state parameter');
      return res.status(error.statusCode).json(error.toJSON());
    }

    // Retrieve PKCE data from persistent session store using state
    console.log('[HubSpot Callback] Retrieving PKCE data for state:', state);
    
    let pkceData = await sessionStore.get(state as string);
    
    // RETRY LOGIC: If not found immediately, wait and retry once
    // (accounts for async save delays or timing issues)
    if (!pkceData || !pkceData.codeVerifier) {
      console.warn('[HubSpot Callback] PKCE data not found on first attempt, retrying...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      pkceData = await sessionStore.get(state as string);
    }
    
    if (!pkceData || !pkceData.codeVerifier) {
      console.error('[HubSpot Callback] PKCE data not found after retry for state:', state);
      console.error('[HubSpot Callback] Available keys in store:', Array.from((sessionStore as any).memoryStore?.keys?.() || []));
      const error = OAuthErrors.SESSION_EXPIRED(
        'PKCE verification data expired or not found. Please try connecting again.'
      );
      return res.status(error.statusCode).json(error.toJSON());
    }

    const codeVerifier = pkceData.codeVerifier;
    console.log('[HubSpot Callback] Retrieved PKCE data successfully');

    // Exchange code for token
    console.log('[HubSpot Callback] Exchanging authorization code for token...');
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      code: code as string,
      code_verifier: codeVerifier,
    });

    const tokenResp = await fetch(TOKEN_URL, {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      console.error('[HubSpot Callback] Token exchange failed:', {
        status: tokenResp.status,
        error: text.substring(0, 500)
      });
      const error = OAuthErrors.TOKEN_EXCHANGE_FAILED(
        `HubSpot returned status ${tokenResp.status}`
      );
      return res.status(error.statusCode).json(error.toJSON());
    }

    const tokenData = (await tokenResp.json()) as TokenResponse & {
      hub_id?: number;
      user_id?: string;
    };

    console.log('[HubSpot Callback] Token exchange successful');

    // Get account info (hub_id is in the token response directly)
    let portalId: string | null = null;
    let userId: string | null = null;

    // PRIORITY 1: Get from token response directly (most reliable)
    if (tokenData.hub_id) {
      portalId = tokenData.hub_id.toString();
      console.log('[HubSpot Callback] Portal ID from token:', portalId);
    }
    if (tokenData.user_id) {
      userId = tokenData.user_id.toString();
    }

    // PRIORITY 2: Try to get additional user info from account API
    if (!portalId || !userId) {
      console.log('[HubSpot Callback] Fetching account info from HubSpot...');
      try {
        // Use account-info endpoint instead of contacts/me
        const accountResp = await fetch('https://api.hubapi.com/account-info/v3/api-usage/daily', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (accountResp.ok) {
          const accountInfo = (await accountResp.json()) as any;
          if (!portalId && accountInfo.portalId) {
            portalId = accountInfo.portalId.toString();
          }
          console.log('[HubSpot Callback] Account info retrieved:', { portalId });
        }
      } catch (err) {
        console.warn('[HubSpot Callback] Failed to fetch account info:', err);
      }
    }

    // FALLBACK: Generate a temporary ID if still not found
    if (!portalId) {
      portalId = `unknown_${Date.now()}`;
      console.warn('[HubSpot Callback] No portal ID found, using temporary ID:', portalId);
    }
    if (!userId) {
      userId = `user_${Date.now()}`;
    }

    console.log('[HubSpot Callback] Final IDs:', { userId, portalId });

    // Store token in memory AND persist to session store for serverless
    const store: TokenStore = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      portalId,
      userId,
    };

    const storeKey = userId || `hubspot_${Date.now()}`;
    hubspotTokens.set(storeKey, store);
    console.log('[HubSpot Callback] Token stored in memory with key:', storeKey);
    
    // CRITICAL: Persist token to session store for Vercel serverless
    await sessionStore.set(storeKey, {
      userId,
      portalId,
      storeKey,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      createdAt: Date.now()
    });
    console.log('[HubSpot Callback] Token persisted to session store');

    // Save to session
    req.session.hubspotUserId = userId || undefined;
    req.session.hubspotPortalId = portalId || undefined;
    req.session.hubspotStoreKey = storeKey;

    // Clean up PKCE data from session store
    console.log('[HubSpot Callback] Cleaning up PKCE data...');
    await sessionStore.delete(state as string);

    // Determine redirect URL
    const origin = req.headers.origin || 
                   req.headers.referer?.split('/').slice(0, 3).join('/') || 
                   (process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173') || 
                   'http://localhost:5173';
    const frontendUrl = `${origin}/projects/hubspot-dashboard?connected=true&storeKey=${storeKey}`;
    
    console.log('[HubSpot Callback] Preparing redirect:', {
      origin,
      storeKey,
      duration: `${Date.now() - startTime}ms`
    });
    
    // CRITICAL: Wait for session to be saved before redirecting
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[HubSpot Callback] Session save error:', err);
          reject(err);
        } else {
          console.log('[HubSpot Callback] Session saved successfully');
          resolve();
        }
      });
    });
    
    console.log('[HubSpot Callback] Redirecting to:', frontendUrl.substring(0, 80) + '...');
    res.redirect(frontendUrl);
  } catch (err) {
    console.error('[HubSpot Callback] Unexpected error:', {
      error: err,
      duration: `${Date.now() - startTime}ms`
    });
    const errorObj = OAuthErrors.INIT_FAILED(
      err instanceof Error ? err.message : 'Unknown error'
    );
    res.status(errorObj.statusCode).json(errorObj.toJSON());
  }
}

function logout(req: Request, res: Response): void {
  if (req.session) {
    delete req.session.hubspotUserId;
    delete req.session.hubspotPortalId;
    delete req.session.codeVerifier;
  }
  res.redirect('/');
}

// Helpers for other modules
function getTokenForSession(req: Request): TokenStore | null {
  const userId = req.session?.hubspotUserId;
  if (!userId) return null;
  return hubspotTokens.get(userId) || null;
}

async function ensureValidAccessTokenForSession(req: Request): Promise<string> {
  const store = getTokenForSession(req);
  if (!store) throw new Error('No HubSpot tokens - authenticate first');

  // Refresh if near expiry (5 min buffer)
  if (store.expiresAt < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshToken(store.refreshToken);
    store.accessToken = refreshed.access_token;
    store.refreshToken = refreshed.refresh_token;
    store.expiresAt = Date.now() + refreshed.expires_in * 1000;
    const userId = req.session?.hubspotUserId;
    if (userId) hubspotTokens.set(userId, store);
  }

  return store.accessToken;
}

export {
  login,
  callback,
  logout,
  getTokenForSession,
  ensureValidAccessTokenForSession,
  hubspotTokens,
};
