# Jira OAuth App Setup Guide

To enable multi-tenant Jira authentication, you need to create a Jira OAuth 2.0 app. Follow these steps:

## Step 1: Create an OAuth 2.0 App in Atlassian Developer Console

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **Create** → **OAuth 2.0 integration**
3. Name your app (e.g., "Velocity AI")
4. Click **Create**

## Step 2: Configure OAuth Settings

### Permissions
Add the following scopes:
- `read:jira-work` - Read Jira project and issue data
- `read:jira-user` - Read user information
- `offline_access` - Refresh tokens for long-term access

### Authorization Callback URL
Add your callback URL(s):
- **Development**: `http://localhost:4000/api/jira/auth/callback`
- **Production**: `https://yourdomain.com/api/jira/auth/callback`

## Step 3: Get Your Credentials

After creating the app, you'll see:
- **Client ID** - Copy this
- **Client Secret** - Copy this (shown only once, keep it secure!)

## Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Jira OAuth 2.0 Configuration (Multi-Tenant SaaS)
JIRA_OAUTH_CLIENT_ID=your-client-id-here
JIRA_OAUTH_CLIENT_SECRET=your-client-secret-here
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback

# For production, use:
# JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/api/jira/auth/callback
```

## Step 5: Test the Integration

1. Start your server: `npm run dev`
2. Navigate to your app
3. Go to Integrations or Security Audit
4. Click "Connect" on Jira
5. You'll be redirected to Atlassian login
6. Grant permissions
7. You'll be redirected back with a successful connection!

## Architecture

### How It Works
- **User-specific authentication**: Each user connects their own Jira account
- **OAuth 2.0 flow**: Secure token-based authentication with PKCE
- **Automatic token refresh**: Tokens are refreshed automatically before expiration
- **Multi-site support**: Users can access multiple Jira sites
- **Session-based storage**: Tokens stored in user sessions (use database for production)

### Security Features
- PKCE (Proof Key for Code Exchange) for enhanced security
- HTTPOnly cookies for session management
- Automatic token expiration and refresh
- No hardcoded credentials in environment

## Migrating from Old Single-Tenant Setup

### Old Setup (Single Account)
```env
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=admin@company.com
JIRA_API_TOKEN=hardcoded-token
JIRA_PROJECT_KEY=PROJ
```

**Problems:**
- All users share one account
- Cannot scale to multiple customers
- Security risk with shared credentials
- No user-specific permissions

### New Setup (Multi-Tenant SaaS)
```env
JIRA_OAUTH_CLIENT_ID=your-client-id
JIRA_OAUTH_CLIENT_SECRET=your-client-secret
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback
```

**Benefits:**
- Each user uses their own Jira account
- True SaaS multi-tenancy
- User-specific permissions respected
- More secure (OAuth 2.0 standard)
- Scalable to unlimited users

## Production Deployment

### Database Storage (Recommended)
For production, replace the in-memory token store with a database:

```typescript
// Example with Supabase/PostgreSQL
import { supabase } from './supabase'

export async function storeTokens(userId: string, tokens: TokenStore) {
  await supabase.from('jira_tokens').upsert({
    user_id: userId,
    access_token: encrypt(tokens.accessToken),
    refresh_token: encrypt(tokens.refreshToken),
    expires_at: new Date(tokens.expiresAt),
    cloud_id: tokens.cloudId,
  })
}
```

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=your-very-secure-random-secret-min-32-chars
JIRA_OAUTH_CLIENT_ID=your-production-client-id
JIRA_OAUTH_CLIENT_SECRET=your-production-client-secret
JIRA_OAUTH_REDIRECT_URI=https://yourdomain.com/api/jira/auth/callback
```

## Troubleshooting

### "Missing authorization code" Error
- Check that your callback URL matches exactly in Atlassian console
- Ensure session middleware is properly configured

### "No Jira sites accessible" Error
- User hasn't granted proper permissions
- User account doesn't have access to any Jira sites
- Scopes not properly configured in app settings

### Tokens Expiring Too Quickly
- Ensure `offline_access` scope is included
- Implement automatic token refresh (already included in auth.ts)

## API Endpoints

Once configured, these endpoints will be available:

- `GET /api/jira/auth/connect` - Start OAuth flow
- `GET /api/jira/auth/callback` - OAuth callback handler
- `POST /api/jira/auth/disconnect` - Disconnect user's Jira account
- `GET /api/jira/auth/status` - Check connection status
- `GET /api/jira/issues?projectKey=PROJ` - Fetch issues (requires auth)
- `GET /api/jira/projects` - List projects (requires auth)

## Testing Checklist

- [ ] OAuth app created in Atlassian console
- [ ] Client ID and Secret added to `.env`
- [ ] Callback URL matches in both places
- [ ] Scopes include `read:jira-work`, `read:jira-user`, `offline_access`
- [ ] Server restarted after env changes
- [ ] Can click "Connect Jira" button
- [ ] Redirected to Atlassian login
- [ ] Successfully redirect back after authorization
- [ ] Can fetch projects and issues with user's account
- [ ] Token refresh works automatically

## Support

For issues, check:
1. Console logs for detailed error messages
2. Atlassian Developer Console for app status
3. Network tab for failed API calls
4. Session cookies are being set properly
