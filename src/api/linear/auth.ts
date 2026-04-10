// src/api/linear/auth.ts
// Implements OAuth2 Authorization Code flow for Linear
// Linear uses standard OAuth2 — no PKCE required (simpler than Jira)
// Credentials: LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET in .env

import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend express-session to include Linear properties
declare module 'express-session' {
  interface SessionData {
    linearOrgId?: string;
    linearWorkspaceId?: string;
    linearWorkspaceName?: string;
    linearStateParam?: string;
    supabaseUserId?: string;
  }
}

// Credentials — set in .env, placeholders until real app is created
const getClientId = () => process.env.LINEAR_CLIENT_ID || '';
const getClientSecret = () => process.env.LINEAR_CLIENT_SECRET || '';

const getRedirectUri = (req?: Request) => {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    (req && (req.hostname === 'joinvelocity.co' || req.hostname === 'www.joinvelocity.co'));

  if (isProduction) {
    return process.env.LINEAR_REDIRECT_URI_PROD || 'https://www.joinvelocity.co/api/linear/auth/callback';
  }
  return process.env.LINEAR_REDIRECT_URI_LOCAL || 'http://localhost:4000/api/linear/auth/callback';
};

const AUTHORIZE_URL = 'https://linear.app/oauth/authorize';
const TOKEN_URL = 'https://api.linear.app/oauth/token';
const REVOKE_URL = 'https://api.linear.app/oauth/revoke';

// Scopes needed: read issues, teams, projects, comments
const SCOPES = ['read', 'issues:create'].join(',');

// In-memory token store (keyed by orgId) — backed by Supabase for persistence
const linearTokens: Map<string, { accessToken: string; workspaceId: string; workspaceName: string }> = new Map();

// Lazy Supabase client
let _supabase: any = null;
function getSupabaseClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('[LinearAuth] Missing Supabase credentials');
    return null;
  }
  _supabase = createClient(url, key);
  return _supabase;
}

// Log credential status at startup
setTimeout(() => {
  console.log('[Linear OAuth] CLIENT_ID loaded:', getClientId() ? 'YES' : 'NO (placeholder)');
  console.log('[Linear OAuth] CLIENT_SECRET loaded:', getClientSecret() ? 'YES' : 'NO (placeholder)');
  console.log('[Linear OAuth] REDIRECT_URI:', getRedirectUri());
}, 100);

// ── Initiate OAuth flow ────────────────────────────────────────────────────────

async function login(req: Request, res: Response): Promise<void> {
  try {
    const supabaseUserId = (req.query.supabaseUserId as string) || undefined;
    if (supabaseUserId) {
      req.session.supabaseUserId = supabaseUserId;
    }

    // Linear uses state param for CSRF protection (no PKCE)
    const state = crypto.randomBytes(32).toString('hex');
    req.session.linearStateParam = state;

    if (!getClientId()) {
      // Credentials not set yet — show a holding page instead of broken redirect
      res.status(503).json({
        error: 'Linear credentials not configured',
        message: 'Set LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET in .env to enable Linear OAuth',
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: getRedirectUri(req),
      response_type: 'code',
      scope: SCOPES,
      state,
      prompt: 'consent',
    });

    const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;
    console.log('[Linear OAuth] Redirecting to Linear:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Linear OAuth] Login error:', error);
    res.status(500).json({ error: 'Failed to initiate Linear OAuth flow' });
  }
}

// ── OAuth callback ─────────────────────────────────────────────────────────────

async function callback(req: Request, res: Response): Promise<void> {
  const { code, state, error, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  console.log('[Linear OAuth Callback] ==== CALLBACK STARTED ====');

  if (error) {
    console.error('[Linear OAuth Callback] OAuth error:', error, error_description);
    res.status(400).json({ error: `OAuth error: ${error}`, description: error_description });
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  // Verify state to prevent CSRF
  const savedState = req.session?.linearStateParam;
  if (!savedState || savedState !== state) {
    console.error('[Linear OAuth Callback] State mismatch — possible CSRF');
    res.status(400).json({ error: 'Invalid state parameter' });
    return;
  }
  delete req.session.linearStateParam;

  try {
    // Exchange code for access token
    const tokenResp = await exchangeCodeForToken(code, req);
    console.log('[Linear OAuth Callback] Token exchange successful');

    // Fetch workspace info from Linear GraphQL API
    const workspaceInfo = await getLinearWorkspaceInfo(tokenResp.access_token);
    console.log('[Linear OAuth Callback] Workspace:', workspaceInfo.name);

    // Find or create org
    const supabaseUserId = req.session?.supabaseUserId || null;
    const db = await import('./db.js');

    let orgId = req.session?.linearOrgId || null;
    if (!orgId && supabaseUserId) {
      // Try to find existing org for this user
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client
          .from('users')
          .select('organization_id')
          .eq('id', supabaseUserId)
          .single();
        orgId = data?.organization_id || null;
      }
    }

    if (!orgId) {
      console.warn('[Linear OAuth Callback] No orgId found — connection stored without org link');
    }

    // Persist connection to Supabase
    if (orgId) {
      await db.upsertLinearConnection(
        orgId,
        workspaceInfo.id,
        workspaceInfo.name,
        tokenResp.access_token,
        supabaseUserId || undefined
      );

      // Cache in memory for this session
      linearTokens.set(orgId, {
        accessToken: tokenResp.access_token,
        workspaceId: workspaceInfo.id,
        workspaceName: workspaceInfo.name,
      });

      req.session.linearOrgId = orgId;
      req.session.linearWorkspaceId = workspaceInfo.id;
      req.session.linearWorkspaceName = workspaceInfo.name;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('[Linear OAuth Callback] Complete, orgId:', orgId);

    // Redirect back to app
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production' || isVercel;
    let redirectUrl = 'http://localhost:5173/settings';
    if (req.hostname === 'www.joinvelocity.co' || req.hostname === 'joinvelocity.co') {
      redirectUrl = 'https://www.joinvelocity.co/settings';
    } else if (isProduction) {
      redirectUrl = (process.env.FRONTEND_URL_PROD || 'https://www.joinvelocity.co') + '/settings';
    }

    res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Linear OAuth Callback] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({
      error: 'Linear OAuth callback failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ── Token exchange ─────────────────────────────────────────────────────────────

async function exchangeCodeForToken(code: string, req?: Request): Promise<{ access_token: string }> {
  const params = new URLSearchParams({
    code,
    redirect_uri: getRedirectUri(req),
    client_id: getClientId(),
    client_secret: getClientSecret(),
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${err}`);
  }

  return response.json() as Promise<{ access_token: string }>;
}

// ── Linear GraphQL: get workspace info ────────────────────────────────────────

async function getLinearWorkspaceInfo(accessToken: string): Promise<{ id: string; name: string; urlKey: string }> {
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{ organization { id name urlKey } }`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const org = data?.data?.organization;
  if (!org) throw new Error('Could not fetch Linear workspace info');
  return { id: org.id, name: org.name, urlKey: org.urlKey };
}

// ── Status / connection checks ─────────────────────────────────────────────────

export async function getAccessToken(req: Request): Promise<string | null> {
  const orgId = req.session?.linearOrgId || (req.query?.orgId as string);
  if (!orgId) return null;

  // Try memory cache first
  const cached = linearTokens.get(orgId);
  if (cached) return cached.accessToken;

  // Fall back to DB
  try {
    const db = await import('./db.js');
    const conn = await db.getLinearConnection(orgId);
    if (conn) {
      linearTokens.set(orgId, {
        accessToken: conn.access_token,
        workspaceId: conn.workspace_id,
        workspaceName: conn.workspace_name,
      });
      return conn.access_token;
    }
  } catch (e) {
    console.warn('[LinearAuth] getAccessToken DB error:', e);
  }
  return null;
}

export function isConnected(req: Request): boolean {
  if (req.session?.linearOrgId && req.session?.linearWorkspaceId) return true;
  const orgId = req.session?.linearOrgId || (req.query?.orgId as string);
  if (orgId && linearTokens.has(orgId)) return true;
  return false;
}

export async function getWorkspaceInfo(req: Request): Promise<{ name?: string; id?: string } | null> {
  const orgId = req.session?.linearOrgId || (req.query?.orgId as string);
  if (!orgId) return null;
  const cached = linearTokens.get(orgId);
  if (cached) return { name: cached.workspaceName, id: cached.workspaceId };
  try {
    const db = await import('./db.js');
    const conn = await db.getLinearConnection(orgId);
    if (conn) return { name: conn.workspace_name, id: conn.workspace_id };
  } catch (e) { /* fallthrough */ }
  return null;
}

export async function disconnect(req: Request): Promise<void> {
  const orgId = req.session?.linearOrgId;

  if (orgId) {
    try {
      const db = await import('./db.js');
      await db.deleteLinearConnection(orgId);
      linearTokens.delete(orgId);
    } catch (e) {
      console.warn('[LinearAuth] DB disconnect error:', e);
    }
  }

  delete req.session.linearOrgId;
  delete req.session.linearWorkspaceId;
  delete req.session.linearWorkspaceName;
  console.log('[Linear OAuth] Disconnected (orgId:', orgId, ')');
}

export const linearAuth = {
  login,
  callback,
  getAccessToken,
  getWorkspaceInfo,
  isConnected,
  disconnect,
};
