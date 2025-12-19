import type { RawJiraRow, NormalizedEvent } from '../types';

// ========================================
// Jira Normalizer
// ========================================

/**
 * Lookup table for avgManualMinutes per Jira event_type.
 * Estimates assume the time required for a human to replicate
 * the same action via the Jira UI.
 */
const MANUAL_MINUTES: Record<string, number> = {
  issue_created: 5,
  transition: 2,
  comment: 3,
};

const DEFAULT_MANUAL_MINUTES = 2;

/**
 * Detect automation based on actor field.
 * Rules:
 *  - If actor equals 'automation' (case-insensitive) or starts with 'auto', treat as automated.
 */
function isAutomation(row: RawJiraRow): boolean {
  const actor = (row.actor ?? '').toLowerCase();
  return actor === 'automation' || actor.startsWith('auto');
}

/**
 * Normalize raw Jira CSV rows into unified NormalizedEvent[].
 */
export function normalizeJira(rows: RawJiraRow[]): NormalizedEvent[] {
  return rows.map((row) => {
    const actionType = isAutomation(row) ? 'automation' : 'manual';
    const eventType = (row.event_type ?? '').toLowerCase();
    const avgManualMinutes = MANUAL_MINUTES[eventType] ?? DEFAULT_MANUAL_MINUTES;

    return {
      timestamp: row.created_at,
      app: 'Jira',
      actionType,
      source: row.actor ?? 'unknown',
      units: 1,
      avgManualMinutes,
      projectId: row.project_id ?? '',
    };
  });
}
