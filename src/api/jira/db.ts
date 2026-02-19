// src/api/jira/db.ts
// Supabase persistence layer for Jira projects & issues.
// Every time the server fetches from the Jira Cloud API it upserts data here.
// Frontend can then read from DB instead of relying on session/cookies.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('[JiraDB] Missing SUPABASE_URL or SUPABASE_ANON_KEY — DB persistence disabled');
    return null;
  }
  _client = createClient(url, key);
  console.log('[JiraDB] Supabase client initialized');
  return _client;
}

// ========================================
// Types matching the DB schema
// ========================================

export interface DBJiraProject {
  jira_project_id: string;
  cloud_id: string;
  key: string;
  title: string;
  description: string;
  avatar: string;
  category: string;
  fetched_by?: string;
}

export interface DBJiraIssue {
  cloud_id: string;
  project_key: string;
  issue_key: string;
  issue_type: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee: string;
  team: string;
  start_date: string | null;
  due_date: string | null;
  created_date: string | null;
  duration: string;
  custom_start: string | null;
  raw_fields: Record<string, any>;
  fetched_by?: string;
}

// ========================================
// Write helpers — called after Jira API fetch
// ========================================

/**
 * Upsert an array of projects for a given cloud site.
 */
export async function upsertProjects(cloudId: string, projects: DBJiraProject[]): Promise<void> {
  const client = getClient();
  if (!client || projects.length === 0) return;

  const rows = projects.map((p) => ({
    jira_project_id: p.jira_project_id,
    cloud_id: cloudId,
    key: p.key,
    title: p.title,
    description: p.description,
    avatar: p.avatar,
    category: p.category,
    fetched_by: p.fetched_by || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from('jira_projects')
    .upsert(rows, { onConflict: 'cloud_id,key' });

  if (error) {
    console.error('[JiraDB] upsertProjects error:', error.message);
  } else {
    console.log(`[JiraDB] Upserted ${rows.length} projects for cloud ${cloudId}`);
  }
}

/**
 * Upsert an array of issues for a given cloud site + project.
 */
export async function upsertIssues(cloudId: string, projectKey: string, issues: DBJiraIssue[]): Promise<void> {
  const client = getClient();
  if (!client || issues.length === 0) return;

  const rows = issues.map((i) => ({
    cloud_id: cloudId,
    project_key: projectKey,
    issue_key: i.issue_key,
    issue_type: i.issue_type,
    summary: i.summary,
    description: i.description,
    priority: i.priority,
    status: i.status,
    assignee: i.assignee,
    team: i.team,
    start_date: i.start_date,
    due_date: i.due_date,
    created_date: i.created_date,
    duration: String(i.duration ?? ''),
    custom_start: i.custom_start,
    raw_fields: i.raw_fields || {},
    fetched_by: i.fetched_by || null,
    updated_at: new Date().toISOString(),
  }));

  // Upsert in batches of 200 to avoid payload limits
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await client
      .from('jira_issues')
      .upsert(batch, { onConflict: 'cloud_id,issue_key' });

    if (error) {
      console.error(`[JiraDB] upsertIssues batch ${i}-${i + batch.length} error:`, error.message);
    }
  }

  console.log(`[JiraDB] Upserted ${rows.length} issues for ${projectKey} (cloud ${cloudId})`);
}

// ========================================
// Read helpers — called by new /db/ endpoints
// ========================================

/**
 * Get all projects for a cloud site from DB
 */
export async function getProjects(cloudId: string): Promise<DBJiraProject[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('jira_projects')
    .select('*')
    .eq('cloud_id', cloudId)
    .order('key');

  if (error) {
    console.error('[JiraDB] getProjects error:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    jira_project_id: row.jira_project_id,
    cloud_id: row.cloud_id,
    key: row.key,
    title: row.title,
    description: row.description || '',
    avatar: row.avatar || '',
    category: row.category || '',
  }));
}

/**
 * Get all projects across ALL cloud sites from DB (no cloudId filter).
 * Useful when the frontend doesn't have the cloudId yet.
 */
export async function getAllProjects(): Promise<DBJiraProject[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('jira_projects')
    .select('*')
    .order('key');

  if (error) {
    console.error('[JiraDB] getAllProjects error:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    jira_project_id: row.jira_project_id,
    cloud_id: row.cloud_id,
    key: row.key,
    title: row.title,
    description: row.description || '',
    avatar: row.avatar || '',
    category: row.category || '',
  }));
}

/**
 * Get issues for a specific project from DB
 */
export async function getIssues(cloudId: string, projectKey: string): Promise<DBJiraIssue[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('jira_issues')
    .select('*')
    .eq('cloud_id', cloudId)
    .eq('project_key', projectKey)
    .order('issue_key');

  if (error) {
    console.error('[JiraDB] getIssues error:', error.message);
    return [];
  }

  return (data || []).map(mapIssueRow);
}

/**
 * Get issues for a project key across ALL cloud sites.
 */
export async function getIssuesByProjectKey(projectKey: string): Promise<DBJiraIssue[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('jira_issues')
    .select('*')
    .eq('project_key', projectKey)
    .order('issue_key');

  if (error) {
    console.error('[JiraDB] getIssuesByProjectKey error:', error.message);
    return [];
  }

  return (data || []).map(mapIssueRow);
}

/**
 * Get ALL issues across all cloud sites from DB.
 */
export async function getAllIssues(): Promise<DBJiraIssue[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('jira_issues')
    .select('*')
    .order('issue_key');

  if (error) {
    console.error('[JiraDB] getAllIssues error:', error.message);
    return [];
  }

  return (data || []).map(mapIssueRow);
}

// Map a DB row to our DBJiraIssue shape
function mapIssueRow(row: any): DBJiraIssue {
  return {
    cloud_id: row.cloud_id,
    project_key: row.project_key,
    issue_key: row.issue_key,
    issue_type: row.issue_type || 'Task',
    summary: row.summary || '',
    description: row.description || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Open',
    assignee: row.assignee || 'Unassigned',
    team: row.team || '',
    start_date: row.start_date || null,
    due_date: row.due_date || null,
    created_date: row.created_date || null,
    duration: row.duration || '',
    custom_start: row.custom_start || null,
    raw_fields: row.raw_fields || {},
  };
}
