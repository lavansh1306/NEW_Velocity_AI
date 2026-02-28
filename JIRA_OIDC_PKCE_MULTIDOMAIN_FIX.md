# JIRA OAuth PKCE Multi-Domain Fix Guide

## Problem Fixed
The PKCE verification error was occurring because the system was hardcoded to redirect OAuth callbacks to `joinvelocity.co`, even when users initiated sign-in from `velocitydevelopment.vercel.app`. The PKCE state parameters were stored on one domain's session but verification was happening on a different domain's session.

## Root Cause
- **Old behavior**: `getRedirectUri()` always returned `https://www.joinvelocity.co/api/jira/auth/callback` in production
- **Issue**: When signing in from `velocitydevelopment.vercel.app`:
  1. PKCE state stored in velocitydevelopment's session/database
  2. Oauth initiates with `redirect_uri=joinvelocity.co`
  3. Callback arrives at `joinvelocity.co` (different domain/session)
  4. State parameter lookup fails → PKCE verification fails

## What Was Fixed

### 1. **Dynamic Redirect URI** (`src/api/jira/auth.ts` - `getRedirectUri()`)
- Now uses `req.hostname` to build the redirect URI dynamically
- Each domain gets its own callback URL:
  - `velocitydevelopment.vercel.app` → `https://velocitydevelopment.vercel.app/api/jira/auth/callback`
  - `joinvelocity.co` → `https://joinvelocity.co/api/jira/auth/callback`
  - `localhost` → `http://localhost:4000/api/jira/auth/callback`

### 2. **Origin Hostname Tracking**
- Added `origin_hostname` tracking in PKCE storage
- When signing in, the origin hostname is captured and stored
- When callback comes in, we can redirect back to the correct origin

### 3. **Database Migration** (`supabase-migrations/add_origin_hostname_to_pkce.sql`)
- Added `origin_hostname` column to `jira_oauth_pkce` table
- Added `supabase_user_id` column (was already being used but not stored)
- Added indexes for faster lookups

## Critical Setup Steps

### Step 1: Run the Database Migration
You **MUST** run this migration on your Supabase database:

```sql
ALTER TABLE jira_oauth_pkce 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

ALTER TABLE jira_oauth_pkce
ADD COLUMN IF NOT EXISTS origin_hostname TEXT;

CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_supabase_user_id 
ON jira_oauth_pkce(supabase_user_id);

CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_origin_hostname 
ON jira_oauth_pkce(origin_hostname);
```

Or use the migration file: `supabase-migrations/add_origin_hostname_to_pkce.sql`

### Step 2: Register Both Domains in Jira OAuth App
**This is the most critical step!** You must register BOTH redirect URIs in your Jira OAuth app:

1. Go to Jira: https://developer.atlassian.com/apps/
2. Find your OAuth app
3. Under "Authorization" → "Redirect URL(s)", add BOTH:
   - `https://www.joinvelocity.co/api/jira/auth/callback`
   - `https://velocitydevelopment.vercel.app/api/jira/auth/callback`
   - (If you have other domains) `https://your-other-domain.com/api/jira/auth/callback`

**Without both URLs registered, Jira will reject the redirect!**

### Step 3: Deploy the Updated Code
Deploy the changes:
- `src/api/jira/auth.ts` - Updated auth logic
- Run database migration on Supabase

## How It Now Works

### Sign-in Flow (Velocitydevelopment)
1. User on `velocitydevelopment.vercel.app` clicks "Sign in with Jira"
2. `login()` captures `originHostname = "velocitydevelopment.vercel.app"`
3. PKCE state stored in database with origin hostname
4. `redirect_uri` = `https://velocitydevelopment.vercel.app/api/jira/auth/callback`
5. User redirected to Jira auth
6. Jira redirects back to `velocitydevelopment.vercel.app/api/jira/auth/callback`
7. `callback()` retrieves PKCE state + stored origin hostname
8. Token exchange uses origin hostname to build matching `redirect_uri`
9. User redirected back to `https://velocitydevelopment.vercel.app/velocity-ai`

### Sign-in Flow (Joinvelocity.co)
Same process but with `joinvelocity.co` domains throughout.

## Testing the Fix

### Test 1: Sign in from Velocitydevelopment
1. Go to `https://velocitydevelopment.vercel.app`
2. Click "Sign in with Jira"
3. Complete Jira auth
4. You should be redirected to `velocitydevelopment.vercel.app/velocity-ai` ✓

### Test 2: Sign in from Joinvelocity
1. Go to `https://www.joinvelocity.co`
2. Click "Sign in with Jira"
3. Complete Jira auth
4. You should be redirected to `www.joinvelocity.co/velocity-ai` ✓

## Troubleshooting

### Still getting "PKCE verification failed"?

1. **Check Jira OAuth app settings**:
   - Are both domains registered as redirect URIs?
   - Wait 30 seconds for changes to propagate

2. **Check database migration**:
   - Did the migration run? Check Supabase table structure
   - `SELECT * FROM jira_oauth_pkce LIMIT 1;` should show the new columns

3. **Check logs**:
   - Look for `[Jira OAuth Callback] Retrieving PKCE with state`
   - Check if `originHostname` is being stored and retrieved

4. **Clear browser data**:
   - Clear cookies for both domains
   - Try again

### "State parameter not found" error?

This means the PKCE wasn't stored properly. Check:
- Is Supabase connection working? (`SUPABASE_URL` and `SUPABASE_ANON_KEY` set?)
- Are the new columns in the table?
- Check server logs for storage errors

## Files Changed

- ✅ `src/api/jira/auth.ts` - Updated OAuth flow
- ✅ `supabase-migrations/add_origin_hostname_to_pkce.sql` - New migration

## Environment Variables (No New Ones Required)
- All existing Jira OAuth env vars still work
- Optional: `JIRA_OAUTH_REDIRECT_URI` - can override default if needed

## Session Cookie Configuration
The session cookie domain is set to `.joinvelocity.co` in production, which allows subdomains to share sessions. The PKCE storage in Supabase ensures cross-domain consistency.

## Additional Notes
- PKCE data is one-time-use and deleted after successful verification
- PKCE entries auto-expire after 15 minutes
- Both in-memory (local dev) and database (production) storage are supported
- The fix is backward compatible with existing code
