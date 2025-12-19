import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

import type {
  RawAsanaRow,
  RawJiraRow,
  RawZapierRow,
  RawHubSpotRow,
  RawMicrosoft365Row,
  NormalizedEvent,
  MetricsResponse,
} from '../../../lib/types';

import {
  normalizeAsana,
  normalizeJira,
  normalizeZapier,
  normalizeHubSpot,
  normalizeMicrosoft365,
} from '../../../lib/normalizers';

import {
  automationCoverage,
  totalAutomations,
  estimatedTimeSavedHours,
  automationGrowthTrend,
  manualVsAutomatedByApp,
} from '../../../lib/metrics';

// ========================================
// CSV Loader helpers
// ========================================

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data');

function loadCSV<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true }) as T[];
}

// ========================================
// API Handler
// ========================================

/**
 * GET /api/projects/[projectId]/metrics
 *
 * Loads all raw CSV files, normalizes them, computes metrics, and returns JSON.
 *
 * Note: projectId is accepted for future multi-project support but currently ignored
 * (all CSV files are loaded from the shared public/data folder).
 */
export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
): Promise<Response> {
  // Load raw rows from each app CSV
  const asanaRows = loadCSV<RawAsanaRow>('asana_events.csv');
  const jiraRows = loadCSV<RawJiraRow>('jira_events.csv');
  const zapierRows = loadCSV<RawZapierRow>('zapier_events.csv');
  const hubspotRows = loadCSV<RawHubSpotRow>('hubspot_events.csv');
  const m365Rows = loadCSV<RawMicrosoft365Row>('microsoft365_events.csv');

  // Normalize each source
  const events: NormalizedEvent[] = [
    ...normalizeAsana(asanaRows),
    ...normalizeJira(jiraRows),
    ...normalizeZapier(zapierRows),
    ...normalizeHubSpot(hubspotRows),
    ...normalizeMicrosoft365(m365Rows),
  ];

  // Compute metrics
  const response: MetricsResponse = {
    automationCoverage: automationCoverage(events),
    totalAutomations: totalAutomations(events),
    estimatedTimeSavedHours: estimatedTimeSavedHours(events),
    automationTrend: automationGrowthTrend(events),
    manualVsAutomated: manualVsAutomatedByApp(events),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
