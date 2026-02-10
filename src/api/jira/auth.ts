// src/api/jira/auth.ts
// Implements OAuth2 Authorization Code flow (3-legged OAuth) for Jira Cloud
// Multi-tenant SaaS implementation - each user connects their own Jira account
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend express-session SessionData to include Jira properties
declare module 'express-session' {
  interface SessionData {
    jiraUserId?: string;
    jiraCloudId?: string;
    jiraStoreKey?: string;
    jiraCodeVerifier?: string;
    jiraAccessibleResources?: JiraResource[];
  }
}

// Environment variables (accessed at runtime)
const getClientId = () => process.env.JIRA_OAUTH_CLIENT_ID || '';
const getClientSecret = () => process.env.JIRA_OAUTH_CLIENT_SECRET || '';
const getRedirectUri = () => {
  return 'https://www.joinvelocity.co/api/jira/auth/callback';
};
const AUTHORIZE_URL: string = 'https://auth.atlassian.com/authorize';
const TOKEN_URL: string = 'https://auth.atlassian.com/oauth/token';
const ACCESSIBLE_RESOURCES_URL: string = 'https://api.atlassian.com/oauth/token/accessible-resources';

// Debug: log if credentials are loaded (deferred)
setTimeout(() => {
  console.log('[Jira OAuth] CLIENT_ID loaded:', getClientId() ? 'YES' : 'NO');
  console.log('[Jira OAuth] CLIENT_SECRET loaded:', getClientSecret() ? 'YES' : 'NO');
  console.log('[Jira OAuth] REDIRECT_URI:', getRedirectUri());
}, 100);

// Scopes requested
const SCOPES: string = [
  'read:jira-work',
  'read:jira-user',
  'read:issue:jira',
  'read:project:jira',
  'offline_access'
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
  cloudId: string | null;
  userId: string | null;
  siteName?: string;
  siteUrl?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface JiraResource {
  id: string;
  name: string;
  url: string;
  scopes: string[];
}

// Lazy-initialize Supabase client to ensure env vars are loaded
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
      return null;
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Client initialized');
  }
  return supabase;
}

// Generate PKCE parameters
function generatePKCE(): PKCE {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// In-memory token store (map user session -> token store)
// For production, use database with encryption (Supabase Vault, etc.)
const jiraTokens: Map<string, TokenStore> = new Map();

// Fetch Jira user info using access token
async function getJiraUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await fetch('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    const userData = await response.json() as any;
    console.log('[Jira] User info fetched:', { 
      account_id: userData.account_id, 
      email: userData.email,
      name: userData.name 
    });
    
    return userData;
  } catch (error) {
    console.error('[Jira] Error fetching user info:', error);
    throw error;
  }
}

// Store Jira user in Supabase
async function saveJiraUserToSupabase(jiraUser: any, tokenData: any): Promise<void> {
  try {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.warn('[Supabase] Supabase not configured, skipping user save');
      return;
    }

    const { data, error } = await supabaseClient
      .from('jira_users')
      .upsert(
        {
          jira_id: jiraUser.account_id,
          email: jiraUser.email,
          display_name: jiraUser.name,
          avatar_url: jiraUser.picture,
          jira_token_data: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            stored_at: new Date().toISOString()
          },
          auth_provider: 'jira',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'jira_id' }
      );

    if (error) {
      console.error('[Supabase] Error saving Jira user:', error);
      throw error;
    }

    console.log('[Supabase] Jira user saved:', { jira_id: jiraUser.account_id, email: jiraUser.email });
  } catch (error) {
    console.error('[Supabase] Failed to save Jira user:', error);
    // Don't throw - continue anyway, auth still works even if Supabase save fails
  }
}

// Initiate OAuth flow
async function login(req: Request, res: Response): Promise<void> {
  try {
    // Generate PKCE parameters
    const { codeVerifier, codeChallenge } = generatePKCE();
    
    // Generate unique state for this OAuth flow
    const state = crypto.randomBytes(32).toString('hex');
    
    console.log('[Jira OAuth Login] Starting OAuth flow:', {
      sessionID: req.sessionID,
      state,
      timestamp: new Date().toISOString()
    });

    // Store PKCE data in session
    req.session.jiraCodeVerifier = codeVerifier;
    
    // Save session before redirect
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[Jira OAuth] Session save failed:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Build authorization URL
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: getClientId(),
      scope: SCOPES,
      redirect_uri: getRedirectUri(),
      state: state,
      response_type: 'code',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${AUTHORIZE_URL}?${params.toString()}`;
    
    console.log('[Jira OAuth] Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Jira OAuth Login] Error:', error);
    res.status(500).send('Failed to initiate Jira OAuth flow');
  }
}

// Exchange authorization code for tokens
async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code: code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  });

  console.log('[Jira OAuth] Exchanging code for token...');
  
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Jira OAuth] Token exchange failed:', response.status, errorText);
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json() as TokenResponse;
  console.log('[Jira OAuth] Token exchange successful');
  return tokenData;
}

// Get accessible Jira resources (sites)
async function getAccessibleResources(accessToken: string): Promise<JiraResource[]> {
  console.log('[Jira OAuth] Fetching accessible resources...');
  
  const response = await fetch(ACCESSIBLE_RESOURCES_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Jira OAuth] Failed to fetch resources:', response.status, errorText);
    throw new Error(`Failed to fetch Jira resources: ${response.status}`);
  }

  const resources = await response.json() as JiraResource[];
  console.log('[Jira OAuth] Accessible resources:', resources.length);
  return resources;
}

// OAuth callback handler
async function callback(req: Request, res: Response): Promise<void> {
  const { code, error, error_description } = req.query as { 
    code?: string; 
    error?: string; 
    error_description?: string;
  };

  if (error) {
    console.error('[Jira OAuth Callback] Error:', error, error_description);
    res.status(400).send(`OAuth error: ${error_description || error}`);
    return;
  }

  if (!code) {
    console.error('[Jira OAuth Callback] Missing authorization code');
    res.status(400).send('Missing authorization code');
    return;
  }

  const codeVerifier = req.session?.jiraCodeVerifier;
  if (!codeVerifier) {
    console.error('[Jira OAuth Callback] Missing PKCE code verifier');
    res.status(400).send('Missing PKCE code verifier. Session may have expired.');
    return;
  }

  try {
    // Exchange code for tokens
    const tokenResp = await exchangeCodeForToken(code, codeVerifier);

    // Clear the code_verifier from session after use
    delete req.session.jiraCodeVerifier;

    // Get accessible Jira resources (sites)
    const resources = await getAccessibleResources(tokenResp.access_token);
    
    if (resources.length === 0) {
      throw new Error('No Jira sites accessible with this account');
    }

    // Store ALL accessible resources in session so user can switch
    req.session.jiraAccessibleResources = resources;

    // Use the first accessible resource by default
    const primaryResource = resources[0];
    
    console.log('[Jira OAuth] Connected to site:', primaryResource.name, primaryResource.url);
    console.log('[Jira OAuth] Available sites:', resources.map(r => ({ name: r.name, id: r.id })));

    // Store tokens using the current sessionID
    const storeKey = req.sessionID;
    const expiresAt = Date.now() + (tokenResp.expires_in * 1000);
    
    const tokenStore = {
      accessToken: tokenResp.access_token,
      refreshToken: tokenResp.refresh_token,
      expiresAt: expiresAt,
      cloudId: primaryResource.id,
      userId: storeKey, // Use sessionID as userId
      siteName: primaryResource.name,
      siteUrl: primaryResource.url,
    };
    
    jiraTokens.set(storeKey, tokenStore);

    console.log('[Jira OAuth] Stored token with storeKey:', storeKey);
    console.log('[Jira OAuth] Token details:', {
      accessTokenLength: tokenResp.access_token.length,
      refreshTokenExists: !!tokenResp.refresh_token,
      expiresIn: tokenResp.expires_in,
      expiresAt: new Date(expiresAt),
      cloudId: primaryResource.id,
      siteName: primaryResource.name,
    });

    // Store cloudId and user info in session
    req.session.jiraCloudId = primaryResource.id;
    req.session.jiraUserId = storeKey;
    req.session.jiraStoreKey = storeKey;

    console.log('[Jira OAuth] Session before save:', {
      jiraStoreKey: req.session.jiraStoreKey,
      jiraCloudId: req.session.jiraCloudId,
      sessionID: req.sessionID
    });

    // Save session before redirecting
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[Jira OAuth] Session save failed:', err);
          reject(err);
        } else {
          console.log('[Jira OAuth] Session saved successfully');
          resolve();
        }
      });
    });

    console.log('[Jira OAuth Callback] Success! Fetching user info...');
    
    // Fetch Jira user info and save to Supabase
    try {
      const jiraUser = await getJiraUserInfo(tokenResp.access_token);
      await saveJiraUserToSupabase(jiraUser, tokenResp);
      console.log('[Jira OAuth Callback] User saved to Supabase');
    } catch (error) {
      console.warn('[Jira OAuth Callback] Warning: Could not save user to Supabase, continuing anyway:', error);
    }

    console.log('[Jira OAuth Callback] Success! Redirecting to dashboard...');
    
    // Redirect to main dashboard - determine frontend URL based on environment
    let frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173'; // Default for development
    
    if (process.env.NODE_ENV === 'production') {
      frontendBase = process.env.FRONTEND_URL_PROD || 'https://www.joinvelocity.co';
    }
    
    const redirectUrl = `${frontendBase}/velocity-ai`;
    console.log('[Jira OAuth Callback] Redirecting to:', redirectUrl);
    
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('[Jira OAuth Callback] Failed:', err);
    res.status(500).send('OAuth callback failed. Please try again.');
  }
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
  });

  console.log('[Jira OAuth] Refreshing access token...');
  
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Jira OAuth] Token refresh failed:', response.status, errorText);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const tokenData = await response.json() as TokenResponse;
  console.log('[Jira OAuth] Token refreshed successfully');
  return tokenData;
}

// Get valid access token for user (with automatic refresh)
export async function getAccessToken(req: Request): Promise<string | null> {
  const storeKey = req.session?.jiraStoreKey;
  console.log('[Jira OAuth] getAccessToken - sessionID:', req.sessionID);
  console.log('[Jira OAuth] getAccessToken - jiraStoreKey:', storeKey);
  console.log('[Jira OAuth] getAccessToken - available keys:', Array.from(jiraTokens.keys()));
  
  if (!storeKey) {
    console.log('[Jira OAuth] No jiraStoreKey in session');
    return null;
  }

  const tokenStore = jiraTokens.get(storeKey);
  if (!tokenStore) {
    console.log('[Jira OAuth] No tokens found for user with key:', storeKey);
    return null;
  }

  // Check if token needs refresh (refresh 5 minutes before expiry)
  const needsRefresh = Date.now() >= (tokenStore.expiresAt - 5 * 60 * 1000);
  
  if (needsRefresh && tokenStore.refreshToken) {
    try {
      console.log('[Jira OAuth] Access token expired, refreshing...');
      const newTokens = await refreshAccessToken(tokenStore.refreshToken);
      
      // Update stored tokens
      tokenStore.accessToken = newTokens.access_token;
      tokenStore.refreshToken = newTokens.refresh_token;
      tokenStore.expiresAt = Date.now() + (newTokens.expires_in * 1000);
      
      jiraTokens.set(storeKey, tokenStore);
      console.log('[Jira OAuth] Token refreshed and updated');
      
      return newTokens.access_token;
    } catch (err) {
      console.error('[Jira OAuth] Token refresh failed:', err);
      // Token refresh failed - user needs to re-authenticate
      jiraTokens.delete(storeKey);
      return null;
    }
  }

  return tokenStore.accessToken;
}

// Get Jira Cloud ID for user
export function getCloudId(req: Request): string | null {
  // FIRST check if user switched to a different site (session.jiraCloudId takes precedence)
  if (req.session?.jiraCloudId) {
    return req.session.jiraCloudId;
  }
  
  // Fallback to token store's original cloudId
  const storeKey = req.session?.jiraStoreKey;
  if (!storeKey) return null;
  
  const tokenStore = jiraTokens.get(storeKey);
  return tokenStore?.cloudId || null;
}

// Get user's Jira site info
export function getSiteInfo(req: Request): { name?: string; url?: string } | null {
  const storeKey = req.session?.jiraStoreKey;
  if (!storeKey) return null;
  
  const tokenStore = jiraTokens.get(storeKey);
  if (!tokenStore) return null;
  
  return {
    name: tokenStore.siteName,
    url: tokenStore.siteUrl,
  };
}

// Check if user has valid Jira connection
export function isConnected(req: Request): boolean {
  const storeKey = req.session?.jiraStoreKey;
  if (!storeKey) return false;
  
  return jiraTokens.has(storeKey);
}

// Disconnect user's Jira account
export function disconnect(req: Request): void {
  const storeKey = req.session?.jiraStoreKey;
  if (storeKey) {
    jiraTokens.delete(storeKey);
  }
  
  delete req.session.jiraCloudId;
  delete req.session.jiraUserId;
  delete req.session.jiraStoreKey;
  delete req.session.jiraCodeVerifier;
  
  console.log('[Jira OAuth] User disconnected');
}

// Export OAuth handlers
export const jiraAuth = {
  login,
  callback,
  getAccessToken,
  getCloudId,
  getSiteInfo,
  isConnected,
  disconnect,
};
