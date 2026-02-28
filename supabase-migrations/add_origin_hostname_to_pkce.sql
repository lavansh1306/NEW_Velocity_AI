-- Add origin_hostname and supabase_user_id columns to jira_oauth_pkce table
-- This enables tracking the domain where the OAuth flow was initiated
-- so we can redirect back to the correct frontend after authentication

-- Add supabase_user_id column if it doesn't exist
ALTER TABLE jira_oauth_pkce 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

-- Add origin_hostname column if it doesn't exist  
ALTER TABLE jira_oauth_pkce
ADD COLUMN IF NOT EXISTS origin_hostname TEXT;

-- Add an index on supabase_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_supabase_user_id 
ON jira_oauth_pkce(supabase_user_id);

-- Add an index on origin_hostname for analysis
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_origin_hostname 
ON jira_oauth_pkce(origin_hostname);

-- Verify the table structure after migration
-- \d jira_oauth_pkce;
