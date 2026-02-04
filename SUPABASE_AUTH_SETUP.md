# Supabase Authentication Setup Guide

## Overview
Supabase authentication has been successfully integrated into your VelocityAI project. Follow these steps to activate and configure it.

## Step 1: Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with your email or GitHub account

## Step 2: Create a New Project
1. Click "New Project" in your Supabase dashboard
2. Fill in the project details:
   - **Project Name**: VelocityAI (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Select the closest region to your users
3. Click "Create new project" and wait for it to initialize (2-3 minutes)

## Step 3: Get Your Credentials
1. Once the project is ready, go to **Settings** > **API**
2. You'll see:
   - **Project URL** (copy this)
   - **Anon Public Key** (copy this)
3. Keep these credentials secure

## Step 4: Configure Environment Variables
1. Open `.env` in your project root
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   - Replace `your-project-id` with your actual Supabase project ID
   - Replace `your-anon-key-here` with your Anon Public Key

## Step 5: Enable Email Authentication
1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find "Email" provider
3. Ensure it's enabled (toggle should be ON)
4. Configure email settings:
   - Go to **Authentication** > **Email Templates**
   - Customize confirmation, password reset, and magic link emails (optional)

## Step 6: Enable Additional Providers (Optional)
You can enable:
- **Google OAuth**: Go to Providers > Google
- **GitHub OAuth**: Go to Providers > GitHub
- **Magic Link**: Already enabled by default

Follow Supabase docs for specific provider setup instructions.

## Step 7: Test the Authentication
1. Run your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173/signup`
3. Create a test account
4. You should receive a confirmation email (check spam folder)
5. Confirm your email and try logging in

## Project Structure

### New Files Created:
- **`src/lib/supabase.ts`** - Supabase client configuration
- **`src/contexts/AuthContext.tsx`** - Authentication context and hooks
- **`src/pages/Login.tsx`** - Login page
- **`src/pages/SignUp.tsx`** - Sign up page
- **`src/components/ProtectedRoute.tsx`** - Route protection component
- **`.env`** - Environment variables

### Updated Files:
- **`src/App.tsx`** - Added AuthProvider and protected routes
- **`package.json`** - Added @supabase/supabase-js dependency

## Usage Examples

### Using Authentication in Components

#### Get Current User
```tsx
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Hello, {user?.email}</div>;
}
```

#### Sign Out
```tsx
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
    // User will be redirected automatically
  };
  
  return (
    <div>
      <p>User: {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

#### Protecting Routes
Routes are already wrapped with `<ProtectedRoute>` in App.tsx:
- `/velocity-ai` ✅ Protected
- `/projects` ✅ Protected
- `/projects/jira-dashboard` ✅ Protected
- `/projects/asana-dashboard` ✅ Protected
- etc.

Public routes (no authentication required):
- `/` - Home page
- `/login` - Login page
- `/signup` - Sign up page
- `/demo` - Demo page

## Features Implemented

✅ **User Registration** - Sign up with email/password
✅ **User Login** - Sign in to existing account
✅ **Password Reset** - Reset forgotten passwords
✅ **Session Management** - Automatic session persistence
✅ **Protected Routes** - Route-level protection
✅ **Auth Context** - Global auth state management
✅ **Loading States** - Proper loading indicators
✅ **Error Handling** - User-friendly error messages

## Database Tables (Optional)

You may want to create user profiles table for additional data:

```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
```

## Security Best Practices

1. **Never commit sensitive credentials** - Add `.env` to `.gitignore` for sensitive values (already done)
2. **Use RLS (Row Level Security)** - Restrict database access by user
3. **Enable HTTPS** - Always use HTTPS in production
4. **Rotate Keys** - Periodically rotate your API keys
5. **Environment Isolation** - Use different Supabase projects for dev/prod

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env` exists and has correct values
- Restart development server: `npm run dev`

### "User not authenticated"
- Check if user email is verified
- Clear browser cookies and try again
- Check browser console for errors

### "Page keeps redirecting to /login"
- User session may have expired
- Clear localStorage: `localStorage.clear()`
- Try logging in again

### Confirmation email not received
- Check spam/junk folder
- Resend confirmation email from Supabase dashboard

## Next Steps

1. **Customize Auth Pages** - Update Login.tsx and SignUp.tsx styling
2. **Add User Profile** - Create user_profiles table in Supabase
3. **Social Login** - Enable Google/GitHub OAuth
4. **Magic Links** - Enable passwordless authentication
5. **Two-Factor Auth** - Enable 2FA in Supabase settings

## Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/getting-started/quickstarts/react)

---

**Setup completed!** Your application is now ready for Supabase authentication.
