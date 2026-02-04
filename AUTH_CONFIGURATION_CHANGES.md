# Authentication Configuration Changes for Production Deployment

## Summary
Updated authentication system to support both **localhost development** and **https://www.joinvelocity.co production** environments.

---

## Changes Made

### 1. **.env File** - Environment-Specific OAuth URIs
**File:** [.env](.env)

**Changes:**
- **Jira OAuth**: Split single redirect URI into environment-specific values
  - `JIRA_OAUTH_REDIRECT_URI_LOCAL` → `http://localhost:3000/api/jira/auth/callback`
  - `JIRA_OAUTH_REDIRECT_URI_PROD` → `https://www.joinvelocity.co/api/jira/auth/callback`

- **Microsoft 365 OAuth**: Split redirect URI into two environment-specific values
  - `MS_REDIRECT_URI_LOCAL` → `http://localhost:5173/auth/callback`
  - `MS_REDIRECT_URI_PROD` → `https://www.joinvelocity.co/auth/callback`

- **HubSpot OAuth**: Split redirect URI into two environment-specific values
  - `HUBSPOT_REDIRECT_URI_LOCAL` → `http://localhost:5173/oauth/hubspot/callback`
  - `HUBSPOT_REDIRECT_URI_PROD` → `https://www.joinvelocity.co/oauth/hubspot/callback`

- **Frontend URLs**: Added separate URLs for both environments
  - `FRONTEND_URL_LOCAL` → `http://localhost:5173`
  - `FRONTEND_URL_PROD` → `https://www.joinvelocity.co`

---

### 2. **AuthContext.tsx** - Google OAuth Environment Detection
**File:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

**Changes:**
- Modified `signInWithGoogle()` function to detect environment and use appropriate redirect URL
- Uses Vite's `import.meta.env.DEV` to determine if running in development
- Development: Redirects to `window.location.origin/` (localhost:5173)
- Production: Redirects to `https://www.joinvelocity.co/`

```tsx
const signInWithGoogle = async () => {
  const redirectUrl = import.meta.env.DEV
    ? `${window.location.origin}/`
    : 'https://www.joinvelocity.co/';
  // ... rest of implementation
};
```

---

### 3. **server.ts** - CORS Configuration Update
**File:** [server.ts](server.ts#L39-L45)

**Changes:**
- Updated CORS origin configuration to use environment-specific URLs
- Production: Uses `FRONTEND_URL_PROD`
- Development: Allows both `localhost:5173` and `localhost:3000`

---

### 4. **api/jira/auth.ts** - Jira OAuth Redirect URI
**File:** [api/jira/auth.ts](api/jira/auth.ts#L7-L14)

**Changes:**
- Modified `getRedirectUri()` function to check `NODE_ENV`
- Production (`NODE_ENV=production`): Returns `JIRA_OAUTH_REDIRECT_URI_PROD`
- Development: Returns `JIRA_OAUTH_REDIRECT_URI_LOCAL`

---

### 5. **src/api/microsoft365/auth.ts** - Microsoft 365 OAuth Redirect URI
**File:** [src/api/microsoft365/auth.ts](src/api/microsoft365/auth.ts#L21-L30)

**Changes:**
- Modified `getRedirectUri()` function to check `NODE_ENV`
- Production: Returns `MS_REDIRECT_URI_PROD`
- Development: Returns `MS_REDIRECT_URI_LOCAL`

---

### 6. **src/api/hubspot/auth.ts** - HubSpot OAuth Redirect URI
**File:** [src/api/hubspot/auth.ts](src/api/hubspot/auth.ts#L22-L31)

**Changes:**
- Modified `getRedirectUri()` function to check `NODE_ENV`
- Production: Returns `HUBSPOT_REDIRECT_URI_PROD`
- Development: Returns `HUBSPOT_REDIRECT_URI_LOCAL`

---

## Next Steps for Production Deployment

### 1. Update OAuth Provider Dashboards

**Google Cloud Console** (for Google OAuth):
1. Navigate to **Credentials**
2. Click your OAuth 2.0 credential
3. Add to **Authorized JavaScript origins**:
   - `https://www.joinvelocity.co`
4. Add to **Authorized redirect URIs**:
   - `https://www.joinvelocity.co/`

**Supabase** (if using Google OAuth via Supabase):
1. Go to **Authentication** > **URL Configuration**
2. Add `https://www.joinvelocity.co` as allowed redirect URL
3. Go to **Providers** > **Google**
4. Update redirect URLs to include production domain

**Microsoft Azure AD**:
1. Go to **App registrations** > Your app
2. Add to **Redirect URIs**:
   - `https://www.joinvelocity.co/auth/callback`

**HubSpot OAuth App**:
1. Go to your app settings
2. Add to **Redirect URIs**:
   - `https://www.joinvelocity.co/oauth/hubspot/callback`

**Jira OAuth App**:
1. Go to your Jira OAuth configuration
2. Add to **Redirect URLs**:
   - `https://www.joinvelocity.co/api/jira/auth/callback`

### 2. Set Production Environment Variables

Before deploying to production, ensure:
```env
NODE_ENV=production
FRONTEND_URL_PROD=https://www.joinvelocity.co
JIRA_OAUTH_REDIRECT_URI_PROD=https://www.joinvelocity.co/api/jira/auth/callback
MS_REDIRECT_URI_PROD=https://www.joinvelocity.co/auth/callback
HUBSPOT_REDIRECT_URI_PROD=https://www.joinvelocity.co/oauth/hubspot/callback
```

### 3. Test Authentication Flow

**Local Testing**:
```bash
NODE_ENV=development npm run dev
# Test with http://localhost:5173
```

**Production Testing**:
```bash
NODE_ENV=production npm run build
npm run preview
# Verify with https://www.joinvelocity.co
```

### 4. HTTPS Requirements

All OAuth providers require HTTPS for production:
- ✅ `https://www.joinvelocity.co` - Already HTTPS
- ✅ All redirect URIs must use HTTPS in production
- ✅ Cookies use `Secure` flag in production (already configured in server.ts)

---

## Environment Detection Logic

### Frontend (Vite)
```tsx
import.meta.env.DEV  // true in development, false in production
import.meta.env.PROD // true in production, false in development
```

### Backend (Node.js)
```ts
process.env.NODE_ENV // 'development' or 'production'
```

---

## Troubleshooting

### "Redirect URI mismatch" Error
- Verify the redirect URI registered in OAuth provider matches the one in `.env`
- Ensure `NODE_ENV` is correctly set
- Check browser console for actual redirect URL being used

### CORS Error
- Verify frontend URL is in CORS whitelist in `server.ts`
- Check if running on correct port (5173 for frontend, 3000 for backend)

### Localhost OAuth Not Working
- Ensure using `http://` (not `https://`) for localhost URIs
- Verify `NODE_ENV=development` is set
- Check that OAuth provider allows localhost URLs

---

## Security Notes

- 🔒 All production OAuth redirects use HTTPS
- 🔒 Session cookies use `Secure` flag in production
- 🔒 PKCE flow implemented for Jira OAuth (prevents authorization code interception)
- 🔒 State parameter validation for all OAuth providers

