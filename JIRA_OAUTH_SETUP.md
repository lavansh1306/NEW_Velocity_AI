# Jira OAuth Setup Guide

This guide explains how to set up Jira OAuth authentication for both development and production environments.

## Overview

The Jira OAuth flow uses PKCE (Proof Key for Code Exchange) for security. Due to serverless constraints on Vercel, PKCE state data is stored in Supabase instead of in-memory.

## Architecture

```
User → Login → /api/jira/auth/connect
       ↓
       Generate state + PKCE verifier
       ↓
       Store in Supabase (jira_oauth_pkce table)
       ↓
       Redirect to Jira auth.atlassian.com
       ↓
Jira → Callback → /api/jira/auth/callback?code=...&state=...
       ↓
       Retrieve PKCE from Supabase using state
       ↓
       Exchange code for token
       ↓
       Store token in memory
       ↓
       Redirect to /velocity-ai dashboard
```

## Prerequisites

1. **Jira Cloud Account** with OAuth app configured at https://developer.atlassian.com/
2. **Supabase Project** for storing PKCE data
3. **Environment Variables** properly configured

## Step 1: Create Jira OAuth App

1. Go to https://developer.atlassian.com/apps
2. Create a new OAuth application
3. Configure redirect URLs (both required):
   - **Development**: `http://localhost:4000/api/jira/auth/callback`
   - **Production**: `https://www.joinvelocity.co/api/jira/auth/callback`
4. Request these scopes:
   - `read:jira-work`
   - `read:jira-user`
   - `read:issue:jira`
   - `read:project:jira`
   - `offline_access`
5. Copy the **Client ID** and **Client Secret**

## Step 2: Create Supabase Table

Run the SQL migration to create the PKCE table:

```sql
-- From: supabase-migrations/create_jira_oauth_pkce_table.sql
CREATE TABLE IF NOT EXISTS jira_oauth_pkce (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_state ON jira_oauth_pkce(state);
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_expires_at ON jira_oauth_pkce(expires_at);

ALTER TABLE jira_oauth_pkce ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY "Allow anonymous PKCE lookup" 
  ON jira_oauth_pkce FOR SELECT USING (true);
CREATE OR REPLACE POLICY "Allow anonymous PKCE insert" 
  ON jira_oauth_pkce FOR INSERT WITH CHECK (true);
CREATE OR REPLACE POLICY "Allow anonymous PKCE delete" 
  ON jira_oauth_pkce FOR DELETE USING (true);
```

## Step 3: Configure Environment Variables

### Development (.env or .env.local)

```env
# Jira OAuth
JIRA_OAUTH_CLIENT_ID=your_client_id_here
JIRA_OAUTH_CLIENT_SECRET=your_client_secret_here
JIRA_OAUTH_API_URL=http://localhost:4000
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Server
NODE_ENV=development
API_PORT=4000
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://www.joinvelocity.co

# Session
SESSION_SECRET=dev-secret-change-in-prod
```

### Production (Vercel Environment Variables)

Set in Vercel project settings:

```env
NODE_ENV=production
JIRA_OAUTH_CLIENT_ID=your_client_id_here
JIRA_OAUTH_CLIENT_SECRET=your_client_secret_here
JIRA_OAUTH_API_URL_PROD=https://www.joinvelocity.co
JIRA_OAUTH_REDIRECT_URI=https://www.joinvelocity.co/api/jira/auth/callback

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

SESSION_SECRET=your-secure-random-secret-here
FRONTEND_URL_PROD=https://www.joinvelocity.co
```

## Step 4: Verify Routes

The following routes should be available:

- `GET /api/jira/auth/connect` - Start OAuth flow
- `GET /api/jira/auth/callback` - OAuth callback (called by Jira)
- `GET /api/jira/auth/status` - Check connection status  
- `GET /api/jira/auth/disconnect` - Disconnect Jira account
- `GET /api/jira/projects` - Fetch Jira projects (requires auth)
- `GET /api/jira/issues` - Fetch Jira issues (requires auth)

## Step 5: Test the Flow

### Development

1. Start the API server:
   ```bash
   npm run api
   ```

2. Open browser:
   ```
   http://localhost:5173/velocity-ai
   ```

3. Click "Connect Jira"
   - You'll be redirected to `auth.atlassian.com`
   - Authorize the app
   - You'll be redirected back to callback
   - Should redirect to `/velocity-ai` dashboard

### Production

Same flow but with `https://www.joinvelocity.co`

## Troubleshooting

### 400 Bad Request on Callback

**Cause**: PKCE state not found in Supabase or session expired

**Solutions**:
1. Check Supabase table exists and has data
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in environment
3. Check server logs for `[Jira OAuth Callback]` messages
4. Ensure session expiry is set to at least 15+ minutes

### Redirect URI Mismatch

**Cause**: Redirect URI in code doesn't match Jira OAuth app config

**Solutions**:
1. Verify both URLs are registered in Jira app settings:
   - Dev: `http://localhost:4000/api/jira/auth/callback`
   - Prod: `https://www.joinvelocity.co/api/jira/auth/callback`
2. Check env vars `JIRA_OAUTH_REDIRECT_URI` or auto-detection logic
3. Verify `JIRA_OAUTH_API_URL` is set correctly

### Session Lost Between Requests

**Cause**: In-memory session store in serverless (temporary fix)

**Solution**: Use Redis or Supabase for session storage in production. For development, in-memory is fine.

## Environment Variable Reference

| Variable | Required | Dev Value | Prod Value |
|----------|----------|-----------|------------|
| `JIRA_OAUTH_CLIENT_ID` | ✓ | OAuth app client ID | Same |
| `JIRA_OAUTH_CLIENT_SECRET` | ✓ | OAuth app secret | Same |
| `JIRA_OAUTH_REDIRECT_URI` | Optional | http://localhost:4000/api/jira/auth/callback | https://www.joinvelocity.co/api/jira/auth/callback |
| `JIRA_OAUTH_API_URL` | Optional | http://localhost:4000 | N/A |
| `JIRA_OAUTH_API_URL_PROD` | Optional | N/A | https://www.joinvelocity.co |
| `SUPABASE_URL` | ✓ | Your Supabase URL | Same |
| `SUPABASE_ANON_KEY` | ✓ | Your Supabase key | Same |
| `NODE_ENV` | ✓ | development | production |
| `SESSION_SECRET` | ✓ | dev-secret (change!) | Secure random string |

## PKCE Flow Details

1. **Login Request** (`/api/jira/auth/connect`):
   - Generate random `state` (32 bytes)
   - Generate random `codeVerifier` (32 bytes)
   - Create `codeChallenge` = SHA256(codeVerifier) in base64url
   - Store in Supabase: `(state, codeVerifier)`
   - Redirect to Jira with `state`, `code_challenge`, `code_challenge_method=S256`

2. **OAuth Callback** (`/api/jira/auth/callback`):
   - Receive `state` and `code` from Jira
   - Look up `codeVerifier` from Supabase using `state`
   - Exchange `code` + `codeVerifier` for access token
   - Delete used state from Supabase (one-time use)
   - Store token in memory (keyed by sessionID)
   - Redirect to dashboard

## Notes

- PKCE state expires after 15 minutes  
- Access tokens are stored in-memory (per sessionID)
- Refresh tokens are automatically used when access token expires
- For production, consider moving token storage to Supabase vault
- Session timeout should be at least 24 hours to prevent re-auth during a session
