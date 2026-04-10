// src/api/linear/db.ts
// Supabase persistence for Linear connections and issues.
// All operations scoped by org_id — no cross-org leaks.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('[LinearDB] Missing SUPABASE_URL or key — DB persistence disabled');
    return null;
  }
  _client = createClient(url, key);
  console.log('[LinearDB] Supabase client initialized');
  return _client;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LinearConnection {
  id: string;
  org_id: string;
  workspace_id: string;
  workspace_name: string;
  access_token: string;
  connected_by: string | null;
  updated_at: string;
}

export interface LinearIssue {
  org_id: string;
  workspace_id: string;
  issue_id: string;         // Linear internal UUID
  identifier: string;       // e.g. ENG-123
  title: string;
  description: string;
  status: string;           // e.g. Todo, In Progress, Done
  priority: number;         // 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low
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
  estimate: number | null;  // story points
  labels: string[];
  url: string;
}

// ── Connection helpers ─────────────────────────────────────────────────────────

export async function upsertLinearConnection(
  orgId: string,
  workspaceId: string,
  workspaceName: string,
  accessToken: string,
  connectedBy?: string
): Promise<void> {
  const client = getClient();
  if (!client) {
    console.error('[LinearDB] upsertLinearConnection: No Supabase client');
    return;
  }

  console.log('[LinearDB] Upserting linear_connection:', { orgId, workspaceId, workspaceName });

  const { error } = await client.from('linear_connections').upsert(
    {
      org_id: orgId,
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      access_token: accessToken,
      connected_by: connectedBy || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' }
  );

  if (error) {
    console.error('[LinearDB] upsertLinearConnection error:', error.message);
  } else {
    console.log(`[LinearDB] ✓ Stored Linear connection for org ${orgId}`);
  }
}

export async function getLinearConnection(orgId: string): Promise<LinearConnection | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('linear_connections')
    .select('*')
    .eq('org_id', orgId)
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    org_id: data.org_id,
    workspace_id: data.workspace_id,
    workspace_name: data.workspace_name,
    access_token: data.access_token,
    connected_by: data.connected_by || null,
    updated_at: data.updated_at,
  };
}

export async function deleteLinearConnection(orgId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client.from('linear_connections').delete().eq('org_id', orgId);
  console.log(`[LinearDB] Deleted Linear connection for org ${orgId}`);
}

// ── Issue helpers ──────────────────────────────────────────────────────────────

export async function upsertLinearIssues(
  orgId: string,
  workspaceId: string,
  issues: LinearIssue[]
): Promise<void> {
  const client = getClient();
  if (!client || issues.length === 0) return;

  const rows = issues.map(i => ({
    org_id: orgId,
    workspace_id: workspaceId,
    issue_id: i.issue_id,
    identifier: i.identifier,
    title: i.title,
    description: i.description || '',
    status: i.status,
    priority: i.priority,
    priority_label: i.priority_label,
    assignee_id: i.assignee_id || null,
    assignee_name: i.assignee_name || '',
    team_id: i.team_id,
    team_name: i.team_name,
    project_id: i.project_id || null,
    project_name: i.project_name || '',
    created_at: i.created_at,
    updated_at: i.updated_at,
    due_date: i.due_date || null,
    completed_at: i.completed_at || null,
    estimate: i.estimate || null,
    labels: i.labels || [],
    url: i.url || '',
    synced_at: new Date().toISOString(),
  }));

  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await client
      .from('linear_issues')
      .upsert(batch, { onConflict: 'org_id,issue_id' });
    if (error) {
      console.error(`[LinearDB] upsertLinearIssues batch error:`, error.message);
    }
  }
  console.log(`[LinearDB] Upserted ${rows.length} Linear issues for org ${orgId}`);
}

export async function getLinearIssues(
  orgId: string,
  teamId?: string
): Promise<LinearIssue[]> {
  const client = getClient();
  if (!client) return [];

  let query = client.from('linear_issues').select('*').eq('org_id', orgId);
  if (teamId) query = query.eq('team_id', teamId);

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('[LinearDB] getLinearIssues error:', error.message);
    return [];
  }

  return (data || []).map(mapIssueRow);
}

export async function getAllLinearIssues(orgId: string): Promise<LinearIssue[]> {
  return getLinearIssues(orgId);
}

// ── ML training events ─────────────────────────────────────────────────────────

export interface MLTrainingEvent {
  org_id: string;
  task_id: string;
  suggested_user_id: string;
  skill_match_score: number;
  workload_at_time: number;
  approved: boolean;
}

export async function insertMLTrainingEvent(event: MLTrainingEvent): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from('ml_training_events').insert({
    org_id: event.org_id,
    task_id: event.task_id,
    suggested_user_id: event.suggested_user_id,
    skill_match_score: event.skill_match_score,
    workload_at_time: event.workload_at_time,
    approved: event.approved,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[LinearDB] insertMLTrainingEvent error:', error.message);
  } else {
    console.log(`[LinearDB] ✓ ML training event logged (approved: ${event.approved})`);
  }
}

export async function getMLTrainingEvents(orgId: string): Promise<MLTrainingEvent[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('ml_training_events')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[LinearDB] getMLTrainingEvents error:', error.message);
    return [];
  }

  return data || [];
}

// ── Internal mapper ────────────────────────────────────────────────────────────

function mapIssueRow(row: any): LinearIssue {
  return {
    org_id: row.org_id,
    workspace_id: row.workspace_id,
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
