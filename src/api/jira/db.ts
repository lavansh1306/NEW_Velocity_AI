// src/api/jira/db.ts
// Multi-tenant Supabase persistence layer for Jira data.
// ALL operations are scoped by org_id — no cross-org data leaks.
// Also handles Jira token storage (jira_connections) so tokens
// persist across restarts and work in serverless environments.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || '';
  // Prefer SERVICE_ROLE key (bypasses RLS) for server-side operations
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('[JiraDB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY — DB persistence disabled');
    return null;
  }
  const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon';
  _client = createClient(url, key);
  console.log(`[JiraDB] Supabase client initialized (${keyType} key)`);
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
  project_name: string;
  issue_key: string;
  issue_type: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  resolution: string;
  assignee: string;
  assignee_email: string;
  reporter: string;
  reporter_email: string;
  team: string;
  labels: string[];
  components: string[];
  // Time tracking
  original_estimate: string;
  original_estimate_seconds: number;
  time_spent: string;
  time_spent_seconds: number;
  remaining_estimate: string;
  remaining_estimate_seconds: number;
  // Dates
  start_date: string | null;
  due_date: string | null;
  created_date: string | null;
  updated_date: string | null;
  resolved_date: string | null;
  duration: string;
  custom_start: string | null;
  // Hierarchy
  parent_key: string;
  epic_key: string;
  epic_name: string;
  sprint: string;
  story_points: number;
  // Raw
  raw_fields: Record<string, any>;
  fetched_by?: string;
}

export interface JiraConnection {
  id: string;
  org_id: string;
  cloud_id: string;
  site_name: string;
  site_url: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  jira_user_id: string | null;
  connected_by: string | null;
}

// ========================================
// Organization helpers
// ========================================

/**
 * Find an existing org that already has a connection to this Jira cloud site.
 */
export async function findOrgByCloudId(cloudId: string): Promise<string | null> {
  console.log('[JiraDB] findOrgByCloudId called with:', cloudId);
  const client = getClient();
  if (!client) {
    console.error('[JiraDB] findOrgByCloudId: No Supabase client!');
    return null;
  }
  const { data, error } = await client
    .from('jira_connections')
    .select('org_id')
    .eq('cloud_id', cloudId)
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" which is expected if not found
    console.error('[JiraDB] findOrgByCloudId error:', error.message);
  }
  console.log('[JiraDB] findOrgByCloudId result:', data?.org_id || 'not found');
  return data?.org_id || null;
}

/**
 * Find the org(s) a Supabase Auth user belongs to.
 */
export async function findUserOrg(supabaseUserId: string): Promise<{ orgId: string; role: string; orgName: string } | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('organization_members')
    .select('org_id, role, organizations(name)')
    .eq('user_id', supabaseUserId)
    .limit(1)
    .single();
  if (error || !data) return null;
  const orgName = (data as any).organizations?.name || '';
  return { orgId: data.org_id, role: data.role, orgName };
}

/**
 * Create a new organization and add the creator as owner.
 */
export async function createOrganization(
  name: string, supabaseUserId?: string | null, email?: string, displayName?: string
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.error('[JiraDB] createOrganization: No Supabase client');
    return null;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  
  // Only set created_by if we have a real user ID
  const isPlaceholder = !supabaseUserId || supabaseUserId === '00000000-0000-0000-0000-000000000000';
  const insertData: any = { name, slug };
  if (!isPlaceholder) {
    insertData.created_by = supabaseUserId;
  }
  
  console.log('[JiraDB] Creating organization:', { name, slug, hasUser: !isPlaceholder });
  
  const { data: org, error: orgError } = await client
    .from('organizations')
    .insert(insertData)
    .select('id')
    .single();
  if (orgError || !org) {
    console.error('[JiraDB] createOrganization error:', orgError?.message, orgError);
    return null;
  }
  
  // Only create org member if we have a real user
  if (!isPlaceholder && supabaseUserId) {
    const { error: memberError } = await client.from('organization_members').insert({
      org_id: org.id, user_id: supabaseUserId, role: 'owner',
      email: email || null, display_name: displayName || null,
    });
    if (memberError) {
      console.error('[JiraDB] createOrganization member insert error:', memberError?.message);
    }
  }
  
  console.log(`[JiraDB] Created org "${name}" (${org.id})`);
  return org.id;
}

/**
 * Add a user to an existing organization (if not already a member).
 */
export async function addOrgMember(
  orgId: string, supabaseUserId: string, role: 'owner' | 'manager' | 'employee' = 'employee',
  email?: string, displayName?: string
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('organization_members').upsert(
    { org_id: orgId, user_id: supabaseUserId, role, email: email || null, display_name: displayName || null },
    { onConflict: 'org_id,user_id' }
  );
  if (error) console.error('[JiraDB] addOrgMember error:', error.message);
  else console.log(`[JiraDB] Added/updated member ${supabaseUserId} as ${role} in org ${orgId}`);
}

// ========================================
// Jira Connection (token) helpers
// ========================================

export async function upsertJiraConnection(
  orgId: string, cloudId: string, siteName: string, siteUrl: string,
  accessToken: string, refreshToken: string | null, expiresIn: number,
  jiraUserId?: string, connectedBy?: string
): Promise<void> {
  const client = getClient();
  if (!client) {
    console.error('[JiraDB] upsertJiraConnection: No Supabase client available!');
    return;
  }
  
  console.log('[JiraDB] Upserting jira_connection:', { orgId, cloudId, siteName, hasToken: !!accessToken });
  
  const { error } = await client.from('jira_connections').upsert({
    org_id: orgId,
    cloud_id: cloudId,
    site_name: siteName || '',
    site_url: siteUrl || '',
    access_token: accessToken,
    refresh_token: refreshToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    jira_user_id: jiraUserId || null,
    connected_by: connectedBy || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'org_id,cloud_id' });
  
  if (error) {
    console.error('[JiraDB] upsertJiraConnection FAILED:', error.message, error.details, error.hint);
  } else {
    console.log(`[JiraDB] ✓ Stored Jira connection for org ${orgId}, cloud ${cloudId}`);
  }
}

export async function getJiraConnection(orgId: string, cloudId?: string): Promise<JiraConnection | null> {
  const client = getClient();
  if (!client) return null;
  let query = client.from('jira_connections').select('*').eq('org_id', orgId);
  if (cloudId) query = query.eq('cloud_id', cloudId);
  const { data, error } = await query.limit(1).single();
  if (error || !data) return null;
  return {
    id: data.id, org_id: data.org_id, cloud_id: data.cloud_id,
    site_name: data.site_name || '', site_url: data.site_url || '',
    access_token: data.access_token, refresh_token: data.refresh_token || null,
    token_expires_at: data.token_expires_at || null,
    jira_user_id: data.jira_user_id || null, connected_by: data.connected_by || null,
  };
}

export async function getJiraConnections(orgId: string): Promise<JiraConnection[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client.from('jira_connections').select('*').eq('org_id', orgId);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id, org_id: row.org_id, cloud_id: row.cloud_id,
    site_name: row.site_name || '', site_url: row.site_url || '',
    access_token: row.access_token, refresh_token: row.refresh_token || null,
    token_expires_at: row.token_expires_at || null,
    jira_user_id: row.jira_user_id || null, connected_by: row.connected_by || null,
  }));
}

export async function updateConnectionTokens(
  connectionId: string, accessToken: string, refreshToken: string | null, expiresIn: number
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from('jira_connections').update({
    access_token: accessToken, refresh_token: refreshToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', connectionId);
  if (error) console.error('[JiraDB] updateConnectionTokens error:', error.message);
}

export async function deleteJiraConnection(orgId: string, cloudId?: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  let query = client.from('jira_connections').delete().eq('org_id', orgId);
  if (cloudId) query = query.eq('cloud_id', cloudId);
  await query;
}

// ========================================
// Project write/read — org-scoped
// ========================================

export async function upsertProjects(orgId: string, cloudId: string, projects: DBJiraProject[]): Promise<void> {
  const client = getClient();
  if (!client || projects.length === 0) return;
  
  // Validate that org_id and cloudId are provided (to prevent data duplication)
  if (!orgId || !cloudId) {
    console.error('[JiraDB] upsertProjects FAILED: Missing required parameters!', {
      orgIdProvided: !!orgId,
      cloudIdProvided: !!cloudId,
      projectCount: projects.length
    });
    throw new Error(`upsertProjects requires both orgId and cloudId. Got: orgId="${orgId}", cloudId="${cloudId}"`);
  }

  const rows = projects.map((p) => ({
    org_id: orgId, jira_project_id: p.jira_project_id, cloud_id: cloudId,
    key: p.key, title: p.title, description: p.description,
    avatar: p.avatar, category: p.category,
    fetched_by: p.fetched_by || null, updated_at: new Date().toISOString(),
  }));
  const { error } = await client.from('jira_projects').upsert(rows, { onConflict: 'org_id,cloud_id,key' });
  if (error) console.error('[JiraDB] upsertProjects error:', error.message);
  else console.log(`[JiraDB] Upserted ${rows.length} projects for org ${orgId}`);
}

export async function getProjects(orgId: string, cloudId?: string): Promise<DBJiraProject[]> {
  const client = getClient();
  if (!client) return [];
  let query = client.from('jira_projects').select('*').eq('org_id', orgId).order('key');
  if (cloudId) query = query.eq('cloud_id', cloudId);
  const { data, error } = await query;
  if (error) { console.error('[JiraDB] getProjects error:', error.message); return []; }
  return (data || []).map((row: any) => ({
    jira_project_id: row.jira_project_id, cloud_id: row.cloud_id,
    key: row.key, title: row.title, description: row.description || '',
    avatar: row.avatar || '', category: row.category || '',
  }));
}

// ========================================
// Issue write/read — org-scoped
// ========================================

export async function upsertIssues(orgId: string, cloudId: string, projectKey: string, issues: DBJiraIssue[]): Promise<void> {
  const client = getClient();
  if (!client || issues.length === 0) return;
  
  // Validate that org_id and cloudId are provided (to prevent data duplication)
  if (!orgId || !cloudId) {
    console.error('[JiraDB] upsertIssues FAILED: Missing required parameters!', {
      orgIdProvided: !!orgId,
      cloudIdProvided: !!cloudId,
      projectKey,
      issueCount: issues.length
    });
    throw new Error(`upsertIssues requires both orgId and cloudId. Got: orgId="${orgId}", cloudId="${cloudId}"`);
  }

  const rows = issues.map((i) => ({
    org_id: orgId,
    cloud_id: cloudId,
    project_key: projectKey,
    project_name: i.project_name || '',
    issue_key: i.issue_key,
    issue_type: i.issue_type,
    summary: i.summary,
    description: i.description,
    priority: i.priority,
    status: i.status,
    resolution: i.resolution || '',
    assignee: i.assignee,
    assignee_email: i.assignee_email || '',
    reporter: i.reporter || '',
    reporter_email: i.reporter_email || '',
    team: i.team,
    labels: i.labels || [],
    components: i.components || [],
    // Time tracking
    original_estimate: i.original_estimate || '',
    original_estimate_seconds: i.original_estimate_seconds || 0,
    time_spent: i.time_spent || '',
    time_spent_seconds: i.time_spent_seconds || 0,
    remaining_estimate: i.remaining_estimate || '',
    remaining_estimate_seconds: i.remaining_estimate_seconds || 0,
    // Dates
    start_date: i.start_date,
    due_date: i.due_date,
    created_date: i.created_date,
    updated_date: i.updated_date || null,
    resolved_date: i.resolved_date || null,
    duration: String(i.duration ?? ''),
    custom_start: i.custom_start,
    // Hierarchy
    parent_key: i.parent_key || '',
    epic_key: i.epic_key || '',
    epic_name: i.epic_name || '',
    sprint: i.sprint || '',
    story_points: i.story_points || 0,
    // Raw
    raw_fields: i.raw_fields || {},
    fetched_by: i.fetched_by || null,
    updated_at: new Date().toISOString(),
  }));
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await client.from('jira_issues').upsert(batch, { onConflict: 'org_id,cloud_id,issue_key' });
    if (error) console.error(`[JiraDB] upsertIssues batch ${i}-${i + batch.length} error:`, error.message);
  }
  console.log(`[JiraDB] Upserted ${rows.length} issues for ${projectKey} in org ${orgId}`);
}

export async function getIssues(orgId: string, projectKey?: string, cloudId?: string): Promise<DBJiraIssue[]> {
  const client = getClient();
  if (!client) return [];
  let query = client.from('jira_issues').select('*').eq('org_id', orgId).order('issue_key');
  if (projectKey) query = query.eq('project_key', projectKey);
  if (cloudId) query = query.eq('cloud_id', cloudId);
  const { data, error } = await query;
  if (error) { console.error('[JiraDB] getIssues error:', error.message); return []; }
  return (data || []).map(mapIssueRow);
}

export async function getAllIssues(orgId: string): Promise<DBJiraIssue[]> {
  return getIssues(orgId);
}

/**
 * Deduplicate issues for an org+cloudId combination.
 * Called after reconnecting to deduplicate any issues that were created in other orgs
 * with the same cloud_id + issue_key.
 */
export async function deduplicateIssuesForOrgCloud(orgId: string, cloudId: string): Promise<number> {
  const client = getClient();
  if (!client) return 0;

  try {
    console.log('[JiraDB] Deduplicating issues for org:', orgId, 'cloud:', cloudId);
    
    const { data, error } = await client
      .rpc('dedup_jira_issues_for_org', {
        p_org_id: orgId,
        p_cloud_id: cloudId
      });

    if (error) {
      console.warn('[JiraDB] Deduplication RPC error:', error.message);
      // Fall back to manual deduplication if RPC fails
      return await manualDeduplicateIssues(client, orgId, cloudId);
    }

    const deletedCount = data?.[0]?.deleted_count || 0;
    const keptIds = data?.[0]?.kept_issue_ids || [];
    
    console.log('[JiraDB] Deduplication complete:', {
      deleted: deletedCount,
      kept: Array.isArray(keptIds) ? keptIds.length : 0
    });

    return deletedCount;
  } catch (err) {
    console.error('[JiraDB] deduplicateIssuesForOrgCloud exception:', err);
    return 0;
  }
}

/**
 * Manual deduplication fallback (in case RPC doesn't work)
 * Finds and deletes older duplicate issues, keeping the most recent update
 */
async function manualDeduplicateIssues(client: any, orgId: string, cloudId: string): Promise<number> {
  try {
    console.log('[JiraDB] Running manual deduplication for org:', orgId, 'cloud:', cloudId);
    
    // Get all issues for this org+cloud
    const { data: allIssues, error: fetchError } = await client
      .from('jira_issues')
      .select('id, cloud_id, issue_key, updated_at')
      .eq('org_id', orgId)
      .eq('cloud_id', cloudId);

    if (fetchError || !allIssues) {
      console.warn('[JiraDB] Failed to fetch issues for dedup:', fetchError?.message);
      return 0;
    }

    // Group by (cloud_id, issue_key) and find duplicates
    const issueMap: Map<string, any[]> = new Map();
    for (const issue of allIssues) {
      const key = `${issue.cloud_id}:${issue.issue_key}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, []);
      }
      issueMap.get(key)!.push(issue);
    }

    // Find issues to delete (keep the most recent one)
    const idsToDelete: string[] = [];
    for (const [key, issues] of issueMap.entries()) {
      if (issues.length > 1) {
        // Sort by updated_at descending, keep the first one
        issues.sort((a: any, b: any) => {
          const dateA = new Date(a.updated_at).getTime();
          const dateB = new Date(b.updated_at).getTime();
          return dateB - dateA;
        });
        
        // Mark all but the most recent for deletion
        for (let i = 1; i < issues.length; i++) {
          idsToDelete.push(issues[i].id);
        }
        
        console.log(`[JiraDB] Found ${issues.length - 1} duplicate(s) for ${key}, keeping most recent`);
      }
    }

    // Delete the duplicate issues in batches
    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + BATCH_SIZE);
        const { error: deleteError } = await client
          .from('jira_issues')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.warn('[JiraDB] Batch delete error:', deleteError.message);
        } else {
          deletedCount += batch.length;
        }
      }
    }

    console.log('[JiraDB] Manual deduplication deleted:', deletedCount, 'issues');
    return deletedCount;
  } catch (err) {
    console.error('[JiraDB] manualDeduplicateIssues exception:', err);
    return 0;
  }
}

function mapIssueRow(row: any): DBJiraIssue {
  return {
    cloud_id: row.cloud_id,
    project_key: row.project_key,
    project_name: row.project_name || '',
    issue_key: row.issue_key,
    issue_type: row.issue_type || 'Task',
    summary: row.summary || '',
    description: row.description || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Open',
    resolution: row.resolution || '',
    assignee: row.assignee || 'Unassigned',
    assignee_email: row.assignee_email || '',
    reporter: row.reporter || '',
    reporter_email: row.reporter_email || '',
    team: row.team || '',
    labels: row.labels || [],
    components: row.components || [],
    // Time tracking
    original_estimate: row.original_estimate || '',
    original_estimate_seconds: row.original_estimate_seconds || 0,
    time_spent: row.time_spent || '',
    time_spent_seconds: row.time_spent_seconds || 0,
    remaining_estimate: row.remaining_estimate || '',
    remaining_estimate_seconds: row.remaining_estimate_seconds || 0,
    // Dates
    start_date: row.start_date || null,
    due_date: row.due_date || null,
    created_date: row.created_date || null,
    updated_date: row.updated_date || null,
    resolved_date: row.resolved_date || null,
    duration: row.duration || '',
    custom_start: row.custom_start || null,
    // Hierarchy
    parent_key: row.parent_key || '',
    epic_key: row.epic_key || '',
    epic_name: row.epic_name || '',
    sprint: row.sprint || '',
    story_points: row.story_points || 0,
    // Raw
    raw_fields: row.raw_fields || {},
  };
}
