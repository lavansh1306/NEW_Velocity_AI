/**
 * Client-side Jira DB service.
 * Reads Jira projects & issues from Supabase (written by the server
 * after each live Jira API fetch). Falls back to the live API proxy
 * endpoints if the DB read returns nothing (e.g. first visit before
 * any data was fetched).
 */

import { supabase } from './supabase';
import { apiUrl } from './api';

// ------------------------------------------------------------------
// Types matching the server's response shape
// ------------------------------------------------------------------

export interface JiraProjectFromDB {
  id: string;
  key: string;
  title: string;
  description: string;
  avatar: string;
}

export interface JiraIssueFromDB {
  key: string;
  issueType: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assignee: string;
  team: string;
  created: string | null;
  due: string | null;
  duration: number | string;
  start: string | null;
  customfield_10015: string | null;
  project_key: string;
}

// ------------------------------------------------------------------
// Direct Supabase reads (no session/cookie needed)
// ------------------------------------------------------------------

export async function fetchProjectsFromDB(): Promise<JiraProjectFromDB[]> {
  try {
    const { data, error } = await supabase
      .from('jira_projects')
      .select('*')
      .order('key');

    if (error) {
      console.warn('[JiraDBClient] Error fetching projects from DB:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.jira_project_id || row.id,
      key: row.key,
      title: row.title || '',
      description: row.description || '',
      avatar: row.avatar || '',
    }));
  } catch (err) {
    console.warn('[JiraDBClient] fetchProjectsFromDB exception:', err);
    return [];
  }
}

export async function fetchIssuesFromDB(projectKey?: string): Promise<JiraIssueFromDB[]> {
  try {
    let query = supabase
      .from('jira_issues')
      .select('*')
      .order('issue_key');

    if (projectKey) {
      query = query.eq('project_key', projectKey);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[JiraDBClient] Error fetching issues from DB:', error.message);
      return [];
    }

    return (data || []).map(mapDBRow);
  } catch (err) {
    console.warn('[JiraDBClient] fetchIssuesFromDB exception:', err);
    return [];
  }
}

export async function fetchAllIssuesFromDB(): Promise<JiraIssueFromDB[]> {
  return fetchIssuesFromDB(); // no filter = all issues
}

// ------------------------------------------------------------------
// Hybrid fetch — tries DB first, falls back to live API
// ------------------------------------------------------------------

export async function fetchProjectsHybrid(): Promise<{ projects: JiraProjectFromDB[]; source: 'database' | 'api' }> {
  // 1. Try DB first
  const dbProjects = await fetchProjectsFromDB();
  if (dbProjects.length > 0) {
    console.log('[JiraDBClient] Projects loaded from DB:', dbProjects.length);
    return { projects: dbProjects, source: 'database' };
  }

  // 2. Fall back to live API (needs session cookie)
  console.log('[JiraDBClient] No projects in DB, falling back to API...');
  try {
    const resp = await fetch(apiUrl('/api/jira/projects'), { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      return { projects: data.projects || [], source: 'api' };
    }
  } catch (err) {
    console.warn('[JiraDBClient] API fallback failed:', err);
  }

  return { projects: [], source: 'api' };
}

export async function fetchIssuesHybrid(projectKey: string): Promise<{ issues: JiraIssueFromDB[]; source: 'database' | 'api' }> {
  // 1. Try DB first
  const dbIssues = await fetchIssuesFromDB(projectKey);
  if (dbIssues.length > 0) {
    console.log(`[JiraDBClient] Issues for ${projectKey} loaded from DB:`, dbIssues.length);
    return { issues: dbIssues, source: 'database' };
  }

  // 2. Fall back to live API
  console.log(`[JiraDBClient] No issues for ${projectKey} in DB, falling back to API...`);
  try {
    const resp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}`), { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      return { issues: data.issues || [], source: 'api' };
    }
  } catch (err) {
    console.warn('[JiraDBClient] API fallback failed:', err);
  }

  return { issues: [], source: 'api' };
}

export async function fetchAllIssuesHybrid(): Promise<{ issues: JiraIssueFromDB[]; source: 'database' | 'api' }> {
  // 1. Try DB
  const dbIssues = await fetchAllIssuesFromDB();
  if (dbIssues.length > 0) {
    console.log('[JiraDBClient] All issues loaded from DB:', dbIssues.length);
    return { issues: dbIssues, source: 'database' };
  }

  // 2. Fallback: fetch projects then all issues per project from API
  console.log('[JiraDBClient] No issues in DB, falling back to full API fetch...');
  try {
    const projResp = await fetch(apiUrl('/api/jira/projects'), { credentials: 'include' });
    if (!projResp.ok) return { issues: [], source: 'api' };
    const projData = await projResp.json();
    const projects = projData.projects || [];

    const allIssues: JiraIssueFromDB[] = [];
    for (const p of projects) {
      try {
        const issResp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(p.key)}`), { credentials: 'include' });
        if (issResp.ok) {
          const issData = await issResp.json();
          const issues = (issData.issues || []).map((iss: any) => ({
            key: iss.key || '',
            issueType: iss.issueType || 'Task',
            summary: iss.summary || '',
            description: iss.description || '',
            priority: iss.priority || 'Medium',
            status: iss.status || 'Open',
            assignee: iss.assignee || 'Unassigned',
            team: iss.team || p.key,
            created: iss.created || null,
            due: iss.due || null,
            duration: iss.duration ?? '',
            start: iss.start || null,
            customfield_10015: iss.customfield_10015 || null,
            project_key: p.key,
          }));
          allIssues.push(...issues);
        }
      } catch (err) {
        console.warn(`[JiraDBClient] API fallback failed for ${p.key}:`, err);
      }
    }
    return { issues: allIssues, source: 'api' };
  } catch (err) {
    console.warn('[JiraDBClient] Full API fallback failed:', err);
    return { issues: [], source: 'api' };
  }
}

// ------------------------------------------------------------------
// Force a live sync: calls the API (which writes to DB), then reads DB
// ------------------------------------------------------------------

export async function syncProjectFromJira(projectKey: string): Promise<JiraIssueFromDB[]> {
  try {
    // Trigger a live fetch (server will upsert to DB)
    const resp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}`), { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      return (data.issues || []).map((iss: any) => ({
        key: iss.key || '',
        issueType: iss.issueType || 'Task',
        summary: iss.summary || '',
        description: iss.description || '',
        priority: iss.priority || 'Medium',
        status: iss.status || 'Open',
        assignee: iss.assignee || 'Unassigned',
        team: iss.team || projectKey,
        created: iss.created || null,
        due: iss.due || null,
        duration: iss.duration ?? '',
        start: iss.start || null,
        customfield_10015: iss.customfield_10015 || null,
        project_key: projectKey,
      }));
    }
  } catch (err) {
    console.error('[JiraDBClient] syncProjectFromJira failed:', err);
  }
  return [];
}

// ------------------------------------------------------------------
// Internal mapper
// ------------------------------------------------------------------

function mapDBRow(row: any): JiraIssueFromDB {
  return {
    key: row.issue_key || '',
    issueType: row.issue_type || 'Task',
    summary: row.summary || '',
    description: row.description || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Open',
    assignee: row.assignee || 'Unassigned',
    team: row.team || row.project_key || '',
    created: row.created_date || null,
    due: row.due_date || null,
    duration: row.duration || '',
    start: row.start_date || null,
    customfield_10015: row.custom_start || null,
    project_key: row.project_key || '',
  };
}
