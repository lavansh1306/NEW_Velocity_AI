# Jira OAuth Quick Start - 5 Minute Setup

## TL;DR - Do This Now

### Step 1: Create Supabase Table (2 min)

Go to Supabase dashboard → SQL Editor → Run this:

```sql
CREATE TABLE IF NOT EXISTS jira_oauth_pkce (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_state ON jira_oauth_pkce(state);
ALTER TABLE jira_oauth_pkce ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous PKCE lookup" ON jira_oauth_pkce FOR SELECT USING (true);
CREATE POLICY "Allow anonymous PKCE insert" ON jira_oauth_pkce FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous PKCE delete" ON jira_oauth_pkce FOR DELETE USING (true);
```

### Step 2: Set Vercel Environment Variables (2 min)

Go to Vercel Dashboard → Project Settings → Environment Variables

Add these (you already have these, just verify they're correct):

```
JIRA_OAUTH_CLIENT_ID=<your_client_id>
JIRA_OAUTH_CLIENT_SECRET=<your_client_secret>
JIRA_OAUTH_REDIRECT_URI=https://www.joinvelocity.co/api/jira/auth/callback
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_key>
SESSION_SECRET=<secure_random_string>
```

### Step 3: Deploy (1 min)

```bash
git add .
git commit -m "Fix: Jira OAuth PKCE storage with Supabase"
git push origin main
```

Vercel will auto-deploy. Wait ~2-3 minutes.

### Step 4: Test (Optional)

```
https://www.joinvelocity.co
→ Click "Connect Jira"
→ Authorize
→ Should redirect to dashboard
```

Done! ✅

## For Local Development

Create `.env.local`:

```env
JIRA_OAUTH_CLIENT_ID=<your_client_id>
JIRA_OAUTH_CLIENT_SECRET=<your_client_secret>
JIRA_OAUTH_REDIRECT_URI=http://localhost:4000/api/jira/auth/callback
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_key>
NODE_ENV=development
API_PORT=4000
SESSION_SECRET=dev-secret
```

Run:
```bash
npm run api
```

Then test: `http://localhost:5173` → Connect Jira

## If Something Goes Wrong

### "PKCE verifier not found" Error

**Fix**:
1. Verify `jira_oauth_pkce` table exists in Supabase
2. Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel
3. Check Vercel logs: `vercel logs --follow`

### Redirect Loop

**Fix**:
1. Make sure Jira OAuth app has BOTH registered:
   - `http://localhost:4000/api/jira/auth/callback` (dev)
   - `https://www.joinvelocity.co/api/jira/auth/callback` (prod)
2. Check `JIRA_OAUTH_REDIRECT_URI` env var matches

### Not Storing Data

**Fix**:
1. Check RLS policies on `jira_oauth_pkce` table
2. Run: 
   ```sql
   SELECT * FROM jira_oauth_pkce LIMIT 5;
   ```
3. If empty, check server logs

## What Changed

1. **Supabase table**: `jira_oauth_pkce` - stores OAuth state
2. **Code**: Uses Supabase instead of in-memory storage
3. **Routing**: Works for both dev and production
4. **Logging**: Better debug messages

## Why This Matters

- **Old way**: Stored PKCE in memory → Lost in serverless → 400 error
- **New way**: Stored in Supabase → Persists across serverless invocations → Works!

## Read More

- [Full Setup Guide](./JIRA_OAUTH_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Technical Summary](./JIRA_OAUTH_FIX_SUMMARY.md)
