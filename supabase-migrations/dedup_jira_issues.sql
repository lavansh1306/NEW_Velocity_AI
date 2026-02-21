-- =============================================
-- Deduplication Migration for Jira Issues
-- Removes duplicate issues across multiple org_ids
-- Keeps the most recent one, deletes older duplicates
-- =============================================

-- 1. Create function to deduplicate issues by (cloud_id, issue_key)
-- This keeps the most recently updated record and deletes older duplicates
CREATE OR REPLACE FUNCTION dedup_jira_issues()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Find duplicate issues (same cloud_id, issue_key but different org_id or id)
  -- Keep the most recently updated one, delete the rest
  WITH duplicates AS (
    SELECT 
      cloud_id, 
      issue_key,
      ROW_NUMBER() OVER (PARTITION BY cloud_id, issue_key ORDER BY updated_at DESC) as row_num,
      id
    FROM jira_issues
  )
  DELETE FROM jira_issues
  WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
  );
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN QUERY SELECT v_deleted as deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to deduplicate issues for a specific org during reconnect
CREATE OR REPLACE FUNCTION dedup_jira_issues_for_org(p_org_id UUID, p_cloud_id TEXT)
RETURNS TABLE(deleted_count INT, kept_issue_ids TEXT[]) AS $$
DECLARE
  v_deleted INT := 0;
  v_kept_ids TEXT[];
BEGIN
  -- Find issues for this org+cloud that have duplicates in other orgs
  WITH other_org_duplicates AS (
    SELECT 
      ji_current.cloud_id,
      ji_current.issue_key,
      ji_current.id as current_id,
      ji_other.id as other_id,
      ji_other.org_id as other_org_id,
      ROW_NUMBER() OVER (
        PARTITION BY ji_current.cloud_id, ji_current.issue_key 
        ORDER BY CASE WHEN ji_current.org_id = p_org_id THEN 0 ELSE 1 END ASC,
                 ji_current.updated_at DESC
      ) as keep_order
    FROM jira_issues ji_current
    JOIN jira_issues ji_other 
      ON ji_current.cloud_id = ji_other.cloud_id 
      AND ji_current.issue_key = ji_other.issue_key
      AND ji_current.id != ji_other.id
    WHERE ji_current.org_id = p_org_id
      AND ji_current.cloud_id = p_cloud_id
  )
  DELETE FROM jira_issues
  WHERE id IN (
    SELECT other_id FROM other_org_duplicates WHERE keep_order > 1
  );
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Get the IDs of kept issues in this org
  SELECT ARRAY_AGG(id::TEXT)
  INTO v_kept_ids
  FROM jira_issues
  WHERE org_id = p_org_id AND cloud_id = p_cloud_id;
  
  RETURN QUERY SELECT v_deleted as deleted_count, COALESCE(v_kept_ids, ARRAY[]::TEXT[]) as kept_issue_ids;
END;
$$ LANGUAGE plpgsql;

-- 3. Add additional unique constraint at the (cloud_id, issue_key) level for enforcement
-- This ensures no duplicates can exist globally, but we allow different org_ids to manage their own copy
-- Instead, we'll use the dedup function during reconnects

-- 4. Index to speed up deduplication queries
CREATE INDEX IF NOT EXISTS idx_jira_issues_cloud_key ON jira_issues(cloud_id, issue_key);
