-- =============================================
-- Add Complete Jira Fields to jira_issues
-- Run this if you already ran create_multi_tenant_tables.sql
-- =============================================

-- Add all missing columns (IF NOT EXISTS prevents errors if already present)
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS assignee_email TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS reporter TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS reporter_email TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';

-- Time tracking fields
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS original_estimate TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS original_estimate_seconds INTEGER DEFAULT 0;
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS time_spent TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS remaining_estimate TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS remaining_estimate_seconds INTEGER DEFAULT 0;

-- Additional dates
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS updated_date TEXT;
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS resolved_date TEXT;

-- Hierarchy
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS parent_key TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS epic_key TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS epic_name TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS sprint TEXT DEFAULT '';
ALTER TABLE jira_issues ADD COLUMN IF NOT EXISTS story_points NUMERIC DEFAULT 0;

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_jira_issues_reporter ON jira_issues(reporter);
CREATE INDEX IF NOT EXISTS idx_jira_issues_epic ON jira_issues(epic_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_sprint ON jira_issues(sprint);
CREATE INDEX IF NOT EXISTS idx_jira_issues_parent ON jira_issues(parent_key);
