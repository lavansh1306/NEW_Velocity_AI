# Google OAuth Setup Guide

Your VelocityAI app now requires authentication to access any page. Here's how to set up Google One Tap Sign-In:

## Step 1: Create a Google OAuth 2.0 Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project:
   - Click "Select a Project" at the top
   - Click "NEW PROJECT"
   - Name it "VelocityAI" 
   - Click "Create"

## Step 2: Enable Google Identity Services API

1. In the left sidebar, click **APIs & Services** > **Library**
2. Search for "Google Identity Services"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** at the top
3. Select **OAuth client ID**
4. Choose **Web application**
5. Configure:
   - **Name**: VelocityAI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/` (for development)
     - `https://yourdomain.com/` (for production)
6. Click **Create**
7. Copy your **Client ID**

## Step 4: Update Environment Variables

1. Open `.env` in your project
2. Replace `your-google-client-id-here` with your actual Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```

## Step 5: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Google**
5. Paste your Google Client ID in the **Client ID** field
6. In Google Cloud Console, get your **Client Secret**:
   - Go back to **Credentials**
   - Click your OAuth 2.0 credential
   - Copy the **Client Secret**
7. Paste it in Supabase's **Client Secret** field
8. Click **Save**

## Step 6: Test the Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should be redirected to `/login`
4. You'll see:
   - **Google One Tap prompt** (automatically appears)
   - **Continue with Google button** for manual login
   - **Email/Password login** option

5. Try signing in with your Google account

## How It Works

- **Google One Tap**: Automatically appears to users who have a Google account signed in
- **Login Page**: Now the default entry point for unauthenticated users
- **Protected Routes**: All dashboard pages require authentication
- **Auto Redirect**: Unauthenticated users trying to access `/projects`, `/demo`, etc. are redirected to `/login`

## Environment Variables Summary

```env
# Supabase
VITE_SUPABASE_URL=https://igxolhrgcujwuexzokrd.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Public vs Protected Routes

### Public (No Auth Required):
- `/login` - Login page
- `/signup` - Sign up page

### Protected (Auth Required):
- `/` - Home/Dashboard
- `/demo` - Demo page
- `/projects` - Projects dashboard
- `/roi-calculator` - ROI Calculator
- All other feature pages

## Troubleshooting

### Google One Tap not appearing
- Check that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Make sure you're on `localhost:5173` or an authorized domain
- Check browser console for errors

### "Google is not defined"
- Wait a few seconds for the Google script to load
- Hard refresh the page (Ctrl+Shift+R)

### Sign-in fails
- Verify Client ID matches your Google Cloud project
- Check that `http://localhost:5173` is in authorized origins
- Clear browser cookies and try again

## Next Steps

- Customize the login/signup pages further
- Set up email verification in Supabase
- Add 2FA (Two-Factor Authentication)
- Configure password reset email template
