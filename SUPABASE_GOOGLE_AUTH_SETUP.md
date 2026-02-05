# Supabase Google Authentication Setup Guide

Complete steps to configure Google OAuth authentication in Supabase for the joinvelocity.co website.

## 1. Create Required Tables in Supabase

### 1.1 Create `oauth_users` Table
This table will store emails of users who authenticate via Google.

**Steps:**
1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create oauth_users table to store Google authenticated users
CREATE TABLE IF NOT EXISTS oauth_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google',
  authenticated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on email for faster lookups
CREATE INDEX idx_oauth_users_email ON oauth_users(email);
CREATE INDEX idx_oauth_users_provider ON oauth_users(provider);

-- Enable Row Level Security (RLS)
ALTER TABLE oauth_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (anyone can save their email)
CREATE POLICY "Allow inserts for oauth users" ON oauth_users
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reads (anyone can check if email exists)
CREATE POLICY "Allow reads for oauth users" ON oauth_users
  FOR SELECT USING (true);

-- Create policy for updates
CREATE POLICY "Allow updates for oauth users" ON oauth_users
  FOR UPDATE USING (true);
```

4. Click **Run** to execute the query
5. You should see the `oauth_users` table appear in the left sidebar under **Tables**

---

## 2. Configure Google OAuth in Google Cloud Console

### 2.1 Create a Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "Velocity AI" (or your preferred name)
3. Enable the **Google+ API**:
   - Click **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click it and press **Enable**

### 2.2 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, click **Configure Consent Screen** first:
   - Choose **External** user type
   - Fill in:
     - **App name**: Velocity AI
     - **User support email**: your email
     - **Developer contact information**: your email
   - Click **Save and Continue** through all screens
   - Add **Scopes**: Add `email` and `profile` (these are required)
   - Click **Save and Continue**, then **Back to Dashboard**

4. Now create the OAuth client ID:
   - Click **+ Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Name it: "Velocity AI Web Client"
   - Under **Authorized redirect URIs**, add:
     - `https://igxolhrgcujwuexzokrd.supabase.co/auth/v1/callback?provider=google` (for Supabase)
     - `http://localhost:5173` (for local development)
     - `http://localhost:3000` (for local API server)
     - `https://www.joinvelocity.co` (for production)
   - Click **Create**
   - Copy the **Client ID** and **Client Secret** (you'll need these)

---

## 3. Configure Google OAuth in Supabase

### 3.1 Add Google Provider
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **Google**
3. Toggle **Enable Sign in with Google** to ON
4. Paste the **Client ID** from Google Cloud Console
5. Paste the **Client Secret** from Google Cloud Console
6. Click **Save**

### 3.2 Configure Redirect URLs in Supabase
1. Go to **Authentication** → **URL Configuration**
2. Under **Site URL**, set it to:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://www.joinvelocity.co`

3. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173
   https://www.joinvelocity.co/auth/callback
   https://www.joinvelocity.co
   ```

4. Save the configuration

---

## 4. Update Environment Variables

Make sure your `.env` file contains the Supabase credentials. They should already be there:

```env
VITE_SUPABASE_URL=https://igxolhrgcujwuexzokrd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneG9saHJnY3Vqd3VleHpva3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzkzNDMsImV4cCI6MjA4NTcxNTM0M30.UDHf3yuQT1HHSZMrENkuxv-kk3B63hBSWDLlKOPxydU
VITE_GOOGLE_CLIENT_ID=338259709581-i4pnl6ql03isiknr13uhctpqbgt5u60d.apps.googleusercontent.com
```

---

## 5. Domain Configuration for joinvelocity.co

### 5.1 Custom Domain Setup in Supabase (Optional but Recommended)
For production on `joinvelocity.co`:

1. Go to **Supabase Dashboard** → **Project Settings** → **General**
2. Look for **Custom Domains** section
3. Add your domain `joinvelocity.co`
4. Follow DNS verification steps

### 5.2 CORS Configuration
1. Go to **Project Settings** → **API** 
2. Ensure CORS is configured to allow:
   - `https://www.joinvelocity.co`
   - `http://localhost:5173`

---

## 6. Verify the Setup

### 6.1 Test Locally
1. Run your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:5173`
3. Click the **SIGN UP** button
4. Click **Continue with Google**
5. Sign in with your Google account
6. After authentication, you should be redirected to `/velocity-ai`

### 6.2 Check if Email Was Saved
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:
   ```sql
   SELECT * FROM oauth_users;
   ```
3. You should see your email listed in the table

---

## 7. Troubleshooting

### Issue: "Redirect URI mismatch" Error
**Solution:**
- Ensure the redirect URI in Google Cloud Console matches exactly with Supabase URL Configuration
- Clear browser cookies and try again
- Common format: `https://igxolhrgcujwuexzokrd.supabase.co/auth/v1/callback?provider=google`

### Issue: "Invalid Client" Error
**Solution:**
- Verify your Google Client ID and Secret are correct in Supabase
- Check that the OAuth consent screen is configured
- Ensure the Google+ API is enabled

### Issue: Email Not Saving to Database
**Solution:**
- Check RLS policies on `oauth_users` table (should allow inserts)
- Verify the table exists: `SELECT * FROM oauth_users;`
- Check browser console for JavaScript errors
- Ensure Supabase connection is active

### Issue: Users Not Redirected to /velocity-ai
**Solution:**
- Check that `/auth/callback` route is configured in your React app (it is in App.tsx)
- Verify user object is being set in AuthContext after authentication
- Check browser console for redirect errors

---

## 8. API Configuration (Optional)

If you have a backend API server, configure CORS and OAuth redirect there:

In your `server.ts` or API configuration:

```typescript
// Allow requests from Supabase OAuth
CORS_ALLOWED_ORIGINS = [
  'https://igxolhrgcujwuexzokrd.supabase.co',
  'http://localhost:5173',
  'https://www.joinvelocity.co'
];
```

---

## 9. Production Deployment Checklist

- [ ] Google OAuth credentials generated for production domain
- [ ] `https://www.joinvelocity.co` added to Google Cloud Console redirect URIs
- [ ] Supabase URL Configuration updated with production Site URL
- [ ] Production redirect URLs added to Supabase
- [ ] `oauth_users` table created with RLS policies
- [ ] DNS configured (if using custom domain)
- [ ] CORS settings configured
- [ ] Environment variables updated on production server
- [ ] Google+ API enabled in Google Cloud Console
- [ ] OAuth consent screen configured with production domain

---

## 10. What Happens After Setup

**User Flow:**
1. User clicks **SIGN UP** button on landing page
2. User is taken to `/login` page
3. User clicks **Continue with Google** button
4. User is redirected to Google OAuth login
5. After successful login, user is redirected to `/auth/callback`
6. Email is automatically saved to `oauth_users` table
7. User is redirected to `/velocity-ai` dashboard
8. User is now logged in and can access the platform

---

## Additional Resources

- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/sql-editor)

---

**Notes:**
- The Google Client ID and Secret are already in your `.env` file
- The Supabase URL and Anon Key are already configured
- All code changes have been implemented in the frontend
- Just follow sections 1-3 above to complete the setup

---

Last Updated: February 5, 2026
