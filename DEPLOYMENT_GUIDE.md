# Deployment Guide for joinvelocity.co

## Overview
This application works in both development and production environments. The Jira OAuth flow is fully configured to work seamlessly.

## Development (localhost)

### 1. Start the API server
```bash
npm run api
```
Runs on `http://localhost:4000`

### 2. Start the frontend (in another terminal)
```bash
npm run dev
```
Runs on `http://localhost:5173`

### 3. Jira OAuth Flow
- When you click "Connect Jira", you're redirected to Atlassian
- After auth, redirects back to `http://localhost:4000/api/jira/auth/callback`
- Session is saved and frontend redirects to dashboard

## Production Deployment on Vercel

### Step 1: Update Jira OAuth App
1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/)
2. Select your app
3. Update the **Authorization callback URL**:
   - From: `http://localhost:4000/api/jira/auth/callback`
   - To: `https://www.joinvelocity.co/api/jira/auth/callback`

### Step 2: Set Up Redis (Optional but Recommended)
For session persistence in production, you need Redis. Use [Upstash](https://upstash.com/):

1. Create a free Upstash Redis instance
2. Get your connection credentials:
   - `REDIS_URL` (or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`)

### Step 3: Vercel Environment Variables
In your Vercel dashboard, set:

**Settings → Environment Variables**

```
NODE_ENV = production
API_PORT = 4000
FRONTEND_URL_PROD = https://www.joinvelocity.co

# Jira OAuth
JIRA_OAUTH_CLIENT_ID = oqZpY1dsQwpJFhaFhRZLScSMO60CtSDb
JIRA_OAUTH_CLIENT_SECRET = ATOA2wlfjO5hefmbR79aLnMqjTGPvmZCOCFxVAxx_401Bzzlt6r8eYVOj_k0uNcMoB2ZFA4740CC
JIRA_OAUTH_REDIRECT_URI_PROD = https://www.joinvelocity.co/api/jira/auth/callback

# Session (Generate a strong random secret)
SESSION_SECRET = [GENERATE_STRONG_RANDOM_VALUE]

# Redis (if using Upstash)
REDIS_URL = redis://:your-password@your-host:your-port
# OR
# REDIS_HOST = your-host
# REDIS_PORT = 6379
# REDIS_PASSWORD = your-password

# All other env vars from .env.production
```

### Step 4: Configure Vercel Build
Create or update `vercel.json`:

```json
{
  "buildCommand": "npm install && npm run build",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "API_PORT": "4000"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "http://localhost:4000/api/$1"
    }
  ]
}
```

### Step 5: Update DNS/Domain
Ensure your domain `joinvelocity.co` points to Vercel:
1. Go to your domain registrar
2. Update nameservers to Vercel's DNS
3. Or create CNAME records pointing to Vercel

### Step 6: Deploy
```bash
git push origin main
```
Vercel will automatically deploy when you push to main.

## How OAuth Works

### Development Flow
1. User clicks "Connect Jira"
2. Redirected to: `https://auth.atlassian.com/authorize?...&redirect_uri=http://localhost:4000/api/jira/auth/callback`
3. After auth at Atlassian, redirected to `http://localhost:4000/api/jira/auth/callback`
4. Server validates auth code and exchanges for access token
5. Session is saved with `jiraAccessibleResources` and `jiraCloudId`
6. Redirects to frontend: `http://localhost:5173/projects/jira-dashboard?connected=true`
7. Frontend loads from `/api/jira/auth/status` and displays projects

### Production Flow
1. User clicks "Connect Jira"
2. Redirected to: `https://auth.atlassian.com/authorize?...&redirect_uri=https://www.joinvelocity.co/api/jira/auth/callback`
3. After auth at Atlassian, redirected to `https://www.joinvelocity.co/api/jira/auth/callback`
4. Same flow as above, but with HTTPS and Redis session storage
5. Redirects to: `https://www.joinvelocity.co/projects/jira-dashboard?connected=true`

## Session Storage

### Development
- Uses in-memory session store (data lost on server restart)
- Cookies are `HttpOnly` and `SameSite=lax`

### Production
- Uses Redis session store (persistent across deployments)
- Cookies are `Secure`, `HttpOnly`, and `SameSite=none` (required for HTTPS OAuth)
- Sessions last 24 hours

## Troubleshooting

### "No Jira sites loaded"
- Check Redis connection (if using)
- Verify session cookies are being sent (F12 → Application → Cookies)
- Check server logs for session errors

### OAuth redirect fails
- Confirm redirect URI in Atlassian Developer Console matches your deployment URL
- Check CORS settings (should allow your domain)
- Verify `JIRA_OAUTH_CLIENT_ID` and `JIRA_OAUTH_CLIENT_SECRET` are set correctly

### Session not persisting
- If development: Sessions are in-memory, lost on server restart
- If production: Check Redis connection and credentials
- Verify `SESSION_SECRET` is set

## Files Modified for Production
- `server.ts` - Added Redis support, environment detection
- `src/lib/api.ts` - Uses relative URLs in production
- `src/api/jira/auth.ts` - Dynamic redirect URL
- `package.json` - Added redis and connect-redis
- `.env` - Updated API_PORT to 4000
- `vite.config.ts` - Proxy updated to port 4000

## Next Steps
1. ✅ Update Jira OAuth app redirect URI
2. ✅ Set up Redis with Upstash
3. ✅ Add environment variables to Vercel
4. ✅ Deploy to Vercel
5. ✅ Test OAuth flow on production domain
