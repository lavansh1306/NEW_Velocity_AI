/**
 * Client-side Jira DB service.
 * Reads Jira projects & issues from Supabase (written by the server
 * after each live Jira API fetch). Falls back to the live API proxy
 * endpoints if the DB read returns nothing (e.g. first visit before
 * any data was fetched).
 */

import { supabase } from './supabase';
import { apiUrl } from './api';
import { getCurrentOrgId } from './orgContext';

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
  resolution: string;
  assignee: string;
  assigneeEmail: string;
  reporter: string;
  reporterEmail: string;
  team: string;
  projectName: string;
  labels: string[];
  components: string[];
  // Time tracking
  originalEstimate: string;
  originalEstimateSeconds: number;
  timeSpent: string;
  timeSpentSeconds: number;
  remainingEstimate: string;
  remainingEstimateSeconds: number;
  // Dates
  created: string | null;
  updated: string | null;
  due: string | null;
  resolved: string | null;
  duration: number | string;
  start: string | null;
  customfield_10015: string | null;
  // Hierarchy
  parentKey: string;
  epicKey: string;
  epicName: string;
  sprint: string;
  storyPoints: number;
  project_key: string;
}

// ------------------------------------------------------------------
// Direct Supabase reads (no session/cookie needed)
// ------------------------------------------------------------------

export async function fetchProjectsFromDB(): Promise<JiraProjectFromDB[]> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      console.warn('[JiraDBClient] No org_id set — skipping DB read');
      return [];
    }

    const { data, error } = await supabase
      .from('jira_projects')
      .select('*')
      .eq('org_id', orgId)
      .order('key');

    if (error) {
      console.warn('[JiraDBClient] Error fetching projects from DB:', error.message);
      return [];
    }

    // Deduplicate by project key (keep first occurrence)
    const seenKeys = new Set<string>();
    const deduped = (data || []).filter((row: any) => {
      if (seenKeys.has(row.key)) {
        console.warn(`[JiraDBClient] Duplicate project in DB: ${row.key}`);
        return false;
      }
      seenKeys.add(row.key);
      return true;
    });

    return deduped.map((row: any) => ({
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
    const orgId = getCurrentOrgId();
    if (!orgId) {
      console.warn('[JiraDBClient] No org_id set — skipping DB read');
      return [];
    }

    let query = supabase
      .from('jira_issues')
      .select('*')
      .eq('org_id', orgId)
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
    const orgId = getCurrentOrgId();
    const url = orgId ? apiUrl(`/api/jira/projects?orgId=${encodeURIComponent(orgId)}`) : apiUrl('/api/jira/projects');
    const resp = await fetch(url, { credentials: 'include' });
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

  // 2. If DB returns 0 issues, try fresh Jira OAuth sync first
  console.log(`[JiraDBClient] No issues for ${projectKey} in DB, trying fresh Jira OAuth sync...`);
  try {
    const syncedIssues = await syncProjectFromJira(projectKey);
    if (syncedIssues.length > 0) {
      console.log(`[JiraDBClient] ✅ Fresh Jira OAuth sync found ${syncedIssues.length} issues for ${projectKey}`);
      return { issues: syncedIssues, source: 'api' };
    }
  } catch (syncErr) {
    console.warn(`[JiraDBClient] Fresh Jira OAuth sync failed for ${projectKey}:`, syncErr);
  }

  // 3. Fall back to regular API if Jira OAuth sync didn't work
  console.log(`[JiraDBClient] Jira OAuth sync returned 0 issues for ${projectKey}, falling back to regular API...`);
  try {
    const orgId = getCurrentOrgId();
    const orgParam = orgId ? `&orgId=${encodeURIComponent(orgId)}` : '';
    const resp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}${orgParam}`), { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      const apiIssues = data.issues || [];
      console.log(`[JiraDBClient] Regular API returned ${apiIssues.length} issues for ${projectKey}`);
      return { issues: apiIssues, source: 'api' };
    }
  } catch (err) {
    console.warn('[JiraDBClient] Regular API fallback failed:', err);
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
    const orgId = getCurrentOrgId();
    const orgParam = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
    const projResp = await fetch(apiUrl(`/api/jira/projects${orgParam}`), { credentials: 'include' });
    if (!projResp.ok) return { issues: [], source: 'api' };
    const projData = await projResp.json();
    const projects = projData.projects || [];
    console.log(`[JiraDBClient] Fetching issues for ${projects.length} projects`);

    const allIssues: JiraIssueFromDB[] = [];
    for (const p of projects) {
      try {
        console.log(`[JiraDBClient] Fetching issues for project: ${p.key}`);
        
        // First, try Jira OAuth sync
        console.log(`[JiraDBClient] Attempting Jira OAuth sync for ${p.key}...`);
        const syncedIssues = await syncProjectFromJira(p.key);
        console.log(`[JiraDBClient] Jira OAuth sync returned ${syncedIssues.length} issues for ${p.key}`);
        
        let issues = syncedIssues;
        
        // If Jira OAuth sync returns 0 issues, fall back to regular API
        if (issues.length === 0) {
          console.log(`[JiraDBClient] Jira OAuth sync returned 0 for ${p.key}, falling back to regular API...`);
          try {
            const issOrgParam = orgId ? `&orgId=${encodeURIComponent(orgId)}` : '';
            const issUrl = apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(p.key)}${issOrgParam}`);
            console.log(`[JiraDBClient] Request URL: ${issUrl}`);
            const issResp = await fetch(issUrl, { credentials: 'include' });
            
            if (issResp.ok) {
              const issData = await issResp.json();
              console.log(`[JiraDBClient] Regular API response for ${p.key}: ${issData.issues?.length || 0} issues`);
              
              issues = (issData.issues || []).map((iss: any) => ({
                key: iss.key || '',
                issueType: iss.issueType || 'Task',
                summary: iss.summary || '',
                description: iss.description || '',
                priority: iss.priority || 'Medium',
                status: iss.status || 'Open',
                resolution: iss.resolution || '',
                assignee: iss.assignee || 'Unassigned',
                assigneeEmail: iss.assigneeEmail || '',
                reporter: iss.reporter || '',
                reporterEmail: iss.reporterEmail || '',
                team: iss.team || p.key,
                projectName: iss.projectName || '',
                labels: iss.labels || [],
                components: iss.components || [],
                originalEstimate: iss.originalEstimate || '',
                originalEstimateSeconds: iss.originalEstimateSeconds || 0,
                timeSpent: iss.timeSpent || '',
                timeSpentSeconds: iss.timeSpentSeconds || 0,
                remainingEstimate: iss.remainingEstimate || '',
                remainingEstimateSeconds: iss.remainingEstimateSeconds || 0,
                created: iss.created || null,
                updated: iss.updated || null,
                due: iss.due || null,
                resolved: iss.resolved || null,
                duration: iss.duration ?? '',
                start: iss.start || null,
                customfield_10015: iss.customfield_10015 || null,
                parentKey: iss.parentKey || '',
                epicKey: iss.epicKey || '',
                epicName: iss.epicName || '',
                sprint: iss.sprint || '',
                storyPoints: iss.storyPoints || 0,
                project_key: p.key,
              }));
            } else {
              const errText = await issResp.text();
              console.error(`[JiraDBClient] Regular API failed for ${p.key}: ${issResp.status} - ${errText}`);
            }
          } catch (err) {
            console.warn(`[JiraDBClient] Regular API fallback failed for ${p.key}:`, err);
          }
        } else {
          // Jira OAuth sync returned issues, map them
          issues = syncedIssues;
        }
        
        console.log(`[JiraDBClient] Adding ${issues.length} issues from ${p.key} to allIssues`);
        allIssues.push(...issues);
      } catch (err) {
        console.warn(`[JiraDBClient] Failed to fetch issues for ${p.key}:`, err);
      }
    }
    console.log(`[JiraDBClient] Total issues collected: ${allIssues.length}`);
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
    const orgId = getCurrentOrgId();
    const orgParam = orgId ? `&orgId=${encodeURIComponent(orgId)}` : '';
    const resp = await fetch(apiUrl(`/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}${orgParam}`), { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      return (data.issues || []).map((iss: any) => ({
        key: iss.key || '',
        issueType: iss.issueType || 'Task',
        summary: iss.summary || '',
        description: iss.description || '',
        priority: iss.priority || 'Medium',
        status: iss.status || 'Open',
        resolution: iss.resolution || '',
        assignee: iss.assignee || 'Unassigned',
        assigneeEmail: iss.assigneeEmail || '',
        reporter: iss.reporter || '',
        reporterEmail: iss.reporterEmail || '',
        team: iss.team || projectKey,
        projectName: iss.projectName || '',
        labels: iss.labels || [],
        components: iss.components || [],
        originalEstimate: iss.originalEstimate || '',
        originalEstimateSeconds: iss.originalEstimateSeconds || 0,
        timeSpent: iss.timeSpent || '',
        timeSpentSeconds: iss.timeSpentSeconds || 0,
        remainingEstimate: iss.remainingEstimate || '',
        remainingEstimateSeconds: iss.remainingEstimateSeconds || 0,
        created: iss.created || null,
        updated: iss.updated || null,
        due: iss.due || null,
        resolved: iss.resolved || null,
        duration: iss.duration ?? '',
        start: iss.start || null,
        customfield_10015: iss.customfield_10015 || null,
        parentKey: iss.parentKey || '',
        epicKey: iss.epicKey || '',
        epicName: iss.epicName || '',
        sprint: iss.sprint || '',
        storyPoints: iss.storyPoints || 0,
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
    resolution: row.resolution || '',
    assignee: row.assignee || 'Unassigned',
    assigneeEmail: row.assignee_email || '',
    reporter: row.reporter || '',
    reporterEmail: row.reporter_email || '',
    team: row.team || row.project_key || '',
    projectName: row.project_name || '',
    labels: row.labels || [],
    components: row.components || [],
    // Time tracking
    originalEstimate: row.original_estimate || '',
    originalEstimateSeconds: row.original_estimate_seconds || 0,
    timeSpent: row.time_spent || '',
    timeSpentSeconds: row.time_spent_seconds || 0,
    remainingEstimate: row.remaining_estimate || '',
    remainingEstimateSeconds: row.remaining_estimate_seconds || 0,
    // Dates
    created: row.created_date || null,
    updated: row.updated_date || null,
    due: row.due_date || null,
    resolved: row.resolved_date || null,
    duration: row.duration || '',
    start: row.start_date || null,
    customfield_10015: row.custom_start || null,
    // Hierarchy
    parentKey: row.parent_key || '',
    epicKey: row.epic_key || '',
    epicName: row.epic_name || '',
    sprint: row.sprint || '',
    storyPoints: row.story_points || 0,
    project_key: row.project_key || '',
  };
}
