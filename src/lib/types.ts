// ========================================
// Raw row interfaces — one per CSV source
// ========================================

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

// ========================================
// Normalized event — output of all normalizers
// ========================================

export type AppName = 'Asana' | 'Jira' | 'Zapier' | 'HubSpot' | 'Microsoft365';

export interface NormalizedEvent {
  timestamp: string;
  app: string;
  actionType: 'automation' | 'manual';
  source: string;
  units: number;
  avgManualMinutes: number;
  projectId: string;
}

// ========================================
// Trend / breakdown helper types used by metrics
// ========================================

export interface AutomationTrendPoint {
  weekStart: string;
  automations: number;
}

export interface ManualVsAutomatedByApp {
  app: AppName;
  manual: number;
  automated: number;
}

// ========================================
// Aggregated metrics response
// ========================================

export interface MetricsResponse {
  automationCoverage: number;
  totalAutomations: number;
  estimatedTimeSavedHours: number;
  estimatedCostSavedUSD: number;
  hourlyRateUsedUSD: number;
  automationCoveragePrevious: number;
  automationCoverageDelta: number;
  automationTrend: AutomationTrendPoint[];
  manualVsAutomated: ManualVsAutomatedByApp[];
  perAppHours?: Record<string, number>;
  perAppReturns?: Record<string, number>;
  totalReturns?: number;
  savingsInvestmentTrend?: { label: string; investmentUSD: number; savingsUSD: number }[];
}

// ========================================
