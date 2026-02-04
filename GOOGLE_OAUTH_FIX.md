# Google OAuth Configuration Fix

## Problem
When logging in with Google, the user gets redirected back to the signup route instead of accessing the app.

## Root Cause
The Google OAuth redirect URL wasn't properly configured in **Supabase's URL Configuration**. When Supabase receives the auth callback from Google, it needs to know which URLs are valid redirect destinations.

## Issues Fixed

### 1. **Code Changes**
- Removed unnecessary `navigate('/')` calls after `signInWithGoogle()` 
- Added better logging to debug auth state changes
- Improved error handling for OAuth failures

### 2. **Key Fix: Supabase URL Configuration**
The redirect URL must be registered in Supabase, otherwise Google's callback is rejected.

---

## What You Need to Do

### Step 1: Configure Supabase URL Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Authentication**
4. Find **URL Configuration**
5. Add your redirect URLs:
   - For localhost: `http://localhost:5173`
   - For production: `https://www.joinvelocity.co`

**Screenshot example:**
```
Site URL: http://localhost:5173
Redirect URLs:
  - http://localhost:5173/
  - http://localhost:5173/**
  - https://www.joinvelocity.co/
  - https://www.joinvelocity.co/**
```

### Step 2: Verify Google OAuth Provider

1. In Supabase, go to **Authentication** → **Providers**
2. Click **Google** to expand
3. Ensure **Google is enabled**
4. You should see your Google OAuth credentials:
   - Client ID: `338259709581-i4pnl6ql03isiknr13uhctpqbgt5u60d.apps.googleusercontent.com`
   - Client Secret: (should be filled in)

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (VelocityAI)
4. Click to edit
5. Update **Authorized redirect URIs**:
   - Add: `https://igxolhrgcujwuexzokrd.supabase.co/auth/v1/callback` (your Supabase callback)
   - For localhost: `http://localhost:5173/` (your local app)
   - For production: `https://www.joinvelocity.co/`

**Note:** Supabase handles the OAuth callback at `https://igxolhrgcujwuexzokrd.supabase.co/auth/v1/callback`, which then redirects users back to your app.

---

## How Google OAuth Flow Works

```
1. User clicks "Sign in with Google" on localhost:5173
   ↓
2. App redirects to Google with:
   - Client ID
   - Redirect URI: http://localhost:5173/ (or production URL)
   ↓
3. User authenticates with Google
   ↓
4. Google redirects to Supabase callback with auth code
   → https://igxolhrgcujwuexzokrd.supabase.co/auth/v1/callback?code=...
   ↓
5. Supabase exchanges code for JWT token
   ↓
6. Supabase redirects user back to: http://localhost:5173/
   (with #access_token=... in URL hash)
   ↓
7. App detects token in URL
   ↓
8. AuthContext updates with user session
   ↓
9. ProtectedRoute allows access to dashboard
```

---

## Troubleshooting

### "Redirect URI mismatch" Error
- Check Supabase URL Configuration is updated
- Verify Google Cloud Console has the right redirect URIs
- Check for trailing slashes (some URLs need `/`, some don't)
- Clear browser cache

### Still Redirecting to Signup
- Open browser DevTools (F12)
- Go to **Console** tab
- Look for `[Auth] State changed` messages
- Check if user is authenticated
- Verify Supabase credentials in `.env.local`

### Google Sign-in Button Not Working
- Check `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`
- Check Google API is enabled in Google Cloud Console
- Check browser console for errors

---

## Testing Checklist

✅ **Supabase URL Configuration**
- [ ] Site URL is set
- [ ] Redirect URLs include localhost
- [ ] Redirect URLs include production domain

✅ **Google Cloud Console**
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs include Google's callback URL
- [ ] Redirect URIs include your app URLs

✅ **Your App (.env.local)**
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] `VITE_GOOGLE_CLIENT_ID` is set

✅ **Testing**
- [ ] Clear browser cache
- [ ] Restart dev server: `npm run dev`
- [ ] Try signing in with Google
- [ ] Check browser console for `[Auth]` logs
- [ ] User should be redirected to `/` (home) after login

---

## Environment Variables Reference

### .env.local (Development)
```env
# Supabase
VITE_SUPABASE_URL=https://igxolhrgcujwuexzokrd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
VITE_GOOGLE_CLIENT_ID=338259709581-i4pnl6ql03isiknr13uhctpqbgt5u60d.apps.googleusercontent.com
```

### .env (Production)
```env
NODE_ENV=production
FRONTEND_URL_PROD=https://www.joinvelocity.co
```

---

## Code Changes Made

### AuthContext.tsx
- Added console logs for debugging auth state
- Improved error handling in `signInWithGoogle()`
- Added comments explaining the OAuth flow

### SignUp.tsx & Login.tsx
- Removed unnecessary `navigate('/')` calls
- Let Supabase handle the redirect instead
- Added better comments about the flow

---

## Security Notes

🔒 **Why the extra redirect through Supabase?**
- Supabase's auth endpoint provides a secure token exchange
- Prevents exposing OAuth tokens directly in your code
- Supabase validates the Google auth code before redirecting

🔒 **Why multiple redirect URIs?**
- Different URLs for different environments (localhost vs production)
- Google needs to know all valid URLs to prevent redirect attacks
- Helps prevent malicious redirects

