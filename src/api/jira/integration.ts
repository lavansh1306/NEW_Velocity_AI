// src/api/jira/integration.ts
// Jira Integration: fetch projects and issues, then store in DB tables
// Called when user connects Jira account

import { Request } from 'express';
import * as db from './db.js';

interface SearchResult {
  issues: Array<{
    key: string;
    self: string;
    fields: any;
  }>;
  total: number;
}

/**
 * Fetch all Jira projects accessible to the connected user
 */
export async function fetchJiraProjects(req: Request, cloudId: string, accessToken: string) {
  console.log('[JiraIntegration] Fetching projects for cloud:', cloudId);
  
  const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[JiraIntegration] Failed to fetch projects:', response.status, errorText);
    throw new Error(`Failed to fetch Jira projects: ${response.status}`);
  }

  const projects = await response.json() as Array<{
    id: string;
    key: string;
    name: string;
    description?: string;
    projectTypeKey?: string;
    avatarUrls?: any;
    category?: any;
  }>;

  console.log('[JiraIntegration] Fetched', projects.length, 'projects');
  return projects;
}

/**
 * Fetch all issues for a specific project
 */
export async function fetchProjectIssues(
  cloudId: string,
  projectKey: string,
  accessToken: string
) {
  console.log('[JiraIntegration] Fetching issues for project:', projectKey);

  const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`;
  
  const params = new URLSearchParams({
    jql: `project = "${projectKey}" ORDER BY created DESC`,
    maxResults: '100',
    fields: [
      'summary',
      'description',
      'issuetype',
      'priority',
      'status',
      'assignee',
      'reporter',
      'labels',
      'customfield_10015', // Start date (custom field, may vary)
      'duedate',
      'created',
      'updated',
      'resolved',
      'components',
      'timeestimate',
      'timespent',
      'timeoriginalestimate',
      'customfield_10004', // Story points (custom field, may vary)
      'parent',
      'sprint',
      'epic'
    ].join(','),
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[JiraIntegration] Failed to fetch issues:', response.status, errorText);
    throw new Error(`Failed to fetch Jira issues for ${projectKey}: ${response.status}`);
  }

  const result = (await response.json()) as SearchResult;
  console.log('[JiraIntegration] Fetched', result.issues.length, 'issues for project', projectKey);
  
  return result.issues;
}

/**
 * Sync a single project and its issues
 */
export async function syncProjectData(
  orgId: string,
  cloudId: string,
  projectKey: string,
  projectName: string,
  accessToken: string,
  fetchedByUserEmail?: string
) {
  console.log('[JiraIntegration] Syncing project:', projectKey);

  try {
    // Fetch issues for this project
    const issues = await fetchProjectIssues(cloudId, projectKey, accessToken);

    // Transform Jira issues to DB format
    if (issues.length > 0) {
      const dbIssues = issues.map((issue) => {
        const fields = issue.fields || {};
        
        return {
          cloud_id: cloudId,
          project_key: projectKey,
          project_name: projectName,
          issue_key: issue.key,
          issue_type: fields.issuetype?.name || 'Task',
          summary: fields.summary || '',
          description: fields.description?.content?.[0]?.content?.[0]?.text || fields.description || '',
          priority: fields.priority?.name || 'Medium',
          status: fields.status?.name || 'Open',
          resolution: '',
          assignee: fields.assignee?.displayName || 'Unassigned',
          assignee_email: fields.assignee?.emailAddress || '',
          reporter: fields.reporter?.displayName || '',
          reporter_email: fields.reporter?.emailAddress || '',
          team: fields.components?.map((c: any) => c.name).join(', ') || '',
          labels: fields.labels || [],
          components: fields.components?.map((c: any) => c.name) || [],
          original_estimate: fields.timeoriginalestimate ? `${fields.timeoriginalestimate / 3600}h` : '',
          original_estimate_seconds: fields.timeoriginalestimate || 0,
          time_spent: fields.timespent ? `${fields.timespent / 3600}h` : '',
          time_spent_seconds: fields.timespent || 0,
          remaining_estimate: fields.remainingestimate ? `${fields.remainingestimate / 3600}h` : '',
          remaining_estimate_seconds: fields.remainingestimate || 0,
          start_date: fields.customfield_10015 || null,
          due_date: fields.duedate || null,
          created_date: fields.created || null,
          updated_date: fields.updated || null,
          resolved_date: fields.resolutiondate || null,
          duration: '',
          custom_start: fields.customfield_10015 || null,
          parent_key: fields.parent?.key || '',
          epic_key: (fields.customfield_10009 as any)?.key || '',
          epic_name: (fields.customfield_10009 as any)?.name || '',
          sprint: fields.sprint?.name || '',
          story_points: parseInt((fields.customfield_10004 as any) || '0') || 0,
          raw_fields: fields,
          fetched_by: fetchedByUserEmail || '',
        };
      });

      // Store using existing db function
      await db.upsertIssues(orgId, cloudId, projectKey, dbIssues);
    }

    console.log('[JiraIntegration] ✓ Project sync complete:', projectKey);
    return { success: true, issuesCount: issues.length };
  } catch (error) {
    console.error('[JiraIntegration] Error syncing project:', projectKey, error);
    throw error;
  }
}

/**
 * Full sync: fetch all projects and their issues
 * Entry point called when user connects Jira
 */
export async function syncAllJiraData(
  orgId: string,
  cloudId: string,
  accessToken: string,
  fetchedByUserEmail?: string
) {
  console.log('[JiraIntegration] ===== STARTING FULL SYNC =====');
  console.log('[JiraIntegration] Org:', orgId);
  console.log('[JiraIntegration] Cloud ID:', cloudId);
  console.log('[JiraIntegration] Fetched by:', fetchedByUserEmail || 'unknown');

  try {
    // 1. Fetch all projects
    console.log('[JiraIntegration] Step 1: Fetching projects...');
    const projects = await fetchJiraProjects(undefined as any, cloudId, accessToken);

    if (projects.length === 0) {
      console.log('[JiraIntegration] No projects found');
      return { success: true, projectsCount: 0, issuesCount: 0 };
    }

    console.log('[JiraIntegration] ✓ Got', projects.length, 'projects');

    // 2. Transform and store projects using existing db function
    const dbProjects = projects.map((proj) => ({
      jira_project_id: proj.id,
      cloud_id: cloudId,
      key: proj.key,
      title: proj.name,
      description: proj.description || '',
      avatar: proj.avatarUrls?.['48x48'] || '',
      category: proj.category?.name || proj.projectTypeKey || '',
      fetched_by: fetchedByUserEmail || '',
    }));

    console.log('[JiraIntegration] Step 2: Storing projects to DB...');
    try {
      await db.upsertProjects(orgId, cloudId, dbProjects);
      console.log('[JiraIntegration] ✓ Projects stored successfully');
    } catch (projErr) {
      console.error('[JiraIntegration] ✗ Failed to store projects:', projErr instanceof Error ? projErr.message : String(projErr));
      throw projErr;
    }

    // 3. Fetch and store issues for each project (parallelized)
    console.log('[JiraIntegration] Step 3: Fetching and storing issues for', projects.length, 'projects...');
    const syncPromises = projects.map((proj) =>
      syncProjectData(orgId, cloudId, proj.key, proj.name, accessToken, fetchedByUserEmail)
        .catch((err) => {
          console.warn('[JiraIntegration] ✗ Failed to sync project:', proj.key, err instanceof Error ? err.message : String(err));
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error', issuesCount: 0 };
        })
    );

    const syncResults = await Promise.all(syncPromises);

    const successCount = syncResults.filter((r) => r.success).length;
    const failedCount = syncResults.filter((r) => !r.success).length;
    const totalIssues = syncResults.reduce((sum, r) => sum + (r.issuesCount || 0), 0);

    console.log('[JiraIntegration] === SYNC COMPLETE ===');
    console.log('[JiraIntegration] Projects: ', projects.length);
    console.log('[JiraIntegration] Successful:', successCount);
    console.log('[JiraIntegration] Failed:', failedCount);
    console.log('[JiraIntegration] Total Issues:', totalIssues);

    return {
      success: failedCount === 0,
      projectsCount: projects.length,
      issuesCount: totalIssues,
      successfulProjects: successCount,
      failedProjects: failedCount,
    };
  } catch (error) {
    console.error('[JiraIntegration] === SYNC FAILED ===');
    console.error('[JiraIntegration] Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('[JiraIntegration] Stack:', error.stack);
    }
    throw error;
  }
}
