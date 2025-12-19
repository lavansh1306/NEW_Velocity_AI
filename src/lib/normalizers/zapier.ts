import type { RawZapierRow, NormalizedEvent } from '../types';

// ========================================
// Zapier Normalizer
// ========================================

/**
 * avgManualMinutes lookup.
 * Zapier runs are inherently automation, but we model how long
 * it would take a human to replicate the trigger->action flow.
 */
const MANUAL_MINUTES_BY_ACTION_APP: Record<string, number> = {
  salesforce: 5,
  slack: 1,
  gmail: 2,
  googlesheet: 3,
  airtable: 3,
  asana: 3,
  stripe: 4,
  hubspot: 4,
  pagerduty: 5,
  trello: 2,
  s3: 4,
  segment: 3,
  surveymonkey: 2,
  googlecontacts: 2,
  googlecalendar: 2,
  githubissues: 3,
  queue: 2,
  webhooks: 2,
  parser: 1,
};

const DEFAULT_MANUAL_MINUTES = 3;

/**
 * All Zapier events are automations (they run zaps),
 * but we still check status to decide whether to count units.
 * A failed run still consumed task_usage but doesn't result in a completed action.
 */
function isSuccess(row: RawZapierRow): boolean {
  return (row.status ?? '').toLowerCase() === 'success';
}

/**
 * Normalize raw Zapier CSV rows into unified NormalizedEvent[].
 * Every zap run is considered automation.
 */
export function normalizeZapier(rows: RawZapierRow[]): NormalizedEvent[] {
  return rows.map((row) => {
    const actionApp = (row.action_app ?? '').toLowerCase().replace(/\s+/g, '');
    const avgManualMinutes =
      MANUAL_MINUTES_BY_ACTION_APP[actionApp] ?? DEFAULT_MANUAL_MINUTES;
    // Units = 1 if success, 0 if failed (partial run doesn't complete action)
    const units = isSuccess(row) ? 1 : 0;

    return {
      timestamp: row.created_at,
      app: 'Zapier',
      actionType: 'automation', // all Zapier events are automation
      source: row.zap_name ?? 'unknown',
      units,
      avgManualMinutes,
      projectId: row.project_id ?? '',
    };
  });
}
