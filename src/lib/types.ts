// ========================================
// Raw row interfaces — one per CSV source
// ========================================

/**
 * Raw row from asana_events.csv
 * Fields correspond to the schema fetched via Asana's API/export.
 */
export interface RawAsanaRow {
  gid: string;
  created_at: string;
  resource_type: string;
  action: string;
  created_by: string;
  project_id: string;
  details: string; // JSON string
}

/**
 * Raw row from jira_events.csv
 */
export interface RawJiraRow {
  issue_id: string;
  issue_key: string;
  created_at: string;
  event_type: string;
  actor: string;
  from_status: string;
  to_status: string;
  project_id: string;
  fields: string; // JSON string
}

/**
 * Raw row from zapier_events.csv
 */
export interface RawZapierRow {
  id: string;
  created_at: string;
  zap_name: string;
  trigger_app: string;
  action_app: string;
  status: string;
  task_usage: string;
  project_id: string;
  metadata: string; // JSON string
}

/**
 * Raw row from hubspot_events.csv
 */
export interface RawHubSpotRow {
  event_id: string;
  occurred_at: string;
  object_type: string;
  event_action: string;
  source: string;
  object_id: string;
  project_id: string;
  properties: string; // JSON string
}

/**
 * Raw row from microsoft365_events.csv
 */
export interface RawMicrosoft365Row {
  activity_id: string;
  activity_time: string;
  workload: string;
  activity_type: string;
  user_type: string;
  resource_id: string;
  project_id: string;
  additional_data: string; // JSON string
}

// ========================================
// Normalized event schema
// ========================================

export type AppName = 'Asana' | 'Jira' | 'Zapier' | 'HubSpot' | 'Microsoft365';
export type ActionType = 'automation' | 'manual';

/**
 * Unified event representation after normalization.
 * All downstream metrics are computed from NormalizedEvent[].
 */
export interface NormalizedEvent {
  /** ISO 8601 timestamp of the event */
  timestamp: string;
  /** Source application */
  app: AppName;
  /** Whether the event was triggered by automation or manually */
  actionType: ActionType;
  /** Freeform source descriptor (e.g., workflow name, bot id) */
  source: string;
  /** Number of units/items this event represents (e.g., 1 task, 1 email) */
  units: number;
  /** Estimated minutes to perform this action manually */
  avgManualMinutes: number;
  /** Project ID this event belongs to */
  projectId: string;
}

// ========================================
// Metrics API response shape
// ========================================

export interface AutomationTrendPoint {
  weekStart: string; // ISO date (start of week)
  automations: number;
}

export interface ManualVsAutomatedByApp {
  app: AppName;
  manual: number;
  automated: number;
}

export interface MetricsResponse {
  automationCoverage: number;
  totalAutomations: number;
  estimatedTimeSavedHours: number;
  /** Estimated cost saved in USD based on assumed hourly rate */
  estimatedCostSavedUSD?: number;
  /** Hourly rate (USD) used to compute cost */
  hourlyRateUsedUSD?: number;
  /** Previous-period automation coverage (ratio 0-1) used as a baseline */
  automationCoveragePrevious?: number;
  /** Difference between current and previous coverage (ratio 0-1). current - previous */
  automationCoverageDelta?: number;
  automationTrend: AutomationTrendPoint[];
  manualVsAutomated: ManualVsAutomatedByApp[];
  /** Optional time-series of monthly investment vs savings for charts */
  savingsInvestmentTrend?: { label: string; investmentUSD: number; savingsUSD: number }[];
}
