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

/**
 * Raw row from zapier_events.csv
 */
export interface RawZapierRow {
  id: string;
  timestamp: string;
  action_name: string;
  zap_name: string;
  status: string;
  user_email: string;
}

// ========================================
// ML Candidate interface
export interface MLCandidate {
  id: string;
  current_load: number;
  skills: string[];
  role_level: 'junior' | 'mid' | 'senior' | 'lead';
  name?: string;
  availability_hours?: number;
  avg_completion_time?: number;
  // --- NEW CAPACITY FIELDS ---
  base_productive_hours?: number;
  pto_hours_this_week?: number;
  holiday_hours_this_week?: number;
}

// Capacity Request/Response interfaces
export interface CapacityRequest {
  candidates: MLCandidate[];
}

export interface CapacityReport {
  employee_id: string;
  name: string;
  base_productive_hours: number;
  pto_hours_this_week: number;
  holiday_hours_this_week: number;
  net_available_hours: number;
  status: string; // "Available", "At Capacity", or "Overloaded / Out of Office"
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
// ========================================
// Project Health Metrics
// ========================================

export interface ProjectHealthMetrics {
  compositeScore: number;
  schedule: number;
  resource: number;
  risk: number;
  quality: number;
}

// ========================================
// Aggregated metrics response
// ========================================

export interface ProjectHealthReport {
  health: ProjectHealthMetrics;
  lastUpdated: string;
  projectId: string;
}
