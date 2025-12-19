import type { RawAsanaRow, NormalizedEvent } from '../types';

// ========================================
// Asana Normalizer
// ========================================

/**
 * Lookup table for avgManualMinutes per Asana action type.
 * Values represent a conservative estimate for how long a human
 * would take to perform the same action manually.
 */
const MANUAL_MINUTES: Record<string, number> = {
  created: 3,
  updated: 2,
  deleted: 1,
  completed: 1,
};

const DEFAULT_MANUAL_MINUTES = 2;

/**
 * Detect whether an Asana event is automation-driven.
 * Rules:
 *  - If created_by contains 'bot' or 'automation', treat as automated.
 */
function isAutomation(row: RawAsanaRow): boolean {
  const actor = (row.created_by ?? '').toLowerCase().trim();
  // Stricter bot detection: only treat known service/bot names as automation
  const knownBots = new Set(['automation_bot', 'service-bot', 'system', 'automation']);
  if (knownBots.has(actor)) return true;

  // If actor looks like a numeric user id, treat as human
  if (/^\d+$/.test(actor)) return false;

  // Inspect details for explicit workflow/rule triggers or created_from markers
  const details = (row.details ?? '').toLowerCase();
  if (
    details.includes('workflow') ||
    details.includes('rule:') ||
    details.includes('trigger_rule') ||
    details.includes('created_from') ||
    details.includes('auto-')
  ) {
    return true;
  }

  return false;
}

/**
 * Normalize raw Asana CSV rows into unified NormalizedEvent[].
 */
export function normalizeAsana(rows: RawAsanaRow[]): NormalizedEvent[] {
  return rows.map((row) => {
    const actionType = isAutomation(row) ? 'automation' : 'manual';
    const action = (row.action ?? '').toLowerCase();
    const avgManualMinutes = MANUAL_MINUTES[action] ?? DEFAULT_MANUAL_MINUTES;

    return {
      timestamp: row.created_at,
      app: 'Asana',
      actionType,
      source: row.created_by ?? 'unknown',
      units: 1,
      avgManualMinutes,
      projectId: row.project_id ?? '',
    };
  });
}
