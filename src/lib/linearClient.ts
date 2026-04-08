/**
 * src/lib/linearClient.ts
 * Client-side Linear service.
 * Reads Linear issues from Supabase (written by server after sync).
 * Falls back to live API proxy if DB is empty.
 * Mirrors the pattern in src/lib/jiraDbClient.ts
 */

import { supabase } from './supabase';
import { apiUrl } from './api';
import { getCurrentOrgId } from './orgContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LinearIssueFromDB {
  issue_id: string;
  identifier: string;      // e.g. ENG-123
  title: string;
  description: string;
  status: string;
  priority: number;
  priority_label: string;
  assignee_id: string | null;
  assignee_name: string;
  team_id: string;
  team_name: string;
  project_id: string | null;
  project_name: string;
  created_at: string | null;
  updated_at: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimate: number | null;
  labels: string[];
  url: string;
}

export interface LinearConnectionStatus {
  connected: boolean;
  workspaceId: string | null;
  workspaceName: string | null;
}

// ── Read from Supabase ─────────────────────────────────────────────────────────

export async function fetchLinearIssuesFromDB(
  teamId?: string
): Promise<LinearIssueFromDB[]> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      console.warn('[LinearClient] No org_id — skipping DB read');
      return [];
    }

    let query = supabase
      .from('linear_issues')
      .select('*')
      .eq('org_id', orgId)
      .order('updated_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[LinearClient] Error fetching from DB:', error.message);
      return [];
    }

    return (data || []).map(mapDBRow);
  } catch (err) {
    console.warn('[LinearClient] fetchLinearIssuesFromDB exception:', err);
    return [];
  }
}

// ── Check connection status ────────────────────────────────────────────────────

export async function getLinearConnectionStatus(): Promise<LinearConnectionStatus> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) return { connected: false, workspaceId: null, workspaceName: null };

    const response = await fetch(apiUrl(`/api/linear/auth/status?orgId=${encodeURIComponent(orgId)}`), {
      credentials: 'include',
    });

    if (!response.ok) {
      return { connected: false, workspaceId: null, workspaceName: null };
    }

    const data = await response.json() as any;
    return {
      connected: data.connected === true,
      workspaceId: data.workspace?.id || null,
      workspaceName: data.workspace?.name || null,
    };
  } catch (err) {
    console.warn('[LinearClient] getLinearConnectionStatus error:', err);
    return { connected: false, workspaceId: null, workspaceName: null };
  }
}

// ── Hybrid fetch — DB first, API fallback ──────────────────────────────────────

export async function fetchLinearIssuesHybrid(): Promise<{
  issues: LinearIssueFromDB[];
  source: 'database' | 'api' | 'none';
}> {
  // 1. Try DB first
  const dbIssues = await fetchLinearIssuesFromDB();
  if (dbIssues.length > 0) {
    console.log('[LinearClient] Issues loaded from DB:', dbIssues.length);
    return { issues: dbIssues, source: 'database' };
  }

  // 2. Fall back to API
  console.log('[LinearClient] No issues in DB, trying API...');
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) return { issues: [], source: 'none' };

    const response = await fetch(
      apiUrl(`/api/linear/issues?orgId=${encodeURIComponent(orgId)}`),
      { credentials: 'include' }
    );

    if (response.ok) {
      const data = await response.json() as any;
      const issues = (data.issues || []).map(mapAPIRow);
      console.log('[LinearClient] Issues loaded from API:', issues.length);
      return { issues, source: 'api' };
    }
  } catch (err) {
    console.warn('[LinearClient] API fallback failed:', err);
  }

  return { issues: [], source: 'none' };
}

// ── Push a task to Linear ──────────────────────────────────────────────────────

export async function pushTaskToLinear(task: {
  taskName: string;
  taskDescription?: string;
  teamId?: string;
  assigneeId?: string;
  priority?: number;
}): Promise<{ success: boolean; issue?: { identifier: string; url: string }; queued?: boolean }> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) return { success: false };

    const response = await fetch(apiUrl('/api/linear/push-task'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orgId, ...task }),
    });

    if (!response.ok) {
      console.warn('[LinearClient] pushTaskToLinear failed:', response.status);
      return { success: false };
    }

    return response.json() as Promise<{ success: boolean; issue?: { identifier: string; url: string }; queued?: boolean }>;
  } catch (err) {
    console.warn('[LinearClient] pushTaskToLinear error:', err);
    return { success: false };
  }
}

// ── Log ML training event ──────────────────────────────────────────────────────

export async function logMLTrainingEvent(event: {
  taskId: string;
  suggestedUserId: string;
  skillMatchScore?: number;
  workloadAtTime?: number;
  approved: boolean;
}): Promise<void> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) return;

    await fetch(apiUrl('/api/linear/ml-training-event'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        orgId,
        taskId: event.taskId,
        suggestedUserId: event.suggestedUserId,
        skillMatchScore: event.skillMatchScore ?? 0,
        workloadAtTime: event.workloadAtTime ?? 0,
        approved: event.approved,
      }),
    });
  } catch (err) {
    // Fire-and-forget — don't block UI on ML logging failure
    console.warn('[LinearClient] logMLTrainingEvent error:', err);
  }
}

// ── Trigger a sync from Linear API → DB ───────────────────────────────────────

export async function triggerLinearSync(): Promise<{ success: boolean; synced: number }> {
  try {
    const orgId = getCurrentOrgId();
    if (!orgId) return { success: false, synced: 0 };

    const response = await fetch(apiUrl('/api/linear/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orgId }),
    });

    if (!response.ok) return { success: false, synced: 0 };
    return response.json() as Promise<{ success: boolean; synced: number }>;
  } catch (err) {
    console.warn('[LinearClient] triggerLinearSync error:', err);
    return { success: false, synced: 0 };
  }
}

// ── Internal mappers ───────────────────────────────────────────────────────────

function mapDBRow(row: any): LinearIssueFromDB {
  return {
    issue_id: row.issue_id,
    identifier: row.identifier || '',
    title: row.title || '',
    description: row.description || '',
    status: row.status || 'Todo',
    priority: row.priority ?? 0,
    priority_label: row.priority_label || 'No priority',
    assignee_id: row.assignee_id || null,
    assignee_name: row.assignee_name || '',
    team_id: row.team_id || '',
    team_name: row.team_name || '',
    project_id: row.project_id || null,
    project_name: row.project_name || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    due_date: row.due_date || null,
    completed_at: row.completed_at || null,
    estimate: row.estimate ?? null,
    labels: row.labels || [],
    url: row.url || '',
  };
}

function mapAPIRow(row: any): LinearIssueFromDB {
  return {
    issue_id: row.issue_id || row.id || '',
    identifier: row.identifier || '',
    title: row.title || '',
    description: row.description || '',
    status: row.status || 'Todo',
    priority: row.priority ?? 0,
    priority_label: row.priority_label || 'No priority',
    assignee_id: row.assignee_id || null,
    assignee_name: row.assignee_name || '',
    team_id: row.team_id || '',
    team_name: row.team_name || '',
    project_id: row.project_id || null,
    project_name: row.project_name || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    due_date: row.due_date || null,
    completed_at: row.completed_at || null,
    estimate: row.estimate ?? null,
    labels: row.labels || [],
    url: row.url || '',
  };
}
