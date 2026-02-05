# Production Deployment Checklist for Jira OAuth

## Pre-Deployment (Local Testing)

- [ ] Run `npm install` to get redis and connect-redis packages
- [ ] Test locally: `npm run api` and `npm run dev` in separate terminals
- [ ] Verify Jira OAuth works: Projects load after connecting
- [ ] Check browser console for no errors
- [ ] Check server logs for [Redis] messages (should say "using memory store")

## Atlassian Developer Console Changes

- [ ] Go to https://developer.atlassian.com/console
- [ ] Select your Velocity AI app
- [ ] Go to **Authorization** section
- [ ] Update Redirect URL:
  - **Old**: `http://localhost:4000/api/jira/auth/callback`
  - **New**: `https://www.joinvelocity.co/api/jira/auth/callback`
- [ ] Save changes

## Vercel Setup

### Step 1: Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```
NODE_ENV = production
API_PORT = 4000
FRONTEND_URL_PROD = https://www.joinvelocity.co

JIRA_OAUTH_CLIENT_ID = oqZpY1dsQwpJFhaFhRZLScSMO60CtSDb
JIRA_OAUTH_CLIENT_SECRET = ATOA2wlfjO5hefmbR79aLnMqjTGPvmZCOCFxVAxx_401Bzzlt6r8eYVOj_k0uNcMoB2ZFA4740CC
JIRA_OAUTH_REDIRECT_URI_PROD = https://www.joinvelocity.co/api/jira/auth/callback

SESSION_SECRET = [GENERATE RANDOM: run `openssl rand -hex 32`]

MS_CLIENT_ID = 3ccacb24-9e41-4949-b6f8-6759cba468c3
MS_CLIENT_SECRET = gO68Q~_Ly7idwXpXZuu6d7ycvLkzVHdD2XN7Ubyh
MS_REDIRECT_URI_PROD = https://www.joinvelocity.co/auth/callback

HUBSPOT_CLIENT_ID = 1c10de2a-efbb-447a-a7d8-69b75e91180b
HUBSPOT_CLIENT_SECRET = 59a07a65-6201-4e0f-81d6-54ebae358dcd
HUBSPOT_REDIRECT_URI_PROD = https://www.joinvelocity.co/oauth/hubspot/callback

ASANA_TOKEN = 2/1212641939488917/1212641966117150:84b08b78698e96b74cc351ec34ad08f1
ASANA_PROJECT_ID = 1212641939726128

GEMINI_API_KEY = AIzaSyBCx6i6QDm1vRAHXQ_jdXk32K5tyvVezQg
AUTO_ASSIGN_ENABLED = true

VITE_SUPABASE_URL = https://igxolhrgcujwuexzokrd.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneG9saHJnY3Vqd3VleHpva3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzkzNDMsImV4cCI6MjA4NTcxNTM0M30.UDHf3yuQT1HHSZMrENkuxv-kk3B63hBSWDLlKOPxydU
VITE_GOOGLE_CLIENT_ID = 338259709581-i4pnl6ql03isiknr13uhctpqbgt5u60d.apps.googleusercontent.com
```

### Step 2: Optional Redis Setup (Recommended for Production)

For session persistence, use Upstash:

1. Go to https://upstash.com
2. Sign up (free tier available)
3. Create a new Redis database
4. Copy the connection URL
5. In Vercel, add environment variable:
   ```
   REDIS_URL = redis://:password@host:port
   ```

**Without Redis**: Sessions will be stored in memory (will be lost during deployments)

### Step 3: Deploy

```bash
git add .
git commit -m "feat: configure OAuth for production deployment"
git push origin main
```

Vercel will automatically deploy. Check the build logs for any errors.

## Post-Deployment Testing

- [ ] Visit https://www.joinvelocity.co
- [ ] Click "Connect Jira"
- [ ] Verify redirected to Atlassian login
- [ ] Login with your Atlassian account
- [ ] Verify redirected back to dashboard
- [ ] Verify Jira projects are displayed
- [ ] Check that session persists (refresh page)
- [ ] Disconnect and reconnect to test again

## Monitoring

Check for errors:
1. Vercel dashboard → Recent deployments → View logs
2. Vercel dashboard → Monitoring tab
3. Server logs for [Redis] or [Jira OAuth] messages

## Rollback

If production fails:
1. Revert commit: `git revert <commit-hash>`
2. Push: `git push origin main`
3. Vercel will auto-deploy previous version

## Common Issues

### "No Jira sites loaded" after reconnect
- Check Redis is running (if configured)
- Verify SESSION_SECRET is set in Vercel
- Check server logs for session errors
- Try clearing browser cookies and reconnecting

### OAuth redirect fails
- Verify Atlassian console redirect URI matches production domain
- Check Vercel env vars are set correctly
- Verify JIRA_OAUTH_CLIENT_ID and SECRET are correct
- Check server logs for 400/401 errors

### Session lost after page refresh
- Verify REDIS_URL is set in Vercel
- If using in-memory store: normal behavior (lost on deploy)
- Check Redis connection logs

## FAQ

**Q: Do I need Redis?**
A: No, but strongly recommended. Without it, sessions are lost during deployments.

**Q: Can I use the same Jira OAuth app for dev and prod?**
A: Yes, but you need two redirect URIs configured:
- `http://localhost:4000/api/jira/auth/callback` (dev)
- `https://www.joinvelocity.co/api/jira/auth/callback` (prod)

**Q: How do I generate SESSION_SECRET?**
A: Run: `openssl rand -hex 32` (or use a password manager to generate random 32-char string)

**Q: Will the OAuth work after deployment?**
A: Yes, all environment variables are set up correctly. Just follow the checklist!

## Success Criteria

✅ Deployment is successful when:
- Frontend loads at https://www.joinvelocity.co
- Jira OAuth "Connect" button works
- After OAuth, redirected to dashboard
- Projects are displayed
- Session persists across page refreshes
- No console errors in browser (F12)
- Server logs show [Jira OAuth Callback] Success message
