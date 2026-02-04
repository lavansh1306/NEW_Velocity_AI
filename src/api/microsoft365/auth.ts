// src/api/microsoft365/auth.ts
// Implements OAuth2 Authorization Code flow (multi-tenant) for Microsoft Graph
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

// Extend express-session SessionData to include Microsoft 365 properties
declare module 'express-session' {
  interface SessionData {
    tenantId?: string;
    account?: {
      oid: string;
      upn?: string;
      name?: string;
    };
    codeVerifier?: string;
  }
}

// Environment variables (accessed at runtime)
const getClientId = () => process.env.MS_CLIENT_ID || '';
const getClientSecret = () => process.env.MS_CLIENT_SECRET || '';
const getRedirectUri = () => {
  // Use environment-specific redirect URI
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return process.env.MS_REDIRECT_URI_PROD || 'https://www.joinvelocity.co/auth/callback';
  } else {
    return process.env.MS_REDIRECT_URI_LOCAL || 'http://localhost:5173/auth/callback';
  }
};
const AUTHORIZE_URL: string = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL: string = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Debug: log if credentials are loaded (deferred)
setTimeout(() => {
  console.log('[M365 Auth] CLIENT_ID loaded:', getClientId() ? 'YES' : 'NO');
  console.log('[M365 Auth] CLIENT_SECRET loaded:', getClientSecret() ? 'YES' : 'NO');
  console.log('[M365 Auth] REDIRECT_URI:', getRedirectUri());
}, 100);

// Scopes requested (delegated). Admin consent is required for some permissions.
// Starting with minimal scopes to avoid admin consent issues
const SCOPES: string = [
  'offline_access',
  'openid',
  'profile',
  'User.Read',
  'Calendars.Read'
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
  tenantId: string | null;
  account: {
    oid: string;
    upn?: string;
    name?: string;
  } | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

// Generate PKCE parameters
function generatePKCE(): PKCE {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// In-memory tenant token store (map tenant -> token store)
// For production, persist securely (DB, encrypted at rest).
const tenantTokens: Map<string, TokenStore> = new Map();

function login(req: Request, res: Response): void {
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store code_verifier in session for token exchange
  req.session.codeVerifier = codeVerifier;

  // Use prompt=consent to force a consent screen for the signing-in user.
  // NOTE: 'admin_consent' is not a valid value for the `prompt` parameter.
  // To perform tenant-wide admin consent for application permissions,
  // use the admin consent endpoint: /{tenant}/adminconsent?client_id=...
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    response_mode: 'query',
    scope: SCOPES,
    prompt: 'select_account', // Changed from 'consent' to 'select_account' for smoother flow
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  const url = `${AUTHORIZE_URL}?${params.toString()}`;
  res.redirect(url);
}

// Optional helper to initiate the admin consent flow (tenant admin must visit)
function adminConsent(req: Request, res: Response): void {
  const adminUrl = `https://login.microsoftonline.com/common/adminconsent?client_id=${encodeURIComponent(getClientId())}&redirect_uri=${encodeURIComponent(getRedirectUri())}`;
  res.redirect(adminUrl);
}

async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: getClientId(),
    scope: SCOPES,
    code: code,
    redirect_uri: getRedirectUri(),
    grant_type: 'authorization_code',
    client_secret: getClientSecret(),
    code_verifier: codeVerifier
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: getClientId(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_secret: getClientSecret(),
    scope: SCOPES
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) throw new Error(`Refresh failed: ${await res.text()}`);
  return res.json() as Promise<TokenResponse>;
}

// Callback route handler
async function callback(req: Request, res: Response): Promise<void> {
  const { code, error, error_description } = req.query as { code?: string; error?: string; error_description?: string };
  if (error) {
    res.status(400).send(`OAuth error: ${error_description || error}`);
    return;
  }
  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  const codeVerifier = req.session?.codeVerifier;
  if (!codeVerifier) {
    res.status(400).send('Missing PKCE code verifier');
    return;
  }

  try {
    const tokenResp = await exchangeCodeForToken(code, codeVerifier);

    // Clear the code_verifier from session after use
    delete req.session.codeVerifier;

    // tokenResp contains access_token, refresh_token, expires_in, scope, id_token
    // Decode id_token to get tenant and account info (simple parse, not full verification)
    const idToken = tokenResp.id_token || '';
    let tenantId: string | null = null;
    let account: { oid: string; upn?: string; name?: string } | null = null;
    try {
      const parts = idToken.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1] || '', 'base64').toString('utf8'));
        tenantId = payload.tid;
        account = { oid: payload.oid, upn: payload.preferred_username, name: payload.name };
      }
    } catch (e) {
      // ignore decode error
    }

    const store: TokenStore = {
      accessToken: tokenResp.access_token,
      refreshToken: tokenResp.refresh_token,
      expiresAt: Date.now() + (tokenResp.expires_in * 1000),
      tenantId,
      account
    };

    if (tenantId) tenantTokens.set(tenantId, store);

    // Save current tenant in session for subsequent API calls
    req.session.tenantId = tenantId as string | undefined;
    req.session.account = account as { oid: string; upn?: string; name?: string; } | undefined;

    // Redirect back to Microsoft 365 dashboard after successful authentication
    // Use the request origin or referrer to determine the correct frontend URL
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const frontendUrl = `${origin}/projects/microsoft365-dashboard`;
    
    console.log('[M365 Callback] Request origin:', req.headers.origin);
    console.log('[M365 Callback] Request referer:', req.headers.referer);
    console.log('[M365 Callback] Calculated frontend URL:', frontendUrl);
    res.redirect(frontendUrl);
  } catch (err) {
    console.error('Callback error', err);
    res.status(500).send('OAuth callback failed');
  }
}

function logout(req: Request, res: Response): void {
  if (req.session) {
    delete req.session.tenantId;
    delete req.session.account;
  }
  res.redirect('/');
}

// Helpers for other modules
function getTokenForSession(req: Request): TokenStore | null {
  const tenantId = req.session?.tenantId;
  if (!tenantId) return null;
  return tenantTokens.get(tenantId) || null;
}

async function ensureValidAccessTokenForSession(req: Request): Promise<string> {
  const store = getTokenForSession(req);
  if (!store) throw new Error('No tokens for current session - authenticate first');

  // Refresh if near expiry
  if (store.expiresAt < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshToken(store.refreshToken);
    store.accessToken = refreshed.access_token;
    store.refreshToken = refreshed.refresh_token || store.refreshToken;
    store.expiresAt = Date.now() + (refreshed.expires_in * 1000);
    if (store.tenantId) tenantTokens.set(store.tenantId, store);
  }
  return store.accessToken;
}

export {
  login,
  callback,
  logout,
  getTokenForSession,
  ensureValidAccessTokenForSession,
  // Expose token store for admin/debug only (not recommended in production)
  tenantTokens
};
