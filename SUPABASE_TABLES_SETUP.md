# Supabase Database Tables Setup

Complete guide to create all necessary tables in Supabase for storing signup and Google authentication data.

## Overview

Your application uses three main tables to store user data:

1. **`oauth_users`** - Stores emails from Google OAuth authentication
2. **`email_interests`** - Stores emails from signup form (email/password signup)
3. **`waitlist`** - Stores emails from waitlist signup (already exists)

---

## Step 1: Create `oauth_users` Table

This table saves emails of users who sign up/login with Google.

### SQL:
```sql
-- Create oauth_users table for Google authenticated users
CREATE TABLE IF NOT EXISTS oauth_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google',
  authenticated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
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

---

## Step 2: Create `email_interests` Table

This table saves emails and passwords from the email/password signup form.

### SQL:
```sql
-- Create email_interests table for signup form entries
CREATE TABLE IF NOT EXISTS email_interests (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'signup_form',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_email_interests_email ON email_interests(email);
CREATE INDEX idx_email_interests_source ON email_interests(source);

-- Enable Row Level Security (RLS)
ALTER TABLE email_interests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts
CREATE POLICY "Allow inserts for email interests" ON email_interests
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reads
CREATE POLICY "Allow reads for email interests" ON email_interests
  FOR SELECT USING (true);

-- Create policy for updates
CREATE POLICY "Allow updates for email interests" ON email_interests
  FOR UPDATE USING (true);
```

---

## Step 3: Create `waitlist` Table (if not exists)

This table saves emails from the homepage waitlist signup.

### SQL:
```sql
-- Create waitlist table for homepage waitlist signups
CREATE TABLE IF NOT EXISTS waitlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'homepage_hero',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_source ON waitlist(source);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts
CREATE POLICY "Allow inserts for waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reads
CREATE POLICY "Allow reads for waitlist" ON waitlist
  FOR SELECT USING (true);

-- Create policy for updates
CREATE POLICY "Allow updates for waitlist" ON waitlist
  FOR UPDATE USING (true);
```

---

## How to Execute These Queries in Supabase

1. **Go to Supabase Dashboard** → Your Project
2. **Click SQL Editor** in the left sidebar
3. **Click "New Query"**
4. **Copy and paste the SQL** from each section above
5. **Click "Run"** to execute
6. **Verify** the table appears in the left sidebar under **Tables**

---

## Data Flow

### Google Signup/Login:
```
User clicks "Sign up with Google"
    ↓
Redirected to Google OAuth
    ↓
Returns to /auth/callback with session
    ↓
AuthContext saves email to `oauth_users` table
    ↓
Redirected to /velocity-ai
```

### Email/Password Signup:
```
User enters email and password
    ↓
Clicks "Get Started" button
    ↓
Email is saved to `email_interests` table
    ↓
Supabase Auth creates user account
    ↓
Email confirmation sent
    ↓
User stays on signup page with confirmation message
```

### Waitlist Signup:
```
User enters email on homepage
    ↓
Clicks "JOIN THE WAITLIST" button
    ↓
Email is saved to `waitlist` table
    ↓
User sees success message
```

---

## Table Schemas Summary

### oauth_users
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| email | TEXT UNIQUE | User's email address |
| provider | TEXT | OAuth provider (e.g., 'google') |
| authenticated_at | TIMESTAMP | When user authenticated |
| created_at | TIMESTAMP | When record created |
| updated_at | TIMESTAMP | When record last updated |

### email_interests
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| email | TEXT UNIQUE | User's email address |
| source | TEXT | Source of signup (e.g., 'signup_form') |
| created_at | TIMESTAMP | When record created |
| updated_at | TIMESTAMP | When record last updated |

### waitlist
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| email | TEXT UNIQUE | User's email address |
| source | TEXT | Source (e.g., 'homepage_hero') |
| created_at | TIMESTAMP | When record created |
| updated_at | TIMESTAMP | When record last updated |

---

## Verification Checklist

After creating the tables, verify them:

1. ✅ Go to **Supabase Dashboard** → **Tables**
2. ✅ Check that you see:
   - `oauth_users`
   - `email_interests`
   - `waitlist`
3. ✅ Click each table to verify columns exist
4. ✅ Check that RLS is enabled (lock icon should show)

---

## Testing the Setup

### Test Google Signup:
1. Go to `http://localhost:5173/signup`
2. Click "Sign up with Google"
3. Authenticate with Google
4. Go to Supabase → `oauth_users` table
5. You should see your email in the table

### Test Email Signup:
1. Go to `http://localhost:5173/signup`
2. Enter email and password
3. Click "Get Started"
4. Go to Supabase → `email_interests` table
5. You should see your email in the table

### Test Waitlist:
1. Go to `http://localhost:5173`
2. Enter email in hero section
3. Click "JOIN THE WAITLIST"
4. Go to Supabase → `waitlist` table
5. You should see your email in the table

---

## Troubleshooting

### "duplicate key value violates unique constraint"
- **Cause**: Email already exists in table
- **Solution**: Use a different email for testing

### "permission denied for schema public"
- **Cause**: RLS policies not set correctly
- **Solution**: Re-run the POLICY creation SQL

### Table not appearing after creating
- **Cause**: Syntax error in SQL
- **Solution**: Check the SQL Editor for error messages, fix and re-run

### Data not saving
- **Cause**: RLS policy blocking inserts
- **Solution**: Verify `FOR INSERT WITH CHECK (true)` policy exists

---

## Next Steps

1. ✅ Create all three tables using the SQL above
2. ✅ Verify tables appear in Supabase Dashboard
3. ✅ Test each signup flow
4. ✅ Check that emails are being saved to the correct tables
5. ✅ Proceed with Google OAuth configuration (see SUPABASE_GOOGLE_AUTH_SETUP.md)

---

**Last Updated:** February 5, 2026
