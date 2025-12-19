import type { RawHubSpotRow, NormalizedEvent } from '../types';

// ========================================
// HubSpot Normalizer
// ========================================

/**
 * avgManualMinutes by object_type + event_action.
 * Key format: "object_type:event_action".
 */
const MANUAL_MINUTES: Record<string, number> = {
  'email:sent': 3,
  'email:opened': 0, // passive event, no manual effort
  'email:clicked': 0,
  'email:bounced': 1,
  'email:complained': 1,
  'workflow:executed': 5, // if done manually, would require multiple steps
  'contact:created': 2,
  'contact:updated': 1,
  'contact:deleted': 1,
};

const DEFAULT_MANUAL_MINUTES = 2;

/**
 * Detect whether a HubSpot event is automation-driven.
 * Rules:
 *  - source === 'workflow' means automated.
 *  - object_type === 'workflow' is also automated.
 */
function isAutomation(row: RawHubSpotRow): boolean {
  const src = (row.source ?? '').toLowerCase();
  const objType = (row.object_type ?? '').toLowerCase();
  return src === 'workflow' || objType === 'workflow';
}

/**
 * Normalize raw HubSpot CSV rows into unified NormalizedEvent[].
 */
export function normalizeHubSpot(rows: RawHubSpotRow[]): NormalizedEvent[] {
  return rows.map((row) => {
    const actionType = isAutomation(row) ? 'automation' : 'manual';
    const key = `${(row.object_type ?? '').toLowerCase()}:${(row.event_action ?? '').toLowerCase()}`;
    const avgManualMinutes = MANUAL_MINUTES[key] ?? DEFAULT_MANUAL_MINUTES;

    return {
      timestamp: row.occurred_at,
      app: 'HubSpot',
      actionType,
      source: row.source ?? 'unknown',
      units: 1,
      avgManualMinutes,
      projectId: row.project_id ?? '',
    };
  });
}
