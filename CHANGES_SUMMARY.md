# Changes Made for Development & Production OAuth Support

## Summary
The Jira OAuth flow now works seamlessly in both development (localhost:4000) and production (joinvelocity.co).

## Files Changed

### 1. **server.ts**
- ✅ Added optional Redis session store support
- ✅ Falls back to memory store if Redis unavailable (for dev)
- ✅ Updated CORS to include localhost:4000
- ✅ Changed default API_PORT to 4000
- ✅ Added environment logging

### 2. **src/lib/api.ts**
- ✅ Updated to use localhost:4000 for development
- ✅ Uses relative URLs (same domain) for production

### 3. **vite.config.ts**
- ✅ Updated Vite proxy to forward /api requests to localhost:4000

### 4. **src/api/jira/auth.ts**
- ✅ Dynamic redirect URL based on NODE_ENV
- ✅ Uses FRONTEND_URL_PROD for production redirects

### 5. **src/api/jira/routes.ts**
- ✅ Added debug logging to auth/status endpoint

### 6. **src/lib/dataService.ts**
- ✅ Added comprehensive error logging for project fetching

### 7. **src/pages/Projects.tsx**
- ✅ Added console logging for debugging project loading

### 8. **.env**
- ✅ Updated API_PORT to 4000
- ✅ Kept JIRA_OAUTH_REDIRECT_URI_LOCAL and _PROD separate

### 9. **package.json**
- ✅ Added `redis` (^4.6.13) dependency
- ✅ Added `connect-redis` (^7.1.0) dependency

### 10. **New Files Created**
- ✅ `.env.production` - Template for production env vars
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- ✅ This summary file

## How It Works Now

### Development (localhost)
```
Frontend (5173) → Vite Proxy → API (4000)
    ↓
Jira OAuth
    ↓
Redirect: http://localhost:4000/api/jira/auth/callback
    ↓
Session saved (in-memory)
    ↓
Redirect: http://localhost:5173/projects/jira-dashboard
```

### Production (joinvelocity.co)
```
Frontend (HTTPS) → Same domain proxy → API (4000)
    ↓
Jira OAuth
    ↓
Redirect: https://www.joinvelocity.co/api/jira/auth/callback
    ↓
Session saved (Redis)
    ↓
Redirect: https://www.joinvelocity.co/projects/jira-dashboard
```

## Session Management

### Development
- **Store**: In-memory (default Node session)
- **Cookies**: `SameSite=lax`, `Secure=false` (localhost)
- **Persistence**: Lost on server restart

### Production
- **Store**: Redis (if REDIS_URL/REDIS_HOST set)
- **Fallback**: In-memory if Redis unavailable
- **Cookies**: `SameSite=none`, `Secure=true` (HTTPS)
- **Persistence**: 24 hours in Redis

## Configuration Hierarchy

```
NODE_ENV=production?
  ├─ YES → Use HTTPS, SameSite=none, require Redis
  └─ NO → Use HTTP, SameSite=lax, in-memory sessions
```

## Environment Variables Needed for Production

**Required:**
- `JIRA_OAUTH_CLIENT_ID`
- `JIRA_OAUTH_CLIENT_SECRET`
- `JIRA_OAUTH_REDIRECT_URI_PROD`
- `SESSION_SECRET` (strong random value)
- `FRONTEND_URL_PROD`

**Optional but Recommended:**
- `REDIS_URL` (or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`)

## Testing Checklist

### Development
- [ ] Run `npm run api` - Server starts on :4000
- [ ] Run `npm run dev` - Frontend starts on :5173
- [ ] Click "Connect Jira"
- [ ] Complete Atlassian login
- [ ] Redirected to dashboard with projects loaded
- [ ] F12 → Network tab shows session cookie in `/api/jira/auth/status`

### Production
- [ ] Update Jira OAuth app redirect URI to prod domain
- [ ] Set all env vars in Vercel
- [ ] Deploy to Vercel
- [ ] Visit `https://www.joinvelocity.co`
- [ ] Click "Connect Jira"
- [ ] Complete Atlassian login
- [ ] Redirected to dashboard with projects loaded
- [ ] Check Redis has session data (optional)

## Rollback

If issues arise, the old configuration is still available:
- Change `API_PORT` back to 3000
- Update `vite.config.ts` proxy back to 3000
- Update `src/lib/api.ts` to use 3000

But with these changes, everything should work out of the box!
