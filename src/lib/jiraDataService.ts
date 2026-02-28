/**
 * Centralized Jira data fetching service
 * Handles: DB-first strategy, API fallback, loading states, and caching
 */

import { supabase } from './supabase';
import { fetchProjectsHybrid, fetchAllIssuesHybrid } from './jiraDbClient';
import { apiUrl } from './api';

export interface JiraDataState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  projects: any[];
  issues: any[];
  source: 'database' | 'api' | 'none';
  lastUpdated: number;
}

let cachedState: JiraDataState = {
  isLoading: false,
  isInitialized: false,
  error: null,
  projects: [],
  issues: [],
  source: 'none',
  lastUpdated: 0,
};

type StateChangeListener = (state: JiraDataState) => void;
const stateListeners = new Set<StateChangeListener>();

/**
 * Subscribe to data state changes
 */
export function subscribeToJiraDataState(listener: StateChangeListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/**
 * Notify all subscribers of state changes
 */
function notifyStateChange(newState: JiraDataState) {
  cachedState = newState;
  stateListeners.forEach(listener => listener(newState));
}

/**
 * Get current cached state
 */
export function getJiraDataState(): JiraDataState {
  return { ...cachedState };
}

/**
 * Main sync function: DB-first with API fallback
 */
export async function syncJiraDataWithDB(orgId: string): Promise<JiraDataState> {
  // Prevent concurrent syncs
  if (cachedState.isLoading) {
    return { ...cachedState };
  }

  // Start loading
  const loadingState: JiraDataState = {
    isLoading: true,
    isInitialized: cachedState.isInitialized,
    error: null,
    projects: cachedState.projects,
    issues: cachedState.issues,
    source: cachedState.source,
    lastUpdated: cachedState.lastUpdated,
  };
  notifyStateChange(loadingState);

  try {
    console.log('[JiraDataService] Starting DB-first sync for org:', orgId);

    // Step 1: Try to fetch from database
    console.log('[JiraDataService] Fetching projects from database...');
    const projectsResult = await fetchProjectsHybrid();
    
    console.log('[JiraDataService] Fetching issues from database...');
    const issuesResult = await fetchAllIssuesHybrid();

    // Step 2: Check if we got data
    const hasProjectData = projectsResult.projects && projectsResult.projects.length > 0;
    const hasIssueData = issuesResult.issues && issuesResult.issues.length > 0;

    if (hasProjectData && hasIssueData) {
      console.log('[JiraDataService] ✅ Data loaded from database', {
        projects: projectsResult.projects.length,
        issues: issuesResult.issues.length,
      });

      const successState: JiraDataState = {
        isLoading: false,
        isInitialized: true,
        error: null,
        projects: projectsResult.projects,
        issues: issuesResult.issues,
        source: 'database',
        lastUpdated: Date.now(),
      };
      notifyStateChange(successState);
      return successState;
    }

    // Step 3: If DB is empty, log and return empty state
    // (API calls happen during login redirect, not here)
    console.log('[JiraDataService] No data in database yet. User needs to complete Jira OAuth login.');
    
    const emptyState: JiraDataState = {
      isLoading: false,
      isInitialized: true,
      error: null,
      projects: [],
      issues: [],
      source: 'none',
      lastUpdated: Date.now(),
    };
    notifyStateChange(emptyState);
    return emptyState;
  } catch (err) {
    console.error('[JiraDataService] Sync error:', err);
    
    const errorState: JiraDataState = {
      isLoading: false,
      isInitialized: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      projects: cachedState.projects,
      issues: cachedState.issues,
      source: cachedState.source,
      lastUpdated: cachedState.lastUpdated,
    };
    notifyStateChange(errorState);
    return errorState;
  }
}

/**
 * Trigger a full sync after Jira OAuth completes
 * Used when user returns from Jira login redirect
 */
export async function syncAfterJiraOAuth(orgId: string): Promise<JiraDataState> {
  console.log('[JiraDataService] Syncing after Jira OAuth for org:', orgId);
  
  // Short delay to ensure server-side sync is complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now fetch the newly synced data
  return syncJiraDataWithDB(orgId);
}

/**
 * Check if Jira is connected and has data
 */
export function hasJiraData(): boolean {
  return cachedState.projects.length > 0 && cachedState.issues.length > 0;
}

/**
 * Clear cache and reset state
 */
export function clearJiraDataCache() {
  const clearedState: JiraDataState = {
    isLoading: false,
    isInitialized: false,
    error: null,
    projects: [],
    issues: [],
    source: 'none',
    lastUpdated: 0,
  };
  notifyStateChange(clearedState);
}

/**
 * Get issues for a specific project
 */
export function getProjectIssues(projectKey: string): any[] {
  return cachedState.issues.filter(
    (issue: any) => issue.project_key === projectKey || issue.key?.startsWith(projectKey + '-')
  );
}

/**
 * Get tasks grouped by assignee
 */
export function getTasksByAssignee(): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  cachedState.issues.forEach((issue: any) => {
    const assignee = issue.assignee || 'Unassigned';
    if (!grouped[assignee]) {
      grouped[assignee] = [];
    }
    grouped[assignee].push(issue);
  });
  return grouped;
}

/**
 * Get all unique team members from issues
 */
export function getTeamMembers(): string[] {
  const members = new Set<string>();
  cachedState.issues.forEach((issue: any) => {
    if (issue.assignee && issue.assignee !== 'Unassigned') {
      members.add(issue.assignee);
    }
  });
  return Array.from(members).sort();
}
