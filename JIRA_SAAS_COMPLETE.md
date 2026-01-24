# 🚀 Jira Multi-Tenant SaaS Integration - COMPLETE

## What Changed?

Your Velocity AI platform now supports **true multi-tenant Jira authentication**! Each user can connect their own Jira account instead of sharing one hardcoded credential.

## 🎯 Before vs After

### ❌ Before (Single-Tenant)
```env
# Everyone shares these credentials
JIRA_DOMAIN=company.atlassian.net
JIRA_EMAIL=admin@company.com
JIRA_API_TOKEN=hardcoded-token
JIRA_PROJECT_KEY=PROJ
```
- All users see the same Jira data
- Can't scale to multiple customers
- Security risk with shared credentials
- Not a real SaaS

### ✅ After (Multi-Tenant SaaS)
```env
# OAuth configuration only
JIRA_OAUTH_CLIENT_ID=your-client-id
JIRA_OAUTH_CLIENT_SECRET=your-client-secret
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback
```
- Each user connects their own Jira account
- Works like Slack, GitHub, Google Drive integrations
- Proper OAuth 2.0 security
- **True SaaS architecture** ✨

## 🏗️ Architecture Overview

```
User → Click "Connect Jira" 
    → Redirected to Atlassian OAuth
    → User logs in with their Jira account
    → Grants permissions
    → Redirected back to your app
    → User-specific token stored in session
    → User can now access their Jira data!
```

## 📁 New Files Created

1. **`src/api/jira/auth.ts`** - OAuth 2.0 authentication flow
   - PKCE implementation for security
   - Automatic token refresh
   - Multi-site support
   - Session-based token storage

2. **`src/api/jira/routes.ts`** - Multi-tenant API endpoints
   - `/api/jira/auth/connect` - Start OAuth
   - `/api/jira/auth/callback` - OAuth callback
   - `/api/jira/auth/status` - Check connection
   - `/api/jira/issues` - Fetch user's issues
   - `/api/jira/projects` - List user's projects

3. **`docs/JIRA_OAUTH_SETUP.md`** - Complete setup guide

## 🔧 Files Modified

1. **`api/index.ts`** - Added Jira routes
2. **`server.ts`** - Added Jira routes
3. **`src/components/demo2/IntegrationsTab.tsx`** - Updated to use OAuth
4. **`src/components/demo2/SecurityAuditTab.tsx`** - Updated to use OAuth
5. **`src/pages/JiraDashboard.tsx`** - Now fetches user-specific data

## 🚀 Setup Instructions

### Step 1: Create Jira OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **Create** → **OAuth 2.0 integration**
3. Name: "Velocity AI" (or your app name)
4. Add permissions:
   - `read:jira-work`
   - `read:jira-user`
   - `offline_access`
5. Add callback URL: `http://localhost:4000/api/jira/auth/callback`
6. Copy your **Client ID** and **Client Secret**

### Step 2: Update Environment Variables

Add to your `.env`:

```env
# Remove old single-tenant config (optional, keep for backward compatibility)
# JIRA_DOMAIN=...
# JIRA_EMAIL=...
# JIRA_API_TOKEN=...

# Add new OAuth config
JIRA_OAUTH_CLIENT_ID=your-client-id-from-atlassian
JIRA_OAUTH_CLIENT_SECRET=your-client-secret-from-atlassian
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback

# Ensure session secret is set
SESSION_SECRET=your-secure-random-string-min-32-chars
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test It!

1. Open your app in browser
2. Go to **Integrations** or **Security Audit** tab
3. Click **Connect** on Jira integration
4. You'll be redirected to Atlassian login
5. Sign in with your Jira account
6. Grant permissions
7. Redirected back → **Connected!** 🎉

## 🔐 Security Features

- **OAuth 2.0 with PKCE** - Industry-standard secure authentication
- **HTTPOnly Cookies** - Session tokens protected from XSS
- **Automatic Token Refresh** - Seamless user experience
- **Per-User Isolation** - Each user only sees their data
- **Encrypted Storage** - Ready for production database encryption

## 📊 How It Works

### User Flow
```
1. User clicks "Connect Jira"
2. → GET /api/jira/auth/connect
3. → Redirect to Atlassian OAuth (https://auth.atlassian.com/authorize)
4. User logs in and grants permissions
5. → Atlassian redirects to /api/jira/auth/callback?code=...
6. → Exchange code for access token + refresh token
7. → Fetch user's accessible Jira sites
8. → Store tokens in session (linked to user)
9. → Redirect to dashboard with success message
```

### Data Access Flow
```
1. User requests /api/jira/issues?projectKey=PROJ
2. → Check session for user's tokens
3. → If expired, refresh automatically
4. → Make request to Jira API with user's token
5. → Return user's data (not shared data)
```

## 🎨 Frontend Integration

The frontend components already updated to use OAuth:

### Integrations Tab
```tsx
case 'jira':
  // Now redirects to OAuth instead of showing config alert
  window.location.href = '/api/jira/auth/connect';
  break;
```

### Security Audit Tab
```tsx
if (id === 'jira') {
  // Redirect to Jira OAuth login
  window.location.href = '/api/jira/auth/connect';
  return;
}
```

### Jira Dashboard
```tsx
// Now includes authentication handling
const response = await fetch(url, {
  credentials: 'include', // Include session cookies
})

if (response.status === 401) {
  alert('Please connect your Jira account first.')
  window.location.href = '/api/jira/auth/connect'
}
```

## 🌐 Production Deployment

### 1. Update Callback URL in Atlassian Console
Add production callback:
```
https://yourdomain.com/api/jira/auth/callback
```

### 2. Update Environment Variables
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/api/jira/auth/callback
```

### 3. Use Database for Token Storage

**Important**: The current implementation uses in-memory storage. For production:

```typescript
// Replace in-memory Map with database
// Example with Supabase
const jiraTokens = {
  async set(userId: string, tokens: TokenStore) {
    await supabase.from('jira_tokens').upsert({
      user_id: userId,
      access_token: encrypt(tokens.accessToken),
      refresh_token: encrypt(tokens.refreshToken),
      expires_at: new Date(tokens.expiresAt),
      cloud_id: tokens.cloudId,
    })
  },
  async get(userId: string) {
    const { data } = await supabase
      .from('jira_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  }
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Can click "Connect Jira" button
- [ ] Redirected to Atlassian login page
- [ ] Can sign in with Jira account
- [ ] Can grant permissions
- [ ] Redirected back to app successfully
- [ ] Connection status shows "Connected"
- [ ] Can fetch projects from user's account
- [ ] Can fetch issues from user's projects
- [ ] Can disconnect and reconnect
- [ ] Token refresh works automatically

### API Endpoints to Test
```bash
# Check connection status
curl http://localhost:4000/api/jira/auth/status \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Fetch projects (requires auth)
curl http://localhost:4000/api/jira/projects \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Fetch issues (requires auth)
curl "http://localhost:4000/api/jira/issues?projectKey=PROJ" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Disconnect
curl -X POST http://localhost:4000/api/jira/auth/disconnect \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## 🎯 Benefits

### For You (Developer)
- ✅ True SaaS architecture
- ✅ Industry-standard OAuth implementation
- ✅ Scalable to unlimited users
- ✅ No credential management hassle
- ✅ Better security posture
- ✅ Ready for enterprise customers

### For Your Users
- ✅ Use their own Jira accounts
- ✅ Respect their permissions
- ✅ No shared credentials
- ✅ Easy connect/disconnect
- ✅ Familiar OAuth flow (like Google, GitHub, etc.)

### For Your Business
- ✅ Can sell to multiple companies
- ✅ Each customer has isolated data
- ✅ No compliance issues with shared accounts
- ✅ Professional SaaS product
- ✅ Can pass security audits

## 🔄 Migration from Old System

If you want to keep backward compatibility with the old API token system:

The old endpoints (`/api/issues`, `/api/projects`) still work with the legacy env vars. New endpoints (`/api/jira/*`) use OAuth.

You can:
1. **Option A**: Keep both (gradual migration)
2. **Option B**: Remove old endpoints entirely
3. **Option C**: Add auto-migration for existing users

## 📝 Similar Integrations

Want to do the same for other services?

### Asana OAuth
- Similar pattern to Jira
- Create `src/api/asana/auth.ts`
- Use Asana OAuth 2.0

### Zapier OAuth
- OAuth 2.0 with scopes
- Webhook subscriptions
- Real-time event streaming

## 🆘 Troubleshooting

### "Missing authorization code"
- Check callback URL matches exactly
- Ensure session middleware is loaded

### "No Jira sites accessible"
- User's account doesn't have access to any Jira
- Permissions not granted properly
- Scopes missing in app settings

### Tokens not persisting
- Check SESSION_SECRET is set
- Verify cookies are being sent (credentials: 'include')
- Check browser isn't blocking cookies

### "CORS error"
- Ensure API and frontend origins match CORS config
- Check credentials: true in both CORS and fetch

## 📚 Next Steps

1. ✅ **Test thoroughly** in development
2. ✅ **Create Atlassian OAuth app** for production
3. ✅ **Implement database token storage** (replace in-memory Map)
4. ✅ **Add user account management** (link Jira to user profiles)
5. ✅ **Monitor token refresh** and handle edge cases
6. ✅ **Add webhook support** for real-time updates (optional)
7. ✅ **Implement multi-site selection** if users have multiple Jira sites

## 🎉 Success!

Your Jira integration is now a **true multi-tenant SaaS solution**! Each user can connect their own Jira account, just like connecting Slack, Google, or GitHub.

Questions? Check `docs/JIRA_OAUTH_SETUP.md` for detailed setup instructions.

---

**Built with**: OAuth 2.0, PKCE, Express Sessions, TypeScript, Jira Cloud API v3
