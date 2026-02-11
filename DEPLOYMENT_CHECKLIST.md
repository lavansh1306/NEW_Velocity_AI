# Jira OAuth Deployment Checklist

## Before Deployment to Production

### 1. Supabase Configuration

- [ ] Created `jira_oauth_pkce` table (run SQL migration)
- [ ] Verified RLS policies allow anonymous access
- [ ] Tested that table is accessible with `SUPABASE_ANON_KEY`
- [ ] Verified `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel env vars

### 2. Jira OAuth App Setup

- [ ] Created OAuth app at https://developer.atlassian.com/apps
- [ ] Registered **both** redirect URIs:
  - `http://localhost:4000/api/jira/auth/callback`
  - `https://www.joinvelocity.co/api/jira/auth/callback`
- [ ] Copied **Client ID** and **Client Secret**
- [ ] Verified requested scopes include:
  - `read:jira-work`
  - `read:jira-user`
  - `read:issue:jira`
  - `read:project:jira`
  - `offline_access`

### 3. Environment Variables

#### Development (.env or .env.local)
- [ ] `JIRA_OAUTH_CLIENT_ID` set
- [ ] `JIRA_OAUTH_CLIENT_SECRET` set
- [ ] `JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback`
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `NODE_ENV=development`
- [ ] `API_PORT=4000`
- [ ] `SESSION_SECRET` set to something secure

#### Production (Vercel Dashboard)
- [ ] `JIRA_OAUTH_CLIENT_ID` set (same as dev)
- [ ] `JIRA_OAUTH_CLIENT_SECRET` set (same as dev)
- [ ] `JIRA_OAUTH_API_URL_PROD=https://www.joinvelocity.co`
- [ ] `JIRA_OAUTH_REDIRECT_URI=https://www.joinvelocity.co/api/jira/auth/callback`
- [ ] `SUPABASE_URL` set (same as dev)
- [ ] `SUPABASE_ANON_KEY` set (same as dev)
- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` set to a strong random string (different from dev)
- [ ] `FRONTEND_URL_PROD=https://www.joinvelocity.co`

### 4. Code Review

- [ ] Verified `src/api/jira/auth.ts` uses `storePKCEInDatabase()` in `login()`
- [ ] Verified `src/api/jira/auth.ts` uses `retrievePKCEFromDatabase()` in `callback()`
- [ ] Verified routes are mounted in `server.ts`: `app.use('/api/jira', jiraRoutes)`
- [ ] Verified `src/api/jira/routes.ts` has callback route: `router.get('/auth/callback', jiraAuth.callback)`

### 5. Local Testing

```bash
# Start API server
npm run api
# Should log: [Jira OAuth] Redirecting to Jira: https://auth.atlassian.com/authorize?...

# In browser, go to:
# http://localhost:5173/velocity-ai
# Click "Connect Jira"
# Should be redirected to Jira auth page
# After authorization, should redirect back to dashboard
```

### 6. Pre-Deployment Testing

- [ ] Test full OAuth flow in development:
  - [ ] Click "Connect Jira"
  - [ ] Authorize in Jira
  - [ ] Verify redirected to dashboard
  - [ ] Verify Jira projects/issues load
- [ ] Check server logs for errors:
  - [ ] Look for `[Jira OAuth]` messages
  - [ ] No "PKCE not found" errors
  - [ ] No Supabase connection errors

### 7. Deployment

```bash
# Push to GitHub
git add .
git commit -m "Fix: Jira OAuth PKCE storage with Supabase for serverless compatibility"
git push

# Vercel will auto-deploy from the repository
# Verify deployment completed successfully in Vercel dashboard
```

### 8. Post-Deployment Testing

- [ ] Test production OAuth flow (within 5 minutes of deployment):
  - [ ] Go to https://www.joinvelocity.co
  - [ ] Click "Connect Jira"
  - [ ] Verify redirected to Jira auth page
  - [ ] Authorize and verify redirect back  
  - [ ] Verify Jira projects/issues load
- [ ] Monitor Vercel logs for errors:
  - [ ] Go to Vercel project dashboard
  - [ ] Check "Deployments" > latest > "Logs"
  - [ ] Look for any 400/500 errors
- [ ] Monitor Supabase logs:
  - [ ] Check Supabase dashboard for any database errors
  - [ ] Verify `jira_oauth_pkce` table has entries during flow

### 9. Rollback Plan

If production deployment fails:

```bash
# Option 1: Revert to previous commit
git revert HEAD
git push

# Option 2: Temporarily disable Jira OAuth in UI
# Comment out the "Connect Jira" button in the UI

# Option 3: Check Vercel environment variables
# Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
```

## Debugging Production Issues

### Check Vercel Logs
```bash
# View real-time logs
vercel logs --follow https://api.joinvelocity.co

# Or through Vercel dashboard:
# Project Settings > Deployments > [latest] > Logs
```

### Check Supabase
1. Go to Supabase dashboard
2. Check `jira_oauth_pkce` table
3. Verify rows are being inserted during OAuth flow
4. Check for RLS policy errors in logs

### Common Issues

**400 Bad Request on Callback**
- Check Supabase table exists
- Verify PKCE state is stored during login
- Check if row exists with the state from error logs

**Redirect URI Mismatch**
- Verify Jira OAuth app has BOTH redirect URIs registered
- Check JIRA_OAUTH_REDIRECT_URI env var in Vercel
- Verify production domain is `https://www.joinvelocity.co`

**Session Not Persisting**
- In production, sessions use in-memory store by default
- For production reliability, configure Redis or Supabase session store
- Current limitation: User loses session if Vercel function restarts

## Post-Deployment Maintenance

### Weekly
- [ ] Monitor Supabase for orphaned PKCE records
- [ ] Check Vercel error rates
- [ ] Verify Jira OAuth token refresh working

### Monthly
- [ ] Review Jira OAuth app usage in developer dashboard
- [ ] Rotate `SESSION_SECRET` if needed
- [ ] Update Jira OAuth app scopes if needed

### Quarterly
- [ ] Audit Supabase security and access
- [ ] Review and update environment variables
- [ ] Test full OAuth flow end-to-end
