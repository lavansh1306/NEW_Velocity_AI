-- Create table for storing PKCE state data during Jira OAuth flow
-- This enables serverless deployments (Vercel) to work properly
-- Each state is one-time-use and auto-expires after 15 minutes

CREATE TABLE IF NOT EXISTS jira_oauth_pkce (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups by state
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_state ON jira_oauth_pkce(state);

-- Create index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_expires_at ON jira_oauth_pkce(expires_at);

-- Enable Row-Level Security (RLS) for this table
ALTER TABLE jira_oauth_pkce ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous access (OAuth callback doesn't have session)
CREATE OR REPLACE POLICY "Allow anonymous PKCE lookup" 
  ON jira_oauth_pkce 
  FOR SELECT 
  USING (true);

CREATE OR REPLACE POLICY "Allow anonymous PKCE insert" 
  ON jira_oauth_pkce 
  FOR INSERT 
  WITH CHECK (true);

CREATE OR REPLACE POLICY "Allow anonymous PKCE delete" 
  ON jira_oauth_pkce 
  FOR DELETE 
  USING (true);

-- Optional: Create a scheduled job to clean up expired entries (if using Supabase with pg_cron)
-- This requires the pg_cron extension to be enabled on your Supabase project
-- Uncomment if available:
/*
SELECT cron.schedule('cleanup-expired-jira-pkce', '*/5 * * * *', $$
  DELETE FROM jira_oauth_pkce 
  WHERE expires_at < NOW() 
  OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour')
$$);
*/
