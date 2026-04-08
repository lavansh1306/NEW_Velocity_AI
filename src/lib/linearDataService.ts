/**
 * src/lib/linearDataService.ts
 * Centralized Linear data service.
 * Handles loading state, caching, sync after OAuth, and push to Linear.
 * Modeled on src/lib/jiraDataService.ts
 */

import { fetchLinearIssuesHybrid, getLinearStatus, pushTaskToLinear, logMLTrainingEvent } from './linearClient';
import type { LinearIssueFromDB } from './linearClient';
import { getCurrentOrgId } from './orgContext';

// ── State ──────────────────────────────────────────────────────────────────────

export interface LinearDataState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  connected: boolean;
  workspaceName: string | null;
  issues: LinearIssueFromDB[];
  source: 'database' | 'api' | 'none';
  lastUpdated: number;
}

let cachedState: LinearDataState = {
  isLoading: false,
  isInitialized: false,
  error: null,
  connected: false,
  workspaceName: null,
  issues: [],
  source: 'none',
  lastUpdated: 0,
};

type StateChangeListener = (state: LinearDataState) => void;
const stateListeners = new Set<StateChangeListener>();

// ── Pub/sub ────────────────────────────────────────────────────────────────────

export function subscribeToLinearDataState(listener: StateChangeListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

function notifyStateChange(newState: LinearDataState) {
  cachedState = newState;
  stateListeners.forEach(listener => listener(newState));
}

export function getLinearDataState(): LinearDataState {
  return { ...cachedState };
}

// ── Main sync ──────────────────────────────────────────────────────────────────

export async function syncLinearData(): Promise<LinearDataState> {
  if (cachedState.isLoading) return { ...cachedState };

  notifyStateChange({ ...cachedState, isLoading: true, error: null });

  try {
    const orgId = getCurrentOrgId();
    if (!orgId) {
      const noOrgState: LinearDataState = {
        isLoading: false,
        isInitialized: true,
        error: null,
        connected: false,
        workspaceName: null,
        issues: [],
        source: 'none',
        lastUpdated: Date.now(),
      };
      notifyStateChange(noOrgState);
      return noOrgState;
    }

    console.log('[LinearDataService] Syncing for org:', orgId);

    // Check connection status and fetch issues in parallel
    const [status, issuesResult] = await Promise.all([
      getLinearStatus(),
      fetchLinearIssuesHybrid(),
    ]);

    const successState: LinearDataState = {
      isLoading: false,
      isInitialized: true,
      error: null,
      connected: status.connected,
      workspaceName: status.workspaceName || null,
      issues: issuesResult.issues,
      source: issuesResult.source,
      lastUpdated: Date.now(),
    };

    console.log('[LinearDataService] Sync complete:', {
      connected: status.connected,
      issues: issuesResult.issues.length,
      source: issuesResult.source,
    });

    notifyStateChange(successState);
    return successState;
  } catch (err) {
    console.error('[LinearDataService] Sync error:', err);
    const errorState: LinearDataState = {
      ...cachedState,
      isLoading: false,
      isInitialized: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
    notifyStateChange(errorState);
    return errorState;
  }
}

// ── Sync after OAuth redirect ──────────────────────────────────────────────────

export async function syncAfterLinearOAuth(): Promise<LinearDataState> {
  console.log('[LinearDataService] Syncing after Linear OAuth...');

  // Trigger a server-side sync first
  try {
    const orgId = getCurrentOrgId();
    if (orgId) {
      await fetch(`/api/linear/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orgId }),
      });
    }
  } catch (err) {
    console.warn('[LinearDataService] Server sync trigger failed (non-blocking):', err);
  }

  // Short delay to let server finish writing to DB
  await new Promise(resolve => setTimeout(resolve, 1000));

  return syncLinearData();
}

// ── Push task + log ML event in one call ───────────────────────────────────────

export async function approveAndPushToLinear(params: {
  taskId: string;
  taskName: string;
  taskDescription?: string;
  suggestedUserId: string;
  teamId?: string;
  assigneeLinearId?: string;
  skillMatchScore?: number;
  workloadAtTime?: number;
  priority?: number;
}): Promise<{ success: boolean; issue?: any; message?: string }> {
  const orgId = getCurrentOrgId();
  if (!orgId) return { success: false, message: 'No org found' };

  // Fire both in parallel — ML event is fire-and-forget
  const [pushResult] = await Promise.all([
    pushTaskToLinear({
      orgId,
      taskName: params.taskName,
      taskDescription: params.taskDescription,
      teamId: params.teamId,
      assigneeId: params.assigneeLinearId,
      priority: params.priority,
    }),
    logMLTrainingEvent({
      orgId,
      taskId: params.taskId,
      suggestedUserId: params.suggestedUserId,
      skillMatchScore: params.skillMatchScore,
      workloadAtTime: params.workloadAtTime,
      approved: true,
    }),
  ]);

  return pushResult;
}

// ── Log rejection (ML signal only, no push) ───────────────────────────────────

export async function rejectAndLogML(params: {
  taskId: string;
  suggestedUserId: string;
  skillMatchScore?: number;
  workloadAtTime?: number;
}): Promise<void> {
  const orgId = getCurrentOrgId();
  if (!orgId) return;

  await logMLTrainingEvent({
    orgId,
    taskId: params.taskId,
    suggestedUserId: params.suggestedUserId,
    skillMatchScore: params.skillMatchScore,
    workloadAtTime: params.workloadAtTime,
    approved: false,
  });
}

// ── Utility helpers ────────────────────────────────────────────────────────────

export function hasLinearData(): boolean {
  return cachedState.connected && cachedState.issues.length > 0;
}

export function getLinearIssuesByTeam(): Record<string, LinearIssueFromDB[]> {
  const grouped: Record<string, LinearIssueFromDB[]> = {};
  cachedState.issues.forEach(issue => {
    const team = issue.team_name || 'Unknown';
    if (!grouped[team]) grouped[team] = [];
    grouped[team].push(issue);
  });
  return grouped;
}

export function getLinearIssuesByAssignee(): Record<string, LinearIssueFromDB[]> {
  const grouped: Record<string, LinearIssueFromDB[]> = {};
  cachedState.issues.forEach(issue => {
    const assignee = issue.assignee_name || 'Unassigned';
    if (!grouped[assignee]) grouped[assignee] = [];
    grouped[assignee].push(issue);
  });
  return grouped;
}

export function clearLinearDataCache(): void {
  notifyStateChange({
    isLoading: false,
    isInitialized: false,
    error: null,
    connected: false,
    workspaceName: null,
    issues: [],
    source: 'none',
    lastUpdated: 0,
  });
}
