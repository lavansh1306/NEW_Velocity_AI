-- =============================================
-- Multi-Tenant Schema for Velocity AI
-- Supports: multiple organizations, managers, employees
-- Isolates Jira data per organization — no cross-org leaks
-- =============================================

-- 1. Organizations — a company / team workspace
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID,                        -- auth.users(id) who created it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- 2. Organization Members — who belongs to which org, with role
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,                  -- auth.users(id) from Supabase Auth
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'manager', 'employee')),
  email TEXT,
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);

-- 3. Jira Connections — links an org to a Jira Cloud site with persistent tokens
--    Tokens are stored here (not in-memory) so they survive restarts & serverless
CREATE TABLE IF NOT EXISTS jira_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cloud_id TEXT NOT NULL,                 -- Jira Cloud site id
  site_name TEXT DEFAULT '',
  site_url TEXT DEFAULT '',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  jira_user_id TEXT,                      -- Jira account_id of who connected
  connected_by UUID,                      -- auth.users(id) who connected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, cloud_id)
);

CREATE INDEX IF NOT EXISTS idx_jira_conn_org ON jira_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_jira_conn_cloud ON jira_connections(cloud_id);

-- 4. Drop old jira_projects & jira_issues (data was mixed, not usable)
DROP TABLE IF EXISTS jira_issues;
DROP TABLE IF EXISTS jira_projects;

-- 5. Recreate jira_projects with org_id as the tenant key
CREATE TABLE jira_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jira_project_id TEXT NOT NULL,
  cloud_id TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  category TEXT DEFAULT '',
  fetched_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, cloud_id, key)
);

CREATE INDEX IF NOT EXISTS idx_jira_projects_org ON jira_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_jira_projects_cloud ON jira_projects(cloud_id);
CREATE INDEX IF NOT EXISTS idx_jira_projects_key ON jira_projects(key);

-- 6. Recreate jira_issues with org_id as the tenant key + ALL Jira fields
CREATE TABLE jira_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cloud_id TEXT NOT NULL,
  project_key TEXT NOT NULL,
  project_name TEXT DEFAULT '',
  issue_key TEXT NOT NULL,
  issue_type TEXT DEFAULT 'Task',
  summary TEXT DEFAULT '',
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  resolution TEXT DEFAULT '',
  assignee TEXT DEFAULT 'Unassigned',
  assignee_email TEXT DEFAULT '',
  reporter TEXT DEFAULT '',
  reporter_email TEXT DEFAULT '',
  team TEXT DEFAULT '',
  labels JSONB DEFAULT '[]',
  components JSONB DEFAULT '[]',
  -- Time tracking
  original_estimate TEXT DEFAULT '',
  original_estimate_seconds INTEGER DEFAULT 0,
  time_spent TEXT DEFAULT '',
  time_spent_seconds INTEGER DEFAULT 0,
  remaining_estimate TEXT DEFAULT '',
  remaining_estimate_seconds INTEGER DEFAULT 0,
  -- Dates
  start_date TEXT,
  due_date TEXT,
  created_date TEXT,
  updated_date TEXT,
  resolved_date TEXT,
  -- Calculated
  duration TEXT DEFAULT '',
  custom_start TEXT,
  -- Hierarchy
  parent_key TEXT DEFAULT '',
  epic_key TEXT DEFAULT '',
  epic_name TEXT DEFAULT '',
  sprint TEXT DEFAULT '',
  story_points NUMERIC DEFAULT 0,
  -- Raw data for any custom fields
  raw_fields JSONB DEFAULT '{}',
  fetched_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, cloud_id, issue_key)
);

CREATE INDEX IF NOT EXISTS idx_jira_issues_org ON jira_issues(org_id);
CREATE INDEX IF NOT EXISTS idx_jira_issues_cloud ON jira_issues(cloud_id);
CREATE INDEX IF NOT EXISTS idx_jira_issues_project ON jira_issues(project_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_key ON jira_issues(issue_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_assignee ON jira_issues(assignee);
CREATE INDEX IF NOT EXISTS idx_jira_issues_status ON jira_issues(status);
CREATE INDEX IF NOT EXISTS idx_jira_issues_reporter ON jira_issues(reporter);
CREATE INDEX IF NOT EXISTS idx_jira_issues_epic ON jira_issues(epic_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_sprint ON jira_issues(sprint);
CREATE INDEX IF NOT EXISTS idx_jira_issues_parent ON jira_issues(parent_key);

-- 7. Create jira_oauth_pkce table if it doesn't exist (needed for OAuth PKCE flow)
CREATE TABLE IF NOT EXISTS jira_oauth_pkce (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  supabase_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_state ON jira_oauth_pkce(state);
CREATE INDEX IF NOT EXISTS idx_jira_oauth_pkce_expires_at ON jira_oauth_pkce(expires_at);

ALTER TABLE jira_oauth_pkce ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous PKCE lookup" ON jira_oauth_pkce;
CREATE POLICY "Allow anonymous PKCE lookup"
  ON jira_oauth_pkce FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous PKCE insert" ON jira_oauth_pkce;
CREATE POLICY "Allow anonymous PKCE insert"
  ON jira_oauth_pkce FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous PKCE delete" ON jira_oauth_pkce;
CREATE POLICY "Allow anonymous PKCE delete"
  ON jira_oauth_pkce FOR DELETE USING (true);

-- 8. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_issues ENABLE ROW LEVEL SECURITY;

-- 9. Policies — permissive for now, enforced at application layer
--    (proper user-scoped RLS can be layered on later with service_role key for server)
DROP POLICY IF EXISTS "full_access_organizations" ON organizations;
CREATE POLICY "full_access_organizations"
  ON organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "full_access_org_members" ON organization_members;
CREATE POLICY "full_access_org_members"
  ON organization_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "full_access_jira_connections" ON jira_connections;
CREATE POLICY "full_access_jira_connections"
  ON jira_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "full_access_jira_projects" ON jira_projects;
CREATE POLICY "full_access_jira_projects"
  ON jira_projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "full_access_jira_issues" ON jira_issues;
CREATE POLICY "full_access_jira_issues"
  ON jira_issues FOR ALL USING (true) WITH CHECK (true);
