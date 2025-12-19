import type { RawMicrosoft365Row, NormalizedEvent } from '../types';

// ========================================
// Microsoft 365 Normalizer
// ========================================

/**
 * avgManualMinutes by workload + activity_type.
 * Key format: "workload:activity_type".
 */
const MANUAL_MINUTES: Record<string, number> = {
  'teams:meeting': 0, // attending a meeting is not "saved" work
  'teams:chat_message': 0,
  'outlook:email_sent': 3,
  'outlook:email_received': 0,
  'outlook:calendar_invite_sent': 2,
  'onedrive:file_created': 2,
  'onedrive:file_deleted': 1,
};

const DEFAULT_MANUAL_MINUTES = 1;

/**
 * Detect automation.
 * Rules:
 *  - user_type === 'service' means the action was performed by a service principal / bot.
 */
function isAutomation(row: RawMicrosoft365Row): boolean {
  return (row.user_type ?? '').toLowerCase() === 'service';
}

/**
 * Normalize raw Microsoft365 CSV rows into unified NormalizedEvent[].
 */
export function normalizeMicrosoft365(rows: RawMicrosoft365Row[]): NormalizedEvent[] {
  return rows.map((row) => {
    const actionType = isAutomation(row) ? 'automation' : 'manual';
    const key = `${(row.workload ?? '').toLowerCase()}:${(row.activity_type ?? '').toLowerCase()}`;
    const avgManualMinutes = MANUAL_MINUTES[key] ?? DEFAULT_MANUAL_MINUTES;

    return {
      timestamp: row.activity_time,
      app: 'Microsoft365',
      actionType,
      source: row.user_type ?? 'unknown',
      units: 1,
      avgManualMinutes,
      projectId: row.project_id ?? '',
    };
  });
}
