// src/api/hubspot/auth.ts
// Implements OAuth2 Authorization Code flow for HubSpot
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as crypto from 'crypto';
import express, { Request, Response } from 'express';
import session from 'express-session';

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
// In-memory store for PKCE code verifiers (temporary, expires after 10 minutes)
const pkceStore: Map<string, { codeVerifier: string; timestamp: number }> = new Map();

// Clean up old PKCE entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pkceStore.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      pkceStore.delete(key);
    }
  }
}, 60 * 1000);

function login(req: Request, res: Response): void {
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store code_verifier in session for token exchange
  req.session.codeVerifier = codeVerifier;
  
  // Also store in memory map with session ID as key for serverless environments
  const sessionId = req.sessionID || `temp_${Date.now()}`;
  pkceStore.set(sessionId, { codeVerifier, timestamp: Date.now() });
  console.log('[HubSpot Login] Storing PKCE in sessionId:', sessionId);

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: sessionId, // Pass sessionId as state parameter for retrieval
  });

  const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;
  
  // Save session before redirecting
  req.session.save((err) => {
    if (err) {
      console.error('[HubSpot Login] Session save error:', err);
      res.status(500).json({ error: 'Failed to save session' });
      return;
    }
    console.log('[HubSpot Login] Session saved, redirecting to HubSpot');
    res.redirect(authUrl);
  });
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
  try {
    const { code, state } = req.query;
    
    console.log('[HubSpot Callback] Received:', { code: !!code, state, sessionID: req.sessionID });

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    // Try to get codeVerifier from session first, then from PKCE store using state
    let codeVerifier = req.session?.codeVerifier;
    
    if (!codeVerifier && state) {
      const stored = pkceStore.get(state as string);
      if (stored) {
        codeVerifier = stored.codeVerifier;
        console.log('[HubSpot Callback] Retrieved codeVerifier from PKCE store');
        pkceStore.delete(state as string); // Clean up after use
      }
    }

    if (!codeVerifier) {
      console.error('[HubSpot Callback] Missing code verifier. Session:', req.sessionID, 'State:', state);
      res.status(400).json({ error: 'Missing authorization code or verifier' });
      return;
    }

    // Exchange code for token
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
      console.error('Token exchange failed:', text);
      res.status(tokenResp.status).json({ error: 'Token exchange failed' });
      return;
    }

    const tokenData = (await tokenResp.json()) as TokenResponse & {
      hub_id?: number;
      user_id?: string;
    };

    // Fetch user info from HubSpot
    const infoResp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let portalId: string | null = null;
    let userId: string | null = null;

    if (infoResp.ok) {
      const info = (await infoResp.json()) as any;
      portalId = info.properties?.hs_portal_id || tokenData.hub_id?.toString() || null;
      userId = info.id || tokenData.user_id || null;
    }

    // Store token
    const store: TokenStore = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      portalId,
      userId,
    };

    const storeKey = userId || `hubspot_${Date.now()}`;
    hubspotTokens.set(storeKey, store);

    // Save to session - backend now stores token, not frontend
    req.session.hubspotUserId = userId || undefined;
    req.session.hubspotPortalId = portalId || undefined;
    req.session.hubspotStoreKey = storeKey;

    // Redirect back to HubSpot dashboard after successful authentication
    // Use the request origin or referrer to determine the correct frontend URL
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 
                   (process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173') || 
                   'http://localhost:5173';
    const frontendUrl = `${origin}/projects/hubspot-dashboard?connected=true&storeKey=${storeKey}`;
    
    console.log('[HubSpot Callback] Request origin:', req.headers.origin);
    console.log('[HubSpot Callback] Request referer:', req.headers.referer);
    console.log('[HubSpot Callback] Calculated frontend URL:', frontendUrl);
    console.log('[HubSpot Callback] Session data saved:', { userId, portalId, storeKey });
    
    // Save session before redirecting (critical for Vercel)
    req.session.save((err) => {
      if (err) {
        console.error('[HubSpot Callback] Session save error:', err);
        res.status(500).json({ error: 'Failed to save session' });
        return;
      }
      console.log('[HubSpot Callback] Session saved successfully');
      res.redirect(frontendUrl);
    });
  } catch (err) {
    console.error('HubSpot callback error:', err);
    res.status(500).json({ error: 'OAuth callback failed' });
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
