-- =============================================
-- Jira Projects & Issues persistence tables
-- Stores all fetched Jira data in Supabase so
-- the frontend reads from DB instead of cookies/session
-- =============================================

-- 1. jira_projects — one row per Jira project per cloud site
CREATE TABLE IF NOT EXISTS jira_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jira_project_id TEXT NOT NULL,          -- Jira's internal project id
  cloud_id TEXT NOT NULL,                 -- Jira cloud site id
  key TEXT NOT NULL,                      -- e.g. "PROJ"
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  category TEXT DEFAULT '',
  fetched_by TEXT,                        -- jira user id who fetched
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cloud_id, key)
);

CREATE INDEX IF NOT EXISTS idx_jira_projects_cloud_id ON jira_projects(cloud_id);
CREATE INDEX IF NOT EXISTS idx_jira_projects_key ON jira_projects(key);

-- 2. jira_issues — one row per issue
CREATE TABLE IF NOT EXISTS jira_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cloud_id TEXT NOT NULL,                 -- Jira cloud site id
  project_key TEXT NOT NULL,              -- e.g. "PROJ"
  issue_key TEXT NOT NULL,                -- e.g. "PROJ-123"
  issue_type TEXT DEFAULT 'Task',
  summary TEXT DEFAULT '',
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  assignee TEXT DEFAULT 'Unassigned',
  team TEXT DEFAULT '',
  start_date TEXT,                        -- ISO date string or null
  due_date TEXT,                          -- ISO date string or null
  created_date TEXT,                      -- Jira created timestamp
  duration TEXT DEFAULT '',               -- calculated duration
  custom_start TEXT,                      -- customfield_10015 raw value
  raw_fields JSONB DEFAULT '{}',          -- full Jira fields blob for future use
  fetched_by TEXT,                        -- jira user id who fetched
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cloud_id, issue_key)
);

CREATE INDEX IF NOT EXISTS idx_jira_issues_cloud_id ON jira_issues(cloud_id);
CREATE INDEX IF NOT EXISTS idx_jira_issues_project_key ON jira_issues(project_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_issue_key ON jira_issues(issue_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_assignee ON jira_issues(assignee);
CREATE INDEX IF NOT EXISTS idx_jira_issues_status ON jira_issues(status);

-- RLS Policies — allow the anon key (server-side) full access
ALTER TABLE jira_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_issues ENABLE ROW LEVEL SECURITY;

-- Projects policies
DROP POLICY IF EXISTS "Allow full access to jira_projects" ON jira_projects;
CREATE POLICY "Allow full access to jira_projects"
  ON jira_projects FOR ALL USING (true) WITH CHECK (true);

-- Issues policies
DROP POLICY IF EXISTS "Allow full access to jira_issues" ON jira_issues;
CREATE POLICY "Allow full access to jira_issues"
  ON jira_issues FOR ALL USING (true) WITH CHECK (true);
